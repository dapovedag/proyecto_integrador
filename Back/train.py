"""Entrena el modelo de riesgo de credito y el modelo NLP; guarda artefactos y model card."""
import json
import sys
from datetime import date
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (brier_score_loss, f1_score, precision_recall_curve, precision_score,
                             recall_score, roc_auc_score, roc_curve)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import (StratifiedKFold, cross_val_predict, cross_val_score,
                                     train_test_split)
from sklearn.pipeline import Pipeline

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))
from credit_risk import config  # noqa: E402
from credit_risk.data import cargar_datos, limpiar, validar_dataset  # noqa: E402
from credit_risk.features import build_feature_step, build_preprocessor  # noqa: E402


def ks_stat(y, p):
    fpr, tpr, _ = roc_curve(y, p)
    return float(np.max(tpr - fpr))


def mejor_umbral_f1(y, p):
    prec, rec, thr = precision_recall_curve(y, p)
    f1 = 2 * prec * rec / np.clip(prec + rec, 1e-12, None)
    i = int(np.nanargmax(f1[:-1]))
    return float(thr[i])


def metricas(y, p, umbral):
    pred = (p >= umbral).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y, p)), 4),
        "f1": round(float(f1_score(y, pred)), 4),
        "recall": round(float(recall_score(y, pred)), 4),
        "precision": round(float(precision_score(y, pred)), 4),
        "ks": round(ks_stat(y, p), 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
    }


COSTO_FN, COSTO_FP = 3.0, 1.0  # un impago no detectado cuesta 3 veces un cliente bueno rechazado


def umbral_por_costo(y, p):
    """Umbral que minimiza COSTO_FN*FN + COSTO_FP*FP (se calcula sobre probabilidades out-of-fold de train)."""
    grid = np.round(np.arange(0.05, 0.951, 0.01), 2)
    costos = [COSTO_FN * np.sum((p < t) & (y == 1)) + COSTO_FP * np.sum((p >= t) & (y == 0)) for t in grid]
    return float(grid[int(np.argmin(costos))])


def equidad(grupos, y, p, umbral):
    """Tasa de aprobacion (pred=0), TPR y FPR por grupo y disparate impact de la aprobacion."""
    out = {}
    for g in sorted(set(grupos)):
        m = grupos == g
        pred = (p[m] >= umbral).astype(int)
        yt = y[m]
        out[str(g)] = {
            "n": int(m.sum()),
            "tasa_aprobacion": round(float(np.mean(pred == 0)), 4),
            "tpr": round(float(np.mean(pred[yt == 1] == 1)), 4) if (yt == 1).any() else None,
            "fpr": round(float(np.mean(pred[yt == 0] == 1)), 4) if (yt == 0).any() else None,
        }
    aprob = [v["tasa_aprobacion"] for v in out.values()]
    di = round(min(aprob) / max(aprob), 4) if max(aprob) > 0 else None
    return {"grupos": out, "disparate_impact": di, "regla_80": bool(di is not None and di >= 0.8)}


def main():
    crudo = cargar_datos()
    print("Validacion del contrato de datos:", validar_dataset(crudo))
    df = limpiar(crudo)
    print(f"Filas tras limpieza: {len(df)}")
    X = df[config.INPUT_COLS + [config.SENSITIVE_COL, config.TEXT_COL]]
    y = df[config.TARGET].values
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=config.RANDOM_STATE)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)

    def hacer_pipe(modelo):
        return Pipeline([("features", build_feature_step()),
                         ("preprocessor", build_preprocessor()),
                         ("model", modelo)])

    candidatos = {
        "LogisticRegression": LogisticRegression(max_iter=2000, random_state=config.RANDOM_STATE),
        "HistGradientBoostingClassifier": HistGradientBoostingClassifier(
            random_state=config.RANDOM_STATE, max_iter=200, learning_rate=0.08),
    }
    # 1) Seleccion del modelo SOLO con CV en train (test no participa en ninguna decision)
    resultados = {}
    for nombre, modelo in candidatos.items():
        auc = cross_val_score(hacer_pipe(modelo), X_tr[config.INPUT_COLS], y_tr, cv=cv,
                              scoring="roc_auc").mean()
        resultados[nombre] = round(float(auc), 4)
        print(f"{nombre}: ROC-AUC CV(5) train = {auc:.4f}")
    mejor = max(resultados, key=resultados.get)

    # 2) Modelo final calibrado (sigmoid, CV interna) y umbral por costo con probabilidades out-of-fold de train
    pipe = CalibratedClassifierCV(hacer_pipe(candidatos[mejor]), method="sigmoid", cv=3)
    p_oof = cross_val_predict(pipe, X_tr[config.INPUT_COLS], y_tr, cv=cv, method="predict_proba")[:, 1]
    umbral = round(umbral_por_costo(y_tr, p_oof), 4)
    pipe.fit(X_tr[config.INPUT_COLS], y_tr)

    # 3) Evaluacion final UNICA en test
    p_te = pipe.predict_proba(X_te[config.INPUT_COLS])[:, 1]
    met = metricas(y_te, p_te, umbral)
    print(f"Mejor: {mejor} calibrado | umbral costo = {umbral} | test: {met}")

    # Equidad (solo medicion en test, sin ajustar nada con test)
    edad = X_te["edad"]
    edad_grp = np.select([edad.isna(), edad < 30, edad < 60], ["desconocida", "18-29", "30-59"], "60+")
    eq = {"sexo": equidad(X_te[config.SENSITIVE_COL].values, y_te, p_te, umbral),
          "edad": equidad(edad_grp, y_te, p_te, umbral)}

    # Importancia por permutacion (sobre una muestra de train) y medianas de train (para factores_principales)
    muestra = X_tr.sample(n=min(3000, len(X_tr)), random_state=config.RANDOM_STATE)
    y_muestra = y_tr[X_tr.index.get_indexer(muestra.index)]
    pi = permutation_importance(pipe, muestra[config.INPUT_COLS], y_muestra, scoring="roc_auc",
                                n_repeats=2, random_state=config.RANDOM_STATE, n_jobs=1)
    importancia = {c: round(float(v), 5) for c, v in zip(config.INPUT_COLS, pi.importances_mean)}
    medianas = {c: float(X_tr[c].median()) for c in config.NUM_COLS_RAW}
    # signo de la relacion univariada con el objetivo (para dar direccion al efecto)
    df_tr = X_tr.copy(); df_tr["y"] = y_tr
    direccion = {c: (1 if df_tr[[c, "y"]].corr().iloc[0, 1] >= 0 else -1) for c in config.NUM_COLS_RAW}

    # Modelo NLP: TF-IDF + LR sobre texto_solicitud
    t_tr = X_tr[config.TEXT_COL].fillna("").astype(str)
    t_te = X_te[config.TEXT_COL].fillna("").astype(str)
    nlp = Pipeline([("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=20000)),
                    ("clf", LogisticRegression(class_weight="balanced", max_iter=2000,
                                               random_state=config.RANDOM_STATE))])
    p_nlp_oof = cross_val_predict(nlp, t_tr, y_tr, cv=cv, method="predict_proba")[:, 1]
    umbral_nlp = mejor_umbral_f1(y_tr, p_nlp_oof)  # umbral elegido en train (out-of-fold), no en test
    nlp.fit(t_tr, y_tr)
    p_nlp = nlp.predict_proba(t_te)[:, 1]
    met_nlp = metricas(y_te, p_nlp, umbral_nlp)
    met_nlp["umbral"] = round(umbral_nlp, 4)
    print(f"NLP: {met_nlp}")

    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, config.MODEL_DIR / "modelo_final.joblib")
    joblib.dump(nlp, config.MODEL_DIR / "modelo_nlp.joblib")

    card = {
        "nombre": "riesgo_credito",
        "version": config.MODEL_VERSION,
        "fecha_entrenamiento": date.today().isoformat(),
        "algoritmo": f"{mejor} calibrado (sigmoid)",
        "fuente_de_verdad": "Back/train.py (los artefactos *_nb08 del notebook 08 son exploratorios y la API no los usa)",
        "protocolo": "Seleccion de modelo por ROC-AUC CV(5) en train; umbral por costo FN:FP = 3:1 sobre "
                     "probabilidades out-of-fold de train; test usado una unica vez para la evaluacion final.",
        "comparacion_roc_auc_cv_train": resultados,
        "costos": {"fn": COSTO_FN, "fp": COSTO_FP},
        "variables_entrada": config.INPUT_COLS,
        "variables_derivadas": config.NEW_COLS,
        "variable_excluida_auditoria": config.SENSITIVE_COL,
        "n_train": int(len(X_tr)), "n_test": int(len(X_te)),
        "tasa_default_train": round(float(np.mean(y_tr)), 4),
        "metricas_test": met,
        "umbral_decision": umbral,
        "bandas_riesgo": config.BANDAS_RIESGO,
        "metricas_nlp": met_nlp,
        "modelo_nlp": "tfidf_logreg",
        "equidad": eq,
        "importancia_permutacion": importancia,
        "medianas_train": medianas,
        "direccion_riesgo": direccion,
        "limitaciones": [
            "Datos con nulos, duplicados y atipicos intencionales; se limpian reglas basicas e imputacion por mediana/moda.",
            "Probabilidades calibradas con sigmoid (Platt); revisar la calibracion periodicamente.",
            "Si disparate_impact < 0.8 en algun grupo, no se aplico mitigacion automatica: requiere revision humana.",
            "Los factores principales son una aproximacion simple, no explicaciones causales.",
            "El sexo no entra al modelo, pero otras variables pueden actuar como proxy.",
            "El modelo NLP es TF-IDF + regresion logistica, sensible al vocabulario de entrenamiento.",
            "Uso academico/demostrativo; no debe usarse como unica base de decisiones de credito.",
        ],
    }
    with open(config.MODEL_DIR / "model_card.json", "w", encoding="utf-8") as f:
        json.dump(card, f, ensure_ascii=False, indent=2)
    print("Artefactos guardados en", config.MODEL_DIR)


if __name__ == "__main__":
    main()

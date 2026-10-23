"""Entrenamiento del modelo servido v2 (paso 8, F4) — única fuente de verdad (ADR-001).

Protocolo (test se usa UNA sola vez, al final):
1. Validar el contrato y preparar ``db/processed`` (limpieza → partición → imputación con train).
2. Elegir familia por ROC-AUC de CV(5) en train con búsqueda aleatoria corta; regla de parsimonia.
3. Calibrar (sigmoide, ``ensemble=False``) y aplicar la política de Chow (umbrales en forma cerrada).
4. Comparar variantes de equidad con predicciones out-of-fold: elegir el menor costo esperado
   con DI ≥ 0,8 en sexo y edad.
5. Ajustar el modelo final con todo train y evaluar una vez en test.
6. Guardar el artefacto, la model card, las predicciones OOF y de test, y el modelo de texto.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from datetime import date
from typing import Any

import joblib
import numpy as np
import pandas as pd
from scipy.stats import loguniform, randint, uniform
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RandomizedSearchCV

from credit_risk import config
from credit_risk.data import cargar_datos, preparar_procesados, separar_xy, validar_dataset
from credit_risk.explain import Explicador, importancia_permutacion
from credit_risk.fairness import Reweighing, auditar
from credit_risk.features import build_pipeline, columnas_modelo
from credit_risk.models import (
    Costos,
    calibrado,
    costo_esperado,
    curvas,
    cv_estratificada,
    metricas,
    predicciones_oof,
    sensibilidad,
    umbrales_chow,
)
from credit_risk.monitoring import estado_psi, psi, psi_por_variable
from credit_risk.nlp import ArtefactoTexto, build_modelo_texto
from credit_risk.prediccion import ArtefactoModelo
from credit_risk.reporting import guardar_json

VARIANTES: dict[str, dict[str, Any]] = {
    "base": {"excluir": (), "reweighing": False,
             "descripcion": "Todas las variables de entrada (sexo nunca entra)."},
    "sin_edad": {"excluir": tuple(config.VARIABLES_EDAD), "reweighing": False,
                 "descripcion": "Sin edad ni rango de edad como predictores."},
    "reweighing": {"excluir": (), "reweighing": True,
                   "descripcion": "Pesos de Kamiran-Calders por grupo de edad en el entrenamiento."},
}

LIMITACIONES = [
    "Dataset sintético realista (db/generacion/generar_dataset.py): los resultados ilustran la metodología, "
    "no el desempeño en una cartera real.",
    "El texto de la solicitud se generó a partir de plantillas condicionadas al riesgo: su señal está "
    "sobreestimada y por eso el modelo de texto no forma parte de la decisión principal.",
    "Los costos (LGD, margen, revisión) son supuestos documentados en ADR-002; la sensibilidad está en la card.",
    "La regla de 4/5 es una alerta de equidad, no una norma colombiana de crédito; ver ADR-003.",
    "Las contribuciones son asociaciones del modelo, no efectos causales.",
    "Monitorear PSI del puntaje y de las variables; recalibrar si PSI ≥ 0,25 (docs/05_despliegue.md).",
    "Uso académico: no debe ser la única base de una decisión de crédito.",
]


def _familias(rapido: bool) -> dict[str, tuple[Any, dict[str, Any]]]:
    rs = config.RANDOM_STATE
    return {
        "Regresión logística": (LogisticRegression(max_iter=3000, random_state=rs),
                                {"model__C": loguniform(1e-3, 10)}),
        "Gradient Boosting (HGB)": (
            HistGradientBoostingClassifier(random_state=rs),
            {"model__learning_rate": uniform(0.02, 0.15), "model__max_leaf_nodes": randint(8, 48),
             "model__l2_regularization": loguniform(1e-3, 1.0), "model__max_iter": randint(150, 400)}),
    }


def _pipeline_variante(modelo: Any, variante: str) -> Any:
    v = VARIANTES[variante]
    pipe = build_pipeline(modelo, excluir=v["excluir"])
    return Reweighing(pipe) if v["reweighing"] else pipe


def entrenar(rapido: bool = False, escribir: bool = True,
             log: Callable[[str], None] = print) -> dict[str, Any]:
    """Ejecuta el protocolo completo y devuelve la model card (y escribe artefactos si ``escribir``)."""
    t0 = time.perf_counter()
    crudo = cargar_datos()
    validacion = validar_dataset(crudo)
    if not validacion["ok"]:
        raise ValueError(f"El dataset no cumple el contrato: {validacion}")
    prep = preparar_procesados(crudo, escribir=escribir)
    train, test = prep["train"], prep["test"]
    X_tr, y_tr = separar_xy(train)
    X_te, y_te = separar_xy(test)
    cv = cv_estratificada(3 if rapido else config.CV_FOLDS)
    log(f"Datos: train={len(X_tr)} test={len(X_te)} prevalencia={y_tr.mean():.4f}")

    # 2) Selección de familia por CV en train (búsqueda aleatoria corta)
    seleccion: dict[str, Any] = {}
    mejores: dict[str, Any] = {}
    for nombre, (modelo, espacio) in _familias(rapido).items():
        busq = RandomizedSearchCV(build_pipeline(modelo), espacio, n_iter=2 if rapido else 8, scoring="roc_auc",
                                  cv=cv, random_state=config.RANDOM_STATE, n_jobs=1, refit=False)
        busq.fit(X_tr, y_tr)
        params = {k.replace("model__", ""): (round(float(v), 6) if isinstance(v, float) else int(v))
                  for k, v in busq.best_params_.items()}
        seleccion[nombre] = {"roc_auc_cv": round(float(busq.best_score_), 4),
                             "roc_auc_cv_std": round(float(busq.cv_results_["std_test_score"][busq.best_index_]), 4),
                             "hiperparametros": params}
        mejores[nombre] = modelo.set_params(**{k.replace("model__", ""): v for k, v in busq.best_params_.items()})
        log(f"  {nombre}: AUC CV = {busq.best_score_:.4f} {params}")
    lr, hgb = seleccion["Regresión logística"]["roc_auc_cv"], seleccion["Gradient Boosting (HGB)"]["roc_auc_cv"]
    familia = "Gradient Boosting (HGB)" if hgb - lr >= config.PARSIMONIA_DELTA_AUC else "Regresión logística"
    log(f"Familia elegida: {familia} (parsimonia: ΔAUC={hgb - lr:+.4f}, umbral {config.PARSIMONIA_DELTA_AUC})")

    # 3-4) Política de decisión y variantes de equidad con predicciones OOF calibradas
    costos = Costos()
    umbrales = umbrales_chow(costos)
    variantes: list[dict[str, Any]] = []
    oof: dict[str, np.ndarray] = {}
    for nombre in VARIANTES:
        est = calibrado(_pipeline_variante(mejores[familia], nombre), cv=3 if rapido else config.CV_FOLDS)
        p = predicciones_oof(est, X_tr, y_tr, cv)
        oof[nombre] = p
        eq = auditar(X_tr, y_tr, p, umbrales, bootstrap=False)
        fila = {"variante": nombre, "descripcion": VARIANTES[nombre]["descripcion"],
                "roc_auc_oof": metricas(y_tr, p, umbrales.rechazar)["roc_auc"],
                **costo_esperado(y_tr, p, umbrales, costos),
                "di_sexo": eq["sexo"]["disparate_impact"], "di_edad": eq["edad"]["disparate_impact"],
                "cumple_equidad": eq["cumple_todo"]}
        variantes.append(fila)
        log(f"  variante {nombre}: costo={fila['costo_medio']:.4f} AUC={fila['roc_auc_oof']:.4f} "
            f"DI sexo={fila['di_sexo']} edad={fila['di_edad']}")
    tabla_var = pd.DataFrame(variantes)
    viables = tabla_var[tabla_var["cumple_equidad"]]
    excepcion_equidad = viables.empty
    elegida = (tabla_var if excepcion_equidad else viables).sort_values("costo_medio").iloc[0]["variante"]
    base_costo = float(tabla_var.loc[tabla_var["variante"] == "base", "costo_medio"].iloc[0])
    for v in variantes:
        v["precio_equidad_costo"] = round(v["costo_medio"] - base_costo, 5)
    log(f"Variante elegida: {elegida}" + (" (EXCEPCIÓN: ninguna cumple DI ≥ 0,8; ver ADR-003)"
                                           if excepcion_equidad else ""))

    # 5) Modelo final con todo train y evaluación ÚNICA en test
    final = calibrado(_pipeline_variante(mejores[familia], elegida), cv=3 if rapido else config.CV_FOLDS)
    final.fit(X_tr, y_tr)
    p_te = final.predict_proba(X_te)[:, 1]
    p_tr_final = final.predict_proba(X_tr)[:, 1]
    met_test = metricas(y_te, p_te, umbrales.rechazar)
    met_test_bayes = metricas(y_te, p_te, umbrales.bayes)
    decision_test = costo_esperado(y_te, p_te, umbrales, costos)
    equidad_test = auditar(X_te, y_te, p_te, umbrales, bootstrap=not rapido)
    log(f"Test: {met_test} | decisión: {decision_test}")

    explicador = Explicador(final, X_tr)
    imp = importancia_permutacion(final, X_tr, y_tr, n_repeats=2 if rapido else 5,
                                  muestra=1000 if rapido else 3000)
    psi_score = psi(p_tr_final, p_te)
    psi_vars = psi_por_variable(X_tr, X_te)

    # 6) Modelo de texto (calibrado, mismas reglas de decisión)
    texto_tr = X_tr[config.TEXT_COL].fillna("")
    texto_te = X_te[config.TEXT_COL].fillna("")
    modelo_texto = calibrado(build_modelo_texto(), cv=3 if rapido else config.CV_FOLDS)
    p_txt_oof = predicciones_oof(modelo_texto, texto_tr, y_tr, cv)
    modelo_texto.fit(texto_tr, y_tr)
    p_txt_te = modelo_texto.predict_proba(texto_te)[:, 1]
    met_texto = {"oof_train": metricas(y_tr, p_txt_oof, umbrales.rechazar),
                 "test": metricas(y_te, p_txt_te, umbrales.rechazar)}

    algoritmo = {"Regresión logística": "LogisticRegression",
                 "Gradient Boosting (HGB)": "HistGradientBoostingClassifier"}
    card: dict[str, Any] = {
        "nombre": "riesgo_credito",
        "version": config.MODEL_VERSION,
        "fecha_entrenamiento": date.today().isoformat(),
        "algoritmo": f"{algoritmo[familia]} calibrado (sigmoide, ensemble=False)",
        "familia": familia,
        "variante_equidad": elegida,
        "excepcion_equidad": bool(excepcion_equidad),
        "fuente_de_verdad": "Back/train.py → credit_risk.entrenamiento.entrenar()",
        "modo_rapido": rapido,
        "protocolo": [
            "Partición estratificada 80/20 con semilla 42; imputación con estadísticos de train.",
            "Selección de familia por ROC-AUC CV(5) en train (RandomizedSearchCV, 8 iteraciones) "
            f"con regla de parsimonia ΔAUC < {config.PARSIMONIA_DELTA_AUC} → regresión logística.",
            "Calibración sigmoide con ensemble=False (un estimador base y un calibrador OOF).",
            "Umbrales por regla de Chow con costos por unidad de exposición (ADR-002).",
            "Variante de equidad elegida por menor costo OOF con DI ≥ 0,8 en sexo y edad (ADR-003).",
            "Test usado una única vez para la evaluación final.",
        ],
        "datos": {
            "hash_train_sha256": prep["hashes"].get("train"),
            "hash_test_sha256": prep["hashes"].get("test"),
            "n_train": int(len(X_tr)), "n_test": int(len(X_te)),
            "tasa_default_train": round(float(y_tr.mean()), 4),
            "tasa_default_test": round(float(y_te.mean()), 4),
            "validacion_contrato": {k: v for k, v in validacion.items() if k != "columnas_faltantes"},
        },
        "seleccion_cv_train": seleccion,
        "variantes_equidad": variantes,
        "costos": {"lgd_fn": costos.fn, "margen_fp": costos.fp, "revision": costos.revision,
                   "capacidad_revision": config.CAPACIDAD_REVISION},
        "umbrales": umbrales.como_dict(),
        "bandas_riesgo": {"Bajo": [0.0, round(umbrales.aprobar, 4)],
                          "Medio": [round(umbrales.aprobar, 4), round(umbrales.rechazar, 4)],
                          "Alto": [round(umbrales.rechazar, 4), 1.0]},
        "decisiones": {"Bajo": "aprobar", "Medio": "revisar", "Alto": "rechazar"},
        "sensibilidad_umbrales": sensibilidad().to_dict(orient="records"),
        "metricas_test": met_test,
        "metricas_test_umbral_bayes": met_test_bayes,
        "decision_test": decision_test,
        "equidad_test": equidad_test,
        "importancia_permutacion": imp.round(5).to_dict(orient="records"),
        "monitoreo": {"psi_puntaje_train_test": round(psi_score, 4), "estado": estado_psi(psi_score),
                      "psi_variables": psi_vars.to_dict(orient="records")},
        "modelo_texto": {"algoritmo": "TF-IDF (1-2 gramas) + LogisticRegression calibrado", "metricas": met_texto},
        "variables_entrada": config.INPUT_COLS,
        "variables_modelo": columnas_modelo(VARIANTES[elegida]["excluir"]),
        "variable_excluida_auditoria": config.SENSITIVE_COL,
        "limitaciones": LIMITACIONES,
        "duracion_entrenamiento_s": round(time.perf_counter() - t0, 1),
    }

    if escribir:
        config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
        artefacto = ArtefactoModelo(modelo=final, explicador=explicador, umbrales=umbrales, variante=elegida)
        joblib.dump(artefacto, config.MODEL_DIR / "modelo_final.joblib", compress=3)
        joblib.dump(ArtefactoTexto(modelo=modelo_texto, umbrales=umbrales),
                    config.MODEL_DIR / "modelo_nlp.joblib", compress=3)
        guardar_json(card, config.MODEL_DIR / "model_card.json")
        pd.DataFrame({"id_cliente": X_tr[config.ID_COL], "y": y_tr,
                      **{f"p_{k}": v for k, v in oof.items()}, "p_texto": p_txt_oof}
                     ).to_parquet(config.MODEL_DIR / "oof_predictions.parquet", index=False)
        pd.DataFrame({"id_cliente": X_te[config.ID_COL], "y": y_te, "p": p_te, "p_texto": p_txt_te}
                     ).to_parquet(config.MODEL_DIR / "test_predictions.parquet", index=False)
        guardar_json({"version": config.MODEL_VERSION, "curvas_test": curvas(y_te, p_te),
                      "curvas_test_texto": curvas(y_te, p_txt_te)}, config.REPORTS_DIR / "evaluacion_final.json")
        log(f"Artefactos escritos en {config.MODEL_DIR.relative_to(config.PROJECT_ROOT).as_posix()}")
    log(f"Duración: {card['duracion_entrenamiento_s']} s")
    return card

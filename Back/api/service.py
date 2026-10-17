"""Carga de artefactos y logica de prediccion."""
import json
import logging
import os
import re
import sys
import unicodedata
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

BACK_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACK_DIR / "src"))
from credit_risk import config  # noqa: E402

logger = logging.getLogger("api")
MODEL_DIR = Path(os.getenv("MODEL_DIR", BACK_DIR / "models"))

POSITIVAS = {"estable", "puntual", "puntualmente", "cumplido", "cumplo", "ahorro", "ahorros", "crecer",
             "crecimiento", "mejorar", "invertir", "inversion", "agradezco", "gracias", "seguro",
             "solido", "propio", "propia", "oportunidad", "buen", "bueno", "excelente", "responsable",
             "formal", "ascenso", "aumento", "estudiar", "educacion"}
NEGATIVAS = {"atrase", "atraso", "atrasos", "mora", "moras", "perdida", "perdi", "desempleo",
             "desempleado", "deuda", "deudas", "urgente", "urgencia", "dificultad", "dificultades",
             "problema", "problemas", "embargo", "reportado", "cobro", "cobranza", "enfermedad",
             "crisis", "despido", "despidieron", "incumpli", "atrasado", "apuro", "apuros"}


def _norm(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def sentimiento_lexico(texto: str) -> str:
    tokens = re.findall(r"[a-z]+", _norm(texto))
    score = sum(t in POSITIVAS for t in tokens) - sum(t in NEGATIVAS for t in tokens)
    return "positivo" if score > 0 else "negativo" if score < 0 else "neutral"


def banda(p: float, bandas: dict) -> str:
    if p < bandas["Bajo"][1]:
        return "Bajo"
    if p < bandas["Medio"][1]:
        return "Medio"
    return "Alto"


class ModelService:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = Path(model_dir)
        self.modelo = None
        self.modelo_nlp = None
        self.card = {}
        self.cargar()

    def cargar(self):
        # Carga atomica: si falta cualquier artefacto obligatorio, el servicio queda NO cargado.
        try:
            modelo = joblib.load(self.model_dir / "modelo_final.joblib")
            modelo_nlp = joblib.load(self.model_dir / "modelo_nlp.joblib")
            with open(self.model_dir / "model_card.json", encoding="utf-8") as f:
                card = json.load(f)
            self.modelo, self.modelo_nlp, self.card = modelo, modelo_nlp, card
            logger.info("Modelos cargados desde %s", self.model_dir)
        except Exception as e:  # noqa: BLE001
            self.modelo, self.modelo_nlp, self.card = None, None, {}
            logger.error("No se pudieron cargar los modelos: %s", e)

    @property
    def cargado(self) -> bool:
        return self.modelo is not None and self.modelo_nlp is not None and bool(self.card)

    @property
    def version(self) -> str:
        return self.card.get("version", config.MODEL_VERSION)

    @property
    def umbral(self) -> float:
        return float(self.card.get("umbral_decision", 0.5))

    @property
    def bandas(self) -> dict:
        return self.card.get("bandas_riesgo", config.BANDAS_RIESGO)

    def _df(self, clientes):
        rows = [c.model_dump() for c in clientes]
        df = pd.DataFrame(rows)[config.INPUT_COLS]
        for c in config.NUM_COLS_RAW:
            df[c] = pd.to_numeric(df[c], errors="coerce").astype(float)
        return df

    @property
    def pipeline_base(self):
        """Pipeline interno (features + preprocessor + model). Si el modelo esta calibrado, toma el del primer fold."""
        m = self.modelo
        if hasattr(m, "calibrated_classifiers_"):
            cc = m.calibrated_classifiers_[0]
            m = getattr(cc, "estimator", None) or getattr(cc, "base_estimator", None)
        return m

    def _factores_lr(self, X: pd.DataFrame, i: int):
        base = self.pipeline_base
        feat = base.named_steps["features"]
        pre = base.named_steps["preprocessor"]
        coef = base.named_steps["model"].coef_[0]
        Z = np.asarray(pre.transform(feat.transform(X.iloc[[i]])))[0]
        nombres = pre.get_feature_names_out()
        contrib = {}
        for n, c in zip(nombres, coef * Z):
            base = n.split("__", 1)[1]
            for cat in config.CAT_COLS:
                if base.startswith(cat + "_"):
                    base = cat
            contrib[base] = contrib.get(base, 0.0) + float(c)
        top = sorted(contrib.items(), key=lambda kv: abs(kv[1]), reverse=True)[:3]
        return [{"variable": k, "efecto": "aumenta_riesgo" if v > 0 else "reduce_riesgo"} for k, v in top]

    def _factores_generico(self, fila: pd.Series):
        imp = self.card.get("importancia_permutacion", {})
        med = self.card.get("medianas_train", {})
        dirc = self.card.get("direccion_riesgo", {})
        scores = []
        for col in config.NUM_COLS_RAW:
            v, m = fila.get(col), med.get(col)
            if v is None or m is None or pd.isna(v):
                continue
            desv = (float(v) - m) / (abs(m) + 1e-9)
            s = max(imp.get(col, 0.0), 1e-6) * desv * dirc.get(col, 1)
            scores.append((col, s, abs(s)))
        top = sorted(scores, key=lambda t: t[2], reverse=True)[:3]
        return [{"variable": c, "efecto": "aumenta_riesgo" if s > 0 else "reduce_riesgo"} for c, s, _ in top]

    def predecir(self, clientes):
        X = self._df(clientes)
        probas = self.modelo.predict_proba(X)[:, 1]
        es_lr = hasattr(self.pipeline_base.named_steps["model"], "coef_")
        out = []
        for i, p in enumerate(probas):
            p = float(p)
            pred = int(p >= self.umbral)
            factores = self._factores_lr(X, i) if es_lr else self._factores_generico(X.iloc[i])
            out.append({
                "probabilidad_impago": round(p, 4),
                "prediccion": pred,
                "etiqueta": "Impago" if pred else "No impago",
                "banda_riesgo": banda(p, self.bandas),
                "umbral": round(self.umbral, 4),
                "factores_principales": factores,
                "modelo_version": self.version,
            })
            logger.info("prediccion prob=%.4f pred=%d banda=%s", p, pred, out[-1]["banda_riesgo"])
        return out

    def predecir_texto(self, texto: str):
        p = float(self.modelo_nlp.predict_proba([texto])[:, 1][0])
        return {
            "probabilidad_impago_texto": round(p, 4),
            "banda_riesgo": banda(p, self.bandas),
            "sentimiento": sentimiento_lexico(texto),
            "modelo": "tfidf_logreg",
        }

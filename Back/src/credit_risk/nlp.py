"""NLP liviano (paso 7; IA3.1): normalización, sentimiento por léxico, TF-IDF y términos asociados.

Este módulo NO importa torch ni transformers: lo usan la API y ``train.py``. BERT, sentence-transformers
y GPT-2 viven en ``nlp_avanzado.py`` (solo notebooks).
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from credit_risk import config
from credit_risk.models import Umbrales, banda

STOPWORDS_ES = frozenset("""
a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella
ellas ellos en entre era es esa esas ese eso esos esta estaba estado estan estar este esto estos fue
fueron ha habia han hasta hay la las le les lo los mas me mi mis mucho muy nada ni no nos o os otra
otro para pero poco por porque que quien se ser si sido sin sobre su sus tambien tanto te tengo tiene
todo tras tu un una uno unos y ya yo mi mis he hemos este esta solicito necesito credito
""".split())

POSITIVAS = frozenset({
    "estable", "puntual", "puntualmente", "cumplido", "cumplo", "ahorro", "ahorros", "crecer",
    "crecimiento", "mejorar", "invertir", "inversion", "agradezco", "gracias", "seguro", "solido",
    "propio", "propia", "oportunidad", "buen", "bueno", "excelente", "responsable", "formal", "ascenso",
    "aumento", "estudiar", "educacion",
})
NEGATIVAS = frozenset({
    "atrase", "atraso", "atrasos", "mora", "moras", "perdida", "perdi", "desempleo", "desempleado",
    "deuda", "deudas", "urgente", "urgencia", "dificultad", "dificultades", "problema", "problemas",
    "embargo", "reportado", "cobro", "cobranza", "enfermedad", "crisis", "despido", "despidieron",
    "incumpli", "atrasado", "apuro", "apuros",
})

Sentimiento = Literal["positivo", "negativo", "neutral"]


def normalizar(texto: str | None) -> str:
    """Minúsculas y sin tildes; ``None`` o el marcador de faltante pasan a cadena vacía."""
    if texto is None or (isinstance(texto, float) and np.isnan(texto)) or texto == config.TEXTO_FALTANTE:
        return ""
    t = unicodedata.normalize("NFKD", str(texto).lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def tokens(texto: str | None, quitar_stopwords: bool = True) -> list[str]:
    """Tokens alfabéticos normalizados (opcionalmente sin stopwords)."""
    toks = re.findall(r"[a-zñ]+", normalizar(texto))
    return [t for t in toks if not (quitar_stopwords and t in STOPWORDS_ES)]


def puntaje_lexico(texto: str | None) -> int:
    """Palabras positivas menos negativas (línea base interpretable de sentimiento)."""
    toks = tokens(texto, quitar_stopwords=False)
    return sum(t in POSITIVAS for t in toks) - sum(t in NEGATIVAS for t in toks)


def sentimiento_lexico(texto: str | None) -> Sentimiento:
    """Sentimiento por léxico: positivo, negativo o neutral."""
    s = puntaje_lexico(texto)
    return "positivo" if s > 0 else "negativo" if s < 0 else "neutral"


def build_modelo_texto() -> Pipeline:
    """TF-IDF (1-2 gramas, sin stopwords) + regresión logística balanceada."""
    return Pipeline([
        ("tfidf", TfidfVectorizer(preprocessor=normalizar, ngram_range=(1, 2), min_df=2, max_features=20000,
                                  stop_words=sorted(STOPWORDS_ES), token_pattern=r"(?u)\b[a-zñ]{2,}\b")),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=3000, random_state=config.RANDOM_STATE)),
    ])


def terminos_asociados(textos: pd.Series, y: np.ndarray, top: int = 15,
                       ngramas: tuple[int, int] = (1, 1)) -> pd.DataFrame:
    """Términos con mayor diferencia de frecuencia relativa entre impago (1) y pago (0), con log-odds."""
    vec = CountVectorizer(preprocessor=normalizar, ngram_range=ngramas, min_df=5,
                          stop_words=sorted(STOPWORDS_ES), token_pattern=r"(?u)\b[a-zñ]{2,}\b")
    M = vec.fit_transform(textos.fillna(""))
    y = np.asarray(y)
    f1 = np.asarray(M[y == 1].sum(axis=0)).ravel() + 1
    f0 = np.asarray(M[y == 0].sum(axis=0)).ravel() + 1
    log_odds = np.log(f1 / f1.sum()) - np.log(f0 / f0.sum())
    t = pd.DataFrame({"termino": vec.get_feature_names_out(), "frec_impago": f1 - 1,
                      "frec_pago": f0 - 1, "log_odds": log_odds})
    return pd.concat([t.nlargest(top, "log_odds"), t.nsmallest(top, "log_odds")]).reset_index(drop=True)


@dataclass
class ArtefactoTexto:
    """Modelo de texto servido por ``/predict/text``: probabilidad calibrada y las mismas reglas de decisión."""

    modelo: Any
    umbrales: Umbrales
    version: str = config.MODEL_VERSION

    def predecir(self, texto: str) -> dict[str, Any]:
        p = float(self.modelo.predict_proba(pd.Series([texto]))[:, 1][0])
        return {
            "probabilidad_impago_texto": round(p, 4),
            "banda_riesgo": str(banda(p, self.umbrales)[0]),
            "sentimiento": sentimiento_lexico(texto),
            "modelo": "tfidf_logreg_calibrado",
        }

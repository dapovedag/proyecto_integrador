"""Modelos, métricas, calibración y política de decisión (pasos 5 y 8: IA3.3, F3, F4).

Política de decisión (ADR-002): con probabilidades calibradas y costos por unidad de exposición,
la regla de Chow da tres acciones con umbrales en forma cerrada, independientes del modelo:

    aprobar  si p < C_R / C_FN
    rechazar si p > 1 - C_R / C_FP
    revisar  en medio (existe solo si C_R < C_FN·C_FP / (C_FN + C_FP))

Las bandas Bajo / Medio / Alto son, por construcción, aprobar / revisar / rechazar.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import asdict, dataclass
from typing import Any, Literal

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.tree import DecisionTreeClassifier

from credit_risk import config

Decision = Literal["aprobar", "revisar", "rechazar"]
Banda = Literal["Bajo", "Medio", "Alto"]
BANDA_DE_DECISION: dict[str, str] = {"aprobar": "Bajo", "revisar": "Medio", "rechazar": "Alto"}


# --------------------------------------------------------------------------- catálogo
def catalogo() -> dict[str, Callable[[], BaseEstimator]]:
    """Modelos clásicos del paso 5 (constructores; cada llamada devuelve un estimador nuevo)."""
    rs = config.RANDOM_STATE
    return {
        "Dummy (línea base)": lambda: DummyClassifier(strategy="prior"),
        "Regresión logística": lambda: LogisticRegression(max_iter=3000, C=1.0, random_state=rs),
        "Árbol de decisión": lambda: DecisionTreeClassifier(max_depth=6, min_samples_leaf=40, random_state=rs),
        "Random Forest": lambda: RandomForestClassifier(n_estimators=300, max_depth=10, min_samples_leaf=20,
                                                        n_jobs=-1, random_state=rs),
        "Gradient Boosting (HGB)": lambda: HistGradientBoostingClassifier(max_iter=300, learning_rate=0.06,
                                                                          max_leaf_nodes=31, random_state=rs),
    }


def cv_estratificada(n_splits: int = config.CV_FOLDS) -> StratifiedKFold:
    """Validación cruzada estratificada con la semilla del proyecto."""
    return StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=config.RANDOM_STATE)


# --------------------------------------------------------------------------- métricas
def ks_stat(y: np.ndarray, p: np.ndarray) -> float:
    """Estadístico de Kolmogórov-Smirnov: máxima separación entre las distribuciones de buenos y malos."""
    fpr, tpr, _ = roc_curve(y, p)
    return float(np.max(tpr - fpr))


def metricas(y: np.ndarray, p: np.ndarray, umbral: float) -> dict[str, float]:
    """Métricas de ranking (AUC, PR-AUC, KS), calibración (Brier) y de clasificación al ``umbral``."""
    y = np.asarray(y)
    p = np.asarray(p, dtype=float)
    pred = (p >= umbral).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y, p)), 4),
        "pr_auc": round(float(average_precision_score(y, p)), 4),
        "ks": round(ks_stat(y, p), 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
        "accuracy": round(float(accuracy_score(y, pred)), 4),
        "precision": round(float(precision_score(y, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y, pred, zero_division=0)), 4),
    }


def curvas(y: np.ndarray, p: np.ndarray, puntos: int = 101) -> dict[str, list[float]]:
    """ROC, precisión-recall y calibración muestreadas a ``puntos`` (para gráficos y el front)."""
    from sklearn.calibration import calibration_curve
    from sklearn.metrics import precision_recall_curve

    fpr, tpr, _ = roc_curve(y, p)
    grid = np.linspace(0, 1, puntos)
    prec, rec, _ = precision_recall_curve(y, p)
    orden = np.argsort(rec)
    frac, media = calibration_curve(y, p, n_bins=10, strategy="quantile")
    return {
        "fpr": grid.round(4).tolist(),
        "tpr": np.interp(grid, fpr, tpr).round(4).tolist(),
        "recall": grid.round(4).tolist(),
        "precision": np.interp(grid, rec[orden], prec[orden]).round(4).tolist(),
        "calib_prob_media": media.round(4).tolist(),
        "calib_frac_positivos": frac.round(4).tolist(),
    }


# --------------------------------------------------------------------------- calibración
def calibrado(pipeline: BaseEstimator, cv: int = config.CV_FOLDS) -> CalibratedClassifierCV:
    """Envuelve el pipeline en calibración sigmoide con ``ensemble=False``.

    Con ``ensemble=False`` hay UN estimador base entrenado con todo train y un calibrador ajustado con
    sus predicciones out-of-fold; así las contribuciones del estimador base explican la probabilidad servida.
    """
    return CalibratedClassifierCV(estimator=clone(pipeline), method="sigmoid", cv=cv, ensemble=False)


def predicciones_oof(estimador: BaseEstimator, X: pd.DataFrame, y: np.ndarray,
                     cv: StratifiedKFold | None = None) -> np.ndarray:
    """Probabilidades out-of-fold en train (base para umbrales, costos y equidad sin tocar test)."""
    return cross_val_predict(clone(estimador), X, y, cv=cv or cv_estratificada(),
                             method="predict_proba", n_jobs=1)[:, 1]


def estimador_base(modelo: Any) -> Any:
    """Devuelve el pipeline sin calibrar dentro de un ``CalibratedClassifierCV`` (o el mismo objeto)."""
    if hasattr(modelo, "calibrated_classifiers_"):
        return modelo.calibrated_classifiers_[0].estimator
    return modelo


# --------------------------------------------------------------------------- política de decisión
@dataclass(frozen=True)
class Costos:
    """Costos por unidad de exposición (ADR-002)."""

    fn: float = config.LGD
    fp: float = config.MARGEN
    revision: float = config.COSTO_REVISION


@dataclass(frozen=True)
class Umbrales:
    """Umbrales de la regla de Chow y el umbral bayesiano de dos acciones (referencia)."""

    aprobar: float
    rechazar: float
    bayes: float

    def como_dict(self) -> dict[str, float]:
        return {k: round(v, 4) for k, v in asdict(self).items()}


def umbrales_chow(costos: Costos = Costos()) -> Umbrales:
    """Umbrales óptimos para aprobar / revisar / rechazar con probabilidades calibradas."""
    limite = costos.fn * costos.fp / (costos.fn + costos.fp)
    if costos.revision >= limite:
        raise ValueError(f"Con C_R={costos.revision} >= {limite:.4f} la revisión nunca conviene: "
                         "no existe banda intermedia.")
    return Umbrales(aprobar=costos.revision / costos.fn,
                    rechazar=1 - costos.revision / costos.fp,
                    bayes=costos.fp / (costos.fp + costos.fn))


def decidir(p: np.ndarray | float, umbrales: Umbrales) -> np.ndarray:
    """Acción por solicitud: 'aprobar', 'revisar' o 'rechazar'."""
    p = np.atleast_1d(np.asarray(p, dtype=float))
    return np.where(p < umbrales.aprobar, "aprobar", np.where(p > umbrales.rechazar, "rechazar", "revisar"))


def banda(p: np.ndarray | float, umbrales: Umbrales) -> np.ndarray:
    """Banda de riesgo coherente con la decisión: Bajo=aprobar, Medio=revisar, Alto=rechazar."""
    return np.vectorize(BANDA_DE_DECISION.get)(decidir(p, umbrales))


def costo_esperado(y: np.ndarray, p: np.ndarray, umbrales: Umbrales,
                   costos: Costos = Costos()) -> dict[str, float]:
    """Costo medio por solicitud y tasas de cada acción (supone que la revisión manual acierta)."""
    y = np.asarray(y)
    d = decidir(p, umbrales)
    costo = np.where((d == "aprobar") & (y == 1), costos.fn, 0.0)
    costo = costo + np.where((d == "rechazar") & (y == 0), costos.fp, 0.0)
    costo = costo + np.where(d == "revisar", costos.revision, 0.0)
    aprobados = d == "aprobar"
    return {
        "costo_medio": round(float(costo.mean()), 5),
        "tasa_aprobacion": round(float(aprobados.mean()), 4),
        "tasa_revision": round(float((d == "revisar").mean()), 4),
        "tasa_rechazo": round(float((d == "rechazar").mean()), 4),
        "impago_en_aprobados": round(float(y[aprobados].mean()), 4) if aprobados.any() else 0.0,
        "supera_capacidad_revision": bool((d == "revisar").mean() > config.CAPACIDAD_REVISION),
    }


def costo_binario(y: np.ndarray, p: np.ndarray, costos: Costos = Costos(),
                  grid: np.ndarray | None = None) -> pd.DataFrame:
    """Curva de costo de la política de dos acciones (aprobar/rechazar) según el umbral."""
    y = np.asarray(y)
    grid = np.round(np.arange(0.02, 0.981, 0.01), 2) if grid is None else grid
    filas = []
    for t in grid:
        rech = p >= t
        filas.append({"umbral": float(t),
                      "costo_medio": float(np.mean(np.where(~rech & (y == 1), costos.fn, 0.0)
                                                   + np.where(rech & (y == 0), costos.fp, 0.0)))})
    return pd.DataFrame(filas)


def sensibilidad(lgds: list[float] | None = None, margenes: list[float] | None = None,
                 revision: float = config.COSTO_REVISION) -> pd.DataFrame:
    """Umbrales de Chow para distintas LGD y márgenes (supuestos de negocio, ADR-002)."""
    filas = []
    for lgd in lgds or config.SENSIBILIDAD_LGD:
        for m in margenes or config.SENSIBILIDAD_MARGEN:
            c = Costos(fn=lgd, fp=m, revision=revision)
            try:
                u = umbrales_chow(c)
                filas.append({"lgd": lgd, "margen": m, "aprobar_si_p_menor": round(u.aprobar, 4),
                              "rechazar_si_p_mayor": round(u.rechazar, 4), "banda_revision": True})
            except ValueError:
                filas.append({"lgd": lgd, "margen": m, "aprobar_si_p_menor": round(c.fp / (c.fp + c.fn), 4),
                              "rechazar_si_p_mayor": round(c.fp / (c.fp + c.fn), 4), "banda_revision": False})
    return pd.DataFrame(filas)

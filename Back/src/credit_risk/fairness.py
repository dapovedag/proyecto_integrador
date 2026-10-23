"""Auditoría y mitigación de equidad (IA1.3, paso 8; ADR-003).

Decisiones de diseño:
- El *disparate impact* (DI) se mide sobre la **aprobación automática** (decisión = "aprobar").
- Grupos de edad fijos (18-29 / 30-59 / 60+ / desconocida); grupos con n < N_MINIMO_GRUPO se reportan
  pero no cuentan para el DI. El DI se acompaña de un intervalo de confianza bootstrap.
- Además del DI se reporta igualdad de oportunidades (aprobación entre buenos pagadores) y la
  calibración por grupo (probabilidad media frente a tasa observada).
- Mitigación permitida: quitar variables (variante "sin_edad") o *reweighing* (Kamiran y Calders, 2012).
  No se usan umbrales distintos por grupo: sería trato dispar explícito por una característica protegida.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin, clone

from credit_risk import config
from credit_risk.models import Umbrales, decidir


def grupo_edad(edad: pd.Series | np.ndarray) -> np.ndarray:
    """Grupo de edad para auditoría (independiente de ``rango_edad``, que es una variable del modelo)."""
    e = pd.to_numeric(pd.Series(np.asarray(edad)), errors="coerce")
    lo, hi = config.EDAD_VALIDA
    e = e.where(e.between(lo, hi))  # edades imposibles (p. ej. 150) → desconocida, no "60+"
    g = pd.cut(e, config.GRUPOS_EDAD_BINS, labels=config.GRUPOS_EDAD_LABELS).astype(object)
    return g.where(e.notna(), config.GRUPO_EDAD_DESCONOCIDO).fillna(config.GRUPO_EDAD_DESCONOCIDO).to_numpy()


def tabla_grupos(grupos: np.ndarray, y: np.ndarray, p: np.ndarray, umbrales: Umbrales) -> pd.DataFrame:
    """Métricas por grupo: aprobación, igualdad de oportunidades, rechazo de buenos y calibración."""
    grupos, y, p = np.asarray(grupos), np.asarray(y), np.asarray(p, dtype=float)
    d = decidir(p, umbrales)
    filas = []
    for g in sorted(pd.unique(grupos).tolist(), key=str):
        m = grupos == g
        buenos = m & (y == 0)
        filas.append({
            "grupo": str(g),
            "n": int(m.sum()),
            "tasa_aprobacion": float(np.mean(d[m] == "aprobar")),
            "aprobacion_buenos_pagadores": float(np.mean(d[buenos] == "aprobar")) if buenos.any() else np.nan,
            "rechazo_buenos_pagadores": float(np.mean(d[buenos] == "rechazar")) if buenos.any() else np.nan,
            "prob_media": float(p[m].mean()),
            "tasa_impago_real": float(y[m].mean()),
        })
    t = pd.DataFrame(filas).set_index("grupo")
    t["error_calibracion"] = t["prob_media"] - t["tasa_impago_real"]
    t["cuenta_para_di"] = t["n"] >= config.N_MINIMO_GRUPO
    return t


def disparate_impact(tabla: pd.DataFrame, columna: str = "tasa_aprobacion") -> float | None:
    """DI = tasa mínima / tasa máxima entre los grupos con n suficiente (regla de 4/5 si ≥ 0,8)."""
    t = tabla.loc[tabla["cuenta_para_di"], columna].dropna()
    if len(t) < 2 or t.max() <= 0:
        return None
    return float(t.min() / t.max())


def _di_rapido(grupos: np.ndarray, aprobado: np.ndarray, validos: list[str]) -> float:
    tasas = [aprobado[grupos == g].mean() for g in validos if (grupos == g).any()]
    return float(min(tasas) / max(tasas)) if tasas and max(tasas) > 0 else np.nan


def di_bootstrap(grupos: np.ndarray, p: np.ndarray, umbrales: Umbrales,
                 reps: int = config.BOOTSTRAP_REPS, seed: int = config.RANDOM_STATE) -> tuple[float, float]:
    """Intervalo de confianza bootstrap (95 %) del DI de aprobación automática."""
    grupos = np.asarray(grupos)
    aprobado = decidir(p, umbrales) == "aprobar"
    conteos = pd.Series(grupos).value_counts()
    validos = [str(g) for g in conteos[conteos >= config.N_MINIMO_GRUPO].index]
    rng = np.random.default_rng(seed)
    n = len(grupos)
    valores = []
    for _ in range(reps):
        idx = rng.integers(0, n, n)
        valores.append(_di_rapido(grupos[idx], aprobado[idx], validos))
    lo, hi = np.nanpercentile(valores, [2.5, 97.5])
    return float(lo), float(hi)


def auditar(df: pd.DataFrame, y: np.ndarray, p: np.ndarray, umbrales: Umbrales,
            bootstrap: bool = True) -> dict[str, Any]:
    """Auditoría completa por sexo y por grupo de edad. ``df`` debe traer las columnas ``sexo`` y ``edad``."""
    resultado: dict[str, Any] = {}
    atributos = {"sexo": df[config.SENSITIVE_COL].fillna("desconocido").astype(str).to_numpy(),
                 "edad": grupo_edad(df["edad"])}
    for nombre, grupos in atributos.items():
        tabla = tabla_grupos(grupos, y, p, umbrales)
        di = disparate_impact(tabla)
        ic = di_bootstrap(grupos, p, umbrales) if bootstrap else (np.nan, np.nan)
        resultado[nombre] = {
            "grupos": tabla.round(4).reset_index().to_dict(orient="records"),
            "disparate_impact": None if di is None else round(di, 4),
            "di_ic95": [round(ic[0], 4), round(ic[1], 4)] if bootstrap else None,
            "di_igualdad_oportunidades": (None if (v := disparate_impact(tabla, "aprobacion_buenos_pagadores"))
                                          is None else round(v, 4)),
            "cumple_regla_80": bool(di is not None and di >= config.DI_MINIMO),
        }
    resultado["cumple_todo"] = all(v["cumple_regla_80"] for v in resultado.values() if isinstance(v, dict))
    return resultado


# --------------------------------------------------------------------------- mitigación
def pesos_kamiran_calders(grupos: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Pesos que hacen estadísticamente independientes grupo y objetivo: w = P(g)·P(y) / P(g, y)."""
    grupos, y = np.asarray(grupos), np.asarray(y)
    w = np.ones(len(y), dtype=float)
    for g in np.unique(grupos):
        for c in (0, 1):
            m = (grupos == g) & (y == c)
            if m.any():
                w[m] = (np.mean(grupos == g) * np.mean(y == c)) / np.mean(m)
    return w


class Reweighing(ClassifierMixin, BaseEstimator):
    """Meta-estimador: calcula pesos de Kamiran-Calders por grupo de edad dentro de ``fit``.

    Al calcularlos dentro de ``fit`` funciona igual en validación cruzada y en ``CalibratedClassifierCV``
    (cada partición usa solo sus propios datos). El grupo NO entra como variable al modelo.
    """

    def __init__(self, estimator: Any = None, columna: str = "edad") -> None:
        self.estimator = estimator
        self.columna = columna

    def fit(self, X: pd.DataFrame, y: np.ndarray) -> Reweighing:
        w = pesos_kamiran_calders(grupo_edad(X[self.columna]), np.asarray(y))
        self.estimator_ = clone(self.estimator)
        self.estimator_.fit(X, y, model__sample_weight=w)
        self.classes_ = self.estimator_.classes_
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.estimator_.predict_proba(X)

    def decision_function(self, X: pd.DataFrame) -> np.ndarray:
        return self.estimator_.decision_function(X)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.estimator_.predict(X)

"""Monitoreo del modelo en producción (R4): índice de estabilidad poblacional (PSI).

PSI = Σ (a_i − e_i) · ln(a_i / e_i) sobre los cortes de la distribución de referencia (train).
Convención de la industria: < 0,10 estable; 0,10–0,25 cambio moderado (vigilar); ≥ 0,25 cambio
significativo (recalibrar o reentrenar). Ver ``docs/05_despliegue.md`` (plan de operación).
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from credit_risk import config


def psi(esperado: np.ndarray | pd.Series, actual: np.ndarray | pd.Series, bins: int = 10) -> float:
    """PSI de una variable numérica o categórica (cortes por cuantiles de la referencia)."""
    e = pd.Series(np.asarray(esperado)).dropna()
    a = pd.Series(np.asarray(actual)).dropna()
    if e.empty or a.empty:
        return float("nan")
    if pd.api.types.is_numeric_dtype(e) and e.nunique() > bins:
        cortes = np.unique(np.quantile(e, np.linspace(0, 1, bins + 1)))
        cortes[0], cortes[-1] = -np.inf, np.inf
        pe = pd.cut(e, cortes).value_counts(normalize=True, sort=False)
        pa = pd.cut(a, cortes).value_counts(normalize=True, sort=False)
    else:
        pe = e.astype(str).value_counts(normalize=True)
        pa = a.astype(str).value_counts(normalize=True).reindex(pe.index, fill_value=0)
    pe_v = np.clip(pe.to_numpy(dtype=float), 1e-6, None)
    pa_v = np.clip(pa.to_numpy(dtype=float), 1e-6, None)
    return float(np.sum((pa_v - pe_v) * np.log(pa_v / pe_v)))


def estado_psi(valor: float) -> str:
    """Traduce el PSI a una acción operativa."""
    if np.isnan(valor):
        return "sin_datos"
    if valor < config.PSI_ESTABLE:
        return "estable"
    return "vigilar" if valor < config.PSI_ALERTA else "recalibrar"


def psi_por_variable(referencia: pd.DataFrame, actual: pd.DataFrame,
                     columnas: list[str] | None = None) -> pd.DataFrame:
    """Tabla de PSI por variable de entrada, ordenada de mayor a menor."""
    cols = columnas or config.INPUT_COLS
    filas = [{"variable": c, "psi": round(psi(referencia[c], actual[c]), 4)} for c in cols]
    t = pd.DataFrame(filas).sort_values("psi", ascending=False).reset_index(drop=True)
    t["estado"] = t["psi"].map(estado_psi)
    return t

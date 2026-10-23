"""Ingeniería de variables y preprocesador (pasos 3 y 4: P2.2–P2.4, IA2.4–IA2.5).

El pipeline completo es: variables derivadas → capping p1-p99 (ajustado en train) → imputación,
escalado y codificación → modelo. Así la API aplica exactamente la misma transformación que el
entrenamiento, y ningún estadístico se calcula con test.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, OrdinalEncoder, StandardScaler

from credit_risk import config


def crear_variables(df: pd.DataFrame) -> pd.DataFrame:
    """Agrega las 6 variables derivadas con justificación de negocio (P2.4).

    - ``cuota_estimada``: cuota mensual por amortización francesa (tasa E.A. → mensual simple).
    - ``ratio_cuota_ingreso`` y ``ratio_monto_ingreso``: capacidad de pago.
    - ``rango_edad``: ciclo de vida (ordinal).
    - ``tiene_moras_previas``: historial de pago binario.
    - ``longitud_texto``: esfuerzo de la solicitud (solo EDA; no entra al modelo tabular).
    """
    d = df.copy()
    monto = pd.to_numeric(d["monto_credito"], errors="coerce").astype(float)
    ingreso = pd.to_numeric(d["ingreso_mensual"], errors="coerce").astype(float).replace(0, np.nan)
    n = pd.to_numeric(d["plazo_meses"], errors="coerce").astype(float).replace(0, np.nan)
    r = pd.to_numeric(d["tasa_interes_anual"], errors="coerce").astype(float) / 100 / 12
    with np.errstate(divide="ignore", invalid="ignore", over="ignore"):
        cuota = np.where(r > 0, monto * r / (1 - (1 + r) ** (-n)), monto / n)
    d["cuota_estimada"] = cuota
    d["ratio_cuota_ingreso"] = d["cuota_estimada"] / ingreso
    d["ratio_monto_ingreso"] = monto / ingreso
    edad = pd.to_numeric(d["edad"], errors="coerce")
    d["rango_edad"] = pd.cut(edad, config.RANGO_EDAD_BINS, labels=config.RANGO_EDAD_LABELS).astype(object)
    d["rango_edad"] = d["rango_edad"].where(edad.notna(), np.nan)
    d["tiene_moras_previas"] = (pd.to_numeric(d["moras_ultimos_12m"], errors="coerce") > 0).astype(int)
    if config.TEXT_COL in d:
        texto = d[config.TEXT_COL].fillna("").astype(str).replace(config.TEXTO_FALTANTE, "")
        d["longitud_texto"] = texto.str.len()
    else:
        d["longitud_texto"] = 0
    return d.replace([np.inf, -np.inf], np.nan)


class Winsorizer(TransformerMixin, BaseEstimator):
    """Capping por cuantiles aprendidos en ``fit`` (solo train). Trata atípicos sin eliminar filas (IA2.5)."""

    def __init__(self, columnas: Sequence[str] | None = None,
                 cuantiles: tuple[float, float] = config.CAPPING_QUANTILES) -> None:
        self.columnas = columnas
        self.cuantiles = cuantiles

    def fit(self, X: pd.DataFrame, y: Any = None) -> Winsorizer:
        cols = [c for c in (self.columnas or config.COLS_CAPPING) if c in X.columns]
        lo, hi = self.cuantiles
        self.limites_ = {c: (float(X[c].quantile(lo)), float(X[c].quantile(hi))) for c in cols}
        self.feature_names_in_ = np.asarray(X.columns, dtype=object)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        out = X.copy()
        for c, (lo, hi) in self.limites_.items():
            if c in out:
                out[c] = pd.to_numeric(out[c], errors="coerce").clip(lo, hi)
        return out

    def get_feature_names_out(self, input_features: Any = None) -> np.ndarray:
        return self.feature_names_in_


def columnas_modelo(excluir: Sequence[str] = ()) -> dict[str, list[str]]:
    """Columnas que entran al modelo, por tipo, quitando las indicadas (variantes de equidad)."""
    ex = set(excluir)
    return {
        "numericas": [c for c in config.NUM_MODELO if c not in ex],
        "nominales": [c for c in config.CAT_NOMINALES if c not in ex],
        "ordinales": [c for c in config.ORDINALES if c not in ex],
    }


def build_preprocessor(excluir: Sequence[str] = ()) -> ColumnTransformer:
    """Imputación + escalado (StandardScaler) + One-Hot (nominales) + Ordinal (nivel educativo, rango de edad)."""
    cols = columnas_modelo(excluir)
    num = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
    nom = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value=config.CATEGORIA_DESCONOCIDA)),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    orde = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ordinal", OrdinalEncoder(categories=[config.ORDINALES[c] for c in cols["ordinales"]],
                                   handle_unknown="use_encoded_value", unknown_value=-1)),
        ("scaler", StandardScaler()),
    ])
    transformadores = [("num", num, cols["numericas"]), ("nom", nom, cols["nominales"])]
    if cols["ordinales"]:
        transformadores.append(("ord", orde, cols["ordinales"]))
    return ColumnTransformer(transformadores, verbose_feature_names_out=False)


def build_feature_step() -> FunctionTransformer:
    """Paso de variables derivadas como transformador de scikit-learn (serializable con joblib)."""
    return FunctionTransformer(crear_variables, validate=False)


def build_pipeline(modelo: Any, excluir: Sequence[str] = ()) -> Pipeline:
    """Pipeline completo: derivadas → capping → preprocesador → modelo."""
    return Pipeline([
        ("features", build_feature_step()),
        ("capping", Winsorizer()),
        ("preprocessor", build_preprocessor(excluir)),
        ("model", modelo),
    ])


def variable_original(nombre_transformado: str) -> str:
    """Mapea una columna transformada (p. ej. ``proposito_Vivienda``) a su variable original."""
    for c in config.CAT_NOMINALES:
        if nombre_transformado.startswith(c + "_"):
            return c
    return nombre_transformado

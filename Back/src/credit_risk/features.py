"""Ingenieria de variables y preprocesador."""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from . import config


def crear_variables(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    ingreso = df["ingreso_mensual"].astype(float).replace(0, np.nan)
    monto = df["monto_credito"].astype(float)
    plazo = df["plazo_meses"].astype(float).replace(0, np.nan)
    r = df["tasa_interes_anual"].astype(float) / 100 / 12
    with np.errstate(divide="ignore", invalid="ignore"):
        cuota = np.where(r > 0, monto * r / (1 - (1 + r) ** (-plazo)), monto / plazo)
    df["ratio_monto_ingreso"] = monto / ingreso
    df["cuota_estimada"] = cuota
    df["ratio_cuota_ingreso"] = df["cuota_estimada"] / ingreso
    return df.replace([np.inf, -np.inf], np.nan)


def build_preprocessor() -> ColumnTransformer:
    num = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
    cat = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([("num", num, config.NUM_COLS), ("cat", cat, config.CAT_COLS)])


def build_feature_step() -> FunctionTransformer:
    return FunctionTransformer(crear_variables, validate=False)

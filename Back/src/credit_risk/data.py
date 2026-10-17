"""Carga y limpieza del dataset."""
import numpy as np
import pandas as pd

from . import config


def cargar_datos(path=None) -> pd.DataFrame:
    return pd.read_csv(path or config.DATA_PATH)


def validar_dataset(df: pd.DataFrame) -> dict:
    """Verifica el contrato de datos (docs/03_contrato_datos.md). Devuelve {chequeo: bool} y 'ok' global."""
    req = [config.ID_COL, config.TARGET, config.TEXT_COL, config.SENSITIVE_COL] + list(config.INPUT_COLS)
    faltantes = [c for c in dict.fromkeys(req) if c not in df.columns]
    y = df[config.TARGET] if config.TARGET in df else pd.Series(dtype=float)
    texto = df[config.TEXT_COL].fillna("").astype(str).str.strip() if config.TEXT_COL in df else pd.Series(dtype=str)
    ingreso = df["ingreso_mensual"].dropna() if "ingreso_mensual" in df else pd.Series(dtype=float)
    q1, q3 = (ingreso.quantile(0.25), ingreso.quantile(0.75)) if len(ingreso) else (0, 0)
    chequeos = {
        "columnas_minimas": not faltantes,
        "target_binario": bool(len(y)) and set(y.dropna().unique()) <= {0, 1},
        "prevalencia_5_40": bool(len(y)) and 0.05 <= y.mean() <= 0.40,
        "filas_min_1000": len(df) >= 1000,
        "texto_no_vacio_95": bool(len(texto)) and (texto != "").mean() >= 0.95,
        "texto_distintos_200": texto.nunique() >= 200,
        "nulos_en_3_columnas": int((df.isna().sum() > 0).sum()) >= 3,
        "hay_duplicados": bool(df.duplicated(subset=[config.ID_COL]).any()) if config.ID_COL in df else False,
        "hay_atipicos_ingreso": bool(((ingreso < q1 - 1.5 * (q3 - q1)) | (ingreso > q3 + 1.5 * (q3 - q1))).any()),
        "diccionario_existe": (config.PROJECT_ROOT / "docs" / "diccionario_datos.md").exists()
        or (config.PROJECT_ROOT / "db" / "README.md").exists(),
    }
    chequeos["columnas_faltantes"] = faltantes
    chequeos["ok"] = all(v for k, v in chequeos.items() if k not in ("columnas_faltantes", "diccionario_existe"))
    return chequeos


def limpiar(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df.drop_duplicates(subset=[config.ID_COL], keep="first")
    # Valores invalidos -> NaN (se imputan en el pipeline)
    df.loc[(df["edad"] < 18) | (df["edad"] > 100), "edad"] = np.nan
    df.loc[(df["puntaje_buro"] < 150) | (df["puntaje_buro"] > 950), "puntaje_buro"] = np.nan
    df.loc[df["ingreso_mensual"] <= 0, "ingreso_mensual"] = np.nan
    df.loc[df["monto_credito"] <= 0, "monto_credito"] = np.nan
    df["uso_cupo_tarjetas"] = df["uso_cupo_tarjetas"].clip(0, 1)
    if "antiguedad_laboral_anios" in df and "edad" in df:
        mala = df["antiguedad_laboral_anios"] > (df["edad"] - 14)
        df.loc[mala, "antiguedad_laboral_anios"] = np.nan
    df = df.dropna(subset=[config.TARGET])
    df[config.TARGET] = df[config.TARGET].astype(int)
    return df.reset_index(drop=True)

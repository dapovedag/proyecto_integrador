"""Carga, validación del contrato, limpieza, partición e imputación del dataset (paso 3, P2.1 y P2.6).

Orden obligatorio para evitar fuga de información: ``limpiar`` (reglas fijas, sin estadísticos)
→ ``dividir`` (train/test estratificado) → ``imputar`` (medianas y modas calculadas solo en train).
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from credit_risk import config


def cargar_datos(path: str | Path | None = None) -> pd.DataFrame:
    """Lee el CSV crudo (dato de registro). Por defecto, ``config.RAW_DATA_PATH``."""
    return pd.read_csv(path or config.RAW_DATA_PATH)


def validar_dataset(df: pd.DataFrame) -> dict[str, Any]:
    """Verifica el contrato de datos (docs/03_contrato_datos.md). Devuelve ``{chequeo: bool}`` y ``ok`` global."""
    req = [config.ID_COL, config.TARGET, config.TEXT_COL, config.SENSITIVE_COL, *config.INPUT_COLS]
    faltantes = [c for c in dict.fromkeys(req) if c not in df.columns]
    y = df[config.TARGET] if config.TARGET in df else pd.Series(dtype=float)
    texto = (df[config.TEXT_COL].fillna("").astype(str).str.strip()
             if config.TEXT_COL in df else pd.Series(dtype=str))
    ingreso = df["ingreso_mensual"].dropna() if "ingreso_mensual" in df else pd.Series(dtype=float)
    q1, q3 = (ingreso.quantile(0.25), ingreso.quantile(0.75)) if len(ingreso) else (0.0, 0.0)
    chequeos: dict[str, Any] = {
        "columnas_minimas": not faltantes,
        "target_binario": bool(len(y)) and set(y.dropna().unique()) <= {0, 1},
        "prevalencia_5_40": bool(len(y)) and 0.05 <= float(y.mean()) <= 0.40,
        "filas_min_1000": len(df) >= 1000,
        "texto_no_vacio_95": bool(len(texto)) and float((texto != "").mean()) >= 0.95,
        "texto_distintos_200": int(texto.nunique()) >= 200,
        "nulos_en_3_columnas": int((df.isna().sum() > 0).sum()) >= 3,
        "hay_duplicados": bool(df.duplicated(subset=[config.ID_COL]).any()) if config.ID_COL in df else False,
        "hay_atipicos_ingreso": bool(((ingreso < q1 - 1.5 * (q3 - q1)) | (ingreso > q3 + 1.5 * (q3 - q1))).any()),
        "diccionario_existe": (config.PROJECT_ROOT / "docs" / "diccionario_datos.md").exists(),
    }
    chequeos["columnas_faltantes"] = faltantes
    chequeos["ok"] = all(v for k, v in chequeos.items() if k not in ("columnas_faltantes", "diccionario_existe"))
    return chequeos


@dataclass
class ReporteLimpieza:
    """Lo que hizo ``limpiar``: sirve de evidencia en el notebook 03 y en el front."""

    filas_iniciales: int = 0
    duplicados_exactos: int = 0
    duplicados_id: int = 0
    categorias_fuera_catalogo: dict[str, int] = field(default_factory=dict)
    edades_invalidas: int = 0
    no_positivos: dict[str, int] = field(default_factory=dict)
    fuera_de_rango: dict[str, int] = field(default_factory=dict)
    filas_finales: int = 0


def limpiar(df: pd.DataFrame, reporte: ReporteLimpieza | None = None) -> pd.DataFrame:
    """Aplica reglas fijas (sin estadísticos del dataset): duplicados, catálogo, rangos válidos.

    Los valores inválidos pasan a NaN para imputarse después con estadísticos de train.
    """
    rep = reporte if reporte is not None else ReporteLimpieza()
    df = df.copy()
    rep.filas_iniciales = len(df)
    n0 = len(df)
    df = df.drop_duplicates()
    rep.duplicados_exactos = n0 - len(df)
    n1 = len(df)
    df = df.drop_duplicates(subset=config.ID_COL, keep="first")
    rep.duplicados_id = n1 - len(df)

    for col, validas in config.CATEGORIAS.items():
        if col not in df:
            continue
        mapa = {v.lower(): v for v in validas}
        limpio = df[col].astype("string").str.strip().str.replace(" ", "_").str.lower().map(mapa)
        rep.categorias_fuera_catalogo[col] = int((df[col].notna() & limpio.isna()).sum())
        df[col] = limpio.astype(object).where(limpio.notna(), np.nan)

    lo, hi = config.EDAD_VALIDA
    invalida = df["edad"].notna() & ~df["edad"].between(lo, hi)
    rep.edades_invalidas = int(invalida.sum())
    df.loc[invalida, "edad"] = np.nan

    for col in ["monto_credito", "ingreso_mensual"]:
        malos = df[col] <= 0
        rep.no_positivos[col] = int(malos.sum())
        df.loc[malos, col] = np.nan

    for col, (lo_r, hi_r) in config.RANGOS_VALIDOS.items():
        fuera = df[col].notna() & ~df[col].between(lo_r, hi_r)
        rep.fuera_de_rango[col] = int(fuera.sum())
        df.loc[fuera, col] = np.nan

    df = df.dropna(subset=[config.TARGET])
    df[config.TARGET] = df[config.TARGET].astype(int)
    rep.filas_finales = len(df)
    return df.reset_index(drop=True)


def dividir(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Partición train/test estratificada por el objetivo, con la semilla del proyecto (P2.6)."""
    train, test = train_test_split(df, test_size=config.TEST_SIZE, stratify=df[config.TARGET],
                                   random_state=config.RANDOM_STATE)
    return train.copy(), test.copy()


@dataclass
class ReglasImputacion:
    """Estadísticos de imputación aprendidos SOLO en train."""

    mediana: dict[str, float]
    moda: dict[str, str]
    desconocido: dict[str, str]

    def aplicar(self, df: pd.DataFrame) -> pd.DataFrame:
        """Imputa una copia de ``df`` con los estadísticos guardados y corrige tipos enteros."""
        out = df.copy()
        out[list(self.mediana)] = out[list(self.mediana)].fillna(self.mediana)
        out = out.fillna(self.moda).fillna(self.desconocido)
        if config.TEXT_COL in out:
            out[config.TEXT_COL] = out[config.TEXT_COL].fillna(config.TEXTO_FALTANTE)
        for c in config.ENTEROS:
            if c in out:
                out[c] = out[c].round().astype(int)
        return out


def aprender_imputacion(train: pd.DataFrame) -> ReglasImputacion:
    """Calcula medianas (numéricas) y modas (categóricas) en train; faltante informativo → 'Desconocido'."""
    cat_moda = [c for c in config.CATEGORIAS if c not in config.CAT_FALTANTE_INFORMATIVO]
    return ReglasImputacion(
        mediana={c: round(float(v), 4) for c, v in train[config.NUM_COLS_RAW].median().items()},
        moda={c: str(train[c].mode().iloc[0]) for c in cat_moda},
        desconocido={c: config.CATEGORIA_DESCONOCIDA for c in config.CAT_FALTANTE_INFORMATIVO},
    )


def hash_archivo(path: str | Path) -> str:
    """SHA-256 de un archivo (contrato de datos reproducible: se registra en la model card)."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def preparar_procesados(df_crudo: pd.DataFrame | None = None, escribir: bool = True) -> dict[str, Any]:
    """Pipeline completo del paso 3: limpia, divide, imputa con train y (opcional) escribe ``db/processed``.

    Devuelve ``train``, ``test``, ``reglas``, ``reporte`` y los ``hashes`` de los CSV escritos.
    """
    from credit_risk.features import crear_variables

    crudo = cargar_datos() if df_crudo is None else df_crudo
    reporte = ReporteLimpieza()
    limpio = limpiar(crudo, reporte)
    train, test = dividir(limpio)
    reglas = aprender_imputacion(train)
    train = crear_variables(reglas.aplicar(train)).sort_values(config.ID_COL).reset_index(drop=True)
    test = crear_variables(reglas.aplicar(test)).sort_values(config.ID_COL).reset_index(drop=True)
    hashes: dict[str, str] = {}
    if escribir:
        config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        for nombre, d in {"train": train, "test": test}.items():
            ruta = config.PROCESSED_DIR / f"{nombre}.csv"
            d.to_csv(ruta, index=False, lineterminator="\n")
            hashes[nombre] = hash_archivo(ruta)
        with open(config.PROCESSED_DIR / "imputacion.json", "w", encoding="utf-8") as f:
            json.dump({"mediana": reglas.mediana, "moda": reglas.moda, "desconocido": reglas.desconocido},
                      f, ensure_ascii=False, indent=2)
    return {"train": train, "test": test, "reglas": reglas, "reporte": reporte, "hashes": hashes}


def cargar_procesados() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Lee ``db/processed/train.csv`` y ``test.csv`` (salida congelada del paso 3)."""
    return (pd.read_csv(config.PROCESSED_DIR / "train.csv"),
            pd.read_csv(config.PROCESSED_DIR / "test.csv"))


def separar_xy(df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
    """Separa variables y objetivo; conserva ``sexo`` y texto para auditoría y NLP (no entran al modelo)."""
    return df.drop(columns=[config.TARGET]), df[config.TARGET].to_numpy(dtype=int)

"""Contrato de datos, limpieza, partición e imputación (paso 3)."""

from __future__ import annotations

import pandas as pd
import pytest

from credit_risk import config
from credit_risk.data import (
    ReporteLimpieza,
    aprender_imputacion,
    dividir,
    hash_archivo,
    limpiar,
    preparar_procesados,
    validar_dataset,
)


def test_contrato_del_dataset_real(crudo: pd.DataFrame) -> None:
    v = validar_dataset(crudo)
    assert v["ok"], v
    assert v["columnas_faltantes"] == []


def test_limpiar_quita_duplicados_e_invalidos(crudo: pd.DataFrame) -> None:
    rep = ReporteLimpieza()
    df = limpiar(crudo, rep)
    assert df[config.ID_COL].is_unique
    assert rep.duplicados_exactos + rep.duplicados_id > 0
    assert df["edad"].dropna().between(*config.EDAD_VALIDA).all()
    for col, validas in config.CATEGORIAS.items():
        assert set(df[col].dropna().unique()) <= set(validas), col
    assert set(df[config.TARGET].unique()) <= {0, 1}
    assert rep.filas_finales == len(df)


def test_dividir_estratificado_y_determinista(crudo: pd.DataFrame) -> None:
    df = limpiar(crudo)
    tr1, te1 = dividir(df)
    tr2, _ = dividir(df)
    assert len(te1) / len(df) == pytest.approx(config.TEST_SIZE, abs=0.01)
    assert abs(tr1[config.TARGET].mean() - te1[config.TARGET].mean()) < 0.01
    assert tr1[config.ID_COL].tolist() == tr2[config.ID_COL].tolist()
    assert set(tr1[config.ID_COL]).isdisjoint(te1[config.ID_COL])


def test_imputacion_aprende_solo_de_train(crudo: pd.DataFrame) -> None:
    train, test = dividir(limpiar(crudo))
    reglas = aprender_imputacion(train)
    assert reglas.mediana["ingreso_mensual"] == round(float(train["ingreso_mensual"].median()), 4)
    imputado = reglas.aplicar(test)
    assert imputado[config.NUM_COLS_RAW + config.CAT_COLS].isna().sum().sum() == 0
    desconocidos = (imputado["situacion_laboral"] == config.CATEGORIA_DESCONOCIDA).sum()
    assert desconocidos == test["situacion_laboral"].isna().sum()


def test_preparar_procesados_sin_nulos_ni_duplicados(crudo: pd.DataFrame) -> None:
    out = preparar_procesados(crudo, escribir=False)
    for d in (out["train"], out["test"]):
        assert d[config.NUM_COLS_RAW + config.CAT_COLS].isna().sum().sum() == 0
        assert not d.duplicated().any()
        assert set(config.DERIVADAS) <= set(d.columns)


def test_hash_estable(tmp_path) -> None:
    p = tmp_path / "x.csv"
    p.write_text("a,b\n1,2\n", encoding="utf-8")
    assert hash_archivo(p) == hash_archivo(p)
    assert len(hash_archivo(p)) == 64


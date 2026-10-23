"""Variables derivadas, capping sin fuga y preprocesador (pasos 3 y 4)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from credit_risk import config
from credit_risk.features import (
    Winsorizer,
    build_pipeline,
    build_preprocessor,
    columnas_modelo,
    crear_variables,
    variable_original,
)


def _fila(**kw: object) -> pd.DataFrame:
    base = {"monto_credito": 12_000_000.0, "ingreso_mensual": 3_000_000.0, "plazo_meses": 24,
            "tasa_interes_anual": 24.0, "edad": 30, "moras_ultimos_12m": 0, config.TEXT_COL: "hola mundo"}
    base.update(kw)
    return pd.DataFrame([base])


def test_cuota_por_amortizacion_francesa() -> None:
    d = crear_variables(_fila())
    r = 0.24 / 12
    esperado = 12_000_000 * r / (1 - (1 + r) ** -24)
    assert d["cuota_estimada"].iloc[0] == pytest.approx(esperado)
    assert d["ratio_cuota_ingreso"].iloc[0] == pytest.approx(esperado / 3_000_000)
    assert d["ratio_monto_ingreso"].iloc[0] == pytest.approx(4.0)


def test_derivadas_categoricas_y_texto() -> None:
    d = crear_variables(pd.concat([_fila(edad=22, moras_ultimos_12m=2),
                                   _fila(edad=70, **{config.TEXT_COL: config.TEXTO_FALTANTE}),
                                   _fila(edad=np.nan, tasa_interes_anual=0.0)]))
    assert d["rango_edad"].tolist()[:2] == ["18-25", ">60"]
    assert pd.isna(d["rango_edad"].iloc[2])
    assert d["tiene_moras_previas"].tolist() == [1, 0, 0]
    assert d["longitud_texto"].tolist() == [10, 0, 10]
    assert d["cuota_estimada"].iloc[2] == pytest.approx(12_000_000 / 24)


def test_winsorizer_aprende_solo_en_train() -> None:
    train = pd.DataFrame({"ingreso_mensual": np.arange(1, 101, dtype=float)})
    test = pd.DataFrame({"ingreso_mensual": [-1e9, 50.0, 1e9]})
    w = Winsorizer(columnas=["ingreso_mensual"]).fit(train)
    lo, hi = w.limites_["ingreso_mensual"]
    assert (lo, hi) == (pytest.approx(train["ingreso_mensual"].quantile(0.01)),
                        pytest.approx(train["ingreso_mensual"].quantile(0.99)))
    out = w.transform(test)["ingreso_mensual"].tolist()
    assert out == [pytest.approx(lo), 50.0, pytest.approx(hi)]


def test_variante_sin_edad_excluye_edad_y_rango() -> None:
    cols = columnas_modelo(config.VARIABLES_EDAD)
    assert "edad" not in cols["numericas"] and "rango_edad" not in cols["ordinales"]
    assert "nivel_educativo" in cols["ordinales"]
    assert "longitud_texto" not in columnas_modelo()["numericas"]


def test_preprocesador_y_pipeline(muestra: tuple[pd.DataFrame, np.ndarray]) -> None:
    X, y = muestra
    pre = build_preprocessor().fit(crear_variables(X))
    nombres = list(pre.get_feature_names_out())
    assert config.SENSITIVE_COL not in nombres and config.TEXT_COL not in nombres
    assert {"nivel_educativo", "rango_edad"} <= set(nombres)
    pipe = build_pipeline(LogisticRegression(max_iter=2000)).fit(X, y)
    p = pipe.predict_proba(X.head(5))[:, 1]
    assert ((p > 0) & (p < 1)).all()


def test_variable_original() -> None:
    assert variable_original("proposito_Vivienda") == "proposito"
    assert variable_original("puntaje_buro") == "puntaje_buro"

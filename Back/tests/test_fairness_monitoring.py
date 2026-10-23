"""Equidad (grupos, DI, reweighing) y monitoreo (PSI)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from credit_risk import config
from credit_risk.fairness import Reweighing, auditar, disparate_impact, grupo_edad, pesos_kamiran_calders, tabla_grupos
from credit_risk.features import build_pipeline
from credit_risk.models import umbrales_chow
from credit_risk.monitoring import estado_psi, psi, psi_por_variable


def test_grupos_de_edad() -> None:
    g = grupo_edad(pd.Series([18, 29, 30, 59, 60, np.nan]))
    assert g.tolist() == ["18-29", "18-29", "30-59", "30-59", "60+", config.GRUPO_EDAD_DESCONOCIDO]


def test_kamiran_calders_independiza_grupo_y_objetivo() -> None:
    rng = np.random.default_rng(1)
    g = rng.choice(["a", "b"], 4000, p=[0.3, 0.7])
    y = (rng.random(4000) < np.where(g == "a", 0.6, 0.2)).astype(int)
    w = pesos_kamiran_calders(g, y)
    tasas = [np.average(y[g == k], weights=w[g == k]) for k in ("a", "b")]
    assert tasas[0] == pytest.approx(tasas[1], abs=1e-9)


def test_disparate_impact_ignora_grupos_pequenos() -> None:
    t = pd.DataFrame({"tasa_aprobacion": [0.5, 0.4, 0.01], "n": [100, 100, 5]}, index=["a", "b", "c"])
    t["cuenta_para_di"] = t["n"] >= config.N_MINIMO_GRUPO
    assert disparate_impact(t) == pytest.approx(0.8)


def test_tabla_y_auditoria(muestra: tuple[pd.DataFrame, np.ndarray]) -> None:
    X, y = muestra
    p = np.clip(0.1 + 0.6 * y + np.random.default_rng(2).normal(0, 0.1, len(y)), 0, 1)
    u = umbrales_chow()
    t = tabla_grupos(grupo_edad(X["edad"]), y, p, u)
    assert {"tasa_aprobacion", "aprobacion_buenos_pagadores", "error_calibracion"} <= set(t.columns)
    a = auditar(X, y, p, u, bootstrap=False)
    assert {"sexo", "edad", "cumple_todo"} <= set(a)


def test_reweighing_entrena_y_predice(muestra: tuple[pd.DataFrame, np.ndarray]) -> None:
    X, y = muestra
    m = Reweighing(build_pipeline(LogisticRegression(max_iter=2000))).fit(X, y)
    assert m.predict_proba(X.head(3)).shape == (3, 2)


def test_psi() -> None:
    rng = np.random.default_rng(3)
    a = rng.normal(0, 1, 5000)
    assert psi(a, rng.normal(0, 1, 5000)) < config.PSI_ESTABLE
    assert psi(a, rng.normal(1.5, 1, 5000)) >= config.PSI_ALERTA
    assert estado_psi(0.05) == "estable" and estado_psi(0.2) == "vigilar" and estado_psi(0.3) == "recalibrar"
    assert psi(pd.Series(["x", "y"] * 50), pd.Series(["x"] * 100)) > 0


def test_psi_por_variable(particion: tuple[pd.DataFrame, pd.DataFrame]) -> None:
    tr, te = particion
    t = psi_por_variable(tr, te)
    assert len(t) == len(config.INPUT_COLS) and (t["estado"] == "estable").all()

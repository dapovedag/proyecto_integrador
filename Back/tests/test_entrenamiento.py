"""Protocolo completo del modelo servido (train.py) en modo rápido y sin escribir artefactos."""

from __future__ import annotations

from typing import Any

import pytest

from credit_risk import __version__
from credit_risk.entrenamiento import VARIANTES, entrenar


@pytest.fixture(scope="module")
def card() -> dict[str, Any]:
    return entrenar(rapido=True, escribir=False, log=lambda _: None)


@pytest.mark.slow
def test_card_completa_y_coherente(card: dict[str, Any]) -> None:
    assert card["version"] == __version__
    assert card["variante_equidad"] in VARIANTES
    u = card["umbrales"]
    assert 0 < u["aprobar"] < u["bayes"] < u["rechazar"] < 1
    assert card["bandas_riesgo"]["Medio"] == [u["aprobar"], u["rechazar"]]
    d = card["decision_test"]
    assert d["tasa_aprobacion"] + d["tasa_revision"] + d["tasa_rechazo"] == pytest.approx(1, abs=1e-3)
    assert card["metricas_test"]["roc_auc"] >= 0.70
    assert len(card["variantes_equidad"]) == len(VARIANTES)
    assert {"sexo", "edad", "cumple_todo"} <= set(card["equidad_test"])
    assert card["monitoreo"]["estado"] in {"estable", "vigilar", "recalibrar"}


@pytest.mark.slow
def test_seleccion_por_cv_y_parsimonia(card: dict[str, Any]) -> None:
    sel = card["seleccion_cv_train"]
    assert set(sel) == {"Regresión logística", "Gradient Boosting (HGB)"}
    lr, hgb = sel["Regresión logística"]["roc_auc_cv"], sel["Gradient Boosting (HGB)"]["roc_auc_cv"]
    if hgb - lr < 0.005:
        assert card["familia"] == "Regresión logística"


@pytest.mark.slow
def test_variante_elegida_cumple_equidad_o_declara_excepcion(card: dict[str, Any]) -> None:
    elegida = next(v for v in card["variantes_equidad"] if v["variante"] == card["variante_equidad"])
    assert elegida["cumple_equidad"] or card["excepcion_equidad"]

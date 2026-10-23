"""Política de decisión (regla de Chow), métricas, costos y calibración."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from credit_risk import config
from credit_risk.explain import Explicador, _logit
from credit_risk.features import build_pipeline
from credit_risk.models import Costos, banda, calibrado, costo_esperado, decidir, metricas, sensibilidad, umbrales_chow


def test_umbrales_de_chow_en_forma_cerrada() -> None:
    u = umbrales_chow(Costos(fn=0.45, fp=0.15, revision=0.08))
    assert u.aprobar == pytest.approx(0.08 / 0.45)
    assert u.rechazar == pytest.approx(1 - 0.08 / 0.15)
    assert u.bayes == pytest.approx(0.25)
    assert u.aprobar < u.bayes < u.rechazar


def test_sin_banda_de_revision_si_revisar_es_caro() -> None:
    with pytest.raises(ValueError):
        umbrales_chow(Costos(fn=0.45, fp=0.15, revision=0.2))


def test_banda_y_decision_coherentes_por_construccion() -> None:
    u = umbrales_chow()
    p = np.linspace(0, 1, 1001)
    d, b = decidir(p, u), banda(p, u)
    mapa = {"aprobar": "Bajo", "revisar": "Medio", "rechazar": "Alto"}
    assert all(mapa[x] == y for x, y in zip(d, b, strict=True))
    orden = {"aprobar": 0, "revisar": 1, "rechazar": 2}
    assert np.all(np.diff([orden[x] for x in d]) >= 0)  # monótona en p


def test_costo_esperado_a_mano() -> None:
    u = umbrales_chow()
    y = np.array([1, 0, 0, 1])
    p = np.array([0.05, 0.9, 0.3, 0.3])  # aprobar(malo), rechazar(bueno), revisar, revisar
    c = costo_esperado(y, p, u, Costos())
    assert c["costo_medio"] == pytest.approx((0.45 + 0.15 + 0.08 + 0.08) / 4, abs=1e-5)
    assert (c["tasa_aprobacion"], c["tasa_revision"], c["tasa_rechazo"]) == (0.25, 0.5, 0.25)


def test_metricas_rango() -> None:
    rng = np.random.default_rng(0)
    y = rng.integers(0, 2, 500)
    p = np.clip(y * 0.6 + rng.normal(0.2, 0.2, 500), 0, 1)
    m = metricas(y, p, 0.5)
    assert set(m) >= {"roc_auc", "pr_auc", "ks", "brier", "f1", "recall", "precision", "accuracy"}
    assert 0.5 < m["roc_auc"] <= 1 and 0 <= m["ks"] <= 1


def test_sensibilidad_tiene_todas_las_combinaciones() -> None:
    s = sensibilidad()
    assert len(s) == len(config.SENSIBILIDAD_LGD) * len(config.SENSIBILIDAD_MARGEN)


@pytest.mark.slow
def test_calibrado_ensemble_false_y_contribuciones_exactas(muestra: tuple[pd.DataFrame, np.ndarray]) -> None:
    X, y = muestra
    modelo = calibrado(build_pipeline(LogisticRegression(max_iter=3000)), cv=3).fit(X, y)
    assert len(modelo.calibrated_classifiers_) == 1  # ensemble=False: un solo estimador base
    exp = Explicador(modelo, X)
    filas = X.head(25)
    p = modelo.predict_proba(filas)[:, 1]
    contrib = exp.contribuciones(modelo, filas)
    for pi, ci in zip(p, contrib, strict=True):
        assert exp.base_logit + sum(c["contribucion"] for c in ci) == pytest.approx(_logit(pi), abs=2e-3)

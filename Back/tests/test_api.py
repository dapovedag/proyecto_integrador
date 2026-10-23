"""Contrato de la API v2 (IA3.4, IA3.E3). Requiere los artefactos v2 de ``train.py``."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from api.main import app, service
from api.service import ModelService

BACK = Path(__file__).resolve().parents[1]
EJEMPLO: dict[str, Any] = json.loads((BACK / "api" / "ejemplo_request.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:  # ejecuta el lifespan (carga de artefactos)
        yield c


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    b = r.json()
    assert b["status"] == "ok" and b["modelo_cargado"] is True, service.error
    assert b["modelo_version"] == b["api_version"]
    assert r.headers.get("X-Request-ID")


def test_model_info(client: TestClient) -> None:
    b = client.get("/model/info").json()
    u = b["umbrales"]
    assert 0 < u["aprobar"] < u["bayes"] < u["rechazar"] < 1
    assert b["bandas_riesgo"]["Bajo"][1] == pytest.approx(u["aprobar"])
    assert b["decisiones"] == {"Bajo": "aprobar", "Medio": "revisar", "Alto": "rechazar"}
    assert b["metricas_test"]["roc_auc"] >= 0.70


def test_predict_valido_y_coherente(client: TestClient) -> None:
    r = client.post("/predict", json=EJEMPLO)
    assert r.status_code == 200, r.text
    b = r.json()
    u = b["umbrales"]
    p = b["probabilidad_impago"]
    esperado = "aprobar" if p < u["aprobar"] else "rechazar" if p > u["rechazar"] else "revisar"
    assert b["decision"] == esperado
    assert {"aprobar": "Bajo", "revisar": "Medio", "rechazar": "Alto"}[b["decision"]] == b["banda_riesgo"]
    assert b["prediccion"] == int(b["decision"] == "rechazar")
    assert b["factores_principales"] and all("contribucion" in f for f in b["factores_principales"])


def test_sexo_no_cambia_la_prediccion(client: TestClient) -> None:
    pf = client.post("/predict", json=dict(EJEMPLO, sexo="F")).json()["probabilidad_impago"]
    pm = client.post("/predict", json=dict(EJEMPLO, sexo="M")).json()["probabilidad_impago"]
    assert pf == pm


@pytest.mark.parametrize("cambio", [{"edad": 5}, {"proposito": "Viajes"}, {"ingreso": 1000}])
def test_predict_invalido_422(client: TestClient, cambio: dict[str, Any]) -> None:
    r = client.post("/predict", json=dict(EJEMPLO, **cambio))
    assert r.status_code == 422
    campo = r.json()["detail"][0]["loc"][-1]
    assert campo == next(iter(cambio))


def test_batch_limites(client: TestClient) -> None:
    r = client.post("/predict/batch", json={"clientes": [EJEMPLO, dict(EJEMPLO, moras_ultimos_12m=5)]})
    assert r.status_code == 200 and r.json()["total"] == 2
    assert client.post("/predict/batch", json={"clientes": []}).status_code == 422
    assert client.post("/predict/batch", json={"clientes": [EJEMPLO] * 1001}).status_code == 422


def test_predict_text(client: TestClient) -> None:
    r = client.post("/predict/text", json={"texto": "Me atrasé en pagos por pérdida de empleo y tengo deudas."})
    assert r.status_code == 200
    b = r.json()
    assert b["sentimiento"] == "negativo" and b["banda_riesgo"] in ("Bajo", "Medio", "Alto")
    assert client.post("/predict/text", json={"texto": ""}).status_code == 422


def test_servicio_degradado_responde_503(tmp_path: Path, client: TestClient) -> None:
    vacio = ModelService(tmp_path)
    vacio.cargar()
    assert not vacio.cargado and vacio.error
    original = service.artefactos
    try:
        service.artefactos = {}
        assert client.get("/health").json()["status"] == "degradado"
        assert client.post("/predict", json=EJEMPLO).status_code == 503
        assert client.get("/model/info").status_code == 503
    finally:
        service.artefactos = original


def test_clientes_demo_en_su_banda(client: TestClient) -> None:
    """Los clientes de la demo (notebook 00, front) caen en aprobar / revisar / rechazar con el modelo servido."""
    from credit_risk.demo import CLIENTES_DEMO

    esperado = {"bajo": "aprobar", "medio": "revisar", "alto": "rechazar"}
    for nombre, cliente in CLIENTES_DEMO.items():
        assert client.post("/predict", json=cliente).json()["decision"] == esperado[nombre], nombre

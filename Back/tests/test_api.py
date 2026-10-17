import json
import sys
from pathlib import Path

BACK = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACK))
sys.path.insert(0, str(BACK / "src"))

from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402

client = TestClient(app)
EJEMPLO = json.loads((BACK / "api" / "ejemplo_request.json").read_text(encoding="utf-8"))


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok" and body["modelo_cargado"] is True


def test_predict_valido():
    r = client.post("/predict", json=EJEMPLO)
    assert r.status_code == 200, r.text
    b = r.json()
    assert 0.0 <= b["probabilidad_impago"] <= 1.0
    assert b["prediccion"] in (0, 1)
    assert b["banda_riesgo"] in ("Bajo", "Medio", "Alto")
    assert len(b["factores_principales"]) == 3


def test_predict_invalido_422():
    malo = dict(EJEMPLO, edad=5, proposito="Viajes")
    r = client.post("/predict", json=malo)
    assert r.status_code == 422


def test_predict_batch():
    r = client.post("/predict/batch", json={"clientes": [EJEMPLO, dict(EJEMPLO, moras_ultimos_12m=5)]})
    assert r.status_code == 200
    assert r.json()["total"] == 2


def test_predict_text():
    r = client.post("/predict/text", json={"texto": "Me atrasé en pagos por pérdida de empleo."})
    assert r.status_code == 200
    assert r.json()["sentimiento"] == "negativo"

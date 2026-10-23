"""Contratos de resultados y coherencia del paquete de corrida que consume el front (ADR-004)."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from credit_risk import __version__, config
from credit_risk.data import hash_archivo
from credit_risk.prediccion import cargar_artefactos
from credit_risk.schemas_resultados import ESQUEMAS, FilaModelo, Metricas, Resultados, guardar_resultados

GEN = config.FRONT_DATA_DIR


@pytest.mark.parametrize("nombre", sorted(ESQUEMAS))
def test_resultados_reales_cumplen_su_esquema(nombre: str) -> None:
    ruta = config.MODEL_DIR / f"{nombre}.json"
    if not ruta.exists():
        pytest.skip(f"{nombre}.json aún no generado")
    res = ESQUEMAS[nombre].model_validate(json.loads(ruta.read_text(encoding="utf-8")))
    assert res.modelos and all(0 <= f.test.roc_auc <= 1 for f in res.modelos)


def test_guardar_resultados_valida_y_escribe(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "MODEL_DIR", tmp_path)
    m = Metricas(roc_auc=0.8, pr_auc=0.7, ks=0.5, brier=0.15, accuracy=0.7, precision=0.6, recall=0.8, f1=0.68)
    fila = FilaModelo(modelo="x", familia="clásico", test=m, interpretabilidad="alta")
    ruta = guardar_resultados(Resultados(notebook="nb.ipynb", umbral_metricas=0.25, modelos=[fila]), "prueba")
    assert json.loads(ruta.read_text(encoding="utf-8"))["modelos"][0]["modelo"] == "x"


def _manifest() -> dict:
    ruta = GEN / "manifest.json"
    if not ruta.exists():
        pytest.skip("paquete de corrida no generado")
    return json.loads(ruta.read_text(encoding="utf-8"))


def test_manifest_hashes_y_version() -> None:
    m = _manifest()
    assert m["version"] == m["card_version"] == __version__
    for rel, meta in m["archivos"].items():
        assert hash_archivo(config.FRONT_DIR / rel) == meta["sha256"], rel
    card = json.loads((config.MODEL_DIR / "model_card.json").read_text(encoding="utf-8"))
    assert m["datos"]["train_sha256"] == card["datos"]["hash_train_sha256"]
    assert hash_archivo(config.PROCESSED_DIR / "train.csv") == card["datos"]["hash_train_sha256"]
    assert hash_archivo(config.PROCESSED_DIR / "test.csv") == card["datos"]["hash_test_sha256"]


def test_golden_coincide_con_el_artefacto_servido() -> None:
    """Si se reentrena sin volver a exportar, el front quedaría desfasado: esta prueba lo detecta."""
    _manifest()
    golden = json.loads((GEN / "golden.json").read_text(encoding="utf-8"))
    art = cargar_artefactos()
    clientes = [c["entrada"] for c in golden["clientes"]]
    p = art["artefacto"].modelo.predict_proba(art["artefacto"].a_dataframe(clientes))[:, 1]
    assert np.max(np.abs(p - np.array([c["p"] for c in golden["clientes"]]))) < 1e-9
    for caso in golden["textos"][:10]:
        assert art["modelo_texto"].predecir(caso["texto"]) == caso["salida"]

"""La imagen Docker de la API es mínima y autosuficiente (IA3.5): arranca sin el venv de desarrollo.

Se omite si Docker no está disponible o la imagen no se ha construido (`docker compose build` en Back/).
"""

from __future__ import annotations

import json
import shutil
import subprocess

import pytest

from credit_risk import __version__

IMAGEN = f"riesgo-credito-api:{__version__}"


def _docker(*args: str, timeout: int = 180) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["docker", *args], capture_output=True, text=True, timeout=timeout)


@pytest.fixture(scope="module")
def imagen() -> str:
    if shutil.which("docker") is None or _docker("info", timeout=30).returncode != 0:
        pytest.skip("Docker no disponible")
    if _docker("image", "inspect", IMAGEN, timeout=30).returncode != 0:
        pytest.skip(f"imagen {IMAGEN} no construida")
    return IMAGEN


@pytest.mark.slow
def test_imagen_sin_dependencias_pesadas_y_sin_root(imagen: str) -> None:
    modulos = "['torch','tensorflow','shap','matplotlib','api']"
    codigo = ("import importlib.util as u, json, os;"
              f"print(json.dumps({{m: u.find_spec(m) is not None for m in {modulos}}} | {{'uid': os.getuid()}}))")
    r = _docker("run", "--rm", "--entrypoint", "python", imagen, "-c", codigo)
    assert r.returncode == 0, r.stderr
    info = json.loads(r.stdout.strip().splitlines()[-1])
    assert info["api"] and not any(info[m] for m in ["torch", "tensorflow", "shap", "matplotlib"])
    assert info["uid"] != 0


@pytest.mark.slow
def test_imagen_carga_artefactos_y_predice(imagen: str) -> None:
    from credit_risk.demo import CLIENTES_DEMO

    codigo = ("import json, sys\n"
              "from api.main import service\n"
              "from api.schemas import ClienteRequest\n"
              "service.cargar()\n"
              "c = ClienteRequest(**json.loads(sys.argv[1])).model_dump()\n"
              "print(service.cargado, service.version, service.predecir([c])[0]['decision'])")
    r = _docker("run", "--rm", "--entrypoint", "python", imagen, "-c", codigo, json.dumps(CLIENTES_DEMO["medio"]))
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip().splitlines()[-1] == f"True {__version__} revisar"

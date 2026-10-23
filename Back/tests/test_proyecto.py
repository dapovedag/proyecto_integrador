"""Reglas del proyecto que se verifican con código (no con buena voluntad)."""

from __future__ import annotations

from pathlib import Path

from credit_risk import __version__, config

BACK = Path(__file__).resolve().parents[1]
NO_PYTHON = {".r", ".rmd", ".ps1", ".psm1", ".bat", ".cmd", ".sh", ".jl", ".scala", ".java"}


def test_back_solo_python() -> None:
    """Todo el back se escribe en Python: no hay scripts de otros lenguajes."""
    ignorar = {".venv", "__pycache__", ".pytest_cache", ".ipynb_checkpoints", "node_modules"}
    ajenos = [p.relative_to(BACK).as_posix() for p in BACK.rglob("*")
              if p.is_file() and p.suffix.lower() in NO_PYTHON and not ignorar & set(p.parts)]
    assert ajenos == [], ajenos


def test_version_unica() -> None:
    assert __version__ == config.MODEL_VERSION
    compose = (BACK / "docker-compose.yml").read_text(encoding="utf-8")
    assert f":{__version__}" in compose, "La imagen de docker-compose debe llevar la versión del paquete"


def test_rutas_relativas_al_proyecto() -> None:
    assert config.RAW_DATA_PATH.is_relative_to(config.PROJECT_ROOT) or config.RAW_DATA_PATH.exists()
    assert config.BACK_DIR == BACK

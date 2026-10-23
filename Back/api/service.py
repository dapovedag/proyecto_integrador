"""Servicio de modelos: carga atómica de artefactos y predicción delegada en ``credit_risk``.

La API no reimplementa nada: usa ``ArtefactoModelo.predecir`` y ``ArtefactoTexto.predecir``,
los mismos objetos que valida ``train.py`` y que usa el notebook 00.
"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any

BACK_DIR = Path(__file__).resolve().parents[1]
try:
    import credit_risk  # noqa: F401
except ModuleNotFoundError:  # despliegues sin el paquete instalado (Vercel, Docker): usar src/
    sys.path.insert(0, str(BACK_DIR / "src"))

from credit_risk import config  # noqa: E402
from credit_risk.prediccion import cargar_artefactos  # noqa: E402

logger = logging.getLogger("api.service")


class ModelService:
    """Mantiene los artefactos en memoria. Si falta cualquiera, el servicio queda NO cargado (503)."""

    def __init__(self, model_dir: str | Path | None = None) -> None:
        self.model_dir = Path(model_dir or os.getenv("MODEL_DIR") or BACK_DIR / "models")
        self.artefactos: dict[str, Any] = {}
        self.error: str | None = None

    def cargar(self) -> None:
        """Carga atómica de ``modelo_final.joblib``, ``modelo_nlp.joblib`` y ``model_card.json``."""
        try:
            self.artefactos = cargar_artefactos(self.model_dir)
            self.error = None
            logger.info("modelos cargados version=%s", self.version)
        except Exception as e:  # noqa: BLE001 — cualquier fallo deja el servicio degradado, nunca a medias
            self.artefactos, self.error = {}, f"{type(e).__name__}: {e}"
            logger.error("no se pudieron cargar los modelos: %s", self.error)

    @property
    def cargado(self) -> bool:
        return bool(self.artefactos)

    @property
    def card(self) -> dict[str, Any]:
        return self.artefactos.get("card", {})

    @property
    def version(self) -> str:
        return str(self.card.get("version", config.MODEL_VERSION))

    def predecir(self, clientes: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Predicción por lotes con el artefacto tabular."""
        res = self.artefactos["artefacto"].predecir(clientes)
        for r in res:
            logger.info("prediccion p=%.4f decision=%s", r["probabilidad_impago"], r["decision"])
        return res

    def predecir_texto(self, texto: str) -> dict[str, Any]:
        """Probabilidad por texto (TF-IDF calibrado) y sentimiento por léxico."""
        return self.artefactos["modelo_texto"].predecir(texto)

"""Arranque común de los notebooks (P1.1, P1.E1): entorno, semilla, estilo y salidas limpias.

Uso en la primera celda de código::

    from credit_risk.notebook import setup
    ENTORNO = setup()
"""

from __future__ import annotations

import logging
import os
import platform
import random
import sys
import warnings
from importlib import metadata
from pathlib import Path
from typing import Any

from credit_risk import config

LIBRERIAS = ["pandas", "numpy", "matplotlib", "seaborn", "scikit-learn", "duckdb", "plotnine"]


def en_colab() -> bool:
    """True si el notebook corre en Google Colab (P1.1)."""
    return "google.colab" in sys.modules


def _silenciar() -> None:
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
    os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
    os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    warnings.filterwarnings("ignore")
    for nombre in ("tensorflow", "absl", "transformers", "sentence_transformers", "py4j", "matplotlib",
                   "urllib3", "huggingface_hub", "numexpr"):
        logging.getLogger(nombre).setLevel(logging.ERROR)


def versiones(paquetes: list[str] | None = None) -> dict[str, str]:
    """Versión instalada de cada librería (o 'no instalada')."""
    out = {"python": platform.python_version()}
    for p in paquetes or LIBRERIAS:
        try:
            out[p] = metadata.version(p)
        except metadata.PackageNotFoundError:
            out[p] = "no instalada"
    return out


def setup(estilo: bool = True, paquetes: list[str] | None = None, torch_primero: bool = False) -> dict[str, Any]:
    """Fija semilla, silencia logs ruidosos, aplica el estilo visual y devuelve el entorno.

    ``torch_primero=True`` importa PyTorch antes que scikit-learn: en Windows, cargar sklearn primero hace
    fallar la DLL ``c10.dll`` de torch (WinError 1114; diagnóstico en ADR-006).
    """
    _silenciar()
    if torch_primero:
        import torch  # noqa: F401
    random.seed(config.RANDOM_STATE)
    try:
        import numpy as np

        np.random.seed(config.RANDOM_STATE)
    except ImportError:  # pragma: no cover
        pass
    try:
        import pandas as pd

        pd.options.display.max_columns = 40
        pd.options.display.width = 140
        pd.options.display.float_format = "{:,.4f}".format
    except ImportError:  # pragma: no cover
        pass
    if estilo:
        from credit_risk.reporting import aplicar_estilo

        aplicar_estilo()
    return {"entorno": "Google Colab" if en_colab() else "Jupyter local",
            "kernel": "credit-risk", "semilla": config.RANDOM_STATE, "versiones": versiones(paquetes)}


def ruta(p: str | Path) -> str:
    """Ruta relativa a la raíz del proyecto, para imprimir sin exponer rutas absolutas."""
    try:
        return Path(p).resolve().relative_to(config.PROJECT_ROOT).as_posix()
    except ValueError:
        return Path(p).name

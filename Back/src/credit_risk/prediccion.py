"""Artefacto servido y predicción única (la usan la API, el notebook 00 y las pruebas).

``modelo_final.joblib`` guarda un ``ArtefactoModelo``: el modelo calibrado, el explicador, los
umbrales de decisión y la versión. Así todo el que prediga aplica la misma política.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from credit_risk import config
from credit_risk.explain import Explicador
from credit_risk.models import Umbrales, banda, decidir


@dataclass
class ArtefactoModelo:
    """Todo lo necesario para predecir y explicar, versionado como una sola unidad."""

    modelo: Any
    explicador: Explicador
    umbrales: Umbrales
    version: str = config.MODEL_VERSION
    variante: str = "base"
    columnas_entrada: list[str] = field(default_factory=lambda: list(config.INPUT_COLS))

    def a_dataframe(self, clientes: list[dict[str, Any]]) -> pd.DataFrame:
        """Convierte diccionarios de clientes en el DataFrame que espera el pipeline (tipos numéricos)."""
        df = pd.DataFrame(clientes)
        for c in self.columnas_entrada:
            if c not in df:
                df[c] = np.nan
        for c in config.NUM_COLS_RAW:
            df[c] = pd.to_numeric(df[c], errors="coerce").astype(float)
        # SimpleImputer detecta faltantes en columnas de texto con ``X != X``: None no cumple, NaN sí.
        for c in df.columns.difference(config.NUM_COLS_RAW):
            df[c] = df[c].astype(object).where(df[c].notna(), np.nan)
        return df

    def predecir(self, clientes: list[dict[str, Any]], top_factores: int = 5) -> list[dict[str, Any]]:
        """Probabilidad calibrada, decisión, banda y contribuciones por cliente."""
        X = self.a_dataframe(clientes)
        p = self.modelo.predict_proba(X)[:, 1]
        decisiones = decidir(p, self.umbrales)
        bandas = banda(p, self.umbrales)
        contrib = self.explicador.contribuciones(self.modelo, X, top=top_factores)
        return [{
            "probabilidad_impago": round(float(pi), 4),
            "decision": str(di),
            "banda_riesgo": str(bi),
            "prediccion": int(di == "rechazar"),
            "etiqueta": "Impago" if di == "rechazar" else ("Revisión manual" if di == "revisar" else "No impago"),
            "umbrales": self.umbrales.como_dict(),
            "factores_principales": ci,
            "modelo_version": self.version,
        } for pi, di, bi, ci in zip(p, decisiones, bandas, contrib, strict=True)]


def cargar_artefactos(model_dir: str | Path | None = None) -> dict[str, Any]:
    """Carga el artefacto tabular, el modelo de texto y la model card (falla si falta alguno)."""
    d = Path(model_dir or config.MODEL_DIR)
    artefacto = joblib.load(d / "modelo_final.joblib")
    modelo_texto = joblib.load(d / "modelo_nlp.joblib")
    with open(d / "model_card.json", encoding="utf-8") as f:
        card = json.load(f)
    if not isinstance(artefacto, ArtefactoModelo):
        raise TypeError("modelo_final.joblib no es un ArtefactoModelo v2: ejecute Back/train.py")
    return {"artefacto": artefacto, "modelo_texto": modelo_texto, "card": card}


def predecir_cliente(cliente: dict[str, Any], artefactos: dict[str, Any] | None = None) -> dict[str, Any]:
    """Predicción de un solo cliente (función pedida por el paso 11 para el notebook final)."""
    art = (artefactos or cargar_artefactos())["artefacto"]
    return art.predecir([cliente])[0]

"""Contratos de los resultados que producen los notebooks (pasos 5, 6, 7 y 9) y que consume el front.

Cada notebook valida su salida con estos modelos antes de escribirla (``guardar_resultados``); el
exportador genera JSON Schema a partir de ellos y el front deriva sus tipos TypeScript. Así un cambio
de forma rompe el build en lugar de romper la página.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from credit_risk import config
from credit_risk.reporting import guardar_json

Familia = Literal["línea base", "clásico", "deep learning", "nlp", "big data", "final"]


class Metricas(BaseModel):
    model_config = ConfigDict(extra="forbid")
    roc_auc: float
    pr_auc: float
    ks: float
    brier: float
    accuracy: float
    precision: float
    recall: float
    f1: float


class Curvas(BaseModel):
    fpr: list[float]
    tpr: list[float]
    recall: list[float]
    precision: list[float]
    calib_prob_media: list[float] = []
    calib_frac_positivos: list[float] = []


class FilaModelo(BaseModel):
    """Una fila de la tabla comparativa global (clásicos, DL, NLP, Spark y final)."""

    modelo: str
    familia: Familia
    roc_auc_cv: float | None = None
    roc_auc_cv_std: float | None = None
    test: Metricas
    tiempo_entrenamiento_s: float | None = None
    interpretabilidad: Literal["alta", "media", "baja"]
    notas: str = ""


class Resultados(BaseModel):
    """Base común: versión del paquete, fecha y notebook que los produjo."""

    version: str = config.MODEL_VERSION
    generado: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    notebook: str
    umbral_metricas: float
    modelos: list[FilaModelo]
    curvas: dict[str, Curvas] = {}


class ResultadosClasicos(Resultados):
    matrices_confusion: dict[str, list[list[int]]]
    coeficientes_lr: list[dict[str, float | str]]
    importancia_permutacion: list[dict[str, float | str]]
    replicacion_german_credit: dict[str, object] | None = None


class ResultadosDL(Resultados):
    backend: str
    historiales: dict[str, dict[str, list[float]]]
    arquitecturas: dict[str, str]
    mejor_red: str


class ResultadosNLP(Resultados):
    terminos_impago: list[dict[str, float | str]]
    terminos_pago: list[dict[str, float | str]]
    sentimiento_vs_impago: list[dict[str, float | str]]
    proyeccion_2d: dict[str, list[list[float]]]
    delta_auc: dict[str, float]


class ResultadosSpark(Resultados):
    version_spark: str
    particiones: list[dict[str, int | str]]
    tasa_por_segmento: list[dict[str, float | str]]
    auc_mllib: float
    auc_sklearn: float
    filas_scoring: int


def guardar_resultados(res: Resultados, nombre: str) -> Path:
    """Valida y escribe ``Back/models/<nombre>.json``."""
    return guardar_json(res.model_dump(mode="json"), config.MODEL_DIR / f"{nombre}.json")


ESQUEMAS: dict[str, type[BaseModel]] = {
    "resultados_clasicos": ResultadosClasicos,
    "resultados_dl": ResultadosDL,
    "resultados_nlp": ResultadosNLP,
    "resultados_spark": ResultadosSpark,
}

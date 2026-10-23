"""Esquemas Pydantic v2 del contrato de la API (v2).

``extra="forbid"``: un campo mal escrito responde 422 en lugar de descartarse en silencio.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Decision = Literal["aprobar", "revisar", "rechazar"]
Banda = Literal["Bajo", "Medio", "Alto"]


class ClienteRequest(BaseModel):
    """Datos de una solicitud. ``sexo`` se recibe solo para auditoría: no entra al modelo."""

    model_config = ConfigDict(extra="forbid", json_schema_extra={"examples": [{
        "edad": 35, "sexo": "F", "estado_civil": "Casado", "nivel_educativo": "Universitario",
        "situacion_laboral": "Empleado", "antiguedad_laboral_anios": 4.5, "personas_a_cargo": 1,
        "tipo_vivienda": "Arriendo", "ingreso_mensual": 4500000, "monto_credito": 20000000, "plazo_meses": 36,
        "tasa_interes_anual": 24.5, "proposito": "Vehiculo", "num_creditos_activos": 2, "moras_ultimos_12m": 0,
        "relacion_deuda_ingreso": 0.32, "puntaje_buro": 720, "uso_cupo_tarjetas": 0.4,
        "texto_solicitud": "Necesito el crédito para comprar un carro para trabajar.",
    }]})

    edad: int = Field(..., ge=18, le=100)
    sexo: Literal["M", "F"] | None = Field(None, description="Solo auditoría; no entra al modelo")
    estado_civil: Literal["Soltero", "Casado", "Union_libre", "Divorciado", "Viudo"]
    nivel_educativo: Literal["Primaria", "Secundaria", "Tecnico", "Universitario", "Posgrado"]
    situacion_laboral: Literal["Empleado", "Independiente", "Pensionado", "Desempleado"] | None = None
    antiguedad_laboral_anios: float | None = Field(None, ge=0, le=70)
    personas_a_cargo: int = Field(..., ge=0, le=20)
    tipo_vivienda: Literal["Arriendo", "Propia", "Familiar"] | None = None
    ingreso_mensual: float | None = Field(None, gt=0)
    monto_credito: float = Field(..., gt=0)
    plazo_meses: int = Field(..., ge=1, le=120)
    tasa_interes_anual: float = Field(..., ge=0, le=100)
    proposito: Literal["Libre_inversion", "Vehiculo", "Consolidacion_deuda", "Vivienda", "Negocio", "Educacion"]
    num_creditos_activos: int = Field(..., ge=0, le=50)
    moras_ultimos_12m: int = Field(..., ge=0, le=12)
    relacion_deuda_ingreso: float | None = Field(None, ge=0, le=5)
    puntaje_buro: float | None = Field(None, ge=150, le=950)
    uso_cupo_tarjetas: float = Field(..., ge=0, le=1)
    texto_solicitud: str | None = Field(None, max_length=5000)


class Factor(BaseModel):
    """Contribución de una variable al log-odds de la probabilidad calibrada (frente al cliente promedio)."""

    variable: str
    contribucion: float
    efecto: Literal["aumenta_riesgo", "reduce_riesgo"]


class Umbrales(BaseModel):
    aprobar: float
    rechazar: float
    bayes: float


class PrediccionResponse(BaseModel):
    probabilidad_impago: float = Field(..., ge=0, le=1)
    decision: Decision
    banda_riesgo: Banda
    prediccion: int = Field(..., description="1 si la decisión es rechazar")
    etiqueta: str
    umbrales: Umbrales
    factores_principales: list[Factor]
    modelo_version: str


class BatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clientes: list[ClienteRequest] = Field(..., min_length=1, max_length=1000)


class BatchResponse(BaseModel):
    resultados: list[PrediccionResponse]
    total: int


class TextoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    texto: str = Field(..., min_length=1, max_length=5000)


class TextoResponse(BaseModel):
    probabilidad_impago_texto: float = Field(..., ge=0, le=1)
    banda_riesgo: Banda
    sentimiento: Literal["positivo", "negativo", "neutral"]
    modelo: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degradado"]
    modelo_version: str
    modelo_cargado: bool
    api_version: str


class ModelCard(BaseModel):
    """Campos garantizados de la model card; el resto de la card se devuelve tal cual."""

    model_config = ConfigDict(extra="allow")

    nombre: str
    version: str
    fecha_entrenamiento: str
    algoritmo: str
    variante_equidad: str
    umbrales: Umbrales
    bandas_riesgo: dict[str, list[float]]
    decisiones: dict[str, Decision]
    metricas_test: dict[str, float]
    equidad_test: dict[str, Any]
    limitaciones: list[str]

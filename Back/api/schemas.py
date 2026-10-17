"""Esquemas Pydantic v2 del contrato de la API."""
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ClienteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    edad: int = Field(..., ge=18, le=100)
    sexo: Optional[Literal["M", "F"]] = Field(None, description="Solo auditoria; no entra al modelo")
    estado_civil: Literal["Soltero", "Casado", "Union_libre", "Divorciado", "Viudo"]
    nivel_educativo: Literal["Primaria", "Secundaria", "Tecnico", "Universitario", "Posgrado"]
    situacion_laboral: Optional[Literal["Empleado", "Independiente", "Pensionado", "Desempleado"]] = None
    antiguedad_laboral_anios: Optional[float] = Field(None, ge=0, le=70)
    personas_a_cargo: int = Field(..., ge=0, le=20)
    tipo_vivienda: Optional[Literal["Arriendo", "Propia", "Familiar"]] = None
    ingreso_mensual: Optional[float] = Field(None, gt=0)
    monto_credito: float = Field(..., gt=0)
    plazo_meses: int = Field(..., ge=1, le=360)
    tasa_interes_anual: float = Field(..., ge=0, le=100)
    proposito: Literal["Libre_inversion", "Vehiculo", "Consolidacion_deuda", "Vivienda", "Negocio", "Educacion"]
    num_creditos_activos: int = Field(..., ge=0, le=50)
    moras_ultimos_12m: int = Field(..., ge=0, le=12)
    relacion_deuda_ingreso: Optional[float] = Field(None, ge=0, le=5)
    puntaje_buro: Optional[float] = Field(None, ge=150, le=950)
    uso_cupo_tarjetas: float = Field(..., ge=0, le=1)
    texto_solicitud: Optional[str] = Field(None, max_length=5000)


class Factor(BaseModel):
    variable: str
    efecto: Literal["aumenta_riesgo", "reduce_riesgo"]


class PrediccionResponse(BaseModel):
    probabilidad_impago: float
    prediccion: int
    etiqueta: str
    banda_riesgo: str
    umbral: float
    factores_principales: List[Factor]
    modelo_version: str


class BatchRequest(BaseModel):
    clientes: List[ClienteRequest] = Field(..., min_length=1, max_length=1000)


class BatchResponse(BaseModel):
    resultados: List[PrediccionResponse]
    total: int


class TextoRequest(BaseModel):
    texto: str = Field(..., min_length=1, max_length=5000)


class TextoResponse(BaseModel):
    probabilidad_impago_texto: float
    banda_riesgo: str
    sentimiento: Literal["positivo", "negativo", "neutral"]
    modelo: str


class HealthResponse(BaseModel):
    status: str
    modelo_version: str
    modelo_cargado: bool

"""Configuracion: rutas relativas a la raiz del proyecto, semilla y columnas."""
import os
from pathlib import Path

BACK_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACK_DIR.parent
DATA_PATH = Path(os.getenv("DATA_PATH", PROJECT_ROOT / "db" / "credit_risk.csv"))
MODEL_DIR = Path(os.getenv("MODEL_DIR", BACK_DIR / "models"))

RANDOM_STATE = 42
MODEL_VERSION = "1.1.0"  # 1.1.0: seleccion por CV, calibracion y umbral por costo (respuesta a QA)
TARGET = "default"
ID_COL = "id_cliente"
TEXT_COL = "texto_solicitud"
SENSITIVE_COL = "sexo"  # solo para auditoria de equidad, NO entra al modelo

NUM_COLS_RAW = [
    "edad", "antiguedad_laboral_anios", "personas_a_cargo", "ingreso_mensual",
    "monto_credito", "plazo_meses", "tasa_interes_anual", "num_creditos_activos",
    "moras_ultimos_12m", "relacion_deuda_ingreso", "puntaje_buro", "uso_cupo_tarjetas",
]
NEW_COLS = ["ratio_monto_ingreso", "cuota_estimada", "ratio_cuota_ingreso"]
NUM_COLS = NUM_COLS_RAW + NEW_COLS
CAT_COLS = ["estado_civil", "nivel_educativo", "situacion_laboral", "tipo_vivienda", "proposito"]
INPUT_COLS = NUM_COLS_RAW + CAT_COLS

CATEGORIAS = {
    "sexo": ["M", "F"],
    "estado_civil": ["Soltero", "Casado", "Union_libre", "Divorciado", "Viudo"],
    "nivel_educativo": ["Primaria", "Secundaria", "Tecnico", "Universitario", "Posgrado"],
    "situacion_laboral": ["Empleado", "Independiente", "Pensionado", "Desempleado"],
    "tipo_vivienda": ["Arriendo", "Propia", "Familiar"],
    "proposito": ["Libre_inversion", "Vehiculo", "Consolidacion_deuda", "Vivienda", "Negocio", "Educacion"],
}
BANDAS_RIESGO = {"Bajo": [0.0, 0.2], "Medio": [0.2, 0.5], "Alto": [0.5, 1.0]}

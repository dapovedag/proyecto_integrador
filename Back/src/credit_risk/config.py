"""Configuración única del proyecto: rutas, semilla, columnas, reglas de limpieza, costos y versión.

Todo lo que es una decisión (rangos válidos, costos, grupos de equidad) vive aquí y está
justificado en ``docs/gestion/adr/``.
"""

from __future__ import annotations

import os
from pathlib import Path

from credit_risk import __version__

# joblib/loky se bloquea en Windows buscando 'wmic' para contar núcleos; se fija explícitamente.
os.environ.setdefault("LOKY_MAX_CPU_COUNT", str(max(1, (os.cpu_count() or 2) - 1)))

# --- Rutas (relativas a la raíz del proyecto; sobrescribibles por variables de entorno) ---
BACK_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACK_DIR.parent
DB_DIR = PROJECT_ROOT / "db"
RAW_DATA_PATH = Path(os.getenv("DATA_PATH", DB_DIR / "credit_risk.csv"))
DATA_PATH = RAW_DATA_PATH  # alias usado por código anterior
PROCESSED_DIR = DB_DIR / "processed"
EXTERNAL_DIR = DB_DIR / "external"
MODEL_DIR = Path(os.getenv("MODEL_DIR", BACK_DIR / "models"))
REPORTS_DIR = BACK_DIR / "reports"
NOTEBOOKS_DIR = BACK_DIR / "notebooks"
FRONT_DIR = PROJECT_ROOT / "Front"
FRONT_DATA_DIR = FRONT_DIR / "src" / "data" / "generated"
FRONT_NOTEBOOKS_DIR = FRONT_DIR / "public" / "notebooks"

# --- Reproducibilidad y versión ---
RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 5
MODEL_VERSION = __version__

# --- Columnas ---
TARGET = "default"
ID_COL = "id_cliente"
TEXT_COL = "texto_solicitud"
SENSITIVE_COL = "sexo"  # solo para auditoría de equidad: NO entra al modelo
TEXTO_FALTANTE = "Sin texto"
CATEGORIA_DESCONOCIDA = "Desconocido"

NUM_COLS_RAW = [
    "edad", "antiguedad_laboral_anios", "personas_a_cargo", "ingreso_mensual",
    "monto_credito", "plazo_meses", "tasa_interes_anual", "num_creditos_activos",
    "moras_ultimos_12m", "relacion_deuda_ingreso", "puntaje_buro", "uso_cupo_tarjetas",
]
ENTEROS = ["edad", "personas_a_cargo", "plazo_meses", "num_creditos_activos", "moras_ultimos_12m", "puntaje_buro"]
CAT_NOMINALES = ["estado_civil", "situacion_laboral", "tipo_vivienda", "proposito"]
CAT_COLS = CAT_NOMINALES + ["nivel_educativo"]
INPUT_COLS = NUM_COLS_RAW + CAT_COLS  # lo que recibe la API (además de sexo y texto)

CATEGORIAS: dict[str, list[str]] = {
    "sexo": ["M", "F"],
    "estado_civil": ["Soltero", "Casado", "Union_libre", "Divorciado", "Viudo"],
    "nivel_educativo": ["Primaria", "Secundaria", "Tecnico", "Universitario", "Posgrado"],
    "situacion_laboral": ["Empleado", "Independiente", "Pensionado", "Desempleado"],
    "tipo_vivienda": ["Arriendo", "Propia", "Familiar"],
    "proposito": ["Libre_inversion", "Vehiculo", "Consolidacion_deuda", "Vivienda", "Negocio", "Educacion"],
}
# Categóricas cuyo faltante es informativo: se imputan como "Desconocido" en lugar de la moda.
CAT_FALTANTE_INFORMATIVO = ["situacion_laboral", "tipo_vivienda"]

# --- Variables derivadas (paso 3, P2.4) ---
RANGO_EDAD_BINS = [17, 25, 35, 45, 60, 120]
RANGO_EDAD_LABELS = ["18-25", "26-35", "36-45", "46-60", ">60"]
DERIVADAS = ["cuota_estimada", "ratio_cuota_ingreso", "ratio_monto_ingreso",
             "rango_edad", "tiene_moras_previas", "longitud_texto"]
ORDINALES: dict[str, list[str]] = {
    "nivel_educativo": CATEGORIAS["nivel_educativo"],
    "rango_edad": RANGO_EDAD_LABELS,
}
# longitud_texto se usa en el EDA pero NO en el modelo tabular: el texto se evalúa aparte (paso 7, ΔAUC).
NUM_MODELO = NUM_COLS_RAW + ["cuota_estimada", "ratio_cuota_ingreso", "ratio_monto_ingreso", "tiene_moras_previas"]
VARIABLES_EDAD = ["edad", "rango_edad"]  # se excluyen juntas en la variante "sin_edad" (ADR-003)

# --- Reglas de limpieza (paso 3, P2.1) ---
EDAD_VALIDA = (18, 100)
RANGOS_VALIDOS: dict[str, tuple[float, float]] = {
    "antiguedad_laboral_anios": (0, 70),
    "uso_cupo_tarjetas": (0, 1),
    "relacion_deuda_ingreso": (0, 1.5),
    "puntaje_buro": (150, 950),
    "tasa_interes_anual": (0, 100),
    "plazo_meses": (1, 120),
}
# Capping p1-p99 ajustado SOLO en train dentro del pipeline (paso 4, IA2.5)
COLS_CAPPING = ["ingreso_mensual", "monto_credito", "cuota_estimada", "ratio_cuota_ingreso",
                "ratio_monto_ingreso", "antiguedad_laboral_anios", "relacion_deuda_ingreso"]
CAPPING_QUANTILES = (0.01, 0.99)

# --- Costos de decisión, por unidad de exposición (ADR-002) ---
# C_FN: aprobar a quien no paga = LGD (Basilea F-IRB 45 %; sensibilidad 45-75 %).
# C_FP: rechazar a un buen pagador = margen financiero neto esperado perdido.
# C_R: enviar a revisión manual = tiempo del analista + abandono por demora + error residual del analista.
LGD = 0.45
MARGEN = 0.15
COSTO_REVISION = 0.08
CAPACIDAD_REVISION = 0.35  # alerta operativa: fracción máxima de solicitudes que el equipo puede revisar
SENSIBILIDAD_LGD = [0.45, 0.55, 0.65, 0.75]
SENSIBILIDAD_MARGEN = [0.10, 0.15, 0.20]

# --- Equidad (ADR-003) ---
GRUPOS_EDAD_BINS = [17, 29, 59, 200]
GRUPOS_EDAD_LABELS = ["18-29", "30-59", "60+"]
GRUPO_EDAD_DESCONOCIDO = "desconocida"
DI_MINIMO = 0.8          # regla de 4/5, usada como alerta (heurística, no norma colombiana de crédito)
N_MINIMO_GRUPO = 30      # grupos más pequeños se reportan pero no cuentan para el DI
BOOTSTRAP_REPS = 500

# --- Selección de modelo (ADR-001) ---
PARSIMONIA_DELTA_AUC = 0.005  # si el mejor supera a la LR por menos que esto, se elige la LR

# --- Monitoreo (R4) ---
PSI_ESTABLE, PSI_ALERTA = 0.10, 0.25

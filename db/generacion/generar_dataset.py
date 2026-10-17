"""
Generador del dataset sintetico de riesgo de credito para el Proyecto Integrador.

Cumple docs/03_contrato_datos.md (esquema canonico de la seccion 3 y requisitos
D1-D12) y el contrato de la API de docs/04_arquitectura_backend.md.

- Salida: db/credit_risk.csv (UTF-8, separador ',', decimal '.').
- Semilla fija RANDOM_STATE=42 (reproducible).
- Etiqueta `default` derivada de las variables via modelo logistico + ruido
  (senal aprendible, AUC objetivo 0.70-0.90). `sexo` NO influye en `default`
  (requisito etico: solo se usa para auditar equidad).
- Incluye suciedad intencional: nulos (D8), duplicados (D9), atipicos y errores
  de digitacion (D10), y una columna de texto libre en espanol (D6).

Uso:
    python generar_dataset.py
"""
from pathlib import Path
import numpy as np
import pandas as pd

RANDOM_STATE = 42
N = 12000
rng = np.random.default_rng(RANDOM_STATE)

OUT = Path(__file__).resolve().parents[1] / "credit_risk.csv"

# --------------------------------------------------------------------------- #
# 1. Variables demograficas
# --------------------------------------------------------------------------- #
edad = rng.integers(18, 81, N)
sexo = rng.choice(["F", "M"], N, p=[0.49, 0.51])

estado_civil = rng.choice(
    ["Soltero", "Casado", "Union_libre", "Divorciado", "Viudo"],
    N, p=[0.38, 0.34, 0.14, 0.09, 0.05],
)

NIVELES = ["Primaria", "Secundaria", "Tecnico", "Universitario", "Posgrado"]
nivel_educativo = rng.choice(NIVELES, N, p=[0.10, 0.30, 0.26, 0.26, 0.08])
# indice ordinal 0..4 para usar como senal
edu_idx = pd.Series(nivel_educativo).map({n: i for i, n in enumerate(NIVELES)}).to_numpy()

situacion_laboral = rng.choice(
    ["Empleado", "Independiente", "Pensionado", "Desempleado"],
    N, p=[0.55, 0.28, 0.10, 0.07],
)

# antiguedad laboral acotada por la edad (no se puede trabajar desde antes de los 18)
max_anios = np.clip(edad - 18, 0, None)
antiguedad_laboral_anios = np.round(
    rng.uniform(0, 1, N) ** 1.5 * max_anios, 1
)
# los pensionados tienden a tener mas antiguedad; los desempleados, 0 reciente
antiguedad_laboral_anios = np.where(
    situacion_laboral == "Pensionado",
    np.round(np.clip(antiguedad_laboral_anios + 8, 0, max_anios), 1),
    antiguedad_laboral_anios,
)

personas_a_cargo = rng.choice(np.arange(0, 7), N, p=[0.30, 0.25, 0.20, 0.12, 0.07, 0.04, 0.02])
tipo_vivienda = rng.choice(["Propia", "Arriendo", "Familiar"], N, p=[0.38, 0.42, 0.20])

# --------------------------------------------------------------------------- #
# 2. Variables financieras
# --------------------------------------------------------------------------- #
# Ingreso mensual (COP) log-normal, crece con educacion y edad
base = 14.1 + 0.18 * edu_idx + (edad - 18) / 140.0
ingreso_mensual = np.round(rng.lognormal(mean=base, sigma=0.45), -3)
ingreso_mensual = np.clip(ingreso_mensual, 1_000_000, 80_000_000).astype(float)
# desempleados con ingresos mas bajos
ingreso_mensual = np.where(
    situacion_laboral == "Desempleado",
    np.round(ingreso_mensual * rng.uniform(0.3, 0.6, N), -3),
    ingreso_mensual,
)

proposito = rng.choice(
    ["Vivienda", "Vehiculo", "Educacion", "Libre_inversion", "Consolidacion_deuda", "Negocio"],
    N, p=[0.14, 0.18, 0.10, 0.28, 0.16, 0.14],
)

plazo_meses = rng.choice([6, 12, 18, 24, 36, 48, 60, 72, 84], N,
                         p=[0.06, 0.14, 0.12, 0.20, 0.20, 0.12, 0.08, 0.05, 0.03])

# monto del credito correlacionado con ingreso y proposito
mult_prop = pd.Series(proposito).map({
    "Vivienda": 30.0, "Vehiculo": 10.0, "Educacion": 6.0,
    "Libre_inversion": 4.0, "Consolidacion_deuda": 5.0, "Negocio": 8.0,
}).to_numpy()
monto_credito = np.round(
    ingreso_mensual * mult_prop * rng.uniform(0.4, 1.3, N), -3
)
monto_credito = np.clip(monto_credito, 1_000_000, 900_000_000).astype(float)

tasa_interes_anual = np.round(rng.uniform(10.0, 42.0, N), 1)

num_creditos_activos = rng.poisson(1.6, N).clip(0, 9)

# latente de riesgo "fundamental" (0 = sano, mas alto = mas riesgo)
riesgo_lat = (
    0.9 * rng.standard_normal(N)
    - 0.20 * edu_idx
    - 0.015 * antiguedad_laboral_anios
    + 0.10 * personas_a_cargo
    + np.where(situacion_laboral == "Desempleado", 1.1, 0.0)
    + np.where(situacion_laboral == "Independiente", 0.25, 0.0)
    + np.where(situacion_laboral == "Pensionado", -0.2, 0.0)
    + np.where(tipo_vivienda == "Arriendo", 0.2, 0.0)
    + np.where(tipo_vivienda == "Propia", -0.25, 0.0)
    - 0.000000015 * (ingreso_mensual - 4_000_000)
)
riesgo_z = (riesgo_lat - riesgo_lat.mean()) / riesgo_lat.std()

# moras ultimos 12 meses: sesgadas a 0, suben con el riesgo
lam = np.exp(-1.1 + 0.9 * riesgo_z).clip(0.02, 6)
moras_ultimos_12m = rng.poisson(lam).clip(0, 12)

# relacion deuda / ingreso 0-1.5, sube con el riesgo y el monto
rdi_base = 0.25 + 0.18 * riesgo_z + 0.00000002 * monto_credito + rng.normal(0, 0.12, N)
relacion_deuda_ingreso = np.round(np.clip(rdi_base, 0.0, 1.5), 3)

# uso del cupo de tarjetas 0-1, sube con el riesgo
uso_cupo_tarjetas = np.round(
    np.clip(0.45 + 0.22 * riesgo_z + rng.normal(0, 0.15, N), 0.0, 1.0), 3
)

# puntaje de buro 150-950 (tipo DataCredito): baja con el riesgo -> senal fuerte y realista
puntaje_buro = np.round(
    720 - 95 * riesgo_z - 22 * moras_ultimos_12m + rng.normal(0, 55, N)
).clip(150, 950).astype(int)

# --------------------------------------------------------------------------- #
# 3. Variable objetivo `default` (logistica + ruido). sexo NO entra.
# --------------------------------------------------------------------------- #
eta = (
    -2.75
    + 0.95 * riesgo_z
    + 0.42 * moras_ultimos_12m
    + 1.6 * relacion_deuda_ingreso
    + 1.3 * uso_cupo_tarjetas
    - 0.0045 * (puntaje_buro - 650)
    + 0.10 * num_creditos_activos
    + np.where(proposito == "Consolidacion_deuda", 0.45, 0.0)
    + np.where(proposito == "Negocio", 0.20, 0.0)
    + np.where(proposito == "Vivienda", -0.35, 0.0)
    + rng.normal(0, 0.85, N)   # ruido -> AUC no trivial (~0.80)
)
prob_default = 1.0 / (1.0 + np.exp(-eta))
default = (rng.uniform(0, 1, N) < prob_default).astype(int)

# --------------------------------------------------------------------------- #
# 4. Columna de texto libre en espanol (D6), condicionada de forma
#    probabilistica a la propension de impago (no determinista).
# --------------------------------------------------------------------------- #
INICIOS = [
    "Solicito este credito para", "Necesito el prestamo para",
    "Quisiera acceder a financiacion para", "Estoy interesado en un credito para",
    "Pido este credito con el fin de", "Requiero el prestamo para",
]
PROP_FRASE = {
    "Vivienda": ["la compra de vivienda", "remodelar mi casa", "la cuota inicial de un apartamento", "hacer mejoras en mi vivienda"],
    "Vehiculo": ["comprar un vehiculo", "la cuota inicial de un carro", "cambiar mi moto por un carro", "adquirir un vehiculo para trabajar"],
    "Educacion": ["pagar la matricula de la universidad", "financiar un posgrado", "costear los estudios de mis hijos", "terminar mi carrera"],
    "Libre_inversion": ["cubrir gastos personales", "un proyecto personal", "gastos varios del hogar", "una inversion personal"],
    "Consolidacion_deuda": ["unificar mis deudas en una sola cuota", "consolidar varias tarjetas de credito", "reorganizar mis obligaciones financieras", "ponerme al dia con mis deudas"],
    "Negocio": ["invertir en mi negocio", "capital de trabajo para mi emprendimiento", "comprar inventario para mi tienda", "ampliar mi negocio"],
}
POS = [
    "Cuento con ingresos estables y buen historial de pago.",
    "He cumplido puntualmente con todas mis obligaciones anteriores.",
    "Tengo un empleo estable desde hace varios anios.",
    "Mi situacion financiera es solida y organizada.",
    "Siempre he pagado mis creditos a tiempo.",
    "Tengo capacidad de pago de sobra para la cuota.",
]
NEG = [
    "Ultimamente he tenido algunos atrasos en mis pagos.",
    "Atravieso dificultades economicas por la perdida de empleo.",
    "Se me han acumulado varias deudas que necesito consolidar.",
    "He tenido problemas para ponerme al dia con las cuotas.",
    "Mis gastos han superado mis ingresos en los ultimos meses.",
    "Vengo de una reduccion de ingresos y estoy reorganizando mis finanzas.",
]
NEUTRO = [
    "Agradezco la pronta revision de mi solicitud.",
    "Quedo atento a los requisitos adicionales.",
    "Espero una respuesta favorable.",
    "Puedo aportar la documentacion que requieran.",
    "",
]

def construir_texto(i):
    ini = INICIOS[rng.integers(len(INICIOS))]
    pro = PROP_FRASE[proposito[i]][rng.integers(len(PROP_FRASE[proposito[i]]))]
    frase1 = f"{ini} {pro}."
    # probabilidad de tono negativo sube con la propension de impago (con ruido)
    p_neg = np.clip(0.12 + 0.6 * prob_default[i], 0.03, 0.95)
    if rng.uniform() < p_neg:
        frase2 = NEG[rng.integers(len(NEG))]
    else:
        frase2 = POS[rng.integers(len(POS))]
    partes = [frase1, frase2]
    if rng.uniform() < 0.4:
        extra = NEUTRO[rng.integers(len(NEUTRO))]
        if extra:
            partes.append(extra)
    return " ".join(partes)

texto_solicitud = np.array([construir_texto(i) for i in range(N)], dtype=object)

# --------------------------------------------------------------------------- #
# 5. Identificador unico anonimo
# --------------------------------------------------------------------------- #
id_cliente = np.array([f"CLI_{n:06d}" for n in range(1, N + 1)], dtype=object)

df = pd.DataFrame({
    "id_cliente": id_cliente,
    "edad": edad,
    "sexo": sexo,
    "estado_civil": estado_civil,
    "nivel_educativo": nivel_educativo,
    "situacion_laboral": situacion_laboral,
    "antiguedad_laboral_anios": antiguedad_laboral_anios,
    "personas_a_cargo": personas_a_cargo,
    "tipo_vivienda": tipo_vivienda,
    "ingreso_mensual": ingreso_mensual,
    "monto_credito": monto_credito,
    "plazo_meses": plazo_meses,
    "tasa_interes_anual": tasa_interes_anual,
    "proposito": proposito,
    "num_creditos_activos": num_creditos_activos,
    "moras_ultimos_12m": moras_ultimos_12m,
    "relacion_deuda_ingreso": relacion_deuda_ingreso,
    "puntaje_buro": puntaje_buro,
    "uso_cupo_tarjetas": uso_cupo_tarjetas,
    "texto_solicitud": texto_solicitud,
    "default": default,
})

# --------------------------------------------------------------------------- #
# 6. Atipicos y errores de digitacion (D10) -- antes de duplicar/nulos
# --------------------------------------------------------------------------- #
# ingreso con un cero de mas (~0.3%)
idx = rng.choice(df.index, int(N * 0.003), replace=False)
df.loc[idx, "ingreso_mensual"] = df.loc[idx, "ingreso_mensual"] * 10
# monto con un cero de mas (~0.2%)
idx = rng.choice(df.index, int(N * 0.002), replace=False)
df.loc[idx, "monto_credito"] = df.loc[idx, "monto_credito"] * 10
# algunas edades mal digitadas (fuera de rango, para la limpieza del paso 3)
idx = rng.choice(df.index, int(N * 0.002), replace=False)
df.loc[idx, "edad"] = rng.choice([1, 2, 120, 150, 999], len(idx))

# --------------------------------------------------------------------------- #
# 7. Valores faltantes (D8): nulos en varias columnas (1-15% cada una).
#    Nunca en id_cliente ni en default. texto_solicitud se mantiene >=95% lleno.
# --------------------------------------------------------------------------- #
NULOS = {
    "ingreso_mensual": 0.06,
    "situacion_laboral": 0.04,
    "antiguedad_laboral_anios": 0.09,
    "tipo_vivienda": 0.03,
    "relacion_deuda_ingreso": 0.05,
    "puntaje_buro": 0.04,
    "texto_solicitud": 0.02,
}
for col, frac in NULOS.items():
    mask = rng.uniform(0, 1, len(df)) < frac
    df.loc[mask, col] = np.nan

# --------------------------------------------------------------------------- #
# 8. Duplicados (D9): ~1.2% de filas repetidas (copias exactas, incluidos nulos)
# --------------------------------------------------------------------------- #
n_dup = int(N * 0.012)
dup_idx = rng.choice(df.index, n_dup, replace=False)
df = pd.concat([df, df.loc[dup_idx]], ignore_index=True)

# barajar filas para que los duplicados no queden al final
df = df.sample(frac=1.0, random_state=RANDOM_STATE).reset_index(drop=True)

df.to_csv(OUT, index=False, encoding="utf-8")

# --------------------------------------------------------------------------- #
# 9. Reporte y verificacion del contrato
# --------------------------------------------------------------------------- #
print("Guardado en:", OUT)
print("Filas totales:", len(df), "| Columnas:", df.shape[1])
print("Prevalencia default (%):", round(100 * df["default"].mean(), 2))
print("Duplicados exactos:", int(df.duplicated().sum()))
print("Textos no vacios (%):", round(100 * df["texto_solicitud"].notna().mean(), 2))
print("Textos distintos:", df["texto_solicitud"].nunique())
print("Columnas con nulos:", int((df.isna().sum() > 0).sum()))

# AUC alcanzable (D11) con un modelo simple sobre un encoding basico
try:
    from sklearn.ensemble import HistGradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import roc_auc_score

    d = df.dropna(subset=["default"]).copy()
    # limpieza minima para el chequeo (no modifica el CSV)
    d.loc[(d["edad"] < 18) | (d["edad"] > 100), "edad"] = np.nan
    num = ["edad", "antiguedad_laboral_anios", "personas_a_cargo", "ingreso_mensual",
           "monto_credito", "plazo_meses", "tasa_interes_anual", "num_creditos_activos",
           "moras_ultimos_12m", "relacion_deuda_ingreso", "puntaje_buro", "uso_cupo_tarjetas"]
    cat = ["estado_civil", "nivel_educativo", "situacion_laboral", "tipo_vivienda", "proposito"]
    X = pd.get_dummies(d[num + cat], columns=cat, dummy_na=True)
    y = d["default"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25,
                                          stratify=y, random_state=RANDOM_STATE)
    clf = HistGradientBoostingClassifier(random_state=RANDOM_STATE)
    clf.fit(Xtr, ytr)
    auc = roc_auc_score(yte, clf.predict_proba(Xte)[:, 1])
    print("AUC alcanzable (HistGB, holdout):", round(auc, 4))
except Exception as e:  # pragma: no cover
    print("No se pudo calcular AUC (sklearn no disponible?):", e)

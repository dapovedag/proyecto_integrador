# %% [markdown]
# # Paso 2 · Exploración y análisis preliminar (Programación, Unidad 1)
#
# | | |
# |---|---|
# | **IDs del enunciado** | P1.1 y P1.E1 (entorno y librerías), P1.2 (Pandas, NumPy, Matplotlib, Seaborn), P1.3 y P1.E2 (carga e inspección), P1.4 y P1.E3 (operaciones básicas), P1.5 y P1.E4 (visualizaciones), E3 (datos realistas del sector financiero) |
# | **Fase** | F2 · Explorar (CRISP-DM: *Data Understanding*) |
# | **Historia** | HU-02 · Sprint S6 (origen en S1) |
# | **Entregable** | este notebook |
#
# Estructura: **1. P1.1 Entorno · 2. P1.2 Librerías · 3. P1.3 Carga e inspección · 4. P1.4 Operaciones básicas
# (pandas y SQL con DuckDB) · 5. P1.5 Visualizaciones · Conclusiones**. Los nulos, duplicados y valores
# imposibles **solo se reportan** aquí; se tratan en el notebook 03.
#
# **Aprendizaje de la unidad (Módulo 1 · Unidad 1).** Explorar es preguntarle a los datos antes de
# modelarlos. En lo conceptual: distinguir tipos de variable, leer distribuciones (asimetría, valores
# imposibles, desbalance de clases) y separar lo que *describe* a la población de lo que *discrimina* entre
# pagadores e impagos. En lo práctico: inspeccionar un `DataFrame` (`shape`, `info`, `describe`, `nunique`),
# seleccionar, filtrar, ordenar y agregar con pandas, comprobar que cada operación tiene su equivalente
# exacto en **SQL con DuckDB** (motor analítico en proceso) y construir gráficos con título, ejes e
# interpretación.

# %% tags=["parameters"]
FAST = False

# %% [markdown]
# ## 1. P1.1 · Entorno
#
# `setup()` (de `credit_risk.notebook`) fija la semilla, silencia avisos, aplica el estilo visual del proyecto
# y devuelve el entorno con las versiones de las librerías.
#
# - **Jupyter local:** desde `Back/`, crear el entorno (`python -m venv .venv`), instalar el paquete en modo
#   editable (`pip install -e .`), registrar el kernel `credit-risk` y abrir este notebook con
#   *Restart & Run All*.
# - **Google Colab:** antes de esta celda, instalar el paquete desde el repositorio
#   (`!git clone <URL_DEL_REPOSITORIO> proyecto && pip install -e proyecto/Back`); si el clon no trae el CSV,
#   la celda siguiente pide subirlo (`files.upload()`) o se puede montar Drive (`drive.mount('/content/drive')`)
#   y pasar la ruta a `cargar_datos(ruta)`.

# %%
from credit_risk.notebook import setup

ENTORNO = setup()
ENTORNO

# %%
from credit_risk import config
from credit_risk.notebook import en_colab, ruta

RUTA_CSV = None  # None = config.RAW_DATA_PATH (repositorio clonado o Jupyter local)
if en_colab():
    # Colab: el paquete ya se instaló desde el repositorio (ver la celda anterior).
    if not config.RAW_DATA_PATH.exists():
        from google.colab import files  # noqa: F401  (solo existe en Colab)

        RUTA_CSV = next(iter(files.upload()))  # seleccionar credit_risk.csv
    print("Entorno: Google Colab")
else:
    print("Entorno: Jupyter local (kernel credit-risk)")
print(f"Datos: {ruta(RUTA_CSV or config.RAW_DATA_PATH)} · semilla: {config.RANDOM_STATE}")

# %% [markdown]
# ## 2. P1.2 · Librerías y configuración
#
# Las cuatro librerías del enunciado (`pandas as pd`, `numpy as np`, `matplotlib.pyplot as plt`,
# `seaborn as sns`) más **DuckDB** para las consultas SQL en proceso (ADR-007). El estilo de los gráficos lo
# aplica `setup()` (`credit_risk.reporting.aplicar_estilo`); aquí se ajusta la presentación de las tablas.

# %%
import duckdb
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from IPython.display import Markdown, display
from matplotlib.cbook import boxplot_stats

from credit_risk.data import cargar_datos
from credit_risk.reporting import PALETA, figura_front

pd.options.display.float_format = "{:,.2f}".format
pd.options.display.max_colwidth = 40
TARGET, ID_COL, TEXT_COL = config.TARGET, config.ID_COL, config.TEXT_COL
COLORES_CLASE = {0: PALETA["pago"], 1: PALETA["impago"]}
NOMBRE_CLASE = {0: "Pagó (0)", 1: "Impago (1)"}
configuracion = {
    "pandas.display.float_format": "{:,.2f}", "pandas.display.max_columns": pd.options.display.max_columns,
    "pandas.display.max_colwidth": pd.options.display.max_colwidth,
    "matplotlib.figure.facecolor": matplotlib.rcParams["figure.facecolor"],
    "matplotlib.axes.prop_cycle (3 primeros)": ", ".join(matplotlib.rcParams["axes.prop_cycle"].by_key()["color"][:3]),
    "seaborn": sns.__version__, "duckdb": duckdb.__version__,
}
pd.Series(configuracion, name="valor").to_frame()

# %% [markdown]
# ## 3. P1.3 · Carga e inspección del dataset
#
# Se lee el CSV crudo con `credit_risk.data.cargar_datos()` (ruta de `config.RAW_DATA_PATH`).

# %%
df = cargar_datos(RUTA_CSV)
if FAST:
    df = df.sample(3000, random_state=config.RANDOM_STATE).reset_index(drop=True)
print(f"Dimensiones (filas, columnas): {df.shape}")
df.head()

# %%
df.tail()

# %%
df.sample(5, random_state=config.RANDOM_STATE)

# %%
df.info()

# %%
tipos = df.dtypes.astype(str)
pd.DataFrame({"n_columnas": tipos.value_counts(),
              "columnas": tipos.groupby(tipos).apply(lambda s: ", ".join(s.index))})

# %%
# Estadísticas descriptivas de las variables numéricas
df.describe().T

# %%
# Estadísticas descriptivas de las variables categóricas y de texto
df.describe(include="object").T

# %%
# Valores únicos por columna
df.nunique().sort_values().rename("valores_unicos").to_frame().T

# %%
# Valores nulos (solo se reportan; se tratan en el notebook 03)
nulos = pd.DataFrame({"nulos": df.isna().sum(), "pct": df.isna().mean() * 100})
nulos = nulos[nulos["nulos"] > 0].sort_values("nulos", ascending=False)
print(f"Columnas con nulos: {len(nulos)} · celdas nulas: {int(df.isna().sum().sum()):,}")
nulos

# %%
# Duplicados y valores imposibles (solo se reportan)
dup_exactos = int(df.duplicated().sum())
dup_id = int(df[ID_COL].duplicated().sum())
edad_invalida = ~df["edad"].between(*config.EDAD_VALIDA)
print(f"Filas duplicadas exactas : {dup_exactos} ({dup_exactos / len(df):.2%})")
print(f"IDs repetidos            : {dup_id}")
print(f"Edades fuera de {config.EDAD_VALIDA[0]}-{config.EDAD_VALIDA[1]}  : {int(edad_invalida.sum())} "
      f"-> valores {sorted(df.loc[edad_invalida, 'edad'].unique().tolist())}")
print(f"Montos o ingresos <= 0   : {int((df['monto_credito'] <= 0).sum())} / {int((df['ingreso_mensual'] <= 0).sum())}")

# %%
# Distribución de la variable objetivo
dist = pd.DataFrame({"clientes": df[TARGET].value_counts(), "proporcion": df[TARGET].value_counts(normalize=True)})
dist.index = dist.index.map(NOMBRE_CLASE)
print(f"Tasa de default: {df[TARGET].mean():.2%}")
dist

# %% [markdown]
# **Lectura.** El archivo tiene **12.144 filas y 21 columnas**: 13 numéricas (7 `float64` y 6 `int64`,
# incluido el objetivo) y 8 de tipo texto (`id_cliente`, las 6 categóricas y `texto_solicitud`). Problemas de
# calidad que se tratarán en el notebook 03: **7 columnas con nulos** (de 9,21 % en `antiguedad_laboral_anios`
# a 1,98 % en `texto_solicitud`; 4.088 celdas en total), **144 filas duplicadas exactas** y 144 IDs repetidos
# (hay 12.000 IDs únicos), y **25 edades imposibles** (1, 2, 120, 150 y 999). No hay montos ni ingresos
# menores o iguales a cero, pero los máximos son errores evidentes de digitación: el monto llega a
# 1.033.300.000 COP con una mediana de 12.281.000, y el ingreso a 64.540.000 con una mediana de 2.237.000. El
# texto libre solo tiene 4.453 valores distintos. La clase impago es el **35,63 %** (4.327 de 12.144): un
# desbalance moderado que justifica estratificar la partición train/test.

# %% [markdown]
# ## 4. P1.4 · Operaciones básicas en pandas y su equivalente SQL (DuckDB)
#
# Cada operación se hace primero en pandas y luego con `duckdb.sql(...)` **directamente sobre el
# `DataFrame` `df`** (DuckDB lo lee en memoria, sin copiarlo a una base). La función `coinciden` comprueba
# con `pandas.testing.assert_frame_equal` que ambas tablas son iguales en orden y valores.
# Nota: `default` es palabra reservada en SQL, por eso va entre comillas dobles.

# %%
def coinciden(a: pd.DataFrame, b: pd.DataFrame) -> None:
    """Falla si pandas y DuckDB no devuelven la misma tabla (mismas columnas, orden y valores)."""
    a, b = a.reset_index(drop=True), b.reset_index(drop=True)
    pd.testing.assert_frame_equal(a, b, check_dtype=False, check_exact=False, rtol=1e-9)
    print(f"✔ pandas y DuckDB coinciden: {a.shape[0]:,} filas × {a.shape[1]} columnas")


# %% [markdown]
# ### 4.1 Selección
#
# **Por nombre de columna.**

# %%
sel_pd = df[[ID_COL, "edad", "ingreso_mensual", "monto_credito", TARGET]].head(5)
sel_sql = duckdb.sql('SELECT id_cliente, edad, ingreso_mensual, monto_credito, "default" FROM df LIMIT 5').df()
coinciden(sel_pd, sel_sql)
sel_sql

# %% [markdown]
# **Por tipo de dato** (`select_dtypes`). En SQL, `DESCRIBE` expone el tipo de cada columna y se filtra
# como cualquier tabla.

# %%
num_pd = df.select_dtypes(include="number").columns.tolist()
cat_pd = df.select_dtypes(include="object").columns.drop([ID_COL, TEXT_COL]).tolist()
tipos_sql = duckdb.sql("SELECT column_name, column_type FROM (DESCRIBE SELECT * FROM df)").df()
num_sql = tipos_sql.query("column_type in ['BIGINT', 'DOUBLE']")["column_name"].tolist()
assert num_pd == num_sql
print(f"✔ {len(num_pd)} numéricas iguales en pandas y DuckDB: {', '.join(num_pd)}")
print(f"Categóricas ({len(cat_pd)}): {', '.join(cat_pd)}")
tipos_sql.groupby("column_type")["column_name"].agg(n="size", columnas=", ".join)

# %% [markdown]
# **`loc` (etiquetas) e `iloc` (posiciones).** El equivalente de `iloc[10:15]` en SQL es `LIMIT 5 OFFSET 10`
# (DuckDB conserva el orden de inserción del `DataFrame`).

# %%
display(df.loc[df.index[:3], ["edad", "proposito", TARGET]])
iloc_pd = df.iloc[10:15, [1, 9, 10, -1]]
iloc_sql = duckdb.sql('SELECT edad, ingreso_mensual, monto_credito, "default" FROM df LIMIT 5 OFFSET 10').df()
coinciden(iloc_pd, iloc_sql)
iloc_sql

# %% [markdown]
# ### 4.2 Filtrado
#
# **Condición simple:** clientes con al menos una mora en los últimos 12 meses.

# %%
con_moras = df[df["moras_ultimos_12m"] > 0]
f1_pd = pd.DataFrame({"clientes": [len(con_moras)], "tasa_default": [con_moras[TARGET].mean()]})
f1_sql = duckdb.sql('SELECT COUNT(*) AS clientes, AVG("default") AS tasa_default FROM df '
                    "WHERE moras_ultimos_12m > 0").df()
coinciden(f1_pd, f1_sql)
print(f"Tasa global de default: {df[TARGET].mean():.2%}")
f1_sql

# %% [markdown]
# **Condición compuesta:** ingreso bajo (< percentil 25) **y** monto alto (> percentil 75). En SQL los
# percentiles se calculan con `quantile_cont`, la misma interpolación lineal que usa pandas.

# %%
p25_ing, p75_monto = df["ingreso_mensual"].quantile(0.25), df["monto_credito"].quantile(0.75)
riesgo = df[(df["ingreso_mensual"] < p25_ing) & (df["monto_credito"] > p75_monto)]
f2_pd = pd.DataFrame({"p25_ingreso": [p25_ing], "p75_monto": [p75_monto], "clientes": [len(riesgo)],
                      "tasa_default": [riesgo[TARGET].mean()]})
f2_sql = duckdb.sql("""
    WITH q AS (SELECT quantile_cont(ingreso_mensual, 0.25) AS p25_ingreso,
                      quantile_cont(monto_credito, 0.75) AS p75_monto FROM df)
    SELECT ANY_VALUE(p25_ingreso) AS p25_ingreso, ANY_VALUE(p75_monto) AS p75_monto,
           COUNT(*) AS clientes, AVG("default") AS tasa_default
    FROM df, q WHERE ingreso_mensual < p25_ingreso AND monto_credito > p75_monto
""").df()
coinciden(f2_pd, f2_sql)
f2_sql

# %% [markdown]
# **`query()`:** puntaje de buró bajo y uso alto del cupo de tarjetas. Se comparan **todas** las filas filtradas.

# %%
q_pd = df.query("puntaje_buro < 600 and uso_cupo_tarjetas > 0.7")[["edad", "puntaje_buro", "uso_cupo_tarjetas", TARGET]]
q_sql = duckdb.sql('SELECT edad, puntaje_buro, uso_cupo_tarjetas, "default" FROM df '
                   "WHERE puntaje_buro < 600 AND uso_cupo_tarjetas > 0.7").df()
coinciden(q_pd, q_sql)
print(f"query -> {len(q_pd):,} clientes · tasa de default {q_pd[TARGET].mean():.2%}")
q_sql.head()

# %% [markdown]
# ### 4.3 Ordenamiento
#
# **Por una columna:** los 5 créditos de mayor monto (candidatos a error de digitación).

# %%
cols_orden = [ID_COL, "ingreso_mensual", "monto_credito", TARGET]
o1_pd = df.sort_values("monto_credito", ascending=False)[cols_orden].head(5)
o1_sql = duckdb.sql('SELECT id_cliente, ingreso_mensual, monto_credito, "default" FROM df '
                    "ORDER BY monto_credito DESC LIMIT 5").df()
coinciden(o1_pd, o1_sql)
o1_sql

# %% [markdown]
# **Por varias columnas:** más moras primero y, a igualdad, menor puntaje de buró (el `id_cliente` desempata
# para que el orden sea determinista en ambos motores).

# %%
o2_pd = (df.sort_values(["moras_ultimos_12m", "puntaje_buro", ID_COL], ascending=[False, True, True])
         [[ID_COL, "moras_ultimos_12m", "puntaje_buro", TARGET]].head(5))
o2_sql = duckdb.sql('SELECT id_cliente, moras_ultimos_12m, puntaje_buro, "default" FROM df '
                    "ORDER BY moras_ultimos_12m DESC, puntaje_buro ASC, id_cliente ASC LIMIT 5").df()
coinciden(o2_pd, o2_sql)
o2_sql

# %% [markdown]
# ### 4.4 Agregaciones
#
# **`groupby` + `agg`:** tasa de impago por situación laboral (pandas excluye el grupo nulo por defecto; en
# SQL se excluye con `IS NOT NULL`).

# %%
agg_pd = (df.groupby("situacion_laboral")
          .agg(clientes=(TARGET, "size"), tasa_default=(TARGET, "mean"),
               ingreso_mediano=("ingreso_mensual", "median"), puntaje_medio=("puntaje_buro", "mean"))
          .sort_values("tasa_default", ascending=False).reset_index())
agg_sql = duckdb.sql("""
    SELECT situacion_laboral, COUNT(*) AS clientes, AVG("default") AS tasa_default,
           MEDIAN(ingreso_mensual) AS ingreso_mediano, AVG(puntaje_buro) AS puntaje_medio
    FROM df WHERE situacion_laboral IS NOT NULL
    GROUP BY situacion_laboral ORDER BY tasa_default DESC
""").df()
coinciden(agg_pd, agg_sql)
agg_sql

# %% [markdown]
# **`pivot_table`:** tasa de impago por nivel educativo (filas) y tipo de vivienda (columnas). DuckDB tiene
# la sentencia `PIVOT`; el orden ordinal de la educación se impone con `list_position`.

# %%
orden_edu = config.CATEGORIAS["nivel_educativo"]
piv_pd = (pd.pivot_table(df, values=TARGET, index="nivel_educativo", columns="tipo_vivienda", aggfunc="mean")
          .reindex(orden_edu).rename_axis(columns=None).reset_index())
piv_sql = duckdb.sql(f"""
    SELECT * FROM (
        PIVOT (SELECT nivel_educativo, tipo_vivienda, "default" FROM df WHERE tipo_vivienda IS NOT NULL)
        ON tipo_vivienda USING AVG("default") GROUP BY nivel_educativo
    ) ORDER BY list_position({orden_edu}, nivel_educativo)
""").df()
coinciden(piv_pd, piv_sql)
piv_sql

# %% [markdown]
# **`value_counts(normalize=True)`:** composición de la cartera por propósito del crédito. En SQL, la
# proporción es el conteo del grupo sobre el total (función de ventana `SUM(COUNT(*)) OVER ()`).

# %%
vc_pd = df["proposito"].value_counts(normalize=True).rename("proporcion").reset_index()
vc_sql = duckdb.sql("SELECT proposito, COUNT(*) / SUM(COUNT(*)) OVER () AS proporcion FROM df "
                    "GROUP BY proposito ORDER BY proporcion DESC").df()
coinciden(vc_pd, vc_sql)
vc_sql

# %% [markdown]
# **Lectura.** Las **11 comparaciones** pandas ↔ DuckDB coinciden en orden y valores: SQL en proceso es una
# forma equivalente (y a menudo más legible) de hacer las mismas operaciones. El filtrado ya muestra señales
# fuertes: con al menos una mora el impago sube a **59,7 %** (4.074 clientes) frente al 35,63 % global, y con
# buró < 600 y uso del cupo > 0,7 llega a **87,7 %** (1.177 clientes); la combinación ingreso bajo y monto alto
# lo eleva mucho menos (43 %, 263 clientes). Por situación laboral, los desempleados (62 %) e independientes
# (39 %) superan a empleados (33 %) y pensionados (24 %); los desempleados tienen además el menor ingreso
# mediano (1.005.000 COP) y el menor buró medio (605). En la tabla dinámica la tasa baja con el nivel educativo
# en los tres tipos de vivienda y, a igual educación, la vivienda propia tiene la menor tasa salvo en Posgrado
# (Familiar 0,24 frente a Propia 0,26). Libre inversión es el propósito más frecuente (28 % de la cartera).

# %% [markdown]
# ## 5. P1.5 · Visualizaciones exploratorias
#
# Para que los errores de digitación no aplasten los ejes, ingreso y monto se muestran hasta su
# **percentil 99** y la edad dentro del rango válido (`config.EDAD_VALIDA`); los atípicos se tratan en los
# notebooks 03 y 04.
#
# ### 5.1 Histogramas de las variables numéricas clave

# %%
def hasta_p99(s: pd.Series) -> pd.Series:
    s = s.dropna()
    return s[s <= s.quantile(0.99)]


specs = [("edad", df["edad"][df["edad"].between(*config.EDAD_VALIDA)], "Edad (años)", "edad"),
         ("ingreso_mensual", hasta_p99(df["ingreso_mensual"]) / 1e6, "Ingreso mensual (millones COP, ≤ p99)", "ingreso"),
         ("monto_credito", hasta_p99(df["monto_credito"]) / 1e6, "Monto del crédito (millones COP, ≤ p99)", "monto")]
fig, axes = plt.subplots(2, 2, figsize=(13, 8))
for ax, (col, serie, xlabel, clave) in zip(axes.ravel(), specs):
    # edad es entera: cajas de 2 años alineadas a los enteros (40 cajas arbitrarias crean un patrón de sierra)
    bins = np.arange(serie.min() - 0.5, serie.max() + 1.5, 2) if col == "edad" else 40
    conteos, bordes = np.histogram(serie, bins=bins)
    ax.hist(serie, bins=bordes, color=PALETA["acento"], alpha=0.85)
    ax.set(title=f"Histograma de {col}", xlabel=xlabel, ylabel="Número de clientes")
    figura_front("histograma", f"Histograma de {col}",
                 {"bordes": bordes.round(4).tolist(), "series": [{"nombre": "Clientes", "conteos": conteos.tolist()}]},
                 ejes={"x": xlabel, "y": "Número de clientes"}, clave=f"hist_{clave}", opciones={"formato_y": "num"})
plazos = df["plazo_meses"].value_counts().sort_index()
ax = axes[1, 1]
ax.bar(plazos.index.astype(str), plazos.values, color=PALETA["acento"], alpha=0.85)
ax.set(title="Histograma de plazo_meses (variable discreta)", xlabel="Plazo (meses)", ylabel="Número de clientes")
plt.show()
figura_front("barras", "Histograma de plazo_meses (variable discreta)",
             {"categorias": plazos.index.astype(str).tolist(), "series": [{"nombre": "Clientes", "valores": plazos.tolist()}]},
             ejes={"x": "Plazo (meses)", "y": "Número de clientes"}, clave="hist_plazo", opciones={"formato_y": "num"})
pd.DataFrame({col: {"media": s.mean(), "mediana": s.median(), "asimetria": s.skew()} for col, s, *_ in specs}
             | {"plazo_meses": {"media": df["plazo_meses"].mean(), "mediana": df["plazo_meses"].median(),
                                "asimetria": df["plazo_meses"].skew()}}).T

# %% [markdown]
# **Interpretación.** La **edad** válida se reparte de forma casi uniforme entre 18 y 80 años (media 48,8,
# mediana 49 y asimetría 0,02). **Ingreso** y **monto** tienen asimetría positiva (1,19 y 2,56): la media
# supera a la mediana (2,51 frente a 2,23 millones en ingreso; 19,6 frente a 12,2 millones en monto) por una
# cola larga a la derecha, típica de las variables monetarias, que pide escala logarítmica o *capping* (paso 4).
# El **plazo** es discreto, con 9 valores entre 6 y 84 meses; 24 y 36 meses son los más frecuentes.

# %% [markdown]
# ### 5.2 Histogramas por clase de las variables de buró y endeudamiento
#
# Densidad (área = 1 en cada clase) para comparar formas aunque haya más pagadores que impagos.

# %%
vars_buro = [("puntaje_buro", "Puntaje de buró"), ("uso_cupo_tarjetas", "Uso del cupo de tarjetas (0-1)"),
             ("relacion_deuda_ingreso", "Relación deuda/ingreso")]
fig, axes = plt.subplots(1, 3, figsize=(15, 4.2))
for ax, (col, xl) in zip(axes, vars_buro):
    datos = df[[col, TARGET]].dropna()
    bordes = np.histogram_bin_edges(datos[col], bins=40)
    series = []
    for clase in (0, 1):
        dens, _ = np.histogram(datos.loc[datos[TARGET] == clase, col], bins=bordes, density=True)
        ax.stairs(dens, bordes, color=COLORES_CLASE[clase], lw=1.8, label=NOMBRE_CLASE[clase])
        series.append({"nombre": NOMBRE_CLASE[clase], "conteos": dens.round(4).tolist()})
    ax.set(title=f"Distribución de {col} por default", xlabel=xl, ylabel="Densidad")
    ax.legend(fontsize=8)
    figura_front("histograma", f"Distribución de {col} por default", {"bordes": bordes.round(4).tolist(), "series": series},
                 ejes={"x": xl, "y": "Densidad"}, clave=f"hist_{col}_por_default", opciones={"normalizado": "densidad"})
plt.show()
df.groupby(TARGET)[[c for c, _ in vars_buro]].median().rename(index=NOMBRE_CLASE).rename_axis("mediana por clase")

# %% [markdown]
# **Interpretación.** Las tres variables separan las clases: los impagos se desplazan hacia **puntajes de buró
# bajos** (mediana 628 frente a 756), **uso del cupo alto** (0,62 frente a 0,36) y **relación deuda/ingreso
# alta** (0,70 frente a 0,47). Las distribuciones se solapan, así que ninguna basta sola, pero las tres son
# candidatas fuertes a predictores.

# %% [markdown]
# ### 5.3 Diagramas de dispersión
#
# Muestra aleatoria de 3.000 clientes (semilla del proyecto) para que los puntos no se tapen.

# %%
d = df[(df["ingreso_mensual"] <= df["ingreso_mensual"].quantile(0.99)) &
       (df["monto_credito"] <= df["monto_credito"].quantile(0.99))]
d = d.sample(min(3000, len(d)), random_state=config.RANDOM_STATE)
fig, ax = plt.subplots(figsize=(8.5, 5.5))
series = []
for clase in (0, 1):
    s = d[d[TARGET] == clase]
    x, y = s["ingreso_mensual"] / 1e6, s["monto_credito"] / 1e6
    ax.scatter(x, y, s=14, alpha=0.5, color=COLORES_CLASE[clase], label=NOMBRE_CLASE[clase])
    series.append({"nombre": NOMBRE_CLASE[clase], "puntos": np.column_stack([x, y]).round(4).tolist()})
ax.set(title="Ingreso vs monto del crédito, coloreado por default",
       xlabel="Ingreso mensual (millones COP)", ylabel="Monto del crédito (millones COP)")
ax.legend(title="default")
plt.show()
figura_front("dispersion", "Ingreso vs monto del crédito, coloreado por default", {"series": series},
             ejes={"x": "Ingreso mensual (millones COP)", "y": "Monto del crédito (millones COP)"},
             clave="dispersion_ingreso_monto", nota="Muestra aleatoria de 3.000 clientes (≤ p99)")
print(f"Correlación de Pearson ingreso-monto (muestra): {d['ingreso_mensual'].corr(d['monto_credito']):.3f}")
print("Mediana del monto/ingreso por clase:",
      (d["monto_credito"] / d["ingreso_mensual"]).groupby(d[TARGET]).median().round(2).rename(NOMBRE_CLASE).to_dict())

# %% [markdown]
# **Interpretación.** El monto crece con el ingreso (correlación de Pearson 0,397 en la muestra), con mucha
# dispersión. Los impagos no forman una región separada en este plano: la mediana del cociente monto/ingreso es
# apenas mayor en los impagos (5,25 frente a 5,0). Ingreso y monto discriminan poco por sí solos; se combinarán
# en ratios (cuota/ingreso y monto/ingreso) en el paso 3.

# %%
d2 = df.dropna(subset=["puntaje_buro", "uso_cupo_tarjetas"])
d2 = d2.sample(min(3000, len(d2)), random_state=config.RANDOM_STATE)
fig, ax = plt.subplots(figsize=(8.5, 5.5))
series = []
for clase in (0, 1):
    s = d2[d2[TARGET] == clase]
    ax.scatter(s["puntaje_buro"], s["uso_cupo_tarjetas"], s=14, alpha=0.5, color=COLORES_CLASE[clase],
               label=NOMBRE_CLASE[clase])
    series.append({"nombre": NOMBRE_CLASE[clase],
                   "puntos": s[["puntaje_buro", "uso_cupo_tarjetas"]].round(4).values.tolist()})
ax.set(title="Puntaje de buró vs uso del cupo de tarjetas, por default",
       xlabel="Puntaje de buró", ylabel="Uso del cupo de tarjetas (0-1)")
ax.legend(title="default")
plt.show()
figura_front("dispersion", "Puntaje de buró vs uso del cupo de tarjetas, por default", {"series": series},
             ejes={"x": "Puntaje de buró", "y": "Uso del cupo de tarjetas (0-1)"},
             clave="dispersion_buro_cupo", nota="Muestra aleatoria de 3.000 clientes")
zona = (d2["puntaje_buro"] < 600) & (d2["uso_cupo_tarjetas"] > 0.7)
print(f"En la muestra: buró < 600 y cupo > 0,7 -> {int(zona.sum())} clientes, impago {d2.loc[zona, TARGET].mean():.1%}; "
      f"resto -> impago {d2.loc[~zona, TARGET].mean():.1%}")

# %% [markdown]
# **Interpretación.** Aquí sí hay separación visible: los impagos se acumulan en la zona de **buró bajo y uso
# del cupo alto**, y los buenos pagadores dominan la de buró alto y uso bajo. En la muestra, los 300 clientes
# con buró < 600 y cupo > 0,7 tienen un impago del 89,0 %, frente al 30,2 % del resto. Las dos variables se
# complementan.

# %% [markdown]
# ### 5.4 Boxplots por clase
#
# Cajas = cuartiles; bigotes = último dato dentro de 1,5 × IQR (convención de Tukey); los puntos fuera de los
# bigotes no se dibujan para no saturar la figura.

# %%
cols_box = [("puntaje_buro", "Puntaje de buró"), ("uso_cupo_tarjetas", "Uso del cupo (0-1)"),
            ("relacion_deuda_ingreso", "Relación deuda/ingreso"), ("edad", "Edad (años)"),
            ("antiguedad_laboral_anios", "Antigüedad laboral (años)"),
            ("ingreso_mensual", "Ingreso mensual (millones COP, ≤ p99)")]
fig, axes = plt.subplots(2, 3, figsize=(15, 8))
medianas = {}
for ax, (col, yl) in zip(axes.ravel(), cols_box):
    datos = df[[col, TARGET]].dropna()
    if col == "edad":
        datos = datos[datos["edad"].between(*config.EDAD_VALIDA)]
    if col == "ingreso_mensual":
        datos = datos[datos[col] <= datos[col].quantile(0.99)].assign(ingreso_mensual=lambda x: x[col] / 1e6)
    stats = [boxplot_stats(datos.loc[datos[TARGET] == clase, col].to_numpy())[0] for clase in (0, 1)]
    cajas = ax.bxp(stats, showfliers=False, patch_artist=True, widths=0.55,
                   whiskerprops={"color": PALETA["texto_suave"]}, capprops={"color": PALETA["texto_suave"]})
    for caja, clase in zip(cajas["boxes"], (0, 1)):
        caja.set(facecolor=COLORES_CLASE[clase], alpha=0.75, edgecolor=PALETA["texto"])
    for med in cajas["medians"]:
        med.set(color=PALETA["texto"], lw=2)
    ax.set_xticks([1, 2], [NOMBRE_CLASE[0], NOMBRE_CLASE[1]])
    ax.set(title=f"{col} por default", xlabel="default", ylabel=yl)
    medianas[col] = {NOMBRE_CLASE[c]: st["med"] for c, st in zip((0, 1), stats)}
    figura_front("boxplot", f"{col} por default",
                 {"categorias": [NOMBRE_CLASE[0], NOMBRE_CLASE[1]],
                  "series": [{"nombre": yl, "cajas": [[round(float(st[k]), 4) for k in ("whislo", "q1", "med", "q3", "whishi")]
                                                       for st in stats]}]},
                 ejes={"x": "default", "y": yl}, clave=f"box_{col}", nota="Bigotes a 1,5 × IQR (Tukey)")
plt.show()
pd.DataFrame(medianas).T.rename_axis("mediana")

# %% [markdown]
# **Interpretación.** Las medianas de **puntaje de buró** (756 frente a 628), **uso del cupo** (0,36 frente a
# 0,62) y **deuda/ingreso** (0,47 frente a 0,70) difieren claramente y sus cajas (rango intercuartílico) se
# solapan poco. Los impagos son algo **más jóvenes** (mediana 46 frente a 50 años), con **menos antigüedad
# laboral** (7,2 frente a 9,9 años) e **ingreso algo menor** (2,11 frente a 2,29 millones); en estas tres las
# cajas se solapan mucho, por lo que su poder predictivo individual es menor. La diferencia de edad es la que
# el notebook 01 marcó como riesgo de equidad.

# %% [markdown]
# ### 5.5 Barras: tasa de impago por categoría

# %%
cats = ["situacion_laboral", "nivel_educativo", "tipo_vivienda", "proposito", "estado_civil", "sexo"]
tasa_global = df[TARGET].mean()
fig, axes = plt.subplots(2, 3, figsize=(16, 8.5))
tasas_cat = {}
for ax, col in zip(axes.ravel(), cats):
    tasa = df.groupby(col)[TARGET].mean().sort_values()
    tasas_cat[col] = tasa
    ax.barh(tasa.index, tasa.values, color=PALETA["impago"], alpha=0.85)
    ax.axvline(tasa_global, ls="--", color=PALETA["texto_suave"], lw=1, label=f"Promedio global {tasa_global:.1%}")
    for i, v in enumerate(tasa.values):
        ax.text(v + 0.005, i, f"{v:.1%}", va="center", fontsize=9, color=PALETA["texto"])
    ax.set(title=f"Tasa de impago por {col}", xlabel="Tasa de impago", ylabel=col, xlim=(0, max(0.75, tasa.max() + 0.08)))
    figura_front("barras_h", f"Tasa de impago por {col}",
                 {"categorias": tasa.index.tolist(), "series": [{"nombre": "Tasa de impago", "valores": tasa.round(4).tolist()}],
                  "referencias": [{"eje": "x", "valor": round(float(tasa_global), 4), "etiqueta": "Promedio global"}]},
                 ejes={"x": "Tasa de impago", "y": col}, clave=f"impago_por_{col}", opciones={"formato_x": "pct"})
axes[0, 0].legend(loc="lower right", fontsize=8)
plt.show()

# %% [markdown]
# **Interpretación.** La **situación laboral** es la categórica más discriminante (desempleados 62,0 % frente
# a pensionados 24,0 %). El **nivel educativo** muestra un gradiente monótono (Primaria 44,2 % → Posgrado
# 26,7 %), lo que respalda codificarlo como ordinal. La vivienda **propia** (30,3 %) tiene menos impago que el
# arriendo (40,1 %); por propósito, **vivienda** es el más riesgoso (42,6 %) y **libre inversión** el que menos
# (31,2 %). En **estado civil** (34,7 %–37,9 %) y **sexo** (F 35,9 %, M 35,4 %) las diferencias son pequeñas,
# coherentes con la línea base de equidad del notebook 01; `sexo` no se usará como predictor.

# %%
tasa_moras = df.groupby(df["moras_ultimos_12m"].clip(upper=5))[TARGET].agg(tasa="mean", clientes="size")
etiquetas = [str(int(i)) if i < 5 else "5+" for i in tasa_moras.index]
fig, ax = plt.subplots(figsize=(8.5, 4.2))
ax.bar(etiquetas, tasa_moras["tasa"], color=PALETA["impago"], alpha=0.85)
for i, (v, n) in enumerate(tasa_moras[["tasa", "clientes"]].itertuples(index=False)):
    ax.text(i, v + 0.015, f"{v:.0%}\nn={n:,}", ha="center", fontsize=8, color=PALETA["texto"])
ax.set(title="Tasa de impago según las moras de los últimos 12 meses", xlabel="Moras en los últimos 12 meses",
       ylabel="Tasa de impago", ylim=(0, 1.1))
plt.show()
figura_front("barras", "Tasa de impago según las moras de los últimos 12 meses",
             {"categorias": etiquetas, "series": [{"nombre": "Tasa de impago", "valores": tasa_moras["tasa"].round(4).tolist()}],
              "n": tasa_moras["clientes"].astype(int).tolist()},
             ejes={"x": "Moras en los últimos 12 meses", "y": "Tasa de impago"}, clave="impago_por_moras",
             opciones={"formato_y": "pct"})
tasa_moras

# %% [markdown]
# **Interpretación.** El impago sube de forma monótona con las moras previas: 23 % sin moras (8.070
# clientes), 50 % con una, 74 % con dos, 90 % con tres y 94 % con cuatro; los 81 clientes con cinco o más
# moras incumplieron todos. El historial de pago es de los predictores más potentes, lo que justifica la
# variable `tiene_moras_previas` del paso 3.

# %%
lab = tasas_cat["situacion_laboral"]
edu = tasas_cat["nivel_educativo"]
sx = tasas_cat["sexo"]
display(Markdown(f"""
**Resumen calculado.**

- **P1.3:** {df.shape[0]:,} filas × {df.shape[1]} columnas; tasa de default **{df[TARGET].mean():.2%}**.
  Nulos en **{len(nulos)} columnas** (máximo `{nulos.index[0]}` {nulos['pct'].iloc[0]:.1f} %, mínimo
  `{nulos.index[-1]}` {nulos['pct'].iloc[-1]:.1f} %); **{dup_exactos} filas duplicadas** exactas,
  **{dup_id} IDs repetidos** y **{int(edad_invalida.sum())} edades** fuera de {config.EDAD_VALIDA}.
- **P1.4:** las 11 operaciones dieron el mismo resultado en pandas y en DuckDB. Con moras previas el impago es
  **{f1_pd['tasa_default'].iloc[0]:.1%}**; con buró < 600 y cupo > 0,7, **{q_pd[TARGET].mean():.1%}**
  ({len(q_pd):,} clientes).
- **P1.5:** situación laboral de {lab.idxmax()} {lab.max():.1%} frente a {lab.idxmin()} {lab.min():.1%};
  educación de {edu.idxmax()} {edu.max():.1%} a {edu.idxmin()} {edu.min():.1%}; sexo
  {', '.join(f'{k} {v:.1%}' for k, v in sx.items())}. Impago con 0 moras {tasa_moras['tasa'].iloc[0]:.1%} y con
  5+ moras {tasa_moras['tasa'].iloc[-1]:.1%}.
"""))

# %% [markdown]
# ## Conclusiones
#
# - **P1.1–P1.2 (P1.E1):** el entorno queda documentado: `setup()` fija la semilla 42 y el estilo, y reporta
#   Python 3.10.7, pandas 2.3.3, NumPy 1.26.4, Matplotlib 3.10.9, Seaborn 0.13.2 y DuckDB 1.5.6. La celda
#   `if en_colab(): ...` deja listo el camino de Google Colab (instalar el paquete y subir el CSV si falta).
# - **P1.3 (P1.E2, E3):** 12.144 filas × 21 columnas con una tasa de impago del **35,63 %**. Problemas de
#   calidad que se tratan en el notebook 03: nulos en 7 columnas (hasta 9,21 % en `antiguedad_laboral_anios`),
#   144 filas duplicadas exactas, 25 edades imposibles y montos o ingresos con errores de digitación (máximo de
#   monto 1.033.300.000 COP).
# - **P1.4 (P1.E3):** selección, filtrado, `query`, ordenamiento, `groupby`, `pivot_table` y `value_counts` se
#   hicieron en pandas y en **SQL con DuckDB**, con resultados idénticos en las 11 comparaciones. Las moras
#   previas (59,7 % de impago), el buró bajo con cupo alto (87,7 %) y el desempleo (62 %) elevan fuertemente el
#   riesgo.
# - **P1.5 (P1.E4):** 6 histogramas (edad, ingreso, monto y las 3 de buró/endeudamiento por clase) más la
#   distribución del plazo, 2 diagramas de dispersión, 6 boxplots y 7 gráficos de barras de tasa de impago,
#   cada uno interpretado y con sus datos exportados para el front.
# - **Variables más prometedoras:** `puntaje_buro`, `uso_cupo_tarjetas`, `moras_ultimos_12m`,
#   `relacion_deuda_ingreso`, `situacion_laboral` y `nivel_educativo`. Ingreso y monto discriminan poco por sí
#   solos y se combinarán en ratios. `sexo` no muestra diferencias relevantes y queda fuera del modelo; la edad
#   sí difiere entre clases y se audita por equidad.

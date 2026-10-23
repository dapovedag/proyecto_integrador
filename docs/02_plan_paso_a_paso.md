# 02 · Plan paso a paso (se sigue estrictamente)

> **Versión 2 (2026-10-23).** Este plan es el original del proyecto. La ejecución v2 lo cumple con los ajustes de
> los ADR (`docs/gestion/adr/`), que priman sobre el texto de abajo:
> - la lógica vive en un paquete único `Back/src/credit_risk` (no solo `models.py`/`nlp.py`);
> - la decisión es aprobar / revisar / rechazar con la regla de Chow (ADR-002), sin umbrales por grupo (ADR-003);
> - Spark corre en Docker con Java 21 (ADR-005);
> - los notebooks se escriben en formato *percent* y se ejecutan con papermill (`Back/README.md`);
> - el front es estático y reproduce la corrida real (ADR-004).

> **Reglas de ejecución**
> 1. Los pasos se ejecutan **en orden**. Un paso solo se cierra cuando cumple su **criterio de hecho**.
> 2. Cada paso produce **un entregable** en la ruta indicada. Si no existe el archivo, el paso no está hecho.
> 3. Cada notebook empieza con una celda Markdown que lista los **IDs del enunciado** que cubre ([01_enunciado.md](01_enunciado.md)) y termina con una celda de **conclusiones**.
> 4. Todo el código del back vive en `Back/`; los datos, en `db/`; la documentación, en `docs/`. El front (`Front/`) solo consume el paquete de corrida que exporta el back (ADR-004).
> 5. Reproducibilidad: semilla `RANDOM_STATE = 42` en todo; rutas relativas tomadas de `Back/src/credit_risk/config.py`; nada de rutas absolutas en los notebooks.
> 6. Los notebooks deben correr de principio a fin con *Restart & Run All* sin errores, y se guardan **con las salidas**.
> 7. La lógica reutilizable (limpieza, features, entrenamiento) se escribe en `Back/src/credit_risk/` y los notebooks la importan. Así la API usa exactamente el mismo preprocesamiento.

Estructura del proyecto: [04_arquitectura_backend.md](04_arquitectura_backend.md). Requisitos del dataset: [03_contrato_datos.md](03_contrato_datos.md).

---

## Paso 0: Gestión ágil del proyecto

| | |
|---|---|
| **Fase** | Transversal |
| **Cubre** | E1, R3 |
| **Entregable** | `docs/gestion/backlog.md`, `docs/gestion/sprints.md`, `docs/gestion/definicion_de_hecho.md` |

**Tareas**
1. Mantener el backlog con historias de usuario (una o más por unidad) y sus criterios de aceptación.
2. Planificar 4 sprints (ver `sprints.md`) y registrar al cierre de cada sprint: lo hecho, lo pendiente y los impedimentos (retrospectiva corta).
3. Aplicar la definición de hecho a cada historia.

**Criterio de hecho:** los tres archivos existen; cada paso de este plan corresponde a al menos una historia; cada sprint cerrado tiene su retrospectiva.

---

## Paso 1: Definición del problema y análisis ético

| | |
|---|---|
| **Fase** | F1: Definir el problema |
| **Cubre** | IA1.1, IA1.3, E5, F1 |
| **Entregable** | `Back/notebooks/01_definicion_problema_etica.ipynb` |

**Tareas**
1. **Contexto de negocio:** una institución financiera necesita estimar la probabilidad de impago (PD) de un solicitante antes de aprobar un crédito. Describir quién usa el modelo (analista de crédito), la decisión que apoya (aprobar, rechazar o revisar) y el costo de cada error (un falso negativo es una pérdida por impago; un falso positivo es un cliente bueno rechazado).
2. **Formulación técnica:** clasificación binaria supervisada; variable objetivo `default` (1 = impago); la salida es una **probabilidad** entre 0 y 1 más una **banda de riesgo** (Bajo, Medio, Alto).
3. **Exploración de datasets financieros:** documentar la fuente usada (ver `docs/diccionario_datos.md`) y compararla en una tabla con al menos 2 alternativas públicas (por ejemplo German Credit de UCI, Default of Credit Card Clients de UCI, Give Me Some Credit de Kaggle). Justificar la elección.
4. **Métricas de éxito:** principal, ROC-AUC; secundarias: recall de la clase impago, F1, KS y Brier score. Meta mínima: AUC ≥ 0.70 en test.
5. **Análisis ético:**
   - Identificar las **variables sensibles** (sexo, edad, estado civil y cualquier otra protegida).
   - Riesgos: sesgo histórico en las etiquetas, discriminación indirecta por proxies, falta de explicabilidad y privacidad de los datos personales.
   - Medidas: no usar `sexo` como predictor (solo para auditar); medir la **equidad** por grupo (tasa de aprobación, TPR, FPR, *disparate impact* ≥ 0.8); explicar el modelo (importancia de variables); anonimizar los IDs.
   - Referencia normativa breve (Ley 1581 de 2012 de protección de datos en Colombia y principios de IA responsable).
6. Carga inicial del CSV solo para confirmar su forma (filas, columnas, tasa de `default`).

**Criterio de hecho:** el notebook tiene las secciones Contexto, Formulación, Datasets, Métricas, Ética y Conclusión; la tabla de variables sensibles está definida y se reutiliza en el paso 8.

---

## Paso 2: Exploración y análisis preliminar (Programación, U1)

| | |
|---|---|
| **Fase** | F2: Explorar |
| **Cubre** | P1.1–P1.5, P1.E1–P1.E4, E3 |
| **Entregable** | `Back/notebooks/02_exploracion_preliminar.ipynb` |

**Tareas (una sección del notebook por ítem)**
1. **P1.1 / P1.E1: Entorno:** celda con la versión de Python y de las librerías; una nota de cómo correrlo en Jupyter local y en Google Colab (montar Drive o subir el CSV).
2. **P1.2 / P1.E1: Librerías:** `import pandas as pd, numpy as np, matplotlib.pyplot as plt, seaborn as sns`; configuración de estilo y de `pd.options.display`.
3. **P1.3 / P1.E2: Carga e inspección:** `read_csv` desde `config.RAW_DATA_PATH`; `shape`, `head()`, `tail()`, `sample()`, `info()`, `dtypes`, `describe()` (numéricas y categóricas), `nunique()`, conteo de nulos y de duplicados (solo se reportan, se tratan en el paso 3) y distribución de `default`.
4. **P1.4 / P1.E3: Operaciones básicas**, con al menos un ejemplo de cada una:
   - Selección: columnas por nombre y por tipo (`select_dtypes`), y `loc`/`iloc`.
   - Filtrado: condiciones simples y compuestas (por ejemplo, ingreso bajo y monto alto) y `query()`.
   - Ordenamiento: `sort_values` por una y por varias columnas.
   - Agregaciones: `groupby` + `agg` (tasa de impago por categoría), `pivot_table` y `value_counts(normalize=True)`.
5. **P1.5 / P1.E4: Visualizaciones:**
   - Histogramas de las variables numéricas clave (edad, ingreso, monto, plazo).
   - Diagramas de dispersión (por ejemplo, ingreso vs monto coloreado por `default`).
   - Boxplots de las variables numéricas por `default`.
   - Barras de la tasa de impago por categoría.
   - Cada gráfico lleva título, ejes con nombre y una línea de interpretación debajo.

**Criterio de hecho:** las 5 secciones existen, con al menos 3 histogramas, 2 de dispersión y 3 boxplots; cada gráfico está interpretado.

---

## Paso 3: Limpieza, estructuración y preparación (Programación, U2)

| | |
|---|---|
| **Fase** | F2: Preparar |
| **Cubre** | P2.1–P2.6, P2.E1–P2.E4 |
| **Entregable** | `Back/notebooks/03_limpieza_preparacion.ipynb` + `Back/src/credit_risk/{data.py,features.py}` + `db/processed/` |

**Tareas**
1. **P2.1 / P2.E1: Faltantes y duplicados:**
   - Reporte de nulos por columna (conteo y %) con un heatmap de nulos.
   - Eliminar los duplicados exactos y los duplicados por ID; reportar cuántos se eliminaron.
   - Imputar: mediana en las numéricas, moda o la categoría `"Desconocido"` en las categóricas. Justificar si alguna columna con más del 40 % de nulos se elimina.
   - Corregir los tipos y los valores inválidos (edades fuera de 18–100, montos negativos, categorías mal escritas).
2. **P2.4: Nuevas variables** (mínimo 3, con su justificación de negocio): `ratio_cuota_ingreso`, `ratio_monto_ingreso`, `cuota_estimada` (amortización con la tasa y el plazo), `rango_edad`, `tiene_moras_previas` y la `longitud_texto` de la columna de texto.
3. **P2.6 / P2.E4: División train/test** **antes** de ajustar escaladores y encoders (para evitar *data leakage*): `train_test_split(test_size=0.2, stratify=y, random_state=42)`. Reportar la tasa de `default` en cada conjunto.
4. **P2.2 / P2.E2: Codificación:**
   - One-Hot Encoding para las categóricas nominales (`OneHotEncoder(handle_unknown="ignore")`).
   - Label u Ordinal Encoding para las ordinales (nivel educativo, rango de edad) y mostrar el mapeo.
5. **P2.3 / P2.E2: Escalamiento:** mostrar **ambas** técnicas sobre las numéricas: `MinMaxScaler` (normalización) y `StandardScaler` (estandarización), con un antes y un después (histograma o `describe`). Elegir una para el pipeline y justificar.
6. **P2.E3: Selección de características:** correlación con el objetivo, información mutua (`mutual_info_classif`) y la importancia de un árbol base. Tabla final con las variables seleccionadas.
7. **P2.5: Reducción de dimensionalidad:** probar PCA sobre las variables escaladas y mostrar la varianza explicada acumulada. Decidir si se usa: si hacen falta menos del 90 % de las componentes para el 95 % de la varianza, se documenta; si no, se justifica no usarlo.
8. Todo lo anterior se empaqueta en un **`sklearn.Pipeline` + `ColumnTransformer`** en `features.py` (función `build_preprocessor()`).
9. Exportar a `db/processed/`: `train.csv`, `test.csv` (limpios, sin escalar) y `feature_list.json`.

**Criterio de hecho:** ningún nulo ni duplicado en los datos procesados; el pipeline se ajusta solo con train; existen `db/processed/train.csv`, `test.csv` y `feature_list.json`; el notebook muestra las 4 partes del entregable P2.E1–E4.

---

## Paso 4: EDA avanzado, transformación y visualización (IA, U1 y U2)

| | |
|---|---|
| **Fase** | F2: Explorar y transformar |
| **Cubre** | IA1.2, IA1.E1, IA1.E2, IA2.1–IA2.5, IA2.E1, IA2.E2 |
| **Entregable** | `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` |

**Tareas**
1. **IA1.2 / IA1.E1: EDA:** análisis univariado, bivariado (cada variable vs `default`) y multivariado; tasa de impago por segmentos.
2. **IA2.1 / IA2.2: Manipulación con Pandas:** `merge` (por ejemplo, unir tablas de tasas agregadas por segmento), `melt`/`pivot`, `apply`/`map`, `cut`/`qcut`, `groupby` con varias agregaciones y encadenamiento con `assign` y `pipe`. **dplyr:** una celda Markdown con el equivalente en R de 3 operaciones (`filter`, `select`, `group_by %>% summarise`) para cubrir la mención, ya que el notebook es en Python.
3. **IA2.3: Visualización con las tres librerías:**
   - Matplotlib: figura con subplots.
   - Seaborn: `heatmap` de correlaciones, `pairplot` y `violinplot`.
   - ggplot2: con **plotnine** (la gramática de ggplot2 en Python): `ggplot(aes(...)) + geom_* + facet_wrap`.
4. **IA2.E1: Patrones y correlaciones:** matriz de correlación (Pearson y Spearman), V de Cramér para las categóricas vs `default`, y las 5 hipótesis o hallazgos principales en texto.
5. **IA2.5: Atípicos:** detectar con IQR y z-score (\|z\| > 3); visualizar con boxplots; tratar con *winsorizing* o *capping* en p1–p99 (justificar por qué no se eliminan filas). Comparar las distribuciones antes y después.
6. **IA2.4: Normalización, estandarización y PCA:** aplicar sobre los datos sin atípicos; PCA en 2D coloreado por `default`; *scree plot* y *loadings* de las primeras componentes.
7. **IA1.E2 / IA2.E2: Variables relevantes y optimización:** tabla final con el ranking de variables (correlación, información mutua, V de Cramér) y la decisión de cuáles entran al modelo. Si cambia algo respecto al paso 3, se actualiza `features.py`.

**Criterio de hecho:** el notebook contiene gráficos de Matplotlib, Seaborn y plotnine; el tratamiento de atípicos se documenta antes y después; el PCA tiene varianza explicada y una proyección en 2D; hay una tabla final de variables relevantes.

---

## Paso 5: Modelos clásicos de Machine Learning

| | |
|---|---|
| **Fase** | F3: Analizar y modelar |
| **Cubre** | IA3.3 (lado clásico), R1, F3 |
| **Entregable** | `Back/notebooks/05_modelos_clasicos.ipynb` + `Back/src/credit_risk/models.py` |

**Tareas**
1. Cargar `db/processed/train.csv` y `test.csv` y usar `build_preprocessor()`.
2. Entrenar, cada uno dentro de un `Pipeline(preprocesador + modelo)`:
   - Línea base: `DummyClassifier`.
   - `LogisticRegression` (con `class_weight="balanced"`).
   - `RandomForestClassifier`.
   - `GradientBoostingClassifier` o `HistGradientBoostingClassifier`.
3. Validación cruzada estratificada de 5 *folds* en train (ROC-AUC).
4. Evaluar en test: ROC-AUC, PR-AUC, accuracy, precision, recall, F1, KS, Brier; matriz de confusión; curvas ROC y PR superpuestas.
5. Interpretabilidad: coeficientes de la regresión logística e importancia por permutación.
6. Guardar los resultados en `Back/models/resultados_clasicos.json`.

**Criterio de hecho:** 4 modelos más la línea base, evaluados con las mismas métricas; la tabla comparativa existe; el mejor modelo supera a la línea base y llega a AUC ≥ 0.70 (si no, se documenta la causa).

---

## Paso 6: Redes neuronales (CNN/RNN) en TensorFlow/Keras

| | |
|---|---|
| **Fase** | F3: Analizar y modelar |
| **Cubre** | IA3.2, IA3.E2, IA3.3 |
| **Entregable** | `Back/notebooks/06_red_neuronal.ipynb` + `Back/models/red_neuronal.keras` |

**Tareas**
1. Reutilizar el preprocesador del paso 3 (ajustado en train) para obtener matrices numéricas; separar un conjunto de validación desde train.
2. **MLP base** (Dense + Dropout + BatchNormalization) como referencia.
3. **CNN 1D** sobre el vector de características (`Conv1D → GlobalMaxPooling → Dense`), con la entrada reformada a `(n_features, 1)`.
4. **RNN (LSTM o GRU)** sobre la **columna de texto** tokenizada (`TextVectorization → Embedding → LSTM → Dense`), que conecta con el NLP del paso 7. Si se hace un modelo híbrido (texto + tabular con la API funcional de Keras), mejor aún.
5. Entrenamiento: `binary_crossentropy`, Adam, `class_weight` para el desbalance, `EarlyStopping(restore_best_weights=True)`, `ModelCheckpoint`. Métricas de Keras: AUC, Precision y Recall.
6. Curvas de *loss* y AUC en train y validación para cada red; discutir el sobreajuste.
7. Evaluar en test con **las mismas métricas del paso 5** y agregar las filas a la tabla comparativa.
8. **IA3.3: Comparación clásicos vs Deep Learning:** tabla y gráfico (AUC, F1, recall, tiempo de entrenamiento e interpretabilidad) y una conclusión escrita.

**Criterio de hecho:** al menos una CNN y una RNN entrenadas y evaluadas en test; las curvas de aprendizaje están en el notebook; el modelo está guardado en `.keras`; existe la tabla comparativa clásicos vs DL.

---

## Paso 7: NLP aplicado al riesgo de crédito

| | |
|---|---|
| **Fase** | F3: Analizar y modelar |
| **Cubre** | IA3.1, IA3.E1, R2 |
| **Entregable** | `Back/notebooks/07_nlp_riesgo.ipynb` + `Back/src/credit_risk/nlp.py` + `Back/models/modelo_nlp.joblib` |

**Tareas**
1. **Análisis de texto clásico:** limpieza (minúsculas, tildes, stopwords en español), tokenización, frecuencias, n-gramas y palabras más asociadas a `default=1` vs `default=0`.
2. **Línea base NLP:** `TfidfVectorizer + LogisticRegression` que predice `default` **solo con el texto**. Métricas en test.
3. **Sentiment Analysis con BERT:** modelo preentrenado de Hugging Face multilingüe (por ejemplo `nlptown/bert-base-multilingual-uncased-sentiment`) que produce un puntaje de sentimiento por texto. Analizar la relación entre el sentimiento y `default`.
4. **Embeddings con BERT:** `sentence-transformers` multilingüe (por ejemplo `paraphrase-multilingual-MiniLM-L12-v2`) → vector por texto → clasificador.
5. **GPT:** usar un GPT local y gratuito (por ejemplo `gpt2` o una variante en español de Hugging Face) para extraer embeddings (promedio del último *hidden state*) y compararlos con BERT. Opcional: clasificación *zero-shot* por *prompt*. **Sin APIs de pago.**
6. **Modelo NLP de predicción de riesgo (IA3.E1):** el mejor modelo de texto, más un modelo **combinado** (variables tabulares + puntaje de sentimiento + embeddings reducidos) que muestre si el texto agrega valor sobre el modelo tabular (ΔAUC).
7. Guardar el modelo NLP servible (TF-IDF + LR, liviano) en `Back/models/modelo_nlp.joblib`.
8. Las inferencias de BERT y GPT se cachean en `db/processed/nlp_features.parquet` para no recalcularlas.

**Criterio de hecho:** el notebook contiene análisis de texto, sentimiento con BERT, embeddings BERT vs GPT, el modelo NLP evaluado en test y el ΔAUC del modelo combinado; el `.joblib` existe.

---

## Paso 8: Evaluación, optimización y auditoría de equidad

| | |
|---|---|
| **Fase** | F4: Evaluar y optimizar |
| **Cubre** | F4, IA3.3 (comparación final), IA1.3 (auditoría), R1 |
| **Entregable** | `Back/notebooks/08_evaluacion_optimizacion.ipynb` + `Back/models/modelo_final.joblib` + `Back/models/model_card.json` |

**Tareas**
1. Optimizar los hiperparámetros de los 2 mejores modelos (`RandomizedSearchCV` u Optuna, CV estratificada, métrica ROC-AUC).
2. Calibrar las probabilidades (`CalibratedClassifierCV`) y comparar el Brier score antes y después.
3. Elegir el **umbral de decisión** según el costo de negocio (matriz de costos FN > FP) y definir las **bandas de riesgo** (por ejemplo, Bajo < p₁ ≤ Medio < p₂ ≤ Alto).
4. **Comparación final** de todos los modelos (clásicos, DL y NLP combinado) en una sola tabla. Elegir el modelo final con un criterio explícito (desempeño, interpretabilidad, costo de servirlo).
5. **Auditoría de equidad** sobre las variables sensibles del paso 1: tasa de aprobación, TPR y FPR por grupo, y *disparate impact*. Si se incumple, aplicar mitigación (quitar el proxy o ajustar umbrales) y documentar.
6. Explicabilidad: importancia global de variables y explicación de 3 casos individuales.
7. Serializar el **pipeline completo** (preprocesamiento + modelo + umbral) en `Back/models/modelo_final.joblib` y escribir `model_card.json` (versión, fecha, variables de entrada, métricas en test, umbral, bandas, limitaciones).

**Criterio de hecho:** el modelo final está guardado y cargable con `joblib.load`; la model card está completa; la tabla de equidad y la decisión del umbral están documentadas.

---

## Paso 9: Integración con Big Data (Spark)

| | |
|---|---|
| **Fase** | F3/F5 |
| **Cubre** | IA3.6 |
| **Entregable** | `Back/notebooks/09_spark_big_data.ipynb` |

**Tareas**
1. `SparkSession` en modo local (`local[*]`).
2. Leer el CSV con un esquema explícito; mostrar `printSchema`, `count` y `describe`.
3. Transformaciones en Spark: `filter`, `select`, `withColumn` (las mismas variables nuevas del paso 3), `groupBy().agg()` (tasa de impago por segmento) y Spark SQL (`createOrReplaceTempView` + `spark.sql`).
4. Escribir en **Parquet particionado** (por ejemplo, por `proposito`) en `db/processed/spark/`, como analogía del almacenamiento distribuido tipo HDFS/Hadoop. Explicar en Markdown el rol de HDFS, YARN y MapReduce frente a Spark.
5. **Spark MLlib:** `Pipeline(StringIndexer, OneHotEncoder, VectorAssembler, StandardScaler, LogisticRegression)`, evaluado con `BinaryClassificationEvaluator` (AUC) y comparado con scikit-learn.
6. **Scoring por lotes:** aplicar el modelo de MLlib a todo el dataset y guardar las predicciones (simula un proceso batch nocturno).

**Prerrequisito (v2, ADR-005):** Docker. El notebook corre dentro de `quay.io/jupyter/pyspark-notebook:2026-10-19` (Spark 4.2 y Java 21) con `python Back/scripts/ejecutar_notebooks.py 09`; así se evitan `winutils` y la ruta con tilde en Windows.

**Criterio de hecho:** el notebook corre completo; existe el Parquet particionado; hay una métrica AUC de MLlib comparada con sklearn.

---

## Paso 10: API REST y despliegue (Docker y nube)

| | |
|---|---|
| **Fase** | F5: Desplegar |
| **Cubre** | IA3.4, IA3.5, IA3.E3, R4 |
| **Entregable** | `Back/api/` + `Back/Dockerfile` + `Back/docker-compose.yml` + `Back/tests/test_api.py` + [docs/05_despliegue.md](05_despliegue.md) |

**Tareas**
1. **FastAPI** (`Back/api/main.py`) que carga `modelo_final.joblib`, `modelo_nlp.joblib` y `model_card.json` al iniciar.
2. Endpoints (contrato detallado en [04_arquitectura_backend.md](04_arquitectura_backend.md)):
   - `GET /health`: estado y versión del modelo.
   - `GET /model/info`: contenido de la model card (métricas, variables, umbral).
   - `POST /predict`: un cliente → `probabilidad_impago`, `prediccion`, `banda_riesgo`, `factores_principales`.
   - `POST /predict/batch`: una lista de clientes → una lista de resultados.
   - `POST /predict/text`: texto libre → probabilidad de riesgo del modelo NLP y su sentimiento.
3. Validación de entrada con **Pydantic** (tipos, rangos, categorías permitidas); errores 422 claros.
4. CORS habilitado para `http://localhost:*` (lo usará el Front más adelante).
5. Tests con `pytest` + `TestClient`: health, predict válido, predict inválido (422) y batch.
6. **Docker:** `Dockerfile` (python:3.10-slim, instala `requirements-api.txt`, copia `api/`, `src/` y `models/`, expone el puerto 8000, corre `uvicorn`) y `docker-compose.yml` con el servicio `api`.
7. **Nube:** guía paso a paso en `docs/05_despliegue.md` para GCP Cloud Run (principal), AWS App Runner y Azure Container Apps. Se despliega realmente solo si hay credenciales; si no, la guía queda como entregable.

**Criterio de hecho:** `pytest` pasa; `uvicorn` levanta y `http://localhost:8000/docs` responde; `docker compose up` levanta la misma API (si Docker está instalado); la guía de nube existe.

---

## Paso 11: Notebook final integrador y comunicación de resultados

| | |
|---|---|
| **Fase** | F5: Comunicar |
| **Cubre** | PF1, E2, E4, R2 |
| **Entregable** | `Back/notebooks/00_proyecto_integrador_final.ipynb` + `docs/06_informe_resultados.md` |

**Tareas**
1. Notebook único y autocontenido que recorre las 5 fases (F1 → F5) con las piezas clave de cada paso (no copia todo: importa de `src/` y carga los artefactos).
2. Un mapa al inicio: la tabla ID del enunciado → sección del notebook.
3. **Demo de predicción:** función `predecir_cliente(dict)` que devuelve la probabilidad de impago y la banda de riesgo para 3 clientes de ejemplo (bajo, medio y alto riesgo), más una llamada a la API local si está corriendo.
4. Sección final: hallazgos, desempeño del modelo, consideraciones éticas, limitaciones y próximos pasos.
5. `docs/06_informe_resultados.md`: resumen ejecutivo de 1–2 páginas para un público no técnico.

**Criterio de hecho:** el notebook corre de inicio a fin y predice la probabilidad de impago; el informe existe; el checklist de `01_enunciado.md` queda completo.

---

## Paso 12: Lanzar el sistema en local

| | |
|---|---|
| **Fase** | F5 |
| **Cubre** | R1, R4 |
| **Entregable** | `Back/README.md` con los comandos verificados + el sistema corriendo |

**Comandos (desde `Back/`; detalle en `Back/README.md`)**
```bash
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[api,nb,dl,nlp,dev]"
.venv/Scripts/python -m ipykernel install --user --name credit-risk
.venv/Scripts/python scripts/check.py --sin-front          # ruff · mypy · pytest · DoD
.venv/Scripts/python -m uvicorn api.main:app --port 8000    # API en http://127.0.0.1:8000/docs
docker compose up --build                                   # alternativa contenedor
```

**Prueba rápida de la API**
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/predict -ContentType "application/json" -Body (Get-Content .\api\ejemplo_request.json -Raw)
```

**Criterio de hecho:** desde un clon limpio, los comandos anteriores funcionan sin pasos adicionales; `/health` responde `200`; `/predict` devuelve una probabilidad para el ejemplo.

---

## Resumen de entregables

| Paso | Entregable principal |
|---|---|
| 0 | `docs/gestion/*.md` |
| 1 | `Back/notebooks/01_definicion_problema_etica.ipynb` |
| 2 | `Back/notebooks/02_exploracion_preliminar.ipynb` |
| 3 | `Back/notebooks/03_limpieza_preparacion.ipynb`, `db/processed/` |
| 4 | `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` |
| 5 | `Back/notebooks/05_modelos_clasicos.ipynb` |
| 6 | `Back/notebooks/06_red_neuronal.ipynb`, `Back/models/red_neuronal.keras` |
| 7 | `Back/notebooks/07_nlp_riesgo.ipynb`, `Back/models/modelo_nlp.joblib` |
| 8 | `Back/notebooks/08_evaluacion_optimizacion.ipynb`, `Back/models/modelo_final.joblib`, `model_card.json` |
| 9 | `Back/notebooks/09_spark_big_data.ipynb` |
| 10 | `Back/api/`, `Back/Dockerfile`, `Back/docker-compose.yml`, `docs/05_despliegue.md` |
| 11 | `Back/notebooks/00_proyecto_integrador_final.ipynb`, `docs/06_informe_resultados.md` |
| 12 | `Back/README.md` + sistema corriendo en local |

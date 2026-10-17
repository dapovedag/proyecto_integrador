# Reporte QA — Checklist del proyecto integrador

## Propósito y estado

Este checklist convierte en verificaciones los requisitos de `ProyectoIntegrador.jpeg` y de toda la documentación en `docs/`. Se usará para determinar si el trabajo está terminado. La revisión estática del back se registra en la sección 7. **Las casillas siguen sin marcar:** esta revisión no ejecutó pruebas, notebooks, API ni Docker y no acredita por sí sola el cierre funcional. Un punto solo se marca con evidencia revisable suficiente para su criterio.

## Fuentes

- [ ] `ProyectoIntegrador.jpeg`
- [ ] `docs/01_enunciado.md`
- [ ] `docs/02_plan_paso_a_paso.md`
- [ ] `docs/03_contrato_datos.md`
- [ ] `docs/04_arquitectura_backend.md`
- [ ] `docs/05_despliegue.md`
- [ ] `docs/diccionario_datos.md`
- [ ] `docs/gestion/backlog.md`
- [ ] `docs/gestion/sprints.md`
- [ ] `docs/gestion/definicion_de_hecho.md`

## 1. Requisitos de la imagen

- [ ] La solución estima la probabilidad de impago de clientes de una institución financiera.
- [ ] Integra análisis exploratorio, programación e inteligencia artificial.
- [ ] Usa información financiera y demográfica.
- [ ] Existe un notebook final que predice una probabilidad entre 0 y 1.
- [ ] Se aplica metodología ágil.
- [ ] Se desarrollan todas las fases analíticas y predictivas.
- [ ] Se usan datos reales o realistas del sector financiero.
- [ ] Se integran los módulos de programación e IA.
- [ ] El problema está definido dentro de un contexto.
- [ ] F1: definir el problema.
- [ ] F2: explorar y preparar los datos.
- [ ] F3: analizar y modelar.
- [ ] F4: evaluar y optimizar.
- [ ] F5: desplegar y comunicar.
- [ ] R1: modelo funcional.
- [ ] R2: análisis de datos, IA y NLP.
- [ ] R3: buenas prácticas de gestión.
- [ ] R4: potencial de implementación real.

## 2. Checklist global por ID

### Producto, elementos, fases y resultados

- [ ] PF1 — Notebook final predictivo.
- [ ] E1 — Metodología ágil.
- [ ] E2 — Todas las fases del proceso.
- [ ] E3 — Datos financieros reales o realistas.
- [ ] E4 — Integración de módulos.
- [ ] E5 — Problema en contexto.
- [ ] F1, F2, F3, F4 y F5 — Cinco fases ejecutadas.
- [ ] R1, R2, R3 y R4 — Cuatro resultados esperados.

### Programación, Unidad 1

- [ ] P1.1 — Entorno Colab/Jupyter.
- [ ] P1.2 — Pandas, NumPy, Matplotlib y Seaborn.
- [ ] P1.3 — Carga y exploración del dataset.
- [ ] P1.4 — Filtrado, selección, ordenamiento y agregaciones.
- [ ] P1.5 — Histogramas, dispersiones y boxplots.
- [ ] P1.E1 — Configuración y librerías.
- [ ] P1.E2 — Inspección inicial.
- [ ] P1.E3 — Operaciones básicas.
- [ ] P1.E4 — Visualizaciones exploratorias.

### Programación, Unidad 2

- [ ] P2.1 — Faltantes y duplicados.
- [ ] P2.2 — One-Hot/Label Encoding.
- [ ] P2.3 — Normalización y estandarización.
- [ ] P2.4 — Nuevas variables.
- [ ] P2.5 — Reducción de dimensionalidad evaluada.
- [ ] P2.6 — Train/test.
- [ ] P2.E1 — Limpieza y preprocesamiento.
- [ ] P2.E2 — Transformación y codificación.
- [ ] P2.E3 — Características relevantes.
- [ ] P2.E4 — División entrenamiento/prueba.

### IA, Unidad 1

- [ ] IA1.1 — Datasets y problema de riesgo.
- [ ] IA1.2 — Preprocesamiento y EDA.
- [ ] IA1.3 — Ética, sesgos, variables sensibles, impacto y privacidad.
- [ ] IA1.E1 — EDA entregado.
- [ ] IA1.E2 — Variables relevantes identificadas.

### IA, Unidad 2

- [ ] IA2.1 — Manipulación Pandas y equivalencias dplyr.
- [ ] IA2.2 — Filtrado, selección y agregación.
- [ ] IA2.3 — Matplotlib, Seaborn y ggplot2/plotnine.
- [ ] IA2.4 — Normalización, estandarización y PCA.
- [ ] IA2.5 — Atípicos detectados y tratados.
- [ ] IA2.E1 — Patrones y correlaciones.
- [ ] IA2.E2 — Variables optimizadas y preprocesadas.

### IA, Unidad 3

- [ ] IA3.1 — NLP, sentimiento, BERT y GPT.
- [ ] IA3.2 — CNN/RNN en TensorFlow/Keras.
- [ ] IA3.3 — Clásicos comparados con Deep Learning.
- [ ] IA3.4 — API Flask/FastAPI.
- [ ] IA3.5 — Docker o nube.
- [ ] IA3.6 — Spark/Hadoop/Big Data.
- [ ] IA3.E1 — Modelo NLP de riesgo.
- [ ] IA3.E2 — Red neuronal entrenada y evaluada.
- [ ] IA3.E3 — API RESTful.

## 3. Verificación de los pasos 0–12

### Paso 0 — Gestión ágil

Entregables: `docs/gestion/backlog.md`, `sprints.md`, `definicion_de_hecho.md`.

- [ ] Los tres archivos existen y están actualizados.
- [ ] El backlog tiene historias y criterios de aceptación.
- [ ] Cada paso 0–12 tiene al menos una historia.
- [ ] Hay cuatro sprints planificados.
- [ ] Cada sprint cerrado registra hecho, pendiente, impedimentos y retrospectiva.

### Paso 1 — Problema y ética

Entregable: `Back/notebooks/01_definicion_problema_etica.ipynb`.

- [ ] Contexto de negocio, usuario, decisión y costos FN/FP.
- [ ] Clasificación binaria `default`, probabilidad y bandas Bajo/Medio/Alto.
- [ ] Fuente comparada con al menos dos datasets alternativos.
- [ ] Métricas ROC-AUC, recall, F1, KS y Brier; meta AUC ≥ 0.70.
- [ ] Variables sensibles identificadas y tabla creada.
- [ ] Sesgo, proxies, explicabilidad y privacidad documentados.
- [ ] `sexo` solo se usa para auditoría, no como predictor.
- [ ] Equidad: aprobación, TPR, FPR y disparate impact ≥ 0.8.
- [ ] Ley 1581 de 2012 y IA responsable citadas.
- [ ] Secciones Contexto, Formulación, Datasets, Métricas, Ética y Conclusión.

### Paso 2 — Exploración preliminar

Entregable: `Back/notebooks/02_exploracion_preliminar.ipynb`.

- [ ] Versiones y ejecución en Jupyter/Colab.
- [ ] Librerías y estilo configurados.
- [ ] `shape`, `head`, `tail`, `sample`, `info`, tipos, `describe`, `nunique`, nulos, duplicados y `default`.
- [ ] Selección, `loc`/`iloc`, filtros, `query`, ordenamiento, `groupby`, `agg`, `pivot_table` y `value_counts`.
- [ ] ≥3 histogramas, ≥2 dispersiones, ≥3 boxplots y barras por categoría.
- [ ] Cada gráfico tiene título, ejes e interpretación.

### Paso 3 — Limpieza y preparación

Entregables: notebook 03, `data.py`, `features.py`, `db/processed/`.

- [ ] Nulos reportados y heatmap.
- [ ] Duplicados exactos/por ID eliminados y contabilizados.
- [ ] Imputación numérica/categórica justificada.
- [ ] Tipos, edades, montos y categorías inválidas corregidos.
- [ ] ≥3 variables nuevas con justificación.
- [ ] Split estratificado 80/20 con `random_state=42` antes de ajustar transformadores.
- [ ] Tasas de `default` reportadas en train/test.
- [ ] One-Hot nominal y mapeo ordinal.
- [ ] MinMaxScaler y StandardScaler comparados; elección justificada.
- [ ] Selección por correlación, información mutua y árbol.
- [ ] PCA evaluado y decisión documentada.
- [ ] `Pipeline` + `ColumnTransformer` en `build_preprocessor()`.
- [ ] Existen `train.csv`, `test.csv`, `feature_list.json`.
- [ ] Datos procesados sin nulos ni duplicados.

### Paso 4 — EDA avanzado

Entregable: `Back/notebooks/04_eda_transformacion_visualizacion.ipynb`.

- [ ] EDA uni, bi y multivariado y tasas por segmento.
- [ ] `merge`, `melt`/`pivot`, `apply`/`map`, `cut`/`qcut`, `groupby`, `assign`, `pipe` y equivalencias dplyr.
- [ ] Matplotlib con subplots; Seaborn con heatmap, pairplot y violinplot; plotnine con `facet_wrap`.
- [ ] Pearson, Spearman, V de Cramér y cinco hallazgos.
- [ ] IQR y z-score para atípicos; boxplots; winsorizing/capping; antes/después.
- [ ] PCA con varianza, scree plot, loadings y proyección 2D.
- [ ] Tabla final de variables relevantes.

### Paso 5 — Modelos clásicos

- [ ] DummyClassifier, LogisticRegression, RandomForest y Gradient/HistGradientBoosting.
- [ ] CV estratificada de cinco folds.
- [ ] ROC-AUC, PR-AUC, accuracy, precision, recall, F1, KS y Brier.
- [ ] Matriz de confusión y curvas ROC/PR.
- [ ] Coeficientes e importancia por permutación.
- [ ] `Back/models/resultados_clasicos.json`.
- [ ] Tabla de cinco modelos; mejor sobre línea base y AUC ≥ 0.70 o causa documentada.

### Paso 6 — Redes neuronales

- [ ] Preprocesador de train y conjunto de validación.
- [ ] MLP de referencia.
- [ ] CNN 1D sobre variables.
- [ ] RNN LSTM/GRU sobre texto tokenizado.
- [ ] Binary crossentropy, Adam, class weights, EarlyStopping y checkpoint.
- [ ] Curvas de loss/AUC y discusión de sobreajuste.
- [ ] Evaluación test con métricas comparables.
- [ ] `Back/models/red_neuronal.keras` y tabla clásicos/DL.

### Paso 7 — NLP

- [ ] Limpieza, tokenización, stopwords, frecuencias, n-gramas y palabras por clase.
- [ ] TF-IDF + regresión logística solo con texto.
- [ ] Sentimiento BERT y relación con `default`.
- [ ] Embeddings BERT vs GPT sin APIs de pago.
- [ ] Modelo textual y combinado evaluados; ΔAUC reportado.
- [ ] `Back/models/modelo_nlp.joblib`.
- [ ] Features BERT/GPT cacheadas en `db/processed/nlp_features.parquet`.

### Paso 8 — Evaluación, optimización y equidad

- [ ] Hiperparámetros de dos mejores modelos optimizados.
- [ ] Probabilidades calibradas y Brier comparado.
- [ ] Umbral justificado por costos y bandas definidas.
- [ ] Tabla final de clásicos, DL y NLP combinado.
- [ ] Modelo final elegido con criterio explícito.
- [ ] Equidad por variables sensibles, mitigación si aplica.
- [ ] Importancia global y tres casos explicados.
- [ ] `modelo_final.joblib` cargable y `model_card.json` completo.

### Paso 9 — Spark / Big Data

- [ ] `SparkSession(local[*])`, esquema, `printSchema`, `count`, `describe`.
- [ ] `filter`, `select`, `withColumn`, `groupBy().agg()` y Spark SQL.
- [ ] Parquet particionado en `db/processed/spark/`.
- [ ] HDFS/YARN/MapReduce/Spark explicados.
- [ ] MLlib evaluado con AUC y comparado con sklearn.
- [ ] Scoring por lotes guardado.

### Paso 10 — API y despliegue

- [ ] FastAPI carga modelo final, NLP y model card.
- [ ] `GET /health`.
- [ ] `GET /model/info`.
- [ ] `POST /predict`.
- [ ] `POST /predict/batch` (máximo 1.000).
- [ ] `POST /predict/text`.
- [ ] Pydantic valida tipos, rangos, categorías y errores 422.
- [ ] CORS y logging sin datos personales.
- [ ] Tests de health, predict válido, inválido y batch; `pytest` verde.
- [ ] Dockerfile y compose funcionan.
- [ ] Guía de despliegue local, GCP, AWS y Azure.
- [ ] `/docs` responde con uvicorn.

### Paso 11 — Integrador e informe

- [ ] Notebook 00 recorre F1→F5 y reutiliza `src/`.
- [ ] Mapa de IDs a secciones al inicio.
- [ ] `predecir_cliente(dict)` para clientes bajo, medio y alto.
- [ ] Llamada opcional a API local.
- [ ] Hallazgos, desempeño, ética, limitaciones y próximos pasos.
- [ ] `docs/06_informe_resultados.md` de 1–2 páginas.
- [ ] Notebook corre completo y predice.

### Paso 12 — Ejecución local

- [ ] `Back/README.md` documenta venv, instalación, pytest, Jupyter, uvicorn y Docker.
- [ ] Comandos funcionan desde clon limpio.
- [ ] `/health` responde 200.
- [ ] `/predict` devuelve probabilidad para el ejemplo.
- [ ] Sistema ejecutable localmente.

## 4. Contrato del dataset

- [ ] `db/credit_risk.csv` existe, es UTF-8/CSV y no se sobrescribe.
- [ ] Columnas `snake_case`; diccionario con tipo, descripción, unidades, valores y fuente.
- [ ] D1 — `default` binario.
- [ ] D2 — Prevalencia 5–40 %.
- [ ] D3 — ≥1.000 filas.
- [ ] D4 — ≥5 variables financieras.
- [ ] D5 — ≥4 demográficas, incluyendo edad y sexo.
- [ ] D6 — Texto libre en español, 1–3 frases, variado y relacionado probabilísticamente.
- [ ] D7 — ≥3 nominales y ≥1 ordinal.
- [ ] D8 — Nulos en ≥3 columnas, 1–15 % cada una.
- [ ] D9 — Duplicados 0,5–2 %.
- [ ] D10 — Atípicos plausibles en ingreso/monto.
- [ ] D11 — Relaciones realistas y AUC alcanzable 0,70–0,90.
- [ ] D12 — `id_cliente` único.
- [ ] `validar_dataset()` verifica archivo, target, prevalencia, filas y columnas.
- [ ] Verifica ≥95 % de textos no vacíos y ≥200 textos distintos.
- [ ] Verifica nulos, duplicados, atípicos y diccionario.

## 5. Definition of Done transversal

- [ ] Cada notebook existe en su ruta.
- [ ] Primera celda de cada notebook lista IDs cubiertos.
- [ ] Cada notebook corre con Restart & Run All y conserva salidas.
- [ ] No hay rutas absolutas; se usa `config.py`.
- [ ] Se usa `RANDOM_STATE = 42`.
- [ ] Cada gráfico tiene título, ejes e interpretación.
- [ ] Cada notebook termina con Conclusiones.
- [ ] Funciones con nombres claros, type hints y docstrings.
- [ ] Código probado en `Back/tests/`; pytest pasa.
- [ ] Sin credenciales ni datos personales.
- [ ] Backlog y retrospectivas actualizados.

## 6. Registro de validación

Registro de revisiones del proyecto.

| Fecha | Revisor | Resultado | Evidencia / observaciones |
|---|---|---|---|
| 2026-10-16 | QA (revisión estática) | No aprobado como desarrollo terminado | Hallazgos y alcance en la sección 7. No se ejecutaron pruebas. |

### Cierre final

- [ ] No quedan casillas obligatorias pendientes.
- [ ] Artefactos en sus rutas documentadas.
- [ ] Notebooks, pruebas, API y despliegue verificados.
- [ ] Notebook final predice probabilidad de impago.
- [ ] Checklist respaldado por evidencia.

## 7. Auditoría estática del back — 2026-10-16

**Alcance:** lectura del código, notebooks, salidas guardadas, artefactos JSON y documentación de `Back/`; contraste con este checklist y `docs/02_plan_paso_a_paso.md`. No se ejecutaron tests, notebooks, entrenamiento, API ni Docker. Las métricas guardadas son resultados declarados por artefactos existentes, no verificados de forma independiente. Esta revisión no modifica el código.

**Dictamen:** el back tiene una base funcional escrita, pero **no cumple todavía el checklist para declararse terminado**. Los bloqueos principales son la divergencia entre el modelo del notebook 08 y el servido por la API, la selección del modelo y del umbral usando test, y los entregables de redes, NLP avanzado y Spark sin ejecución acreditada.

### Hallazgos prioritarios para el desarrollador

| Prioridad | Requisito del checklist | Evidencia en el código y artefactos | Recomendación |
|---|---|---|---|
| **Bloqueante** | Paso 8, Paso 10, F4, R1: servir el modelo final optimizado con umbral y bandas justificados | `Back/notebooks/08_evaluacion_optimizacion.ipynb`, celda 38, guarda `modelo_final_nb08.joblib` y `model_card_nb08.json` (umbral **0,25**). `Back/train.py:111-112` guarda otros artefactos, `modelo_final.joblib` y `model_card.json` (umbral **0,4396**), que carga `Back/api/service.py:58-64`. El modelo servido es una regresión logística sin calibración explícita; `model_card.json` lo reconoce. Por tanto, la API no sirve el modelo elegido en el paso 8. | Definir una sola fuente de verdad para el modelo final y su card; hacer que la API cargue exactamente ese artefacto y que el notebook 00, la API y la documentación reporten el mismo umbral, bandas y métricas. |
| **Bloqueante** | Paso 8: evaluación final independiente y umbral por costo | `Back/train.py:69-76` compara candidatos por ROC-AUC **en test**, elige allí al ganador y optimiza el umbral F1 con las mismas etiquetas de test; después publica métricas de ese mismo test. Esto usa test para decisiones de modelado y sesga la evaluación final. Además, el umbral F1 no sigue la matriz de costos FN > FP indicada en el plan. | Elegir modelo, calibración y umbral con train/validación o CV; reservar test para una sola evaluación final. Usar el costo de negocio documentado para el umbral servido. |
| **Bloqueante** | Paso 6, IA3.2, IA3.E2: CNN/RNN entrenadas, evaluadas y `.keras` guardado | El notebook 06 contiene el código, pero sus salidas guardadas dicen `Keras/TensorFlow no está disponible`, `Omitido` para MLP/CNN/LSTM/híbrido y `No se guardó ninguna red`. `Back/models/resultados_dl.json` tiene `backend: null`, `mejor_red: null` y `modelos: []`; no existe `Back/models/red_neuronal.keras`. La conclusión del notebook afirma que se entrenaron y evaluaron redes, en contradicción con esas salidas. | Instalar/documentar dependencias, ejecutar realmente las redes, conservar métricas y artefacto, y corregir las conclusiones para que coincidan con la ejecución. |
| **Bloqueante** | Paso 7, IA3.1, IA3.E1: BERT/GPT y comparación NLP combinado | El notebook 07 tiene **19 celdas de código sin contador de ejecución ni salidas guardadas**. No existen `Back/models/resultados_nlp.json`, `modelo_nlp_nb07.joblib` ni `db/processed/nlp_features.parquet`. `Back/train.py:98-112` sí crea un modelo TF-IDF + regresión logística distinto para `/predict/text`; eso no acredita sentimiento BERT, embeddings BERT/GPT ni ΔAUC del combinado. | Ejecutar el notebook 07 con dependencias declaradas, guardar salidas y artefactos en las rutas pactadas, e integrar o justificar explícitamente el modelo NLP elegido. |
| **Bloqueante** | Paso 9, IA3.6: Spark MLlib y comparación AUC | Las salidas guardadas del notebook 09 dicen `No module named 'pyspark'`, `Spark no disponible` y `AUC MLlib: None`. El Parquet se escribió con pyarrow y el scoring se guardó como `scoring_batch_sklearn.parquet`, ambos como respaldo local. El código Spark está escrito, pero no hay ejecución Spark/MLlib acreditada. | Instalar/documentar PySpark y Java, ejecutar la ruta Spark, guardar AUC de MLlib y scoring Spark; no presentar el respaldo pandas/sklearn como cumplimiento de IA3.6. |
| **Alta** | Paso 8, IA1.3: equidad y mitigación | `Back/models/model_card_nb08.json` reporta disparate impact mínimo por edad **0,7386**, inferior a 0,8. El notebook 08, celda 31, ensaya mitigación por umbral sobre **test**, pero guarda y sirve el modelo/umbral global sin esa mitigación. La card de la API solo incluye tasas de aprobación por sexo; `Back/train.py:82-87,130-131` no calcula TPR/FPR por grupo ni edad. | Evaluar edad y sexo con aprobación, TPR y FPR; desarrollar y seleccionar la mitigación en validación; comprobar el efecto en test y reflejar la política efectiva en el modelo servido. |
| **Alta** | Paso 5, Paso 8: comparación completa de modelos | El notebook 05 tiene **15 celdas de código sin ejecución/salidas guardadas** y falta `Back/models/resultados_clasicos.json`. El notebook 08, celda 25, dejó registrado que faltaban los tres JSON de clásicos, DL y NLP al construir su tabla. El notebook 00, celda 17, también registró que faltaban. Hoy solo existe `resultados_dl.json`, vacío. La tabla final no demuestra comparación completa. | Ejecutar los notebooks en orden y regenerar la comparación final con resultados reales, consistentes y fechados. |
| **Alta** | Paso 11, PF1/E4: integración y entrega final | `Back/notebooks/00_proyecto_integrador_final.ipynb` tiene salidas y `predecir_cliente(dict)`, pero vuelve a definir limpieza, preprocesador y modelo en sus celdas 3–5 y 19, en vez de reutilizar `Back/src/` o el artefacto que sirve la API. Su umbral guardado es **0,24**, diferente del **0,4396** de la API. Falta `docs/06_informe_resultados.md`. | Unificar el flujo del notebook final con el pipeline servido, documentar cualquier diferencia deliberada y entregar el informe de 1–2 páginas. |
| **Media** | Paso 3 y contrato de datos: módulo reproducible | `Back/src/credit_risk/data.py` tiene `cargar_datos()` y `limpiar()`, pero no `validar_dataset()`, solicitado expresamente. `Back/src/credit_risk/features.py:26-32` implementa imputación, StandardScaler y One-Hot, pero no el mapeo ordinal que muestra el notebook 03. Los notebooks 03/05/07/08/00 duplican lógica de limpieza y variables, con riesgo de que sus resultados difieran del modelo de producción. | Implementar `validar_dataset()` y centralizar reglas de limpieza, variables y preprocesamiento en `src/`; utilizar esos módulos en entrenamiento y notebooks. |
| **Media** | Paso 10 y Paso 12: salud de la API y despliegue verificable | `Back/api/main.py:39-40` devuelve `status: ok` aunque `modelo_cargado` sea falso. `Back/api/service.py:58-71` considera cargado el servicio si existe el modelo tabular, incluso si falló la carga de NLP o de la card; `/predict/text` puede entonces fallar. Existen cinco rutas, esquemas, Dockerfile y tests escritos, pero no se ejecutaron en esta auditoría. | Hacer la carga atómica o declarar la salud por componente; devolver estado no saludable si faltan artefactos obligatorios y cubrir estos casos en pruebas. |
| **Media** | Paso 12 y Definition of Done: instalación y ejecución desde clon limpio | `Back/README.md` omite creación de venv, instalación de dependencias y arranque de Jupyter. `Back/requirements.txt` no declara TensorFlow/Keras, transformers, sentence-transformers, PySpark ni plotnine para reproducir todos los notebooks. Las retrospectivas de `docs/gestion/sprints.md` están vacías y las HU-00–HU-12 de `docs/gestion/backlog.md` siguen en `Pendiente`, aunque `docs/README.md` dice que varios pasos están hechos. | Documentar instalación completa o extras por notebook, actualizar backlog y retrospectivas con evidencia, y alinear el estado público del proyecto. |

### Estado por paso del checklist

| Paso | Juicio de esta revisión estática | Evidencia o límite |
|---|---|---|
| 0 | **No cerrado** | Artefactos de gestión existen; estados y retrospectivas siguen pendientes. |
| 1 | **Evidencia documental** | Notebook 01 contiene contexto, formulación y ética con salidas; no se validó su ejecución. |
| 2 | **Evidencia documental y de código** | Notebook 02 contiene exploración y gráficos con salidas; no se validó su ejecución. |
| 3 | **Parcial** | Notebook 03 y archivos `db/processed/` existen; falta `validar_dataset()` y no se usa un único preprocesador compartido. |
| 4 | **Evidencia documental y de código** | Notebook 04 contiene EDA avanzado con salidas; no se validó su ejecución. |
| 5 | **No acreditado** | Código escrito, sin salidas guardadas ni `resultados_clasicos.json`. |
| 6 | **No cumple** | Entrenamiento de redes omitido en salidas guardadas; no existe `.keras`. |
| 7 | **No acreditado** | Notebook sin ejecución guardada; faltan artefactos BERT/GPT/combinado. Hay TF-IDF independiente en `train.py`. |
| 8 | **Parcial; integración final incorrecta** | Notebook con optimización, costos y equidad, pero el artefacto servido es otro y persiste disparidad por edad. |
| 9 | **No cumple** | Se omitió Spark/MLlib; respaldo ejecutado con pyarrow y sklearn. |
| 10 | **Parcial** | API, esquemas, tests y Docker están escritos; sirve otro modelo y no se verificó ejecución. |
| 11 | **Parcial** | Notebook 00 tiene salidas y predicciones, pero usa un flujo propio; falta el informe. |
| 12 | **No verificado** | README incompleto para clon limpio; API, tests y Docker no se ejecutaron en esta auditoría. |

**Para cerrar la revisión:** el desarrollador debe entregar artefactos coherentes con el modelo servido, notebooks con salidas reales de los requisitos obligatorios, informe y documentación de instalación; después corresponde ejecutar pruebas, notebooks, API y Docker y actualizar las casillas con esa evidencia. La existencia de `test_api.py` y de métricas JSON no equivale a pruebas aprobadas ni a resultados independientes.

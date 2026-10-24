/**
 * Textos de la portada: cómo se cumplió cada ítem del enunciado y el resumen de la solución.
 * El estado (acreditado o no) nunca se escribe aquí: sale de gestion.json vía content/trazabilidad.ts.
 * Las cifras fijas de este archivo se contrastan con los resultados exportados en src/pages/Inicio.test.tsx.
 */

/** Una línea por fila del checklist (47): qué evidencia concreta cumple el ítem. */
export const COMO_SE_CUMPLE: Record<string, string> = {
  PF1: "Notebook integrador nb00: predice la probabilidad de impago de tres clientes con predecir_cliente() y con la API.",
  E1: "Scrum con backlog único, 8 sprints, DoR y DoD verificables, ADR y retrospectivas.",
  E2: "Las fases de CRISP-DM en 12 capítulos, del problema al despliegue.",
  E3: "Dataset sintético-realista del sector con contrato de datos validado; la metodología se replica sobre German Credit (UCI).",
  E4: "nb00 une Programación (pandas, DuckDB, pipeline) e IA (modelos, NLP, API) en un solo flujo.",
  E5: "Decisión de crédito con costos explícitos: LGD 45 %, margen 15 % y revisión manual 8 %.",
  F1: "nb01: problema, métricas de negocio, costo de cada error y riesgos éticos.",
  F2: "nb02 a nb04: carga, limpieza sin fuga, nuevas variables, EDA y atípicos.",
  F3: "nb05 a nb07: 5 modelos clásicos, 4 redes en Keras y 5 modelos de NLP comparados.",
  F4: "nb08: selección por CV en train, test usado una sola vez, calibración, costos y equidad.",
  F5: "API REST en Docker, notebook integrador, informe ejecutivo y este sitio.",
  R1: "Regresión logística calibrada v2.0.0, AUC 0,846 en test, servida por la API.",
  R2: "EDA, PCA, modelos clásicos, redes neuronales y NLP con BERT y GPT-2.",
  R3: "backlog.yaml como fuente única, DoD por script, ADR y gate de calidad en un comando.",
  R4: "API en Docker, PSI para monitorear la deriva y arranque documentado desde un clon limpio.",
  "P1.1": "Jupyter con kernel credit-risk, ejecutado con papermill y verificado por la DoD.",
  "P1.2": "pandas, NumPy, Matplotlib y Seaborn, con el entorno probado antes de escribir notebooks.",
  "P1.3": "Carga de 12.144 filas: tipos, nulos, duplicados y prevalencia de impago.",
  "P1.4": "Filtros, selección, orden y agregaciones con pandas y con SQL en DuckDB.",
  "P1.5": "Histogramas, dispersión y boxplots, redibujados de forma nativa en el sitio.",
  "P1.E1–E4": "nb02 ejecutado sin errores, con sus cuatro entregables y conclusiones.",
  "P2.1": "Nulos imputados con estadísticos aprendidos solo en train; duplicados por ID eliminados.",
  "P2.2": "One-Hot para las nominales y codificación ordinal para educación y rango de edad.",
  "P2.3": "MinMaxScaler frente a StandardScaler, comparados y justificados.",
  "P2.4": "ratio_cuota_ingreso y ratio_monto_ingreso, con justificación de negocio.",
  "P2.5": "PCA con varianza explicada acumulada y proyección 2D: la nube de esta portada.",
  "P2.6": "Train/test 80/20 estratificado, antes de aprender cualquier estadístico.",
  "P2.E1–E4": "nb03 ejecutado sin errores; dataset procesado y lista de variables exportados.",
  "IA1.1": "Exploración del dataset y definición del problema de impago en nb01.",
  "IA1.2": "EDA univariado, bivariado y multivariado, con segmentos en SQL (nb04).",
  "IA1.3": "Sexo y edad auditados con disparate impact y mitigados con reweighing.",
  "IA1.E1–E2": "nb04 ejecutado: patrones, correlaciones y variables relevantes.",
  "IA2.1": "pandas (groupby, merge, melt, pivot, pipe) y los verbos de dplyr con su equivalente en Python.",
  "IA2.2": "Filtrado, selección y agregación con pandas y DuckDB.",
  "IA2.3": "Matplotlib, Seaborn y la gramática de ggplot2 con plotnine.",
  "IA2.4": "Normalización, estandarización y PCA sobre datos con atípicos tratados.",
  "IA2.5": "IQR y z-score para detectar; capping p1–p99 ajustado en train para tratar.",
  "IA2.E1–E2": "Pearson, Spearman y V de Cramér; decisión razonada de qué entra al modelo.",
  "IA3.1": "TF-IDF, sentimiento con BERT, sentence-transformers y GPT-2 sobre el texto de la solicitud.",
  "IA3.2": "CNN 1D y GRU, más un MLP y una red híbrida, entrenadas en TensorFlow/Keras.",
  "IA3.3": "Clásicos frente a deep learning con las mismas métricas y el mismo test.",
  "IA3.4": "API REST con FastAPI: /predict, /predict/batch, /predict/text, /model/info y /health.",
  "IA3.5": "La API en una imagen Docker probada; PySpark también corre en Docker.",
  "IA3.6": "PySpark: procesamiento por particiones y regresión logística con Spark MLlib (nb09).",
  "IA3.E1": "Modelo NLP de riesgo con su aporte medido por bootstrap frente al tabular.",
  "IA3.E2": "Red neuronal entrenada con curvas de aprendizaje y evaluada en test.",
  "IA3.E3": "API RESTful con validación de entrada y respuestas documentadas en Swagger.",
};

/** Modelos entrenados y comparados por familia (resultados_*.json → modelos). */
export const MODELOS_EVALUADOS = { clasicos: 5, redes: 4, nlp: 5, spark: 1 } as const;
export const TOTAL_MODELOS = Object.values(MODELOS_EVALUADOS).reduce((a, b) => a + b, 0);

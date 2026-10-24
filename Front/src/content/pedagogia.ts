/**
 * Capa pedagógica (solo front): tipos comunes del glosario, de las anotaciones de celdas de los notebooks y del
 * recorrido de cada capítulo. El lector objetivo es un principiante total: todo concepto y todo código se explica.
 * El catálogo de ids del glosario vive en CATALOGO_GLOSARIO; el texto de cada entrada, en content/glosario/*.ts.
 */

export type CategoriaGlosario =
  | "python"
  | "datos"
  | "estadistica"
  | "ml"
  | "evaluacion"
  | "redes"
  | "nlp"
  | "bigdata"
  | "despliegue"
  | "negocio"
  | "proyecto";

export const CATEGORIAS: Record<CategoriaGlosario, string> = {
  python: "Programación en Python",
  datos: "Datos y preparación",
  estadistica: "Estadística y gráficos",
  ml: "Aprendizaje automático",
  evaluacion: "Evaluación de modelos",
  redes: "Redes neuronales",
  nlp: "Lenguaje natural (NLP)",
  bigdata: "Big data",
  despliegue: "Despliegue",
  negocio: "Negocio y ética",
  proyecto: "Gestión del proyecto",
};

export interface EntradaGlosario {
  id: string;
  /** Nombre visible del término. */
  termino: string;
  /** Formas en que aparece en código o texto (p. ej. "pd", "scikit-learn", "LogisticRegression"); en minúsculas. */
  alias: string[];
  categoria: CategoriaGlosario;
  /** Una frase (≤ 160 caracteres) para el tooltip. */
  corto: string;
  /** Qué es, para un principiante total, con una analogía cuando ayude. */
  queEs: string;
  /** Para qué sirve en general. */
  paraQue: string;
  /** Cómo se lee o interpreta (gráficos, métricas, salidas). Opcional. */
  comoSeLee?: string;
  /** Qué papel cumple en este proyecto de riesgo de crédito, con cifras reales cuando apliquen. */
  enEsteProyecto: string;
  /** Capítulo donde aparece por primera vez (0 = metodología). */
  capitulo?: number;
}

/** Explicación de una celda de código del reproductor, por índice `j` (0-based) en `celdas` de NN.json. */
export interface Anotacion {
  /** Primera línea no vacía del código de la celda, literal (la prueba la compara para detectar desfases). */
  primeraLinea: string;
  /** Qué hace la celda, en lenguaje de principiante (1–3 frases). */
  que: string;
  /** Por qué se hace en este punto del proceso (1–2 frases). */
  porque: string;
  /** Ids del glosario que conviene entender para esta celda. */
  conceptos: string[];
  /** Explicaciones manuales por número de línea (1-based) que reemplazan a las automáticas. Opcional. */
  lineas?: Record<number, string>;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

/** Recorrido pedagógico de un capítulo: lo que se aprende, los conceptos previos y el repaso. */
export interface Recorrido {
  /** «Al terminar este capítulo usted podrá…»: 3–5 objetivos concretos. */
  objetivos: string[];
  /** Ids del glosario que el capítulo introduce (4–8), en el orden en que conviene leerlos. */
  conceptos: string[];
  /** 3 preguntas de repaso con su respuesta. */
  repaso: Pregunta[];
  /** Aprendizaje del capítulo en lenguaje claro (reemplaza al texto técnico compartido). */
  aprendizaje: { conceptual: string; practico: string };
}

/** Catálogo de ids del glosario (fuente única). Cada id tiene su entrada en content/glosario/*.ts. */
export const CATALOGO_GLOSARIO: Record<string, { termino: string; categoria: CategoriaGlosario }> = {
  // Programación en Python
  python: { termino: "Python", categoria: "python" },
  notebook: { termino: "Notebook (Jupyter)", categoria: "python" },
  celda: { termino: "Celda", categoria: "python" },
  importar: { termino: "Importar (import / from … import)", categoria: "python" },
  libreria: { termino: "Librería", categoria: "python" },
  modulo: { termino: "Módulo", categoria: "python" },
  paquete: { termino: "Paquete propio (credit_risk)", categoria: "python" },
  variable: { termino: "Variable (en programación)", categoria: "python" },
  funcion: { termino: "Función", categoria: "python" },
  metodo: { termino: "Método", categoria: "python" },
  clase: { termino: "Clase y objeto", categoria: "python" },
  parametro: { termino: "Parámetro y argumento", categoria: "python" },
  lista_diccionario: { termino: "Lista y diccionario", categoria: "python" },
  semilla: { termino: "Semilla aleatoria (random_state)", categoria: "python" },
  papermill: { termino: "Papermill", categoria: "python" },
  pandas: { termino: "pandas", categoria: "python" },
  numpy: { termino: "NumPy", categoria: "python" },
  matplotlib: { termino: "Matplotlib", categoria: "python" },
  seaborn: { termino: "Seaborn", categoria: "python" },
  plotnine: { termino: "plotnine (gramática de gráficos)", categoria: "python" },
  duckdb: { termino: "DuckDB", categoria: "python" },
  sql: { termino: "SQL", categoria: "python" },
  sklearn: { termino: "scikit-learn", categoria: "python" },
  tensorflow: { termino: "TensorFlow y Keras", categoria: "python" },
  transformers: { termino: "Hugging Face Transformers", categoria: "python" },
  pyspark: { termino: "PySpark", categoria: "python" },
  fastapi: { termino: "FastAPI", categoria: "python" },
  pydantic: { termino: "Pydantic", categoria: "python" },
  // Datos y preparación
  dataframe: { termino: "DataFrame", categoria: "datos" },
  fila_columna: { termino: "Fila y columna", categoria: "datos" },
  csv: { termino: "CSV", categoria: "datos" },
  parquet: { termino: "Parquet", categoria: "datos" },
  tipo_dato: { termino: "Tipo de dato", categoria: "datos" },
  variable_objetivo: { termino: "Variable objetivo (default)", categoria: "datos" },
  variable_numerica: { termino: "Variable numérica", categoria: "datos" },
  variable_categorica: { termino: "Variable categórica", categoria: "datos" },
  nulo: { termino: "Valor nulo (faltante)", categoria: "datos" },
  duplicado: { termino: "Registro duplicado", categoria: "datos" },
  atipico: { termino: "Valor atípico", categoria: "datos" },
  groupby: { termino: "Agrupar y agregar (groupby)", categoria: "datos" },
  filtrado: { termino: "Filtrar, seleccionar y ordenar", categoria: "datos" },
  imputacion: { termino: "Imputación", categoria: "datos" },
  one_hot: { termino: "One-Hot Encoding", categoria: "datos" },
  ordinal: { termino: "Codificación ordinal", categoria: "datos" },
  escalado: { termino: "Normalización y estandarización", categoria: "datos" },
  ingenieria_variables: { termino: "Ingeniería de variables", categoria: "datos" },
  pca: { termino: "PCA (componentes principales)", categoria: "datos" },
  fuga_datos: { termino: "Fuga de información (data leakage)", categoria: "datos" },
  train_test: { termino: "Conjuntos de entrenamiento y prueba (train / test)", categoria: "datos" },
  estratificar: { termino: "Estratificación", categoria: "datos" },
  capping: { termino: "Capping (winsorización)", categoria: "datos" },
  // Estadística y gráficos
  media: { termino: "Media (promedio)", categoria: "estadistica" },
  mediana: { termino: "Mediana", categoria: "estadistica" },
  percentil: { termino: "Percentil y cuartil", categoria: "estadistica" },
  iqr: { termino: "Rango intercuartílico (IQR)", categoria: "estadistica" },
  desviacion: { termino: "Desviación estándar", categoria: "estadistica" },
  zscore: { termino: "z-score", categoria: "estadistica" },
  histograma: { termino: "Histograma", categoria: "estadistica" },
  boxplot: { termino: "Diagrama de caja (boxplot)", categoria: "estadistica" },
  dispersion: { termino: "Gráfico de dispersión", categoria: "estadistica" },
  heatmap: { termino: "Mapa de calor (heatmap)", categoria: "estadistica" },
  correlacion: { termino: "Correlación (Pearson y Spearman)", categoria: "estadistica" },
  cramer: { termino: "V de Cramér", categoria: "estadistica" },
  informacion_mutua: { termino: "Información mutua", categoria: "estadistica" },
  prevalencia: { termino: "Prevalencia (tasa de impago)", categoria: "estadistica" },
  intervalo_confianza: { termino: "Intervalo de confianza (IC 95 %)", categoria: "estadistica" },
  bootstrap: { termino: "Bootstrap", categoria: "estadistica" },
  // Aprendizaje automático
  modelo: { termino: "Modelo predictivo", categoria: "ml" },
  entrenar: { termino: "Entrenar (fit) y predecir (predict)", categoria: "ml" },
  clasificacion: { termino: "Clasificación binaria", categoria: "ml" },
  probabilidad: { termino: "Probabilidad de impago", categoria: "ml" },
  modelos_clasicos: { termino: "Modelos clásicos", categoria: "ml" },
  dummy: { termino: "Modelo de referencia (Dummy)", categoria: "ml" },
  regresion_logistica: { termino: "Regresión logística", categoria: "ml" },
  arbol_decision: { termino: "Árbol de decisión", categoria: "ml" },
  random_forest: { termino: "Random Forest", categoria: "ml" },
  gradient_boosting: { termino: "Gradient Boosting", categoria: "ml" },
  pipeline: { termino: "Pipeline", categoria: "ml" },
  validacion_cruzada: { termino: "Validación cruzada", categoria: "ml" },
  sobreajuste: { termino: "Sobreajuste (overfitting)", categoria: "ml" },
  regularizacion: { termino: "Regularización", categoria: "ml" },
  hiperparametro: { termino: "Hiperparámetro", categoria: "ml" },
  importancia_variables: { termino: "Importancia de variables (permutación)", categoria: "ml" },
  coeficiente: { termino: "Coeficiente", categoria: "ml" },
  log_odds: { termino: "Log-odds", categoria: "ml" },
  shap: { termino: "SHAP", categoria: "ml" },
  // Evaluación de modelos
  matriz_confusion: { termino: "Matriz de confusión", categoria: "evaluacion" },
  umbral: { termino: "Umbral de decisión", categoria: "evaluacion" },
  precision_recall: { termino: "Precisión y recall", categoria: "evaluacion" },
  f1: { termino: "F1", categoria: "evaluacion" },
  roc_auc: { termino: "Curva ROC y AUC", categoria: "evaluacion" },
  pr_auc: { termino: "Curva precisión-recall (PR-AUC)", categoria: "evaluacion" },
  ks: { termino: "KS (Kolmogórov-Smirnov)", categoria: "evaluacion" },
  brier: { termino: "Brier", categoria: "evaluacion" },
  calibracion: { termino: "Calibración", categoria: "evaluacion" },
  // Redes neuronales
  red_neuronal: { termino: "Red neuronal", categoria: "redes" },
  mlp: { termino: "MLP (perceptrón multicapa)", categoria: "redes" },
  cnn: { termino: "CNN 1D (red convolucional)", categoria: "redes" },
  rnn_gru: { termino: "RNN y GRU (redes recurrentes)", categoria: "redes" },
  epoca: { termino: "Época", categoria: "redes" },
  funcion_perdida: { termino: "Función de pérdida", categoria: "redes" },
  early_stopping: { termino: "Early stopping", categoria: "redes" },
  dropout: { termino: "Dropout", categoria: "redes" },
  // Lenguaje natural
  nlp: { termino: "Procesamiento de lenguaje natural (NLP)", categoria: "nlp" },
  tokenizacion: { termino: "Tokenización", categoria: "nlp" },
  tfidf: { termino: "TF-IDF", categoria: "nlp" },
  embedding: { termino: "Embedding", categoria: "nlp" },
  bert: { termino: "BERT", categoria: "nlp" },
  gpt2: { termino: "GPT-2", categoria: "nlp" },
  sentence_transformers: { termino: "Sentence-transformers", categoria: "nlp" },
  sentimiento: { termino: "Análisis de sentimiento", categoria: "nlp" },
  // Big data
  big_data: { termino: "Big data", categoria: "bigdata" },
  spark: { termino: "Apache Spark", categoria: "bigdata" },
  particion: { termino: "Partición", categoria: "bigdata" },
  mllib: { termino: "MLlib", categoria: "bigdata" },
  // Despliegue
  api_rest: { termino: "API REST", categoria: "despliegue" },
  endpoint: { termino: "Endpoint", categoria: "despliegue" },
  json: { termino: "JSON", categoria: "despliegue" },
  http: { termino: "Petición HTTP (GET, POST) y código de estado", categoria: "despliegue" },
  docker: { termino: "Docker", categoria: "despliegue" },
  contenedor: { termino: "Imagen y contenedor", categoria: "despliegue" },
  // Negocio y ética
  lgd: { termino: "LGD (pérdida dada el impago)", categoria: "negocio" },
  costo_error: { termino: "Costo de los errores", categoria: "negocio" },
  regla_chow: { termino: "Regla de Chow (aprobar, revisar, rechazar)", categoria: "negocio" },
  banda_riesgo: { termino: "Banda de riesgo", categoria: "negocio" },
  disparate_impact: { termino: "Disparate impact (regla 4/5)", categoria: "negocio" },
  reweighing: { termino: "Reweighing", categoria: "negocio" },
  variable_sensible: { termino: "Variable sensible", categoria: "negocio" },
  psi: { termino: "PSI (índice de estabilidad)", categoria: "negocio" },
  champion_challenger: { termino: "Champion–challenger", categoria: "negocio" },
  // Gestión del proyecto
  scrum: { termino: "Scrum", categoria: "proyecto" },
  crisp_dm: { termino: "CRISP-DM", categoria: "proyecto" },
  historia_usuario: { termino: "Historia de usuario", categoria: "proyecto" },
  dod: { termino: "Definición de hecho (DoD)", categoria: "proyecto" },
  trazabilidad: { termino: "Trazabilidad", categoria: "proyecto" },
  sha256: { termino: "SHA-256 (huella digital)", categoria: "proyecto" },
  // Conceptos añadidos al anotar los notebooks (content/glosario/extra.ts)
  f_string: { termino: "f-string (texto con valores)", categoria: "python" },
  bucle_for: { termino: "Bucle for y comprensión de lista", categoria: "python" },
  lambda: { termino: "Función lambda", categoria: "python" },
  assert: { termino: "assert (comprobación automática)", categoria: "python" },
  entorno_ejecucion: { termino: "Entorno de ejecución y kernel", categoria: "python" },
  variable_entorno: { termino: "Variable de entorno", categoria: "python" },
  pruebas: { termino: "Pruebas automáticas (pytest)", categoria: "proyecto" },
  dplyr: { termino: "dplyr y sus verbos", categoria: "datos" },
  join: { termino: "Unir tablas (merge o join)", categoria: "datos" },
  ancho_largo: { termino: "Formato ancho y largo (melt y pivot)", categoria: "datos" },
  muestra: { termino: "Muestra aleatoria", categoria: "estadistica" },
  asimetria: { termino: "Asimetría (sesgo)", categoria: "estadistica" },
  densidad: { termino: "Densidad (curva KDE)", categoria: "estadistica" },
  prueba_estadistica: { termino: "Prueba estadística y p-valor", categoria: "estadistica" },
  transformacion_log: { termino: "Transformación logarítmica", categoria: "datos" },
  target_encoding: { termino: "Codificación por objetivo", categoria: "datos" },
  conjunto_validacion: { termino: "Conjunto de validación", categoria: "ml" },
  oof: { termino: "Predicciones fuera de pliegue (OOF)", categoria: "ml" },
  desbalance: { termino: "Desbalance de clases y pesos de clase", categoria: "ml" },
  parsimonia: { termino: "Parsimonia (preferir lo simple)", categoria: "ml" },
  funcion_activacion: { termino: "Función de activación", categoria: "redes" },
  lote_optimizador: { termino: "Lote (batch) y optimizador", categoria: "redes" },
  pesos_red: { termino: "Pesos (parámetros) de una red", categoria: "redes" },
  ngramas: { termino: "n-gramas y palabras vacías", categoria: "nlp" },
  evaluacion_perezosa: { termino: "Transformación y acción en Spark", categoria: "bigdata" },
  contrato_datos: { termino: "Contrato de datos", categoria: "datos" },
  model_card: { termino: "Model card (ficha del modelo)", categoria: "ml" },
  servidor_api: { termino: "Servidor web (uvicorn) y healthcheck", categoria: "despliegue" },
};

export const IDS_GLOSARIO = Object.keys(CATALOGO_GLOSARIO);

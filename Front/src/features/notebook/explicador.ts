/**
 * Explicador automático de código Python, línea a línea, para un principiante total. Reconoce imports,
 * estructuras básicas del lenguaje y ~120 llamadas frecuentes (pandas, NumPy, Matplotlib/Seaborn, scikit-learn,
 * Keras, Transformers, DuckDB, PySpark, plotnine y el paquete propio credit_risk). Las anotaciones manuales de
 * cada celda (content/anotaciones) pueden reemplazar la explicación de una línea concreta.
 */

export interface LineaExplicada {
  /** Número de línea dentro de la celda (1-based). */
  n: number;
  codigo: string;
  texto: string | null;
  /** Ids del glosario mencionados en la explicación. */
  conceptos: string[];
}

/* ---------- Librerías y módulos ---------- */
interface InfoModulo {
  desc: string;
  concepto?: string;
}
const MODULOS: [RegExp, InfoModulo][] = [
  [/^credit_risk(\.|$)/, { desc: "el paquete propio del proyecto: reúne en un solo lugar la lógica que comparten todos los notebooks y la API", concepto: "paquete" }],
  [/^pandas(\.|$)/, { desc: "pandas sirve para trabajar con tablas de datos (DataFrames): leer, filtrar, agrupar y resumir", concepto: "pandas" }],
  [/^numpy(\.|$)/, { desc: "NumPy hace cálculos numéricos rápidos sobre listas de números (vectores y matrices)", concepto: "numpy" }],
  [/^matplotlib(\.|$)/, { desc: "Matplotlib dibuja gráficos (histogramas, barras, líneas, dispersión)", concepto: "matplotlib" }],
  [/^seaborn(\.|$)/, { desc: "Seaborn dibuja gráficos estadísticos con menos código, sobre Matplotlib", concepto: "seaborn" }],
  [/^plotnine(\.|$)/, { desc: "plotnine dibuja gráficos con la «gramática de gráficos» de ggplot2 (datos + estética + geometría)", concepto: "plotnine" }],
  [/^duckdb(\.|$)/, { desc: "DuckDB permite consultar tablas con SQL dentro del mismo programa, sin un servidor de base de datos", concepto: "duckdb" }],
  [/^sklearn\.model_selection/, { desc: "el módulo de scikit-learn para dividir datos y validar modelos (train/test, validación cruzada)", concepto: "validacion_cruzada" }],
  [/^sklearn\.metrics/, { desc: "el módulo de scikit-learn con las métricas para evaluar modelos (AUC, matriz de confusión…)", concepto: "roc_auc" }],
  [/^sklearn\.preprocessing/, { desc: "el módulo de scikit-learn para preparar variables (escalar, codificar categorías)", concepto: "escalado" }],
  [/^sklearn\.linear_model/, { desc: "el módulo de scikit-learn con modelos lineales como la regresión logística", concepto: "regresion_logistica" }],
  [/^sklearn\.ensemble/, { desc: "el módulo de scikit-learn con modelos que combinan muchos árboles (random forest, gradient boosting)", concepto: "random_forest" }],
  [/^sklearn\.tree/, { desc: "el módulo de scikit-learn con árboles de decisión", concepto: "arbol_decision" }],
  [/^sklearn\.decomposition/, { desc: "el módulo de scikit-learn para reducir dimensiones (PCA)", concepto: "pca" }],
  [/^sklearn\.calibration/, { desc: "el módulo de scikit-learn para calibrar probabilidades", concepto: "calibracion" }],
  [/^sklearn\.impute/, { desc: "el módulo de scikit-learn para rellenar valores faltantes", concepto: "imputacion" }],
  [/^sklearn\.pipeline|^sklearn\.compose/, { desc: "el módulo de scikit-learn para encadenar pasos de preparación y modelo (pipelines)", concepto: "pipeline" }],
  [/^sklearn\.dummy/, { desc: "el módulo de scikit-learn con modelos de referencia (adivinan lo más frecuente)", concepto: "dummy" }],
  [/^sklearn\.feature_selection/, { desc: "el módulo de scikit-learn para medir qué variables aportan información", concepto: "informacion_mutua" }],
  [/^sklearn\.inspection/, { desc: "el módulo de scikit-learn para explicar modelos (importancia por permutación)", concepto: "importancia_variables" }],
  [/^sklearn(\.|$)/, { desc: "scikit-learn es la librería estándar de aprendizaje automático en Python", concepto: "sklearn" }],
  [/^(tensorflow|keras)(\.|$)/, { desc: "TensorFlow/Keras sirve para construir y entrenar redes neuronales", concepto: "tensorflow" }],
  [/^transformers(\.|$)/, { desc: "Transformers (Hugging Face) da acceso a modelos de lenguaje ya entrenados como BERT y GPT-2", concepto: "transformers" }],
  [/^sentence_transformers(\.|$)/, { desc: "sentence-transformers convierte frases en vectores numéricos (embeddings)", concepto: "sentence_transformers" }],
  [/^torch(\.|$)/, { desc: "PyTorch es el motor de cálculo que usan los modelos de lenguaje", concepto: "transformers" }],
  [/^pyspark(\.|$)/, { desc: "PySpark permite procesar datos en paralelo con Apache Spark (big data)", concepto: "pyspark" }],
  [/^fastapi(\.|$)/, { desc: "FastAPI sirve para crear APIs web en Python", concepto: "fastapi" }],
  [/^pydantic(\.|$)/, { desc: "Pydantic valida que los datos tengan el formato esperado", concepto: "pydantic" }],
  [/^scipy(\.|$)/, { desc: "SciPy reúne funciones científicas y estadísticas" }],
  [/^shap(\.|$)/, { desc: "SHAP explica cuánto aporta cada variable a una predicción", concepto: "shap" }],
  [/^joblib(\.|$)/, { desc: "joblib guarda y carga modelos entrenados en archivos" }],
  [/^papermill(\.|$)/, { desc: "papermill ejecuta notebooks de forma automática y con parámetros", concepto: "papermill" }],
  [/^IPython(\.|$)/, { desc: "IPython.display permite mostrar tablas y texto con formato dentro del notebook", concepto: "notebook" }],
  [/^hashlib$/, { desc: "hashlib calcula huellas digitales (como SHA-256) para comprobar que un archivo no cambió", concepto: "sha256" }],
  [/^(time|datetime)$/, { desc: "sirve para medir tiempos y manejar fechas" }],
  [/^json$/, { desc: "sirve para leer y escribir archivos JSON (datos de texto estructurado)", concepto: "json" }],
  [/^(pathlib|os|shutil)$/, { desc: "sirve para manejar rutas de archivos y carpetas" }],
  [/^(warnings|logging)$/, { desc: "controla los avisos y mensajes que muestra Python" }],
  [/^(re|math|random|itertools|functools|collections|typing|dataclasses|textwrap|sys)$/, { desc: "es parte de la librería estándar de Python (viene incluida)" }],
];

function infoModulo(nombre: string): InfoModulo {
  for (const [re, info] of MODULOS) if (re.test(nombre)) return info;
  return { desc: "una librería instalada en el entorno del proyecto", concepto: "libreria" };
}

/* ---------- Llamadas conocidas ---------- */
const LLAMADAS: [RegExp, string, string?][] = [
  // pandas
  [/\bpd\.read_csv\(/, "lee un archivo CSV y lo convierte en una tabla (DataFrame)", "csv"],
  [/\bread_parquet\(/, "lee un archivo Parquet (formato de columnas, compacto y rápido) como tabla", "parquet"],
  [/\.head\(/, "muestra las primeras filas de la tabla para darle un vistazo", "dataframe"],
  [/\.tail\(/, "muestra las últimas filas de la tabla", "dataframe"],
  [/\.describe\(/, "calcula un resumen estadístico de cada columna (media, mínimo, cuartiles, máximo)", "media"],
  [/\.info\(/, "muestra las columnas, su tipo de dato y cuántos valores no nulos tiene cada una", "tipo_dato"],
  [/\.shape\b/, "da el tamaño de la tabla: (filas, columnas)", "fila_columna"],
  [/\.dtypes\b/, "muestra el tipo de dato de cada columna", "tipo_dato"],
  [/\.(isna|isnull)\(\)/, "marca con Verdadero los valores faltantes", "nulo"],
  [/\.duplicated\(/, "marca las filas repetidas", "duplicado"],
  [/\.drop_duplicates\(/, "elimina las filas repetidas", "duplicado"],
  [/\.dropna\(/, "elimina las filas con valores faltantes", "nulo"],
  [/\.fillna\(/, "rellena los valores faltantes con el valor indicado", "imputacion"],
  [/\.groupby\(/, "agrupa las filas por una o más columnas para resumir cada grupo", "groupby"],
  [/\.agg\(/, "calcula resúmenes (conteo, media, suma…) para cada grupo", "groupby"],
  [/\.value_counts\(/, "cuenta cuántas veces aparece cada valor", "variable_categorica"],
  [/\.sort_values\(/, "ordena la tabla según una columna", "filtrado"],
  [/\.query\(/, "filtra las filas que cumplen una condición escrita como texto", "filtrado"],
  [/\.loc\[/, "selecciona filas y columnas por su nombre o por una condición", "filtrado"],
  [/\.iloc\[/, "selecciona filas y columnas por su posición", "filtrado"],
  [/\.merge\(/, "une dos tablas por una columna en común (como un BUSCARV)", "dataframe"],
  [/\.melt\(/, "pasa la tabla de formato ancho a largo (columnas → filas)", "dataframe"],
  [/\.pivot(_table)?\(/, "pasa la tabla de formato largo a ancho (filas → columnas), resumiendo si hace falta", "dataframe"],
  [/\.assign\(/, "crea columnas nuevas a partir de las existentes", "ingenieria_variables"],
  [/\.pipe\(/, "pasa la tabla a una función, para encadenar pasos de forma legible", "dataframe"],
  [/\.apply\(/, "aplica una función a cada fila o a cada valor", "funcion"],
  [/\.map\(/, "reemplaza cada valor según una correspondencia o función", "funcion"],
  [/\bpd\.cut\(/, "corta una variable numérica en rangos (intervalos) definidos", "variable_categorica"],
  [/\bpd\.qcut\(/, "corta una variable numérica en grupos de igual tamaño (cuantiles)", "percentil"],
  [/\bpd\.DataFrame\(/, "crea una tabla (DataFrame) a partir de datos de Python", "dataframe"],
  [/\bpd\.concat\(/, "pega varias tablas una debajo de otra (o una al lado de otra)", "dataframe"],
  [/\.corr\(/, "calcula la correlación entre columnas", "correlacion"],
  [/\.quantile\(/, "calcula percentiles (por ejemplo, el valor que deja abajo al 25 % de los datos)", "percentil"],
  [/\.(mean|median|std|sum|min|max)\(/, "calcula un resumen numérico (media, mediana, desviación, suma, mínimo o máximo)", "media"],
  [/\.to_csv\(|\.to_parquet\(/, "guarda la tabla en un archivo", "csv"],
  // numpy
  [/\bnp\.where\(/, "elige un valor u otro según una condición, elemento por elemento", "numpy"],
  [/\bnp\.(log|log1p|exp|sqrt)\(/, "aplica una transformación matemática a cada número", "numpy"],
  [/\bnp\.(percentile|quantile)\(/, "calcula percentiles de una lista de números", "percentil"],
  [/\bnp\.(mean|median|std)\(/, "calcula un promedio, una mediana o una desviación estándar", "media"],
  [/\bnp\.random\./, "genera números aleatorios (con semilla fija para que el resultado se repita igual)", "semilla"],
  [/\bnp\.(array|arange|linspace|zeros|ones)\(/, "crea un vector o matriz de números", "numpy"],
  // gráficos
  [/\bplt\.subplots\(/, "crea una figura con uno o varios paneles (ejes) para dibujar", "matplotlib"],
  [/\.hist\(/, "dibuja un histograma: cuántos valores caen en cada intervalo", "histograma"],
  [/\.scatter\(/, "dibuja un gráfico de dispersión: un punto por observación", "dispersion"],
  [/\.boxplot\(|sns\.boxplot\(/, "dibuja un diagrama de caja (mediana, cuartiles y atípicos)", "boxplot"],
  [/\.bar[h]?\(/, "dibuja un gráfico de barras", "matplotlib"],
  [/\.plot\(/, "dibuja una línea o un gráfico simple", "matplotlib"],
  [/\.set_(title|xlabel|ylabel)\(|plt\.(title|xlabel|ylabel)\(/, "pone título o nombres a los ejes del gráfico", "matplotlib"],
  [/\bplt\.show\(\)/, "muestra el gráfico en el notebook", "matplotlib"],
  [/\bplt\.tight_layout\(/, "acomoda los paneles para que no se monten entre sí", "matplotlib"],
  [/\bsns\.heatmap\(/, "dibuja un mapa de calor: una tabla coloreada según el valor", "heatmap"],
  [/\bsns\.violinplot\(/, "dibuja un diagrama de violín (como un boxplot que muestra la forma de la distribución)", "boxplot"],
  [/\bsns\.pairplot\(/, "dibuja todas las combinaciones de dispersión entre varias variables", "dispersion"],
  [/\bsns\.(histplot|kdeplot)\(/, "dibuja la distribución de una variable (histograma o curva de densidad)", "histograma"],
  [/\bsns\.(barplot|countplot)\(/, "dibuja un gráfico de barras con Seaborn", "seaborn"],
  [/\bsns\.scatterplot\(/, "dibuja un gráfico de dispersión con Seaborn", "dispersion"],
  [/\bggplot\(/, "empieza un gráfico con la gramática de gráficos: datos + estética (qué va en cada eje)", "plotnine"],
  [/\bgeom_\w+\(/, "agrega una geometría al gráfico (barras, puntos, cajas…)", "plotnine"],
  [/\bfacet_\w+\(/, "divide el gráfico en paneles, uno por cada grupo", "plotnine"],
  [/\bfigura_front\(/, "guarda la especificación del gráfico para que el sitio lo redibuje de forma nativa", "paquete"],
  // SQL
  [/\bduckdb\.(sql|query|connect)\(|\bcon\.(execute|sql)\(/, "ejecuta una consulta SQL sobre los datos con DuckDB", "sql"],
  [/\bSELECT\b/i, "consulta SQL: pide columnas (SELECT) de una tabla (FROM), con filtros (WHERE) y agrupaciones (GROUP BY)", "sql"],
  // scikit-learn
  [/\btrain_test_split\(/, "divide los datos en entrenamiento y prueba (aquí 80 % / 20 %, estratificado)", "train_test"],
  [/\bStratifiedKFold\(/, "prepara una validación cruzada estratificada: varios cortes de train con la misma proporción de impago", "validacion_cruzada"],
  [/\bcross_val(idate|_score|_predict)\(/, "entrena y evalúa el modelo varias veces sobre cortes distintos de train (validación cruzada)", "validacion_cruzada"],
  [/\bLogisticRegression\(/, "crea un modelo de regresión logística (suma ponderada de factores convertida en probabilidad)", "regresion_logistica"],
  [/\bRandomForestClassifier\(/, "crea un random forest: muchos árboles de decisión que votan", "random_forest"],
  [/\bHistGradientBoostingClassifier\(|GradientBoostingClassifier\(/, "crea un gradient boosting: árboles en cadena que corrigen los errores del anterior", "gradient_boosting"],
  [/\bDecisionTreeClassifier\(/, "crea un árbol de decisión: una serie de preguntas sí/no", "arbol_decision"],
  [/\bDummyClassifier\(/, "crea un modelo de referencia que siempre predice lo más frecuente (la vara de medir)", "dummy"],
  [/\bCalibratedClassifierCV\(/, "envuelve el modelo para calibrar sus probabilidades", "calibracion"],
  [/\bStandardScaler\(/, "crea un estandarizador: deja cada variable con media 0 y desviación 1", "escalado"],
  [/\bMinMaxScaler\(/, "crea un normalizador: lleva cada variable al rango de 0 a 1", "escalado"],
  [/\bOneHotEncoder\(/, "crea un codificador One-Hot: una columna 0/1 por cada categoría", "one_hot"],
  [/\bOrdinalEncoder\(/, "crea un codificador ordinal: convierte categorías ordenadas en números 0, 1, 2…", "ordinal"],
  [/\bSimpleImputer\(/, "crea un imputador: rellena faltantes con la mediana o la moda aprendida en train", "imputacion"],
  [/\bColumnTransformer\(/, "aplica una preparación distinta a cada grupo de columnas", "pipeline"],
  [/\bPipeline\(|make_pipeline\(/, "encadena preparación y modelo en un solo objeto (pipeline)", "pipeline"],
  [/\bPCA\(/, "crea un PCA: resume muchas variables en pocos componentes", "pca"],
  [/\.fit_transform\(/, "aprende los parámetros (con train) y transforma los datos en un solo paso", "entrenar"],
  [/\.fit\(/, "entrena: el modelo aprende de los datos de entrenamiento", "entrenar"],
  [/\.predict_proba\(/, "calcula la probabilidad de cada clase (aquí, la probabilidad de impago)", "probabilidad"],
  [/\.predict\(/, "predice la clase (pagó / no pagó) para cada cliente", "entrenar"],
  [/\.transform\(/, "aplica a nuevos datos lo que se aprendió con train (sin volver a aprender)", "fuga_datos"],
  [/\broc_auc_score\(/, "calcula el AUC: qué tan bien separa el modelo a quienes pagan de quienes no", "roc_auc"],
  [/\bconfusion_matrix\(/, "cuenta aciertos y errores del modelo en una tabla 2 × 2", "matriz_confusion"],
  [/\bbrier_score_loss\(/, "calcula el Brier: el error de las probabilidades (más bajo es mejor)", "brier"],
  [/\b(precision|recall|f1)_score\(/, "calcula precisión, recall o F1 con un umbral dado", "precision_recall"],
  [/\bpermutation_importance\(/, "mide la importancia de cada variable desordenándola y viendo cuánto empeora el modelo", "importancia_variables"],
  [/\bmutual_info_classif\(/, "mide cuánta información aporta cada variable sobre el impago", "informacion_mutua"],
  [/\brandom_state\s*=/, "fija la semilla aleatoria para que el resultado sea idéntico cada vez", "semilla"],
  // Keras
  [/\b(keras\.)?Sequential\(|\bkeras\.Model\(/, "crea una red neuronal apilando capas", "red_neuronal"],
  [/\bDense\(/, "agrega una capa densa: neuronas conectadas con todas las de la capa anterior", "mlp"],
  [/\bConv1D\(/, "agrega una capa convolucional: detecta patrones locales recorriendo la entrada", "cnn"],
  [/\bGRU\(|\bLSTM\(/, "agrega una capa recurrente: lee una secuencia paso a paso recordando lo anterior", "rnn_gru"],
  [/\bDropout\(/, "agrega dropout: apaga neuronas al azar al entrenar para evitar memorizar", "dropout"],
  [/\bBatchNormalization\(/, "normaliza las salidas de la capa para que el entrenamiento sea estable", "red_neuronal"],
  [/\.compile\(/, "configura cómo aprende la red: la función de pérdida, el optimizador y las métricas", "funcion_perdida"],
  [/\bEarlyStopping\(/, "detiene el entrenamiento cuando el error de validación deja de mejorar", "early_stopping"],
  [/\bepochs\s*=/, "fija el número máximo de épocas (pasadas completas por los datos)", "epoca"],
  [/\bclass_weight\s*=/, "da más peso a la clase menos frecuente para que el modelo no la ignore", "red_neuronal"],
  // NLP
  [/\bTfidfVectorizer\(/, "convierte textos en números según la importancia de cada palabra (TF-IDF)", "tfidf"],
  [/\bpipeline\(\s*["']sentiment/, "carga un modelo de lenguaje ya entrenado que estima el sentimiento de un texto", "sentimiento"],
  [/\bAutoTokenizer\./, "carga el tokenizador: parte el texto en piezas que el modelo entiende", "tokenizacion"],
  [/\bAutoModel\w*\./, "carga un modelo de lenguaje ya entrenado (como BERT o GPT-2)", "transformers"],
  [/\bSentenceTransformer\(/, "carga un modelo que convierte frases en vectores (embeddings)", "embedding"],
  [/\.encode\(/, "convierte textos en vectores numéricos (embeddings)", "embedding"],
  // Spark
  [/\bSparkSession\.builder/, "crea (o recupera) la sesión de Spark: el punto de entrada para procesar datos en paralelo", "spark"],
  [/\bspark\.read\b|\.read\.(parquet|csv)\(/, "lee datos con Spark (se reparten en particiones)", "particion"],
  [/\.groupBy\(/, "agrupa en Spark: cada grupo se calcula en paralelo", "spark"],
  [/\.withColumn\(/, "crea o reemplaza una columna en un DataFrame de Spark", "spark"],
  [/\.repartition\(|\.partitionBy\(/, "reparte los datos en particiones para procesarlos en paralelo", "particion"],
  [/\.write\b/, "guarda el resultado en disco", "parquet"],
  [/\bVectorAssembler\(/, "junta varias columnas en un solo vector, como lo pide MLlib", "mllib"],
  [/\.collect\(\)|\.toPandas\(\)|\.count\(\)|\.show\(/, "acción de Spark: ejecuta de verdad el cálculo y trae el resultado", "spark"],
  // notebook y proyecto
  [/\bsetup\(\)/, "prepara el entorno del notebook (estilo de gráficos, semilla, rutas) con el paquete del proyecto", "paquete"],
  [/\bdisplay\(/, "muestra una tabla o un texto con formato dentro del notebook", "notebook"],
  [/\bMarkdown\(/, "crea un texto con formato (Markdown) para mostrarlo", "notebook"],
  [/\bprint\(/, "escribe un texto o un valor en la salida de la celda", "funcion"],
  [/\bjson\.(dump|load)\(/, "guarda o lee datos en formato JSON", "json"],
  [/\bopen\(/, "abre un archivo para leerlo o escribirlo", "funcion"],
];

const PALABRAS: [RegExp, (m: RegExpMatchArray) => string, string?][] = [
  [/^#\s?(.*)$/, () => "Comentario: una nota para las personas. Python la ignora al ejecutar.", "variable"],
  [/^def\s+(\w+)\s*\((.*)\)/, (m) => `Define la función «${m[1]}»: un bloque reutilizable${m[2].trim() ? ` que recibe (${m[2].trim()})` : ""}. No se ejecuta aquí; se ejecuta cada vez que se la llama.`, "funcion"],
  [/^class\s+(\w+)/, (m) => `Define la clase «${m[1]}»: un molde para crear objetos con datos y acciones propios.`, "clase"],
  [/^for\s+(.+?)\s+in\s+(.+):$/, (m) => `Repite el bloque siguiente una vez por cada elemento de ${m[2].trim()} (cada uno se llama «${m[1].trim()}»).`, "lista_diccionario"],
  [/^if\s+(.+):$/, () => "Condición: el bloque siguiente solo se ejecuta si lo que sigue a «if» es verdadero."],
  [/^elif\s+(.+):$/, () => "Otra condición: se revisa solo si las anteriores fueron falsas."],
  [/^else:$/, () => "Si ninguna condición anterior se cumplió, se ejecuta este bloque."],
  [/^while\s+(.+):$/, () => "Repite el bloque siguiente mientras la condición sea verdadera."],
  [/^return\b/, () => "Devuelve el resultado de la función a quien la llamó."],
  [/^with\s+(.+?)(\s+as\s+(\w+))?:$/, (m) => `Abre un contexto (por ejemplo, un archivo o una conexión) que se cierra solo al terminar el bloque${m[3] ? `; dentro se llama «${m[3]}»` : ""}.`],
  [/^try:$/, () => "Intenta ejecutar el bloque siguiente; si falla, sigue en «except» en lugar de detener el notebook."],
  [/^except\b/, () => "Qué hacer si el bloque de «try» falla."],
  [/^assert\s/, () => "Comprobación: si la condición no se cumple, el notebook se detiene con un error (así se valida un supuesto)."],
  [/^(FAST|MODO_RAPIDO)\s*=/, () => "Parámetro de ejecución: papermill lo puede cambiar al correr el notebook (por ejemplo, para una prueba rápida).", "papermill"],
];

function describirImport(linea: string): { texto: string; conceptos: string[] } | null {
  let m = /^import\s+(.+)$/.exec(linea);
  if (m) {
    const partes = m[1].split(",").map((p) => p.trim()).filter(Boolean);
    const conceptos = new Set<string>(["importar"]);
    const textos = partes.map((p) => {
      const [nombre, alias] = p.split(/\s+as\s+/).map((x) => x.trim());
      const info = infoModulo(nombre);
      if (info.concepto) conceptos.add(info.concepto);
      return `«${nombre}»${alias ? ` (se le llamará «${alias}» para escribir menos)` : ""}: ${info.desc}`;
    });
    return { texto: `Importa ${textos.join("; ")}.`, conceptos: [...conceptos] };
  }
  m = /^from\s+([\w.]+)\s+import\s+\(?(.+?)\)?$/.exec(linea);
  if (m) {
    const info = infoModulo(m[1]);
    const nombres = m[2]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [n, a] = p.split(/\s+as\s+/).map((x) => x.trim());
        return a ? `${n} (como «${a}»)` : n;
      });
    const conceptos = ["importar", ...(info.concepto ? [info.concepto] : [])];
    return {
      texto: `Del módulo «${m[1]}» trae solo ${nombres.join(", ")}, para usarlo directamente por su nombre. ${info.desc.charAt(0).toUpperCase()}${info.desc.slice(1)}.`,
      conceptos,
    };
  }
  return null;
}

function describirLlamadas(linea: string): { texto: string; conceptos: string[] } | null {
  const hallados: { t: string; c?: string }[] = [];
  for (const [re, t, c] of LLAMADAS) {
    if (re.test(linea) && !hallados.some((h) => h.t === t)) hallados.push({ t, c });
    if (hallados.length >= 2) break;
  }
  if (!hallados.length) return null;
  return { texto: hallados.map((h) => h.t).join("; luego "), conceptos: hallados.map((h) => h.c).filter(Boolean) as string[] };
}

/** Explica una celda de código línea a línea. `manual` reemplaza la explicación de líneas concretas (1-based). */
export function explicarCelda(fuente: string, manual: Record<number, string> = {}): LineaExplicada[] {
  const lineas = fuente.replace(/\n+$/, "").split("\n");
  let previaAbierta = false;
  return lineas.map((codigo, i) => {
    const n = i + 1;
    const t = codigo.trim();
    if (manual[n]) return { n, codigo, texto: manual[n], conceptos: [] };
    if (!t) {
      previaAbierta = false;
      return { n, codigo, texto: null, conceptos: [] };
    }
    const continua = previaAbierta || /^[)\]}]/.test(t);
    previaAbierta = /[([{,\\]$/.test(t) || (previaAbierta && !/^[)\]}]/.test(t) && /[([{,]$/.test(t));
    const imp = describirImport(t);
    if (imp) return { n, codigo, ...imp };
    for (const [re, f, c] of PALABRAS) {
      const m = re.exec(t);
      if (m) return { n, codigo, texto: f(m), conceptos: c ? [c] : [] };
    }
    const llam = describirLlamadas(t);
    const asign = /^([A-Za-z_][\w.,\s[\]"']*?)\s*=(?!=)\s*(.+)$/.exec(t);
    if (asign && !continua) {
      const destino = asign[1].trim();
      const base = /,/.test(destino) ? `Guarda los resultados en las variables ${destino}` : `Guarda en la variable «${destino}»`;
      return {
        n,
        codigo,
        texto: llam ? `${base} el resultado de esta instrucción, que ${llam.texto}.` : `${base} el valor de la derecha, para usarlo más adelante.`,
        conceptos: ["variable", ...(llam?.conceptos ?? [])],
      };
    }
    if (llam) return { n, codigo, texto: `${llam.texto.charAt(0).toUpperCase()}${llam.texto.slice(1)}.`, conceptos: llam.conceptos };
    if (continua) return { n, codigo, texto: "Continúa la instrucción de la línea anterior (argumentos o elementos de una lista).", conceptos: ["parametro"] };
    if (/\w+\(/.test(t)) return { n, codigo, texto: "Llama a una función o método: ejecuta una acción con los datos indicados entre paréntesis.", conceptos: ["funcion"] };
    return { n, codigo, texto: null, conceptos: [] };
  });
}

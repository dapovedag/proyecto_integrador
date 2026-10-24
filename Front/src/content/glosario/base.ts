/**
 * Glosario pedagógico: categorías «python», «datos», «estadistica» y «proyecto».
 * Ids, términos y categorías según CATALOGO_GLOSARIO (content/pedagogia.ts).
 * Cifras tomadas de model_card.json, agregados.json, gestion.json y de los notebooks ejecutados.
 */
import type { EntradaGlosario } from "../pedagogia";

export const GLOSARIO_BASE: EntradaGlosario[] = [
  /* ------------------------------------------------------------------ */
  /* Programación en Python                                             */
  /* ------------------------------------------------------------------ */
  {
    id: "python",
    termino: "Python",
    alias: ["python"],
    categoria: "python",
    corto: "Lenguaje de programación con el que está hecho todo el análisis: los notebooks, el paquete credit_risk, el modelo y la API.",
    queEs:
      "Python es un lenguaje de programación: una forma de darle instrucciones a la computadora con palabras parecidas al inglés. Es como una receta de cocina que la máquina sigue paso a paso, en orden. Es muy usado en ciencia de datos porque se lee con facilidad y tiene miles de herramientas listas para usar.",
    paraQue:
      "Sirve para cargar datos, limpiarlos, hacer cálculos, dibujar gráficos y entrenar modelos predictivos, todo con un mismo lenguaje.",
    enEsteProyecto:
      "Todo el proyecto está escrito en Python 3.10.7: los 10 notebooks, el paquete propio credit_risk, el entrenamiento del modelo y la API. Las técnicas que el curso presenta en R (dplyr y ggplot2) se hacen con sus equivalentes en Python: pandas encadenado y plotnine.",
    capitulo: 1,
  },
  {
    id: "notebook",
    termino: "Notebook (Jupyter)",
    alias: ["notebook", "notebooks", "jupyter", "jupyter notebook", "ipynb"],
    categoria: "python",
    corto: "Documento que mezcla texto explicativo, código que se ejecuta y sus resultados (tablas y gráficos) en un mismo lugar.",
    queEs:
      "Un notebook es como un cuaderno de laboratorio digital. En la misma página conviven las explicaciones escritas, el código y lo que ese código produce: una tabla, un número o un gráfico. Jupyter es el programa más usado para abrirlos, y sus archivos terminan en .ipynb.",
    paraQue:
      "Sirve para contar un análisis de principio a fin: qué se hizo, con qué código y qué resultó, de modo que otra persona pueda leerlo y volver a ejecutarlo.",
    enEsteProyecto:
      "El proyecto tiene 10 notebooks: del 01 al 09, uno por capítulo, y el 00, que integra todo y predice la probabilidad de impago de tres clientes. Todos se ejecutaron de verdad con el kernel credit-risk (el motor de Python que corre el código, con las librerías del proyecto), y el sitio muestra sus celdas y salidas reales.",
    capitulo: 1,
  },
  {
    id: "celda",
    termino: "Celda",
    alias: ["celda", "celda de código", "celdas de código"],
    categoria: "python",
    corto: "Cada bloque de un notebook. Puede contener texto explicativo o código que se ejecuta y muestra su resultado justo debajo.",
    queEs:
      "Un notebook se divide en celdas, como casillas apiladas de arriba abajo. Hay dos tipos: las celdas de texto, que explican, y las celdas de código, que se ejecutan. Al ejecutar una celda de código, su resultado aparece justo debajo de ella.",
    paraQue:
      "Permiten avanzar por partes: ejecutar un paso, mirar el resultado y solo entonces seguir con el siguiente.",
    enEsteProyecto:
      "El notebook 02, por ejemplo, tiene 66 celdas, 35 de ellas de código. La primera celda de código de cada notebook es FAST = False: es la celda de parámetros que papermill puede cambiar para hacer una corrida rápida de prueba.",
    capitulo: 1,
  },
  {
    id: "importar",
    termino: "Importar (import / from … import)",
    alias: ["import", "importar"],
    categoria: "python",
    corto: "Instrucción que trae a su programa una librería o una función ya escrita para poder usarla. Ejemplo: import pandas as pd.",
    queEs:
      "Python trae pocas herramientas de fábrica; el resto está guardado en librerías. Importar es como sacar una caja de herramientas del armario antes de usarla. «import pandas as pd» trae pandas y le pone un apodo corto, pd; «from credit_risk.data import cargar_datos» trae una sola herramienta concreta de esa caja.",
    paraQue:
      "Sirve para reutilizar código que ya existe, en lugar de escribirlo de nuevo, y para dejar claro al inicio del notebook qué herramientas se van a usar.",
    enEsteProyecto:
      "Cada notebook empieza con una celda de importaciones: las librerías de análisis (pandas, NumPy, Matplotlib, Seaborn, DuckDB) y las funciones del paquete propio credit_risk. Los notebooks no copian lógica: la importan del paquete, igual que el entrenamiento y la API.",
    capitulo: 1,
  },
  {
    id: "libreria",
    termino: "Librería",
    alias: ["librería", "librerías", "biblioteca", "bibliotecas"],
    categoria: "python",
    corto: "Conjunto de código ya escrito y probado por otras personas, que usted puede importar para no empezar desde cero.",
    queEs:
      "Una librería es una colección de herramientas de programación listas para usar, como una caja de herramientas especializada: pandas sirve para tablas y Matplotlib para gráficos. Se instala una vez en la computadora y luego se importa en cada notebook.",
    paraQue:
      "Ahorra trabajo y errores: tareas como leer un archivo, calcular un promedio o entrenar un modelo ya están resueltas y probadas por miles de usuarios.",
    enEsteProyecto:
      "La función setup() muestra al inicio de cada notebook las versiones exactas: pandas 2.3.3, NumPy 1.26.4, Matplotlib 3.10.9, Seaborn 0.13.2, scikit-learn 1.4.2, DuckDB 1.5.6 y plotnine 0.15.8. Fijar las versiones permite repetir el análisis y obtener los mismos resultados.",
    capitulo: 1,
  },
  {
    id: "modulo",
    termino: "Módulo",
    alias: [
      "credit_risk.config",
      "credit_risk.data",
      "credit_risk.features",
      "credit_risk.models",
      "credit_risk.fairness",
      "credit_risk.explain",
      "credit_risk.notebook",
      "credit_risk.reporting",
      "credit_risk.prediccion",
    ],
    categoria: "python",
    corto: "Archivo de Python que agrupa funciones de un mismo tema. Por ejemplo, credit_risk.data es el módulo de datos del paquete.",
    queEs:
      "Un módulo es un archivo de código que reúne funciones relacionadas. Si un paquete es un armario, cada módulo es un cajón con etiqueta: uno para los datos, otro para los modelos, otro para la equidad. Se nombra con un punto: credit_risk.data significa «el módulo data dentro del paquete credit_risk».",
    paraQue:
      "Ordena el código por temas, de modo que cada función se encuentra rápido y se puede importar solo lo que hace falta.",
    enEsteProyecto:
      "El paquete credit_risk tiene, entre otros, los módulos config (constantes como la semilla 42), data (cargar, limpiar y dividir), features (variables nuevas y preprocesamiento), models (modelos y umbrales), fairness (equidad), explain (explicaciones) y notebook (preparación del entorno con setup()).",
    capitulo: 1,
  },
  {
    id: "paquete",
    termino: "Paquete propio (credit_risk)",
    alias: ["credit_risk", "paquete", "pip install -e"],
    categoria: "python",
    corto: "Paquete de Python propio del proyecto, credit_risk: la única fuente de la lógica de datos, variables, modelos y equidad.",
    queEs:
      "Un paquete es un conjunto de módulos (archivos de código) agrupados bajo un mismo nombre, que se instala y se importa como cualquier librería. Un paquete propio es uno que escribe el mismo equipo. Es como el recetario oficial de una cocina: todos cocinan con las mismas recetas y nadie las copia a mano.",
    paraQue:
      "Evita que la misma lógica se escriba en varios lugares y termine siendo distinta. Si una regla cambia, se cambia en un solo sitio y todos la usan.",
    enEsteProyecto:
      "El paquete credit_risk (versión 2.0.0) contiene la limpieza, las variables nuevas, los modelos, la equidad y las explicaciones. Los notebooks, el script de entrenamiento y la API lo importan, y ninguno reimplementa esa lógica: así se aplica la lección L3, «la lógica duplicada diverge».",
    capitulo: 1,
  },
  {
    id: "variable",
    termino: "Variable (en programación)",
    alias: ["asignación", "asignar"],
    categoria: "python",
    corto: "Nombre que guarda un valor dentro de un programa, como una etiqueta pegada a una caja. Ejemplo: df = cargar_datos().",
    queEs:
      "En programación, una variable es un nombre al que se le asigna un valor con el signo igual. Es como una caja con etiqueta: la etiqueta es el nombre y dentro va el dato, que puede ser un número, un texto o una tabla entera. No se confunda con una variable estadística, que es una columna del dataset.",
    paraQue:
      "Sirve para guardar resultados y reutilizarlos más adelante por su nombre, sin repetir cálculos.",
    enEsteProyecto:
      "En los notebooks, df = cargar_datos() guarda la tabla de 12.144 filas en la variable df, y TARGET guarda el nombre de la columna objetivo, «default». Por convención, los nombres en mayúsculas (TARGET, FAST) indican valores que no cambian durante el notebook.",
    capitulo: 1,
  },
  {
    id: "funcion",
    termino: "Función",
    alias: ["función", "funciones", "def", "lambda"],
    categoria: "python",
    corto: "Bloque de código con nombre que recibe datos, hace una tarea y devuelve un resultado. Se define con def y se usa con paréntesis.",
    queEs:
      "Una función es como una licuadora: usted pone ingredientes (los datos de entrada), la enciende y obtiene un resultado. Se define una vez con la palabra def y se usa todas las veces que haga falta, escribiendo su nombre seguido de paréntesis, por ejemplo cargar_datos(). Una lambda es una función corta y sin nombre, escrita en una sola línea.",
    paraQue:
      "Evita repetir código, le da un nombre claro a cada tarea y permite probarla por separado.",
    enEsteProyecto:
      "Casi todo el trabajo pasa por funciones del paquete credit_risk: setup() prepara el entorno, limpiar() aplica las reglas de limpieza, dividir() separa train y test y predecir_cliente() calcula la probabilidad de impago. El notebook 02 define su propia función, coinciden(), que comprueba que pandas y DuckDB devuelven la misma tabla.",
    capitulo: 1,
  },
  {
    id: "metodo",
    termino: "Método",
    alias: ["método", ".head()", ".info()", ".describe()"],
    categoria: "python",
    corto: "Función que pertenece a un objeto y se usa con un punto: df.head() le pide a la tabla df que muestre sus primeras filas.",
    queEs:
      "Un método es una función que viene «pegada» a un objeto y trabaja sobre él. Se escribe con un punto entre el objeto y el método: df.head() significa «tabla df, muéstreme sus primeras filas». Es como los botones de un electrodoméstico: cada aparato trae los suyos.",
    paraQue:
      "Permite pedirle cosas a un objeto de forma directa y encadenar varios pasos, uno detrás de otro.",
    enEsteProyecto:
      "La inspección del notebook 02 usa métodos de pandas: df.head() y df.tail() muestran filas, df.info() resume tipos y nulos, df.describe() calcula estadísticas y df.groupby() agrupa. En el notebook 04 se encadenan métodos (query, assign, groupby, sort_values) para imitar la gramática de dplyr.",
    capitulo: 1,
  },
  {
    id: "clase",
    termino: "Clase y objeto",
    alias: ["class", "dataclass", "objeto", "instancia"],
    categoria: "python",
    corto: "Una clase es un molde y un objeto es algo fabricado con ese molde. Ejemplo: Winsorizer() crea un objeto que recorta valores extremos.",
    queEs:
      "Una clase es como el molde de una galleta y cada objeto es una galleta hecha con él: todas tienen la misma forma, pero cada una guarda sus propios datos. Al escribir el nombre de la clase con paréntesis, por ejemplo StandardScaler(), se fabrica un objeto nuevo, que trae sus métodos, como fit() para aprender y transform() para aplicar lo aprendido. No se confunda con la «clase» de la variable objetivo (pagó o impago), que es otro uso de la misma palabra.",
    paraQue:
      "Agrupa datos y comportamientos en una sola pieza reutilizable; casi todas las herramientas de pandas y scikit-learn son clases.",
    enEsteProyecto:
      "El paquete define clases propias como Winsorizer, que aprende los percentiles 1 y 99 en train y recorta con ellos cualquier conjunto, y ReporteLimpieza, que anota cuántas filas cambió cada regla. Los codificadores OneHotEncoder y OrdinalEncoder y el escalador StandardScaler también son clases, de scikit-learn.",
    capitulo: 1,
  },
  {
    id: "parametro",
    termino: "Parámetro y argumento",
    alias: ["parámetro", "parámetros", "argumento", "argumentos"],
    categoria: "python",
    corto: "Dato que se le entrega a una función para ajustar lo que hace. En random_state=42, random_state es el parámetro y 42 el argumento.",
    queEs:
      "Cuando una función tiene un espacio para recibir información, ese espacio se llama parámetro; el valor concreto que usted pone ahí se llama argumento. Es como el dial de un horno: el parámetro es «temperatura» y el argumento es «180 grados». En Python se escriben dentro de los paréntesis, a menudo con su nombre: random_state=42.",
    paraQue:
      "Permiten usar la misma función en situaciones distintas sin reescribirla, solo cambiando los valores que se le entregan.",
    enEsteProyecto:
      "La división de los datos usa train_test_split con test_size=0.2 (20 % para prueba), stratify (conservar la tasa de impago) y random_state=42 (repetir el mismo resultado). OneHotEncoder recibe handle_unknown=\"ignore\" para no fallar si llega una categoría nueva, y papermill le pasa a cada notebook el parámetro FAST.",
    capitulo: 1,
  },
  {
    id: "lista_diccionario",
    termino: "Lista y diccionario",
    alias: ["list", "dict", "diccionarios"],
    categoria: "python",
    corto: "Una lista guarda valores en orden, entre corchetes [ ]; un diccionario guarda pares clave: valor, entre llaves { }.",
    queEs:
      "Una lista es como una lista de mercado: elementos en un orden fijo, por ejemplo [\"edad\", \"ingreso_mensual\"]. Un diccionario es como una agenda de teléfonos: cada nombre (la clave) lleva a un dato (el valor), por ejemplo {0: \"Pagó\", 1: \"Impago\"}. Las listas se recorren en orden; los diccionarios se consultan por clave.",
    paraQue:
      "Son la forma más común de agrupar datos sencillos en Python: nombres de columnas, configuraciones o resultados por variable.",
    enEsteProyecto:
      "Los notebooks usan listas para decidir qué columnas graficar, como las variables de los boxplots, y diccionarios para traducir códigos a etiquetas: NOMBRE_CLASE = {0: \"Pagó (0)\", 1: \"Impago (1)\"}. La model card del modelo final también es un gran diccionario guardado como archivo JSON.",
    capitulo: 1,
  },
  {
    id: "semilla",
    termino: "Semilla aleatoria (random_state)",
    alias: ["random_state", "semilla", "seed", "randomstate"],
    categoria: "python",
    corto: "Número fijo que hace que los procesos «al azar» den siempre el mismo resultado. En el proyecto es 42 (random_state=42).",
    queEs:
      "La computadora no lanza dados de verdad: genera números que parecen aleatorios a partir de un número inicial, la semilla. Con la misma semilla se obtiene exactamente la misma secuencia «al azar». Es como barajar un mazo siempre con los mismos movimientos: el orden final sale igual cada vez.",
    paraQue:
      "Hace el trabajo reproducible: quien repita el análisis obtiene las mismas muestras, la misma división de datos y los mismos modelos.",
    enEsteProyecto:
      "La semilla es 42 en todo el proyecto (config.RANDOM_STATE). Con ella se generó el dataset sintético, se tomaron las muestras de 3.000 clientes de los gráficos de dispersión y se hizo la división 80/20, de modo que train y test tienen siempre los mismos 9.600 y 2.400 clientes.",
    capitulo: 1,
  },
  {
    id: "papermill",
    termino: "Papermill",
    alias: ["papermill", "execute_notebook", "fast = false"],
    categoria: "python",
    corto: "Herramienta que ejecuta notebooks completos de forma automática, sin abrirlos, y puede pasarles parámetros.",
    queEs:
      "Papermill es como un piloto automático para notebooks: abre el notebook, ejecuta todas sus celdas en orden y guarda el resultado, sin que nadie haga clic. Además puede cambiar los valores de la celda de parámetros antes de empezar, por ejemplo para hacer una corrida rápida.",
    paraQue:
      "Garantiza que lo que se muestra salió de una ejecución completa y en orden, no de celdas corridas a mano y en desorden.",
    enEsteProyecto:
      "El script ejecutar_notebooks.py corre los notebooks con papermill, uno detrás de otro y con el kernel credit-risk, y registra cuánto tardó cada uno; el 07, por ejemplo, tardó 411,2 s. El parámetro FAST permite una prueba rápida; las salidas que publica el sitio son de la corrida completa (FAST = False).",
    capitulo: 1,
  },
  {
    id: "pandas",
    termino: "pandas",
    alias: ["pandas", "pd"],
    categoria: "python",
    corto: "Librería de Python para trabajar con tablas (DataFrames): leer, filtrar, agrupar, combinar y resumir datos.",
    queEs:
      "pandas es la herramienta principal para manejar datos en forma de tabla en Python, algo así como una hoja de cálculo que se controla con código. Cada tabla se llama DataFrame. Por costumbre se importa con el apodo pd: import pandas as pd.",
    paraQue:
      "Sirve para casi todo el trabajo previo al modelo: cargar un archivo, revisar faltantes, crear columnas, filtrar filas y calcular tasas por grupo.",
    enEsteProyecto:
      "Con pandas 2.3.3 se carga el CSV de 12.144 filas y 21 columnas, se cuentan nulos y duplicados y se calculan tasas de impago por segmento. En el notebook 04, pandas encadenado reemplaza los verbos de dplyr de R: filter, select, mutate, group_by, summarise y arrange.",
    capitulo: 1,
  },
  {
    id: "numpy",
    termino: "NumPy",
    alias: ["numpy", "np"],
    categoria: "python",
    corto: "Librería de Python para cálculo numérico rápido con arreglos (listas de números) y funciones matemáticas.",
    queEs:
      "NumPy es la calculadora científica de Python. Trabaja con arreglos, que son listas de números del mismo tipo, y opera sobre miles de ellos a la vez, mucho más rápido que uno por uno. pandas y scikit-learn están construidos sobre NumPy. Se importa como np.",
    paraQue:
      "Sirve para cálculos como logaritmos, percentiles, conteos para histogramas o números aleatorios con semilla.",
    enEsteProyecto:
      "Los notebooks usan NumPy 1.26.4 para calcular los intervalos de los histogramas (np.histogram), pasar ingresos y montos a escala logarítmica (np.log10) y crear columnas según una condición (np.where).",
    capitulo: 1,
  },
  {
    id: "matplotlib",
    termino: "Matplotlib",
    alias: ["matplotlib", "plt", "matplotlib.pyplot"],
    categoria: "python",
    corto: "Librería base de gráficos en Python: dibuja histogramas, barras, líneas y dispersiones, con control de cada detalle.",
    queEs:
      "Matplotlib es el lienzo y los pinceles de Python. Con plt.subplots se crea una figura con uno o varios recuadros, y en cada uno se dibujan barras, puntos o líneas. Casi siempre se importa como import matplotlib.pyplot as plt.",
    paraQue:
      "Convierte números en imágenes para ver formas, tendencias y diferencias que en una tabla pasarían desapercibidas.",
    enEsteProyecto:
      "Con Matplotlib 3.10.9 el notebook 02 dibuja los histogramas, las dispersiones y los boxplots de la exploración. El notebook 04 arma un panel de 2×2 con el impago por número de moras, el puntaje de buró por clase, el impago por decil de uso del cupo y la cartera por propósito.",
    capitulo: 1,
  },
  {
    id: "seaborn",
    termino: "Seaborn",
    alias: ["seaborn", "sns"],
    categoria: "python",
    corto: "Librería de gráficos estadísticos construida sobre Matplotlib: mapas de calor, pairplots y violines con muy poco código.",
    queEs:
      "Seaborn es como un asistente de diseño para Matplotlib: con una sola línea produce gráficos estadísticos completos y bien presentados. Entiende directamente las tablas de pandas y sabe colorear por grupo. Se importa como sns.",
    paraQue:
      "Sirve para comparar grupos y ver relaciones entre varias variables a la vez sin escribir mucho código de dibujo.",
    enEsteProyecto:
      "Seaborn 0.13.2 dibuja el mapa de nulos (notebook 03) y, en el notebook 04, el mapa de calor de correlaciones de Spearman, el pairplot de las 4 variables más asociadas con el impago, los violines por clase y los boxplots antes y después del capping.",
    capitulo: 2,
  },
  {
    id: "plotnine",
    termino: "plotnine (gramática de gráficos)",
    alias: ["plotnine", "ggplot", "ggplot2", "aes", "facet_wrap", "geom_boxplot", "geom_col", "geom_line"],
    categoria: "python",
    corto: "Versión en Python de ggplot2 (de R): arma gráficos por capas con datos, estéticas, geometrías y facetas.",
    queEs:
      "plotnine aplica la «gramática de gráficos»: en lugar de dibujar a mano, el gráfico se describe por capas, como se arma un sándwich. Primero los datos; luego las estéticas (aes), que dicen qué columna va en cada eje o color; después la geometría (geom_), que dice si son cajas, barras o líneas; y al final las facetas (facet_wrap), que repiten el gráfico para cada grupo.",
    paraQue:
      "Permite construir gráficos complejos y comparables con muy poco código, y ese código es casi idéntico al de ggplot2 en R.",
    enEsteProyecto:
      "Como el proyecto es 100 % Python, la parte de ggplot2 del curso se hace con plotnine 0.15.8. El notebook 04 tiene tres gráficos: boxplots del buró por clase en cada situación laboral, el impago por rango de edad en cada propósito y el impago por quintil de deuda/ingreso según las moras previas.",
    capitulo: 4,
  },
  {
    id: "duckdb",
    termino: "DuckDB",
    alias: ["duckdb", "duckdb.sql", "duckdb.connect"],
    categoria: "python",
    corto: "Motor de base de datos que corre dentro de Python, en memoria, para consultar tablas con SQL sin instalar un servidor.",
    queEs:
      "DuckDB es una base de datos «de bolsillo»: vive dentro del mismo programa de Python y trabaja en la memoria de la computadora, sin un servidor aparte. Permite escribir consultas SQL directamente sobre una tabla de pandas o sobre un archivo CSV. Es como tener un traductor que entiende SQL sentado justo al lado de sus datos.",
    paraQue:
      "Sirve para analizar con SQL (filtrar, agrupar, ordenar) de forma rápida y legible, sin mover los datos a otra base.",
    enEsteProyecto:
      "El dato de registro sigue siendo el CSV db/credit_risk.csv, y DuckDB 1.5.6 es la estrategia para consultarlo con SQL (ADR-007). En el notebook 02, las 11 operaciones hechas en pandas se repiten con DuckDB y dan el mismo resultado; en el 04, DuckDB muestra que los clientes con buró menor a 600 son el 17,0 % de la cartera y el 38,6 % de los impagos.",
    capitulo: 2,
  },
  {
    id: "sql",
    termino: "SQL",
    alias: ["sql", "consulta sql", "group by", "order by"],
    categoria: "python",
    corto: "Lenguaje estándar para consultar tablas: SELECT elige columnas, WHERE filtra filas, GROUP BY agrupa y ORDER BY ordena.",
    queEs:
      "SQL (lenguaje de consultas estructurado) es la forma clásica de hacerle preguntas a una tabla de datos. Se escribe casi como una frase en inglés: «SELECT edad FROM df WHERE moras_ultimos_12m > 0» significa «traiga la edad de los clientes con al menos una mora». Lo entienden casi todas las bases de datos.",
    paraQue:
      "Sirve para filtrar, agrupar, ordenar y resumir datos diciendo qué se quiere, mientras el motor decide cómo calcularlo.",
    enEsteProyecto:
      "El proyecto usa SQL con DuckDB en los notebooks 02, 04, 07 y 00, y con Spark SQL en el 09. Un detalle práctico: default es una palabra reservada de SQL, por eso en las consultas la columna objetivo se escribe entre comillas dobles.",
    capitulo: 2,
  },
  {
    id: "sklearn",
    termino: "scikit-learn",
    alias: ["sklearn", "scikit-learn"],
    categoria: "python",
    corto: "Librería de aprendizaje automático de Python: preprocesamiento, modelos, validación y métricas, todo con la misma forma de uso.",
    queEs:
      "scikit-learn es la caja de herramientas estándar del aprendizaje automático (machine learning) en Python. Todas sus piezas se usan igual: primero se ajustan a los datos con fit() y después se aplican con transform() o predict(). Esa regularidad permite encadenarlas en un pipeline, como piezas de Lego que encajan.",
    paraQue:
      "Sirve para preparar datos (imputar, codificar, escalar), entrenar modelos, compararlos con validación cruzada y medir su desempeño.",
    enEsteProyecto:
      "Con scikit-learn 1.4.2 se hacen la división train/test, la codificación One-Hot y ordinal, el escalado y el PCA (notebook 03), y luego los modelos clásicos. El modelo servido es una LogisticRegression calibrada de scikit-learn, con un ROC-AUC de 0,8456 en test (una medida de 0,5 a 1 de qué tan bien ordena a los clientes por riesgo).",
    capitulo: 3,
  },
  {
    id: "tensorflow",
    termino: "TensorFlow y Keras",
    alias: ["tensorflow", "tf", "keras"],
    categoria: "python",
    corto: "Librerías para construir y entrenar redes neuronales. Keras es la capa sencilla con la que se apilan las capas de la red.",
    queEs:
      "TensorFlow es el motor que hace los cálculos pesados de las redes neuronales, y Keras es el tablero de mandos fácil de usar que va encima. Con Keras una red se arma como una pila de bloques: una capa de entrada, capas ocultas y una capa de salida. Luego se entrena época por época, viendo cómo mejora.",
    paraQue:
      "Sirve para modelos de aprendizaje profundo, como redes para texto, imágenes o secuencias.",
    enEsteProyecto:
      "En el notebook 06 se entrenaron con TensorFlow 2.20 y Keras 3 cuatro redes: MLP, CNN 1D, GRU sobre el texto e híbrida (texto + tabla). La mejor en test, el MLP, llegó a un ROC-AUC de 0,8419, a la par de los modelos clásicos; por eso el modelo servido sigue siendo la regresión logística, más rápida y explicable.",
    capitulo: 6,
  },
  {
    id: "transformers",
    termino: "Hugging Face Transformers",
    alias: ["transformers", "hugging face", "huggingface"],
    categoria: "python",
    corto: "Librería de Hugging Face para descargar y usar modelos de lenguaje ya entrenados, como BERT y GPT-2, con pocas líneas de código.",
    queEs:
      "Hugging Face es una gran biblioteca pública de modelos de inteligencia artificial, y Transformers es la librería de Python para usarlos. Un modelo de lenguaje preentrenado ya «leyó» millones de textos: usted lo descarga y lo aplica a sus propias frases, como contratar a un lector experto en lugar de enseñarle a leer desde cero.",
    paraQue:
      "Sirve para analizar texto: medir el sentimiento de una frase, convertirla en números (embeddings) o generar texto nuevo.",
    enEsteProyecto:
      "En el notebook 07 se usan BERT multilingüe para el sentimiento de la solicitud, y GPT-2 en español y sentence-transformers para convertir los textos en números. Se procesan solo los 4.454 textos distintos y el resultado se guarda en caché (una copia lista para reutilizar). El mejor modelo solo con texto es el más simple, TF-IDF con regresión logística (ROC-AUC 0,641 en test).",
    capitulo: 7,
  },
  {
    id: "pyspark",
    termino: "PySpark",
    alias: ["pyspark", "sparksession"],
    categoria: "python",
    corto: "La forma de usar Apache Spark desde Python: el mismo análisis de tablas, repartido entre muchos procesadores o máquinas.",
    queEs:
      "PySpark es la puerta de Python hacia Spark, un sistema que divide un trabajo grande entre muchos trabajadores que avanzan en paralelo, como repartir la corrección de mil exámenes entre diez profesores. Se escribe de forma parecida a pandas (filter, select, groupBy), pero cada operación se ejecuta de manera distribuida.",
    paraQue:
      "Sirve cuando los datos ya no caben o tardan demasiado en una sola máquina: el mismo código pasa de un portátil a un clúster (un grupo de computadoras que trabajan juntas).",
    enEsteProyecto:
      "El notebook 09 corre Spark 4.2.0 dentro de Docker: lee el CSV con un esquema explícito, reproduce la limpieza y las variables del paquete, guarda Parquet particionado por propósito y entrena con MLlib. Su ROC-AUC (0,8441) es casi igual al de scikit-learn (0,8459), y puntúa las 12.000 solicitudes en 1,9 s.",
    capitulo: 9,
  },
  {
    id: "fastapi",
    termino: "FastAPI",
    alias: ["fastapi", "uvicorn", "testclient"],
    categoria: "python",
    corto: "Librería de Python para crear APIs web: convierte la función de predicción en un servicio que otros programas consultan.",
    queEs:
      "FastAPI publica funciones de Python como direcciones web. Es como abrir una ventanilla de atención: otro programa llega a la ventanilla /predict con los datos de un cliente y recibe la respuesta en JSON (texto con pares nombre: valor). Uvicorn es el servidor que mantiene esa ventanilla abierta.",
    paraQue:
      "Sirve para que cualquier sistema (una aplicación, un sitio web, otro servicio) use el modelo sin abrir un notebook.",
    enEsteProyecto:
      "La API del proyecto (versión 2.0.0) tiene los endpoints, es decir, las direcciones, /health, /model/info, /predict, /predict/batch y /predict/text. En el notebook 00, /predict responde para el cliente de riesgo medio una probabilidad de impago de 0,3315, banda Medio y decisión «revisar».",
    capitulo: 10,
  },
  {
    id: "pydantic",
    termino: "Pydantic",
    alias: ["pydantic", "basemodel"],
    categoria: "python",
    corto: "Librería que valida datos: revisa que cada campo exista, tenga el tipo correcto y esté en un rango permitido antes de usarlo.",
    queEs:
      "Pydantic es el portero de la API: antes de dejar pasar una solicitud, revisa que traiga todos los campos y que cada uno tenga sentido. Si la edad llega como 150 o el puntaje de buró como 2.000, la detiene y explica qué está mal. Las reglas se escriben una sola vez en una clase, por ejemplo ClienteRequest.",
    paraQue:
      "Evita que datos imposibles o mal escritos lleguen al modelo y produzcan predicciones sin sentido.",
    enEsteProyecto:
      "En la API, ClienteRequest exige, por ejemplo, una edad entre 18 y 100, un puntaje de buró entre 150 y 950 y un uso del cupo entre 0 y 1. Si una solicitud no cumple, la API responde con el código 422 (datos no válidos) y un mensaje que señala el campo con error.",
    capitulo: 10,
  },

  /* ------------------------------------------------------------------ */
  /* Datos y preparación                                                */
  /* ------------------------------------------------------------------ */
  {
    id: "dataframe",
    termino: "DataFrame",
    alias: ["dataframe", "dataframes", "df", "pd.dataframe"],
    categoria: "datos",
    corto: "Tabla de datos de pandas: filas (registros) y columnas (variables) con nombre, como una hoja de cálculo dentro de Python.",
    queEs:
      "Un DataFrame es la forma en que pandas guarda una tabla. Cada fila es un registro, aquí un cliente, y cada columna es una característica, como la edad o el ingreso. Se parece a una hoja de cálculo, pero se maneja con código, lo que permite repetir exactamente los mismos pasos cuando llegan datos nuevos. Por costumbre se guarda en una variable llamada df.",
    paraQue:
      "Es la estructura central del análisis: sobre ella se filtra, se agrupa, se calculan columnas nuevas y se preparan los datos del modelo.",
    enEsteProyecto:
      "El DataFrame crudo tiene 12.144 filas y 21 columnas (df.shape). Después de limpiar y dividir, train queda con 9.600 filas y test con 2.400, ambos con 27 columnas, porque se suman las 6 variables nuevas.",
    capitulo: 1,
  },
  {
    id: "fila_columna",
    termino: "Fila y columna",
    alias: ["fila", "filas", "columna", "columnas", "shape"],
    categoria: "datos",
    corto: "En una tabla, cada fila es un caso (aquí, una solicitud de crédito) y cada columna es una característica medida en todos los casos.",
    queEs:
      "Piense en una lista de clase: cada fila es un estudiante y cada columna es un dato sobre él, como el nombre o la nota. En ciencia de datos se dice que cada fila es una observación y cada columna, una variable. El tamaño de una tabla se escribe (filas, columnas).",
    paraQue:
      "Saber qué representa una fila define la unidad de análisis: sobre qué se predice y qué se cuenta.",
    enEsteProyecto:
      "Una fila es un cliente o solicitud, descrito por 21 columnas: 20 de información (identificador, edad, ingreso, puntaje de buró, texto de la solicitud…) y la columna objetivo, default. El archivo crudo trae 12.144 filas, pero 12.000 clientes únicos: las otras 144 son copias exactas.",
    capitulo: 1,
  },
  {
    id: "csv",
    termino: "CSV",
    alias: ["csv", ".csv", "read_csv", "to_csv"],
    categoria: "datos",
    corto: "Archivo de texto con una tabla: cada línea es una fila y los valores van separados por comas. Lo abren Excel y pandas.",
    queEs:
      "CSV significa «valores separados por comas» (comma-separated values). Es el formato de tabla más simple: un archivo de texto donde cada línea es una fila y las comas separan las columnas. Casi cualquier programa lo lee, por eso es ideal para compartir datos.",
    paraQue:
      "Sirve para guardar y mover tablas entre programas sin depender de un software en particular.",
    enEsteProyecto:
      "El dato de registro es db/credit_risk.csv, con 12.144 filas y 21 columnas. El notebook 03 escribe los conjuntos preparados db/processed/train.csv y test.csv, limpios y sin escalar, y registra la huella SHA-256 de cada uno.",
    capitulo: 1,
  },
  {
    id: "parquet",
    termino: "Parquet",
    alias: ["parquet", "to_parquet", "read_parquet"],
    categoria: "datos",
    corto: "Formato de archivo para tablas grandes que guarda los datos por columnas y comprimidos; se lee mucho más rápido que un CSV.",
    queEs:
      "Parquet guarda la tabla por columnas en vez de por filas, y comprimida. Es como un archivador donde cada cajón contiene una sola columna: si usted solo necesita la edad, abre ese cajón y no toca los demás. Además, se puede dividir en carpetas según el valor de una columna (particiones), para leer solo la parte que interesa.",
    paraQue:
      "Sirve para almacenar muchos datos en menos espacio y leer rápido solo las columnas o las particiones necesarias, algo clave en big data.",
    enEsteProyecto:
      "El notebook 07 guarda en nlp_features.parquet los resultados de los modelos de texto, para no recalcularlos. El notebook 09 escribe las solicitudes en Parquet particionado por propósito (6 carpetas, una por propósito) y las predicciones particionadas por decisión.",
    capitulo: 7,
  },
  {
    id: "tipo_dato",
    termino: "Tipo de dato",
    alias: ["tipo de dato", "dtype", "dtypes", "int64", "float64", "object", "select_dtypes", "astype"],
    categoria: "datos",
    corto: "Clase de valor que guarda una columna: número entero (int64), número con decimales (float64) o texto (object).",
    queEs:
      "Cada columna tiene un tipo de dato que le dice a la computadora cómo tratar sus valores: int64 para enteros, como la edad; float64 para números con decimales, como el ingreso; object, por lo general, para texto, como el estado civil. Es como separar frascos por contenido: los textos no se suman y los números no se ordenan alfabéticamente.",
    paraQue:
      "Un tipo equivocado produce errores silenciosos, como un número leído como texto que no se puede promediar. Revisarlo es uno de los primeros pasos de la exploración.",
    enEsteProyecto:
      "df.info() en el notebook 02 muestra 7 columnas float64, 6 int64 y 8 object. En la limpieza, las columnas enteras que un valor faltante había convertido en float64 (edad, plazo_meses y puntaje_buro) vuelven a ser enteras después de imputar.",
    capitulo: 2,
  },
  {
    id: "variable_objetivo",
    termino: "Variable objetivo (default)",
    alias: ["default", "variable objetivo", "target"],
    categoria: "datos",
    corto: "La columna que el modelo aprende a predecir. Aquí es default: 1 si el cliente no pagó (impago) y 0 si pagó.",
    queEs:
      "La variable objetivo es la respuesta que se quiere anticipar; las demás columnas son pistas para llegar a ella. Es como la nota final en un historial de estudiantes: con las notas parciales se intenta adivinarla. En inglés se le dice target.",
    paraQue:
      "Define el problema: qué se predice, cómo se mide el acierto y qué decisión se toma con la predicción.",
    enEsteProyecto:
      "La objetivo es default, con 4.327 impagos (1) y 7.817 pagos (0) en el archivo crudo, es decir, 35,6 % de impago. El modelo no entrega solo 0 o 1: entrega la probabilidad de impago, que luego se traduce en aprobar, revisar o rechazar.",
    capitulo: 1,
  },
  {
    id: "variable_numerica",
    termino: "Variable numérica",
    alias: ["variable numérica", "variables numéricas", "numérica", "numéricas"],
    categoria: "datos",
    corto: "Variable cuyos valores son números con sentido de cantidad, como el ingreso, la edad o el número de moras.",
    queEs:
      "Una variable numérica mide una cantidad: se puede sumar, promediar y comparar con «mayor que» o «menor que». Puede ser continua, si admite decimales (el ingreso), o de conteo, si solo toma enteros (las moras de los últimos 12 meses).",
    paraQue:
      "Su tipo decide cómo se explora y se prepara: se resume con media, mediana y desviación, se grafica con histogramas y boxplots y se escala antes del modelo.",
    enEsteProyecto:
      "El modelo usa 16 variables numéricas: 12 originales (edad, ingreso, monto, plazo, tasa, puntaje de buró, uso del cupo, entre otras) y 4 nuevas (cuota_estimada, ratio_cuota_ingreso, ratio_monto_ingreso y tiene_moras_previas). Antes de entrar al modelo, los extremos de las monetarias se recortan y todas se estandarizan.",
    capitulo: 1,
  },
  {
    id: "variable_categorica",
    termino: "Variable categórica",
    alias: ["variable categórica", "variables categóricas", "categórica", "categóricas", "nominal", "nominales"],
    categoria: "datos",
    corto: "Variable cuyos valores son categorías o etiquetas, no cantidades: por ejemplo, el estado civil o el propósito del crédito.",
    queEs:
      "Una variable categórica clasifica en grupos. Si las categorías no tienen orden, como el estado civil (Soltero, Casado…), se llama nominal; si lo tienen, como el nivel educativo (de Primaria a Posgrado), se llama ordinal. Los modelos solo entienden números, así que las categorías se convierten antes de entrenar.",
    paraQue:
      "Permite comparar grupos, como la tasa de impago por situación laboral, y elegir la codificación adecuada para el modelo.",
    enEsteProyecto:
      "El modelo usa 4 categóricas nominales, codificadas con One-Hot (estado_civil, situacion_laboral, tipo_vivienda y proposito), y 2 ordinales, codificadas en orden (nivel_educativo y rango_edad). La que más separa es la situación laboral: 62,1 % de impago en desempleados frente a 23,9 % en pensionados.",
    capitulo: 1,
  },
  {
    id: "nulo",
    termino: "Valor nulo (faltante)",
    alias: ["nulo", "nulos", "nan", "isna", "faltante", "faltantes", "valores faltantes"],
    categoria: "datos",
    corto: "Casilla vacía: el dato no se registró. pandas la muestra como NaN y hay que decidir cómo tratarla antes de modelar.",
    queEs:
      "Un valor nulo o faltante es un hueco en la tabla: el cliente no informó su ingreso o el sistema no lo guardó. pandas lo marca como NaN («not a number», no es un número). Es como un formulario con casillas en blanco: no se puede ignorar, porque muchos cálculos y modelos fallan o se desvían con huecos.",
    paraQue:
      "Contarlos y ver dónde están permite decidir si se elimina la columna, se elimina la fila o se rellena el hueco (imputación).",
    enEsteProyecto:
      "El archivo crudo tiene nulos en 7 columnas, 4.088 celdas en total (1,60 %). La que más tiene es antiguedad_laboral_anios, con 9,21 %; ninguna se acerca al umbral del 40 %, así que no se elimina ninguna columna: todas se imputan con valores aprendidos en train.",
    capitulo: 2,
  },
  {
    id: "duplicado",
    termino: "Registro duplicado",
    alias: ["duplicado", "duplicados", "duplicated", "drop_duplicates"],
    categoria: "datos",
    corto: "Fila repetida: el mismo registro aparece más de una vez. Si no se elimina, ese caso pesa doble en el análisis.",
    queEs:
      "Un registro duplicado es una copia de otra fila. Es como contar dos veces a la misma persona en un censo: infla los números y hace que su caso pese más de lo debido. Puede ser una copia exacta (todas las columnas iguales) o un identificador repetido.",
    paraQue:
      "Eliminarlos evita estadísticas infladas y, sobre todo, que la misma persona quede a la vez en entrenamiento y en prueba.",
    enEsteProyecto:
      "El crudo traía 144 filas duplicadas exactas (1,19 %), que eran justamente los 144 identificadores repetidos. Al quitarlas quedan 12.000 clientes únicos, y el notebook 03 comprueba que ningún cliente está a la vez en train y en test.",
    capitulo: 2,
  },
  {
    id: "atipico",
    termino: "Valor atípico",
    alias: ["atípico", "atípicos", "valor atípico", "valores atípicos", "outlier", "outliers"],
    categoria: "datos",
    corto: "Valor muy alejado del resto. Puede ser un error de digitación o un caso real extremo; hay que detectarlo y decidir qué hacer.",
    queEs:
      "Un valor atípico es un dato que «se sale del montón», como una persona de 2,30 m en una foto de grupo. A veces es un error, como un ingreso con un cero de más o una edad de 999 años; otras veces es real, como un cliente con muchas moras. Los atípicos pueden distorsionar promedios, gráficos y algunos modelos.",
    paraQue:
      "Detectarlos con una regla clara (IQR o z-score) permite separar errores de casos reales y tratarlos sin perder información.",
    enEsteProyecto:
      "El crudo tiene 25 edades imposibles (1, 2, 120, 150 y 999 años) y montos con errores de digitación de hasta 1.033.300.000 COP. Las edades imposibles pasan a nulo y se imputan, y los extremos de las variables monetarias se recortan con capping p1–p99. No se elimina ninguna fila: borrar las filas con atípicos habría costado el 23,8 % de train.",
    capitulo: 2,
  },
  {
    id: "groupby",
    termino: "Agrupar y agregar (groupby)",
    alias: ["groupby", "groupby().agg", "agg", "group_by", "summarise", "pivot_table"],
    categoria: "datos",
    corto: "Separar la tabla en grupos según una columna y calcular un resumen por grupo, como la tasa de impago por situación laboral.",
    queEs:
      "Agrupar y agregar es como ordenar las facturas por mes y luego sumar cada montón. groupby(\"situacion_laboral\") forma un grupo por cada categoría, y agg() calcula lo que usted pida en cada uno: cuántos clientes hay, el promedio o la mediana. En SQL es GROUP BY y en dplyr, group_by con summarise.",
    paraQue:
      "Es la herramienta básica para comparar segmentos y encontrar dónde se concentra el riesgo.",
    enEsteProyecto:
      "Con groupby se obtiene, por ejemplo, la tasa de impago por situación laboral: 62 % en desempleados frente a 24 % en pensionados. En el notebook 02 esa misma agrupación se repite con SQL en DuckDB y da el mismo resultado.",
    capitulo: 1,
  },
  {
    id: "filtrado",
    termino: "Filtrar, seleccionar y ordenar",
    alias: ["filtrar", "filtrado", "query", "filter", "loc", "iloc", "sort_values", "arrange", "ordenamiento"],
    categoria: "datos",
    corto: "Operaciones básicas con tablas: filtrar elige filas que cumplen una condición, seleccionar elige columnas y ordenar las pone en secuencia.",
    queEs:
      "Son los tres movimientos más comunes con una tabla. Filtrar es como usar un colador: quedan solo las filas que cumplen la condición, por ejemplo «al menos una mora». Seleccionar es quedarse con algunas columnas. Ordenar es poner las filas de mayor a menor, o al revés, según una columna.",
    paraQue:
      "Permiten enfocar la pregunta: mirar un segmento, quitar columnas que no interesan y ver primero los casos más extremos.",
    enEsteProyecto:
      "En el notebook 02, filtrar a los clientes con al menos una mora deja 4.074 clientes con 59,7 % de impago, frente al 35,6 % general, y la consulta puntaje_buro < 600 y uso_cupo_tarjetas > 0,7 deja 1.177 clientes con 87,7 % de impago. Ordenar por monto muestra los 5 créditos más altos, candidatos a error de digitación.",
    capitulo: 2,
  },
  {
    id: "imputacion",
    termino: "Imputación",
    alias: ["imputación", "imputar", "imputer", "simpleimputer", "fillna", "aprender_imputacion"],
    categoria: "datos",
    corto: "Rellenar los valores faltantes con un valor razonable, como la mediana, aprendido solo con los datos de entrenamiento.",
    queEs:
      "Imputar es completar los huecos de la tabla con un valor sensato en lugar de borrar la fila. Es como completar una encuesta con la respuesta más típica cuando alguien dejó una pregunta en blanco. El valor de relleno se calcula con los datos de entrenamiento y luego se aplica igual a los de prueba.",
    paraQue:
      "Conserva a todos los clientes, porque borrar filas con huecos tiraría información útil, y deja la tabla lista para el modelo, que no acepta huecos.",
    enEsteProyecto:
      "La imputación se aprende solo en train: mediana para las numéricas (por ejemplo, ingreso 2.234.000 COP, puntaje de buró 715 y edad 49), la categoría «Desconocido» para situacion_laboral y tipo_vivienda, y «Sin texto» para el texto de la solicitud. Se imputaron 8 columnas, y train y test quedaron con 0 nulos.",
    capitulo: 3,
  },
  {
    id: "one_hot",
    termino: "One-Hot Encoding",
    alias: ["onehotencoder", "one-hot", "one hot", "get_dummies"],
    categoria: "datos",
    corto: "Convierte una categoría sin orden en varias columnas de 0 y 1, una por cada categoría posible.",
    queEs:
      "Los modelos solo entienden números, pero no se puede decir Soltero = 1 y Casado = 2, porque eso inventaría un orden. One-Hot crea una columna por categoría y marca con 1 la que corresponde y con 0 las demás. Es como una planilla con una casilla por opción: en cada fila hay exactamente una marcada.",
    paraQue:
      "Permite usar variables nominales (sin orden) en cualquier modelo sin inventarles un orden.",
    enEsteProyecto:
      "One-Hot se aplica a estado_civil, situacion_laboral, tipo_vivienda y proposito: 4 variables se convierten en 20 columnas de 0 y 1. Se ajusta solo con train y usa handle_unknown=\"ignore\", para que la API no falle si llega una categoría nueva.",
    capitulo: 3,
  },
  {
    id: "ordinal",
    termino: "Codificación ordinal",
    alias: ["ordinalencoder", "codificación ordinal", "ordinal", "ordinales"],
    categoria: "datos",
    corto: "Convierte categorías con orden natural en números que respetan ese orden: Primaria = 0, Secundaria = 1… Posgrado = 4.",
    queEs:
      "Cuando las categorías tienen un orden lógico, cada una se reemplaza por su posición en la escala. Es como los peldaños de una escalera: Primaria es el peldaño 0 y Posgrado el 4. El orden se fija a mano, porque en orden alfabético «Posgrado» quedaría antes que «Primaria».",
    paraQue:
      "Conserva la información del orden en una sola columna, en lugar de repartirla en muchas como hace One-Hot.",
    enEsteProyecto:
      "Se usa en nivel_educativo (Primaria = 0 … Posgrado = 4) y en rango_edad (18-25 = 0 … >60 = 4). La exploración respalda esta elección: el impago baja de 44,1 % en primaria a 26,7 % en posgrado, un gradiente ordenado.",
    capitulo: 3,
  },
  {
    id: "escalado",
    termino: "Normalización y estandarización",
    alias: ["standardscaler", "minmaxscaler", "estandarización", "estandarizar", "normalización", "escalado"],
    categoria: "datos",
    corto: "Llevar las variables numéricas a una escala común. Normalizar las lleva a [0, 1]; estandarizar las deja con media 0 y desviación 1.",
    queEs:
      "El ingreso se mide en millones y el uso del cupo va de 0 a 1; sin ajuste, el ingreso parecería más importante solo por su tamaño. Escalar es como convertir precios de distintas monedas a una sola. La normalización (MinMaxScaler) lleva cada variable al rango de 0 a 1; la estandarización (StandardScaler) le resta la media y la divide por la desviación estándar.",
    paraQue:
      "Algunos modelos, como la regresión logística regularizada (con un freno que evita pesos exagerados), las redes neuronales y el PCA, necesitan variables en escalas comparables.",
    enEsteProyecto:
      "Se comparan las dos técnicas y se elige StandardScaler: con MinMaxScaler el ingreso quedaba aplastado cerca de 0 (media 0,036) por sus valores extremos. El escalador se ajusta en train y solo se aplica a test, que por eso no queda con media exactamente 0.",
    capitulo: 3,
  },
  {
    id: "ingenieria_variables",
    termino: "Ingeniería de variables",
    alias: ["ingeniería de variables", "feature engineering", "variables derivadas", "variables nuevas", "crear_variables"],
    categoria: "datos",
    corto: "Crear variables nuevas a partir de las existentes para darle al modelo información más útil, como la relación entre cuota e ingreso.",
    queEs:
      "La ingeniería de variables combina o transforma columnas para expresar mejor una idea de negocio. El monto y el ingreso por separado dicen poco, pero el cociente monto/ingreso dice cuánto pesa el crédito para esa persona. Es como el médico que, en vez de mirar peso y estatura por separado, calcula el índice de masa corporal.",
    paraQue:
      "Bien hechas, las variables nuevas capturan relaciones que el modelo no vería solo y además son fáciles de explicar.",
    enEsteProyecto:
      "Se crean seis: cuota_estimada (cuota mensual), ratio_cuota_ingreso (capacidad de pago), ratio_monto_ingreso (endeudamiento relativo), rango_edad, tiene_moras_previas y longitud_texto, esta última solo para la exploración. La que más separa es tiene_moras_previas: 23,3 % de impago sin moras frente a 59,6 % con moras.",
    capitulo: 3,
  },
  {
    id: "pca",
    termino: "PCA (componentes principales)",
    alias: ["pca", "componentes principales", "componente principal", "pc1", "pc2", "scree plot", "explained_variance_ratio_"],
    categoria: "datos",
    corto: "Técnica que resume muchas variables en unas pocas «componentes» que conservan la mayor parte de la variación de los datos.",
    queEs:
      "El PCA (análisis de componentes principales) busca las direcciones en las que los datos más varían y las ordena de mayor a menor. Es como fotografiar un objeto desde el ángulo que mejor muestra su forma: con una sola imagen plana se ve casi todo. La primera componente (PC1) recoge la mayor variación posible, la segunda (PC2) la siguiente, y así sucesivamente.",
    paraQue:
      "Sirve para ver en un plano de dos dimensiones datos que tienen muchas columnas y para comprimir variables cuando hay demasiadas.",
    comoSeLee:
      "1. En el scree plot, cada barra es la varianza que explica una componente y la línea es el acumulado: busque cuántas componentes hacen falta para llegar al 90 % o al 95 %. 2. En la proyección 2D, cada punto es un cliente ubicado según su valor en PC1 (eje horizontal) y en PC2 (eje vertical). 3. Si los colores de pagó e impago forman nubes separadas a lo largo de un eje, esa componente distingue las clases. 4. Revise los loadings (pesos) para saber qué variables forman cada componente.",
    enEsteProyecto:
      "En la nube PCA del sitio, hecha con la matriz completa del modelo, PC1 explica el 20,2 % de la varianza y PC2 el 14,9 %; en el notebook 04, con las 16 variables numéricas, 25,4 % y 18,2 %. Allí PC2 resume el comportamiento crediticio (buró, moras y uso del cupo) y es la que separa a los impagos. El PCA se usa para visualizar: el modelo conserva las variables originales, más fáciles de explicar.",
    capitulo: 3,
  },
  {
    id: "fuga_datos",
    termino: "Fuga de información (data leakage)",
    alias: ["fuga de información", "data leakage", "leakage", "fuga"],
    categoria: "datos",
    corto: "Usar sin querer información de los datos de prueba (o del futuro) al preparar o entrenar el modelo. Hace que los resultados luzcan mejores de lo real.",
    queEs:
      "La fuga de información ocurre cuando el modelo «ve» algo que no tendría en la vida real, como un estudiante que conoce las preguntas antes del examen: saca buena nota, pero no aprendió. Un caso típico es calcular la mediana para imputar con todos los datos, test incluido, antes de dividirlos.",
    paraQue:
      "Evitarla mantiene honesta la evaluación: el desempeño medido en test es el que se puede esperar con clientes nuevos.",
    enEsteProyecto:
      "El orden del notebook 03 la evita: primero las reglas fijas (duplicados, rangos válidos), después la división train/test y solo entonces todo lo que aprende de los datos (medianas, codificadores, escaladores, límites de atípicos), ajustado solo en train. Además, test se usa una única vez, en la evaluación final.",
    capitulo: 3,
  },
  {
    id: "train_test",
    termino: "Conjuntos de entrenamiento y prueba (train / test)",
    alias: ["train_test_split", "train", "test"],
    categoria: "datos",
    corto: "Dividir los datos en dos: train, para que el modelo aprenda, y test, que se guarda aparte para medir cómo predice casos nuevos.",
    queEs:
      "Es como estudiar con un cuestionario y luego presentar un examen con preguntas que nunca vio. El conjunto de entrenamiento (train) es el material de estudio; el de prueba (test) es el examen. Si el modelo acierta en test, se puede confiar en que generaliza, es decir, que funciona con clientes que no conoce.",
    paraQue:
      "Permite medir el desempeño real del modelo y detectar si memorizó los datos en lugar de aprender patrones.",
    enEsteProyecto:
      "Los 12.000 clientes únicos se dividen 80/20, de forma estratificada y con random_state=42: 9.600 en train y 2.400 en test, con 35,56 % y 35,58 % de impago. Test se usa una única vez, en la evaluación final, y la huella SHA-256 de cada archivo garantiza que siempre es la misma partición.",
    capitulo: 3,
  },
  {
    id: "estratificar",
    termino: "Estratificación",
    alias: ["stratify", "estratificar", "estratificación", "estratificada", "estratificado"],
    categoria: "datos",
    corto: "Dividir los datos de modo que cada parte conserve la proporción de cada clase; aquí, la misma tasa de impago en train y test.",
    queEs:
      "Estratificar es repartir manteniendo las proporciones. Si una bolsa tiene 64 % de caramelos rojos y 36 % azules, una porción estratificada conserva ese 64/36. Sin estratificar, por puro azar una parte podría quedar con más impagos que la otra.",
    paraQue:
      "Hace que train y test sean comparables y que las métricas no cambien solo por la suerte del reparto. También se usa en la validación cruzada.",
    enEsteProyecto:
      "La división usa stratify sobre default: train queda con 35,56 % de impago y test con 35,58 %, frente al 35,57 % del total limpio. La validación cruzada de los modelos también es estratificada, con 5 grupos.",
    capitulo: 3,
  },
  {
    id: "capping",
    termino: "Capping (winsorización)",
    alias: ["winsorizer", "capping", "clip", "winsorización", "winsorizing"],
    categoria: "datos",
    corto: "Recortar los valores extremos a un tope: lo que supera el percentil 99 se baja a ese valor y lo que queda bajo el percentil 1 se sube.",
    queEs:
      "El capping o winsorización no borra los datos extremos: los «aplana» hasta un tope. Es como un limitador de volumen: los sonidos normales pasan igual y solo los que exceden el máximo se bajan. Los topes se aprenden en train, normalmente con los percentiles 1 y 99, y luego se aplican igual a cualquier dato.",
    paraQue:
      "Reduce la influencia de errores de digitación y casos extremos sin perder ninguna fila, algo importante porque la API también recibirá clientes así.",
    enEsteProyecto:
      "Winsorizer, una clase del paquete, aprende los percentiles 1 y 99 en train y recorta 7 variables, entre ellas el ingreso, el monto y los dos ratios. En train recorta cerca del 2 % de las filas por variable monetaria: el ingreso máximo pasa de 64,5 a 7,8 millones y su asimetría (qué tan larga es la cola de valores altos) cae de 10,81 a 1,44, sin eliminar ningún cliente.",
    capitulo: 3,
  },

  /* ------------------------------------------------------------------ */
  /* Estadística y gráficos                                             */
  /* ------------------------------------------------------------------ */
  {
    id: "media",
    termino: "Media (promedio)",
    alias: ["media", "promedio", "mean", "avg"],
    categoria: "estadistica",
    corto: "Suma de todos los valores dividida por cuántos son. Es el centro de gravedad de los datos, pero los valores extremos la arrastran.",
    queEs:
      "La media o promedio reparte el total en partes iguales. Si cinco amigos tienen 2, 2, 3, 3 y 40 dulces, la media es 10, aunque nadie tenga 10. Por eso se dice que es sensible a los extremos: un solo valor muy grande la empuja hacia arriba.",
    paraQue:
      "Resume una variable con un solo número y es la base de otros cálculos, como la desviación estándar. Además, la media de una columna de 0 y 1 es la proporción de unos.",
    enEsteProyecto:
      "En el ingreso (hasta el percentil 99), la media es 2,51 millones de COP y la mediana 2,23: la media queda arriba por la cola de ingresos altos. Y como default vale 0 o 1, su media es la tasa de impago: 35,6 %.",
    capitulo: 2,
  },
  {
    id: "mediana",
    termino: "Mediana",
    alias: ["mediana", "medianas", "median"],
    categoria: "estadistica",
    corto: "El valor del medio cuando los datos se ordenan de menor a mayor: la mitad queda por debajo y la otra mitad por encima.",
    queEs:
      "Si se forma a un grupo de personas en fila por estatura, la mediana es la estatura de quien queda justo en la mitad. A diferencia de la media, los extremos no la arrastran: con los dulces 2, 2, 3, 3 y 40, la mediana es 3. Por eso describe mejor lo típico cuando hay valores muy altos.",
    paraQue:
      "Es el resumen preferido para variables asimétricas, como el ingreso, y un valor seguro para rellenar faltantes.",
    enEsteProyecto:
      "La mediana del ingreso es 2.237.000 COP, mientras que el máximo llega a 64.540.000 por errores de digitación. Por eso las numéricas se imputan con la mediana de train, y los boxplots comparan medianas: puntaje de buró de 756 en quienes pagaron frente a 628 en quienes no.",
    capitulo: 2,
  },
  {
    id: "percentil",
    termino: "Percentil y cuartil",
    alias: ["percentil", "percentiles", "cuartil", "cuartiles", "decil", "deciles", "quintil", "quintiles", "quantile", "quantile_cont", "qcut", "p99"],
    categoria: "estadistica",
    corto: "Valor por debajo del cual queda un porcentaje dado de los datos. El percentil 25 deja al 25 % por debajo; los cuartiles parten en cuatro.",
    queEs:
      "Los percentiles ordenan los datos y los cortan en porciones de igual tamaño. Estar en el percentil 90 es como decir «estoy en el 10 % más alto de la clase». Los cuartiles son los percentiles 25, 50 y 75 (el 50 es la mediana); los deciles cortan en 10 grupos y los quintiles en 5.",
    paraQue:
      "Sirven para describir una distribución sin que la arrastren los extremos, fijar topes para atípicos y formar grupos del mismo tamaño.",
    comoSeLee:
      "1. Imagine los valores ordenados de menor a mayor. 2. El percentil p es el valor que deja al p % de los casos por debajo: si el percentil 25 del ingreso es 1.529.500 COP, una cuarta parte de los clientes gana menos que eso. 3. Compare percentiles entre grupos: si los del grupo A son más altos, ese grupo tiende a tener valores mayores. 4. En una tabla por deciles, cada fila tiene el mismo número de clientes: mire cómo cambia la tasa de impago del primero al último.",
    enEsteProyecto:
      "El capping usa los percentiles 1 y 99 aprendidos en train. Por deciles del puntaje de buró, el impago cae de 87,6 % en el decil más bajo (150 a 558 puntos) a 3,0 % en el más alto (854 a 950).",
    capitulo: 2,
  },
  {
    id: "iqr",
    termino: "Rango intercuartílico (IQR)",
    alias: ["iqr", "rango intercuartílico", "1,5·iqr", "1,5 × iqr"],
    categoria: "estadistica",
    corto: "Distancia entre el cuartil 3 y el cuartil 1: el ancho del 50 % central de los datos. Con él se definen los atípicos (regla 1,5·IQR).",
    queEs:
      "El rango intercuartílico mide qué tan dispersa está la mitad central de los datos, dejando fuera el 25 % más bajo y el 25 % más alto. Es la caja del boxplot. La regla de Tukey marca como atípico todo lo que quede a más de 1,5 veces el IQR por debajo del cuartil 1 o por encima del cuartil 3.",
    paraQue:
      "Sirve para medir dispersión sin que la afecten los extremos y para detectar atípicos con una regla simple y robusta.",
    comoSeLee:
      "1. Ubique Q1 (percentil 25) y Q3 (percentil 75). 2. Calcule IQR = Q3 − Q1. 3. El límite inferior es Q1 − 1,5·IQR y el superior, Q3 + 1,5·IQR. 4. Todo valor fuera de esos límites se marca como atípico; en un boxplot son los puntos más allá de los bigotes. 5. Si una variable tiene muchos atípicos, suele tener una cola larga natural y no necesariamente errores.",
    enEsteProyecto:
      "En el notebook 04, la regla 1,5·IQR marca como atípicos el 11,7 % de los valores de ratio_monto_ingreso y el 9,8 % de monto_credito, mucho más que el z-score (1,8 % y 1,7 %), porque esas variables tienen una cola larga natural. Por eso los extremos se recortan en lugar de borrar filas.",
    capitulo: 2,
  },
  {
    id: "desviacion",
    termino: "Desviación estándar",
    alias: ["desviación estándar", "desviación típica", "desviación", "std"],
    categoria: "estadistica",
    corto: "Medida de cuánto se alejan, en promedio, los valores de su media. Pequeña: datos agrupados; grande: datos muy dispersos.",
    queEs:
      "La desviación estándar dice qué tan lejos de la media suelen estar los datos. Dos cursos pueden tener la misma nota promedio, 3,5: en uno casi todos sacan entre 3,3 y 3,7 (desviación pequeña) y en el otro hay notas de 1 y de 5 (desviación grande). Se expresa en las mismas unidades que la variable.",
    paraQue:
      "Mide la dispersión, es la base del z-score y de la estandarización y ayuda a ver si un valor es común o raro.",
    enEsteProyecto:
      "StandardScaler usa la media y la desviación estándar de train para dejar cada variable con media 0 y desviación 1. Al imputar con la mediana, la desviación de las columnas imputadas baja entre 0,1 % y 4,2 %, un efecto pequeño y esperado.",
    capitulo: 2,
  },
  {
    id: "zscore",
    termino: "z-score",
    alias: ["z-score", "zscore", "puntuación z", "|z|"],
    categoria: "estadistica",
    corto: "Cuántas desviaciones estándar se aleja un valor de la media. Con |z| > 3 se considera atípico.",
    queEs:
      "El z-score traduce cualquier valor a una escala común: z = (valor − media) / desviación estándar. Un z de 0 está justo en la media; un z de 2 está dos desviaciones por encima. Es como medir lo alto que es alguien «en unidades de diferencia típica», una vara que sirve igual para estaturas, ingresos o puntajes.",
    paraQue:
      "Sirve para detectar atípicos y para comparar variables con unidades distintas; estandarizar una variable es justamente pasarla a z-scores.",
    comoSeLee:
      "1. Calcule z = (valor − media) / desviación estándar. 2. El signo indica el lado: positivo, por encima de la media; negativo, por debajo. 3. El tamaño indica qué tan raro es: |z| menor que 2 es común; |z| mayor que 3 es muy raro y se marca como atípico. 4. La media y la desviación se dejan arrastrar por los extremos, así que en variables muy asimétricas el z-score marca menos atípicos que la regla IQR.",
    enEsteProyecto:
      "El notebook 04 detecta atípicos con dos reglas: IQR (1,5·IQR) y z-score (|z| > 3). En relacion_deuda_ingreso el z-score no marca ninguno, mientras que IQR marca el 7,3 %: son los valores acumulados en el tope de 1,5.",
    capitulo: 4,
  },
  {
    id: "histograma",
    termino: "Histograma",
    alias: ["histograma", "histogramas", "histogram", "np.histogram", "hist"],
    categoria: "estadistica",
    corto: "Gráfico de barras que cuenta cuántos datos caen en cada intervalo de valores: muestra la forma de la distribución de una variable.",
    queEs:
      "Un histograma divide el rango de una variable en intervalos iguales, como «de 18 a 20 años» y «de 20 a 22», y levanta una barra con la cantidad de casos de cada uno. Es como clasificar monedas por tamaño en vasos y ver qué vaso se llena más. Muestra dónde se concentran los datos, si hay colas largas y si hay valores raros.",
    paraQue:
      "Es la primera mirada a una variable numérica: revela asimetrías, topes, picos y errores antes de modelar.",
    comoSeLee:
      "1. El eje horizontal muestra los valores de la variable, partidos en intervalos. 2. El eje vertical muestra cuántos clientes (o qué densidad) hay en cada intervalo. 3. Busque el pico: ahí está lo más común. 4. Mire las colas: si la derecha es mucho más larga, la variable es asimétrica y la media quedará por encima de la mediana. 5. Si hay dos histogramas superpuestos, uno por clase, compare dónde queda el pico de cada uno.",
    enEsteProyecto:
      "La edad válida se reparte casi pareja entre 18 y 80 años, mientras que el ingreso y el monto tienen una cola larga a la derecha (asimetría de 1,19 y 2,56, aun sin el 1 % más alto). Por clase, el puntaje de buró de los impagos se desplaza hacia valores bajos: mediana de 628 frente a 756.",
    capitulo: 2,
  },
  {
    id: "boxplot",
    termino: "Diagrama de caja (boxplot)",
    alias: ["boxplot", "boxplots", "diagrama de caja", "diagramas de caja", "sns.boxplot", "bxp", "bigotes"],
    categoria: "estadistica",
    corto: "Gráfico que resume una variable con una caja (del cuartil 1 al 3), una línea en la mediana y bigotes hasta los datos no atípicos.",
    queEs:
      "El diagrama de caja es un resumen visual de cinco números. La caja abarca el 50 % central de los datos (del cuartil 1 al 3), la línea interior es la mediana y los «bigotes» llegan hasta el último dato que no es atípico; los puntos sueltos más allá son atípicos. Poner varias cajas lado a lado permite comparar grupos de un vistazo.",
    paraQue:
      "Sirve para comparar la distribución de una variable entre grupos, por ejemplo entre quienes pagaron y quienes no, y para ver atípicos.",
    comoSeLee:
      "1. Ubique la línea dentro de la caja: es la mediana. 2. Mire la altura de la caja: es el IQR; una caja más alta indica más dispersión. 3. Los bigotes llegan hasta 1,5·IQR desde la caja (regla de Tukey); los puntos fuera de ellos son atípicos. 4. Compare cajas: si las medianas difieren y las cajas casi no se solapan, la variable distingue bien a los grupos; si se solapan mucho, distingue poco.",
    enEsteProyecto:
      "En el notebook 02, las medianas por clase del puntaje de buró (756 frente a 628), del uso del cupo (0,36 frente a 0,62) y de la relación deuda/ingreso (0,47 frente a 0,70) difieren con claridad y sus cajas se solapan poco. En el notebook 04, los boxplots antes y después del capping muestran que solo se mueven las colas.",
    capitulo: 2,
  },
  {
    id: "dispersion",
    termino: "Gráfico de dispersión",
    alias: ["gráfico de dispersión", "diagrama de dispersión", "diagramas de dispersión", "scatter", "pairplot"],
    categoria: "estadistica",
    corto: "Gráfico de puntos donde cada punto es un caso ubicado según dos variables, una por eje. Muestra si esas variables se relacionan.",
    queEs:
      "En un gráfico de dispersión cada cliente es un punto: su posición horizontal la da una variable y la vertical, otra. Es como ubicar ciudades en un mapa por longitud y latitud. Si los puntos forman una franja que sube, las variables crecen juntas; si forman una nube redonda, no se relacionan. Colorear por clase muestra si los grupos ocupan zonas distintas.",
    paraQue:
      "Sirve para ver la relación entre dos variables, detectar grupos y encontrar zonas donde se concentra el riesgo.",
    comoSeLee:
      "1. Lea qué variable va en cada eje. 2. Mire la forma general: una franja que sube indica relación positiva; una que baja, negativa; una nube sin forma, ninguna. 3. Si hay colores por clase, busque zonas donde predomine un color. 4. Con muchos datos los puntos se tapan; por eso se usa una muestra y puntos semitransparentes.",
    enEsteProyecto:
      "Con una muestra de 3.000 clientes, el ingreso y el monto suben juntos (Pearson 0,397), pero los impagos no forman una zona aparte. En cambio, en el plano buró frente a uso del cupo, los impagos se acumulan donde el buró es bajo y el uso es alto: con buró < 600 y cupo > 0,7 el impago es del 89,0 %, frente a 30,2 % en el resto.",
    capitulo: 2,
  },
  {
    id: "heatmap",
    termino: "Mapa de calor (heatmap)",
    alias: ["heatmap", "mapa de calor", "mapas de calor", "sns.heatmap"],
    categoria: "estadistica",
    corto: "Tabla de colores: cada casilla pinta un número con un color más intenso cuanto mayor es su valor, para leerla de un vistazo.",
    queEs:
      "Un mapa de calor es una tabla en la que los números se reemplazan, o se acompañan, por colores. Es como un mapa del clima: las zonas rojas son calientes y las azules, frías. Ayuda a detectar patrones en tablas grandes que, solo con números, costaría ver.",
    paraQue:
      "Se usa para matrices de correlación, para ver dónde faltan datos y para cruzar dos o tres variables con la tasa de impago.",
    comoSeLee:
      "1. Lea qué representa cada fila y cada columna. 2. Busque la escala de colores (la barra lateral) para saber qué valor indica cada color. 3. En una matriz de correlación, un color fuerte de un extremo indica relación positiva, el del otro extremo relación negativa y el color neutro, ninguna. 4. Localice las casillas más intensas: son los cruces que más destacan.",
    enEsteProyecto:
      "El proyecto usa, entre otros, el mapa de nulos (notebook 03), la matriz de correlaciones de Spearman y el cruce de situación laboral, moras previas y banda de buró (notebook 04). En este último, un desempleado con moras y buró < 600 tiene 90,3 % de impago, y un empleado sin moras y buró > 800, 4,8 %.",
    capitulo: 3,
  },
  {
    id: "correlacion",
    termino: "Correlación (Pearson y Spearman)",
    alias: ["correlación", "correlaciones", "pearson", "spearman", "corr", "corrwith"],
    categoria: "estadistica",
    corto: "Número entre −1 y 1 que mide qué tanto se mueven juntas dos variables. Pearson mide relación lineal; Spearman, relación ordenada.",
    queEs:
      "La correlación dice si, cuando una variable sube, la otra tiende a subir (positiva), a bajar (negativa) o a hacer cualquier cosa (cercana a 0). Pearson mide qué tan bien siguen los puntos una línea recta. Spearman compara los puestos (rangos) en lugar de los valores, así que capta relaciones que siempre suben o siempre bajan aunque no sean rectas, y los extremos le afectan menos.",
    paraQue:
      "Sirve para encontrar las variables más asociadas con el impago y para detectar variables que repiten la misma información.",
    comoSeLee:
      "1. Mire el signo: positivo, suben juntas; negativo, una sube cuando la otra baja. 2. Mire el tamaño: cerca de 0, poca relación; cerca de 1 o −1, mucha. 3. Compare Pearson con Spearman: si difieren mucho, hay extremos o una relación curva. 4. Correlación no es causa: dos variables pueden moverse juntas sin que una provoque la otra. 5. Una correlación cercana a 0 no descarta relaciones en forma de U.",
    enEsteProyecto:
      "Con Spearman, las variables más asociadas al impago son el puntaje de buró (−0,53), el uso del cupo (0,50), las moras de los últimos 12 meses (0,39) y la relación deuda/ingreso (0,34). En monto_credito, Pearson da 0,034 y Spearman −0,006: unos pocos valores extremos fabrican la relación lineal.",
    capitulo: 2,
  },
  {
    id: "cramer",
    termino: "V de Cramér",
    alias: ["v de cramér", "cramér", "cramer", "v_cramer"],
    categoria: "estadistica",
    corto: "Medida de 0 a 1 de qué tan asociadas están dos variables categóricas: 0 es ninguna asociación y 1, asociación total.",
    queEs:
      "La V de Cramér es como una correlación para categorías. Compara la tabla de conteos real con la que se esperaría si las variables no tuvieran nada que ver (la prueba chi-cuadrado) y lo resume en un número de 0 a 1. Responde preguntas como: ¿la situación laboral está ligada al impago, o el impago se reparte igual en todos los grupos?",
    paraQue:
      "Sirve para ordenar las variables categóricas según su relación con el objetivo, como se hace con la correlación en las numéricas.",
    comoSeLee:
      "1. 0 significa que no hay asociación; 1, asociación total. 2. En datos de crédito, valores de 0,1 a 0,3 ya indican una relación apreciable. 3. Mire también el valor p (la probabilidad de ver una asociación así solo por azar): si es menor que 0,05, la asociación difícilmente es casualidad. 4. Compare entre variables para ordenarlas.",
    enEsteProyecto:
      "La asociación más fuerte es la de tiene_moras_previas (V = 0,359), seguida de situacion_laboral (0,171) y nivel_educativo (0,108). Sexo y estado civil tienen V = 0: dejar el sexo fuera del modelo no cuesta información.",
    capitulo: 4,
  },
  {
    id: "informacion_mutua",
    termino: "Información mutua",
    alias: ["información mutua", "mutual_info_classif", "info_mutua"],
    categoria: "estadistica",
    corto: "Cuánta información aporta una variable para adivinar otra. Capta cualquier forma de relación, no solo las líneas rectas.",
    queEs:
      "La información mutua mide cuánto se reduce la incertidumbre sobre el impago al conocer una variable. Es como el juego de las 20 preguntas: una buena pregunta descarta muchas opciones de golpe. Vale 0 si la variable no ayuda nada y crece cuanto más ayuda, sea la relación recta, curva o en forma de U.",
    paraQue:
      "Sirve para seleccionar variables relevantes y complementa a la correlación, que solo ve relaciones lineales o que siempre suben o bajan.",
    comoSeLee:
      "1. Un valor de 0 indica que la variable no dice nada del objetivo. 2. Cuanto mayor, más información aporta; no tiene un máximo fijo de 1, así que se usa para ordenar variables más que para leerla sola. 3. Compárela con la correlación: si la información mutua es alta y la correlación baja, la relación probablemente es curva.",
    enEsteProyecto:
      "Es uno de los tres criterios de selección del notebook 03, junto con Spearman y la importancia en un bosque de árboles, y se usa de nuevo en el ranking del notebook 04. Ambos análisis ubican arriba al puntaje de buró, el uso del cupo, las moras y la relación deuda/ingreso.",
    capitulo: 3,
  },
  {
    id: "prevalencia",
    termino: "Prevalencia (tasa de impago)",
    alias: ["prevalencia", "tasa de impago", "tasa de default", "tasa_impago", "tasa_default"],
    categoria: "estadistica",
    corto: "Proporción de casos positivos en los datos; aquí, el porcentaje de clientes que no pagaron: 35,6 %.",
    queEs:
      "La prevalencia responde a la pregunta «¿qué tan común es lo que quiero predecir?». Se calcula como casos positivos sobre el total: si de 100 clientes 36 no pagan, la prevalencia del impago es 36 %. Es la línea de base: un segmento con una tasa mayor es más riesgoso que el promedio.",
    paraQue:
      "Sirve de referencia para comparar segmentos, para saber si las clases están desbalanceadas y para interpretar métricas como la precisión.",
    comoSeLee:
      "1. Divida los impagos entre el total de clientes. 2. Úsela como línea de referencia: en los gráficos de tasa de impago por categoría, la línea punteada es la prevalencia global. 3. Un segmento por encima de esa línea es más riesgoso que el promedio, y uno por debajo, menos. 4. Si la prevalencia está lejos del 50 %, conviene estratificar y usar métricas que no se dejen engañar por la clase mayoritaria.",
    enEsteProyecto:
      "La tasa de impago es 35,6 % (4.327 de 12.144 en el archivo crudo), un desbalance moderado que justifica estratificar la división: 35,56 % en train y 35,58 % en test. El contrato de datos exige que esté entre 5 % y 40 %.",
    capitulo: 1,
  },
  {
    id: "intervalo_confianza",
    termino: "Intervalo de confianza (IC 95 %)",
    alias: ["intervalo de confianza", "intervalos de confianza", "ic 95 %", "ic95", "di_ic95"],
    categoria: "estadistica",
    corto: "Rango de valores plausibles para una cifra calculada con datos. Un IC 95 % contiene el valor real en 95 de cada 100 repeticiones.",
    queEs:
      "Toda cifra calculada con una muestra tiene algo de azar: con otros clientes habría salido un poco distinta. El intervalo de confianza da un rango en lugar de un solo número, como el pronóstico «entre 18 y 22 grados» en vez de «20 grados». Un IC 95 % se construye de modo que, si se repitiera el estudio muchas veces, 95 de cada 100 intervalos contendrían el valor real.",
    paraQue:
      "Muestra cuánta precisión tiene una cifra y permite decidir si una diferencia es real o podría deberse al azar.",
    comoSeLee:
      "1. Lea la cifra central y los dos extremos. 2. Un intervalo estrecho indica una cifra precisa; uno ancho, más incertidumbre. 3. Para una diferencia, mire si el intervalo incluye el 0: si lo incluye, la diferencia real podría ser cero. 4. Para un umbral, mire de qué lado queda el intervalo; por ejemplo, si un índice de equidad y su intervalo superan 0,8.",
    enEsteProyecto:
      "Al sumar el texto al modelo tabular, el ROC-AUC sube +0,0012 con IC 95 % [−0,0003; +0,0028]: el intervalo incluye el 0, así que la decisión usa el modelo tabular. En equidad, el disparate impact por sexo en test (la razón entre las tasas de aprobación de los dos grupos) es 0,970, con IC 95 % [0,868; 0,997].",
    capitulo: 7,
  },
  {
    id: "bootstrap",
    termino: "Bootstrap",
    alias: ["bootstrap", "remuestreo", "n_boot", "bootstrap_reps"],
    categoria: "estadistica",
    corto: "Técnica que repite un cálculo cientos de veces sobre muestras sorteadas con reemplazo de los mismos datos, para medir su variación.",
    queEs:
      "El bootstrap simula «qué habría pasado con otros clientes» usando solo los datos disponibles. Se sortea una muestra del mismo tamaño con reemplazo (un cliente puede salir dos veces y otro ninguna), se recalcula la cifra y se repite cientos de veces. Es como sacar papeletas de una bolsa y devolverlas antes de la siguiente extracción. La variación de los resultados muestra qué tan estable es la cifra.",
    paraQue:
      "Sirve para construir intervalos de confianza de casi cualquier cifra, incluso de las que no tienen una fórmula sencilla, como un ROC-AUC o un índice de equidad.",
    enEsteProyecto:
      "El intervalo del disparate impact (equidad) usa 500 repeticiones de bootstrap, y el de la mejora en ROC-AUC del modelo con texto usa 1.000 repeticiones pareadas, es decir, sobre las mismas filas para los dos modelos comparados. Ambos usan la semilla 42.",
    capitulo: 7,
  },

  /* ------------------------------------------------------------------ */
  /* Gestión del proyecto                                               */
  /* ------------------------------------------------------------------ */
  {
    id: "scrum",
    termino: "Scrum",
    alias: ["scrum", "sprint", "sprints", "backlog", "retrospectiva"],
    categoria: "proyecto",
    corto: "Marco de trabajo ágil: las tareas viven en un backlog y se avanza en ciclos cortos (sprints), revisando y mejorando al final de cada uno.",
    queEs:
      "Scrum organiza un proyecto en ciclos cortos llamados sprints, cada uno con un objetivo claro. Todo lo pendiente vive en una lista priorizada, el backlog. Al cerrar cada sprint se revisa lo logrado y se hace una retrospectiva: qué salió bien, qué no y qué cambiar. Es como entrenar por temporadas cortas y ajustar el plan después de cada partido.",
    paraQue:
      "Permite entregar resultados pronto, detectar problemas a tiempo y ajustar el plan con evidencia en lugar de seguir un plan rígido.",
    enEsteProyecto:
      "El proyecto se gestionó con Scrum: 37 historias de usuario agrupadas en 10 épicas (grandes bloques de trabajo) y 8 sprints, con backlog.yaml como fuente única. Los estados no se marcan a mano: un script los calcula a partir de la evidencia y el tablero del capítulo 0 los muestra.",
    capitulo: 0,
  },
  {
    id: "crisp_dm",
    termino: "CRISP-DM",
    alias: ["crisp-dm", "crisp dm", "business understanding", "data understanding", "data preparation"],
    categoria: "proyecto",
    corto: "Metodología estándar para proyectos de datos en seis fases: negocio, datos, preparación, modelado, evaluación y despliegue.",
    queEs:
      "CRISP-DM (Cross-Industry Standard Process for Data Mining) es el mapa de ruta clásico de un proyecto analítico. Sus fases son: entender el negocio, entender los datos, prepararlos, modelar, evaluar y desplegar. No es una línea recta: a menudo se vuelve a una fase anterior al descubrir algo nuevo, como quien ajusta una receta después de probarla.",
    paraQue:
      "Ordena el análisis para no saltarse pasos clave, como definir el problema antes de modelar o evaluar antes de poner un modelo en uso.",
    enEsteProyecto:
      "El proyecto agrupa las fases en cinco: F1 definir el problema, F2 explorar y preparar los datos, F3 analizar y modelar, F4 evaluar y optimizar, y F5 desplegar y comunicar. Scrum organiza el trabajo y CRISP-DM organiza el análisis; cada capítulo indica su fase.",
    capitulo: 0,
  },
  {
    id: "historia_usuario",
    termino: "Historia de usuario",
    alias: ["historia de usuario", "historias de usuario", "historia", "historias"],
    categoria: "proyecto",
    corto: "Necesidad escrita desde quien la usa: «Como [rol], quiero [algo], para [beneficio]», con criterios de aceptación comprobables.",
    queEs:
      "Una historia de usuario describe una pieza de trabajo en lenguaje sencillo y desde el punto de vista de quien la necesita, con la plantilla «Como [rol], quiero [algo], para [beneficio]». Se acompaña de criterios de aceptación con la forma «dado… cuando… entonces…», que dicen exactamente cómo comprobar que quedó lista. Es como un pedido de restaurante que incluye cómo debe llegar el plato.",
    paraQue:
      "Mantiene el foco en el valor para quien usará el resultado y hace que «terminado» signifique algo comprobable, no una opinión.",
    enEsteProyecto:
      "Cada capítulo corresponde a una o más historias, identificadas como HU-00, HU-01, etc. Por ejemplo, HU-02 dice: «Como científico de datos, quiero explorar el dataset con el entorno, las librerías y operaciones básicas, para entender su estructura y calidad antes de prepararlo».",
    capitulo: 0,
  },
  {
    id: "dod",
    termino: "Definición de hecho (DoD)",
    alias: ["dod", "definición de hecho", "definition of done", "verificar_dod"],
    categoria: "proyecto",
    corto: "Lista de condiciones que todo trabajo debe cumplir para considerarse terminado. En el proyecto, un script la verifica.",
    queEs:
      "La definición de hecho (DoD, por Definition of Done) es el control de calidad común del equipo: una lista de requisitos que cualquier entrega debe cumplir antes de llamarse «hecha». Es como la lista de chequeo de un piloto antes de despegar: no basta con sentir que todo está bien, hay que comprobar cada punto.",
    paraQue:
      "Evita que algo se declare terminado sin estarlo y hace que todos entiendan lo mismo por «hecho».",
    enEsteProyecto:
      "El script verificar_dod.py revisa cada uno de los 10 notebooks: que se haya ejecutado sin errores, que use el kernel credit-risk, que importe el paquete, que no tenga rutas de la máquina, que interprete sus figuras y que tenga conclusiones. La última verificación registró 0 fallos.",
    capitulo: 0,
  },
  {
    id: "trazabilidad",
    termino: "Trazabilidad",
    alias: ["trazabilidad", "trazabilidad.md", "47/47"],
    categoria: "proyecto",
    corto: "Seguir el hilo entre cada requisito del enunciado, la historia que lo cubre y la evidencia que lo demuestra. Aquí: 47/47.",
    queEs:
      "La trazabilidad es como el número de guía de un envío: permite seguir cada requisito desde que se pide hasta donde se cumple. Para cada punto del enunciado se sabe qué historia de usuario lo atiende y en qué archivo está la prueba. Si falta un eslabón, se nota de inmediato.",
    paraQue:
      "Demuestra con evidencia, y no solo con palabras, que se cubrió todo lo pedido.",
    comoSeLee:
      "1. El primer número son los ítems acreditados y el segundo, el total del checklist. 2. Un ítem se acredita solo si su historia está en Hecho y su evidencia existe. 3. 47/47 significa que todos los ítems tienen historia y evidencia.",
    enEsteProyecto:
      "La trazabilidad se calcula, no se declara: el script generar_evidencia.py cruza backlog.yaml con los archivos de evidencia. El resultado es 47 de 47 ítems del checklist acreditados y los 55 IDs del enunciado cubiertos.",
    capitulo: 0,
  },
  {
    id: "sha256",
    termino: "SHA-256 (huella digital)",
    alias: ["sha-256", "sha256", "hash", "hash_archivo", "huella digital"],
    categoria: "proyecto",
    corto: "Huella digital de un archivo: un código de 64 caracteres que cambia por completo si se altera un solo dato del archivo.",
    queEs:
      "SHA-256 es una función que lee un archivo y produce un código de 64 caracteres, su huella digital. Si se cambia una sola coma del archivo, el código sale totalmente distinto. Es como el sello de cera de una carta antigua: si llega intacto, nadie la abrió.",
    paraQue:
      "Sirve para comprobar que un archivo es exactamente el mismo que se usó antes, sin compararlo línea por línea.",
    enEsteProyecto:
      "El notebook 03 sella train.csv y test.csv con SHA-256 (sus huellas empiezan por 1ce71f5f… y 8c1cb6a3…), y la model card guarda esas mismas huellas: así se demuestra que el modelo se entrenó y evaluó con esa partición exacta. El manifiesto del sitio también guarda la huella de cada archivo publicado.",
    capitulo: 3,
  },
];

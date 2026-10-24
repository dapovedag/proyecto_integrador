/**
 * Metadatos REALES de los 12 capítulos (paso 0 a 11).
 * Fuentes: docs/01_enunciado.md (IDs, actividades, entregables), docs/02_plan_paso_a_paso.md (fase, tareas,
 * criterio de hecho), docs/gestion/lecciones_aprendidas.md ("Aprendizaje por unidad" y lecciones L1–L10) y
 * src/data/generated/gestion.json (HU, sprint y estado, calculados — no se escriben a mano).
 * El paso 12 del plan (lanzar en local) se integra en el capítulo 11.
 */
import gestion from "@/data/generated/gestion.json";
import { CAPITULOS } from "@/capitulos/mapa";
import type { EstadoHistoria, Gestion, Historia } from "@/data/tipos";

export type ModuloId = "M1" | "M2" | "T";
export type EstadoPaso = "hecho" | "en-curso" | "pendiente";

export interface UnidadRef {
  modulo: ModuloId;
  unidad: number | null;
  nombre: string;
}

export interface Aprendizaje {
  conceptual: string;
  practico: string;
  evidencia: string;
}

export interface PasoMeta {
  n: number;
  ruta: string;
  titulo: string;
  tituloCorto: string;
  /** Una frase editorial: la pregunta que responde el capítulo. */
  pregunta: string;
  resumen: string;
  modulo: ModuloId;
  /** Unidad principal (para el rail) y unidades que acredita. */
  unidad: UnidadRef;
  unidades: UnidadRef[];
  fase: string;
  crisp: string;
  ids: string[];
  actividades: { id?: string; texto: string }[];
  entregable: { id?: string; texto: string }[];
  artefactos: string[];
  criterio: string;
  aprendizaje: Aprendizaje;
  lecciones: string[];
  notebook: string | null;
  especial?: "Tablero" | "DataExplorer" | "RunTerminal" | "SparkJob" | "ApiConsole" | "Integrador";
  figurasClave: string[];
  /** Referencias "clave" o "NN:clave" de public/run/figuras.json (desde src/capitulos/mapa.ts). */
  /** Derivados de gestion.json */
  hu: string[];
  sprints: string[];
  estado: EstadoPaso;
  puntos: number;
}

export const MODULOS: Record<ModuloId, { id: ModuloId; nombre: string; corto: string; color: string; descripcion: string }> = {
  M1: {
    id: "M1",
    nombre: "Programación para el análisis de datos",
    corto: "Programación",
    color: "var(--mod1)",
    descripcion: "Aporta las bases de programación, exploración, limpieza y preparación de datos para construir el modelo predictivo.",
  },
  M2: {
    id: "M2",
    nombre: "Inteligencia artificial aplicada al análisis de datos",
    corto: "Inteligencia artificial",
    color: "var(--mod2)",
    descripcion: "Aporta técnicas avanzadas de análisis, modelado y despliegue del modelo predictivo.",
  },
  T: {
    id: "T",
    nombre: "Transversal",
    corto: "Transversal",
    color: "var(--trans)",
    descripcion: "Gestión ágil, integración de los módulos y comunicación de resultados.",
  },
};

export const UNIDADES = {
  M1U1: { modulo: "M1", unidad: 1, nombre: "Exploración y análisis preliminar de datos" },
  M1U2: { modulo: "M1", unidad: 2, nombre: "Limpieza, estructuración y preparación de datos" },
  M2U1: { modulo: "M2", unidad: 1, nombre: "Análisis ético y exploratorio del problema de riesgo de crédito" },
  M2U2: { modulo: "M2", unidad: 2, nombre: "Manipulación, transformación y visualización de datos" },
  M2U3: { modulo: "M2", unidad: 3, nombre: "Modelado avanzado, NLP y despliegue en producción" },
  GEST: { modulo: "T", unidad: null, nombre: "Gestión ágil del proyecto" },
  INTEG: { modulo: "T", unidad: null, nombre: "Integración y comunicación" },
} as const satisfies Record<string, UnidadRef>;

export const FASES: Record<string, { nombre: string; crisp: string }> = {
  F1: { nombre: "Definir el problema", crisp: "Business Understanding" },
  F2: { nombre: "Explorar y preparar los datos", crisp: "Data Understanding + Data Preparation" },
  F3: { nombre: "Analizar y modelar", crisp: "Modeling" },
  F4: { nombre: "Evaluar y optimizar", crisp: "Evaluation" },
  F5: { nombre: "Desplegar y comunicar", crisp: "Deployment" },
  T: { nombre: "Transversal", crisp: "Scrum + CRISP-DM" },
};

/** Lecciones del MVP y su control en v2 (docs/gestion/lecciones_aprendidas.md). */
export const LECCIONES: Record<string, { titulo: string; paso: string; control: string }> = {
  L1: {
    titulo: "No afirmar sin evidencia.",
    paso: "Las conclusiones de nb06 y nb07 afirmaban redes y BERT entrenados que no existían; el checklist estaba en 0/47 mientras el README decía «Hecho».",
    control: "Ningún estado se marca a mano: una historia solo se acredita si está en Hecho y su evidencia existe. Las conclusiones se redactan después de ver las salidas.",
  },
  L2: {
    titulo: "Los artefactos se desfasan si hay más de una fuente.",
    paso: "train.py v1.1.0 nunca se reentrenó y la API servía la v1.0.0. Había 4 umbrales distintos.",
    control: "Fuente única (ADR-001): solo train.py escribe el modelo; nb08 lee las predicciones guardadas; una sola versión.",
  },
  L3: {
    titulo: "La lógica duplicada diverge.",
    paso: "Cada notebook copiaba la limpieza y las variables, y features.py no coincidía con nb03.",
    control: "Toda la lógica vive en el paquete credit_risk; los notebooks solo la llaman.",
  },
  L4: {
    titulo: "Sin presupuesto de tiempo, el trabajo pesado se come el plazo.",
    paso: "La CV de HGB, el nb05 (más de 5 min) y el reentrenamiento superaron el tiempo disponible.",
    control: "Cada historia tiene presupuesto y archivos disjuntos; la ejecución pesada va por una cola en serie con modo FAST.",
  },
  L5: {
    titulo: "Las cifras escritas a mano mienten en silencio.",
    paso: "El front mostraba métricas copiadas a mano, sin gráficos reales.",
    control: "Todas las cifras salen de exportar_front.py sobre la corrida real; el manifest guarda versión y SHA-256.",
  },
  L6: {
    titulo: "Que el front dependa del back lo hace frágil.",
    paso: "El front llamaba a /api o a 127.0.0.1:8000; sin back no había demo.",
    control: "Front estático y autónomo con motor exacto en TS verificado con golden (ADR-004).",
  },
  L7: {
    titulo: "Usar test para decidir sesga lo que se publica.",
    paso: "El modelo y el umbral se eligieron con test, y la mitigación de equidad se ensayó sobre test.",
    control: "Selección, calibración, umbrales y variante de equidad con CV/OOF en train. Test se usa una sola vez.",
  },
  L8: {
    titulo: "Lo que no se ejecutó no está probado.",
    paso: "Docker nunca se levantó; pytest no imprimió resultados; el README no servía desde un clon limpio.",
    control: "Gate local check.py; docker compose up --build en la DoD de API; prueba desde un clon limpio.",
  },
  L9: {
    titulo: "Las dependencias pesadas se prueban primero.",
    paso: "TensorFlow, BERT/GPT y PySpark faltaban al llegar al paso.",
    control: "Prueba de entorno con evidencia (ADR-005, ADR-006, ADR-008) antes de comprometer nb06, nb07 y nb09.",
  },
  L10: {
    titulo: "La equidad medida y no mitigada es un pendiente, no un cumplimiento.",
    paso: "DI por edad 0,74 en lo servido.",
    control: "Selección por costo sujeta a DI ≥ 0,8, o una excepción razonada (ADR-003).",
  },
};

const APR_M1U1: Aprendizaje = {
  conceptual:
    "Un dataset se entiende antes de modelarlo: tipos, cardinalidad, faltantes, prevalencia del impago y rangos plausibles. Las operaciones de filtrado, selección, orden y agregación son las mismas en pandas y en SQL. Cada tipo de gráfico responde una pregunta distinta: distribución (histograma), relación (dispersión) y dispersión con atípicos (boxplot).",
  practico:
    "Entorno reproducible: venv, kernel credit-risk y celda IN_COLAB para Colab. pandas, NumPy, Matplotlib y Seaborn; consultas DuckDB sobre el CSV de registro (ADR-007); al menos 3 histogramas, 2 dispersiones y 3 boxplots interpretados.",
  evidencia: "Back/notebooks/02_exploracion_preliminar.ipynb (HU-02, HU-33); docs/03_contrato_datos.md.",
};
const APR_M1U2: Aprendizaje = {
  conceptual:
    "Fuga de información: todo lo que se ajusta (imputación, winsorizer, escalado, codificación) se ajusta solo con train. Ordinal frente a one-hot según la variable tenga orden o no. El contrato de datos y el hash hacen reproducible la partición.",
  practico:
    "credit_risk.data (validar_dataset, limpiar, dividir, hash_dataset) y credit_risk.features (6 variables derivadas, ordinal, winsorizer p1–p99, build_preprocessor()); división estratificada; db/processed con SHA-256.",
  evidencia: "Back/notebooks/03_limpieza_preparacion.ipynb, Back/src/credit_risk/features.py, Back/tests/test_features.py (HU-03).",
};
const APR_M2U1: Aprendizaje = {
  conceptual:
    "Un modelo de crédito decide sobre personas. Hay que fijar las variables sensibles (sexo, edad) y medir sobre la decisión (aprobación automática), no sobre el score. Las métricas de equidad tienen límites: la regla 4/5 es una heurística de la EEOC, no una norma colombiana. La Ley 1581 de 2012 regula los datos personales. El costo de un error depende de su tipo (LGD frente a margen).",
  practico:
    "Formulación con métricas de negocio; tabla de variables sensibles reutilizada en el paso 8; DI con IC bootstrap, igualdad de oportunidades y calibración por grupo (credit_risk.fairness); variantes sin_edad y reweighing.",
  evidencia:
    "Back/notebooks/01_definicion_problema_etica.ipynb (HU-01), Back/notebooks/04_eda_transformacion_visualizacion.ipynb (HU-04), Back/notebooks/08_evaluacion_optimizacion.ipynb (HU-08, HU-20), ADR-003.",
};
const APR_M2U2: Aprendizaje = {
  conceptual:
    "Los verbos de manipulación (filter, select, mutate, group_by/summarise, arrange) son independientes del lenguaje. La gramática de gráficos (datos + estética + geometría + facetas) es la misma en ggplot2 y en plotnine. El PCA resume varianza, pero no garantiza separar clases. Un atípico se trata con una regla ajustada en train y documentada antes y después.",
  practico:
    "dplyr con equivalentes en pandas encadenado (query, assign, groupby().agg(), sort_values, pipe) y una tabla de equivalencias. ggplot2 con plotnine (al menos 3 gráficos). Correlaciones, PCA con varianza explicada y proyección 2D, winsorizer y ranking de variables relevantes.",
  evidencia: "Back/notebooks/04_eda_transformacion_visualizacion.ipynb (HU-04, HU-35, HU-33).",
};
const APR_M2U3: Aprendizaje = {
  conceptual:
    "Comparar modelos con el mismo protocolo (CV en train) y preferir el más simple cuando la diferencia es despreciable (parsimonia). Las redes (CNN 1D, GRU) no siempre superan a los clásicos en datos tabulares. Un modelo de texto puede capturar el ruido del generador (ΔAUC con IC). Una probabilidad solo sirve para decidir si está calibrada, y la decisión sale de costos (regla de Chow). Desplegar es contrato (API), empaquetado (Docker) y monitoreo (PSI). Spark distribuye el mismo análisis.",
  practico:
    "Dummy, LR, árbol, RF y HGB (nb05); MLP, CNN 1D y GRU con TensorFlow 2.20 (nb06); TF-IDF, sentimiento con BERT y embeddings frente a GPT-2 (nb07); calibración, costos, equidad, SHAP y PSI (nb08); PySpark en Docker con Parquet particionado y MLlib (nb09); FastAPI con decisión aprobar/revisar/rechazar en Docker.",
  evidencia:
    "nb05 (HU-05), nb06 (HU-06), nb07 (HU-07), nb08 (HU-08, HU-18, HU-19, HU-21), nb09 (HU-09), Back/api/ (HU-10, HU-22); ADR-001, ADR-002, ADR-005, ADR-006.",
};
const APR_T: Aprendizaje = {
  conceptual: "Scrum organiza el trabajo y CRISP-DM organiza el análisis. Una DoD solo sirve si es verificable, y la trazabilidad debe calcularse, no declararse.",
  practico: "backlog.yaml como fuente única, DoR/DoD multinivel, ADRs, registro de riesgos y generar_evidencia.py.",
  evidencia: "docs/gestion/ (HU-00, HU-15, HU-16, HU-30, HU-31).",
};
const APR_INTEG: Aprendizaje = {
  conceptual:
    "Integrar es que un solo notebook recorra F1 → F5 importando el paquete, sin copiar lógica; comunicar es que cada cifra tenga su fuente. Las cifras escritas a mano mienten en silencio y un front que depende del back es frágil (lecciones L5 y L6).",
  practico:
    "nb00 autocontenido con predecir_cliente() para 3 clientes (bajo, medio y alto) y la API en el mismo proceso; paquete de corrida exportado con manifest y SHA-256; front estático con motor exacto en TS verificado con golden.",
  evidencia: "Back/notebooks/00_proyecto_integrador_final.ipynb (HU-11), docs/06_informe_resultados.md (HU-29), Back/scripts/exportar_front.py (HU-23), Front/ (HU-24 a HU-28).",
};

type Base = Omit<PasoMeta, "hu" | "sprints" | "estado" | "puntos" | "ruta">;

const BASE: Base[] = [
  {
    n: 0,
    titulo: "Gestión ágil del proyecto",
    tituloCorto: "Gestión ágil",
    pregunta: "¿Cómo se demuestra, y no solo se declara, que el proyecto se gestionó con Scrum?",
    resumen:
      "Backlog único con épicas e historias INVEST, sprints con objetivo, DoR y DoD verificables por script, ADRs, retrospectivas y una trazabilidad 47/47 calculada.",
    modulo: "T",
    unidad: UNIDADES.GEST,
    unidades: [UNIDADES.GEST],
    fase: "T",
    crisp: "Scrum + CRISP-DM",
    ids: ["E1", "R3"],
    actividades: [
      { texto: "Mantener el backlog con historias de usuario (una o más por unidad) y sus criterios de aceptación." },
      { texto: "Planificar los sprints y registrar al cierre de cada uno lo hecho, lo pendiente y los impedimentos (retrospectiva corta)." },
      { texto: "Aplicar la definición de hecho a cada historia." },
    ],
    entregable: [
      { id: "E1", texto: "Aplicación de metodologías ágiles de gestión de proyectos." },
      { id: "R3", texto: "Aplicación de buenas prácticas de gestión de proyectos." },
    ],
    artefactos: ["docs/gestion/backlog.md", "docs/gestion/sprints.md", "docs/gestion/definicion_de_hecho.md"],
    criterio: "Los tres archivos existen; cada paso del plan corresponde a al menos una historia; cada sprint cerrado tiene su retrospectiva.",
    aprendizaje: APR_T,
    lecciones: ["L1", "L4"],
    notebook: null,
    especial: "Tablero",
    figurasClave: [],
  },
  {
    n: 1,
    titulo: "Definición del problema y análisis ético",
    tituloCorto: "Problema y ética",
    pregunta: "¿Qué decisión apoya el modelo, cuánto cuesta equivocarse y a quién puede afectar?",
    resumen:
      "Contexto de negocio, formulación como clasificación binaria con probabilidad y banda de riesgo, comparación de datasets, métricas de éxito y análisis ético de las variables sensibles.",
    modulo: "M2",
    unidad: UNIDADES.M2U1,
    unidades: [UNIDADES.M2U1],
    fase: "F1",
    crisp: "Business Understanding",
    ids: ["IA1.1", "IA1.3", "E5", "F1"],
    actividades: [
      { id: "IA1.1", texto: "Explorar datasets financieros y definir el problema de riesgo de crédito." },
      { id: "IA1.3", texto: "Análisis ético del problema: sesgos, variables sensibles e impacto en las personas." },
      { texto: "Contexto de negocio: quién usa el modelo, la decisión que apoya (aprobar, revisar o rechazar) y el costo de cada error." },
      { texto: "Métricas de éxito: ROC-AUC como principal; recall de impago, F1, KS y Brier como secundarias. Meta mínima AUC ≥ 0,70 en test." },
    ],
    entregable: [
      { id: "E5", texto: "Enfoque en la solución de un problema dentro de un contexto." },
      { id: "F1", texto: "Definir el problema." },
    ],
    artefactos: ["Back/notebooks/01_definicion_problema_etica.ipynb"],
    criterio:
      "El notebook tiene las secciones Contexto, Formulación, Datasets, Métricas, Ética y Conclusión; la tabla de variables sensibles está definida y se reutiliza en el paso 8.",
    aprendizaje: APR_M2U1,
    lecciones: ["L10"],
    notebook: "01",
    figurasClave: [],
  },
  {
    n: 2,
    titulo: "Exploración y análisis preliminar",
    tituloCorto: "Exploración",
    pregunta: "¿Qué hay en los 12.144 registros antes de tocar un solo modelo?",
    resumen: "Entorno reproducible, librerías, carga e inspección del CSV, operaciones básicas de análisis y las primeras visualizaciones interpretadas.",
    modulo: "M1",
    unidad: UNIDADES.M1U1,
    unidades: [UNIDADES.M1U1],
    fase: "F2",
    crisp: "Data Understanding",
    ids: ["P1.1", "P1.2", "P1.3", "P1.4", "P1.5", "P1.E1", "P1.E2", "P1.E3", "P1.E4", "E3"],
    actividades: [
      { id: "P1.1", texto: "Configurar el entorno en Google Colab o Jupyter Notebook." },
      { id: "P1.2", texto: "Importar las librerías Pandas, NumPy, Matplotlib y Seaborn." },
      { id: "P1.3", texto: "Cargar y explorar el conjunto de datos financieros." },
      { id: "P1.4", texto: "Aplicar operaciones básicas: filtrado, selección, ordenamiento y agregaciones." },
      { id: "P1.5", texto: "Generar las primeras visualizaciones (histogramas, diagramas de dispersión, boxplots)." },
    ],
    entregable: [
      { id: "P1.E1", texto: "Configuración del entorno y carga de librerías." },
      { id: "P1.E2", texto: "Inspección y exploración inicial de los datos." },
      { id: "P1.E3", texto: "Aplicación de operaciones básicas de análisis." },
      { id: "P1.E4", texto: "Visualizaciones exploratorias de las variables." },
    ],
    artefactos: ["Back/notebooks/02_exploracion_preliminar.ipynb"],
    criterio: "Las 5 secciones existen, con al menos 3 histogramas, 2 de dispersión y 3 boxplots; cada gráfico está interpretado.",
    aprendizaje: APR_M1U1,
    lecciones: ["L9"],
    notebook: "02",
    figurasClave: [],
  },
  {
    n: 3,
    titulo: "Limpieza, estructuración y preparación",
    tituloCorto: "Limpieza y preparación",
    pregunta: "¿Cómo se preparan los datos sin que el test se filtre en el entrenamiento?",
    resumen:
      "Faltantes y duplicados, variables derivadas, división estratificada antes de ajustar, codificación ordinal y one-hot, escalamiento, selección de características y PCA, todo en un pipeline del paquete.",
    modulo: "M1",
    unidad: UNIDADES.M1U2,
    unidades: [UNIDADES.M1U2],
    fase: "F2",
    crisp: "Data Preparation",
    ids: ["P2.1", "P2.2", "P2.3", "P2.4", "P2.5", "P2.6", "P2.E1", "P2.E2", "P2.E3", "P2.E4"],
    actividades: [
      { id: "P2.1", texto: "Identificar y manejar los valores faltantes y duplicados." },
      { id: "P2.2", texto: "Transformar las variables categóricas en numéricas (One-Hot Encoding o Label Encoding)." },
      { id: "P2.3", texto: "Aplicar normalización y estandarización." },
      { id: "P2.4", texto: "Generar nuevas variables relevantes." },
      { id: "P2.5", texto: "Aplicar reducción de dimensionalidad (si es necesario)." },
      { id: "P2.6", texto: "Dividir los datos en entrenamiento y prueba." },
    ],
    entregable: [
      { id: "P2.E1", texto: "Limpieza y preprocesamiento de datos." },
      { id: "P2.E2", texto: "Transformación y codificación de variables." },
      { id: "P2.E3", texto: "Selección de las características más relevantes." },
      { id: "P2.E4", texto: "División de los datos en entrenamiento y prueba." },
    ],
    artefactos: ["Back/notebooks/03_limpieza_preparacion.ipynb", "Back/src/credit_risk/data.py", "Back/src/credit_risk/features.py", "db/processed/"],
    criterio:
      "Ningún nulo ni duplicado en los datos procesados; el pipeline se ajusta solo con train; existen db/processed/train.csv, test.csv y feature_list.json; el notebook muestra las 4 partes del entregable P2.E1–E4.",
    aprendizaje: APR_M1U2,
    lecciones: ["L3"],
    notebook: "03",
    especial: "DataExplorer",
    figurasClave: [],
  },
  {
    n: 4,
    titulo: "EDA avanzado, transformación y visualización",
    tituloCorto: "EDA y transformación",
    pregunta: "¿Qué patrones separan a quien paga de quien no, y cuáles son solo ruido?",
    resumen:
      "EDA univariado, bivariado y multivariado; pandas y equivalentes de dplyr; Matplotlib, Seaborn y plotnine (ggplot2); correlaciones, atípicos con winsorizing, PCA y ranking de variables relevantes.",
    modulo: "M2",
    unidad: UNIDADES.M2U2,
    unidades: [UNIDADES.M2U1, UNIDADES.M2U2],
    fase: "F2",
    crisp: "Data Understanding + Data Preparation",
    ids: ["IA1.2", "IA1.E1", "IA1.E2", "IA2.1", "IA2.2", "IA2.3", "IA2.4", "IA2.5", "IA2.E1", "IA2.E2"],
    actividades: [
      { id: "IA1.2", texto: "Realizar el preprocesamiento y el análisis exploratorio de datos (EDA)." },
      { id: "IA2.1", texto: "Aplicar técnicas de manipulación y transformación de datos (Pandas y dplyr)." },
      { id: "IA2.2", texto: "Filtrado, selección y agregación en DataFrames." },
      { id: "IA2.3", texto: "Visualizar datos con Matplotlib, Seaborn y ggplot2." },
      { id: "IA2.4", texto: "Aplicar normalización, estandarización y reducción de dimensionalidad (PCA)." },
      { id: "IA2.5", texto: "Detectar y tratar los valores atípicos." },
    ],
    entregable: [
      { id: "IA1.E1", texto: "Análisis exploratorio del conjunto de datos." },
      { id: "IA1.E2", texto: "Identificación de las variables relevantes." },
      { id: "IA2.E1", texto: "Visualización de patrones y correlaciones relevantes." },
      { id: "IA2.E2", texto: "Optimización y preprocesamiento de variables." },
    ],
    artefactos: ["Back/notebooks/04_eda_transformacion_visualizacion.ipynb"],
    criterio:
      "El notebook contiene gráficos de Matplotlib, Seaborn y plotnine; el tratamiento de atípicos se documenta antes y después; el PCA tiene varianza explicada y una proyección en 2D; hay una tabla final de variables relevantes.",
    aprendizaje: APR_M2U2,
    lecciones: ["L3"],
    notebook: "04",
    especial: "DataExplorer",
    figurasClave: [],
  },
  {
    n: 5,
    titulo: "Modelos clásicos de Machine Learning",
    tituloCorto: "Modelos clásicos",
    pregunta: "¿Qué tanto mejora un modelo sobre adivinar, con el mismo protocolo para todos?",
    resumen:
      "Línea base, regresión logística, árbol, Random Forest y Gradient Boosting dentro de un pipeline, con CV estratificada de 5 folds en train, curvas ROC/PR, matrices de confusión e interpretabilidad.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3],
    fase: "F3",
    crisp: "Modeling",
    ids: ["IA3.3", "R1", "F3"],
    actividades: [
      { texto: "Entrenar DummyClassifier, LogisticRegression, árbol, RandomForest y Gradient Boosting, cada uno en un Pipeline(preprocesador + modelo)." },
      { texto: "Validación cruzada estratificada de 5 folds en train (ROC-AUC)." },
      { texto: "Evaluar con ROC-AUC, PR-AUC, accuracy, precision, recall, F1, KS y Brier; matriz de confusión; curvas ROC y PR superpuestas." },
      { texto: "Interpretabilidad: coeficientes de la regresión logística e importancia por permutación." },
    ],
    entregable: [
      { id: "IA3.3", texto: "Comparar los modelos clásicos con los de Deep Learning (lado clásico)." },
      { id: "R1", texto: "Modelo predictivo de riesgo de crédito funcional." },
    ],
    artefactos: ["Back/notebooks/05_modelos_clasicos.ipynb", "Back/src/credit_risk/models.py", "Back/models/resultados_clasicos.json"],
    criterio: "4 modelos más la línea base, evaluados con las mismas métricas; la tabla comparativa existe; el mejor modelo supera a la línea base y llega a AUC ≥ 0,70.",
    aprendizaje: APR_M2U3,
    lecciones: ["L4", "L7"],
    notebook: "05",
    figurasClave: [],
  },
  {
    n: 6,
    titulo: "Redes neuronales (CNN/RNN) en TensorFlow/Keras",
    tituloCorto: "Redes neuronales",
    pregunta: "¿Una red profunda le gana a la regresión logística en datos tabulares?",
    resumen: "MLP base, CNN 1D sobre el vector de características y GRU sobre el texto, con class_weight, EarlyStopping, curvas de aprendizaje y comparación con los clásicos.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3],
    fase: "F3",
    crisp: "Modeling",
    ids: ["IA3.2", "IA3.E2", "IA3.3"],
    actividades: [
      { id: "IA3.2", texto: "Implementar redes neuronales (CNN/RNN) en TensorFlow/Keras." },
      { texto: "MLP base (Dense + Dropout + BatchNormalization) como referencia." },
      { texto: "CNN 1D sobre el vector de características y RNN (GRU) sobre la columna de texto tokenizada." },
      { texto: "Entrenamiento con class_weight, EarlyStopping(restore_best_weights) y ModelCheckpoint; curvas de loss y AUC." },
      { id: "IA3.3", texto: "Comparar los modelos clásicos con los de Deep Learning (AUC, F1, recall, tiempo e interpretabilidad)." },
    ],
    entregable: [{ id: "IA3.E2", texto: "Entrenamiento y evaluación de una red neuronal (CNN/RNN)." }],
    artefactos: ["Back/notebooks/06_red_neuronal.ipynb", "Back/models/red_neuronal.keras", "Back/models/resultados_dl.json"],
    criterio:
      "Al menos una CNN y una RNN entrenadas y evaluadas en test; las curvas de aprendizaje están en el notebook; el modelo está guardado en .keras; existe la tabla comparativa clásicos vs DL.",
    aprendizaje: APR_M2U3,
    lecciones: ["L1", "L9"],
    notebook: "06",
    figurasClave: [],
  },
  {
    n: 7,
    titulo: "NLP aplicado al riesgo de crédito",
    tituloCorto: "NLP",
    pregunta: "¿Lo que el solicitante escribe dice algo que los números no dicen?",
    resumen:
      "Análisis de texto clásico, TF-IDF + regresión logística, sentimiento con BERT, embeddings de BERT frente a GPT-2 y un modelo combinado que mide el ΔAUC del texto con su intervalo.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3],
    fase: "F3",
    crisp: "Modeling",
    ids: ["IA3.1", "IA3.E1", "R2"],
    actividades: [
      { id: "IA3.1", texto: "Aplicar NLP en datos financieros (análisis de texto, Sentiment Analysis, BERT y GPT)." },
      { texto: "Limpieza, tokenización, frecuencias, n-gramas y palabras asociadas al impago." },
      { texto: "Línea base TF-IDF + LogisticRegression que predice el impago solo con el texto." },
      { texto: "Sentimiento con BERT multilingüe y embeddings de sentence-transformers frente a GPT-2 en español." },
      { texto: "Modelo combinado (tabular + sentimiento + embeddings) y ΔAUC con intervalo bootstrap." },
    ],
    entregable: [{ id: "IA3.E1", texto: "Modelo de NLP para la predicción de riesgo." }],
    artefactos: ["Back/notebooks/07_nlp_riesgo.ipynb", "Back/src/credit_risk/nlp.py", "Back/models/modelo_nlp.joblib"],
    criterio: "El notebook contiene análisis de texto, sentimiento con BERT, embeddings BERT vs GPT, el modelo NLP evaluado en test y el ΔAUC del modelo combinado; el .joblib existe.",
    aprendizaje: APR_M2U3,
    lecciones: ["L1", "L9"],
    notebook: "07",
    figurasClave: [],
  },
  {
    n: 8,
    titulo: "Evaluación, optimización y auditoría de equidad",
    tituloCorto: "Evaluación y equidad",
    pregunta: "¿Cuándo aprobar, cuándo revisar y cuándo rechazar, sin tratar distinto a nadie?",
    resumen:
      "Selección por CV en train con parsimonia, calibración, umbrales por costo (regla de Chow), variante de equidad con DI ≥ 0,8, evaluación única en test, explicabilidad y monitoreo PSI.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3, UNIDADES.M2U1],
    fase: "F4",
    crisp: "Evaluation",
    ids: ["F4", "IA3.3", "IA1.3", "R1"],
    actividades: [
      { texto: "Optimizar los hiperparámetros de los 2 mejores modelos con RandomizedSearchCV y CV estratificada." },
      { texto: "Calibrar las probabilidades y comparar el Brier antes y después." },
      { texto: "Elegir los umbrales por costo de negocio y definir las bandas de riesgo (Bajo, Medio, Alto)." },
      { id: "IA3.3", texto: "Comparación final de todos los modelos (clásicos, DL y NLP combinado) en una sola tabla." },
      { id: "IA1.3", texto: "Auditoría de equidad: tasa de aprobación, TPR y FPR por grupo y disparate impact; mitigación documentada." },
      { texto: "Explicabilidad: importancia global y 3 casos individuales." },
    ],
    entregable: [
      { id: "F4", texto: "Evaluar y optimizar." },
      { id: "R1", texto: "Modelo predictivo de riesgo de crédito funcional." },
    ],
    artefactos: ["Back/notebooks/08_evaluacion_optimizacion.ipynb", "Back/models/modelo_final.joblib", "Back/models/model_card.json"],
    criterio: "El modelo final está guardado y cargable con joblib.load; la model card está completa; la tabla de equidad y la decisión del umbral están documentadas.",
    aprendizaje: APR_M2U3,
    lecciones: ["L2", "L7", "L10"],
    notebook: "08",
    especial: "RunTerminal",
    figurasClave: [],
  },
  {
    n: 9,
    titulo: "Integración con Big Data (Spark)",
    tituloCorto: "Big Data · Spark",
    pregunta: "¿El mismo análisis escala cuando los datos ya no caben en una máquina?",
    resumen:
      "PySpark en Docker: esquema explícito, transformaciones, Spark SQL, Parquet particionado, MLlib comparado con scikit-learn y scoring por lotes.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3],
    fase: "F3",
    crisp: "Modeling + Deployment",
    ids: ["IA3.6"],
    actividades: [
      { id: "IA3.6", texto: "Integrar con Big Data (Spark, Hadoop)." },
      { texto: "SparkSession local; lectura del CSV con esquema explícito; printSchema, count y describe." },
      { texto: "filter, select, withColumn, groupBy().agg() y Spark SQL con createOrReplaceTempView." },
      { texto: "Parquet particionado por propósito y explicación de HDFS, YARN y MapReduce frente a Spark." },
      { texto: "Pipeline de MLlib evaluado con BinaryClassificationEvaluator y comparado con scikit-learn; scoring por lotes." },
    ],
    entregable: [{ id: "IA3.6", texto: "Integración con Big Data: Parquet particionado y AUC de MLlib comparada con sklearn." }],
    artefactos: ["Back/notebooks/09_spark_big_data.ipynb", "Back/docker-compose.spark.yml", "db/processed/spark/"],
    criterio: "El notebook corre completo; existe el Parquet particionado; hay una métrica AUC de MLlib comparada con sklearn.",
    aprendizaje: APR_M2U3,
    lecciones: ["L9"],
    notebook: "09",
    especial: "SparkJob",
    figurasClave: [],
  },
  {
    n: 10,
    titulo: "API REST y despliegue (Docker)",
    tituloCorto: "API y despliegue",
    pregunta: "¿Cómo consume el modelo alguien que no abre un notebook?",
    resumen:
      "FastAPI con validación Pydantic, /predict con decisión aprobar/revisar/rechazar y factores, /predict/text, pruebas con TestClient, imagen Docker no-root y guía de nube.",
    modulo: "M2",
    unidad: UNIDADES.M2U3,
    unidades: [UNIDADES.M2U3],
    fase: "F5",
    crisp: "Deployment",
    ids: ["IA3.4", "IA3.5", "IA3.E3", "R4"],
    actividades: [
      { id: "IA3.4", texto: "Crear una API con Flask o FastAPI." },
      { id: "IA3.5", texto: "Desplegar el modelo con Docker o en la nube (AWS, GCP, Azure)." },
      { texto: "Endpoints /health, /model/info, /predict, /predict/batch y /predict/text con errores 422 claros." },
      { texto: "Pruebas con pytest + TestClient: health, predict válido, predict inválido (422) y batch." },
    ],
    entregable: [{ id: "IA3.E3", texto: "API RESTful para el consumo del modelo." }],
    artefactos: ["Back/api/", "Back/Dockerfile", "Back/docker-compose.yml", "Back/tests/test_api.py", "docs/05_despliegue.md"],
    criterio: "pytest pasa; uvicorn levanta y /docs responde; docker compose up levanta la misma API; la guía de nube existe.",
    aprendizaje: APR_M2U3,
    lecciones: ["L8"],
    notebook: null,
    especial: "ApiConsole",
    figurasClave: [],
  },
  {
    n: 11,
    titulo: "Notebook integrador y comunicación de resultados",
    tituloCorto: "Integración y comunicación",
    pregunta: "¿Cabe todo el proyecto en un solo notebook que cualquiera pueda correr?",
    resumen:
      "Notebook autocontenido que recorre F1 → F5 con el paquete, predice la probabilidad de impago de 3 clientes, llama a la API en el mismo proceso y cierra con hallazgos, ética, alcance y operación.",
    modulo: "T",
    unidad: UNIDADES.INTEG,
    unidades: [UNIDADES.INTEG],
    fase: "F5",
    crisp: "Deployment",
    ids: ["PF1", "E2", "E4", "R2", "R1", "R4"],
    actividades: [
      { texto: "Notebook único que recorre las 5 fases importando de src/ y cargando los artefactos." },
      { texto: "Mapa inicial: tabla ID del enunciado → sección del notebook." },
      { texto: "Demo de predicción: predecir_cliente() para 3 clientes (bajo, medio y alto riesgo) y llamada a la API." },
      { texto: "Hallazgos, desempeño, consideraciones éticas, alcance y operación; informe ejecutivo no técnico." },
      { texto: "Lanzar el sistema en local desde un clon limpio con comandos verificados (paso 12 del plan)." },
    ],
    entregable: [
      { id: "PF1", texto: "Un Notebook que presente técnicas de análisis exploratorio, programación e IA y que permita predecir la probabilidad de impago." },
      { id: "E2", texto: "Desarrollo de todas las fases del proceso analítico y predictivo." },
      { id: "E4", texto: "Integración de conocimientos de los módulos." },
    ],
    artefactos: ["Back/notebooks/00_proyecto_integrador_final.ipynb", "docs/06_informe_resultados.md", "Back/README.md"],
    criterio: "El notebook corre de inicio a fin y predice la probabilidad de impago; el informe existe; el checklist de 01_enunciado.md queda completo.",
    aprendizaje: APR_INTEG,
    lecciones: ["L5", "L6", "L8"],
    notebook: "00",
    especial: "Integrador",
    figurasClave: [],
  },
];

/* ------------------------------------------------------------------ */
/* Derivados de gestion.json                                           */
/* ------------------------------------------------------------------ */
const G = gestion as unknown as Gestion;

function historiasDePaso(n: number): Historia[] {
  // El paso 12 del plan (lanzar en local) se acredita en el capítulo 11.
  return G.historias.filter((h) => h.paso === n || (n === 11 && h.paso === 12));
}

function estadoDe(hs: Historia[]): EstadoPaso {
  if (!hs.length) return "pendiente";
  if (hs.every((h) => h.estado === "Hecho")) return "hecho";
  if (hs.some((h) => (["En progreso", "En revisión", "Hecho"] as EstadoHistoria[]).includes(h.estado))) return "en-curso";
  return "pendiente";
}

export const PASOS: PasoMeta[] = BASE.map((b) => {
  const hs = historiasDePaso(b.n);
  const sprints = [...new Set(hs.map((h) => h.sprint).filter((s): s is string => s !== null))].sort();
  return {
    ...b,
    ruta: b.n === 0 ? "/metodologia" : `/paso/${b.n}`,
    figurasClave: CAPITULOS[b.n] ? Object.values(CAPITULOS[b.n].figuras) : b.figurasClave,
    hu: hs.map((h) => h.id),
    sprints,
    estado: estadoDe(hs),
    puntos: hs.reduce((a, h) => a + (h.puntos ?? 0), 0),
  };
});

export const TOTAL_PASOS = PASOS.length; // 12 (0–11)

export function pasoPorNumero(n: number): PasoMeta | undefined {
  return PASOS.find((p) => p.n === n);
}

export const ESTADO_ETIQUETA: Record<EstadoPaso, string> = {
  hecho: "Hecho",
  "en-curso": "En curso",
  pendiente: "Pendiente",
};

/** Grupos para el rail y el mapa: Módulo → Unidad → pasos (unidad principal). */
export interface GrupoRail {
  clave: string;
  modulo: ModuloId;
  titulo: string;
  subtitulo?: string;
  pasos: PasoMeta[];
}

export const GRUPOS_RAIL: GrupoRail[] = [
  { clave: "gest", modulo: "T", titulo: "Transversal", subtitulo: "Gestión ágil", pasos: PASOS.filter((p) => p.n === 0) },
  { clave: "m1u1", modulo: "M1", titulo: "Módulo 1 · Programación", subtitulo: "U1 · Exploración preliminar", pasos: PASOS.filter((p) => p.n === 2) },
  { clave: "m1u2", modulo: "M1", titulo: "Módulo 1 · Programación", subtitulo: "U2 · Limpieza y preparación", pasos: PASOS.filter((p) => p.n === 3) },
  { clave: "m2u1", modulo: "M2", titulo: "Módulo 2 · Inteligencia artificial", subtitulo: "U1 · Ética y exploración", pasos: PASOS.filter((p) => p.n === 1) },
  { clave: "m2u2", modulo: "M2", titulo: "Módulo 2 · Inteligencia artificial", subtitulo: "U2 · Transformación y visualización", pasos: PASOS.filter((p) => p.n === 4) },
  { clave: "m2u3", modulo: "M2", titulo: "Módulo 2 · Inteligencia artificial", subtitulo: "U3 · Modelado, NLP y despliegue", pasos: PASOS.filter((p) => p.n >= 5 && p.n <= 10) },
  { clave: "integ", modulo: "T", titulo: "Integración", subtitulo: "Producto final", pasos: PASOS.filter((p) => p.n === 11) },
];

export const etiquetaUnidad = (u: UnidadRef) => (u.unidad ? `${u.modulo} · U${u.unidad}` : MODULOS[u.modulo].corto);
export const numeroFantasma = (n: number) => String(n).padStart(2, "0");

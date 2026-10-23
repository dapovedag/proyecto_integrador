/**
 * Tipos del paquete de corrida (exportado por Back/scripts/exportar_front.py).
 * Derivados de src/data/schemas/*.schema.json y de los JSON reales en src/data/generated/.
 */

/* ------------------------------------------------------------------ */
/* Manifest                                                            */
/* ------------------------------------------------------------------ */
export interface Manifest {
  version: string;
  card_version: string;
  git_sha: string;
  generado: string;
  datos: Record<string, string>;
  archivos: Record<string, { sha256: string; bytes: number }>;
}

/* ------------------------------------------------------------------ */
/* Model card v2                                                       */
/* ------------------------------------------------------------------ */
export type DecisionId = "aprobar" | "revisar" | "rechazar";
export type BandaId = "Bajo" | "Medio" | "Alto";

export interface Metricas {
  roc_auc: number;
  pr_auc: number;
  ks: number;
  brier: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface VarianteEquidad {
  variante: string;
  descripcion: string;
  roc_auc_oof: number;
  costo_medio: number;
  tasa_aprobacion: number;
  tasa_revision: number;
  tasa_rechazo: number;
  impago_en_aprobados: number;
  supera_capacidad_revision: boolean;
  di_sexo: number;
  di_edad: number;
  cumple_equidad: boolean;
  precio_equidad_costo: number;
}

export interface GrupoEquidad {
  grupo: string;
  n: number;
  tasa_aprobacion: number;
  aprobacion_buenos_pagadores: number;
  rechazo_buenos_pagadores: number;
  prob_media: number;
  tasa_impago_real: number;
  error_calibracion: number;
  cuenta_para_di: boolean;
}

export interface EquidadAtributo {
  grupos: GrupoEquidad[];
  disparate_impact: number;
  di_ic95: [number, number];
  di_igualdad_oportunidades: number;
  cumple_regla_80: boolean;
}

export interface DecisionAgregada {
  costo_medio: number;
  tasa_aprobacion: number;
  tasa_revision: number;
  tasa_rechazo: number;
  impago_en_aprobados: number;
  supera_capacidad_revision: boolean;
}

export interface ModelCard {
  nombre: string;
  version: string;
  fecha_entrenamiento: string;
  algoritmo: string;
  familia: string;
  variante_equidad: string;
  excepcion_equidad: boolean;
  fuente_de_verdad: string;
  modo_rapido: boolean;
  protocolo: string[];
  datos: {
    hash_train_sha256: string;
    hash_test_sha256: string;
    n_train: number;
    n_test: number;
    tasa_default_train: number;
    tasa_default_test: number;
    validacion_contrato: Record<string, boolean>;
  };
  seleccion_cv_train: Record<string, { roc_auc_cv: number; roc_auc_cv_std: number; hiperparametros: Record<string, number> }>;
  variantes_equidad: VarianteEquidad[];
  costos: { lgd_fn: number; margen_fp: number; revision: number; capacidad_revision: number };
  umbrales: { aprobar: number; rechazar: number; bayes: number };
  bandas_riesgo: Record<BandaId, [number, number]>;
  decisiones: Record<BandaId, DecisionId>;
  sensibilidad_umbrales: { lgd: number; margen: number; aprobar_si_p_menor: number; rechazar_si_p_mayor: number; banda_revision: boolean }[];
  metricas_test: Metricas;
  metricas_test_umbral_bayes: Metricas;
  decision_test: DecisionAgregada;
  equidad_test: { sexo: EquidadAtributo; edad: EquidadAtributo; cumple_todo: boolean };
  importancia_permutacion: { variable: string; importancia: number; desviacion: number }[];
  monitoreo: {
    psi_puntaje_train_test: number;
    estado: string;
    psi_variables: { variable: string; psi: number; estado: string }[];
  };
  modelo_texto: { algoritmo: string; metricas: { oof_train: Metricas; test: Metricas } };
  variables_entrada: string[];
  variables_modelo: { numericas: string[]; nominales: string[]; ordinales: string[] };
  variable_excluida_auditoria: string;
  limitaciones: string[];
  duracion_entrenamiento_s: number;
}

/* ------------------------------------------------------------------ */
/* Agregados (DuckDB)                                                  */
/* ------------------------------------------------------------------ */
export interface Agregados {
  resumen: { filas: number; ids_unicos: number; tasa_impago: number };
  nulos_crudo: Record<string, number>;
  por_categoria: Record<string, { categoria: string; n: number; tasa_impago: number }[]>;
  por_decil: Record<string, { decil: number; desde: number; hasta: number; n: number; tasa_impago: number }[]>;
  histogramas: Record<string, { bordes: number[]; pago: number[]; impago: number[] }>;
  correlacion_spearman: { variables: string[]; matriz: number[][] };
}

/* ------------------------------------------------------------------ */
/* Nube PCA (public/run/nube_pca.json)                                 */
/* ------------------------------------------------------------------ */
export interface NubePca {
  varianza_explicada: [number, number];
  n: number;
  columnas: ["x", "y", "default", "banda", "test"];
  /** [x, y, default(0|1), banda(0 aprobar · 1 revisar · 2 rechazar), test(0|1)] */
  puntos: [number, number, number, number, number][];
}

/* ------------------------------------------------------------------ */
/* Capturas de la API y log de entrenamiento                           */
/* ------------------------------------------------------------------ */
export interface CapturaApi {
  nombre: string;
  metodo: "GET" | "POST";
  ruta: string;
  peticion: unknown;
  estado: number;
  latencia_ms: number;
  respuesta: unknown;
  request_id: string;
}
export interface ApiCapturas {
  capturado: string;
  servidor: string;
  llamadas: CapturaApi[];
  openapi: Record<string, unknown>;
}
export type TrainLog = { t: number; linea: string }[];

/* ------------------------------------------------------------------ */
/* Gestión (backlog.yaml → gestion.json)                               */
/* ------------------------------------------------------------------ */
export type EstadoHistoria = "Pendiente" | "En progreso" | "En revisión" | "Hecho";

export interface Historia {
  id: string;
  epica: string;
  rol: string;
  quiero: string;
  para: string;
  criterios_aceptacion: { dado: string; cuando: string; entonces: string }[];
  puntos: number;
  sprint: string;
  sprint_mvp?: string;
  estado: EstadoHistoria;
  paso: number;
  ids_enunciado: string[];
  nota?: string;
  historia: string;
  evidencia: { ruta: string; existe: boolean }[];
  notebooks_dod_fallidos: string[];
  acreditada: boolean;
}
export interface Sprint {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  objetivo: string;
  fase: string[];
  estimado: boolean;
  nota?: string;
  historias: string[];
  puntos_comprometidos: number | null;
  puntos_hechos: number | null;
  burndown: { fecha: string; restante: number }[] | null;
}
export interface FilaTrazabilidad {
  id: string;
  item: string;
  paso: string;
  ids: string[];
  historias: string[];
  acreditada: boolean;
}
export interface Gestion {
  fuente: { backlog: string; backlog_sha256: string; dod_status: string | null };
  proyecto: string;
  version_modelo_objetivo: string;
  metodologia: { gestion: string; ciclo_analitico: string; practicas: string; fases_crisp_dm: Record<string, string> };
  resumen_estados: Record<EstadoHistoria, { historias: number; puntos: number }>;
  epicas: { id: string; nombre: string; objetivo: string; historias: string[]; puntos: number }[];
  historias: Historia[];
  sprints: Sprint[];
  trazabilidad: {
    filas_total: number;
    filas_acreditadas: number;
    ids_total: number;
    ids_cubiertos: number;
    ids_sin_cubrir: string[];
    filas: FilaTrazabilidad[];
  };
  dod: unknown;
}

/* ------------------------------------------------------------------ */
/* DoD (dod_status.json, próximamente). Forma tolerante.               */
/* ------------------------------------------------------------------ */
export interface CriterioDod {
  id?: string;
  criterio?: string;
  ok: boolean;
  detalle?: string;
}
export interface DodStatus {
  generado?: string;
  git_sha?: string;
  /** Por notebook ("01", "02"…) o por paso ("paso_1"…): lista de criterios o mapa criterio → bool. */
  notebooks?: Record<string, { ok?: boolean; criterios?: CriterioDod[] | Record<string, boolean> } | Record<string, boolean>>;
  pasos?: Record<string, { ok?: boolean; criterios?: CriterioDod[] | Record<string, boolean>; fecha?: string }>;
  [k: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Notebooks reproducibles (public/run/notebooks/NN.json)              */
/* ------------------------------------------------------------------ */
export type SalidaCelda =
  | { tipo: "stream"; nombre: "stdout" | "stderr"; texto: string }
  | { tipo: "html"; html: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "markdown"; texto: string }
  | { tipo: "figura"; spec: FiguraSpec }
  | { tipo: "imagen"; src: string; ancho?: number; alto?: number; referencia?: boolean }
  | { tipo: "error"; texto: string };

export type Celda =
  | { tipo: "markdown"; fuente: string }
  | { tipo: "codigo"; fuente: string; ejecucion: number | null; duracion_s: number | null; parametros?: boolean; salidas: SalidaCelda[] };

export interface NotebookEjecutado {
  archivo: string;
  titulo: string;
  kernel: string;
  duracion_total_s: number;
  celdas: Celda[];
}

/** Índice de notebooks (src/data/generated/notebooks.json, próximamente). */
export interface IndiceNotebook {
  id: string;
  archivo: string;
  titulo: string;
  paso?: number;
  celdas?: number;
  duracion_total_s?: number;
  figuras?: number;
}

/* ------------------------------------------------------------------ */
/* Figuras nativas                                                     */
/* ------------------------------------------------------------------ */
export type FormatoNum = "pct" | "cop" | "num" | "dec3" | "dec2" | "dec1" | "int";
export type ColorPor = "signo" | "modulo" | "banda" | "familia";
export type TipoFigura =
  | "lineas"
  | "area"
  | "barras"
  | "barras_h"
  | "histograma"
  | "dispersion"
  | "boxplot"
  | "heatmap"
  | "matriz_confusion"
  | "curva_roc"
  | "curva_pr"
  | "calibracion"
  | "dona"
  | "kpi"
  | "tabla";

export type Referencia =
  | { eje: "x" | "y"; valor: number; etiqueta?: string }
  | { tipo: "diagonal"; etiqueta?: string };

export interface Banda {
  desde: number;
  hasta: number;
  etiqueta?: string;
  eje?: "x" | "y";
  color?: string;
}

export interface Anotacion {
  x: number | string;
  y: number;
  texto: string;
}

export interface OpcionesFigura {
  formato_x?: FormatoNum;
  formato_y?: FormatoNum;
  apilado?: boolean;
  escala_log?: boolean;
  color_por?: ColorPor;
  min_x?: number;
  min_y?: number;
  max_y?: number;
  tamano_punto?: number;
  normalizado?: boolean;
  [k: string]: unknown;
}

export interface SerieXY {
  nombre: string;
  x: (number | string)[];
  y: number[];
}

export interface DatosFigura {
  series?: (SerieXY | { nombre: string; valores: number[]; errores?: number[] } | { nombre: string; conteos: number[] } | { nombre: string; puntos: number[][] } | { nombre: string; cajas: number[][] })[];
  categorias?: string[];
  familias?: string[];
  bordes?: number[];
  x?: (string | number)[];
  y?: (string | number)[];
  valores?: number[] | number[][];
  etiquetas?: string[];
  items?: { etiqueta: string; valor: number | string; formato?: FormatoNum; nota?: string }[];
  columnas?: string[];
  filas?: (string | number | null)[][];
  referencias?: Referencia[];
  bandas?: Banda[];
  anotaciones?: Anotacion[];
  [k: string]: unknown;
}

export interface FiguraSpec {
  id?: string;
  tipo: TipoFigura;
  titulo: string;
  subtitulo?: string;
  ejes?: { x?: string; y?: string };
  datos: DatosFigura;
  /** Identificador técnico de la figura dentro de su notebook (p. ej. `roc_clasicos`). */
  clave?: string;
  /** Lectura humana (una línea) que acompaña la figura en los capítulos. */
  lectura?: string;
  nota?: string;
  opciones?: OpcionesFigura;
  notebook?: string;
  celda?: number | string;
  version?: string;
}

/** public/run/figuras.json (próximamente): todas las figuras nativas por id. */
export interface IndiceFiguras {
  version?: string;
  figuras: FiguraSpec[];
}

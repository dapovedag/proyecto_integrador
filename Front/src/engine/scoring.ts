/**
 * Motor de scoring: port exacto del pipeline servido por el back (credit_risk v2).
 *
 * Reproduce, con los parámetros exportados por `Back/scripts/exportar_front.py`, la misma cadena que
 * `ArtefactoModelo.predecir` en Python: variables derivadas → capping p1-p99 → imputación → escalado →
 * one-hot / ordinal → regresión logística → calibración sigmoide → regla de Chow → contribuciones exactas.
 * Las pruebas golden (`scoring.test.ts`) exigen |Δp| < 1e-6 frente a Python.
 */

export type Valor = number | string | null | undefined;
export type Cliente = Record<string, Valor>;
export type Decision = "aprobar" | "revisar" | "rechazar";
export type Banda = "Bajo" | "Medio" | "Alto";

export interface Umbrales {
  aprobar: number;
  rechazar: number;
  bayes: number;
  aprobar_exacto: number;
  rechazar_exacto: number;
}

export interface ModeloExport {
  version: string;
  variante: string;
  algoritmo: string;
  columnas_entrada: string[];
  numericas_crudas: string[];
  rango_edad: { bins: number[]; etiquetas: string[] };
  capping: Record<string, [number, number]>;
  preprocesador: {
    num: { columnas: string[]; mediana: number[]; media: number[]; escala: number[] };
    nom: { columnas: string[]; relleno: string; categorias: string[][] };
    ord?: { columnas: string[]; moda: string[]; categorias: string[][]; media: number[]; escala: number[] };
  };
  orden_salida: string[];
  variable_original: string[];
  coeficientes: number[];
  intercepto: number;
  calibracion: { a: number; b: number };
  umbrales: Umbrales;
  explicador: { media_z: number[]; base_logit: number };
}

export interface Factor {
  variable: string;
  contribucion: number;
  efecto: "aumenta_riesgo" | "reduce_riesgo";
}

export interface Prediccion {
  probabilidad_impago: number;
  decision: Decision;
  banda_riesgo: Banda;
  prediccion: 0 | 1;
  etiqueta: string;
  umbrales: { aprobar: number; rechazar: number; bayes: number };
  factores_principales: Factor[];
  modelo_version: string;
}

export interface Detalle {
  /** Probabilidad calibrada sin redondear. */
  p: number;
  /** Logit calibrado = base + Σ contribuciones. */
  logit: number;
  /** Vector transformado (mismo orden que `orden_salida`). */
  z: number[];
  /** Todas las contribuciones por variable original (sin recortar). */
  contribuciones: Factor[];
  /** Variables derivadas calculadas (para mostrar en el simulador). */
  derivadas: Record<string, number>;
}

const BANDA: Record<Decision, Banda> = { aprobar: "Bajo", revisar: "Medio", rechazar: "Alto" };

/** Equivalente de pandas.to_numeric(errors="coerce"): null/""/no numérico → NaN. */
export function aNumero(v: Valor): number {
  if (v === null || v === undefined || v === "") return NaN;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function finitoONaN(x: number): number {
  return Number.isFinite(x) ? x : NaN;
}

/** pd.cut(edad, bins, right=True): (17,25] → "18-25", …; fuera de rango o NaN → null. */
function rangoEdad(edad: number, bins: number[], etiquetas: string[]): string | null {
  if (Number.isNaN(edad)) return null;
  for (let i = 0; i < etiquetas.length; i++) {
    if (edad > bins[i] && edad <= bins[i + 1]) return etiquetas[i];
  }
  return null;
}

/** `credit_risk.features.crear_variables` para un cliente. */
export function crearVariables(c: Cliente, m: ModeloExport): Record<string, Valor> {
  const monto = aNumero(c.monto_credito);
  const ingresoRaw = aNumero(c.ingreso_mensual);
  const ingreso = ingresoRaw === 0 ? NaN : ingresoRaw;
  const nRaw = aNumero(c.plazo_meses);
  const n = nRaw === 0 ? NaN : nRaw;
  const r = aNumero(c.tasa_interes_anual) / 100 / 12;
  const cuota = r > 0 ? (monto * r) / (1 - Math.pow(1 + r, -n)) : monto / n;
  const moras = aNumero(c.moras_ultimos_12m);
  return {
    ...c,
    cuota_estimada: finitoONaN(cuota),
    ratio_cuota_ingreso: finitoONaN(finitoONaN(cuota) / ingreso),
    ratio_monto_ingreso: finitoONaN(monto / ingreso),
    rango_edad: rangoEdad(aNumero(c.edad), m.rango_edad.bins, m.rango_edad.etiquetas),
    tiene_moras_previas: moras > 0 ? 1 : 0, // NaN > 0 es falso → 0, igual que en pandas
  };
}

function esFaltante(v: Valor): boolean {
  return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
}

/** Pipeline completo → vector transformado z (orden de `orden_salida`). */
export function transformar(c: Cliente, m: ModeloExport): { z: number[]; derivadas: Record<string, number> } {
  const d = crearVariables(c, m);
  // capping p1-p99 aprendido en train (NaN se conserva)
  for (const [col, [lo, hi]] of Object.entries(m.capping)) {
    const v = aNumero(d[col]);
    d[col] = Number.isNaN(v) ? NaN : Math.min(Math.max(v, lo), hi);
  }
  const z: number[] = [];
  const { num, nom, ord } = m.preprocesador;
  num.columnas.forEach((col, i) => {
    let v = aNumero(d[col]);
    if (Number.isNaN(v)) v = num.mediana[i];
    z.push((v - num.media[i]) / num.escala[i]);
  });
  nom.columnas.forEach((col, i) => {
    const v = esFaltante(d[col]) ? nom.relleno : String(d[col]);
    for (const cat of nom.categorias[i]) z.push(cat === v ? 1 : 0); // desconocida → todo ceros
  });
  ord?.columnas.forEach((col, i) => {
    const v = esFaltante(d[col]) ? ord.moda[i] : String(d[col]);
    const idx = ord.categorias[i].indexOf(v); // desconocida → -1 (unknown_value)
    z.push((idx - ord.media[i]) / ord.escala[i]);
  });
  if (z.length !== m.orden_salida.length) {
    throw new Error(`Vector de ${z.length} columnas; se esperaban ${m.orden_salida.length}`);
  }
  const derivadas = {
    cuota_estimada: aNumero(d.cuota_estimada),
    ratio_cuota_ingreso: aNumero(d.ratio_cuota_ingreso),
    ratio_monto_ingreso: aNumero(d.ratio_monto_ingreso),
    tiene_moras_previas: aNumero(d.tiene_moras_previas),
  };
  return { z, derivadas };
}

export function decidir(p: number, u: Umbrales): Decision {
  if (p < u.aprobar_exacto) return "aprobar";
  if (p > u.rechazar_exacto) return "rechazar";
  return "revisar";
}

export const bandaDe = (d: Decision): Banda => BANDA[d];

const redondear = (x: number, dec: number): number => {
  const f = 10 ** dec;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
};

/** Probabilidad calibrada, contribuciones exactas y vector transformado. */
export function detallar(c: Cliente, m: ModeloExport): Detalle {
  const { z, derivadas } = transformar(c, m);
  let f = m.intercepto;
  for (let j = 0; j < z.length; j++) f += m.coeficientes[j] * z[j];
  const { a, b } = m.calibracion;
  const logit = -(a * f + b);
  const p = 1 / (1 + Math.exp(a * f + b));
  const agg = new Map<string, number>();
  for (let j = 0; j < z.length; j++) {
    const v = m.variable_original[j];
    agg.set(v, (agg.get(v) ?? 0) + -a * m.coeficientes[j] * (z[j] - m.explicador.media_z[j]));
  }
  const contribuciones: Factor[] = [...agg.entries()]
    .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))
    .map(([variable, v]) => ({ variable, contribucion: v, efecto: v > 0 ? "aumenta_riesgo" : "reduce_riesgo" }));
  return { p, logit, z, contribuciones, derivadas };
}

/** Misma respuesta que `POST /predict` de la API (incluye el redondeo a 4 decimales). */
export function predecir(c: Cliente, m: ModeloExport, topFactores = 5): Prediccion {
  const det = detallar(c, m);
  const decision = decidir(det.p, m.umbrales);
  return {
    probabilidad_impago: redondear(det.p, 4),
    decision,
    banda_riesgo: BANDA[decision],
    prediccion: decision === "rechazar" ? 1 : 0,
    etiqueta: decision === "rechazar" ? "Impago" : decision === "revisar" ? "Revisión manual" : "No impago",
    umbrales: { aprobar: m.umbrales.aprobar, rechazar: m.umbrales.rechazar, bayes: m.umbrales.bayes },
    factores_principales: det.contribuciones.slice(0, topFactores).map((f) => ({
      ...f,
      contribucion: redondear(f.contribucion, 4),
    })),
    modelo_version: m.version,
  };
}

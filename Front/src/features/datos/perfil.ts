/**
 * Parser y perfilado de los CSV del paquete de corrida (puro: lo usan el Web Worker y las pruebas).
 */
import Papa from "papaparse";

export type Celda = string | number | null;
export interface Tabla {
  columnas: string[];
  tipos: ("numerico" | "categorico" | "texto")[];
  filas: Celda[][];
}

/** CSV → tabla columnar tipada (vacío → null; números → number). */
export function parsearCsv(texto: string): Tabla {
  const r = Papa.parse<string[]>(texto.replace(/^﻿/, ""), { skipEmptyLines: true });
  const [cab, ...resto] = r.data;
  const columnas = cab.map((c) => c.trim());
  const filas: Celda[][] = resto.map((f) =>
    columnas.map((_, j) => {
      const v = f[j];
      if (v === undefined || v === "" || v === "NaN" || v === "nan") return null;
      const n = Number(v);
      return v.trim() !== "" && Number.isFinite(n) && /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(v.trim()) ? n : v;
    }),
  );
  const tipos = columnas.map((c, j) => {
    let num = 0;
    let str = 0;
    let largo = 0;
    for (const f of filas) {
      const v = f[j];
      if (typeof v === "number") num++;
      else if (typeof v === "string") {
        str++;
        largo += v.length;
      }
    }
    if (c.startsWith("id_")) return "categorico" as const;
    if (num > 0 && str === 0) return "numerico" as const;
    return str && largo / str > 40 ? ("texto" as const) : ("categorico" as const);
  });
  return { columnas, tipos, filas };
}

export interface Perfil {
  columna: string;
  tipo: Tabla["tipos"][number];
  n: number;
  nulos: number;
  unicos: number;
  media?: number;
  mediana?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  /** Límites de atípicos (IQR × 1,5). */
  limites?: [number, number];
  atipicos?: number;
  histograma?: { bordes: number[]; conteos: number[] };
  frecuencias?: { valor: string; n: number }[];
}

function cuantil(o: number[], q: number): number {
  if (!o.length) return NaN;
  const pos = (o.length - 1) * q;
  const b = Math.floor(pos);
  const r = pos - b;
  return o[b + 1] !== undefined ? o[b] + r * (o[b + 1] - o[b]) : o[b];
}

export function perfilar(t: Tabla, j: number, bins = 24): Perfil {
  const col = t.filas.map((f) => f[j]);
  const nulos = col.filter((v) => v === null).length;
  const valores = col.filter((v): v is string | number => v !== null);
  const unicos = new Set(valores).size;
  const base: Perfil = { columna: t.columnas[j], tipo: t.tipos[j], n: col.length, nulos, unicos };
  if (t.tipos[j] === "numerico") {
    const o = (valores as number[]).slice().sort((a, b) => a - b);
    const media = o.reduce((s, x) => s + x, 0) / (o.length || 1);
    const q1 = cuantil(o, 0.25);
    const q3 = cuantil(o, 0.75);
    const iqr = q3 - q1;
    const limites: [number, number] = [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
    const min = o[0];
    const max = o[o.length - 1];
    const ancho = (max - min) / bins || 1;
    const conteos = new Array(bins).fill(0);
    for (const x of o) conteos[Math.min(bins - 1, Math.floor((x - min) / ancho))]++;
    return {
      ...base,
      media,
      mediana: cuantil(o, 0.5),
      min,
      max,
      q1,
      q3,
      limites,
      atipicos: iqr > 0 ? o.filter((x) => x < limites[0] || x > limites[1]).length : 0,
      histograma: { bordes: Array.from({ length: bins + 1 }, (_, i) => min + i * ancho), conteos },
    };
  }
  const m = new Map<string, number>();
  for (const v of valores) m.set(String(v), (m.get(String(v)) ?? 0) + 1);
  const frecuencias = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([valor, n]) => ({ valor, n }));
  return { ...base, frecuencias };
}

/** Conteos de control (los mismos que agregados.json → resumen y nulos_crudo). */
export function conteos(t: Tabla) {
  const iId = t.columnas.indexOf("id_cliente");
  const iDef = t.columnas.indexOf("default");
  const nulos: Record<string, number> = {};
  t.columnas.forEach((c, j) => {
    const n = t.filas.reduce((s, f) => s + (f[j] === null ? 1 : 0), 0);
    if (n) nulos[c] = n;
  });
  const defs = t.filas.map((f) => f[iDef]).filter((v): v is number => typeof v === "number");
  return {
    filas: t.filas.length,
    ids_unicos: iId >= 0 ? new Set(t.filas.map((f) => f[iId])).size : t.filas.length,
    tasa_impago: defs.reduce((s, x) => s + x, 0) / (defs.length || 1),
    nulos,
  };
}

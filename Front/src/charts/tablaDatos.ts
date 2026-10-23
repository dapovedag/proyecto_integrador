/**
 * Spec de figura → tabla plana (columnas + filas ya formateadas) para "Ver datos" y accesibilidad.
 */
import type { FiguraSpec } from "@/data/tipos";
import { formatear } from "./formatos";

export interface TablaPlana {
  columnas: string[];
  filas: string[][];
  total: number; // filas totales antes de truncar
}

const MAX_FILAS = 400;

export function tablaDeSpec(spec: FiguraSpec): TablaPlana {
  const d = spec.datos;
  const op = spec.opciones ?? {};
  const fx = op.formato_x;
  const fy = op.formato_y;
  const f = (v: unknown, fmt?: string) => (typeof v === "number" ? formatear(v, fmt) : String(v ?? "—"));
  let columnas: string[] = [];
  let filas: string[][] = [];

  switch (spec.tipo) {
    case "lineas":
    case "area":
    case "curva_roc":
    case "curva_pr":
    case "calibracion": {
      const series = (d.series ?? []) as { nombre: string; x: (number | string)[]; y: number[] }[];
      columnas = ["Serie", spec.ejes?.x ?? "x", spec.ejes?.y ?? "y"];
      for (const s of series) s.x.forEach((x, j) => filas.push([s.nombre, f(x, fx), f(s.y[j], fy)]));
      break;
    }
    case "barras":
    case "barras_h": {
      const cats = d.categorias ?? [];
      const series = (d.series ?? []) as { nombre: string; valores: number[]; errores?: number[] }[];
      const fv = spec.tipo === "barras_h" ? (op.formato_x ?? fy) : fy;
      const conErr = series.some((s) => s.errores?.length);
      columnas = ["Categoría", ...(d.familias ? ["Familia"] : []), ...series.flatMap((s) => (conErr ? [s.nombre, `± ${s.nombre}`] : [s.nombre]))];
      cats.forEach((c, j) =>
        filas.push([
          String(c),
          ...(d.familias ? [d.familias[j] ?? ""] : []),
          ...series.flatMap((s) => (conErr ? [f(s.valores[j], fv), s.errores?.[j] != null ? f(s.errores[j], fv) : "—"] : [f(s.valores[j], fv)])),
        ]),
      );
      break;
    }
    case "histograma": {
      const b = d.bordes ?? [];
      const series = (d.series ?? []) as { nombre: string; conteos: number[] }[];
      columnas = ["Desde", "Hasta", ...series.map((s) => s.nombre)];
      for (let i = 0; i < b.length - 1; i++) filas.push([f(b[i], fx), f(b[i + 1], fx), ...series.map((s) => f(s.conteos[i], "int"))]);
      break;
    }
    case "dispersion": {
      const series = (d.series ?? []) as { nombre: string; puntos: number[][] }[];
      columnas = ["Serie", spec.ejes?.x ?? "x", spec.ejes?.y ?? "y"];
      for (const s of series) for (const p of s.puntos) filas.push([s.nombre, f(p[0], fx), f(p[1], fy)]);
      break;
    }
    case "boxplot": {
      const cats = d.categorias ?? [];
      const series = (d.series ?? []) as { nombre: string; cajas: number[][] }[];
      columnas = ["Categoría", "Serie", "Mínimo", "Q1", "Mediana", "Q3", "Máximo"];
      for (const s of series) s.cajas.forEach((c, j) => filas.push([String(cats[j] ?? j), s.nombre, ...c.map((v) => f(v, fy))]));
      break;
    }
    case "heatmap":
    case "matriz_confusion": {
      const conf = spec.tipo === "matriz_confusion";
      const xs = (conf ? d.etiquetas : d.x) ?? [];
      const ys = (conf ? d.etiquetas : d.y) ?? [];
      const M = (d.valores ?? []) as number[][];
      columnas = [conf ? "Real \\ Predicho" : "", ...xs.map(String)];
      M.forEach((fila, i) => filas.push([String(ys[i] ?? i), ...fila.map((v) => f(v, conf ? "int" : (fy ?? "dec2")))]));
      break;
    }
    case "dona": {
      const cats = d.categorias ?? [];
      const vals = (d.valores ?? []) as number[];
      const tot = vals.reduce((a, b) => a + b, 0) || 1;
      columnas = ["Categoría", "Valor", "Participación"];
      cats.forEach((c, i) => filas.push([String(c), f(vals[i], fy), formatear(vals[i] / tot, "pct")]));
      break;
    }
    case "kpi": {
      columnas = ["Indicador", "Valor"];
      for (const it of d.items ?? []) filas.push([it.etiqueta, typeof it.valor === "number" ? formatear(it.valor, it.formato) : String(it.valor)]);
      break;
    }
    case "tabla": {
      columnas = (d.columnas ?? []).map(String);
      filas = (d.filas ?? []).map((r) => r.map((v) => (typeof v === "number" ? formatear(v, Number.isInteger(v) ? "int" : "dec3") : String(v ?? "—"))));
      break;
    }
  }
  const total = filas.length;
  return { columnas, filas: filas.slice(0, MAX_FILAS), total };
}

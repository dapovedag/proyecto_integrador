/**
 * Acceso a las figuras nativas del paquete (public/run/figuras.json) por notebook + clave.
 * Referencia de figura en un capítulo: "clave" (notebook del paso) o "NN:clave" (otro notebook).
 */
import { useRecurso } from "@/data/cargar";
import type { FiguraSpec } from "@/data/tipos";

export interface RefFig {
  nb: string;
  clave: string;
}

export function parseRef(ref: string, nbDefecto: string | null): RefFig {
  const m = /^(\d{2}):(.+)$/.exec(ref);
  if (m) return { nb: m[1], clave: m[2] };
  return { nb: nbDefecto ?? "", clave: ref };
}

export function listaFiguras(datos: unknown): FiguraSpec[] {
  if (Array.isArray(datos)) return datos as FiguraSpec[];
  const f = (datos as { figuras?: FiguraSpec[] } | null)?.figuras;
  return Array.isArray(f) ? f : [];
}

export function buscarFigura(figs: FiguraSpec[], nb: string, clave: string): FiguraSpec | undefined {
  return figs.find((s) => s.notebook === nb && s.clave === clave);
}

/** Copia de la spec con la lectura editorial del capítulo en lugar del identificador `clave`. */
export function conLectura(spec: FiguraSpec, lectura?: string, titulo?: string): FiguraSpec {
  return { ...spec, id: `${spec.notebook}:${spec.clave}`, lectura, titulo: titulo ?? spec.titulo };
}

export function useFiguras() {
  const r = useRecurso<unknown>("figuras.json");
  return { estado: r.estado, figuras: listaFiguras(r.datos) };
}

import indiceNb from "@/data/generated/notebooks.json";

/** Celda (1-based, como en figuras.json) de las conclusiones: la última del notebook. */
export function celdaFinal(nb: string): number | undefined {
  return (indiceNb as { id: string; celdas: number }[]).find((x) => x.id === nb)?.celdas;
}

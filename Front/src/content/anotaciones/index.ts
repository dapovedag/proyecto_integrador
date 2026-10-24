/**
 * Anotaciones pedagógicas de las celdas de código («Qué hace · Por qué»), una por celda, por notebook.
 * Se cargan bajo demanda (un chunk por notebook) cuando el reproductor abre ese notebook.
 */
import type { Anotacion } from "../pedagogia";

export type Anotaciones = Record<number, Anotacion>;

export const CARGAR_ANOTACIONES: Record<string, () => Promise<Anotaciones>> = {
  "00": () => import("./00").then((m) => m.ANOTACIONES_00),
  "01": () => import("./01").then((m) => m.ANOTACIONES_01),
  "02": () => import("./02").then((m) => m.ANOTACIONES_02),
  "03": () => import("./03").then((m) => m.ANOTACIONES_03),
  "04": () => import("./04").then((m) => m.ANOTACIONES_04),
  "05": () => import("./05").then((m) => m.ANOTACIONES_05),
  "06": () => import("./06").then((m) => m.ANOTACIONES_06),
  "07": () => import("./07").then((m) => m.ANOTACIONES_07),
  "08": () => import("./08").then((m) => m.ANOTACIONES_08),
  "09": () => import("./09").then((m) => m.ANOTACIONES_09),
};

const cache = new Map<string, Promise<Anotaciones>>();
export function cargarAnotaciones(nb: string): Promise<Anotaciones> {
  let p = cache.get(nb);
  if (!p) {
    p = (CARGAR_ANOTACIONES[nb]?.() ?? Promise.resolve({})).catch(() => ({}));
    cache.set(nb, p);
  }
  return p;
}

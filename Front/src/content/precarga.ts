/**
 * Precarga de capítulos: adelanta el chunk del capítulo, su notebook y el índice de figuras antes del clic
 * (hover/foco en el rail y en «anterior/siguiente», y en tiempo libre para los capítulos vecinos).
 * cargarRun ya deduplica: pedir dos veces lo mismo no repite la descarga.
 */
import { cargarRun } from "@/data/cargar";
import { pasoPorNumero } from "./pasos";

const pedidos = new Set<number>();

export function precargarCapitulo(n: number): void {
  if (pedidos.has(n) || n < 1 || n > 11) return;
  pedidos.add(n);
  import("@/pages/Paso")
    .then((m) => m.CARGADORES[n]?.())
    .catch(() => pedidos.delete(n));
  const nb = pasoPorNumero(n)?.notebook;
  if (nb) cargarRun(`notebooks/${nb}.json`).catch(() => undefined);
  cargarRun("figuras.json").catch(() => undefined);
  // Motor de gráficos (chunk de ECharts): lo usan todos los capítulos.
  import("@/charts/Figura").catch(() => undefined);
}

/** Precarga en tiempo libre (sin competir con lo que el usuario está viendo). */
export function precargarEnReposo(...ns: number[]): () => void {
  const hacer = () => ns.forEach(precargarCapitulo);
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(hacer, { timeout: 4000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const t = window.setTimeout(hacer, 1500);
  return () => window.clearTimeout(t);
}

/** Props para un enlace a un capítulo: precarga al pasar el puntero o enfocar. */
export const alAcercarse = (n: number) => ({
  onMouseEnter: () => precargarCapitulo(n),
  onFocus: () => precargarCapitulo(n),
  onTouchStart: () => precargarCapitulo(n),
});

/**
 * Compresión del tiempo real de ejecución (papermill) al tiempo de reproducción.
 *
 * Cada celda dura s_i = clamp(a·√d_i, MIN, MAX) segundos, con `a` el mayor factor (≤ A_MAX) que deja el
 * total ≤ TOTAL_MAX. La raíz conserva el orden (una celda más lenta nunca se reproduce más rápido) y
 * comprime las colas: 276 s reales de validación cruzada ≈ 2,5 s; 0,04 s de asignación ≈ 0,25 s.
 */
export const MIN_S = 0.25;
export const MAX_S = 2.5;
export const TOTAL_MAX_S = 45;
const A_MAX = 0.9;

const durar = (d: number, a: number) => Math.min(MAX_S, Math.max(MIN_S, a * Math.sqrt(Math.max(0, d || 0))));

/** Duraciones de reproducción (segundos) para las duraciones reales `reales` (segundos). */
export function comprimirDuraciones(reales: (number | null | undefined)[], totalMax = TOTAL_MAX_S): number[] {
  const d = reales.map((x) => (typeof x === "number" && Number.isFinite(x) ? x : 0));
  const suma = (a: number) => d.reduce((s, x) => s + durar(x, a), 0);
  if (d.length * MIN_S >= totalMax) return d.map(() => MIN_S);
  let a = A_MAX;
  if (suma(a) > totalMax) {
    let lo = 0;
    let hi = A_MAX;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      if (suma(m) > totalMax) hi = m;
      else lo = m;
    }
    a = lo;
  }
  return d.map((x) => Number(durar(x, a).toFixed(3)));
}

/**
 * Plan de revelado de las salidas de una celda: cada línea de stream y cada salida rica ocupa "unidades";
 * devuelve, para cada salida, en qué fracción (0–1) del tiempo de la celda aparece su primera unidad y
 * cuántas unidades tiene. La primera salida aparece tras un 12 % del tiempo (arranque del kernel).
 */
export function planRevelado(unidades: number[]): { inicio: number; fin: number }[] {
  const total = unidades.reduce((s, u) => s + u, 0) || 1;
  let acum = 0;
  return unidades.map((u) => {
    const ini = 0.12 + 0.86 * (acum / total);
    acum += u;
    return { inicio: ini, fin: 0.12 + 0.86 * (acum / total) };
  });
}

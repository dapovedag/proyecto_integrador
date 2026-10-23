/**
 * Formatos numéricos es-CO (coma decimal, punto de miles). Úsalos en TODO el front: KPIs, ejes, tooltips y tablas.
 *   pct(0.3971) → "39,7 %"   cop(9500000) → "$ 9.500.000"   num(12144) → "12.144"   dec3(0.84563) → "0,846"
 */
import type { FormatoNum } from "@/data/tipos";

const LOCAL = "es-CO";
const cacheFmt = new Map<string, Intl.NumberFormat>();
function nf(opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const k = JSON.stringify(opts);
  let f = cacheFmt.get(k);
  if (!f) {
    f = new Intl.NumberFormat(LOCAL, opts);
    cacheFmt.set(k, f);
  }
  return f;
}

const NBSP = " ";
const vacio = (v: unknown) => v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));

/** Porcentaje desde una proporción (0–1). Espacio fino antes de %, como en el español de Colombia. */
export function pct(v: number | null | undefined, decimales = 1): string {
  if (vacio(v)) return "—";
  const s = nf({ minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format((v as number) * 100);
  return `${s}${NBSP}%`;
}

/** Pesos colombianos sin decimales. `compacto` → "$ 9,5 M". */
export function cop(v: number | null | undefined, compacto = false): string {
  if (vacio(v)) return "—";
  if (compacto) {
    const s = nf({ notation: "compact", maximumFractionDigits: 1 }).format(v as number);
    return `$${NBSP}${s.replace(/\s/g, NBSP)}`;
  }
  return nf({ style: "currency", currency: "COP", maximumFractionDigits: 0, minimumFractionDigits: 0 })
    .format(v as number)
    .replace(/\s/g, NBSP);
}

/** Número con separador de miles; hasta `maxDec` decimales (por defecto 0 para enteros grandes, 2 si no). */
export function num(v: number | null | undefined, maxDec?: number): string {
  if (vacio(v)) return "—";
  const n = v as number;
  const d = maxDec ?? (Math.abs(n) >= 100 || Number.isInteger(n) ? 0 : 2);
  return nf({ maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
}

/** Decimal fijo con `d` cifras (por defecto 3): AUC, KS, Brier, DI. */
export function dec(v: number | null | undefined, d = 3): string {
  if (vacio(v)) return "—";
  return nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(v as number);
}
export const dec3 = (v: number | null | undefined) => dec(v, 3);
export const dec2 = (v: number | null | undefined) => dec(v, 2);

/** Compacto para ejes: 1.200 → "1,2 mil", 9.500.000 → "9,5 M". */
export function compacto(v: number | null | undefined): string {
  if (vacio(v)) return "—";
  const n = v as number;
  if (Math.abs(n) < 10000) return num(n, Math.abs(n) < 10 && !Number.isInteger(n) ? 2 : 0);
  return nf({ notation: "compact", maximumFractionDigits: 1 }).format(n).replace(/\s/g, NBSP);
}

/** Segundos legibles: 490.1 → "8 min 10 s", 2.4 → "2,4 s". */
export function duracion(seg: number | null | undefined): string {
  if (vacio(seg)) return "—";
  const s = seg as number;
  if (s < 60) return `${dec(s, s < 10 ? 1 : 0)}${NBSP}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return r ? `${m}${NBSP}min ${r}${NBSP}s` : `${m}${NBSP}min`;
}

/** Fecha ISO → "23 oct. 2026" (o con hora). */
export function fecha(iso: string | null | undefined, conHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCAL, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(d);
}

/** Formatea según la clave de formato de una figura. */
export function formatear(v: number | null | undefined, formato?: FormatoNum | string): string {
  switch (formato) {
    case "pct":
      return pct(v);
    case "cop":
      return cop(v);
    case "dec3":
      return dec3(v);
    case "dec2":
      return dec2(v);
    case "dec1":
      return dec(v, 1);
    case "int":
      return num(v, 0);
    case "num":
    default:
      return num(v);
  }
}

/** Variante corta para ticks de eje. */
export function formatearEje(v: number, formato?: FormatoNum | string): string {
  switch (formato) {
    case "pct":
      return pct(v, Math.abs(v * 100) < 10 && v !== 0 && !Number.isInteger(v * 100) ? 1 : 0);
    case "cop":
      return cop(v, true);
    case "dec3":
    case "dec2":
      return dec(v, 2);
    case "dec1":
      return dec(v, 1);
    default:
      return compacto(v);
  }
}

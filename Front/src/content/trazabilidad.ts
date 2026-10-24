/**
 * Trazabilidad calculada: ID del enunciado → HU → paso → evidencia → estado, desde gestion.json
 * (que genera Back/scripts/generar_evidencia.py). Aquí no se acredita nada: solo se lee y se agrupa.
 *
 * Regla (generar_evidencia.py): una fila del checklist queda acreditada solo si TODAS las HU que la cubren
 * están en «Hecho», TODAS sus rutas de evidencia existen y los notebooks citados cumplen la DoD.
 */
import gestion from "@/data/generated/gestion.json";
import type { EstadoHistoria, Gestion, Historia } from "@/data/tipos";
import { pasoPorNumero } from "./pasos";

const G = gestion as unknown as Gestion;

export type Bloque = "PF" | "E" | "F" | "R" | "P1" | "P2" | "IA1" | "IA2" | "IA3";
export type ModuloTraza = "General" | "M1" | "M2";
export type EstadoFila = "Acreditado" | "En progreso" | "Pendiente";

export const BLOQUES: { id: Bloque; nombre: string; modulo: ModuloTraza }[] = [
  { id: "PF", nombre: "Producto final", modulo: "General" },
  { id: "E", nombre: "Enfoque del proyecto", modulo: "General" },
  { id: "F", nombre: "Fases del proceso analítico", modulo: "General" },
  { id: "R", nombre: "Resultados esperados", modulo: "General" },
  { id: "P1", nombre: "Programación · Unidad 1", modulo: "M1" },
  { id: "P2", nombre: "Programación · Unidad 2", modulo: "M1" },
  { id: "IA1", nombre: "Inteligencia artificial · Unidad 1", modulo: "M2" },
  { id: "IA2", nombre: "Inteligencia artificial · Unidad 2", modulo: "M2" },
  { id: "IA3", nombre: "Inteligencia artificial · Unidad 3", modulo: "M2" },
];

export interface FilaMatriz {
  id: string;
  item: string;
  bloque: Bloque;
  modulo: ModuloTraza;
  pasos: number[];
  pasoTexto: string;
  fases: string[];
  historias: Historia[];
  evidencia: { ruta: string; existe: boolean }[];
  acreditada: boolean;
  estado: EstadoFila;
}

export function bloqueDe(id: string): Bloque {
  const m = /^(PF|IA[123]|P[12]|[EFR])/.exec(id);
  return (m?.[1] ?? "E") as Bloque;
}

/** "1–12" → [1..12]; "2, 3, 4" → [2,3,4]; "2 (dato: …)" → [2]. El paso 12 del plan vive en el capítulo 11. */
export function pasosDe(texto: string): number[] {
  const limpio = texto.replace(/\(.*?\)/g, "");
  const out = new Set<number>();
  for (const parte of limpio.split(",")) {
    const r = /(\d+)\s*[–-]\s*(\d+)/.exec(parte);
    if (r) {
      for (let i = Number(r[1]); i <= Number(r[2]); i++) out.add(i);
    } else {
      const n = /(\d+)/.exec(parte);
      if (n) out.add(Number(n[1]));
    }
  }
  return [...out].map((n) => (n === 12 ? 11 : n)).filter((n, i, a) => a.indexOf(n) === i).sort((a, b) => a - b);
}

const ACTIVOS: EstadoHistoria[] = ["En progreso", "En revisión", "Hecho"];

export function construirMatriz(g: Gestion = G): FilaMatriz[] {
  const porId = new Map(g.historias.map((h) => [h.id, h]));
  return g.trazabilidad.filas.map((f) => {
    const historias = f.historias.map((id) => porId.get(id)).filter(Boolean) as Historia[];
    const pasos = pasosDe(f.paso);
    const fases = [...new Set(pasos.map((p) => pasoPorNumero(p)?.fase).filter(Boolean) as string[])];
    const vistas = new Set<string>();
    const evidencia = historias
      .flatMap((h) => h.evidencia)
      .filter((e) => (vistas.has(e.ruta) ? false : (vistas.add(e.ruta), true)));
    const bloque = bloqueDe(f.id);
    const estado: EstadoFila = f.acreditada ? "Acreditado" : historias.some((h) => ACTIVOS.includes(h.estado)) ? "En progreso" : "Pendiente";
    return {
      id: f.id,
      item: f.item,
      bloque,
      modulo: BLOQUES.find((b) => b.id === bloque)!.modulo,
      pasos,
      pasoTexto: f.paso.replace(/\s*\(.*?\)/g, ""),
      fases,
      historias,
      evidencia,
      acreditada: f.acreditada,
      estado,
    };
  });
}

export interface ResumenTraza {
  filas: number;
  acreditadas: number;
  enProgreso: number;
  pendientes: number;
  idsTotal: number;
  idsCubiertos: number;
  historias: number;
  historiasAcreditadas: number;
  evidenciaExiste: number;
  evidenciaTotal: number;
}

export function resumirMatriz(filas: FilaMatriz[], g: Gestion = G): ResumenTraza {
  const rutas = new Map<string, boolean>();
  g.historias.forEach((h) => h.evidencia.forEach((e) => rutas.set(e.ruta, e.existe)));
  return {
    filas: filas.length,
    acreditadas: filas.filter((f) => f.acreditada).length,
    enProgreso: filas.filter((f) => f.estado === "En progreso").length,
    pendientes: filas.filter((f) => f.estado === "Pendiente").length,
    idsTotal: g.trazabilidad.ids_total,
    idsCubiertos: g.trazabilidad.ids_cubiertos,
    historias: g.historias.length,
    historiasAcreditadas: g.historias.filter((h) => h.acreditada).length,
    evidenciaExiste: [...rutas.values()].filter(Boolean).length,
    evidenciaTotal: rutas.size,
  };
}

export const MATRIZ = construirMatriz();
export const RESUMEN_TRAZA = resumirMatriz(MATRIZ);

/** Notebooks que pasan todas las comprobaciones de la DoD (verificar_dod.py → gestion.json → dod). */
const CHEQUEOS_DOD = Object.values((G.dod as { notebooks?: Record<string, Record<string, boolean>> }).notebooks ?? {});
export const DOD_NOTEBOOKS = { ok: CHEQUEOS_DOD.filter((c) => Object.values(c).every(Boolean)).length, total: CHEQUEOS_DOD.length };

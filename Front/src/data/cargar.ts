/**
 * Carga única y cacheada del paquete de corrida.
 *
 * - `public/run/*`: activos pesados (nube PCA, notebooks, figuras, CSV) → `cargarRun()` con fetch relativo
 *   a `import.meta.env.BASE_URL`. Cada ruta se pide UNA sola vez: el Map guarda la promesa.
 * - `src/data/generated/*.json` opcionales (notebooks.json, resultados_*.json, dod_status.json…) →
 *   `cargarGenerado()`: import dinámico vía `import.meta.glob`, así un archivo que aún no existe
 *   no rompe el build y devuelve `null` (estado "falta").
 * - `useRecurso()` / `useGenerado()`: hooks con estados `cargando | listo | falta | error`.
 *
 * Nunca se hace una petición fuera del propio origen.
 */
import { useEffect, useState } from "react";

export type EstadoCarga = "cargando" | "listo" | "falta" | "error";
export interface Recurso<T> {
  estado: EstadoCarga;
  datos: T | null;
  error?: string;
}

const cache = new Map<string, Promise<unknown>>();
const resueltos = new Map<string, unknown>();

/** URL absoluta (mismo origen) de un archivo de public/run. */
export function urlRun(ruta: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}run/${ruta.replace(/^\/+/, "")}`;
}

class Faltante extends Error {
  constructor(ruta: string) {
    super(`No existe en el paquete de corrida: ${ruta}`);
    this.name = "Faltante";
  }
}

async function pedir(ruta: string, como: "json" | "texto"): Promise<unknown> {
  const r = await fetch(urlRun(ruta), { credentials: "same-origin" });
  if (r.status === 404) throw new Faltante(ruta);
  if (!r.ok) throw new Error(`HTTP ${r.status} al cargar ${ruta}`);
  const tipo = r.headers.get("content-type") ?? "";
  // El fallback SPA de algunos servidores devuelve index.html con 200 para rutas inexistentes.
  if (como === "json" && tipo.includes("text/html")) throw new Faltante(ruta);
  return como === "json" ? r.json() : r.text();
}

/** Carga (una sola vez) un JSON de public/run. Lanza `Faltante` si no existe. */
export function cargarRun<T>(ruta: string): Promise<T> {
  const clave = `json:${ruta}`;
  let p = cache.get(clave);
  if (!p) {
    p = pedir(ruta, "json").then((d) => {
      resueltos.set(clave, d);
      return d;
    });
    p.catch(() => cache.delete(clave)); // un fallo no queda cacheado
    cache.set(clave, p);
  }
  return p as Promise<T>;
}

/** Carga (una sola vez) un archivo de texto de public/run (p. ej. CSV). */
export function cargarTextoRun(ruta: string): Promise<string> {
  const clave = `txt:${ruta}`;
  let p = cache.get(clave);
  if (!p) {
    p = pedir(ruta, "texto").then((d) => {
      resueltos.set(clave, d);
      return d;
    });
    p.catch(() => cache.delete(clave));
    cache.set(clave, p);
  }
  return p as Promise<string>;
}

/** Valor ya resuelto en caché (sin esperar), útil para render síncrono tras la primera carga. */
export function enCache<T>(ruta: string): T | undefined {
  return resueltos.get(`json:${ruta}`) as T | undefined;
}

/* ------------------------------------------------------------------ */
/* JSON opcionales de src/data/generated                               */
/* ------------------------------------------------------------------ */
const generados = import.meta.glob<{ default: unknown }>("./generated/*.json");

/** Nombres disponibles en src/data/generated (sin extensión). */
export const generadosDisponibles = Object.keys(generados).map((k) => k.replace("./generated/", "").replace(/\.json$/, ""));

/** Import dinámico de `src/data/generated/<nombre>.json`; `null` si el archivo no existe. */
export function cargarGenerado<T>(nombre: string): Promise<T | null> {
  const clave = `gen:${nombre}`;
  let p = cache.get(clave);
  if (!p) {
    const loader = generados[`./generated/${nombre}.json`];
    p = loader ? loader().then((m) => {
      resueltos.set(clave, m.default);
      return m.default;
    }) : Promise.resolve(null);
    cache.set(clave, p);
  }
  return p as Promise<T | null>;
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */
function useCarga<T>(clave: string | null, cargar: () => Promise<T | null>): Recurso<T> {
  const inicial = clave ? (resueltos.get(clave) as T | undefined) : undefined;
  const [r, setR] = useState<Recurso<T>>(
    inicial !== undefined ? { estado: "listo", datos: inicial } : { estado: clave ? "cargando" : "falta", datos: null },
  );
  useEffect(() => {
    if (!clave) {
      setR({ estado: "falta", datos: null });
      return;
    }
    const ya = resueltos.get(clave) as T | undefined;
    if (ya !== undefined) {
      setR({ estado: "listo", datos: ya });
      return;
    }
    let vivo = true;
    setR({ estado: "cargando", datos: null });
    cargar()
      .then((d) => vivo && setR(d == null ? { estado: "falta", datos: null } : { estado: "listo", datos: d }))
      .catch((e: Error) => vivo && setR({ estado: e.name === "Faltante" ? "falta" : "error", datos: null, error: e.message }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return r;
}

/** Hook para un JSON de public/run (p. ej. "nube_pca.json", "notebooks/05.json", "figuras.json"). */
export function useRecurso<T>(ruta: string | null): Recurso<T> {
  return useCarga<T>(ruta ? `json:${ruta}` : null, () => cargarRun<T>(ruta as string));
}

/** Hook para un JSON opcional de src/data/generated (p. ej. "dod_status", "resultados_clasicos"). */
export function useGenerado<T>(nombre: string | null): Recurso<T> {
  return useCarga<T>(nombre ? `gen:${nombre}` : null, () => cargarGenerado<T>(nombre as string));
}

/** Solo para pruebas. */
export function _limpiarCache() {
  cache.clear();
  resueltos.clear();
}

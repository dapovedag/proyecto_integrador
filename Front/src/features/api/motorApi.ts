/**
 * Réplica en el navegador de la API (FastAPI) con los motores exactos: misma forma JSON, mismos códigos y
 * mismo formato de error 422. /health y /model/info devuelven las capturas reales.
 */
import capturasJson from "@/data/generated/api_capturas.json";
import modeloJson from "@/data/generated/modelo_export.json";
import textoJson from "@/data/generated/texto_export.json";
import { predecir, type Cliente, type ModeloExport } from "@/engine/scoring";
import { crearMotorTexto, type TextoExport } from "@/engine/texto";
import type { ApiCapturas, CapturaApi } from "@/data/tipos";
import { ESQUEMA_CLIENTE, ESQUEMA_TEXTO, validar, type ErrorValidacion } from "./validacion";

export const CAPTURAS = capturasJson as unknown as ApiCapturas;
export const MODELO = modeloJson as unknown as ModeloExport;
let motorTexto: ReturnType<typeof crearMotorTexto> | null = null;
export function motorDeTexto() {
  return (motorTexto ??= crearMotorTexto(textoJson as unknown as TextoExport));
}

export interface RespuestaApi {
  estado: number;
  cuerpo: unknown;
  latencia_ms: number;
  request_id: string;
}

/** Latencia real de referencia (mediana de las capturas del mismo endpoint y código). */
export function latenciaReal(ruta: string, estado: number): number {
  const xs = CAPTURAS.llamadas.filter((c) => c.ruta === ruta && c.estado === estado).map((c) => c.latencia_ms);
  const ys = xs.length ? xs : CAPTURAS.llamadas.filter((c) => c.estado === estado).map((c) => c.latencia_ms);
  if (!ys.length) return 10;
  const o = [...ys].sort((a, b) => a - b);
  return o[Math.floor((o.length - 1) / 2)];
}

/** X-Request-ID como el middleware: 12 hex aleatorios. */
export function nuevoRequestId(): string {
  const b = new Uint8Array(6);
  globalThis.crypto?.getRandomValues?.(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function captura(nombre: string): CapturaApi | undefined {
  return CAPTURAS.llamadas.find((c) => c.nombre === nombre);
}

function error422(detail: ErrorValidacion[]) {
  return { estado: 422, cuerpo: { detail } };
}

/** Respuesta (estado + cuerpo) que daría la API para una petición. */
export function responder(metodo: "GET" | "POST", ruta: string, cuerpo?: unknown): { estado: number; cuerpo: unknown } {
  if (metodo === "GET" && ruta === "/health") return { estado: 200, cuerpo: captura("health")?.respuesta };
  if (metodo === "GET" && ruta === "/model/info") return { estado: 200, cuerpo: captura("model_info")?.respuesta };
  if (metodo === "POST" && ruta === "/predict") {
    const v = validar<Cliente>(cuerpo, ESQUEMA_CLIENTE);
    if (!v.ok) return error422(v.detail);
    return { estado: 200, cuerpo: predecir(v.valor, MODELO) };
  }
  if (metodo === "POST" && ruta === "/predict/text") {
    const v = validar<{ texto: string }>(cuerpo, ESQUEMA_TEXTO);
    if (!v.ok) return error422(v.detail);
    return { estado: 200, cuerpo: motorDeTexto().predecir(v.valor.texto) };
  }
  if (metodo === "POST" && ruta === "/predict/batch") {
    const c = cuerpo as { clientes?: unknown };
    if (!c || typeof c !== "object" || !Array.isArray(c.clientes)) {
      return error422([{ type: "missing", loc: ["body", "clientes"], msg: "Field required", input: cuerpo }]);
    }
    const detail: ErrorValidacion[] = [];
    const ok: Cliente[] = [];
    c.clientes.forEach((x, i) => {
      const v = validar<Cliente>(x, ESQUEMA_CLIENTE);
      if (v.ok) ok.push(v.valor);
      else detail.push(...v.detail.map(({ loc, ...d }) => ({ type: d.type, loc: ["body", "clientes", i, ...loc.slice(1)], msg: d.msg, input: d.input, ...(d.ctx ? { ctx: d.ctx } : {}) })));
    });
    if (detail.length) return error422(detail);
    return { estado: 200, cuerpo: { resultados: ok.map((x) => predecir(x, MODELO)) } };
  }
  return { estado: 404, cuerpo: { detail: "Not Found" } };
}

/** Cuerpo JSON en texto → respuesta (incluye el 422 `json_invalid` de FastAPI si el JSON no es válido). */
export function responderTexto(metodo: "GET" | "POST", ruta: string, texto: string): { estado: number; cuerpo: unknown } {
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch (e) {
    const pos = Number(/position (\d+)/.exec(String((e as Error).message))?.[1] ?? 0);
    return error422([{ type: "json_invalid", loc: ["body", pos], msg: "JSON decode error", input: {}, ctx: { error: "Expecting value" } }]);
  }
  return responder(metodo, ruta, cuerpo);
}

export const TEXTO_ESTADO: Record<number, string> = { 200: "OK", 404: "Not Found", 422: "Unprocessable Entity", 503: "Service Unavailable" };

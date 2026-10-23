/**
 * Validación cliente idéntica a la de la API (Pydantic v2 + FastAPI), a partir de los esquemas JSON exportados
 * (`src/data/schemas/ClienteRequest.schema.json` y `openapi.components.schemas`).
 *
 * Reproduce el modo "lax" de Pydantic (cadenas numéricas → número, 42.0 → 42), `extra="forbid"` y el
 * formato de error de FastAPI: `{ detail: [{ type, loc: ["body", campo], msg, input, ctx? }] }`, en el orden
 * de declaración de los campos y con los campos sobrantes al final.
 */
import esquemaCliente from "@/data/schemas/ClienteRequest.schema.json";

export interface ErrorValidacion {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: unknown;
  ctx?: Record<string, unknown>;
}

interface Prop {
  type?: "integer" | "number" | "string" | "boolean" | "null";
  enum?: (string | number)[];
  anyOf?: Prop[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: unknown;
  title?: string;
  description?: string;
}

export interface EsquemaObjeto {
  properties: Record<string, Prop>;
  required?: string[];
  additionalProperties?: boolean;
  title?: string;
}

export const ESQUEMA_CLIENTE = esquemaCliente as unknown as EsquemaObjeto;
export const ESQUEMA_TEXTO: EsquemaObjeto = {
  properties: { texto: { type: "string", maxLength: 5000, minLength: 1, title: "Texto" } },
  additionalProperties: false,
  required: ["texto"],
  title: "TextoRequest",
};

/** Mismo orden de claves que FastAPI: type, loc, msg, input, ctx. */
function conLoc(e: Omit<ErrorValidacion, "loc">, loc: (string | number)[]): ErrorValidacion {
  return { type: e.type, loc, msg: e.msg, input: e.input, ...(e.ctx ? { ctx: e.ctx } : {}) };
}

/** repr() de Python para los valores de ctx en los mensajes. */
function repr(v: unknown): string {
  if (typeof v === "string") return `'${v}'`;
  return String(v);
}

/** "'A', 'B' or 'C'" como en pydantic_core. */
export function esperados(opciones: (string | number)[]): string {
  const r = opciones.map(repr);
  return r.length <= 1 ? r.join("") : `${r.slice(0, -1).join(", ")} or ${r[r.length - 1]}`;
}

const esNumeroTexto = (s: string) => /^\s*[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?\s*$/.test(s);

/** Valida un campo; devuelve el valor coaccionado o un error (sin loc). */
function validarCampo(p: Prop, v: unknown): { ok: true; valor: unknown } | { ok: false; error: Omit<ErrorValidacion, "loc"> } {
  // Optional[...] = anyOf [X, null]
  if (p.anyOf) {
    if (v === null) return { ok: true, valor: null };
    const base = p.anyOf.find((x) => x.type !== "null") ?? {};
    return validarCampo(base, v);
  }
  if (p.enum) {
    if (typeof v === "string" && p.enum.includes(v)) return { ok: true, valor: v };
    const exp = esperados(p.enum);
    return { ok: false, error: { type: "literal_error", msg: `Input should be ${exp}`, input: v, ctx: { expected: exp } } };
  }
  let x: number;
  switch (p.type) {
    case "integer": {
      if (typeof v === "number") {
        if (!Number.isFinite(v)) return { ok: false, error: { type: "finite_number", msg: "Input should be a finite number", input: v } };
        if (!Number.isInteger(v)) return { ok: false, error: { type: "int_from_float", msg: "Input should be a valid integer, got a number with a fractional part", input: v } };
        x = v;
      } else if (typeof v === "boolean") {
        x = v ? 1 : 0;
      } else if (typeof v === "string") {
        if (!/^\s*[-+]?\d+\s*$/.test(v)) {
          if (esNumeroTexto(v) && Number.isInteger(Number(v))) x = Number(v);
          else return { ok: false, error: { type: "int_parsing", msg: "Input should be a valid integer, unable to parse string as an integer", input: v } };
        } else x = Number(v);
      } else return { ok: false, error: { type: "int_type", msg: "Input should be a valid integer", input: v } };
      break;
    }
    case "number": {
      if (typeof v === "number") x = v;
      else if (typeof v === "boolean") x = v ? 1 : 0;
      else if (typeof v === "string") {
        if (!esNumeroTexto(v)) return { ok: false, error: { type: "float_parsing", msg: "Input should be a valid number, unable to parse string as a number", input: v } };
        x = Number(v);
      } else return { ok: false, error: { type: "float_type", msg: "Input should be a valid number", input: v } };
      if (!Number.isFinite(x)) return { ok: false, error: { type: "finite_number", msg: "Input should be a finite number", input: v } };
      break;
    }
    case "string": {
      if (typeof v !== "string") return { ok: false, error: { type: "string_type", msg: "Input should be a valid string", input: v } };
      if (p.minLength != null && v.length < p.minLength)
        return {
          ok: false,
          error: { type: "string_too_short", msg: `String should have at least ${p.minLength} character${p.minLength === 1 ? "" : "s"}`, input: v, ctx: { min_length: p.minLength } },
        };
      if (p.maxLength != null && v.length > p.maxLength)
        return {
          ok: false,
          error: { type: "string_too_long", msg: `String should have at most ${p.maxLength} character${p.maxLength === 1 ? "" : "s"}`, input: v, ctx: { max_length: p.maxLength } },
        };
      return { ok: true, valor: v };
    }
    default:
      return { ok: true, valor: v };
  }
  if (p.exclusiveMinimum != null && !(x > p.exclusiveMinimum))
    return { ok: false, error: { type: "greater_than", msg: `Input should be greater than ${p.exclusiveMinimum}`, input: v, ctx: { gt: p.exclusiveMinimum } } };
  if (p.minimum != null && !(x >= p.minimum))
    return { ok: false, error: { type: "greater_than_equal", msg: `Input should be greater than or equal to ${p.minimum}`, input: v, ctx: { ge: p.minimum } } };
  if (p.exclusiveMaximum != null && !(x < p.exclusiveMaximum))
    return { ok: false, error: { type: "less_than", msg: `Input should be less than ${p.exclusiveMaximum}`, input: v, ctx: { lt: p.exclusiveMaximum } } };
  if (p.maximum != null && !(x <= p.maximum))
    return { ok: false, error: { type: "less_than_equal", msg: `Input should be less than or equal to ${p.maximum}`, input: v, ctx: { le: p.maximum } } };
  return { ok: true, valor: x };
}

export type ResultadoValidacion<T = Record<string, unknown>> = { ok: true; valor: T } | { ok: false; detail: ErrorValidacion[] };

/** Valida un cuerpo JSON contra el esquema (como FastAPI con un modelo Pydantic `extra="forbid"`). */
export function validar<T = Record<string, unknown>>(cuerpo: unknown, esquema: EsquemaObjeto = ESQUEMA_CLIENTE): ResultadoValidacion<T> {
  if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    return {
      ok: false,
      detail: [{ type: "model_attributes_type", loc: ["body"], msg: "Input should be a valid dictionary or object to extract fields from", input: cuerpo }],
    };
  }
  const obj = cuerpo as Record<string, unknown>;
  const req = new Set(esquema.required ?? []);
  const detail: ErrorValidacion[] = [];
  const valor: Record<string, unknown> = {};
  for (const [campo, p] of Object.entries(esquema.properties)) {
    if (!(campo in obj) || obj[campo] === undefined) {
      if (req.has(campo)) detail.push({ type: "missing", loc: ["body", campo], msg: "Field required", input: obj });
      else valor[campo] = p.default ?? null;
      continue;
    }
    const r = validarCampo(p, obj[campo]);
    if (r.ok) valor[campo] = r.valor;
    else detail.push(conLoc(r.error, ["body", campo]));
  }
  if (esquema.additionalProperties === false) {
    for (const k of Object.keys(obj)) {
      if (!(k in esquema.properties)) detail.push({ type: "extra_forbidden", loc: ["body", k], msg: "Extra inputs are not permitted", input: obj[k] });
    }
  }
  return detail.length ? { ok: false, detail } : { ok: true, valor: valor as T };
}

/** Error de un campo concreto (para validación inline en formularios). */
export function errorDeCampo(campo: string, valor: unknown, esquema: EsquemaObjeto = ESQUEMA_CLIENTE): ErrorValidacion | null {
  const p = esquema.properties[campo];
  if (!p) return null;
  if (valor === undefined || valor === "") {
    return (esquema.required ?? []).includes(campo) ? { type: "missing", loc: ["body", campo], msg: "Field required", input: valor } : null;
  }
  const r = validarCampo(p, valor);
  return r.ok ? null : conLoc(r.error, ["body", campo]);
}

/** Traducción legible (es-CO) de un error Pydantic para la UI; el JSON conserva el mensaje original. */
export function mensajeEs(e: ErrorValidacion): string {
  const c = e.ctx ?? {};
  switch (e.type) {
    case "missing":
      return "Campo obligatorio";
    case "less_than_equal":
      return `Debe ser menor o igual a ${c.le}`;
    case "greater_than_equal":
      return `Debe ser mayor o igual a ${c.ge}`;
    case "greater_than":
      return `Debe ser mayor que ${c.gt}`;
    case "less_than":
      return `Debe ser menor que ${c.lt}`;
    case "literal_error":
      return `Valor no permitido; opciones: ${String(c.expected ?? "")}`;
    case "int_from_float":
      return "Debe ser un número entero";
    case "int_parsing":
    case "int_type":
      return "Debe ser un número entero";
    case "float_parsing":
    case "float_type":
      return "Debe ser un número";
    case "string_too_long":
      return `Máximo ${c.max_length} caracteres`;
    case "string_too_short":
      return `Mínimo ${c.min_length} carácter`;
    case "extra_forbidden":
      return "Campo no permitido por el contrato";
    default:
      return e.msg;
  }
}

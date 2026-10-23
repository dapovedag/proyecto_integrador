import { describe, expect, it } from "vitest";
import demos from "@/data/generated/clientes_demo.json";
import { CAPTURAS, responder, responderTexto } from "./motorApi";
import { ESQUEMA_TEXTO, validar } from "./validacion";

const captura = (n: string) => CAPTURAS.llamadas.find((c) => c.nombre === n)!;

describe("validación idéntica a Pydantic/FastAPI (422)", () => {
  it("edad=999 y proposito='Viajes' → el mismo detail que la captura real", () => {
    const real = captura("predict_422");
    const r = responder("POST", "/predict", real.peticion);
    expect(r.estado).toBe(422);
    expect(r.cuerpo).toEqual(real.respuesta);
  });

  it("edad=999 sola → less_than_equal con ctx {le: 100}", () => {
    const r = validar({ ...demos.medio, edad: 999 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.detail).toEqual([
        { type: "less_than_equal", loc: ["body", "edad"], msg: "Input should be less than or equal to 100", input: 999, ctx: { le: 100 } },
      ]);
    }
  });

  it("proposito='Viajes' → literal_error con las opciones del contrato", () => {
    const r = validar({ ...demos.medio, proposito: "Viajes" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.detail[0].type).toBe("literal_error");
      expect(r.detail[0].loc).toEqual(["body", "proposito"]);
      expect(r.detail[0].msg).toBe("Input should be 'Libre_inversion', 'Vehiculo', 'Consolidacion_deuda', 'Vivienda', 'Negocio' or 'Educacion'");
    }
  });

  it("campo extra → extra_forbidden al final (extra='forbid')", () => {
    const r = responder("POST", "/predict", { ...demos.medio, edad: 17, ingreso_extra: 1 });
    expect(r.estado).toBe(422);
    const d = (r.cuerpo as { detail: { type: string; loc: unknown[]; msg: string; input: unknown }[] }).detail;
    expect(d.map((x) => x.type)).toEqual(["greater_than_equal", "extra_forbidden"]);
    expect(d[1]).toEqual({ type: "extra_forbidden", loc: ["body", "ingreso_extra"], msg: "Extra inputs are not permitted", input: 1 });
  });

  it("campo obligatorio ausente → missing; opcional ausente → null", () => {
    const { edad: _e, ...sinEdad } = demos.medio;
    const r = validar(sinEdad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.detail[0]).toMatchObject({ type: "missing", loc: ["body", "edad"], msg: "Field required" });
    const { puntaje_buro: _p, ...sinBuro } = demos.medio;
    const r2 = validar(sinBuro);
    expect(r2.ok && r2.valor.puntaje_buro).toBe(null);
  });

  it("modo lax: '42' → 42; 33.5 en un entero → int_from_float", () => {
    const r = validar({ ...demos.medio, edad: "42" });
    expect(r.ok && r.valor.edad).toBe(42);
    const r2 = validar({ ...demos.medio, edad: 33.5 });
    expect(!r2.ok && r2.detail[0].type).toBe("int_from_float");
  });

  it("/predict/text: texto vacío → string_too_short; JSON mal formado → json_invalid", () => {
    const r = validar({ texto: "" }, ESQUEMA_TEXTO);
    expect(!r.ok && r.detail[0]).toMatchObject({ type: "string_too_short", ctx: { min_length: 1 } });
    const j = responderTexto("POST", "/predict", "{ edad: 3");
    expect(j.estado).toBe(422);
    expect((j.cuerpo as { detail: { type: string }[] }).detail[0].type).toBe("json_invalid");
  });
});

describe("respuestas 200 con la misma forma que la API", () => {
  for (const n of ["predict_bajo", "predict_medio", "predict_alto", "predict_text", "health", "model_info"]) {
    it(`${n} coincide con la captura real`, () => {
      const c = captura(n);
      const r = responder(c.metodo, c.ruta, c.peticion ?? undefined);
      expect(r.estado).toBe(c.estado);
      expect(r.cuerpo).toEqual(c.respuesta);
    });
  }
});

/**
 * Paridad golden: el motor TS debe reproducir las predicciones de Python (|Δp| < 1e-6) sobre ~300 clientes
 * de test (60 con faltantes), los 3 clientes demo y 50 textos. Si falla, el build no se publica.
 */
import golden from "@/data/generated/golden.json";
import modelo from "@/data/generated/modelo_export.json";
import texto from "@/data/generated/texto_export.json";
import { describe, expect, it } from "vitest";
import { detallar, predecir, type Cliente, type ModeloExport } from "./scoring";
import { crearMotorTexto, type TextoExport } from "./texto";

const M = modelo as unknown as ModeloExport;
const T = texto as unknown as TextoExport;
type CasoCliente = { entrada: Cliente; p: number; salida: ReturnType<typeof predecir> };
type CasoTexto = { texto: string; p: number; salida: { probabilidad_impago_texto: number; banda_riesgo: string; sentimiento: string } };

describe("motor de scoring (paridad con Python)", () => {
  const casos = (golden as { clientes: CasoCliente[] }).clientes;

  it("tiene casos golden suficientes", () => {
    expect(casos.length).toBeGreaterThanOrEqual(300);
  });

  it("reproduce la probabilidad calibrada con |Δ| < 1e-6", () => {
    const peor = Math.max(...casos.map((c) => Math.abs(detallar(c.entrada, M).p - c.p)));
    expect(peor).toBeLessThan(1e-6);
  });

  it("reproduce decisión, banda, etiqueta y factores", () => {
    for (const c of casos) {
      const r = predecir(c.entrada, M);
      expect(r.decision).toBe(c.salida.decision);
      expect(r.banda_riesgo).toBe(c.salida.banda_riesgo);
      expect(r.etiqueta).toBe(c.salida.etiqueta);
      expect(r.factores_principales.map((f) => f.variable)).toEqual(c.salida.factores_principales.map((f) => f.variable));
      r.factores_principales.forEach((f, i) => expect(Math.abs(f.contribucion - c.salida.factores_principales[i].contribucion)).toBeLessThan(1.5e-4));
    }
  });

  it("las contribuciones suman exactamente el logit calibrado", () => {
    for (const c of casos.slice(0, 50)) {
      const d = detallar(c.entrada, M);
      const suma = M.explicador.base_logit + d.contribuciones.reduce((s, f) => s + f.contribucion, 0);
      expect(Math.abs(suma - d.logit)).toBeLessThan(1e-9);
    }
  });
});

describe("motor de texto (paridad con Python)", () => {
  const motor = crearMotorTexto(T);
  const casos = (golden as { textos: CasoTexto[] }).textos;

  it("reproduce la probabilidad por texto con |Δ| < 1e-6", () => {
    const peor = Math.max(...casos.map((c) => Math.abs(motor.detallar(c.texto).p - c.p)));
    expect(peor).toBeLessThan(1e-6);
  });

  it("reproduce banda y sentimiento", () => {
    for (const c of casos) {
      const r = motor.predecir(c.texto);
      expect(r.banda_riesgo).toBe(c.salida.banda_riesgo);
      expect(r.sentimiento).toBe(c.salida.sentimiento);
    }
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import agregados from "@/data/generated/agregados.json";
import { conteos, parsearCsv, perfilar } from "./perfil";

const leer = (n: string) => readFileSync(resolve(process.cwd(), "public/run/data", n), "utf-8");

describe("DataExplorer: conteos del CSV crudo = agregados.json (DuckDB)", () => {
  const tabla = parsearCsv(leer("credit_risk.csv"));
  const c = conteos(tabla);

  it("filas, ids únicos y tasa de impago", () => {
    expect(c.filas).toBe(agregados.resumen.filas);
    expect(c.ids_unicos).toBe(agregados.resumen.ids_unicos);
    expect(Math.abs(c.tasa_impago - agregados.resumen.tasa_impago)).toBeLessThan(1e-9);
  });

  it("nulos por columna", () => {
    expect(c.nulos).toEqual(agregados.nulos_crudo);
  });

  it("perfil numérico y categórico", () => {
    const j = tabla.columnas.indexOf("puntaje_buro");
    const p = perfilar(tabla, j);
    expect(p.tipo).toBe("numerico");
    expect(p.nulos).toBe(agregados.nulos_crudo.puntaje_buro);
    expect(p.histograma!.conteos.reduce((s, x) => s + x, 0)).toBe(c.filas - p.nulos);
    const k = tabla.columnas.indexOf("proposito");
    const q = perfilar(tabla, k);
    expect(q.tipo).toBe("categorico");
    expect(q.frecuencias!.reduce((s, f) => s + f.n, 0)).toBe(c.filas - q.nulos);
  });

  it("train y test tienen las particiones del model card", () => {
    expect(parsearCsv(leer("train.csv")).filas.length).toBe(9600);
    expect(parsearCsv(leer("test.csv")).filas.length).toBe(2400);
  });
});

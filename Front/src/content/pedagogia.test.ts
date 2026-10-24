/**
 * Capa pedagógica: glosario completo y coherente con el catálogo, anotaciones que apuntan a la celda correcta
 * de cada notebook (y las cubren todas), recorridos completos, guía «¿Cómo leer?» para cada tipo de figura,
 * explicador de código y cifras de la Presentación Negocio.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import card from "@/data/generated/model_card.json";
import type { FiguraSpec } from "@/data/tipos";
import { explicarCelda } from "@/features/notebook/explicador";
import { ESCENARIOS } from "@/pages/Negocio";
import { CARGAR_ANOTACIONES } from "./anotaciones";
import { comoLeerFigura } from "./comoLeer";
import { GLOSARIO, POR_ID, entradaPorAlias } from "./glosario";
import { CATALOGO_GLOSARIO, IDS_GLOSARIO } from "./pedagogia";
import { RECORRIDOS } from "./recorridos";

const leer = <T,>(ruta: string) => JSON.parse(readFileSync(resolve(process.cwd(), ruta), "utf-8")) as T;
const FIGURAS = leer<FiguraSpec[]>("public/run/figuras.json");
const PROHIBIDAS = /limitaci|no concluyente|\bdébil|\bcota\b/i;

describe("glosario", () => {
  it("una entrada por cada id del catálogo, con su término y categoría", () => {
    expect(GLOSARIO.length).toBe(IDS_GLOSARIO.length);
    expect(new Set(GLOSARIO.map((e) => e.id)).size).toBe(GLOSARIO.length);
    for (const e of GLOSARIO) {
      const c = CATALOGO_GLOSARIO[e.id];
      expect(c, `id fuera del catálogo: ${e.id}`).toBeDefined();
      expect(e.termino).toBe(c.termino);
      expect(e.categoria).toBe(c.categoria);
      expect(e.corto.length, `corto largo: ${e.id}`).toBeLessThanOrEqual(160);
      expect(e.queEs && e.paraQue && e.enEsteProyecto, `campos vacíos: ${e.id}`).toBeTruthy();
    }
  });

  it("los alias resuelven al término esperado", () => {
    expect(entradaPorAlias("pandas")?.id).toBe("pandas");
    expect(entradaPorAlias("StandardScaler")?.id).toBe("escalado");
    expect(entradaPorAlias("train_test_split")?.id).toBe("train_test");
  });

  it("sin lenguaje de limitaciones", () => {
    for (const e of GLOSARIO) expect(`${e.queEs} ${e.paraQue} ${e.comoSeLee ?? ""} ${e.enEsteProyecto}`, e.id).not.toMatch(PROHIBIDAS);
  });
});

describe("anotaciones de los notebooks", () => {
  for (const nb of Object.keys(CARGAR_ANOTACIONES)) {
    it(`nb${nb}: una anotación por celda de código, con su primera línea`, async () => {
      const datos = leer<{ celdas: { tipo: string; fuente: string }[] }>(`public/run/notebooks/${nb}.json`);
      const anot = await CARGAR_ANOTACIONES[nb]();
      const codigo = datos.celdas.flatMap((c, j) => (c.tipo === "codigo" ? [j] : []));
      expect(Object.keys(anot).map(Number).sort((a, b) => a - b)).toEqual(codigo);
      for (const j of codigo) {
        const primera = datos.celdas[j].fuente.split("\n").find((l) => l.trim())?.trimEnd();
        expect(anot[j].primeraLinea.trimEnd(), `nb${nb} celda ${j}`).toBe(primera);
        for (const c of anot[j].conceptos) expect(POR_ID.has(c), `nb${nb}:${j} concepto ${c}`).toBe(true);
        expect(`${anot[j].que} ${anot[j].porque}`).not.toMatch(PROHIBIDAS);
      }
    });
  }
});

describe("recorridos por capítulo", () => {
  it("los 11 capítulos tienen objetivos, conceptos válidos y 3 preguntas de repaso", () => {
    expect(Object.keys(RECORRIDOS).length).toBe(11);
    for (const [n, r] of Object.entries(RECORRIDOS)) {
      expect(r.objetivos.length, `cap ${n}`).toBeGreaterThanOrEqual(3);
      expect(r.repaso.length, `cap ${n}`).toBe(3);
      for (const c of r.conceptos) expect(POR_ID.has(c), `cap ${n} concepto ${c}`).toBe(true);
      expect(`${r.aprendizaje.conceptual} ${r.aprendizaje.practico}`).not.toMatch(PROHIBIDAS);
    }
  });
});

describe("¿Cómo leer este gráfico?", () => {
  it("cada figura del paquete tiene su guía y los conceptos existen", () => {
    for (const f of FIGURAS) {
      const g = comoLeerFigura(f);
      expect(g, `sin guía: ${f.tipo} ${f.clave}`).not.toBeNull();
      if (g?.concepto) expect(POR_ID.has(g.concepto), g.concepto).toBe(true);
    }
    expect(comoLeerFigura({ tipo: "lineas", clave: "aprendizaje_mlp" })?.nombre).toBe("Curva de aprendizaje");
  });
});

describe("explicador de código", () => {
  it("explica imports, from-import y llamadas conocidas", () => {
    const l = explicarCelda("import pandas as pd\nfrom sklearn.model_selection import train_test_split, cross_validate\n\nX_tr, X_te = train_test_split(X, test_size=0.2)\n# nota\nmodelo.fit(X_tr, y_tr)");
    expect(l[0].texto).toMatch(/pandas.*pd/);
    expect(l[0].conceptos).toContain("pandas");
    expect(l[1].texto).toMatch(/sklearn\.model_selection.*train_test_split, cross_validate/);
    expect(l[2].texto).toBeNull();
    expect(l[3].texto).toMatch(/entrenamiento y prueba/);
    expect(l[4].texto).toMatch(/Comentario/);
    expect(l[5].texto).toMatch(/entrena/);
    expect(explicarCelda("x = 1", { 1: "manual" })[0].texto).toBe("manual");
  });
});

describe("Presentación Negocio", () => {
  it("los escenarios de referencia salen de la misma fórmula de costos", () => {
    expect(ESCENARIOS.aprobarTodos).toBeCloseTo(card.datos.tasa_default_test * card.costos.lgd_fn, 10);
    expect(ESCENARIOS.aprobarTodos).toBeCloseTo(0.1601, 3);
    expect(ESCENARIOS.rechazarTodos).toBeCloseTo(0.0966, 3);
    expect(ESCENARIOS.modelo).toBe(card.decision_test.costo_medio);
    expect(ESCENARIOS.modelo).toBeLessThan(ESCENARIOS.rechazarTodos);
  });
});

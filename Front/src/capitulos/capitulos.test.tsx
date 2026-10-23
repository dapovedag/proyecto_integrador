/**
 * Mapeo de capítulos: cada paso 1–11 tiene contenido (cargador + componente) y todas sus figuras clave
 * existen en public/run/figuras.json para el notebook indicado.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { PASOS } from "@/content/pasos";
import type { FiguraSpec } from "@/data/tipos";
import { CARGADORES } from "@/pages/Paso";
import { buscarFigura, conLectura, parseRef } from "./figuras";
import { CAPITULOS } from "./mapa";

// jsdom no trae IntersectionObserver (lo usan Revelar/Kpi vía framer-motion).
beforeAll(() => {
  if (!("IntersectionObserver" in globalThis)) {
    class IO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  }
});

const FIGURAS = JSON.parse(readFileSync(resolve(process.cwd(), "public/run/figuras.json"), "utf-8")) as FiguraSpec[];

describe("mapa de capítulos", () => {
  it("cubre los pasos 1 a 11 con notebook y cargador", () => {
    for (let n = 1; n <= 11; n++) {
      expect(CAPITULOS[n], `paso ${n}`).toBeDefined();
      expect(typeof CARGADORES[n], `cargador del paso ${n}`).toBe("function");
      const paso = PASOS.find((p) => p.n === n)!;
      // el notebook del capítulo coincide con el de pasos.ts (10 no tiene: es la API)
      expect(CAPITULOS[n].nb).toBe(paso.notebook);
    }
  });

  it("todas las figuras clave existen en figuras.json", () => {
    const faltan: string[] = [];
    for (const [n, def] of Object.entries(CAPITULOS)) {
      for (const ref of Object.values(def.figuras)) {
        const r = parseRef(ref, def.nb);
        if (!buscarFigura(FIGURAS, r.nb, r.clave)) faltan.push(`paso ${n} → nb${r.nb}:${r.clave}`);
      }
    }
    expect(faltan).toEqual([]);
  });

  it("los pasos con notebook propio tienen al menos 4 figuras clave (salvo el integrador)", () => {
    for (let n = 1; n <= 9; n++) expect(Object.keys(CAPITULOS[n].figuras).length, `paso ${n}`).toBeGreaterThanOrEqual(4);
    expect(PASOS.find((p) => p.n === 5)!.figurasClave).toContain("roc_clasicos");
  });

  it("conLectura añade la lectura editorial sin perder el identificador", () => {
    const spec = buscarFigura(FIGURAS, "05", "roc_clasicos")!;
    const c = conLectura(spec, "Lectura de prueba");
    expect(c.lectura).toBe("Lectura de prueba");
    expect(c.id).toBe("05:roc_clasicos");
    expect(c.datos).toBe(spec.datos);
  });

  it("cada capítulo exporta un componente", async () => {
    for (const n of Object.keys(CARGADORES)) {
      const m = await CARGADORES[Number(n)]();
      expect(typeof m.default, `capítulo ${n}`).toBe("function");
    }
  }, 60_000);

  it("el capítulo 5 muestra el ranking y la tabla comparativa con cifras reales", async () => {
    const { default: Capitulo05 } = await CARGADORES[5]();
    render(
      <MemoryRouter initialEntries={["/paso/5"]}>
        <Capitulo05 />
      </MemoryRouter>,
    );
    expect(screen.getByRole("table", { name: /Ranking de modelos clásicos/ })).toBeInTheDocument();
    expect(screen.getAllByText("0,8578").length).toBeGreaterThan(0);
    expect(screen.getByText("Hallazgos clave")).toBeInTheDocument();
  }, 30_000);
});

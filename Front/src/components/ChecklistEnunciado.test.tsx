/** Checklist de la portada: 47 ítems calculados desde gestion.json, todos marcados y con su evidencia. */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import gestion from "@/data/generated/gestion.json";
import golden from "@/data/generated/golden.json";
import clasicos from "@/data/generated/resultados_clasicos.json";
import dl from "@/data/generated/resultados_dl.json";
import nlp from "@/data/generated/resultados_nlp.json";
import spark from "@/data/generated/resultados_spark.json";
import { COMO_SE_CUMPLE, MODELOS_EVALUADOS } from "@/content/portada";
import { BLOQUES, DOD_NOTEBOOKS, MATRIZ } from "@/content/trazabilidad";
import { ChecklistEnunciado, destinoFila } from "./ChecklistEnunciado";

// jsdom no trae IntersectionObserver (lo usan Revelar y whileInView de framer-motion).
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

const cuenta = (m: unknown) => (Array.isArray(m) ? m.length : Object.keys(m as object).length);

describe("checklist del enunciado en la portada", () => {
  it("muestra las 47 filas de gestion.json, todas marcadas, en 9 bloques", () => {
    const { container } = render(
      <MemoryRouter>
        <ChecklistEnunciado />
      </MemoryRouter>,
    );
    const T = gestion.trazabilidad;
    expect(container.querySelectorAll(".chk-item")).toHaveLength(T.filas_total);
    expect(screen.getAllByText("Cumplido:")).toHaveLength(T.filas_acreditadas);
    expect(container.querySelectorAll(".chk-item__marca--no")).toHaveLength(0);
    expect(container.querySelectorAll(".chk-bloque")).toHaveLength(BLOQUES.length);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(T.filas_acreditadas));
    const marcador = container.querySelector(".chk__marcador") as HTMLElement;
    expect(within(marcador).getByText(`${DOD_NOTEBOOKS.ok}/${DOD_NOTEBOOKS.total}`)).toBeTruthy();
  });

  it("cada fila tiene su texto de cumplimiento y un destino válido", () => {
    expect(Object.keys(COMO_SE_CUMPLE).sort()).toEqual(MATRIZ.map((f) => f.id).sort());
    for (const f of MATRIZ) {
      const d = destinoFila(f);
      expect(d.ruta).toMatch(/^\/(metodologia|paso\/\d+)$/);
    }
    expect(destinoFila(MATRIZ.find((f) => f.id === "E1")!).ruta).toBe("/metodologia");
    expect(destinoFila(MATRIZ.find((f) => f.id === "E2")!).etiqueta).toBe("Caps. 1–11");
  });

  it("las cifras fijas de la portada coinciden con los resultados exportados", () => {
    expect(MODELOS_EVALUADOS).toEqual({
      clasicos: cuenta(clasicos.modelos),
      redes: cuenta(dl.modelos),
      nlp: cuenta(nlp.modelos),
      spark: cuenta(spark.modelos),
    });
    // «< 10⁻⁶ en 303 clientes y 50 textos» (garantías de la portada y cierre).
    expect(golden.clientes).toHaveLength(303);
    expect(golden.textos).toHaveLength(50);
    expect(DOD_NOTEBOOKS.ok).toBe(DOD_NOTEBOOKS.total);
  });
});

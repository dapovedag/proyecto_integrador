/** Trazabilidad: los conteos de la página coinciden con gestion.json (calculado por generar_evidencia.py). */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import gestion from "@/data/generated/gestion.json";
import { BLOQUES, MATRIZ, RESUMEN_TRAZA, bloqueDe, pasosDe } from "@/content/trazabilidad";
import Trazabilidad from "./Trazabilidad";

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

const T = gestion.trazabilidad;

describe("trazabilidad calculada", () => {
  it("conteos iguales a gestion.json", () => {
    expect(MATRIZ.length).toBe(T.filas_total);
    expect(RESUMEN_TRAZA.filas).toBe(T.filas_total);
    expect(RESUMEN_TRAZA.acreditadas).toBe(T.filas_acreditadas);
    expect(RESUMEN_TRAZA.acreditadas).toBe(T.filas.filter((f) => f.acreditada).length);
    expect(RESUMEN_TRAZA.idsCubiertos).toBe(T.ids_cubiertos);
    expect(RESUMEN_TRAZA.historias).toBe(gestion.historias.length);
    expect(RESUMEN_TRAZA.historiasAcreditadas).toBe(gestion.historias.filter((h) => h.acreditada).length);
    expect(RESUMEN_TRAZA.acreditadas + RESUMEN_TRAZA.enProgreso + RESUMEN_TRAZA.pendientes).toBe(T.filas_total);
  });

  it("cada fila tiene bloque válido, historias del backlog y al menos un capítulo", () => {
    const ids = new Set(BLOQUES.map((b) => b.id));
    for (const f of MATRIZ) {
      expect(ids.has(f.bloque), f.id).toBe(true);
      expect(f.historias.length, f.id).toBeGreaterThan(0);
      expect(f.pasos.length, f.id).toBeGreaterThan(0);
      expect(f.pasos.every((p) => p >= 0 && p <= 11), f.id).toBe(true);
    }
  });

  it("interpreta los pasos y los bloques del enunciado", () => {
    expect(pasosDe("1–12")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(pasosDe("2, 3, 4")).toEqual([2, 3, 4]);
    expect(pasosDe("2 (dato: [03_contrato_datos.md](03_contrato_datos.md))")).toEqual([2]);
    expect(pasosDe("10, 12")).toEqual([10, 11]);
    expect(bloqueDe("IA3.E2")).toBe("IA3");
    expect(bloqueDe("P1.E1–E4")).toBe("P1");
    expect(bloqueDe("PF1")).toBe("PF");
    expect(bloqueDe("R4")).toBe("R");
  });

  it("la página muestra n / 47 y una fila por ítem", () => {
    render(
      <MemoryRouter initialEntries={["/trazabilidad"]}>
        <Trazabilidad />
      </MemoryRouter>,
    );
    expect(screen.getByText(`${T.filas_acreditadas} de ${T.filas_total} ítems acreditados`)).toBeInTheDocument();
    const tabla = screen.getByRole("table", { name: /Matriz de trazabilidad/ });
    const filas = within(tabla).getAllByRole("row").filter((r) => r.classList.contains("traza-fila"));
    expect(filas.length).toBe(T.filas_total);
    expect(screen.getByText(`${T.filas_total} de ${T.filas_total} ítems`)).toBeInTheDocument();
  });
});

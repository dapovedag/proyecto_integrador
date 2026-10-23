import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _limpiarCache } from "@/data/cargar";
import type { NotebookEjecutado } from "@/data/tipos";
import { NotebookPlayer, indicesOriginales, reductor, type EstadoCelda } from "./NotebookPlayer";
import { MAX_S, MIN_S, TOTAL_MAX_S, comprimirDuraciones } from "./tiempos";

const NB = JSON.parse(readFileSync(resolve(process.cwd(), "public/run/notebooks/05.json"), "utf-8")) as NotebookEjecutado;
const CODIGO = NB.celdas.flatMap((c, j) => (c.tipo === "codigo" ? [j] : []));

beforeEach(() => {
  _limpiarCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => NB })),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function montar(ruta = "/paso/5") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <NotebookPlayer nb="05" />
    </MemoryRouter>,
  );
}
const prompts = (raiz: HTMLElement) => [...raiz.querySelectorAll(".nb-prompt")].map((e) => e.textContent);

describe("tiempos de reproducción", () => {
  it("comprime de forma monótona, acotada y con total ≤ 45 s", () => {
    const reales = [0.04, 3.9, 276.6, 12.9, 1.2, 0, 149];
    const s = comprimirDuraciones(reales);
    for (const x of s) {
      expect(x).toBeGreaterThanOrEqual(MIN_S);
      expect(x).toBeLessThanOrEqual(MAX_S);
    }
    expect(s[2]).toBeGreaterThan(s[1]);
    expect(s[1]).toBeGreaterThan(s[0]);
    const nb04 = Array.from({ length: 41 }, (_, i) => (i % 5) * 3 + 0.5);
    expect(comprimirDuraciones(nb04).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(TOTAL_MAX_S + 1e-6);
  });
});

describe("reductor del reproductor", () => {
  it("Ejecutar todo encola en orden y avanza celda por celda", () => {
    let s = { estados: NB.celdas.map(() => "nada" as EstadoCelda), cola: [] as number[], actual: null as number | null };
    s = reductor(s, { t: "todo", codigo: CODIGO });
    expect(s.actual).toBe(CODIGO[0]);
    expect(s.cola).toEqual(CODIGO.slice(1));
    expect(CODIGO.slice(1).every((j) => s.estados[j] === "cola")).toBe(true);
    const orden: number[] = [];
    while (s.actual !== null) {
      orden.push(s.actual);
      s = reductor(s, { t: "fin", j: s.actual });
    }
    expect(orden).toEqual(CODIGO);
    expect(CODIGO.every((j) => s.estados[j] === "hecho")).toBe(true);
  });

  it("indicesOriginales reproduce el índice de celda del .ipynb (celda inyectada por papermill)", () => {
    const o = indicesOriginales(NB.celdas);
    NB.celdas.forEach((c, j) => {
      if (c.tipo === "codigo") for (const s of c.salidas) if (s.tipo === "figura") expect(o[j]).toBe(s.spec.celda);
    });
  });
});

describe("<NotebookPlayer />", () => {
  it("empieza sin ejecutar: contadores [ ] y sin salidas, con llamado a ejecutar", async () => {
    montar();
    const raiz = await screen.findByTestId("notebook-player");
    expect(raiz).toHaveAttribute("data-kernel", "inactivo");
    expect(prompts(raiz).every((p) => p === "[ ]:")).toBe(true);
    expect(raiz.querySelectorAll(".nb-salidas").length).toBe(0);
    expect(screen.getByRole("button", { name: "Ejecutar todo el notebook" })).toBeInTheDocument();
  });

  it("Ejecutar celda: [*] mientras corre y luego el execution_count real con su stdout", async () => {
    montar();
    const raiz = await screen.findByTestId("notebook-player");
    vi.useFakeTimers();
    const j = NB.celdas.findIndex((c) => c.tipo === "codigo" && c.salidas.some((s) => s.tipo === "stream"));
    const celda = NB.celdas[j] as Extract<NotebookEjecutado["celdas"][number], { tipo: "codigo" }>;
    const li = raiz.querySelector<HTMLElement>(`[data-j="${j}"]`)!;
    act(() => {
      fireEvent.click(within(li).getByRole("button", { name: /Ejecutar celda/ }));
    });
    expect(li.querySelector(".nb-prompt")!.textContent).toBe("[*]:");
    expect(raiz).toHaveAttribute("data-kernel", "ocupado");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(li.querySelector(".nb-prompt")!.textContent).toBe(`[${celda.ejecucion}]:`);
    expect(li).toHaveAttribute("data-estado", "hecho");
    const stream = celda.salidas.find((s) => s.tipo === "stream") as { texto: string };
    expect(li.querySelector("[data-salida=stream]")!.textContent).toBe(stream.texto.replace(/\n$/, "") + "\n");
    expect(raiz).toHaveAttribute("data-kernel", "inactivo");
  });

  it("Ver resultados revela todo sin animar y en orden; Reiniciar vuelve a [ ]", async () => {
    montar();
    const raiz = await screen.findByTestId("notebook-player");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Ver resultados/ }));
    });
    expect(raiz).toHaveAttribute("data-hechas", String(CODIGO.length));
    const esperados = CODIGO.map((j) => `[${(NB.celdas[j] as { ejecucion: number }).ejecucion}]:`);
    expect(prompts(raiz)).toEqual(esperados);
    expect(raiz.querySelectorAll("[data-salida=figura]").length).toBeGreaterThan(0);
    expect(raiz.querySelectorAll("[data-salida=html] table").length).toBe(2);
    // las imágenes de referencia de matplotlib no se muestran
    expect(raiz.querySelectorAll("[data-salida=imagen]").length).toBe(0);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Reiniciar/ }));
    });
    expect(prompts(raiz).every((p) => p === "[ ]:")).toBe(true);
  });

  it("?nb=05&celda=10 revela hasta esa celda", async () => {
    montar("/paso/5?nb=05&celda=10");
    const raiz = await screen.findByTestId("notebook-player");
    const o = indicesOriginales(NB.celdas);
    const hasta = CODIGO.filter((j) => o[j] <= 10).length;
    expect(raiz).toHaveAttribute("data-hechas", String(hasta));
    expect(raiz.querySelector('[data-celda="10"]')).toHaveAttribute("data-estado", "hecho");
  });
});

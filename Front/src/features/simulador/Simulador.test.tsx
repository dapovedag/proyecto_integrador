import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import demos from "@/data/generated/clientes_demo.json";
import { Simulador, evaluar, contribucionesPorPalabra } from "./Simulador";
import { motorDeTexto } from "../api/motorApi";

describe("simulador: clientes demo", () => {
  it.each([
    ["bajo", "aprobar"],
    ["medio", "revisar"],
    ["alto", "rechazar"],
  ] as const)("cliente %s → %s", (id, esperado) => {
    const r = evaluar({ ...demos[id] });
    expect(r.valido).toBe(true);
    if (r.valido) {
      expect(r.resp.decision).toBe(esperado);
      // la cascada cierra: base + Σ contribuciones = logit
      const suma = r.det.contribuciones.reduce((s, f) => s + f.contribucion, 0);
      expect(Math.abs(r.det.logit - (suma + -0.8719872889720081))).toBeLessThan(1e-9);
    }
  });

  it("los botones demo cambian la decisión anunciada (aria-live)", () => {
    render(
      <MemoryRouter>
        <Simulador />
      </MemoryRouter>,
    );
    const res = screen.getByTestId("sim-resultado");
    expect(res).toHaveAttribute("data-decision", "revisar");
    act(() => fireEvent.click(screen.getByTestId("demo-bajo")));
    expect(res).toHaveAttribute("data-decision", "aprobar");
    act(() => fireEvent.click(screen.getByTestId("demo-alto")));
    expect(res).toHaveAttribute("data-decision", "rechazar");
    expect(res).toHaveAttribute("aria-live", "polite");
  });

  it("una edad fuera de rango deja la solicitud en 422 con validación inline", () => {
    render(
      <MemoryRouter>
        <Simulador />
      </MemoryRouter>,
    );
    const edad = screen.getAllByLabelText("Edad")[0] as HTMLInputElement;
    act(() => {
      fireEvent.focus(edad);
      fireEvent.change(edad, { target: { value: "999" } });
    });
    expect(screen.getByTestId("sim-resultado")).toHaveAttribute("data-decision", "invalido");
    expect(screen.getAllByText("Debe ser menor o igual a 100").length).toBeGreaterThan(0);
  });

  it("resalta en el texto las palabras con peso (unigramas y bigramas)", () => {
    const texto = demos.alto.texto_solicitud;
    const det = motorDeTexto().detallar(texto);
    const toks = contribucionesPorPalabra(texto, det.terminos);
    expect(toks.length).toBeGreaterThan(5);
    const total = toks.reduce((s, t) => s + t.c, 0);
    const esperado = det.terminos.reduce((s, t) => s + t.contribucion, 0);
    expect(Math.abs(total - esperado)).toBeLessThan(1e-9);
  });
});

import { describe, expect, it } from "vitest";
import { compacto, cop, dec3, duracion, formatear, num, pct } from "./formatos";

const nb = (s: string) => s.replace(/ /g, " ");

describe("formatos es-CO", () => {
  it("porcentaje con coma decimal", () => {
    expect(nb(pct(0.3971))).toBe("39,7 %");
    expect(nb(pct(0.1778, 2))).toBe("17,78 %");
    expect(pct(null)).toBe("—");
  });

  it("pesos colombianos con separador de miles", () => {
    expect(nb(cop(9500000))).toBe("$ 9.500.000");
    expect(nb(cop(9500000, true))).toMatch(/^\$ 9,5/);
  });

  it("números con punto de miles", () => {
    expect(num(12144)).toBe("12.144");
    expect(num(9600)).toBe("9.600");
    expect(num(0.5)).toBe("0,5");
  });

  it("decimal fijo de 3 cifras", () => {
    expect(dec3(0.84563)).toBe("0,846");
    expect(dec3(0.1)).toBe("0,100");
    expect(dec3(Number.NaN)).toBe("—");
  });

  it("formatear por clave de figura", () => {
    expect(nb(formatear(0.25, "pct"))).toBe("25,0 %");
    expect(formatear(0.8456, "dec3")).toBe("0,846");
    expect(formatear(1500, "num")).toBe("1.500");
    expect(nb(formatear(1200000, "cop"))).toBe("$ 1.200.000");
  });

  it("compacto y duración", () => {
    expect(compacto(950)).toBe("950");
    expect(nb(compacto(12000))).toMatch(/12/);
    expect(nb(duracion(490.1))).toBe("8 min 10 s");
    expect(nb(duracion(2.4))).toBe("2,4 s");
  });
});

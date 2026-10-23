import "@testing-library/jest-dom/vitest";

// jsdom no implementa <canvas>: zrender mide texto con un contexto 2D incluso con el renderer SVG.
// Contexto mínimo (measureText aproximado; el resto, funciones vacías).
if (typeof HTMLCanvasElement !== "undefined") {
  const crear = (canvas: HTMLCanvasElement) => {
    const base: Record<string | symbol, unknown> = { canvas, font: "12px sans-serif" };
    return new Proxy(base, {
      get(t, p) {
        if (p === "measureText") return (s: string) => ({ width: String(s).length * 6.2, actualBoundingBoxAscent: 9, actualBoundingBoxDescent: 3 });
        if (p === "getImageData" || p === "createImageData") return () => ({ data: new Uint8ClampedArray(4) });
        if (p === "createLinearGradient" || p === "createRadialGradient" || p === "createPattern") return () => ({ addColorStop() {} });
        if (p in t) return t[p];
        return () => {};
      },
      set(t, p, v) {
        t[p] = v;
        return true;
      },
    });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    return crear(this);
  } as any;
}

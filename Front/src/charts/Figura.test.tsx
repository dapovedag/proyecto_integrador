/**
 * Figura: cada tipo de spec nativo se construye y se renderiza sin errores (ECharts SVG en jsdom).
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import agregados from "@/data/generated/agregados.json";
import evaluacion from "@/data/generated/evaluacion_final.json";
import type { FiguraSpec } from "@/data/tipos";
import { Figura } from "./Figura";
import { construirOpcion, TIPOS_ECHARTS } from "./opcion";
import { tablaDeSpec } from "./tablaDatos";

const cv = evaluacion.curvas_test;
const h = agregados.histogramas.edad;
const corr = agregados.correlacion_spearman;

export const SPECS: FiguraSpec[] = [
  {
    tipo: "lineas",
    titulo: "Líneas",
    ejes: { x: "Época", y: "AUC" },
    datos: {
      series: [
        { nombre: "Entrenamiento", x: [1, 2, 3, 4], y: [0.7, 0.75, 0.8, 0.82] },
        { nombre: "Validación", x: [1, 2, 3, 4], y: [0.69, 0.73, 0.76, 0.77] },
      ],
      referencias: [{ eje: "y", valor: 0.7, etiqueta: "Meta" }],
      bandas: [{ desde: 2, hasta: 3, etiqueta: "Parada temprana" }],
      anotaciones: [{ x: 4, y: 0.82, texto: "Mejor época" }],
    },
    opciones: { formato_y: "dec3" },
    notebook: "06",
    celda: 12,
  },
  { tipo: "area", titulo: "Área", datos: { series: [{ nombre: "Costo", x: ["a", "b", "c"], y: [1, 3, 2] }] }, opciones: { apilado: true } },
  {
    tipo: "barras",
    titulo: "Barras por familia",
    datos: {
      categorias: ["Dummy", "LR", "HGB", "CNN", "TF-IDF", "Spark LR", "Final"],
      familias: ["línea base", "clásico", "clásico", "deep learning", "nlp", "big data", "final"],
      series: [{ nombre: "AUC", valores: [0.5, 0.858, 0.852, 0.84, 0.64, 0.85, 0.846] }],
    },
    opciones: { color_por: "familia", formato_y: "dec3" },
  },
  {
    tipo: "barras_h",
    titulo: "Barras horizontales con error",
    datos: { categorias: ["puntaje_buro", "moras", "uso_cupo"], series: [{ nombre: "Importancia", valores: [0.086, 0.04, -0.01], errores: [0.0015, 0.002, 0.001] }] },
    opciones: { color_por: "signo", formato_x: "dec3" },
  },
  { tipo: "histograma", titulo: "Histograma", ejes: { x: "Edad" }, datos: { bordes: h.bordes, series: [{ nombre: "Pago", conteos: h.pago }, { nombre: "Impago", conteos: h.impago }] } },
  {
    tipo: "dispersion",
    titulo: "Dispersión grande",
    datos: { series: [{ nombre: "Pago", puntos: Array.from({ length: 2500 }, (_, i) => [i % 97, (i * 7) % 89]) }] },
    opciones: { tamano_punto: 3 },
  },
  {
    tipo: "dispersion",
    titulo: "Variantes (1 punto por serie)",
    ejes: { x: "DI edad", y: "Costo medio" },
    datos: { series: [{ nombre: "base", puntos: [[0.72, 0.05]] }, { nombre: "sin_edad", puntos: [[0.86, 0.051]] }, { nombre: "reweighing", puntos: [[0.9, 0.0503]] }], referencias: [{ eje: "x", valor: 0.8, etiqueta: "4/5" }] },
  },
  { tipo: "boxplot", titulo: "Boxplot", datos: { categorias: ["Pago", "Impago"], series: [{ nombre: "Ingreso", cajas: [[1, 2, 3, 4, 5], [1, 1.5, 2, 3, 4]] }] } },
  { tipo: "heatmap", titulo: "Correlación", datos: { x: corr.variables, y: corr.variables, valores: corr.matriz } },
  { tipo: "matriz_confusion", titulo: "Matriz de confusión", datos: { etiquetas: ["Pago", "Impago"], valores: [[1300, 246], [310, 544]] } },
  { tipo: "curva_roc", titulo: "ROC", datos: { series: [{ nombre: "Final", x: cv.fpr, y: cv.tpr }] } },
  { tipo: "curva_pr", titulo: "PR", datos: { series: [{ nombre: "Final", x: cv.recall, y: cv.precision }] } },
  { tipo: "calibracion", titulo: "Calibración", datos: { series: [{ nombre: "Final", x: cv.calib_prob_media, y: cv.calib_frac_positivos }], referencias: [{ tipo: "diagonal" }] } },
  { tipo: "dona", titulo: "Decisiones", datos: { categorias: ["Aprobar", "Revisar", "Rechazar"], valores: [953, 692, 755] } },
  { tipo: "kpi", titulo: "KPIs", datos: { items: [{ etiqueta: "AUC", valor: 0.8456, formato: "dec3" }, { etiqueta: "Aprobación", valor: 0.397, formato: "pct" }] } },
  { tipo: "tabla", titulo: "Tabla", datos: { columnas: ["Modelo", "AUC"], filas: [["LR", 0.858], ["HGB", 0.852]] } },
];

describe("construirOpcion", () => {
  it("cubre todos los tipos con lienzo", () => {
    const cubiertos = new Set(SPECS.map((s) => s.tipo));
    for (const t of TIPOS_ECHARTS) expect(cubiertos.has(t)).toBe(true);
  });

  it.each(SPECS.filter((s) => s.tipo !== "kpi" && s.tipo !== "tabla").map((s) => [s.titulo, s] as const))("%s produce series", (_t, spec) => {
    const o = construirOpcion(spec, { ancho: 800 }) as { series: unknown[] };
    expect(Array.isArray(o.series)).toBe(true);
    expect(o.series.length).toBeGreaterThan(0);
  });

  it("la ROC añade la diagonal de azar y la familia 'final' usa el acento", () => {
    const roc = construirOpcion(SPECS.find((s) => s.tipo === "curva_roc")!) as { series: { markLine?: { data: unknown[] } }[] };
    expect(roc.series[0].markLine?.data.length).toBe(1);
    const fam = construirOpcion(SPECS[2]) as { series: { data: { itemStyle: { color: string } }[] }[] };
    expect(fam.series[0].data[6].itemStyle.color).toBe("#6670FF");
    expect(fam.series[0].data[1].itemStyle.color).toBe("#E8742A");
  });

  it("la tabla de datos refleja el spec", () => {
    const t = tablaDeSpec(SPECS[3]);
    expect(t.columnas).toEqual(["Categoría", "Importancia", "± Importancia"]);
    expect(t.filas[0][1]).toBe("0,086");
  });
});

describe("<Figura>", () => {
  it.each(SPECS.map((s) => [`${s.tipo} · ${s.titulo}`, s] as const))("renderiza %s sin errores", (_t, spec) => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, unmount } = render(
      <MemoryRouter>
        <Figura spec={spec} />
      </MemoryRouter>,
    );
    expect(screen.getByText(spec.titulo)).toBeInTheDocument();
    if (spec.tipo !== "kpi" && spec.tipo !== "tabla") {
      const lienzo = container.querySelector(".figura__lienzo");
      expect(lienzo).not.toBeNull();
      expect(lienzo!.querySelector("svg")).not.toBeNull();
    }
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
    unmount();
  });
});

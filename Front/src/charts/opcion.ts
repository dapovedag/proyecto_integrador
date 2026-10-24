/**
 * Spec de figura nativa → opción ECharts. Función pura (probada en Figura.test.tsx).
 * Tipos: lineas, area, barras, barras_h, histograma, dispersion, boxplot, heatmap, matriz_confusion,
 * curva_roc, curva_pr, calibracion, dona. (kpi y tabla se pintan en HTML desde Figura.tsx.)
 */
import type { DatosFigura, FiguraSpec, FormatoNum, Referencia } from "@/data/tipos";
import { formatear, formatearEje, pct } from "./formatos";
import {
  DIVERGENTE,
  SECUENCIAL,
  SERIES,
  SIGNO,
  T,
  alfa,
  colorBanda,
  colorFamilia,
  colorModulo,
  colorSemantico,
  tintaSobre,
} from "./tema";

type Obj = Record<string, unknown>;
type SerieXY = { nombre: string; x: (number | string)[]; y: number[] };
type SerieValores = { nombre: string; valores: number[]; errores?: number[] };
type SerieConteos = { nombre: string; conteos: number[] };
type SeriePuntos = { nombre: string; puntos: number[][] };
type SerieCajas = { nombre: string; cajas: number[][] };

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export const TIPOS_ECHARTS = [
  "lineas",
  "area",
  "barras",
  "barras_h",
  "histograma",
  "dispersion",
  "boxplot",
  "heatmap",
  "matriz_confusion",
  "curva_roc",
  "curva_pr",
  "calibracion",
  "dona",
] as const;

export interface ContextoOpcion {
  reducido?: boolean; // prefers-reduced-motion
  ancho?: number; // px disponibles (para decidir etiquetas)
}

/** Color de la i-ésima serie: semántico por nombre si aplica, si no el orden categórico fijo. */
function colorSerie(nombre: string, i: number, spec: FiguraSpec): string {
  const op = spec.opciones ?? {};
  const fam = spec.datos.familias;
  if (op.color_por === "familia" && fam && fam.length === (spec.datos.series?.length ?? 0)) return colorFamilia(fam[i]);
  if (op.color_por === "banda") return colorBanda(nombre);
  if (op.color_por === "modulo") return colorModulo(nombre);
  return colorSemantico(nombre) ?? SERIES[i % SERIES.length];
}

/** Color por punto/categoría según `color_por`. */
function colorCategoria(spec: FiguraSpec, cat: string, idx: number, valor: number, base: string): string {
  const op = spec.opciones ?? {};
  switch (op.color_por) {
    case "signo":
      return valor > 0 ? SIGNO.positivo : valor < 0 ? SIGNO.negativo : SIGNO.cero;
    case "modulo":
      return colorModulo(cat);
    case "banda":
      return colorBanda(cat);
    case "familia":
      return colorFamilia(spec.datos.familias?.[idx]);
    default:
      return base;
  }
}

/** Rejilla con espacio para los nombres de eje (containLabel no los incluye). */
function rejilla(spec: FiguraSpec, extra: { top?: number; right?: number; nombreX?: string; nombreY?: string } = {}): Obj {
  const nx = extra.nombreX ?? spec.ejes?.x;
  const ny = extra.nombreY ?? spec.ejes?.y;
  return { top: extra.top ?? 20, right: extra.right ?? 20, left: ny ? 30 : 12, bottom: nx ? 34 : 12, containLabel: true };
}

function tooltipBase(extra: Obj = {}): Obj {
  return { confine: true, appendToBody: false, ...extra };
}

function filaTooltip(color: string, nombre: string, valor: string, forma: "linea" | "punto" | "barra" = "linea") {
  const key =
    forma === "linea"
      ? `<span style="display:inline-block;width:12px;height:2px;border-radius:2px;background:${color};margin-right:8px;vertical-align:middle"></span>`
      : forma === "punto"
        ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;vertical-align:middle"></span>`
        : `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};margin-right:8px;vertical-align:middle"></span>`;
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;line-height:1.7">
    <span style="color:${T.text2};font-size:11.5px">${key}${esc(nombre)}</span>
    <strong style="font-family:${T.fontMono};font-weight:600;color:${T.text};font-size:12px">${esc(valor)}</strong></div>`;
}
const cabeceraTooltip = (t: string) =>
  `<div style="font-family:${T.fontMono};font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:${T.text3};margin-bottom:4px">${esc(t)}</div>`;

function ejeValor(nombre: string | undefined, formato: FormatoNum | undefined, extra: Obj = {}): Obj {
  return {
    type: "value",
    name: nombre ?? "",
    nameLocation: "middle",
    nameGap: 34,
    scale: false,
    axisLabel: { formatter: (v: number) => formatearEje(v, formato) },
    ...extra,
  };
}

function ejeCategoria(nombre: string | undefined, cats: (string | number)[], extra: Obj = {}): Obj {
  return {
    type: "category",
    name: nombre ?? "",
    nameLocation: "middle",
    nameGap: 30,
    data: cats.map(String),
    axisLabel: { hideOverlap: true },
    ...extra,
  };
}

function leyenda(nombres: string[], forma: "linea" | "barra" | "punto"): Obj | undefined {
  if (nombres.length < 2) return undefined;
  return {
    show: true,
    top: 0,
    left: 0,
    type: "scroll",
    data: nombres,
    icon: forma === "punto" ? "circle" : "roundRect",
    itemWidth: forma === "punto" ? 8 : 14,
    itemHeight: forma === "linea" ? 3 : 8,
  };
}

/* ------------------------------------------------------------------ */
/* Referencias, bandas y anotaciones                                   */
/* ------------------------------------------------------------------ */
function referenciasDe(spec: FiguraSpec): Referencia[] {
  const r = [...((spec.datos.referencias as Referencia[]) ?? []), ...((spec.opciones?.referencias as Referencia[]) ?? [])];
  const tieneDiag = r.some((x) => "tipo" in x && x.tipo === "diagonal");
  if (!tieneDiag && spec.tipo === "curva_roc") r.push({ tipo: "diagonal", etiqueta: "Azar" });
  if (!tieneDiag && spec.tipo === "calibracion") r.push({ tipo: "diagonal", etiqueta: "Calibración perfecta" });
  return r;
}

function markLineDe(spec: FiguraSpec, ext: { min: number; max: number }, compacto = false): Obj | undefined {
  const refs = referenciasDe(spec);
  if (!refs.length) return undefined;
  const fx = spec.opciones?.formato_x;
  const fy = spec.opciones?.formato_y;
  const data: unknown[] = refs.map((r) => {
    if ("tipo" in r) {
      return [
        { coord: [ext.min, ext.min], symbol: "none" },
        {
          coord: [ext.max, ext.max],
          symbol: "none",
          label: { show: !!r.etiqueta, formatter: r.etiqueta ?? "", position: "insideEndTop", color: T.text3, fontSize: 10.5 },
        },
      ];
    }
    const base = r.eje === "x" ? { xAxis: r.valor } : { yAxis: r.valor };
    const val = r.eje === "x" ? formatear(r.valor, fx) : formatear(r.valor, fy);
    return {
      ...base,
      label: {
        show: true,
        // «aprobar si p <» + valor se lee de corrido; las demás etiquetas se separan con « · ».
        formatter: r.etiqueta && !compacto ? `${r.etiqueta}${/[<>≤≥=]$/.test(r.etiqueta.trim()) ? " " : " · "}${val}` : val,
        position: r.eje === "x" ? "end" : "insideEndTop",
        distance: r.eje === "x" ? 4 : 2,
        color: T.text2,
        fontSize: 10.5,
        fontFamily: T.fontText,
        backgroundColor: "rgba(20,21,27,0.85)",
        padding: [2, 6],
        borderRadius: 4,
      },
    };
  });
  return {
    silent: true,
    symbol: "none",
    animation: false,
    lineStyle: { color: "rgba(255,255,255,0.32)", type: [4, 4], width: 1 },
    data,
  };
}

function markAreaDe(spec: FiguraSpec): Obj | undefined {
  const bandas = [...((spec.datos.bandas as DatosFigura["bandas"]) ?? []), ...((spec.opciones?.bandas as DatosFigura["bandas"]) ?? [])];
  if (!bandas?.length) return undefined;
  return {
    silent: true,
    data: bandas.map((b, i) => {
      const color = b.color ?? (b.etiqueta ? colorBanda(b.etiqueta) : SERIES[i % SERIES.length]);
      const ejeY = b.eje === "y";
      return [
        {
          ...(ejeY ? { yAxis: b.desde } : { xAxis: b.desde }),
          name: b.etiqueta ?? "",
          itemStyle: { color: alfa(color.startsWith("#") ? color : SERIES[0], 0.07) },
          label: { show: !!b.etiqueta, position: ejeY ? "insideRight" : "insideTop", color: T.text3, fontSize: 10.5, fontFamily: T.fontMono },
        },
        ejeY ? { yAxis: b.hasta } : { xAxis: b.hasta },
      ];
    }),
  };
}

function markPointDe(spec: FiguraSpec): Obj | undefined {
  const an = spec.datos.anotaciones;
  if (!an?.length) return undefined;
  return {
    symbol: "circle",
    symbolSize: 8,
    itemStyle: { color: T.text, borderColor: T.panel, borderWidth: 2 },
    label: {
      show: true,
      position: "right",
      distance: 8,
      color: T.text,
      fontSize: 11,
      fontFamily: T.fontText,
      backgroundColor: "rgba(20,21,27,0.9)",
      borderColor: T.line2,
      borderWidth: 1,
      padding: [3, 7],
      borderRadius: 6,
      formatter: (p: { name: string }) => p.name,
    },
    data: an.map((a) => ({ coord: [a.x, a.y], name: a.texto, value: a.y })),
  };
}

/* ------------------------------------------------------------------ */
/* Constructores por tipo                                              */
/* ------------------------------------------------------------------ */
function lineas(spec: FiguraSpec, ctx: ContextoOpcion): Obj {
  const series = (spec.datos.series ?? []) as SerieXY[];
  const op = spec.opciones ?? {};
  const esCurva = spec.tipo === "curva_roc" || spec.tipo === "curva_pr" || spec.tipo === "calibracion";
  const numerico = series.every((s) => s.x.every((v) => typeof v === "number"));
  const fx = op.formato_x ?? (esCurva ? "dec2" : undefined);
  const fy = op.formato_y ?? (esCurva ? "dec2" : undefined);
  const area = spec.tipo === "area";
  const pocos = series.every((s) => s.x.length <= 24);
  const nombres = series.map((s) => s.nombre);
  const etiquetasFinales = series.length >= 2 && series.length <= 4 && (ctx.ancho ?? 800) > 480;

  let min = Infinity;
  let max = -Infinity;
  for (const s of series) for (const v of s.x) if (typeof v === "number") (min = Math.min(min, v)), (max = Math.max(max, v));
  for (const s of series) for (const v of s.y) (min = Math.min(min, v)), (max = Math.max(max, v));
  if (esCurva) (min = 0), (max = 1);

  const out = series.map((s, i) => {
    const color = colorSerie(s.nombre, i, spec);
    return {
      type: "line",
      name: s.nombre,
      data: numerico ? s.x.map((x, j) => [x, s.y[j]]) : s.y,
      showSymbol: spec.tipo === "calibracion" || (pocos && !esCurva && s.x.length <= 12),
      symbolSize: 8,
      symbol: "circle",
      smooth: false,
      stack: op.apilado ? "total" : undefined,
      lineStyle: { width: 2, color, cap: "round", join: "round" },
      itemStyle: { color, borderColor: T.panel, borderWidth: 2 },
      areaStyle: area ? { color: alfa(color, op.apilado ? 0.22 : 0.1) } : undefined,
      emphasis: { focus: "series", lineStyle: { width: 2.5 } },
      endLabel: etiquetasFinales
        ? { show: true, formatter: (p: { seriesName: string }) => p.seriesName, color: T.text2, fontSize: 11, distance: 8 }
        : undefined,
      markLine: i === 0 ? markLineDe(spec, { min, max }, (ctx.ancho ?? 800) < 560) : undefined,
      markArea: i === 0 ? markAreaDe(spec) : undefined,
      markPoint: i === 0 ? markPointDe(spec) : undefined,
      sampling: s.x.length > 2000 ? "lttb" : undefined,
    };
  });

  const ejeX = numerico
    ? ejeValor(spec.ejes?.x ?? defectoEje(spec, "x"), fx, {
        min: op.min_x ?? (esCurva ? 0 : "dataMin"),
        max: esCurva ? 1 : "dataMax",
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: T.line2 } },
      })
    : ejeCategoria(spec.ejes?.x ?? defectoEje(spec, "x"), series[0]?.x ?? [], { boundaryGap: false });
  const ejeY = ejeValor(spec.ejes?.y ?? defectoEje(spec, "y"), fy, {
    nameGap: 46,
    type: op.escala_log ? "log" : "value",
    min: op.min_y ?? (esCurva ? 0 : undefined),
    max: op.max_y ?? (esCurva ? 1 : undefined),
  });

  return {
    grid: rejilla(spec, {
      top: nombres.length >= 2 ? 40 : 24,
      right: etiquetasFinales ? 96 : 24,
      nombreX: spec.ejes?.x ?? defectoEje(spec, "x"),
      nombreY: spec.ejes?.y ?? defectoEje(spec, "y"),
    }),
    legend: leyenda(nombres, "linea"),
    xAxis: ejeX,
    yAxis: ejeY,
    tooltip: tooltipBase({
      trigger: "axis",
      axisPointer: { type: "line" },
      formatter: (ps: { seriesName: string; color: string; value: unknown; axisValue: unknown }[]) => {
        if (!ps.length) return "";
        const xv = ps[0].axisValue;
        const cab = typeof xv === "number" ? formatear(xv, fx) : String(xv);
        return (
          cabeceraTooltip(`${spec.ejes?.x ?? defectoEje(spec, "x") ?? ""} ${cab}`.trim()) +
          ps
            .map((p) => {
              const v = Array.isArray(p.value) ? (p.value[1] as number) : (p.value as number);
              return filaTooltip(p.color, p.seriesName, formatear(v, fy));
            })
            .join("")
        );
      },
    }),
    series: out,
  };
}

function defectoEje(spec: FiguraSpec, eje: "x" | "y"): string | undefined {
  if (spec.tipo === "curva_roc") return eje === "x" ? "Tasa de falsos positivos" : "Tasa de verdaderos positivos";
  if (spec.tipo === "curva_pr") return eje === "x" ? "Recall (sensibilidad)" : "Precisión";
  if (spec.tipo === "calibracion") return eje === "x" ? "Probabilidad predicha" : "Fracción observada de impago";
  return undefined;
}

function erroresCustom(categorias: string[], valores: number[], errores: number[], horizontal: boolean, serieIdx: number, nSeries: number): Obj {
  return {
    type: "custom",
    name: `__err${serieIdx}`,
    silent: true,
    z: 5,
    tooltip: { show: false },
    renderItem: (_p: unknown, api: { value: (i: number) => number; coord: (v: unknown[]) => number[]; size: (v: unknown[]) => number[] }) => {
      const cat = api.value(0);
      const v = api.value(1);
      const e = api.value(2);
      const banda = api.size(horizontal ? [0, 1] : [1, 0])[horizontal ? 1 : 0];
      const desplaz = nSeries > 1 ? (banda * 0.6 * (serieIdx - (nSeries - 1) / 2)) / nSeries : 0;
      const a = api.coord(horizontal ? [v - e, cat] : [cat, v - e]);
      const b = api.coord(horizontal ? [v + e, cat] : [cat, v + e]);
      const cap = 4;
      const st = { stroke: "rgba(236,237,242,0.75)", lineWidth: 1.25 };
      if (horizontal) {
        const y = a[1] + desplaz;
        return {
          type: "group",
          children: [
            { type: "line", shape: { x1: a[0], y1: y, x2: b[0], y2: y }, style: st },
            { type: "line", shape: { x1: a[0], y1: y - cap, x2: a[0], y2: y + cap }, style: st },
            { type: "line", shape: { x1: b[0], y1: y - cap, x2: b[0], y2: y + cap }, style: st },
          ],
        };
      }
      const x = a[0] + desplaz;
      return {
        type: "group",
        children: [
          { type: "line", shape: { x1: x, y1: a[1], x2: x, y2: b[1] }, style: st },
          { type: "line", shape: { x1: x - cap, y1: a[1], x2: x + cap, y2: a[1] }, style: st },
          { type: "line", shape: { x1: x - cap, y1: b[1], x2: x + cap, y2: b[1] }, style: st },
        ],
      };
    },
    data: categorias.map((_, j) => [j, valores[j], errores[j] ?? 0]),
    encode: horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 },
  };
}

function barras(spec: FiguraSpec, ctx: ContextoOpcion): Obj {
  const h = spec.tipo === "barras_h";
  const cats = (spec.datos.categorias ?? []).map(String);
  const series = (spec.datos.series ?? []) as SerieValores[];
  const op = spec.opciones ?? {};
  const fv = h ? (op.formato_x ?? op.formato_y) : op.formato_y;
  const nombres = series.map((s) => s.nombre);
  const unaSerie = series.length === 1;
  const etiquetar = unaSerie && cats.length <= (h ? 24 : 14) && (ctx.ancho ?? 800) > 340;
  const colorPorPunto = !!op.color_por && op.color_por !== "familia" ? true : op.color_por === "familia" && (spec.datos.familias?.length ?? 0) === cats.length;

  const out: Obj[] = series.map((s, i) => {
    const base = colorSerie(s.nombre, i, spec);
    return {
      type: "bar",
      name: s.nombre,
      stack: op.apilado ? "total" : undefined,
      barMaxWidth: 24,
      barMinHeight: 1,
      barGap: "12%",
      barCategoryGap: "38%",
      data: s.valores.map((v, j) => {
        const c = colorPorPunto ? colorCategoria(spec, cats[j], j, v, base) : base;
        const esFinal = op.color_por === "familia" && spec.datos.familias?.[j] === "final";
        const neg = v < 0;
        const r = op.apilado ? 0 : 4;
        return {
          value: v,
          itemStyle: {
            color: c,
            borderRadius: h ? (neg ? [r, 0, 0, r] : [0, r, r, 0]) : neg ? [0, 0, r, r] : [r, r, 0, 0],
            ...(esFinal ? { shadowColor: alfa(c, 0.55), shadowBlur: 12 } : {}),
          },
        };
      }),
      label: etiquetar
        ? {
            show: true,
            position: h ? "right" : "top",
            distance: 6,
            color: T.text2,
            fontFamily: T.fontMono,
            fontSize: 10.5,
            formatter: (p: { value: number }) => formatear(p.value, fv),
          }
        : undefined,
      emphasis: { itemStyle: { opacity: 1 }, focus: "none" },
      blur: { itemStyle: { opacity: 0.4 } },
      markLine: i === 0 ? markLineDe(spec, { min: 0, max: 1 }) : undefined,
      markArea: i === 0 ? markAreaDe(spec) : undefined,
    };
  });
  series.forEach((s, i) => {
    if (s.errores?.length) out.push(erroresCustom(cats, s.valores, s.errores, h, i, series.length));
  });

  const ejeCat = ejeCategoria(h ? spec.ejes?.y : spec.ejes?.x, cats, {
    inverse: h,
    nameGap: h ? 12 : 30,
    // con inverse, "start" queda arriba: el nombre del eje no choca con los ticks del eje de valores
    nameLocation: h ? "start" : "middle",
    axisLabel: {
      hideOverlap: !h,
      interval: h ? 0 : "auto",
      color: T.text2,
      fontSize: 11,
      width: h ? 150 : undefined,
      overflow: h ? "truncate" : "none",
      rotate: !h && cats.length > 8 && (ctx.ancho ?? 800) < 640 ? 35 : 0,
    },
  });
  const ejeVal = ejeValor(h ? spec.ejes?.x : spec.ejes?.y, fv, { nameGap: h ? 30 : 46, type: op.escala_log ? "log" : "value" });

  return {
    grid: rejilla(spec, {
      top: nombres.length >= 2 ? 36 : 20,
      right: etiquetar && h ? 56 : 20,
      nombreX: h ? spec.ejes?.x : spec.ejes?.x,
      nombreY: h ? undefined : spec.ejes?.y,
    }),
    legend: leyenda(nombres, "barra"),
    xAxis: h ? ejeVal : ejeCat,
    yAxis: h ? ejeCat : ejeVal,
    tooltip: tooltipBase({
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { seriesName: string; color: string; value: number; name: string; dataIndex: number; seriesIndex: number }[]) => {
        const vis = ps.filter((p) => !String(p.seriesName).startsWith("__err"));
        if (!vis.length) return "";
        const j = vis[0].dataIndex;
        const fam = spec.datos.familias?.[j];
        return (
          cabeceraTooltip(vis[0].name + (fam ? ` · ${fam}` : "")) +
          vis
            .map((p) => {
              const err = series[p.seriesIndex]?.errores?.[j];
              const txt = formatear(p.value, fv) + (err ? ` ± ${formatear(err, fv)}` : "");
              return filaTooltip(typeof p.color === "string" ? p.color : SERIES[0], p.seriesName, txt, "barra");
            })
            .join("")
        );
      },
    }),
    series: out,
  };
}

function histograma(spec: FiguraSpec): Obj {
  const bordes = spec.datos.bordes ?? [];
  const series = (spec.datos.series ?? []) as SerieConteos[];
  const op = spec.opciones ?? {};
  const fx = op.formato_x;
  const fy = op.formato_y ?? (op.normalizado ? "pct" : "int");
  const cats = bordes.slice(0, -1).map((b, i) => `${formatearEje(b, fx)} – ${formatearEje(bordes[i + 1], fx)}`);
  const nombres = series.map((s) => s.nombre);
  const superpuesto = !op.apilado && series.length > 1;
  return {
    grid: rejilla(spec, { top: nombres.length >= 2 ? 36 : 20, nombreY: spec.ejes?.y ?? "y" }),
    legend: leyenda(nombres, "barra"),
    xAxis: ejeCategoria(spec.ejes?.x, cats, {
      axisLabel: { formatter: (v: string) => v.split(" – ")[0], hideOverlap: true, color: T.text3, fontFamily: T.fontMono, fontSize: 10.5 },
    }),
    yAxis: ejeValor(spec.ejes?.y ?? (op.normalizado ? "Proporción" : "Frecuencia"), fy, { nameGap: 46 }),
    tooltip: tooltipBase({
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { seriesName: string; color: string; value: number; name: string }[]) =>
        cabeceraTooltip(ps[0]?.name ?? "") + ps.map((p) => filaTooltip(p.color, p.seriesName, formatear(p.value, fy), "barra")).join(""),
    }),
    series: series.map((s, i) => {
      const color = colorSerie(s.nombre, i, spec);
      const total = s.conteos.reduce((a, b) => a + b, 0) || 1;
      return {
        type: "bar",
        name: s.nombre,
        stack: op.apilado ? "h" : undefined,
        barGap: superpuesto ? "-100%" : "0%",
        barCategoryGap: 2,
        data: s.conteos.map((c) => (op.normalizado ? c / total : c)),
        itemStyle: { color: superpuesto ? alfa(color, 0.62) : color, borderRadius: op.apilado ? 0 : [2, 2, 0, 0] },
        emphasis: { itemStyle: { color } },
        markLine: i === 0 ? markLineDe(spec, { min: 0, max: 1 }) : undefined,
      };
    }),
  };
}

function dispersion(spec: FiguraSpec, ctx: ContextoOpcion): Obj {
  const series = (spec.datos.series ?? []) as SeriePuntos[];
  const op = spec.opciones ?? {};
  const total = series.reduce((a, s) => a + s.puntos.length, 0);
  const grande = total > 2000;
  const pocos = total <= 24;
  const tam = op.tamano_punto ?? (grande ? 3 : total > 300 ? 5 : pocos ? 13 : 9);
  const fx = op.formato_x;
  const fy = op.formato_y;
  const nombres = series.map((s) => s.nombre);
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) for (const p of s.puntos) (min = Math.min(min, p[0], p[1])), (max = Math.max(max, p[0], p[1]));
  return {
    grid: rejilla(spec, { top: nombres.length >= 2 ? 36 : 20, right: pocos ? 110 : 20 }),
    legend: leyenda(nombres, "punto"),
    xAxis: ejeValor(spec.ejes?.x, fx, {
      scale: true,
      min: op.min_x,
      splitLine: { show: true, lineStyle: { color: T.grid } },
      axisLine: { show: false },
    }),
    yAxis: ejeValor(spec.ejes?.y, fy, { scale: true, nameGap: 46, min: op.min_y, max: op.max_y }),
    tooltip: tooltipBase({
      trigger: "item",
      formatter: (p: { seriesName: string; color: string; value: number[] }) =>
        cabeceraTooltip(p.seriesName) +
        filaTooltip(p.color, spec.ejes?.x ?? "x", formatear(p.value[0], fx), "punto") +
        filaTooltip(p.color, spec.ejes?.y ?? "y", formatear(p.value[1], fy), "punto"),
    }),
    series: series.map((s, i) => {
      const color = colorSerie(s.nombre, i, spec);
      return {
        type: "scatter",
        name: s.nombre,
        data: s.puntos.map((p) => [p[0], p[1]]),
        symbolSize: tam,
        large: grande,
        largeThreshold: 2000,
        progressive: grande ? 4000 : 400,
        progressiveThreshold: 3000,
        itemStyle: {
          color: grande ? alfa(color, 0.55) : alfa(color, pocos ? 1 : 0.8),
          borderColor: grande ? undefined : T.panel,
          borderWidth: grande ? 0 : pocos ? 2 : 1,
        },
        emphasis: { scale: 1.4, itemStyle: { color } },
        label: pocos
          ? {
              show: (ctx.ancho ?? 800) > 380,
              position: "right",
              distance: 8,
              formatter: () => s.nombre,
              color: T.text2,
              fontSize: 11,
            }
          : undefined,
        labelLayout: pocos ? { hideOverlap: true } : undefined,
        markLine: i === 0 ? markLineDe(spec, { min, max }) : undefined,
        markArea: i === 0 ? markAreaDe(spec) : undefined,
        markPoint: i === 0 ? markPointDe(spec) : undefined,
      };
    }),
  };
}

function boxplot(spec: FiguraSpec): Obj {
  const cats = (spec.datos.categorias ?? []).map(String);
  const series = (spec.datos.series ?? []) as SerieCajas[];
  const op = spec.opciones ?? {};
  const fy = op.formato_y;
  const nombres = series.map((s) => s.nombre);
  const etiquetas = ["Mínimo", "Q1", "Mediana", "Q3", "Máximo"];
  return {
    grid: rejilla(spec, { top: nombres.length >= 2 ? 36 : 20 }),
    legend: leyenda(nombres, "barra"),
    xAxis: ejeCategoria(spec.ejes?.x, cats, { boundaryGap: true }),
    yAxis: ejeValor(spec.ejes?.y, fy, { nameGap: 46, scale: true, type: op.escala_log ? "log" : "value" }),
    tooltip: tooltipBase({
      trigger: "item",
      formatter: (p: { seriesName: string; color: string; name: string; value: number[] }) => {
        const v = p.value.length === 6 ? p.value.slice(1) : p.value;
        return cabeceraTooltip(`${p.name} · ${p.seriesName}`) + v.map((x, k) => filaTooltip(p.color, etiquetas[k], formatear(x, fy), "barra")).join("");
      },
    }),
    series: series.map((s, i) => {
      const color = colorSerie(s.nombre, i, spec);
      return {
        type: "boxplot",
        name: s.nombre,
        data: s.cajas,
        boxWidth: [8, 28],
        itemStyle: { color: alfa(color, 0.14), borderColor: color, borderWidth: 1.5 },
        emphasis: { itemStyle: { color: alfa(color, 0.28), borderColor: color, borderWidth: 2 } },
      };
    }),
  };
}

function heatmap(spec: FiguraSpec, ctx: ContextoOpcion): Obj {
  const conf = spec.tipo === "matriz_confusion";
  const xs = (conf ? spec.datos.etiquetas : spec.datos.x) ?? [];
  const ys = (conf ? spec.datos.etiquetas : spec.datos.y) ?? [];
  const M = (spec.datos.valores ?? []) as number[][];
  const op = spec.opciones ?? {};
  const fv = op.formato_y ?? (conf ? "int" : "dec2");
  const plano: number[] = M.flat();
  const min = Math.min(...plano);
  const max = Math.max(...plano);
  const total = plano.reduce((a, b) => a + b, 0) || 1;
  const divergente = !conf && min < 0;
  const absMax = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const celdas = xs.length * ys.length;
  const etiquetar = celdas <= 144 && (ctx.ancho ?? 800) / Math.max(xs.length, 1) > 34;
  const rampa = divergente ? DIVERGENTE : SECUENCIAL;
  const data: number[][] = [];
  M.forEach((fila, i) => fila.forEach((v, j) => data.push([j, i, v])));
  const colorDe = (v: number) => {
    const t = divergente ? (v + absMax) / (2 * absMax) : max === min ? 1 : (v - min) / (max - min);
    const k = Math.min(rampa.length - 1, Math.max(0, Math.round(t * (rampa.length - 1))));
    return rampa[k];
  };
  return {
    grid: { top: 12, right: 16, left: 12, bottom: conf ? 12 : 24, containLabel: true },
    xAxis: ejeCategoria(conf ? (spec.ejes?.x ?? "Predicho") : spec.ejes?.x, xs, {
      splitArea: { show: false },
      axisLine: { show: false },
      position: conf ? "top" : "bottom",
      nameLocation: conf ? "middle" : "middle",
      nameGap: conf ? 28 : 30,
      axisLabel: { interval: 0, rotate: !conf && xs.length > 6 ? 40 : 0, color: T.text2, fontSize: 10.5, width: 90, overflow: "truncate" },
    }),
    yAxis: ejeCategoria(conf ? (spec.ejes?.y ?? "Real") : spec.ejes?.y, ys, {
      inverse: true,
      axisLine: { show: false },
      nameGap: 60,
      axisLabel: { interval: 0, color: T.text2, fontSize: 10.5, width: 110, overflow: "truncate" },
    }),
    visualMap: {
      show: false,
      min: divergente ? -absMax : min,
      max: divergente ? absMax : max,
      inRange: { color: rampa },
      dimension: 2,
    },
    tooltip: tooltipBase({
      trigger: "item",
      formatter: (p: { value: number[] }) => {
        const [j, i, v] = p.value;
        const c = colorDe(v);
        return (
          cabeceraTooltip(conf ? `Real ${ys[i]} · Predicho ${xs[j]}` : `${ys[i]} × ${xs[j]}`) +
          filaTooltip(c, conf ? "Casos" : "Valor", formatear(v, fv), "barra") +
          (conf ? filaTooltip(c, "Del total", pct(v / total), "barra") : "")
        );
      },
    }),
    series: [
      {
        type: "heatmap",
        data: data.map((d) => ({ value: d, label: { color: tintaSobre(colorDe(d[2])) } })),
        itemStyle: { borderColor: T.panel, borderWidth: 2, borderRadius: conf ? 8 : 3 },
        emphasis: { itemStyle: { borderColor: "rgba(255,255,255,0.6)", borderWidth: 1 } },
        label: {
          show: etiquetar || conf,
          fontFamily: T.fontMono,
          fontSize: conf ? 15 : 10,
          fontWeight: conf ? 600 : 400,
          lineHeight: conf ? 22 : 12,
          formatter: (p: { value: number[] }) => {
            const v = p.value[2];
            return conf ? `${formatear(v, fv)}\n{s|${pct(v / total)}}` : formatear(v, fv);
          },
          rich: { s: { fontSize: 10.5, fontFamily: T.fontMono, opacity: 0.75 } },
        },
      },
    ],
  };
}

function dona(spec: FiguraSpec): Obj {
  const cats = (spec.datos.categorias ?? []).map(String);
  const vals = (spec.datos.valores ?? []) as number[];
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  const op = spec.opciones ?? {};
  const fv = op.formato_y;
  const colores = cats.map((c, i) => {
    if (op.color_por) return colorCategoria(spec, c, i, vals[i], SERIES[i % SERIES.length]);
    return colorSemantico(c) ?? (/(aprob|revis|rechaz|bajo|medio|alto)/i.test(c) ? colorBanda(c) : SERIES[i % SERIES.length]);
  });
  return {
    legend: {
      show: true,
      orient: "vertical",
      right: 0,
      top: "middle",
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      formatter: (n: string) => {
        const i = cats.indexOf(n);
        return `${n}  ${pct(vals[i] / total)}`;
      },
      textStyle: { color: T.text2, fontSize: 12, fontFamily: T.fontText },
    },
    tooltip: tooltipBase({
      trigger: "item",
      formatter: (p: { name: string; value: number; color: string; percent: number }) =>
        cabeceraTooltip(p.name) + filaTooltip(p.color, "Valor", formatear(p.value, fv), "barra") + filaTooltip(p.color, "Participación", pct(p.percent / 100), "barra"),
    }),
    series: [
      {
        type: "pie",
        radius: ["58%", "80%"],
        center: ["34%", "50%"],
        padAngle: 1.5,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: T.panel, borderWidth: 2, borderRadius: 4 },
        label: {
          show: true,
          position: "center",
          formatter: () => `{v|${fv ? formatear(total, fv) : formatear(total, "int")}}\n{l|total}`,
          rich: {
            v: { fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600, color: T.text, lineHeight: 30 },
            l: { fontFamily: T.fontMono, fontSize: 10, color: T.text3, lineHeight: 16 },
          },
        },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 4, label: { show: true } },
        data: cats.map((c, i) => ({ name: c, value: vals[i], itemStyle: { color: colores[i] } })),
      },
    ],
  };
}

/** Construye la opción ECharts para un spec (tipos con lienzo). */
export function construirOpcion(spec: FiguraSpec, ctx: ContextoOpcion = {}): Obj {
  let o: Obj;
  switch (spec.tipo) {
    case "lineas":
    case "area":
    case "curva_roc":
    case "curva_pr":
    case "calibracion":
      o = lineas(spec, ctx);
      break;
    case "barras":
    case "barras_h":
      o = barras(spec, ctx);
      break;
    case "histograma":
      o = histograma(spec);
      break;
    case "dispersion":
      o = dispersion(spec, ctx);
      break;
    case "boxplot":
      o = boxplot(spec);
      break;
    case "heatmap":
    case "matriz_confusion":
      o = heatmap(spec, ctx);
      break;
    case "dona":
      o = dona(spec);
      break;
    default:
      throw new Error(`Tipo de figura sin lienzo: ${spec.tipo}`);
  }
  const reducido = !!ctx.reducido;
  return {
    animation: !reducido,
    animationDuration: reducido ? 0 : 750,
    animationDurationUpdate: reducido ? 0 : 450,
    animationEasing: "cubicOut",
    aria: { enabled: true, label: { description: `${spec.titulo}. ${spec.lectura ?? ""}` } },
    ...o,
  };
}

/** Número de marcas que pintará el spec (para decidir canvas vs SVG). */
export function contarMarcas(spec: FiguraSpec): number {
  const s = spec.datos.series as { puntos?: unknown[]; x?: unknown[]; valores?: unknown[]; conteos?: unknown[] }[] | undefined;
  if (!s) return (spec.datos.valores as unknown[] | undefined)?.flat?.().length ?? 0;
  return s.reduce((a, x) => a + (x.puntos?.length ?? x.x?.length ?? x.valores?.length ?? x.conteos?.length ?? 0), 0);
}

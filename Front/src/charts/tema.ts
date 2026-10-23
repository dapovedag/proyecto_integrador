/**
 * Tema ECharts derivado de los tokens (src/styles/tokens.css) + paletas semánticas.
 *
 * Método (skill dataviz): el color se asigna por el TRABAJO que hace —
 *  · identidad (categórica, orden fijo, nunca ciclado) → SERIES
 *  · estado/decisión (reservado, siempre con etiqueta) → DECISION
 *  · polaridad (divergente, punto medio neutro) → SIGNO / divergente
 *  · magnitud (secuencial, un solo tono) → SECUENCIAL
 * La tinta de textos nunca lleva el color de la serie.
 */

export const T = {
  bg: "#0B0C10",
  panel: "#14151B",
  panel2: "#1A1B23",
  panel3: "#22232D",
  line: "rgba(255,255,255,0.08)",
  line2: "rgba(255,255,255,0.14)",
  grid: "rgba(255,255,255,0.06)",
  text: "#ECEDF2",
  text2: "#A9ACBA",
  text3: "#80838F",
  accent: "#505CFD",
  accent2: "#8F97FF",
  mod1: "#F97316",
  mod2: "#8B5CF6",
  ok: "#34D399",
  warn: "#FBBF24",
  bad: "#F87171",
  pago: "#60A5FA",
  impago: "#F87171",
  fontText: '"Inter Variable", Inter, system-ui, sans-serif',
  fontMono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
  fontDisplay: '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif',
} as const;

/** Orden categórico fijo (validado contra el panel oscuro: CVD adyacente ≥ 8, contraste ≥ 3:1). */
export const SERIES = ["#7B84FF", "#E8742A", "#1FB2C4", "#B07CF7", "#C9971A", "#DD5F9E"] as const;

export const DECISION: Record<string, string> = {
  aprobar: T.ok,
  revisar: T.warn,
  rechazar: T.bad,
  bajo: T.ok,
  medio: T.warn,
  alto: T.bad,
};

export const DESENLACE: Record<string, string> = {
  pago: T.pago,
  "no impago": T.pago,
  "buen pagador": T.pago,
  impago: T.impago,
  default: T.impago,
  "mal pagador": T.impago,
};

/** familia de modelo → color. "final" usa el acento de marca y además se rotula (nunca solo color). */
export const FAMILIA: Record<string, string> = {
  "línea base": "#6B7385",
  "linea base": "#6B7385",
  clásico: "#E8742A",
  clasico: "#E8742A",
  "deep learning": "#A178F7",
  nlp: "#1FB2C4",
  "big data": "#C9971A",
  final: "#6670FF",
};

export const MODULO: Record<string, string> = { M1: T.mod1, M2: T.mod2, T: "#94A3B8" };

/** Divergente (contribuciones, correlaciones): reduce riesgo ↔ aumenta riesgo, punto medio gris. */
export const SIGNO = { negativo: T.pago, positivo: T.impago, cero: "#4B5060" } as const;

/** Rampa secuencial (un tono, oscuro → claro sobre fondo oscuro = poco → mucho). */
export const SECUENCIAL = ["#1B1E3A", "#262C66", "#343E9A", "#4553D0", "#6670FF", "#9AA1FF", "#CDD1FF"];
export const DIVERGENTE = ["#2F6FD6", "#5B93E8", "#9DBBEA", "#3A3D4A", "#EBA3A3", "#E66F6F", "#C9413F"];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Color semántico por nombre (decisión, desenlace, familia) o null si no aplica. */
export function colorSemantico(nombre: string): string | null {
  const n = norm(nombre);
  for (const [k, c] of Object.entries(DECISION)) if (n === k) return c;
  for (const [k, c] of Object.entries(DESENLACE)) if (n === norm(k)) return c;
  if (n.startsWith("impago")) return T.impago;
  if (n.startsWith("pago") || n.startsWith("no impago")) return T.pago;
  return null;
}

export function colorFamilia(f: string | undefined): string {
  if (!f) return SERIES[0];
  return FAMILIA[f] ?? FAMILIA[norm(f)] ?? SERIES[0];
}

export function colorModulo(s: string): string {
  const n = norm(s);
  if (n.startsWith("m1") || n.includes("programacion")) return T.mod1;
  if (n.startsWith("m2") || n.includes("inteligencia") || n.startsWith("ia")) return T.mod2;
  return MODULO.T;
}

export function colorBanda(s: string): string {
  const n = norm(s);
  if (n.includes("aprob") || n.includes("bajo")) return T.ok;
  if (n.includes("revis") || n.includes("medio")) return T.warn;
  if (n.includes("rechaz") || n.includes("alto")) return T.bad;
  return SERIES[0];
}

/** Mezcla un hex con alfa → rgba(). */
export function alfa(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Luminancia relativa para decidir tinta blanca/negra dentro de un relleno. */
export function tintaSobre(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return T.text;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.36 ? "#0B0C10" : "#F5F6FA";
}

/** Tema ECharts registrado como "expediente". */
export const temaEcharts = {
  color: [...SERIES],
  backgroundColor: "transparent",
  textStyle: { fontFamily: T.fontText, color: T.text2, fontSize: 12 },
  animationDuration: 700,
  animationEasing: "cubicOut",
  animationDurationUpdate: 450,
  animationEasingUpdate: "cubicInOut",
  grid: { left: 8, right: 20, top: 28, bottom: 8, containLabel: true },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: T.line2 } },
    axisTick: { show: false },
    axisLabel: { color: T.text3, fontFamily: T.fontText, fontSize: 11, margin: 10 },
    splitLine: { show: false },
    nameTextStyle: { color: T.text3, fontSize: 11, fontFamily: T.fontText },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: T.text3, fontFamily: T.fontMono, fontSize: 10.5, margin: 10 },
    splitLine: { show: true, lineStyle: { color: T.grid, width: 1, type: "solid" } },
    nameTextStyle: { color: T.text3, fontSize: 11, fontFamily: T.fontText },
  },
  logAxis: {
    axisLabel: { color: T.text3, fontFamily: T.fontMono, fontSize: 10.5 },
    splitLine: { show: true, lineStyle: { color: T.grid } },
  },
  legend: {
    textStyle: { color: T.text2, fontSize: 11.5, fontFamily: T.fontText },
    itemWidth: 14,
    itemHeight: 8,
    itemGap: 16,
    inactiveColor: "#3A3D4A",
    pageTextStyle: { color: T.text3 },
    pageIconColor: T.text2,
    pageIconInactiveColor: "#3A3D4A",
  },
  tooltip: {
    backgroundColor: "rgba(26,27,35,0.96)",
    borderColor: T.line2,
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: T.text, fontFamily: T.fontText, fontSize: 12 },
    extraCssText: "border-radius:10px;box-shadow:0 18px 40px -12px rgba(0,0,0,.8);backdrop-filter:blur(8px);",
    axisPointer: {
      lineStyle: { color: "rgba(255,255,255,0.28)", width: 1 },
      crossStyle: { color: "rgba(255,255,255,0.28)" },
      shadowStyle: { color: "rgba(255,255,255,0.035)" },
    },
  },
  line: { symbol: "circle", symbolSize: 8, lineStyle: { width: 2 }, smooth: false },
  bar: { itemStyle: { borderRadius: [4, 4, 0, 0] } },
  scatter: { symbolSize: 6 },
  markLine: { lineStyle: { color: "rgba(255,255,255,0.35)" } },
};

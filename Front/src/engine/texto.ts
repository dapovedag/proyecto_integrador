/**
 * Motor de texto: port exacto de `ArtefactoTexto.predecir` (TF-IDF 1-2 gramas + regresión logística
 * calibrada) y del sentimiento por léxico de `credit_risk.nlp`. Verificado con pruebas golden.
 */

import { decidir, bandaDe, type Banda, type Umbrales } from "./scoring";

export interface TextoExport {
  ngramas: [number, number];
  token_pattern: string;
  norma: string;
  sublinear_tf: boolean;
  stopwords: string[];
  vocabulario: string[];
  idf: number[];
  coeficientes: number[];
  intercepto: number;
  calibracion: { a: number; b: number };
  umbrales: Umbrales;
  lexico: { positivas: string[]; negativas: string[] };
  texto_faltante: string;
}

export type Sentimiento = "positivo" | "negativo" | "neutral";

export interface PrediccionTexto {
  probabilidad_impago_texto: number;
  banda_riesgo: Banda;
  sentimiento: Sentimiento;
  modelo: string;
}

export interface DetalleTexto {
  p: number;
  terminos: { termino: string; peso: number; contribucion: number }[];
  puntaje_lexico: number;
}

/** `credit_risk.nlp.normalizar`: minúsculas y sin tildes; nulo o "Sin texto" → "". */
export function normalizar(texto: string | null | undefined, faltante = "Sin texto"): string {
  if (texto === null || texto === undefined || texto === faltante) return "";
  return texto.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

// \b de Python (Unicode): límite entre un carácter de palabra [\p{L}\p{N}_] y uno que no lo es.
const TOKEN = /(?<![\p{L}\p{N}_])[a-zñ]{2,}(?![\p{L}\p{N}_])/gu;

/** Analizador de TfidfVectorizer: tokens → quitar stopwords → n-gramas (como `_word_ngrams` de sklearn). */
export function analizar(texto: string, t: TextoExport, stop: Set<string>): string[] {
  const toks = (normalizar(texto, t.texto_faltante).match(TOKEN) ?? []).filter((w) => !stop.has(w));
  const [minN, maxN] = t.ngramas;
  const out: string[] = minN === 1 ? [...toks] : [];
  for (let n = Math.max(minN, 2); n <= Math.min(maxN, toks.length); n++) {
    for (let i = 0; i + n <= toks.length; i++) out.push(toks.slice(i, i + n).join(" "));
  }
  return out;
}

/** Puntaje del léxico: positivas − negativas (tokens [a-zñ]+ sin quitar stopwords). */
export function puntajeLexico(texto: string, t: TextoExport): number {
  const toks = normalizar(texto, t.texto_faltante).match(/[a-zñ]+/g) ?? [];
  const pos = new Set(t.lexico.positivas);
  const neg = new Set(t.lexico.negativas);
  return toks.reduce((s, w) => s + (pos.has(w) ? 1 : 0) - (neg.has(w) ? 1 : 0), 0);
}

export function sentimiento(texto: string, t: TextoExport): Sentimiento {
  const s = puntajeLexico(texto, t);
  return s > 0 ? "positivo" : s < 0 ? "negativo" : "neutral";
}

/** Crea un predictor con índices precalculados (vocabulario → posición). */
export function crearMotorTexto(t: TextoExport) {
  const indice = new Map(t.vocabulario.map((w, i) => [w, i] as const));
  const stop = new Set(t.stopwords);

  function detallar(texto: string): DetalleTexto {
    const conteos = new Map<number, number>();
    for (const g of analizar(texto, t, stop)) {
      const j = indice.get(g);
      if (j !== undefined) conteos.set(j, (conteos.get(j) ?? 0) + 1);
    }
    const pesos = [...conteos.entries()].map(([j, tf]) => [j, (t.sublinear_tf ? 1 + Math.log(tf) : tf) * t.idf[j]] as const);
    const norma = Math.sqrt(pesos.reduce((s, [, w]) => s + w * w, 0));
    let f = t.intercepto;
    const terminos = pesos.map(([j, w]) => {
      const x = norma > 0 ? w / norma : 0;
      f += t.coeficientes[j] * x;
      return { termino: t.vocabulario[j], peso: x, contribucion: t.coeficientes[j] * x };
    });
    const { a, b } = t.calibracion;
    terminos.sort((x, y) => Math.abs(y.contribucion) - Math.abs(x.contribucion));
    return { p: 1 / (1 + Math.exp(a * f + b)), terminos, puntaje_lexico: puntajeLexico(texto, t) };
  }

  function predecir(texto: string): PrediccionTexto {
    const { p } = detallar(texto);
    return {
      probabilidad_impago_texto: Math.round(p * 1e4) / 1e4,
      banda_riesgo: bandaDe(decidir(p, t.umbrales)),
      sentimiento: sentimiento(texto, t),
      modelo: "tfidf_logreg_calibrado",
    };
  }

  return { detallar, predecir };
}

/**
 * Piezas del reproductor: celda Markdown, bloque de código resaltado y salidas reales (stream, html,
 * texto, markdown, figura nativa, imagen, error) con revelado progresivo.
 */
import { Highlight } from "prism-react-renderer";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Figura } from "@/charts/Figura";
import type { SalidaCelda } from "@/data/tipos";
import { temaCodigo } from "../comun/temaCodigo";
import { planRevelado } from "./tiempos";

/* ------------------------------------------------------------------ */
/* Markdown                                                            */
/* ------------------------------------------------------------------ */
const plugins = [remarkGfm];

export const Markdown = memo(function Markdown({ fuente, className = "" }: { fuente: string; className?: string }) {
  return (
    <div className={`nb-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={plugins}
        components={{
          table: ({ children }) => (
            <div className="nb-md__tabla">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => {
            const externo = href && /^https?:/i.test(href);
            return externo ? <span className="nb-md__enlace" title={href}>{children}</span> : <a href={href}>{children}</a>;
          },
          img: () => null,
        }}
      >
        {fuente}
      </ReactMarkdown>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Código resaltado                                                    */
/* ------------------------------------------------------------------ */
const LINEAS_PLEGADO = 18;
const LINEAS_VISIBLES = 12;

export const Codigo = memo(function Codigo({ fuente, etiqueta }: { fuente: string; etiqueta: string }) {
  const lineas = useMemo(() => fuente.replace(/\n+$/, "").split("\n").length, [fuente]);
  const plegable = lineas > LINEAS_PLEGADO;
  const [abierto, setAbierto] = useState(false);
  const plegado = plegable && !abierto;
  return (
    <div className={`nb-codigo ${plegado ? "nb-codigo--plegado" : ""}`}>
      <Highlight theme={temaCodigo} code={fuente.replace(/\n+$/, "")} language="python">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`nb-codigo__pre ${className}`} style={style} aria-label={etiqueta} tabIndex={0}>
            <code>
              {(plegado ? tokens.slice(0, LINEAS_VISIBLES) : tokens).map((linea, i) => {
                const { key: _k, ...props } = getLineProps({ line: linea }) as ReturnType<typeof getLineProps> & { key?: unknown };
                return (
                  <span key={i} {...props} className={`nb-codigo__linea ${props.className ?? ""}`}>
                    <span className="nb-codigo__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="nb-codigo__txt">
                      {linea.map((tk, k) => {
                        const { key: _kt, ...tp } = getTokenProps({ token: tk }) as ReturnType<typeof getTokenProps> & { key?: unknown };
                        return <span key={k} {...tp} />;
                      })}
                      {linea.length === 1 && linea[0].empty ? "\n" : null}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
      {plegable && (
        <button type="button" className="nb-codigo__plegar" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d={abierto ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {abierto ? "Plegar código" : `Mostrar ${lineas - LINEAS_VISIBLES} líneas más`}
        </button>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Salidas                                                             */
/* ------------------------------------------------------------------ */
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

/** Unidades de tiempo de cada salida (una por línea de stream). */
export function unidadesSalida(s: SalidaCelda): number {
  switch (s.tipo) {
    case "stream":
      return Math.max(1, Math.min(40, lineasStream(s.texto).length));
    case "figura":
      return 4;
    case "html":
    case "imagen":
      return 3;
    case "texto":
    case "markdown":
      return 2;
    default:
      return 1;
  }
}

function lineasStream(t: string): string[] {
  return t.replace(/\n$/, "").split("\n");
}

/** Marca como numéricas las celdas td de las tablas pandas (alineación tabular). */
function prepararHtml(html: string): string {
  return html
    .replace(/<td>(\s*[-+]?(?:\d[\d,]*)?\.?\d+(?:e[-+]?\d+)?%?\s*|NaN|None|True|False)<\/td>/gi, '<td class="n">$1</td>')
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<table[^>]*>/i, "<table>");
}

const HtmlTabla = memo(function HtmlTabla({ html }: { html: string }) {
  const limpio = useMemo(() => prepararHtml(html), [html]);
  return <div className="nb-html" dangerouslySetInnerHTML={{ __html: limpio }} />;
});

function ImagenSalida({ s }: { s: Extract<SalidaCelda, { tipo: "imagen" }> }) {
  return (
    <img
      className="nb-img"
      src={`${BASE}${s.src.replace(/^\/+/, "")}`}
      width={s.ancho}
      height={s.alto}
      loading="lazy"
      decoding="async"
      alt="Figura generada por matplotlib en la ejecución real"
      style={s.ancho && s.alto ? { aspectRatio: `${s.ancho} / ${s.alto}` } : undefined}
    />
  );
}

/** Difiere el montaje de salidas pesadas hasta que la celda se acerca al viewport. */
function Diferido({ children, alto = 220 }: { children: ReactNode; alto?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ver, setVer] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (ver || !ref.current) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (setVer(true), io.disconnect()), { rootMargin: "800px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ver]);
  return ver ? <>{children}</> : <div ref={ref} className="nb-diferido" style={{ minHeight: alto }} aria-hidden="true" />;
}

export interface SalidasProps {
  salidas: SalidaCelda[];
  /** 0–1: fracción del tiempo de la celda ya transcurrido (1 = todo visible). */
  progreso: number;
  verReferencia: boolean;
  animar: boolean;
}

export const Salidas = memo(function Salidas({ salidas, progreso, verReferencia, animar }: SalidasProps) {
  const visibles = useMemo(() => salidas.filter((s) => !(s.tipo === "imagen" && s.referencia && !verReferencia)), [salidas, verReferencia]);
  const plan = useMemo(() => planRevelado(visibles.map(unidadesSalida)), [visibles]);
  if (!visibles.length) return null;
  return (
    <div className={`nb-salidas ${animar ? "nb-salidas--animar" : ""}`}>
      {visibles.map((s, i) => {
        const { inicio, fin } = plan[i];
        if (progreso < inicio) return null;
        const local = progreso >= fin ? 1 : (progreso - inicio) / Math.max(1e-6, fin - inicio);
        return <Salida key={i} s={s} local={local} />;
      })}
    </div>
  );
});

function Salida({ s, local }: { s: SalidaCelda; local: number }) {
  switch (s.tipo) {
    case "stream": {
      const lineas = lineasStream(s.texto);
      const n = local >= 1 ? lineas.length : Math.max(1, Math.ceil(local * lineas.length));
      return (
        <pre className={`nb-stream nb-stream--${s.nombre}`} data-salida="stream">
          {lineas.slice(0, n).map((l, i) => (
            <span key={i} className="nb-stream__linea">
              {l}
              {"\n"}
            </span>
          ))}
        </pre>
      );
    }
    case "texto":
      return (
        <pre className="nb-texto" data-salida="texto">
          {s.texto}
        </pre>
      );
    case "markdown":
      return (
        <div className="nb-salida-md" data-salida="markdown">
          <Markdown fuente={s.texto} />
        </div>
      );
    case "html":
      return (
        <div className="nb-entra" data-salida="html">
          <HtmlTabla html={s.html} />
        </div>
      );
    case "figura":
      return (
        <div className="nb-entra nb-figura" data-salida="figura">
          <Diferido alto={320}>
            <Figura spec={s.spec} superficie="plana" />
          </Diferido>
        </div>
      );
    case "imagen":
      return (
        <div className={`nb-entra nb-imagen ${s.referencia ? "nb-imagen--ref" : ""}`} data-salida="imagen">
          {s.referencia && <span className="versalitas nb-imagen__rotulo">Referencia · matplotlib</span>}
          <ImagenSalida s={s} />
        </div>
      );
    case "error":
      return (
        <pre className="nb-error" data-salida="error" role="alert">
          {s.texto}
        </pre>
      );
    default:
      return null;
  }
}

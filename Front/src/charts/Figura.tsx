/**
 * <Figura spec={...} /> — renderiza CUALQUIER figura nativa del paquete de corrida.
 *
 * - Tipos con lienzo → ECharts (registro modular + tema "expediente"); SVG para figuras pequeñas
 *   (texto nítido) y canvas con render progresivo para dispersiones grandes.
 * - `kpi` y `tabla` → HTML.
 * - Se inicializa al entrar en pantalla (animación de entrada), se adapta con ResizeObserver y
 *   respeta prefers-reduced-motion. Pie con clave de lectura, Evidencia y "Ver datos".
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FiguraSpec } from "@/data/tipos";
import { echarts } from "./echarts";
import { Evidencia } from "./Evidencia";
import { formatear } from "./formatos";
import { construirOpcion, contarMarcas } from "./opcion";
import { TablaDatos } from "./VerDatos";

export interface FiguraProps {
  spec: FiguraSpec;
  /** Alto del lienzo en px (por defecto según el tipo). */
  alto?: number;
  /** Oculta encabezado (título/subtítulo) cuando el contenedor ya lo muestra. */
  sinTitulo?: boolean;
  /** Oculta el pie (evidencia + ver datos). */
  sinPie?: boolean;
  /** Superficie: "panel" (tarjeta con borde) o "plana" (sin caja, p. ej. dentro del reproductor). */
  superficie?: "panel" | "plana";
  className?: string;
}

const esTest = import.meta.env.MODE === "test";

function prefiereReducido(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function altoPorDefecto(spec: FiguraSpec, ancho = 800): number {
  const movil = ancho < 560;
  switch (spec.tipo) {
    case "dona":
      return 260;
    case "matriz_confusion":
      return movil ? 260 : 300;
    case "heatmap": {
      const filas = spec.datos.y?.length ?? 8;
      return Math.max(280, Math.min(640, filas * (movil ? 22 : 28) + 90));
    }
    case "barras_h": {
      const n = spec.datos.categorias?.length ?? 6;
      const ns = spec.datos.series?.length ?? 1;
      return Math.max(200, n * (ns > 1 ? 18 * ns + 12 : 30) + 70);
    }
    case "dispersion":
      return movil ? 300 : 380;
    default:
      return movil ? 260 : 320;
  }
}

function Lienzo({ spec, alto }: { spec: FiguraSpec; alto?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
  const [visible, setVisible] = useState(esTest || typeof IntersectionObserver === "undefined");
  const [ancho, setAncho] = useState(0);
  const marcas = useMemo(() => contarMarcas(spec), [spec]);
  const h = alto ?? altoPorDefecto(spec, ancho || 800);

  // Inicializa al acercarse al viewport (anima la entrada cuando el lector llega).
  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  // Ancho del contenedor (ResizeObserver) para decidir etiquetas y alto.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setAncho(el.clientWidth || 640);
    if (typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const ro = new ResizeObserver((es) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.round(es[0].contentRect.width);
        setAncho((a) => (Math.abs(a - w) > 1 ? w : a));
        chartRef.current?.resize();
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Crea / destruye la instancia.
  useEffect(() => {
    const el = ref.current;
    if (!visible || !el) return;
    const renderer = esTest ? "svg" : marcas > 1500 || spec.tipo === "dispersion" ? "canvas" : "svg";
    const chart = echarts.init(el, "expediente", {
      renderer,
      width: el.clientWidth || 640,
      height: h,
      devicePixelRatio: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1,
    });
    chartRef.current = chart;
    return () => {
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, marcas, spec.tipo]);

  // Aplica la opción (y la reconstruye si cambia el ancho de forma relevante).
  const anchoClase = ancho < 380 ? 340 : ancho < 560 ? 480 : ancho < 760 ? 700 : 900;
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const opcion = construirOpcion(spec, { reducido: prefiereReducido(), ancho: anchoClase });
    chart.setOption(opcion, { notMerge: true, lazyUpdate: false });
    chart.resize({ height: h, width: ref.current?.clientWidth || undefined });
  }, [spec, anchoClase, h, visible]);

  return (
    <div
      ref={ref}
      className="figura__lienzo"
      style={{ height: h }}
      role="img"
      aria-label={`${spec.titulo}${spec.lectura ? `. ${spec.lectura}` : ""}`}
      data-tipo={spec.tipo}
    />
  );
}

function Kpis({ spec }: { spec: FiguraSpec }) {
  const items = spec.datos.items ?? [];
  return (
    <dl className="figura-kpis">
      {items.map((it, i) => (
        <div key={i} className="figura-kpis__item">
          <dt>{it.etiqueta}</dt>
          <dd className="display">{typeof it.valor === "number" ? formatear(it.valor, it.formato) : it.valor}</dd>
          {it.nota && <p className="figura-kpis__nota">{it.nota}</p>}
        </div>
      ))}
    </dl>
  );
}

export function Figura({ spec, alto, sinTitulo, sinPie, superficie = "panel", className = "" }: FiguraProps) {
  const [datos, setDatos] = useState(false);
  const idDatos = useId();
  const html = spec.tipo === "kpi" || spec.tipo === "tabla";
  return (
    <figure className={`figura figura--${superficie} ${className}`} data-figura={spec.id ?? spec.tipo}>
      {!sinTitulo && (
        <figcaption className="figura__cabecera">
          <span className="figura__titulo">{spec.titulo}</span>
          {spec.subtitulo && <span className="figura__subtitulo">{spec.subtitulo}</span>}
        </figcaption>
      )}
      {spec.tipo === "kpi" ? <Kpis spec={spec} /> : spec.tipo === "tabla" ? <TablaDatos spec={spec} /> : <Lienzo spec={spec} alto={alto} />}
      {spec.lectura && (
        <p className="figura__clave">
          <span className="figura__clave-rotulo">Lectura</span>
          {spec.lectura}
        </p>
      )}
      {spec.nota && <p className="figura__nota">{spec.nota}</p>}
      {!sinPie && (
        <div className="figura__pie">
          <Evidencia notebook={spec.notebook} celda={spec.celda} version={spec.version} compacta />
          {!html && (
            <button type="button" className="ver-datos" aria-expanded={datos} aria-controls={idDatos} onClick={() => setDatos((d) => !d)}>
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path d="M2 3.5h12M2 8h12M2 12.5h12M6 3.5v9" stroke="currentColor" strokeWidth="1.3" fill="none" />
              </svg>
              {datos ? "Ocultar datos" : "Ver datos"}
            </button>
          )}
        </div>
      )}
      {datos && !html && (
        <div className="ver-datos__panel">
          <TablaDatos spec={spec} id={idDatos} />
        </div>
      )}
    </figure>
  );
}

export default Figura;

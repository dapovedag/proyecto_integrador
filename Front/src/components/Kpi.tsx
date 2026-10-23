/**
 * <Kpi> con contador que sube hasta la cifra real al entrar en pantalla (respeta reduced-motion).
 *   <Kpi etiqueta="AUC test" valor={0.8456} formato="dec3" nota="…" color="var(--accent)" evidencia={<Evidencia …/>} />
 */
import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatear } from "@/charts/formatos";
import type { FormatoNum } from "@/data/tipos";

export function useContador(objetivo: number, activo: boolean, duracion = 1400): number {
  const reducido = useReducedMotion();
  const [v, setV] = useState(reducido ? objetivo : 0);
  useEffect(() => {
    if (reducido) {
      setV(objetivo);
      return;
    }
    if (!activo) return;
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / duracion);
      const e = 1 - Math.pow(1 - k, 4); // easeOutQuart
      setV(objetivo * e);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, activo, duracion, reducido]);
  return v;
}

/** Número animado formateado (úsalo dentro de cualquier texto). */
export function Contador({ valor, formato, duracion }: { valor: number; formato?: FormatoNum; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true, margin: "-40px" });
  const v = useContador(valor, visto, duracion);
  return (
    <span ref={ref} aria-label={formatear(valor, formato)}>
      <span aria-hidden="true">{formatear(v, formato)}</span>
    </span>
  );
}

export interface KpiProps {
  etiqueta: string;
  valor: number;
  formato?: FormatoNum;
  nota?: ReactNode;
  color?: string;
  evidencia?: ReactNode;
  compacto?: boolean;
  className?: string;
}

export function Kpi({ etiqueta, valor, formato = "num", nota, color, evidencia, compacto, className = "" }: KpiProps) {
  const texto = formatear(valor, formato);
  const ref = useRef<HTMLDivElement>(null);
  const visto = useInView(ref, { once: true, margin: "-40px" });
  const v = useContador(valor, visto);
  const animado = formatear(v, formato);
  // separa la unidad (%, $) para darle menos peso tipográfico
  const partes = /^(.*?)(\s?%)$/.exec(animado);
  return (
    <div ref={ref} className={`kpi ${compacto ? "kpi--compacto" : ""} ${className}`} style={color ? ({ "--kpi-c": color } as React.CSSProperties) : undefined}>
      <span className="kpi__etiqueta">{etiqueta}</span>
      <span className="kpi__valor" aria-label={texto}>
        <span aria-hidden="true">
          {partes ? (
            <>
              {partes[1]}
              <span className="kpi__unidad">%</span>
            </>
          ) : (
            animado
          )}
        </span>
      </span>
      {nota && <span className="kpi__nota">{nota}</span>}
      {evidencia}
    </div>
  );
}

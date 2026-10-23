/**
 * Cascada de contribuciones exactas en log-odds: desde la base (cliente promedio) hasta el logit final,
 * sobre las tres zonas de decisión. Color divergente por polaridad (reduce ↔ aumenta riesgo) + signo escrito.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { dec, pct } from "@/charts/formatos";
import { DECISION, SIGNO, T, alfa } from "@/charts/tema";
import type { Factor } from "@/engine/scoring";
import { NOMBRE_VARIABLE } from "./campos";

const logit = (p: number) => Math.log(p / (1 - p));
const sigm = (x: number) => 1 / (1 + Math.exp(-x));

export interface CascadaProps {
  base: number;
  contribuciones: Factor[];
  final: number;
  aprobar: number;
  rechazar: number;
  valorDe: (variable: string) => string;
  maxFilas?: number;
}

function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 640);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((es) => setW(Math.round(es[0].contentRect.width) || 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const signo = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${dec(Math.abs(v), 2)}`;

export function Cascada({ base, contribuciones, final, aprobar, rechazar, valorDe, maxFilas = 9 }: CascadaProps) {
  const [ref, w] = useAncho<HTMLDivElement>();
  const movil = w < 520;
  const filas = useMemo(() => {
    const top = contribuciones.slice(0, maxFilas);
    const resto = contribuciones.slice(maxFilas);
    const out: { id: string; nombre: string; valor: string; c: number; desde: number; hasta: number }[] = [];
    let cum = base;
    for (const f of top) {
      out.push({ id: f.variable, nombre: NOMBRE_VARIABLE[f.variable] ?? f.variable, valor: valorDe(f.variable), c: f.contribucion, desde: cum, hasta: cum + f.contribucion });
      cum += f.contribucion;
    }
    if (resto.length) {
      const c = resto.reduce((s, f) => s + f.contribucion, 0);
      out.push({ id: "_otras", nombre: `Otras ${resto.length} variables`, valor: "", c, desde: cum, hasta: cum + c });
    }
    return out;
  }, [base, contribuciones, maxFilas, valorDe]);

  const la = logit(aprobar);
  const lr = logit(rechazar);
  const xs = [base, final, la, lr, ...filas.flatMap((f) => [f.desde, f.hasta])];
  const lo = Math.min(...xs) - 0.35;
  const hi = Math.max(...xs) + 0.35;

  const etqW = movil ? Math.min(176, w * 0.5) : Math.min(230, w * 0.34);
  const valW = movil ? 48 : 60;
  const x0 = etqW + 8;
  const x1 = w - valW - 4;
  const fila = movil ? 30 : 32;
  const top = 34;
  const n = filas.length + 2;
  const alto = top + n * fila + 10;
  const X = (v: number) => x0 + ((v - lo) / (hi - lo || 1)) * (x1 - x0);

  const ticksP = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99].filter((p) => logit(p) > lo && logit(p) < hi);
  const ticks = movil ? ticksP.filter((_, i) => i % 2 === 0) : ticksP;
  const zonas = [
    { id: "aprobar", a: lo, b: la, et: "Aprobar" },
    { id: "revisar", a: la, b: lr, et: "Revisar" },
    { id: "rechazar", a: lr, b: hi, et: "Rechazar" },
  ].filter((z) => z.b > lo && z.a < hi);
  const decFinal = sigm(final) < aprobar ? "aprobar" : sigm(final) > rechazar ? "rechazar" : "revisar";

  return (
    <div className="cascada" ref={ref}>
      <svg width={w} height={alto} role="img" aria-label={`Cascada de contribuciones: base ${dec(base, 2)}, logit final ${dec(final, 2)} (probabilidad ${pct(sigm(final))}).`}>
        {/* zonas de decisión */}
        {zonas.map((z) => (
          <g key={z.id}>
            <rect x={X(Math.max(z.a, lo))} y={top - 6} width={Math.max(0, X(Math.min(z.b, hi)) - X(Math.max(z.a, lo)))} height={alto - top} fill={alfa(DECISION[z.id], 0.055)} />
            <text
              x={z.id === "aprobar" ? X(Math.min(z.b, hi)) - 6 : X(Math.max(z.a, lo)) + 6}
              y={top - 12}
              textAnchor={z.id === "aprobar" ? "end" : "start"}
              className="cascada__zona"
              fill={DECISION[z.id]}
            >
              {z.et}
            </text>
          </g>
        ))}
        {/* eje superior en probabilidad */}
        {ticks.map((p) => (
          <g key={p}>
            <line x1={X(logit(p))} x2={X(logit(p))} y1={top - 4} y2={alto} stroke={T.text} strokeOpacity={0.05} />
          </g>
        ))}
        {[la, lr].map((u) => (
          <line key={u} x1={X(u)} x2={X(u)} y1={top - 6} y2={alto} stroke={T.text} strokeOpacity={0.35} strokeDasharray="3 3" />
        ))}
        {/* base */}
        <g className="cascada__fila" transform={`translate(0, ${top})`}>
          <text x={0} y={fila / 2} className="cascada__etq cascada__etq--fuerte" dominantBaseline="middle">
            Base · cliente promedio
          </text>
          <circle cx={X(base)} cy={fila / 2} r={5} fill={T.panel} stroke={T.text2} strokeWidth={1.6} />
          <text x={w} y={fila / 2} textAnchor="end" className="cascada__val" dominantBaseline="middle">
            {dec(base, 2)}
          </text>
        </g>
        {filas.map((f, i) => {
          const y = top + (i + 1) * fila;
          const a = X(Math.min(f.desde, f.hasta));
          const b = X(Math.max(f.desde, f.hasta));
          const color = f.c > 0 ? SIGNO.positivo : SIGNO.negativo;
          return (
            <g key={f.id} className="cascada__fila" transform={`translate(0, ${y})`}>
              <title>{`${f.nombre}${f.valor ? ` = ${f.valor}` : ""}: ${signo(f.c)} log-odds (${f.c > 0 ? "aumenta" : "reduce"} el riesgo)`}</title>
              <rect x={0} y={0} width={w} height={fila} fill="transparent" className="cascada__hit" />
              <text x={0} y={fila / 2 - (movil || !f.valor ? 0 : 6)} className="cascada__etq" dominantBaseline="middle">
                {f.nombre}
              </text>
              {!movil && f.valor && (
                <text x={0} y={fila / 2 + 8} className="cascada__sub" dominantBaseline="middle">
                  {f.valor}
                </text>
              )}
              <line x1={X(f.desde)} x2={X(f.desde)} y1={-fila / 2 + 5} y2={fila / 2 - 5} stroke={T.text3} strokeOpacity={0.5} strokeDasharray="2 2" />
              <rect className="cascada__barra" x={0} y={fila / 2 - 7} width={1} height={14} rx={0} fill={color} style={{ transform: `translate(${a}px, 0) scaleX(${Math.max(1.5, b - a)})` }} />
              <text x={w} y={fila / 2} textAnchor="end" className="cascada__val" dominantBaseline="middle" fill={T.text}>
                {signo(f.c)}
              </text>
            </g>
          );
        })}
        {/* final */}
        <g className="cascada__fila" transform={`translate(0, ${top + (filas.length + 1) * fila})`}>
          <line x1={0} x2={w} y1={2} y2={2} stroke={T.text} strokeOpacity={0.12} />
          <text x={0} y={fila / 2 + 3} className="cascada__etq cascada__etq--fuerte" dominantBaseline="middle">
            Logit final → {pct(sigm(final))}
          </text>
          <circle className="cascada__final" cx={0} cy={fila / 2 + 3} r={6.5} fill={DECISION[decFinal]} stroke={T.panel} strokeWidth={2} style={{ transform: `translateX(${X(final)}px)` }} />
          <text x={w} y={fila / 2 + 3} textAnchor="end" className="cascada__val cascada__val--fuerte" dominantBaseline="middle">
            {dec(final, 2)}
          </text>
        </g>
      </svg>
      <div className="cascada__eje mono" style={{ marginLeft: x0, marginRight: w - x1 }} aria-hidden="true">
        {ticks.map((p) => (
          <span key={p} style={{ left: `${((logit(p) - lo) / (hi - lo)) * 100}%` }}>
            {pct(p, 0)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Contribuciones en log-odds</caption>
        <tbody>
          <tr>
            <th scope="row">Base</th>
            <td>{dec(base, 4)}</td>
          </tr>
          {filas.map((f) => (
            <tr key={f.id}>
              <th scope="row">{f.nombre}</th>
              <td>{dec(f.c, 4)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Logit final</th>
            <td>{dec(final, 4)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

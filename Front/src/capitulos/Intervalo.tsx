/**
 * Intervalo de confianza con una referencia (forest plot de una fila): ΔAUC del texto, DI por grupo, etc.
 * SVG propio con tokens; texto en tinta, nunca en el color de la marca.
 */
import { T, alfa } from "@/charts/tema";

export interface IntervaloProps {
  valor: number;
  inf: number;
  sup: number;
  min: number;
  max: number;
  referencia: number;
  etiquetaRef: string;
  fmt: (v: number) => string;
  /** Zona sombreada (p. ej. DI < 0,8). */
  zona?: { desde: number; hasta: number; etiqueta: string };
  color?: string;
  ariaLabel: string;
}

export function IntervaloSvg({ valor, inf, sup, min, max, referencia, etiquetaRef, fmt, zona, color = T.accent2, ariaLabel }: IntervaloProps) {
  const W = 640;
  const H = 112;
  const pad = 28;
  const x = (v: number) => pad + ((v - min) / (max - min)) * (W - pad * 2);
  const y = 58;
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {zona && (
        <g>
          <rect x={x(zona.desde)} y={18} width={x(zona.hasta) - x(zona.desde)} height={62} fill={alfa(T.bad, 0.08)} />
          <text x={x(zona.desde) + 6} y={30} fontSize={10} fill={T.text3} className="d-mono">
            {zona.etiqueta}
          </text>
        </g>
      )}
      <line x1={pad} x2={W - pad} y1={y} y2={y} stroke={T.line2} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={y + 18} y2={y + 22} stroke={T.line2} />
          <text x={x(t)} y={y + 36} fontSize={11} fill={T.text3} textAnchor="middle" className="d-mono">
            {fmt(t)}
          </text>
        </g>
      ))}
      <line x1={x(referencia)} x2={x(referencia)} y1={14} y2={y + 22} stroke={T.text2} strokeDasharray="3 3" />
      <text x={x(referencia) + 6} y={14} fontSize={11} fill={T.text2} dominantBaseline="hanging">
        {etiquetaRef}
      </text>
      <line x1={x(inf)} x2={x(sup)} y1={y} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={x(inf)} x2={x(inf)} y1={y - 8} y2={y + 8} stroke={color} strokeWidth={2} />
      <line x1={x(sup)} x2={x(sup)} y1={y - 8} y2={y + 8} stroke={color} strokeWidth={2} />
      <circle cx={x(valor)} cy={y} r={7} fill={T.panel} stroke={color} strokeWidth={2.5} />
      <text x={x(valor)} y={y - 16} fontSize={12} fill={T.text} textAnchor="middle" fontWeight={600} className="d-mono">
        {fmt(valor)}
      </text>
      <text x={x(inf)} y={y + 14} fontSize={10} fill={T.text3} textAnchor="end" dx={-4} className="d-mono">
        {fmt(inf)}
      </text>
      <text x={x(sup)} y={y + 14} fontSize={10} fill={T.text3} textAnchor="start" dx={4} className="d-mono">
        {fmt(sup)}
      </text>
    </svg>
  );
}

/**
 * Medidor semicircular de la probabilidad de impago: escala lineal 0–100 %, tres zonas en los umbrales
 * reales (aprobar < 17,8 % ≤ revisar ≤ 46,7 % < rechazar) y aguja animada (resorte; sin animación si
 * prefers-reduced-motion). El estado siempre lleva texto, nunca solo color.
 */
import { pct } from "@/charts/formatos";
import { DECISION, T, alfa } from "@/charts/tema";

const CX = 170;
const CY = 160;
const R = 128;
const G = 20; // grosor del arco

function punto(p: number, r = R) {
  const a = Math.PI * (1 - p);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const;
}
function arco(p1: number, p2: number, r = R) {
  const [x1, y1] = punto(p1, r);
  const [x2, y2] = punto(p2, r);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export interface MedidorProps {
  p: number | null;
  aprobar: number;
  rechazar: number;
  decision: "aprobar" | "revisar" | "rechazar" | null;
}

const ZONAS = (a: number, r: number) =>
  [
    { id: "aprobar", desde: 0, hasta: a, etiqueta: "Aprobar" },
    { id: "revisar", desde: a, hasta: r, etiqueta: "Revisar" },
    { id: "rechazar", desde: r, hasta: 1, etiqueta: "Rechazar" },
  ] as const;

export function Medidor({ p, aprobar, rechazar, decision }: MedidorProps) {
  const gap = 0.006;
  const ang = (p ?? 0) * 180;
  const zonas = ZONAS(aprobar, rechazar);
  return (
    <svg className="medidor" viewBox="0 0 340 196" role="img" aria-label={p == null ? "Sin probabilidad: la solicitud no es válida" : `Probabilidad de impago ${pct(p)}: ${decision}`}>
      <defs>
        <filter id="medidor-brillo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* pista */}
      <path d={arco(0, 1)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={G + 10} strokeLinecap="round" />
      {zonas.map((z) => {
        const activa = decision === z.id;
        const c = DECISION[z.id];
        return (
          <g key={z.id}>
            {activa && <path d={arco(z.desde + gap, z.hasta - gap)} fill="none" stroke={alfa(c, 0.45)} strokeWidth={G} filter="url(#medidor-brillo)" />}
            <path
              className="medidor__zona"
              d={arco(z.desde + (z.desde ? gap : 0), z.hasta - (z.hasta < 1 ? gap : 0))}
              fill="none"
              stroke={c}
              strokeOpacity={p == null ? 0.18 : activa ? 1 : 0.26}
              strokeWidth={G}
              strokeLinecap="butt"
            />
          </g>
        );
      })}
      {/* marcas cada 10 % */}
      {Array.from({ length: 11 }, (_, i) => i / 10).map((v) => {
        const [x1, y1] = punto(v, R + G / 2 + 4);
        const [x2, y2] = punto(v, R + G / 2 + (v === 0 || v === 1 || v === 0.5 ? 11 : 8));
        return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.text3} strokeOpacity={0.6} strokeWidth={1} />;
      })}
      {/* umbrales */}
      {[aprobar, rechazar].map((u) => {
        const [x1, y1] = punto(u, R - G / 2 - 3);
        const [x2, y2] = punto(u, R + G / 2 + 14);
        const [tx, ty] = punto(u, R + G / 2 + 26);
        return (
          <g key={u}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.text} strokeWidth={1.4} />
            <text x={tx} y={ty} className="medidor__umbral" textAnchor="middle" dominantBaseline="middle">
              {pct(u)}
            </text>
          </g>
        );
      })}
      <text x={CX - R} y={CY + 22} className="medidor__extremo" textAnchor="middle">
        0 %
      </text>
      <text x={CX + R} y={CY + 22} className="medidor__extremo" textAnchor="middle">
        100 %
      </text>
      {/* aguja */}
      <g className="medidor__aguja" style={{ transform: `rotate(${ang}deg)`, opacity: p == null ? 0.25 : 1 }}>
        <path d={`M ${CX - R + 18} ${CY} L ${CX - 6} ${CY - 4.5} L ${CX - 6} ${CY + 4.5} Z`} fill={T.text} />
      </g>
      <circle cx={CX} cy={CY} r={11} fill={T.panel} stroke={T.text} strokeWidth={2} />
      <circle cx={CX} cy={CY} r={3.5} fill={decision ? DECISION[decision] : T.text3} />
    </svg>
  );
}

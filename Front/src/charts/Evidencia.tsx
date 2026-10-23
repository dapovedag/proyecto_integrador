/**
 * Pie de evidencia: de dónde sale una cifra o figura (notebook · celda · versión), con enlace al
 * reproductor del notebook en la celda exacta (`/paso/:n?nb=NN&celda=C#notebook`).
 */
import { Link } from "react-router-dom";
import manifest from "@/data/generated/manifest.json";

/** notebook "05" → paso 5; "00" (integrador) → paso 11. */
export function pasoDeNotebook(nb: string | undefined): number | null {
  if (!nb) return null;
  const m = /(\d{2})/.exec(nb);
  if (!m) return null;
  const n = Number(m[1]);
  return n === 0 ? 11 : n >= 1 && n <= 9 ? n : null;
}

export function enlaceCelda(nb: string | undefined, celda?: number | string): string | null {
  const paso = pasoDeNotebook(nb);
  if (paso == null || !nb) return null;
  const id = /(\d{2})/.exec(nb)?.[1];
  const q = new URLSearchParams({ nb: id ?? "" });
  if (celda != null) q.set("celda", String(celda));
  return `/paso/${paso}?${q.toString()}#notebook`;
}

export interface EvidenciaProps {
  notebook?: string;
  celda?: number | string;
  version?: string;
  /** Archivo fuente cuando no es un notebook (p. ej. "model_card.json → metricas_test"). */
  fuente?: string;
  className?: string;
  compacta?: boolean;
}

export function Evidencia({ notebook, celda, version, fuente, className = "", compacta }: EvidenciaProps) {
  const v = version ?? manifest.version;
  const href = enlaceCelda(notebook, celda);
  const nbTxt = notebook ? `nb${/(\d{2})/.exec(notebook)?.[1] ?? notebook}` : null;
  const contenido = (
    <>
      <span className="evidencia__icono" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M3 2.5h6.5L13 6v7.5H3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9.5 2.5V6H13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </span>
      {!compacta && <span className="evidencia__rotulo">Evidencia</span>}
      {nbTxt && <span>{nbTxt}</span>}
      {celda != null && (
        <>
          <span className="evidencia__sep">·</span>
          <span>celda {celda}</span>
        </>
      )}
      {fuente && (
        <>
          {(nbTxt || celda != null) && <span className="evidencia__sep">·</span>}
          <span className="evidencia__fuente">{fuente}</span>
        </>
      )}
      <span className="evidencia__sep">·</span>
      <span>v{v}</span>
    </>
  );
  return href ? (
    <Link to={href} className={`evidencia evidencia--enlace ${className}`} title="Abrir el notebook en esta celda">
      {contenido}
      <span aria-hidden="true" className="evidencia__flecha">↗</span>
    </Link>
  ) : (
    <span className={`evidencia ${className}`}>{contenido}</span>
  );
}

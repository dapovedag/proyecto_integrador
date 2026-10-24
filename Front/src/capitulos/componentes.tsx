/**
 * Piezas editoriales de los capítulos: introducción con cifras, figura por clave, composición
 * (principal + secundarias), hallazgos numerados, sub-bloques y el entregable (reproductor + especial).
 */
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Figura } from "@/charts/Figura";
import { Cargando, Faltante, Revelar } from "@/components/base";
import { NotebookPlayer } from "@/features/notebook/NotebookPlayer";
import { buscarFigura, conLectura, parseRef, useFiguras } from "./figuras";
import "./capitulos.css";

/* ---------- Introducción editorial ---------- */
export function Intro({ lead, kpis, nota }: { lead: ReactNode; kpis?: ReactNode; nota?: ReactNode }) {
  return (
    <div className="cap-intro">
      <Revelar className="cap-intro__lead">
        <p>{lead}</p>
      </Revelar>
      {kpis && (
        <Revelar retraso={0.08} className="cap-intro__kpis">
          {kpis}
        </Revelar>
      )}
      {nota && <div className="cap-intro__nota">{nota}</div>}
    </div>
  );
}

/* ---------- Figura nativa por clave ---------- */
export function Fig({
  f,
  nb,
  lectura,
  titulo,
  alto,
  className = "",
  sinPie,
}: {
  /** "clave" o "NN:clave" */
  f: string;
  nb: string | null;
  lectura?: string;
  titulo?: string;
  alto?: number;
  className?: string;
  sinPie?: boolean;
}) {
  const { estado, figuras } = useFiguras();
  const r = parseRef(f, nb);
  const base = estado === "cargando" ? null : buscarFigura(figuras, r.nb, r.clave);
  // Spec estable entre renders: evita re-aplicar la opción completa de ECharts sin cambios.
  const spec = useMemo(() => (base ? conLectura(base, lectura, titulo) : null), [base, lectura, titulo]);
  if (estado === "cargando") return <Cargando etiqueta="Cargando figura" alto={alto ?? 260} />;
  if (!spec) return <Faltante titulo={`Figura ${r.clave} (nb${r.nb})`} />;
  return <Figura spec={spec} alto={alto} className={className} sinPie={sinPie} />;
}

/* ---------- Composición: figura principal + columna lateral ---------- */
export function Composicion({ principal, lateral, invertida }: { principal: ReactNode; lateral?: ReactNode; invertida?: boolean }) {
  return (
    <div className={`cap-comp ${lateral ? "" : "cap-comp--sola"} ${invertida ? "cap-comp--inv" : ""}`}>
      <Revelar className="cap-comp__principal">{principal}</Revelar>
      {lateral && (
        <Revelar retraso={0.08} className="cap-comp__lateral">
          {lateral}
        </Revelar>
      )}
    </div>
  );
}

export function Rejilla({ children, cols = 2, className = "" }: { children: ReactNode; cols?: 2 | 3; className?: string }) {
  return <div className={`cap-rejilla cap-rejilla--${cols} ${className}`}>{children}</div>;
}

/* ---------- Sub-bloque dentro de Visualizaciones ---------- */
export function Sub({ kicker, titulo, children, intro, id }: { kicker: string; titulo: ReactNode; children: ReactNode; intro?: ReactNode; id?: string }) {
  return (
    <section className="cap-sub" id={id}>
      <Revelar className="cap-sub__cab">
        <span className="versalitas cap-sub__kicker">{kicker}</span>
        <h3 className="cap-sub__titulo">{titulo}</h3>
        {intro && <p className="cap-sub__intro">{intro}</p>}
      </Revelar>
      {children}
    </section>
  );
}

/* ---------- Hallazgos ---------- */
export interface Hallazgo {
  titulo: string;
  texto: ReactNode;
  cifra?: string;
}
export function Hallazgos({ items, pie }: { items: Hallazgo[]; pie?: ReactNode }) {
  return (
    <div className="cap-hallazgos">
      <span className="versalitas cap-hallazgos__rot">Hallazgos clave</span>
      <ol className="cap-hallazgos__lista">
        {items.map((h, i) => (
          <Revelar como="li" key={i} retraso={Math.min(i * 0.05, 0.2)} className="cap-hallazgo">
            <span className="cap-hallazgo__n mono">{String(i + 1).padStart(2, "0")}</span>
            <div className="cap-hallazgo__cuerpo">
              {h.cifra && <span className="cap-hallazgo__cifra display">{h.cifra}</span>}
              <p className="cap-hallazgo__titulo">{h.titulo}</p>
              <p className="cap-hallazgo__texto">{h.texto}</p>
            </div>
          </Revelar>
        ))}
      </ol>
      {pie && <div className="cap-hallazgos__pie">{pie}</div>}
    </div>
  );
}

/* ---------- Cita destacada ---------- */
export function Cita({ children, fuente }: { children: ReactNode; fuente?: ReactNode }) {
  return (
    <Revelar className="cap-cita">
      <blockquote>
        <p>{children}</p>
      </blockquote>
      {fuente && <span className="cap-cita__fuente">{fuente}</span>}
    </Revelar>
  );
}

/* ---------- Fila de KPIs ---------- */
export function FilaKpis({ children, cols }: { children: ReactNode; cols?: number }) {
  return (
    <div className="cap-kpis" style={cols ? ({ "--cols": cols } as CSSProperties) : undefined}>
      {children}
    </div>
  );
}

/* ---------- Entregable: reproductor del notebook + componente especial ---------- */
export function Entregable({ nb, especial, rotuloEspecial, nota }: { nb: string | null; especial?: ReactNode; rotuloEspecial?: string; nota?: ReactNode }) {
  const [q] = useSearchParams();
  const celda = q.get("nb") === nb && q.get("celda") != null ? Number(q.get("celda")) : undefined;
  return (
    <div className="cap-entregable">
      {nb && (
        <div className="cap-entregable__nb">
          <div className="cap-entregable__cab">
            <span className="versalitas">Notebook ejecutado · nb{nb}</span>
            <span className="cap-entregable__sub">Reproducción celda a celda con sus salidas y tiempos reales de papermill</span>
          </div>
          <NotebookPlayer nb={nb} celdaInicial={Number.isFinite(celda) ? celda : undefined} />
        </div>
      )}
      {nota && <div className="cap-entregable__nota">{nota}</div>}
      {especial && (
        <div className="cap-entregable__especial">
          {rotuloEspecial && (
            <div className="cap-entregable__cab">
              <span className="versalitas">{rotuloEspecial}</span>
            </div>
          )}
          {especial}
        </div>
      )}
    </div>
  );
}

/* ---------- Marca ✔ / ✘ (SVG: evita la fuente de emoji) ---------- */
export function Marca({ ok, etiqueta }: { ok: boolean; etiqueta?: string }) {
  return (
    <span className={`marca ${ok ? "marca--ok" : "marca--no"}`} role="img" aria-label={etiqueta ?? (ok ? "cumple" : "no cumple")}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
        {ok ? (
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

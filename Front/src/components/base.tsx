/**
 * Componentes base: Chip, Boton, Kbd, Seccion, Revelar, Tooltip, Nota, Cargando, Faltante.
 * (Kpi, Tabs, Contador viven en sus propios archivos.)
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "react-router-dom";

/* ---------- Chip ---------- */
export type TonoChip = "neutro" | "acento" | "mod1" | "mod2" | "trans" | "ok" | "warn" | "bad";
export function Chip({
  children,
  tono = "neutro",
  mono,
  punto,
  s,
  title,
  className = "",
}: {
  children: ReactNode;
  tono?: TonoChip;
  mono?: boolean;
  punto?: boolean;
  s?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <span className={`chip chip--${tono} ${mono ? "chip--mono" : ""} ${s ? "chip--s" : ""} ${className}`} title={title}>
      {punto && <span className="chip__punto" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ---------- Botón (button o Link) ---------- */
type Variante = "primario" | "secundario" | "fantasma";
interface BotonBase {
  variante?: Variante;
  tamano?: "s" | "m" | "l";
  flecha?: boolean;
  icono?: ReactNode;
  className?: string;
  children: ReactNode;
}
export function Boton({
  variante = "secundario",
  tamano = "m",
  flecha,
  icono,
  className = "",
  children,
  to,
  ...resto
}: BotonBase & { to?: string } & Omit<ComponentProps<"button">, "children">) {
  const cls = `boton boton--${variante} ${tamano !== "m" ? `boton--${tamano}` : ""} ${className}`;
  const cont = (
    <>
      {icono}
      <span>{children}</span>
      {flecha && (
        <svg className="boton__flecha" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {cont}
      </Link>
    );
  return (
    <button type="button" className={cls} {...resto}>
      {cont}
    </button>
  );
}

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>;

/* ---------- Revelar al hacer scroll ---------- */
export function Revelar({
  children,
  retraso = 0,
  y = 10,
  className,
  como = "div",
}: {
  children: ReactNode;
  retraso?: number;
  y?: number;
  className?: string;
  como?: "div" | "section" | "li" | "article";
}) {
  const reducido = useReducedMotion();
  const M = motion[como];
  if (reducido) {
    const Tag = como;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px 0px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: Math.min(retraso, 0.12) }}
    >
      {children}
    </M>
  );
}

/* ---------- Montaje diferido ---------- */
/** Monta `children` solo cuando el bloque se acerca a la vista (800 px antes); mientras tanto reserva `alto`. */
export function Diferido({ children, alto = 220 }: { children: ReactNode; alto?: number }) {
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

/* ---------- Sección editorial ---------- */
export function Seccion({
  id,
  numero,
  kicker,
  titulo,
  intro,
  children,
  borde = true,
  apilada,
  className = "",
  contenedor = "contenedor",
  nivel = 2,
}: {
  id?: string;
  numero?: string;
  kicker?: ReactNode;
  titulo?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  borde?: boolean;
  apilada?: boolean;
  className?: string;
  contenedor?: string;
  /** Nivel del título: 1 cuando la sección es la cabecera de la página. */
  nivel?: 1 | 2;
}) {
  const idT = useId();
  const Titulo = nivel === 1 ? "h1" : "h2";
  return (
    <section id={id} className={`seccion ${borde ? "seccion--borde" : ""} ${className}`} aria-labelledby={titulo ? idT : undefined}>
      <div className={contenedor}>
        {(kicker || titulo || intro) && (
          <Revelar className={`seccion__cabecera ${apilada ? "seccion__cabecera--apilada" : ""}`}>
            {(kicker || numero) && (
              <div className="seccion__kicker">
                {numero && <span className="seccion__numero">{numero}</span>}
                {kicker && <span className="versalitas">{kicker}</span>}
              </div>
            )}
            {titulo && (
              <Titulo id={idT} className="seccion__titulo">
                {titulo}
              </Titulo>
            )}
            {intro && <div className="seccion__intro">{intro}</div>}
          </Revelar>
        )}
        {children}
      </div>
    </section>
  );
}

/* ---------- Tooltip simple (hover y foco) ---------- */
export function Tooltip({ texto, children }: { texto: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <span className="tip" aria-describedby={id}>
      {children}
      <span role="tooltip" id={id} className="tip__burbuja">
        {texto}
      </span>
    </span>
  );
}

/* ---------- Nota al margen ---------- */
export function Nota({
  rotulo,
  children,
  tono,
  className = "",
}: {
  rotulo?: ReactNode;
  children: ReactNode;
  tono?: "acento" | "mod1" | "mod2";
  className?: string;
}) {
  return (
    <aside className={`nota ${tono ? `nota--${tono}` : ""} ${className}`}>
      {rotulo && <span className="nota__rotulo versalitas">{rotulo}</span>}
      {children}
    </aside>
  );
}

/* ---------- Estados de carga ---------- */
export function Cargando({ etiqueta = "Cargando paquete de corrida", alto = 220 }: { etiqueta?: string; alto?: number }) {
  return (
    <div className="cargando" style={{ minHeight: alto }} role="status" aria-live="polite">
      <span className="cargando__texto">{etiqueta}…</span>
    </div>
  );
}

export function Faltante({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="faltante" role="note">
      <span className="versalitas">En el próximo paquete de corrida</span>
      <span className="faltante__titulo">{titulo}</span>
      {children && <p className="faltante__texto">{children}</p>}
    </div>
  );
}

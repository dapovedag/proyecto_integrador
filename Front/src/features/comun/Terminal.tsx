/**
 * Terminal reproducible: una línea de tiempo de eventos (comandos que se teclean y salidas que aparecen),
 * con reloj propio (requestAnimationFrame), controles y respeto a prefers-reduced-motion.
 */
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./terminal.css";

export interface EventoTerminal {
  /** Inicio en la línea de tiempo de reproducción (ms). */
  t: number;
  tipo: "comando" | "salida" | "nota";
  texto: string;
  /** Solo comandos: duración del tecleo (ms). */
  tecleo?: number;
  /** Render personalizado de la línea (resaltado). */
  render?: (texto: string) => ReactNode;
  clase?: string;
}

export type FaseReproduccion = "inicio" | "corriendo" | "pausa" | "fin";

/** Reloj de reproducción con play/pausa/reinicio. `velocidad` multiplica el tiempo. */
export function useReloj(total: number, { auto = false, velocidad = 1 }: { auto?: boolean; velocidad?: number } = {}) {
  const reducido = !!useReducedMotion();
  const [reloj, setReloj] = useState(0);
  const [fase, setFase] = useState<FaseReproduccion>("inicio");
  const base = useRef<{ t0: number; r0: number } | null>(null);

  useEffect(() => {
    if (auto) setFase("corriendo");
  }, [auto]);

  useEffect(() => {
    if (fase !== "corriendo") return;
    if (reducido) {
      setReloj(total);
      setFase("fin");
      return;
    }
    let raf = 0;
    base.current = { t0: performance.now(), r0: reloj >= total ? 0 : reloj };
    const paso = (t: number) => {
      const b = base.current!;
      const r = Math.min(total, b.r0 + (t - b.t0) * velocidad);
      setReloj(r);
      if (r >= total) setFase("fin");
      else raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, total, velocidad, reducido]);

  const reproducir = useCallback(() => {
    setReloj((r) => (r >= total ? 0 : r));
    setFase("corriendo");
  }, [total]);
  const pausar = useCallback(() => setFase((f) => (f === "corriendo" ? "pausa" : f)), []);
  const reiniciar = useCallback(() => {
    setReloj(0);
    setFase("inicio");
  }, []);
  const saltarAlFinal = useCallback(() => {
    setReloj(total);
    setFase("fin");
  }, [total]);
  return { reloj, fase, reproducir, pausar, reiniciar, saltarAlFinal, reducido };
}

export function Terminal({
  titulo,
  eventos,
  reloj,
  prompt = "$",
  cursor = true,
  alto,
  pie,
  barra,
  className = "",
  etiqueta,
}: {
  titulo: ReactNode;
  eventos: EventoTerminal[];
  reloj: number;
  prompt?: string;
  cursor?: boolean;
  alto?: number;
  pie?: ReactNode;
  barra?: ReactNode;
  className?: string;
  etiqueta?: string;
}) {
  const cuerpo = useRef<HTMLDivElement>(null);
  const visibles = eventos.filter((e) => e.t <= reloj);
  const ultimo = visibles[visibles.length - 1];
  const tecleando = ultimo?.tipo === "comando" && reloj < ultimo.t + (ultimo.tecleo ?? 0);

  // Autodesplazamiento al final mientras se reproduce.
  useEffect(() => {
    const el = cuerpo.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibles.length, tecleando]);

  return (
    <div className={`term ${className}`} role="region" aria-label={etiqueta ?? (typeof titulo === "string" ? titulo : "Terminal")}>
      <div className="term__barra">
        <span className="term__luces" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="term__titulo mono">{titulo}</span>
        <span className="term__controles">{barra}</span>
      </div>
      <div className="term__cuerpo mono" ref={cuerpo} style={alto ? { height: alto } : undefined} aria-live="off">
        {visibles.map((e, i) => {
          if (e.tipo === "comando") {
            const n = e.tecleo ? Math.min(e.texto.length, Math.floor(((reloj - e.t) / e.tecleo) * e.texto.length)) : e.texto.length;
            const activo = i === visibles.length - 1;
            return (
              <div key={i} className="term__linea term__linea--comando">
                <span className="term__prompt" aria-hidden="true">
                  {prompt}
                </span>
                <span className="term__cmd">{e.texto.slice(0, n)}</span>
                {activo && cursor && <span className="term__cursor" aria-hidden="true" />}
              </div>
            );
          }
          return (
            <div key={i} className={`term__linea term__linea--${e.tipo} ${e.clase ?? ""}`}>
              {e.render ? e.render(e.texto) : e.texto}
            </div>
          );
        })}
        {(!ultimo || ultimo.tipo !== "comando") && cursor && (
          <div className="term__linea term__linea--comando">
            <span className="term__prompt" aria-hidden="true">
              {prompt}
            </span>
            <span className="term__cursor" aria-hidden="true" />
          </div>
        )}
      </div>
      {pie && <div className="term__pie">{pie}</div>}
    </div>
  );
}

/** Botones estándar de reproducción para la barra de la terminal. */
export function ControlesReproduccion({
  fase,
  reproducir,
  pausar,
  reiniciar,
  saltarAlFinal,
  etiquetaPlay = "Reproducir",
}: {
  fase: FaseReproduccion;
  reproducir: () => void;
  pausar: () => void;
  reiniciar: () => void;
  saltarAlFinal: () => void;
  etiquetaPlay?: string;
}) {
  return (
    <>
      {fase === "corriendo" ? (
        <button type="button" className="term__btn" onClick={pausar}>
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor" />
          </svg>
          Pausa
        </button>
      ) : (
        <button type="button" className="term__btn term__btn--play" onClick={reproducir}>
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M4.5 3v10l8.5-5z" fill="currentColor" />
          </svg>
          {fase === "fin" ? "Repetir" : fase === "pausa" ? "Continuar" : etiquetaPlay}
        </button>
      )}
      <button type="button" className="term__btn" onClick={saltarAlFinal} disabled={fase === "fin"}>
        Ver todo
      </button>
      <button type="button" className="term__btn term__btn--icono" onClick={reiniciar} aria-label="Reiniciar" disabled={fase === "inicio"}>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}

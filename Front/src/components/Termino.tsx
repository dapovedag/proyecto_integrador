/**
 * <Termino id="histograma">histograma</Termino>: término del glosario subrayado con puntos. Al pasar el puntero,
 * enfocarlo o tocarlo muestra su definición corta y un enlace al glosario. Accesible con teclado (Esc cierra).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { POR_ID } from "@/content/glosario";

export function Termino({ id, children }: { id: string; children?: ReactNode }) {
  const e = POR_ID.get(id);
  const [abierto, setAbierto] = useState(false);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const idPop = useId();
  const pop = useRef<HTMLSpanElement>(null);
  const raiz = useRef<HTMLSpanElement>(null);

  // La burbuja nunca sale de la pantalla (celular): se corre a la izquierda si hace falta.
  useLayoutEffect(() => {
    if (!abierto || !pop.current) return setDesplazamiento(0);
    const r = pop.current.getBoundingClientRect();
    const exceso = r.right - (window.innerWidth - 12);
    if (exceso > 0) setDesplazamiento(-Math.min(exceso, Math.max(0, r.left - 12)));
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (ev: PointerEvent) => raiz.current && !raiz.current.contains(ev.target as Node) && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  if (!e) return <>{children}</>;
  return (
    <span
      ref={raiz}
      className="termino"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
      onKeyDown={(ev) => ev.key === "Escape" && setAbierto(false)}
    >
      <button
        type="button"
        className="termino__btn"
        aria-expanded={abierto}
        aria-describedby={abierto ? idPop : undefined}
        // El clic solo abre (el foco ya abre antes del clic; alternar lo cerraría de inmediato).
        // Se cierra con Esc, al salir el puntero, al perder el foco o al tocar fuera.
        onClick={() => setAbierto(true)}
        onFocus={() => setAbierto(true)}
        onBlur={(ev) => !raiz.current?.contains(ev.relatedTarget as Node) && setAbierto(false)}
      >
        {children ?? e.termino}
      </button>
      {abierto && (
        <span ref={pop} role="tooltip" id={idPop} className="termino__pop" style={desplazamiento ? { transform: `translateX(${desplazamiento}px)` } : undefined}>
          <span className="termino__nombre">{e.termino}</span>
          <span className="termino__corto">{e.corto}</span>
          <Link to={`/glosario#${e.id}`} className="termino__ir">
            Ver en el glosario →
          </Link>
        </span>
      )}
    </span>
  );
}

/** Lista de términos (chips) del glosario, p. ej. «Conceptos: pandas · DataFrame · histograma». */
export function Terminos({ ids }: { ids: string[] }) {
  const validos = ids.filter((i) => POR_ID.has(i));
  if (!validos.length) return null;
  return (
    <span className="terminos">
      {validos.map((i) => (
        <Termino key={i} id={i} />
      ))}
    </span>
  );
}

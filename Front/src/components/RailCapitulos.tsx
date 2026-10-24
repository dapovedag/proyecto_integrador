/**
 * Rail de capítulos agrupado por Módulo → Unidad, con color de módulo y estado (de gestion.json).
 */
import { NavLink, useLocation } from "react-router-dom";
import { ESTADO_ETIQUETA, GRUPOS_RAIL, MODULOS, PASOS, numeroFantasma } from "@/content/pasos";
import { alAcercarse } from "@/content/precarga";

export function EstadoPunto({ estado }: { estado: keyof typeof ESTADO_ETIQUETA }) {
  return <span className={`estado-punto estado-punto--${estado}`} title={ESTADO_ETIQUETA[estado]} aria-label={ESTADO_ETIQUETA[estado]} role="img" />;
}

export function RailCapitulos({ onNavegar }: { onNavegar?: () => void }) {
  const { pathname } = useLocation();
  const hechos = PASOS.filter((p) => p.estado === "hecho").length;
  return (
    <nav className="rail" aria-label="Capítulos del expediente">
      <div className="rail__titulo">
        <span className="versalitas">Capítulos</span>
        <span className="rail__progreso" title="Pasos con todas sus historias en Hecho">
          {hechos}/{PASOS.length} hechos
        </span>
      </div>
      {GRUPOS_RAIL.map((g, gi) => {
        const nuevoModulo = gi === 0 || GRUPOS_RAIL[gi - 1].titulo !== g.titulo;
        return (
          <div key={g.clave} className="rail__grupo" style={{ "--g-c": MODULOS[g.modulo].color } as React.CSSProperties}>
            <div className="rail__grupo-cab">
              {nuevoModulo && <span className="rail__grupo-titulo">{g.titulo}</span>}
              {g.subtitulo && <span className="rail__grupo-sub">{g.subtitulo}</span>}
            </div>
            <ul className="rail__lista">
              {g.pasos.map((p) => (
                <li key={p.n}>
                  <NavLink
                    to={p.ruta}
                    className="rail__item"
                    aria-current={pathname === p.ruta ? "page" : undefined}
                    onClick={onNavegar}
                    {...alAcercarse(p.n)}
                  >
                    <span className="rail__num">{numeroFantasma(p.n)}</span>
                    <span>{p.tituloCorto}</span>
                    <EstadoPunto estado={p.estado} />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="rail__extra">
        <NavLink to="/simulador" onClick={onNavegar} aria-current={pathname === "/simulador" ? "page" : undefined}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 12.5 6 8l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Simulador de decisión
        </NavLink>
        <NavLink to="/trazabilidad" onClick={onNavegar} aria-current={pathname === "/trazabilidad" ? "page" : undefined}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 4h10M3 8h10M3 12h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Trazabilidad 47 ítems
        </NavLink>
      </div>
    </nav>
  );
}

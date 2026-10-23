/**
 * Tabs accesibles (ARIA tablist, flechas ←/→, Inicio/Fin) con indicador animado.
 *   <Tabs items={[{ id: "a", etiqueta: "A", contenido: <…/> }]} />           (con paneles)
 *   <Segmentado opciones={[{id, etiqueta}]} valor={v} onCambio={setV} />      (solo control)
 */
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface OpcionSeg<T extends string = string> {
  id: T;
  etiqueta: ReactNode;
  icono?: ReactNode;
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
  idsPanel,
  className = "",
}: {
  opciones: OpcionSeg<T>[];
  valor: T;
  onCambio: (v: T) => void;
  etiqueta: string;
  idsPanel?: Record<string, string>;
  className?: string;
}) {
  const grupo = useId();
  const reducido = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % opciones.length;
    if (e.key === "ArrowLeft") j = (i - 1 + opciones.length) % opciones.length;
    if (e.key === "Home") j = 0;
    if (e.key === "End") j = opciones.length - 1;
    if (j >= 0) {
      e.preventDefault();
      onCambio(opciones[j].id);
      refs.current[j]?.focus();
    }
  };
  return (
    <LayoutGroup id={grupo}>
      <div className={`tabs__lista ${className}`} role="tablist" aria-label={etiqueta}>
        {opciones.map((o, i) => {
          const sel = o.id === valor;
          return (
            <button
              key={o.id}
              ref={(el) => (refs.current[i] = el)}
              role="tab"
              type="button"
              id={`${grupo}-${o.id}`}
              aria-selected={sel}
              aria-controls={idsPanel?.[o.id]}
              tabIndex={sel ? 0 : -1}
              className="tabs__tab"
              onClick={() => onCambio(o.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {sel && (
                <motion.span
                  layoutId="indicador"
                  className="tabs__indicador"
                  transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span>
                {o.icono}
                {o.etiqueta}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export interface ItemTab {
  id: string;
  etiqueta: ReactNode;
  contenido: ReactNode;
}

export function Tabs({ items, etiqueta, inicial, className = "" }: { items: ItemTab[]; etiqueta: string; inicial?: string; className?: string }) {
  const [act, setAct] = useState(inicial ?? items[0]?.id);
  const base = useId();
  const idsPanel = Object.fromEntries(items.map((i) => [i.id, `${base}-panel-${i.id}`]));
  const actual = items.find((i) => i.id === act) ?? items[0];
  return (
    <div className={`tabs ${className}`}>
      <Segmentado opciones={items.map(({ id, etiqueta }) => ({ id, etiqueta }))} valor={act} onCambio={setAct} etiqueta={etiqueta} idsPanel={idsPanel} />
      {actual && (
        <div role="tabpanel" id={idsPanel[actual.id]} className="tabs__panel" tabIndex={0}>
          {actual.contenido}
        </div>
      )}
    </div>
  );
}

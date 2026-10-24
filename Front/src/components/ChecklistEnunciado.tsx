/**
 * Checklist del enunciado en la portada: las 47 filas agrupadas en sus 9 bloques y en tres columnas
 * (proyecto integrador, Módulo 1, Módulo 2). El estado sale de gestion.json vía content/trazabilidad.ts:
 * ninguna marca se pone a mano. Cada ítem enlaza al capítulo que lo acredita.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { COMO_SE_CUMPLE } from "@/content/portada";
import { MODULOS } from "@/content/pasos";
import { BLOQUES, DOD_NOTEBOOKS, MATRIZ, RESUMEN_TRAZA, type FilaMatriz, type ModuloTraza } from "@/content/trazabilidad";

const COLUMNAS: { modulo: ModuloTraza; titulo: string; sub: string; color: string }[] = [
  { modulo: "General", titulo: "Proyecto integrador", sub: "Producto final, elementos, fases y resultados", color: "var(--accent-2)" },
  { modulo: "M1", titulo: `Módulo 1 · ${MODULOS.M1.corto}`, sub: MODULOS.M1.nombre, color: MODULOS.M1.color },
  { modulo: "M2", titulo: `Módulo 2 · ${MODULOS.M2.corto}`, sub: MODULOS.M2.nombre, color: MODULOS.M2.color },
];

/** Capítulo al que lleva cada ítem: el primero que lo acredita (el 0 es la metodología). */
export function destinoFila(f: FilaMatriz): { ruta: string; etiqueta: string } {
  const p = f.pasos[0] ?? 0;
  if (p === 0) return { ruta: "/metodologia", etiqueta: "Metodología" };
  const [min, max] = [f.pasos[0], f.pasos[f.pasos.length - 1]];
  const contiguo = max - min === f.pasos.length - 1;
  const rango = f.pasos.length === 1 ? `${min}` : contiguo ? `${min}–${max}` : f.pasos.join(", ");
  return { ruta: `/paso/${p}`, etiqueta: `${f.pasos.length > 1 ? "Caps." : "Cap."} ${rango}` };
}

const circulo: Variants = {
  oculto: { scale: 0.6, opacity: 0 },
  visible: (i: number) => ({ scale: 1, opacity: 1, transition: { delay: i * 0.035, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }),
};
const trazo: Variants = {
  oculto: { pathLength: 0 },
  visible: (i: number) => ({ pathLength: 1, transition: { delay: i * 0.035 + 0.15, duration: 0.4, ease: "easeOut" } }),
};

function Marca({ ok, i }: { ok: boolean; i: number }) {
  return (
    <svg className={`chk-item__marca ${ok ? "" : "chk-item__marca--no"}`} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <motion.circle cx="12" cy="12" r="11" custom={i} variants={circulo} />
      {ok && <motion.path d="M7 12.5l3.2 3.2L17 8.6" custom={i} variants={trazo} />}
    </svg>
  );
}

function Item({ f, i }: { f: FilaMatriz; i: number }) {
  const d = destinoFila(f);
  return (
    <li>
      <Link to={d.ruta} className="chk-item">
        <Marca ok={f.acreditada} i={i} />
        <span className="chk-item__cuerpo">
          <span className="sr-only">{f.acreditada ? "Cumplido:" : "Pendiente:"}</span>
          <span className="chk-item__cab">
            <span className="chk-item__id mono">{f.id}</span>
            <span className="chk-item__titulo">{f.item}</span>
            <span className="chk-item__ir mono">
              {d.etiqueta}
              <span aria-hidden="true"> →</span>
            </span>
          </span>
          {COMO_SE_CUMPLE[f.id] && <span className="chk-item__como">{COMO_SE_CUMPLE[f.id]}</span>}
        </span>
      </Link>
    </li>
  );
}

export function ChecklistEnunciado() {
  const reducido = useReducedMotion();
  const R = RESUMEN_TRAZA;
  const completo = R.acreditadas === R.filas;
  const animar = reducido ? { initial: false as const } : { initial: "oculto", whileInView: "visible", viewport: { once: true, margin: "-40px 0px" } };

  return (
    <div className="chk">
      <div className="chk__marcador">
        <div className="chk__cifra" aria-label={`${R.acreditadas} de ${R.filas} requisitos acreditados`}>
          <span className="chk__n display">{R.acreditadas}</span>
          <span className="chk__de display">/{R.filas}</span>
        </div>
        <div className="chk__resumen">
          <p className="chk__leyenda">
            {completo ? "Todos los requisitos del enunciado, acreditados con evidencia." : "Requisitos del enunciado acreditados con evidencia."}
          </p>
          <div className="chk__barra" role="progressbar" aria-label="Avance del checklist" aria-valuemin={0} aria-valuemax={R.filas} aria-valuenow={R.acreditadas}>
            <motion.span
              className="chk__relleno"
              style={{ width: `${(R.acreditadas / R.filas) * 100}%` }}
              initial={reducido ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <ul className="chk__stats">
            <li>
              <strong>
                {R.idsCubiertos}/{R.idsTotal}
              </strong>{" "}
              IDs del enunciado cubiertos
            </li>
            <li>
              <strong>{R.historiasAcreditadas}</strong> historias de usuario cerradas
            </li>
            <li>
              <strong>
                {DOD_NOTEBOOKS.ok}/{DOD_NOTEBOOKS.total}
              </strong>{" "}
              notebooks cumplen la DoD
            </li>
          </ul>
        </div>
        <Link to="/trazabilidad" className="chk__matriz">
          Ver la matriz completa<span aria-hidden="true"> →</span>
        </Link>
      </div>

      <div className="chk__columnas">
        {COLUMNAS.map((c) => {
          const bloques = BLOQUES.filter((b) => b.modulo === c.modulo);
          const filas = MATRIZ.filter((f) => f.modulo === c.modulo);
          return (
            <section key={c.modulo} className="chk-col" style={{ "--m-c": c.color } as React.CSSProperties} aria-label={c.titulo}>
              <header className="chk-col__cab">
                <span className="chk-col__titulo">{c.titulo}</span>
                <span className="chk-col__sub">{c.sub}</span>
                <span className="chk-col__cuenta mono">
                  {filas.filter((f) => f.acreditada).length}/{filas.length}
                </span>
              </header>
              {bloques.map((b) => {
                const propias = filas.filter((f) => f.bloque === b.id);
                return (
                  <div key={b.id} className="chk-bloque">
                    <h3 className="chk-bloque__titulo">
                      <span>{b.nombre}</span>
                      <span className="chk-bloque__cuenta mono">
                        {propias.filter((f) => f.acreditada).length}/{propias.length}
                      </span>
                    </h3>
                    <motion.ul className="chk-bloque__lista" {...animar}>
                      {propias.map((f, i) => (
                        <Item key={f.id} f={f} i={i} />
                      ))}
                    </motion.ul>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}

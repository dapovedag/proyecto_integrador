/**
 * Paleta de comandos (⌘K / Ctrl+K): saltar a cualquier ruta, capítulo o figura.
 * Las figuras salen de public/run/figuras.json cuando existe (se carga al abrir, una sola vez).
 *   const { abrir } = usePaleta();
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PASOS, MODULOS, numeroFantasma } from "@/content/pasos";
import { cargarRun } from "@/data/cargar";
import type { IndiceFiguras } from "@/data/tipos";
import { enlaceCelda } from "@/charts/Evidencia";
import { Kbd } from "./base";

interface Opcion {
  id: string;
  grupo: "Rutas" | "Capítulos" | "Figuras";
  titulo: string;
  detalle: string;
  icono: string;
  color?: string;
  ruta: string;
  buscar: string;
}

const Ctx = createContext<{ abrir: () => void; cerrar: () => void; abierta: boolean }>({ abrir: () => {}, cerrar: () => {}, abierta: false });
export const usePaleta = () => useContext(Ctx);

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const RUTAS: Opcion[] = [
  { id: "r-inicio", grupo: "Rutas", titulo: "Portada", detalle: "El problema, el modelo v2 y el recorrido", icono: "↖", ruta: "/", buscar: "" },
  { id: "r-sim", grupo: "Rutas", titulo: "Simulador de decisión", detalle: "Calcula la probabilidad de impago en el navegador", icono: "∿", ruta: "/simulador", buscar: "" },
  { id: "r-traz", grupo: "Rutas", titulo: "Trazabilidad", detalle: "Checklist del enunciado calculado", icono: "≡", ruta: "/trazabilidad", buscar: "" },
].map((o) => ({ ...o, buscar: sinTildes(`${o.titulo} ${o.detalle}`) }) as Opcion);

const CAPITULOS: Opcion[] = PASOS.map((p) => ({
  id: `p-${p.n}`,
  grupo: "Capítulos" as const,
  titulo: `${numeroFantasma(p.n)} · ${p.titulo}`,
  detalle: `${MODULOS[p.modulo].corto} · ${p.ids.slice(0, 4).join(", ")}${p.ids.length > 4 ? "…" : ""}`,
  icono: numeroFantasma(p.n),
  color: MODULOS[p.modulo].color,
  ruta: p.ruta,
  buscar: sinTildes(`${p.n} paso ${p.titulo} ${p.tituloCorto} ${p.ids.join(" ")} ${p.hu.join(" ")} ${p.notebook ? `nb${p.notebook}` : ""}`),
}));

export function ProveedorPaleta({ children }: { children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  const abrir = useCallback(() => setAbierta(true), []);
  const cerrar = useCallback(() => setAbierta(false), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierta((a) => !a);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const valor = useMemo(() => ({ abrir, cerrar, abierta }), [abrir, cerrar, abierta]);
  return (
    <Ctx.Provider value={valor}>
      {children}
      <AnimatePresence>{abierta && <Paleta onCerrar={cerrar} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

function Paleta({ onCerrar }: { onCerrar: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [figuras, setFiguras] = useState<Opcion[]>([]);
  const nav = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const reducido = useReducedMotion();
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previo.current = document.activeElement as HTMLElement;
    input.current?.focus();
    const ov = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // figuras.json se publica como lista; se acepta también la forma { figuras: [...] }.
    cargarRun<IndiceFiguras | IndiceFiguras["figuras"]>("figuras.json")
      .then((ix) =>
        setFiguras(
          (Array.isArray(ix) ? ix : (ix.figuras ?? [])).map((f, i) => ({
            id: `f-${f.id ?? f.clave ?? i}-${i}`,
            grupo: "Figuras" as const,
            titulo: f.titulo,
            detalle: `${f.notebook ? `nb${/(\d{2})/.exec(f.notebook)?.[1] ?? f.notebook}` : ""}${f.celda != null ? ` · celda ${f.celda}` : ""} · ${f.tipo}`,
            icono: "◫",
            ruta: enlaceCelda(f.notebook, f.celda) ?? "/",
            buscar: sinTildes(`${f.titulo} ${f.subtitulo ?? ""} ${f.tipo} ${f.notebook ?? ""}`),
          })),
        ),
      )
      .catch(() => setFiguras([]));
    return () => {
      document.body.style.overflow = ov;
      previo.current?.focus?.();
    };
  }, []);

  const resultados = useMemo(() => {
    const t = sinTildes(q.trim());
    const todas = [...RUTAS, ...CAPITULOS, ...figuras];
    if (!t) return [...RUTAS, ...CAPITULOS, ...figuras.slice(0, 6)];
    const palabras = t.split(/\s+/);
    return todas.filter((o) => palabras.every((w) => o.buscar.includes(w))).slice(0, 40);
  }, [q, figuras]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    lista.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const ir = (o: Opcion | undefined) => {
    if (!o) return;
    onCerrar();
    nav(o.ruta);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(resultados.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(resultados[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCerrar();
    } else if (e.key === "Tab") {
      e.preventDefault(); // foco atrapado en la paleta
    }
  };

  let grupoPrevio = "";
  const idLista = "paleta-lista";
  return (
    <motion.div
      className="paleta-fondo"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducido ? 0 : 0.18 }}
    >
      <motion.div
        className="paleta"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        initial={reducido ? false : { opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducido ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onKeyDown={onKey}
      >
        <div className="paleta__entrada">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ color: "var(--text-3)" }}>
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar capítulo, ID del enunciado (IA3.2), HU o figura…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-activedescendant={resultados[sel] ? `op-${resultados[sel].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="paleta__lista" role="listbox" id={idLista} ref={lista} aria-label="Resultados">
          {resultados.length === 0 && <li className="paleta__vacio">Sin coincidencias para «{q}».</li>}
          {resultados.map((o, i) => {
            const cab = o.grupo !== grupoPrevio ? o.grupo : null;
            grupoPrevio = o.grupo;
            return (
              <li key={o.id} role="none">
                {cab && <div className="paleta__grupo versalitas" role="presentation">{cab}</div>}
                <div
                  id={`op-${o.id}`}
                  role="option"
                  aria-selected={i === sel}
                  data-i={i}
                  className="paleta__opcion"
                  onMouseMove={() => setSel(i)}
                  onClick={() => ir(o)}
                >
                  <span className="paleta__icono" style={o.color ? ({ "--o-c": o.color } as React.CSSProperties) : undefined} aria-hidden="true">
                    {o.icono}
                  </span>
                  <span className="paleta__texto">
                    <strong>{o.titulo}</strong>
                    <span>{o.detalle}</span>
                  </span>
                  {i === sel && <Kbd>↵</Kbd>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="paleta__pie" aria-hidden="true">
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navegar
          </span>
          <span>
            <Kbd>↵</Kbd> abrir
          </span>
          <span>
            <Kbd>Esc</Kbd> cerrar
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

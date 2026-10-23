/**
 * Shell: barra superior (marca, navegación, chip de versión del modelo, ⌘K), rail de capítulos en las rutas
 * de capítulo, transición de ruta, pie con versión · git sha · fecha del manifest.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import card from "@/data/generated/model_card.json";
import manifest from "@/data/generated/manifest.json";
import { fecha } from "@/charts/formatos";
import { PASOS } from "@/content/pasos";
import { Cargando, Chip, Kbd, Tooltip } from "./base";
import { ProveedorPaleta, usePaleta } from "./PaletaComandos";
import { RailCapitulos } from "./RailCapitulos";

export function Logo({ className = "barra__logo" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#14151B" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" />
      <rect x="14" y="30" width="8" height="14" rx="2" fill="#34D399" />
      <rect x="28" y="22" width="8" height="22" rx="2" fill="#FBBF24" />
      <rect x="42" y="14" width="8" height="30" rx="2" fill="#F87171" />
      <circle cx="32" cy="52" r="3" fill="#505CFD" />
    </svg>
  );
}

function BarraSuperior({ conRail, onAbrirRail }: { conRail: boolean; onAbrirRail: () => void }) {
  const { abrir } = usePaleta();
  const { pathname } = useLocation();
  const esMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const enCapitulo = pathname.startsWith("/paso");
  return (
    <header className="barra">
      {(
        <button type="button" className="barra__menu barra__menu--rail" onClick={onAbrirRail} aria-label={conRail ? "Abrir capítulos" : "Abrir menú"}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2.5 4h11M2.5 8h11M2.5 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <Link to="/" className="barra__marca" aria-label="Expediente de riesgo · inicio">
        <Logo />
        <span className="barra__nombre">
          Expediente de riesgo
          <span className="barra__sub">Proyecto integrador</span>
        </span>
      </Link>
      <nav className="barra__nav" aria-label="Principal">
        <NavLink to="/metodologia" className="barra__enlace">
          Metodología
        </NavLink>
        <NavLink to="/paso/1" className={`barra__enlace ${enCapitulo ? "activo" : ""}`}>
          Capítulos
        </NavLink>
        <NavLink to="/simulador" className="barra__enlace">
          Simulador
        </NavLink>
        <NavLink to="/trazabilidad" className="barra__enlace">
          Trazabilidad
        </NavLink>
      </nav>
      <div className="barra__derecha">
        <Tooltip
          texto={
            <>
              {card.algoritmo}
              <br />
              Variante de equidad: {card.variante_equidad} · entrenado el {fecha(card.fecha_entrenamiento)}
            </>
          }
        >
          <span className="barra__version" tabIndex={0}>
            <Chip tono="ok" punto mono>
              modelo v{card.version}
            </Chip>
          </span>
        </Tooltip>
        <button type="button" className="barra__buscar" onClick={abrir} aria-label="Buscar (Ctrl+K)">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="barra__buscar-texto">Capítulo, ID o figura…</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 3 }}>
            <Kbd>{esMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>
    </header>
  );
}

function Pie() {
  const hechos = PASOS.filter((p) => p.estado === "hecho").length;
  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="pie__rejilla">
          <div className="pila">
            <Logo className="barra__logo" />
            <p className="pie__lema">Estimar quién pagará, decidir con costos y rendir cuentas.</p>
            <p className="texto-3" style={{ fontSize: "var(--fs-sm)", maxWidth: "42ch" }}>
              Proyecto Integrador · Análisis predictivo de riesgo de crédito en instituciones financieras. Sitio estático: todo lo que se
              ve sale del paquete de la corrida real.
            </p>
          </div>
          <div className="pie__col">
            <h2>Recorrido</h2>
            <ul>
              <li>
                <Link to="/metodologia">00 · Metodología</Link>
              </li>
              <li>
                <Link to="/paso/1">01 · Problema y ética</Link>
              </li>
              <li>
                <Link to="/paso/5">05 · Modelos clásicos</Link>
              </li>
              <li>
                <Link to="/paso/8">08 · Evaluación y equidad</Link>
              </li>
              <li>
                <Link to="/paso/11">11 · Integración</Link>
              </li>
            </ul>
          </div>
          <div className="pie__col">
            <h2>Herramientas</h2>
            <ul>
              <li>
                <Link to="/simulador">Simulador de decisión</Link>
              </li>
              <li>
                <Link to="/trazabilidad">Trazabilidad del enunciado</Link>
              </li>
              <li>
                <Link to="/paso/10">Consola de la API</Link>
              </li>
            </ul>
          </div>
          <div className="pie__col">
            <h2>Paquete de corrida</h2>
            <dl style={{ margin: 0 }}>
              <div className="pie__dato">
                <dt>Versión</dt>
                <dd>v{manifest.version}</dd>
              </div>
              <div className="pie__dato">
                <dt>Commit</dt>
                <dd>{manifest.git_sha}</dd>
              </div>
              <div className="pie__dato">
                <dt>Generado</dt>
                <dd>{fecha(manifest.generado, true)}</dd>
              </div>
              <div className="pie__dato">
                <dt>Archivos con SHA-256</dt>
                <dd>{Object.keys(manifest.archivos).length}</dd>
              </div>
              <div className="pie__dato">
                <dt>Capítulos hechos</dt>
                <dd>
                  {hechos}/{PASOS.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="pie__base">
          <span>
            v{manifest.version} · {manifest.git_sha} · {manifest.generado.replace("T", " ")}
          </span>
          <span>Sin peticiones a servicios externos · es-CO</span>
        </div>
      </div>
    </footer>
  );
}

function TransicionRuta({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reducido = useReducedMotion();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  if (reducido) return <>{children}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function Shell() {
  const { pathname } = useLocation();
  const conRail = pathname.startsWith("/paso") || pathname === "/metodologia";
  const [cajon, setCajon] = useState(false);
  useEffect(() => setCajon(false), [pathname]);
  return (
    <ProveedorPaleta>
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <BarraSuperior conRail={conRail} onAbrirRail={() => setCajon(true)} />
      <div className={`marco ${conRail ? "marco--con-rail" : ""}`}>
        {conRail && <RailCapitulos />}
        <main id="contenido" className="marco__principal" tabIndex={-1}>
          <TransicionRuta>
            <Suspense fallback={<div className="contenedor" style={{ paddingBlock: 64 }}><Cargando etiqueta="Abriendo capítulo" /></div>}>
              <Outlet />
            </Suspense>
          </TransicionRuta>
          <Pie />
        </main>
      </div>
      <AnimatePresence>
        {cajon && (
          <>
            <motion.div className="cajon-fondo" onClick={() => setCajon(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="cajon"
              role="dialog"
              aria-modal="true"
              aria-label="Capítulos"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              onKeyDown={(e) => e.key === "Escape" && setCajon(false)}
            >
              <nav className="cajon__nav" aria-label="Principal">
                <NavLink to="/" end onClick={() => setCajon(false)}>Portada</NavLink>
                <NavLink to="/simulador" onClick={() => setCajon(false)}>Simulador</NavLink>
                <NavLink to="/trazabilidad" onClick={() => setCajon(false)}>Trazabilidad</NavLink>
              </nav>
              <RailCapitulos onNavegar={() => setCajon(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ProveedorPaleta>
  );
}

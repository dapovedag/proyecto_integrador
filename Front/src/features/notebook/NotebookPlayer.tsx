/**
 * NotebookPlayer — reproduce con fidelidad la ejecución real (papermill) de un notebook del proyecto.
 *
 * Fuente: `public/run/notebooks/NN.json` (salidas reales, execution_count y duración real por celda).
 * - Estado inicial: sin ejecutar (`[ ]`, sin salidas). "▶ Ejecutar todo" encola las celdas (`[*]`),
 *   cada una dura un tiempo comprimido proporcional a su duración real (tiempos.ts) y al terminar muestra
 *   su `[n]` real; stdout aparece línea a línea; tablas y figuras nativas se revelan.
 * - "Ejecutar celda" (o Mayús+Enter sobre la celda), "Reiniciar", "Ver resultados" (sin animar).
 * - `?nb=NN&celda=K` (índice de celda del .ipynb, el mismo de la Evidencia) o `celdaInicial` revelan hasta
 *   esa celda y se desplazan a ella.
 * - prefers-reduced-motion: revela de inmediato. Salidas pesadas difieren su montaje hasta acercarse.
 */
import { useReducedMotion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { duracion, num } from "@/charts/formatos";
import { Cargando, Faltante } from "@/components/base";
import { useRecurso } from "@/data/cargar";
import type { Celda, NotebookEjecutado } from "@/data/tipos";
import { Codigo, Diferido, Markdown, Salidas } from "./celdas";
import { explicarCelda } from "./explicador";
import { Termino } from "@/components/Termino";
import { cargarAnotaciones, type Anotaciones } from "@/content/anotaciones";
import type { Anotacion } from "@/content/pedagogia";
import { comprimirDuraciones } from "./tiempos";
import "./notebook.css";

export interface NotebookPlayerProps {
  nb: string;
  celdaInicial?: number;
  compacto?: boolean;
}

/** "5" | "05" | "nb05" | "05_modelos.ipynb" → "05". */
export function idNotebook(nb: string): string {
  const m = /(\d{1,2})/.exec(nb);
  return m ? m[1].padStart(2, "0") : nb;
}

export function NotebookPlayer({ nb, celdaInicial, compacto }: NotebookPlayerProps) {
  const id = idNotebook(nb);
  const r = useRecurso<NotebookEjecutado>(`notebooks/${id}.json`);
  if (r.estado === "cargando") return <Cargando etiqueta={`Abriendo notebook ${id}`} alto={compacto ? 240 : 420} />;
  if (r.estado !== "listo" || !r.datos)
    return (
      <Faltante titulo={`Notebook ${id}`}>
        La ejecución real de este notebook aún no está en el paquete de corrida.
      </Faltante>
    );
  return <Reproductor key={id} id={id} datos={r.datos} celdaInicial={celdaInicial} compacto={!!compacto} />;
}

export default NotebookPlayer;

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
export type EstadoCelda = "nada" | "cola" | "corriendo" | "hecho";

interface Estado {
  estados: EstadoCelda[];
  cola: number[];
  actual: number | null;
}

type Accion =
  | { t: "todo"; codigo: number[] }
  | { t: "celda"; j: number }
  | { t: "fin"; j: number }
  | { t: "ver"; codigo: number[] }
  | { t: "hasta"; codigo: number[]; j: number }
  | { t: "reiniciar"; n: number };

function avanzar(s: Estado): Estado {
  if (s.actual !== null || !s.cola.length) return s;
  const [sig, ...resto] = s.cola;
  const estados = s.estados.slice();
  estados[sig] = "corriendo";
  return { estados, cola: resto, actual: sig };
}

export function reductor(s: Estado, a: Accion): Estado {
  switch (a.t) {
    case "todo": {
      const pendientes = a.codigo.filter((j) => s.estados[j] !== "hecho" && j !== s.actual);
      const lista = pendientes.length ? pendientes : a.codigo;
      const estados = pendientes.length ? s.estados.slice() : s.estados.map(() => "nada" as EstadoCelda);
      for (const j of lista) if (estados[j] !== "corriendo") estados[j] = "cola";
      const cola = [...s.cola.filter((j) => !lista.includes(j)), ...lista.filter((j) => j !== s.actual)];
      return avanzar({ estados, cola, actual: pendientes.length ? s.actual : null });
    }
    case "celda": {
      if (s.actual === a.j || s.cola.includes(a.j)) return s;
      const estados = s.estados.slice();
      estados[a.j] = "cola";
      return avanzar({ ...s, estados, cola: [...s.cola, a.j] });
    }
    case "fin": {
      if (s.actual !== a.j) return s;
      const estados = s.estados.slice();
      estados[a.j] = "hecho";
      return avanzar({ ...s, estados, actual: null });
    }
    case "ver": {
      const estados = s.estados.slice();
      for (const j of a.codigo) estados[j] = "hecho";
      return { estados, cola: [], actual: null };
    }
    case "hasta": {
      const estados = s.estados.slice();
      for (const j of a.codigo) if (j <= a.j) estados[j] = "hecho";
      return { ...s, estados };
    }
    case "reiniciar":
      return { estados: Array.from({ length: a.n }, () => "nada"), cola: [], actual: null };
  }
}

/** Índice de celda en el .ipynb original (papermill inserta una celda "injected-parameters" que el JSON omite). */
export function indicesOriginales(celdas: Celda[]): number[] {
  const p = celdas.findIndex((c) => c.tipo === "codigo" && c.parametros);
  const votos = new Map<number, number>();
  celdas.forEach((c, j) => {
    if (c.tipo !== "codigo") return;
    for (const s of c.salidas) {
      if (s.tipo === "figura" && typeof s.spec.celda === "number" && j > p) {
        const off = s.spec.celda - j;
        votos.set(off, (votos.get(off) ?? 0) + 1);
      }
    }
  });
  const off = votos.size ? [...votos.entries()].sort((a, b) => b[1] - a[1])[0][0] : p >= 0 ? 1 : 0;
  return celdas.map((_, j) => (p >= 0 && j > p ? j + off : j));
}

/** Alto de reserva de una celda diferida (evita saltos al montarse): aproximado por líneas visibles. */
const altoCodigo = (lineas: number) => 28 + Math.min(lineas, 18) * 20;
const altoMarkdown = (fuente: string) => 24 + Math.min(40, fuente.split("\n").length) * 22;

/** «Modo aprendizaje» del reproductor: activo por defecto; la preferencia se recuerda en este navegador. */
const CLAVE_APRENDIZAJE = "nbp:aprendizaje";
function useModoAprendizaje(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_APRENDIZAJE) !== "0";
    } catch {
      return true;
    }
  });
  const cambiar = useCallback((x: boolean) => {
    setV(x);
    try {
      localStorage.setItem(CLAVE_APRENDIZAJE, x ? "1" : "0");
    } catch {
      /* sin almacenamiento: solo dura la sesión */
    }
  }, []);
  return [v, cambiar];
}

/** Explicación pedagógica de una celda de código: qué hace, por qué, conceptos y, a pedido, línea a línea. */
function Explicacion({ fuente, anotacion }: { fuente: string; anotacion: Anotacion | null }) {
  const [lineas, setLineas] = useState(false);
  const explicadas = useMemo(() => (lineas ? explicarCelda(fuente, anotacion?.lineas).filter((l) => l.texto) : []), [lineas, fuente, anotacion]);
  return (
    <div className="nb-explica">
      {anotacion && (
        <>
          <p className="nb-explica__que">
            <span className="nb-explica__rotulo">Qué hace</span>
            {anotacion.que}
          </p>
          <p className="nb-explica__porque">
            <span className="nb-explica__rotulo">Por qué</span>
            {anotacion.porque}
          </p>
          {anotacion.conceptos.length > 0 && (
            <p className="nb-explica__conceptos">
              <span className="nb-explica__rotulo">Conceptos</span>
              {anotacion.conceptos.map((c, i) => (
                <span key={c}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <Termino id={c} />
                </span>
              ))}
            </p>
          )}
        </>
      )}
      <button type="button" className="nb-explica__btn" aria-expanded={lineas} onClick={() => setLineas((x) => !x)}>
        {lineas ? "Ocultar la explicación línea a línea" : "Explicar el código línea a línea"}
      </button>
      {lineas && (
        <ol className="nb-explica__lineas">
          {explicadas.map((l) => (
            <li key={l.n}>
              <span className="nb-explica__n mono">{l.n}</span>
              <code className="nb-explica__codigo">{l.codigo.trim()}</code>
              <span className="nb-explica__texto">{l.texto}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function tituloSeccion(fuente: string): string | null {
  const m = /^##\s+(.+?)\s*#*\s*$/m.exec(fuente);
  return m ? m[1].replace(/[*_`]/g, "").trim() : null;
}

/* ------------------------------------------------------------------ */
/* Reproductor                                                         */
/* ------------------------------------------------------------------ */
function Reproductor({ id, datos, celdaInicial, compacto }: { id: string; datos: NotebookEjecutado; celdaInicial?: number; compacto: boolean }) {
  const reducido = !!useReducedMotion();
  const location = useLocation();
  const celdas = datos.celdas;
  const codigo = useMemo(() => celdas.flatMap((c, j) => (c.tipo === "codigo" ? [j] : [])), [celdas]);
  const origen = useMemo(() => indicesOriginales(celdas), [celdas]);
  const duracionesMs = useMemo(() => {
    const comp = comprimirDuraciones(codigo.map((j) => (celdas[j] as Extract<Celda, { tipo: "codigo" }>).duracion_s));
    const m = new Map<number, number>();
    codigo.forEach((j, k) => m.set(j, comp[k] * 1000));
    return m;
  }, [codigo, celdas]);
  const totalReproduccion = useMemo(() => [...duracionesMs.values()].reduce((s, x) => s + x, 0) / 1000, [duracionesMs]);
  const totalReal = datos.duracion_total_s || codigo.reduce((s, j) => s + ((celdas[j] as { duracion_s?: number | null }).duracion_s ?? 0), 0);
  const secciones = useMemo(
    () => celdas.flatMap((c, j) => (c.tipo === "markdown" ? (tituloSeccion(c.fuente) ? [{ j, titulo: tituloSeccion(c.fuente) as string }] : []) : [])),
    [celdas],
  );

  const [s, despachar] = useReducer(reductor, celdas.length, (n) => ({ estados: Array.from({ length: n }, () => "nada" as EstadoCelda), cola: [], actual: null }));
  const [verReferencia, setVerReferencia] = useState(false);
  const [aprendizaje, setAprendizaje] = useModoAprendizaje();
  const [anotaciones, setAnotaciones] = useState<Anotaciones>({});
  useEffect(() => {
    let vivo = true;
    cargarAnotaciones(id).then((a) => vivo && setAnotaciones(a));
    return () => {
      vivo = false;
    };
  }, [id]);
  const [destino, setDestino] = useState<number | null>(null);
  const [activa, setActiva] = useState<number | null>(secciones[0]?.j ?? null);
  const raiz = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);

  const hechas = codigo.filter((j) => s.estados[j] === "hecho").length;
  const realHecho = codigo.reduce((acc, j) => acc + (s.estados[j] === "hecho" ? ((celdas[j] as { duracion_s?: number | null }).duracion_s ?? 0) : 0), 0);
  const ocupado = s.actual !== null;
  const sinEjecutar = hechas === 0 && !ocupado && s.cola.length === 0;

  const elemento = useCallback((j: number) => raiz.current?.querySelector<HTMLElement>(`[data-j="${j}"]`) ?? null, []);

  const desplazarA = useCallback(
    (j: number, bloque: "inicio" | "seguir") => {
      const el = elemento(j);
      if (!el) return;
      const cont = compacto ? cuerpo.current : null;
      const comportamiento: ScrollBehavior = reducido ? "auto" : "smooth";
      if (cont) {
        const top = el.offsetTop - (cont.firstElementChild as HTMLElement | null)!.offsetTop - (bloque === "inicio" ? 8 : cont.clientHeight * 0.2);
        cont.scrollTo({ top: Math.max(0, top), behavior: comportamiento });
        return;
      }
      const r = el.getBoundingClientRect();
      const cab = raiz.current?.querySelector<HTMLElement>(".nbp__cabecera");
      const pegajosa = cab && getComputedStyle(cab).position === "sticky";
      const tapa = (pegajosa ? cab.getBoundingClientRect().height : 0) + 72;
      const margen = bloque === "inicio" ? tapa + 8 : Math.max(tapa + 16, window.innerHeight * 0.3);
      window.scrollTo({ top: Math.max(0, r.top + window.scrollY - margen), behavior: comportamiento });
    },
    [elemento, compacto, reducido],
  );

  /* Temporizador de la celda en curso. */
  useEffect(() => {
    if (s.actual === null) return;
    const j = s.actual;
    const ms = reducido ? 0 : duracionesMs.get(j) ?? 250;
    const t = setTimeout(() => despachar({ t: "fin", j }), ms);
    return () => clearTimeout(t);
  }, [s.actual, duracionesMs, reducido]);

  /* Seguir la ejecución solo si el lector está mirando el reproductor. */
  const previa = useRef<number | null>(null);
  useEffect(() => {
    const j = s.actual;
    if (j === null) return;
    const ant = previa.current;
    previa.current = j;
    if (reducido) return;
    const ref = ant !== null ? elemento(ant) : elemento(j);
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    if (visible) desplazarA(j, "seguir");
  }, [s.actual, elemento, desplazarA, reducido]);

  /* Enlace profundo: ?nb=NN&celda=K (o la prop celdaInicial). */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const nbUrl = q.get("nb");
    const celdaUrl = q.get("celda");
    let k: number | null = null;
    if (nbUrl && idNotebook(nbUrl) === id && celdaUrl != null && celdaUrl !== "") k = Number(celdaUrl);
    else if (celdaInicial != null) k = celdaInicial;
    if (k == null || !Number.isFinite(k)) return;
    let j = origen.findIndex((o) => o === k);
    if (j < 0) j = origen.reduce((best, o, i) => (o <= (k as number) ? i : best), 0);
    despachar({ t: "hasta", codigo, j });
    setDestino(j);
    // Dos pasadas: la segunda corrige el desplazamiento cuando tablas y figuras ya tomaron su alto.
    const t = setTimeout(() => desplazarA(j, "inicio"), 450);
    const t1 = setTimeout(() => desplazarA(j, "inicio"), 1400);
    const t2 = setTimeout(() => setDestino(null), 3600);
    return () => {
      clearTimeout(t);
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, celdaInicial, id]);

  /* Sección activa del índice. */
  useEffect(() => {
    if (compacto || !secciones.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.j));
        if (vis.length) setActiva(Math.min(...vis));
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const sec of secciones) {
      const el = elemento(sec.j);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [secciones, compacto, elemento]);

  const ejecutarTodo = () => despachar({ t: "todo", codigo });
  const verTodo = () => despachar({ t: "ver", codigo });
  const reiniciar = () => {
    previa.current = null;
    despachar({ t: "reiniciar", n: celdas.length });
  };
  const ejecutarCelda = useCallback((j: number) => despachar({ t: "celda", j }), []);

  const nCodigo = codigo.length;
  const kernel = typeof datos.kernel === "object" && datos.kernel ? (datos.kernel as { display_name?: string }).display_name : String(datos.kernel ?? "");
  const anuncio = ocupado
    ? `Ejecutando celda ${codigo.indexOf(s.actual as number) + 1} de ${nCodigo}`
    : hechas === nCodigo
      ? `Notebook ejecutado: ${nCodigo} celdas de código`
      : hechas
        ? `${hechas} de ${nCodigo} celdas ejecutadas`
        : "Notebook sin ejecutar";

  return (
    <div
      ref={raiz}
      className={`nbp ${compacto ? "nbp--compacto" : ""}`}
      data-testid="notebook-player"
      data-nb={id}
      data-kernel={ocupado ? "ocupado" : "inactivo"}
      data-hechas={hechas}
      data-total={nCodigo}
    >
      <header className="nbp__cabecera">
        <div className="nbp__archivo">
          <svg className="nbp__icono" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="3.5" y="2.5" width="13" height="15" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6.5 6.5h7M6.5 9.5h7M6.5 12.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <div className="nbp__nombres">
            <span className="nbp__nombre mono">{datos.archivo}</span>
            {!compacto && <span className="nbp__titulo">{datos.titulo}</span>}
          </div>
        </div>
        <div className="nbp__kernel" title={ocupado ? "Kernel ocupado" : "Kernel inactivo"}>
          <span className={`nbp__kernel-punto ${ocupado ? "nbp__kernel-punto--ocupado" : ""}`} aria-hidden="true" />
          <span className="mono">{kernel || "credit-risk (Python 3.10)"}</span>
          <span className="nbp__kernel-estado">{ocupado ? "Ocupado" : "Inactivo"}</span>
        </div>
        <div className="nbp__acciones" role="toolbar" aria-label="Controles del notebook">
          <button type="button" className="nbp__boton nbp__boton--primario" onClick={ejecutarTodo} disabled={ocupado && s.cola.length === 0 && hechas + 1 === nCodigo}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M4.5 3v10l8.5-5z" fill="currentColor" />
            </svg>
            Ejecutar todo
          </button>
          <button type="button" className="nbp__boton" onClick={verTodo} disabled={hechas === nCodigo}>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            Ver resultados
          </button>
          <button type="button" className="nbp__boton" onClick={reiniciar} disabled={sinEjecutar}>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reiniciar
          </button>
        </div>
        <div className="nbp__progreso">
          <div className="nbp__barra" aria-hidden="true">
            <span style={{ transform: `scaleX(${nCodigo ? hechas / nCodigo : 0})` }} />
          </div>
          <span className="nbp__cifras mono tabular">
            {hechas}/{nCodigo} celdas · {duracion(realHecho)} de {duracion(totalReal)} de cómputo real
          </span>
          <span className="sr-only" role="status" aria-live="polite">
            {anuncio}
          </span>
        </div>
        <div className="nbp__extras">
          {!compacto && secciones.length > 1 && (
            <label className="nbp__ir">
              <span className="sr-only">Ir a una sección del notebook</span>
              <select
                value=""
                onChange={(e) => {
                  const j = Number(e.target.value);
                  if (Number.isFinite(j)) {
                    desplazarA(j, "inicio");
                    setActiva(j);
                  }
                }}
              >
                <option value="" disabled>
                  Ir a sección…
                </option>
                {secciones.map((sec) => (
                  <option key={sec.j} value={sec.j}>
                    {sec.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="nbp__ref nbp__aprender">
            <input type="checkbox" checked={aprendizaje} onChange={(e) => setAprendizaje(e.target.checked)} />
            <span>Modo aprendizaje</span>
          </label>
          <label className="nbp__ref">
            <input type="checkbox" checked={verReferencia} onChange={(e) => setVerReferencia(e.target.checked)} />
            <span>Ver referencia de matplotlib</span>
          </label>
        </div>
      </header>

      {sinEjecutar && (
        <div className="nbp__llamado">
          <div>
            <span className="versalitas">Ejecución real · papermill</span>
            <p>
              Este notebook aún no se ha ejecutado en esta sesión. <strong>Ejecutar todo</strong> reproduce sus {num(nCodigo)} celdas con las
              salidas reales: {duracion(totalReal)} de cómputo comprimidos en ≈ {duracion(Math.ceil(totalReproduccion))}.
            </p>
          </div>
          <button type="button" className="nbp__play" onClick={ejecutarTodo} aria-label="Ejecutar todo el notebook">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      <div className={`nbp__cuerpo ${!compacto && secciones.length > 1 ? "nbp__cuerpo--indice" : ""}`} ref={cuerpo}>
        <ol className="nbp__celdas" aria-label={`Celdas de ${datos.archivo}`}>
          {celdas.map((c, j) =>
            c.tipo === "markdown" ? (
              <li key={j} className="nb-celda nb-celda--md" data-j={j} data-celda={origen[j]} id={`nb${id}-c${origen[j]}`}>
                {/* Markdown y resaltado se montan al acercarse a la vista: el capítulo abre sin procesar las ~80 celdas. */}
                {destino === j ? <Markdown fuente={c.fuente} /> : <Diferido alto={altoMarkdown(c.fuente)}>{<Markdown fuente={c.fuente} />}</Diferido>}
              </li>
            ) : (
              <CeldaCodigo
                key={j}
                j={j}
                celda={c}
                original={origen[j]}
                nbId={id}
                estado={s.estados[j]}
                duracionMs={duracionesMs.get(j) ?? 250}
                verReferencia={verReferencia}
                anotacion={aprendizaje ? (anotaciones[j] ?? null) : undefined}
                reducido={reducido}
                destino={destino === j}
                onEjecutar={ejecutarCelda}
              />
            ),
          )}
        </ol>
        {!compacto && secciones.length > 1 && (
          <nav className="nbp__indice" aria-label="Secciones del notebook">
            <span className="versalitas">Secciones</span>
            <ol>
              {secciones.map((sec) => {
                return (
                  <li key={sec.j}>
                    <button
                      type="button"
                      className={activa === sec.j ? "activa" : ""}
                      aria-current={activa === sec.j ? "true" : undefined}
                      onClick={() => {
                        desplazarA(sec.j, "inicio");
                        setActiva(sec.j);
                      }}
                    >
                      {sec.titulo}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Celda de código                                                     */
/* ------------------------------------------------------------------ */
interface CeldaCodigoProps {
  j: number;
  celda: Extract<Celda, { tipo: "codigo" }>;
  original: number;
  nbId: string;
  estado: EstadoCelda;
  duracionMs: number;
  verReferencia: boolean;
  /** Modo aprendizaje: la anotación de la celda (null si no tiene); undefined = modo apagado. */
  anotacion?: Anotacion | null;
  reducido: boolean;
  destino: boolean;
  onEjecutar: (j: number) => void;
}

const CeldaCodigo = memo(function CeldaCodigo({ j, celda, original, nbId, estado, duracionMs, verReferencia, anotacion, reducido, destino, onEjecutar }: CeldaCodigoProps) {
  const [progreso, setProgreso] = useState(estado === "hecho" ? 1 : 0);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    if (estado === "hecho") {
      setProgreso(1);
      return;
    }
    if (estado !== "corriendo") {
      setProgreso(0);
      setAnimar(false);
      return;
    }
    if (reducido) {
      setProgreso(1);
      return;
    }
    setAnimar(true);
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / Math.max(1, duracionMs));
      setProgreso(p);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [estado, duracionMs, reducido]);

  const prompt = estado === "nada" ? " " : estado === "hecho" ? String(celda.ejecucion ?? " ") : "*";
  const lineas = celda.fuente.split("\n").length;
  const real = celda.duracion_s ?? 0;
  const mostrarSalidas = estado === "corriendo" || estado === "hecho";
  const etiqueta = `Celda ${original}${celda.ejecucion != null ? ` · In [${celda.ejecucion}]` : ""}, ${lineas} líneas de Python`;

  return (
    <li
      className={`nb-celda nb-celda--codigo nb-celda--${estado} ${destino ? "nb-celda--destino" : ""}`}
      data-j={j}
      data-celda={original}
      data-estado={estado}
      id={`nb${nbId}-c${original}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          onEjecutar(j);
        }
      }}
    >
      <div className="nb-celda__margen">
        <span className="nb-prompt mono">
          <span className="sr-only">{estado === "hecho" ? `Ejecución ${celda.ejecucion}` : estado === "nada" ? "Sin ejecutar" : "En cola o ejecutando"}</span>
          <span aria-hidden="true">[{prompt}]:</span>
        </span>
        <button
          type="button"
          className="nb-celda__ejecutar"
          onClick={() => onEjecutar(j)}
          disabled={estado === "cola" || estado === "corriendo"}
          aria-label={`Ejecutar celda ${original}`}
          title="Ejecutar celda (Mayús + Enter)"
        >
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M4.5 3v10l8.5-5z" fill="currentColor" />
          </svg>
          <span className="nb-celda__ejecutar-txt">Ejecutar celda</span>
        </button>
      </div>
      <div className="nb-celda__contenido">
        <div className="nb-celda__entrada">
          {celda.parametros && <span className="nb-celda__tag mono">parameters</span>}
          {anotacion !== undefined && <Explicacion fuente={celda.fuente} anotacion={anotacion} />}
          {destino ? (
            <Codigo fuente={celda.fuente} etiqueta={etiqueta} />
          ) : (
            <Diferido alto={altoCodigo(lineas)}>
              <Codigo fuente={celda.fuente} etiqueta={etiqueta} />
            </Diferido>
          )}
          {estado === "corriendo" && <span className="nb-celda__pulso" aria-hidden="true" style={{ transform: `scaleX(${progreso})` }} />}
        </div>
        {mostrarSalidas && <Salidas salidas={celda.salidas} progreso={progreso} verReferencia={verReferencia} animar={animar} />}
      </div>
      <div className="nb-celda__tiempo mono tabular">
        {estado === "hecho" ? (
          <>
            <span className="nb-celda__check" aria-hidden="true">
              ✓
            </span>
            {duracion(real)} real
          </>
        ) : estado === "corriendo" ? (
          <span className="nb-celda__corre">{duracion(real * progreso)}</span>
        ) : estado === "cola" ? (
          <span className="nb-celda__cola">en cola</span>
        ) : null}
      </div>
    </li>
  );
});

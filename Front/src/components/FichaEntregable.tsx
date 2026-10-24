/**
 * Plantilla de capítulo · "Ficha de entregable".
 *   <FichaEntregable paso={pasoPorNumero(5)!} entregable={<NotebookPlayer …/>} visualizaciones={<…/>} />
 * Estructura: encabezado (número fantasma, Módulo → Unidad, IDs, fase F#/CRISP-DM, sprint, HU, estado)
 * → 01 Actividades ✓ → 02 Entregable → 03 Visualizaciones → 04 Lo que aprendimos → 05 Criterio de hecho
 * → navegación anterior/siguiente. Los slots `entregable`, `visualizaciones` y `extra` los llenan los capítulos.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fecha } from "@/charts/formatos";
import {
  ESTADO_ETIQUETA,
  FASES,
  LECCIONES,
  MODULOS,
  PASOS,
  TOTAL_PASOS,
  etiquetaUnidad,
  numeroFantasma,
  type PasoMeta,
} from "@/content/pasos";
import { useGenerado } from "@/data/cargar";
import { alAcercarse, precargarEnReposo } from "@/content/precarga";
import type { DodStatus } from "@/data/tipos";
import { Chip, Revelar, type TonoChip } from "./base";
import { AntesDeEmpezar, Repaso } from "./Pedagogia";
import { RECORRIDOS } from "@/content/recorridos";
import "./ficha.css";

const tonoModulo = (m: PasoMeta["modulo"]): TonoChip => (m === "M1" ? "mod1" : m === "M2" ? "mod2" : "trans");
const tonoEstado = (e: PasoMeta["estado"]): TonoChip => (e === "hecho" ? "ok" : e === "en-curso" ? "warn" : "neutro");

/** Lee el estado de DoD del paso en dod_status.json (forma tolerante). */
function dodDelPaso(dod: DodStatus | null, paso: PasoMeta): { ok: boolean; criterios: { texto: string; ok: boolean }[]; fecha?: string; sha?: string } | null {
  if (!dod) return null;
  const claves = [String(paso.n), `paso_${paso.n}`, `paso${paso.n}`, paso.notebook ?? "__", paso.notebook ? `${paso.notebook}` : "__"];
  const fuentes = [dod.pasos, dod.notebooks].filter(Boolean) as Record<string, unknown>[];
  for (const f of fuentes) {
    const k = Object.keys(f).find((c) => claves.includes(c) || (paso.notebook && c.startsWith(paso.notebook)));
    if (!k) continue;
    const e = f[k] as { ok?: boolean; criterios?: unknown; fecha?: string } & Record<string, unknown>;
    let criterios: { texto: string; ok: boolean }[] = [];
    const c = e.criterios ?? e;
    if (Array.isArray(c)) criterios = c.map((x: { criterio?: string; id?: string; ok: boolean }) => ({ texto: x.criterio ?? x.id ?? "criterio", ok: !!x.ok }));
    else if (c && typeof c === "object")
      criterios = Object.entries(c as Record<string, unknown>)
        .filter(([, v]) => typeof v === "boolean")
        .map(([t, v]) => ({ texto: t.replace(/_/g, " "), ok: v as boolean }));
    const ok = typeof e.ok === "boolean" ? e.ok : criterios.length > 0 && criterios.every((x) => x.ok);
    const d = dod as DodStatus & { verificado?: string; commit?: string };
    return { ok, criterios, fecha: e.fecha ?? d.generado ?? d.verificado, sha: d.git_sha ?? d.commit };
  }
  return null;
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={`ficha-check ${ok ? "ficha-check--ok" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" width="11" height="11">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Bloque({ n, titulo, children, id }: { n: string; titulo: string; children: ReactNode; id?: string }) {
  return (
    <section className="ficha-bloque" id={id} aria-labelledby={`fb-${n}`}>
      <Revelar className="ficha-bloque__cab">
        <span className="ficha-bloque__n">{n}</span>
        <h2 id={`fb-${n}`} className="ficha-bloque__titulo">
          {titulo}
        </h2>
      </Revelar>
      <div className="ficha-bloque__cuerpo">{children}</div>
    </section>
  );
}

export interface FichaProps {
  paso: PasoMeta;
  /** Contenido del entregable (NotebookPlayer, ApiConsole, DataExplorer…). */
  entregable?: ReactNode;
  /** Figuras nativas del capítulo. */
  visualizaciones?: ReactNode;
  /** Contenido adicional entre visualizaciones y aprendizaje. */
  extra?: ReactNode;
  /** Bloque introductorio debajo del encabezado (p. ej. KPIs del capítulo). */
  intro?: ReactNode;
}

export function FichaEntregable({ paso, entregable, visualizaciones, extra, intro }: FichaProps) {
  const mod = MODULOS[paso.modulo];
  const fase = FASES[paso.fase] ?? FASES.T;
  const dodR = useGenerado<DodStatus>("dod_status");
  const dod = dodDelPaso(dodR.datos, paso);
  const hecho = dod ? dod.ok : paso.estado === "hecho";
  const idx = PASOS.findIndex((p) => p.n === paso.n);
  const ant = PASOS[idx - 1];
  const sig = PASOS[idx + 1];
  const rec = RECORRIDOS[paso.n];
  const aprendizaje = rec ? { ...paso.aprendizaje, ...rec.aprendizaje } : paso.aprendizaje;
  // Con el capítulo ya abierto, en tiempo libre se adelantan los vecinos (lo más probable es seguir leyendo).
  useEffect(() => precargarEnReposo(...[sig?.n, ant?.n].filter((n): n is number => n != null && n > 0)), [ant?.n, sig?.n]);

  return (
    <article className="ficha" style={{ "--m-c": mod.color } as React.CSSProperties}>
      {/* ---------- Encabezado ---------- */}
      <header className="ficha-cab">
        <div className="ficha-cab__brillo" aria-hidden="true" />
        <div className="ficha-cab__fantasma" aria-hidden="true">
          {numeroFantasma(paso.n)}
        </div>
        <div className="ficha-cab__contenido">
          <div>
            <nav className="ficha-cab__miga" aria-label="Ubicación en el enunciado">
              <span className="ficha-cab__modulo">
                <span className="ficha-cab__punto" aria-hidden="true" />
                {paso.modulo === "T" ? mod.corto : `Módulo ${paso.modulo.slice(1)} · ${mod.corto}`}
              </span>
              <span className="ficha-cab__flecha" aria-hidden="true">
                →
              </span>
              <span>{paso.unidades.map((u) => (u.unidad ? `Unidad ${u.unidad}: ${u.nombre}` : u.nombre)).join(" · ")}</span>
            </nav>
          </div>
          <div>
            <p className="ficha-cab__contador">
              Capítulo {numeroFantasma(paso.n)} <span>/ {numeroFantasma(TOTAL_PASOS - 1)}</span>
            </p>
            <h1 className="ficha-cab__titulo">{paso.titulo}</h1>
          </div>
          <div>
            <p className="ficha-cab__pregunta">{paso.pregunta}</p>
            <p className="ficha-cab__resumen">{paso.resumen}</p>
          </div>
          <div>
            <dl className="ficha-meta">
              <div>
                <dt>IDs del enunciado</dt>
                <dd className="fila">
                  {paso.ids.map((id) => (
                    <Chip key={id} mono s tono={tonoModulo(paso.modulo)}>
                      {id}
                    </Chip>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Fase</dt>
                <dd>
                  {paso.fase === "T" ? (
                    <>
                      Transversal
                      <span className="ficha-meta__sub">{paso.crisp}</span>
                    </>
                  ) : (
                    <>
                      <span className="mono">{paso.fase}</span> · {fase.nombre}
                      <span className="ficha-meta__sub">CRISP-DM · {paso.crisp}</span>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>Sprint</dt>
                <dd className="mono">{paso.sprints.join(" · ") || "—"}</dd>
              </div>
              <div>
                <dt>Historias</dt>
                <dd className="fila">
                  {paso.hu.map((h) => (
                    <Link key={h} to={`/trazabilidad#${h}`} className="ficha-meta__hu">
                      {h}
                    </Link>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <Chip tono={tonoEstado(paso.estado)} punto>
                    {ESTADO_ETIQUETA[paso.estado]}
                  </Chip>
                  <span className="ficha-meta__sub">{paso.puntos} puntos · {etiquetaUnidad(paso.unidad)}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {intro && <div className="ficha-intro">{intro}</div>}

      <div className="ficha-cuerpo">
        {/* ---------- 00 Antes de empezar (capa pedagógica) ---------- */}
        {rec && (
          <Bloque n="00" titulo="Antes de empezar" id="antes-de-empezar">
            <AntesDeEmpezar recorrido={rec} />
          </Bloque>
        )}

        {/* ---------- 01 Actividades ---------- */}
        <Bloque n="01" titulo="Actividades">
          <ol className="ficha-actividades">
            {paso.actividades.map((a, i) => (
              <Revelar como="li" key={i} retraso={Math.min(i * 0.04, 0.2)} className="ficha-actividad">
                <Check ok={hecho} />
                <span className="ficha-actividad__texto">{a.texto}</span>
                {a.id && (
                  <Chip mono s tono={tonoModulo(paso.modulo)}>
                    {a.id}
                  </Chip>
                )}
              </Revelar>
            ))}
          </ol>
        </Bloque>

        {/* ---------- 02 Entregable ---------- */}
        <Bloque n="02" titulo="Entregable" id="entregable">
          <div className="ficha-entregable">
            <ul className="ficha-entregable__lista">
              {paso.entregable.map((e, i) => (
                <li key={i}>
                  {e.id && (
                    <Chip mono s tono={tonoModulo(paso.modulo)}>
                      {e.id}
                    </Chip>
                  )}
                  <span>{e.texto}</span>
                </li>
              ))}
            </ul>
            <div className="ficha-entregable__archivos">
              <span className="versalitas">Artefactos</span>
              <ul>
                {paso.artefactos.map((a) => (
                  <li key={a} className="mono">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {entregable && (
            <div className="ficha-slot" id="notebook">
              {entregable}
            </div>
          )}
        </Bloque>

        {/* ---------- 03 Visualizaciones ---------- */}
        {visualizaciones && (
          <Bloque n="03" titulo="Visualizaciones">
            <div className="ficha-slot">{visualizaciones}</div>
          </Bloque>
        )}

        {extra}

        {/* ---------- 04 Lo que aprendimos ---------- */}
        <Bloque n={visualizaciones ? "04" : "03"} titulo="Lo que aprendimos">
          <div className="ficha-aprendizaje">
            <Revelar className="ficha-aprendizaje__col">
              <span className="versalitas">Conceptual</span>
              <p>{aprendizaje.conceptual}</p>
            </Revelar>
            <Revelar className="ficha-aprendizaje__col" retraso={0.06}>
              <span className="versalitas">Práctico</span>
              <p>{aprendizaje.practico}</p>
            </Revelar>
            <Revelar className="ficha-aprendizaje__col ficha-aprendizaje__col--evidencia" retraso={0.12}>
              <span className="versalitas">Evidencia</span>
              <p className="mono">{aprendizaje.evidencia}</p>
            </Revelar>
          </div>
          {paso.lecciones.length > 0 && (
            <div className="ficha-lecciones">
              {paso.lecciones.map((l) => {
                const x = LECCIONES[l];
                return (
                  <Revelar key={l} className="ficha-leccion">
                    <span className="ficha-leccion__id mono">{l}</span>
                    <p className="ficha-leccion__titulo">{x.titulo}</p>
                    <p className="ficha-leccion__antes">
                      <span className="versalitas">En el MVP</span> {x.paso}
                    </p>
                    <p className="ficha-leccion__ahora">
                      <span className="versalitas">Control en v2</span> {x.control}
                    </p>
                  </Revelar>
                );
              })}
            </div>
          )}
          {rec && <Repaso preguntas={rec.repaso} />}
        </Bloque>

        {/* ---------- 05 Criterio de hecho ---------- */}
        <Bloque n={visualizaciones ? "05" : "04"} titulo="Criterio de hecho">
          <div className={`ficha-dod ${hecho ? "ficha-dod--ok" : ""}`}>
            <div className="ficha-dod__sello" aria-hidden="true">
              <Check ok={hecho} />
            </div>
            <div className="pila pila--s">
              <p className="ficha-dod__criterio">{paso.criterio}</p>
              <p className="ficha-dod__estado" aria-live="polite">
                {dod ? (
                  dod.ok ? (
                    <>
                      Verificado el {fecha(dod.fecha)}
                      {dod.sha ? <>, commit <span className="mono">{dod.sha}</span></> : null} · verificar_dod.py
                    </>
                  ) : (
                    <>Con criterios pendientes según verificar_dod.py ({fecha(dod.fecha)})</>
                  )
                ) : dodR.estado === "cargando" ? (
                  "Leyendo el estado de la DoD…"
                ) : (
                  <>Estado según el backlog: {ESTADO_ETIQUETA[paso.estado].toLowerCase()}. La verificación automática se publica en dod_status.json.</>
                )}
              </p>
              {dod && dod.criterios.length > 0 && (
                <ul className="ficha-dod__lista">
                  {dod.criterios.map((c, i) => (
                    <li key={i}>
                      <Check ok={c.ok} /> {c.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Bloque>

        {/* ---------- Navegación ---------- */}
        <nav className="ficha-nav" aria-label="Capítulos vecinos">
          {ant ? (
            <Link to={ant.ruta} className="ficha-nav__enlace" {...alAcercarse(ant.n)}>
              <span className="versalitas">← Anterior · {numeroFantasma(ant.n)}</span>
              <span className="ficha-nav__titulo">{ant.titulo}</span>
            </Link>
          ) : (
            <span />
          )}
          {sig ? (
            <Link to={sig.ruta} className="ficha-nav__enlace ficha-nav__enlace--sig" {...alAcercarse(sig.n)}>
              <span className="versalitas">Siguiente · {numeroFantasma(sig.n)} →</span>
              <span className="ficha-nav__titulo">{sig.titulo}</span>
            </Link>
          ) : (
            <Link to="/simulador" className="ficha-nav__enlace ficha-nav__enlace--sig">
              <span className="versalitas">Para cerrar →</span>
              <span className="ficha-nav__titulo">Probar el modelo en el simulador</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}

export default FichaEntregable;

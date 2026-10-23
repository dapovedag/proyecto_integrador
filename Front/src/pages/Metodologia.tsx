/**
 * /metodologia (paso 0) — Gestión ágil: Scrum organiza el trabajo y CRISP-DM el análisis.
 * Todo sale de gestion.json (generado de backlog.yaml), dod_status.json y docs/gestion (src/content/gestion.ts).
 */
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import gestion from "@/data/generated/gestion.json";
import dodStatus from "@/data/generated/dod_status.json";
import { Evidencia } from "@/charts/Evidencia";
import { Figura } from "@/charts/Figura";
import { fecha, num } from "@/charts/formatos";
import { T, alfa } from "@/charts/tema";
import { Chip, Nota, Revelar } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { Segmentado } from "@/components/Tabs";
import { Composicion, FilaKpis, Intro, Marca, Sub } from "@/capitulos/componentes";
import { ADRS, CRISP, DOD, DOR, RIESGOS } from "@/content/gestion";
import { FASES, LECCIONES, pasoPorNumero } from "@/content/pasos";
import { RESUMEN_TRAZA } from "@/content/trazabilidad";
import type { EstadoHistoria, FiguraSpec, Gestion, Historia } from "@/data/tipos";
import "./metodologia.css";

const G = gestion as unknown as Gestion;
const ESTADOS: EstadoHistoria[] = ["Pendiente", "En progreso", "En revisión", "Hecho"];
const COLOR_ESTADO: Record<EstadoHistoria, string> = { Pendiente: T.text3, "En progreso": T.warn, "En revisión": T.accent2, Hecho: T.ok };
const PUNTOS_TOTAL = G.historias.reduce((a, h) => a + (h.puntos ?? 0), 0);
const faseDeHistoria = (h: Historia) => (h.paso === 12 ? "F5" : pasoPorNumero(h.paso)?.fase ?? "T");
/** Fecha de calendario (AAAA-MM-DD) sin desplazamiento por zona horaria. */
const fechaDia = (iso: string) => fecha(`${iso}T12:00:00`);
const epica = (id: string) => G.epicas.find((e) => e.id === id);

/* ------------------------------------------------------------------ */
/* Tablero Kanban                                                      */
/* ------------------------------------------------------------------ */
function Tablero() {
  const [sprint, setSprint] = useState<string>("todos");
  const sprints = G.sprints.filter((s) => s.historias.length && !s.nombre.includes("MVP"));
  const hs = G.historias.filter((h) => sprint === "todos" || h.sprint === sprint);
  return (
    <div className="kanban">
      <div className="kanban__barra">
        <Segmentado
          etiqueta="Filtrar por sprint"
          opciones={[{ id: "todos", etiqueta: "Todos" }, ...sprints.map((s) => ({ id: s.id, etiqueta: s.id }))]}
          valor={sprint}
          onCambio={setSprint}
        />
        <span className="versalitas texto-3" aria-live="polite">
          {hs.length} historias · {hs.reduce((a, h) => a + (h.puntos ?? 0), 0)} puntos
        </span>
      </div>
      <div className="kanban__columnas">
        {ESTADOS.map((e) => {
          const col = hs.filter((h) => h.estado === e);
          return (
            <section key={e} className="kanban__col" aria-label={`${e}: ${col.length} historias`} style={{ "--e-c": COLOR_ESTADO[e] } as CSSProperties}>
              <header className="kanban__cab">
                <span className="kanban__punto" aria-hidden="true" />
                <span className="kanban__estado">{e}</span>
                <span className="kanban__n mono">
                  {col.length} · {col.reduce((a, h) => a + (h.puntos ?? 0), 0)} pts
                </span>
              </header>
              <ul className="kanban__lista">
                {col.length === 0 && <li className="kanban__vacio">Sin historias en este estado</li>}
                {col.map((h) => (
                  <li key={h.id} className="tarjeta-hu">
                    <div className="tarjeta-hu__cab">
                      <Link to={`/trazabilidad#${h.id}`} className="tarjeta-hu__id mono">
                        {h.id}
                      </Link>
                      <span className="tarjeta-hu__pts mono" title="Puntos de historia">
                        {h.puntos}
                      </span>
                    </div>
                    <p className="tarjeta-hu__quiero">{h.quiero.charAt(0).toUpperCase() + h.quiero.slice(1)}</p>
                    <div className="tarjeta-hu__pie">
                      <span className="tarjeta-hu__epica" title={epica(h.epica)?.nombre}>
                        {h.epica}
                      </span>
                      <span className="mono texto-3">{h.sprint}</span>
                      <span className="tarjeta-hu__ids">
                        {h.ids_enunciado.slice(0, 3).map((i) => (
                          <span key={i} className="mono">
                            {i}
                          </span>
                        ))}
                        {h.ids_enunciado.length > 3 && <span className="mono">+{h.ids_enunciado.length - 3}</span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diagrama CRISP-DM × sprints                                         */
/* ------------------------------------------------------------------ */
function MatrizCrisp() {
  const filas = [...CRISP.map((c) => ({ fase: c.fase, nombre: FASES[c.fase].nombre, crisp: c.crisp.replace("Data Understanding", "Data Und.") })), { fase: "T", nombre: "Transversal", crisp: "Scrum · gestión" }];
  const cuenta = (fase: string, sprint: string) =>
    G.historias.filter((h) => faseDeHistoria(h) === fase && (h.sprint === sprint || h.sprint_mvp === sprint)).length;
  const W = 820;
  const izq = 236;
  const cab = 76;
  const fh = 54;
  const cw = (W - izq - 10) / G.sprints.length;
  const H = cab + filas.length * fh + 34;
  const max = Math.max(1, ...filas.flatMap((f) => G.sprints.map((s) => cuenta(f.fase, s.id))));
  return (
    <div className="diagrama">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="crisp-t crisp-d">
        <title id="crisp-t">Fases CRISP-DM cruzadas con los sprints S1 a S8</title>
        <desc id="crisp-d">
          Cada celda indica si el sprint abordó la fase y cuántas historias del backlog caen en ella. S1 a S4 son el MVP; S5 a S8, la versión 2.
        </desc>
        <rect x={izq} y={10} width={cw * 4} height={H - 20} rx={10} fill={alfa(T.text3, 0.05)} />
        <rect x={izq + cw * 4} y={10} width={cw * 4} height={H - 20} rx={10} fill={alfa(T.accent, 0.06)} />
        <text x={izq + cw * 2} y={30} textAnchor="middle" fontSize={12} fill={T.text3} className="d-mono">
          MVP · S1–S4
        </text>
        <text x={izq + cw * 6} y={30} textAnchor="middle" fontSize={12} fill={T.accent2} className="d-mono">
          v2 · S5–S8
        </text>
        {G.sprints.map((s, j) => (
          <g key={s.id}>
            <text x={izq + cw * j + cw / 2} y={58} textAnchor="middle" fontSize={15} fill={T.text} fontWeight={600} className="d-mono">
              {s.id}
            </text>
          </g>
        ))}
        {filas.map((f, i) => {
          const y = cab + i * fh;
          return (
            <g key={f.fase}>
              <line x1={14} x2={W - 6} y1={y} y2={y} stroke={T.line} />
              <text x={10} y={y + 24} fontSize={16} fill={T.text} fontWeight={600} className="d-mono">
                {f.fase}
              </text>
              <text x={44} y={y + 23} fontSize={14} fill={T.text}>
                {f.nombre}
              </text>
              <text x={44} y={y + 41} fontSize={10.5} fill={T.text3} className="d-mono">
                {f.crisp}
              </text>
              {G.sprints.map((s, j) => {
                const activo = s.fase.includes(f.fase) || (f.fase === "T" && cuenta("T", s.id) > 0);
                const n = cuenta(f.fase, s.id);
                const cx = izq + cw * j + cw / 2;
                const cy = y + fh / 2;
                if (!activo && n === 0) return <circle key={s.id} cx={cx} cy={cy} r={2} fill={T.line2} />;
                const r = 10 + (n / max) * 11;
                return (
                  <g key={s.id}>
                    <circle cx={cx} cy={cy} r={r} fill={activo ? alfa(T.accent, 0.25 + (n / max) * 0.55) : alfa(T.text3, 0.2)} stroke={activo ? T.accent2 : T.line2} />
                    <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={12.5} fill={T.text} fontWeight={600} className="d-mono">
                      {n || "·"}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="diagrama__pie">
        <span className="texto-3" style={{ fontSize: "var(--fs-xs)" }}>
          Círculo = la fase está en el objetivo del sprint · número = historias de esa fase (en S1–S4, por su sprint del MVP)
        </span>
        <Evidencia fuente="gestion.json → sprints[].fase · historias[].paso" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sprints: línea de tiempo y puntos                                   */
/* ------------------------------------------------------------------ */
function LineaSprints() {
  return (
    <ol className="sprints">
      {G.sprints.map((s) => {
        const hs = G.historias.filter((h) => h.sprint === s.id);
        return (
          <Revelar como="li" key={s.id} className={`sprint ${s.nombre.includes("MVP") ? "sprint--mvp" : ""}`}>
            <div className="sprint__cab">
              <span className="sprint__id mono">{s.id}</span>
              <span className="sprint__fechas mono">
                {fechaDia(s.inicio)} → {fechaDia(s.fin)}
                {s.estimado ? " · estimado" : ""}
              </span>
            </div>
            <p className="sprint__nombre">{s.nombre}</p>
            <p className="sprint__obj">{s.objetivo}</p>
            <div className="sprint__pie">
              <span className="fila">
                {s.fase.map((f) => (
                  <Chip key={f} s mono tono="acento">
                    {f}
                  </Chip>
                ))}
              </span>
              <span className="mono texto-2">
                {s.puntos_comprometidos != null ? (
                  <>
                    {s.puntos_hechos ?? 0}/{s.puntos_comprometidos} pts · {hs.length} HU
                  </>
                ) : (
                  "sin registro de puntos"
                )}
              </span>
            </div>
            {s.nota && <p className="sprint__nota">{s.nota}</p>}
          </Revelar>
        );
      })}
    </ol>
  );
}

function specPuntos(): FiguraSpec {
  const sp = G.sprints.filter((s) => s.puntos_comprometidos != null);
  return {
    id: "gestion:puntos_sprint",
    tipo: "barras",
    titulo: "Puntos por sprint según el estado de sus historias",
    ejes: { x: "Sprint", y: "Puntos de historia" },
    datos: {
      categorias: sp.map((s) => s.id),
      series: ESTADOS.map((e) => ({
        nombre: e,
        valores: sp.map((s) => G.historias.filter((h) => h.sprint === s.id && h.estado === e).reduce((a, h) => a + (h.puntos ?? 0), 0)),
      })),
    },
    clave: "Lo comprometido por sprint, partido por estado. Los puntos hechos se cuentan solo cuando la historia queda acreditada.",
    opciones: { apilado: true, formato_y: "num" },
  };
}

/* ------------------------------------------------------------------ */
/* DoD automatizada                                                    */
/* ------------------------------------------------------------------ */
const CRITERIOS_NB = DOD.find((d) => d.id === "notebook")!.criterios.map((c) => c.id);
function TablaDod() {
  const nbs = Object.entries(dodStatus.notebooks as Record<string, Record<string, boolean>>);
  const fallos = nbs.reduce((a, [, c]) => a + CRITERIOS_NB.filter((k) => c[k] === false).length, 0);
  return (
    <div className="cap-tabla" role="region" aria-label="Estado de la DoD automatizada por notebook" tabIndex={0}>
      <div className="cap-tabla__scroll">
        <table className="dod-tabla">
          <caption className="sr-only">Criterios de verificar_dod.py por notebook (✔ cumple, ✘ no cumple)</caption>
          <thead>
            <tr>
              <th scope="col">Notebook</th>
              {CRITERIOS_NB.map((c) => (
                <th key={c} scope="col" title={c}>
                  <span className="dod-tabla__col">{c.replace(/_/g, " ")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nbs.map(([nb, c]) => {
              const id = nb.slice(0, 2);
              const paso = id === "00" ? 11 : Number(id);
              return (
                <tr key={nb}>
                  <th scope="row">
                    <Link to={`/paso/${paso}`} className="mono">
                      nb{id}
                    </Link>{" "}
                    <span className="texto-3" style={{ fontSize: "var(--fs-2xs)" }}>
                      {nb.slice(3, 28).replace(/_/g, " ").replace(".ipynb", "")}
                    </span>
                  </th>
                  {CRITERIOS_NB.map((k) => (
                    <td key={k} className={c[k] ? "dod-ok" : "dod-no"}>
                      <Marca ok={!!c[k]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>
          {fallos} criterio{fallos === 1 ? "" : "s"} sin cumplir · verificado el {fecha(dodStatus.verificado, true)} sobre el commit{" "}
          <span className="mono">{dodStatus.commit}</span>
        </span>
        <span className="mono">verificar_dod.py → dod_status.json</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bloques extra (mismo lenguaje que la ficha)                          */
/* ------------------------------------------------------------------ */
function BloqueExtra({ n, titulo, children }: { n: string; titulo: string; children: ReactNode }) {
  return (
    <section className="ficha-bloque" aria-label={titulo}>
      <Revelar className="ficha-bloque__cab">
        <span className="ficha-bloque__n">{n}</span>
        <h2 className="ficha-bloque__titulo">{titulo}</h2>
      </Revelar>
      <div className="ficha-bloque__cuerpo">{children}</div>
    </section>
  );
}

function Definiciones() {
  const [nivel, setNivel] = useState(DOD[1].id);
  const d = DOD.find((x) => x.id === nivel)!;
  return (
    <div className="definiciones">
      <div className="definiciones__dod">
        <div className="definiciones__cab">
          <span className="versalitas">Definición de hecho · por nivel</span>
          <Segmentado etiqueta="Nivel de la DoD" opciones={DOD.map((x) => ({ id: x.id, etiqueta: x.nivel }))} valor={nivel} onCambio={setNivel} />
        </div>
        <p className="definiciones__resumen">{d.resumen}</p>
        <ul className="criterios" aria-live="polite">
          {d.criterios.map((c) => (
            <li key={c.id}>
              <span className="criterios__id mono">{c.id}</span>
              <span>{c.texto}</span>
              <span className="criterios__prueba mono">{c.prueba}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="definiciones__dor">
        <span className="versalitas">Definición de listo · para entrar al sprint</span>
        <ul className="criterios criterios--dor">
          {DOR.map((c) => (
            <li key={c.id}>
              <span className="criterios__id mono">{c.id}</span>
              <span>{c.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Adrs() {
  return (
    <div className="adrs">
      {ADRS.map((a, i) => (
        <Revelar key={a.id} className="adr" retraso={Math.min(i * 0.04, 0.2)}>
          <div className="adr__cab">
            <span className="adr__id mono">{a.id}</span>
            <Chip s tono="ok" punto>
              {a.estado}
            </Chip>
          </div>
          <p className="adr__titulo">{a.titulo}</p>
          <p className="adr__decision">{a.decision}</p>
          <p className="adr__consecuencia">
            <span className="versalitas">Consecuencia</span> {a.consecuencia}
          </p>
          <p className="adr__hu mono">{a.historias.join(" · ")}</p>
        </Revelar>
      ))}
    </div>
  );
}

function Lecciones() {
  return (
    <ol className="lecciones">
      {Object.entries(LECCIONES).map(([id, l]) => (
        <li key={id} className="leccion">
          <span className="leccion__id mono">{id}</span>
          <div>
            <p className="leccion__titulo">{l.titulo}</p>
            <p className="leccion__antes">{l.paso}</p>
          </div>
          <p className="leccion__control">
            <span className="versalitas">Control automático</span>
            {l.control}
          </p>
        </li>
      ))}
    </ol>
  );
}

const TONO_NIVEL: Record<string, "bad" | "warn" | "neutro"> = { Alta: "bad", Media: "warn", Baja: "neutro" };
function Riesgos() {
  return (
    <div className="cap-tabla" role="region" aria-label="Riesgos principales" tabIndex={0}>
      <div className="cap-tabla__scroll">
        <table className="riesgos-tabla">
          <caption className="sr-only">Registro de riesgos: probabilidad, impacto, mitigación y estado</caption>
          <thead>
            <tr>
              <th scope="col">Riesgo</th>
              <th scope="col">Prob.</th>
              <th scope="col">Impacto</th>
              <th scope="col">Mitigación</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {RIESGOS.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <span className="mono texto-3">{r.id}</span> {r.riesgo}
                </th>
                <td>
                  <Chip s tono={TONO_NIVEL[r.prob]}>{r.prob}</Chip>
                </td>
                <td>
                  <Chip s tono={TONO_NIVEL[r.impacto]}>{r.impacto}</Chip>
                </td>
                <td className="texto-2">{r.mitigacion}</td>
                <td>
                  <Chip s tono={r.estado === "Mitigando" ? "acento" : "neutro"} punto>
                    {r.estado}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>{RIESGOS.length} riesgos de impacto alto o que afectan al producto · se revisan en cada planificación</span>
        <span className="mono">docs/gestion/riesgos.md</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function Metodologia() {
  const paso = pasoPorNumero(0)!;
  const puntos = useMemo(() => specPuntos(), []);
  const rs = G.resumen_estados;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Scrum organiza el trabajo; CRISP-DM, el análisis. <em>Nada se marca a mano:</em>{" "}
              <span className="texto-2">el estado sale de un backlog único y de scripts que verifican.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Historias" valor={G.historias.length} formato="num" color="var(--accent)" nota={`${G.epicas.length} épicas · ${PUNTOS_TOTAL} puntos`} compacto />
              <Kpi etiqueta="En progreso" valor={rs["En progreso"].historias} formato="num" color="var(--warn)" nota={`${rs["En progreso"].puntos} puntos`} compacto />
              <Kpi etiqueta="Hechas y acreditadas" valor={RESUMEN_TRAZA.historiasAcreditadas} formato="num" color="var(--ok)" nota="Estado Hecho + evidencia + DoD" compacto />
              <Kpi etiqueta="Decisiones (ADR)" valor={ADRS.length} formato="num" color="var(--mod2)" nota="Todas aceptadas" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <div className="pila pila--l">
          <div>
            <div className="cap-entregable__cab">
              <span className="versalitas">Tablero del backlog · backlog.yaml → gestion.json</span>
              <span className="cap-entregable__sub">Columnas por estado real; cada tarjeta enlaza a su fila de trazabilidad</span>
            </div>
            <Tablero />
          </div>
          <Nota rotulo="Regla" tono="acento">
            Una historia solo cuenta como hecha si está en <strong>Hecho</strong>, todas sus rutas de evidencia existen y sus notebooks pasan la DoD. Hoy{" "}
            {RESUMEN_TRAZA.historiasAcreditadas} de {G.historias.length} cumplen las tres condiciones; por eso la trazabilidad muestra{" "}
            <Link to="/trazabilidad">
              {RESUMEN_TRAZA.acreditadas}/{RESUMEN_TRAZA.filas}
            </Link>
            .
          </Nota>
        </div>
      }
      visualizaciones={
        <>
          <Sub
            kicker="Scrum × CRISP-DM"
            titulo={
              <>
                Ocho sprints recorren cinco fases: <span className="texto-2">el MVP las tocó todas, la v2 las rehace con evidencia.</span>
              </>
            }
          >
            <MatrizCrisp />
          </Sub>

          <Sub
            kicker="Sprints · objetivo y compromiso"
            titulo={
              <>
                Cada sprint con su objetivo, <span className="texto-2">sus fechas y sus puntos.</span>
              </>
            }
            intro="S1–S4 compartieron una ventana sin registro de puntos por sprint; S5–S8 tienen compromiso explícito y fechas estimadas."
          >
            <Composicion
              principal={<LineaSprints />}
              lateral={
                <>
                  <Figura spec={puntos} />
                  <Nota rotulo="Burndown">
                    La DoD de sprint (S3) exige puntos restantes por día con datos reales. <span className="mono">backlog.yaml → burndown</span> aún no
                    tiene registros diarios, así que no se dibuja una curva inventada: se muestra lo comprometido por estado.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Sub
            kicker="DoD automatizada · verificar_dod.py"
            titulo={
              <>
                Nueve criterios por notebook, <span className="texto-2">comprobados por script, no por opinión.</span>
              </>
            }
          >
            <TablaDod />
          </Sub>
        </>
      }
      extra={
        <>
          <BloqueExtra n="03·a" titulo="DoD y DoR">
            <Definiciones />
          </BloqueExtra>
          <BloqueExtra n="03·b" titulo="Decisiones de arquitectura">
            <Adrs />
          </BloqueExtra>
          <BloqueExtra n="03·c" titulo="Lecciones y riesgos">
            <Lecciones />
            <div style={{ marginTop: "var(--space-6)" }}>
              <Riesgos />
            </div>
            <p className="texto-3" style={{ marginTop: "var(--space-4)", fontSize: "var(--fs-xs)" }}>
              Backlog <span className="mono">{G.fuente.backlog}</span> · SHA-256 <span className="mono">{G.fuente.backlog_sha256.slice(0, 16)}…</span> ·{" "}
              {num(G.trazabilidad.ids_cubiertos)} de {num(G.trazabilidad.ids_total)} IDs del enunciado con al menos una historia
            </p>
          </BloqueExtra>
        </>
      }
    />
  );
}

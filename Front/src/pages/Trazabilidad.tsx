/**
 * /trazabilidad — Matriz ID del enunciado → HU → paso → evidencia → estado, calculada por
 * Back/scripts/generar_evidencia.py (gestion.json). Filtros por módulo, fase y estado; agrupación por bloque.
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import gestion from "@/data/generated/gestion.json";
import { Chip, Revelar, type TonoChip } from "@/components/base";
import { Segmentado } from "@/components/Tabs";
import { BLOQUES, MATRIZ, RESUMEN_TRAZA, type EstadoFila, type FilaMatriz } from "@/content/trazabilidad";
import { pasoPorNumero, numeroFantasma } from "@/content/pasos";
import type { Gestion } from "@/data/tipos";
import { Marca } from "@/capitulos/componentes";
import "./trazabilidad.css";

const G = gestion as unknown as Gestion;
const TONO: Record<EstadoFila, TonoChip> = { Acreditado: "ok", "En progreso": "warn", Pendiente: "neutro" };
const TONO_HU: Record<string, TonoChip> = { Hecho: "ok", "En progreso": "warn", "En revisión": "acento", Pendiente: "neutro" };
const R = RESUMEN_TRAZA;

type FiltroMod = "todos" | "General" | "M1" | "M2";
type FiltroEst = "todos" | EstadoFila;

/** Ruta de evidencia → capítulo (notebooks NN_*.ipynb y artefactos con capítulo conocido). */
function capituloDeRuta(ruta: string): number | null {
  const m = /notebooks\/(\d{2})_/.exec(ruta);
  if (m) return m[1] === "00" ? 11 : Number(m[1]);
  if (/resultados_clasicos/.test(ruta)) return 5;
  if (/resultados_dl|red_neuronal/.test(ruta)) return 6;
  if (/resultados_nlp|nlp/.test(ruta)) return 7;
  if (/model_card|modelo_final|train\.py/.test(ruta)) return 8;
  if (/spark/.test(ruta)) return 9;
  if (/Back\/api|Dockerfile|docker-compose\.yml|test_api/.test(ruta)) return 10;
  if (/docs\/gestion/.test(ruta)) return 0;
  return null;
}
const rutaCapitulo = (n: number) => (n === 0 ? "/metodologia" : `/paso/${n}`);

function Contador() {
  const pctAcred = R.filas ? R.acreditadas / R.filas : 0;
  const seg = [
    { e: "Acreditado", v: R.acreditadas, c: "var(--ok)" },
    { e: "En progreso", v: R.enProgreso, c: "var(--warn)" },
    { e: "Pendiente", v: R.pendientes, c: "var(--text-3)" },
  ];
  return (
    <div className="traza-hero">
      <Revelar className="traza-hero__cifra">
        <span className="versalitas">Checklist del enunciado · calculado</span>
        <p className="traza-hero__numero display" aria-label={`${R.acreditadas} de ${R.filas} ítems acreditados`}>
          <span>{R.acreditadas}</span>
          <span className="traza-hero__total">/ {R.filas}</span>
        </p>
        <p className="traza-hero__rotulo">ítems acreditados</p>
        <div className="traza-hero__barra" role="img" aria-label={seg.map((s) => `${s.e} ${s.v}`).join(", ")}>
          {seg.map((s) =>
            s.v ? <span key={s.e} style={{ flexGrow: s.v, background: s.c } as CSSProperties} title={`${s.e}: ${s.v}`} /> : null,
          )}
        </div>
        <ul className="traza-hero__leyenda">
          {seg.map((s) => (
            <li key={s.e}>
              <i style={{ background: s.c }} aria-hidden="true" />
              {s.e} <span className="mono">{s.v}</span>
            </li>
          ))}
        </ul>
        <span className="sr-only">{Math.round(pctAcred * 100)} % acreditado</span>
      </Revelar>
      <Revelar retraso={0.08} className="traza-hero__regla">
        <p className="traza-hero__lead">
          El número no se escribe: lo calcula <span className="mono">generar_evidencia.py</span> desde el backlog. Hoy es {R.acreditadas} porque ninguna historia
          está todavía en <strong>Hecho</strong>; subirá solo cuando cada una se cierre con su evidencia.
        </p>
        <ol className="traza-regla">
          <li>
            <span className="mono">01</span>
            <span>
              Todas las HU que cubren el ítem están en <strong>Hecho</strong>.
            </span>
          </li>
          <li>
            <span className="mono">02</span>
            <span>Todas sus rutas de evidencia existen en el repositorio.</span>
          </li>
          <li>
            <span className="mono">03</span>
            <span>
              Los notebooks citados cumplen los 9 criterios de <span className="mono">verificar_dod.py</span>.
            </span>
          </li>
        </ol>
        <dl className="traza-datos">
          <div>
            <dt>IDs con historia</dt>
            <dd className="mono">
              {R.idsCubiertos}/{R.idsTotal}
            </dd>
          </div>
          <div>
            <dt>Historias acreditadas</dt>
            <dd className="mono">
              {R.historiasAcreditadas}/{R.historias}
            </dd>
          </div>
          <div>
            <dt>Evidencias que existen</dt>
            <dd className="mono">
              {R.evidenciaExiste}/{R.evidenciaTotal}
            </dd>
          </div>
        </dl>
      </Revelar>
    </div>
  );
}

function FilaTraza({ f }: { f: FilaMatriz }) {
  const [abierta, setAbierta] = useState(false);
  const ok = f.evidencia.filter((e) => e.existe).length;
  return (
    <tr id={`id-${f.id.replace(/[^\w.-]/g, "_")}`} className={`traza-fila traza-fila--${f.estado === "Acreditado" ? "ok" : f.estado === "En progreso" ? "curso" : "pend"}`}>
      <th scope="row">
        <span className="traza-id mono">{f.id}</span>
      </th>
      <td className="traza-item">
        {f.item}
        <span className="traza-fases mono">{f.fases.join(" · ") || "—"}</span>
      </td>
      <td>
        <span className="traza-hus">
          {f.historias.map((h) => (
            <a key={h.id} href={`#${h.id}`} className="traza-hu mono" title={`${h.id} · ${h.estado}`}>
              <i style={{ background: h.estado === "En progreso" ? "var(--warn)" : h.estado === "Hecho" ? "var(--ok)" : "var(--text-3)" }} aria-hidden="true" />
              {h.id}
            </a>
          ))}
        </span>
      </td>
      <td>
        <span className="traza-pasos">
          {f.pasos.map((n) => (
            <Link key={n} to={rutaCapitulo(n)} className="traza-paso mono" title={pasoPorNumero(n)?.titulo}>
              {numeroFantasma(n)}
            </Link>
          ))}
        </span>
      </td>
      <td>
        <button type="button" className="traza-ev" aria-expanded={abierta} onClick={() => setAbierta((a) => !a)}>
          <span className="mono">
            {ok}/{f.evidencia.length}
          </span>{" "}
          {abierta ? "ocultar" : "ver"}
        </button>
        {abierta && (
          <ul className="traza-ev__lista">
            {f.evidencia.map((e) => {
              const cap = capituloDeRuta(e.ruta);
              return (
                <li key={e.ruta}>
                  <Marca ok={e.existe} etiqueta={e.existe ? "existe" : "no existe"} />
                  {cap != null ? (
                    <Link to={rutaCapitulo(cap)} className="mono">
                      {e.ruta}
                    </Link>
                  ) : (
                    <span className="mono">{e.ruta}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </td>
      <td>
        <Chip s tono={TONO[f.estado]} punto>
          {f.estado}
        </Chip>
      </td>
    </tr>
  );
}

function Historias() {
  return (
    <div className="cap-tabla" role="region" aria-label="Historias de usuario" tabIndex={0}>
      <div className="cap-tabla__scroll">
        <table className="traza-tabla traza-tabla--hu">
          <caption className="sr-only">Historias de usuario con su paso, sprint, puntos, IDs del enunciado y estado</caption>
          <thead>
            <tr>
              <th scope="col">HU</th>
              <th scope="col">Historia</th>
              <th scope="col">Paso</th>
              <th scope="col">Sprint</th>
              <th scope="col">Pts</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {G.historias.map((h) => {
              const paso = h.paso === 12 ? 11 : h.paso;
              return (
                <tr key={h.id} id={h.id}>
                  <th scope="row" className="mono">
                    {h.id}
                  </th>
                  <td className="traza-item">
                    {h.historia}
                    <span className="traza-fases mono">{h.ids_enunciado.join(" · ")}</span>
                  </td>
                  <td>
                    <Link to={rutaCapitulo(paso)} className="traza-paso mono">
                      {numeroFantasma(paso)}
                    </Link>
                  </td>
                  <td className="mono texto-2">{h.sprint}</td>
                  <td className="mono texto-2">{h.puntos}</td>
                  <td>
                    <Chip s tono={TONO_HU[h.estado]} punto>
                      {h.estado}
                    </Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Trazabilidad() {
  const [mod, setMod] = useState<FiltroMod>("todos");
  const [fase, setFase] = useState<string>("todas");
  const [est, setEst] = useState<FiltroEst>("todos");
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("traza-destacada");
      const t = setTimeout(() => el.classList.remove("traza-destacada"), 2400);
      return () => clearTimeout(t);
    }
  }, [hash]);

  const filas = useMemo(
    () =>
      MATRIZ.filter(
        (f) => (mod === "todos" || f.modulo === mod) && (fase === "todas" || f.fases.includes(fase)) && (est === "todos" || f.estado === est),
      ),
    [mod, fase, est],
  );
  const fases = ["F1", "F2", "F3", "F4", "F5", "T"];

  return (
    <div className="traza contenedor">
      <header className="traza-cab">
        <Revelar>
          <span className="versalitas traza-cab__kicker">Trazabilidad · enunciado → historia → capítulo → evidencia</span>
          <h1 className="traza-cab__titulo">
            Cada requisito, <span className="texto-2">con su prueba o sin ella.</span>
          </h1>
        </Revelar>
        <Contador />
      </header>

      <section className="traza-matriz" aria-labelledby="traza-matriz-t">
        <div className="traza-matriz__cab">
          <h2 id="traza-matriz-t" className="traza-h2">
            Matriz del enunciado
          </h2>
          <div className="traza-filtros" role="group" aria-label="Filtros de la matriz">
            <Segmentado
              etiqueta="Módulo"
              opciones={[
                { id: "todos", etiqueta: "Todo" },
                { id: "General", etiqueta: "General" },
                { id: "M1", etiqueta: "M1" },
                { id: "M2", etiqueta: "M2" },
              ]}
              valor={mod}
              onCambio={setMod}
            />
            <Segmentado
              etiqueta="Fase"
              opciones={[{ id: "todas", etiqueta: "Fases" }, ...fases.map((f) => ({ id: f, etiqueta: f }))]}
              valor={fase}
              onCambio={setFase}
            />
            <Segmentado
              etiqueta="Estado"
              opciones={[
                { id: "todos", etiqueta: "Estados" },
                { id: "Acreditado", etiqueta: "Acreditado" },
                { id: "En progreso", etiqueta: "En progreso" },
                { id: "Pendiente", etiqueta: "Pendiente" },
              ]}
              valor={est}
              onCambio={setEst}
            />
          </div>
          <p className="traza-matriz__conteo" aria-live="polite">
            {filas.length} de {MATRIZ.length} ítems
          </p>
        </div>

        <div className="cap-tabla">
          <div className="cap-tabla__scroll">
            <table className="traza-tabla">
              <caption className="sr-only">Matriz de trazabilidad del enunciado agrupada por bloque</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Ítem del enunciado</th>
                  <th scope="col">Historias</th>
                  <th scope="col">Capítulo</th>
                  <th scope="col">Evidencia</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              {BLOQUES.map((b) => {
                const fb = filas.filter((f) => f.bloque === b.id);
                if (!fb.length) return null;
                return (
                  <tbody key={b.id}>
                    <tr className="cap-tabla__grupo">
                      <th colSpan={6} scope="colgroup">
                        <span className={`traza-bloque traza-bloque--${b.modulo}`}>{b.id}</span> {b.nombre} ·{" "}
                        <span className="mono">
                          {fb.filter((f) => f.acreditada).length}/{fb.length}
                        </span>
                      </th>
                    </tr>
                    {fb.map((f) => (
                      <FilaTraza key={f.id} f={f} />
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
          {filas.length === 0 && <p className="traza-vacio">Ningún ítem cumple esos filtros.</p>}
          <div className="cap-tabla__pie">
            <span>
              Fuente única <span className="mono">{G.fuente.backlog}</span> · SHA-256 <span className="mono">{G.fuente.backlog_sha256.slice(0, 12)}…</span>
            </span>
            <span className="mono">generar_evidencia.py → gestion.json</span>
          </div>
        </div>
      </section>

      <section className="traza-matriz" aria-labelledby="traza-hu-t">
        <div className="traza-matriz__cab">
          <h2 id="traza-hu-t" className="traza-h2">
            Historias de usuario
          </h2>
          <p className="traza-matriz__conteo">
            {G.historias.length} historias · {G.epicas.length} épicas · los enlaces de cada capítulo llegan aquí
          </p>
        </div>
        <Historias />
      </section>
    </div>
  );
}

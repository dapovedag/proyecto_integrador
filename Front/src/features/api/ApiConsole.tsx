/**
 * ApiConsole — consola tipo Swagger + terminal que reproduce la API real.
 * - Endpoints desde `api_capturas.openapi` (método, ruta, resumen).
 * - Por endpoint: capturas reales (petición, estado, latencia real, X-Request-ID, respuesta) con
 *   "▶ Reproducir llamada" (teclea el curl y responde tras la latencia real).
 * - "Probar" (/predict, /predict/text): el motor exacto responde con la misma forma JSON; validación idéntica
 *   a Pydantic (rangos, enums, extra="forbid") con el 422 de FastAPI.
 * - Pestaña Docker: transcripción real (docker_api.json) reproducida como terminal.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import demos from "@/data/generated/clientes_demo.json";
import docker from "@/data/generated/docker_api.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, fecha } from "@/charts/formatos";
import { Segmentado } from "@/components/Tabs";
import type { CapturaApi } from "@/data/tipos";
import { Copiar } from "../comun/Copiar";
import { JsonResaltado } from "../comun/JsonResaltado";
import { ControlesReproduccion, Terminal, useReloj, type EventoTerminal } from "../comun/Terminal";
import { CAPTURAS, TEXTO_ESTADO, latenciaReal, nuevoRequestId, responderTexto } from "./motorApi";
import "../comun/terminal.css";
import "./api.css";

const HOST = "http://127.0.0.1:8000";

interface Endpoint {
  metodo: "GET" | "POST";
  ruta: string;
  resumen: string;
  descripcion: string;
  capturas: CapturaApi[];
}

function endpoints(): Endpoint[] {
  const paths = (CAPTURAS.openapi as { paths?: Record<string, Record<string, { summary?: string; description?: string }>> }).paths ?? {};
  const out: Endpoint[] = [];
  for (const [ruta, ops] of Object.entries(paths)) {
    for (const [m, op] of Object.entries(ops)) {
      const metodo = m.toUpperCase() as "GET" | "POST";
      out.push({
        metodo,
        ruta,
        resumen: op.summary ?? ruta,
        descripcion: op.description ?? "",
        capturas: CAPTURAS.llamadas.filter((c) => c.ruta === ruta && c.metodo === metodo),
      });
    }
  }
  return out;
}

const NOMBRE_CAPTURA: Record<string, string> = {
  health: "Estado del servicio",
  model_info: "Model card",
  predict_bajo: "Cliente de riesgo bajo",
  predict_medio: "Cliente de riesgo medio",
  predict_alto: "Cliente de riesgo alto",
  predict_422: "Datos inválidos (422)",
  predict_text: "Texto de la solicitud",
  predict_batch: "Lote de clientes",
};

export function curlDe(metodo: string, ruta: string, conCuerpo: boolean): string {
  return metodo === "GET"
    ? `curl -s ${HOST}${ruta}`
    : `curl -s -X POST ${HOST}${ruta} -H "Content-Type: application/json" ${conCuerpo ? "-d @peticion.json" : ""}`.trim();
}

function Estado({ estado }: { estado: number }) {
  const tono = estado < 300 ? "ok" : estado < 500 ? "warn" : "bad";
  return (
    <span className={`api-estado api-estado--${tono} mono`}>
      <i aria-hidden="true" />
      {estado} {TEXTO_ESTADO[estado] ?? ""}
    </span>
  );
}

function Metodo({ m }: { m: string }) {
  return <span className={`api-metodo api-metodo--${m.toLowerCase()} mono`}>{m}</span>;
}

/* ------------------------------------------------------------------ */
export function ApiConsole() {
  const eps = useMemo(endpoints, []);
  const [vista, setVista] = useState<"endpoints" | "docker">("endpoints");
  const [sel, setSel] = useState(() => Math.max(0, eps.findIndex((e) => e.ruta === "/predict")));
  const ep = eps[sel];
  const info = (CAPTURAS.openapi as { info?: { title?: string; version?: string; description?: string } }).info ?? {};

  return (
    <div className="apic" data-testid="api-console">
      <header className="apic__cab">
        <div className="apic__titulo">
          <span className="apic__logo" aria-hidden="true">
            {"{ }"}
          </span>
          <div>
            <p className="apic__nombre">
              {info.title ?? "API"} <span className="apic__version mono">v{info.version}</span> <span className="apic__oas mono">OAS {String((CAPTURAS.openapi as { openapi?: string }).openapi ?? "3.1").replace(/\.0$/, "")}</span>
            </p>
            <p className="apic__desc">{info.description}</p>
          </div>
        </div>
        <div className="apic__meta mono">
          <span>
            <i className="apic__vivo" aria-hidden="true" />
            {HOST}
          </span>
          <span className="tk-dim">capturado {fecha(CAPTURAS.capturado, true)}</span>
        </div>
        <Segmentado
          etiqueta="Vista de la consola"
          valor={vista}
          onCambio={setVista}
          opciones={[
            { id: "endpoints", etiqueta: `Endpoints · ${eps.length}` },
            { id: "docker", etiqueta: "Docker" },
          ]}
        />
      </header>

      {vista === "docker" ? (
        <DockerVista />
      ) : (
        <div className="apic__cuerpo">
          <nav className="apic__lista" aria-label="Endpoints de la API">
            <ul>
              {eps.map((e, i) => (
                <li key={`${e.metodo}${e.ruta}`}>
                  <button type="button" className={`apic__ep ${i === sel ? "activo" : ""}`} aria-current={i === sel ? "true" : undefined} onClick={() => setSel(i)}>
                    <Metodo m={e.metodo} />
                    <span className="apic__ep-ruta mono">{e.ruta}</span>
                    <span className="apic__ep-res">{e.resumen}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Evidencia fuente="api_capturas.json · openapi" compacta />
          </nav>
          {ep && <DetalleEndpoint key={`${ep.metodo}${ep.ruta}`} ep={ep} />}
        </div>
      )}
    </div>
  );
}
export default ApiConsole;

/* ------------------------------------------------------------------ */
function DetalleEndpoint({ ep }: { ep: Endpoint }) {
  const probable = ep.ruta === "/predict" || ep.ruta === "/predict/text";
  const [modo, setModo] = useState<"capturas" | "probar">("capturas");
  const [cap, setCap] = useState(0);
  const c = ep.capturas[cap];
  return (
    <section className="apic__detalle" aria-label={`${ep.metodo} ${ep.ruta}`}>
      <div className="apic__det-cab">
        <div className="apic__det-ruta">
          <Metodo m={ep.metodo} />
          <h3 className="mono">{ep.ruta}</h3>
        </div>
        <p className="apic__det-desc">{ep.descripcion}</p>
        {probable && (
          <Segmentado
            etiqueta="Modo"
            valor={modo}
            onCambio={setModo}
            opciones={[
              { id: "capturas", etiqueta: `Capturas reales · ${ep.capturas.length}` },
              { id: "probar", etiqueta: "Probar" },
            ]}
          />
        )}
      </div>
      {modo === "probar" && probable ? (
        <Probar ep={ep} />
      ) : (
        <>
          {ep.capturas.length > 1 && (
            <div className="apic__caps" role="radiogroup" aria-label="Captura real">
              {ep.capturas.map((x, i) => (
                <button key={x.nombre} type="button" role="radio" aria-checked={i === cap} className={`apic__cap ${i === cap ? "activa" : ""}`} onClick={() => setCap(i)}>
                  <span className={`apic__cap-punto apic__cap-punto--${x.estado < 300 ? "ok" : "warn"}`} aria-hidden="true" />
                  {NOMBRE_CAPTURA[x.nombre] ?? x.nombre}
                  <span className="mono tk-dim">{x.estado}</span>
                </button>
              ))}
            </div>
          )}
          {c ? <Llamada key={c.nombre} c={c} /> : <p className="texto-3">Sin capturas para este endpoint.</p>}
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/** Reproducción de una captura real: curl tecleado → espera la latencia real → respuesta. */
function Llamada({ c }: { c: CapturaApi }) {
  const conCuerpo = c.peticion != null;
  const cmd = curlDe(c.metodo, c.ruta, conCuerpo);
  const tecleo = Math.min(1400, 18 * cmd.length);
  const lat = c.latencia_ms;
  const eventos = useMemo<EventoTerminal[]>(() => {
    const t1 = tecleo + 220;
    return [
      { t: 0, tipo: "comando", texto: cmd, tecleo },
      { t: t1, tipo: "nota", texto: `… esperando respuesta`, clase: "api-espera" },
      {
        t: t1 + lat,
        tipo: "salida",
        texto: "",
        render: () => (
          <span>
            <span className={c.estado < 300 ? "tk-ok" : "tk-warn"}>
              HTTP/1.1 {c.estado} {TEXTO_ESTADO[c.estado]}
            </span>
            <span className="tk-dim"> · </span>
            <span className="tk-num">{dec(lat, 1)} ms</span>
          </span>
        ),
      },
      { t: t1 + lat + 60, tipo: "salida", texto: `x-request-id: ${c.request_id}`, render: (s) => <span className="tk-clave">{s}</span> },
      { t: t1 + lat + 120, tipo: "salida", texto: "content-type: application/json", render: (s) => <span className="tk-clave">{s}</span> },
      { t: t1 + lat + 260, tipo: "salida", texto: "", render: () => <JsonResaltado valor={c.respuesta} className="api-json-term" /> },
    ];
  }, [c, cmd, tecleo, lat]);
  const total = eventos[eventos.length - 1].t + 200;
  const r = useReloj(total);
  const respondida = r.reloj >= eventos[2].t;

  return (
    <div className="apic__llamada">
      <div className="apic__panel">
        <div className="apic__panel-cab">
          <span className="versalitas">Petición</span>
          {conCuerpo && <Copiar texto={JSON.stringify(c.peticion, null, 2)} etiqueta="Copiar JSON" />}
        </div>
        <pre className="apic__curl mono">{cmd}</pre>
        {conCuerpo ? <JsonResaltado valor={c.peticion} className="apic__json" /> : <p className="apic__sin">Sin cuerpo · {c.metodo}</p>}
      </div>
      <div className="apic__panel apic__panel--term">
        <Terminal
          titulo={`${c.metodo} ${c.ruta}`}
          etiqueta={`Reproducción de la llamada ${c.nombre}`}
          eventos={eventos}
          reloj={r.reloj}
          alto={420}
          barra={<ControlesReproduccion {...r} etiquetaPlay="Reproducir llamada" />}
          pie={
            <div className="apic__resumen mono" aria-live="polite">
              {respondida ? (
                <>
                  <Estado estado={c.estado} />
                  <span>
                    <span className="tk-dim">latencia real</span> {dec(lat, 1)} ms
                  </span>
                  <span>
                    <span className="tk-dim">X-Request-ID</span> {c.request_id}
                  </span>
                </>
              ) : (
                <span className="tk-dim">{r.fase === "inicio" ? "▶ Reproducir llamada envía la petición capturada" : "Enviando…"}</span>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const extra = { ...demos.medio, ingreso_extra: 500000 };
const invalido = (CAPTURAS.llamadas.find((x) => x.nombre === "predict_422")?.peticion ?? { ...demos.medio, edad: 999, proposito: "Viajes" }) as object;

const PRESETS: Record<string, { id: string; etiqueta: string; cuerpo: unknown }[]> = {
  "/predict": [
    { id: "bajo", etiqueta: "Cliente bajo", cuerpo: demos.bajo },
    { id: "medio", etiqueta: "Cliente medio", cuerpo: demos.medio },
    { id: "alto", etiqueta: "Cliente alto", cuerpo: demos.alto },
    { id: "422", etiqueta: "edad = 999 · Viajes", cuerpo: invalido },
    { id: "extra", etiqueta: "Campo extra", cuerpo: extra },
  ],
  "/predict/text": [
    { id: "bajo", etiqueta: "Texto bajo", cuerpo: { texto: demos.bajo.texto_solicitud } },
    { id: "medio", etiqueta: "Texto medio", cuerpo: { texto: demos.medio.texto_solicitud } },
    { id: "alto", etiqueta: "Texto alto", cuerpo: { texto: demos.alto.texto_solicitud } },
    { id: "vacio", etiqueta: "Texto vacío", cuerpo: { texto: "" } },
  ],
};

interface Resultado {
  estado: number;
  cuerpo: unknown;
  latencia: number;
  rid: string;
}

function Probar({ ep }: { ep: Endpoint }) {
  const presets = PRESETS[ep.ruta] ?? [];
  const [preset, setPreset] = useState(presets[1]?.id ?? presets[0]?.id);
  const [texto, setTexto] = useState(() => JSON.stringify((presets[1] ?? presets[0])?.cuerpo ?? {}, null, 2));
  const [res, setRes] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const valido = useMemo(() => {
    try {
      JSON.parse(texto);
      return true;
    } catch {
      return false;
    }
  }, [texto]);

  useEffect(() => {
    if (!enviando) return;
    const r = responderTexto("POST", ep.ruta, texto);
    const lat = latenciaReal(ep.ruta, r.estado);
    const t = setTimeout(() => {
      setRes({ estado: r.estado, cuerpo: r.cuerpo, latencia: lat, rid: nuevoRequestId() });
      setEnviando(false);
    }, lat);
    return () => clearTimeout(t);
  }, [enviando, ep.ruta, texto]);

  const lineas = texto.split("\n").length;
  return (
    <div className="apic__probar">
      <div className="apic__panel">
        <div className="apic__panel-cab">
          <span className="versalitas">Cuerpo de la petición</span>
          <span className={`apic__valido mono ${valido ? "ok" : "mal"}`}>{valido ? "JSON válido" : "JSON inválido"}</span>
        </div>
        <div className="apic__presets" role="group" aria-label="Ejemplos">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`apic__preset ${preset === p.id ? "activo" : ""}`}
              aria-pressed={preset === p.id}
              onClick={() => {
                setPreset(p.id);
                setTexto(JSON.stringify(p.cuerpo, null, 2));
                setRes(null);
              }}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor={`cuerpo-${ep.ruta}`}>
          Cuerpo JSON para {ep.ruta}
        </label>
        <textarea
          id={`cuerpo-${ep.ruta}`}
          className="apic__editor mono"
          spellCheck={false}
          value={texto}
          rows={Math.min(22, Math.max(6, lineas))}
          onChange={(e) => {
            setTexto(e.target.value);
            setPreset("");
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") setEnviando(true);
          }}
        />
        <div className="apic__enviar">
          <pre className="apic__curl mono">{curlDe("POST", ep.ruta, true)}</pre>
          <button type="button" className="nbp__boton nbp__boton--primario apic__btn-enviar" onClick={() => setEnviando(true)} disabled={enviando} data-testid="api-enviar">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M2 8h10M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
      <div className="apic__panel apic__respuesta" aria-live="polite" data-testid="api-respuesta">
        <div className="apic__panel-cab">
          <span className="versalitas">Respuesta</span>
          {res && <Copiar texto={JSON.stringify(res.cuerpo, null, 2)} etiqueta="Copiar" />}
        </div>
        {res ? (
          <>
            <div className="apic__resumen mono">
              <Estado estado={res.estado} />
              <span>
                <span className="tk-dim">latencia</span> {dec(res.latencia, 1)} ms
              </span>
              <span>
                <span className="tk-dim">X-Request-ID</span> {res.rid}
              </span>
            </div>
            <JsonResaltado valor={res.cuerpo} className="apic__json apic__json--resp" />
            {res.estado === 200 && ep.ruta === "/predict" && (
              <Link className="apic__enlace" to="/simulador">
                Explorar este cliente en el simulador →
              </Link>
            )}
          </>
        ) : (
          <div className="apic__vacio">
            {enviando ? (
              <span className="apic__cargando mono">Esperando respuesta…</span>
            ) : (
              <>
                <span className="mono">POST {ep.ruta}</span>
                <span>Elija un ejemplo o edite el JSON y pulse Enviar (Ctrl + Enter). Responde el mismo pipeline que sirve la API.</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function DockerVista() {
  const eventos = useMemo<EventoTerminal[]>(() => {
    const ev: EventoTerminal[] = [];
    let t = 0;
    for (const p of docker.pasos) {
      const tecleo = Math.min(1300, 16 * p.comando.length);
      ev.push({ t, tipo: "comando", texto: p.comando, tecleo });
      t += tecleo + 300;
      for (const linea of p.salida) {
        const dur = /DONE (\d+(?:\.\d+)?)s/.exec(linea);
        t += dur ? Math.min(1600, 260 + Math.sqrt(Number(dur[1])) * 55) : 170;
        ev.push({ t, tipo: "salida", texto: linea, render: resaltarDocker });
      }
      t += 500;
    }
    return ev;
  }, []);
  const total = eventos[eventos.length - 1].t + 400;
  const r = useReloj(total);
  return (
    <div className="apic__docker" data-testid="api-docker">
      <Terminal
        titulo="Back/ — docker compose · riesgo-credito-api:2.0.0"
        etiqueta="Transcripción real de docker compose"
        eventos={eventos}
        reloj={r.reloj}
        alto={460}
        barra={<ControlesReproduccion {...r} etiquetaPlay="Reproducir" />}
        pie={
          <div className="apic__docker-pie">
            <span className="mono tk-dim">{docker.fuente}</span>
            <Evidencia fuente={`docker_api.json · ${docker.capturado}`} compacta />
          </div>
        }
      />
    </div>
  );
}

function resaltarDocker(l: string) {
  if (/^\{.*\}$/.test(l.trim())) return <JsonResaltado texto={l} className="api-json-linea" />;
  if (/healthy|Built|Started|DONE/.test(l))
    return (
      <span>
        {l.split(/(healthy|Built|Started|DONE [\d.]+s)/).map((p, i) => (i % 2 ? <span key={i} className="tk-ok">{p}</span> : p))}
      </span>
    );
  if (/->\s*200|200 OK/.test(l))
    return (
      <span>
        {l.split(/(-> 200|200 OK|\d+\.\d+ms|rid=\w+)/).map((p, i) => (i % 2 ? <span key={i} className={p.startsWith("rid") ? "tk-var" : "tk-num"}>{p}</span> : p))}
      </span>
    );
  if (/starting/.test(l)) return <span className="tk-warn">{l}</span>;
  return <span>{l}</span>;
}

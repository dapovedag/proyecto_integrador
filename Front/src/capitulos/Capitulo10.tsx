/** Capítulo 10 · API REST y despliegue (FastAPI + Docker + front estático). */
import api from "@/data/generated/api_capturas.json";
import docker from "@/data/generated/docker_api.json";
import manifest from "@/data/generated/manifest.json";
import { Evidencia } from "@/charts/Evidencia";
import { Figura } from "@/charts/Figura";
import { dec, num } from "@/charts/formatos";
import { T, alfa } from "@/charts/tema";
import { Chip, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import type { FiguraSpec } from "@/data/tipos";
import { ApiConsole } from "@/features/api/ApiConsole";
import { Composicion, Entregable, FilaKpis, Hallazgos, Intro, Sub } from "./componentes";

const LLAMADAS = api.llamadas;
const RUTAS = Object.keys((api.openapi as { paths?: Record<string, unknown> }).paths ?? {});
const imagen = /([\d.]+)\s*MB/.exec(docker.pasos.find((p) => p.comando.startsWith("docker images"))?.salida.join(" ") ?? "")?.[1];
const build = /DONE ([\d.]+)s/.exec(docker.pasos[0].salida.join(" "))?.[1];
const lat = LLAMADAS.filter((l) => l.estado === 200).map((l) => l.latencia_ms).sort((a, b) => a - b);
const mediana = lat.length ? (lat[(lat.length - 1) >> 1] + lat[lat.length >> 1]) / 2 : 0;

/** Figura nativa construida con las latencias reales de las capturas de la API. */
export function specLatencias(): FiguraSpec {
  const orden = [...LLAMADAS].sort((a, b) => b.latencia_ms - a.latencia_ms);
  return {
    id: "api:latencias",
    tipo: "barras_h",
    titulo: "Latencia de cada llamada real a la API",
    ejes: { x: "Milisegundos", y: "Llamada" },
    datos: {
      categorias: orden.map((l) => `${l.metodo} ${l.ruta} · ${l.nombre.replace(/_/g, " ")}${l.estado !== 200 ? ` (${l.estado})` : ""}`),
      series: [{ nombre: "Latencia (ms)", valores: orden.map((l) => l.latencia_ms) }],
    },
    lectura: "Predecir cuesta cientos de milisegundos en el primer uso; /health y la validación 422 responden en menos de 10 ms.",
    opciones: { formato_x: "num" },
  };
}

const DESC: Record<string, string> = {
  "/health": "Estado, versión del modelo y de la API",
  "/model/info": "Model card: umbrales, métricas, equidad",
  "/predict": "p, decisión, banda y factores principales",
  "/predict/batch": "Varias solicitudes en una llamada",
  "/predict/text": "Modelo de texto TF-IDF (no decide)",
};

function Arquitectura() {
  const W = 960;
  const H = 440;
  const caja = (x: number, y: number, w: number, h: number, borde: string, fondo: string = T.panel2) => (
    <rect x={x} y={y} width={w} height={h} rx={12} fill={fondo} stroke={borde} strokeWidth={1} />
  );
  const etq = (x: number, y: number, t: string, o: { s?: number; c?: string; w?: number; mono?: boolean; a?: "start" | "middle" | "end" } = {}) => (
    <text x={x} y={y} fontSize={(o.s ?? 13) * 1.12} fill={o.c ?? T.text} fontWeight={o.w ?? 400} textAnchor={o.a ?? "start"} className={o.mono ? "d-mono" : undefined}>
      {t}
    </text>
  );
  const flecha = (x1: number, y1: number, x2: number, y2: number, c: string = T.text3, dash?: string) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1.5} strokeDasharray={dash} markerEnd="url(#punta)" />
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="arq-t arq-d">
      <title id="arq-t">Arquitectura del despliegue</title>
      <desc id="arq-d">
        train.py produce el modelo que empaqueta la imagen Docker de la API FastAPI; exportar_front.py genera el paquete de corrida que consume el front
        estático, que no se conecta con la API.
      </desc>
      <defs>
        <marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill={T.text3} />
        </marker>
      </defs>

      {/* Columna 1: entrenamiento */}
      {etq(24, 30, "ENTRENAMIENTO", { s: 10, c: T.text3, mono: true })}
      {caja(24, 44, 220, 74, T.line2)}
      {etq(42, 72, "train.py", { w: 600, mono: true })}
      {etq(42, 94, "única fuente del modelo · ADR-001", { s: 11, c: T.text2 })}
      {caja(24, 150, 220, 96, T.line2)}
      {etq(42, 176, "Back/models/", { s: 11, c: T.text3, mono: true })}
      {etq(42, 198, "modelo_final.joblib", { s: 12, mono: true })}
      {etq(42, 218, "model_card.json", { s: 12, mono: true })}
      {etq(42, 236, "texto TF-IDF · SHA-256", { s: 10, c: T.text3 })}
      {flecha(134, 118, 134, 148)}
      {caja(24, 290, 220, 110, T.line2)}
      {etq(42, 316, "exportar_front.py", { w: 600, mono: true })}
      {etq(42, 338, "paquete de corrida", { s: 11, c: T.text2 })}
      {etq(42, 358, `manifest v${manifest.version} · git ${manifest.git_sha.slice(0, 7)}`, { s: 10, c: T.text3, mono: true })}
      {etq(42, 378, "SHA-256 de cada archivo", { s: 10, c: T.text3 })}
      {flecha(134, 246, 134, 288)}

      {/* Columna 2: Docker */}
      {etq(300, 30, "BACK · DOCKER", { s: 10, c: T.text3, mono: true })}
      <rect x={300} y={44} width={330} height={250} rx={16} fill={alfa(T.accent, 0.06)} stroke={alfa(T.accent2, 0.5)} strokeDasharray="5 4" />
      {etq(320, 70, `riesgo-credito-api:2.0.0`, { s: 12, w: 600, mono: true })}
      {etq(320, 90, `python:3.10-slim · ${imagen ?? "—"} MB · usuario no-root`, { s: 10, c: T.text2, mono: true })}
      {caja(320, 108, 290, 56, T.line2, T.panel)}
      {etq(338, 132, "uvicorn :8000 → FastAPI", { s: 12, w: 600 })}
      {etq(338, 152, `${RUTAS.length} endpoints · Pydantic · 422 por campo`, { s: 10, c: T.text2 })}
      {caja(320, 178, 290, 56, T.line2, T.panel)}
      {etq(338, 202, "credit_risk · servicio", { s: 12, w: 600 })}
      {etq(338, 222, "decisión aprobar / revisar / rechazar", { s: 10, c: T.text2 })}
      {etq(320, 262, "healthcheck → healthy · logs con request_id", { s: 10, c: T.text3, mono: true })}
      {flecha(244, 200, 318, 205)}
      {flecha(465, 164, 465, 176)}

      {/* Cliente de la API */}
      {caja(300, 330, 330, 70, T.line2)}
      {etq(320, 358, "Cliente: curl · pytest TestClient · nb00", { s: 12 })}
      {etq(320, 380, "POST /predict con el JSON de la solicitud", { s: 10, c: T.text2, mono: true })}
      {flecha(465, 330, 465, 296)}

      {/* Columna 3: front */}
      {etq(690, 30, "FRONT ESTÁTICO", { s: 10, c: T.text3, mono: true })}
      <rect x={690} y={44} width={246} height={356} rx={16} fill={alfa(T.mod2, 0.06)} stroke={alfa(T.mod2, 0.5)} strokeDasharray="5 4" />
      {etq(708, 70, "Vite + React + TS · dist/", { s: 12, w: 600 })}
      {etq(708, 90, "ADR-004 · cero peticiones externas", { s: 10, c: T.text2 })}
      {caja(708, 108, 210, 74, T.line2, T.panel)}
      {etq(724, 132, "scoring.ts · texto.ts", { s: 12, mono: true })}
      {etq(724, 152, "motor exacto del modelo", { s: 10, c: T.text2 })}
      {etq(724, 170, "paridad golden |Δ| < 1e-6", { s: 10, c: T.text3, mono: true })}
      {caja(708, 196, 210, 74, T.line2, T.panel)}
      {etq(724, 220, "NotebookPlayer · ApiConsole", { s: 12 })}
      {etq(724, 240, "reproducen la corrida real", { s: 10, c: T.text2 })}
      {etq(724, 258, "capturas de esta misma API", { s: 10, c: T.text3 })}
      {caja(708, 284, 210, 56, T.line2, T.panel)}
      {etq(724, 308, "src/data/generated", { s: 11, mono: true })}
      {etq(724, 326, "public/run (notebooks, CSV)", { s: 10, c: T.text2, mono: true })}
      {flecha(244, 345, 706, 312)}

      {/* Sin conexión front ↔ API */}
      <line x1={632} y1={136} x2={706} y2={136} stroke={T.bad} strokeWidth={1.5} strokeDasharray="4 4" />
      <circle cx={669} cy={136} r={9} fill={T.bg} stroke={T.bad} />
      <path d="M664 131l10 10M674 131l-10 10" stroke={T.bad} strokeWidth={1.6} />
      {etq(669, 166, "sin red", { s: 10, c: T.bad, a: "middle", mono: true })}
    </svg>
  );
}

export default function Capitulo10() {
  const paso = pasoPorNumero(10)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Un contrato, una imagen y un front que no depende de ella. <em>La API vive en Docker;</em>{" "}
              <span className="texto-2">el front reproduce sus respuestas reales sin llamarla.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Endpoints" valor={RUTAS.length} formato="num" color="var(--accent)" nota="OpenAPI 3 · /docs" compacto />
              <Kpi etiqueta="Llamadas capturadas" valor={LLAMADAS.length} formato="num" color="var(--mod2)" nota={`${LLAMADAS.filter((l) => l.estado === 422).length} con 422 esperado`} compacto />
              <Kpi etiqueta="Latencia mediana" valor={mediana} formato="dec1" color="var(--ok)" nota="ms · respuestas 200" compacto />
              <Kpi etiqueta="Imagen Docker" valor={Number(imagen ?? 0)} formato="num" color="var(--mod1)" nota={`MB · build ${build ? dec(Number(build), 1) : "—"} s`} compacto />
            </FilaKpis>
          }
        />
      }
      entregable={<Entregable nb={null} rotuloEspecial={`Consola de la API · ${LLAMADAS.length} llamadas reales capturadas el ${api.capturado}`} especial={<ApiConsole />} />}
      visualizaciones={
        <>
          <Sub
            kicker="IA3.5 · arquitectura del despliegue"
            titulo={
              <>
                Dos despliegues que no se tocan: <span className="texto-2">la API en Docker y el front estático.</span>
              </>
            }
            intro="El modelo sale de una sola fuente y viaja por dos caminos: empaquetado en la imagen de la API, y exportado como datos al front, que lo reproduce con un motor exacto en TypeScript."
          >
            <div className="diagrama">
              <Arquitectura />
              <div className="diagrama__pie">
                <Chip tono="acento" punto>
                  Back: FastAPI + Docker
                </Chip>
                <Chip tono="mod2" punto>
                  Front: estático, sin back
                </Chip>
                <Evidencia fuente="docker_api.json · api_capturas.json · ADR-004" />
              </div>
            </div>
          </Sub>

          <Sub
            kicker="IA3.4 · contrato"
            titulo={
              <>
                Cinco rutas, <span className="texto-2">errores 422 marcados por campo.</span>
              </>
            }
          >
            <Composicion
              principal={<Figura spec={specLatencias()} />}
              lateral={
                <>
                  <ul className="endpoints">
                    {RUTAS.map((r) => {
                      const llamada = LLAMADAS.find((l) => l.ruta === r);
                      const m = llamada?.metodo ?? "GET";
                      return (
                        <li key={r}>
                          <span className={`endpoints__m ${m === "POST" ? "endpoints__m--post" : ""}`}>{m}</span>
                          <span>
                            <span className="endpoints__r">{r}</span>
                            <span className="endpoints__d" style={{ display: "block" }}>
                              {DESC[r] ?? ""}
                            </span>
                          </span>
                          <span className="endpoints__d mono">{llamada ? `${num(llamada.latencia_ms, 1)} ms` : ""}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <Nota rotulo="Pruebas" tono="mod2">
                    pytest + TestClient: health, predict válido, predict inválido (422) y batch. El cliente demo bajo da Bajo/aprobar y el alto, Alto/rechazar.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Sub
            kicker="Docker · transcripción real"
            titulo={
              <>
                build → up → healthy → predict → logs, <span className="texto-2">tal como corrió.</span>
              </>
            }
            intro={docker.fuente}
          >
            <ol className="docker" aria-label="Transcripción de la prueba de Docker">
              {docker.pasos.map((p, i) => (
                <li key={i}>
                  <span className="docker__n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="docker__cmd">{p.comando}</div>
                    <div className="docker__out">{p.salida.join("\n")}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: `${imagen ?? "—"} MB`,
                titulo: "Imagen reproducible y no-root.",
                texto: `python:3.10-slim con el lock de la API; el build tardó ${build ? dec(Number(build), 1) : "—"} s y el contenedor quedó healthy antes de recibir peticiones.`,
              },
              {
                cifra: `${num(mediana, 1)} ms`,
                titulo: "Latencia mediana de las respuestas 200.",
                texto: "/health responde en milisegundos; /predict incluye el cálculo de los factores principales de cada decisión.",
              },
              {
                titulo: "La misma API en local y en Docker.",
                texto: "El /predict del contenedor devuelve aprobar con banda Bajo y los umbrales 0,1778 y 0,4667 de la model card.",
              },
              {
                titulo: "El front no la necesita.",
                texto: "La consola reproduce las capturas reales y el simulador usa el motor exacto en TS: con el back apagado, todo sigue funcionando (lección L6).",
              },
            ]}
            pie={<Evidencia fuente="api_capturas.json · docker_api.json" />}
          />
        </>
      }
    />
  );
}

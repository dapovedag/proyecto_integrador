/**
 * Simulador de decisión: el mismo pipeline que sirve la API, en el navegador (motores exactos).
 * Formulario de 19 campos → validación idéntica a la API → p calibrada, decisión, cascada de contribuciones,
 * variables derivadas, análisis del texto, barrido "¿Qué pasa si…?" y la petición/respuesta JSON exacta.
 */
import { createPortal } from "react-dom";
import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import card from "@/data/generated/model_card.json";
import demos from "@/data/generated/clientes_demo.json";
import textoJson from "@/data/generated/texto_export.json";
import { Evidencia } from "@/charts/Evidencia";
import { Figura } from "@/charts/Figura";
import { cop, dec, num, pct } from "@/charts/formatos";
import { Segmentado } from "@/components/Tabs";
import type { FiguraSpec } from "@/data/tipos";
import { detallar, predecir, decidir, bandaDe, type Cliente } from "@/engine/scoring";
import { normalizar, type TextoExport } from "@/engine/texto";
import { Copiar } from "../comun/Copiar";
import { JsonResaltado } from "../comun/JsonResaltado";
import { MODELO, motorDeTexto } from "../api/motorApi";
import { ESQUEMA_CLIENTE, validar } from "../api/validacion";
import { BARRIBLES, CAMPO, etiquetaOpcion } from "./campos";
import { Cascada } from "./Cascada";
import { Formulario, type ClienteForm } from "./Formulario";
import { Medidor } from "./Medidor";
import "../comun/terminal.css";
import "./simulador.css";

type DemoId = "bajo" | "medio" | "alto";
const DEMOS: { id: DemoId; etiqueta: string; esperado: string }[] = [
  { id: "bajo", etiqueta: "Riesgo bajo", esperado: "aprobar" },
  { id: "medio", etiqueta: "Riesgo medio", esperado: "revisar" },
  { id: "alto", etiqueta: "Riesgo alto", esperado: "rechazar" },
];
const ETIQUETA_DECISION: Record<string, string> = { aprobar: "Aprobar", revisar: "Revisar", rechazar: "Rechazar" };
const TEXTO_DECISION: Record<string, string> = {
  aprobar: "Se aprueba automáticamente: el costo esperado de prestar es menor que el de rechazar.",
  revisar: "Pasa a revisión manual: la zona gris donde un analista agrega más valor que la regla.",
  rechazar: "Se rechaza: la pérdida esperada por impago supera el margen del crédito.",
};
const U = MODELO.umbrales;
const TX = textoJson as unknown as TextoExport;
const STOP = new Set(TX.stopwords);
const TOKEN = /(?<![\p{L}\p{N}_])[a-zñ]{2,}(?![\p{L}\p{N}_])/gu;

/** Calcula todo lo que muestra el simulador para un cliente (exportado para pruebas). */
export function evaluar(cliente: ClienteForm) {
  const v = validar<Cliente>(cliente, ESQUEMA_CLIENTE);
  if (!v.ok) return { valido: false as const, detail: v.detail };
  const det = detallar(v.valor, MODELO);
  const resp = predecir(v.valor, MODELO);
  return { valido: true as const, cliente: v.valor, det, resp };
}

export function Simulador() {
  const [cliente, setCliente] = useState<ClienteForm>(() => ({ ...demos.medio }));
  const [demo, setDemo] = useState<DemoId | null>("medio");
  const diferido = useDeferredValue(cliente);
  const r = useMemo(() => evaluar(cliente), [cliente]);
  const onCambio = useCallback((id: string, v: unknown) => {
    setDemo(null);
    setCliente((c) => ({ ...c, [id]: v }));
  }, []);

  // La barra flotante (móvil) se oculta mientras la cifra del resultado está a la vista. Se observa la cifra y no
  // todo el panel: el panel es alto y puede seguir visible en parte aunque la probabilidad ya no se vea.
  const [resVisible, setResVisible] = useState(true);
  useEffect(() => {
    const el = document.querySelector('[data-testid="sim-resultado"]');
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setResVisible(es.some((e) => e.isIntersecting)), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const p = r.valido ? r.det.p : null;
  const decision = r.valido ? r.resp.decision : null;

  return (
    <div className="sim" data-testid="simulador">
      <div className="sim__demos" role="group" aria-label="Clientes de demostración">
        <span className="versalitas">Clientes de demostración</span>
        {DEMOS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`sim-demo sim-demo--${d.esperado} ${demo === d.id ? "activo" : ""}`}
            aria-pressed={demo === d.id}
            onClick={() => {
              setCliente({ ...demos[d.id] });
              setDemo(d.id);
            }}
            data-testid={`demo-${d.id}`}
          >
            <span className="sim-demo__punto" aria-hidden="true" />
            {d.etiqueta}
          </button>
        ))}
      </div>

      <div className="sim__rejilla">
        <div className="sim__col-form">
          <Formulario cliente={cliente} onCambio={onCambio} />
        </div>

        <aside className="sim__col-res" id="resultado" aria-label="Resultado">
          <div className="sim-res">
            <div className="sim-res__cab">
              <span className="versalitas">Probabilidad de impago · modelo v{MODELO.version}</span>
              <span className="sim-res__en-vivo mono">
                <i aria-hidden="true" /> en el navegador
              </span>
            </div>
            <Medidor p={p} aprobar={U.aprobar} rechazar={U.rechazar} decision={decision} />
            <div className="sim-res__cifra" aria-live="polite" aria-atomic="true" data-testid="sim-resultado" data-decision={decision ?? "invalido"}>
              {r.valido ? (
                <>
                  <span className="sim-res__p display tabular">{pct(r.det.p)}</span>
                  <span className={`sim-res__decision sim-res__decision--${r.resp.decision}`}>
                    <i aria-hidden="true" />
                    {ETIQUETA_DECISION[r.resp.decision]}
                  </span>
                  <span className="sim-res__meta">
                    Banda <strong>{r.resp.banda_riesgo}</strong> · {r.resp.etiqueta}
                  </span>
                </>
              ) : (
                <>
                  <span className="sim-res__p sim-res__p--422 display">422</span>
                  <span className="sim-res__decision sim-res__decision--invalido">Solicitud no válida</span>
                  <span className="sim-res__meta">
                    {r.detail.length} {r.detail.length === 1 ? "campo no cumple" : "campos no cumplen"} el contrato de la API
                  </span>
                </>
              )}
            </div>
            {r.valido ? (
              <p className="sim-res__texto">{TEXTO_DECISION[r.resp.decision]}</p>
            ) : (
              <ul className="sim-res__errores">
                {r.detail.map((e, i) => (
                  <li key={i}>
                    <span className="mono">{e.loc.slice(1).join(".")}</span> {e.msg}
                  </li>
                ))}
              </ul>
            )}
            {r.valido && <Derivadas cliente={r.cliente} derivadas={r.det.derivadas} />}
            <Evidencia notebook="08" fuente="modelo_export.json → motor exacto (paridad golden con Python)" compacta />
          </div>
        </aside>
      </div>

      <div className="sim__inferior">
        <section className="sim-panel sim-panel--cascada" aria-labelledby="t-cascada">
          <header className="sim-panel__cab">
            <span className="versalitas">Explicación exacta</span>
            <h3 id="t-cascada">De la base a la decisión</h3>
            <p>
              Cada barra es la contribución exacta de una variable en log-odds frente al cliente promedio. Rojo{" "}
              <span className="mono">+</span> aumenta el riesgo; azul <span className="mono">−</span> lo reduce.
            </p>
          </header>
          {r.valido ? (
            <Cascada
              base={MODELO.explicador.base_logit}
              contribuciones={r.det.contribuciones}
              final={r.det.logit}
              aprobar={U.aprobar_exacto}
              rechazar={U.rechazar_exacto}
              valorDe={(v) => valorLegible(v, r.cliente, r.det.derivadas)}
            />
          ) : (
            <p className="sim-panel__vacio">Corrija los campos marcados para ver la explicación.</p>
          )}
        </section>

        <AnalisisTexto texto={typeof diferido.texto_solicitud === "string" ? diferido.texto_solicitud : ""} />

        <QueSiPasa cliente={r.valido ? r.cliente : null} />

        <PeticionRespuesta cliente={cliente} />
      </div>

      {/* Barra fija en móvil: resultado siempre a la vista mientras se edita */}
      {typeof document !== "undefined" &&
        createPortal(
          <a className={`sim-flotante sim-flotante--${decision ?? "invalido"} ${resVisible ? "sim-flotante--oculta" : ""}`} href="#resultado" aria-hidden="true" tabIndex={-1}>
            <span className="mono tabular">{p == null ? "422" : pct(p)}</span>
            <span>{decision ? ETIQUETA_DECISION[decision] : "No válida"}</span>
          </a>,
          document.body,
        )}
    </div>
  );
}
export default Simulador;

/* ------------------------------------------------------------------ */
function valorLegible(v: string, c: Cliente, d: Record<string, number>): string {
  if (v in d) {
    const x = d[v];
    if (v === "cuota_estimada") return cop(x);
    if (v === "ratio_cuota_ingreso") return pct(x);
    if (v === "ratio_monto_ingreso") return `${dec(x, 1)}×`;
    if (v === "tiene_moras_previas") return x ? "Sí" : "No";
  }
  if (v === "rango_edad") {
    const e = Number(c.edad);
    const { bins, etiquetas } = MODELO.rango_edad;
    const i = bins.findIndex((b, k) => k < etiquetas.length && e > b && e <= bins[k + 1]);
    return i >= 0 ? etiquetas[i] : "—";
  }
  const campo = CAMPO[v];
  const x = c[v];
  if (campo?.opciones) return etiquetaOpcion(v, x);
  if (typeof x === "number" && campo?.formato) return campo.formato(x);
  return x == null ? "Sin dato" : String(x);
}

function Derivadas({ cliente, derivadas }: { cliente: Cliente; derivadas: Record<string, number> }) {
  const cuota = derivadas.cuota_estimada;
  const items = [
    { et: "Cuota estimada", v: Number.isFinite(cuota) ? cop(cuota) : "—", nota: `${num(Number(cliente.plazo_meses))} meses al ${num(Number(cliente.tasa_interes_anual), 1)} % anual` },
    { et: "Cuota / ingreso", v: Number.isFinite(derivadas.ratio_cuota_ingreso) ? pct(derivadas.ratio_cuota_ingreso) : "—", nota: "del ingreso mensual" },
    { et: "Monto / ingreso", v: Number.isFinite(derivadas.ratio_monto_ingreso) ? `${dec(derivadas.ratio_monto_ingreso, 1)}×` : "—", nota: "veces el ingreso mensual" },
  ];
  return (
    <dl className="sim-deriv">
      {items.map((x) => (
        <div key={x.et}>
          <dt className="versalitas">{x.et}</dt>
          <dd className="mono tabular">{x.v}</dd>
          <p>{x.nota}</p>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
interface Token {
  ini: number;
  fin: number;
  c: number;
}

/** Contribución de cada palabra del texto (unigrama + mitad de cada bigrama que la contiene). */
export function contribucionesPorPalabra(texto: string, terminos: { termino: string; contribucion: number }[]): Token[] {
  const nfc = texto.normalize("NFC");
  const norm = normalizar(nfc, TX.texto_faltante);
  if (norm.length !== nfc.length) return [];
  const mapa = new Map(terminos.map((t) => [t.termino, t.contribucion]));
  const toks: { w: string; ini: number; fin: number }[] = [];
  for (const m of norm.matchAll(TOKEN)) if (!STOP.has(m[0])) toks.push({ w: m[0], ini: m.index ?? 0, fin: (m.index ?? 0) + m[0].length });
  // Un término repetido aporta una sola vez (TF sublineal ya lo pondera): se reparte entre sus apariciones.
  const veces = new Map<string, number>();
  const contar = (k: string) => veces.set(k, (veces.get(k) ?? 0) + 1);
  toks.forEach((t, i) => {
    contar(t.w);
    if (i < toks.length - 1) contar(`${t.w} ${toks[i + 1].w}`);
  });
  const parte = (k: string) => (mapa.get(k) ?? 0) / (veces.get(k) ?? 1);
  return toks.map((t, i) => {
    let c = parte(t.w);
    if (i > 0) c += parte(`${toks[i - 1].w} ${t.w}`) / 2;
    if (i < toks.length - 1) c += parte(`${t.w} ${toks[i + 1].w}`) / 2;
    return { ini: t.ini, fin: t.fin, c };
  });
}

function AnalisisTexto({ texto }: { texto: string }) {
  const motor = motorDeTexto();
  const det = useMemo(() => motor.detallar(texto), [motor, texto]);
  const pred = useMemo(() => motor.predecir(texto), [motor, texto]);
  const toks = useMemo(() => contribucionesPorPalabra(texto, det.terminos), [texto, det.terminos]);
  const maxC = Math.max(1e-6, ...toks.map((t) => Math.abs(t.c)));
  const nfc = texto.normalize("NFC");
  const dTexto = decidir(det.p, TX.umbrales);
  const top = det.terminos.slice(0, 6);
  const maxT = Math.max(1e-6, ...top.map((t) => Math.abs(t.contribucion)));

  const partes: JSX.Element[] = [];
  let i = 0;
  toks.forEach((t, k) => {
    if (t.ini > i) partes.push(<Fragment key={`t${k}`}>{nfc.slice(i, t.ini)}</Fragment>);
    const a = Math.abs(t.c) / maxC;
    const pal = nfc.slice(t.ini, t.fin);
    partes.push(
      t.c === 0 ? (
        <Fragment key={`w${k}`}>{pal}</Fragment>
      ) : (
        <mark key={`w${k}`} className={`sim-marca sim-marca--${t.c > 0 ? "sube" : "baja"}`} style={{ "--a": (0.18 + 0.62 * a).toFixed(2) } as CSSProperties} title={`${t.c > 0 ? "+" : "−"}${dec(Math.abs(t.c), 3)}`}>
          {pal}
        </mark>
      ),
    );
    i = t.fin;
  });
  if (i < nfc.length) partes.push(<Fragment key="fin">{nfc.slice(i)}</Fragment>);

  return (
    <section className="sim-panel sim-panel--texto" aria-labelledby="t-texto">
      <header className="sim-panel__cab">
        <span className="versalitas">Modelo de texto · TF-IDF + LR calibrada</span>
        <h3 id="t-texto">Lo que dice el texto</h3>
      </header>
      {texto.trim() ? (
        <>
          <div className="sim-texto__kpis" aria-live="polite">
            <div>
              <span className="versalitas">p por texto</span>
              <strong className="display tabular">{pct(pred.probabilidad_impago_texto)}</strong>
            </div>
            <div>
              <span className="versalitas">Banda</span>
              <strong className={`sim-texto__banda sim-texto__banda--${dTexto}`}>{bandaDe(dTexto)}</strong>
            </div>
            <div>
              <span className="versalitas">Sentimiento</span>
              <strong className={`sim-texto__sent sim-texto__sent--${pred.sentimiento}`}>
                {pred.sentimiento === "positivo" ? "Positivo" : pred.sentimiento === "negativo" ? "Negativo" : "Neutral"}
                <span className="mono tk-dim"> ({det.puntaje_lexico > 0 ? "+" : ""}{det.puntaje_lexico})</span>
              </strong>
            </div>
          </div>
          <blockquote className="sim-texto__cita">{partes}</blockquote>
          {top.length > 0 && (
            <ul className="sim-texto__terminos" aria-label="Términos que más pesan">
              {top.map((t) => (
                <li key={t.termino}>
                  <span className="mono">{t.termino}</span>
                  <span className="sim-texto__barra">
                    <i className={t.contribucion > 0 ? "sube" : "baja"} style={{ width: `${(Math.abs(t.contribucion) / maxT) * 100}%` }} />
                  </span>
                  <span className="mono tabular">
                    {t.contribucion > 0 ? "+" : "−"}
                    {dec(Math.abs(t.contribucion), 3)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="sim-panel__nota">
            Es una señal complementaria (AUC test {dec(card.modelo_texto.metricas.test.roc_auc, 3)}): la decisión la toma el modelo tabular.
          </p>
        </>
      ) : (
        <p className="sim-panel__vacio">Escriba el texto de la solicitud para analizarlo.</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
function QueSiPasa({ cliente }: { cliente: Cliente | null }) {
  const [variable, setVariable] = useState("puntaje_buro");
  const campo = CAMPO[variable];
  const spec = useMemo<FiguraSpec | null>(() => {
    if (!cliente || !campo) return null;
    const min = campo.min ?? 0;
    const max = campo.max ?? 1;
    const n = campo.entero && max - min <= 60 ? max - min + 1 : 61;
    const xs = Array.from({ length: n }, (_, i) => (campo.entero && max - min <= 60 ? min + i : min + ((max - min) * i) / (n - 1)));
    const ys = xs.map((x) => Number(detallar({ ...cliente, [variable]: x }, MODELO).p.toFixed(5)));
    const actual = Number(cliente[variable]);
    const pAct = detallar(cliente, MODELO).p;
    const fx = variable === "ingreso_mensual" || variable === "monto_credito" ? "cop" : variable === "uso_cupo_tarjetas" ? "pct" : "num";
    return {
      tipo: "lineas",
      titulo: `Probabilidad de impago según ${campo.etiqueta.toLowerCase()}`,
      ejes: { x: campo.etiqueta, y: "Probabilidad de impago" },
      datos: {
        series: [{ nombre: "Probabilidad de impago", x: xs.map((x) => Number(x.toFixed(4))), y: ys }],
        bandas: [
          { eje: "y", desde: 0, hasta: U.aprobar, etiqueta: "Aprobar" },
          { eje: "y", desde: U.aprobar, hasta: U.rechazar, etiqueta: "Revisar" },
          { eje: "y", desde: U.rechazar, hasta: 1, etiqueta: "Rechazar" },
        ],
        referencias: Number.isFinite(actual) && actual >= min && actual <= max ? [{ eje: "x", valor: actual, etiqueta: "Actual" }] : [],
        anotaciones: Number.isFinite(actual) && actual >= min && actual <= max ? [{ x: actual, y: pAct, texto: pct(pAct) }] : [],
      },
      opciones: { formato_y: "pct", formato_x: fx, min_y: 0, max_y: 1 },
      clave: "Mueva el resto del perfil en el formulario: la curva se recalcula con el motor exacto.",
    };
  }, [cliente, campo, variable]);

  return (
    <section className="sim-panel sim-panel--quesi" aria-labelledby="t-quesi">
      <header className="sim-panel__cab sim-panel__cab--fila">
        <div>
          <span className="versalitas">Sensibilidad</span>
          <h3 id="t-quesi">¿Qué pasa si…?</h3>
        </div>
        <label className="sim-quesi__sel">
          <span className="sr-only">Variable a barrer</span>
          <span className="sim-select">
            <select value={variable} onChange={(e) => setVariable(e.target.value)}>
              {BARRIBLES.map((b) => (
                <option key={b} value={b}>
                  {CAMPO[b].etiqueta}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </label>
      </header>
      {spec ? <Figura spec={spec} superficie="plana" sinPie alto={300} /> : <p className="sim-panel__vacio">Corrija los campos marcados para barrer una variable.</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
function PeticionRespuesta({ cliente }: { cliente: ClienteForm }) {
  const [vista, setVista] = useState<"peticion" | "respuesta">("respuesta");
  const r = useMemo(() => {
    const v = validar<Cliente>(cliente, ESQUEMA_CLIENTE);
    return v.ok ? { estado: 200, cuerpo: predecir(v.valor, MODELO) } : { estado: 422, cuerpo: { detail: v.detail } };
  }, [cliente]);
  const cuerpoPet = JSON.stringify(cliente, null, 2);
  const cuerpoResp = JSON.stringify(r.cuerpo, null, 2);
  return (
    <section className="sim-panel sim-panel--json" aria-labelledby="t-json">
      <header className="sim-panel__cab sim-panel__cab--fila">
        <div>
          <span className="versalitas">Contrato de la API</span>
          <h3 id="t-json">Petición / Respuesta</h3>
        </div>
        <Segmentado
          etiqueta="Ver"
          valor={vista}
          onCambio={setVista}
          opciones={[
            { id: "peticion", etiqueta: "POST /predict" },
            { id: "respuesta", etiqueta: `Respuesta · ${r.estado}` },
          ]}
        />
      </header>
      <div className="sim-json">
        <div className="sim-json__barra mono">
          <span className={r.estado === 200 ? "tk-ok" : "tk-warn"}>{vista === "peticion" ? "POST /predict · application/json" : `HTTP ${r.estado} ${r.estado === 200 ? "OK" : "Unprocessable Entity"}`}</span>
          <Copiar texto={vista === "peticion" ? cuerpoPet : cuerpoResp} etiqueta="Copiar JSON" />
        </div>
        <JsonResaltado texto={vista === "peticion" ? cuerpoPet : cuerpoResp} className="sim-json__codigo" />
      </div>
    </section>
  );
}

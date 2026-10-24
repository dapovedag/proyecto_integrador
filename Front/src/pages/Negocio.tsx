/**
 * /negocio — Presentación Negocio: el proyecto contado a un comité directivo (CEO de un banco) sin el proceso
 * técnico. Deck de 10 diapositivas a pantalla completa: ←/→, AvPág/RePág, Inicio/Fin, anclas #d1…#d10,
 * pantalla completa e impresión a PDF (una diapositiva por página). Cifras del paquete de corrida (test: clientes
 * que el modelo nunca vio).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import card from "@/data/generated/model_card.json";
import agregados from "@/data/generated/agregados.json";
import { dec, num, pct } from "@/charts/formatos";
import { RESUMEN_TRAZA } from "@/content/trazabilidad";
import "./negocio.css";

const D = card.decision_test;
const C = card.costos;
const U = card.umbrales;
const EQ = card.equidad_test;
const TASA = card.datos.tasa_default_test;

/** Pérdida esperada por solicitud de dos políticas de referencia, con la misma fórmula del modelo
 *  (credit_risk/models.py::costo_esperado): aprobar a todos = impago × LGD; rechazar a todos = buenos × margen. */
export const ESCENARIOS = {
  aprobarTodos: TASA * C.lgd_fn,
  rechazarTodos: (1 - TASA) * C.margen_fp,
  modelo: D.costo_medio,
};
const REDUCCION = 1 - ESCENARIOS.modelo / ESCENARIOS.aprobarTodos;

/** Factores que más pesan (importancia por permutación), en palabras de negocio. */
const FACTORES = [
  { v: "puntaje_buro", nombre: "Puntaje de buró", texto: "El historial crediticio del cliente. Un puntaje más alto reduce el riesgo." },
  { v: "relacion_deuda_ingreso", nombre: "Deuda frente a ingreso", texto: "Qué parte del ingreso ya está comprometida en deudas. Más carga, más riesgo." },
  { v: "uso_cupo_tarjetas", nombre: "Uso del cupo de tarjetas", texto: "Tarjetas cerca del límite indican presión financiera." },
  { v: "moras_ultimos_12m", nombre: "Moras del último año", texto: "Atrasos recientes: la señal más directa de dificultad de pago." },
];
const IMP = Object.fromEntries((card.importancia_permutacion as { variable: string; importancia: number }[]).map((x) => [x.variable, x.importancia]));
const IMP_MAX = Math.max(...FACTORES.map((f) => IMP[f.v] ?? 0));

interface Diapo {
  id: string;
  titulo: string;
  contenido: ReactNode;
  tono?: "portada" | "cierre";
}

const DIAPOS: Diapo[] = [
  {
    id: "portada",
    titulo: "Decidir mejor a quién prestar",
    tono: "portada",
    contenido: (
      <div className="dp-portada">
        <span className="dp-kicker">Presentación para el comité · Proyecto Integrador · Riesgo de crédito</span>
        <h1 className="dp-titulo dp-titulo--xl">Decidir mejor a quién prestar.</h1>
        <p className="dp-bajada">
          Para cada solicitud de crédito, el sistema estima la probabilidad de que el cliente no pague y recomienda <b className="t-ok">aprobar</b>,{" "}
          <b className="t-warn">revisar</b> o <b className="t-bad">rechazar</b>. Con él, la pérdida esperada por solicitud baja de{" "}
          {pct(ESCENARIOS.aprobarTodos)} a {pct(ESCENARIOS.modelo)}.
        </p>
        <div className="dp-cifras">
          <Cifra valor={`−${pct(REDUCCION, 0)}`} texto="de pérdida esperada frente a aprobar a todos" tono="ok" />
          <Cifra valor={pct(D.impago_en_aprobados)} texto={`de impago entre los aprobados (hoy ${pct(TASA)})`} tono="ok" />
          <Cifra valor={pct(D.tasa_aprobacion)} texto="de las solicitudes se aprueban sin intervención manual" />
        </div>
      </div>
    ),
  },
  {
    id: "problema",
    titulo: "El problema",
    contenido: (
      <div className="dp-grid">
        <div className="dp-col">
          <span className="dp-kicker">El problema</span>
          <h2 className="dp-titulo">
            Hoy, <span className="t-bad">uno de cada tres</span> solicitantes no paga.
          </h2>
          <p className="dp-texto">
            En el histórico de {num(agregados.resumen.ids_unicos)} solicitudes, el {pct(agregados.resumen.tasa_impago)} terminó en impago. Cada
            decisión de crédito se toma antes de saber cómo terminará, y equivocarse cuesta en las dos direcciones.
          </p>
          <p className="dp-pregunta">¿Cómo decidir cada solicitud para perder lo menos posible, sin tratar a nadie de forma injusta?</p>
        </div>
        <div className="dp-costos">
          <Costo tono="bad" accion="Aprobar a quien no paga" valor={pct(C.lgd_fn, 0)} texto="de lo prestado se pierde." />
          <Costo tono="warn" accion="Rechazar a quien sí paga" valor={pct(C.margen_fp, 0)} texto="del monto es margen que se deja de ganar." />
          <Costo tono="acento" accion="Revisar a mano" valor={pct(C.revision, 0)} texto={`cuesta el análisis; el equipo alcanza para el ${pct(C.capacidad_revision, 0)} de las solicitudes.`} />
        </div>
      </div>
    ),
  },
  {
    id: "solucion",
    titulo: "La solución",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">La solución</span>
        <h2 className="dp-titulo">Una probabilidad por cliente y una regla clara.</h2>
        <ol className="dp-flujo">
          <li>
            <span className="dp-flujo__n">1</span>
            <strong>Llega la solicitud</strong>
            <span>Datos financieros y demográficos del cliente.</span>
          </li>
          <li>
            <span className="dp-flujo__n">2</span>
            <strong>El modelo estima el riesgo</strong>
            <span>La probabilidad de que no pague, de 0 % a 100 %, honesta: si dice 30 %, de cada 100 clientes así unos 30 no pagan.</span>
          </li>
          <li>
            <span className="dp-flujo__n">3</span>
            <strong>Una regla de costos decide</strong>
            <span>
              <b className="t-ok">Aprobar</b> por debajo de {pct(U.aprobar)} · <b className="t-warn">Revisar</b> en medio · <b className="t-bad">Rechazar</b> por encima de{" "}
              {pct(U.rechazar)}.
            </span>
          </li>
        </ol>
        <p className="dp-texto">
          Los umbrales no son arbitrarios: salen de comparar lo que cuesta cada error. El equipo de análisis deja de revisarlo todo y se concentra en los
          casos dudosos.
        </p>
      </div>
    ),
  },
  {
    id: "resultados",
    titulo: "Resultados",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">Resultados · {num(card.datos.n_test)} clientes que el modelo nunca vio</span>
        <h2 className="dp-titulo">
          El impago entre los aprobados baja de {pct(TASA)} a <span className="t-ok">{pct(D.impago_en_aprobados)}</span>.
        </h2>
        <div className="dp-reparto" role="img" aria-label={`Aprobar ${pct(D.tasa_aprobacion)}, revisar ${pct(D.tasa_revision)}, rechazar ${pct(D.tasa_rechazo)}`}>
          <div className="dp-reparto__seg dp-reparto__seg--ok" style={{ flexBasis: `${D.tasa_aprobacion * 100}%` }}>
            <span>Aprobar</span>
            <b>{pct(D.tasa_aprobacion)}</b>
          </div>
          <div className="dp-reparto__seg dp-reparto__seg--warn" style={{ flexBasis: `${D.tasa_revision * 100}%` }}>
            <span>Revisar</span>
            <b>{pct(D.tasa_revision)}</b>
          </div>
          <div className="dp-reparto__seg dp-reparto__seg--bad" style={{ flexBasis: `${D.tasa_rechazo * 100}%` }}>
            <span>Rechazar</span>
            <b>{pct(D.tasa_rechazo)}</b>
          </div>
        </div>
        <div className="dp-cifras">
          <Cifra valor={pct(D.tasa_aprobacion)} texto={`se aprueba de forma automática, con un impago de solo el ${pct(D.impago_en_aprobados)}`} tono="ok" />
          <Cifra valor={pct(D.tasa_revision)} texto={`va a revisión: dentro de la capacidad del equipo (${pct(C.capacidad_revision, 0)})`} />
          <Cifra valor={pct(D.tasa_rechazo)} texto="se rechaza: el grupo de mayor riesgo" tono="bad" />
        </div>
      </div>
    ),
  },
  {
    id: "dinero",
    titulo: "Lo que vale en dinero",
    contenido: (
      <div className="dp-grid">
        <div className="dp-col">
          <span className="dp-kicker">Lo que vale en dinero</span>
          <h2 className="dp-titulo">
            La pérdida esperada baja a <span className="t-ok">un tercio</span>.
          </h2>
          <p className="dp-texto">
            Por cada $100 solicitados, aprobar a todos deja una pérdida esperada de ${dec(ESCENARIOS.aprobarTodos * 100, 1)}. Con el modelo, de $
            {dec(ESCENARIOS.modelo * 100, 1)}. Rechazar a todos tampoco sirve: pierde ${dec(ESCENARIOS.rechazarTodos * 100, 1)} en clientes buenos y deja
            de prestar.
          </p>
          <p className="dp-nota">Pérdida esperada = pérdida por impago + margen perdido + costo de revisión, medida sobre los clientes de prueba.</p>
        </div>
        <div className="dp-barras" role="img" aria-label="Pérdida esperada por solicitud según la política">
          {[
            { e: "Aprobar a todos", v: ESCENARIOS.aprobarTodos, t: "bad" },
            { e: "Rechazar a todos", v: ESCENARIOS.rechazarTodos, t: "warn" },
            { e: "Con el modelo", v: ESCENARIOS.modelo, t: "ok" },
          ].map((b) => (
            <div key={b.e} className="dp-barra">
              <span className="dp-barra__e">{b.e}</span>
              <span className="dp-barra__pista">
                <span className={`dp-barra__val dp-barra__val--${b.t}`} style={{ width: `${(b.v / ESCENARIOS.aprobarTodos) * 100}%` }} />
              </span>
              <b className="dp-barra__n">{pct(b.v)}</b>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "como-decide",
    titulo: "Cómo decide",
    contenido: (
      <div className="dp-grid">
        <div className="dp-col">
          <span className="dp-kicker">Cómo decide</span>
          <h2 className="dp-titulo">Mira lo mismo que miraría un buen analista.</h2>
          <p className="dp-texto">
            Los cuatro factores que más pesan son señales financieras conocidas por el negocio. Cada decisión se puede explicar cliente por cliente: qué
            factores subieron su riesgo y cuáles lo bajaron.
          </p>
          <Link to="/simulador" className="dp-enlace">
            Probar con un cliente en el simulador →
          </Link>
        </div>
        <ol className="dp-factores">
          {FACTORES.map((f, i) => (
            <li key={f.v}>
              <span className="dp-factores__n">{i + 1}</span>
              <div>
                <strong>{f.nombre}</strong>
                <span>{f.texto}</span>
                <span className="dp-factores__pista" aria-hidden="true">
                  <span style={{ width: `${((IMP[f.v] ?? 0) / IMP_MAX) * 100}%` }} />
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: "justo",
    titulo: "Justo y auditable",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">Justo y auditable</span>
        <h2 className="dp-titulo">Trata igual a hombres y mujeres, y a todas las edades.</h2>
        <div className="dp-cifras">
          <Cifra valor={dec(EQ.sexo.disparate_impact, 2)} texto="relación de aprobación entre sexos (mínimo aceptado: 0,80)" tono="ok" />
          <Cifra valor={dec(EQ.edad.disparate_impact, 2)} texto="relación de aprobación entre grupos de edad (mínimo aceptado: 0,80)" tono="ok" />
          <Cifra valor={`${RESUMEN_TRAZA.acreditadas}/${RESUMEN_TRAZA.filas}`} texto="requisitos del proyecto verificados con evidencia" />
        </div>
        <ul className="dp-lista">
          <li>El sexo del cliente nunca entra al modelo: solo se usa para auditar que no haya trato desigual.</li>
          <li>La regla de los cuatro quintos (0,80) es el estándar internacional para detectar discriminación en decisiones automáticas.</li>
          <li>Cada cifra de esta presentación sale de una ejecución registrada y verificable.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "operar",
    titulo: "Listo para operar",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">Listo para operar</span>
        <h2 className="dp-titulo">Se conecta a los sistemas del banco y se vigila solo.</h2>
        <div className="dp-tarjetas">
          <Tarjeta titulo="Integración">Un servicio (API) que recibe la solicitud y responde la decisión en milisegundos, para el canal digital o la oficina.</Tarjeta>
          <Tarjeta titulo="Instalación">Empaquetado en un contenedor: se instala igual en los servidores del banco o en la nube.</Tarjeta>
          <Tarjeta titulo="Monitoreo mensual">
            Alertas si cambia el perfil de los clientes. Hoy el índice de estabilidad es {dec(card.monitoreo.psi_puntaje_train_test, 3)}: estable.
          </Tarjeta>
          <Tarjeta titulo="Mejora continua">Un modelo candidato compite contra el vigente y solo lo reemplaza si demuestra ser mejor.</Tarjeta>
        </div>
      </div>
    ),
  },
  {
    id: "hoja-de-ruta",
    titulo: "Hoja de ruta",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">Hoja de ruta propuesta</span>
        <h2 className="dp-titulo">Del piloto a la operación en cuatro pasos.</h2>
        <ol className="dp-ruta">
          <li>
            <span className="dp-ruta__t">Meses 1–3</span>
            <strong>Piloto en paralelo</strong>
            <span>El sistema recomienda y el analista decide, sobre la misma cartera. Se comparan ambas decisiones.</span>
          </li>
          <li>
            <span className="dp-ruta__t">Mes 3</span>
            <strong>Medir la cosecha</strong>
            <span>Impago real de los créditos del piloto frente a lo que estimó el modelo.</span>
          </li>
          <li>
            <span className="dp-ruta__t">Mes 4</span>
            <strong>Ajustar a las cifras del banco</strong>
            <span>Costos de impago, margen y revisión con los datos de finanzas; los umbrales se recalculan solos.</span>
          </li>
          <li>
            <span className="dp-ruta__t">Mes 5 en adelante</span>
            <strong>Escalar</strong>
            <span>Aprobación automática en el canal digital, con monitoreo mensual de estabilidad y equidad.</span>
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "decision",
    titulo: "Lo que pedimos al comité",
    tono: "cierre",
    contenido: (
      <div className="dp-col dp-col--ancha">
        <span className="dp-kicker">Decisión</span>
        <h2 className="dp-titulo dp-titulo--xl">Lo que pedimos al comité.</h2>
        <ol className="dp-pedidos">
          <li>Aprobar un piloto en paralelo de tres meses.</li>
          <li>Definir la capacidad del equipo de revisión (hoy supuesta en {pct(C.capacidad_revision, 0)} de las solicitudes).</li>
          <li>Validar con finanzas los costos de impago y margen que usa la regla de decisión.</li>
        </ol>
        <div className="dp-acciones">
          <Link to="/simulador" className="dp-boton dp-boton--primario">
            Pruébelo: evaluar un cliente
          </Link>
          <Link to="/paso/1" className="dp-boton">
            Ver el detalle técnico
          </Link>
        </div>
      </div>
    ),
  },
];

function Cifra({ valor, texto, tono }: { valor: string; texto: string; tono?: "ok" | "bad" }) {
  return (
    <div className={`dp-cifra ${tono ? `dp-cifra--${tono}` : ""}`}>
      <b>{valor}</b>
      <span>{texto}</span>
    </div>
  );
}
function Costo({ accion, valor, texto, tono }: { accion: string; valor: string; texto: string; tono: string }) {
  return (
    <div className={`dp-costo dp-costo--${tono}`}>
      <span className="dp-costo__accion">{accion}</span>
      <b className="dp-costo__valor">{valor}</b>
      <span className="dp-costo__texto">{texto}</span>
    </div>
  );
}
function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="dp-tarjeta">
      <strong>{titulo}</strong>
      <p>{children}</p>
    </div>
  );
}

export default function Negocio() {
  const [actual, setActual] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const total = DIAPOS.length;

  const ir = useCallback(
    (i: number, enfocar = true) => {
      const k = Math.max(0, Math.min(total - 1, i));
      const el = refs.current[k];
      if (!el) return;
      el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      if (enfocar) el.focus({ preventScroll: true });
    },
    [total],
  );

  // Diapositiva visible → indicador y ancla #dN (sin recargar ni añadir historial).
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!vis) return;
        const k = refs.current.indexOf(vis.target as HTMLElement);
        if (k >= 0) {
          setActual(k);
          history.replaceState(history.state, "", `#d${k + 1}`);
        }
      },
      { threshold: [0.5, 0.75] },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Ancla inicial (#d4 abre la cuarta diapositiva).
  useEffect(() => {
    const m = /^#d(\d+)$/.exec(window.location.hash);
    if (m) window.setTimeout(() => ir(Number(m[1]) - 1, false), 60);
  }, [ir]);

  // Teclado: ←/→, ↑/↓, AvPág/RePág, espacio, Inicio/Fin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === " " && t.closest("button, a")) return; // el espacio activa el botón enfocado
      const sig = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key);
      const ant = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
      if (sig || ant || e.key === "Home" || e.key === "End") {
        e.preventDefault();
        ir(e.key === "Home" ? 0 : e.key === "End" ? total - 1 : actual + (sig ? 1 : -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actual, ir, total]);

  const pantallaCompleta = () => {
    const d = document as Document & { fullscreenElement?: Element | null };
    if (d.fullscreenElement) void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="deck">
      <div className="deck__progreso" aria-hidden="true">
        <span style={{ transform: `scaleX(${(actual + 1) / total})` }} />
      </div>
      {DIAPOS.map((d, i) => (
        <section
          key={d.id}
          id={`d${i + 1}`}
          ref={(el) => (refs.current[i] = el)}
          className={`diapo ${d.tono ? `diapo--${d.tono}` : ""}`}
          aria-roledescription="diapositiva"
          aria-label={`${i + 1} de ${total}: ${d.titulo}`}
          tabIndex={-1}
        >
          <div className="diapo__marco">
            {d.contenido}
            <span className="diapo__num mono" aria-hidden="true">
              {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        </section>
      ))}
      <nav className="deck__controles" aria-label="Controles de la presentación">
        <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Diapositiva anterior">
          ←
        </button>
        <span className="deck__indicador mono" aria-live="polite">
          {String(actual + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => ir(actual + 1)} disabled={actual === total - 1} aria-label="Diapositiva siguiente">
          →
        </button>
        <button type="button" className="deck__extra" onClick={pantallaCompleta} aria-label="Pantalla completa" title="Pantalla completa">
          ⛶
        </button>
        <button type="button" className="deck__extra" onClick={() => window.print()} aria-label="Imprimir o guardar como PDF" title="Imprimir / PDF">
          PDF
        </button>
      </nav>
    </div>
  );
}

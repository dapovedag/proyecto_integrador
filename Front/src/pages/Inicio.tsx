/**
 * Portada: hero editorial "¿Pagará?" con la nube PCA real; el problema que se resuelve, qué se hizo en las
 * cinco fases y el checklist del enunciado (calculado); después los KPIs del modelo v2, la política de decisión
 * (regla de Chow) y el mapa del recorrido 2 módulos → 5 unidades → 12 capítulos. Todo con datos del paquete.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import card from "@/data/generated/model_card.json";
import agregados from "@/data/generated/agregados.json";
import gestion from "@/data/generated/gestion.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, num, pct } from "@/charts/formatos";
import { Boton, Chip, Nota, Revelar, Seccion } from "@/components/base";
import { ChecklistEnunciado } from "@/components/ChecklistEnunciado";
import { Kpi } from "@/components/Kpi";
import { NubePca, type ModoNube, type ResumenNube } from "@/components/NubePca";
import { PoliticaDecision } from "@/components/PoliticaDecision";
import { EstadoPunto } from "@/components/RailCapitulos";
import { Segmentado } from "@/components/Tabs";
import { ESTADO_ETIQUETA, GRUPOS_RAIL, MODULOS, PASOS, numeroFantasma, pasoPorNumero } from "@/content/pasos";
import { MODELOS_EVALUADOS, TOTAL_MODELOS } from "@/content/portada";
import { DOD_NOTEBOOKS, RESUMEN_TRAZA } from "@/content/trazabilidad";
import "./inicio.css";

const M = card.metricas_test;
const D = card.decision_test;
const EQ = card.equidad_test;

const MODOS: { id: ModoNube; etiqueta: string }[] = [
  { id: "decision", etiqueta: "Decisión del modelo" },
  { id: "impago", etiqueta: "Impago real" },
  { id: "conjunto", etiqueta: "Train / test" },
];

function Hero() {
  const [modo, setModo] = useState<ModoNube>("decision");
  const [separado, setSeparado] = useState(false);
  const [resumen, setResumen] = useState<ResumenNube | null>(null);
  const onResumen = useCallback((r: ResumenNube) => setResumen(r), []);
  const reducido = useReducedMotion();
  const ent = (d: number) =>
    reducido ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] } };

  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="hero__brillo" aria-hidden="true" />
      <div className="hero__rejilla contenedor contenedor--ancho">
        <div className="hero__texto">
          <motion.p className="hero__kicker" {...ent(0.05)}>
            <span className="hero__kicker-punto" aria-hidden="true" />
            Proyecto integrador · Riesgo de crédito · v{card.version}
          </motion.p>
          <motion.h1 id="hero-titulo" className="hero__titulo" {...ent(0.12)}>
            ¿Pagará?
          </motion.h1>
          <motion.p className="hero__bajada" {...ent(0.22)}>
            {num(agregados.resumen.ids_unicos)} solicitantes de crédito, {card.variables_entrada.length} variables financieras y demográficas, un texto
            libre por solicitud. Un modelo calibrado estima la <em>probabilidad de impago</em> y una política de costos decide{" "}
            <span className="hero__d hero__d--ok">aprobar</span>, <span className="hero__d hero__d--warn">revisar</span> o{" "}
            <span className="hero__d hero__d--bad">rechazar</span>, rindiendo cuentas de a quién afecta.
          </motion.p>
          <motion.div className="hero__cta" {...ent(0.32)}>
            <Boton to="/simulador" variante="primario" tamano="l" flecha>
              Evaluar un cliente
            </Boton>
            <Boton to="/metodologia" tamano="l">
              Cómo se hizo
            </Boton>
          </motion.div>
          <motion.dl className="hero__datos" {...ent(0.42)}>
            <div>
              <dt>Prevalencia de impago</dt>
              <dd>{pct(agregados.resumen.tasa_impago)}</dd>
            </div>
            <div>
              <dt>AUC en test</dt>
              <dd>{dec(M.roc_auc)}</dd>
            </div>
            <div>
              <dt>Train / test</dt>
              <dd>
                {num(card.datos.n_train)} / {num(card.datos.n_test)}
              </dd>
            </div>
            <div>
              <dt>Requisitos cumplidos</dt>
              <dd>
                <a href="#checklist" className="hero__requisitos">
                  {RESUMEN_TRAZA.acreditadas}/{RESUMEN_TRAZA.filas}
                  <span aria-hidden="true">↓</span>
                  <span className="sr-only">: ver el checklist del enunciado</span>
                </a>
              </dd>
            </div>
          </motion.dl>
        </div>

        <motion.div className="hero__nube" {...(reducido ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.4, delay: 0.2 } })}>
          <div className="hero__nube-marco">
            <div className="hero__nube-cab">
              <span className="versalitas">Nube PCA · {resumen ? num(resumen.n) : "12.000"} clientes reales</span>
              <button type="button" className={`hero__separar ${separado ? "activo" : ""}`} aria-pressed={separado} onClick={() => setSeparado((s) => !s)}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  {separado ? (
                    <rect x="2.5" y="3.5" width="11" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  ) : (
                    <path d="M2.5 3.5h3v9h-3zM6.5 3.5h3v9h-3zM10.5 3.5h3v9h-3z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  )}
                </svg>
                {separado ? "Unir" : (
                  <>
                    Separar<span className="hero__separar-extra"> grupos</span>
                  </>
                )}
              </button>
            </div>
            <NubePca modo={modo} separado={separado} alto={0} className="hero__lienzo" onResumen={onResumen} />
            <div className="hero__nube-pie">
              <Segmentado opciones={MODOS} valor={modo} onCambio={setModo} etiqueta="Colorear la nube por" />
              {resumen && (
                <span className="hero__ejes mono">
                  PC1 {pct(resumen.varianza[0])} · PC2 {pct(resumen.varianza[1])} de la varianza
                </span>
              )}
            </div>
          </div>
          <p className="hero__nube-nota">
            Cada punto es un cliente proyectado en sus dos primeras componentes principales. El impago no se separa en dos ejes: por eso
            hace falta un modelo, y por eso existe la banda de <strong>revisión</strong>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const COSTOS_ERROR = [
  {
    k: "bad",
    accion: "Aprobar a quien no paga",
    valor: card.costos.lgd_fn,
    texto: "de lo prestado se pierde: es la pérdida dada el impago (LGD).",
  },
  {
    k: "warn",
    accion: "Rechazar a quien sí paga",
    valor: card.costos.margen_fp,
    texto: "del monto es el margen que se deja de ganar con un buen cliente.",
  },
  {
    k: "rev",
    accion: "Enviar a revisión manual",
    valor: card.costos.revision,
    texto: `cuesta el análisis de un analista, con capacidad para el ${pct(card.costos.capacidad_revision, 0)} de las solicitudes.`,
  },
];

const RETOS = [
  { n: "1", t: "Una probabilidad, no una etiqueta", d: "Calibrada, para que un 30 % estimado signifique 30 de cada 100 clientes en impago." },
  { n: "2", t: "Una regla que decida con costos", d: "Aprobar, revisar o rechazar según lo que cuesta cada error, no con un umbral de 0,5." },
  { n: "3", t: "Rendir cuentas", d: "Sin trato dispar por sexo o edad, y con cada cifra trazable hasta el notebook que la produjo." },
];

function Problema() {
  return (
    <Seccion
      id="problema"
      numero="01"
      kicker="El problema"
      titulo={
        <>
          Prestar es decidir hoy <span className="texto-2">lo que solo se sabrá después.</span>
        </>
      }
      intro={
        <>
          Una institución financiera recibe solicitudes de crédito y debe responder a cada una antes de saber si el cliente pagará. Equivocarse
          en cualquiera de las dos direcciones cuesta dinero, y una regla opaca o injusta cuesta además la confianza del cliente y del regulador.
        </>
      }
    >
      <div className="problema">
        <Revelar className="problema__objetivo">
          <span className="versalitas">Objetivo del proyecto integrador</span>
          <blockquote className="problema__cita">
            «Desarrollar una solución de análisis predictivo que permita <strong>estimar la probabilidad de impago de clientes</strong> en una
            institución financiera, integrando técnicas de análisis exploratorio, programación e inteligencia artificial, a partir de información
            financiera y demográfica».
          </blockquote>
          <div className="problema__dato">
            <span className="problema__dato-v display">{pct(agregados.resumen.tasa_impago)}</span>
            <span className="problema__dato-t">
              de los {num(agregados.resumen.ids_unicos)} solicitantes del histórico no pagó. Sin un modelo, cada aprobación es una apuesta con
              esa probabilidad.
            </span>
          </div>
        </Revelar>
        <div className="problema__errores">
          <span className="versalitas">Lo que cuesta cada decisión</span>
          {COSTOS_ERROR.map((e, i) => (
            <Revelar key={e.k} className={`costo-error costo-error--${e.k}`} retraso={0.06 * (i + 1)}>
              <span className="costo-error__accion">{e.accion}</span>
              <span className="costo-error__valor display">{pct(e.valor, 0)}</span>
              <span className="costo-error__texto">{e.texto}</span>
            </Revelar>
          ))}
        </div>
      </div>
      <Revelar className="retos">
        <span className="versalitas retos__rotulo">Por eso la solución necesita</span>
        <ol className="retos__lista">
          {RETOS.map((r) => (
            <li key={r.n} className="reto">
              <span className="reto__n display" aria-hidden="true">
                {r.n}
              </span>
              <span className="reto__t">{r.t}</span>
              <span className="reto__d">{r.d}</span>
            </li>
          ))}
        </ol>
      </Revelar>
    </Seccion>
  );
}

const colorPaso = (n: number) => MODULOS[pasoPorNumero(n)?.modulo ?? "T"].color;

function Solucion() {
  const R = RESUMEN_TRAZA;
  const fases = [
    {
      id: "F1",
      nombre: "Definir el problema",
      cifra: "3",
      cifraEtq: "costos de error explícitos",
      texto: "Problema de negocio, métricas, costo de cada error y análisis ético de las variables sensibles.",
      ruta: "/paso/1",
      caps: "Cap. 1",
      color: colorPaso(1),
    },
    {
      id: "F2",
      nombre: "Explorar y preparar",
      cifra: num(agregados.resumen.ids_unicos),
      cifraEtq: `clientes únicos de ${num(agregados.resumen.filas)} filas`,
      texto: "Consultas con pandas y DuckDB, limpieza sin fuga de información, dos ratios de capacidad de pago, atípicos tratados y PCA.",
      ruta: "/paso/2",
      caps: "Caps. 2–4",
      color: colorPaso(2),
    },
    {
      id: "F3",
      nombre: "Analizar y modelar",
      cifra: String(TOTAL_MODELOS),
      cifraEtq: "modelos entrenados y comparados",
      texto: `${MODELOS_EVALUADOS.clasicos} clásicos con validación cruzada, ${MODELOS_EVALUADOS.redes} redes en Keras, ${MODELOS_EVALUADOS.nlp} de NLP con BERT y GPT-2 y una regresión logística en Spark MLlib.`,
      ruta: "/paso/5",
      caps: "Caps. 5–7 y 9",
      color: colorPaso(5),
    },
    {
      id: "F4",
      nombre: "Evaluar y optimizar",
      cifra: dec(M.roc_auc),
      cifraEtq: "AUC en test, con calibración",
      texto: `Aprueba el ${pct(D.tasa_aprobacion)} de los clientes con ${pct(D.impago_en_aprobados)} de impago, frente al ${pct(card.datos.tasa_default_test)} sin modelo, y cumple la regla 4/5 de equidad.`,
      ruta: "/paso/8",
      caps: "Cap. 8",
      color: colorPaso(8),
    },
    {
      id: "F5",
      nombre: "Desplegar y comunicar",
      cifra: "API",
      cifraEtq: "REST en Docker, más este sitio",
      texto: "FastAPI en una imagen Docker, notebook integrador, informe ejecutivo y un sitio que reproduce la corrida real.",
      ruta: "/paso/10",
      caps: "Caps. 10–11",
      color: colorPaso(10),
    },
  ];
  const garantias = [
    { v: "< 10⁻⁶", e: "de diferencia entre el simulador y Python, en 303 clientes y 50 textos" },
    { v: `${DOD_NOTEBOOKS.ok}/${DOD_NOTEBOOKS.total}`, e: "notebooks ejecutados que cumplen la DoD, comprobada por script" },
    { v: `${R.acreditadas}/${R.filas}`, e: "ítems del enunciado acreditados con evidencia" },
    { v: "1 vez", e: "se usa el test: la selección se hizo con validación cruzada en train" },
    { v: "SHA-256", e: "sella train, test y cada archivo del paquete de corrida" },
  ];
  return (
    <Seccion
      id="solucion"
      numero="02"
      kicker="Qué hicimos para resolverlo"
      titulo={
        <>
          Del CSV a una decisión servida, <span className="texto-2">en cinco fases.</span>
        </>
      }
      intro={
        <>
          Scrum y CRISP-DM: cada fase es un entregable con su notebook ejecutado, sus visualizaciones y un criterio de hecho que comprueba un
          script. El resultado es un modelo que estima la probabilidad de impago y una política que la convierte en{" "}
          <span className="hero__d hero__d--ok">aprobar</span>, <span className="hero__d hero__d--warn">revisar</span> o{" "}
          <span className="hero__d hero__d--bad">rechazar</span>.
        </>
      }
    >
      <ol className="fases-sol">
        {fases.map((f, i) => (
          <Revelar key={f.id} como="li" className="fase-sol" retraso={Math.min(i * 0.06, 0.24)}>
            <Link to={f.ruta} className="fase-sol__enlace" style={{ "--m-c": f.color } as React.CSSProperties}>
              <span className="fase-sol__cab">
                <span className="fase-sol__id mono">{f.id}</span>
                <span className="fase-sol__nombre">{f.nombre}</span>
              </span>
              <span className="fase-sol__cifra display">{f.cifra}</span>
              <span className="fase-sol__cifra-etq">{f.cifraEtq}</span>
              <span className="fase-sol__texto">{f.texto}</span>
              <span className="fase-sol__ir mono">
                {f.caps}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </Revelar>
        ))}
      </ol>
      <Revelar className="garantias">
        <span className="versalitas garantias__rotulo">Cómo se garantiza</span>
        <ul className="garantias__lista">
          {garantias.map((g) => (
            <li key={g.e} className="garantia">
              <span className="garantia__v display">{g.v}</span>
              <span className="garantia__e">{g.e}</span>
            </li>
          ))}
        </ul>
      </Revelar>
    </Seccion>
  );
}

function Checklist() {
  const R = RESUMEN_TRAZA;
  return (
    <Seccion
      id="checklist"
      numero="03"
      kicker="Lo que pidió el proyecto integrador"
      titulo={
        <>
          {R.acreditadas} de {R.filas} requisitos, <span className="texto-2">cumplidos con evidencia.</span>
        </>
      }
      intro={
        <>
          El enunciado pide un producto final, cinco elementos, cinco fases, cuatro resultados y los entregables de cinco unidades. Un ítem queda
          marcado solo si todas sus historias están en <em>Hecho</em>, su evidencia existe en el repositorio y sus notebooks cumplen la DoD:{" "}
          <strong>el estado se calcula</strong>, ninguna casilla se marca a mano.
        </>
      }
    >
      <ChecklistEnunciado />
    </Seccion>
  );
}

function Cifras() {
  return (
    <Seccion
      id="cifras"
      numero="04"
      kicker="El modelo v2.0.0 en cifras"
      titulo={
        <>
          Discrimina bien, está calibrado y <span className="texto-2">decide con costos.</span>
        </>
      }
      intro={
        <>
          {card.familia} con calibración sigmoide y variante de equidad <span className="mono">«{card.variante_equidad}»</span>, elegida por
          validación cruzada en train y evaluada <strong>una sola vez</strong> en {num(card.datos.n_test)} clientes de prueba.
        </>
      }
    >
      <div className="cifras">
        <Revelar className="cifras__grupo">
          <span className="cifras__rotulo versalitas">Discriminación y calibración</span>
          <div className="cifras__fila">
            <Kpi etiqueta="AUC ROC · test" valor={M.roc_auc} formato="dec3" nota={<>Meta del plan ≥ 0,70 · CV en train {dec(card.seleccion_cv_train["Regresión logística"].roc_auc_cv)}</>} />
            <Kpi etiqueta="KS" valor={M.ks} formato="dec3" nota="Separación máxima entre las distribuciones de pagadores e impagos" />
            <Kpi etiqueta="Brier" valor={M.brier} formato="dec3" nota="Error cuadrático de la probabilidad: menor es mejor" color="var(--pago)" />
            <Kpi etiqueta="PR-AUC" valor={M.pr_auc} formato="dec3" nota={<>Frente a una prevalencia de {pct(card.datos.tasa_default_test)}</>} />
          </div>
        </Revelar>

        <Revelar className="cifras__grupo" retraso={0.08}>
          <span className="cifras__rotulo versalitas">Decisión sobre los {num(card.datos.n_test)} clientes de prueba</span>
          <div className="reparto" role="img" aria-label={`Aprobar ${pct(D.tasa_aprobacion)}, revisar ${pct(D.tasa_revision)}, rechazar ${pct(D.tasa_rechazo)}`}>
            {[
              { k: "ok", e: "Aprobar", v: D.tasa_aprobacion },
              { k: "warn", e: "Revisar", v: D.tasa_revision },
              { k: "bad", e: "Rechazar", v: D.tasa_rechazo },
            ].map((s, i) => (
              <motion.div
                key={s.k}
                className={`reparto__seg reparto__seg--${s.k}`}
                style={{ flexBasis: `${s.v * 100}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="reparto__etq">{s.e}</span>
                <span className="reparto__val">{pct(s.v)}</span>
              </motion.div>
            ))}
          </div>
          <div className="cifras__fila">
            <Kpi etiqueta="Impago entre aprobados" valor={D.impago_en_aprobados} formato="pct" color="var(--ok)" nota={<>Frente al {pct(card.datos.tasa_default_test)} de impago sin modelo</>} />
            <Kpi etiqueta="Costo medio por solicitud" valor={D.costo_medio} formato="pct" color="var(--warn)" nota="Pérdida esperada por unidad de exposición, con la política de Chow" />
            <Kpi etiqueta="Disparate impact · edad" valor={EQ.edad.disparate_impact} formato="dec3" color="var(--mod2)" nota={<>IC 95 % {dec(EQ.edad.di_ic95[0])}–{dec(EQ.edad.di_ic95[1])} · regla 4/5 ≥ 0,8</>} />
            <Kpi etiqueta="Disparate impact · sexo" valor={EQ.sexo.disparate_impact} formato="dec3" color="var(--mod2)" nota={<>«{card.variable_excluida_auditoria}» nunca entra al modelo: solo audita</>} />
          </div>
        </Revelar>
        <div className="cifras__pie">
          <Evidencia fuente="model_card.json → metricas_test · decision_test · equidad_test" notebook="08" />
          <Chip tono={EQ.cumple_todo ? "ok" : "warn"} punto>
            {EQ.cumple_todo ? "Cumple la regla 4/5 en sexo y edad" : "Equidad con excepción razonada"}
          </Chip>
        </div>
      </div>
    </Seccion>
  );
}

function Politica() {
  return (
    <Seccion
      id="politica"
      numero="05"
      kicker="Política de decisión · regla de Chow"
      titulo={
        <>
          Los umbrales salen de lo que <span className="texto-2">cuesta equivocarse.</span>
        </>
      }
      intro={
        <>
          Aprobar a quien no paga cuesta la pérdida dada el impago (LGD {pct(card.costos.lgd_fn, 0)}). Rechazar a quien sí paga cuesta el margen
          perdido ({pct(card.costos.margen_fp, 0)}). Revisar a mano cuesta {pct(card.costos.revision, 0)}. Mueva la aguja.
        </>
      }
    >
      <div className="rejilla">
        <div className="c-8">
          <PoliticaDecision />
        </div>
        <div className="c-4 pila pila--l">
          <Nota rotulo="Por qué tres bandas" tono="acento">
            Con un solo umbral, cada error se paga completo. La banda de revisión compra información donde el modelo duda: entre{" "}
            <strong>{pct(card.umbrales.aprobar)}</strong> y <strong>{pct(card.umbrales.rechazar)}</strong> de probabilidad, revisar es más
            barato que acertar a ciegas.
          </Nota>
          <Nota rotulo="Sensibilidad">
            Los umbrales se recalculan para LGD de 45 % a 75 % y varios márgenes ({card.sensibilidad_umbrales.length} escenarios en la model
            card). Las bandas Bajo, Medio y Alto equivalen a aprobar, revisar y rechazar por construcción.
          </Nota>
          <Evidencia fuente="model_card.json → costos · umbrales" notebook="08" />
        </div>
      </div>
    </Seccion>
  );
}

function Mapa() {
  const tr = gestion.trazabilidad;
  const resumen = [
    { v: 2, e: "módulos" },
    { v: 5, e: "unidades" },
    { v: PASOS.length, e: "capítulos" },
    { v: tr.filas_total, e: "ítems del enunciado" },
  ];
  return (
    <Seccion
      id="recorrido"
      numero="06"
      kicker="El recorrido"
      titulo={
        <>
          Un capítulo por entregable, <span className="texto-2">del problema al despliegue.</span>
        </>
      }
      intro={
        <>
          El enunciado organiza el trabajo en dos módulos y cinco unidades. Cada capítulo acredita sus IDs con evidencia ejecutada; el estado sale
          del backlog, no de una casilla marcada a mano.
        </>
      }
    >
      <Revelar className="mapa__resumen">
        {resumen.map((r, i) => (
          <div key={r.e} className="mapa__resumen-item">
            <span className="mapa__resumen-v display">{r.v}</span>
            <span className="mapa__resumen-e">{r.e}</span>
            {i < resumen.length - 1 && <span className="mapa__resumen-flecha" aria-hidden="true">→</span>}
          </div>
        ))}
      </Revelar>
      <div className="mapa">
        {GRUPOS_RAIL.map((g, gi) => {
          const span = g.pasos.length > 1 ? 3 : 1;
          return (
            <Revelar key={g.clave} className={`racimo racimo--${span}`} retraso={Math.min(gi * 0.05, 0.25)}>
              <div className="racimo__cab" style={{ "--m-c": MODULOS[g.modulo].color } as React.CSSProperties}>
                <span className="racimo__modulo">{g.titulo}</span>
                <span className="racimo__unidad">{g.subtitulo}</span>
              </div>
              <ul className="racimo__pasos">
                {g.pasos.map((p) => (
                  <li key={p.n}>
                    <Link to={p.ruta} className="tarjeta-paso" style={{ "--m-c": MODULOS[p.modulo].color } as React.CSSProperties}>
                      <span className="tarjeta-paso__num" aria-hidden="true">
                        {numeroFantasma(p.n)}
                      </span>
                      <span className="tarjeta-paso__cab">
                        <span className="tarjeta-paso__fase mono">
                          {p.fase === "T" ? "Transversal" : p.fase} · {p.notebook ? `nb${p.notebook}` : p.especial === "ApiConsole" ? "API" : "docs"}
                        </span>
                        <span className="tarjeta-paso__estado">
                          <EstadoPunto estado={p.estado} />
                          {ESTADO_ETIQUETA[p.estado]}
                        </span>
                      </span>
                      <span className="tarjeta-paso__titulo">{p.titulo}</span>
                      <span className="tarjeta-paso__ids">
                        {p.ids.slice(0, 4).map((id) => (
                          <Chip key={id} mono s tono={p.modulo === "M1" ? "mod1" : p.modulo === "M2" ? "mod2" : "trans"}>
                            {id}
                          </Chip>
                        ))}
                        {p.ids.length > 4 && (
                          <Chip mono s>
                            +{p.ids.length - 4}
                          </Chip>
                        )}
                      </span>
                      <span className="tarjeta-paso__ir" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Revelar>
          );
        })}
        <Revelar className="racimo racimo--3 racimo--herramientas" retraso={0.3}>
          <div className="racimo__cab" style={{ "--m-c": "var(--accent-2)" } as React.CSSProperties}>
            <span className="racimo__modulo">Herramientas</span>
            <span className="racimo__unidad">Para comprobarlo usted</span>
          </div>
          <div className="herramientas">
            <Link to="/simulador" className="herramienta">
              <span className="versalitas">Simulador</span>
              <span className="herramienta__titulo">Evalúe un cliente con el modelo servido</span>
              <span className="herramienta__dato mono">{num(card.variables_entrada.length)} variables de entrada · decisión al instante</span>
            </Link>
            <Link to="/trazabilidad" className="herramienta">
              <span className="versalitas">Trazabilidad</span>
              <span className="herramienta__titulo">Cada ID del enunciado y su evidencia</span>
              <span className="herramienta__dato mono">
                {tr.filas_acreditadas}/{tr.filas_total} acreditados · {tr.ids_cubiertos}/{tr.ids_total} IDs cubiertos
              </span>
            </Link>
          </div>
        </Revelar>
      </div>
    </Seccion>
  );
}

function Cierre() {
  return (
    <section className="cierre">
      <div className="contenedor">
        <Revelar className="cierre__caja">
          <div className="cierre__brillo" aria-hidden="true" />
          <span className="versalitas">El mismo modelo que sirve la API, en su navegador</span>
          <h2 className="cierre__titulo">Ahora, decida usted.</h2>
          <p className="cierre__texto">
            El simulador calcula la probabilidad con un port exacto del pipeline servido, verificado contra Python en 303 clientes y 50 textos de
            referencia con diferencias menores a una millonésima.
          </p>
          <div className="fila fila--l">
            <Boton to="/simulador" variante="primario" tamano="l" flecha>
              Abrir el simulador
            </Boton>
            <Boton to="/paso/8" tamano="l">
              Ver la evaluación
            </Boton>
          </div>
        </Revelar>
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <>
      <Hero />
      <Problema />
      <Solucion />
      <Checklist />
      <Cifras />
      <Politica />
      <Mapa />
      <Cierre />
    </>
  );
}

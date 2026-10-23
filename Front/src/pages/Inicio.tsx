/**
 * Portada: hero editorial "¿Pagará?" con la nube PCA real, KPIs del modelo v2, política de decisión
 * (regla de Chow) y mapa del recorrido 2 módulos → 5 unidades → 12 capítulos. Todo con datos del paquete.
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
import { Kpi } from "@/components/Kpi";
import { NubePca, type ModoNube, type ResumenNube } from "@/components/NubePca";
import { PoliticaDecision } from "@/components/PoliticaDecision";
import { EstadoPunto } from "@/components/RailCapitulos";
import { Segmentado } from "@/components/Tabs";
import { ESTADO_ETIQUETA, GRUPOS_RAIL, MODULOS, PASOS, numeroFantasma } from "@/content/pasos";
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
                {separado ? "Unir" : "Separar grupos"}
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

function Cifras() {
  return (
    <Seccion
      id="cifras"
      numero="01"
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
            <Kpi etiqueta="Disparate impact · edad" valor={EQ.edad.disparate_impact} formato="dec3" color="var(--mod2)" nota={<>IC 95 % {dec(EQ.edad.di_ic95[0])}–{dec(EQ.edad.di_ic95[1])} · regla 4/5 ≥ 0,8</>} />
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
      numero="02"
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
            Los umbrales se recalculan para LGD de 45 % a 75 % y varios márgenes ({card.sensibilidad_umbrales.length} escenarios en la model
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
      numero="03"
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
      <Cifras />
      <Politica />
      <Mapa />
      <Cierre />
    </>
  );
}

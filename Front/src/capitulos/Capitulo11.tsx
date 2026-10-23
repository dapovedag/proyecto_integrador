/** Capítulo 11 · Notebook integrador y comunicación de resultados (nb00) · cierre F1 → F5. */
import { Link } from "react-router-dom";
import agregados from "@/data/generated/agregados.json";
import api from "@/data/generated/api_capturas.json";
import card from "@/data/generated/model_card.json";
import clasicos from "@/data/generated/resultados_clasicos.json";
import clientes from "@/data/generated/clientes_demo.json";
import dl from "@/data/generated/resultados_dl.json";
import dod from "@/data/generated/dod_status.json";
import modeloJson from "@/data/generated/modelo_export.json";
import nlp from "@/data/generated/resultados_nlp.json";
import spark from "@/data/generated/resultados_spark.json";
import { Evidencia } from "@/charts/Evidencia";
import { cop, dec, num, pct } from "@/charts/formatos";
import { DECISION } from "@/charts/tema";
import { Boton, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { CRISP } from "@/content/gestion";
import { FASES, numeroFantasma, pasoPorNumero } from "@/content/pasos";
import { predecir, type Cliente, type ModeloExport } from "@/engine/scoring";
import { Cita, Composicion, Entregable, Fig, FilaKpis, Intro, Sub } from "./componentes";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[11];
const F = C.figuras;
const LR = clasicos.modelos.find((m) => m.modelo === "Regresión logística")!;
const MEJOR_RED = [...dl.modelos].sort((a, b) => b.test.roc_auc - a.test.roc_auc)[0];
const EJECUTADO = (dod.notebooks as Record<string, { ejecutado?: boolean }>)["00_proyecto_integrador_final.ipynb"]?.ejecutado ?? false;

const CIFRAS: Record<string, { e: string; v: string }[]> = {
  F1: [
    { e: "Impago", v: pct(agregados.resumen.tasa_impago) },
    { e: "Umbrales", v: `${dec(card.umbrales.aprobar, 3)} · ${dec(card.umbrales.rechazar, 3)}` },
  ],
  F2: [
    { e: "Clientes únicos", v: num(agregados.resumen.ids_unicos) },
    { e: "Train / test", v: `${num(card.datos.n_train)} / ${num(card.datos.n_test)}` },
  ],
  F3: [
    { e: "AUC CV logística", v: dec(LR.roc_auc_cv ?? 0, 3) },
    { e: "ΔAUC del texto", v: `+${dec(nlp.delta_auc.valor, 4)}` },
  ],
  F4: [
    { e: "AUC test servido", v: dec(card.metricas_test.roc_auc, 3) },
    { e: "DI edad", v: dec(card.equidad_test.edad.disparate_impact, 3) },
  ],
  F5: [
    { e: "Endpoints", v: num(Object.keys((api.openapi as { paths?: object }).paths ?? {}).length) },
    { e: "Peticiones externas", v: "0" },
  ],
};

const TEXTO: Record<string, string> = {
  F1: "Clasificación binaria con probabilidad calibrada y tres acciones de costo mínimo; sexo solo audita.",
  F2: "Limpieza sin fuga, 6 variables nuevas, atípicos recortados en train y un ranking de variables que anticipa al modelo.",
  F3: `Clásicos, ${dl.modelos.length} redes, texto con BERT y GPT-2 y Spark: la logística no es superada de forma relevante (mejor red ${dec(MEJOR_RED.test.roc_auc, 3)}, MLlib ${dec(spark.auc_mllib, 3)}).`,
  F4: "Selección por CV, calibración, regla de Chow, variante reweighing con DI ≥ 0,8, SHAP y PSI; test usado una sola vez.",
  F5: "FastAPI en Docker con 5 rutas y un front estático que reproduce la corrida real sin depender del back.",
};

const PERFILES: { id: "bajo" | "medio" | "alto"; nombre: string }[] = [
  { id: "bajo", nombre: "Riesgo bajo" },
  { id: "medio", nombre: "Riesgo medio" },
  { id: "alto", nombre: "Riesgo alto" },
];

function Clientes() {
  const M = modeloJson as unknown as ModeloExport;
  return (
    <div className="clientes">
      {PERFILES.map(({ id, nombre }) => {
        const c = (clientes as Record<string, Cliente>)[id];
        const r = api.llamadas.find((l) => l.nombre === `predict_${id}`)?.respuesta as { probabilidad_impago: number; decision: string; banda_riesgo: string } | undefined;
        const ts = predecir(c, M);
        const p = r?.probabilidad_impago ?? ts.probabilidad_impago;
        const d = r?.decision ?? ts.decision;
        return (
          <article key={id} className="cliente" style={{ "--c": DECISION[d] } as React.CSSProperties}>
            <span className="cliente__perfil">{nombre} · predecir_cliente()</span>
            <span className="cliente__p" aria-label={`Probabilidad de impago ${pct(p)}`}>
              {pct(p)}
            </span>
            <span className="cliente__decision">
              {d.charAt(0).toUpperCase() + d.slice(1)} · banda {r?.banda_riesgo ?? ts.banda_riesgo}
            </span>
            <div className="cliente__barra" aria-hidden="true">
              <span className="cliente__aguja" style={{ left: `${Math.min(99.5, p * 100)}%` }} />
            </div>
            <dl className="cliente__datos">
              <dt>Buró</dt>
              <dd>{num(c.puntaje_buro as number)}</dd>
              <dt>Uso del cupo</dt>
              <dd>{pct(c.uso_cupo_tarjetas as number, 0)}</dd>
              <dt>Deuda / ingreso</dt>
              <dd>{dec(c.relacion_deuda_ingreso as number, 2)}</dd>
              <dt>Ingreso</dt>
              <dd>{cop(c.ingreso_mensual as number)}</dd>
              <dt>API (Docker)</dt>
              <dd className="mono">{r ? dec(r.probabilidad_impago, 4) : "—"}</dd>
              <dt>Motor TS</dt>
              <dd className="mono">{dec(ts.probabilidad_impago, 4)}</dd>
            </dl>
            <p className="cliente__texto">«{String(c.texto_solicitud)}»</p>
          </article>
        );
      })}
    </div>
  );
}

function Recorrido() {
  return (
    <ol className="recorrido">
      {CRISP.map((f) => (
        <li key={f.fase} className="recorrido__fase">
          <span className="recorrido__id" aria-hidden="true">
            {f.fase}
          </span>
          <div>
            <p className="recorrido__nombre">
              <span className="sr-only">{f.fase} · </span>
              {FASES[f.fase].nombre}
              <span className="recorrido__crisp">CRISP-DM · {f.crisp}</span>
            </p>
            <p className="recorrido__texto">{TEXTO[f.fase]}</p>
            <div className="recorrido__enlaces">
              {f.pasos.map((n) => {
                const p = pasoPorNumero(n)!;
                return (
                  <Link key={n} to={p.ruta} className="recorrido__enlace">
                    <span className="mono">{numeroFantasma(n)}</span>
                    {p.tituloCorto}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="recorrido__cifras">
            {CIFRAS[f.fase].map((c) => (
              <div key={c.e} className="kpi kpi--compacto">
                <span className="kpi__etiqueta">{c.e}</span>
                <span className="kpi__valor" style={{ fontSize: "clamp(1.3rem, 1rem + 0.8vw, 1.7rem)" }}>
                  {c.v}
                </span>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Capitulo11() {
  const paso = pasoPorNumero(11)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Un solo notebook recorre F1 → F5 importando el paquete: <em>predice la probabilidad de impago de tres personas</em>{" "}
              <span className="texto-2">y la API responde lo mismo.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Fases recorridas" valor={5} formato="num" color="var(--accent)" nota="F1 → F5 · CRISP-DM" compacto />
              <Kpi etiqueta="Capítulos" valor={12} formato="num" color="var(--mod1)" nota="Paso 0 a 11" compacto />
              <Kpi etiqueta="AUC test" valor={card.metricas_test.roc_auc} formato="dec3" color="var(--mod2)" nota={`Modelo v${card.version}`} compacto />
              <Kpi etiqueta="Clientes demo" valor={3} formato="num" color="var(--ok)" nota="bajo · medio · alto" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="00"
          nota={
            !EJECUTADO ? (
              <Nota rotulo="Estado de la corrida" tono="acento">
                Según <span className="mono">dod_status.json</span>, el integrador aún no tiene su corrida final registrada: se re-ejecuta al cierre del
                sprint, después de los notebooks 01–09. Lo que sigue usa las salidas ya verificadas de cada paso y las respuestas reales de la API.
              </Nota>
            ) : undefined
          }
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="PF1 · demo de predicción"
            titulo={
              <>
                Tres personas, tres decisiones. <span className="texto-2">API en Docker y motor TS coinciden.</span>
              </>
            }
            intro="Las mismas tres solicitudes de clientes_demo.json, enviadas a la API real y calculadas en el navegador con el motor exacto."
          >
            <Clientes />
            <div className="fila" style={{ marginTop: "var(--space-5)", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <Evidencia fuente="api_capturas.json → predict_bajo · predict_medio · predict_alto" />
              <Boton to="/simulador" variante="primario" flecha>
                Probar con otra solicitud
              </Boton>
            </div>
          </Sub>

          <Sub
            kicker="E2 · E4 · el recorrido completo"
            titulo={
              <>
                Del problema al despliegue, <span className="texto-2">cada fase con su cifra y su capítulo.</span>
              </>
            }
          >
            <Recorrido />
          </Sub>

          <Sub
            kicker="Comunicación de resultados"
            titulo={
              <>
                El resumen que cabe en una figura <span className="texto-2">y lo que no se debe olvidar.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.comparacion} nb={C.nb} lectura="Dieciséis modelos en el mismo test: el servido está en el grupo de cabeza, con la ventaja de ser calibrado e interpretable." alto={520} />}
              lateral={
                <>
                  <Cita fuente="model_card.json → limitaciones">{card.limitaciones[card.limitaciones.length - 1]}</Cita>
                  {card.limitaciones.slice(0, 2).map((l, i) => (
                    <Nota key={i} rotulo={i === 0 ? "Limitaciones" : undefined}>
                      {l}
                    </Nota>
                  ))}
                  <Nota rotulo="Próximos pasos" tono="mod2">
                    Validar con una cartera real, afinar un modelo de texto en español con solicitudes etiquetadas y monitorear el DI por edad en producción,
                    cuyo intervalo aún toca 0,8.
                  </Nota>
                </>
              }
            />
          </Sub>
        </>
      }
    />
  );
}

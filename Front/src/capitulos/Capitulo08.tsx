/** Capítulo 08 · Evaluación, optimización y auditoría de equidad (nb08 + train.py). */
import card from "@/data/generated/model_card.json";
import clasicos from "@/data/generated/resultados_clasicos.json";
import dl from "@/data/generated/resultados_dl.json";
import nlp from "@/data/generated/resultados_nlp.json";
import spark from "@/data/generated/resultados_spark.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, duracion, num, pct } from "@/charts/formatos";
import { FAMILIA, T } from "@/charts/tema";
import { Chip, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { PoliticaDecision } from "@/components/PoliticaDecision";
import { pasoPorNumero } from "@/content/pasos";
import { RunTerminal } from "@/features/terminal/RunTerminal";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Marca, Rejilla, Sub } from "./componentes";
import { IntervaloSvg } from "./Intervalo";
import { CAPITULOS } from "./mapa";
// Estilos de <PoliticaDecision> (viven con la portada).
import "@/pages/inicio.css";

const C = CAPITULOS[8];
const F = C.figuras;
const MB = card.metricas_test_umbral_bayes;
const EQ = card.equidad_test;
const VAR = card.variantes_equidad;
const ELEGIDA = VAR.find((v) => v.variante === card.variante_equidad)!;

/* ---------- Tabla final de 16 modelos ---------- */
interface FilaFinal {
  modelo: string;
  familia: string;
  m: { roc_auc: number; pr_auc: number; ks: number; brier: number; f1: number; recall: number };
}
const FILAS: FilaFinal[] = [
  { modelo: `Servido v${card.version} · ${card.familia}, calibrado`, familia: "final", m: MB },
  ...[...clasicos.modelos, ...dl.modelos, ...nlp.modelos, ...spark.modelos].map((x) => ({ modelo: x.modelo, familia: x.familia, m: x.test })),
];
const ORDEN_FAM = ["final", "clásico", "deep learning", "nlp", "big data", "línea base"];
const NOMBRE_FAM: Record<string, string> = {
  final: "Modelo servido",
  clásico: "Clásicos · nb05",
  "deep learning": "Deep Learning · nb06",
  nlp: "NLP · nb07",
  "big data": "Big Data · nb09",
  "línea base": "Línea base",
};

function TablaFinal() {
  const max = Math.max(...FILAS.map((f) => f.m.roc_auc));
  return (
    <div className="cap-tabla" role="region" aria-label="Comparación final de los 16 modelos" tabIndex={0}>
      <div className="cap-tabla__scroll" tabIndex={0} role="region" aria-label="Tabla con desplazamiento horizontal">
        <table>
          <caption className="sr-only">Métricas en test de los {FILAS.length} modelos, agrupados por familia</caption>
          <thead>
            <tr>
              <th scope="col">Modelo</th>
              <th scope="col">ROC-AUC</th>
              <th scope="col">PR-AUC</th>
              <th scope="col">KS</th>
              <th scope="col">Brier</th>
              <th scope="col">F1</th>
              <th scope="col">Recall</th>
            </tr>
          </thead>
          {ORDEN_FAM.map((fam) => {
            const filas = FILAS.filter((f) => f.familia === fam).sort((a, b) => b.m.roc_auc - a.m.roc_auc);
            if (!filas.length) return null;
            return (
              <tbody key={fam}>
                <tr className="cap-tabla__grupo">
                  <th colSpan={7} scope="colgroup">
                    <span className="cap-punto" style={{ background: FAMILIA[fam] ?? T.text3 }} aria-hidden="true" />
                    {NOMBRE_FAM[fam]} · {filas.length}
                  </th>
                </tr>
                {filas.map((f) => (
                  <tr key={f.modelo} className={fam === "final" ? "cap-tabla__destacada" : undefined}>
                    <th scope="row">{f.modelo}</th>
                    <td className={f.m.roc_auc === max ? "cap-celda-mejor" : ""}>{dec(f.m.roc_auc, 4)}</td>
                    <td className="texto-2">{dec(f.m.pr_auc, 3)}</td>
                    <td className="texto-2">{dec(f.m.ks, 3)}</td>
                    <td className="texto-2">{dec(f.m.brier, 4)}</td>
                    <td className="texto-2">{dec(f.m.f1, 3)}</td>
                    <td className="texto-2">{pct(f.m.recall, 1)}</td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>
          {FILAS.length} modelos · mismo test de {num(card.datos.n_test)} clientes · métricas de umbral con p ≥ 0,25
        </span>
        <span className="mono">model_card.json · resultados_*.json</span>
      </div>
    </div>
  );
}

/* ---------- Equidad ---------- */
function TablaEquidad({ atributo, titulo }: { atributo: "sexo" | "edad"; titulo: string }) {
  const e = EQ[atributo];
  const ref = Math.max(...e.grupos.map((g) => g.tasa_aprobacion));
  return (
    <div className="pila">
      <div className="cap-tabla" role="region" aria-label={`Equidad por ${atributo}`} tabIndex={0}>
        <div className="cap-tabla__scroll" tabIndex={0} role="region" aria-label="Tabla con desplazamiento horizontal">
          <table>
            <caption className="sr-only">{titulo}: aprobación automática y calibración por grupo en test</caption>
            <thead>
              <tr>
                <th scope="col">{atributo === "sexo" ? "Sexo" : "Edad"}</th>
                <th scope="col">n</th>
                <th scope="col">Aprobación</th>
                <th scope="col">DI</th>
                <th scope="col">Aprob. buenos pagadores</th>
                <th scope="col">p media / impago real</th>
              </tr>
            </thead>
            <tbody>
              {e.grupos.map((g) => (
                <tr key={g.grupo}>
                  <th scope="row" className="mono">
                    {g.grupo}
                  </th>
                  <td className="texto-2">{num(g.n)}</td>
                  <td>{pct(g.tasa_aprobacion)}</td>
                  <td className={g.tasa_aprobacion === ref ? "texto-3" : ""}>{g.tasa_aprobacion === ref ? "ref." : dec(g.tasa_aprobacion / ref, 3)}</td>
                  <td className="texto-2">{pct(g.aprobacion_buenos_pagadores)}</td>
                  <td className="texto-2">
                    {pct(g.prob_media)} / {pct(g.tasa_impago_real)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="intervalo">
        <p className="intervalo__titulo">
          DI por {atributo}: {dec(e.disparate_impact, 3)}
        </p>
        <p className="intervalo__sub">
          IC 95 % bootstrap [{dec(e.di_ic95[0], 3)}; {dec(e.di_ic95[1], 3)}] · igualdad de oportunidades {dec(e.di_igualdad_oportunidades, 3)}
        </p>
        <IntervaloSvg
          valor={e.disparate_impact}
          inf={e.di_ic95[0]}
          sup={e.di_ic95[1]}
          min={0.6}
          max={1.05}
          referencia={0.8}
          etiquetaRef="Regla 4/5"
          zona={{ desde: 0.6, hasta: 0.8, etiqueta: "DI < 0,8" }}
          color={T.ok}
          fmt={(v) => dec(v, 2)}
          ariaLabel={`DI por ${atributo} ${dec(e.disparate_impact, 3)}, IC 95 % ${dec(e.di_ic95[0], 3)} a ${dec(e.di_ic95[1], 3)}`}
        />
        <div className="intervalo__veredicto">
          <Chip tono={e.cumple_regla_80 ? (e.di_ic95[0] >= 0.8 ? "ok" : "warn") : "bad"} punto>
            {e.cumple_regla_80 ? "Cumple la regla 4/5" : "No cumple"}
          </Chip>
          <span>
            {e.di_ic95[0] >= 0.8 ? (
              <>Todo el intervalo queda por encima de 0,8.</>
            ) : (
              <>
                DI <strong>{dec(e.disparate_impact, 3)}</strong> sobre {num(e.grupos.reduce((a, g) => a + g.n, 0))} clientes de test, con IC 95 %
                [{dec(e.di_ic95[0], 3)}; {dec(e.di_ic95[1], 3)}]. En operación se recalcula en cada cosecha junto con el PSI.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function TablaVariantes() {
  return (
    <div className="cap-tabla" role="region" aria-label="Variantes de equidad" tabIndex={0}>
      <div className="cap-tabla__scroll" tabIndex={0} role="region" aria-label="Tabla con desplazamiento horizontal">
        <table>
          <caption className="sr-only">Variantes de equidad evaluadas con predicciones OOF de train</caption>
          <thead>
            <tr>
              <th scope="col">Variante</th>
              <th scope="col">AUC OOF</th>
              <th scope="col">Costo medio</th>
              <th scope="col">DI sexo</th>
              <th scope="col">DI edad</th>
              <th scope="col">Precio</th>
            </tr>
          </thead>
          <tbody>
            {VAR.map((v) => (
              <tr key={v.variante} className={v === ELEGIDA ? "cap-tabla__destacada" : undefined}>
                <th scope="row">
                  <span className="mono">{v.variante}</span> {v === ELEGIDA && <Chip s tono="acento">servida</Chip>}
                  <div className="texto-3" style={{ fontSize: "var(--fs-2xs)", fontWeight: 400, marginTop: 2, whiteSpace: "normal", maxWidth: 260 }}>
                    {v.descripcion}
                  </div>
                </th>
                <td className="texto-2">{dec(v.roc_auc_oof, 4)}</td>
                <td className="texto-2">{dec(v.costo_medio, 5)}</td>
                <td className="texto-2">{dec(v.di_sexo, 3)}</td>
                <td className={v.di_edad >= 0.8 ? "cap-celda-mejor" : ""} style={v.di_edad < 0.8 ? { color: "var(--bad)" } : undefined}>
                  {dec(v.di_edad, 3)} <Marca ok={v.di_edad >= 0.8} etiqueta={v.di_edad >= 0.8 ? "DI ≥ 0,8" : "DI < 0,8"} />
                </td>
                <td className="texto-2">
                  {v.precio_equidad_costo >= 0 ? "+" : "−"}
                  {dec(Math.abs(v.precio_equidad_costo), 5)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>Gana la de menor costo OOF con DI ≥ 0,8 en sexo y edad (ADR-003)</span>
        <span className="mono">model_card.json → variantes_equidad</span>
      </div>
    </div>
  );
}

export default function Capitulo08() {
  const paso = pasoPorNumero(8)!;
  const D = card.decision_test;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Elegir sin mirar el test, calibrar, decidir con costos y <em>rendir cuentas por grupo.</em>{" "}
              <span className="texto-2">El test se abre una sola vez, al final.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="ROC-AUC test" valor={card.metricas_test.roc_auc} formato="dec3" color="var(--accent)" nota={`Brier ${dec(card.metricas_test.brier, 4)}`} compacto />
              <Kpi etiqueta="Costo medio" valor={D.costo_medio} formato="dec3" color="var(--mod1)" nota="por unidad de exposición" compacto />
              <Kpi etiqueta="DI por edad" valor={EQ.edad.disparate_impact} formato="dec3" color="var(--ok)" nota={`IC [${dec(EQ.edad.di_ic95[0], 2)}; ${dec(EQ.edad.di_ic95[1], 2)}]`} compacto />
              <Kpi etiqueta="PSI del puntaje" valor={card.monitoreo.psi_puntaje_train_test} formato="dec3" color="var(--mod2)" nota={`Estado: ${card.monitoreo.estado}`} compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="08"
          rotuloEspecial={`Corrida de train.py · ${duracion(card.duracion_entrenamiento_s)} reales, la única fuente del modelo (ADR-001)`}
          especial={<RunTerminal />}
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="IA3.3 · comparación final"
            titulo={
              <>
                Dieciséis modelos, un mismo test. <span className="texto-2">El servido no es el de mayor AUC, y está bien.</span>
              </>
            }
            intro="El combinado con texto y la logística sin calibrar quedan unas milésimas arriba; el servido gana por calibración, interpretabilidad y port exacto. La selección se hizo con CV en train, no aquí."
          >
            <Composicion
              principal={<TablaFinal />}
              lateral={<Fig f={F.comparacion} nb={C.nb} lectura="ROC-AUC en test por familia: clásicos, redes y Spark se agolpan entre 0,82 y 0,85; el texto solo, debajo de 0,65." alto={520} />}
            />
          </Sub>

          <Sub
            kicker="Calibración y política de decisión"
            titulo={
              <>
                Una probabilidad solo decide <span className="texto-2">si significa lo que dice.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.calibracion} nb={C.nb} lectura="La logística ya venía calibrada: la sigmoide deja el Brier igual (0,1490 → 0,1491) y los deciles siguen la diagonal, así que la regla de Chow es aplicable." />
              <Fig f={F.costo} nb={C.nb} lectura="Con dos acciones el costo mínimo es 0,056 (umbral 0,22, junto al bayesiano 0,25); la política de tres acciones baja a 0,054, por debajo de toda la curva." />
            </Rejilla>
            <div style={{ marginTop: "var(--space-6)" }}>
              <PoliticaDecision conCurva={false} />
            </div>
            <FilaKpis cols={4}>
              <Kpi etiqueta="Aprobar" valor={D.tasa_aprobacion} formato="pct" color="var(--ok)" nota={`Impago en aprobados ${pct(D.impago_en_aprobados)}`} compacto />
              <Kpi etiqueta="Revisar" valor={D.tasa_revision} formato="pct" color="var(--warn)" nota={`Capacidad ${pct(card.costos.capacidad_revision, 0)}`} compacto />
              <Kpi etiqueta="Rechazar" valor={D.tasa_rechazo} formato="pct" color="var(--bad)" nota="del test" compacto />
              <Kpi etiqueta="Brier" valor={card.metricas_test.brier} formato="dec3" color="var(--accent)" nota="Error cuadrático de la probabilidad" compacto />
            </FilaKpis>
          </Sub>

          <Sub
            kicker="IA1.3 · equidad · precio de la equidad"
            titulo={
              <>
                Reweighing sube el DI por edad de {dec(VAR[0].di_edad, 2)} a {dec(ELEGIDA.di_edad, 2)} <span className="texto-2">por {dec(ELEGIDA.precio_equidad_costo * 1000, 2)} milésimas de costo.</span>
              </>
            }
            intro="Tres variantes evaluadas con predicciones OOF de train. Sin umbrales distintos por grupo: aplicar umbrales según la edad sería trato dispar."
          >
            <Composicion principal={<Fig f={F.precio} nb={C.nb} lectura="Costo esperado frente a DI por edad: solo reweighing cruza la línea de 0,8, casi sin costo." />} lateral={<TablaVariantes />} />
          </Sub>

          <Sub
            kicker="Auditoría en test · con intervalos"
            titulo={
              <>
                Sexo cumple con holgura; <span className="texto-2">edad cumple en el punto, no en todo el intervalo.</span>
              </>
            }
            intro="La decisión auditada es la aprobación automática (p < 0,1778), la que afecta a la persona. Sexo nunca entra al modelo: solo audita."
          >
            <div className="pila pila--l">
              <TablaEquidad atributo="sexo" titulo="Equidad por sexo" />
              <TablaEquidad atributo="edad" titulo="Equidad por edad" />
            </div>
          </Sub>

          <Sub
            kicker="Explicabilidad · SHAP"
            titulo={
              <>
                Lo que mueve la probabilidad, <span className="texto-2">en general y para tres personas.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.shap} nb={C.nb} lectura="Importancia global en 1.500 clientes de test: buró, deuda/ingreso, uso del cupo y moras dominan." />}
              lateral={
                <Nota rotulo="Asociación, no causa" tono="mod2">
                  Las contribuciones describen el modelo, no efectos causales. La API devuelve las mismas contribuciones en log-odds como factores principales de cada
                  decisión.
                </Nota>
              }
            />
            <div className="casos" style={{ marginTop: "var(--space-5)" }}>
              <Fig f={F.aprobar} nb={C.nb} lectura="Buró alto y poca deuda empujan la probabilidad hacia abajo." />
              <Fig f={F.revisar} nb={C.nb} lectura="Fuerzas en ambos sentidos: el modelo duda y la persona va a revisión." />
              <Fig f={F.rechazar} nb={C.nb} lectura="Varios factores de riesgo se suman y superan el umbral de rechazo." />
            </div>
          </Sub>

          <Sub
            kicker="Monitoreo · PSI"
            titulo={
              <>
                Train y test son la misma población: <span className="texto-2">PSI del puntaje {dec(card.monitoreo.psi_puntaje_train_test, 3)}.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.psi} nb={C.nb} lectura="Todas las variables por debajo de 0,1 (estable). Se recalibra si el PSI llega a 0,25." />}
              lateral={
                <>
                  <Nota rotulo="Operación del modelo">
                    Monitoreo mensual del PSI por variable y del puntaje: por debajo de 0,10 es estable y desde 0,25 se recalibra.
                  </Nota>
                  <Nota>Equidad por sexo y edad con su IC en cada cosecha; la mitigación del ADR-003 está lista para aplicarse.</Nota>
                  <Nota>Champion–challenger: un modelo nuevo corre en paralelo y solo se promueve si baja el costo sin degradar equidad ni calibración.</Nota>
                </>
              }
            />
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: dec(card.metricas_test.roc_auc, 4),
                titulo: `${card.familia} calibrada, elegida por parsimonia.`,
                texto: `En CV de train la logística (${dec(card.seleccion_cv_train["Regresión logística"].roc_auc_cv, 4)}) supera al HGB optimizado (${dec(card.seleccion_cv_train["Gradient Boosting (HGB)"].roc_auc_cv, 4)}); además, ante una diferencia menor que 0,005 la regla de parsimonia la habría preferido igual.`,
              },
              {
                cifra: `${pct(D.tasa_aprobacion)} · ${pct(D.tasa_revision)} · ${pct(D.tasa_rechazo)}`,
                titulo: "Aprobar, revisar y rechazar en test.",
                texto: `Costo medio ${dec(D.costo_medio, 5)} por unidad de exposición; impago entre los aprobados ${pct(D.impago_en_aprobados)}; la revisión no supera la capacidad del 35 %.`,
              },
              {
                cifra: `${dec(EQ.sexo.disparate_impact, 3)} · ${dec(EQ.edad.disparate_impact, 3)}`,
                titulo: "DI por sexo y por edad, sobre 0,8.",
                texto: `Con la variante «${card.variante_equidad}», que llevó el DI por edad de 0,72 a ${dec(EQ.edad.disparate_impact, 2)}; por sexo el trato ya era parejo. Ambos se monitorean en operación.`,
              },
              {
                cifra: dec(card.monitoreo.psi_puntaje_train_test, 3),
                titulo: "PSI estable.",
                texto: `Ninguna de las ${card.monitoreo.psi_variables.length} variables monitoreadas se desplaza entre train y test.`,
              },
            ]}
            pie={<Evidencia fuente="model_card.json → metricas_test · decision_test · equidad_test · monitoreo" />}
          />
        </>
      }
    />
  );
}

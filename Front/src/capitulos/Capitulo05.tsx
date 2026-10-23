/** Capítulo 05 · Modelos clásicos de Machine Learning (nb05). */
import res from "@/data/generated/resultados_clasicos.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, duracion, num, pct } from "@/charts/formatos";
import { Chip, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[5];
const F = C.figuras;
type Fila = (typeof res.modelos)[number];
const MODELOS = [...res.modelos].sort((a, b) => (b.roc_auc_cv ?? 0) - (a.roc_auc_cv ?? 0));
const MEJOR = MODELOS[0];
const BASE = res.modelos.find((m) => m.familia === "línea base")!;
const CANDIDATOS = MODELOS.filter((m) => m !== BASE);
const GC = res.replicacion_german_credit;

/* Escala compartida para la banda de CV (media ± 1 desviación) y el AUC de test. */
const MIN = 0.8;
const MAX = 0.87;
const x = (v: number) => `${Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100))}%`;
const TICKS = [0.8, 0.82, 0.84, 0.86];

function Ranking() {
  return (
    <div className="ranking" role="table" aria-label="Ranking de modelos clásicos por ROC-AUC de validación cruzada">
      <div className="ranking__escala" role="row" aria-hidden="true">
        <span />
        <span>Modelo</span>
        <div className="ranking__ticks">
          {TICKS.map((t) => (
            <span key={t} style={{ left: x(t) }}>
              {dec(t, 2)}
            </span>
          ))}
        </div>
        <span style={{ textAlign: "right" }}>AUC CV</span>
      </div>
      {CANDIDATOS.map((m, i) => {
        const media = m.roc_auc_cv ?? 0;
        const sd = m.roc_auc_cv_std ?? 0;
        return (
          <div className="ranking__fila" role="row" key={m.modelo}>
            <span className="ranking__pos" role="cell">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="ranking__nombre" role="cell">
              {m.modelo}
              <small>
                {duracion(m.tiempo_entrenamiento_s)} · interpretabilidad {m.interpretabilidad}
              </small>
            </span>
            <div
              className="ranking__pista"
              role="cell"
              aria-label={`CV ${dec(media, 4)} ± ${dec(sd, 4)}; test ${dec(m.test.roc_auc, 4)}`}
            >
              <span className="ranking__eje" />
              <span className="ranking__banda" style={{ left: x(media - sd), width: `calc(${x(media + sd)} - ${x(media - sd)})` }} />
              <span className="ranking__media" style={{ left: x(media) }} />
              <span className="ranking__test" style={{ left: x(m.test.roc_auc) }} title={`Test ${dec(m.test.roc_auc, 4)}`} />
            </div>
            <span className="ranking__valor" role="cell">
              {dec(media, 4)}
            </span>
          </div>
        );
      })}
      <div className="ranking__leyenda">
        <span>
          <i style={{ width: 22, height: 10, borderRadius: 3, background: "var(--accent-soft)", border: "1px solid rgba(143,151,255,.45)" }} />
          CV(5) en train: media ± 1 desviación
        </span>
        <span>
          <i style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid var(--mod1)" }} />
          AUC en test (evaluación única, tras congelar la selección)
        </span>
        <span className="texto-3">
          Línea base Dummy: AUC {dec(BASE.roc_auc_cv ?? 0.5, 2)}, fuera de escala
        </span>
      </div>
    </div>
  );
}

const mejorDe = (k: keyof Fila["test"], menor = false) =>
  CANDIDATOS.reduce((b, m) => ((menor ? m.test[k] < b.test[k] : m.test[k] > b.test[k]) ? m : b)).modelo;

function TablaComparativa() {
  const cols: { k: keyof Fila["test"]; e: string; menor?: boolean; f: (v: number) => string }[] = [
    { k: "roc_auc", e: "AUC test", f: (v) => dec(v, 4) },
    { k: "pr_auc", e: "PR-AUC", f: (v) => dec(v, 3) },
    { k: "ks", e: "KS", f: (v) => dec(v, 3) },
    { k: "brier", e: "Brier", menor: true, f: (v) => dec(v, 4) },
    { k: "recall", e: "Recall", f: (v) => pct(v, 1) },
    { k: "f1", e: "F1", f: (v) => dec(v, 3) },
  ];
  const mejores = Object.fromEntries(cols.map((c) => [c.k, mejorDe(c.k, c.menor)]));
  return (
    <div className="cap-tabla" role="region" aria-label="Tabla comparativa de modelos clásicos" tabIndex={0}>
      <div className="cap-tabla__scroll">
        <table>
          <caption className="sr-only">Métricas en test de los modelos clásicos (umbral 0,25)</caption>
          <thead>
            <tr>
              <th scope="col">Modelo</th>
              <th scope="col">AUC CV ± sd</th>
              {cols.map((c) => (
                <th key={c.k} scope="col">
                  {c.e}
                </th>
              ))}
              <th scope="col">Entreno</th>
            </tr>
          </thead>
          <tbody>
            {MODELOS.map((m) => (
              <tr key={m.modelo} className={m === MEJOR ? "cap-tabla__destacada" : undefined}>
                <th scope="row">
                  {m.modelo} {m === MEJOR && <Chip s tono="acento">elegido por CV</Chip>}
                </th>
                <td>
                  {dec(m.roc_auc_cv ?? 0, 4)} <span className="texto-3">± {dec(m.roc_auc_cv_std ?? 0, 4)}</span>
                </td>
                {cols.map((c) => (
                  <td key={c.k} className={mejores[c.k] === m.modelo ? "cap-celda-mejor" : "texto-2"}>
                    {c.f(m.test[c.k])}
                  </td>
                ))}
                <td className="texto-2">{duracion(m.tiempo_entrenamiento_s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>Métricas de umbral con p ≥ {dec(res.umbral_metricas, 2)} · en negrita, la mejor de cada columna</span>
        <span className="mono">resultados_clasicos.json</span>
      </div>
    </div>
  );
}

export default function Capitulo05() {
  const paso = pasoPorNumero(5)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Cinco modelos, un protocolo. <em>Gana el más simple</em> <span className="texto-2">porque nadie le saca una diferencia que importe.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="AUC CV · mejor" valor={MEJOR.roc_auc_cv ?? 0} formato="dec3" color="var(--accent)" nota={MEJOR.modelo} compacto />
              <Kpi etiqueta="AUC test" valor={MEJOR.test.roc_auc} formato="dec3" color="var(--mod1)" nota="Meta del proyecto ≥ 0,70" compacto />
              <Kpi etiqueta="KS" valor={MEJOR.test.ks} formato="dec3" color="var(--mod2)" nota="Separación máxima de clases" compacto />
              <Kpi etiqueta="Entrenamiento" valor={MEJOR.tiempo_entrenamiento_s} formato="dec2" color="var(--ok)" nota="segundos · el más rápido tras el Dummy" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={<Entregable nb="05" />}
      visualizaciones={
        <>
          <Sub
            kicker="Ranking · CV estratificada de 5 folds en train"
            titulo={
              <>
                La selección se hace con la banda de CV; <span className="texto-2">el test solo confirma.</span>
              </>
            }
            intro="Las bandas de la regresión logística y del Random Forest se tocan: la diferencia es del orden de una desviación. Ante empate práctico, la parsimonia elige el modelo interpretable."
          >
            <div className="panel panel--pad">
              <Ranking />
            </div>
            <div style={{ marginTop: "var(--space-5)" }}>
              <TablaComparativa />
            </div>
          </Sub>

          <Sub
            kicker="Discriminación · curvas en test"
            titulo={
              <>
                Las cuatro curvas casi se superponen; <span className="texto-2">el Dummy es la diagonal.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.roc} nb={C.nb} lectura="Todas las curvas se separan con claridad de la diagonal del azar; la logística y el bosque quedan casi superpuestas." alto={360} />}
              lateral={
                <>
                  <Fig f={F.pr} nb={C.nb} alto={260} lectura="Precisión frente a recall: el Dummy se queda en la prevalencia (0,356)." />
                </>
              }
            />
            <Rejilla>
              <Fig f={F.cv} nb={C.nb} lectura="La figura del notebook: media ± desviación de la CV por modelo." />
              <Fig f={F.conf} nb={C.nb} lectura="Con umbral 0,25 la logística captura el 84,5 % de los impagos a cambio de falsos positivos." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="Interpretabilidad"
            titulo={
              <>
                Cuatro variables financieras <span className="texto-2">explican casi todo.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.coef} nb={C.nb} lectura="Coeficientes estandarizados: el buró reduce el riesgo; uso del cupo, moras y deuda/ingreso lo aumentan." />
              <Fig f={F.perm} nb={C.nb} lectura="La importancia por permutación confirma el orden: las demográficas casi no aportan, algo deseable desde la ética." />
            </Rejilla>
            <Nota rotulo="Replicación en datos reales" tono="mod2">
              La misma metodología sobre German Credit (UCI, {GC.licencia}, {num(GC.filas)} filas) obtiene AUC CV {dec(GC.roc_auc_cv_media, 3)} ± {dec(GC.roc_auc_cv_std, 3)} y
              destapa una disparidad por edad fuerte (DI {dec(GC.disparate_impact_edad, 2)}), que justifica la auditoría del paso 8.
            </Nota>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: `${dec(MEJOR.roc_auc_cv ?? 0, 4)} ± ${dec(MEJOR.roc_auc_cv_std ?? 0, 3)}`,
                titulo: `${MEJOR.modelo}: primera en CV y en test.`,
                texto: `AUC test ${dec(MEJOR.test.roc_auc, 4)} y KS ${dec(MEJOR.test.ks, 3)}; entrena en menos de un segundo y es la más interpretable.`,
              },
              {
                cifra: `+${dec((MEJOR.roc_auc_cv ?? 0) - (CANDIDATOS[1].roc_auc_cv ?? 0), 4)}`,
                titulo: `Ventaja sobre ${CANDIDATOS[1].modelo}.`,
                texto: "Del orden de una desviación de la CV: empate práctico. El boosting por defecto queda por debajo y tarda 34 s.",
              },
              {
                titulo: "Todos superan la línea base y la meta.",
                texto: `El Dummy se queda en AUC ${dec(BASE.test.roc_auc, 2)}; el peor modelo real (${CANDIDATOS[CANDIDATOS.length - 1].modelo}) llega a ${dec(CANDIDATOS[CANDIDATOS.length - 1].test.roc_auc, 3)} en test, por encima de 0,70.`,
              },
              {
                titulo: "Selección sin fuga.",
                texto: "Se eligió solo con CV en train; el test se usó una vez, después de congelar la selección (lección L7).",
              },
            ]}
            pie={<Evidencia notebook="05" celda={celdaFinal("05")} fuente="Conclusiones · resultados_clasicos.json" />}
          />
        </>
      }
    />
  );
}

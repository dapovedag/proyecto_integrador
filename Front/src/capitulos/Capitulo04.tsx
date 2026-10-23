/** Capítulo 04 · EDA avanzado, transformación y visualización (nb04 · IA U1 + U2). */
import { Evidencia } from "@/charts/Evidencia";
import { Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { DataExplorer } from "@/features/datos/DataExplorer";
import { Cita, Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[4];
const F = C.figuras;

const DPLYR: [string, string][] = [
  ["filter()", "query() / máscara booleana"],
  ["select()", "loc[:, cols] / filter()"],
  ["mutate()", "assign()"],
  ["group_by() + summarise()", "groupby().agg()"],
  ["arrange()", "sort_values()"],
  ["%>%", "encadenado con pipe()"],
];

export default function Capitulo04() {
  const paso = pasoPorNumero(4)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Los factores de riesgo no se suman: <em>se multiplican.</em>{" "}
              <span className="texto-2">Un mismo dataset va del 4,8 % al 90,3 % de impago según el segmento.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Peor segmento" valor={0.903} formato="pct" color="var(--impago)" nota="Desempleado · con moras · buró < 600" compacto />
              <Kpi etiqueta="Mejor segmento" valor={0.048} formato="pct" color="var(--pago)" nota="Empleado · sin moras · buró > 800" compacto />
              <Kpi etiqueta="Asimetría del ingreso" valor={1.44} formato="dec2" color="var(--mod2)" nota="Era 10,81 antes del capping p1–p99" compacto />
              <Kpi etiqueta="Componentes al 90 %" valor={9} formato="num" color="var(--accent)" nota="de 16 en el PCA" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="04"
          rotuloEspecial="Explorador de train.csv · filtre, agrupe y ordene como en dplyr"
          especial={<DataExplorer conjunto="train" />}
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="Multivariado · segmentos"
            titulo={
              <>
                Situación laboral × moras × buró: <span className="texto-2">el mapa del riesgo acumulado.</span>
              </>
            }
            intro="DuckDB mostró que el buró por debajo de 600 es el 17 % de la cartera pero el 39 % de los impagos."
          >
            <Composicion
              principal={<Fig f={F.segmentos} nb={C.nb} lectura="Cada celda es una tasa de impago: el color se intensifica al combinar desempleo, moras y buró bajo." />}
              lateral={
                <>
                  <Fig f={F.gg} nb={C.nb} alto={280} lectura="plotnine (ggplot2): el impago crece con la deuda/ingreso en todas las facetas, más con moras." />
                  <Nota rotulo="Hipótesis formuladas" tono="mod2">
                    Domina el historial · el endeudamiento anticipa · la estabilidad protege · las condiciones del crédito no discriminan solas · entre
                    las sensibles, solo la edad tiene efecto.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Sub
            kicker="IA2.E1 · correlaciones"
            titulo={
              <>
                Spearman sobre Pearson: <span className="texto-2">los atípicos monetarios distorsionan la lineal.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.spearman} nb={C.nb} lectura="Buró (−0,53), uso del cupo (0,50), moras (0,39) y deuda/ingreso (0,34) son las asociaciones más fuertes con default." />
              <Fig f={F.pearson} nb={C.nb} lectura="Donde Pearson y Spearman discrepan, mandan las colas de ingreso y monto." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="IA2.5 · atípicos"
            titulo={
              <>
                Recortar sin eliminar: <span className="texto-2">eliminar habría costado el 23,8 % de train.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.capping} nb={C.nb} lectura="El winsorizer p1–p99 (ajustado en train, los mismos límites del paso 3) recorta las colas; la forma central no cambia." />
              <Fig f={F.cappingBox} nb={C.nb} lectura="Antes y después: los bigotes dejan de estirarse por errores de digitación." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="IA2.4 · PCA"
            titulo={
              <>
                PC2 separa las clases; <span className="texto-2">PC1, el tamaño del crédito, no.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.pca2d} nb={C.nb} lectura="Proyección 2D coloreada por default: la nube se desplaza a lo largo de PC2 (comportamiento crediticio, AUC 0,83)." />}
              lateral={<Fig f={F.scree} nb={C.nb} alto={260} lectura="Nueve de dieciséis componentes explican el 90 % de la varianza." />}
            />
          </Sub>

          <Sub
            kicker="IA1.E2 · IA2.1 · variables y manipulación"
            titulo={
              <>
                El ranking final y la tabla <span className="texto-2">dplyr → pandas.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.ranking} nb={C.nb} lectura="Información mutua con default: el comportamiento crediticio arriba, las demográficas abajo." />
              <div className="cap-tabla" role="region" aria-label="Equivalencias dplyr y pandas" tabIndex={0}>
                <div className="cap-tabla__scroll">
                  <table>
                    <caption className="sr-only">Verbos de dplyr y su equivalente en pandas</caption>
                    <thead>
                      <tr>
                        <th scope="col">dplyr (R)</th>
                        <th scope="col">pandas encadenado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DPLYR.map(([r, p]) => (
                        <tr key={r}>
                          <th scope="row" className="mono">
                            {r}
                          </th>
                          <td className="mono">{p}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="cap-tabla__pie">
                  <span>El código R queda solo como referencia: todo el back es Python (ADR-008)</span>
                </div>
              </div>
            </Rejilla>
          </Sub>

          <Cita fuente="nb04 · conclusiones">Un desempleado con moras y buró por debajo de 600 llega a 90,3 % de impago; un empleado sin moras con buró sobre 800 se queda en 4,8 %.</Cita>

          <Hallazgos
            items={[
              {
                cifra: "12 de 16",
                titulo: "Numéricas que difieren entre clases.",
                texto: "Monto, plazo, tasa y cuota no difieren: las condiciones del crédito no discriminan solas.",
              },
              {
                cifra: "10,81 → 1,44",
                titulo: "Asimetría del ingreso tras el capping.",
                texto: "Se recortó el 2 % de las filas por variable y no se eliminó ninguna.",
              },
              {
                titulo: "Tres librerías de visualización.",
                texto: "Matplotlib (panel 2×2), Seaborn (heatmap, pairplot, violinplot) y plotnine con geom_boxplot, geom_col y geom_line, todos con facet_wrap.",
              },
              {
                titulo: "22 variables al modelo.",
                texto: "Tres con señal débil; sexo queda excluida y longitud_texto se reserva para el paso 7. No hubo que cambiar features.py.",
              },
            ]}
            pie={<Evidencia notebook="04" celda={celdaFinal("04")} fuente="Conclusiones" />}
          />
        </>
      }
    />
  );
}

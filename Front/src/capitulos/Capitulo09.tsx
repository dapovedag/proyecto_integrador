/** Capítulo 09 · Integración con Big Data (nb09 · PySpark en Docker). */
import spark from "@/data/generated/resultados_spark.json";
import ejecuciones from "@/data/generated/ejecuciones.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, duracion, num, pct } from "@/charts/formatos";
import { Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { SparkJob } from "@/features/spark/SparkJob";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[9];
const F = C.figuras;
const M = spark.modelos[0];
const EJ = (ejecuciones as Record<string, { estado: string; duracion_s: number; modo: string; fecha: string }>)["09_spark_big_data.ipynb"];
const delta = spark.auc_sklearn - spark.auc_mllib;
const topSeg = [...spark.tasa_por_segmento].sort((a, b) => b.tasa_impago - a.tasa_impago)[0];

export default function Capitulo09() {
  const paso = pasoPorNumero(9)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              El mismo análisis, ahora distribuido: <em>Spark {spark.version_spark}</em> en Docker lee, agrega, particiona y entrena{" "}
              <span className="texto-2">y llega casi al mismo AUC que scikit-learn.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="AUC · MLlib" valor={spark.auc_mllib} formato="dec3" color="var(--mod2)" nota="LogisticRegression de Spark" compacto />
              <Kpi etiqueta="AUC · scikit-learn" valor={spark.auc_sklearn} formato="dec3" color="var(--mod1)" nota="Mismo test, mismo contenedor" compacto />
              <Kpi etiqueta="Particiones Parquet" valor={spark.particiones.length} formato="num" color="var(--accent)" nota="proposito=…" compacto />
              <Kpi etiqueta="Scoring por lotes" valor={spark.filas_scoring} formato="num" color="var(--ok)" nota="filas puntuadas" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="09"
          rotuloEspecial={`Job de Spark · ejecución real en Docker${EJ ? ` (${duracion(EJ.duracion_s)}, modo ${EJ.modo})` : ""}`}
          especial={<SparkJob />}
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="IA3.6 · MLlib frente a scikit-learn"
            titulo={
              <>
                Una diferencia de {dec(delta * 1000, 1)} milésimas <span className="texto-2">con folds no estratificados.</span>
              </>
            }
            intro="Los mismos ids de train y test que el paso 3. La CV de MLlib usa folds aleatorios no estratificados, lo que explica parte de la diferencia."
          >
            <Composicion
              principal={<Fig f={F.roc} nb={C.nb} lectura="Las dos curvas ROC prácticamente se superponen en todo el rango." alto={360} />}
              lateral={<Fig f={F.metricas} nb={C.nb} lectura="Con el mismo umbral 0,25, precisión, recall y F1 casi coinciden." />}
            />
          </Sub>

          <Sub
            kicker="Spark SQL · agregaciones"
            titulo={
              <>
                {topSeg.segmento.replace(/_/g, " ")}: {pct(topSeg.tasa_impago)} de impago, <span className="texto-2">calculado con groupBy().agg().</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.laboral} nb={C.nb} lectura="Las mismas tasas por situación laboral que DuckDB y pandas en los pasos 2 y 4." />
              <Fig f={F.proposito} nb={C.nb} lectura="Vivienda es el propósito con más impago; libre inversión, el de menos." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="Almacenamiento · Parquet particionado"
            titulo={
              <>
                Una carpeta por propósito: <span className="texto-2">leer un segmento es leer solo su partición.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.particiones} nb={C.nb} lectura={`Libre inversión es la partición más grande (${num(spark.particiones[0].filas)} filas).`} />}
              lateral={
                <>
                  <Nota rotulo="HDFS · YARN · MapReduce" tono="mod2">
                    Spark reemplaza el modelo de MapReduce con ejecución en memoria sobre el mismo almacenamiento distribuido (HDFS) y el mismo gestor de
                    recursos (YARN). Aquí corre en <span className="mono">local[*]</span> dentro de un contenedor: el código no cambia al pasar a un clúster.
                  </Nota>
                  <Nota rotulo="Por qué Docker (ADR-005)">
                    En Windows, Spark exige winutils, es sensible a la ruta con tilde del proyecto y a la versión de Java. La imagen fija Spark{" "}
                    {spark.version_spark} y Java 21 sin salir de Python.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: `${dec(spark.auc_mllib, 4)} vs ${dec(spark.auc_sklearn, 4)}`,
                titulo: "MLlib reproduce a scikit-learn.",
                texto: `F1 ${dec(M.test.f1, 3)} y recall ${pct(M.test.recall)} con umbral 0,25; entrenamiento de ${duracion(M.tiempo_entrenamiento_s)} en Spark local.`,
              },
              {
                cifra: num(spark.particiones.reduce((a, p) => a + p.filas, 0)),
                titulo: `Filas en ${spark.particiones.length} particiones Parquet.`,
                texto: "Particionado por propósito del crédito, con esquema explícito al leer el CSV.",
              },
              {
                cifra: num(spark.filas_scoring),
                titulo: "Scoring por lotes.",
                texto: "El modelo de MLlib puntúa todos los clientes en una sola pasada distribuida.",
              },
              {
                titulo: "El código sigue siendo Python.",
                texto: "El contenedor monta el repositorio e instala credit_risk, de modo que nb09 importa el mismo paquete que el resto del proyecto.",
              },
            ]}
            pie={<Evidencia notebook="09" fuente="resultados_spark.json" />}
          />
        </>
      }
    />
  );
}

/** Capítulo 02 · Exploración y análisis preliminar (nb02 · Programación U1). */
import agregados from "@/data/generated/agregados.json";
import { Evidencia } from "@/charts/Evidencia";
import { num, pct } from "@/charts/formatos";
import { Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { DataExplorer } from "@/features/datos/DataExplorer";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[2];
const F = C.figuras;
const nulos = Object.entries(agregados.nulos_crudo).sort((a, b) => b[1] - a[1]);
const desempleo = agregados.por_categoria.situacion_laboral.find((c) => c.categoria === "Desempleado");

export default function Capitulo02() {
  const paso = pasoPorNumero(2)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Mirar antes de tocar: tipos, faltantes, duplicados y prevalencia. <span className="texto-2">Cuatro variables financieras ya</span>{" "}
              <em>separan a quien paga de quien no.</em>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Filas crudas" valor={agregados.resumen.filas} formato="num" nota={`${num(agregados.resumen.ids_unicos)} clientes únicos`} compacto />
              <Kpi etiqueta="Impago" valor={agregados.resumen.tasa_impago} formato="pct" color="var(--impago)" nota="Prevalencia observada" compacto />
              <Kpi etiqueta="Columnas con nulos" valor={nulos.length} formato="num" color="var(--warn)" nota={`Máx. ${nulos[0][0]}: ${num(nulos[0][1])}`} compacto />
              <Kpi etiqueta="Duplicados exactos" valor={agregados.resumen.filas - agregados.resumen.ids_unicos} formato="num" color="var(--mod1)" nota="Se tratan en el paso 3" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="02"
          rotuloEspecial="Explorador del CSV crudo · el mismo archivo que leyó el notebook"
          especial={<DataExplorer conjunto="crudo" />}
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="Relación · dispersión"
            titulo={
              <>
                Buró bajo y cupo alto: <span className="texto-2">la esquina donde casi todos incumplen.</span>
              </>
            }
            intro="Cada punto es una solicitud. Las dos variables de comportamiento crediticio dibujan la frontera que después aprende el modelo."
          >
            <Composicion
              principal={
                <Fig f={F.dispersion} nb={C.nb} lectura="Los impagos se concentran con puntaje de buró bajo y uso del cupo alto; arriba a la izquierda casi no hay." alto={420} />
              }
              lateral={
                <>
                  <Fig f={F.moras} nb={C.nb} alto={240} lectura="Con moras en los últimos 12 meses, el impago se dispara." />
                  <Nota rotulo="Operaciones básicas (P1.4)" tono="mod1">
                    Selección, filtrado, <code>query</code>, ordenamiento, <code>groupby</code> y <code>pivot_table</code> se hicieron en pandas y en
                    <strong> SQL con DuckDB</strong>, con resultados idénticos en las 11 comparaciones.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Sub
            kicker="Distribución · histogramas y boxplots"
            titulo={
              <>
                Las clases se separan en el buró, <span className="texto-2">no en el ingreso.</span>
              </>
            }
            intro="Al menos 3 histogramas, 2 dispersiones y 3 boxplots, cada uno interpretado en el notebook. Aquí, los que mejor cuentan la historia."
          >
            <Rejilla>
              <Fig f={F.histBuro} nb={C.nb} lectura="Las distribuciones del buró por clase apenas se solapan en las colas." />
              <Fig f={F.boxBuro} nb={C.nb} lectura="La mediana de buró de quienes incumplen está claramente por debajo." />
              <Fig f={F.boxCupo} nb={C.nb} lectura="El uso del cupo de quienes incumplen es más alto y más disperso." />
              <Fig f={F.histIngreso} nb={C.nb} lectura="El ingreso es muy asimétrico, con errores de digitación en la cola: discrimina poco por sí solo." />
            </Rejilla>
            <Rejilla>
              <Fig f={F.dispIngreso} nb={C.nb} lectura="Ingreso y monto no separan las clases: se combinarán en ratios de capacidad de pago." />
              <Fig f={F.laboral} nb={C.nb} lectura="Desempleados con la tasa más alta; pensionados, la más baja." />
            </Rejilla>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: pct(agregados.resumen.tasa_impago, 2),
                titulo: "Prevalencia alta y conocida.",
                texto: `${num(agregados.resumen.filas)} filas × 21 columnas. Problemas de calidad que trata el paso 3: nulos en ${nulos.length} columnas (hasta 9,21 % en antiguedad_laboral_anios), 144 duplicados exactos, 25 edades imposibles y montos con errores de digitación.`,
              },
              {
                cifra: "59,7 %",
                titulo: "Las moras previas pesan.",
                texto: "Impago entre quienes tienen moras previas; el buró bajo con cupo alto llega a 87,7 %.",
              },
              {
                cifra: desempleo ? pct(desempleo.tasa_impago, 1) : "62 %",
                titulo: "El desempleo eleva el riesgo.",
                texto: "Variables más prometedoras: puntaje_buro, uso_cupo_tarjetas, moras_ultimos_12m, relacion_deuda_ingreso, situacion_laboral y nivel_educativo.",
              },
              {
                titulo: "Sexo no muestra diferencias relevantes.",
                texto: "Queda fuera del modelo. La edad sí difiere entre clases y se vigila por equidad en los pasos 1 y 8.",
              },
            ]}
            pie={<Evidencia notebook="02" celda={celdaFinal("02")} fuente="Conclusiones · agregados.json (DuckDB)" />}
          />
        </>
      }
    />
  );
}

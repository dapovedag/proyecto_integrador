/** Capítulo 01 · Definición del problema y análisis ético (nb01). */
import agregados from "@/data/generated/agregados.json";
import card from "@/data/generated/model_card.json";
import sensibles from "@/data/generated/variables_sensibles.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, num, pct } from "@/charts/formatos";
import { Chip, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[1];
const F = C.figuras;
const U = card.umbrales;
const K = card.costos;

export default function Capitulo01() {
  const paso = pasoPorNumero(1)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Antes de modelar hay que decidir <em>qué se decide</em>: una probabilidad de impago que se convierte en aprobar, revisar o rechazar,
              y <span className="texto-2">quién paga cada error.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Solicitudes" valor={agregados.resumen.filas} formato="num" nota="21 columnas · CSV de registro" compacto />
              <Kpi etiqueta="Tasa de impago" valor={agregados.resumen.tasa_impago} formato="pct" color="var(--impago)" nota="Prevalencia del default" compacto />
              <Kpi etiqueta="Aprobar si p <" valor={U.aprobar} formato="dec3" color="var(--ok)" nota={`C_R / C_FN = ${dec(K.revision, 2)} / ${dec(K.lgd_fn, 2)}`} compacto />
              <Kpi etiqueta="Rechazar si p >" valor={U.rechazar} formato="dec3" color="var(--bad)" nota={`1 − C_R / C_FP = 1 − ${dec(K.revision, 2)} / ${dec(K.margen_fp, 2)}`} compacto />
            </FilaKpis>
          }
        />
      }
      entregable={<Entregable nb="01" />}
      visualizaciones={
        <>
          <Sub
            kicker="Formulación · costo de equivocarse"
            titulo={
              <>
                Tres acciones, tres costos. <span className="texto-2">La de menor costo esperado gana.</span>
              </>
            }
            intro="Aprobar a quien incumple cuesta la pérdida dada el impago (LGD 0,45); rechazar a un buen pagador, el margen perdido (0,15); revisar a mano, 0,08 por solicitud. Así nacen las tres bandas, antes de entrenar un solo modelo."
          >
            <Composicion
              principal={
                <Fig
                  f={F.costo}
                  nb={C.nb}
                  lectura="Las rectas se cruzan en 0,1778 y 0,4667: por debajo conviene aprobar, por encima rechazar y en medio revisar."
                  alto={340}
                />
              }
              lateral={
                <>
                  <Nota rotulo="Problema" tono="mod2">
                    Clasificación binaria supervisada: estimar <strong>P(default = 1)</strong> por solicitud y traducirla a una acción para el
                    analista. Métrica principal ROC-AUC con meta <strong>≥ 0,70 en test</strong>; recall, F1, KS y Brier como secundarias.
                  </Nota>
                  <Nota rotulo="Por qué importa el Brier">
                    La regla de Chow supone probabilidades calibradas: si el modelo dice 30 %, deben incumplir 3 de cada 10.
                  </Nota>
                  <Evidencia fuente="model_card.json → costos · umbrales" />
                </>
              }
            />
          </Sub>

          <Sub
            kicker="Ética · variables sensibles"
            titulo={
              <>
                El riesgo de equidad está en la edad, <span className="texto-2">no en el sexo.</span>
              </>
            }
            intro="En los datos crudos el impago casi no cambia por sexo, pero sí por grupo de edad. Esa es la diferencia que el paso 8 mide sobre la aprobación automática, con su intervalo de confianza."
          >
            <Composicion
              principal={<Fig f={F.edad} nb={C.nb} lectura="Los jóvenes (18-29) incumplen más que los mayores de 60: un modelo podría aprender a penalizarlos." />}
              lateral={
                <>
                  <Fig f={F.sexo} nb={C.nb} alto={220} lectura="Diferencia de medio punto entre sexos: sexo queda fuera del modelo y solo audita." />
                </>
              }
            />
            <Rejilla>
              <Fig f={F.civil} nb={C.nb} lectura="El estado civil varía poco: se vigila de forma descriptiva, fuera del criterio de DI." />
              <div className="cap-tabla" role="region" aria-label="Tabla de variables sensibles" tabIndex={0}>
                <div className="cap-tabla__scroll">
                  <table>
                    <caption className="sr-only">Variables sensibles y su uso en el modelo</caption>
                    <thead>
                      <tr>
                        <th scope="col">Variable</th>
                        <th scope="col">Uso en el modelo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensibles.map((v) => (
                        <tr key={v.variable}>
                          <th scope="row" className="mono">
                            {v.variable}
                            <div className="texto-3" style={{ fontFamily: "var(--font-text)", fontSize: "var(--fs-2xs)", marginTop: 2 }}>
                              {v.riesgo}
                            </div>
                          </th>
                          <td style={{ whiteSpace: "normal", textAlign: "left" }}>
                            <Chip s tono={v.uso_en_modelo.startsWith("NO") || v.uso_en_modelo.startsWith("No") ? "ok" : "warn"}>
                              {v.uso_en_modelo}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="cap-tabla__pie">
                  <span>Se reutiliza en la auditoría del paso 8</span>
                  <span className="mono">variables_sensibles.json</span>
                </div>
              </div>
            </Rejilla>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: `${num(agregados.resumen.filas)} × 21`,
                titulo: "Un dataset con lo que el problema pide.",
                texto: (
                  <>
                    Tasa de impago del <strong>{pct(agregados.resumen.tasa_impago, 2)}</strong> y los 10 chequeos del contrato de datos en verde. Se eligió
                    frente a German Credit, Default of Credit Card Clients y Give Me Some Credit por traer texto en español, sexo, edad y estado civil
                    por separado. Su límite: es sintético.
                  </>
                ),
              },
              {
                cifra: `${dec(U.aprobar, 4)} · ${dec(U.rechazar, 4)}`,
                titulo: "Los umbrales salen de los costos (ADR-002).",
                texto: "Las bandas Bajo, Medio y Alto coinciden con aprobar, revisar y rechazar por construcción; el umbral bayesiano de dos acciones (0,25) cae dentro de la zona de revisión.",
              },
              {
                cifra: "40,5 % vs 32,5 %",
                titulo: "La edad separa; el sexo no.",
                texto: "Impago crudo de 18-29 frente a 60+, contra 0,5 puntos entre sexos. El paso 8 debe medir el DI de la aprobación por edad y mitigarlo sin umbrales por grupo.",
              },
              {
                titulo: "Sexo nunca entra al modelo.",
                texto: "Solo se usa para auditar. La tabla de variables sensibles (sexo, edad, estado civil y tres proxies) quedó en variables_sensibles.json para la auditoría final.",
              },
            ]}
            pie={<Evidencia notebook="01" celda={celdaFinal("01")} fuente="Conclusiones" />}
          />
        </>
      }
    />
  );
}

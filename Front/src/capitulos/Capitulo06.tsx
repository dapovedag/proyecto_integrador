/** Capítulo 06 · Redes neuronales con TensorFlow/Keras (nb06). */
import { useState } from "react";
import dl from "@/data/generated/resultados_dl.json";
import clasicos from "@/data/generated/resultados_clasicos.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec } from "@/charts/formatos";
import { Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { Segmentado } from "@/components/Tabs";
import { pasoPorNumero } from "@/content/pasos";
import { Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[6];
const F = C.figuras;
type RedId = "mlp" | "cnn" | "gru" | "hib";
const REDES: { id: RedId; modelo: string; etiqueta: string; entrada: string }[] = [
  { id: "mlp", modelo: "MLP (Keras)", etiqueta: "MLP", entrada: "tabular" },
  { id: "cnn", modelo: "CNN1D (Keras)", etiqueta: "CNN 1D", entrada: "tabular como secuencia" },
  { id: "gru", modelo: "GRU_texto (Keras)", etiqueta: "GRU · texto", entrada: "solo texto" },
  { id: "hib", modelo: "Hibrido (Keras)", etiqueta: "Híbrido", entrada: "texto + tabular" },
];
const LR = clasicos.modelos.find((m) => m.modelo === "Regresión logística")!;
const mejorRedTest = [...dl.modelos].sort((a, b) => b.test.roc_auc - a.test.roc_auc)[0];
const GRU = dl.modelos.find((m) => m.modelo === "GRU_texto (Keras)")!;
const HIB = dl.modelos.find((m) => m.modelo === "Hibrido (Keras)")!;
const ARQ = dl.arquitecturas as Record<string, string>;
const HIST = dl.historiales as Record<string, { auc: number[]; val_auc?: number[] }>;

function Arquitectura({ texto }: { texto: string }) {
  const [cab, ...capas] = texto.split("\n");
  return (
    <pre className="redes__arq" aria-label="Arquitectura de la red">
      <b>{cab}</b>
      {"\n"}
      {capas.join("\n")}
    </pre>
  );
}

function Curvas() {
  const [red, setRed] = useState<RedId>("mlp");
  const r = REDES.find((x) => x.id === red)!;
  const m = dl.modelos.find((x) => x.modelo === r.modelo)!;
  const epocas = HIST[r.modelo]?.auc.length ?? 0;
  return (
    <div>
      <div className="redes__cab">
        <Segmentado
          etiqueta="Red neuronal"
          opciones={REDES.map((x) => ({ id: x.id, etiqueta: x.etiqueta }))}
          valor={red}
          onCambio={setRed}
        />
        <span className="versalitas texto-3">
          Entrada: {r.entrada} · {epocas} épocas
        </span>
      </div>
      <Composicion
        principal={
          <Rejilla>
            <Fig key={`l-${red}`} f={F[`loss_${red}`]} nb={C.nb} alto={260} lectura="Entrenamiento frente a validación: cuando la validación se estanca, EarlyStopping restaura la mejor época." />
            <Fig key={`a-${red}`} f={F[`auc_${red}`]} nb={C.nb} alto={260} lectura="ROC-AUC por época en ajuste y validación." />
          </Rejilla>
        }
        lateral={
          <>
            <div className="redes__metricas">
              <Kpi etiqueta="AUC test" valor={m.test.roc_auc} formato="dec3" color="var(--mod2)" compacto />
              <Kpi etiqueta="F1 (0,25)" valor={m.test.f1} formato="dec3" color="var(--accent)" compacto />
              <Kpi etiqueta="Recall" valor={m.test.recall} formato="pct" color="var(--impago)" compacto />
              <Kpi etiqueta="Entreno (s)" valor={m.tiempo_entrenamiento_s} formato="dec1" color="var(--mod1)" compacto />
            </div>
            <Arquitectura texto={ARQ[r.modelo] ?? r.modelo} />
            <Nota rotulo="Nota del entrenamiento">{m.notas}</Nota>
          </>
        }
      />
    </div>
  );
}

export default function Capitulo06() {
  const paso = pasoPorNumero(6)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              Cuatro redes en TensorFlow {dl.backend.replace("tensorflow ", "")}. <em>Ninguna supera a la regresión logística</em>{" "}
              <span className="texto-2">en datos tabulares de este tamaño.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Mejor red · AUC test" valor={mejorRedTest.test.roc_auc} formato="dec3" color="var(--mod2)" nota={mejorRedTest.modelo} compacto />
              <Kpi etiqueta="Regresión logística" valor={LR.test.roc_auc} formato="dec3" color="var(--mod1)" nota={`${dec(LR.tiempo_entrenamiento_s, 2)} s de entrenamiento`} compacto />
              <Kpi
                etiqueta="Tiempo relativo"
                valor={Math.round(mejorRedTest.tiempo_entrenamiento_s / LR.tiempo_entrenamiento_s)}
                formato="num"
                color="var(--warn)"
                nota="veces lo que tarda la logística"
                compacto
              />
              <Kpi etiqueta="Redes entrenadas" valor={dl.modelos.length} formato="num" color="var(--accent)" nota="MLP · CNN 1D · GRU · híbrido" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={<Entregable nb="06" />}
      visualizaciones={
        <>
          <Sub
            kicker="Curvas de aprendizaje · por red"
            titulo={
              <>
                Sobreajuste leve y controlado; <span className="texto-2">la CNN aún no convergía.</span>
              </>
            }
            intro="Todas usan class_weight, EarlyStopping que restaura los mejores pesos y ModelCheckpoint sobre el AUC de validación, con el preprocesamiento ajustado solo en la partición de ajuste."
          >
            <Curvas />
          </Sub>

          <Sub
            kicker="IA3.3 · clásicos frente a Deep Learning"
            titulo={
              <>
                A la par en AUC, <span className="texto-2">treinta veces más lentas y sin coeficientes.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.metricas} nb={C.nb} lectura="Con el mismo umbral 0,25, la logística iguala o supera a todas las redes en AUC y F1." alto={340} />}
              lateral={<Fig f={F.tiempo} nb={C.nb} lectura="El costo de las redes está en el tiempo y en la pérdida de explicación, un requisito en crédito." />}
            />
            <Rejilla>
              <Fig f={F.roc} nb={C.nb} lectura="Curvas ROC en test: MLP e híbrido casi superpuestos; la GRU solo con texto, muy por debajo." />
              <div className="pila">
                <Nota rotulo="Calibración" tono="mod2">
                  class_weight infla las probabilidades. Corregir el prior con la prevalencia de train, sin usar test, mejora el Brier y el F1 de todas
                  las redes: en el MLP el Brier pasa de 0,1623 a {dec(dl.modelos[0].test.brier, 4)}.
                </Nota>
                <Nota rotulo="Artefacto">
                  <span className="mono">red_neuronal.keras</span> guarda el {dl.mejor_red.replace(" (Keras)", "").replace("Hibrido", "híbrido")}, la red con mejor AUC de
                  validación (0,8576); al recargarlo reproduce las mismas probabilidades.
                </Nota>
              </div>
            </Rejilla>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: `${dec(mejorRedTest.test.roc_auc, 4)} vs ${dec(LR.test.roc_auc, 4)}`,
                titulo: "La mejor red no alcanza a la logística.",
                texto: `${mejorRedTest.modelo} frente a la regresión logística en test; F1 ${dec(mejorRedTest.test.f1, 3)} frente a ${dec(LR.test.f1, 3)}.`,
              },
              {
                cifra: `AUC ${dec(GRU.test.roc_auc, 3)}`,
                titulo: "El texto tiene señal propia, pero débil.",
                texto: `La GRU solo con texto supera al azar (0,50), pero queda lejos del tabular. El híbrido (${dec(HIB.test.roc_auc, 4)}) no mejora al MLP.`,
              },
              {
                titulo: "Recomendación: servir un modelo clásico.",
                texto: "Con 9.600 filas de train y 38 columnas, la red no compensa su costo de tiempo ni la pérdida de interpretabilidad. Las redes quedan como evidencia comparativa.",
              },
              {
                titulo: "Sobreajuste bajo control.",
                texto: "EarlyStopping restaura las épocas 20 (MLP) y 16 (híbrido); en la GRU la mejor época es la 4; la CNN llegó al tope de 30 sin converger.",
              },
            ]}
            pie={<Evidencia notebook="06" celda={celdaFinal("06")} fuente="Conclusiones · resultados_dl.json" />}
          />
        </>
      }
    />
  );
}

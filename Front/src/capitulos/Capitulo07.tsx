/** Capítulo 07 · NLP aplicado al riesgo de crédito (nb07). */
import nlp from "@/data/generated/resultados_nlp.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec, num, pct } from "@/charts/formatos";
import { Chip, Nota } from "@/components/base";
import { FichaEntregable } from "@/components/FichaEntregable";
import { Kpi } from "@/components/Kpi";
import { pasoPorNumero } from "@/content/pasos";
import { Cita, Composicion, Entregable, Fig, FilaKpis, Hallazgos, Intro, Rejilla, Sub } from "./componentes";
import { celdaFinal } from "./figuras";
import { IntervaloSvg } from "./Intervalo";
import { CAPITULOS } from "./mapa";

const C = CAPITULOS[7];
const F = C.figuras;
const D = nlp.delta_auc;
const M = (n: string) => nlp.modelos.find((m) => m.modelo.startsWith(n))!;
const TFIDF = M("TF-IDF");
const BERT = M("BERT");
const ST = M("Sentence");
const GPT = M("GPT-2");
const COMB = M("Combinado");
const SOLO_TEXTO = [TFIDF, ST, GPT, BERT];
const signo = (v: number) => `${v >= 0 ? "+" : "−"}${dec(Math.abs(v), 4)}`;

function TablaTexto() {
  return (
    <div className="cap-tabla" role="region" aria-label="Modelos de texto" tabIndex={0}>
      <div className="cap-tabla__scroll" tabIndex={0} role="region" aria-label="Tabla con desplazamiento horizontal">
        <table>
          <caption className="sr-only">Modelos solo con texto: AUC de CV en train y en test, e inferencia</caption>
          <thead>
            <tr>
              <th scope="col">Representación</th>
              <th scope="col">AUC CV</th>
              <th scope="col">AUC test</th>
              <th scope="col">Inferencia</th>
            </tr>
          </thead>
          <tbody>
            {SOLO_TEXTO.map((m) => {
              const ms = /([\d.]+) ms\/texto/.exec(m.notas)?.[1];
              return (
                <tr key={m.modelo} className={m === TFIDF ? "cap-tabla__destacada" : undefined}>
                  <th scope="row">
                    {m.modelo} {m === TFIDF && <Chip s tono="acento">servido en /predict/text</Chip>}
                  </th>
                  <td className={m === TFIDF ? "cap-celda-mejor" : "texto-2"}>{dec(m.roc_auc_cv ?? 0, 3)}</td>
                  <td className="texto-2">{dec(m.test.roc_auc, 3)}</td>
                  <td className="texto-2 mono">{ms ? `${num(Number(ms), 1)} ms` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="cap-tabla__pie">
        <span>Inferencia por texto en CPU, medida en el notebook</span>
        <span className="mono">resultados_nlp.json</span>
      </div>
    </div>
  );
}

export default function Capitulo07() {
  const paso = pasoPorNumero(7)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              El texto ordena el riesgo de forma modesta y, sumado al modelo tabular, <em>no aporta una mejora demostrable.</em>{" "}
              <span className="texto-2">Decirlo también es un resultado.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Solo texto · TF-IDF" valor={TFIDF.test.roc_auc} formato="dec3" color="var(--mod2)" nota="AUC test; el tabular llega a 0,846" compacto />
              <Kpi etiqueta="Sentimiento BERT" valor={BERT.test.roc_auc} formato="dec3" color="var(--warn)" nota="Afinado con reseñas: otro dominio" compacto />
              <Kpi etiqueta="ΔAUC · milésimas" valor={D.valor * 1000} formato="dec1" color="var(--accent)" nota={`${signo(D.valor)} · IC 95 % [${signo(D.ic_inferior)}; ${signo(D.ic_superior)}]`} compacto />
              <Kpi etiqueta="P(Δ ≤ 0)" valor={D.prob_delta_no_positivo} formato="pct" color="var(--bad)" nota={`${num(D.n_bootstrap)} réplicas bootstrap`} compacto />
            </FilaKpis>
          }
        />
      }
      entregable={<Entregable nb="07" />}
      visualizaciones={
        <>
          <Sub
            kicker="Análisis de texto · términos asociados"
            titulo={
              <>
                Las palabras del impago aparecen <span className="texto-2">en ambas clases.</span>
              </>
            }
            intro="El texto es de plantilla: 4.454 textos distintos en todo el dataset. Las frecuencias y los n-gramas con conteos idénticos reconstruyen las frases del generador."
          >
            <Composicion
              principal={<Fig f={F.terminos} nb={C.nb} lectura="Log-odds de cada término: «superado», «atrasos», «problemas» inclinan al impago; «buen historial» y «puntualmente», al pago." />}
              lateral={
                <>
                  <Fig f={F.bigramas} nb={C.nb} alto={300} lectura="Bigramas con conteos idénticos: las solicitudes usan frases estandarizadas." />
                </>
              }
            />
          </Sub>

          <Sub
            kicker="Sentimiento · BERT multilingüe"
            titulo={
              <>
                Más estrellas, algo menos de impago: <span className="texto-2">una relación débil.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.sentimiento} nb={C.nb} lectura={`Niveles 2 y 3: ${pct(nlp.sentimiento_vs_impago[0].tasa_impago)} y ${pct(nlp.sentimiento_vs_impago[1].tasa_impago)} de impago; nivel 4: ${pct(nlp.sentimiento_vs_impago[2].tasa_impago)}.`} />
              <Fig f={F.estrellas} nb={C.nb} lectura="Las estrellas esperadas por clase casi se superponen: el modelo se afinó con reseñas de productos." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="Embeddings · BERT (sentence-transformers) frente a GPT-2"
            titulo={
              <>
                Un encoder de oraciones gana a un modelo generativo <span className="texto-2">con la mitad de dimensiones.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.st} nb={C.nb} lectura={`MiniLM, 384 dimensiones · AUC CV ${dec(ST.roc_auc_cv ?? 0, 3)}. En 2D las clases no se separan.`} />
              <Fig f={F.gpt2} nb={C.nb} lectura={`gpt2-small-spanish, 768 dimensiones · AUC CV ${dec(GPT.roc_auc_cv ?? 0, 3)}, casi tres veces más lento.`} />
            </Rejilla>
            <div style={{ marginTop: "var(--space-5)" }}>
              <TablaTexto />
            </div>
          </Sub>

          <Sub
            kicker="IA3.E1 · modelo combinado"
            titulo={
              <>
                ΔAUC = {signo(D.valor)}. <span className="texto-2">El intervalo incluye el cero.</span>
              </>
            }
            intro={`Tabular + sentimiento + ${D.n_componentes_pca} componentes PCA de sentence-transformers frente al tabular solo, sobre el mismo test, con ${num(D.n_bootstrap)} réplicas bootstrap.`}
          >
            <div className="intervalo">
              <p className="intervalo__titulo">Aporte del texto sobre el modelo tabular (AUC test)</p>
              <p className="intervalo__sub">
                AUC tabular {dec(D.auc_base, 4)} → combinado {dec(D.auc_nuevo, 4)}
              </p>
              <IntervaloSvg
                valor={D.valor}
                inf={D.ic_inferior}
                sup={D.ic_superior}
                min={-0.004}
                max={0.004}
                referencia={0}
                etiquetaRef="Δ = 0 · solo tabular"
                fmt={(v) => signo(v)}
                ariaLabel={`ΔAUC ${signo(D.valor)} con IC 95 % de ${signo(D.ic_inferior)} a ${signo(D.ic_superior)}`}
              />
              <div className="intervalo__veredicto">
                <Chip tono="acento" punto>
                  Decisión: modelo tabular
                </Chip>
                <span>
                  El IC 95 % del aporte va de <strong>{signo(D.ic_inferior)}</strong> a <strong>{signo(D.ic_superior)}</strong>: el modelo tabular ya
                  captura la señal del texto. Se sirve el modelo más simple y explicable, y el análisis del texto queda disponible en el simulador y en
                  /predict/text.
                </span>
              </div>
            </div>
            <Rejilla>
              <Fig f={F.delta} nb={C.nb} lectura="Distribución bootstrap del ΔAUC: centrada cerca de cero, el texto no cambia la decisión." />
              <Fig f={F.quintil} nb={C.nb} lectura="A igual riesgo tabular, los textos de tono negativo concentran más impago: el lenguaje refleja la situación del solicitante." />
            </Rejilla>
            <Rejilla>
              <Fig f={F.roc} nb={C.nb} lectura="Combinado y tabular son indistinguibles; solo texto queda muy por debajo." />
              <Nota rotulo="Por qué la decisión usa el modelo tabular" tono="mod2">
                Con TF-IDF, BERT, sentence-transformers y GPT-2 evaluados, el combinado iguala al tabular (AUC {dec(COMB.test.roc_auc, 4)} frente a{" "}
                {dec(D.auc_base, 4)}). Un modelo con menos piezas es más fácil de explicar, auditar y servir; el texto sigue aportando su lectura de
                sentimiento y de riesgo en el simulador.
              </Nota>
            </Rejilla>
          </Sub>

          <Cita fuente="nb07 · conclusión 5">El modelo tabular ya captura la señal: ΔAUC +0,0012 con IC 95 % [−0,0003; +0,0028]. La decisión usa el modelo tabular.</Cita>

          <Hallazgos
            items={[
              {
                cifra: dec(TFIDF.roc_auc_cv ?? 0, 3),
                titulo: "El más simple es el mejor modelo de texto.",
                texto: `TF-IDF + LR gana por CV e infiere en 0,21 ms por texto frente a 85–238 ms de los transformers en CPU: es el que sirve la API en /predict/text.`,
              },
              {
                cifra: `${dec(ST.roc_auc_cv ?? 0, 3)} vs ${dec(GPT.roc_auc_cv ?? 0, 3)}`,
                titulo: "sentence-transformers supera a GPT-2.",
                texto: "Con 384 dimensiones frente a 768 y un tercio del tiempo de inferencia: para representar oraciones conviene un encoder entrenado para similitud.",
              },
              {
                cifra: signo(D.valor),
                titulo: "El tabular ya captura la señal.",
                texto: `AUC combinado ${dec(COMB.test.roc_auc, 4)} frente a ${dec(D.auc_base, 4)} del tabular: se sirve el modelo más simple.`,
              },
              {
                titulo: "Ingeniería: inferir una vez.",
                texto: "Solo los 4.454 textos únicos, con caché por hash en nlp_features.parquet: BERT, sentence-transformers y GPT-2 corren en local, sin APIs de pago.",
              },
            ]}
            pie={<Evidencia notebook="07" celda={celdaFinal("07")} fuente="Conclusiones · resultados_nlp.json → delta_auc" />}
          />
        </>
      }
    />
  );
}

/**
 * SparkJob — vista del job de Spark (nb09) al estilo "Spark UI": versión, particiones Parquet por propósito,
 * AUC de MLlib frente a scikit-learn en el mismo test, tasa de impago por segmento y el notebook 09
 * reproducible en modo compacto.
 */
import { useMemo, useState } from "react";
import spark from "@/data/generated/resultados_spark.json";
import { Evidencia } from "@/charts/Evidencia";
import { Figura } from "@/charts/Figura";
import { dec, duracion, num, pct } from "@/charts/formatos";
import { Segmentado } from "@/components/Tabs";
import type { FiguraSpec } from "@/data/tipos";
import { NotebookPlayer } from "../notebook/NotebookPlayer";
import "./spark.css";

interface Spark {
  version_spark: string;
  filas_scoring: number;
  auc_mllib: number;
  auc_sklearn: number;
  particiones: { proposito: string; filas: number }[];
  tasa_por_segmento: { dimension: string; segmento: string; solicitudes: number; tasa_impago: number }[];
  modelos: { modelo: string; tiempo_entrenamiento_s: number; notas: string; test: { roc_auc: number; ks: number; brier: number } }[];
  generado: string;
}
const S = spark as unknown as Spark;

const LEGIBLE: Record<string, string> = {
  Libre_inversion: "Libre inversión",
  Vehiculo: "Vehículo",
  Consolidacion_deuda: "Consolidación de deuda",
  Vivienda: "Vivienda",
  Negocio: "Negocio",
  Educacion: "Educación",
  proposito: "Propósito",
  situacion_laboral: "Situación laboral",
};
const leg = (s: string) => LEGIBLE[s] ?? s;

export function SparkJob() {
  const modelo = S.modelos[0];
  const totalPart = S.particiones.reduce((s, p) => s + p.filas, 0);
  const maxPart = Math.max(...S.particiones.map((p) => p.filas));
  const dims = useMemo(() => [...new Set(S.tasa_por_segmento.map((t) => t.dimension))], []);
  const [dim, setDim] = useState(dims[0] ?? "proposito");
  const delta = S.auc_mllib - S.auc_sklearn;
  const spec = useMemo<FiguraSpec>(() => {
    const filas = S.tasa_por_segmento.filter((t) => t.dimension === dim).sort((a, b) => b.tasa_impago - a.tasa_impago);
    return {
      tipo: "barras_h",
      titulo: `Tasa de impago por ${leg(dim).toLowerCase()} (Spark SQL)`,
      ejes: { x: "Tasa de impago", y: "" },
      datos: { categorias: filas.map((f) => leg(f.segmento)), series: [{ nombre: "Tasa de impago", valores: filas.map((f) => f.tasa_impago) }] },
      opciones: { formato_x: "pct" },
      clave: `${num(filas.reduce((s, f) => s + f.solicitudes, 0))} solicitudes agregadas con groupBy sobre el Parquet particionado.`,
      notebook: "09",
    };
  }, [dim]);
  const etapas = [
    { id: "ingesta", et: "Ingesta CSV → DataFrame", det: `${num(S.filas_scoring)} filas` },
    { id: "parquet", et: "Escritura Parquet", det: `${S.particiones.length} particiones · propósito` },
    { id: "sql", et: "Spark SQL", det: "tasa por segmento" },
    { id: "mllib", et: "MLlib · regresión logística", det: duracion(modelo?.tiempo_entrenamiento_s) },
    { id: "eval", et: "Evaluación en test", det: `AUC ${dec(S.auc_mllib, 4)}` },
  ];

  return (
    <div className="spark" data-testid="spark-job">
      <header className="spark__cab">
        <div className="spark__marca">
          <span className="spark__logo mono" aria-hidden="true">
            ✦
          </span>
          <div>
            <p className="spark__titulo">
              Apache Spark <span className="mono">{S.version_spark}</span>
            </p>
            <p className="spark__sub mono">local[*] · Docker · credit_risk_scoring</p>
          </div>
        </div>
        <span className="spark__estado mono">
          <i aria-hidden="true" /> SUCCEEDED
        </span>
      </header>

      <ol className="spark__dag" aria-label="Etapas del job">
        {etapas.map((e, i) => (
          <li key={e.id}>
            <span className="spark__etapa mono">Stage {i}</span>
            <strong>{e.et}</strong>
            <span className="spark__det mono">{e.det}</span>
          </li>
        ))}
      </ol>

      <div className="spark__rejilla">
        <section className="spark__panel" aria-labelledby="sp-part">
          <div className="spark__panel-cab">
            <span className="versalitas" id="sp-part">
              Storage · particiones Parquet
            </span>
            <span className="mono tk-dim">{num(totalPart)} filas</span>
          </div>
          <ul className="spark__parts">
            {S.particiones
              .slice()
              .sort((a, b) => b.filas - a.filas)
              .map((p) => (
                <li key={p.proposito}>
                  <span className="spark__part-ruta mono">proposito={p.proposito}/</span>
                  <span className="spark__part-barra" aria-hidden="true">
                    <i style={{ width: `${(p.filas / maxPart) * 100}%` }} />
                  </span>
                  <span className="spark__part-n mono tabular">{num(p.filas)}</span>
                  <span className="spark__part-pct mono tabular">{pct(p.filas / totalPart)}</span>
                </li>
              ))}
          </ul>
        </section>

        <section className="spark__panel spark__panel--auc" aria-labelledby="sp-auc">
          <div className="spark__panel-cab">
            <span className="versalitas" id="sp-auc">
              ROC-AUC en el mismo test
            </span>
          </div>
          <div className="spark__auc">
            {[
              { et: "Spark MLlib", v: S.auc_mllib, c: "mllib" },
              { et: "scikit-learn", v: S.auc_sklearn, c: "sk" },
            ].map((x) => (
              <div key={x.c} className={`spark__auc-fila spark__auc-fila--${x.c}`}>
                <span>{x.et}</span>
                <span className="spark__auc-barra" aria-hidden="true">
                  <i style={{ width: `${((x.v - 0.5) / 0.5) * 100}%` }} />
                </span>
                <strong className="display tabular">{dec(x.v, 4)}</strong>
              </div>
            ))}
            <p className="spark__auc-eje mono">escala de 0,5 (azar) a 1,0</p>
          </div>
          <p className="spark__nota">
            Δ AUC <strong className="mono">{delta > 0 ? "+" : "−"}{dec(Math.abs(delta), 4)}</strong> entre implementaciones sobre los mismos ids de
            train/test. Nota de la corrida: «{modelo?.notas.split(". ").filter((x) => /CV de MLlib/.test(x)).join(". ").replace(/\.$/, "") || modelo?.notas}».
          </p>
        </section>
      </div>

      <section className="spark__panel" aria-label="Tasa de impago por segmento">
        <div className="spark__panel-cab">
          <span className="versalitas">SQL · groupBy</span>
          {dims.length > 1 && <Segmentado etiqueta="Dimensión" valor={dim} onCambio={setDim} opciones={dims.map((d) => ({ id: d, etiqueta: leg(d) }))} />}
        </div>
        <Figura spec={spec} superficie="plana" />
      </section>

      <div className="spark__nb">
        <div className="spark__panel-cab">
          <span className="versalitas">Notebook 09 · ejecución real</span>
          <Evidencia notebook="09" fuente="resultados_spark.json" compacta />
        </div>
        <NotebookPlayer nb="09" compacto />
      </div>
    </div>
  );
}

export default SparkJob;

/** Capítulo 03 · Limpieza, estructuración y preparación (nb03 · Programación U2). */
import type { CSSProperties } from "react";
import agregados from "@/data/generated/agregados.json";
import card from "@/data/generated/model_card.json";
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

const C = CAPITULOS[3];
const F = C.figuras;
const D = card.datos;
const VM = card.variables_modelo;

const FLUJO = [
  { t: "Validar y limpiar", d: "Contrato de datos, 144 duplicados fuera, 24 edades imposibles a nulo." },
  { t: "Dividir 80/20", d: `Estratificada, semilla 42, antes de ajustar nada: ${num(D.n_train)} / ${num(D.n_test)}.` },
  { t: "Imputar y recortar", d: "Mediana o «Desconocido» y winsorizer p1–p99, aprendidos solo en train." },
  { t: "Codificar", d: `One-Hot en ${VM.nominales.length} nominales, Ordinal en ${VM.ordinales.length} con orden natural.` },
  { t: "Escalar", d: "StandardScaler frente a MinMaxScaler, que comprime ingreso y monto cerca de 0." },
];

export default function Capitulo03() {
  const paso = pasoPorNumero(3)!;
  return (
    <FichaEntregable
      paso={paso}
      intro={
        <Intro
          lead={
            <>
              La regla de oro: <em>todo lo que se ajusta, se ajusta solo con train.</em>{" "}
              <span className="texto-2">El test no se mira hasta el final.</span>
            </>
          }
          kpis={
            <FilaKpis>
              <Kpi etiqueta="Clientes únicos" valor={agregados.resumen.ids_unicos} formato="num" nota="0 nulos · 0 duplicados" compacto />
              <Kpi etiqueta="Train" valor={D.n_train} formato="num" color="var(--accent)" nota={`Impago ${pct(D.tasa_default_train, 2)}`} compacto />
              <Kpi etiqueta="Test" valor={D.n_test} formato="num" color="var(--mod1)" nota={`Impago ${pct(D.tasa_default_test, 2)}`} compacto />
              <Kpi etiqueta="Columnas al modelo" valor={38} formato="num" color="var(--mod2)" nota="22 variables tras codificar" compacto />
            </FilaKpis>
          }
        />
      }
      entregable={
        <Entregable
          nb="03"
          rotuloEspecial="Explorador de train.csv · la partición procesada, con su SHA-256"
          especial={<DataExplorer conjunto="train" />}
          nota={
            <Nota rotulo="Huellas de la partición" tono="mod1">
              train.csv <span className="mono">{D.hash_train_sha256.slice(0, 12)}…</span> · test.csv{" "}
              <span className="mono">{D.hash_test_sha256.slice(0, 12)}…</span>. El mismo hash está en la model card: el modelo se entrenó exactamente
              con estos datos.
            </Nota>
          }
        />
      }
      visualizaciones={
        <>
          <Sub
            kicker="Pipeline · sin fuga"
            titulo={
              <>
                Cinco pasos en <span className="mono">credit_risk.features</span>, <span className="texto-2">en el orden que evita la fuga.</span>
              </>
            }
          >
            <ol className="flujo" style={{ "--n": FLUJO.length } as CSSProperties}>
              {FLUJO.map((p, i) => (
                <li key={p.t}>
                  <span className="flujo__n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flujo__t">{p.t}</span>
                  <span className="flujo__d">{p.d}</span>
                </li>
              ))}
            </ol>
          </Sub>

          <Sub
            kicker="P2.1 · faltantes"
            titulo={
              <>
                Siete columnas con huecos, <span className="texto-2">ninguna por encima del 10 %.</span>
              </>
            }
          >
            <Composicion
              principal={<Fig f={F.nulos} nb={C.nb} lectura="Antigüedad laboral es la columna con más nulos (9,21 %); todas quedan muy lejos del 40 % que justificaría eliminarlas." />}
              lateral={
                <>
                  <Fig f={F.moras} nb={C.nb} alto={230} lectura="tiene_moras_previas, una de las 6 variables nuevas, separa 23,3 % frente a 59,6 % de impago." />
                  <Nota rotulo="P2.4 · variables nuevas" tono="mod1">
                    Seis variables derivadas con justificación de negocio. <strong>cuota_estimada</strong> muestra una relación en U que la correlación no
                    capta.
                  </Nota>
                </>
              }
            />
          </Sub>

          <Sub
            kicker="P2.3 · normalización frente a estandarización"
            titulo={
              <>
                El mismo ingreso, tres escalas. <span className="texto-2">MinMax lo aplasta contra el cero.</span>
              </>
            }
          >
            <Rejilla cols={3}>
              <Fig f={F.escOrig} nb={C.nb} titulo="Original" alto={220} lectura="Cola larga con valores extremos." />
              <Fig f={F.escMinMax} nb={C.nb} titulo="MinMaxScaler" alto={220} lectura="Los extremos comprimen casi todo cerca de 0." />
              <Fig f={F.escStd} nb={C.nb} titulo="StandardScaler" alto={220} lectura="Centrado y en desviaciones: el elegido." />
            </Rejilla>
          </Sub>

          <Sub
            kicker="P2.E3 · P2.5 · selección y PCA"
            titulo={
              <>
                Tres criterios coinciden; <span className="texto-2">el PCA se documenta y no se usa.</span>
              </>
            }
          >
            <Rejilla>
              <Fig f={F.seleccion} nb={C.nb} lectura="Buró, uso del cupo, moras y deuda/ingreso encabezan la información mutua, igual que en Spearman y en el bosque." />
              <Fig f={F.pca} nb={C.nb} lectura="Hacen falta 22 de 38 componentes para el 95 % de la varianza: no compensa perder la explicabilidad." />
            </Rejilla>
          </Sub>

          <Hallazgos
            items={[
              {
                cifra: num(agregados.resumen.ids_unicos),
                titulo: "Clientes únicos tras la limpieza.",
                texto: "144 duplicados exactos (también IDs repetidos) fuera; 8 columnas imputadas con mediana, «Desconocido» o «Sin texto», con estadísticos aprendidos solo en train.",
              },
              {
                cifra: `${num(D.n_train)} / ${num(D.n_test)}`,
                titulo: "División estratificada antes de ajustar.",
                texto: `Tasas de impago ${pct(D.tasa_default_train, 2)} y ${pct(D.tasa_default_test, 2)}: las particiones son gemelas.`,
              },
              {
                cifra: "22 → 38",
                titulo: "Variables a columnas.",
                texto: "One-Hot en 4 nominales (20 columnas), Ordinal en nivel_educativo y rango_edad, StandardScaler en las numéricas.",
              },
              {
                titulo: "Señales débiles, señaladas.",
                texto: "19 variables superan algún criterio de selección; tasa_interes_anual, estado_civil y plazo_meses quedan marcadas para revisarse en el paso 5.",
              },
            ]}
            pie={<Evidencia notebook="03" celda={celdaFinal("03")} fuente="Conclusiones · model_card.json → datos" />}
          />
        </>
      }
    />
  );
}

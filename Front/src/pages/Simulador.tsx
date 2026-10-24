/**
 * /simulador — Simulador de decisión: el mismo pipeline que sirve la API, ejecutado en el navegador.
 */
import card from "@/data/generated/model_card.json";
import { pct } from "@/charts/formatos";
import { Seccion } from "@/components/base";
import { Simulador as SimuladorFeature } from "@/features/simulador/Simulador";

export default function Simulador() {
  return (
    <Seccion
      borde={false}
      nivel={1}
      className="pagina-simulador"
      kicker={`Simulador · modelo v${card.version}`}
      titulo="¿Aprobar, revisar o rechazar?"
      intro={
        <>
          Ingrese los datos de un solicitante: la probabilidad de impago se calcula en el navegador con el mismo pipeline que sirve la API —
          variables derivadas, capping, codificación, regresión logística calibrada y la regla de costos que aprueba por debajo de{" "}
          <strong>{pct(card.umbrales.aprobar)}</strong> y rechaza por encima de <strong>{pct(card.umbrales.rechazar)}</strong>.
        </>
      }
    >
      <SimuladorFeature />
    </Seccion>
  );
}

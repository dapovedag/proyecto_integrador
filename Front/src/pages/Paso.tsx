/**
 * /paso/:n (1–11) — Capítulo editorial de cada entregable. El contenido vive en src/capitulos/CapituloNN.tsx
 * (carga perezosa por capítulo): intro con cifras reales, entregable (NotebookPlayer + componente especial),
 * visualizaciones nativas con evidencia, hallazgos, aprendizaje y criterio de hecho.
 */
import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { useParams } from "react-router-dom";
import { Cargando } from "@/components/base";
import NoEncontrado from "./NoEncontrado";

export const CARGADORES: Record<number, () => Promise<{ default: ComponentType }>> = {
  1: () => import("@/capitulos/Capitulo01"),
  2: () => import("@/capitulos/Capitulo02"),
  3: () => import("@/capitulos/Capitulo03"),
  4: () => import("@/capitulos/Capitulo04"),
  5: () => import("@/capitulos/Capitulo05"),
  6: () => import("@/capitulos/Capitulo06"),
  7: () => import("@/capitulos/Capitulo07"),
  8: () => import("@/capitulos/Capitulo08"),
  9: () => import("@/capitulos/Capitulo09"),
  10: () => import("@/capitulos/Capitulo10"),
  11: () => import("@/capitulos/Capitulo11"),
};

const CAPITULOS: Record<number, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(CARGADORES).map(([n, f]) => [n, lazy(f)]),
);

export default function Paso() {
  const { n } = useParams();
  const num = Number(n);
  const Capitulo = Number.isInteger(num) ? CAPITULOS[num] : undefined;
  if (!Capitulo) return <NoEncontrado />;
  return (
    <Suspense fallback={<Cargando etiqueta={`Abriendo el capítulo ${String(num).padStart(2, "0")}`} alto={520} />}>
      <Capitulo key={num} />
    </Suspense>
  );
}

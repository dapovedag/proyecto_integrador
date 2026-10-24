/**
 * Rutas lazy: / · /metodologia (paso 0) · /paso/:n (1–11) · /simulador · /trazabilidad · /glosario · /negocio · 404.
 */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Shell } from "@/components/Shell";

const Inicio = lazy(() => import("@/pages/Inicio"));
const Metodologia = lazy(() => import("@/pages/Metodologia"));
const Paso = lazy(() => import("@/pages/Paso"));
const Simulador = lazy(() => import("@/pages/Simulador"));
const Trazabilidad = lazy(() => import("@/pages/Trazabilidad"));
const Glosario = lazy(() => import("@/pages/Glosario"));
const Negocio = lazy(() => import("@/pages/Negocio"));
const NoEncontrado = lazy(() => import("@/pages/NoEncontrado"));

export const RUTAS_APP = ["/", "/metodologia", ...Array.from({ length: 11 }, (_, i) => `/paso/${i + 1}`), "/simulador", "/trazabilidad", "/glosario", "/negocio"];

export const router = createBrowserRouter(
  [
    {
      element: <Shell />,
      children: [
        { path: "/", element: <Inicio /> },
        { path: "/metodologia", element: <Metodologia /> },
        { path: "/paso/0", element: <Metodologia /> },
        { path: "/paso/:n", element: <Paso /> },
        { path: "/simulador", element: <Simulador /> },
        { path: "/trazabilidad", element: <Trazabilidad /> },
        { path: "/glosario", element: <Glosario /> },
        { path: "/negocio", element: <Negocio /> },
        { path: "*", element: <NoEncontrado /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

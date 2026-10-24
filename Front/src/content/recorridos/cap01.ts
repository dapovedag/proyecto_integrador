import type { Recorrido } from "../pedagogia";

/** Capítulo 1 · Definición del problema y análisis ético (nb01). */
export const RECORRIDO_01: Recorrido = {
  objetivos: [
    "Explicar qué decisión apoya el modelo: aprobar, enviar a revisión o rechazar una solicitud de crédito.",
    "Calcular los umbrales de decisión a partir del costo de cada tipo de error.",
    "Leer el gráfico de costo esperado y ubicar en él las tres zonas de decisión.",
    "Identificar las variables sensibles y los proxies que pueden producir discriminación.",
    "Interpretar la tasa de impago por sexo, edad y estado civil como línea base de equidad.",
  ],
  conceptos: [
    "clasificacion",
    "variable_objetivo",
    "probabilidad",
    "costo_error",
    "lgd",
    "regla_chow",
    "banda_riesgo",
    "variable_sensible",
  ],
  repaso: [
    {
      pregunta: "¿Por qué el umbral para rechazar no es 0,5?",
      respuesta:
        "Porque los errores no cuestan lo mismo: aprobar a quien no paga cuesta 0,45 y rechazar a quien sí paga, 0,15. Con esos costos y el de revisar (0,08), la regla de Chow fija aprobar si p < 0,1778 y rechazar si p > 0,4667.",
    },
    {
      pregunta: "¿Qué pasa con una solicitud cuya probabilidad de impago es 0,30?",
      respuesta:
        "Cae entre 0,1778 y 0,4667, en la banda Medio, así que va a revisión manual. En esa zona revisar (0,08) cuesta menos que equivocarse de forma automática.",
    },
    {
      pregunta: "¿Por qué el sexo se guarda en los datos si no entra al modelo?",
      respuesta:
        "Solo sirve para auditar: con él se comprueba que el modelo apruebe a hombres y mujeres en proporciones parecidas. En los datos crudos el impago varía 0,5 puntos entre sexos y 8,0 puntos entre grupos de edad, por eso la edad es la que más se vigila.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Un modelo de crédito no solo predice: ayuda a decidir sobre personas. Por eso primero se fija qué decisión apoya, cuánto cuesta cada error y a quién podría perjudicar. Una probabilidad solo es útil si se traduce en una acción con costos explícitos. Además, un modelo puede discriminar aunque no use la variable sensible, a través de otras variables que la reflejan (proxies).",
    practico:
      "El problema se formula como clasificación binaria sobre la columna default. Con los costos del proyecto (0,45, 0,15 y 0,08) se calculan los umbrales 0,1778 y 0,4667, que definen las bandas Bajo, Medio y Alto. Se valida el contrato de datos (10 de 10 chequeos), se guarda la tabla de variables sensibles para el paso 8 y se mide el impago crudo por sexo, edad y estado civil.",
  },
};

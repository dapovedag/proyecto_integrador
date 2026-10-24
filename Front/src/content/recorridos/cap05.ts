import type { Recorrido } from "../pedagogia";

export const RECORRIDO_05: Recorrido = {
  objetivos: [
    "Explicar qué es un modelo clásico y cómo decide cada uno de los cinco: Dummy, regresión logística, árbol de decisión, Random Forest y Gradient Boosting.",
    "Comparar modelos con validación cruzada en train y usar test una sola vez, como examen final.",
    "Leer el AUC, el KS, el Brier y la matriz de confusión de un modelo de riesgo de crédito.",
    "Interpretar los coeficientes de la regresión logística y la importancia por permutación.",
    "Justificar por qué se prefiere el modelo más simple cuando la diferencia de desempeño es mínima.",
  ],
  conceptos: [
    "modelos_clasicos",
    "regresion_logistica",
    "arbol_decision",
    "validacion_cruzada",
    "roc_auc",
    "ks",
    "brier",
    "matriz_confusion",
  ],
  repaso: [
    {
      pregunta: "¿Por qué se elige el modelo con validación cruzada en train y no con test?",
      respuesta:
        "Porque test es el examen final: si se usara para elegir, el modelo quedaría ajustado a ese examen y su nota sería optimista. La validación cruzada entrena y califica cada modelo 5 veces dentro de train, cada vez con una partición distinta; la elección se congela ahí y test se usa una sola vez para confirmar.",
    },
    {
      pregunta: "¿Qué mide cada una de estas cifras de la regresión logística en test: AUC 0,846, KS 0,545 y Brier 0,149?",
      respuesta:
        "El AUC mide si el modelo ordena bien a los clientes: es la probabilidad de que un cliente que no pagó reciba más riesgo que uno que sí pagó (0,5 es azar, como el Dummy). El KS es la mayor separación entre los puntajes de buenos y malos pagadores (0 significa ninguna separación). El Brier es el error promedio al cuadrado de las probabilidades: cuanto más bajo, más se parecen a lo que realmente pasó (la línea base obtiene 0,229).",
    },
    {
      pregunta: "El Random Forest quedó a solo 0,005 de AUC de la regresión logística en validación cruzada. ¿Por qué se prefiere la logística?",
      respuesta:
        "Porque esa diferencia es del tamaño de la variación normal entre particiones (desviación de 0,005): es un empate práctico. Ante un empate gana el modelo más simple: la regresión logística entrena en menos de un segundo, se explica con un coeficiente por variable y es más fácil de auditar, algo que en crédito es un requisito.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Un modelo clásico aprende una regla a partir de ejemplos: la regresión logística suma las variables con pesos, un árbol hace preguntas en cadena, el Random Forest promedia muchos árboles y el Gradient Boosting encadena árboles que corrigen los errores de los anteriores. Para compararlos de forma justa, todos pasan por el mismo pipeline, se eligen con validación cruzada en train y se examinan una sola vez en test. El AUC y el KS miden si el modelo ordena bien a los clientes por riesgo, el Brier si sus probabilidades son realistas y la matriz de confusión qué errores comete con un umbral dado.",
    practico:
      "Con estos datos gana la regresión logística: AUC 0,858 en validación cruzada y 0,846 en test, frente a 0,50 de la línea base; además entrena en menos de un segundo y se explica con un coeficiente por variable. El Random Forest queda prácticamente empatado, y el boosting y el árbol quedan por debajo; ante un empate se elige el modelo más simple. Cuatro variables financieras explican casi todo: puntaje de buró, deuda/ingreso, uso del cupo y moras. Con el umbral de costo 0,25, la logística detecta el 84,5 % de los impagos.",
  },
};

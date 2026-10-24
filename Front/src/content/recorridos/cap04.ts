import type { Recorrido } from "../pedagogia";

export const RECORRIDO_04: Recorrido = {
  objetivos: [
    "Describir cada variable con estadísticos, histogramas y tablas de frecuencias, y reconocer asimetrías y valores extremos.",
    "Manipular datos con pandas (filtrar, seleccionar, crear columnas, agrupar, ordenar y unir tablas) y traducir cada verbo de dplyr a Python.",
    "Construir gráficos con Matplotlib, Seaborn y plotnine para comparar a quienes pagan con quienes no, por variable y por segmento.",
    "Leer un mapa de calor de correlaciones y elegir entre Pearson, Spearman o la V de Cramér según el tipo de variable.",
    "Tratar atípicos con capping p1–p99 sin perder filas, reescalar variables e interpretar un PCA a partir de su scree plot, su proyección 2D y sus loadings.",
  ],
  conceptos: ["groupby", "plotnine", "heatmap", "correlacion", "cramer", "capping", "escalado", "pca"],
  repaso: [
    {
      pregunta: "En el mapa de calor de Spearman, el puntaje de buró tiene −0,53 con default. ¿Cómo se lee ese número?",
      respuesta:
        "El signo indica la dirección y el tamaño, la fuerza. Negativo significa que van en sentidos opuestos: cuanto más alto el buró, menor tiende a ser el impago. Una correlación va de −1 a 1 y 0 es ninguna relación, así que −0,53 es una asociación clara, la más fuerte del dataset. En el mapa, ese valor se ve como una celda azul bien marcada (azul = negativa, rojo = positiva); las celdas casi blancas son pares de variables sin relación.",
    },
    {
      pregunta: "¿Por qué se recortaron los atípicos con capping p1–p99 en lugar de eliminar las filas?",
      respuesta:
        "Porque eliminar las filas con algún atípico habría borrado 2.286 clientes, el 23,8 % de train, y esos clientes tenían casi la misma tasa de impago que el resto (36,1 % frente a 35,4 %): no eran errores. El capping conserva todas las filas, solo lleva los extremos al p1 o al p99 y usa límites aprendidos en train, de modo que test no influye y la API trata igual a un cliente nuevo.",
    },
    {
      pregunta: "En el PCA, PC1 explica más varianza que PC2. ¿Por qué es PC2 la que separa a quienes pagan de quienes no?",
      respuesta:
        "Porque el PCA busca las direcciones de mayor variación, no las que mejor predicen. Según sus loadings, PC1 resume el tamaño del crédito (monto y cuota), que casi no se relaciona con el impago (AUC 0,55), mientras que PC2 resume el comportamiento crediticio (buró, moras y uso del cupo) y separa las clases con AUC 0,827. Por eso se mantienen las variables originales, más fáciles de explicar.",
    },
  ],
  aprendizaje: {
    conceptual:
      "El análisis exploratorio no es una galería de gráficos: es un método para formular hipótesis. Se avanza de una variable a la vez a pares y luego a combinaciones, y así se descubre que el riesgo se acumula: un desempleado con moras y buró menor a 600 llega a 90,3 % de impago, y un empleado sin moras con buró mayor a 800 se queda en 4,8 %. Cada medida tiene su uso: Spearman resiste a los atípicos, la V de Cramér sirve para categorías y el PCA resume variación, que no es lo mismo que capacidad de predecir.",
    practico:
      "Con pandas se filtra, agrupa, une y reforma una tabla con la misma lógica de los verbos de dplyr, y con DuckDB se consulta en SQL sin salir de Python. Los hallazgos se grafican con Matplotlib, Seaborn y plotnine. Los atípicos se recortan con el Winsorizer del proyecto, ajustado solo en train, sin eliminar ninguna fila. El capítulo cierra con un ranking que deja 22 variables listas para el modelo en ranking_variables.csv.",
  },
};

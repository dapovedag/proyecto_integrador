import type { Recorrido } from "../pedagogia";

/** Capítulo 2 · Exploración y análisis preliminar (nb02). */
export const RECORRIDO_02: Recorrido = {
  objetivos: [
    "Explicar qué es importar una librería y qué es un DataFrame, y cargar un archivo CSV con pandas.",
    "Inspeccionar una tabla con shape, info, describe y nunique para detectar nulos, duplicados y valores imposibles.",
    "Seleccionar, filtrar, ordenar y agrupar datos con pandas y con SQL en DuckDB, y comprobar que ambos dan lo mismo.",
    "Leer un histograma, un diagrama de dispersión y un boxplot, y decir qué muestra cada uno sobre una variable.",
    "Identificar qué variables separan a quienes pagan de quienes incumplen.",
  ],
  conceptos: ["libreria", "importar", "dataframe", "filtrado", "sql", "histograma", "dispersion", "boxplot"],
  repaso: [
    {
      pregunta: "¿Qué es un DataFrame y qué hace la línea import pandas as pd?",
      respuesta:
        "Un DataFrame es una tabla de pandas con filas (aquí, clientes) y columnas (variables); df tiene 12.144 filas y 21 columnas. import pandas as pd carga la librería y le da el apodo pd, y va al inicio porque una librería se importa antes de usarla.",
    },
    {
      pregunta: "En el histograma del monto del crédito, la media (19,6 millones) supera a la mediana (12,2 millones). ¿Qué indica eso?",
      respuesta:
        "Que la distribución tiene una cola larga hacia la derecha: unos pocos créditos muy grandes suben el promedio. En esos casos la mediana describe mejor al cliente típico.",
    },
    {
      pregunta: "¿Qué compara un boxplot, qué muestra un diagrama de dispersión y qué dijeron ambos del puntaje de buró?",
      respuesta:
        "El boxplot compara la distribución de una variable entre grupos: la mediana del buró es 756 en quienes pagaron y 628 en quienes incumplieron. La dispersión cruza dos variables punto a punto: con buró menor que 600 y uso del cupo mayor que 0,7, el impago llega al 89,0 % en la muestra.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Explorar es preguntarle a los datos antes de modelarlos: qué tipo tiene cada columna, cuántos valores faltan, si hay duplicados o valores imposibles y qué tan frecuente es el impago (35,63 %). Cada gráfico responde una pregunta distinta: el histograma, cómo se reparte una variable; la dispersión, si dos variables se mueven juntas; y el boxplot, cómo cambia una variable entre grupos. El objetivo es separar lo que solo describe a los clientes de lo que distingue a quien paga de quien no.",
    practico:
      "Se importan pandas, NumPy, Matplotlib, Seaborn y DuckDB, se carga el CSV en un DataFrame y se inspecciona con head, info, describe y nunique. La selección, el filtrado, el orden y la agregación se hacen en pandas y en SQL con DuckDB, y las 11 comparaciones dan el mismo resultado. Los gráficos señalan como variables prometedoras el puntaje de buró, el uso del cupo, las moras previas, la relación deuda/ingreso y la situación laboral.",
  },
};

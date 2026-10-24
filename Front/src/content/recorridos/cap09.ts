import type { Recorrido } from "../pedagogia";

export const RECORRIDO_09: Recorrido = {
  objetivos: [
    "Explicar qué es big data y por qué Spark reparte un DataFrame en particiones que se procesan en paralelo.",
    "Distinguir una transformación (filter, withColumn, groupBy) de una acción (count, write, toPandas) y saber cuándo Spark ejecuta de verdad el trabajo.",
    "Guardar datos en Parquet particionado y explicar por qué una consulta por segmento solo lee su carpeta.",
    "Entrenar y evaluar una regresión logística con MLlib y compararla con scikit-learn sobre el mismo test.",
    "Reconocer que el mismo código corre en un portátil o en un clúster, y cuándo conviene dar ese paso.",
  ],
  conceptos: ["big_data", "spark", "pyspark", "particion", "groupby", "sql", "parquet", "mllib"],
  repaso: [
    {
      pregunta: "¿Qué es una partición en Spark y por qué permite distribuir el análisis?",
      respuesta:
        "Es un trozo del DataFrame. Spark reparte los datos en particiones y cada núcleo, o cada máquina de un clúster, procesa la suya al mismo tiempo. Por eso el mismo código escala: aquí corrió en local[*] con 8 núcleos, y en un clúster basta con lanzarlo con spark-submit --master yarn.",
    },
    {
      pregunta: "Si una celda solo usa filter y withColumn, ¿por qué termina casi al instante?",
      respuesta:
        "Porque son transformaciones perezosas: Spark solo anota el plan. El trabajo real ocurre cuando llega una acción, como count, write o toPandas, y esperar hasta ese momento le permite optimizar el plan completo antes de ejecutarlo.",
    },
    {
      pregunta: "¿Spark MLlib mejoró el modelo frente a scikit-learn?",
      respuesta:
        "No, y no lo buscaba: es la misma regresión logística en otro motor. MLlib obtuvo AUC 0,8441 y scikit-learn 0,8459 sobre las mismas 2.400 solicitudes de test, con probabilidades casi idénticas (correlación 0,995). Lo que aporta Spark es escala: el mismo código procesa datos que no caben en una sola máquina.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Big data es trabajar con datos que no caben, o no se procesan a tiempo, en una sola máquina. Spark los reparte en particiones que se procesan en paralelo; las transformaciones solo arman un plan y las acciones lo ejecutan. Parquet guarda los datos por columnas y en carpetas por partición, de modo que cada consulta lee solo lo que necesita.",
    practico:
      "Con PySpark en Docker se repitió el flujo del proyecto: lectura con esquema explícito (12.144 filas, 12.000 tras limpiar), agregaciones con groupBy().agg() y Spark SQL, y Parquet particionado en 6 carpetas por propósito. Un Pipeline de MLlib logró AUC 0,8441 frente a 0,8459 de scikit-learn en el mismo test. El scoring por lotes puntuó las 12.000 solicitudes en 1,9 s y dejó en cada fila la versión del modelo.",
  },
};

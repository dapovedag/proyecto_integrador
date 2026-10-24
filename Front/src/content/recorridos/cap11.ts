import type { Recorrido } from "../pedagogia";

/** Capítulo 11 · Notebook integrador y comunicación de resultados (nb00). */
export const RECORRIDO_11: Recorrido = {
  objetivos: [
    "Recorrer las cinco fases del proyecto, de F1 a F5, en un solo notebook.",
    "Explicar por qué el notebook importa el paquete credit_risk en lugar de copiar código.",
    "Comparar los modelos del proyecto con las mismas métricas sobre el mismo conjunto de prueba.",
    "Predecir la probabilidad de impago de un cliente con predecir_cliente y leer su decisión.",
    "Verificar que la API responde lo mismo que el notebook para el mismo cliente.",
  ],
  conceptos: ["notebook", "paquete", "crisp_dm", "modelo", "roc_auc", "regla_chow", "api_rest", "trazabilidad"],
  repaso: [
    {
      pregunta: "¿Por qué el notebook integrador no vuelve a entrenar el modelo?",
      respuesta:
        "Porque carga los artefactos que ya dejó el entrenamiento: el mismo modelo v2.0.0 que sirve la API. Así, lo que se muestra en el notebook es exactamente lo que recibe un usuario.",
    },
    {
      pregunta: "¿Qué decisión recibe cada uno de los tres clientes de demostración?",
      respuesta:
        "El de riesgo bajo (1,06 %) se aprueba, el medio (33,15 %) va a revisión y el alto (99,69 %) se rechaza. En los tres, el factor que más pesó fue el puntaje de buró.",
    },
    {
      pregunta: "¿Por qué se sirve la regresión logística si el modelo combinado tuvo un AUC un poco mayor?",
      respuesta:
        "La diferencia en test es mínima (0,8471 frente a 0,8459) y la elección no fue solo por AUC: también contaron el costo esperado, la equidad, la calibración y la interpretabilidad. La regresión logística calibrada explica cada decisión con contribuciones exactas.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Integrar es que un solo notebook recorra todo el proceso, del problema al despliegue, con el mismo paquete que usa el resto del proyecto y sin copiar lógica. Comunicar es que cada cifra tenga su fuente: el resumen se escribe con código a partir de la corrida real. Así el notebook, la API y este sitio cuentan la misma historia.",
    practico:
      "El notebook 00 valida los datos (12.144 filas, 35,63 % de impago), explora el impago por decil de buró con DuckDB, compara 15 modelos en test y muestra las decisiones y la equidad del modelo servido v2.0.0 (AUC 0,8456). Luego predice tres clientes con predecir_cliente y llama a la API en el mismo proceso con TestClient, que responde lo mismo para el cliente intermedio: revisar.",
  },
};

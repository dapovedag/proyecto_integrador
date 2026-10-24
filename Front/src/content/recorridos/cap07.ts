import type { Recorrido } from "../pedagogia";

export const RECORRIDO_07: Recorrido = {
  objetivos: [
    "Explicar qué es el NLP y cómo un texto se convierte en números: tokens, TF-IDF y embeddings.",
    "Distinguir lo que hacen BERT, sentence-transformers y GPT-2 con el texto de una solicitud.",
    "Medir el sentimiento de un texto con BERT y relacionarlo con la tasa de impago.",
    "Medir el aporte del texto a un modelo tabular con el ΔAUC, el bootstrap y un intervalo de confianza.",
    "Explicar por qué la decisión de crédito usa el modelo tabular.",
  ],
  conceptos: ["nlp", "tokenizacion", "tfidf", "embedding", "bert", "gpt2", "bootstrap", "intervalo_confianza"],
  repaso: [
    {
      pregunta: "¿Qué diferencia hay entre TF-IDF y un embedding?",
      respuesta:
        "TF-IDF cuenta palabras: cada texto se vuelve un vector con un peso por palabra, alto si la palabra es frecuente en ese texto y poco común en los demás; es rápido e interpretable, pero no entiende el contexto. Un embedding lo produce un modelo preentrenado: es un vector denso (384 números en sentence-transformers, 768 en GPT-2) donde los textos de significado parecido quedan cerca. Aquí TF-IDF fue el mejor modelo de solo texto (AUC CV 0,641) y el más rápido (0,21 ms por texto).",
    },
    {
      pregunta: "¿Qué dice el sentimiento de BERT sobre el impago?",
      respuesta:
        "BERT, afinado con reseñas de productos, puntúa el tono de 1 a 5 estrellas. Los textos de tono más negativo (niveles 2 y 3) tienen 43,2 % y 44,4 % de impago, frente a 31,9 % en el nivel 4. Pero el puntaje por sí solo ordena poco el riesgo (AUC 0,568), porque el modelo viene de otro dominio.",
    },
    {
      pregunta: "¿Cómo se midió si el texto mejora al modelo tabular y qué se decidió?",
      respuesta:
        "Se comparó el AUC en test del modelo combinado (tabular + sentimiento + 10 componentes de los embeddings) con el del tabular: ΔAUC = +0,0012. Con bootstrap se remuestrearon las filas de test 1.000 veces para obtener un intervalo de confianza del 95 %, de −0,0003 a +0,0028, que incluye el 0. El texto no mejora lo que ya capta el modelo tabular; por eso la decisión usa el modelo tabular y el texto se sirve como análisis complementario.",
    },
  ],
  aprendizaje: {
    conceptual:
      "El NLP convierte texto en números para que un modelo pueda usarlo. Hay tres caminos: contar palabras (tokens y TF-IDF), usar un modelo afinado para una tarea (BERT de sentimiento da un puntaje con significado) o usar embeddings, vectores donde los textos parecidos quedan cerca. Un modelo más grande no garantiza mejores vectores: sentence-transformers separó mejor que GPT-2 con la mitad de dimensiones. Y el aporte de una fuente nueva se mide con un intervalo de confianza, no con una sola cifra.",
    practico:
      "Solo con texto, el riesgo se ordena de forma modesta: TF-IDF + LR logra AUC 0,641 en test, frente a 0,846 del modelo tabular. Al sumar el texto al modelo tabular, el AUC pasa de 0,8459 a 0,8471 (ΔAUC +0,0012, IC 95 % de −0,0003 a +0,0028, que incluye el 0). El texto no mejora lo que ya capta el modelo tabular; por eso la decisión usa el modelo tabular y el modelo de texto se sirve como análisis complementario en /predict/text. Procesar solo los 4.454 textos únicos y guardarlos en caché evita repetir el cálculo costoso de los transformers.",
  },
};

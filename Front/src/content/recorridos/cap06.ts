import type { Recorrido } from "../pedagogia";

export const RECORRIDO_06: Recorrido = {
  objetivos: [
    "Explicar qué es una red neuronal y en qué se diferencian un MLP, una CNN 1D y una GRU.",
    "Leer las curvas de aprendizaje (pérdida y AUC por época) para detectar el sobreajuste.",
    "Describir cómo early stopping y dropout controlan el sobreajuste.",
    "Comparar redes y modelos clásicos con las mismas métricas, el mismo test y el mismo umbral.",
    "Justificar por qué, en datos tabulares como estos, una red no siempre supera a un modelo clásico.",
  ],
  conceptos: ["red_neuronal", "mlp", "cnn", "rnn_gru", "epoca", "funcion_perdida", "early_stopping", "dropout"],
  repaso: [
    {
      pregunta: "¿Qué es una época y para qué sirve early stopping?",
      respuesta:
        "Una época es una pasada completa de la red por todos los datos de entrenamiento. Al final de cada época se mide el AUC en validación; early stopping detiene el entrenamiento cuando pasan 5 épocas sin mejora y restaura los pesos de la mejor época. En el MLP, por ejemplo, se detuvo en la época 25 y restauró la 20.",
    },
    {
      pregunta: "¿Cómo se reconoce el sobreajuste en las curvas de aprendizaje?",
      respuesta:
        "Cuando la métrica de entrenamiento sigue mejorando mientras la de validación se estanca o empeora: la red empieza a memorizar ejemplos en lugar de aprender reglas generales. En la GRU de texto, el AUC de validación tocó su máximo en la época 4 y luego bajó mientras el de entrenamiento seguía subiendo. Dropout, que apaga neuronas al azar durante el entrenamiento, ayuda a evitarlo.",
    },
    {
      pregunta: "¿Por qué ninguna red superó a la regresión logística?",
      respuesta:
        "Porque en estos datos tabulares (9.600 filas de train y 38 columnas transformadas) un modelo lineal ya capta casi toda la señal. El MLP llegó a AUC 0,842 frente a 0,846 de la logística, tardó unas 30 veces más en entrenar y no se puede explicar con coeficientes. La CNN 1D quedó en 0,771 porque busca patrones entre columnas vecinas, y en una tabla el orden de las columnas no significa nada.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Una red neuronal aprende ajustando miles de pesos, capa por capa, para reducir su función de pérdida en cada época. Cada arquitectura supone algo sobre los datos: el MLP mezcla todas las variables, la CNN 1D busca patrones entre columnas vecinas y la GRU lee secuencias en orden, como las palabras de una frase. Su gran capacidad las hace propensas al sobreajuste, que se ve en las curvas de aprendizaje y se controla con dropout y early stopping.",
    practico:
      "Se entrenaron cuatro redes con TensorFlow y Keras, con una validación separada de train, pesos de clase y early stopping. Ninguna superó a la regresión logística (AUC 0,8459): el MLP llegó a 0,8419 y el híbrido texto + tabular a 0,8399, con 27,8 y 62,2 s de entrenamiento frente a 0,9 s. La red guardada en red_neuronal.keras es el híbrido, la mejor en validación (0,8576). Como las redes no mejoran al modelo lineal y son más difíciles de explicar, el modelo servido sigue siendo clásico.",
  },
};

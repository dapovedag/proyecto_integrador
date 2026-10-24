import type { Recorrido } from "../pedagogia";

/** Capítulo 3 · Limpieza, estructuración y preparación (nb03). */
export const RECORRIDO_03: Recorrido = {
  objetivos: [
    "Detectar y tratar valores faltantes, duplicados y valores imposibles con reglas fijas.",
    "Dividir los datos en entrenamiento y prueba de forma estratificada antes de aprender cualquier estadístico.",
    "Imputar, codificar (One-Hot y ordinal) y escalar variables ajustando todo solo con train.",
    "Crear variables nuevas con sentido de negocio y comprobar si aportan señal.",
    "Seleccionar características con tres criterios y decidir con datos si PCA compensa.",
  ],
  conceptos: ["nulo", "train_test", "fuga_datos", "imputacion", "ingenieria_variables", "one_hot", "escalado", "pca"],
  repaso: [
    {
      pregunta: "¿Por qué se divide en train y test antes de imputar o escalar, y no después?",
      respuesta:
        "Porque una mediana, una media o un codificador calculados con todos los datos incluirían información de test, y la prueba dejaría de ser un examen honesto (fuga de información). Por eso todo se aprende con las 9.600 filas de train y solo se aplica a las 2.400 de test.",
    },
    {
      pregunta: "¿Cuándo se usa One-Hot y cuándo codificación ordinal?",
      respuesta:
        "One-Hot, cuando las categorías no tienen orden, como el propósito del crédito: crea una columna de ceros y unos por categoría. Ordinal, cuando sí lo tienen, como el nivel educativo: asigna de Primaria = 0 a Posgrado = 4 respetando ese orden.",
    },
    {
      pregunta: "¿Por qué se eligió StandardScaler y no MinMaxScaler?",
      respuesta:
        "Con MinMaxScaler, los valores extremos del ingreso y del monto comprimen casi todos los datos cerca de 0 (media 0,036 en el ingreso). StandardScaler deja todas las variables centradas en 0 con desviación 1, la escala natural de la regresión logística, y los extremos se recortan antes con el capping p1-p99.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Preparar datos sigue un orden que no se puede alterar: primero las reglas fijas (quitar duplicados, marcar valores imposibles), luego la división en train y test, y solo entonces todo lo que aprende de los datos, como medianas, codificadores y escaladores, ajustado únicamente con train. Si ese orden se invierte, la información de test se filtra y la evaluación deja de ser confiable. Las categorías se codifican según tengan orden o no, y una reducción como PCA se adopta solo si compensa lo que se pierde en explicabilidad.",
    practico:
      "Del crudo de 12.144 filas se eliminaron 144 duplicados y quedaron 12.000 clientes, divididos en 9.600 de train y 2.400 de test con casi la misma tasa de impago (35,56 % y 35,58 %). Se imputaron 8 columnas con estadísticos de train, se crearon 6 variables nuevas y las 22 variables del modelo se convierten en 38 columnas tras One-Hot, ordinal y StandardScaler. Los tres criterios de selección coinciden en buró, uso del cupo, moras y relación deuda/ingreso; PCA necesita 22 de 38 componentes para el 95 % y no se usa en el modelo. Los archivos finales se guardan con 0 nulos, 0 duplicados y su huella SHA-256.",
  },
};

import type { Recorrido } from "../pedagogia";

/** Capítulo 10 · API REST y despliegue con Docker (sin notebook: Capitulo10, ApiConsole y api_capturas.json). */
export const RECORRIDO_10: Recorrido = {
  objetivos: [
    "Explicar qué es una API REST y por qué permite usar el modelo sin abrir un notebook.",
    "Distinguir los cinco endpoints de la API y para qué sirve cada uno.",
    "Leer una petición POST /predict y su respuesta JSON: probabilidad, decisión, banda y factores principales.",
    "Interpretar un error 422 e identificar qué campo de la solicitud lo causó.",
    "Describir cómo Docker empaqueta la API en una imagen que corre igual en cualquier equipo.",
  ],
  conceptos: ["api_rest", "endpoint", "http", "json", "fastapi", "pydantic", "docker", "contenedor"],
  repaso: [
    {
      pregunta: "¿Qué devuelve POST /predict para el cliente de riesgo medio?",
      respuesta:
        "Un JSON con probabilidad de impago 0,3315, decisión revisar y banda Medio, junto con los factores que más pesaron, encabezados por el puntaje de buró. Es la misma cifra que calcula el notebook integrador.",
    },
    {
      pregunta: "¿Qué significa recibir un código 422?",
      respuesta:
        "Que la solicitud no cumple el contrato de la API y el modelo no llega a ejecutarse. En la captura real, la edad 999 supera el máximo de 100 y el propósito «Viajes» no está entre los permitidos; Pydantic señala cada campo con su motivo.",
    },
    {
      pregunta: "¿Para qué sirve empaquetar la API en Docker?",
      respuesta:
        "Para que corra igual en cualquier equipo: la imagen riesgo-credito-api:2.0.0 trae Python 3.10, las librerías y el modelo. En la prueba real se construyó, el contenedor quedó healthy y respondió /health y /predict.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Desplegar es poner el modelo al servicio de quien no abre un notebook. Una API REST funciona como un contrato: dice qué datos recibe, qué responde y qué error devuelve si algo falta o está fuera de rango. Docker empaqueta ese servicio con todo lo que necesita para que funcione igual en cualquier equipo.",
    practico:
      "La API, hecha con FastAPI, tiene cinco endpoints: /health, /model/info, /predict, /predict/batch y /predict/text. Pydantic valida cada campo y responde 422 con el motivo; /predict devuelve probabilidad, decisión, banda y factores principales. Se probó con pytest y TestClient, y la imagen Docker (653 MB, usuario no-root) se construyó, quedó healthy y respondió /predict. Este sitio reproduce esas respuestas capturadas sin llamar a la API.",
  },
};

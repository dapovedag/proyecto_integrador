# Análisis predictivo de riesgo de crédito

**Proyecto Integrador** · Programación para el análisis de datos · Inteligencia artificial aplicada al análisis de datos

**Sitio del proyecto:** https://proyecto-integrador-five-eosin.vercel.app
- **Recorrido técnico:** un capítulo por entregable, con los notebooks ejecutados y cada concepto explicado.
- **[Presentación Negocio](https://proyecto-integrador-five-eosin.vercel.app/negocio):** el proyecto contado a un comité directivo.
- **[Simulador](https://proyecto-integrador-five-eosin.vercel.app/simulador):** evalúa un cliente con el modelo servido.

---

## El problema

Una institución financiera debe aprobar o rechazar cada solicitud de crédito antes de saber si el cliente pagará. En el histórico de 12.000 solicitantes, el **35,6 % no pagó**. Cada error tiene un costo distinto:
- aprobar a quien no paga hace perder el **45 %** de lo prestado (LGD);
- rechazar a quien sí paga hace perder el **15 %** de margen;
- revisar a mano cuesta el **8 %**, y la capacidad del equipo alcanza para el 35 % de las solicitudes.

El objetivo del enunciado es **estimar la probabilidad de impago** a partir de información financiera y demográfica, integrando análisis exploratorio, programación e inteligencia artificial.

## La solución

Un modelo calibrado estima la probabilidad de impago de cada solicitud. A partir de ella, una política de costos (la regla de Chow) recomienda una de tres acciones:

| Probabilidad de impago | Decisión | Clientes de prueba |
|---|---|---|
| menor que 17,8 % | **Aprobar** | 39,7 % |
| entre 17,8 % y 46,7 % | **Revisar** a mano | 28,8 % |
| mayor que 46,7 % | **Rechazar** | 31,5 % |

Resultados sobre 2.400 clientes que el modelo nunca vio, evaluados una sola vez:

- **AUC 0,846.** El modelo ordena bien el riesgo y su probabilidad está calibrada.
- **Impago entre los aprobados: 9,8 %**, frente al 35,6 % sin modelo.
- **Pérdida esperada: 5,4 % por solicitud**, frente al 16,0 % si se aprobara a todos.
- **Equidad.** La relación de aprobación (disparate impact) es 0,97 por sexo y 0,90 por edad. Las dos cumplen la regla de los cuatro quintos (≥ 0,8). El sexo nunca entra al modelo: solo se usa para auditar.

El modelo servido es una **regresión logística calibrada** con *reweighing* para mitigar la disparidad por edad.
- **Comparación:** se probaron 15 modelos de cuatro familias: clásicos, redes neuronales, modelos de texto y Spark.
- **Elección:** el servido se eligió con validación cruzada solo en train. Con resultados casi iguales a los de modelos más complejos, se prefirió por ser explicable variable por variable.

## Cómo se desarrolló

El trabajo se organizó con **Scrum** (9 sprints y 40 historias de usuario con criterios de aceptación) y **CRISP-DM** (fases F1 a F5). Cada fase dejó un entregable: un notebook ejecutado de principio a fin, con sus salidas, conclusiones y criterio de hecho comprobado por script.

| Fase | Notebook | Qué se hizo |
|---|---|---|
| **F1** · Definir el problema | `01_definicion_problema_etica` | Métricas de negocio, costo de cada error, variables sensibles y análisis ético |
| **F2** · Explorar y preparar | `02_exploracion_preliminar` | Carga, inspección, consultas con pandas y SQL (DuckDB), histogramas, dispersión y boxplots |
| | `03_limpieza_preparacion` | Nulos y duplicados, división train/test **antes** de aprender cualquier estadístico, imputación, variables nuevas, One-Hot y ordinal, escalado y PCA |
| | `04_eda_transformacion_visualizacion` | EDA univariado, bivariado y multivariado; verbos de dplyr y gramática de ggplot2 (plotnine) en Python; correlaciones, atípicos y PCA |
| **F3** · Analizar y modelar | `05_modelos_clasicos` | Línea base, regresión logística, árbol, random forest y gradient boosting con validación cruzada; réplica sobre German Credit (UCI) |
| | `06_red_neuronal` | MLP, CNN 1D, GRU y red híbrida en TensorFlow/Keras, con curvas de aprendizaje |
| | `07_nlp_riesgo` | Texto de la solicitud con TF-IDF, sentimiento con BERT, sentence-transformers y GPT-2; aporte medido con bootstrap |
| **F4** · Evaluar y optimizar | `08_evaluacion_optimizacion` | Selección por validación cruzada, evaluación única en test, calibración, umbrales por costos, equidad, SHAP y estabilidad (PSI) |
| | `09_spark_big_data` | El mismo análisis distribuido con PySpark: Parquet particionado, Spark SQL y MLlib |
| **F5** · Desplegar y comunicar | `00_proyecto_integrador_final` | Notebook integrador: carga el modelo servido, predice clientes de ejemplo y llama a la API |

## Arquitectura

```
Back/                    Python 3.10
├── src/credit_risk/     paquete único con toda la lógica: datos, variables, modelos, equidad, explicación, NLP y redes
├── train.py             entrena el modelo servido y escribe su ficha (model_card.json)
├── notebooks/           los 10 notebooks ejecutados (00–09)
├── api/                 API REST con FastAPI: /predict, /predict/batch, /predict/text, /model/info, /health
└── tests/               pruebas del paquete y de la API

Front/                   Vite + React + TypeScript, 100 % estático
├── src/capitulos/       un capítulo por entregable
├── src/features/        reproductor de notebooks, simulador, consola de la API, explorador de datos y Spark
└── src/content/         glosario, guías de lectura de gráficos y explicación de cada celda de código

db/                      dataset (21 columnas) y su generador reproducible
docs/                    enunciado, plan, contrato de datos, arquitectura, despliegue, informe y gestión del proyecto
```

- **Una sola fuente de verdad.** `train.py` produce el modelo que usan la API, el notebook integrador y el sitio. Ningún componente reimplementa la lógica.
- **Despliegue.** La API se empaqueta en una imagen Docker y PySpark corre en Docker. El sitio se publica en Vercel con cada cambio en `main`.
- **Sitio autónomo.** El sitio no llama al back: reproduce la corrida real a partir de un paquete exportado con sus huellas SHA-256. El simulador calcula la probabilidad en el navegador con un port exacto del modelo, que coincide con Python con una diferencia menor a una millonésima.
- **Pedagogía.** Cada capítulo explica los conceptos que usa, cómo leer cada gráfico y qué hace cada celda de código, para que pueda seguirlo alguien que empieza desde cero.

## Trazabilidad con el enunciado

Los **47 requisitos** del enunciado están acreditados: el producto final, los cinco elementos, las cinco fases, los cuatro resultados y los entregables de las cinco unidades.

Un requisito cuenta como cumplido solo si se dan tres condiciones:
- sus historias de usuario están en *Hecho*;
- su evidencia existe en el repositorio;
- sus notebooks cumplen la definición de hecho.

El estado se calcula desde el backlog; ninguna casilla se marca a mano. La matriz completa está en [`docs/gestion/trazabilidad.md`](docs/gestion/trazabilidad.md) y en la página [Trazabilidad](https://proyecto-integrador-five-eosin.vercel.app/trazabilidad).

## Documentación

| Documento | Contenido |
|---|---|
| [Enunciado](docs/01_enunciado.md) | Requisitos del proyecto integrador con su identificador |
| [Plan paso a paso](docs/02_plan_paso_a_paso.md) | Pasos 0 a 12 con su criterio de hecho |
| [Contrato de datos](docs/03_contrato_datos.md) · [Diccionario](docs/diccionario_datos.md) | Reglas del dataset y descripción de sus columnas |
| [Arquitectura](docs/04_arquitectura_backend.md) | Pipeline del modelo y contrato de la API |
| [Despliegue](docs/05_despliegue.md) | Docker, sitio estático y operación del modelo |
| [Informe de resultados](docs/06_informe_resultados.md) | Resumen ejecutivo para un público no técnico |
| [Gestión](docs/gestion/) | Backlog, sprints, definición de hecho y de listo, decisiones de arquitectura (ADR), riesgos y lecciones aprendidas |

## Reproducir

Los pasos para preparar el entorno, entrenar el modelo, ejecutar los notebooks y levantar la API están en [`Back/README.md`](Back/README.md).

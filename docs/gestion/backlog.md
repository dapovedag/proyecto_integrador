<!-- Archivo generado por Back/scripts/generar_evidencia.py desde docs/gestion/backlog.yaml. No editar a mano. -->

# Backlog del producto

> Fuente única: [`backlog.yaml`](backlog.yaml). Este archivo se regenera con `python Back/scripts/generar_evidencia.py`.
> Una historia solo pasa a **Hecho** si cumple la [definición de hecho](definicion_de_hecho.md); entra a un sprint solo si cumple la [definición de listo](definicion_de_listo.md).

## Resumen por estado

| Estado | Historias | Puntos |
|---|---|---|
| Pendiente | 1 | 3 |
| En progreso | 0 | 0 |
| En revisión | 0 | 0 |
| Hecho | 36 | 182 |
| **Total** | **37** | **185** |

## Puntos por sprint

| Sprint | Fechas | Objetivo | Historias | Comprometidos | Hechos (acreditados) |
|---|---|---|---|---|---|
| S1 · Problema y datos entendidos (MVP) | 2026-10-09 → 2026-10-16 | Problema definido y datos explorados. | HU-00, HU-01, HU-02 | no estimado | no estimado |
| S2 · Datos listos (MVP) | 2026-10-09 → 2026-10-16 | Datos limpios y EDA avanzado. | HU-03, HU-04 | no estimado | no estimado |
| S3 · Modelado (MVP) | 2026-10-09 → 2026-10-16 | Modelos clásicos, redes, NLP y evaluación. | HU-05, HU-06, HU-07, HU-08 | no estimado | no estimado |
| S4 · Despliegue (MVP) | 2026-10-09 → 2026-10-16 | Spark, API, integrador y ejecución local. | HU-09, HU-10, HU-11, HU-12 | no estimado | no estimado |
| S5 · Fundaciones | 2026-10-23 → 2026-10-23 | Entorno probado y un único paquete credit_risk con tests, DoD automatizada y gestión verificable (backlog único, DoR, DoD multinivel, ADRs, trazabilidad calculada). | HU-00, HU-13, HU-14, HU-15, HU-16, HU-31, HU-32 | 30 | 30 |
| S6 · Datos y modelado | 2026-10-23 → 2026-10-23 | Notebooks 01–07 y 09 reescritos sobre credit_risk y ejecutados con papermill (kernel credit-risk), con sus artefactos y conclusiones redactadas después de ver las salidas. | HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07, HU-09, HU-17, HU-33, HU-34, HU-35 | 57 | 57 |
| S7 · Modelo v2.0.0 | 2026-10-23 → 2026-10-23 | Modelo v2.0.0 seleccionado sin fuga, calibrado, con política aprobar/revisar/rechazar, equidad evaluada y servido por la API v2 en Docker; paquete de corrida exportado. | HU-08, HU-10, HU-18, HU-19, HU-20, HU-21, HU-22, HU-23 | 48 | 48 |
| S8 · Producto y comunicación | 2026-10-23 → 2026-10-23 | Front estático autónomo con un capítulo por entregable y motor exacto, documentación coherente con v2.0.0 y checklist del enunciado acreditado por cálculo. | HU-11, HU-12, HU-24, HU-25, HU-26, HU-27, HU-28, HU-29, HU-30 | 47 | 47 |

S1–S4 son el MVP: sus historias se listan por `sprint_mvp` y no se estimaron. Al reabrirse en v2 se re-estimaron y se comprometieron en S5–S8.

## Épicas

| ID | Épica | Objetivo | Historias | Puntos |
|---|---|---|---|---|
| E-01 | Gestión ágil y gobierno del proyecto | Scrum aplicado de verdad, con artefactos verificables y trazabilidad calculada. | HU-00, HU-15, HU-16, HU-30, HU-31 | 17 |
| E-02 | Comprensión del negocio y ética (F1) | Problema de impago formulado con métricas de negocio y riesgos éticos explícitos. | HU-01 | 3 |
| E-03 | Datos (F2) | Datos explorados, validados y preparados con un pipeline único y sin fuga. | HU-02, HU-03, HU-04, HU-33, HU-34, HU-35 | 25 |
| E-04 | Modelado (F3) | Modelos clásicos, redes neuronales y NLP entrenados y comparados con evidencia ejecutada. | HU-05, HU-06, HU-07, HU-36 | 24 |
| E-05 | Evaluación, política de decisión y equidad (F4) | Un modelo v2.0.0 seleccionado sin usar test, calibrado, con costos explícitos y auditado en equidad. | HU-08, HU-18, HU-19, HU-20, HU-21 | 32 |
| E-06 | Big Data | Procesamiento y modelado con PySpark real. | HU-09 | 5 |
| E-07 | Despliegue del modelo (F5) | API REST del modelo servido, en Docker, reproducible desde un clon limpio. | HU-10, HU-12, HU-22 | 11 |
| E-08 | Integración y comunicación (F5) | Notebook integrador, informe y documentación coherentes con v2.0.0. | HU-11, HU-23, HU-29 | 18 |
| E-09 | Plataforma y calidad | Paquete instalable como fuente única, tests, gate de calidad y ejecución reproducible. | HU-13, HU-14, HU-17, HU-32 | 19 |
| E-10 | Front estático autónomo | Sitio estático que muestra los resultados reales y simula la corrida con fidelidad, sin back. | HU-24, HU-25, HU-26, HU-27, HU-28 | 31 |

## Historias

| ID | Épica | Historia | Pts | Sprint (MVP) | Estado | Paso | IDs enunciado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| HU-00 | E-01 | Como equipo del proyecto, quiero un backlog único, sprints con objetivo, DoR y DoD verificables, ADRs y retrospectivas, para gestionar el proyecto con Scrum y poder demostrarlo con evidencia. | 5 | S5 (S1) | Hecho | 0 | E1, R3 | 6/6 |
| HU-01 | E-02 | Como analista de crédito, quiero el problema de impago definido con métricas de negocio y riesgos éticos, para confiar en el uso del modelo y conocer sus límites. | 3 | S6 (S1) | Hecho | 1 | IA1.1, IA1.3, E5, F1 | 2/2 |
| HU-02 | E-03 | Como científico de datos, quiero explorar el dataset con el entorno, las librerías y operaciones básicas, para entender su estructura y calidad antes de prepararlo. | 3 | S6 (S1) | Hecho | 2 | P1.1, P1.2, P1.3, P1.4, P1.5, P1.E1, P1.E2, P1.E3, P1.E4, E3 | 3/3 |
| HU-03 | E-03 | Como científico de datos, quiero limpiar y preparar los datos con el pipeline del paquete, para entrenar sin fuga y con las mismas transformaciones que se sirven. | 5 | S6 (S2) | Hecho | 3 | P2.1, P2.2, P2.3, P2.4, P2.5, P2.6, P2.E1, P2.E2, P2.E3, P2.E4, F2 | 6/6 |
| HU-04 | E-03 | Como analista de crédito, quiero ver los patrones, correlaciones y variables que más influyen en el impago, para entender los factores de riesgo. | 8 | S6 (S2) | Hecho | 4 | IA1.2, IA1.E1, IA1.E2, IA2.2, IA2.4, IA2.5, IA2.E1, IA2.E2, F2, R2 | 2/2 |
| HU-05 | E-04 | Como científico de datos, quiero entrenar y comparar modelos clásicos con validación cruzada en train, para tener una referencia sólida y una selección sin fuga. | 5 | S6 (S3) | Hecho | 5 | F3, IA3.3, R2 | 2/2 |
| HU-06 | E-04 | Como científico de datos, quiero entrenar una CNN 1D y una RNN (GRU) en TensorFlow/Keras, para comparar Deep Learning con los modelos clásicos. | 8 | S6 (S3) | Hecho | 6 | IA3.2, IA3.E2, IA3.3, F3, R2 | 4/4 |
| HU-07 | E-04 | Como analista de crédito, quiero que el texto de la solicitud aporte a la evaluación del riesgo, para aprovechar la información no estructurada. | 8 | S6 (S3) | Hecho | 7 | IA3.1, IA3.E1, F3, R2 | 5/5 |
| HU-08 | E-05 | Como analista de crédito, quiero un modelo final calibrado, con umbrales justificados por costo y auditado en equidad, para tomar decisiones justas, explicables y confiables. | 8 | S7 (S3) | Hecho | 8 | F4, IA1.3, IA3.3, R1 | 5/5 |
| HU-09 | E-06 | Como científico de datos, quiero procesar y modelar los datos con PySpark, para demostrar que la solución escala a grandes volúmenes. | 5 | S6 (S4) | Hecho | 9 | IA3.6 | 3/3 |
| HU-10 | E-07 | Como sistema de originación del banco, quiero consumir el modelo servido por una API REST, para integrar la decisión aprobar/revisar/rechazar en el proceso de crédito. | 5 | S7 (S4) | Hecho | 10 | IA3.4, IA3.E3, R4, F5 | 5/5 |
| HU-11 | E-08 | Como docente evaluador, quiero un notebook final integrador y un informe ejecutivo, para evaluar el proyecto completo en un solo recorrido. | 5 | S8 (S4) | Hecho | 11 | PF1, E2, E4, F5 | 3/3 |
| HU-12 | E-07 | Como equipo del proyecto, quiero lanzar todo en local con comandos documentados desde un clon limpio, para demostrar que la solución funciona sin pasos ocultos. | 3 | S8 (S4) | Hecho | 12 | R1, R4 | 2/2 |
| HU-13 | E-09 | Como científico de datos, quiero un único paquete instalable credit_risk con toda la lógica, para que notebooks, train.py, API y exportador usen exactamente el mismo código. | 8 | S5 | Hecho | 3 | E2, R1 | 8/8 |
| HU-14 | E-09 | Como científico de datos, quiero probar el entorno (TensorFlow, torch, PySpark en Docker) antes de escribir notebooks, para no descubrir bloqueos de dependencias al final del sprint. | 3 | S5 | Hecho | 2 | P1.1, P1.2 | 5/5 |
| HU-15 | E-01 | Como equipo del proyecto, quiero que la DoD de los notebooks se verifique con un script, para no volver a declarar Hecho algo que no se ejecutó. | 3 | S5 | Hecho | 0 | E1, R3 | 2/2 |
| HU-16 | E-01 | Como docente evaluador, quiero una matriz de trazabilidad y un checklist del enunciado calculados, no marcados a mano, para verificar cada ID del enunciado contra su evidencia. | 3 | S5 | Hecho | 0 | E1, R3 | 4/4 |
| HU-17 | E-09 | Como científico de datos, quiero ejecutar los notebooks con papermill, kernel credit-risk y una cola con lock, para obtener salidas reales y tiempos medidos sin saturar la máquina. | 3 | S6 | Hecho | 2 | P1.1, E2 | 2/2 |
| HU-18 | E-05 | Como analista de crédito, quiero una decisión aprobar/revisar/rechazar derivada de costos explícitos (regla de Chow), para que las bandas de riesgo y la acción coincidan y no dependan del modelo. | 5 | S7 | Hecho | 8 | F4, R1, R4 | 4/4 |
| HU-19 | E-05 | Como científico de datos, quiero seleccionar el modelo v2.0.0 por CV en train y evaluar en test una sola vez, para publicar métricas de test no sesgadas y una sola fuente de verdad. | 8 | S7 | Hecho | 8 | F4, R1, IA3.3 | 4/4 |
| HU-20 | E-05 | Como oficial de cumplimiento, quiero medir y mitigar la disparidad por sexo y edad sobre la aprobación automática, para que el modelo no discrimine y la decisión quede razonada. | 8 | S7 | Hecho | 8 | IA1.3, F4 | 4/4 |
| HU-21 | E-05 | Como analista de riesgo de modelos, quiero el PSI por variable y del score entre train y test, para detectar deriva y saber cuándo recalibrar. | 3 | S7 | Hecho | 8 | R4 | 2/2 |
| HU-22 | E-07 | Como equipo de operaciones, quiero la API v2 en una imagen Docker probada, para desplegarla igual en local y en la nube. | 3 | S7 | Hecho | 10 | IA3.5, R4 | 5/5 |
| HU-23 | E-08 | Como equipo del front, quiero un paquete de corrida exportado desde la ejecución real del back, para que el front muestre solo resultados reales, con hashes verificables. | 8 | S7 | Hecho | 11 | F5, E4 | 3/3 |
| HU-24 | E-10 | Como visitante del sitio, quiero que el simulador calcule en el navegador con el mismo modelo que sirve la API, para probar clientes sin depender del back. | 8 | S8 | Hecho | 11 | R1, R4, F5 | 3/3 |
| HU-25 | E-10 | Como docente evaluador, quiero reproducir cada notebook ejecutado celda a celda en el sitio, para revisar la evidencia sin instalar nada. | 5 | S8 | Hecho | 11 | PF1, F5 | 1/1 |
| HU-26 | E-10 | Como docente evaluador, quiero un capítulo por entregable con actividades, notebook, visualizaciones, aprendizaje y criterio de hecho, para recorrer el proyecto paso a paso con su evidencia. | 8 | S8 | Hecho | 11 | F5, E4, E1 | 3/3 |
| HU-27 | E-10 | Como integrador del banco, quiero ver la API reproducida (Swagger, capturas reales y consola de prueba), para entender el contrato REST sin levantar el servidor. | 5 | S8 | Hecho | 10 | IA3.4, IA3.E3, F5 | 2/2 |
| HU-28 | E-10 | Como equipo del proyecto, quiero que el sitio funcione con el back apagado y no haga peticiones fuera de sus estáticos, para desplegarlo como estático en Vercel sin riesgo ni dependencias. | 5 | S8 | Hecho | 12 | R4, F5 | 4/4 |
| HU-29 | E-08 | Como docente evaluador, quiero documentación coherente con el modelo v2.0.0, para que ningún documento contradiga lo servido. | 5 | S8 | Hecho | 11 | E2, F5, R3 | 6/6 |
| HU-30 | E-01 | Como equipo del proyecto, quiero lecciones aprendidas y el aprendizaje por unidad documentados, para convertir los errores del MVP en controles y mostrar qué aporta cada unidad. | 3 | S8 | Hecho | 0 | E1, R3, E4 | 2/2 |
| HU-31 | E-01 | Como docente evaluador, quiero las decisiones de arquitectura documentadas como ADR, para entender por qué se eligió cada alternativa y cómo se verifica. | 3 | S5 | Hecho | 0 | R3, E1 | 6/6 |
| HU-32 | E-09 | Como equipo del proyecto, quiero un gate de calidad local en un solo comando, para no integrar nada que rompa lint, tipos, tests, DoD o build. | 5 | S5 | Hecho | 0 | R3, R1 | 2/2 |
| HU-33 | E-03 | Como científico de datos, quiero consultas analíticas con DuckDB sobre el CSV de registro, para hacer filtrado, selección y agregaciones en SQL, reproducibles y rápidas. | 3 | S6 | Hecho | 4 | P1.4, IA2.2 | 3/3 |
| HU-34 | E-03 | Como docente evaluador, quiero la metodología replicada sobre un dataset real (German Credit, UCI), para comprobar que el enfoque no depende del dataset sintético. | 3 | S6 | Hecho | 5 | E3 | 2/2 |
| HU-35 | E-03 | Como científico de datos, quiero los verbos de dplyr y la gramática de ggplot2 aplicados con equivalentes en Python, para cubrir IA2.1 e IA2.3 sin salir de Python. | 3 | S6 | Hecho | 4 | IA2.1, IA2.3 | 1/1 |
| HU-36 | E-04 | Como científico de datos, quiero evaluar si retirar las variables de señal débil (estado_civil, tasa_interes_anual, plazo_meses) mejora la parsimonia sin perder desempeño, para un modelo más simple y explicable en la versión 2.1. | 3 | Backlog | Pendiente | — |  | 0/0 |

## Criterios de aceptación

### HU-00 · Un backlog único, sprints con objetivo, DoR y DoD verificables, ADRs y retrospectivas

*Como equipo del proyecto, quiero un backlog único, sprints con objetivo, DoR y DoD verificables, ADRs y retrospectivas, para gestionar el proyecto con Scrum y poder demostrarlo con evidencia.*

1. **Dado** el archivo docs/gestion/backlog.yaml, **cuando** se ejecuta python Back/scripts/generar_evidencia.py, **entonces** se generan backlog.md, trazabilidad.md, el checklist de 01_enunciado.md y gestion.json sin errores.
2. **Dado** cada paso 0–12 del plan, **cuando** se revisa trazabilidad.md, **entonces** cada paso y cada ID del enunciado tienen al menos una historia.
3. **Dado** un sprint cerrado, **cuando** se lee sprints.md, **entonces** tiene review, retrospectiva y burndown con datos reales.

Evidencia: `docs/gestion/backlog.yaml` ✓, `docs/gestion/definicion_de_hecho.md` ✓, `docs/gestion/definicion_de_listo.md` ✓, `docs/gestion/sprints.md` ✓, `docs/gestion/riesgos.md` ✓, `docs/gestion/trazabilidad.md` ✓
Nota: En el MVP se marcó Hecho con retros vacías y estados desactualizados (QA, paso 0).

### HU-01 · El problema de impago definido con métricas de negocio y riesgos éticos

*Como analista de crédito, quiero el problema de impago definido con métricas de negocio y riesgos éticos, para confiar en el uso del modelo y conocer sus límites.*

1. **Dado** el notebook 01 ejecutado con papermill, **cuando** se ejecuta verificar_dod.py, **entonces** el notebook cumple todos los criterios de nivel notebook.
2. **Dado** el notebook 01, **cuando** se lee, **entonces** tiene Contexto, Formulación, Datasets, Métricas, Ética y Conclusión, y la tabla de variables sensibles que reutiliza el paso 8.

Evidencia: `Back/notebooks/01_definicion_problema_etica.ipynb` ✓, `Back/reports/dod_status.json` ✓
Nota: Contenido documental existente; no importa credit_risk ni corre con el kernel credit-risk.

### HU-02 · Explorar el dataset con el entorno, las librerías y operaciones básicas

*Como científico de datos, quiero explorar el dataset con el entorno, las librerías y operaciones básicas, para entender su estructura y calidad antes de prepararlo.*

1. **Dado** el notebook 02 ejecutado, **cuando** se revisa, **entonces** incluye configuración del entorno (celda IN_COLAB), librerías, inspección, filtrado, selección, ordenamiento y agregaciones (pandas y DuckDB).
2. **Dado** el notebook 02, **cuando** se cuentan sus figuras, **entonces** hay al menos 3 histogramas, 2 dispersiones y 3 boxplots, cada uno con interpretación.

Evidencia: `Back/notebooks/02_exploracion_preliminar.ipynb` ✓, `docs/03_contrato_datos.md` ✓, `Back/reports/dod_status.json` ✓

### HU-03 · Limpiar y preparar los datos con el pipeline del paquete

*Como científico de datos, quiero limpiar y preparar los datos con el pipeline del paquete, para entrenar sin fuga y con las mismas transformaciones que se sirven.*

1. **Dado** credit_risk.features, **cuando** se ajusta el preprocesador, **entonces** usa las 6 variables derivadas, ordinal para nivel_educativo y rango_edad y winsorizer p1–p99 ajustado solo en train.
2. **Dado** el notebook 03 ejecutado, **cuando** se revisan db/processed, **entonces** existen train.csv, test.csv y feature_list.json sin nulos ni duplicados, con su SHA-256.

Evidencia: `Back/notebooks/03_limpieza_preparacion.ipynb` ✓, `Back/src/credit_risk/features.py` ✓, `Back/tests/test_features.py` ✓, `db/processed/train.csv` ✓, `db/processed/test.csv` ✓, `db/processed/feature_list.json` ✓
Nota: En el MVP features.py divergía de nb03 (3 variables, one-hot, sin capping).

### HU-04 · Ver los patrones, correlaciones y variables que más influyen en el impago

*Como analista de crédito, quiero ver los patrones, correlaciones y variables que más influyen en el impago, para entender los factores de riesgo.*

1. **Dado** el notebook 04 ejecutado, **cuando** se revisa, **entonces** tiene Matplotlib, Seaborn y plotnine, atípicos antes/después, PCA con varianza explicada y proyección 2D, y tabla final de variables relevantes.
2. **Dado** cada figura del notebook 04, **cuando** se ejecuta verificar_dod.py, **entonces** figuras_interpretadas es verdadero.

Evidencia: `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` ✓, `Back/reports/dod_status.json` ✓
Nota: QA marcó gráficos sin interpretación (c46, c51, c56).

### HU-05 · Entrenar y comparar modelos clásicos con validación cruzada en train

*Como científico de datos, quiero entrenar y comparar modelos clásicos con validación cruzada en train, para tener una referencia sólida y una selección sin fuga.*

1. **Dado** Dummy, LR, árbol, RF y HGB, **cuando** se evalúan con CV estratificada de 5 folds en train, **entonces** se reportan ROC-AUC, PR-AUC, KS, Brier y F1 con las mismas métricas para todos.
2. **Dado** el notebook 05 ejecutado, **cuando** termina, **entonces** existe Back/models/resultados_clasicos.json y el mejor modelo supera a la línea base.

Evidencia: `Back/notebooks/05_modelos_clasicos.ipynb` ✓, `Back/models/resultados_clasicos.json` ✓
Nota: En el MVP el nb05 tenía 0 celdas ejecutadas.

### HU-06 · Entrenar una CNN 1D y una RNN (GRU) en TensorFlow/Keras

*Como científico de datos, quiero entrenar una CNN 1D y una RNN (GRU) en TensorFlow/Keras, para comparar Deep Learning con los modelos clásicos.*

1. **Dado** TensorFlow 2.20 instalado (ADR-006), **cuando** se ejecuta el notebook 06, **entonces** MLP, CNN 1D y GRU se entrenan con class_weight y EarlyStopping y se evalúan en test.
2. **Dado** el notebook 06 ejecutado, **cuando** se revisan los artefactos, **entonces** existen red_neuronal.keras, resultados_dl.json con historiales y la tabla clásicos vs DL con tiempos.

Evidencia: `Back/src/credit_risk/dl.py` ✓, `Back/notebooks/06_red_neuronal.ipynb` ✓, `Back/models/resultados_dl.json` ✓, `Back/models/red_neuronal.keras` ✓
Nota: En el MVP no se entrenó ninguna red y la conclusión afirmaba lo contrario.

### HU-07 · Que el texto de la solicitud aporte a la evaluación del riesgo

*Como analista de crédito, quiero que el texto de la solicitud aporte a la evaluación del riesgo, para aprovechar la información no estructurada.*

1. **Dado** los 4.454 textos únicos, **cuando** se ejecuta el notebook 07, **entonces** hay frecuencias, n-gramas, TF-IDF+LR, sentimiento con BERT y embeddings sentence-transformers vs GPT-2 en 2D.
2. **Dado** el modelo combinado, **cuando** se compara con el tabular, **entonces** se reporta ΔAUC con IC bootstrap y existen resultados_nlp.json y nlp_features.parquet.

Evidencia: `Back/src/credit_risk/nlp.py` ✓, `Back/src/credit_risk/nlp_avanzado.py` ✓, `Back/notebooks/07_nlp_riesgo.ipynb` ✓, `Back/models/resultados_nlp.json` ✓, `db/processed/nlp_features.parquet` ✓
Nota: En el MVP el nb07 tenía 19 celdas sin ejecutar.

### HU-08 · Un modelo final calibrado, con umbrales justificados por costo y auditado en equidad

*Como analista de crédito, quiero un modelo final calibrado, con umbrales justificados por costo y auditado en equidad, para tomar decisiones justas, explicables y confiables.*

1. **Dado** las predicciones OOF y de test guardadas por train.py, **cuando** se ejecuta el notebook 08, **entonces** no reentrena y sus métricas coinciden con model_card.json (lo verifica un test).
2. **Dado** el notebook 08, **cuando** se revisa, **entonces** muestra calibración, curva de costo con sensibilidad, tabla final de modelos, equidad antes/después, SHAP global, 3 casos y PSI train/test.

Evidencia: `Back/notebooks/08_evaluacion_optimizacion.ipynb` ✓, `Back/models/modelo_final.joblib` ✓, `Back/models/model_card.json` ✓, `Back/models/oof_predictions.parquet` ✓, `Back/models/test_predictions.parquet` ✓
Nota: En el MVP el modelo servido (v1.0.0, umbral 0,4396) no era el del nb08 (0,25).

### HU-09 · Procesar y modelar los datos con PySpark

*Como científico de datos, quiero procesar y modelar los datos con PySpark, para demostrar que la solución escala a grandes volúmenes.*

1. **Dado** el contenedor quay.io/jupyter/pyspark-notebook:2026-10-19 (ADR-005), **cuando** se ejecuta el notebook 09 con docker-compose.spark.yml, **entonces** usa esquema explícito, transformaciones, Spark SQL y escribe Parquet particionado.
2. **Dado** el notebook 09 ejecutado, **cuando** se revisa resultados_spark.json, **entonces** contiene el AUC de MLlib comparado con sklearn y la versión de Spark.

Evidencia: `Back/notebooks/09_spark_big_data.ipynb` ✓, `Back/docker-compose.spark.yml` ✓, `Back/models/resultados_spark.json` ✓
Nota: En el MVP el nb09 corrió con respaldo pandas/pyarrow, sin PySpark.

### HU-10 · Consumir el modelo servido por una API REST

*Como sistema de originación del banco, quiero consumir el modelo servido por una API REST, para integrar la decisión aprobar/revisar/rechazar en el proceso de crédito.*

1. **Dado** la API v2 con el modelo cargado en lifespan, **cuando** se envía el cliente demo de riesgo bajo a /predict, **entonces** responde banda Bajo y decisión aprobar, con contribuciones y la versión 2.0.0.
2. **Dado** una petición con un campo inválido, **cuando** se envía a /predict, **entonces** responde 422 marcando el campo.
3. **Dado** el repositorio, **cuando** se ejecuta python -m pytest Back/tests/test_api.py, **entonces** todas las pruebas pasan.

Evidencia: `Back/api/main.py` ✓, `Back/api/schemas.py` ✓, `Back/api/service.py` ✓, `Back/tests/test_api.py` ✓, `Back/models/model_card.json` ✓
Nota: Código v2 escrito, pendiente de pruebas con el modelo v2.0.0.

### HU-11 · Un notebook final integrador y un informe ejecutivo

*Como docente evaluador, quiero un notebook final integrador y un informe ejecutivo, para evaluar el proyecto completo en un solo recorrido.*

1. **Dado** el notebook 00 ejecutado, **cuando** se revisa, **entonces** usa el pipeline de credit_risk y el modelo servido, predice 3 clientes (bajo, medio, alto) y llama a la API con TestClient.
2. **Dado** el informe 06, **cuando** se compara con model_card.json, **entonces** todas sus cifras coinciden con la card v2.0.0.

Evidencia: `Back/notebooks/00_proyecto_integrador_final.ipynb` ✓, `docs/06_informe_resultados.md` ✓, `Back/reports/dod_status.json` ✓
Nota: En el MVP el nb00 tenía flujo propio y umbral 0,24.

### HU-12 · Lanzar todo en local con comandos documentados desde un clon limpio

*Como equipo del proyecto, quiero lanzar todo en local con comandos documentados desde un clon limpio, para demostrar que la solución funciona sin pasos ocultos.*

1. **Dado** un clon limpio en otra carpeta, **cuando** se siguen los comandos de Back/README.md, **entonces** se instala el entorno, pasan los tests y /health responde 200.
2. **Dado** la API levantada en un puerto libre verificado, **cuando** se envía el ejemplo de Back/api/ejemplo_request.json a /predict, **entonces** devuelve probabilidad, banda y decisión.

Evidencia: `Back/README.md` ✓, `Back/api/ejemplo_request.json` ✓
Nota: En el MVP se marcó Hecho sin prueba desde clon limpio.

### HU-13 · Un único paquete instalable credit_risk con toda la lógica

*Como científico de datos, quiero un único paquete instalable credit_risk con toda la lógica, para que notebooks, train.py, API y exportador usen exactamente el mismo código.*

1. **Dado** Back/pyproject.toml, **cuando** se ejecuta pip install -e ".[api,nb,dl,nlp,dev]", **entonces** import credit_risk funciona y __version__ es 2.0.0.
2. **Dado** los módulos data, features, models, fairness y monitoring, **cuando** se ejecuta python -m pytest --cov, **entonces** pasan y la cobertura del núcleo es ≥ 80 %.
3. **Dado** la API, **cuando** se importa api.main, **entonces** no carga shap, torch, TensorFlow ni matplotlib (imports perezosos).

Evidencia: `Back/pyproject.toml` ✓, `Back/src/credit_risk/__init__.py` ✓, `Back/src/credit_risk/config.py` ✓, `Back/src/credit_risk/data.py` ✓, `Back/src/credit_risk/features.py` ✓, `Back/src/credit_risk/models.py` ✓, `Back/tests/test_data.py` ✓, `Back/tests/test_models.py` ✓

### HU-14 · Probar el entorno (TensorFlow, torch, PySpark en Docker) antes de escribir notebooks

*Como científico de datos, quiero probar el entorno (TensorFlow, torch, PySpark en Docker) antes de escribir notebooks, para no descubrir bloqueos de dependencias al final del sprint.*

1. **Dado** Back/.venv con Python 3.10, **cuando** se importan tensorflow, sklearn y torch en ambos órdenes, **entonces** no hay WinError 1114 o queda documentada la mitigación.
2. **Dado** el contenedor de PySpark, **cuando** se escribe un Parquet de prueba, **entonces** termina sin error y la versión de Spark queda registrada en ADR-005.
3. **Dado** el kernel, **cuando** se ejecuta python -m ipykernel install --user --name credit-risk, **entonces** jupyter kernelspec list muestra credit-risk.

Evidencia: `docs/gestion/adr/ADR-005-pyspark-en-docker.md` ✓, `docs/gestion/adr/ADR-006-tensorflow-2-20-cpu.md` ✓, `docs/gestion/adr/ADR-008-python-3-10-sklearn-1-4-2.md` ✓, `Back/requirements-api.lock` ✓, `Back/requirements-dev-win.lock` ✓

### HU-15 · Que la DoD de los notebooks se verifique con un script

*Como equipo del proyecto, quiero que la DoD de los notebooks se verifique con un script, para no volver a declarar Hecho algo que no se ejecutó.*

1. **Dado** los 10 notebooks 00–09, **cuando** se ejecuta python Back/scripts/verificar_dod.py --estricto, **entonces** sale con código 0 y Back/reports/dod_status.json registra fallos 0.
2. **Dado** un notebook sin ejecutar o con una figura sin interpretar, **cuando** se ejecuta verificar_dod.py --estricto, **entonces** sale con código 1 e indica el criterio que falla.

Evidencia: `Back/scripts/verificar_dod.py` ✓, `Back/reports/dod_status.json` ✓

### HU-16 · Una matriz de trazabilidad y un checklist del enunciado calculados, no marcados a mano

*Como docente evaluador, quiero una matriz de trazabilidad y un checklist del enunciado calculados, no marcados a mano, para verificar cada ID del enunciado contra su evidencia.*

1. **Dado** backlog.yaml y dod_status.json, **cuando** se ejecuta python Back/scripts/generar_evidencia.py dos veces seguidas, **entonces** la segunda ejecución no cambia ningún archivo (idempotente).
2. **Dado** un ID cuya historia no está en Hecho o le falta una ruta de evidencia, **cuando** se genera el checklist, **entonces** el ID queda [ ] en 01_enunciado.md.

Evidencia: `Back/scripts/generar_evidencia.py` ✓, `docs/gestion/backlog.md` ✓, `docs/gestion/trazabilidad.md` ✓, `Front/src/data/generated/gestion.json` ✓

### HU-17 · Ejecutar los notebooks con papermill, kernel credit-risk y una cola con lock

*Como científico de datos, quiero ejecutar los notebooks con papermill, kernel credit-risk y una cola con lock, para obtener salidas reales y tiempos medidos sin saturar la máquina.*

1. **Dado** Back/scripts/ejecutar_notebooks.py, **cuando** se ejecuta un notebook con -p FAST True, **entonces** termina con salidas, kernel credit-risk y un log de tiempos.
2. **Dado** dos ejecuciones pesadas pedidas a la vez, **cuando** corre la cola, **entonces** se ejecutan en serie.

Evidencia: `Back/scripts/ejecutar_notebooks.py` ✓, `Back/src/credit_risk/notebook.py` ✓

### HU-18 · Una decisión aprobar/revisar/rechazar derivada de costos explícitos (regla de Chow)

*Como analista de crédito, quiero una decisión aprobar/revisar/rechazar derivada de costos explícitos (regla de Chow), para que las bandas de riesgo y la acción coincidan y no dependan del modelo.*

1. **Dado** C_FN=0,45, C_FP=0,15 y C_R=0,08 en config.py, **cuando** se calculan los umbrales, **entonces** aprobar si p<0,1778, rechazar si p>0,4667 y revisar en medio.
2. **Dado** cualquier probabilidad, **cuando** se calculan banda y decisión, **entonces** Bajo↔aprobar, Medio↔revisar, Alto↔rechazar (test de coherencia).
3. **Dado** LGD entre 0,45 y 0,75 y margen entre 0,10 y 0,20, **cuando** se ejecuta el análisis de sensibilidad, **entonces** se reportan los umbrales y el costo esperado de cada escenario.

Evidencia: `Back/src/credit_risk/config.py` ✓, `Back/src/credit_risk/models.py` ✓, `Back/tests/test_models.py` ✓, `docs/gestion/adr/ADR-002-costos-regla-de-chow.md` ✓

### HU-19 · Seleccionar el modelo v2.0.0 por CV en train y evaluar en test una sola vez

*Como científico de datos, quiero seleccionar el modelo v2.0.0 por CV en train y evaluar en test una sola vez, para publicar métricas de test no sesgadas y una sola fuente de verdad.*

1. **Dado** python Back/train.py, **cuando** termina, **entonces** escribe modelo_final.joblib, model_card.json v2.0.0, oof_predictions.parquet y test_predictions.parquet.
2. **Dado** dos candidatos con ΔAUC CV < 0,005, **cuando** se aplica la regla de parsimonia, **entonces** se elige la regresión logística.
3. **Dado** model_card.json, **cuando** se recalcula el SHA-256 de train.csv y test.csv, **entonces** coincide con el registrado en la card.

Evidencia: `Back/train.py` ✓, `Back/src/credit_risk/entrenamiento.py` ✓, `Back/models/model_card.json` ✓, `docs/gestion/adr/ADR-001-fuente-unica-del-modelo.md` ✓

### HU-20 · Medir y mitigar la disparidad por sexo y edad sobre la aprobación automática

*Como oficial de cumplimiento, quiero medir y mitigar la disparidad por sexo y edad sobre la aprobación automática, para que el modelo no discrimine y la decisión quede razonada.*

1. **Dado** las variantes base, sin_edad y reweighing evaluadas con predicciones OOF, **cuando** se seleccionan, **entonces** gana la de menor costo esperado con DI ≥ 0,8 en sexo y edad, o la excepción queda razonada en ADR-003.
2. **Dado** cada grupo con n ≥ 30, **cuando** se calcula el DI, **entonces** se reporta con IC bootstrap 95 % (500 réplicas), igualdad de oportunidades y calibración por grupo.
3. **Dado** la política servida, **cuando** se revisa, **entonces** no usa umbrales distintos por grupo.

Evidencia: `Back/src/credit_risk/fairness.py` ✓, `Back/tests/test_fairness_monitoring.py` ✓, `docs/gestion/adr/ADR-003-equidad.md` ✓, `Back/models/model_card.json` ✓

### HU-21 · El PSI por variable y del score entre train y test

*Como analista de riesgo de modelos, quiero el PSI por variable y del score entre train y test, para detectar deriva y saber cuándo recalibrar.*

1. **Dado** dos muestras, **cuando** se calcula el PSI, **entonces** devuelve 0 para muestras idénticas y crece con el desplazamiento (test).
2. **Dado** el notebook 08, **cuando** se revisa, **entonces** muestra el PSI train/test con su lectura (<0,1 estable; 0,1–0,25 vigilar; >0,25 actuar).

Evidencia: `Back/src/credit_risk/monitoring.py` ✓, `Back/tests/test_fairness_monitoring.py` ✓

### HU-22 · La API v2 en una imagen Docker probada

*Como equipo de operaciones, quiero la API v2 en una imagen Docker probada, para desplegarla igual en local y en la nube.*

1. **Dado** Back/Dockerfile con usuario no-root y .dockerignore, **cuando** se ejecuta docker compose up --build, **entonces** /health responde 200 con la versión 2.0.0.
2. **Dado** requirements-api.lock, **cuando** se ejecuta test_api_slim, **entonces** api.main se importa solo con las dependencias de la API.

Evidencia: `Back/Dockerfile` ✓, `Back/docker-compose.yml` ✓, `Back/.dockerignore` ✓, `Back/tests/test_api_slim.py` ✓, `docs/05_despliegue.md` ✓
Nota: En el MVP Docker nunca se probó.

### HU-23 · Un paquete de corrida exportado desde la ejecución real del back

*Como equipo del front, quiero un paquete de corrida exportado desde la ejecución real del back, para que el front muestre solo resultados reales, con hashes verificables.*

1. **Dado** la corrida local terminada, **cuando** se ejecuta python Back/scripts/exportar_front.py, **entonces** escribe Front/src/data/generated y Front/public/run con manifest.json (versión, git sha y SHA-256 por archivo).
2. **Dado** los agregados exportados, **cuando** se recalculan con DuckDB, **entonces** coinciden (test_exportar_front).
3. **Dado** golden.json, **cuando** se revisa, **entonces** contiene unos 300 clientes de test, los 3 de demo y unos 50 textos con las salidas de Python.

Evidencia: `Back/scripts/exportar_front.py` ✓, `Back/tests/test_contratos.py` ✓, `Front/src/data/generated/manifest.json` ✓

### HU-24 · Que el simulador calcule en el navegador con el mismo modelo que sirve la API

*Como visitante del sitio, quiero que el simulador calcule en el navegador con el mismo modelo que sirve la API, para probar clientes sin depender del back.*

1. **Dado** modelo_export.json y golden.json, **cuando** se ejecuta npm --prefix Front run test, **entonces** scoring.ts y texto.ts reproducen las salidas de Python con |Δ| < 1e-6.
2. **Dado** una diferencia mayor, **cuando** se ejecuta el build, **entonces** el build falla.

Evidencia: `Front/src/engine/scoring.ts` ✓, `Front/src/engine/texto.ts` ✓, `Front/src/data/generated/modelo_export.json` ✓

### HU-25 · Reproducir cada notebook ejecutado celda a celda en el sitio

*Como docente evaluador, quiero reproducir cada notebook ejecutado celda a celda en el sitio, para revisar la evidencia sin instalar nada.*

1. **Dado** el JSON de un notebook exportado, **cuando** se pulsa Ejecutar todo, **entonces** el contador [n] avanza y las salidas aparecen con la duración real comprimida.
2. **Dado** un KPI del sitio, **cuando** se abre su fuente, **entonces** el reproductor se posiciona en la celda exacta que lo produjo.

Evidencia: `Front/src/features/notebook/NotebookPlayer.tsx` ✓

### HU-26 · Un capítulo por entregable con actividades, notebook, visualizaciones, aprendizaje y criterio de hecho

*Como docente evaluador, quiero un capítulo por entregable con actividades, notebook, visualizaciones, aprendizaje y criterio de hecho, para recorrer el proyecto paso a paso con su evidencia.*

1. **Dado** las rutas /metodologia y /paso/1 a /paso/11, **cuando** se recorren con Playwright, **entonces** cada capítulo muestra IDs, fase CRISP-DM, sprint, HU y "Lo que aprendimos".
2. **Dado** cualquier cifra mostrada, **cuando** se compara con el manifest, **entonces** coincide con la card y con resultados_*.json (test de consistencia).

Evidencia: `Front/package.json` ✓, `Front/src/main.tsx` ✓, `Front/src/data/generated/gestion.json` ✓

### HU-27 · Ver la API reproducida (Swagger, capturas reales y consola de prueba)

*Como integrador del banco, quiero ver la API reproducida (Swagger, capturas reales y consola de prueba), para entender el contrato REST sin levantar el servidor.*

1. **Dado** las capturas reales de /health, /model/info, /predict, un 422 y /predict/text, **cuando** se abre el capítulo del paso 10, **entonces** se muestran petición, respuesta, estado y latencia medidos.
2. **Dado** el formulario de la consola, **cuando** se pulsa Probar, **entonces** responde el motor local con la misma forma que /predict.

Evidencia: `Front/src/features/api/ApiConsole.tsx` ✓, `Front/src/data/generated/api_capturas.json` ✓

### HU-28 · Que el sitio funcione con el back apagado y no haga peticiones fuera de sus estáticos

*Como equipo del proyecto, quiero que el sitio funcione con el back apagado y no haga peticiones fuera de sus estáticos, para desplegarlo como estático en Vercel sin riesgo ni dependencias.*

1. **Dado** uvicorn y Docker detenidos, **cuando** se ejecuta npx --prefix Front playwright test, **entonces** todas las rutas cargan y la prueba falla si sale cualquier petición que no sea un estático del sitio.
2. **Dado** el build de producción, **cuando** se mide, **entonces** JS inicial < 250 KB gz y Lighthouse ≥ 90.
3. **Dado** .vercelignore, **cuando** se revisa, **entonces** excluye .env*, Back/, db/ y docs/.

Evidencia: `Front/playwright.config.ts` ✓, `vercel.json` ✓, `.vercelignore` ✓, `docs/gestion/adr/ADR-004-front-estatico-autonomo.md` ✓

### HU-29 · Documentación coherente con el modelo v2.0.0

*Como docente evaluador, quiero documentación coherente con el modelo v2.0.0, para que ningún documento contradiga lo servido.*

1. **Dado** docs/README.md, 04_arquitectura, 05_despliegue, 06_informe y 07_libreto_front, **cuando** se buscan versiones, umbrales y archivos citados, **entonces** solo aparece la versión 2.0.0, los umbrales de ADR-002 y archivos que existen.
2. **Dado** report_dev.md v2, **cuando** se lee, **entonces** responde cada hallazgo de report_qa.md con su evidencia.

Evidencia: `docs/README.md` ✓, `docs/04_arquitectura_backend.md` ✓, `docs/05_despliegue.md` ✓, `docs/06_informe_resultados.md` ✓, `docs/07_libreto_front.md` ✓, `report_dev.md` ✓

### HU-30 · Lecciones aprendidas y el aprendizaje por unidad documentados

*Como equipo del proyecto, quiero lecciones aprendidas y el aprendizaje por unidad documentados, para convertir los errores del MVP en controles y mostrar qué aporta cada unidad.*

1. **Dado** cada lección del MVP, **cuando** se lee lecciones_aprendidas.md, **entonces** tiene un control automático en v2 y el comando que lo comprueba.
2. **Dado** cada unidad del enunciado, **cuando** se lee la sección Aprendizaje por unidad, **entonces** indica qué se aprende y en qué notebook o paso se evidencia.

Evidencia: `docs/gestion/lecciones_aprendidas.md` ✓, `docs/gestion/sprints.md` ✓

### HU-31 · Las decisiones de arquitectura documentadas como ADR

*Como docente evaluador, quiero las decisiones de arquitectura documentadas como ADR, para entender por qué se eligió cada alternativa y cómo se verifica.*

1. **Dado** docs/gestion/adr, **cuando** se revisa, **entonces** existen ADR-001 a ADR-008 en formato MADR con evidencia o verificación y un índice.
2. **Dado** un ADR con resultados pendientes, **cuando** se ejecuta train.py v2, **entonces** su sección Resultados se completa con las cifras de la card.

Evidencia: `docs/gestion/adr/README.md` ✓, `docs/gestion/adr/ADR-001-fuente-unica-del-modelo.md` ✓, `docs/gestion/adr/ADR-002-costos-regla-de-chow.md` ✓, `docs/gestion/adr/ADR-003-equidad.md` ✓, `docs/gestion/adr/ADR-004-front-estatico-autonomo.md` ✓, `docs/gestion/adr/ADR-007-duckdb.md` ✓

### HU-32 · Un gate de calidad local en un solo comando

*Como equipo del proyecto, quiero un gate de calidad local en un solo comando, para no integrar nada que rompa lint, tipos, tests, DoD o build.*

1. **Dado** Back/scripts/check.py, **cuando** se ejecuta, **entonces** corre ruff, mypy src api, pytest --cov, verificar_dod.py y el build del front, y sale 0 solo si todo pasa.
2. **Dado** Back/, **cuando** se ejecuta la suite, **entonces** un test falla si aparece un archivo .R, .ps1 u otro lenguaje distinto de Python.

Evidencia: `Back/scripts/check.py` ✓, `Back/tests/test_proyecto.py` ✓

### HU-33 · Consultas analíticas con DuckDB sobre el CSV de registro

*Como científico de datos, quiero consultas analíticas con DuckDB sobre el CSV de registro, para hacer filtrado, selección y agregaciones en SQL, reproducibles y rápidas.*

1. **Dado** db/credit_risk.csv, **cuando** se ejecutan las consultas DuckDB de los notebooks 02 y 04, **entonces** los resultados coinciden con los equivalentes en pandas.
2. **Dado** el CSV, **cuando** termina cualquier consulta, **entonces** el archivo no se modifica (sigue siendo el dato de registro).

Evidencia: `Back/notebooks/02_exploracion_preliminar.ipynb` ✓, `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` ✓, `docs/gestion/adr/ADR-007-duckdb.md` ✓

### HU-34 · La metodología replicada sobre un dataset real (German Credit, UCI)

*Como docente evaluador, quiero la metodología replicada sobre un dataset real (German Credit, UCI), para comprobar que el enfoque no depende del dataset sintético.*

1. **Dado** German Credit en db/external con su licencia, **cuando** se ejecuta el apéndice del notebook 05, **entonces** se reportan AUC por CV y una auditoría de equidad.

Evidencia: `db/external` ✓, `Back/notebooks/05_modelos_clasicos.ipynb` ✓

### HU-35 · Los verbos de dplyr y la gramática de ggplot2 aplicados con equivalentes en Python

*Como científico de datos, quiero los verbos de dplyr y la gramática de ggplot2 aplicados con equivalentes en Python, para cubrir IA2.1 e IA2.3 sin salir de Python.*

1. **Dado** la sección dplyr del notebook 04, **cuando** se ejecuta, **entonces** filter, select, mutate, group_by+summarise, arrange y %>% se aplican con pandas encadenado y hay tabla de equivalencias (R solo como referencia).
2. **Dado** la sección ggplot2, **cuando** se ejecuta, **entonces** hay al menos 3 gráficos plotnine (ggplot + aes + geom_* + facet_wrap + theme) interpretados.

Evidencia: `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` ✓

### HU-36 · Evaluar si retirar las variables de señal débil (estado_civil, tasa_interes_anual, plazo_meses) mejora la parsimonia sin perder desempeño

*Como científico de datos, quiero evaluar si retirar las variables de señal débil (estado_civil, tasa_interes_anual, plazo_meses) mejora la parsimonia sin perder desempeño, para un modelo más simple y explicable en la versión 2.1.*

1. **Dado** el ranking del paso 3 y la importancia por permutación del paso 5, **cuando** se entrena con el protocolo de train.py la variante sin esas tres variables, **entonces** el AUC CV no cae más de 0,002 y el costo esperado OOF no sube.
2. **Dado** el resultado de la comparación, **cuando** se toma la decisión, **entonces** queda registrada en un ADR y en la model card de la versión 2.1.

Evidencia: 
Nota: Mejora opcional de v2.1, sin ID del enunciado propio (P2.E3 e IA2.E2 ya los acredita HU-03/HU-04). Detectado en nb03 (señal débil en Spearman, información mutua e importancia del bosque) y confirmado por la permutación de nb05 (~0). En v2.0.0 la regularización L2 las atenúa y no cambian la decisión. Se refinó en S8 y, al cierre del sprint, volvió al backlog del producto (sprint null) para planificarse en v2.1; no forma parte del incremento v2.0.0.

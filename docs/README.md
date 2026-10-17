# Proyecto Integrador: Análisis predictivo de riesgo de crédito

Documentación del proyecto (alcance actual: **back**). Fuente: `../ProyectoIntegrador.jpeg`.

## Orden de lectura

| # | Documento | Para qué sirve |
|---|---|---|
| 1 | [01_enunciado.md](01_enunciado.md) | Transcripción fiel de la imagen con un ID por ítem y el **checklist global** |
| 2 | [02_plan_paso_a_paso.md](02_plan_paso_a_paso.md) | **El plan a seguir estrictamente**: 13 pasos (0–12), cada uno con su entregable y criterio de hecho |
| 3 | [03_contrato_datos.md](03_contrato_datos.md) | Requisitos del dataset (para quien consiga los datos) |
| 4 | [04_arquitectura_backend.md](04_arquitectura_backend.md) | Estructura de carpetas, stack y contrato de la API |
| 5 | [05_despliegue.md](05_despliegue.md) | Docker en local y guía de nube |
| 6 | `06_informe_resultados.md` | *(Se crea en el paso 11)* |
| 7 | [07_libreto_front.md](07_libreto_front.md) | **Libreto de integración para el Front**: cómo levantar el back, los endpoints, el mapeo al `index.html`, el JS y el guion de la demo |
| 7 | `diccionario_datos.md` | *(Lo entrega el agente de datos)* |
| — | [gestion/backlog.md](gestion/backlog.md) | Historias de usuario |
| — | [gestion/sprints.md](gestion/sprints.md) | Plan de sprints y retrospectivas |
| — | [gestion/definicion_de_hecho.md](gestion/definicion_de_hecho.md) | Definition of Done |

## Convención de carpetas

| Carpeta | Contenido | Responsable |
|---|---|---|
| `docs/` | Documentación | Este plan |
| `db/` | Datos (`credit_risk.csv` crudo y `processed/`) | Agente de datos (crudo); pasos 3, 7 y 9 (processed) |
| `Back/` | Notebooks, `src/`, modelos, API, Docker y tests | Pasos 1–12 |
| `Front/` | Interfaz | **Fuera del alcance actual** |

## Para el agente de Front: empiece aquí → [07_libreto_front.md](07_libreto_front.md)

## Estado del back

| Paso | Entregable | Estado |
|---|---|---|
| 0 | `docs/gestion/` | Hecho |
| 1–4 | Notebooks 01–04 (ética, exploración, limpieza, EDA) y `db/processed/` | Hecho, ejecutados sin errores |
| 6, 9 | Notebooks 06 (redes) y 09 (Spark) | Hecho, ejecutados sin errores |
| 5 | Notebook 05 (clásicos) | Creado; ejecución en curso |
| 7 | Notebook 07 (NLP con BERT/GPT) | Creado, sin ejecutar: requiere `pip install transformers torch sentence-transformers` y descargar los modelos (varios minutos) |
| 8 | Notebook 08 + `Back/models/` | Hecho, ejecutado |
| 10 | API FastAPI (`Back/api/`), Dockerfile, compose y tests | Hecho; API verificada en `http://localhost:8000` |
| 11 | Notebook 00 final | Hecho, ejecutado |
| 12 | Sistema en local | Hecho: `cd Back; $env:PYTHONPATH="src"; python -m uvicorn api.main:app --port 8000` |

**Modelo servido:** regresión logística · ROC-AUC 0,8465 · F1 0,708 · Recall 0,810 · KS 0,546 · umbral 0,4396.

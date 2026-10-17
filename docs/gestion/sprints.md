# Sprints

> Marco: **Scrum ligero + tablero Kanban** (Pendiente → En progreso → Revisión → Hecho).
> Cada sprint cierra con una **demo** del entregable y una **retrospectiva** (¿qué salió bien?, ¿qué mejorar?, impedimentos).
> Las fases ágiles del enunciado (F1–F5) se reparten entre los sprints.

| Sprint | Objetivo | Historias | Pasos | Fases | Entregables de cierre |
|---|---|---|---|---|---|
| **S1** | Problema definido y datos entendidos | HU-00, HU-01, HU-02 | 0, 1, 2 | F1, F2 | `docs/gestion/*`, notebooks 01 y 02 |
| **S2** | Datos listos para modelar | HU-03, HU-04 | 3, 4 | F2 | Notebooks 03 y 04, `db/processed/`, `features.py` |
| **S3** | Modelos entrenados, comparados y optimizados | HU-05, HU-06, HU-07, HU-08 | 5, 6, 7, 8 | F3, F4 | Notebooks 05–08, `models/*` |
| **S4** | Solución desplegada y comunicada | HU-09, HU-10, HU-11, HU-12 | 9, 10, 11, 12 | F5 | Notebook 09, API, Docker, notebook 00, informe, sistema en local |

## Registro de sprints

### S1–S4 (sprint comprimido de entrega, 2026-10-16)
- **Hecho:** gestión, notebooks 01–04, 08 y 00 ejecutados; API FastAPI verificada en vivo; libreto del Front; respuesta a QA (protocolo de entrenamiento sin fuga a test, calibración, umbral por costo, equidad por sexo y edad, `/health` atómico, `validar_dataset()`).
- **Pendiente:** ejecutar el nb05; instalar TensorFlow, BERT/GPT y PySpark y ejecutar los nb06, 07 y 09; mitigación de equidad si DI < 0.8; probar Docker.
- **Impedimentos:** plazo de minutos y una máquina lenta (importar sklearn tarda 30–90 s); dependencias pesadas no instaladas.
- **Retrospectiva:** se paralelizó con agentes, pero faltó fijar presupuestos de tiempo por agente. En adelante: alcance mínimo verificable primero y nada de afirmar resultados en las conclusiones sin salidas que los respalden.

### S1
- **Hecho:**
- **Pendiente:**
- **Impedimentos:**
- **Retrospectiva:**

### S2
- **Hecho:**
- **Pendiente:**
- **Impedimentos:**
- **Retrospectiva:**

### S3
- **Hecho:**
- **Pendiente:**
- **Impedimentos:**
- **Retrospectiva:**

### S4
- **Hecho:**
- **Pendiente:**
- **Impedimentos:**
- **Retrospectiva:**

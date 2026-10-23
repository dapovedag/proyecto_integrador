# Documentación · Proyecto Integrador de riesgo de crédito (v2.0.0)

## Orden de lectura

| # | Documento | Para qué |
|---|---|---|
| 1 | [01_enunciado.md](01_enunciado.md) | Requisitos con ID (PF1, E, F, R, P1, P2, IA1–IA3) y checklist **calculado** |
| 2 | [02_plan_paso_a_paso.md](02_plan_paso_a_paso.md) | Pasos 0–12 con su criterio de hecho (los ADR priman) |
| 3 | [03_contrato_datos.md](03_contrato_datos.md) · [diccionario_datos.md](diccionario_datos.md) | Contrato del dataset y diccionario de las 21 columnas |
| 4 | [04_arquitectura_backend.md](04_arquitectura_backend.md) | Arquitectura real, pipeline del modelo y contrato de la API |
| 5 | [05_despliegue.md](05_despliegue.md) | Docker, front estático, nube y operación del modelo |
| 6 | [06_informe_resultados.md](06_informe_resultados.md) | Informe ejecutivo para un público no técnico |
| 7 | [07_libreto_front.md](07_libreto_front.md) | Paquete de corrida, motores exactos y guion de demo del front |
| — | [gestion/](gestion/) | Scrum + CRISP-DM: backlog, sprints, DoD, DoR, ADR, riesgos, lecciones aprendidas y trazabilidad |
| — | [diseno/](diseno/) | Propuestas visuales anteriores y referencias (archivo) |

## Estado (verificado con comandos, no declarado)

| Pieza | Estado | Cómo se verifica |
|---|---|---|
| Modelo servido v2.0.0 | Regresión logística calibrada, reweighing, regla de Chow. AUC test 0,846 | `python Back/train.py` → `Back/models/model_card.json` |
| Notebooks 00–09 | 10/10 ejecutados con salidas y **0 fallos de DoD** | `python Back/scripts/verificar_dod.py --estricto` |
| Calidad del back | ruff y mypy limpios, pytest con cobertura del 91,5 % | `python Back/scripts/check.py --sin-front` |
| API REST | v2 con pruebas de contrato (422, 503, bandas, clientes demo) y Docker *healthy* probado | `docker compose up --build` en `Back/` |
| PySpark | Spark 4.2 en Docker, MLlib 0,844 | `python Back/scripts/ejecutar_notebooks.py 09` |
| Front | Estático y autónomo, paridad golden \|Δp\| < 1e-6, e2e sin red | `npm --prefix Front test` · `npx playwright test` |
| Trazabilidad | Checklist calculado a partir de las HU en Hecho y la evidencia existente | `python Back/scripts/generar_evidencia.py` |

La respuesta a la auditoría QA, hallazgo por hallazgo, está en [`report_dev.md`](../report_dev.md).

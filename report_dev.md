# Reporte DEV: respuesta a la auditoría QA del 2026-10-16

> Responde, hallazgo por hallazgo, a la sección 7 de `report_qa.md`. Con la restricción de tiempo se priorizó lo que afecta al **modelo servido y su integridad**. Lo que requiere instalar dependencias pesadas (TensorFlow, BERT/GPT, PySpark) queda **declarado como pendiente**, sin presentarlo como cumplido.

## Resumen

| # | Hallazgo QA | Prioridad | Estado | Qué se hizo |
|---|---|---|---|---|
| 1 | La API sirve un modelo distinto al del nb08 | Bloqueante | **Corregido** | `Back/train.py` es la **única fuente de verdad**. Ahora aplica la misma política que el nb08 (calibración y umbral por costo), y la card declara `fuente_de_verdad`. Los `*_nb08.*` quedan como exploratorios y la API no los carga. |
| 2 | Modelo y umbral elegidos con test | Bloqueante | **Corregido** | Modelo elegido por **ROC-AUC CV(5) en train**; **calibración sigmoid**; **umbral por costo FN:FP = 3:1** con probabilidades out-of-fold de train; **test se usa una sola vez**. Lo mismo para el umbral NLP. Importancia por permutación sobre una muestra de train. |
| 3 | Redes (nb06) no ejecutadas; conclusiones contradictorias | Bloqueante | **Parcial** | Nota de **estado de ejecución** insertada antes de las conclusiones (deja explícito que se omitió por falta de TensorFlow). Dependencias declaradas en `requirements-extras.txt`. **Pendiente:** instalar y ejecutar. |
| 4 | NLP avanzado (nb07) sin ejecutar | Bloqueante | **Pendiente (declarado)** | El TF-IDF + LR servido sigue disponible y documentado. BERT/GPT requieren `transformers`/`torch` (en `requirements-extras.txt`). No se presenta como cumplido. |
| 5 | Spark (nb09) ejecutado con respaldo pandas | Bloqueante | **Parcial** | Nota en el nb09 que aclara que el respaldo **no acredita IA3.6**. **Pendiente:** Java 17 + PySpark y volver a ejecutar. |
| 6 | Equidad incompleta (solo sexo y aprobación; DI por edad 0,74) | Alta | **Corregido (medición)** / Pendiente (mitigación) | La card ahora reporta **sexo y edad** (18-29 / 30-59 / 60+ / desconocida) con **aprobación, TPR, FPR, disparate impact y regla del 80 %**, medidos en test sin ajustar nada con test. La mitigación no se aplica automáticamente; queda en `limitaciones` para revisión humana. |
| 7 | Comparación completa de modelos (nb05 sin salidas) | Alta | **Parcial** | Se intentó ejecutar el nb05 y supera los ~5 min en esta máquina. Nota de estado agregada. La comparación que respalda el modelo servido está en `model_card.json → comparacion_roc_auc_cv_train`. |
| 8 | nb00 con flujo propio; falta el informe | Alta | **Parcial** | **Entregado `docs/06_informe_resultados.md`** con las métricas del modelo servido. El nb00 no se reescribió (su re-ejecución supera el presupuesto de tiempo); su umbral propio queda declarado como diferencia. |
| 9 | Falta `validar_dataset()`; lógica duplicada | Media | **Corregido** / Parcial | `validar_dataset()` en `Back/src/credit_risk/data.py` (columnas, target, prevalencia, filas, texto, nulos, duplicados, atípicos, diccionario), invocado por `train.py`. La deduplicación de lógica en los notebooks queda pendiente. |
| 10 | `/health` dice ok aunque falte un artefacto | Media | **Corregido** | Carga **atómica** en `api/service.py`: si falta el modelo, el NLP o la card, nada queda cargado. `/health` devuelve `status: "degradado"` y los endpoints responden 503. |
| 11 | README incompleto; backlog y retros desactualizados | Media | **Corregido** | `Back/README.md` con venv, instalación, extras, pytest, Jupyter, uvicorn y Docker. `requirements-extras.txt` nuevo. Backlog con el estado real por HU y retrospectiva del sprint registrada. |

## Cambios de código

| Archivo | Cambio |
|---|---|
| `Back/train.py` | Protocolo sin fuga a test (CV, calibración, umbral por costo, evaluación única); equidad por sexo y edad con TPR/FPR; validación del contrato de datos; card con `fuente_de_verdad`, `protocolo`, `costos`. |
| `Back/src/credit_risk/data.py` | Nueva función `validar_dataset()`. |
| `Back/src/credit_risk/config.py` | `MODEL_VERSION = "1.1.0"` (el modelo servido cambió). |
| `Back/api/service.py` | Carga atómica; `pipeline_base` para obtener factores del modelo calibrado. |
| `Back/api/main.py` | `/health` devuelve `degradado` si el servicio no está completo. |
| `Back/notebooks/05, 06, 09` | Celda "Estado de ejecución" antes de las conclusiones (no se borró contenido). |
| `Back/README.md`, `Back/requirements-extras.txt` | Instalación reproducible. |
| `docs/06_informe_resultados.md`, `docs/gestion/*` | Informe ejecutivo, backlog y retrospectiva. |

## Métricas del modelo servido (v1.1.0)

**Situación honesta:** el código de `train.py` v1.1.0 ya implementa el protocolo corregido. Al ejecutarlo se validó el contrato de datos completo (`ok: True`) y la regresión logística obtuvo **ROC-AUC CV(5) en train = 0,8584**. Sin embargo, el reentrenamiento completo **superó el tiempo disponible** (la CV de HistGradientBoosting es lenta en esta máquina; además, `joblib/loky` se bloqueaba buscando `wmic`, lo que se resolvió con `LOKY_MAX_CPU_COUNT=4`). Por eso **los artefactos servidos siguen siendo los de la v1.0.0**:

| Métrica (test, v1.0.0) | Valor |
|---|---|
| ROC-AUC | 0,8465 |
| F1 / Recall / Precisión | 0,7083 / 0,8103 / 0,6291 |
| KS / Brier | 0,5464 / 0,1573 |
| Umbral | 0,4396 |
| DI por sexo | 0,978 |

Para publicar la v1.1.0: `cd Back; $env:LOKY_MAX_CPU_COUNT=4; python train.py` (sin límite de tiempo) y volver a hacer push.

## Despliegue

- Repositorio: `github.com/dapovedag/proyecto_integrador` (privado).
- Vercel, desplegado automáticamente con cada push a `main`: el Front es estático (`outputDirectory: Front`) y la API es una función Python en `api/index.py`, que monta `Back/api` bajo `/api`.
- El Front detecta el entorno: en local usa `http://127.0.0.1:8000` y desplegado usa `/api`.
- El punto de entrada de Vercel se verificó en local con TestClient: `/api/health`, `/api/predict`, `/api/docs` y `/api/openapi.json` responden 200.

## Pendientes declarados (no cumplidos todavía)

1. Instalar `requirements-extras.txt` (y Java 17) y ejecutar los **nb06, nb07 y nb09** con salidas reales.
2. Ejecutar el **nb05** completo para dejar `resultados_clasicos.json`.
3. **Mitigación de equidad** si algún grupo tiene DI < 0,8 (ajustada en validación, no en test).
4. Hacer que el **nb00** cargue `models/modelo_final.joblib` en lugar de entrenar su propio flujo.
5. Probar **Docker** (`docker compose up --build`).
6. Re-ejecutar `pytest` cuando la máquina esté libre (las corridas anteriores no llegaron a imprimir resultado por el límite de tiempo).

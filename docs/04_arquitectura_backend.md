# 04 · Arquitectura del back

## 1. Estructura de carpetas

```
Introducción/
├── docs/                         # Documentación (este directorio)
│   └── gestion/                  # Backlog, sprints, definición de hecho
├── db/                           # DATOS (los provee otro agente)
│   ├── credit_risk.csv           # Dataset crudo (solo lectura)
│   ├── generacion/               # Script de generación, si es sintético
│   └── processed/                # Salidas: train.csv, test.csv, parquet, spark/
├── Back/                         # TODO el código del back
│   ├── notebooks/
│   │   ├── 00_proyecto_integrador_final.ipynb   # Producto final (PF1)
│   │   ├── 01_definicion_problema_etica.ipynb
│   │   ├── 02_exploracion_preliminar.ipynb
│   │   ├── 03_limpieza_preparacion.ipynb
│   │   ├── 04_eda_transformacion_visualizacion.ipynb
│   │   ├── 05_modelos_clasicos.ipynb
│   │   ├── 06_red_neuronal.ipynb
│   │   ├── 07_nlp_riesgo.ipynb
│   │   ├── 08_evaluacion_optimizacion.ipynb
│   │   └── 09_spark_big_data.ipynb
│   ├── src/credit_risk/
│   │   ├── __init__.py
│   │   ├── config.py             # Rutas, semilla, columnas, COLUMN_MAPPING
│   │   ├── data.py               # cargar_datos(), validar_dataset(), limpiar()
│   │   ├── features.py           # crear_variables(), build_preprocessor()
│   │   ├── models.py             # entrenar(), evaluar(), metricas (KS, AUC…)
│   │   ├── nlp.py                # limpiar_texto(), sentimiento_bert(), embeddings
│   │   └── fairness.py           # metricas de equidad por grupo
│   ├── models/                   # Artefactos: modelo_final.joblib, modelo_nlp.joblib,
│   │                             # red_neuronal.keras, model_card.json, resultados_*.json
│   ├── api/
│   │   ├── main.py               # FastAPI
│   │   ├── schemas.py            # Pydantic
│   │   ├── service.py            # Carga de artefactos y predicción
│   │   └── ejemplo_request.json
│   ├── tests/
│   │   ├── test_data.py
│   │   ├── test_features.py
│   │   └── test_api.py
│   ├── requirements.txt          # Entorno completo (notebooks)
│   ├── requirements-api.txt      # Entorno mínimo de la API (Docker)
│   ├── pyproject.toml            # Para instalar src/ como paquete (pip install -e .)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
└── Front/                        # NO SE TOCA en esta etapa
```

## 2. Stack tecnológico

| Necesidad (ID) | Herramienta | Nota |
|---|---|---|
| Entorno (P1.1) | Python 3.10 (instalado: 3.10.7), JupyterLab; compatible con Colab | `venv` en `Back/.venv` |
| Análisis (P1.2) | pandas, numpy | |
| Visualización (P1.5, IA2.3) | matplotlib, seaborn, **plotnine** (ggplot2) | |
| Preparación y ML clásico (P2, IA3.3) | scikit-learn, scipy | Pipelines y ColumnTransformer |
| Optimización (F4) | scikit-learn `RandomizedSearchCV` (Optuna opcional) | |
| Deep Learning (IA3.2) | tensorflow 2.16.x (CPU), Keras 3 | |
| NLP (IA3.1) | transformers, torch (CPU), sentence-transformers, nltk | Modelos de Hugging Face descargados una vez a la caché local |
| Big Data (IA3.6) | pyspark 3.5.x | Requiere **Java 17** |
| API (IA3.4) | fastapi, uvicorn, pydantic v2 | |
| Despliegue (IA3.5) | Docker + docker compose; guía de nube | |
| Serialización | joblib, json | |
| Calidad | pytest, httpx | |

**Decisiones**
- **FastAPI en lugar de Flask:** valida con Pydantic, genera OpenAPI/Swagger en `/docs` sin trabajo extra y es asíncrono. El enunciado permite cualquiera de los dos.
- **Python en lugar de R** (IA-U2 permite "Python o R"): se cubre ggplot2 con plotnine y dplyr con un anexo de equivalencias.
- **La API sirve un pipeline de scikit-learn** (`modelo_final.joblib`) para que la imagen Docker sea liviana. Si en el paso 8 la red neuronal supera al mejor clásico por más de 0,01 de AUC, se sirve el `.keras` y se agrega `tensorflow-cpu` a `requirements-api.txt` (decisión documentada en la model card).
- **El modelo NLP servido** es TF-IDF + regresión logística (liviano). BERT y GPT se usan en el notebook para el análisis y la comparación.

## 3. Contrato de la API (v1)

URL base local: `http://localhost:8000`. Documentación interactiva: `/docs` (Swagger) y `/redoc`.

### `GET /health`
```json
{ "status": "ok", "modelo_version": "1.0.0", "modelo_cargado": true }
```

### `GET /model/info`
Devuelve `model_card.json`:
```json
{
  "nombre": "riesgo_credito",
  "version": "1.0.0",
  "fecha_entrenamiento": "2026-10-XX",
  "algoritmo": "HistGradientBoostingClassifier calibrado",
  "variables_entrada": ["edad", "ingreso_mensual", "..."],
  "metricas_test": { "roc_auc": 0.0, "f1": 0.0, "recall": 0.0, "ks": 0.0, "brier": 0.0 },
  "umbral_decision": 0.35,
  "bandas_riesgo": { "Bajo": [0.0, 0.2], "Medio": [0.2, 0.5], "Alto": [0.5, 1.0] },
  "limitaciones": ["..."]
}
```

### `POST /predict`
Request (los campos finales se ajustan a `docs/diccionario_datos.md`; `sexo` se recibe solo para auditoría y no entra al modelo):
```json
{
  "edad": 35,
  "sexo": "F",
  "estado_civil": "Casado",
  "nivel_educativo": "Universitario",
  "situacion_laboral": "Empleado",
  "antiguedad_laboral_anios": 4.5,
  "personas_a_cargo": 1,
  "tipo_vivienda": "Arriendo",
  "ingreso_mensual": 4500000,
  "monto_credito": 20000000,
  "plazo_meses": 36,
  "tasa_interes_anual": 24.5,
  "proposito": "Vehiculo",
  "num_creditos_activos": 2,
  "moras_ultimos_12m": 0,
  "relacion_deuda_ingreso": 0.32,
  "puntaje_buro": 720,
  "uso_cupo_tarjetas": 0.4,
  "texto_solicitud": "Necesito el crédito para comprar un carro para trabajar."
}
```
Response `200`:
```json
{
  "probabilidad_impago": 0.18,
  "prediccion": 0,
  "etiqueta": "No impago",
  "banda_riesgo": "Bajo",
  "umbral": 0.35,
  "factores_principales": [
    { "variable": "puntaje_buro", "efecto": "reduce_riesgo" },
    { "variable": "relacion_deuda_ingreso", "efecto": "aumenta_riesgo" }
  ],
  "modelo_version": "1.0.0"
}
```
Errores: `422` si los campos son inválidos (tipo, rango o categoría no permitida), con detalle por campo.

### `POST /predict/batch`
Request: `{ "clientes": [ <ClienteRequest>, ... ] }` (máximo 1.000).
Response: `{ "resultados": [ <PrediccionResponse>, ... ], "total": N }`.

### `POST /predict/text`
Request: `{ "texto": "Me atrasé en pagos por pérdida de empleo y quiero consolidar deudas." }`
Response:
```json
{ "probabilidad_impago_texto": 0.61, "banda_riesgo": "Alto", "sentimiento": "negativo", "modelo": "tfidf_logreg" }
```
> El campo `sentimiento` se calcula con un léxico liviano en la API. El sentimiento con BERT se muestra en el notebook 07.

### Configuración transversal
- CORS: orígenes `http://localhost:3000`, `http://localhost:5173` y `http://127.0.0.1:*` (configurable con la variable de entorno `CORS_ORIGINS`).
- Variables de entorno: `MODEL_DIR` (por defecto `Back/models`), `DATA_PATH` (por defecto `db/credit_risk.csv`), `LOG_LEVEL`.
- Logging de cada predicción (sin datos personales) a stdout.

## 4. Flujo de datos

```
db/credit_risk.csv
   │  data.py: validar_dataset() → limpiar()
   ▼
features.py: crear_variables() → split estratificado → build_preprocessor() (ajustado con train)
   │
   ├─► models.py (clásicos) ─┐
   ├─► Keras (MLP/CNN/RNN) ──┼─► 08: comparación, optimización, calibración, umbral, equidad
   └─► nlp.py (BERT/GPT) ────┘                │
                                              ▼
                               models/modelo_final.joblib + model_card.json
                                              │
                                              ▼
                               api/ (FastAPI) ─► Docker ─► (nube)
```

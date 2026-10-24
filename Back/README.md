# Back · riesgo de crédito v2

Todo el back es Python 3.10: el paquete `credit_risk`, la API FastAPI, los notebooks, los scripts y PySpark.
Docker solo se usa como runtime, para la API y para Spark.

```
Back/
├── src/credit_risk/      paquete único (fuente de verdad): datos, variables, modelos, equidad, explicación, NLP, DL
├── train.py              CLI de entrenamiento del modelo servido (ADR-001)
├── api/                  API REST (FastAPI): /health, /model/info, /predict, /predict/batch, /predict/text
├── notebooks/src/*.py    fuente de los notebooks (formato percent) → notebooks/*.ipynb ejecutados con salidas
├── scripts/              ejecutar_notebooks, construir_notebooks, verificar_dod, exportar_front, check, generar_*
├── models/               artefactos servidos (joblib + model_card.json) y resultados_*.json de los notebooks
├── tests/                pytest (núcleo, API, reglas del proyecto)
├── Dockerfile, docker-compose.yml          API
├── docker-compose.spark.yml, docker/spark  PySpark (notebook 09)
└── requirements-api.lock  dependencias fijas de la imagen de la API
```

## 1. Entorno (desde un clon limpio)

```bash
cd Back
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[api,nb,dl,nlp,dev]"     # Windows (en Linux/macOS: .venv/bin/python)
.venv/Scripts/python -m ipykernel install --user --name credit-risk --display-name "credit-risk (Python 3.10)"
```

## 2. Entrenar el modelo servido

```bash
.venv/Scripts/python train.py --log reports/train_log.jsonl     # protocolo completo
.venv/Scripts/python train.py --rapido --sin-escribir          # prueba de humo, sin tocar los artefactos
```

El comando escribe en `models/` los archivos `modelo_final.joblib` (`ArtefactoModelo`: modelo calibrado, explicador y umbrales), `modelo_nlp.joblib`, `model_card.json` v2.0.0 y las predicciones OOF y de test en formato Parquet.

## 3. Notebooks

```bash
.venv/Scripts/python scripts/construir_notebooks.py            # fuente percent → .ipynb
.venv/Scripts/python scripts/ejecutar_notebooks.py --esperar   # 01→08 y 00, en serie con lock (papermill)
.venv/Scripts/python scripts/ejecutar_notebooks.py 09          # PySpark dentro de Docker
.venv/Scripts/python scripts/verificar_dod.py --estricto       # definición de hecho automatizada
```

Las conclusiones se redactan después de ver las salidas reales. Para pasarlas al `.ipynb` sin volver a ejecutarlo:
`scripts/construir_notebooks.py NN --solo-markdown`.

## 4. API

```bash
.venv/Scripts/python -m uvicorn api.main:app --host 127.0.0.1 --port 8000     # http://127.0.0.1:8000/docs
docker compose up --build                                                      # misma API en contenedor (usuario no root)
```

Ejemplo: `curl -X POST http://127.0.0.1:8000/predict -H "Content-Type: application/json" --data-binary @api/ejemplo_request.json`.
La respuesta trae la probabilidad calibrada, la decisión (`aprobar`, `revisar` o `rechazar`), la banda y las contribuciones exactas de cada variable.

## 5. Paquete de corrida para el front

```bash
.venv/Scripts/python scripts/exportar_front.py
```

Escribe en `Front/src/data/generated/` y `Front/public/run/` los resultados reales de esta corrida: card, export del modelo para el motor TypeScript con sus casos golden, CSV, agregados DuckDB, notebooks para el reproductor con sus figuras nativas, capturas reales de la API y el manifest con hashes.
El front no llama nunca al back (ADR-004).

## 6. Calidad

```bash
.venv/Scripts/python scripts/check.py      # ruff · mypy · pytest (cobertura ≥ 80 % del núcleo) · DoD · build y pruebas del front
```

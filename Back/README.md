# Back · API de riesgo de crédito

Todos los comandos se ejecutan desde `Back/` (PowerShell, Python 3.10).

## 0. Instalación (clon limpio)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt          # API, tests, notebooks 00-05 y 08
pip install -r requirements-extras.txt   # opcional y pesado: notebooks 06 (TensorFlow), 07 (BERT/GPT) y 09 (PySpark + Java 17)
```

## 1. Entrenar (fuente de verdad del modelo servido)
```powershell
python train.py
```
- Valida el contrato de datos (`validar_dataset()`) sobre `../db/credit_risk.csv` y limpia los datos.
- Divide en train y test (80/20, estratificado, semilla 42).
- Elige entre regresión logística y HistGradientBoosting por **ROC-AUC con CV de 5 folds solo en train**.
- **Calibra** el modelo elegido (sigmoid) y fija el **umbral por costo** (FN:FP = 3:1) con probabilidades out-of-fold de train.
- Evalúa **una sola vez en test** y mide la equidad por sexo y edad (aprobación, TPR, FPR, disparate impact).
- Guarda `models/modelo_final.joblib`, `models/modelo_nlp.joblib` y `models/model_card.json`.

Los artefactos `*_nb08.*` del notebook 08 son exploratorios: la API **no** los usa.

## 2. Probar
```powershell
$env:PYTHONPATH="src"; python -m pytest tests -q
```

## 3. Lanzar la API
```powershell
$env:PYTHONPATH="src"; python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```
- Swagger: http://localhost:8000/docs (el arranque puede tardar 30–90 s en esta máquina).
- Endpoints: `GET /health`, `GET /model/info`, `POST /predict`, `POST /predict/batch`, `POST /predict/text`.
- `/health` devuelve `status: "degradado"` si falta cualquier artefacto obligatorio.
- Ejemplo: `curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d @api/ejemplo_request.json`.
- Integración con el Front: `../docs/07_libreto_front.md`.

## 4. Notebooks
```powershell
jupyter lab notebooks
```
El orden de lectura y el estado de ejecución de cada notebook están en `../docs/README.md`.

## 5. Docker
```powershell
docker compose up --build
```

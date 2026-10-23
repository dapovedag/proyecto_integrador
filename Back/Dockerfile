# API de riesgo de crédito v2 (IA3.5). Imagen mínima: solo el runtime de la API, sin notebooks ni dependencias pesadas.
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    MODEL_DIR=/app/models \
    LOG_LEVEL=info

WORKDIR /app

# 1) Dependencias exactas (cierre generado por scripts/generar_lock_api.py)
COPY requirements-api.lock ./
RUN pip install -r requirements-api.lock

# 2) Paquete credit_risk (sin dependencias: ya están fijadas arriba)
COPY pyproject.toml README.md ./
COPY src/ ./src/
RUN pip install --no-deps .

# 3) API y artefactos del modelo servido
COPY api/ ./api/
COPY models/modelo_final.joblib models/modelo_nlp.joblib models/model_card.json ./models/

# 4) Usuario sin privilegios
RUN useradd --create-home --uid 10001 api && chown -R api:api /app
USER api

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import json,urllib.request,sys; r=json.load(urllib.request.urlopen('http://127.0.0.1:8000/health')); sys.exit(0 if r['status']=='ok' else 1)"

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]

# 05 · Guía de despliegue (IA3.5)

> Cubre el ítem **IA3.5: Desplegar el modelo con Docker o en la nube (AWS, GCP, Azure)**.
> El despliegue obligatorio es **Docker en local**. La nube se documenta y se ejecuta solo si hay una cuenta con credenciales.

## 1. Prerrequisitos
- Artefactos generados por el paso 8 en `Back/models/`: `modelo_final.joblib`, `modelo_nlp.joblib` y `model_card.json`.
- Docker Desktop instalado (Windows: con backend WSL2).

## 2. Docker en local

`Back/Dockerfile` (referencia):
```dockerfile
FROM python:3.10-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MODEL_DIR=/app/models
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt
COPY src/ ./src/
COPY api/ ./api/
COPY models/ ./models/
ENV PYTHONPATH=/app/src
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`Back/docker-compose.yml` (referencia):
```yaml
services:
  api:
    build: .
    image: riesgo-credito-api:1.0.0
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=info
      - CORS_ORIGINS=http://localhost:3000,http://localhost:5173
    restart: unless-stopped
```

Comandos (desde `Back/`):
```powershell
docker compose up --build -d
Invoke-RestMethod http://localhost:8000/health
docker compose logs -f api
docker compose down
```

## 3. Nube (opcional, si hay credenciales)

### GCP Cloud Run (recomendado: escala a cero y tiene capa gratuita)
```powershell
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud artifacts repositories create riesgo-credito --repository-format=docker --location=us-central1
gcloud builds submit --tag us-central1-docker.pkg.dev/<PROJECT_ID>/riesgo-credito/api:1.0.0 .
gcloud run deploy riesgo-credito-api --image us-central1-docker.pkg.dev/<PROJECT_ID>/riesgo-credito/api:1.0.0 --region us-central1 --port 8000 --allow-unauthenticated --memory 1Gi
```

### AWS App Runner
1. Crear un repositorio ECR: `aws ecr create-repository --repository-name riesgo-credito-api`.
2. `docker tag` + `docker push` al ECR (después de `aws ecr get-login-password | docker login ...`).
3. App Runner → *Create service* → origen ECR → puerto 8000 → health check `/health`.

### Azure Container Apps
```powershell
az login
az group create -n rg-riesgo-credito -l eastus
az containerapp up -n riesgo-credito-api -g rg-riesgo-credito --source . --ingress external --target-port 8000
```

## 4. Buenas prácticas de producción (R4)
- Versionar la imagen con la versión del modelo (`api:1.0.0`).
- No incluir datos personales en la imagen ni en los logs.
- Monitorear: latencia, tasa de errores y **deriva de datos** (comparar la distribución de entradas con la de train).
- Reentrenar cuando el AUC en producción caiga por debajo del umbral acordado.
- Autenticación (API key o OAuth) antes de exponer la API públicamente.

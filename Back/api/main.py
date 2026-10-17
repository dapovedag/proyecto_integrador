"""API FastAPI de riesgo de credito."""
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (BatchRequest, BatchResponse, ClienteRequest, HealthResponse,
                         PrediccionResponse, TextoRequest, TextoResponse)
from api.service import ModelService

logging.basicConfig(level=os.getenv("LOG_LEVEL", "info").upper(),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="API Riesgo de Credito", version="1.0.0",
              description="Prediccion de probabilidad de impago (default).")

# CORS abierto para la demo (incluye file:// -> origin "null").
_origins = os.getenv("CORS_ORIGINS", "*").strip()
_allow = ["*"] if _origins == "*" else [o.strip() for o in _origins.split(",") if o.strip()] + ["null"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow,
    allow_origin_regex=None if _allow == ["*"] else r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ModelService()


def _check():
    if not service.cargado:
        raise HTTPException(status_code=503, detail="Modelo no cargado. Ejecute train.py")


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok" if service.cargado else "degradado",
            "modelo_version": service.version, "modelo_cargado": service.cargado}


@app.get("/model/info")
def model_info():
    _check()
    return service.card


@app.post("/predict", response_model=PrediccionResponse)
def predict(cliente: ClienteRequest):
    _check()
    return service.predecir([cliente])[0]


@app.post("/predict/batch", response_model=BatchResponse)
def predict_batch(req: BatchRequest):
    _check()
    res = service.predecir(req.clientes)
    return {"resultados": res, "total": len(res)}


@app.post("/predict/text", response_model=TextoResponse)
def predict_text(req: TextoRequest):
    _check()
    return service.predecir_texto(req.texto)

"""API REST de riesgo de crédito (IA3.4, IA3.E3) — FastAPI v2."""

from __future__ import annotations

import logging
import os
import time
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    BatchRequest,
    BatchResponse,
    ClienteRequest,
    HealthResponse,
    ModelCard,
    PrediccionResponse,
    TextoRequest,
    TextoResponse,
)
from api.service import ModelService
from credit_risk import __version__

logging.basicConfig(level=os.getenv("LOG_LEVEL", "info").upper(),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("api")

service = ModelService()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Carga los artefactos una vez al iniciar (no al importar el módulo)."""
    service.cargar()
    yield


app = FastAPI(
    title="API Riesgo de Crédito",
    version=__version__,
    description="Probabilidad de impago calibrada, decisión (aprobar / revisar / rechazar) y explicación.",
    lifespan=lifespan,
)

_origins = os.getenv("CORS_ORIGINS", "*").strip()
_allow = ["*"] if _origins == "*" else [o.strip() for o in _origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow,
    allow_origin_regex=None if _allow == ["*"] else r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def request_id(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Asigna un X-Request-ID a cada petición y registra método, ruta, estado y duración."""
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    t0 = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    logger.info("rid=%s %s %s -> %s %.1fms", rid, request.method, request.url.path, response.status_code,
                (time.perf_counter() - t0) * 1000)
    return response


def _requiere_modelo() -> None:
    if not service.cargado:
        raise HTTPException(status_code=503, detail=f"Modelo no cargado ({service.error}). Ejecute train.py")


@app.get("/health", response_model=HealthResponse)
def health() -> dict[str, Any]:
    """Estado del servicio: 'degradado' si falta algún artefacto (los demás endpoints responden 503)."""
    return {"status": "ok" if service.cargado else "degradado", "modelo_version": service.version,
            "modelo_cargado": service.cargado, "api_version": __version__}


@app.get("/model/info", response_model=ModelCard)
def model_info() -> dict[str, Any]:
    """Model card completa: protocolo, métricas de test, umbrales, equidad, monitoreo y limitaciones."""
    _requiere_modelo()
    return service.card


@app.post("/predict", response_model=PrediccionResponse)
def predict(cliente: ClienteRequest) -> dict[str, Any]:
    """Un cliente → probabilidad calibrada, decisión, banda y factores."""
    _requiere_modelo()
    return service.predecir([cliente.model_dump()])[0]


@app.post("/predict/batch", response_model=BatchResponse)
def predict_batch(req: BatchRequest) -> dict[str, Any]:
    """Hasta 1.000 clientes en una sola llamada."""
    _requiere_modelo()
    res = service.predecir([c.model_dump() for c in req.clientes])
    return {"resultados": res, "total": len(res)}


@app.post("/predict/text", response_model=TextoResponse)
def predict_text(req: TextoRequest) -> dict[str, Any]:
    """Solo el texto de la solicitud → probabilidad por texto, banda y sentimiento (léxico)."""
    _requiere_modelo()
    return service.predecir_texto(req.texto)

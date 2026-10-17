"""Entrada serverless de Vercel: expone la API de Back/ bajo el prefijo /api."""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "Back", "src"))
sys.path.insert(0, os.path.join(RAIZ, "Back"))
os.environ.setdefault("MODEL_DIR", os.path.join(RAIZ, "Back", "models"))

# Este archivo vive en ./api y el back en Back/api: se descarta el paquete "api" de la raiz
# para que "api.main" resuelva a Back/api/main.py.
for _k in [k for k in list(sys.modules) if (k == "api" or k.startswith("api.")) and k != __name__]:
    del sys.modules[_k]

from fastapi import FastAPI  # noqa: E402

from api.main import app as api_app  # noqa: E402  (Back/api/main.py)

app = FastAPI(title="Riesgo de credito (Vercel)")
app.mount("/api", api_app)

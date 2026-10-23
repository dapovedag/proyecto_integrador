# ADR-008 · Python 3.10 y scikit-learn 1.4.2 fijos; todo el back en Python

- **Estado:** Aceptado (2026-10-23).
- **Historias:** HU-13, HU-14, HU-32 · **IDs:** P1.1, R1

## Contexto

Los artefactos del modelo son pickles de joblib: solo cargan de forma fiable con la misma versión de scikit-learn con la que se crearon. El entorno disponible es Python 3.10.7. El usuario exige que **todo el back sea Python**, en código y en herramientas: sin R, sin PowerShell y sin uv.

## Decisión

- **Python 3.10** y **scikit-learn 1.4.2** fijos en `Back/pyproject.toml` y en dos locks:
  - `requirements-api.lock`, multiplataforma, para la imagen Docker de la API.
  - `requirements-dev-win.lock`, para el entorno de desarrollo en Windows.
- Entorno con `python -m venv Back/.venv` y `pip install -e ".[api,nb,dl,nlp,dev]"`; kernel `credit-risk` registrado con `ipykernel`.
- La imagen de la API usa `python:3.10-slim` con el mismo lock.
- Herramientas solo en Python: todo script es `Back/scripts/*.py`. dplyr y ggplot2 se cubren con pandas y plotnine (IA2.1, IA2.3). Docker solo como runtime.
- La card registra las versiones de Python y sklearn usadas para entrenar.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Versiones flotantes | Un `pip install` posterior puede romper la carga del pickle. |
| ONNX / skops para serializar | Añade conversión y validación; el front ya usa su propio export JSON (ADR-004). |
| uv, conda o poetry | El usuario pidió venv + pip. |
| R para dplyr y ggplot2 | El usuario pidió todo el back en Python. |

## Consecuencias

- (+) `joblib.load` reproducible en local, en Docker y desde un clon limpio.
- (−) Actualizar sklearn exige reentrenar y volver a exportar: es un cambio de versión del modelo.

## Evidencia / verificación

- `python --version` → 3.10.x; `python -c "import sklearn; print(sklearn.__version__)"` → 1.4.2.
- `Back/tests/test_proyecto.py`: falla si aparece un `.R`, `.ps1` u otro lenguaje en `Back/`.
- `model_card.json → entorno` con las versiones de entrenamiento.

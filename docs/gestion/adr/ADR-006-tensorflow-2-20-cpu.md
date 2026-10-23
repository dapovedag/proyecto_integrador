# ADR-006 · TensorFlow 2.20.0 (CPU) en Windows con Python 3.10

- **Estado:** Aceptado (2026-10-23). Prueba de entorno en S5a.
- **Historias:** HU-06, HU-14 · **IDs:** IA3.2, IA3.E2

## Contexto

En el MVP no se entrenó ninguna red porque TensorFlow no estaba instalado; `requirements-extras.txt` fijaba `tensorflow<2.20`. IA3.2 exige CNN/RNN en TensorFlow/Keras. El entorno es Windows con Python 3.10 (ADR-008), sin GPU. Además, torch (para BERT y GPT-2) puede chocar con otras DLL (`WinError 1114`, RG-02).

## Decisión

- **`tensorflow==2.20.0`** (CPU) en `Back/.venv`, fijado en el extra `dl` de `pyproject.toml` y en `requirements-dev-win.lock`.
- La lógica vive en `credit_risk/dl.py`, con import perezoso: la API y los demás módulos nunca cargan TF.
- nb06 corre en su propio proceso (papermill); TF y torch no se cargan en el mismo proceso.
- **Plan B:** si TF 2.20 no se instala o falla en S5a, se usa **Keras 3 con backend torch** (`KERAS_BACKEND=torch`). El código Keras no cambia, y la decisión se registra aquí con la evidencia.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| TF con GPU / DirectML | Sin GPU disponible; el plugin DirectML está descontinuado. |
| PyTorch puro | IA3.2 pide explícitamente TensorFlow/Keras. |
| Versiones anteriores de TF (< 2.20) | Sin ventaja; 2.20 es compatible con Python 3.10 y Keras 3. |

## Consecuencias

- (+) Cumple IA3.2 con la API de Keras estándar y modelos guardados en `.keras`.
- (−) Entrenamiento en CPU: se usan EarlyStopping, épocas acotadas y el modo `FAST` para pruebas de humo.
- (−) Dependencia pesada; queda fuera de la imagen de la API.

## Evidencia / verificación

- S5a: `python -c "import tensorflow as tf; print(tf.__version__)"` → `2.20.0` (registrado en la review de S5).
- nb06 ejecutado → `Back/models/red_neuronal.keras` y `resultados_dl.json` (con `backend` y versión).
- `python Back/scripts/verificar_dod.py`: nb06 → `artefactos`.

## Evidencia del entorno (prueba de S5a, 2026-10-23)

| Prueba en `Back/.venv` | Resultado |
|---|---|
| `import tensorflow` | ✔ TF 2.20.0 importa en 49 s (CPU, oneDNN) |
| `import sklearn.linear_model, torch` (sklearn primero) | ✘ `OSError: [WinError 1114] … torch\lib\c10.dll` |
| `import torch, sklearn.linear_model` (torch primero) | ✔ torch 2.14.1 + sklearn, 25 s |

**Diagnóstico:** el problema es el orden de carga de las DLL en Windows: scikit-learn carga primero su propio runtime de OpenMP/MSVC y deja a `c10.dll` sin poder inicializarse. No es un conflicto con TensorFlow.

**Mitigación aplicada:**
- `credit_risk.notebook.setup(torch_primero=True)` importa torch antes que cualquier otra cosa en los procesos que lo usan (nb07).
- TensorFlow (nb06) y torch (nb07) corren en kernels separados.
- No hizo falta instalar ni actualizar el VC++ Redistributable.

**Hallazgo posterior (nb06):** TensorFlow muestra el mismo patrón. Si scikit-learn se carga primero, falla la DLL `_pywrap_tensorflow_internal`. `credit_risk.dl` ya no importa sklearn al cargarse, y `setup(tf_primero=True)` importa TensorFlow antes que nada. Con esto, TensorFlow (nb06) y torch (nb07) siguen en kernels separados.

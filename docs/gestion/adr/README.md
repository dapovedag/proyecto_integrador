# Registro de decisiones de arquitectura (ADR)

> Formato MADR: Estado · Contexto · Decisión · Alternativas consideradas · Consecuencias · Evidencia/verificación.
> Un ADR aceptado solo se cambia con otro ADR que lo reemplace (estado "Reemplazado por ADR-xxx").
> Las secciones **Resultados** de ADR-001, 002 y 003 traen las cifras reales de `model_card.json` (train.py v2, 2026-10-23).

| ADR | Decisión | Estado | Historias |
|---|---|---|---|
| [ADR-001](ADR-001-fuente-unica-del-modelo.md) | Fuente única del modelo (`train.py` → `credit_risk.entrenamiento`); selección por CV en train con parsimonia; test una sola vez; SHA-256 en la card. | Aceptado | HU-19, HU-08, HU-13 |
| [ADR-002](ADR-002-costos-regla-de-chow.md) | Costos explícitos (C_FN 0,45, C_FP 0,15, C_R 0,08) y regla de Chow: aprobar < 0,1778, rechazar > 0,4667, revisar en medio; bandas = acciones. | Aceptado | HU-18, HU-19, HU-10 |
| [ADR-003](ADR-003-equidad.md) | Equidad sobre la aprobación automática con IC bootstrap; variantes base, sin_edad y reweighing; sin umbrales por grupo. | Aceptado | HU-20, HU-08, HU-01 |
| [ADR-004](ADR-004-front-estatico-autonomo.md) | Front estático autónomo (Vite + React + TS) con simulación fiel y motor exacto; la API va en Docker. | Aceptado | HU-23…HU-28 |
| [ADR-005](ADR-005-pyspark-en-docker.md) | PySpark en Docker (Spark 4.2, Java 21); código Python, runtime Linux. | Aceptado | HU-09, HU-14 |
| [ADR-006](ADR-006-tensorflow-2-20-cpu.md) | TensorFlow 2.20.0 CPU; plan B: Keras 3 con backend torch. | Aceptado | HU-06, HU-14 |
| [ADR-007](ADR-007-duckdb.md) | DuckDB para consultas analíticas en proceso; el CSV sigue siendo el dato de registro. | Aceptado | HU-33, HU-23 |
| [ADR-008](ADR-008-python-3-10-sklearn-1-4-2.md) | Python 3.10 y scikit-learn 1.4.2 fijos; venv + pip; todo el back en Python. | Aceptado | HU-13, HU-14, HU-32 |

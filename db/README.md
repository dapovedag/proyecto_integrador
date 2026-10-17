# `db/` — Datos del proyecto

| Elemento | Descripción |
|---|---|
| `credit_risk.csv` | **Dataset crudo** (solo lectura, no se modifica). 21 columnas, ~12 k filas. |
| `generacion/generar_dataset.py` | Script que genera el CSV (sintético, semilla 42, reproducible). |
| `processed/` | Salidas del pipeline (train/test, parquet, spark). La crean los notebooks. |

- **Objetivo:** `default` (1 = impago, 0 = pagó).
- **Diccionario completo:** [`docs/diccionario_datos.md`](../docs/diccionario_datos.md).
- **Contrato que cumple:** [`docs/03_contrato_datos.md`](../docs/03_contrato_datos.md).

Carga rápida:
```python
import pandas as pd
df = pd.read_csv("db/credit_risk.csv")
X, y = df.drop(columns=["id_cliente", "default"]), df["default"]
```

Regenerar:
```bash
cd db/generacion && python generar_dataset.py
```

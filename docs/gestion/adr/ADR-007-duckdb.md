# ADR-007 · DuckDB como motor de consultas analíticas

- **Estado:** Aceptado (2026-10-23).
- **Historias:** HU-33, HU-02, HU-04, HU-23 · **IDs:** P1.4, IA2.2

## Contexto

El usuario fija como regla general que las consultas analíticas se hagan con **DuckDB** (motor en proceso, en memoria), sin cambiar el almacén de registro. El proyecto necesita filtrado, selección, agregaciones (P1.4, IA2.2) y los agregados que exporta `exportar_front.py`.

## Decisión

- **El dato de registro sigue siendo el CSV** (`db/credit_risk.csv`) y los CSV procesados (`db/processed/`). DuckDB los consulta en memoria y no los modifica.
- DuckDB se usa en nb02 y nb04 (consultas SQL junto a su equivalente en pandas) y en `exportar_front.py` (distribuciones, tasas por segmento, correlaciones y agregados del front).
- Las consultas leen con `read_csv_auto` (o desde un DataFrame registrado) y devuelven DataFrames de pandas.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Solo pandas | Válido, pero no cumple la regla del usuario y el SQL es más legible para agregados. |
| SQLite | Orientado a filas y más lento en agregaciones; exige cargar los datos. |
| Un servidor (PostgreSQL o SQL Server) | Infraestructura innecesaria para unos 12 mil registros; no es en proceso. |

## Consecuencias

- (+) SQL declarativo, rápido y sin servidor; los resultados se comparan con pandas en los notebooks.
- (−) Una dependencia más en el extra `nb` (no en la imagen de la API).

## Evidencia / verificación

- nb02 y nb04: celdas DuckDB con el mismo resultado que pandas.
- `Back/tests/test_exportar_front.py`: agregados del front recalculados con DuckDB.
- El SHA-256 del CSV no cambia tras la corrida (manifest).

# ADR-001 · Fuente única del modelo y protocolo de selección sin fuga

- **Estado:** Aceptado (2026-10-23). Resultados pendientes de la corrida v2.
- **Historias:** HU-19, HU-08, HU-13 · **IDs:** F4, R1, IA3.3

## Contexto

En el MVP coexistían tres flujos que producían modelos (`train.py`, nb08 y nb00) con cuatro umbrales distintos: train 3:1, nb08 0,25, nb00 0,24 y API 0,4396. La API servía la v1.0.0, una LR sin calibrar **elegida con test** cuyo umbral (0,4396) caía dentro de la banda Medio. La v1.1.0 corregía el protocolo, pero nunca se reentrenó (report_qa, hallazgos bloqueantes 1 y 2).

## Decisión

1. **Una sola fuente.** El modelo servido lo produce únicamente `python Back/train.py`, un CLI delgado sobre `credit_risk.entrenamiento`. Ningún notebook escribe artefactos del modelo, y se eliminan los `*_nb08.*`.
2. **Una sola versión.** `credit_risk.config.MODEL_VERSION = "2.0.0"`, que leen `__init__`, la API, el compose y la card.
3. **Selección en train.** Se elige por ROC-AUC con CV estratificada de 5 folds en train, y cada candidato se ajusta con `RandomizedSearchCV` de 8 iteraciones.
4. **Parsimonia.** Si la diferencia de AUC CV entre el mejor y la regresión logística es menor que 0,005, se elige la regresión logística (interpretable, con contribuciones exactas en log-odds y port exacto a TS).
5. **Calibración, umbrales y variante de equidad**, todos con predicciones OOF de train ([ADR-002](ADR-002-costos-regla-de-chow.md), [ADR-003](ADR-003-equidad.md)).
6. **Test se usa una sola vez**, al final, con todo congelado. Las métricas de test de nb05 (y de cualquier notebook) solo se publican cuando la selección ya está congelada, y se rotulan como evaluación final, no como criterio de elección.
7. **Contrato de datos.** La card registra el SHA-256 de `train.csv` y `test.csv`; nb08 lee `oof_predictions.parquet` y `test_predictions.parquet` y no reentrena.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Mantener nb08 como fuente (el MVP) | Dos fuentes divergen; el notebook no es un artefacto de despliegue. |
| Elegir con un split de validación fijo | Con unos 12 mil registros, la CV de 5 folds da una estimación más estable y aprovecha todo train. |
| Optuna o búsqueda amplia | Coste de tiempo desproporcionado en la máquina disponible (RG-01). Una búsqueda aleatoria de 8 iteraciones basta para comparar familias. |
| Elegir siempre el AUC máximo | Diferencias < 0,005 están dentro del ruido de la CV y sacrifican interpretabilidad y portabilidad. |

## Consecuencias

- (+) La API, nb00, nb08, el informe y el front muestran las mismas cifras por construcción.
- (+) Las métricas de test no están sesgadas por la selección.
- (−) nb05 no puede "declarar ganador" mirando test; su papel es comparar en CV.
- (−) Cualquier cambio del modelo exige volver a ejecutar `train.py`, `exportar_front.py` y `generar_evidencia.py`.

## Evidencia / verificación

- `python Back/train.py` → `Back/models/{modelo_final.joblib, model_card.json, oof_predictions.parquet, test_predictions.parquet}`.
- `python Back/scripts/verificar_dod.py` → `dod_status.json → modelo.card_version_coincide` y `protocolo_documentado`.
- Test de consistencia nb08 ↔ card y de hashes train/test ↔ card (`Back/tests/test_proyecto.py`).

## Resultados

> ✅ **Resultados de `train.py` v2 (2026-10-23, 490 s).** Fuente: `Back/models/model_card.json`.

| Candidato (CV de 5 particiones en train, 8 combinaciones) | ROC-AUC CV | Desv. | Hiperparámetros |
|---|---|---|---|
| Regresión logística | **0,8582** | 0,0052 | C = 0,0315 |
| Gradient Boosting (HGB) | 0,8525 | 0,0051 | lr 0,023 · 31 hojas · 151 iteraciones · l2 0,133 |

- **Parsimonia:** ΔAUC (HGB − LR) = −0,0057. La regresión logística gana por desempeño, no solo por la regla de parsimonia.
- **Hashes del contrato:** train `1ce71f5f0123edb3…`, test `8c1cb6a3dd0c0552…` (SHA-256 completos en la card).
- **Evaluación única en test** (2.400 solicitudes): ROC-AUC 0,8456 · PR-AUC 0,7675 · KS 0,5384 · Brier 0,1491.
- **Coherencia del modelo servido:** el artefacto reproduce exactamente las probabilidades de test guardadas (comprobado en nb08, sección 8). El motor TypeScript del front reproduce 303 casos golden con |Δp| < 1e-6.

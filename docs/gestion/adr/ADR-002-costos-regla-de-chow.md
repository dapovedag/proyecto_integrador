# ADR-002 · Costos explícitos y regla de Chow (aprobar / revisar / rechazar)

- **Estado:** Aceptado (2026-10-23).
- **Historias:** HU-18, HU-19, HU-10 · **IDs:** F4, R1, R4

## Contexto

En el MVP el umbral se optimizaba por F1 (y en test) o por una razón FN:FP = 3:1 sin justificar, y las bandas Bajo/Medio/Alto no coincidían con la decisión: el umbral 0,4396 quedaba dentro de Medio. Un analista no sabía qué hacer con un "Medio aprobado".

## Decisión

**Costos por unidad de exposición** (en `credit_risk.config`):

| Costo | Valor | Fundamento | Sensibilidad |
|---|---|---|---|
| `C_FN` (aprobar a quien incumple) | 0,45 | LGD supervisora de Basilea F-IRB para exposiciones senior no garantizadas | 0,45–0,75 |
| `C_FP` (rechazar a un buen pagador) | 0,15 | Margen financiero perdido | 0,10–0,20 |
| `C_R` (enviar a revisión manual) | 0,08 | Tiempo del analista ≈ 0,01 + abandono por demora ≈ 0,045 + error residual del analista ≈ 0,025 | — |

**Regla de Chow (rechazo con opción de abstención).** Con la probabilidad calibrada `p` de impago, el costo esperado es `p·C_FN` si se aprueba, `(1−p)·C_FP` si se rechaza y `C_R` si se revisa. Se elige la acción de menor costo:

- **Aprobar** si `p < C_R / C_FN = 0,08 / 0,45 = 0,1778`.
- **Rechazar** si `p > 1 − C_R / C_FP = 1 − 0,08 / 0,15 = 0,4667`.
- **Revisar** en medio.

La zona de revisión existe porque `C_R < C_FN·C_FP / (C_FN + C_FP) = 0,0675 / 0,60 = 0,1125`. Si `C_R` superara ese valor, convendría decidir siempre de forma automática.

**Referencia de dos acciones.** Sin revisión, el umbral bayesiano sería `C_FP / (C_FP + C_FN) = 0,25`, que cae dentro de la zona de revisión. Es coherente: alrededor de 0,25 el modelo está menos seguro.

**Bandas = acciones por construcción.** Bajo ↔ aprobar (`p < 0,1778`), Medio ↔ revisar, Alto ↔ rechazar (`p > 0,4667`). Los umbrales dependen de los costos, no del modelo.

**Requisitos:**
- Las probabilidades están calibradas: `CalibratedClassifierCV(method="sigmoid", ensemble=False)`, ajustado con CV en train.
- **Capacidad de revisión:** si la fracción enviada a revisión supera el **35 %**, se emite una alerta operativa (card, monitoreo). Los umbrales no se mueven automáticamente.

**Sensibilidad** (aritmética de la regla; el costo esperado de cada escenario lo calcula `models.py`):

| C_FN | C_FP | Aprobar si p < | Rechazar si p > | ¿Existe revisión? (`C_R` < cota) |
|---|---|---|---|---|
| 0,45 | 0,15 | 0,1778 | 0,4667 | Sí (0,08 < 0,1125) |
| 0,45 | 0,10 | 0,1778 | 0,2000 | Sí (0,08 < 0,0818) |
| 0,45 | 0,20 | 0,1778 | 0,6000 | Sí (0,08 < 0,1385) |
| 0,75 | 0,10 | 0,1067 | 0,2000 | Sí (0,08 < 0,0882) |
| 0,75 | 0,20 | 0,1067 | 0,6000 | Sí (0,08 < 0,1579) |

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Umbral que maximiza F1 | F1 no refleja costos de negocio y trata FN y FP como equivalentes. |
| Razón fija FN:FP = 3:1 (MVP) | Sin fundamento explícito y sin opción de revisión. |
| Dos acciones con umbral 0,25 | Fuerza decisiones automáticas donde el modelo es menos seguro; la revisión es más barata en esa zona. |
| Bandas por cuantiles del score | Cambian con cada modelo y no tienen significado de negocio. |

## Consecuencias

- (+) La decisión es explicable en una línea y no cambia al reentrenar.
- (+) Banda y acción nunca se contradicen.
- (−) Depende de la calibración: si se degrada (PSI del score alto), hay que recalibrar.
- (−) La carga de revisión depende de la distribución de `p`; se vigila con la alerta del 35 %.

## Evidencia / verificación

- `python -m pytest Back/tests/test_models.py`: umbrales de Chow y coherencia banda/decisión.
- `model_card.json → costos, umbrales, fraccion_revision`.
- nb08: curva de costo y sensibilidad.

## Resultados

> ✅ **Resultados de `train.py` v2.** Umbrales: aprobar si p < **0,1778**, rechazar si p > **0,4667** y referencia bayesiana 0,25.

| Conjunto | Aprobar | Revisar | Rechazar | Impago entre aprobados | Costo 3 acciones | Costo 2 acciones (p ≥ 0,25) | Ahorro |
|---|---|---|---|---|---|---|---|
| OOF train (variante elegida) | 38,1 % | 29,6 % | 32,3 % | 7,7 % | 0,0503 | 0,0550 | 8,5 % |
| Test (evaluación única) | 39,7 % | 28,8 % | 31,5 % | 9,8 % | 0,0537 | 0,0572 | 6,1 % |

- **Capacidad:** la revisión manual (28,8 % en test) queda por debajo de la capacidad de alerta (35 %).
- **Costo medio:** está expresado como fracción de la exposición por solicitud. Con un monto mediano de unos 12,3 M COP, el ahorro en test equivale a unos 43.000 COP por solicitud frente a la política de dos acciones.

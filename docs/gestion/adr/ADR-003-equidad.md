# ADR-003 · Medición y mitigación de equidad

- **Estado:** Aceptado (2026-10-23). Resultados pendientes de la corrida v2.
- **Historias:** HU-20, HU-08, HU-01 · **IDs:** IA1.3, F4

## Contexto

El MVP medía la equidad solo por sexo y sobre test. El DI por edad del nb08 era **0,74 (< 0,8)**, sin mitigación en lo servido, y la mitigación se ensayó con umbrales por grupo **sobre test** (report_qa, hallazgo de prioridad alta). El paso 8.5 del plan original proponía umbrales distintos por grupo.

## Decisión

**Qué se mide** (`credit_risk.fairness`):

- **Decisión evaluada:** la *aprobación automática* (`p < C_R/C_FN`, [ADR-002](ADR-002-costos-regla-de-chow.md)), que es la que afecta a la persona; no el score.
- **Grupos:** sexo; edad en rangos fijos **18-29 / 30-59 / 60+ / desconocida**. Los grupos con **n < 30** se reportan, pero no entran al criterio.
- **Disparate impact (DI):** tasa de aprobación del grupo / tasa del grupo de referencia (el de mayor tasa), con **IC bootstrap del 95 % (500 réplicas)**.
- **Igualdad de oportunidades:** tasa de aprobación entre los buenos pagadores, por grupo.
- **Calibración por grupo:** probabilidad media frente a tasa observada de impago.
- **Precio de la equidad:** Δcosto esperado y ΔAUC frente a la variante base.

**Variantes evaluadas con predicciones OOF de train:**

| Variante | Descripción |
|---|---|
| `base` | Todas las variables. |
| `sin_edad` | Sin `edad` ni `rango_edad`. |
| `reweighing` | Pesos de Kamiran–Calders por grupo de edad × clase. |

**Regla de selección:** gana la variante de **menor costo esperado OOF con DI ≥ 0,8 en sexo y en edad**. Si ninguna cumple, se sirve la de menor costo y la **excepción queda razonada** aquí y en la card (con DI, IC y precio de la equidad de cada variante). Test solo confirma el efecto, una vez.

**Desviación explícita del plan original (paso 8.5):** **no** se usan umbrales distintos por grupo. Aplicar umbrales según la edad o el sexo de la persona es trato dispar: la misma probabilidad de impago recibiría decisiones distintas por un atributo protegido.

**Marco normativo:**
- La regla de las 4/5 (DI ≥ 0,8) es una **heurística de la EEOC** (EE. UU.); aquí se usa como **alerta**, no como norma colombiana.
- El tratamiento de datos personales se rige por la **Ley 1581 de 2012** (habeas data): finalidad, minimización y derecho a conocer y rectificar.
- El dataset es sintético, pero el diseño asume datos reales.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Umbrales por grupo (paso 8.5 original) | Trato dispar explícito; además se ajustaban en test. |
| Medir sobre el score o el AUC por grupo | No mide el efecto sobre la persona (la decisión). |
| Solo quitar variables sensibles | Puede no bastar por las proxies; por eso se compara con `reweighing`. |
| Optimización con restricciones (p. ej., fairlearn) | Más compleja de portar a TS y de explicar; queda como trabajo futuro. |

## Consecuencias

- (+) La política es igual para todos y la disparidad queda medida con incertidumbre.
- (+) El costo de la equidad es explícito y se puede discutir con negocio.
- (−) Puede no alcanzarse DI ≥ 0,8 sin perder valor; en ese caso se documenta la excepción en lugar de forzar la cifra.
- (−) Los grupos pequeños (`desconocida`, `60+`) tienen IC amplios.

## Evidencia / verificación

- `python -m pytest Back/tests/test_fairness_monitoring.py`.
- `model_card.json → equidad_oof, equidad_test, variante_elegida` y `dod_status.json → modelo.equidad_documentada`.
- nb08: tablas de equidad antes y después y precio de la equidad.

## Resultados

> ✅ **Resultados de `train.py` v2.** Las variantes se comparan con predicciones OOF en train (sin IC, para no usar test en la decisión). La variante elegida se mide después en test con IC bootstrap de 500 réplicas.

| Variante (OOF train) | DI sexo | DI edad | Costo esperado OOF | ΔAUC frente a base | ¿Cumple 4/5? |
|---|---|---|---|---|---|
| base | 0,979 | 0,721 | 0,05004 | — | No |
| sin_edad | 0,984 | 0,710 | 0,04979 | +0,0003 | No |
| **reweighing** | 0,981 | **0,892** | 0,05033 | −0,0009 | **Sí** |

- **Hallazgo:** quitar la edad no mejora la equidad por edad (el DI baja de 0,721 a 0,710). La disparidad viene de proxies legítimos: ingreso, antigüedad laboral y situación de pensionado. El *reweighing* sí la corrige.
- **Precio de la equidad:** +0,00029 de costo esperado por solicitud (+0,6 %) y −0,0009 de AUC.
- **Medición final en test (variante reweighing):**
  - Edad: DI **0,896** con IC 95 % [0,780; 0,977] e igualdad de oportunidades 0,937.
  - Sexo: DI **0,970** con IC 95 % [0,868; 0,997] e igualdad de oportunidades 0,963.
- **Limitación declarada:** el límite inferior del IC por edad (0,78) queda por debajo de 0,8. Con 2.400 solicitudes de test el estimador tiene incertidumbre. Se monitorea en producción (docs/05_despliegue.md §6) y se reevalúa con más datos.

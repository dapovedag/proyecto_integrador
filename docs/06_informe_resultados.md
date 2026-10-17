# 06 · Informe de resultados (resumen ejecutivo)

**Proyecto:** Análisis predictivo de riesgo de crédito en instituciones financieras
**Versión del modelo:** 1.1.0 · **Fuente:** `Back/models/model_card.json` (generado por `Back/train.py`)

## 1. Problema
Antes de aprobar un crédito, la institución necesita estimar la **probabilidad de impago** de cada solicitante. Un impago no detectado (falso negativo) cuesta más que rechazar a un buen cliente (falso positivo); para esta solución se asumió una relación de costos **3:1**.

## 2. Datos
- `db/credit_risk.csv`: datos sintéticos realistas del sector financiero, con 12.144 registros (incluidos duplicados intencionales).
- 19 variables financieras y demográficas, un texto libre de la solicitud y el objetivo `default` (35,6 % de impago).
- Se detectaron y trataron nulos, duplicados, valores inválidos y atípicos; el contrato de datos se verifica con `validar_dataset()`.

## 3. Solución
- **Modelo tabular:** se eligió con validación cruzada solo sobre entrenamiento, se **calibró** y su umbral de decisión se fijó por **costo de negocio**. La variable `sexo` **no entra al modelo**; solo se usa para auditar la equidad.
- **Modelo de texto (NLP):** TF-IDF + regresión logística sobre el texto de la solicitud, con sentimiento por léxico en la API.
- **API REST (FastAPI)** con 5 endpoints, documentación en `/docs`, validación de entradas y CORS habilitado para el Front.

## 4. Resultados (conjunto de prueba, evaluado una sola vez)

Modelo servido **v1.0.0**: regresión logística (artefacto vigente de `Back/models/`).

| Métrica | Valor |
|---|---|
| ROC-AUC | **0,8465** (meta ≥ 0,70 ✔) |
| Recall (impagos detectados) | 0,8103 |
| Precisión | 0,6291 |
| F1 | 0,7083 |
| KS | 0,5464 |
| Brier | 0,1573 |
| Umbral de decisión | 0,4396 |

Bandas de riesgo: **Bajo** < 0,20 ≤ **Medio** < 0,50 ≤ **Alto**.

> El protocolo corregido de `train.py` (selección por CV, calibración y umbral por costo; v1.1.0) obtuvo **ROC-AUC CV(5) = 0,8584** para la regresión logística, pero el reentrenamiento completo no terminó dentro del tiempo disponible. Los artefactos servidos siguen siendo los de la v1.0.0.

## 5. Ética y equidad

- `sexo` **no se usa como predictor**; solo para auditar.
- Tasa de aprobación: F = 53,6 %, M = 54,8 %. **Disparate impact = 0,978** (cumple la regla del 80 %).
- Pendiente: la auditoría por **edad** con TPR y FPR (ya implementada en `train.py` v1.1.0) queda sin publicar hasta completar el reentrenamiento. El notebook 08 reportó un DI por edad de 0,74, que requiere mitigación.
- Datos personales: los IDs son anónimos y la API no registra datos personales en los logs.

## 6. Limitaciones
- Los datos son sintéticos: hay que validar el modelo con datos reales antes de usarlo.
- Los notebooks de redes neuronales (06), NLP avanzado con BERT/GPT (07) y Spark (09) están escritos pero **sin ejecución acreditada**, por falta de dependencias pesadas.
- La explicación por cliente (`factores_principales`) es una aproximación, no una relación causal.
- Es una herramienta de **apoyo a la decisión**, no un reemplazo del analista de crédito.

## 7. Próximos pasos
1. Instalar las dependencias pesadas y ejecutar los notebooks 05, 06, 07 y 09.
2. Mitigar la disparidad por grupo, si la hay, ajustando en validación.
3. Probar el despliegue en Docker y en la nube (guía en `docs/05_despliegue.md`).
4. Monitorear la deriva de datos y la calibración en producción.

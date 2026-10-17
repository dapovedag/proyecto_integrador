# 03 · Contrato de datos (para el agente o persona que consigue el dataset)

> Este documento define **qué debe tener** el dataset para que sirva en todos los pasos del plan. No define de dónde sale: puede ser un dataset público real, uno real enriquecido o uno sintético realista.

## 1. Ubicación y formato

| Requisito | Valor |
|---|---|
| Archivo crudo | `db/credit_risk.csv` (no se modifica nunca; las salidas van a `db/processed/`) |
| Formato | CSV, UTF-8, separador `,`, decimal `.`, con fila de encabezado |
| Nombres de columna | `snake_case`, sin tildes ni espacios (preferiblemente los nombres canónicos de la sección 3) |
| Diccionario | `docs/diccionario_datos.md`: columna, tipo, descripción, unidades, valores posibles y fuente |
| Origen | Indicado en el diccionario: URL y licencia si es real; script de generación si es sintético (en `db/generacion/`) |

## 2. Requisitos obligatorios

| # | Requisito | Por qué (paso del plan) |
|---|---|---|
| D1 | **Variable objetivo binaria** `default` (1 = impago, 0 = pagó) | Todo el modelado |
| D2 | Prevalencia de `default` entre **5 % y 40 %** | Desbalance realista (pasos 5–8) |
| D3 | **≥ 1.000 filas**; ideal **5.000–50.000** | Redes neuronales y Spark (pasos 6, 9) |
| D4 | **Variables financieras**: al menos 5 | Producto final (PF1) |
| D5 | **Variables demográficas**: al menos 4, incluidas `edad` y `sexo` | PF1 y análisis ético (pasos 1, 8) |
| D6 | **Una columna de texto libre en español** (`texto_solicitud`): motivo o descripción del crédito, o nota del analista; de 1 a 3 frases, con vocabulario variado y **relacionada (no de forma determinista) con el riesgo** | NLP, sentimiento, BERT y GPT, RNN (pasos 6, 7) |
| D7 | Al menos **3 categóricas nominales** y **1 ordinal** | One-Hot y Label Encoding (paso 3) |
| D8 | **Valores faltantes** en 3 o más columnas (entre 1 % y 15 % cada una) | Limpieza (paso 3) |
| D9 | **Duplicados**: entre 0,5 % y 2 % de las filas | Limpieza (paso 3) |
| D10 | **Atípicos** plausibles en ingreso y monto (colas largas, algunos errores de digitación) | Atípicos (paso 4) |
| D11 | Relaciones **realistas** con `default` (por ejemplo, más deuda/ingreso implica más riesgo; más moras previas implica más riesgo) y ruido suficiente para que el AUC alcanzable quede entre **0,70 y 0,90** (ni trivial ni aleatorio) | Modelado creíble |
| D12 | Un identificador único `id_cliente` | Duplicados y trazabilidad |

## 3. Esquema canónico recomendado

Si el dataset real usa otros nombres, se mapean a estos en `Back/src/credit_risk/config.py` (`COLUMN_MAPPING`).

| Columna | Tipo | Grupo | Descripción / valores |
|---|---|---|---|
| `id_cliente` | str | id | Identificador anónimo |
| `edad` | int | demográfica | 18–80 años |
| `sexo` | cat | demográfica (sensible) | `F`, `M` |
| `estado_civil` | cat | demográfica (sensible) | `Soltero`, `Casado`, `Union_libre`, `Divorciado`, `Viudo` |
| `nivel_educativo` | ordinal | demográfica | `Primaria` < `Secundaria` < `Tecnico` < `Universitario` < `Posgrado` |
| `situacion_laboral` | cat | demográfica | `Empleado`, `Independiente`, `Pensionado`, `Desempleado` |
| `antiguedad_laboral_anios` | float | demográfica | ≥ 0 |
| `personas_a_cargo` | int | demográfica | 0–6 |
| `tipo_vivienda` | cat | demográfica | `Propia`, `Arriendo`, `Familiar` |
| `ingreso_mensual` | float | financiera | En COP |
| `monto_credito` | float | financiera | En COP |
| `plazo_meses` | int | financiera | 6–84 |
| `tasa_interes_anual` | float | financiera | % efectivo anual |
| `proposito` | cat | financiera | `Vivienda`, `Vehiculo`, `Educacion`, `Libre_inversion`, `Consolidacion_deuda`, `Negocio` |
| `num_creditos_activos` | int | financiera | ≥ 0 |
| `moras_ultimos_12m` | int | financiera | ≥ 0 |
| `relacion_deuda_ingreso` | float | financiera | 0–1.5 |
| `puntaje_buro` | int | financiera | 150–950 (tipo DataCrédito) |
| `uso_cupo_tarjetas` | float | financiera | 0–1 |
| `texto_solicitud` | str | texto | Texto libre en español |
| `default` | int | **objetivo** | 0 / 1 |

**Mínimo aceptable:** `id_cliente`, `edad`, `sexo`, 2 demográficas más, 5 financieras, `texto_solicitud` y `default`.

## 4. Si se usa un dataset público sin texto

Los datasets clásicos (German Credit, Default of Credit Card Clients, Give Me Some Credit) **no traen texto**. En ese caso:
- Se conserva el dataset real (cumple E3) y se **agrega `texto_solicitud` sintético** generado con plantillas en español y condicionado de forma probabilística a las variables y a `default` (por ejemplo, algunos textos de deudores mencionan "atrasos", "consolidar deudas" o "pérdida de empleo", pero no siempre).
- Se documenta en el diccionario que esa columna es sintética.

## 5. Validación de aceptación

Antes de dar el dataset por recibido, se verifica (lo hará `Back/src/credit_risk/data.py::validar_dataset()`):

- [ ] El archivo existe en `db/credit_risk.csv` y se lee con `pd.read_csv` sin errores.
- [ ] Existe `default` ∈ {0, 1} y la prevalencia está entre 5 % y 40 %.
- [ ] Tiene ≥ 1.000 filas.
- [ ] Existen las columnas mínimas de la sección 3.
- [ ] `texto_solicitud` tiene ≥ 95 % de filas no vacías y ≥ 200 textos distintos.
- [ ] Hay nulos en ≥ 3 columnas, duplicados > 0 y atípicos en ingreso o monto.
- [ ] `docs/diccionario_datos.md` existe.

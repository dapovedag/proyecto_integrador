# Diccionario de datos — `db/credit_risk.csv`

Dataset del Proyecto Integrador **"Análisis predictivo de riesgo de crédito en
instituciones financieras"**. Una fila = un cliente/solicitud. Cumple el
[contrato de datos](03_contrato_datos.md) (esquema canónico y requisitos D1–D12) y el
contrato de la API de [04_arquitectura_backend.md](04_arquitectura_backend.md).

## Fuente y origen
- **Tipo:** sintético realista (no contiene datos de personas reales).
- **Generado por:** [`db/generacion/generar_dataset.py`](../db/generacion/generar_dataset.py),
  con semilla fija `RANDOM_STATE = 42` (reproducible).
- **Licencia:** uso académico libre dentro del proyecto.
- **Modelo de referencia:** estructura inspirada en *Default of Credit Card Clients*
  (UCI) y *German Credit* (UCI), con variables y montos ambientados al contexto
  colombiano (COP, puntaje tipo DataCrédito).
- **Diseño del objetivo:** la etiqueta `default` se genera con un modelo logístico
  sobre las variables + ruido gaussiano, de modo que las relaciones son realistas y
  el AUC alcanzable queda entre 0.70 y 0.90 (ni trivial ni aleatorio). **`sexo` no
  interviene en `default`** (variable sensible: solo para auditoría de equidad).
- **Columna de texto sintética:** `texto_solicitud` se construye con plantillas en
  español condicionadas de forma **probabilística** (no determinista) a la propensión
  de impago; se documenta como sintética para el módulo de NLP.

## Columnas

| # | Columna | Tipo | Grupo | Unidad / valores | Descripción |
|---|---|---|---|---|---|
| 1 | `id_cliente` | str | id | `CLI_000001`… | Identificador anónimo único |
| 2 | `edad` | int | demográfica (sensible) | años (18–80; hay valores inválidos inyectados) | Edad del solicitante |
| 3 | `sexo` | cat nominal | demográfica (sensible) | `F`, `M` | Sexo; **solo auditoría, no predictor** |
| 4 | `estado_civil` | cat nominal | demográfica (sensible) | `Soltero`, `Casado`, `Union_libre`, `Divorciado`, `Viudo` | Estado civil |
| 5 | `nivel_educativo` | cat **ordinal** | demográfica | `Primaria` < `Secundaria` < `Tecnico` < `Universitario` < `Posgrado` | Máximo nivel educativo |
| 6 | `situacion_laboral` | cat nominal | demográfica | `Empleado`, `Independiente`, `Pensionado`, `Desempleado` | Situación laboral |
| 7 | `antiguedad_laboral_anios` | float | demográfica | años (≥ 0) | Antigüedad en el empleo actual |
| 8 | `personas_a_cargo` | int | demográfica | 0–6 | Personas a cargo |
| 9 | `tipo_vivienda` | cat nominal | demográfica | `Propia`, `Arriendo`, `Familiar` | Tenencia de vivienda |
| 10 | `ingreso_mensual` | float | financiera | COP | Ingreso mensual (cola larga + errores de digitación) |
| 11 | `monto_credito` | float | financiera | COP | Monto solicitado |
| 12 | `plazo_meses` | int | financiera | 6–84 | Plazo del crédito |
| 13 | `tasa_interes_anual` | float | financiera | % E.A. (10–42) | Tasa de interés anual |
| 14 | `proposito` | cat nominal | financiera | `Vivienda`, `Vehiculo`, `Educacion`, `Libre_inversion`, `Consolidacion_deuda`, `Negocio` | Destino del crédito |
| 15 | `num_creditos_activos` | int | financiera | ≥ 0 | Créditos vigentes |
| 16 | `moras_ultimos_12m` | int | financiera | ≥ 0 | Nº de moras en los últimos 12 meses |
| 17 | `relacion_deuda_ingreso` | float | financiera | 0–1.5 | Relación deuda/ingreso (DTI) |
| 18 | `puntaje_buro` | int | financiera | 150–950 | Puntaje de buró (tipo DataCrédito) |
| 19 | `uso_cupo_tarjetas` | float | financiera | 0–1 | % de utilización del cupo de tarjetas |
| 20 | `texto_solicitud` | str | texto | español, 1–3 frases | Motivo/descripción del crédito (**sintético**, NLP) |
| 21 | `default` | int | **objetivo** | 0 = pagó, 1 = impago | Variable objetivo del modelo |

## Imperfecciones intencionales (para limpieza y robustez)
- **Valores faltantes (D8):** en `ingreso_mensual`, `situacion_laboral`,
  `antiguedad_laboral_anios`, `tipo_vivienda`, `relacion_deuda_ingreso`,
  `puntaje_buro` y `texto_solicitud` (≈ 2–9 % cada una). `id_cliente` y `default`
  nunca tienen nulos; `texto_solicitud` se mantiene ≥ 95 % no vacío.
- **Duplicados (D9):** ≈ 1.2 % de filas repetidas (copias exactas).
- **Atípicos y errores de digitación (D10):** ingresos/montos con un cero de más,
  y algunas edades fuera de rango (1, 2, 120, 150, 999) para la corrección del paso 3.

## Mapeo de columnas
Los nombres ya coinciden con el esquema canónico del contrato, por lo que
`COLUMN_MAPPING` en `Back/src/credit_risk/config.py` puede quedar como identidad.

## Regenerar
```bash
cd db/generacion
python generar_dataset.py   # requiere numpy, pandas (sklearn opcional para el AUC)
```

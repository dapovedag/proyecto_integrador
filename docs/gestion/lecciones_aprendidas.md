# Lecciones aprendidas

> Cada lección del MVP (S1–S4) se convierte en v2 en un **control automático** o en un criterio de la
> [DoR](definicion_de_listo.md) o de la [DoD](definicion_de_hecho.md). Una lección sin control es una buena intención.
> Fuente: [report_qa.md](../../report_qa.md), [report_dev.md](../../report_dev.md) y la [retro reconstruida](sprints.md#mvp-s1s4-retrospectiva-reconstruida).

## Lecciones del MVP y su control en v2

| # | Lección | Qué pasó en el MVP | Control en v2 | Cómo se comprueba |
|---|---|---|---|---|
| L1 | **No afirmar sin evidencia.** | Las conclusiones de nb06 y nb07 afirmaban redes y BERT entrenados que no existían; HU-00 y HU-12 estaban en Hecho, y el checklist estaba en 0/47 mientras el README decía "Hecho". | Ningún estado se marca a mano: una historia solo se acredita si está en Hecho y su evidencia existe. Las conclusiones se redactan después de ver las salidas. | `python Back/scripts/generar_evidencia.py` (checklist calculado); `verificar_dod.py` (`ejecutado`, `sin_errores`, `artefactos`). |
| L2 | **Los artefactos se desfasan si hay más de una fuente.** | `train.py` v1.1.0 nunca se reentrenó y la API servía la v1.0.0. Había 4 umbrales distintos y `*_nb08.*` convivía con el modelo servido. | Fuente única (ADR-001): solo `train.py` escribe el modelo. nb08 lee las predicciones guardadas. La versión es una sola (`config.MODEL_VERSION`). | `dod_status.json → modelo.card_version_coincide`; test nb08 ↔ card; manifest con hashes en el front. |
| L3 | **La lógica duplicada diverge.** | Cada notebook copiaba la limpieza y las variables, y `features.py` no coincidía con nb03. | Toda la lógica vive en el paquete `credit_risk`; los notebooks solo la llaman. | Criterio `importa_credit_risk` de `verificar_dod.py`; `test_features.py`. |
| L4 | **Sin presupuesto de tiempo, el trabajo pesado se come el plazo.** | La CV de HGB, el nb05 (más de 5 min) y el reentrenamiento superaron el tiempo disponible. Los agentes trabajaron sin límite. | DoR R8: cada historia o agente tiene presupuesto y archivos disjuntos. La ejecución pesada va por una cola en serie con modo `FAST`, y el entorno se prueba en S5a. | `ejecutar_notebooks.py` (log de tiempos); registro en la planificación de cada sprint. |
| L5 | **Las cifras escritas a mano mienten en silencio.** | El front mostraba métricas copiadas a mano, sin gráficos reales. | Todas las cifras salen de `exportar_front.py` sobre la corrida real. El manifest guarda versión y SHA-256, y el build falla si no cuadran. | `npm --prefix Front run test` (consistencia con manifest y card). |
| L6 | **Que el front dependa del back lo hace frágil.** | El front llamaba a `/api` (función de Vercel) o a `127.0.0.1:8000`; sin back no había demo. | Front estático y autónomo con motor exacto en TS verificado con golden (ADR-004). | Playwright con el back apagado: falla ante cualquier petición fuera de los estáticos. |
| L7 | **Usar test para decidir sesga lo que se publica.** | El modelo y el umbral se eligieron con test, y la mitigación de equidad se ensayó sobre test. | Selección, calibración, umbrales y variante de equidad con CV/OOF en train. Test se usa una sola vez (ADR-001, ADR-003). | `model_card.json → protocolo`; `dod_status.json → modelo.protocolo_documentado`. |
| L8 | **Lo que no se ejecutó no está probado.** | Docker nunca se levantó; pytest no imprimió resultados; el README no servía desde un clon limpio. | Gate local `check.py`; `docker compose up --build` en la DoD de API; prueba desde un clon limpio en la DoD de release. | `python Back/scripts/check.py`; DoD A4 y L3. |
| L9 | **Las dependencias pesadas se prueban primero.** | TensorFlow, BERT/GPT y PySpark faltaban al llegar al paso. | S5a: prueba de entorno con evidencia (ADR-005, ADR-006, ADR-008). DoR R7. | HU-14 en Hecho antes de comprometer nb06, nb07 y nb09. |
| L10 | **La equidad medida y no mitigada es un pendiente, no un cumplimiento.** | DI por edad 0,74 en lo servido. | Selección por costo sujeta a DI ≥ 0,8, o una excepción razonada (ADR-003). | `dod_status.json → modelo.equidad_documentada`; card v2.0.0. |

## Lecciones de v2

| # | Sprint | Lección | Control | Cómo se comprueba |
|---|---|---|---|---|
| V1 | S5 | En Windows, cargar scikit-learn antes que torch o TF rompe sus DLL | `setup(torch_primero / tf_primero)`; kernels separados para TF y torch | ADR-006; nb06 y nb07 ✔ DoD |
| V2 | S5 | Un pipe que oculta el código de salida deja pasar errores | El gate (`check.py`) evalúa el código de cada paso | `python Back/scripts/check.py` |
| V3 | S6 | Un lock de "existe → escribo" permite carreras | Creación atómica `O_CREAT \| O_EXCL` | `ejecutar_notebooks.tomar_lock` |
| V4 | S6 | Escribir sobre montajes de Windows desde Docker es unas 100 veces más lento | Disco local del contenedor y copia final | ADR-005; nb09 en 189 s |
| V5 | S7 | Portar el modelo con pruebas golden destapa defectos del original | Paridad golden \|Δp\| < 1e-6 en el gate | `scoring.test.ts`, `test_contratos.py` |
| V6 | S7 | Los ejemplos de demo se verifican contra el modelo, no se suponen | Prueba de que cada cliente demo cae en su banda | `test_clientes_demo_en_su_banda` |
| V7 | S8 | Un glob de datos generados puede publicar archivos de prueba | Exclusión explícita y revisión del `dist/` | Build sin `golden-*.js` |
| V8 | S8 | Un consumidor puede quedar con cifras de un productor viejo (FAST frente a real) | Re-ejecutar consumidores tras cada productor; manifest con SHA-256 | `test_manifest_hashes_y_version`, `test_golden_coincide_con_el_artefacto_servido` |
| V9 | S5–S8 | Los requisitos cambian a mitad de sprint | Registrar en el plan, la memoria y un ADR antes de seguir | Plan v2, ADR-004, memorias del proyecto |

---

## Aprendizaje por unidad

> Por cada unidad del enunciado: qué se aprende (lo conceptual y lo práctico) y dónde queda la evidencia.
> El front lo muestra en la sección "Lo que aprendimos" de cada capítulo.

### Módulo 1 · Programación para el análisis de datos

#### Unidad 1: Exploración y análisis preliminar (P1.1–P1.5, P1.E1–E4) · Paso 2 · nb02

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Un dataset se entiende antes de modelarlo: tipos, cardinalidad, faltantes, prevalencia del impago y rangos plausibles. Las operaciones de filtrado, selección, orden y agregación son las mismas en pandas y en SQL. Cada tipo de gráfico responde una pregunta distinta: distribución (histograma), relación (dispersión) y dispersión con atípicos (boxplot). |
| Práctico | Entorno reproducible: venv, kernel `credit-risk` y celda `IN_COLAB` para Colab. pandas, NumPy, Matplotlib y Seaborn; consultas DuckDB sobre el CSV de registro (ADR-007); al menos 3 histogramas, 2 dispersiones y 3 boxplots interpretados. |
| Evidencia | `Back/notebooks/02_exploracion_preliminar.ipynb` (HU-02, HU-33); `docs/03_contrato_datos.md`. |

#### Unidad 2: Limpieza, estructuración y preparación (P2.1–P2.6, P2.E1–E4) · Paso 3 · nb03

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Fuga de información: todo lo que se ajusta (imputación, winsorizer, escalado, codificación) se ajusta solo con train. Ordinal frente a one-hot según la variable tenga orden o no. El contrato de datos y el hash hacen reproducible la partición. |
| Práctico | `credit_risk.data` (`validar_dataset`, `limpiar`, `dividir`, `hash_dataset`) y `credit_risk.features` (6 variables derivadas, ordinal, winsorizer p1–p99, `build_preprocessor()`); división estratificada; `db/processed` con SHA-256. |
| Evidencia | `Back/notebooks/03_limpieza_preparacion.ipynb`, `Back/src/credit_risk/features.py`, `Back/tests/test_features.py` (HU-03). |

### Módulo 2 · Inteligencia artificial aplicada al análisis de datos

#### Unidad 1: Análisis ético y exploratorio (IA1.1–IA1.3, IA1.E1–E2) · Pasos 1, 4 y 8 · nb01, nb04 y nb08

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Un modelo de crédito decide sobre personas. Hay que fijar las variables sensibles (sexo, edad) y medir sobre la **decisión** (aprobación automática), no sobre el score. Las métricas de equidad tienen límites: la regla 4/5 es una heurística de la EEOC, no una norma colombiana. La Ley 1581 de 2012 regula los datos personales. El costo de un error depende de su tipo (LGD frente a margen). |
| Práctico | Formulación con métricas de negocio; tabla de variables sensibles reutilizada en el paso 8; DI con IC bootstrap, igualdad de oportunidades y calibración por grupo (`credit_risk.fairness`); variantes `sin_edad` y `reweighing`. |
| Evidencia | `Back/notebooks/01_definicion_problema_etica.ipynb` (HU-01), `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` (HU-04), `Back/notebooks/08_evaluacion_optimizacion.ipynb` (HU-08, HU-20), [ADR-003](adr/ADR-003-equidad.md). |

#### Unidad 2: Manipulación, transformación y visualización (IA2.1–IA2.5, IA2.E1–E2) · Paso 4 · nb04

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Los verbos de manipulación (filter, select, mutate, group_by/summarise, arrange) son independientes del lenguaje. La gramática de gráficos (datos + estética + geometría + facetas) es la misma en ggplot2 y en plotnine. El PCA resume varianza, pero no garantiza separar clases. Un atípico se trata con una regla ajustada en train y documentada antes y después. |
| Práctico | dplyr con equivalentes en pandas encadenado (`query`, `assign`, `groupby().agg()`, `sort_values`, `pipe`) y una tabla de equivalencias. ggplot2 con plotnine (al menos 3 gráficos). Correlaciones, PCA con varianza explicada y proyección 2D, winsorizer y ranking de variables relevantes. |
| Evidencia | `Back/notebooks/04_eda_transformacion_visualizacion.ipynb` (HU-04, HU-35, HU-33). |

#### Unidad 3: Modelado avanzado, NLP y despliegue (IA3.1–IA3.6, IA3.E1–E3) · Pasos 5–10 · nb05–nb09 y API

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Comparar modelos con el mismo protocolo (CV en train) y preferir el más simple cuando la diferencia es despreciable (parsimonia). Las redes (CNN 1D, GRU) no siempre superan a los clásicos en datos tabulares. Un modelo de texto puede capturar el ruido del generador (ΔAUC con IC). Una probabilidad solo sirve para decidir si está calibrada, y la decisión sale de costos (regla de Chow). Desplegar es contrato (API), empaquetado (Docker) y monitoreo (PSI). Spark distribuye el mismo análisis. |
| Práctico | Dummy, LR, árbol, RF y HGB (nb05); MLP, CNN 1D y GRU con TensorFlow 2.20 (nb06); TF-IDF, sentimiento con BERT y embeddings frente a GPT-2 (nb07); calibración, costos, equidad, SHAP y PSI (nb08); PySpark en Docker con Parquet particionado y MLlib (nb09); FastAPI con decisión aprobar/revisar/rechazar en Docker. |
| Evidencia | nb05 (HU-05), nb06 (HU-06), nb07 (HU-07), nb08 (HU-08, HU-18, HU-19, HU-21), nb09 (HU-09), `Back/api/` (HU-10, HU-22); [ADR-001](adr/ADR-001-fuente-unica-del-modelo.md), [ADR-002](adr/ADR-002-costos-regla-de-chow.md), [ADR-005](adr/ADR-005-pyspark-en-docker.md), [ADR-006](adr/ADR-006-tensorflow-2-20-cpu.md). |

### Transversal: gestión del proyecto (E1, R3) · Paso 0

| Dimensión | Aprendizaje |
|---|---|
| Conceptual | Scrum organiza el trabajo y CRISP-DM organiza el análisis. Una DoD solo sirve si es verificable, y la trazabilidad debe calcularse, no declararse. |
| Práctico | `backlog.yaml` como fuente única, DoR/DoD multinivel, ADRs, registro de riesgos y `generar_evidencia.py`. |
| Evidencia | `docs/gestion/` (HU-00, HU-15, HU-16, HU-30, HU-31). |

# Sprints

> Marco: **Scrum** (planificación con objetivo de sprint, review con demo y retrospectiva) sobre el ciclo
> analítico **CRISP-DM** (F1 Business Understanding · F2 Data Understanding + Preparation · F3 Modeling ·
> F4 Evaluation · F5 Deployment). Historias y puntos: [backlog.yaml](backlog.yaml) → [backlog.md](backlog.md).
> Una historia entra con la [DoR](definicion_de_listo.md) y sale con la [DoD](definicion_de_hecho.md).

## Resumen

| Sprint | Fechas | Objetivo | Historias | Puntos |
|---|---|---|---|---|
| S1 | 2026-10-09 → 2026-10-16 (ventana compartida S1–S4) | Problema definido y datos explorados | HU-00, HU-01, HU-02 | no estimado |
| S2 | ídem | Datos limpios y EDA avanzado | HU-03, HU-04 | no estimado |
| S3 | ídem | Modelos clásicos, redes, NLP y evaluación | HU-05, HU-06, HU-07, HU-08 | no estimado |
| S4 | ídem | Spark, API, integrador y ejecución local | HU-09, HU-10, HU-11, HU-12 | no estimado |
| S5 | 2026-10-23 → 2026-10-29 | Fundaciones: entorno probado, paquete único, DoD automatizada y gestión verificable | HU-00, HU-13, HU-14, HU-15, HU-16, HU-31, HU-32 | 30 |
| S6 | 2026-10-30 → 2026-11-05 | Notebooks 01–07 y 09 sobre `credit_risk`, ejecutados con papermill | HU-01…HU-07, HU-09, HU-17, HU-33, HU-34, HU-35 | 57 |
| S7 | 2026-11-06 → 2026-11-12 | Modelo v2.0.0 sin fuga, política de decisión, equidad, API en Docker y paquete de corrida | HU-08, HU-10, HU-18…HU-23 | 48 |
| S8 | 2026-11-13 → 2026-11-19 | Front autónomo por capítulos, documentación coherente y 47/47 calculado | HU-11, HU-12, HU-24…HU-30 | 47 |

La tabla calculada (puntos comprometidos y hechos) está en [backlog.md](backlog.md#puntos-por-sprint).
Los puntos de S5–S8 son la re-estimación de v2; S1–S4 no se estimaron y no se inventan.

---

## MVP (S1–S4): retrospectiva reconstruida

> Las retros de S1–S4 quedaron vacías en su momento. Se reconstruyen aquí **solo** con la evidencia de
> [report_qa.md](../../report_qa.md) (auditoría estática del 2026-10-16) y [report_dev.md](../../report_dev.md)
> (respuesta del desarrollador). No hay registro de fechas por sprint, puntos ni burndown: no se estimaron.
> Todo el MVP se hizo en una ventana comprimida que terminó el 2026-10-16, en un único commit.

### S1 · Problema y datos (HU-00, HU-01, HU-02)

- **Se entregó:** `backlog.md`, `sprints.md`, `definicion_de_hecho.md`; notebooks 01 y 02 con salidas.
- **Lo que mostró QA:** paso 0 **no cerrado** (retros vacías, estados desactualizados); pasos 1 y 2 con evidencia documental, sin validar su ejecución.
- **Bien:** el enunciado se transcribió con IDs verificables y el plan paso a paso se escribió antes de programar.
- **Mal:** HU-00 se marcó Hecho sin retrospectiva; la DoD no era verificable.

### S2 · Datos listos (HU-03, HU-04)

- **Se entregó:** notebooks 03 y 04; `db/processed/{train,test}.csv`, `feature_list.json`; `features.py`.
- **Lo que mostró QA:** paso 3 **parcial**: faltaba `validar_dataset()` y `features.py` divergía de nb03 (3 variables derivadas en vez de 6, one-hot en vez de ordinal, sin capping). En nb04 había gráficos sin interpretar.
- **Bien:** el pipeline se ajustaba solo con train; el EDA cubría Matplotlib, Seaborn y plotnine.
- **Mal:** la lógica se copió entre notebooks en vez de vivir en el paquete.

### S3 · Modelado (HU-05, HU-06, HU-07, HU-08)

- **Se entregó:** código de nb05–nb08; `model_card.json` y `modelo_final.joblib` (v1.0.0); `*_nb08.*` en paralelo.
- **Lo que mostró QA:**
  - nb05 y nb07 con **0 celdas ejecutadas**.
  - nb06 **sin redes** (`resultados_dl.json` vacío, sin `.keras`) y una conclusión que afirmaba lo contrario.
  - El modelo servido (v1.0.0) era una LR sin calibrar, **elegida con test**, con umbral 0,4396 dentro de la banda Medio. Había **4 umbrales distintos**: train 3:1, nb08 0,25, nb00 0,24 y API 0,4396.
  - DI por edad 0,74 sin mitigar.
- **Respuesta en el MVP (report_dev):** se corrigió el protocolo de `train.py` (v1.1.0: CV en train, calibración, umbral 3:1), pero **no se reentrenó**: los artefactos servidos siguieron siendo v1.0.0.
- **Bien:** la auditoría detectó la fuga a test y el desarrollador declaró lo pendiente en vez de ocultarlo.
- **Mal:** se escribieron conclusiones antes de ejecutar; faltaban dependencias pesadas y no hubo prueba de entorno.

### S4 · Despliegue (HU-09, HU-10, HU-11, HU-12)

- **Se entregó:** API FastAPI (5 rutas, verificada en vivo), Dockerfile, nb09 y nb00, informe 06 y despliegue en Vercel.
- **Lo que mostró QA:**
  - nb09 corrió **sin PySpark** (respaldo con pandas).
  - Docker **nunca se probó**.
  - nb00 tenía flujo y umbral propios.
  - `/health` decía ok sin modelo (se corrigió con carga atómica).
  - El front mostraba cifras escritas a mano y dependía de la API.
  - El README no servía desde un clon limpio, y los documentos se contradecían.
- **Bien:** `/health` atómico y `validar_dataset()` se corrigieron el mismo día.
- **Mal:** HU-12 se marcó Hecho sin probar desde un clon limpio.

### Retro global del MVP

| Qué pasó | Por qué | Acción en v2 |
|---|---|---|
| Se declaró Hecho lo que no lo estaba. | La DoD no era verificable por máquina. | DoD multinivel con comando por criterio; `verificar_dod.py --estricto`; checklist calculado (HU-15, HU-16). |
| Modelo servido ≠ documentado. | Varias fuentes de verdad (train.py, nb08, nb00). | ADR-001: solo `train.py` produce el modelo; nb08 lee predicciones guardadas (HU-19, HU-08). |
| Notebooks sin ejecutar o con dependencias faltantes. | Sin prueba de entorno ni presupuesto de tiempo. | S5a: prueba de entorno (HU-14); papermill en cola (HU-17); DoR R7 y R8. |
| Lógica duplicada. | No había paquete compartido. | Paquete único `credit_risk` (HU-13); criterio `importa_credit_risk`. |
| Front con cifras a mano y dependiente del back. | Sin contrato de datos front–back. | Paquete de corrida con hashes y front autónomo (HU-23, HU-24, HU-28; ADR-004). |

Detalle en [lecciones_aprendidas.md](lecciones_aprendidas.md).

---

## v2 (S5–S8)

> **Ejecución real.** Los cuatro sprints se ejecutaron en una ventana comprimida el **2026-10-23**, en la rama
> `feat/v2-senior`, con agentes en paralelo sobre archivos disjuntos y ejecución pesada en serie (cola con lock). Las
> fechas de una semana por sprint eran estimaciones de planificación. El **burndown es real**: lo calcula
> `generar_evidencia.py` desde los commits que citan cada HU (`git log`), y el front lo dibuja en `/metodologia`.

### S5 · Fundaciones (2026-10-23)

- **Objetivo:** entorno probado y un único paquete `credit_risk` con tests, DoD automatizada y gestión verificable.
- **Comprometidas (30 pts):** HU-00 (5), HU-13 (8), HU-14 (3), HU-15 (3), HU-16 (3), HU-31 (3), HU-32 (5).
- **Review:**
  - `pip install -e .` funciona incluso desde un clon limpio.
  - Gate en verde: ruff, mypy, pytest con 52 pruebas y cobertura del 91,5 % en el núcleo, `verificar_dod.py` con 0 fallos y build y pruebas del front.
  - `generar_evidencia.py` calcula el checklist.
  - ADR-001 a ADR-008 con resultados reales.
- **Retrospectiva:**
  - *Bien:* la prueba de entorno antes de escribir notebooks detectó el conflicto de DLL (sklearn → torch/TF) el primer día.
  - *A mejorar:* el validador del backlog rechazó una HU mal formada que había entrado a un commit porque el código de salida quedaba oculto tras un `tail`. Desde entonces, los comandos del gate no se encadenan con pipes que oculten el código de salida.

### S6 · Datos y modelado (2026-10-23)

- **Objetivo:** notebooks 01–07 y 09 reescritos sobre `credit_risk`, ejecutados con papermill (kernel `credit-risk`) y con conclusiones escritas después de ver las salidas.
- **Comprometidas (57 pts):** HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07, HU-09, HU-17, HU-33, HU-34, HU-35.
- **Review:**
  - Ocho notebooks cumplen la DoD.
  - Tiempos de la ejecución real: nb01 37 s · nb02 20 s · nb03 162 s · nb04 145 s · nb05 397 s · nb06 300 s · nb07 411 s · nb09 189 s.
  - Se exportaron 139 figuras nativas.
  - German Credit (HU-34) entró completo y no hubo que devolverlo al backlog.
- **Retrospectiva:**
  - *A mejorar:* la cola tenía dos defectos reales. Hubo un `Errno 22` al guardar in-place en Windows y una carrera en el lock (dos procesos lo tomaban a la vez). Ambos se corrigieron: escritura atómica y `O_CREAT | O_EXCL`. Además, el nb09 FAST tardó 34 min por escribir Parquet sobre el montaje de Windows (unos 390 s por escritura). Con el disco local del contenedor tarda 3 s.
  - *Bien:* escribir en paralelo y ejecutar en serie evitó que los agentes saturaran la CPU.

### S7 · Modelo v2.0.0 (2026-10-23)

- **Objetivo:** modelo v2.0.0 seleccionado sin fuga y calibrado, con la política aprobar/revisar/rechazar y la equidad evaluada. Servido por la API v2 en Docker y con el paquete de corrida exportado.
- **Comprometidas (48 pts):** HU-08, HU-10, HU-18, HU-19, HU-20, HU-21, HU-22, HU-23.
- **Review:**
  - El modelo es una LR calibrada con *reweighing*: AUC CV 0,858 y AUC test 0,846.
  - Umbrales 0,178 y 0,467. En test: aprobar 39,7 %, revisar 28,8 %, rechazar 31,5 % e impago entre aprobados 9,8 %.
  - Equidad en test: DI edad 0,896 y sexo 0,970.
  - Docker *healthy* y probado desde pytest, sin root y sin dependencias pesadas.
  - nb08 coincide con la card por construcción.
- **Retrospectiva:**
  - *Bien:* portar el modelo a TypeScript con pruebas golden destapó un defecto real de la API. `None` en categorías no se imputaba, porque `SimpleImputer` usa `X != X`. Se corrigió en Python antes de publicar.
  - *A mejorar:* el cliente demo "medio" se había supuesto y caía en "rechazar" (p = 0,52). Ahora se elige contra el modelo real y una prueba lo fija.

### S8 · Producto y comunicación (2026-10-23)

- **Objetivo:** front estático autónomo con un capítulo por entregable y motor exacto, documentación coherente con v2.0.0 y checklist del enunciado acreditado por cálculo.
- **Comprometidas (50 pts):** HU-11, HU-12, HU-24, HU-25, HU-26, HU-27, HU-28, HU-29, HU-30, HU-36.
- **Review:**
  - nb00 (PF1) cumple la DoD: 10/10 notebooks.
  - Front con 85 pruebas Vitest y 66 e2e en escritorio y móvil, con el back apagado y 0 peticiones fuera del origen.
  - Paridad |Δp| < 1e-6.
  - Arranque verificado desde un clon limpio.
  - Documentación v2 coherente.
  - HU-36 (variables de señal débil) queda en el backlog para v2.1, como se planeó.
- **Retrospectiva:**
  - *Bien:* los requisitos cambiaron a mitad del sprint (back solo en Python, front autónomo que simula la corrida, gráficos nativos de alto nivel). Se registraron en el plan, en la memoria y en un ADR antes de seguir, y nada quedó a medias.
  - *A mejorar:* la revisión del build destapó que `golden.json` se publicaba. Una cifra de Spark del modo FAST se coló en nb08 hasta re-ejecutarlo. El orden productor → consumidor queda documentado en el libreto.

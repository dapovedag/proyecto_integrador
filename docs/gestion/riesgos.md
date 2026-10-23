# Registro de riesgos

> Escala: probabilidad e impacto **Bajo / Medio / Alto**. Se revisa en cada planificación y retrospectiva.
> Estado: **Abierto** (sin mitigar), **Mitigando** (acción en curso), **Cerrado** (con evidencia), **Materializado**.
> Dueños: **PO** (Product Owner), **SM** (Scrum Master), **DS** (científico de datos), **ML** (ingeniería de ML), **FE** (front).

| ID | Riesgo | Prob. | Impacto | Mitigación | Dueño | Estado |
|---|---|---|---|---|---|---|
| RG-01 | La máquina es lenta: importar sklearn tarda 30–90 s y la CV de HGB y los notebooks pesados no caben en el sprint. | Alta | Alto | Cola en serie con `ejecutar_notebooks.py` (en segundo plano), modo `FAST`/`N_MUESTRA` para pruebas de humo, RandomizedSearchCV de 8 iteraciones, `LOKY_MAX_CPU_COUNT=4`, caché de HF solo sobre los textos únicos. | ML | Mitigando |
| RG-02 | `WinError 1114` al cargar torch junto a sklearn o TensorFlow en Windows. | Media | Alto | Diagnóstico en S5a con el orden de imports; importar torch primero en `nlp.py`; procesos separados para TF y torch. Si no basta, el usuario actualiza el VC++ Redistributable. | ML | Abierto |
| RG-03 | Spark en Windows (winutils, ruta con tilde "Introducción", Java). | Alta | Alto | PySpark en Docker (`quay.io/jupyter/pyspark-notebook:2026-10-19`) con el daemon activo (ADR-005). | DS | Mitigando |
| RG-04 | TensorFlow 2.20 no se instala o falla en Windows con Python 3.10. | Media | Alto | Prueba en S5a; plan B: Keras 3 con backend torch (ADR-006). | ML | Mitigando |
| RG-05 | El port TS del modelo difiere de Python. | Media | Alto | Golden de unos 300 clientes y 50 textos con \|Δ\| < 1e-6; el build falla si no coinciden; la exportación sale de los mismos objetos servidos. | FE | Abierto |
| RG-06 | El front muestra algo que el back no produjo. | Media | Alto | Todo sale de `exportar_front.py`; el manifest guarda versión y hashes; un test de consistencia los verifica (ADR-004). | FE | Abierto |
| RG-07 | El DI por edad no llega a 0,8 sin un costo excesivo. | Media | Alto | Selección por costo sujeta a DI ≥ 0,8 entre base, `sin_edad` y `reweighing`; si ninguna cumple, excepción razonada en ADR-003 y en la card. Sin umbrales por grupo. | DS | Abierto |
| RG-08 | Vuelven a desfasarse el modelo servido y la documentación. | Media | Alto | Fuente única (ADR-001), una sola `MODEL_VERSION`, nb08 sin reentrenar, test nb08 ↔ card y `dod_status.json → card_version_coincide`. | ML | Mitigando |
| RG-09 | Se declara Hecho algo que no lo está. | Media | Alto | DoD verificable, `verificar_dod.py --estricto` y checklist calculado por `generar_evidencia.py`. | SM | Mitigando |
| RG-10 | Fuga de secretos en el deploy (`.env*` con tokens). | Media | Alto | `.vercelignore` excluye `.env*`, `Back/`, `db/` y `docs/`; push y deploy solo con confirmación explícita del usuario. | PO | Abierto |
| RG-11 | Peso del front: CSV de unos 3 MB y notebooks de unos 5 MB. | Media | Medio | Carga bajo demanda por capítulo, WebP, compresión de Vercel, caché inmutable, parser en Web Worker y presupuesto de JS inicial < 250 KB gz. | FE | Abierto |
| RG-12 | Conflictos entre agentes en paralelo. | Media | Medio | Archivos disjuntos por agente; los archivos compartidos (`config.py`, `pyproject.toml`, locks, `models.py`, `train.py`) solo los toca el agente principal; presupuesto de tiempo por agente (DoR R8). | SM | Mitigando |
| RG-13 | El puerto 5173 u 8000 está ocupado por otros proyectos y se valida el servicio equivocado. | Alta | Medio | Verificar que el puerto esté libre y validar el `<title>` o la versión de `/health`, no solo el 200 (DoD A6 y W7). | FE | Mitigando |
| RG-14 | Los pickles no cargan con otra versión de sklearn. | Media | Alto | Python 3.10 y scikit-learn 1.4.2 fijos, con locks (ADR-008). | ML | Mitigando |
| RG-15 | El texto aporta un ΔAUC artificial porque el generador sintético lo correlaciona con `prob_default`. | Alta | Medio | Reportar ΔAUC con IC bootstrap y declararlo como artefacto del generador; el modelo de texto no se sirve como principal. | DS | Abierto |
| RG-16 | S6 está sobrecomprometido (57 puntos). | Media | Medio | Escribir en paralelo y ejecutar en serie; HU-34 es la primera candidata a volver al backlog si el burndown se desvía. | SM | Abierto |
| RG-17 | El dataset sintético no representa la realidad (E3). | Media | Medio | Contrato de datos explícito y apéndice con German Credit (UCI), con su licencia (HU-34). | DS | Abierto |

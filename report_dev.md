# Reporte DEV v2: respuesta a la auditoría QA (2026-10-23)

> Responde, hallazgo por hallazgo, a `report_qa.md` (sección 7) y a la revisión de punta a punta que motivó la v2.
> La versión anterior de este reporte (MVP, 2026-10-16) quedó en el historial de git. Cada "Cerrado" va acompañado
> de la evidencia que lo prueba y del comando para verificarlo. Ninguna cifra se afirma sin una salida que la respalde.

## Verificación en un comando

```bash
cd Back && .venv/Scripts/python scripts/check.py
```

El comando corre ruff, mypy, pytest (cobertura 91,5 %), `verificar_dod.py --estricto` (0 fallos en 10 notebooks) y el build y las pruebas del front (paridad golden).

## Hallazgos

| # | Hallazgo QA | Prioridad | Estado | Evidencia |
|---|---|---|---|---|
| 1 | La API servía un modelo distinto al documentado (v1.0.0 elegido con test; 4 umbrales distintos) | Bloqueante | **Cerrado** | `train.py` es la única fuente de verdad y escribe un `ArtefactoModelo` (modelo, explicador, umbrales y versión). La API, nb00, nb08 y el front lo usan sin reimplementarlo. Hay un solo juego de umbrales: 0,1778 y 0,4667. nb08 §8 comprueba que el artefacto reproduce exactamente las predicciones de test y que sus métricas coinciden con la card. `tests/test_contratos.py` compara los casos golden con el artefacto servido. |
| 2 | Modelo y umbral elegidos con test | Bloqueante | **Cerrado** | Selección por ROC-AUC CV(5) en train: LR 0,8582 frente a HGB 0,8525. Umbrales por la regla de Chow, en forma cerrada a partir de los costos (ADR-002). La variante de equidad se elige con predicciones OOF. Test se usa una sola vez (AUC 0,8456). Ver ADR-001 y `model_card.json → protocolo`. |
| 3 | Redes no ejecutadas (nb06) | Bloqueante | **Cerrado** | TensorFlow 2.20 instalado. MLP 0,842, híbrido texto+tabular 0,840, CNN 1D 0,771 y GRU 0,647, con curvas de aprendizaje. `red_neuronal.keras` y `resultados_dl.json` generados. nb06 ✔ DoD (300 s). |
| 4 | NLP avanzado sin ejecutar (nb07) | Bloqueante | **Cerrado** | BERT (nlptown), sentence-transformers (MiniLM) y GPT-2 en español sobre los 4.454 textos únicos, con caché firmada. ΔAUC del combinado +0,0012, IC 95 % [−0,0003; +0,0028]: no hay mejora demostrable, y queda declarado. nb07 ✔ DoD. |
| 5 | Spark ejecutado con respaldo de pandas (nb09) | Bloqueante | **Cerrado** | PySpark 4.2 en Docker (ADR-005), con esquema explícito, Spark SQL, Parquet particionado con *pruning* y MLlib 0,8441 frente a scikit-learn 0,8459 en el mismo test. Scoring de 12.000 solicitudes en 1,9 s. nb09 ✔ DoD (189 s). |
| 6 | Equidad incompleta (DI por edad 0,74 sin mitigar) | Alta | **Cerrado con vigilancia** | DI medido sobre la aprobación automática, con IC bootstrap. Se evaluaron tres variantes. El *reweighing* lleva el DI por edad de 0,72 a 0,89 (OOF) y a 0,896 en test (IC [0,78; 0,98]) con un costo de +0,6 %. Sexo: 0,970. Quitar la edad no ayudaba (0,71). Ver ADR-003, que explica además por qué no se usan umbrales por grupo. El límite inferior del IC queda en vigilancia. |
| 7 | nb05 sin ejecutar | Alta | **Cerrado** | Línea base y 4 clásicos con CV(5), ROC/PR, matrices, coeficientes y permutación, más la replicación en German Credit con datos reales (AUC 0,786, DI por edad 0,55). nb05 ✔ DoD. |
| 8 | nb00 con flujo propio; faltaba el informe | Alta | **Cerrado** | nb00 importa `credit_risk`, carga el artefacto servido, compara los modelos de todas las familias, predice los tres clientes demo y llama a la API en el mismo proceso. `docs/06_informe_resultados.md` reescrito con las cifras v2. nb00 ✔ DoD. |
| 9 | Falta `validar_dataset()`; lógica duplicada | Media | **Cerrado** | Paquete único `credit_risk` instalable (`pyproject.toml`). Los 10 notebooks lo importan; `verificar_dod.py` lo comprueba con el criterio `importa_credit_risk`. `features.py` quedó unificado con nb03 (6 derivadas, ordinal y capping sin fuga). |
| 10 | `/health` decía ok aunque faltaran artefactos | Media | **Cerrado** | Carga atómica en `lifespan`: si falta algo, `/health` responde "degradado" y los demás endpoints 503. Lo cubre `test_servicio_degradado_responde_503`. |
| 11 | README incompleto; backlog y retros vacíos | Media | **Cerrado** | `Back/README.md` verificado desde un clon limpio. Scrum + CRISP-DM aplicados: `backlog.yaml` con 37 HU en Gherkin, DoD y DoR verificables, 8 ADR con resultados, riesgos y lecciones aprendidas. La trazabilidad y el checklist del enunciado se calculan con `generar_evidencia.py`. |
| — | Docker sin probar | — | **Cerrado** | `docker compose up --build`: imagen `riesgo-credito-api:2.0.0` sin root y de solo lectura, healthcheck *healthy*, `/health` y `/predict` respondiendo. La transcripción real está en `Back/reports/docker_api.json`. |
| — | Front con cifras escritas a mano y dependiente del back | — | **Cerrado** | El front es estático y autónomo (ADR-004). Todo sale del paquete de corrida (`exportar_front.py`), con SHA-256 en el manifest. Los motores en TS reproducen a Python con \|Δp\| < 1e-6 en 303 casos golden. El e2e verifica cero peticiones fuera del origen. |

## Problemas reales encontrados y resueltos durante la v2

1. **DLL en Windows.** Importar scikit-learn antes que PyTorch o TensorFlow rompe sus DLL (`WinError 1114`). Diagnosticado con pruebas en ambos órdenes y resuelto con `setup(torch_primero / tf_primero)` (ADR-006).
2. **`None` en categorías.** `SimpleImputer` no trata `None` como faltante en columnas de texto, así que la API no imputaba "Desconocido". Se corrigió en `ArtefactoModelo.a_dataframe`.
3. **Escritura de notebooks.** Papermill daba `Errno 22` al guardar en el mismo archivo en Windows. Ahora escribe en un temporal y lo reemplaza de forma atómica.
4. **Lock de la cola.** Dos procesos podían tomar el lock a la vez. Ahora se crea de forma atómica (`O_CREAT | O_EXCL`).
5. **Edades imposibles.** `grupo_edad` metía las edades imposibles en "60+". Ahora van a "desconocida", con su prueba.
6. **Hashes y fin de línea.** Git en Windows convertía los fines de línea de los CSV y JSON con hash. `.gitattributes` lo evita, y se verificó que los blobs coinciden con el manifest (95 de 95).
7. **Lentitud de Spark.** Escribir Parquet sobre el montaje de Windows tardaba unos 390 s. Ahora Spark escribe en el disco del contenedor (unos 3 s) y copia el resultado.

## Pendientes declarados

- **Equidad por edad.** El IC 95 % del DI por edad llega a 0,78. Se vigila en producción (`docs/05_despliegue.md §6`).
- **HU-36.** Evaluar en v2.1 si conviene retirar las variables de señal débil (estado civil, tasa y plazo).
- **Datos reales.** Validar con una cartera real y cosechas maduras. El dataset del proyecto es sintético-realista.
- **Publicación.** El push y el despliegue en Vercel requieren configurar el remoto y una confirmación explícita.

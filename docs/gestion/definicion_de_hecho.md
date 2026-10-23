# Definición de hecho (DoD)

> Un elemento está **Hecho** solo si cumple **todos** los criterios de su nivel y de los niveles que contiene.
> Cada criterio dice **cómo se prueba**: un comando que sale con código 0 o un archivo que debe existir.
> Lo que no se puede probar así no cuenta como hecho. La DoD del MVP no era verificable, y por eso
> se declararon "Hecho" pasos que no lo estaban ([lecciones aprendidas](lecciones_aprendidas.md), L1).

Los comandos se ejecutan desde la raíz del repositorio con el entorno `Back/.venv` activo.

## 1. Historia de usuario

| # | Criterio | Cómo se prueba |
|---|---|---|
| H1 | Cumplía la [definición de listo](definicion_de_listo.md) al entrar al sprint. | Revisión en la planificación (registrada en [sprints.md](sprints.md)). |
| H2 | Todos sus criterios de aceptación (Dado/Cuando/Entonces) se cumplen. | El comando o archivo que cita cada criterio en [backlog.yaml](backlog.yaml). |
| H3 | Todas sus rutas de `evidencia` existen. | `python Back/scripts/generar_evidencia.py` (columna Evidencia de [backlog.md](backlog.md)). |
| H4 | Cumple la DoD de cada nivel que toca (notebook, código, modelo, API, front, documentación). | Secciones 2–7 de este documento. |
| H5 | Su estado es `Hecho` en `backlog.yaml` y el commit que la cierra cita su ID (`HU-xx`). | `git log --grep "HU-xx"`. |

Si una historia está en `Hecho` pero le falta evidencia, el generador **no** la acredita y sus IDs del enunciado quedan `[ ]`.

## 2. Notebook

Los criterios son exactamente los de `Back/scripts/verificar_dod.py`. Se prueban con:

```bash
python Back/scripts/verificar_dod.py --estricto   # código 0 = sin fallos; escribe Back/reports/dod_status.json
```

| Criterio (`dod_status.json`) | Qué exige |
|---|---|
| `ejecutado` | Tiene celdas de código y todas tienen `execution_count`. |
| `sin_errores` | Ninguna salida es de tipo `error`. |
| `kernel_credit_risk` | El kernelspec del notebook es `credit-risk`. |
| `celda_ids` | La primera celda es Markdown y lista los IDs del enunciado que cubre. |
| `conclusiones` | La última celda Markdown es de Conclusiones. |
| `importa_credit_risk` | Alguna celda de código usa `credit_risk`; la lógica vive en el paquete, no en el notebook. |
| `sin_rutas_absolutas` | Ni el código ni las salidas contienen rutas absolutas (`C:\Users`, `/home/…`). |
| `figuras_interpretadas` | Toda celda que produce una imagen va seguida de una celda Markdown que la interpreta. |
| `artefactos` | Existen los artefactos del paso: nb03 → `db/processed/{train,test}.csv` y `feature_list.json`; nb05 → `resultados_clasicos.json`; nb06 → `resultados_dl.json` y `red_neuronal.keras`; nb07 → `resultados_nlp.json` y `nlp_features.parquet`; nb08 → `modelo_final.joblib` y `model_card.json`; nb09 → `resultados_spark.json`. |

Criterios adicionales que el script todavía no comprueba (se revisan en la review del sprint):

- Se ejecutó con `python Back/scripts/ejecutar_notebooks.py` (papermill, `-k credit-risk`) y su tiempo quedó en el log.
- Cumple el **criterio de hecho** de su paso en [02_plan_paso_a_paso.md](../02_plan_paso_a_paso.md).
- Las conclusiones se escribieron **después** de ver las salidas y no afirman nada que no esté en ellas.

## 3. Código (`Back/src/credit_risk`, `Back/api`, `Back/scripts`, `Back/train.py`)

| # | Criterio | Cómo se prueba |
|---|---|---|
| C1 | Pasan todas las pruebas. | `python -m pytest Back/tests` |
| C2 | La cobertura del núcleo (data, features, models, fairness, monitoring, api) es ≥ 80 %. | `python -m pytest Back/tests --cov=credit_risk --cov=api --cov-fail-under=80` |
| C3 | Lint y tipos limpios. | `ruff check Back` y `mypy Back/src Back/api` |
| C4 | Funciones públicas con *type hints* y docstring. | `ruff` (reglas `ANN`, `D`) |
| C5 | Todo el back está en Python: sin `.R`, `.ps1` ni otros lenguajes. | Test en `Back/tests/test_proyecto.py` |
| C6 | Sin credenciales, tokens ni datos personales en el código. | Revisión del diff; `.vercelignore` excluye `.env*`. |
| C7 | Gate de calidad completo en verde. | `python Back/scripts/check.py` |

## 4. Modelo

| # | Criterio | Cómo se prueba |
|---|---|---|
| M1 | Lo genera solo `python Back/train.py` (fuente única, [ADR-001](adr/ADR-001-fuente-unica-del-modelo.md)). | Existen `Back/models/modelo_final.joblib` y `model_card.json`; no existen `*_nb08.*`. |
| M2 | `joblib.load` funciona y la versión de la card es igual a `credit_risk.__version__`. | `dod_status.json → modelo.card_version_coincide` |
| M3 | Selección, calibración, umbrales y variante de equidad se decidieron sin usar test; test se usó una vez. | `dod_status.json → modelo.protocolo_documentado` y `model_card.json → protocolo` |
| M4 | El SHA-256 de `train.csv` y `test.csv` coincide con la card. | Test de `Back/tests/test_proyecto.py` |
| M5 | Umbrales de la regla de Chow y bandas coherentes (Bajo↔aprobar, Medio↔revisar, Alto↔rechazar) ([ADR-002](adr/ADR-002-costos-regla-de-chow.md)). | `python -m pytest Back/tests/test_models.py` |
| M6 | Equidad documentada por sexo y edad; DI ≥ 0,8 o excepción razonada en [ADR-003](adr/ADR-003-equidad.md). | `dod_status.json → modelo.equidad_documentada` |
| M7 | Las cifras del nb08 coinciden con la card. | Test de consistencia nb08 ↔ card |

## 5. API

| # | Criterio | Cómo se prueba |
|---|---|---|
| A1 | Pruebas de la API en verde. | `python -m pytest Back/tests/test_api.py` |
| A2 | `/health` responde 200 y la versión 2.0.0; si falta un artefacto, `degradado` y 503 en los endpoints. | `test_api.py` |
| A3 | El cliente demo bajo da Bajo/aprobar y el alto da Alto/rechazar; un campo inválido da 422 marcado por campo. | `test_api.py` |
| A4 | La imagen Docker levanta la misma API. | `docker compose -f Back/docker-compose.yml up --build` y `/health` = 200 |
| A5 | La API se importa solo con las dependencias de `requirements-api.lock`. | `Back/tests/test_api_slim.py` |
| A6 | Antes de levantar uvicorn se verificó que el puerto está libre. | Registro en la review del sprint |

## 6. Front (`Front/`)

| # | Criterio | Cómo se prueba |
|---|---|---|
| W1 | Compila. | `npm --prefix Front run build` |
| W2 | Pruebas unitarias en verde, incluidas la validación de esquemas y la **paridad golden** de `scoring.ts` y `texto.ts` (\|Δ\| < 1e-6). | `npm --prefix Front run test` |
| W3 | **Funciona con el back apagado y no hace peticiones fuera de sus estáticos.** Con uvicorn y Docker detenidos, recorre todas las rutas, reproduce un notebook completo y usa el simulador; falla ante cualquier petición que no sea un archivo del propio sitio. | `npx --prefix Front playwright test` |
| W4 | Toda cifra sale del paquete de corrida (`exportar_front.py`); ninguna está escrita a mano. El build falla si la versión del manifest no es la de la card o si un hash no cuadra. | `Front/public/run/manifest.json` + test de consistencia |
| W5 | Accesibilidad AA (axe sin violaciones), responsive desde 360 px. | Playwright + axe |
| W6 | Presupuesto: JS inicial < 250 KB gz; Lighthouse ≥ 90. | Informe de build y Lighthouse |
| W7 | Servido en un puerto libre verificado y con el `<title>` esperado (no basta un 200). | Registro en la review del sprint |

## 7. Documentación

| # | Criterio | Cómo se prueba |
|---|---|---|
| D1 | Ningún documento cita un archivo inexistente ni una versión distinta de la card. | Revisión con `grep` de versiones y rutas en `docs/` |
| D2 | `backlog.md`, `trazabilidad.md`, el checklist de `01_enunciado.md` y `gestion.json` están al día. | `python Back/scripts/generar_evidencia.py --verificar` (código 0) |
| D3 | Las decisiones relevantes tienen ADR con evidencia. | `docs/gestion/adr/README.md` |
| D4 | Los resultados numéricos citados provienen de un artefacto ejecutado; los pendientes llevan marcador explícito. | Revisión de la review |

## 8. Sprint

| # | Criterio | Cómo se prueba |
|---|---|---|
| S1 | Todas las historias comprometidas están en Hecho o volvieron al backlog con su motivo. | [sprints.md](sprints.md) y `backlog.yaml` |
| S2 | Review con la demo del incremento y retrospectiva registradas. | [sprints.md](sprints.md) |
| S3 | Burndown con datos reales (puntos restantes por día). | `backlog.yaml → sprints[].burndown` |
| S4 | Riesgos y lecciones actualizados. | [riesgos.md](riesgos.md), [lecciones_aprendidas.md](lecciones_aprendidas.md) |
| S5 | Gate en verde en el commit de cierre y tag `s5`…`s8`. | `python Back/scripts/check.py` y `git tag` |

## 9. Release (v2.0.0)

| # | Criterio | Cómo se prueba |
|---|---|---|
| L1 | `verificar_dod.py --estricto` con 0 fallos en los 10 notebooks (00–09). | `python Back/scripts/verificar_dod.py --estricto` |
| L2 | Checklist del enunciado **47/47 calculado**. | `python Back/scripts/generar_evidencia.py` |
| L3 | Desde un clon limpio, los comandos de `Back/README.md` funcionan. | Prueba en otra carpeta, registrada en la review de S8 |
| L4 | Las cifras del front coinciden con la card y con `resultados_*.json`. | `npm --prefix Front run test` (test de consistencia) |
| L5 | Re-auditoría QA sin hallazgos abiertos y `report_dev.md` v2 responde cada hallazgo. | `report_qa.md` / `report_dev.md` |
| L6 | Push y deploy solo con confirmación explícita del usuario. | Registro en la review de S8 |

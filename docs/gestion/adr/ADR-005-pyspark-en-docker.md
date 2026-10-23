# ADR-005 · PySpark en Docker

- **Estado:** Aceptado (2026-10-23). Prueba de entorno en S5a.
- **Historias:** HU-09, HU-14 · **IDs:** IA3.6

## Contexto

En el MVP el nb09 corrió sin PySpark (respaldo con pandas y pyarrow), lo que no acredita IA3.6. En Windows, Spark exige `winutils.exe` y `HADOOP_HOME`, es sensible a rutas con caracteres no ASCII (el proyecto vive en `…\Introducción`) y requiere un JDK compatible. El usuario exige que todo el back sea código Python.

## Decisión

- PySpark se ejecuta dentro del contenedor **`quay.io/jupyter/pyspark-notebook:2026-10-19`** (**Spark 4.2, Java 21**), definido en `Back/docker-compose.spark.yml`, separado de la API.
- El código sigue siendo **Python**: el contenedor monta el repositorio en `/work` e instala el paquete con `pip install -e /work/Back`, de modo que nb09 importa `credit_risk`.
- Docker es **solo runtime**; no hay scripts en otros lenguajes.
- nb09 escribe `resultados_spark.json` con la versión de Spark, el AUC de MLlib frente a sklearn y las rutas del Parquet particionado.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| PySpark nativo en Windows | winutils, la ruta con tilde y el JDK hacen frágil la instalación (RG-03). |
| WSL2 | Otro entorno que mantener; Docker ya es requisito para IA3.5. |
| Respaldo con pandas (MVP) | No acredita IA3.6. |
| Databricks o un clúster en la nube | Costo y credenciales; no reproducible desde un clon. |

## Consecuencias

- (+) Runtime Linux reproducible e independiente de la máquina.
- (+) Spark 4.2 y Java 21 fijados por la etiqueta de la imagen.
- (−) Requiere el daemon de Docker activo y una imagen de varios GB.
- (−) El notebook se ejecuta dentro del contenedor y no en el kernel `credit-risk` del host; la DoD lo trata igual (kernelspec `credit-risk` registrado en el contenedor).

## Evidencia / verificación

- S5a: prueba de humo que escribe un Parquet dentro del contenedor (registrada en la review de S5).
- `docker compose -f Back/docker-compose.spark.yml run …` ejecuta nb09; existe `Back/models/resultados_spark.json`.
- `python Back/scripts/verificar_dod.py`: nb09 → `artefactos`.

## Ajustes tras la implementación (2026-10-23)

- **Sin `pip install -e` dentro del contenedor.** La imagen trae Python 3.13 y el `pyproject` exige `<3.13` y `numpy==1.26.4`. Por eso `credit_risk` se expone con `PYTHONPATH=/work/Back/src`. El notebook 09 solo usa funciones puras del paquete.
- **Disco local del contenedor para escribir.** Escribir Parquet directamente sobre el montaje de Windows (9p) tardó unos 390 s por escritura, frente a unos 3 s en `/tmp`. Spark escribe en el disco del contenedor y copia el resultado final a `db/processed/spark/`.
- **Resultado:** ejecución real en 188,7 s. MLlib obtiene AUC 0,8441 en el mismo test que scikit-learn (0,8459), con una correlación de probabilidades de 0,995. El scoring por lotes de 12.000 solicitudes tarda 1,9 s.
- **Versiones en el contenedor:** el kernel se registra como `credit-risk (Python 3.13 · PySpark 4.2, Docker)` y scikit-learn es la 1.9.1. Queda anotado en `resultados_spark.json` y no afecta a la comparación, porque ambos modelos se entrenan en el contenedor.

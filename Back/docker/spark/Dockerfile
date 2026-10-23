# Runtime de PySpark para el notebook 09 (ADR-005 · IA3.6 · HU-09).
# Imagen fijada por etiqueta: Spark 4.2, Java 21, Python 3.13 (incluye pandas, scikit-learn, matplotlib,
# seaborn, pyarrow, pydantic e IPython). El código del proyecto NO se copia: se monta en /work y se importa
# por PYTHONPATH (el paquete fija versiones para Python 3.10, por eso no se instala con pip aquí).
FROM quay.io/jupyter/pyspark-notebook:2026-10-19

# Solo lo que falta en la imagen para ejecutar los notebooks con papermill e importar credit_risk.
RUN pip install --no-cache-dir "papermill>=2.6" "duckdb>=1.1" \
 && python -m ipykernel install --user --name credit-risk \
      --display-name "credit-risk (Python 3.13 · PySpark 4.2, Docker)" \
 && mkdir -p /home/jovyan/.ipython/profile_default \
 && printf '%s\n' \
      "# La salida del JVM (avisos de arranque de Java) va al registro del contenedor, no al notebook." \
      "c.IPKernelApp.capture_fd_output = False" \
      > /home/jovyan/.ipython/profile_default/ipython_kernel_config.py

# Spark solo informa errores: salidas del notebook sin ruido del JVM.
COPY log4j2.properties /usr/local/spark/conf/log4j2.properties

# PySpark viene en SPARK_HOME/python (no en site-packages): mismas rutas que añade el hook 10spark-config.sh
# de la imagen, que aquí no se ejecuta porque el entrypoint es Python directo.
ENV PYTHONPATH=/work/Back/src:/usr/local/spark/python:/usr/local/spark/python/lib/py4j-0.10.9.9-src.zip \
    PYSPARK_PYTHONPATH_SET=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8

WORKDIR /work/Back
ENTRYPOINT ["tini", "-g", "--", "python", "/work/Back/docker/spark/ejecutar.py"]

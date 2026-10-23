# Definición de listo (DoR)

> Una historia solo entra a un sprint si cumple **todos** estos criterios. Se revisa en la planificación.
> Si no los cumple, se refina o se divide; no se compromete "para ver qué pasa".

| # | Criterio | Dónde se comprueba |
|---|---|---|
| R1 | Está en [backlog.yaml](backlog.yaml) con épica, rol, *quiero* y *para*. | `python Back/scripts/generar_evidencia.py` (valida la estructura) |
| R2 | Cumple INVEST: independiente, negociable, valiosa, estimable, pequeña (≤ 8 puntos; si es mayor se divide) y comprobable. | Planificación |
| R3 | Tiene criterios de aceptación en Gherkin (Dado/Cuando/Entonces), cada uno con un comando o archivo que lo prueba. | `backlog.yaml → criterios_aceptacion` |
| R4 | Está estimada en puntos Fibonacci. | `backlog.yaml → puntos` |
| R5 | Declara su paso del plan, sus IDs del enunciado y las rutas de evidencia esperadas. | `backlog.yaml → paso`, `ids_enunciado`, `evidencia` |
| R6 | Sus dependencias están resueltas o planificadas antes en el mismo sprint (p. ej., nb08 depende de `train.py`; el front, del paquete de corrida). | Planificación |
| R7 | El entorno que necesita está probado: kernel `credit-risk`, TensorFlow ([ADR-006](adr/ADR-006-tensorflow-2-20-cpu.md)), PySpark en Docker ([ADR-005](adr/ADR-005-pyspark-en-docker.md)). | HU-14 en Hecho o prueba de humo registrada |
| R8 | Tiene **presupuesto de tiempo** y, si se delega en un agente, archivos disjuntos de los demás agentes. | Planificación ([lecciones](lecciones_aprendidas.md), L4) |
| R9 | Si toca el modelo o la política de decisión, el ADR correspondiente está en estado Aceptado. | [adr/README.md](adr/README.md) |

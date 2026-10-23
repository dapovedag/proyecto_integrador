# 01 · Enunciado del Proyecto Integrador

> Transcripción fiel de `ProyectoIntegrador.jpeg`, organizada como instrucciones verificables.
> Cada ítem tiene un **ID** (por ejemplo `P1.3` o `IA3.5`) que se usa en el plan ([02_plan_paso_a_paso.md](02_plan_paso_a_paso.md)) y en el checklist final.

---

## Título

**Proyecto integrador: Análisis predictivo de riesgo de crédito en instituciones financieras**

## Objetivo del proyecto integrador

Desarrollar una solución de análisis predictivo que permita **estimar la probabilidad de impago de clientes** en una institución financiera, integrando técnicas de **análisis exploratorio, programación e inteligencia artificial**, a partir de **información financiera y demográfica**.

## Producto final del proyecto

| ID | Requisito |
|---|---|
| **PF1** | Un **Notebook** que presente técnicas de análisis exploratorio, programación e inteligencia artificial y que permita **predecir la probabilidad de impago de clientes** a partir de información financiera y demográfica. |

## Elementos a tener en cuenta

| ID | Elemento |
|---|---|
| **E1** | Aplicación de metodologías ágiles de gestión de proyectos. |
| **E2** | Desarrollo de todas las fases del proceso analítico y predictivo. |
| **E3** | Uso de datos reales o realistas del sector financiero. |
| **E4** | Integración de conocimientos de los módulos. |
| **E5** | Enfoque en la solución de un problema dentro de un contexto. |

## ¿Qué es el proyecto integrador?

Es una estrategia pedagógica que **une los conocimientos y habilidades de varios módulos** para dar solución a un problema dentro de un contexto, promoviendo la **interdisciplinariedad**, el **trabajo colaborativo** y la **evaluación continua** por medio del desarrollo escalonado del proyecto en las actividades de cada unidad.

## Fases del proyecto (metodología ágil)

| ID | Fase |
|---|---|
| **F1** | Definir el problema |
| **F2** | Explorar y preparar los datos |
| **F3** | Analizar y modelar |
| **F4** | Evaluar y optimizar |
| **F5** | Desplegar y comunicar los resultados |

Flujo: `F1 → F2 → F3 → F4 → F5`

## Resultado esperado

| ID | Resultado |
|---|---|
| **R1** | Modelo predictivo de riesgo de crédito funcional. |
| **R2** | Uso de técnicas de análisis de datos, IA y NLP. |
| **R3** | Aplicación de buenas prácticas de gestión de proyectos. |
| **R4** | Solución con potencial de implementación en el contexto real. |

---

## Módulo 1: Programación para el análisis de datos

> Aporta las bases de programación, exploración, limpieza y preparación de datos para construir el modelo predictivo.

### Unidad 1: Exploración y análisis preliminar de datos

**Actividades a desarrollar**

| ID | Actividad |
|---|---|
| **P1.1** | Configurar el entorno en Google Colab o Jupyter Notebook. |
| **P1.2** | Importar las librerías Pandas, NumPy, Matplotlib y Seaborn. |
| **P1.3** | Cargar y explorar el conjunto de datos financieros. |
| **P1.4** | Aplicar operaciones básicas: filtrado, selección, ordenamiento y agregaciones. |
| **P1.5** | Generar las primeras visualizaciones (histogramas, diagramas de dispersión, boxplots). |

**Entregable: Notebook en Python que incluya**

| ID | Contenido |
|---|---|
| **P1.E1** | Configuración del entorno y carga de librerías. |
| **P1.E2** | Inspección y exploración inicial de los datos. |
| **P1.E3** | Aplicación de operaciones básicas de análisis. |
| **P1.E4** | Visualizaciones exploratorias de las variables. |

### Unidad 2: Limpieza, estructuración y preparación de datos

**Actividades a desarrollar**

| ID | Actividad |
|---|---|
| **P2.1** | Identificar y manejar los valores faltantes y duplicados. |
| **P2.2** | Transformar las variables categóricas en numéricas (One-Hot Encoding o Label Encoding). |
| **P2.3** | Aplicar normalización y estandarización. |
| **P2.4** | Generar nuevas variables relevantes. |
| **P2.5** | Aplicar reducción de dimensionalidad (si es necesario). |
| **P2.6** | Dividir los datos en entrenamiento y prueba. |

**Entregable: Notebook en Python que incluya**

| ID | Contenido |
|---|---|
| **P2.E1** | Limpieza y preprocesamiento de datos. |
| **P2.E2** | Transformación y codificación de variables. |
| **P2.E3** | Selección de las características más relevantes. |
| **P2.E4** | División de los datos en entrenamiento y prueba. |

---

## Módulo 2: Inteligencia artificial aplicada al análisis de datos

> Aporta técnicas avanzadas de análisis, modelado y despliegue del modelo predictivo.

### Unidad 1: Análisis ético y exploratorio del problema de riesgo de crédito

**Actividades a desarrollar**

| ID | Actividad |
|---|---|
| **IA1.1** | Explorar datasets financieros y definir el problema de riesgo de crédito. |
| **IA1.2** | Realizar el preprocesamiento y el análisis exploratorio de datos (EDA). |
| **IA1.3** | *(Implícito en el título de la unidad)* Análisis **ético** del problema: sesgos, variables sensibles e impacto en las personas. |

**Entregable: Notebook en Python que incluya**

| ID | Contenido |
|---|---|
| **IA1.E1** | Análisis exploratorio del conjunto de datos. |
| **IA1.E2** | Identificación de las variables relevantes. |

### Unidad 2: Manipulación, transformación y visualización de datos

**Actividades a desarrollar**

| ID | Actividad |
|---|---|
| **IA2.1** | Aplicar técnicas de manipulación y transformación de datos (Pandas y dplyr). |
| **IA2.2** | Filtrado, selección y agregación en DataFrames. |
| **IA2.3** | Visualizar datos con Matplotlib, Seaborn y ggplot2. |
| **IA2.4** | Aplicar normalización, estandarización y reducción de dimensionalidad (PCA). |
| **IA2.5** | Detectar y tratar los valores atípicos. |

**Entregable: Notebook en Python o R que incluya**

| ID | Contenido |
|---|---|
| **IA2.E1** | Visualización de patrones y correlaciones relevantes. |
| **IA2.E2** | Optimización y preprocesamiento de variables. |

### Unidad 3: Modelado avanzado, NLP y despliegue en producción

**Actividades a desarrollar**

| ID | Actividad |
|---|---|
| **IA3.1** | Aplicar NLP en datos financieros (análisis de texto, Sentiment Analysis, BERT y GPT). |
| **IA3.2** | Implementar redes neuronales (CNN/RNN) en TensorFlow/Keras. |
| **IA3.3** | Comparar los modelos clásicos con los de Deep Learning. |
| **IA3.4** | Crear una API con Flask o FastAPI. |
| **IA3.5** | Desplegar el modelo con Docker o en la nube (AWS, GCP, Azure). |
| **IA3.6** | Integrar con Big Data (Spark, Hadoop). |

**Entregable: Notebook en Python que incluya**

| ID | Contenido |
|---|---|
| **IA3.E1** | Modelo de NLP para la predicción de riesgo. |
| **IA3.E2** | Entrenamiento y evaluación de una red neuronal (CNN/RNN). |
| **IA3.E3** | API RESTful para el consumo del modelo. |

---

## Checklist global (marcar al cerrar cada ítem)

| ID | Ítem | Paso del plan | Hecho |
|---|---|---|---|
| PF1 | Notebook final que predice la probabilidad de impago | 11 | [ ] |
| E1 | Metodología ágil | 0 | [ ] |
| E2 | Todas las fases del proceso analítico | 1–12 | [ ] |
| E3 | Datos reales o realistas del sector financiero | 2 (dato: [03_contrato_datos.md](03_contrato_datos.md)) | [ ] |
| E4 | Integración de los dos módulos | 11 | [ ] |
| E5 | Problema en contexto | 1 | [ ] |
| F1 | Definir el problema | 1 | [ ] |
| F2 | Explorar y preparar los datos | 2, 3, 4 | [ ] |
| F3 | Analizar y modelar | 5, 6, 7 | [ ] |
| F4 | Evaluar y optimizar | 8 | [ ] |
| F5 | Desplegar y comunicar | 10, 11, 12 | [ ] |
| R1 | Modelo funcional | 8, 12 | [ ] |
| R2 | Técnicas de análisis de datos, IA y NLP | 4–7 | [ ] |
| R3 | Buenas prácticas de gestión | 0 | [ ] |
| R4 | Potencial de implementación real | 10, 12 | [ ] |
| P1.1 | Entorno Colab/Jupyter | 2 | [ ] |
| P1.2 | Pandas, NumPy, Matplotlib, Seaborn | 2 | [ ] |
| P1.3 | Cargar y explorar los datos | 2 | [ ] |
| P1.4 | Filtrado, selección, ordenamiento, agregaciones | 2 | [ ] |
| P1.5 | Histogramas, dispersión, boxplots | 2 | [ ] |
| P1.E1–E4 | Entregable de Prog-U1 | 2 | [ ] |
| P2.1 | Faltantes y duplicados | 3 | [ ] |
| P2.2 | One-Hot / Label Encoding | 3 | [ ] |
| P2.3 | Normalización y estandarización | 3 | [ ] |
| P2.4 | Nuevas variables | 3 | [ ] |
| P2.5 | Reducción de dimensionalidad | 3 | [ ] |
| P2.6 | División train/test | 3 | [ ] |
| P2.E1–E4 | Entregable de Prog-U2 | 3 | [ ] |
| IA1.1 | Explorar datasets y definir el problema | 1 | [ ] |
| IA1.2 | Preprocesamiento y EDA | 4 | [ ] |
| IA1.3 | Análisis ético | 1, 8 | [ ] |
| IA1.E1–E2 | Entregable de IA-U1 | 4 | [ ] |
| IA2.1 | Pandas y dplyr | 4 | [ ] |
| IA2.2 | Filtrado, selección, agregación | 4 | [ ] |
| IA2.3 | Matplotlib, Seaborn, ggplot2 | 4 | [ ] |
| IA2.4 | Normalización, estandarización, PCA | 4 | [ ] |
| IA2.5 | Atípicos | 4 | [ ] |
| IA2.E1–E2 | Entregable de IA-U2 | 4 | [ ] |
| IA3.1 | NLP: texto, sentimiento, BERT, GPT | 7 | [ ] |
| IA3.2 | CNN/RNN en TensorFlow/Keras | 6 | [ ] |
| IA3.3 | Clásicos vs Deep Learning | 5, 6, 8 | [ ] |
| IA3.4 | API Flask/FastAPI | 10 | [ ] |
| IA3.5 | Docker / nube | 10 | [ ] |
| IA3.6 | Big Data (Spark/Hadoop) | 9 | [ ] |
| IA3.E1 | Modelo NLP de riesgo | 7 | [ ] |
| IA3.E2 | Red neuronal entrenada y evaluada | 6 | [ ] |
| IA3.E3 | API RESTful | 10 | [ ] |
| **Total acreditado** | Calculado con `python Back/scripts/generar_evidencia.py` | — | **0/47** |

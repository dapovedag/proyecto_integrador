/**
 * Glosario pedagógico: aprendizaje automático, evaluación, redes neuronales, NLP, big data, despliegue y negocio.
 * Lector objetivo: principiante total. Cifras tomadas de la corrida real (model_card.json, resultados_*.json,
 * docker_api.json, api_capturas.json y los notebooks ejecutados 00 y 05 a 09).
 */
import type { EntradaGlosario } from "../pedagogia";

export const GLOSARIO_MODELOS: EntradaGlosario[] = [
  // ------------------------------------------------------------------ Aprendizaje automático
  {
    id: "modelo",
    termino: "Modelo predictivo",
    alias: ["modelo predictivo", "modelo servido", "modelo_final"],
    categoria: "ml",
    corto: "Programa que aprende de casos pasados para estimar algo que aún no se sabe; aquí, la probabilidad de que un cliente no pague su crédito.",
    queEs:
      "Un modelo predictivo es una receta matemática que se construye mirando muchos ejemplos del pasado en los que ya se conoce el desenlace. Igual que un médico con experiencia reconoce síntomas que suelen terminar en una enfermedad, el modelo reconoce combinaciones de datos que suelen terminar en impago. No adivina el futuro: da una estimación basada en lo que vio.",
    paraQue:
      "Sirve para tomar decisiones repetitivas con un criterio consistente y medible, en lugar de depender solo de la intuición de cada persona.",
    enEsteProyecto:
      "El modelo servido es una regresión logística calibrada (versión 2.0.0) que recibe los datos de una solicitud y devuelve la probabilidad de impago, una banda de riesgo y una acción. Se eligió entre 16 modelos de cinco familias y en el conjunto de prueba logra un AUC de 0,8456.",
    capitulo: 1,
  },
  {
    id: "entrenar",
    termino: "Entrenar (fit) y predecir (predict)",
    alias: ["fit", "predict_proba", "fit_transform", "entrenar"],
    categoria: "ml",
    corto: "Entrenar (fit) es que el modelo aprenda de datos con respuesta conocida; predecir (predict) es aplicarlo a casos nuevos.",
    queEs:
      "Entrenar es la etapa de estudio: el modelo recibe ejemplos con la respuesta (pagó o no pagó) y ajusta sus números internos hasta equivocarse lo menos posible. Predecir es el examen: recibe casos que nunca vio y responde. En Python casi todo se entrena con el método fit y se usa con predict o predict_proba (este último devuelve probabilidades).",
    paraQue:
      "Separar ambos momentos permite medir con honestidad qué tan bien funciona el modelo con personas que no conoció al aprender.",
    comoSeLee:
      "Cuando vea modelo.fit(X_train, y_train), lea «aprende de estos datos con estas respuestas». Cuando vea modelo.predict_proba(X_test)[:, 1], lea «dame la probabilidad de impago (la segunda columna) de cada cliente nuevo».",
    enEsteProyecto:
      "En el capítulo 3 el preprocesamiento se ajusta (fit) solo con las 9.600 filas de entrenamiento, para que la prueba no se filtre. Desde el capítulo 5 cada modelo se entrena con esas mismas filas y predice sobre las 2.400 de prueba.",
    capitulo: 3,
  },
  {
    id: "clasificacion",
    termino: "Clasificación binaria",
    alias: ["clasificación binaria", "clasificación", "clasificador"],
    categoria: "ml",
    corto: "Tipo de problema en el que cada caso pertenece a una de dos clases; aquí, 1 = no pagó (impago) y 0 = pagó.",
    queEs:
      "Clasificar es poner cada caso en una caja. Es binaria cuando solo hay dos cajas, como un semáforo que solo tuviera verde y rojo. El modelo no entrega directamente la caja: entrega una probabilidad, y luego un umbral decide en qué caja queda cada cliente.",
    paraQue:
      "Convierte una pregunta de negocio (¿este cliente pagará?) en un problema que un modelo puede aprender y que se evalúa con métricas claras.",
    enEsteProyecto:
      "La variable objetivo es default: 1 si el cliente no pagó y 0 si pagó. En entrenamiento el 35,6 % de las solicitudes son impagos. El proyecto añade una tercera salida práctica, la revisión manual, para los casos dudosos.",
    capitulo: 1,
  },
  {
    id: "probabilidad",
    termino: "Probabilidad de impago",
    alias: ["probabilidad de impago", "probabilidad_impago", "probability of default", "prob_default"],
    categoria: "ml",
    corto: "Número entre 0 y 1 que estima qué tan probable es que un cliente no pague; 0,30 significa que unos 30 de cada 100 clientes parecidos no pagan.",
    queEs:
      "Es la respuesta principal del modelo: un número entre 0 (seguro paga) y 1 (seguro no paga). Funciona como el pronóstico del clima: «70 % de lluvia» no promete que llueva, pero de 100 días así llueve en unos 70. En banca se le llama PD (probability of default).",
    paraQue:
      "Una probabilidad permite comparar clientes, fijar umbrales con costos y explicar decisiones; una simple etiqueta de sí o no perdería esa información.",
    comoSeLee:
      "Multiplique por 100 y piense en grupos: 0,10 es «10 de cada 100 clientes con este perfil no pagan». Solo se puede leer así si el modelo está calibrado.",
    enEsteProyecto:
      "La API devuelve el campo probabilidad_impago. Para los tres clientes de demostración da 0,0106 (aprobar), 0,3315 (revisar) y 0,9969 (rechazar).",
    capitulo: 1,
  },
  {
    id: "modelos_clasicos",
    termino: "Modelos clásicos",
    alias: ["modelos clásicos", "machine learning clásico", "resultados_clasicos"],
    categoria: "ml",
    corto: "Familia de modelos de aprendizaje automático anteriores a las redes profundas: regresión logística, árboles, bosques y boosting.",
    queEs:
      "Son las herramientas de aprendizaje automático más usadas con datos en forma de tabla (filas y columnas). Son rápidos, necesitan menos datos que las redes neuronales y muchos se pueden explicar. Piense en ellos como las herramientas básicas de un taller: no son las más llamativas, pero resuelven la mayoría de los trabajos.",
    paraQue:
      "Sirven como punto de partida sólido y como referencia contra la que se comparan técnicas más complejas.",
    enEsteProyecto:
      "En el capítulo 5 se comparan cuatro modelos clásicos y una línea base con validación cruzada en entrenamiento: regresión logística (AUC 0,8578), Random Forest (0,8527), Gradient Boosting (0,8442), árbol de decisión (0,8340) y Dummy (0,50). Gana la regresión logística, que entrena en menos de un segundo.",
    capitulo: 5,
  },
  {
    id: "dummy",
    termino: "Modelo de referencia (Dummy)",
    alias: ["dummy", "dummyclassifier", "dummy (línea base)"],
    categoria: "ml",
    corto: "Modelo que no mira los datos del cliente y responde siempre lo más frecuente; es la vara de medir que todo modelo útil debe superar.",
    queEs:
      "Es un modelo «perezoso» a propósito: le da a todos la misma respuesta, la del caso más común, sin mirar a nadie. Es como un meteorólogo que todos los días anuncia el clima promedio del mes. Si un modelo serio no le gana, no está aprendiendo nada de los datos.",
    paraQue: "Sirve como línea base: muestra cuánto se gana realmente al usar la información de cada cliente.",
    comoSeLee:
      "Su AUC es 0,5, igual que el azar. Si otro modelo obtiene un AUC cercano a 0,5, no ordena a los clientes mejor que el Dummy.",
    enEsteProyecto:
      "Se usa DummyClassifier(strategy=\"prior\"), que le asigna a cada cliente la tasa promedio de impago (35,6 %). Obtiene AUC 0,50 y Brier 0,2292; la regresión logística llega a AUC 0,8459 y Brier 0,1488 en el mismo conjunto de prueba.",
    capitulo: 5,
  },
  {
    id: "regresion_logistica",
    termino: "Regresión logística",
    alias: ["regresión logística", "regresion logistica", "logisticregression", "lr"],
    categoria: "ml",
    corto: "Modelo que suma los factores del cliente, cada uno con su peso, y convierte ese total en una probabilidad entre 0 y 1.",
    queEs:
      "Imagine una balanza de puntos: cada dato del cliente suma o resta según su peso (las moras suman riesgo, un mejor puntaje de buró lo resta). El total puede ser cualquier número, y una curva en forma de S (la función sigmoide) lo convierte en una probabilidad entre 0 y 1. A pesar del nombre, se usa para clasificar, no para predecir cantidades.",
    paraQue:
      "Es rápida, estable y explicable: cada peso dice cuánto y en qué dirección influye cada variable, algo muy valorado en crédito.",
    comoSeLee:
      "Un coeficiente positivo aumenta el riesgo y uno negativo lo reduce; cuanto mayor su tamaño, mayor su influencia (con variables estandarizadas).",
    enEsteProyecto:
      "Es el modelo final: regresión logística con C = 0,031489, calibrada con sigmoide y entrenada con reweighing. Ganó la validación cruzada (AUC 0,8582 frente a 0,8525 del boosting) y en prueba obtiene AUC 0,8456, KS 0,5384 y Brier 0,1491.",
    capitulo: 5,
  },
  {
    id: "arbol_decision",
    termino: "Árbol de decisión",
    alias: ["árbol de decisión", "arbol de decision", "decisiontreeclassifier"],
    categoria: "ml",
    corto: "Modelo que decide con una serie de preguntas de sí o no sobre los datos, como un diagrama de flujo, hasta llegar a una respuesta.",
    queEs:
      "Funciona como el juego de las 20 preguntas: por ejemplo, «¿el puntaje de buró es bajo?»; si la respuesta es sí, «¿tiene moras en el último año?», y así hasta una hoja final que dice qué proporción de clientes parecidos no pagó. Las preguntas y sus puntos de corte los elige el algoritmo a partir de los datos.",
    paraQue:
      "Es fácil de dibujar y de explicar, y capta relaciones que no son una línea recta (por ejemplo, más riesgo en los dos extremos de una variable).",
    comoSeLee:
      "Se lee de arriba hacia abajo: cada rama es una respuesta y cada hoja da la probabilidad de impago de los clientes que llegaron allí.",
    enEsteProyecto:
      "Se entrenó con un máximo de 6 preguntas encadenadas (max_depth=6) y al menos 40 clientes por hoja. Obtuvo AUC 0,8340 en validación cruzada y 0,8207 en prueba, por debajo de la regresión logística.",
    capitulo: 5,
  },
  {
    id: "random_forest",
    termino: "Random Forest",
    alias: ["random forest", "randomforestclassifier", "rf", "bosque aleatorio"],
    categoria: "ml",
    corto: "Muchos árboles de decisión, cada uno entrenado con una muestra distinta de los datos, que votan; la respuesta final es el promedio.",
    queEs:
      "En lugar de confiar en un solo árbol, se construyen cientos, cada uno con una muestra al azar de clientes y de variables. Es como consultar a un comité de expertos con experiencias distintas: cada uno se equivoca a su manera, pero el promedio del grupo suele acertar más que cualquiera por separado.",
    paraQue:
      "Es más estable y preciso que un árbol solo, y además indica en qué variables se apoyan más los árboles.",
    enEsteProyecto:
      "En el capítulo 3 un bosque de 300 árboles ayuda a elegir variables: el puntaje de buró y el uso del cupo reúnen el 60 % de su importancia. En el capítulo 5 un Random Forest de 300 árboles logra AUC 0,8527 en validación cruzada y 0,8397 en prueba, cerca de la regresión logística, pero tarda unas 6 veces más en entrenar (5,5 s frente a 0,9 s).",
    capitulo: 3,
  },
  {
    id: "gradient_boosting",
    termino: "Gradient Boosting",
    alias: ["gradient boosting", "histgradientboostingclassifier", "hgb", "boosting"],
    categoria: "ml",
    corto: "Árboles pequeños construidos en cadena, donde cada uno corrige los errores que dejaron los anteriores.",
    queEs:
      "Es como un equipo de correctores que trabaja en fila: el primero hace un borrador, el segundo se fija solo en los errores que quedaron, el tercero en los que siguen, y así. Cada árbol es pequeño, pero sumados en cadena forman un modelo muy preciso. La versión usada aquí (HistGradientBoosting) agrupa los valores en intervalos para entrenar más rápido.",
    paraQue:
      "Suele estar entre los modelos más precisos con datos en tabla, a cambio de más tiempo de entrenamiento y de ajuste.",
    enEsteProyecto:
      "Con su configuración inicial obtuvo AUC 0,8442 en validación cruzada y 0,8290 en prueba, con 34,4 s de entrenamiento. En el capítulo 8 se optimizó hasta 0,8525 y quedó por debajo de la regresión logística (0,8582), por eso el modelo servido es la logística.",
    capitulo: 5,
  },
  {
    id: "pipeline",
    termino: "Pipeline",
    alias: ["pipeline", "build_pipeline", "make_pipeline"],
    categoria: "ml",
    corto: "Cadena de pasos (preparar, transformar y modelar) empaquetada como una sola pieza que se entrena y se aplica siempre en el mismo orden.",
    queEs:
      "Es como una línea de ensamblaje: la materia prima entra por un lado, pasa por estaciones fijas y sale el producto terminado. En lugar de aplicar a mano cada paso de limpieza y luego el modelo, el pipeline los encadena para que ninguno se olvide ni se desordene.",
    paraQue:
      "Garantiza que el entrenamiento y el uso real hagan exactamente lo mismo y evita que la información de prueba se filtre al entrenar.",
    enEsteProyecto:
      "El pipeline del proyecto es: variables derivadas → recorte de extremos (p1–p99) → imputación, escalado y codificación → modelo. Es el mismo en los notebooks y en la API; por eso la API recibe los datos crudos del cliente y aplica sola toda la preparación.",
    capitulo: 3,
  },
  {
    id: "validacion_cruzada",
    termino: "Validación cruzada",
    alias: ["validación cruzada", "validacion cruzada", "cross_validate", "cross_val_score", "cross_val_predict", "stratifiedkfold", "crossvalidator", "cv"],
    categoria: "ml",
    corto: "Técnica que divide el entrenamiento en varias partes y evalúa el modelo varias veces, cada vez con una parte distinta como examen.",
    queEs:
      "Imagine que estudia con un banco de preguntas dividido en 5 grupos. Practica con 4 y se evalúa con el quinto, y repite rotando hasta que cada grupo fue examen una vez. El promedio de las 5 notas dice mucho más que una sola prueba. «Estratificada» significa que cada grupo conserva la misma proporción de impagos.",
    paraQue:
      "Permite comparar y elegir modelos sin tocar el conjunto de prueba, que se reserva para la evaluación final.",
    comoSeLee:
      "Se reporta como media ± desviación: 0,8578 ± 0,0050 quiere decir que el AUC promedio de los 5 pliegues fue 0,8578 y que varió poco entre ellos.",
    enEsteProyecto:
      "Se usa validación cruzada estratificada de 5 pliegues (folds) con semilla 42 sobre las 9.600 filas de entrenamiento. Con ella se eligió la regresión logística (AUC 0,8582) y la prueba se usó una sola vez, al final.",
    capitulo: 5,
  },
  {
    id: "sobreajuste",
    termino: "Sobreajuste (overfitting)",
    alias: ["sobreajuste", "sobreajustar", "overfitting", "overfit"],
    categoria: "ml",
    corto: "Cuando un modelo memoriza los datos de entrenamiento en lugar de aprender patrones generales y luego rinde menos con casos nuevos.",
    queEs:
      "Es como el estudiante que memoriza las respuestas del simulacro: saca la nota máxima en la práctica, pero en el examen real, con preguntas nuevas, le va peor. El modelo sobreajustado aprende hasta el ruido y las casualidades de sus datos.",
    paraQue:
      "Reconocerlo evita confiar en un modelo que parece excelente en entrenamiento pero rinde menos con clientes reales.",
    comoSeLee:
      "Se detecta comparando el desempeño en entrenamiento y en validación: si el de entrenamiento sigue subiendo y el de validación se estanca o baja, empieza el sobreajuste.",
    enEsteProyecto:
      "En el capítulo 6, el MLP llega a un AUC de 0,863 en entrenamiento frente a 0,8536 en validación: una brecha de unos 0,01 que early stopping corta restaurando la época 20. En la GRU de texto el sobreajuste aparece pronto: su mejor época es la 4.",
    capitulo: 6,
  },
  {
    id: "regularizacion",
    termino: "Regularización",
    alias: ["regularización", "regularizacion", "l2_regularization", "regparam", "penalty"],
    categoria: "ml",
    corto: "Freno que se le pone a un modelo para que no use pesos exagerados ni se ajuste de más a los datos de entrenamiento.",
    queEs:
      "Es como ponerle un presupuesto al modelo: puede darles importancia a las variables, pero cada peso grande «cuesta». Así prefiere explicaciones sencillas y no se aferra a detalles casuales. En la regresión logística lo controla el hiperparámetro C: cuanto más pequeño es C, más fuerte es el freno.",
    paraQue: "Reduce el sobreajuste y baja el peso de las variables que aportan poco.",
    enEsteProyecto:
      "La regresión logística final usa regularización L2 con C = 0,031489, elegido por búsqueda aleatoria con validación cruzada. En las redes neuronales el mismo papel lo cumple el dropout, y en Spark MLlib se usa la penalización equivalente a la de scikit-learn (regParam = 1 / n_train para C = 1).",
    capitulo: 3,
  },
  {
    id: "hiperparametro",
    termino: "Hiperparámetro",
    alias: ["hiperparámetro", "hiperparámetros", "hiperparametro", "randomizedsearchcv", "gridsearchcv", "paramgridbuilder"],
    categoria: "ml",
    corto: "Ajuste que se fija antes de entrenar (como la profundidad de un árbol) y que el modelo no aprende por sí mismo de los datos.",
    queEs:
      "Si el modelo fuera un horno, los pesos que aprende serían el resultado de la cocción, y los hiperparámetros, la temperatura y el tiempo que usted programa antes de encenderlo. Ejemplos: cuántos árboles tiene un bosque, cuántas preguntas puede hacer un árbol o qué tan fuerte es la regularización.",
    paraQue:
      "Elegirlos bien puede mejorar mucho un modelo; se prueban varias combinaciones y se elige la mejor con validación cruzada.",
    enEsteProyecto:
      "En el capítulo 8, RandomizedSearchCV prueba 8 combinaciones por modelo con validación cruzada de 5 pliegues. Para la regresión logística eligió C = 0,031489; para el boosting, una tasa de aprendizaje de 0,023, 151 iteraciones y 31 hojas por árbol.",
    capitulo: 5,
  },
  {
    id: "importancia_variables",
    termino: "Importancia de variables (permutación)",
    alias: ["importancia por permutación", "importancia_permutacion", "permutation_importance", "feature_importances_"],
    categoria: "ml",
    corto: "Mide cuánto empeora el modelo si se desordenan al azar los valores de una variable: cuanto más empeora, más importante es esa variable.",
    queEs:
      "Imagine que a un cocinero le cambian la sal por otro polvo sin avisarle. Si el plato queda muy mal, la sal era clave; si casi no cambia, no importaba tanto. La permutación hace eso con cada variable: la revuelve entre clientes y mide cuánto cae el AUC.",
    paraQue:
      "Dice en qué variables se apoya el modelo, sirve para cualquier tipo de modelo y ayuda a revisar si depende de variables sensibles.",
    comoSeLee:
      "Barras más largas = variables más importantes. Un valor cercano a 0 indica que el modelo casi no usa esa variable.",
    enEsteProyecto:
      "En el modelo final, desordenar el puntaje de buró hace caer el AUC 0,086; la relación deuda/ingreso, 0,047; el uso del cupo, 0,043, y las moras, 0,013. La edad queda prácticamente en 0. En el capítulo 3 un bosque de árboles ya señalaba esas mismas variables.",
    capitulo: 5,
  },
  {
    id: "coeficiente",
    termino: "Coeficiente",
    alias: ["coef_", "coeficientes_lr", "coeficientes de la regresión"],
    categoria: "ml",
    corto: "Peso que la regresión logística le asigna a cada variable: su signo dice si sube o baja el riesgo y su tamaño, cuánto.",
    queEs:
      "En la balanza de puntos de la regresión logística, el coeficiente es cuánto pesa cada dato. Si las variables están en la misma escala (estandarizadas), los coeficientes se pueden comparar entre sí como se comparan pesos en una báscula.",
    paraQue: "Permite explicar el modelo y revisar que sus relaciones tengan sentido de negocio.",
    comoSeLee:
      "Positivo = aumenta el riesgo; negativo = lo reduce. Está en log-odds por desviación estándar: un coeficiente de −0,86 multiplica las odds de impago por 0,42 (e elevado a −0,86 ≈ 0,42) por cada desviación estándar más de esa variable.",
    enEsteProyecto:
      "En la regresión logística del capítulo 5 dominan el puntaje de buró (−0,86), la relación deuda/ingreso (+0,72), el uso del cupo de tarjetas (+0,60) y las moras recientes (+0,37). Una desviación estándar del puntaje de buró equivale a unos 116 puntos.",
    capitulo: 5,
  },
  {
    id: "log_odds",
    termino: "Log-odds",
    alias: ["log-odds", "log_odds", "logit", "odds"],
    categoria: "ml",
    corto: "Forma de expresar una probabilidad en una escala sin límites: 0 equivale a 50 %, los negativos a menos riesgo y los positivos a más.",
    queEs:
      "Las odds comparan lo que pasa con lo que no pasa: una probabilidad del 20 % equivale a odds de 1 a 4 (0,20 / 0,80 = 0,25). El log-odds es el logaritmo de ese cociente. Es la escala en la que la regresión logística suma sus factores antes de convertir el total en probabilidad.",
    paraQue:
      "En esa escala las contribuciones de cada variable simplemente se suman, lo que permite explicar cada predicción pieza por pieza.",
    comoSeLee:
      "0 = 50 %; −2 ≈ 12 %; +2 ≈ 88 %. Cada unidad hacia abajo reduce el riesgo y cada unidad hacia arriba lo aumenta.",
    enEsteProyecto:
      "La API explica cada decisión con contribuciones en log-odds. Para el cliente de alto riesgo, el puntaje de buró aporta +2,43 y las moras +1,31; para el de bajo riesgo, el buró aporta −1,19.",
    capitulo: 5,
  },
  {
    id: "shap",
    termino: "SHAP",
    alias: ["shap", "shap_values", "linearexplainer", "treeexplainer"],
    categoria: "ml",
    corto: "Método que reparte una predicción entre las variables e indica cuánto empujó cada una el riesgo hacia arriba o hacia abajo.",
    queEs:
      "Imagine una cuenta de restaurante compartida: SHAP calcula cuánto le toca pagar a cada comensal según lo que consumió. Aquí la «cuenta» es la diferencia entre el riesgo de un cliente y el del cliente promedio, y los «comensales» son las variables. Se basa en la teoría de juegos (valores de Shapley).",
    paraQue:
      "Explica tanto el modelo en general (qué variables pesan más) como cada decisión individual, lo que apoya la transparencia con el solicitante.",
    comoSeLee:
      "Barras a la derecha (positivas) suben el riesgo; a la izquierda (negativas) lo bajan. En la vista global, cada barra es el tamaño promedio de la contribución en todos los clientes.",
    enEsteProyecto:
      "En el capítulo 8 se calcula SHAP con LinearExplainer sobre 1.500 clientes de prueba. Su ranking coincide con los coeficientes y con la permutación: puntaje de buró, uso del cupo, deuda/ingreso y moras. Tres métodos distintos señalan los mismos factores.",
    capitulo: 8,
  },

  // ------------------------------------------------------------------ Evaluación de modelos
  {
    id: "matriz_confusion",
    termino: "Matriz de confusión",
    alias: ["confusion_matrix", "matriz de confusión", "matrices de confusión"],
    categoria: "evaluacion",
    corto: "Tabla de 2 × 2 que cruza lo real con lo predicho y cuenta los aciertos y los dos tipos de error del modelo.",
    queEs:
      "Es una tabla de doble entrada: las filas dicen qué pasó en realidad (pagó o no pagó) y las columnas, qué dijo el modelo. Las celdas de la diagonal son aciertos y las otras dos son errores de distinto tipo, que en crédito no cuestan lo mismo.",
    paraQue: "Muestra no solo cuántas veces acierta el modelo, sino en qué se equivoca.",
    comoSeLee:
      "Verdadero negativo: pagó y el modelo dijo «paga». Falso positivo: pagó, pero el modelo dijo «impago» (se pierde un buen cliente). Falso negativo: no pagó y el modelo dijo «paga» (el error más caro). Verdadero positivo: no pagó y el modelo lo detectó.",
    enEsteProyecto:
      "Con la regresión logística y el umbral 0,25, en las 2.400 solicitudes de prueba hay 1.036 verdaderos negativos, 510 falsos positivos, 132 falsos negativos y 722 verdaderos positivos: detecta 722 de los 854 impagos.",
    capitulo: 5,
  },
  {
    id: "umbral",
    termino: "Umbral de decisión",
    alias: ["umbral de decisión", "umbral", "umbrales", "threshold"],
    categoria: "evaluacion",
    corto: "Valor de corte que convierte una probabilidad en una decisión: por encima del umbral se actúa de una forma y por debajo, de otra.",
    queEs:
      "Es como la nota mínima de un examen, que separa aprobado de reprobado. El modelo da una probabilidad continua y el umbral la traduce en acción. No tiene por qué ser 0,5: se fija según lo que cuesta cada tipo de error.",
    paraQue: "Permite ajustar el comportamiento del modelo a las prioridades del negocio sin volver a entrenarlo.",
    comoSeLee:
      "Bajar el umbral detecta más impagos, pero rechaza a más buenos pagadores; subirlo hace lo contrario.",
    enEsteProyecto:
      "El umbral de dos acciones es 0,25 = 0,15 / (0,15 + 0,45), porque aprobar a quien no paga cuesta tres veces más que rechazar a quien sí paga. La política servida usa dos umbrales (regla de Chow): aprobar si p < 0,1778 y rechazar si p > 0,4667.",
    capitulo: 1,
  },
  {
    id: "precision_recall",
    termino: "Precisión y recall",
    alias: ["precisión", "precision", "recall", "precision_score", "recall_score", "exhaustividad"],
    categoria: "evaluacion",
    corto: "Precisión: de los que el modelo marca como impago, cuántos lo son. Recall: de los impagos reales, cuántos detecta.",
    queEs:
      "Piense en una red para pescar un tipo de pez. El recall es qué parte de esos peces del lago quedó en la red; la precisión es qué parte de lo que sacó la red es realmente ese pez. Una red enorme atrapa casi todos los peces buscados (recall alto), pero también mucha basura (precisión baja).",
    paraQue: "Juntas muestran el equilibrio entre detectar el riesgo y no castigar a los buenos pagadores.",
    comoSeLee:
      "Ambas van de 0 a 1 y más es mejor. Suelen moverse en sentidos opuestos al cambiar el umbral.",
    enEsteProyecto:
      "Con el umbral 0,25, la regresión logística del capítulo 5 detecta el 84,5 % de los impagos (recall) con una precisión del 58,6 %. Con el umbral de rechazo 0,4667, el modelo final tiene precisión 72,1 % y recall 63,7 %.",
    capitulo: 1,
  },
  {
    id: "f1",
    termino: "F1",
    alias: ["f1", "f1-score", "f1_score", "puntaje f1"],
    categoria: "evaluacion",
    corto: "Métrica que resume precisión y recall en un solo número; solo es alta si ambas lo son.",
    queEs:
      "Es un promedio especial (armónico) de precisión y recall que castiga los desequilibrios: si una de las dos es muy baja, el F1 también lo es. Es como calificar un plato por sabor y por presentación con una regla que no deja que una nota alta tape una muy baja.",
    paraQue:
      "Permite comparar modelos con una sola cifra cuando las clases están desbalanceadas, como aquí (35,6 % de impagos).",
    comoSeLee: "Va de 0 a 1; más es mejor. Se calcula como 2 × precisión × recall / (precisión + recall).",
    enEsteProyecto:
      "Al umbral 0,25, la regresión logística obtiene F1 0,6922, el mejor entre los modelos clásicos y las redes; el MLP llega a 0,6778. El modelo final, al umbral de rechazo 0,4667, tiene F1 0,6762.",
    capitulo: 1,
  },
  {
    id: "roc_auc",
    termino: "Curva ROC y AUC",
    alias: ["auc", "roc", "roc_auc", "roc_auc_score", "roc-auc", "curva roc", "areaunderroc"],
    categoria: "evaluacion",
    corto: "Mide qué tan bien ordena el modelo a los clientes por riesgo: 0,5 es azar y 1 es perfecto.",
    queEs:
      "Tome al azar un cliente que no pagó y otro que sí pagó. El AUC es la probabilidad de que el modelo le asigne más riesgo al que no pagó. La curva ROC muestra, para todos los umbrales posibles, cuántos impagos se detectan (eje vertical) a cambio de cuántos buenos pagadores se marcan por error (eje horizontal); el AUC es el área bajo esa curva.",
    paraQue:
      "Es la métrica principal del proyecto porque no depende del umbral: evalúa la capacidad de ordenar, que es la base de cualquier política de decisión.",
    comoSeLee:
      "0,5 = azar (la diagonal); 1 = perfecto. Como referencia general, en crédito un valor entre 0,7 y 0,8 es bueno y por encima de 0,8, muy bueno. Una curva más pegada a la esquina superior izquierda es mejor.",
    enEsteProyecto:
      "La meta era AUC ≥ 0,70 en prueba. El modelo final logra 0,8456 (0,8582 en validación cruzada) y el Dummy, 0,50. Un AUC de 0,8456 significa que en el 84,6 % de las parejas (uno que pagó y uno que no) el modelo ordena bien.",
    capitulo: 1,
  },
  {
    id: "pr_auc",
    termino: "Curva precisión-recall (PR-AUC)",
    alias: ["pr-auc", "pr_auc", "average_precision_score", "curva precisión-recall", "areaunderpr"],
    categoria: "evaluacion",
    corto: "Área bajo la curva precisión-recall: resume qué tan bien detecta impagos sin llenarse de falsas alarmas; su base es la tasa de impago.",
    queEs:
      "La curva precisión-recall muestra qué precisión se mantiene a medida que se exige detectar más impagos. Su área (PR-AUC) resume la curva en un número. A diferencia del AUC, se concentra en la clase de interés: los impagos.",
    paraQue:
      "Es útil cuando la clase de interés es minoritaria, porque deja ver cuántas falsas alarmas cuesta detectar más casos.",
    comoSeLee:
      "Su valor de referencia no es 0,5 sino la prevalencia: un modelo sin información obtiene la tasa de impago (aquí 0,356). Más cerca de 1 es mejor.",
    enEsteProyecto:
      "El modelo final obtiene PR-AUC 0,7675 en prueba, más del doble de la línea de referencia de 0,356 que obtiene el Dummy.",
    capitulo: 5,
  },
  {
    id: "ks",
    termino: "KS (Kolmogórov-Smirnov)",
    alias: ["ks", "kolmogórov-smirnov", "kolmogorov-smirnov", "ks_stat"],
    categoria: "evaluacion",
    corto: "Máxima separación entre cómo puntúa el modelo a quienes pagan y a quienes no pagan; muy usada en scoring bancario.",
    queEs:
      "Ordene a todos los clientes por riesgo y recorra la lista de arriba abajo. En cada punto mida qué fracción de los impagos y qué fracción de los buenos pagadores ya pasó. El KS es la mayor diferencia entre esas dos fracciones: dice qué tan separados quedan los dos grupos en el mejor punto de corte.",
    paraQue: "Es una métrica tradicional en bancos para validar modelos de puntaje y comparar versiones.",
    comoSeLee:
      "Va de 0 (no separa) a 1 (separa perfecto). Un KS de 0,54 significa que en el mejor corte hay 54 puntos porcentuales de diferencia entre la fracción acumulada de impagos y la de buenos pagadores.",
    enEsteProyecto:
      "El modelo final obtiene KS 0,5384 en prueba; el Dummy, 0. Se calcula como la mayor distancia entre la tasa de verdaderos positivos y la de falsos positivos de la curva ROC.",
    capitulo: 1,
  },
  {
    id: "brier",
    termino: "Brier",
    alias: ["brier", "brier score", "brier_score_loss"],
    categoria: "evaluacion",
    corto: "Error cuadrático medio de las probabilidades: mide si los números del modelo se parecen a lo que realmente pasa; menor es mejor.",
    queEs:
      "Para cada cliente se compara la probabilidad dada con lo que ocurrió (1 si no pagó, 0 si pagó), se eleva la diferencia al cuadrado y se promedia. Es como calificar a un pronosticador del clima: lo penaliza más cuando dice «95 % de sol» y llueve que cuando dice «55 %».",
    paraQue:
      "Evalúa la calidad de la probabilidad, no solo el orden, algo indispensable cuando los umbrales se calculan con costos.",
    comoSeLee:
      "0 es perfecto y menor es mejor. Decir 0,5 a todos da 0,25. Solo se comparan valores de Brier calculados sobre los mismos datos.",
    enEsteProyecto:
      "El modelo final obtiene Brier 0,1491 en prueba, frente a 0,2292 del Dummy, que le asigna a todos la tasa promedio de impago.",
    capitulo: 1,
  },
  {
    id: "calibracion",
    termino: "Calibración",
    alias: ["calibración", "calibratedclassifiercv", "calibrado", "calibrada", "curva de calibración", "calibration_curve"],
    categoria: "evaluacion",
    corto: "Propiedad de un modelo cuyas probabilidades se cumplen: de 100 clientes con 0,30, unos 30 no pagan. También, el ajuste que lo logra.",
    queEs:
      "Un termómetro puede ordenar bien los días de más frío a más calor y, aun así, marcar 3 grados de más. Calibrar es corregir esa escala para que el número signifique lo que dice. Un modelo puede ordenar bien a los clientes (buen AUC) y, aun así, dar probabilidades infladas o desinfladas.",
    paraQue:
      "Las reglas de decisión basadas en costos suponen que la probabilidad es real; con un modelo calibrado los umbrales quedan bien ubicados.",
    comoSeLee:
      "En la curva de calibración, el eje horizontal es la probabilidad predicha y el vertical, la fracción real de impagos. Cuanto más cerca de la diagonal, mejor calibrado está el modelo.",
    enEsteProyecto:
      "El modelo final se calibra con CalibratedClassifierCV (método sigmoide, ensemble=False). La regresión logística ya venía bien calibrada (Brier 0,1490) y la calibración lo conserva (0,1491); el error de calibración por grupo de sexo y de edad es de 1,7 puntos como máximo.",
    capitulo: 1,
  },

  // ------------------------------------------------------------------ Redes neuronales
  {
    id: "red_neuronal",
    termino: "Red neuronal",
    alias: ["red neuronal", "redes neuronales", "deep learning", "aprendizaje profundo", "keras.model"],
    categoria: "redes",
    corto: "Modelo formado por capas de pequeñas unidades de cálculo conectadas, que aprende patrones complejos ajustando miles de pesos.",
    queEs:
      "Se inspira, de forma muy simplificada, en las neuronas del cerebro. Cada «neurona» recibe números, los combina con pesos y pasa el resultado a la capa siguiente. Es como una cadena de oficinas donde cada una resume lo que le llega y lo envía a la próxima; con suficientes capas, el conjunto aprende relaciones complejas. «Deep learning» (aprendizaje profundo) significa usar varias capas.",
    paraQue:
      "Brillan con imágenes, audio y texto; con datos en tabla no siempre superan a los modelos clásicos.",
    enEsteProyecto:
      "En el capítulo 6 se entrenan cuatro redes con TensorFlow 2.20 y Keras: MLP, CNN 1D, GRU sobre el texto e híbrido texto + tabular. La mejor en prueba, el MLP, llega a AUC 0,8419; la regresión logística, con 0,8459, entrena unas 30 veces más rápido y es explicable, por eso se mantiene como modelo servido.",
    capitulo: 6,
  },
  {
    id: "mlp",
    termino: "MLP (perceptrón multicapa)",
    alias: ["mlp", "perceptrón multicapa", "construir_mlp"],
    categoria: "redes",
    corto: "Red neuronal básica de capas densas, en la que cada neurona se conecta con todas las de la capa siguiente.",
    queEs:
      "Es la red neuronal «clásica»: una capa de entrada con los datos del cliente, capas ocultas que los combinan y una neurona de salida que da la probabilidad. Cada neurona está conectada con todas las de la capa siguiente, como en una reunión donde todos hablan con todos.",
    paraQue:
      "Es la red de referencia para datos en tabla: si una arquitectura más sofisticada no le gana, no compensa su complejidad.",
    enEsteProyecto:
      "El MLP del proyecto va de 38 entradas a 64 neuronas, BatchNormalization, Dropout del 30 %, 32 neuronas, Dropout del 20 % y la salida, con 4.865 parámetros. Entrenó 25 épocas (la mejor fue la 20) en 27,8 s y obtuvo AUC 0,8419 en prueba.",
    capitulo: 6,
  },
  {
    id: "cnn",
    termino: "CNN 1D (red convolucional)",
    alias: ["cnn", "cnn1d", "conv1d", "red convolucional", "globalmaxpooling1d", "construir_cnn1d"],
    categoria: "redes",
    corto: "Red neuronal que pasa pequeños filtros por los datos buscando patrones locales; la versión 1D recorre una fila de valores.",
    queEs:
      "Imagine una lupa que recorre una fila de números de tres en tres buscando formas que se repiten: eso hace un filtro convolucional. Las CNN se inventaron para imágenes, donde los píxeles vecinos están relacionados; la versión 1D hace lo mismo sobre una sola fila de valores.",
    paraQue:
      "Funcionan muy bien cuando el orden y la vecindad de los datos importan, como en imágenes, sonido o series de tiempo.",
    enEsteProyecto:
      "Se aplicó una CNN 1D sobre las 38 columnas del cliente, con filtros de tamaño 3 (32 y 64 filtros) y 8.577 parámetros. Obtuvo AUC 0,7709 en prueba: en una tabla el orden de las columnas no significa nada, así que buscar vecinos no aporta. Es un ejercicio de arquitectura que confirma la elección del modelo clásico.",
    capitulo: 6,
  },
  {
    id: "rnn_gru",
    termino: "RNN y GRU (redes recurrentes)",
    alias: ["gru", "rnn", "red recurrente", "redes recurrentes", "bidirectional", "gru_texto", "construir_gru_texto"],
    categoria: "redes",
    corto: "Redes que leen una secuencia paso a paso y recuerdan lo anterior; la GRU tiene «compuertas» que deciden qué recordar y qué olvidar.",
    queEs:
      "Leen como lee una persona: palabra por palabra, guardando en la memoria lo que ya leyeron para entender lo que sigue. La GRU (Gated Recurrent Unit) tiene compuertas que deciden qué guardar y qué olvidar. La versión bidireccional lee la frase de izquierda a derecha y también de derecha a izquierda.",
    paraQue: "Se usan con datos en los que el orden importa: texto, voz o series de tiempo.",
    enEsteProyecto:
      "Una GRU bidireccional lee el texto de la solicitud (Embedding de 32 dimensiones, 108.737 parámetros) y obtiene AUC 0,6466 en prueba usando solo el texto. En el modelo híbrido, una GRU más pequeña se combina con los datos tabulares y llega a AUC 0,8399.",
    capitulo: 6,
  },
  {
    id: "epoca",
    termino: "Época",
    alias: ["época", "épocas", "epoca", "epocas", "epoch", "epochs"],
    categoria: "redes",
    corto: "Una vuelta completa del entrenamiento por todos los datos de ajuste; una red neuronal suele necesitar muchas épocas.",
    queEs:
      "Es como leer un libro completo una vez para estudiar: cada relectura (época) afianza lo aprendido. Dentro de cada época los datos se procesan en lotes (batches) y los pesos se ajustan después de cada lote.",
    paraQue: "Contar épocas permite seguir el aprendizaje y decidir cuándo parar.",
    comoSeLee:
      "En la curva de aprendizaje, el eje horizontal son las épocas. Si la curva de validación deja de mejorar mientras la de entrenamiento sigue mejorando, conviene detenerse.",
    enEsteProyecto:
      "Las redes entrenan hasta 30 épocas con lotes de 256 filas, es decir, 30 lotes por época sobre las 7.680 filas de ajuste. El MLP se detuvo en la época 25 y conservó la 20; la CNN usó las 30; la GRU de texto se detuvo en la 9 y conservó la 4.",
    capitulo: 6,
  },
  {
    id: "funcion_perdida",
    termino: "Función de pérdida",
    alias: ["función de pérdida", "funcion de perdida", "loss", "val_loss", "binary_crossentropy", "entropía cruzada"],
    categoria: "redes",
    corto: "Fórmula que mide qué tan equivocado está el modelo durante el entrenamiento; aprender es hacer que ese número baje.",
    queEs:
      "Es el marcador de errores del entrenamiento. En cada lote, el modelo compara sus probabilidades con las respuestas reales y la función de pérdida le pone un «castigo». La entropía cruzada binaria castiga mucho las respuestas muy seguras y equivocadas, como decir 0,99 de impago a quien sí pagó.",
    paraQue: "Guía el ajuste de los pesos: el algoritmo los mueve en la dirección que más reduce la pérdida.",
    comoSeLee:
      "En la curva de pérdida, más abajo es mejor. Si la pérdida de validación se aplana o sube mientras la de entrenamiento sigue bajando, empieza el sobreajuste.",
    enEsteProyecto:
      "Las redes usan entropía cruzada binaria con el optimizador Adam. En el MLP, la pérdida de entrenamiento baja de 0,71 a 0,46 y la de validación de 0,67 a 0,48, donde se aplana.",
    capitulo: 6,
  },
  {
    id: "early_stopping",
    termino: "Early stopping",
    alias: ["early stopping", "earlystopping", "restore_best_weights", "patience", "paciencia"],
    categoria: "redes",
    corto: "Regla que detiene el entrenamiento cuando el desempeño en validación deja de mejorar y recupera la mejor versión del modelo.",
    queEs:
      "Es como un entrenador que, al ver que el deportista ya no mejora después de varias sesiones, corta el entrenamiento para que no se lesione y se queda con la mejor marca registrada. La «paciencia» es cuántas épocas sin mejora se toleran antes de parar.",
    paraQue: "Evita el sobreajuste y ahorra tiempo de cómputo.",
    comoSeLee: "En las curvas de aprendizaje, la línea vertical punteada marca la mejor época: la versión que se conserva.",
    enEsteProyecto:
      "Vigila el AUC de validación con una paciencia de 5 épocas y restaura los mejores pesos. Detuvo el MLP en la época 25 (conservó la 20), el híbrido en la 21 (conservó la 16) y la GRU de texto en la 9 (conservó la 4).",
    capitulo: 6,
  },
  {
    id: "dropout",
    termino: "Dropout",
    alias: ["dropout"],
    categoria: "redes",
    corto: "Técnica que apaga al azar una parte de las neuronas en cada paso del entrenamiento para que la red no memorice.",
    queEs:
      "Imagine un equipo de fútbol en el que, en cada práctica, se sienta al azar a algunos jugadores: el resto aprende a jugar sin depender de una sola estrella. Con dropout, cada neurona aprende a ser útil por sí misma. Cuando la red ya entrenada se usa, todas las neuronas trabajan.",
    paraQue: "Reduce el sobreajuste de las redes neuronales; es una forma de regularización.",
    enEsteProyecto:
      "El MLP apaga el 30 % de las neuronas después de la primera capa y el 20 % después de la segunda; la CNN y la GRU usan 30 %. Por eso, en las primeras épocas, el AUC de entrenamiento puede quedar por debajo del de validación: se mide con el dropout activo.",
    capitulo: 6,
  },

  // ------------------------------------------------------------------ Lenguaje natural (NLP)
  {
    id: "nlp",
    termino: "Procesamiento de lenguaje natural (NLP)",
    alias: ["nlp", "procesamiento de lenguaje natural", "lenguaje natural"],
    categoria: "nlp",
    corto: "Rama de la inteligencia artificial que convierte el texto escrito por personas en números que un modelo puede usar.",
    queEs:
      "Las computadoras solo entienden números, y las personas escribimos palabras. El NLP (Natural Language Processing) es el puente: técnicas para limpiar, partir y representar texto como números, desde contar palabras hasta modelos como BERT o GPT, que capturan el sentido de las frases.",
    paraQue:
      "Permite aprovechar información escrita en texto libre: correos, reseñas, quejas o, como aquí, la descripción de una solicitud de crédito.",
    enEsteProyecto:
      "El capítulo 7 analiza el texto de la solicitud con cuatro enfoques: TF-IDF, sentimiento con BERT, sentence-transformers y GPT-2. Al sumarlo a los datos tabulares, el AUC cambia en +0,0012 (IC 95 % de −0,0003 a +0,0028): el texto no mejora lo que ya captura el modelo tabular, por eso la decisión usa el modelo tabular y el texto se ofrece aparte en /predict/text.",
    capitulo: 7,
  },
  {
    id: "tokenizacion",
    termino: "Tokenización",
    alias: ["tokenización", "tokenizacion", "tokens", "token", "tokenizer", "textvectorization"],
    categoria: "nlp",
    corto: "Partir un texto en piezas (palabras o fragmentos de palabra) llamadas tokens; es el primer paso para convertirlo en números.",
    queEs:
      "Es como separar una frase en fichas de rompecabezas. Según la técnica, cada ficha puede ser una palabra completa o un pedazo de palabra. Suele ir acompañada de limpieza: pasar a minúsculas, quitar tildes y quitar palabras vacías como «el» o «de» (stopwords).",
    paraQue:
      "Ningún modelo de texto trabaja con la frase entera: primero necesita sus piezas para contarlas o convertirlas en vectores.",
    comoSeLee:
      "Ejemplo real del proyecto: «Solicito este credito para invertir en mi negocio. Mis gastos han superado mis ingresos en los ultimos meses.» queda como invertir · negocio · gastos · superado · ingresos · ultimos · meses.",
    enEsteProyecto:
      "En el capítulo 6, TextVectorization arma un vocabulario de hasta 3.000 términos y lleva cada texto a 32 tokens (la mediana es de 19 palabras). En el capítulo 7, BERT y GPT-2 usan sus propios tokenizadores y los textos se recortan a 64 tokens.",
    capitulo: 6,
  },
  {
    id: "tfidf",
    termino: "TF-IDF",
    alias: ["tf-idf", "tfidf", "tfidfvectorizer"],
    categoria: "nlp",
    corto: "Convierte un texto en números dando más peso a las palabras frecuentes en ese texto pero raras en el resto.",
    queEs:
      "TF (term frequency) cuenta cuántas veces aparece una palabra en un texto; IDF (inverse document frequency) baja el peso de las que aparecen en casi todos. Es como un resaltador inteligente: no resalta «crédito», que está en todas las solicitudes, pero sí «atrasos», que distingue a algunas.",
    paraQue: "Es una forma rápida, barata y explicable de representar texto para un modelo.",
    comoSeLee:
      "Un peso alto indica una palabra característica de ese texto. Con una regresión logística encima, cada palabra recibe un coeficiente que dice si se asocia a más o a menos impago.",
    enEsteProyecto:
      "TF-IDF con palabras sueltas y pares de palabras (1-2 gramas) más regresión logística calibrada es el mejor modelo de solo texto: AUC 0,641 en prueba e inferencia de 0,21 ms por texto. Es el que sirve la API en /predict/text.",
    capitulo: 7,
  },
  {
    id: "embedding",
    termino: "Embedding",
    alias: ["embedding", "embeddings", "vector denso", "emb_st", "emb_gpt2"],
    categoria: "nlp",
    corto: "Representación de una palabra o de un texto como una lista de números, en la que textos de significado parecido quedan cerca.",
    queEs:
      "Imagine un mapa donde cada frase es un punto: las que hablan de deudas quedan en un barrio y las que hablan de estabilidad laboral, en otro. Un embedding son las coordenadas de ese punto, solo que en cientos de dimensiones en lugar de dos. Los modelos aprenden esas coordenadas leyendo enormes cantidades de texto.",
    paraQue:
      "Capturan significado y similitud, no solo palabras exactas: «perdí el empleo» y «quedé sin trabajo» quedan cerca.",
    comoSeLee:
      "Para verlos se proyectan a dos dimensiones, por ejemplo con PCA. Si en el plano se mezclan los puntos de pagos e impagos, la separación puede estar en otras dimensiones que el gráfico no muestra.",
    enEsteProyecto:
      "Sentence-transformers da vectores de 384 números y GPT-2, de 768. En la GRU del capítulo 6, el Embedding de 32 dimensiones se aprende con los textos de entrenamiento. El modelo combinado del capítulo 7 usa 10 componentes PCA de los vectores de sentence-transformers.",
    capitulo: 6,
  },
  {
    id: "bert",
    termino: "BERT",
    alias: ["bert", "bert-base-multilingual-uncased-sentiment", "nlptown/bert-base-multilingual-uncased-sentiment"],
    categoria: "nlp",
    corto: "Modelo de lenguaje de Google que lee cada frase en ambas direcciones para entender el contexto de cada palabra.",
    queEs:
      "BERT es un modelo preentrenado: ya «leyó» millones de textos y aprendió cómo se usan las palabras según su contexto («banco» de dinero frente a «banco» de parque). Luego se puede afinar para tareas concretas, como clasificar el tono de una reseña. Es un codificador (encoder): transforma el texto en una representación, no genera texto nuevo.",
    paraQue:
      "Permite aprovechar comprensión del lenguaje sin entrenar desde cero, con modelos gratuitos que corren en una computadora normal.",
    enEsteProyecto:
      "Se usa nlptown/bert-base-multilingual-uncased-sentiment, afinado con reseñas de productos para dar de 1 a 5 estrellas. Tarda 166,9 ms por texto en CPU. Con su sentimiento como entrada, una regresión logística obtiene AUC 0,5865 en prueba.",
    capitulo: 7,
  },
  {
    id: "gpt2",
    termino: "GPT-2",
    alias: ["gpt-2", "gpt2", "gpt", "datificate/gpt2-small-spanish"],
    categoria: "nlp",
    corto: "Modelo de lenguaje generativo que aprendió a predecir la siguiente palabra; aquí se usa para convertir textos en vectores.",
    queEs:
      "GPT-2 (de OpenAI, 2019) es un decodificador (decoder): se entrenó para adivinar la palabra que sigue en un texto, como el autocompletado del celular, pero mucho más potente. Al leer una frase, sus capas internas guardan una representación de su contenido que se puede extraer como vector.",
    paraQue:
      "Es la base de los asistentes de texto modernos; aquí sirve para comparar sus vectores con los de un modelo hecho para representar oraciones.",
    enEsteProyecto:
      "Se usa datificate/gpt2-small-spanish, promediando su último estado oculto (768 números por texto). Con una regresión logística encima obtiene AUC 0,6172 en validación cruzada y 0,6332 en prueba, por debajo de sentence-transformers, con el doble de dimensiones y unos 238 ms por texto.",
    capitulo: 7,
  },
  {
    id: "sentence_transformers",
    termino: "Sentence-transformers",
    alias: ["sentence-transformers", "sentence_transformers", "minilm", "paraphrase-multilingual-minilm-l12-v2"],
    categoria: "nlp",
    corto: "Modelos entrenados para convertir oraciones completas en vectores, de modo que las frases parecidas queden cerca.",
    queEs:
      "Son codificadores como BERT, pero entrenados con pares de frases para que dos oraciones con el mismo sentido den vectores casi iguales. Es como un bibliotecario que ordena los libros por tema y no por título: dos frases distintas que dicen lo mismo terminan en el mismo estante.",
    paraQue:
      "Son la opción práctica para buscar textos similares, agruparlos o usarlos como entrada de otro modelo.",
    enEsteProyecto:
      "Se usa paraphrase-multilingual-MiniLM-L12-v2 (vectores de 384 números, 85 ms por texto en CPU). Con regresión logística obtiene AUC 0,6357 en validación cruzada y 0,6407 en prueba, mejor que GPT-2; por eso sus vectores entran al modelo combinado del capítulo 7.",
    capitulo: 7,
  },
  {
    id: "sentimiento",
    termino: "Análisis de sentimiento",
    alias: ["análisis de sentimiento", "sentimiento", "sentiment", "sentiment analysis", "bert_estrellas"],
    categoria: "nlp",
    corto: "Técnica que estima si un texto tiene un tono positivo, neutro o negativo.",
    queEs:
      "Es lo que hace una persona al leer un mensaje y notar si quien escribe está contento o preocupado, pero hecho por un modelo. Suele expresarse como una clase (positivo o negativo) o como un puntaje, por ejemplo de 1 a 5 estrellas.",
    paraQue:
      "Se usa para medir la opinión en reseñas o redes sociales y, en crédito, para ver si el tono de la solicitud se relaciona con el riesgo.",
    comoSeLee:
      "Aquí, más estrellas = tono más positivo. Los niveles se forman redondeando el valor esperado de estrellas que da BERT.",
    enEsteProyecto:
      "Las solicitudes de tono más negativo (niveles 2 y 3) tienen entre 43 % y 44 % de impago, frente al 31,9 % del nivel 4, que reúne 6.662 de las 9.600 solicitudes de entrenamiento. Por sí solo, el puntaje ordena el riesgo con AUC 0,568, así que entra como complemento: /predict/text devuelve el sentimiento junto a la probabilidad del texto.",
    capitulo: 7,
  },

  // ------------------------------------------------------------------ Big data
  {
    id: "big_data",
    termino: "Big data",
    alias: ["big data", "data lake", "hadoop", "hdfs", "mapreduce", "yarn"],
    categoria: "bigdata",
    corto: "Volúmenes de datos tan grandes o tan rápidos que no caben, o no se procesan a tiempo, en una sola computadora.",
    queEs:
      "Cuando los datos no caben en una máquina, se reparten entre muchas que trabajan en paralelo, como una mudanza grande que se hace con varios camiones en lugar de uno. El ecosistema clásico es Hadoop: HDFS guarda los archivos repartidos, YARN asigna los recursos y MapReduce o Spark hacen los cálculos.",
    paraQue:
      "Permite analizar millones o miles de millones de registros, como todas las transacciones de un banco.",
    enEsteProyecto:
      "El capítulo 9 repite el flujo del proyecto con PySpark para mostrar que la solución escala sin reescribirse: el mismo código corre en un portátil (local[*]) o en un clúster. Se procesan las 12.144 filas del archivo y se guarda un Parquet particionado al estilo de un data lake.",
    capitulo: 9,
  },
  {
    id: "spark",
    termino: "Apache Spark",
    alias: ["spark", "apache spark", "sparksession", "spark sql", "createorreplacetempview"],
    categoria: "bigdata",
    corto: "Motor de cómputo distribuido que reparte el trabajo entre muchos núcleos o máquinas y guarda los resultados intermedios en memoria.",
    queEs:
      "Spark divide los datos en particiones y las procesa en paralelo. Sus transformaciones son «perezosas»: primero arma un plan completo y solo lo ejecuta cuando se le pide un resultado (una acción como count o write). Es como un jefe de cocina que organiza toda la comanda antes de encender los fogones.",
    paraQue:
      "Procesar datos masivos con la misma lógica de un DataFrame o de SQL y entrenar modelos sobre ellos.",
    enEsteProyecto:
      "Spark 4.2.0 corre en Docker con 8 núcleos (local[*]). Lee las 12.144 filas con un esquema explícito, quita duplicados (quedan 12.000), calcula tasas de impago por segmento con groupBy y Spark SQL, y puntúa las 12.000 solicitudes en 1,9 s.",
    capitulo: 9,
  },
  {
    id: "particion",
    termino: "Partición",
    alias: ["partitionby", "repartition", "getnumpartitions", "partitionfilters", "partition pruning", "parquet particionado"],
    categoria: "bigdata",
    corto: "Trozo de un conjunto de datos que Spark procesa por separado y en paralelo; en disco, una carpeta por cada valor de una columna.",
    queEs:
      "En memoria, una partición es un pedazo de la tabla que un núcleo procesa por su cuenta, como repartir un examen largo entre varios correctores. En disco, particionar por una columna crea una carpeta por cada valor; así, una consulta que filtra por ese valor abre solo su carpeta.",
    paraQue:
      "Permite trabajar en paralelo y leer solo lo necesario (poda de particiones), lo que ahorra tiempo y costo.",
    enEsteProyecto:
      "El Parquet del capítulo 9 se particiona por propósito del crédito: 6 carpetas, desde Libre inversión (3.388 filas) hasta Educación (1.193). Una consulta por Vivienda lee solo su carpeta y sus 1.707 filas.",
    capitulo: 9,
  },
  {
    id: "mllib",
    termino: "MLlib",
    alias: ["mllib", "pyspark.ml", "binaryclassificationevaluator", "vectorassembler", "stringindexer", "pipelinemodel"],
    categoria: "bigdata",
    corto: "Biblioteca de aprendizaje automático de Spark, que entrena modelos sobre datos repartidos en muchas máquinas.",
    queEs:
      "Es el equivalente de scikit-learn dentro de Spark: trae modelos, transformaciones y evaluadores que funcionan sobre datos distribuidos. Se organiza en un Pipeline de etapas, igual que en scikit-learn.",
    paraQue: "Entrenar y aplicar modelos cuando los datos no caben en una sola máquina.",
    enEsteProyecto:
      "El Pipeline de MLlib (recorte de extremos → imputación → StringIndexer → OneHotEncoder → VectorAssembler → StandardScaler → regresión logística) obtiene AUC 0,8441 en prueba, frente a 0,8459 de scikit-learn, con probabilidades casi idénticas (correlación 0,995). A este volumen scikit-learn entrena en 0,5 s y MLlib en 27,9 s, por eso el modelo servido sigue en scikit-learn.",
    capitulo: 9,
  },

  // ------------------------------------------------------------------ Despliegue
  {
    id: "api_rest",
    termino: "API REST",
    alias: ["api", "rest", "api rest", "restful"],
    categoria: "despliegue",
    corto: "Puerta de entrada que permite a otros programas usar el modelo por internet: envían datos y reciben respuestas con reglas fijas.",
    queEs:
      "Una API (interfaz de programación de aplicaciones) es como el mesero de un restaurante: usted no entra a la cocina, hace su pedido según la carta y recibe el plato. REST es un estilo de reglas para esas conversaciones: cada recurso tiene una dirección y se usan los verbos de HTTP (GET, POST) para pedir o enviar datos.",
    paraQue:
      "Permite que el sistema de un banco o una aplicación web consulten el modelo sin abrir un notebook ni saber Python.",
    enEsteProyecto:
      "La API está hecha con FastAPI (versión 2.0.0) y ofrece cinco endpoints: /predict, /predict/batch, /predict/text, /model/info y /health. Valida los datos de entrada con Pydantic y se empaqueta en Docker.",
    capitulo: 10,
  },
  {
    id: "endpoint",
    termino: "Endpoint",
    alias: ["endpoint", "endpoints", "/predict", "/predict/batch", "/predict/text", "/model/info", "/health"],
    categoria: "despliegue",
    corto: "Dirección concreta de una API que hace una tarea; por ejemplo, POST /predict recibe un cliente y devuelve su riesgo.",
    queEs:
      "Si la API es el restaurante, cada endpoint es una ventanilla con una función: una para pedidos, otra para consultar el menú y otra para saber si la cocina está abierta. Se identifica por un método (GET o POST) y una ruta.",
    paraQue: "Organiza lo que ofrece la API en operaciones claras y fáciles de probar.",
    comoSeLee: "«POST /predict» se lee: enviar (POST) datos a la ruta /predict.",
    enEsteProyecto:
      "/predict evalúa un cliente y devuelve probabilidad, decisión, banda y factores principales; /predict/batch evalúa varios a la vez; /predict/text, el texto de la solicitud; /model/info entrega la ficha del modelo, y /health dice si la API está activa. Por ejemplo, /predict devuelve 0,3315 y «revisar» para el cliente de riesgo medio.",
    capitulo: 10,
  },
  {
    id: "json",
    termino: "JSON",
    alias: ["json", ".json", "json.load", "json.dumps"],
    categoria: "despliegue",
    corto: "Formato de texto para intercambiar datos entre programas, con pares «nombre: valor» entre llaves.",
    queEs:
      "JSON (JavaScript Object Notation) es como un formulario escrito en texto plano que cualquier programa sabe leer: cada dato lleva su nombre y su valor. Ejemplo: {\"decision\": \"revisar\", \"banda_riesgo\": \"Medio\"}. Las llaves agrupan campos y los corchetes forman listas.",
    paraQue: "Es el idioma común de las APIs y una forma sencilla de guardar resultados y configuraciones.",
    comoSeLee:
      "Lea cada par como «campo: valor». Tenga en cuenta que en JSON los decimales se escriben con punto (0.3315), no con coma.",
    enEsteProyecto:
      "La API recibe y responde en JSON, y los resultados de cada capítulo se guardan en archivos JSON como model_card.json o resultados_clasicos.json. Desde el capítulo 1, la tabla de variables sensibles se guarda en variables_sensibles.json.",
    capitulo: 1,
  },
  {
    id: "http",
    termino: "Petición HTTP (GET, POST) y código de estado",
    alias: ["http", "https", "petición http", "código de estado", "status_code", "requests.post", "curl", "post /predict", "get /health"],
    categoria: "despliegue",
    corto: "Protocolo con el que se comunican navegadores y APIs: se envía una petición (GET, POST) y se recibe una respuesta con un código de estado.",
    queEs:
      "Es el idioma de la web. GET sirve para pedir información (como mirar la carta) y POST para enviar datos y que se procesen (como entregar el pedido). Cada respuesta trae un código de tres cifras que resume qué pasó.",
    paraQue:
      "Es la forma estándar en que un sistema le habla a una API, ya sea desde un navegador, un programa o la terminal.",
    comoSeLee:
      "200 = todo bien; 422 = los datos enviados no son válidos; 404 = la ruta no existe; 500 = falló el servidor. Los códigos que empiezan por 2 indican éxito; por 4, un error de quien pide, y por 5, un error del servidor.",
    enEsteProyecto:
      "GET /health responde 200 con {\"status\": \"ok\"}. Un POST /predict con edad 999 y propósito «Viajes» responde 422 y explica cada campo inválido. Dentro de Docker, un POST /predict respondió 200 en 519,3 ms.",
    capitulo: 10,
  },
  {
    id: "docker",
    termino: "Docker",
    alias: ["docker", "dockerfile", "docker compose", "docker-compose", "docker-compose.yml"],
    categoria: "despliegue",
    corto: "Herramienta que empaqueta un programa con todo lo que necesita para que funcione igual en cualquier computadora.",
    queEs:
      "Es como un contenedor de barco: no importa qué lleve adentro ni a qué puerto llegue, siempre se carga y se descarga igual. Docker mete el código, Python, las librerías y el modelo en un paquete estándar, y así se evita el clásico «en mi computadora sí funciona».",
    paraQue: "Desplegar de forma reproducible en un servidor o en la nube y aislar el programa del resto del sistema.",
    enEsteProyecto:
      "La API se empaqueta en la imagen riesgo-credito-api:2.0.0 (653 MB), basada en python:3.10-slim, con un usuario sin privilegios y una verificación de salud sobre /health. En el capítulo 9, Spark también corre en Docker.",
    capitulo: 9,
  },
  {
    id: "contenedor",
    termino: "Imagen y contenedor",
    alias: ["contenedor", "container", "imagen docker", "docker images", "healthcheck"],
    categoria: "despliegue",
    corto: "La imagen es el paquete congelado con el programa; el contenedor es esa imagen en marcha. De una imagen pueden correr muchos contenedores.",
    queEs:
      "La imagen es como el molde de una torta: fijo y reutilizable. El contenedor es cada torta horneada con ese molde. La imagen no cambia; los contenedores se encienden, se apagan y se pueden repetir cuantas veces se quiera.",
    paraQue:
      "Separa el paquete (que se versiona y se comparte) de su ejecución (que se puede escalar, reiniciar o borrar sin perder nada).",
    comoSeLee:
      "El estado de salud de un contenedor pasa de «starting» (arrancando) a «healthy» (sano) cuando responde bien a su verificación.",
    enEsteProyecto:
      "Con docker compose up, el contenedor back-api-1 arranca desde la imagen riesgo-credito-api:2.0.0 y pasa de «starting» a «healthy» cuando /health responde. En el capítulo 9, Spark corre dentro del contenedor oficial pyspark-notebook.",
    capitulo: 9,
  },

  // ------------------------------------------------------------------ Negocio y ética
  {
    id: "lgd",
    termino: "LGD (pérdida dada el impago)",
    alias: ["lgd", "loss given default", "pérdida dado el impago", "lgd_fn", "c_fn"],
    categoria: "negocio",
    corto: "Fracción del crédito que el banco pierde cuando el cliente no paga, después de recuperar lo que pueda.",
    queEs:
      "Si el banco presta 100 y el cliente deja de pagar, suele recuperar una parte (con cobranza o garantías). Lo que no recupera es la LGD (Loss Given Default). Una LGD de 0,45 significa perder 45 de cada 100 prestados.",
    paraQue:
      "Junto con la probabilidad de impago y el monto prestado, permite calcular la pérdida esperada de un crédito.",
    enEsteProyecto:
      "Se usa LGD = 0,45, valor de referencia de Basilea (enfoque F-IRB). Es el costo de aprobar a quien no paga: tres veces el margen que se pierde al rechazar a un buen pagador (0,15). Con una LGD más alta el umbral de aprobación baja: con 0,75 pasa de 0,1778 a 0,1067.",
    capitulo: 1,
  },
  {
    id: "costo_error",
    termino: "Costo de los errores",
    alias: ["costo de los errores", "costo esperado", "costo_medio", "c_fp", "c_r", "margen_fp"],
    categoria: "negocio",
    corto: "Lo que cuesta cada tipo de equivocación del modelo; en crédito, aprobar a quien no paga no cuesta lo mismo que rechazar a quien sí paga.",
    queEs:
      "No todos los errores pesan igual. Piense en un detector de humo: una falsa alarma molesta, pero no sonar en un incendio es grave. En crédito, el falso negativo (aprobar a quien no paga) pierde dinero prestado y el falso positivo (rechazar a un buen pagador) pierde el margen y deja a una persona sin crédito.",
    paraQue:
      "Permite elegir umbrales que minimicen el costo total esperado, en lugar de maximizar solo los aciertos.",
    comoSeLee:
      "Los costos se expresan por unidad de exposición: 0,45 es perder el 45 % de lo prestado. El costo medio por solicitud resume la política: menor es mejor.",
    enEsteProyecto:
      "Costos por unidad de exposición: falso negativo 0,45 (LGD), falso positivo 0,15 (margen) y revisión manual 0,08. En prueba, la política de tres acciones cuesta 0,0537 por solicitud y ahorra un 6,1 % frente a la de dos acciones con umbral 0,25.",
    capitulo: 1,
  },
  {
    id: "regla_chow",
    termino: "Regla de Chow (aprobar, revisar, rechazar)",
    alias: ["regla de chow", "chow", "umbrales_chow"],
    categoria: "negocio",
    corto: "Política que, según la probabilidad de impago y los costos, decide aprobar, enviar a revisión manual o rechazar.",
    queEs:
      "En lugar de forzar un sí o un no, la regla de Chow admite una tercera opción: «no estoy seguro, que lo mire una persona». Para cada probabilidad elige la acción más barata: aprobar si el riesgo es bajo, rechazar si es alto y revisar en la zona intermedia, donde equivocarse costaría más que la revisión.",
    paraQue: "Reduce el costo total y pone a un analista justo donde el modelo tiene más dudas.",
    comoSeLee:
      "Aprobar si p < C_R / C_FN; rechazar si p > 1 − C_R / C_FP; revisar en medio. Con los costos del proyecto: 0,08 / 0,45 = 0,1778 y 1 − 0,08 / 0,15 = 0,4667.",
    enEsteProyecto:
      "En prueba se aprueba automáticamente el 39,7 %, se revisa el 28,8 % (por debajo de la capacidad de revisión del 35 %) y se rechaza el 31,5 %. Entre los aprobados el impago baja al 9,8 %, frente al 35,6 % de toda la cartera.",
    capitulo: 1,
  },
  {
    id: "banda_riesgo",
    termino: "Banda de riesgo",
    alias: ["banda de riesgo", "banda_riesgo", "bandas_riesgo", "banda"],
    categoria: "negocio",
    corto: "Categoría de riesgo (Bajo, Medio o Alto) en la que cae un cliente según su probabilidad de impago.",
    queEs:
      "Es como un semáforo: en lugar de un número con decimales, el cliente queda en verde, amarillo o rojo. Las bandas facilitan comunicar el riesgo a personas que no trabajan con probabilidades.",
    paraQue:
      "Simplifica reportes, tableros y reglas de negocio, y conecta el riesgo con una acción concreta.",
    comoSeLee:
      "Bajo: p < 0,1778 → aprobar. Medio: de 0,1778 a 0,4667 → revisar. Alto: p > 0,4667 → rechazar.",
    enEsteProyecto:
      "Las bandas coinciden con las acciones de la regla de Chow por construcción. La API devuelve el campo banda_riesgo, y los tres clientes de demostración quedan en Bajo, Medio y Alto.",
    capitulo: 1,
  },
  {
    id: "disparate_impact",
    termino: "Disparate impact (regla 4/5)",
    alias: ["disparate impact", "disparate_impact", "di", "regla 4/5", "regla de las 4/5", "di_sexo", "di_edad"],
    categoria: "negocio",
    corto: "Cociente entre la tasa de aprobación del grupo menos favorecido y la del más favorecido; si es menor que 0,8, se enciende una alerta.",
    queEs:
      "Mide si una decisión favorece a un grupo sobre otro. Si a un grupo se le aprueba el 40 % de las veces y a otro el 50 %, el DI es 0,40 / 0,50 = 0,8. La regla de las 4/5 viene de las guías de empleo de EE. UU. (EEOC) y aquí se usa como alerta de equidad.",
    paraQue:
      "Permite detectar y documentar posibles discriminaciones en un modelo que decide sobre personas.",
    comoSeLee:
      "1 = igualdad perfecta; ≥ 0,8 cumple la regla 4/5; < 0,8 es una alerta que obliga a revisar el modelo.",
    enEsteProyecto:
      "Se mide sobre la aprobación automática en prueba. Por sexo, DI 0,970 (39,1 % de aprobación en mujeres frente a 40,3 % en hombres); por edad, DI 0,896 (37,3 % en 18-29 años frente a 41,7 % en 60 o más). Ambos cumplen la regla de las 4/5.",
    capitulo: 1,
  },
  {
    id: "reweighing",
    termino: "Reweighing",
    alias: ["reweighing", "kamiran-calders", "kamiran y calders", "pesos_kamiran_calders"],
    categoria: "negocio",
    corto: "Técnica de equidad que da distinto peso a los ejemplos de entrenamiento para que el grupo y el resultado queden independientes.",
    queEs:
      "Si en los datos de entrenamiento los jóvenes aparecen más asociados al impago, el modelo aprende esa asociación. Reweighing (Kamiran y Calders) equilibra la balanza: da más peso a las combinaciones de grupo y resultado poco representadas y menos a las sobrerrepresentadas. No cambia los datos ni usa umbrales distintos por grupo.",
    paraQue: "Reducir la disparidad de un modelo sin tratar distinto a nadie en el momento de decidir.",
    comoSeLee:
      "El peso de cada ejemplo es P(grupo) × P(resultado) / P(grupo y resultado): vale más de 1 en las combinaciones escasas y menos de 1 en las frecuentes.",
    enEsteProyecto:
      "Quitar la edad no corrigió la disparidad (DI por edad de 0,72 a 0,71), porque viaja por otras variables. El reweighing por grupo de edad la llevó a 0,89 con un costo de +0,6 %, y por eso es la variante servida; en prueba el DI por edad es 0,896.",
    capitulo: 8,
  },
  {
    id: "variable_sensible",
    termino: "Variable sensible",
    alias: ["variable sensible", "variables sensibles", "variables_sensibles", "atributo protegido", "sensitive_col"],
    categoria: "negocio",
    corto: "Dato personal que podría llevar a discriminar (como el sexo o la edad) y que exige un cuidado especial en un modelo.",
    queEs:
      "Son características de una persona que no deberían ser motivo de un trato desfavorable, como el sexo, la edad o el estado civil. También hay variables «proxy»: datos en apariencia neutros que pueden delatar a una sensible, como el número de personas a cargo.",
    paraQue:
      "Identificarlas permite decidir cuáles se excluyen, cuáles se vigilan y cómo se audita el modelo, en línea con la Ley 1581 de 2012 de protección de datos personales.",
    enEsteProyecto:
      "El sexo nunca entra al modelo: solo se usa para auditar. La edad entra y se audita; el estado civil se vigila; personas a cargo y tipo de vivienda se vigilan como posibles proxies, y el texto libre no forma parte del modelo servido.",
    capitulo: 1,
  },
  {
    id: "psi",
    termino: "PSI (índice de estabilidad)",
    alias: ["psi", "population stability index", "índice de estabilidad", "psi_variables", "psi_puntaje_train_test"],
    categoria: "negocio",
    corto: "Mide cuánto cambió la distribución de una variable o del puntaje entre dos momentos; si cambia mucho, el modelo se revisa.",
    queEs:
      "Compara la «foto» de la población con la que se entrenó el modelo con la de hoy. Se reparte la variable en tramos y se suma, tramo a tramo, cuánto cambió el porcentaje de clientes. Es como revisar si los clientes que llegan hoy se parecen a los que el modelo conoció.",
    paraQue: "Es la alarma del monitoreo: avisa cuándo recalibrar o reentrenar un modelo en producción.",
    comoSeLee: "< 0,10: estable; de 0,10 a 0,25: vigilar; ≥ 0,25: recalibrar.",
    enEsteProyecto:
      "Entre entrenamiento y prueba, el PSI del puntaje es 0,003 y el de cada variable no pasa de 0,0084: la población es estable. En operación, la misma medida se calcula cada mes.",
    capitulo: 8,
  },
  {
    id: "champion_challenger",
    termino: "Champion–challenger",
    alias: ["champion–challenger", "champion-challenger", "champion", "challenger"],
    categoria: "negocio",
    corto: "Forma segura de cambiar de modelo: el nuevo (challenger) corre en paralelo con el vigente (champion) y solo lo reemplaza si demuestra ser mejor.",
    queEs:
      "Es como un torneo de boxeo: el campeón conserva el título hasta que un retador le gana en el ring. El modelo retador recibe los mismos casos que el vigente, pero sus respuestas solo se registran, no deciden. Si con el tiempo resulta mejor, se promueve.",
    paraQue: "Evita reemplazar un modelo que funciona por otro que solo parecía mejor en el laboratorio.",
    enEsteProyecto:
      "El plan de operación establece que cada nueva versión se evalúa así y se promueve solo si baja el costo esperado sin empeorar la equidad ni la calibración. Cada promoción sube la versión del modelo y queda registrada en la model card.",
    capitulo: 8,
  },
];

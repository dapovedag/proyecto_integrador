/**
 * «¿Cómo leer este gráfico?»: una explicación por tipo de figura (y variantes por prefijo de `clave`) para un
 * principiante total. Se muestra como desplegable en cada figura nativa (charts/Figura.tsx), en capítulos y notebooks.
 */
import type { FiguraSpec } from "@/data/tipos";

export interface ComoLeer {
  /** Nombre del tipo de gráfico. */
  nombre: string;
  /** Qué muestra este tipo de gráfico, en una o dos frases. */
  queEs: string;
  /** Pasos para leerlo. */
  pasos: string[];
  /** Una advertencia o truco de lectura. */
  ojo?: string;
  /** Id del glosario relacionado. */
  concepto?: string;
}

const BASE: Record<string, ComoLeer> = {
  barras: {
    nombre: "Gráfico de barras",
    queEs: "Compara un número entre varias categorías: cada barra es una categoría y su altura es el valor.",
    pasos: [
      "Lea el eje horizontal para saber qué categorías se comparan.",
      "Lea el eje vertical para saber qué se mide y en qué unidad.",
      "Compare las alturas: la barra más alta es la categoría con el valor mayor.",
    ],
    ojo: "Fíjese en dónde empieza el eje vertical: si no empieza en cero, las diferencias se ven más grandes de lo que son.",
  },
  barras_h: {
    nombre: "Barras horizontales (ranking)",
    queEs: "Ordena elementos de mayor a menor según un valor. Se dibuja en horizontal para que los nombres largos se lean bien.",
    pasos: [
      "Cada fila es un elemento (una variable, un modelo, un grupo).",
      "La longitud de la barra es el valor: más larga, mayor valor.",
      "Lea de arriba hacia abajo: arriba están los que más pesan.",
    ],
  },
  histograma: {
    nombre: "Histograma",
    queEs: "Muestra cómo se reparten los valores de una variable numérica: agrupa los valores en intervalos (cajones) y cuenta cuántos clientes caen en cada uno.",
    pasos: [
      "El eje horizontal son los valores de la variable, partidos en intervalos de igual ancho.",
      "La altura de cada barra es cuántos clientes (o qué proporción) tienen un valor en ese intervalo.",
      "Busque dónde está la «montaña»: ahí se concentran la mayoría de los clientes.",
      "Mire las colas: si una se alarga mucho hacia un lado, hay pocos clientes con valores extremos (posibles atípicos).",
    ],
    ojo: "Si hay dos colores (pagó / no pagó), compare dónde se ubica cada montaña: si se separan, la variable ayuda a distinguir el riesgo.",
    concepto: "histograma",
  },
  boxplot: {
    nombre: "Diagrama de caja (boxplot)",
    queEs: "Resume una variable numérica en cinco números: mínimo razonable, primer cuartil, mediana, tercer cuartil y máximo razonable. Sirve para comparar grupos y ver atípicos.",
    pasos: [
      "La línea dentro de la caja es la mediana: la mitad de los clientes está por debajo y la otra mitad por encima.",
      "La caja va del cuartil 1 al cuartil 3: ahí está el 50 % central de los clientes. Una caja más alta significa más variación.",
      "Los bigotes llegan hasta 1,5 veces el alto de la caja; los puntos sueltos fuera de ellos son valores atípicos.",
      "Compare las cajas entre grupos (por ejemplo, pagó frente a no pagó): si las medianas están a alturas distintas, la variable se asocia con el riesgo.",
    ],
    concepto: "boxplot",
  },
  dispersion: {
    nombre: "Gráfico de dispersión",
    queEs: "Cruza dos variables numéricas: cada punto es un cliente, ubicado según su valor en cada eje.",
    pasos: [
      "Lea qué variable está en cada eje.",
      "Busque una tendencia: si los puntos suben de izquierda a derecha, las dos variables crecen juntas; si bajan, una crece cuando la otra baja.",
      "Si los puntos tienen color (pagó / no pagó), mire si cada color ocupa una zona distinta.",
    ],
    ojo: "Que dos variables se muevan juntas no significa que una cause la otra.",
    concepto: "dispersion",
  },
  heatmap: {
    nombre: "Mapa de calor",
    queEs: "Una tabla en la que el color reemplaza al número: cada celda cruza una fila con una columna y su color indica el valor.",
    pasos: [
      "Lea qué representan las filas y las columnas.",
      "Mire la escala de color: indica qué color corresponde a valores altos y cuál a bajos.",
      "Busque las celdas más intensas: son las combinaciones con valores extremos.",
    ],
    concepto: "heatmap",
  },
  lineas: {
    nombre: "Gráfico de líneas",
    queEs: "Muestra cómo cambia un valor a lo largo de algo ordenado (tiempo, épocas, umbrales, número de componentes).",
    pasos: [
      "Lea qué está en el eje horizontal: es lo que avanza.",
      "Siga cada línea de izquierda a derecha: si sube, el valor aumenta; si baja, disminuye.",
      "Si hay varias líneas, compárelas en el mismo punto del eje horizontal.",
    ],
  },
  area: {
    nombre: "Gráfico de área",
    queEs: "Como un gráfico de líneas, pero con el espacio bajo la línea relleno: resalta cuánto se acumula o cómo se reparte un total a lo largo del eje.",
    pasos: [
      "Lea qué avanza en el eje horizontal y qué se mide en el vertical.",
      "La altura de la zona coloreada es el valor en cada punto.",
      "Si hay varias áreas apiladas, cada franja es una parte del total.",
    ],
  },
  curva_roc: {
    nombre: "Curva ROC",
    queEs: "Muestra qué tan bien un modelo separa a quienes pagan de quienes no, probando todos los umbrales posibles.",
    pasos: [
      "El eje horizontal es la tasa de falsos positivos: buenos pagadores marcados por error como riesgosos.",
      "El eje vertical es la tasa de verdaderos positivos: impagos detectados correctamente.",
      "La diagonal es el azar (lanzar una moneda). Cuanto más se aleja la curva hacia la esquina superior izquierda, mejor.",
      "El AUC es el área bajo la curva: 0,5 es azar y 1 es perfecto. El modelo final tiene 0,846 en test.",
    ],
    ojo: "AUC 0,846 se lee así: si se toman al azar un cliente que no pagó y uno que sí pagó, el modelo le da más riesgo al que no pagó el 84,6 % de las veces.",
    concepto: "roc_auc",
  },
  curva_pr: {
    nombre: "Curva precisión-recall",
    queEs: "Muestra el equilibrio entre detectar muchos impagos (recall) y que los detectados sean de verdad impagos (precisión).",
    pasos: [
      "El eje horizontal es el recall: qué parte de los impagos reales se detecta.",
      "El eje vertical es la precisión: de los marcados como riesgosos, qué parte de verdad no pagó.",
      "Una curva más alta y más a la derecha es mejor. La línea de referencia es la tasa de impago (35,6 %).",
    ],
    concepto: "pr_auc",
  },
  matriz_confusion: {
    nombre: "Matriz de confusión",
    queEs: "Una tabla de 2 × 2 que cuenta aciertos y errores del modelo con un umbral dado.",
    pasos: [
      "Las filas son lo que pasó en realidad (pagó / no pagó); las columnas, lo que predijo el modelo.",
      "La diagonal son los aciertos: buenos pagadores reconocidos e impagos detectados.",
      "Fuera de la diagonal están los dos errores: aprobar a quien no paga (el más caro) y rechazar a quien sí paga.",
    ],
    ojo: "Cada error tiene un costo distinto: por eso la decisión final usa costos y no solo el número de aciertos.",
    concepto: "matriz_confusion",
  },
  calibracion: {
    nombre: "Curva de calibración",
    queEs: "Comprueba si las probabilidades del modelo son honestas: si dice 30 %, ¿de verdad no paga cerca del 30 % de esos clientes?",
    pasos: [
      "Los clientes se agrupan por la probabilidad que les dio el modelo (eje horizontal).",
      "El eje vertical es la tasa de impago real de cada grupo.",
      "La diagonal es la calibración perfecta. Cuanto más cerca de ella estén los puntos, más confiable es la probabilidad.",
    ],
    concepto: "calibracion",
  },
  dona: {
    nombre: "Gráfico de dona",
    queEs: "Reparte un total en partes: cada sector es una proporción del 100 %.",
    pasos: ["Cada color es una categoría.", "El tamaño del sector es su porcentaje del total.", "Los porcentajes suman 100 %."],
  },
  kpi: {
    nombre: "Indicadores",
    queEs: "Cifras clave puestas en grande para leerlas de un vistazo.",
    pasos: ["Cada recuadro es una medida con su nombre.", "La nota bajo la cifra explica cómo interpretarla."],
  },
  tabla: {
    nombre: "Tabla",
    queEs: "Los datos exactos en filas y columnas.",
    pasos: ["Lea los encabezados para saber qué contiene cada columna.", "Cada fila es un elemento (un grupo, un modelo, una variable)."],
  },
};

/** Variantes por tipo + prefijo de `clave` (el prefijo más largo que coincida gana). */
const VARIANTES: Record<string, Record<string, Partial<ComoLeer>>> = {
  barras: {
    impago: {
      nombre: "Tasa de impago por categoría",
      queEs: "Cada barra es un grupo de clientes (por ejemplo, un tipo de vivienda) y su altura es el porcentaje de ese grupo que no pagó.",
      pasos: [
        "Compare cada barra con la tasa promedio del 35,6 %: si está por encima, ese grupo es más riesgoso que el promedio.",
        "Mire cuántos clientes tiene cada grupo cuando se indique: un porcentaje sobre muy pocos clientes es menos confiable.",
        "Las diferencias grandes entre barras indican que la variable ayuda a predecir el impago.",
      ],
      concepto: "prevalencia",
    },
  },
  barras_h: {
    coeficientes: {
      nombre: "Coeficientes del modelo",
      queEs: "Cuánto empuja cada variable la probabilidad de impago en la regresión logística, con las variables en la misma escala.",
      pasos: [
        "Las barras hacia la derecha (positivas) aumentan el riesgo; hacia la izquierda (negativas), lo reducen.",
        "Cuanto más larga la barra, más fuerte el efecto.",
        "Como todas las variables se estandarizaron, las longitudes son comparables entre sí.",
      ],
      concepto: "coeficiente",
    },
    permutacion: {
      nombre: "Importancia por permutación",
      queEs: "Cuánto empeora el modelo si se desordena al azar una variable: si empeora mucho, esa variable era importante.",
      pasos: ["Cada barra es una variable.", "Más larga = el modelo pierde más AUC sin ella = más importante.", "Las barras cercanas a cero casi no aportan."],
      concepto: "importancia_variables",
    },
    shap: {
      nombre: "Contribuciones (SHAP)",
      queEs: "Para un cliente o en promedio, cuánto aporta cada variable a subir o bajar el riesgo frente a un cliente típico.",
      pasos: ["Hacia la derecha: la variable sube el riesgo; hacia la izquierda: lo baja.", "La suma de todas las barras lleva del cliente típico a la predicción final."],
      ojo: "Explica cómo decide el modelo, no causas del mundo real.",
      concepto: "shap",
    },
    caso: {
      nombre: "Explicación de un cliente",
      queEs: "Por qué el modelo le dio a este cliente su probabilidad: qué variables la subieron y cuáles la bajaron.",
      pasos: ["Barras hacia la derecha suben el riesgo; hacia la izquierda lo bajan.", "Las barras más largas son las razones principales de la decisión."],
      concepto: "shap",
    },
    psi: {
      nombre: "Estabilidad de las variables (PSI)",
      queEs: "Mide si cada variable cambió su distribución entre dos momentos (aquí, entre entrenamiento y prueba).",
      pasos: ["Menos de 0,1: estable.", "Entre 0,1 y 0,25: vigilar.", "Más de 0,25: la población cambió y conviene recalibrar."],
      concepto: "psi",
    },
    v: {
      nombre: "V de Cramér",
      queEs: "Mide la fuerza de la relación entre una variable categórica y el impago, de 0 (ninguna) a 1 (total).",
      pasos: ["Cada barra es una variable categórica.", "Más larga = más relacionada con el impago."],
      concepto: "cramer",
    },
    correlacion: {
      nombre: "Correlación con el impago",
      queEs: "Qué tan fuerte y en qué sentido se mueve cada variable numérica junto con el impago.",
      pasos: ["Positiva: cuando la variable sube, el impago tiende a subir.", "Negativa: cuando sube, el impago tiende a bajar.", "Cerca de 0: casi no hay relación lineal."],
      concepto: "correlacion",
    },
    seleccion: {
      nombre: "Ranking de variables",
      queEs: "Ordena las variables según cuánta información aportan para predecir el impago.",
      pasos: ["Arriba están las más útiles.", "Las de abajo aportan poco y son candidatas a revisarse."],
      concepto: "informacion_mutua",
    },
    terminos: {
      nombre: "Palabras más asociadas",
      queEs: "Las palabras del texto de la solicitud que más se asocian con pagar o con no pagar, según el modelo de texto.",
      pasos: ["Cada barra es una palabra o expresión.", "Más larga = más asociada con ese resultado."],
      concepto: "tfidf",
    },
    impago: {
      nombre: "Tasa de impago por categoría",
      queEs: "Cada barra es un grupo de clientes y su longitud es el porcentaje que no pagó.",
      pasos: ["Compare con el promedio del 35,6 %.", "Los grupos por encima del promedio son más riesgosos."],
      concepto: "prevalencia",
    },
    auc: {
      nombre: "Comparación de modelos (AUC)",
      queEs: "El AUC de cada modelo: qué tan bien separa a quienes pagan de quienes no.",
      pasos: ["0,5 es azar y 1 es perfecto.", "Diferencias de centésimas son pequeñas: con resultados parecidos se prefiere el modelo más simple."],
      concepto: "roc_auc",
    },
  },
  histograma: {
    escalado: {
      nombre: "Antes y después de escalar",
      queEs: "La misma variable antes y después de cambiarle la escala. La forma de la distribución no cambia; solo cambian los números del eje.",
      pasos: ["Compare la forma de ambos histogramas: debería ser la misma.", "Mire el eje horizontal: tras estandarizar queda centrado en 0; tras normalizar queda entre 0 y 1."],
      concepto: "escalado",
    },
    capping: {
      nombre: "Antes y después del capping",
      queEs: "La variable antes y después de recortar los valores extremos a los percentiles 1 y 99.",
      pasos: ["Compare las colas: después del capping ya no hay valores muy alejados.", "La parte central casi no cambia: solo se acotan los extremos."],
      concepto: "capping",
    },
    delta: {
      nombre: "Distribución por bootstrap",
      queEs: "Repite la comparación muchas veces sobre remuestras de los datos para ver cuánto varía el resultado.",
      pasos: ["Cada barra cuenta cuántas repeticiones dieron ese valor.", "Si el 0 queda dentro de la zona central, la diferencia no se distingue del azar."],
      concepto: "bootstrap",
    },
  },
  lineas: {
    aprendizaje: {
      nombre: "Curva de aprendizaje",
      queEs: "Cómo cambia el error de la red neuronal en cada época (cada pasada completa por los datos de entrenamiento).",
      pasos: [
        "El eje horizontal son las épocas; el vertical, la pérdida (error): más bajo es mejor.",
        "La línea de entrenamiento casi siempre baja.",
        "Mire la de validación: si empieza a subir mientras la de entrenamiento sigue bajando, el modelo está memorizando (sobreajuste). Ahí actúa el early stopping.",
      ],
      concepto: "epoca",
    },
    pca: {
      nombre: "Varianza explicada (PCA)",
      queEs: "Cuánta información de los datos conservan los primeros componentes principales.",
      pasos: ["El eje horizontal es el número de componentes.", "El vertical es el porcentaje de varianza acumulada.", "Busque el punto donde la curva se aplana: agregar más componentes ya aporta poco."],
      concepto: "pca",
    },
    costo: {
      nombre: "Costo esperado según el umbral",
      queEs: "Cuánto cuesta en promedio cada decisión según la probabilidad de impago del cliente.",
      pasos: ["Cada línea es una acción: aprobar, revisar o rechazar.", "Para cada probabilidad, la acción más barata es la línea más baja.", "Los cruces entre líneas son los umbrales de la política."],
      concepto: "regla_chow",
    },
    curva: {
      nombre: "Costo esperado según el umbral",
      queEs: "Cómo cambia el costo promedio al mover el umbral de decisión.",
      pasos: ["El punto más bajo de la curva es el umbral más conveniente.", "Las zonas planas indican que mover un poco el umbral casi no cambia el costo."],
      concepto: "umbral",
    },
  },
  dispersion: {
    pca: {
      nombre: "Proyección PCA",
      queEs: "Cada punto es un cliente ubicado según sus dos primeros componentes principales: un resumen en 2 dimensiones de todas sus variables.",
      pasos: ["Los ejes no son variables originales: son combinaciones de ellas.", "Si los colores (pagó / no pagó) se mezclan, el impago no se separa en dos ejes: por eso hace falta un modelo."],
      concepto: "pca",
    },
  },
  heatmap: {
    sns: {
      nombre: "Mapa de correlaciones",
      queEs: "Cada celda es la correlación entre dos variables, de −1 a 1.",
      pasos: ["Colores intensos de un lado: relación positiva fuerte; del otro: negativa fuerte.", "La diagonal siempre vale 1 (cada variable consigo misma).", "Busque pares muy correlacionados: dicen casi lo mismo."],
      concepto: "correlacion",
    },
    segmentos: {
      nombre: "Tasa de impago por segmento",
      queEs: "Cada celda cruza dos características (por ejemplo, rango de edad y nivel de buró) y su color es la tasa de impago de esos clientes.",
      pasos: ["Busque las celdas más intensas: son los segmentos más riesgosos.", "Recorra una fila o columna para ver cómo cambia el riesgo al cambiar una sola característica."],
      concepto: "prevalencia",
    },
    pca: {
      nombre: "Cargas del PCA",
      queEs: "Cuánto pesa cada variable original en cada componente principal.",
      pasos: ["Cada fila es un componente y cada columna una variable (o al revés).", "Colores intensos indican que esa variable define ese componente."],
      concepto: "pca",
    },
  },
  boxplot: {
    sns: {
      nombre: "Diagrama de violín",
      queEs: "Como un boxplot, pero el ancho muestra cuántos clientes hay en cada valor: más ancho, más clientes.",
      pasos: ["Compare la forma y la altura de cada violín entre grupos.", "La parte más ancha es donde se concentra la mayoría."],
      concepto: "boxplot",
    },
    capping: {
      nombre: "Atípicos antes y después del capping",
      queEs: "La misma variable antes y después de recortar los extremos.",
      pasos: ["Antes: puntos sueltos lejos de la caja (atípicos).", "Después: los extremos quedan acotados y la caja casi no cambia."],
      concepto: "capping",
    },
  },
};

export function comoLeerFigura(spec: Pick<FiguraSpec, "tipo"> & { clave?: string }): ComoLeer | null {
  const base = BASE[spec.tipo];
  if (!base) return null;
  const variantes = VARIANTES[spec.tipo];
  if (variantes && spec.clave) {
    const pref = Object.keys(variantes)
      .filter((p) => spec.clave!.startsWith(`${p}_`) || spec.clave === p)
      .sort((a, b) => b.length - a.length)[0];
    if (pref) return { ...base, ...variantes[pref] } as ComoLeer;
  }
  return base;
}

export const TIPOS_CON_GUIA = Object.keys(BASE);

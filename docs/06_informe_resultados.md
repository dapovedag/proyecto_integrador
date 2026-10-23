# 06 · Informe de resultados: riesgo de crédito (modelo v2.0.0)

> Resumen ejecutivo para un público no técnico. Todas las cifras vienen de `Back/models/model_card.json` (corrida del
> 2026-10-23) y de los notebooks ejecutados. Los detalles técnicos están en el notebook final
> (`Back/notebooks/00_proyecto_integrador_final.ipynb`) y en el sitio del proyecto.

## 1. El problema

Cuando alguien solicita un crédito, la entidad tiene que decidir sin saber si esa persona pagará. Si aprueba a quien no paga, pierde gran parte del dinero prestado. Si rechaza a quien sí habría pagado, pierde el margen del negocio y a un buen cliente. Revisar cada solicitud a mano también cuesta tiempo y dinero.

El proyecto construye una herramienta que **estima la probabilidad de impago** de cada solicitante y, con ella, **recomienda una de tres acciones: aprobar, enviar a revisión manual o rechazar**.

## 2. Los datos

Se usaron 12.144 solicitudes con 17 variables financieras y demográficas y el texto libre de cada solicitud. El 35,6 % de los solicitantes no pagó.

Los datos son **sintéticos pero realistas**: incluyen errores intencionales (duplicados, edades imposibles, datos faltantes) que se corrigieron con reglas documentadas. Tras la limpieza quedaron 12.000 clientes únicos:
- 9.600 para construir el modelo.
- 2.400 reservados para evaluarlo una sola vez, al final.

## 3. La solución

- **Un modelo de regresión logística calibrado.** Se probaron 16 modelos, entre ellos bosques aleatorios, redes neuronales, modelos de lenguaje (BERT y GPT-2) y Spark. Ninguno lo superó de forma demostrable, y este es el más fácil de explicar y de auditar.
- **Una política de decisión basada en costos.** Equivocarse aprobando a un mal pagador cuesta 45 % del monto, rechazar a un buen cliente cuesta 15 % y revisar a mano cuesta 8 %. Con esos supuestos:

  | Probabilidad estimada de impago | Acción recomendada |
  |---|---|
  | Menor que 17,8 % | **Aprobar** automáticamente |
  | Entre 17,8 % y 46,7 % | **Revisión manual** por un analista |
  | Mayor que 46,7 % | **Rechazar** |

- **Explicación de cada decisión.** Cada respuesta indica qué variables empujaron la probabilidad hacia arriba o hacia abajo (por ejemplo, "uso del cupo alto" o "buen puntaje de buró").

## 4. Resultados (evaluación única sobre 2.400 clientes nunca vistos)

| Indicador | Resultado | Lectura |
|---|---|---|
| Capacidad de distinguir buenos de malos pagadores (AUC) | **0,846** | Meta del proyecto: 0,70. El azar es 0,50. |
| Solicitudes aprobadas automáticamente | **39,7 %** | Sin intervención humana |
| Solicitudes enviadas a revisión | **28,8 %** | Dentro de la capacidad del equipo (35 %) |
| Solicitudes rechazadas | **31,5 %** | |
| Impago entre los aprobados | **9,8 %** | Frente a 35,6 % sin modelo |
| Ahorro frente a decidir solo aprobar/rechazar | **6,1 %** del costo esperado | Gracias a la banda de revisión |

**Lo que más pesa en el riesgo:** el puntaje de buró, la relación deuda/ingreso, el uso del cupo de las tarjetas y las moras recientes. Las variables demográficas casi no influyen.

## 5. Ética y equidad

- **El sexo nunca entra al modelo.** Solo se usa para auditar que el trato sea parejo. La tasa de aprobación de hombres y mujeres es casi igual: el índice de impacto dispar (DI) es 0,97, donde 1 sería igualdad perfecta.
- **Disparidad por edad, corregida.** En su primera versión, el modelo aprobaba menos a los jóvenes (DI 0,72). Quitar la edad no lo resolvía, porque la disparidad viaja por variables como el ingreso o la antigüedad laboral. Con una técnica de reponderación, el índice subió a **0,90**, por encima del 0,8 de referencia, a cambio de un costo adicional de solo 0,6 %.
- **Explicabilidad y privacidad.** Cada decisión trae su explicación, y el tratamiento de datos sigue la Ley 1581 de 2012.

## 6. Limitaciones

1. **Datos sintéticos.** Las cifras ilustran la metodología, no el desempeño en una cartera real. Al aplicar el mismo método a un conjunto real y público (German Credit), la capacidad baja a 0,786 y la disparidad por edad es mayor. Por eso la auditoría de equidad es indispensable.
2. **El texto de la solicitud no aporta de forma demostrable.** Además, en estos datos su señal está inflada por cómo se generaron, así que no se usa para decidir.
3. **Margen estadístico en la equidad por edad.** El índice de 0,90 tiene un margen que llega hasta 0,78, por debajo del 0,8 de referencia, así que debe vigilarse con más datos.
4. **Costos supuestos.** Los costos son supuestos documentados. Si cambian, los umbrales se recalculan solos.

## 7. Recomendaciones y próximos pasos

1. **Piloto en paralelo.** Probar el modelo junto al proceso actual, sin que decida, durante una o dos cosechas de crédito, y comparar los resultados.
2. **Seguimiento mensual.** Vigilar la estabilidad de la población (PSI), la equidad por grupo y la tasa real de impago. Recalibrar si alguna señal se mueve.
3. **Validar los costos con el área financiera.** Confirmar los costos del negocio y la capacidad real de revisión antes de producción.
4. **Simplificar el modelo (versión 2.1).** Evaluar retirar tres variables que casi no aportan.

## 8. Cómo se puede comprobar

- Todo el proceso corre en local con salidas reales: un comando entrena el modelo y los notebooks se ejecutan de punta a punta.
- La API se levanta con Docker y se verificó de verdad.
- El sitio web reproduce la corrida real y calcula en el navegador las mismas probabilidades que la API, con una diferencia menor que una millonésima.
- Los criterios de calidad se verifican con un solo comando: `python Back/scripts/check.py`.

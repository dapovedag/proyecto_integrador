import type { Recorrido } from "../pedagogia";

export const RECORRIDO_08: Recorrido = {
  objetivos: [
    "Explicar por qué el modelo se elige con validación cruzada en train y el test se usa una sola vez, al final.",
    "Leer una curva de calibración y decidir si una probabilidad del modelo significa lo que dice.",
    "Calcular los umbrales de aprobar, revisar y rechazar a partir de los costos del negocio (LGD, margen y revisión) con la regla de Chow.",
    "Auditar la equidad con el disparate impact y la regla 4/5, y explicar cómo el reweighing la corrige.",
    "Interpretar una explicación SHAP y un PSI para justificar decisiones y vigilar el modelo en operación.",
  ],
  conceptos: ["train_test", "calibracion", "matriz_confusion", "regla_chow", "disparate_impact", "reweighing", "shap", "psi"],
  repaso: [
    {
      pregunta: "¿Por qué el test se usa una sola vez y no para elegir el modelo?",
      respuesta:
        "Si el test se usa para elegir, las decisiones se ajustan a esos datos y la cifra final ya no mide lo que pasará con clientes nuevos. Por eso la familia, los hiperparámetros y la variante de equidad se eligen con validación cruzada en train, y el test se abre al final solo para medir: AUC 0,846.",
    },
    {
      pregunta: "Si aprobar a quien no paga cuesta 0,45 (la LGD) y revisar cuesta 0,08, ¿hasta qué probabilidad conviene aprobar sin revisión?",
      respuesta:
        "Aprobar cuesta en promedio p × 0,45 y revisar cuesta 0,08. Aprobar conviene mientras p × 0,45 < 0,08, es decir, p < 17,8 %. Con el mismo razonamiento, rechazar conviene cuando el margen que se pierde, (1 − p) × 0,15, es menor que 0,08: p > 46,7 %. En medio, se revisa.",
    },
    {
      pregunta: "¿Qué significa un disparate impact por edad de 0,896 y qué pide la regla 4/5?",
      respuesta:
        "El DI divide la tasa de aprobación del grupo menos aprobado entre la del más aprobado: 0,896 quiere decir que ese grupo recibe casi 9 aprobaciones por cada 10 del grupo más aprobado. La regla 4/5 pide que el cociente no baje de 0,8. El reweighing llevó el DI por edad de 0,72 a 0,90 sin usar umbrales distintos por grupo.",
    },
  ],
  aprendizaje: {
    conceptual:
      "Un buen modelo de crédito no es solo el de mayor AUC: sus probabilidades deben estar calibradas, porque con ellas se decide. Los costos del negocio (LGD 0,45, margen 0,15 y revisión 0,08) fijan los umbrales de la regla de Chow: aprobar por debajo de 17,8 % y rechazar por encima de 46,7 %. La equidad se mide con el disparate impact y la regla 4/5, y SHAP explica qué variables empujan cada decisión.",
    practico:
      "El notebook lee el modelo servido sin reentrenarlo y comprueba cada cifra contra la model card. En test se aprueba el 39,7 %, se revisa el 28,8 % y se rechaza el 31,5 %, con 9,8 % de impago entre los aprobados. El reweighing deja el DI por sexo en 0,970 y por edad en 0,896, y el PSI del puntaje (0,003) confirma una población estable. En operación se vigila cada mes el PSI, la equidad por cosecha y un modelo challenger frente al campeón.",
  },
};

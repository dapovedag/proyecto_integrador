/**
 * Contenido de gestión (paso 0) copiado de forma estructurada desde docs/gestion/:
 * definicion_de_hecho.md, definicion_de_listo.md, adr/*.md y riesgos.md.
 * Los estados de historias, sprints y trazabilidad NO se escriben aquí: salen de gestion.json.
 */

export interface NivelDod {
  id: string;
  nivel: string;
  resumen: string;
  criterios: { id: string; texto: string; prueba: string }[];
}

/** docs/gestion/definicion_de_hecho.md — esencial por nivel. */
export const DOD: NivelDod[] = [
  {
    id: "historia",
    nivel: "Historia de usuario",
    resumen: "Hecha solo si cumple todos los criterios de su nivel y de los niveles que contiene.",
    criterios: [
      { id: "H1", texto: "Cumplía la definición de listo al entrar al sprint.", prueba: "Planificación (sprints.md)" },
      { id: "H2", texto: "Todos sus criterios Dado/Cuando/Entonces se cumplen.", prueba: "Comando o archivo citado en backlog.yaml" },
      { id: "H3", texto: "Todas sus rutas de evidencia existen.", prueba: "generar_evidencia.py" },
      { id: "H4", texto: "Cumple la DoD de cada nivel que toca.", prueba: "Secciones 2–7" },
      { id: "H5", texto: "Estado Hecho en backlog.yaml y commit que cita su HU.", prueba: "git log --grep \"HU-xx\"" },
    ],
  },
  {
    id: "notebook",
    nivel: "Notebook",
    resumen: "Los criterios son exactamente los de verificar_dod.py; escribe dod_status.json.",
    criterios: [
      { id: "ejecutado", texto: "Todas las celdas de código tienen execution_count.", prueba: "verificar_dod.py --estricto" },
      { id: "sin_errores", texto: "Ninguna salida es de tipo error.", prueba: "verificar_dod.py" },
      { id: "kernel_credit_risk", texto: "El kernelspec es credit-risk.", prueba: "verificar_dod.py" },
      { id: "celda_ids", texto: "La primera celda lista los IDs del enunciado.", prueba: "verificar_dod.py" },
      { id: "conclusiones", texto: "La última celda Markdown es de Conclusiones.", prueba: "verificar_dod.py" },
      { id: "importa_credit_risk", texto: "La lógica vive en el paquete credit_risk.", prueba: "verificar_dod.py" },
      { id: "sin_rutas_absolutas", texto: "Sin rutas absolutas en código ni salidas.", prueba: "verificar_dod.py" },
      { id: "figuras_interpretadas", texto: "Cada imagen va seguida de una celda que la interpreta.", prueba: "verificar_dod.py" },
      { id: "artefactos", texto: "Existen los artefactos del paso (CSV, JSON, .keras, .joblib…).", prueba: "verificar_dod.py" },
    ],
  },
  {
    id: "codigo",
    nivel: "Código",
    resumen: "Back/src/credit_risk, Back/api, Back/scripts y train.py.",
    criterios: [
      { id: "C1", texto: "Pasan todas las pruebas.", prueba: "pytest Back/tests" },
      { id: "C2", texto: "Cobertura del núcleo ≥ 80 %.", prueba: "pytest --cov-fail-under=80" },
      { id: "C3", texto: "Lint y tipos limpios.", prueba: "ruff check · mypy" },
      { id: "C5", texto: "Todo el back en Python.", prueba: "test_proyecto.py" },
      { id: "C7", texto: "Gate de calidad completo en verde.", prueba: "check.py" },
    ],
  },
  {
    id: "modelo",
    nivel: "Modelo",
    resumen: "Una sola fuente, test una sola vez, equidad documentada.",
    criterios: [
      { id: "M1", texto: "Lo genera solo train.py (ADR-001).", prueba: "modelo_final.joblib + model_card.json" },
      { id: "M3", texto: "Selección, calibración, umbrales y variante sin usar test.", prueba: "model_card.json → protocolo" },
      { id: "M4", texto: "SHA-256 de train y test coincide con la card.", prueba: "test_proyecto.py" },
      { id: "M5", texto: "Umbrales de Chow y bandas coherentes (ADR-002).", prueba: "test_models.py" },
      { id: "M6", texto: "DI ≥ 0,8 o excepción razonada (ADR-003).", prueba: "dod_status.json → modelo" },
    ],
  },
  {
    id: "api",
    nivel: "API",
    resumen: "Contrato, degradación y Docker probados.",
    criterios: [
      { id: "A1", texto: "Pruebas de la API en verde.", prueba: "pytest test_api.py" },
      { id: "A2", texto: "/health 200 con versión 2.0.0; degradado → 503.", prueba: "test_api.py" },
      { id: "A3", texto: "Bajo → aprobar, alto → rechazar; inválido → 422 por campo.", prueba: "test_api.py" },
      { id: "A4", texto: "La imagen Docker levanta la misma API.", prueba: "docker compose up --build" },
    ],
  },
  {
    id: "front",
    nivel: "Front",
    resumen: "Estático, autónomo y en paridad con Python.",
    criterios: [
      { id: "W1", texto: "Compila.", prueba: "npm run build" },
      { id: "W2", texto: "Pruebas y paridad golden |Δ| < 1e-6.", prueba: "npm run test" },
      { id: "W3", texto: "Funciona con el back apagado y sin peticiones externas.", prueba: "playwright test" },
      { id: "W4", texto: "Toda cifra sale del paquete de corrida.", prueba: "manifest + test de consistencia" },
      { id: "W5", texto: "Accesibilidad AA y responsive desde 360 px.", prueba: "Playwright + axe" },
    ],
  },
  {
    id: "sprint",
    nivel: "Sprint y release",
    resumen: "Cierre verificable del incremento.",
    criterios: [
      { id: "S1", texto: "Historias comprometidas en Hecho o devueltas con motivo.", prueba: "sprints.md" },
      { id: "S3", texto: "Burndown con datos reales (puntos restantes por día).", prueba: "backlog.yaml → burndown" },
      { id: "L1", texto: "verificar_dod.py --estricto con 0 fallos en 00–09.", prueba: "verificar_dod.py" },
      { id: "L2", texto: "Checklist del enunciado 47/47 calculado.", prueba: "generar_evidencia.py" },
    ],
  },
];

/** docs/gestion/definicion_de_listo.md */
export const DOR: { id: string; texto: string }[] = [
  { id: "R1", texto: "Está en backlog.yaml con épica, rol, quiero y para." },
  { id: "R2", texto: "Cumple INVEST; ≤ 8 puntos (si es mayor, se divide)." },
  { id: "R3", texto: "Criterios de aceptación en Gherkin, cada uno con un comando o archivo que lo prueba." },
  { id: "R4", texto: "Estimada en puntos Fibonacci." },
  { id: "R5", texto: "Declara paso del plan, IDs del enunciado y rutas de evidencia." },
  { id: "R6", texto: "Dependencias resueltas o planificadas antes en el mismo sprint." },
  { id: "R7", texto: "Entorno probado: kernel credit-risk, TensorFlow (ADR-006), PySpark en Docker (ADR-005)." },
  { id: "R8", texto: "Presupuesto de tiempo y, si se delega, archivos disjuntos (lección L4)." },
  { id: "R9", texto: "Si toca el modelo o la política, su ADR está Aceptado." },
];

export interface Adr {
  id: string;
  titulo: string;
  estado: string;
  decision: string;
  consecuencia: string;
  historias: string[];
}

/** docs/gestion/adr/*.md — título, decisión y consecuencia principal. */
export const ADRS: Adr[] = [
  {
    id: "ADR-001",
    titulo: "Fuente única del modelo y selección sin fuga",
    estado: "Aceptado",
    decision:
      "Solo train.py produce el modelo; selección por ROC-AUC con CV de 5 folds en train y parsimonia (ΔAUC < 0,005 → regresión logística); test una sola vez.",
    consecuencia: "Se acaban los cuatro umbrales distintos del MVP: una versión, un artefacto, el SHA-256 de los datos en la card.",
    historias: ["HU-19", "HU-08", "HU-13"],
  },
  {
    id: "ADR-002",
    titulo: "Costos explícitos y regla de Chow",
    estado: "Aceptado",
    decision: "C_FN 0,45 · C_FP 0,15 · C_R 0,08: aprobar si p < 0,1778, rechazar si p > 0,4667, revisar en medio. Bandas = acciones.",
    consecuencia: "Los umbrales dependen de los costos, no del modelo; exige probabilidades calibradas y alerta si la revisión supera el 35 %.",
    historias: ["HU-18", "HU-19", "HU-10"],
  },
  {
    id: "ADR-003",
    titulo: "Medición y mitigación de equidad",
    estado: "Aceptado",
    decision: "DI sobre la aprobación automática con IC bootstrap; variantes base, sin_edad y reweighing; gana la de menor costo con DI ≥ 0,8.",
    consecuencia: "Sin umbrales por grupo (sería trato dispar). La regla 4/5 es una alerta de la EEOC, no una norma colombiana.",
    historias: ["HU-20", "HU-08", "HU-01"],
  },
  {
    id: "ADR-004",
    titulo: "Front estático autónomo con simulación fiel",
    estado: "Aceptado",
    decision: "Vite + React + TS 100 % estático; todo sale del paquete de corrida; motor exacto en TS verificado con golden.",
    consecuencia: "La demo funciona sin back y cada cifra es trazable a un hash; hay que mantener la paridad del port.",
    historias: ["HU-23", "HU-24", "HU-25", "HU-26", "HU-27", "HU-28"],
  },
  {
    id: "ADR-005",
    titulo: "PySpark en Docker",
    estado: "Aceptado",
    decision: "Spark 4.2 y Java 21 dentro de quay.io/jupyter/pyspark-notebook; el código sigue siendo Python e importa credit_risk.",
    consecuencia: "Runtime Linux reproducible; requiere el daemon de Docker y una imagen de varios GB.",
    historias: ["HU-09", "HU-14"],
  },
  {
    id: "ADR-006",
    titulo: "TensorFlow 2.20 en CPU",
    estado: "Aceptado",
    decision: "tensorflow==2.20.0 (CPU) con import perezoso en credit_risk.dl; plan B: Keras 3 con backend torch.",
    consecuencia: "Cumple IA3.2 con Keras estándar; entrenamiento en CPU con EarlyStopping y épocas acotadas.",
    historias: ["HU-06", "HU-14"],
  },
  {
    id: "ADR-007",
    titulo: "DuckDB para consultas analíticas",
    estado: "Aceptado",
    decision: "DuckDB consulta en memoria el CSV de registro (nb02, nb04 y exportar_front.py) sin modificarlo.",
    consecuencia: "SQL declarativo y sin servidor, comparado con pandas en los notebooks.",
    historias: ["HU-33", "HU-02", "HU-04", "HU-23"],
  },
  {
    id: "ADR-008",
    titulo: "Python 3.10 y scikit-learn 1.4.2 fijos",
    estado: "Aceptado",
    decision: "Versiones fijas con dos locks (API multiplataforma y desarrollo en Windows); venv + pip; todo el back en Python.",
    consecuencia: "joblib.load reproducible en local, Docker y clon limpio; actualizar sklearn exige reentrenar.",
    historias: ["HU-13", "HU-14", "HU-32"],
  },
];

export type Nivel = "Alta" | "Media" | "Baja";
export interface Riesgo {
  id: string;
  riesgo: string;
  prob: Nivel;
  impacto: Nivel;
  mitigacion: string;
  estado: string;
}

/** docs/gestion/riesgos.md — los de impacto alto y los que afectan al front. */
export const RIESGOS: Riesgo[] = [
  { id: "RG-01", riesgo: "Máquina lenta: la CV de HGB y los notebooks pesados no caben en el sprint.", prob: "Alta", impacto: "Alta", mitigacion: "Cola en serie, modo FAST y RandomizedSearchCV de 8 iteraciones.", estado: "Mitigando" },
  { id: "RG-02", riesgo: "WinError 1114 al cargar torch junto a sklearn o TensorFlow.", prob: "Media", impacto: "Alta", mitigacion: "Importar torch primero; procesos separados para TF y torch.", estado: "Abierto" },
  { id: "RG-03", riesgo: "Spark en Windows (winutils, ruta con tilde, Java).", prob: "Alta", impacto: "Alta", mitigacion: "PySpark en Docker (ADR-005).", estado: "Mitigando" },
  { id: "RG-05", riesgo: "El port TS del modelo difiere de Python.", prob: "Media", impacto: "Alta", mitigacion: "Golden de ~300 clientes y 50 textos con |Δ| < 1e-6.", estado: "Abierto" },
  { id: "RG-07", riesgo: "El DI por edad no llega a 0,8 sin un costo excesivo.", prob: "Media", impacto: "Alta", mitigacion: "Selección por costo sujeta a DI ≥ 0,8; sin umbrales por grupo.", estado: "Abierto" },
  { id: "RG-09", riesgo: "Se declara Hecho algo que no lo está.", prob: "Media", impacto: "Alta", mitigacion: "DoD verificable y checklist calculado por generar_evidencia.py.", estado: "Mitigando" },
  { id: "RG-13", riesgo: "Puerto ocupado por otro proyecto y se valida el servicio equivocado.", prob: "Alta", impacto: "Media", mitigacion: "Validar el <title> o la versión de /health, no solo el 200.", estado: "Mitigando" },
  { id: "RG-15", riesgo: "El texto aporta un ΔAUC artificial por el generador sintético.", prob: "Alta", impacto: "Media", mitigacion: "ΔAUC con IC bootstrap; el texto no entra en la decisión.", estado: "Abierto" },
  { id: "RG-16", riesgo: "S6 sobrecomprometido (57 puntos).", prob: "Media", impacto: "Media", mitigacion: "Escribir en paralelo y ejecutar en serie; HU-34 sale primero si se desvía.", estado: "Abierto" },
];

/** Cruce CRISP-DM ↔ fases del enunciado. */
export const CRISP: { fase: string; crisp: string; pasos: number[] }[] = [
  { fase: "F1", crisp: "Business Understanding", pasos: [1] },
  { fase: "F2", crisp: "Data Understanding + Preparation", pasos: [2, 3, 4] },
  { fase: "F3", crisp: "Modeling", pasos: [5, 6, 7, 9] },
  { fase: "F4", crisp: "Evaluation", pasos: [8] },
  { fase: "F5", crisp: "Deployment", pasos: [10, 11] },
];

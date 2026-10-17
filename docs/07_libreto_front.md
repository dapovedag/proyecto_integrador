# 07 · Libreto de integración back → front

> **Para:** el agente que conecta `Front/` con la API.
> **Fuentes:** `docs/04_arquitectura_backend.md` §3 (contrato oficial), `docs/02_plan_paso_a_paso.md` (paso 12), `docs/03_contrato_datos.md`, `Back/src/credit_risk/config.py` (`CATEGORIAS`, `BANDAS_RIESGO`) y `db/credit_risk.csv` (12.144 filas × 21 columnas; prevalencia de `default` = 35,6 %).
> **Aviso:** la API se está construyendo en paralelo en `Back/api/`. Si algún nombre de campo difiere, la verdad final está en `http://localhost:8000/docs` y en `http://localhost:8000/openapi.json`.

---

## 1. Qué hace el back (resumen)

1. Expone una API **FastAPI** en `http://localhost:8000` que sirve un modelo de riesgo de crédito entrenado con `db/credit_risk.csv`. Swagger está en `/docs`.
2. `POST /predict` recibe los datos de un cliente (demográficos, financieros y el texto de la solicitud) y devuelve la **probabilidad de impago**, la predicción 0/1 según el umbral, la **banda de riesgo** (Bajo, Medio o Alto) y los **factores principales**.
3. `POST /predict/text` analiza solo el texto libre con TF-IDF y regresión logística, y devuelve la probabilidad por texto, la banda y el sentimiento.
4. `GET /model/info` devuelve la *model card*: algoritmo, fecha, **métricas de test** (AUC, F1, recall, KS y Brier), el umbral y las bandas de riesgo.
5. `GET /health` informa si la API está viva y si el modelo está cargado. `POST /predict/batch` puntúa hasta 1.000 clientes. `sexo` se recibe solo para auditoría y **no entra al modelo**.

---

## 2. Cómo levantar todo

### 2.1 Back (PowerShell, desde `Back/`)

```powershell
cd "C:\Users\User\Desktop\Introducción\Back"
# (opcional) entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-api.txt      # o requirements.txt si existe solo ese

# 1) Si NO existen los modelos (Back/models/modelo_final.joblib, modelo_nlp.joblib, model_card.json):
python train.py

# 2) Lanzar la API (PYTHONPATH=src es obligatorio para importar credit_risk)
$env:PYTHONPATH = "src"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

> En esta máquina el arranque puede tardar entre 30 y 90 s (la importación de scikit-learn es lenta). Espere a ver `Application startup complete` antes de abrir el front.

Compruebe que `Back/models/` tiene los artefactos con `Get-ChildItem .\models`.

**Verificar /health** (en otra terminal):

```powershell
Invoke-RestMethod http://localhost:8000/health
# Esperado: status = ok, modelo_version = 1.0.0, modelo_cargado = True

Invoke-RestMethod -Method Post -Uri http://localhost:8000/predict -ContentType "application/json" -Body (Get-Content .\api\ejemplo_request.json -Raw)
```

También puede abrir `http://localhost:8000/docs` en el navegador.

### 2.2 Front (servidor estático)

```powershell
cd "C:\Users\User\Desktop\Introducción\Front"
python -m http.server 5500
```

Abra **`http://127.0.0.1:5500`** (también funciona `http://localhost:5500`).

### 2.3 Nota de CORS (verificada contra `Back/api/main.py`)

Para la demo, la API arranca con **CORS abierto (`*`)** si la variable `CORS_ORIGINS` no está definida. Así funciona desde cualquier origen:

| Cómo abre el front | ¿Funciona? |
|---|---|
| `http://127.0.0.1:5500` | Sí (recomendado) |
| `http://localhost:5500` | Sí |
| `file:///.../index.html` (doble clic) | Sí (origen `null` permitido), aunque se recomienda `http.server` |

Para restringir los orígenes (producción), defina antes de arrancar una lista separada por comas. Además de esa lista, se siguen permitiendo `localhost`/`127.0.0.1` en cualquier puerto y `null`:

```powershell
$env:CORS_ORIGINS = "http://localhost:5500,http://127.0.0.1:5500"
$env:PYTHONPATH = "src"; python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Si aparece `TypeError: Failed to fetch`, casi siempre significa que **la API no está corriendo**; revise `http://127.0.0.1:8000/health`.

> **Ojo al probar con `curl` en Windows:** si se pasa un JSON con tildes en línea (`-d "{...}"`), se corrompe la codificación y la API responde **400 "There was an error parsing the body"**. Use un archivo (`-d @api/ejemplo_request.json`) o pruebe desde el navegador o con `fetch`, que envían UTF-8 correctamente. Los errores de validación reales responden **422**, con `detail[].loc` indicando el campo (verificado: `edad=999` → 422, `proposito="Viajes"` → 422).

En el front, deje la URL base configurable:

```js
const API_BASE = window.API_BASE || "http://127.0.0.1:8000";
```

---

## 3. Endpoints

| Método | Ruta | Uso en el front | Request | Response 200 |
|---|---|---|---|---|
| GET | `/health` | Indicador de estado (nav y fase 05) | (sin cuerpo) | `{ "status": "ok", "modelo_version": "1.0.0", "modelo_cargado": true }` |
| GET | `/model/info` | Tarjetas de métricas, fase 04 y footer | (sin cuerpo) | model card (ver abajo) |
| POST | `/predict` | Simulador | `ClienteRequest` (ver abajo) | `PrediccionResponse` (ver abajo) |
| POST | `/predict/batch` | Opcional (no se usa en la demo) | `{ "clientes": [ClienteRequest, ...] }` (máximo 1.000) | `{ "resultados": [PrediccionResponse, ...], "total": N }` |
| POST | `/predict/text` | Análisis del texto (simulador o fase 03) | `{ "texto": "..." }` | `{ "probabilidad_impago_texto": 0.61, "banda_riesgo": "Alto", "sentimiento": "negativo", "modelo": "tfidf_logreg" }` |

Errores: **`422`** si un campo es inválido (tipo, rango o categoría). Si la API está caída, el navegador lanza un error de red (no hay status).

### `GET /model/info` (response)
```json
{
  "nombre": "riesgo_credito",
  "version": "1.0.0",
  "fecha_entrenamiento": "2026-10-XX",
  "algoritmo": "HistGradientBoostingClassifier calibrado",
  "variables_entrada": ["edad", "ingreso_mensual", "..."],
  "metricas_test": { "roc_auc": 0.0, "f1": 0.0, "recall": 0.0, "ks": 0.0, "brier": 0.0 },
  "umbral_decision": 0.35,
  "bandas_riesgo": { "Bajo": [0.0, 0.2], "Medio": [0.2, 0.5], "Alto": [0.5, 1.0] },
  "limitaciones": ["..."]
}
```

### `POST /predict` (request)
```json
{
  "edad": 35,
  "sexo": "F",
  "estado_civil": "Casado",
  "nivel_educativo": "Universitario",
  "situacion_laboral": "Empleado",
  "antiguedad_laboral_anios": 4.5,
  "personas_a_cargo": 1,
  "tipo_vivienda": "Arriendo",
  "ingreso_mensual": 4500000,
  "monto_credito": 20000000,
  "plazo_meses": 36,
  "tasa_interes_anual": 24.5,
  "proposito": "Vehiculo",
  "num_creditos_activos": 2,
  "moras_ultimos_12m": 0,
  "relacion_deuda_ingreso": 0.32,
  "puntaje_buro": 720,
  "uso_cupo_tarjetas": 0.4,
  "texto_solicitud": "Necesito el crédito para comprar un carro para trabajar."
}
```

### `POST /predict` (response 200)
```json
{
  "probabilidad_impago": 0.18,
  "prediccion": 0,
  "etiqueta": "No impago",
  "banda_riesgo": "Bajo",
  "umbral": 0.35,
  "factores_principales": [
    { "variable": "puntaje_buro", "efecto": "reduce_riesgo" },
    { "variable": "relacion_deuda_ingreso", "efecto": "aumenta_riesgo" }
  ],
  "modelo_version": "1.0.0"
}
```

### Error 422 (formato estándar de FastAPI y Pydantic v2)
```json
{
  "detail": [
    { "type": "less_than_equal", "loc": ["body", "edad"], "msg": "Input should be less than or equal to 80", "input": 999 },
    { "type": "literal_error", "loc": ["body", "proposito"], "msg": "Input should be 'Vivienda', 'Vehiculo', ...", "input": "Carro" }
  ]
}
```
El último elemento de `loc` es el nombre del campo, y sirve para pintar el error junto al control correspondiente.

---

## 4. Diccionario de campos del formulario

Los valores categóricos salen de `db/credit_risk.csv` y coinciden con `CATEGORIAS` en `Back/src/credit_risk/config.py`. Respete **mayúsculas, guiones bajos y la ausencia de tildes**: `Vehiculo`, `Tecnico`, `Union_libre`, etc. En el `<option>`, el `value` lleva el valor técnico y el texto visible puede llevar tildes.

| # | Campo (`name`) | Tipo JSON | Control | Valores permitidos / rango del formulario | Min–máx real en CSV | Ejemplo |
|---|---|---|---|---|---|---|
| 1 | `edad` | int | number (step 1) | 18–80 | 1–999 (incluye errores inyectados; p1–p99 = 18–80) | 35 |
| 2 | `sexo` | str | select | `F`, `M` (solo auditoría; no entra al modelo) | — | `F` |
| 3 | `estado_civil` | str | select | `Soltero`, `Casado`, `Union_libre`, `Divorciado`, `Viudo` | — | `Casado` |
| 4 | `nivel_educativo` | str (ordinal) | select (en este orden) | `Primaria`, `Secundaria`, `Tecnico`, `Universitario`, `Posgrado` | — | `Universitario` |
| 5 | `situacion_laboral` | str | select | `Empleado`, `Independiente`, `Pensionado`, `Desempleado` | 4,1 % nulos | `Empleado` |
| 6 | `antiguedad_laboral_anios` | float | number (step 0.1) | 0–62 | 0–62 (9,2 % nulos) | 4.5 |
| 7 | `personas_a_cargo` | int | number (step 1) o select 0–6 | 0–6 | 0–6 | 1 |
| 8 | `tipo_vivienda` | str | select | `Arriendo`, `Propia`, `Familiar` | 3,2 % nulos | `Arriendo` |
| 9 | `ingreso_mensual` | float (COP) | number (step 1000) | 300.000–65.000.000 | 312.000–64.540.000 (mediana 2.237.000) | 4500000 |
| 10 | `monto_credito` | float (COP) | number (step 100000) | 1.000.000–1.050.000.000 | 1.000.000–1.033.300.000 (mediana 12.281.000) | 20000000 |
| 11 | `plazo_meses` | int | **select** | `6, 12, 18, 24, 36, 48, 60, 72, 84` (únicos del CSV) | 6–84 | 36 |
| 12 | `tasa_interes_anual` | float (% E.A.) | number (step 0.1) | 10–42 | 10,0–42,0 | 24.5 |
| 13 | `proposito` | str | select | `Libre_inversion`, `Vehiculo`, `Consolidacion_deuda`, `Vivienda`, `Negocio`, `Educacion` | — | `Vehiculo` |
| 14 | `num_creditos_activos` | int | number (step 1) | 0–8 | 0–8 | 2 |
| 15 | `moras_ultimos_12m` | int | number (step 1) | 0–10 | 0–10 | 0 |
| 16 | `relacion_deuda_ingreso` | float | number (step 0.01) o range | 0–1.5 | 0–1,5 (5 % nulos) | 0.32 |
| 17 | `puntaje_buro` | int | number (step 1) o range | 150–950 | 150–950 (4 % nulos) | 720 |
| 18 | `uso_cupo_tarjetas` | float | number (step 0.01) o range | 0–1 | 0–1 | 0.4 |
| 19 | `texto_solicitud` | str | textarea (2–3 frases) | Texto libre en español; en el CSV mide de 85 a 196 caracteres | 2 % nulos | "Necesito el crédito para comprar un carro para trabajar." |

**Reglas del formulario**
- Envíe **números como números** (`Number(x)`), no como strings. Los enteros se envían sin decimales.
- Todos los campos son obligatorios en el front, aunque el CSV tenga nulos. Si la API acepta `null` en alguno (por ejemplo `situacion_laboral`), lo indicará `/docs`, pero para la demo envíe siempre valores completos.
- Etiquetas visibles sugeridas para `nivel_educativo` y otros: `Tecnico` → "Técnico", `Union_libre` → "Unión libre", `Libre_inversion` → "Libre inversión", `Consolidacion_deuda` → "Consolidación de deuda", `Educacion` → "Educación", `Vehiculo` → "Vehículo".
- Las tasas de impago más altas del CSV están en `Desempleado` (62 %), `Primaria` (44 %), `Vivienda` (43 %) y `Arriendo` (40 %). Ayudan a armar ejemplos creíbles.

---

## 5. Mapeo al diseño actual del Front

### 5.1 Qué hay hoy en `Front/index.html`
- Es un **wireframe**: todos los bloques son marcadores `.sk` (gris con una etiqueta en mayúsculas, como "Título", "Campo" o "Resultado"). Las clases son `.sk.line` (líneas de texto), `.sk.round` (íconos) y `.sk.dashed` (botón secundario).
- **No hay formulario, inputs ni JS** (ni `<script>` ni `fetch`). Los únicos `id` son `f1`…`f5` y `simulador`.
- Los estilos están en `styles/base.css` (reset y `.sk`) y `styles/main.css` (layout).
- **Paleta** (`main.css`): naranja `#ea580c` / `#c2410c`, morado `#6d28d9` / `#7c3aed`, tonos claros `#fed7aa`, `#ffedd5`, `#ede9fe` y `#ddd6fe`, fondo crema `#fffaf5`, borde `#f1ece6`, simulador oscuro `#1c1917` / `#292524` / `#57534e` y footer `#0c0a09`.
- Las fases 1–2 van en naranja y las 3–5 en morado (`.phase:nth-child(n+3) b` y `section.step.purple`).

El agente de front **reemplaza los `.sk`** por contenido real, conserva las clases de layout (`.hero`, `.phases`, `.step`, `.txt`, `.num`, `.sim`, `.in`, `.results`, `.res`) y agrega los `id` que se proponen abajo para que los snippets funcionen tal cual.

### 5.2 Tabla de mapeo

| Elemento existente (selector real) | Contenido actual | Qué debe mostrar | Endpoint · campo | `id` sugerido para crear |
|---|---|---|---|---|
| `header.hero nav > .sk` ("Logo") | Placeholder | Nombre del proyecto ("Riesgo de Crédito") | estático | — |
| `header.hero nav .links` (4 `.sk.line`) | Placeholders | Enlaces a `#f1`, `#f4`, `#simulador` y "API docs" (`http://127.0.0.1:8000/docs`) + **pastilla de estado** | `/health` → `status`, `modelo_cargado`, `modelo_version` | `#api-status` |
| `.hero .body` títulos (`.sk` "Título" ×2, `.sk.line` ×3) | Placeholders | Título, subtítulo y "Modelo v{version} · {algoritmo}" | estático + `/model/info` → `version`, `algoritmo` | `#hero-modelo` |
| `.hero .body a.sk[href="#simulador"]` ("Probar simulador") | Enlace | Mantener: lleva al simulador | — | — |
| `.hero .body .sk.dashed` ("Ver notebook") | Placeholder | Enlace a Swagger `/docs` o al notebook | — | — |
| `.hero .body > .sk` ("Visual principal", 360px) | Placeholder | Tarjeta resumen: AUC y KS grandes y bandas de riesgo | `/model/info` → `metricas_test.roc_auc`, `metricas_test.ks`, `bandas_riesgo` | `#hero-kpis` |
| `.phases a.phase[href="#f1".."#f5"]` | Navegación | Etiquetas: Definir, Explorar, Analizar, Evaluar, Desplegar | estático | — |
| `section.step#f1` (Definir) | `.txt` + visual | Problema y ética; lista de variables de entrada | `/model/info` → `variables_entrada` (conteo y lista) | `#f1-variables` |
| `section.step#f2` (Explorar) | `.txt` + visual | Datos del dataset: 12.144 filas, 35,6 % de impago, 21 columnas | estático (o imagen exportada del notebook) | — |
| `section.step.purple#f3` (Analizar) | `.txt` + visual | **Demo NLP**: textarea + botón, con la probabilidad por texto, la banda y el sentimiento | `/predict/text` → `probabilidad_impago_texto`, `banda_riesgo`, `sentimiento`, `modelo` | `#texto-form`, `#texto-input`, `#texto-resultado` |
| `section.step.purple#f4` (Evaluar) | `.txt` + visual | Tabla de métricas completa, umbral, bandas y limitaciones | `/model/info` → `metricas_test.*`, `umbral_decision`, `bandas_riesgo`, `limitaciones[]` | `#f4-metricas`, `#f4-limitaciones` |
| `section.step.purple#f5` (Desplegar) | `.txt` + visual | Estado en vivo de la API, versión, fecha de entrenamiento y enlace a `/docs` | `/health` + `/model/info` → `fecha_entrenamiento` | `#f5-estado` |
| `section.sim#simulador .in > div:first-child` ("Simulador", 3× "Campo", "Predecir") | Placeholders | **Formulario** de los 19 campos. Sustituya los 3 "Campo" por 3 grupos plegables: *Perfil* (1–8), *Finanzas* (9–18) y *Solicitud* (19). Use "Predecir" como `<button type="submit">` naranja `#ea580c` y añada los botones "Cliente riesgo bajo" y "Cliente riesgo alto" para la demo | `POST /predict` (request) | `<form id="form-cliente">`, `#btn-predecir`, `#btn-demo-bajo`, `#btn-demo-alto` |
| `section.sim#simulador .in > .sk` ("Resultado", 320px) | Placeholder | **Panel de resultado** (ver 5.3) | `POST /predict` (response) | `#resultado` |
| `section.results .res` ×4 (íconos `#ffedd5` ×2 y `#ede9fe` ×2) | Placeholders | **4 tarjetas de métricas**: 1) ROC-AUC, 2) KS (naranjas), 3) Recall, 4) F1 (moradas). Brier va como nota en la tarjeta de F1 o en `#f4` | `/model/info` → `metricas_test.roc_auc`, `.ks`, `.recall`, `.f1`, `.brier` | `data-metrica="roc_auc"`, `"ks"`, `"recall"`, `"f1"` en cada `.res` |
| `footer` (`.sk` + `.sk.line`) | Placeholders | "Proyecto Integrador · modelo v{version} · entrenado {fecha_entrenamiento}" | `/model/info` → `version`, `fecha_entrenamiento` | `#footer-modelo` |

### 5.3 Panel de resultado (`#resultado`, fondo oscuro `#1c1917`)

Orden sugerido, de arriba abajo:
1. **Probabilidad de impago**: número grande `Math.round(probabilidad_impago*100)` + "%", con una barra horizontal de 0 a 100 % que tenga **marcas en 20 % y 50 %** (límites de banda) y una **línea vertical en `umbral`** (0,35) con el rótulo "umbral".
2. **Chip de banda**: `banda_riesgo` coloreado (tabla siguiente).
3. **Decisión**: `etiqueta` ("No impago" / "Impago") + `prediccion` (0/1), con el texto "Umbral de decisión: 35 %".
4. **Factores principales**: lista de `factores_principales[]`, una flecha ▲ roja con "aumenta riesgo" o ▼ verde con "reduce riesgo", y el nombre legible de la variable (mapa `ETIQUETAS` en el snippet).
5. Pie: `modelo_version` en gris `#57534e`.
6. Si `#texto-resultado` se usa también aquí, bajo los factores va "Lectura del texto: {sentimiento} · {probabilidad_impago_texto}%".

### 5.4 Colores de banda (combinan con la paleta cálida)

El naranja de marca (`#ea580c`) se reserva para botones y acentos. Las bandas usan verde, ámbar y rojo para que no se confundan con la marca.

| Banda | Rango | Texto/acento en fondo oscuro (`.sim`) | Fondo del chip en oscuro | Texto en fondo claro | Fondo del chip en claro |
|---|---|---|---|---|---|
| Bajo | 0,00–0,20 | `#34d399` | `rgba(16,185,129,.15)` | `#047857` | `#d1fae5` |
| Medio | 0,20–0,50 | `#fbbf24` | `rgba(245,158,11,.15)` | `#b45309` | `#fef3c7` |
| Alto | 0,50–1,00 | `#f87171` | `rgba(239,68,68,.15)` | `#b91c1c` | `#fee2e2` |

CSS sugerido (agregar a `styles/main.css` o a un `styles/api.css` nuevo):

```css
:root{--bajo:#34d399;--bajo-bg:rgba(16,185,129,.15);--medio:#fbbf24;--medio-bg:rgba(245,158,11,.15);--alto:#f87171;--alto-bg:rgba(239,68,68,.15)}
.banda{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-weight:700;font-size:13px}
.banda.Bajo{color:var(--bajo);background:var(--bajo-bg)}
.banda.Medio{color:var(--medio);background:var(--medio-bg)}
.banda.Alto{color:var(--alto);background:var(--alto-bg)}
.results .banda.Bajo,.step .banda.Bajo{color:#047857;background:#d1fae5}
.results .banda.Medio,.step .banda.Medio{color:#b45309;background:#fef3c7}
.results .banda.Alto,.step .banda.Alto{color:#b91c1c;background:#fee2e2}
.prob-bar{position:relative;height:12px;border-radius:999px;background:#292524;overflow:visible}
.prob-bar .fill{height:100%;border-radius:999px;transition:width .5s}
.prob-bar .umbral{position:absolute;top:-6px;bottom:-6px;width:2px;background:#fafaf9}
.api-pill{display:inline-flex;gap:6px;align-items:center;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.18);color:#fff;font-weight:600}
.api-pill::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.api-pill.ok{color:#bbf7d0}.api-pill.down{color:#fecaca}.api-pill.wait{color:#fde68a}
.field-error{color:#f87171;font-size:12px;margin-top:4px}
.sim input,.sim select,.sim textarea{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #57534e;background:#292524;color:#fafaf9;font:inherit}
.sim input[aria-invalid="true"],.sim select[aria-invalid="true"]{border-color:#f87171}
```

---

## 6. Snippets de JS vanilla (listos para pegar)

Cree `Front/js/app.js` y enlácelo al final del `<body>` con `<script src="js/app.js" defer></script>`. Los snippets asumen los `id` de la sección 5.2.

### 6.1 Cliente HTTP con manejo de errores (422 y API caída)

```js
// ===== Config =====
const API_BASE = window.API_BASE || "http://127.0.0.1:8000";
const TIMEOUT_MS = 8000;

class ApiError extends Error {
  constructor(kind, message, status = null, fields = {}) {
    super(message);
    this.kind = kind;       // "red" | "validacion" | "servidor"
    this.status = status;
    this.fields = fields;   // { campo: "mensaje" } para 422
  }
}

async function api(path, { method = "GET", body } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    // API apagada, CORS bloqueado o timeout
    throw new ApiError("red", "No se pudo conectar con la API (" + API_BASE + "). ¿Está corriendo uvicorn en el puerto 8000? ¿Abrió el front en 127.0.0.1?");
  } finally {
    clearTimeout(t);
  }

  let data = null;
  try { data = await res.json(); } catch { /* respuesta sin JSON */ }

  if (res.ok) return data;

  if (res.status === 422) {
    const fields = {};
    const detail = Array.isArray(data?.detail) ? data.detail : [];
    detail.forEach(d => {
      const campo = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "general";
      fields[campo] = d.msg || "Valor inválido";
    });
    throw new ApiError("validacion", "Hay campos inválidos.", 422, fields);
  }
  const msg = (data && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) || res.statusText;
  throw new ApiError("servidor", "Error " + res.status + ": " + msg, res.status);
}

const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
const $ = (sel) => document.querySelector(sel);
```

### 6.2 `GET /health` → pastilla `#api-status` (y `#f5-estado`)

```js
async function verificarSalud() {
  const pill = $("#api-status");
  if (pill) { pill.className = "api-pill wait"; pill.textContent = "Verificando API…"; }
  try {
    const h = await api("/health");
    const ok = h.status === "ok" && h.modelo_cargado;
    if (pill) {
      pill.className = "api-pill " + (ok ? "ok" : "down");
      pill.textContent = ok ? `API en línea · modelo v${h.modelo_version}` : "API sin modelo cargado";
    }
    const f5 = $("#f5-estado");
    if (f5) f5.innerHTML = `<b>Estado:</b> ${h.status} · <b>Modelo cargado:</b> ${h.modelo_cargado ? "sí" : "no"} · <b>Versión:</b> ${h.modelo_version} · <a href="${API_BASE}/docs" target="_blank" rel="noopener">Swagger /docs</a>`;
    return ok;
  } catch (e) {
    if (pill) { pill.className = "api-pill down"; pill.textContent = "API fuera de línea"; }
    const f5 = $("#f5-estado");
    if (f5) f5.textContent = e.message;
    return false;
  }
}
```

### 6.3 `GET /model/info` → tarjetas `.results .res`, `#hero-kpis`, `#f4-metricas`, `#footer-modelo`

```js
const METRICAS = {
  roc_auc: { titulo: "ROC-AUC", desc: "Capacidad de ordenar buenos vs. malos pagadores", fmt: v => v.toFixed(3) },
  ks:      { titulo: "KS",      desc: "Máxima separación entre distribuciones", fmt: v => v.toFixed(3) },
  recall:  { titulo: "Recall",  desc: "Impagos reales que el modelo detecta", fmt: v => pct(v, 1) },
  f1:      { titulo: "F1",      desc: "Balance precisión / recall", fmt: v => v.toFixed(3) },
  brier:   { titulo: "Brier",   desc: "Error de calibración (menor es mejor)", fmt: v => v.toFixed(3) },
};

let MODEL_INFO = null;

async function cargarModelo() {
  try {
    const m = await api("/model/info");
    MODEL_INFO = m;
    const mt = m.metricas_test || {};

    // 4 tarjetas de la sección .results (cada .res con data-metrica="roc_auc|ks|recall|f1")
    document.querySelectorAll(".results .res[data-metrica]").forEach(card => {
      const k = card.dataset.metrica, def = METRICAS[k];
      if (!def || mt[k] == null) return;
      card.innerHTML = `
        <div class="ico">${def.titulo.slice(0, 2)}</div>
        <div style="font-size:32px;font-weight:800">${def.fmt(mt[k])}</div>
        <div style="font-weight:700">${def.titulo}</div>
        <div style="color:#78716c">${def.desc}${k === "f1" && mt.brier != null ? ` · Brier ${mt.brier.toFixed(3)}` : ""}</div>`;
    });

    // Hero
    const hero = $("#hero-kpis");
    if (hero) hero.innerHTML = `
      <div style="font-size:56px;font-weight:800">${(mt.roc_auc ?? 0).toFixed(3)}</div><div>ROC-AUC en test</div>
      <div style="font-size:32px;font-weight:800;margin-top:16px">${(mt.ks ?? 0).toFixed(3)}</div><div>KS</div>
      <div style="margin-top:16px">${Object.keys(m.bandas_riesgo || {}).map(b => `<span class="banda ${b}">${b}</span>`).join(" ")}</div>`;
    const hm = $("#hero-modelo");
    if (hm) hm.textContent = `Modelo v${m.version} · ${m.algoritmo}`;

    // Fase 04 (Evaluar)
    const f4 = $("#f4-metricas");
    if (f4) f4.innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        ${Object.entries(mt).map(([k, v]) => `<tr><td style="padding:8px 0">${METRICAS[k]?.titulo || k}</td><td style="text-align:right;font-weight:700">${METRICAS[k] ? METRICAS[k].fmt(v) : v}</td></tr>`).join("")}
        <tr><td style="padding:8px 0">Umbral de decisión</td><td style="text-align:right;font-weight:700">${pct(m.umbral_decision)}</td></tr>
      </table>
      <p style="margin-top:12px">${Object.entries(m.bandas_riesgo || {}).map(([b, [a, z]]) => `<span class="banda ${b}">${b}: ${pct(a)}–${pct(z)}</span>`).join(" ")}</p>`;
    const lim = $("#f4-limitaciones");
    if (lim) lim.innerHTML = (m.limitaciones || []).map(l => `<li>${l}</li>`).join("");

    // Fase 01: variables
    const f1 = $("#f1-variables");
    if (f1) f1.textContent = `${(m.variables_entrada || []).length} variables de entrada: ${(m.variables_entrada || []).join(", ")}`;

    // Footer
    const ft = $("#footer-modelo");
    if (ft) ft.textContent = `Proyecto Integrador · modelo v${m.version} · entrenado ${m.fecha_entrenamiento}`;
  } catch (e) {
    document.querySelectorAll(".results .res[data-metrica]").forEach(c => c.innerHTML = `<div style="color:#b91c1c">Métricas no disponibles</div><div style="color:#78716c">${e.message}</div>`);
  }
}
```

### 6.4 `POST /predict` → formulario `#form-cliente` y panel `#resultado`

```js
const NUMERICOS_INT = ["edad", "personas_a_cargo", "plazo_meses", "num_creditos_activos", "moras_ultimos_12m", "puntaje_buro"];
const NUMERICOS_FLOAT = ["antiguedad_laboral_anios", "ingreso_mensual", "monto_credito", "tasa_interes_anual", "relacion_deuda_ingreso", "uso_cupo_tarjetas"];

const ETIQUETAS = {
  edad: "Edad", sexo: "Sexo", estado_civil: "Estado civil", nivel_educativo: "Nivel educativo",
  situacion_laboral: "Situación laboral", antiguedad_laboral_anios: "Antigüedad laboral",
  personas_a_cargo: "Personas a cargo", tipo_vivienda: "Tipo de vivienda", ingreso_mensual: "Ingreso mensual",
  monto_credito: "Monto del crédito", plazo_meses: "Plazo", tasa_interes_anual: "Tasa de interés",
  proposito: "Propósito", num_creditos_activos: "Créditos activos", moras_ultimos_12m: "Moras últimos 12 meses",
  relacion_deuda_ingreso: "Relación deuda/ingreso", puntaje_buro: "Puntaje de buró",
  uso_cupo_tarjetas: "Uso de cupo de tarjetas", texto_solicitud: "Texto de la solicitud",
  ratio_monto_ingreso: "Monto / ingreso", cuota_estimada: "Cuota estimada", ratio_cuota_ingreso: "Cuota / ingreso",
};
const etiqueta = v => ETIQUETAS[v] || ETIQUETAS[String(v).split("__").pop()] || v.replace(/_/g, " ");

function leerFormulario(form) {
  const fd = new FormData(form);
  const o = {};
  for (const [k, v] of fd.entries()) {
    if (NUMERICOS_INT.includes(k)) o[k] = parseInt(v, 10);
    else if (NUMERICOS_FLOAT.includes(k)) o[k] = parseFloat(v);
    else o[k] = String(v).trim();
  }
  return o;
}

function limpiarErrores(form) {
  form.querySelectorAll(".field-error").forEach(e => e.remove());
  form.querySelectorAll("[aria-invalid]").forEach(e => e.removeAttribute("aria-invalid"));
}

function pintarErrores(form, fields) {
  Object.entries(fields).forEach(([campo, msg]) => {
    const el = form.elements[campo];
    if (!el) return;
    el.setAttribute("aria-invalid", "true");
    const p = document.createElement("div");
    p.className = "field-error";
    p.textContent = msg;
    el.insertAdjacentElement("afterend", p);
  });
  const primero = form.querySelector("[aria-invalid='true']");
  if (primero) primero.focus();
}

function colorBanda(b) { return { Bajo: "#34d399", Medio: "#fbbf24", Alto: "#f87171" }[b] || "#a8a29e"; }

function pintarResultado(r) {
  const box = $("#resultado");
  const p = r.probabilidad_impago;
  box.innerHTML = `
    <div style="color:#a8a29e;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Probabilidad de impago</div>
    <div style="font-size:64px;font-weight:800;color:${colorBanda(r.banda_riesgo)};line-height:1">${pct(p, 1)}</div>
    <div class="prob-bar" style="margin:16px 0 4px">
      <div class="fill" style="width:${(p * 100).toFixed(1)}%;background:${colorBanda(r.banda_riesgo)}"></div>
      <div class="umbral" style="left:${(r.umbral * 100).toFixed(1)}%" title="Umbral ${pct(r.umbral)}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;color:#78716c;font-size:11px"><span>0%</span><span>20%</span><span>50%</span><span>100%</span></div>
    <div style="display:flex;gap:10px;align-items:center;margin:18px 0">
      <span class="banda ${r.banda_riesgo}">Riesgo ${r.banda_riesgo}</span>
      <span style="color:#e7e5e4">${r.etiqueta} (predicción ${r.prediccion}) · umbral ${pct(r.umbral)}</span>
    </div>
    <div style="color:#a8a29e;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Factores principales</div>
    <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;color:#e7e5e4">
      ${(r.factores_principales || []).map(f => f.efecto === "aumenta_riesgo"
        ? `<li><span style="color:#f87171">▲</span> ${etiqueta(f.variable)} <small style="color:#a8a29e">aumenta el riesgo</small></li>`
        : `<li><span style="color:#34d399">▼</span> ${etiqueta(f.variable)} <small style="color:#a8a29e">reduce el riesgo</small></li>`).join("")}
    </ul>
    <div id="resultado-texto" style="margin-top:14px;color:#a8a29e"></div>
    <div style="margin-top:14px;color:#57534e;font-size:12px">Modelo v${r.modelo_version}</div>`;
}

function pintarErrorResultado(msg) {
  $("#resultado").innerHTML = `<div style="color:#f87171;font-weight:700">No se pudo predecir</div><div style="color:#a8a29e;margin-top:8px">${msg}</div>`;
}

async function predecir(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  const btn = $("#btn-predecir");
  limpiarErrores(form);
  btn.disabled = true; btn.textContent = "Calculando…";
  try {
    const cliente = leerFormulario(form);
    const r = await api("/predict", { method: "POST", body: cliente });
    pintarResultado(r);
    // Complemento: análisis del texto (opcional, no bloquea)
    if (cliente.texto_solicitud) {
      api("/predict/text", { method: "POST", body: { texto: cliente.texto_solicitud } })
        .then(t => { const el = $("#resultado-texto"); if (el) el.innerHTML = `Lectura del texto: <b>${t.sentimiento}</b> · ${pct(t.probabilidad_impago_texto, 1)} <span class="banda ${t.banda_riesgo}">${t.banda_riesgo}</span>`; })
        .catch(() => {});
    }
  } catch (e) {
    if (e.kind === "validacion") { pintarErrores(form, e.fields); pintarErrorResultado("Revise los campos marcados en rojo."); }
    else pintarErrorResultado(e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Predecir";
  }
}
```

### 6.5 `POST /predict/text` → fase 03 (`#texto-form`)

```js
async function analizarTexto(ev) {
  ev.preventDefault();
  const out = $("#texto-resultado");
  const texto = $("#texto-input").value.trim();
  if (texto.length < 10) { out.textContent = "Escriba al menos una frase."; return; }
  out.textContent = "Analizando…";
  try {
    const t = await api("/predict/text", { method: "POST", body: { texto } });
    out.innerHTML = `
      <div style="font-size:40px;font-weight:800">${pct(t.probabilidad_impago_texto, 1)}</div>
      <div>Probabilidad de impago estimada solo por el texto</div>
      <p style="margin-top:10px"><span class="banda ${t.banda_riesgo}">${t.banda_riesgo}</span>
      · Sentimiento: <b>${t.sentimiento}</b> · <small>${t.modelo}</small></p>`;
  } catch (e) {
    out.textContent = e.kind === "validacion" ? ("Texto inválido: " + Object.values(e.fields).join("; ")) : e.message;
  }
}
```

### 6.6 Clientes de demo y arranque

```js
// Mismos datos que los JSON 7.2 y 7.3
const CLIENTE_BAJO = { edad: 42, sexo: "F", estado_civil: "Casado", nivel_educativo: "Posgrado", situacion_laboral: "Empleado",
  antiguedad_laboral_anios: 12.0, personas_a_cargo: 1, tipo_vivienda: "Propia", ingreso_mensual: 9500000, monto_credito: 15000000,
  plazo_meses: 24, tasa_interes_anual: 14.5, proposito: "Educacion", num_creditos_activos: 1, moras_ultimos_12m: 0,
  relacion_deuda_ingreso: 0.18, puntaje_buro: 870, uso_cupo_tarjetas: 0.12,
  texto_solicitud: "Solicito el credito para financiar una maestria. Tengo un empleo estable desde hace varios anios y he cumplido puntualmente con todas mis obligaciones anteriores." };
const CLIENTE_ALTO = { edad: 24, sexo: "M", estado_civil: "Soltero", nivel_educativo: "Primaria", situacion_laboral: "Desempleado",
  antiguedad_laboral_anios: 0.0, personas_a_cargo: 3, tipo_vivienda: "Arriendo", ingreso_mensual: 1100000, monto_credito: 35000000,
  plazo_meses: 72, tasa_interes_anual: 38.5, proposito: "Consolidacion_deuda", num_creditos_activos: 5, moras_ultimos_12m: 4,
  relacion_deuda_ingreso: 1.25, puntaje_buro: 380, uso_cupo_tarjetas: 0.95,
  texto_solicitud: "Necesito consolidar varias tarjetas de credito porque me atrase en los pagos tras perder el empleo. Tengo deudas acumuladas y dificultades para cubrir la cuota." };

function llenarFormulario(form, datos) {
  Object.entries(datos).forEach(([k, v]) => { if (form.elements[k]) form.elements[k].value = v; });
}

document.addEventListener("DOMContentLoaded", () => {
  verificarSalud();
  cargarModelo();
  setInterval(verificarSalud, 15000);   // refresca la pastilla de estado

  const form = $("#form-cliente");
  if (form) {
    form.addEventListener("submit", predecir);
    $("#btn-demo-bajo")?.addEventListener("click", () => { llenarFormulario(form, CLIENTE_BAJO); form.requestSubmit(); });
    $("#btn-demo-alto")?.addEventListener("click", () => { llenarFormulario(form, CLIENTE_ALTO); form.requestSubmit(); });
  }
  $("#texto-form")?.addEventListener("submit", analizarTexto);
});
```

### 6.7 HTML mínimo de un control (patrón para los 19 campos)

```html
<form id="form-cliente" novalidate>
  <label>Edad <input name="edad" type="number" min="18" max="80" step="1" required></label>
  <label>Plazo (meses)
    <select name="plazo_meses" required>
      <option>6</option><option>12</option><option>18</option><option>24</option><option selected>36</option>
      <option>48</option><option>60</option><option>72</option><option>84</option>
    </select>
  </label>
  <label>Propósito
    <select name="proposito" required>
      <option value="Libre_inversion">Libre inversión</option><option value="Vehiculo">Vehículo</option>
      <option value="Consolidacion_deuda">Consolidación de deuda</option><option value="Vivienda">Vivienda</option>
      <option value="Negocio">Negocio</option><option value="Educacion">Educación</option>
    </select>
  </label>
  <label>Texto de la solicitud <textarea name="texto_solicitud" rows="3" required></textarea></label>
  <button id="btn-predecir" type="submit">Predecir</button>
  <button id="btn-demo-bajo" type="button">Cliente riesgo bajo</button>
  <button id="btn-demo-alto" type="button">Cliente riesgo alto</button>
</form>
```

> `novalidate` deja que la API devuelva los 422 durante la demo. Si se prefiere validación del navegador, quítelo; los `min` y `max` de la sección 4 ya coinciden.

---

## 7. Guion de la demo (2 minutos)

### 7.1 Pasos

| Tiempo | Acción | Qué decir / mostrar |
|---|---|---|
| 0:00–0:15 | Con la API ya corriendo, abrir `http://127.0.0.1:5500`. | Hero: "Análisis predictivo de riesgo de crédito". Señalar la pastilla **"API en línea · modelo v1.0.0"** (`/health`). |
| 0:15–0:30 | Recorrer la barra `.phases` (1→5) y detenerse un momento en **04 Evaluar**. | Métricas reales de `/model/info`: AUC, KS, umbral de 35 % y bandas Bajo < 20 %, Medio 20–50 % y Alto > 50 %. |
| 0:30–0:55 | Ir a **Simulador**, pulsar **"Cliente riesgo bajo"** (JSON 7.2) y luego **Predecir**. | Probabilidad baja, chip **verde "Bajo"**, "No impago", y factores como puntaje de buró alto y deuda/ingreso baja que **reducen el riesgo**. |
| 0:55–1:25 | Pulsar **"Cliente riesgo alto"** (JSON 7.3) y luego **Predecir**. | Probabilidad alta, chip **rojo "Alto"**, "Impago"; moras, deuda/ingreso y uso de cupo **aumentan el riesgo**. Mostrar la lectura del texto (sentimiento negativo). |
| 1:25–1:40 | (Opcional) Cambiar `edad` a 999 y predecir. | El 422 marca el campo en rojo: la API valida los datos. |
| 1:40–2:00 | Bajar a las **4 tarjetas** `.results` y abrir `http://127.0.0.1:8000/docs`. | ROC-AUC, KS, Recall y F1 en test. Swagger muestra los 5 endpoints. Cerrar diciendo que `sexo` no entra al modelo (equidad). |

> **Verificado contra la API en vivo (modelo v1.0.0, regresión logística, AUC 0,8465, umbral 0,4396):** el cliente 7.2 obtiene `probabilidad_impago = 0.0184` → **Bajo**; el cliente 7.3 obtiene `0.9992` → **Alto**. Prueba de texto: "Me atrasé en pagos por pérdida de empleo y quiero consolidar deudas" → `0.6734`, **Alto**, sentimiento **negativo**.

### 7.2 Cliente de riesgo bajo

Perfil del CSV con puntaje ≥ 800, 0 moras, deuda/ingreso < 0,35 y uso de cupo < 0,3: **1,4 % de impago real** (851 clientes).

```json
{
  "edad": 42,
  "sexo": "F",
  "estado_civil": "Casado",
  "nivel_educativo": "Posgrado",
  "situacion_laboral": "Empleado",
  "antiguedad_laboral_anios": 12.0,
  "personas_a_cargo": 1,
  "tipo_vivienda": "Propia",
  "ingreso_mensual": 9500000,
  "monto_credito": 15000000,
  "plazo_meses": 24,
  "tasa_interes_anual": 14.5,
  "proposito": "Educacion",
  "num_creditos_activos": 1,
  "moras_ultimos_12m": 0,
  "relacion_deuda_ingreso": 0.18,
  "puntaje_buro": 870,
  "uso_cupo_tarjetas": 0.12,
  "texto_solicitud": "Solicito el credito para financiar una maestria. Tengo un empleo estable desde hace varios anios y he cumplido puntualmente con todas mis obligaciones anteriores."
}
```

### 7.3 Cliente de riesgo alto

Perfil del CSV con puntaje ≤ 450, 3 o más moras y deuda/ingreso > 0,9: **100 % de impago real** (76 clientes). `Desempleado` tiene 62 % de impago.

```json
{
  "edad": 24,
  "sexo": "M",
  "estado_civil": "Soltero",
  "nivel_educativo": "Primaria",
  "situacion_laboral": "Desempleado",
  "antiguedad_laboral_anios": 0.0,
  "personas_a_cargo": 3,
  "tipo_vivienda": "Arriendo",
  "ingreso_mensual": 1100000,
  "monto_credito": 35000000,
  "plazo_meses": 72,
  "tasa_interes_anual": 38.5,
  "proposito": "Consolidacion_deuda",
  "num_creditos_activos": 5,
  "moras_ultimos_12m": 4,
  "relacion_deuda_ingreso": 1.25,
  "puntaje_buro": 380,
  "uso_cupo_tarjetas": 0.95,
  "texto_solicitud": "Necesito consolidar varias tarjetas de credito porque me atrase en los pagos tras perder el empleo. Tengo deudas acumuladas y dificultades para cubrir la cuota."
}
```

Ensaye la demo una vez con la API real. Si "bajo" no queda en la banda Bajo (< 0,20) o "alto" no queda en Alto (> 0,50), ajuste primero `puntaje_buro`, `moras_ultimos_12m` y `relacion_deuda_ingreso`, que son las variables con más efecto.

---

## 8. Lista de verificación final

**Back**
- [ ] `Back/models/` contiene `modelo_final.joblib`, `modelo_nlp.joblib` y `model_card.json` (si no, ejecutar `python train.py`).
- [ ] `$env:PYTHONPATH="src"; python -m uvicorn api.main:app --host 0.0.0.0 --port 8000` arranca sin errores.
- [ ] `Invoke-RestMethod http://localhost:8000/health` devuelve `status=ok` y `modelo_cargado=True`.
- [ ] `/model/info` trae `metricas_test` con valores distintos de 0.
- [ ] `/docs` muestra los 5 endpoints. Los nombres de campo del `ClienteRequest` en `/openapi.json` coinciden con la sección 4.

**Front**
- [ ] Se sirve con `python -m http.server 5500` y se abre en **`http://127.0.0.1:5500`**, no con `file://`.
- [ ] `API_BASE` apunta a `http://127.0.0.1:8000` y la consola no muestra errores de CORS.
- [ ] La pastilla `#api-status` está verde con la API arriba y roja al detener uvicorn (probarlo).
- [ ] El formulario `#form-cliente` tiene los 19 campos con `name` exacto y los selects usan los valores técnicos (`Union_libre`, `Tecnico`, `Libre_inversion`, etc.).
- [ ] Los números se envían como `number`, no como string.
- [ ] `#resultado` muestra la probabilidad en %, la barra con el umbral, el chip de banda con su color, la etiqueta y los factores con nombres legibles.
- [ ] Un 422 (por ejemplo `edad` = 999) marca el campo en rojo con el mensaje de la API.
- [ ] Las 4 tarjetas `.results .res[data-metrica]` muestran AUC, KS, Recall y F1 reales.
- [ ] `#f3` (texto) responde con probabilidad, banda y sentimiento.
- [ ] No queda ningún `.sk` con texto de marcador ("Campo", "Resultado", "Título") en las secciones conectadas.
- [ ] Se ve bien a menos de 860 px (el CSS ya apila `.sim .in` en una columna).

**Demo**
- [ ] El cliente bajo da la banda **Bajo** y el alto da **Alto** con el modelo real (si no, ajustar según 7.3).
- [ ] La demo completa se ensayó en 2 minutos o menos.

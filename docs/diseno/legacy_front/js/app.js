// Integración Front ↔ API de riesgo de crédito (ver docs/07_libreto_front.md §6)

// ===== Config =====
// Local (localhost, 127.0.0.1 o file://) → uvicorn en :8000. Desplegado (Vercel) → misma origen bajo /api.
const API_BASE = window.API_BASE ||
  (["localhost", "127.0.0.1", ""].includes(location.hostname) ? "http://127.0.0.1:8000" : "/api");
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
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ===== GET /health → #api-status y #f5-estado =====
async function verificarSalud() {
  const pill = $("#api-status");
  if (pill && !pill.classList.contains("ok")) { pill.className = "api-pill wait"; pill.textContent = "Verificando API…"; }
  try {
    const h = await api("/health");
    const ok = h.status === "ok" && h.modelo_cargado;
    if (pill) {
      pill.className = "api-pill " + (ok ? "ok" : "down");
      pill.textContent = ok ? `API en línea · modelo v${h.modelo_version}` : "API sin modelo cargado";
    }
    const f5 = $("#f5-estado");
    if (f5) f5.innerHTML = `<b>Estado:</b> ${esc(h.status)} · <b>Modelo cargado:</b> ${h.modelo_cargado ? "sí" : "no"} · <b>Versión:</b> ${esc(h.modelo_version)} · <a href="${API_BASE}/docs" target="_blank" rel="noopener">Swagger /docs</a>`;
    if (ok && !MODEL_INFO) cargarModelo();   // la API acaba de levantar: traer métricas
    return ok;
  } catch (e) {
    if (pill) { pill.className = "api-pill down"; pill.textContent = "API fuera de línea"; }
    const f5 = $("#f5-estado");
    if (f5) f5.textContent = e.message;
    return false;
  }
}

// ===== GET /model/info → .results .res, #hero-kpis, #f4-metricas, #footer-modelo =====
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
        <div class="val">${def.fmt(mt[k])}</div>
        <div class="tit">${def.titulo}</div>
        <div class="muted">${def.desc}${k === "f1" && mt.brier != null ? ` · Brier ${mt.brier.toFixed(3)}` : ""}</div>`;
    });

    // Hero
    const hero = $("#hero-kpis");
    if (hero) hero.innerHTML = `
      <div class="big">${(mt.roc_auc ?? 0).toFixed(3)}</div><div>ROC-AUC en test</div>
      <div class="mid">${(mt.ks ?? 0).toFixed(3)}</div><div>KS</div>
      <div class="bandas">${Object.keys(m.bandas_riesgo || {}).map(b => `<span class="banda ${esc(b)}">${esc(b)}</span>`).join(" ")}</div>`;
    const hm = $("#hero-modelo");
    if (hm) hm.textContent = `Modelo v${m.version} · ${m.algoritmo}`;

    // Fase 04 (Evaluar)
    const f4 = $("#f4-metricas");
    if (f4) f4.innerHTML = `
      <table class="tabla">
        ${Object.entries(mt).map(([k, v]) => `<tr><td>${METRICAS[k]?.titulo || esc(k)}</td><td>${METRICAS[k] ? METRICAS[k].fmt(v) : esc(v)}</td></tr>`).join("")}
        <tr><td>Umbral de decisión</td><td>${pct(m.umbral_decision)}</td></tr>
      </table>
      <p class="bandas">${Object.entries(m.bandas_riesgo || {}).map(([b, [a, z]]) => `<span class="banda ${esc(b)}">${esc(b)}: ${pct(a)}–${pct(z)}</span>`).join(" ")}</p>`;
    const lim = $("#f4-limitaciones");
    if (lim) lim.innerHTML = (m.limitaciones || []).map(l => `<li>${esc(l)}</li>`).join("");

    // Fase 01: variables
    const f1 = $("#f1-variables");
    if (f1) f1.textContent = `${(m.variables_entrada || []).length} variables de entrada: ${(m.variables_entrada || []).join(", ")}`;

    // Footer
    const ft = $("#footer-modelo");
    if (ft) ft.textContent = `Proyecto Integrador · modelo v${m.version} · entrenado ${m.fecha_entrenamiento}`;
  } catch (e) {
    document.querySelectorAll(".results .res[data-metrica]").forEach(c => {
      const def = METRICAS[c.dataset.metrica];
      c.innerHTML = `<div class="ico">${def.titulo.slice(0, 2)}</div><div class="val">—</div><div class="tit">${def.titulo}</div><div class="muted">Métricas no disponibles: la API no responde.</div>`;
    });
    const f4 = $("#f4-metricas");
    if (f4) f4.textContent = "Métricas no disponibles hasta que la API esté en línea.";
  }
}

// ===== POST /predict → #form-cliente y #resultado =====
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
const etiqueta = v => ETIQUETAS[v] || ETIQUETAS[String(v).split("__").pop()] || String(v).replace(/_/g, " ");

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
    el.closest("details")?.setAttribute("open", "");
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
    <div class="r-label">Probabilidad de impago</div>
    <div class="r-prob" style="color:${colorBanda(r.banda_riesgo)}">${pct(p, 1)}</div>
    <div class="prob-bar" style="margin:16px 0 4px">
      <div class="fill" style="width:${(p * 100).toFixed(1)}%;background:${colorBanda(r.banda_riesgo)}"></div>
      <div class="umbral" style="left:${(r.umbral * 100).toFixed(1)}%" title="Umbral ${pct(r.umbral)}"></div>
    </div>
    <div class="r-escala"><span>0%</span><span style="left:20%">20%</span><span style="left:${(r.umbral * 100).toFixed(1)}%">umbral</span><span style="left:50%">50%</span><span style="left:100%">100%</span></div>
    <div class="r-decision">
      <span class="banda ${esc(r.banda_riesgo)}">Riesgo ${esc(r.banda_riesgo)}</span>
      <span>${esc(r.etiqueta)} (predicción ${r.prediccion}) · umbral de decisión ${pct(r.umbral)}</span>
    </div>
    <div class="r-label">Factores principales</div>
    <ul class="r-factores">
      ${(r.factores_principales || []).map(f => f.efecto === "aumenta_riesgo"
        ? `<li><span style="color:#f87171">▲</span> ${esc(etiqueta(f.variable))} <small>aumenta el riesgo</small></li>`
        : `<li><span style="color:#34d399">▼</span> ${esc(etiqueta(f.variable))} <small>reduce el riesgo</small></li>`).join("")}
    </ul>
    <div id="resultado-texto" class="r-texto"></div>
    <div class="r-version">Modelo v${esc(r.modelo_version)}</div>`;
}

function pintarErrorResultado(msg) {
  $("#resultado").innerHTML = `<div style="color:#f87171;font-weight:700">No se pudo predecir</div><div style="color:#a8a29e;margin-top:8px">${esc(msg)}</div>`;
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
        .then(t => { const el = $("#resultado-texto"); if (el) el.innerHTML = `Lectura del texto: <b>${esc(t.sentimiento)}</b> · ${pct(t.probabilidad_impago_texto, 1)} <span class="banda ${esc(t.banda_riesgo)}">${esc(t.banda_riesgo)}</span>`; })
        .catch(() => {});
    }
  } catch (e) {
    if (e.kind === "validacion") { pintarErrores(form, e.fields); pintarErrorResultado("Revise los campos marcados en rojo."); }
    else pintarErrorResultado(e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Predecir";
  }
}

// ===== POST /predict/text → fase 03 =====
async function analizarTexto(ev) {
  ev.preventDefault();
  const out = $("#texto-resultado");
  const texto = $("#texto-input").value.trim();
  if (texto.length < 10) { out.textContent = "Escriba al menos una frase."; return; }
  out.textContent = "Analizando…";
  try {
    const t = await api("/predict/text", { method: "POST", body: { texto } });
    out.innerHTML = `
      <div style="font-size:40px;font-weight:800;color:#1c1917">${pct(t.probabilidad_impago_texto, 1)}</div>
      <div>Probabilidad de impago estimada solo por el texto</div>
      <p style="margin-top:10px"><span class="banda ${esc(t.banda_riesgo)}">${esc(t.banda_riesgo)}</span>
      · Sentimiento: <b>${esc(t.sentimiento)}</b> · <small>${esc(t.modelo)}</small></p>`;
  } catch (e) {
    out.textContent = e.kind === "validacion" ? ("Texto inválido: " + Object.values(e.fields).join("; ")) : e.message;
  }
}

// ===== Clientes de demo (libreto §7.2 y §7.3) y arranque =====
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
  document.querySelectorAll("a.api-docs").forEach(a => { a.href = API_BASE + "/docs"; });

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

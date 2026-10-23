# %% [markdown]
# # Paso 8 · Evaluación, optimización, decisión y auditoría de equidad
#
# | | |
# |---|---|
# | **IDs del enunciado** | F4, IA3.3 (comparación final), IA1.3 (auditoría ética), R1 |
# | **Fase** | F4 · Evaluar y optimizar (CRISP-DM: *Evaluation*) |
# | **Historia** | HU-08 · Sprint S7 |
# | **Entregable** | este notebook + `Back/models/modelo_final.joblib` + `Back/models/model_card.json` |
#
# **Este notebook no reentrena.** El modelo servido lo produce `Back/train.py` (única fuente de verdad,
# ADR-001); aquí se leen sus predicciones out-of-fold y de test, de modo que **cada cifra coincide con la
# model card por construcción** (lo comprueba la última sección).
#
# **Aprendizaje de la unidad (Módulo 2 · Unidad 3 y Unidad 1).** Optimizar un modelo de crédito no es
# maximizar el AUC: es elegir una **política de decisión** con costos explícitos (aprobar, revisar,
# rechazar), verificar que las probabilidades estén **calibradas**, auditar la **equidad** con intervalos de
# confianza y poder **explicar** cada decisión.

# %% tags=["parameters"]
FAST = False

# %%
from credit_risk.notebook import setup

ENTORNO = setup()
ENTORNO

# %%
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from IPython.display import Markdown, display

from credit_risk import config
from credit_risk.data import cargar_procesados, separar_xy
from credit_risk.models import Costos, Umbrales, costo_binario, curvas, estimador_base, metricas
from credit_risk.prediccion import cargar_artefactos
from credit_risk.reporting import PALETA, SERIE, figura_front, leer_json

art = cargar_artefactos()
card, artefacto = art["card"], art["artefacto"]
oof = pd.read_parquet(config.MODEL_DIR / "oof_predictions.parquet")
pred_te = pd.read_parquet(config.MODEL_DIR / "test_predictions.parquet")
train, test = cargar_procesados()
X_tr, y_tr = separar_xy(train)
X_te, y_te = separar_xy(test)
U = Umbrales(**card["umbrales"])
print(f"Modelo {card['version']} · {card['algoritmo']} · variante de equidad: {card['variante_equidad']}")
print(f"Entrenado el {card['fecha_entrenamiento']} en {card['duracion_entrenamiento_s']} s")
print("Umbrales (regla de Chow):", card["umbrales"])

# %% [markdown]
# ## 1. Optimización: selección de familia e hiperparámetros (CV en train)
#
# `RandomizedSearchCV` (8 combinaciones, CV estratificada de 5 particiones, ROC-AUC) para regresión logística
# y gradient boosting. Regla de parsimonia: si el boosting no supera a la logística por al menos
# 0,005 de AUC, se prefiere la logística (más interpretable y con explicaciones exactas).

# %%
seleccion = pd.DataFrame(card["seleccion_cv_train"]).T
seleccion

# %% [markdown]
# ## 2. Calibración: ¿la probabilidad significa lo que dice?
#
# Se compara el estimador base (sin calibrar) con el modelo servido (calibración sigmoide con
# `ensemble=False`). Ambos se evalúan en test.

# %%
p_cal = pred_te["p"].to_numpy()
p_base = estimador_base(artefacto.modelo).predict_proba(X_te)[:, 1]
cb, cc = curvas(y_te, p_base), curvas(y_te, p_cal)
brier_base, brier_cal = metricas(y_te, p_base, U.bayes)["brier"], metricas(y_te, p_cal, U.bayes)["brier"]
fig, ax = plt.subplots(figsize=(6.5, 5.5))
ax.plot([0, 1], [0, 1], ls="--", color=PALETA["texto_suave"], lw=1, label="Calibración perfecta")
ax.plot(cb["calib_prob_media"], cb["calib_frac_positivos"], "o-", color=PALETA["programacion"],
        label=f"Sin calibrar (Brier {brier_base:.4f})")
ax.plot(cc["calib_prob_media"], cc["calib_frac_positivos"], "o-", color=PALETA["acento"],
        label=f"Calibrado (Brier {brier_cal:.4f})")
ax.set(title="Curva de calibración en test (deciles)", xlabel="Probabilidad predicha media",
       ylabel="Fracción observada de impagos")
ax.legend()
plt.show()
figura_front("calibracion", "Curva de calibración en test (deciles)",
             {"series": [{"nombre": f"Sin calibrar (Brier {brier_base:.4f})", "x": cb["calib_prob_media"], "y": cb["calib_frac_positivos"]},
                         {"nombre": f"Calibrado (Brier {brier_cal:.4f})", "x": cc["calib_prob_media"], "y": cc["calib_frac_positivos"]}],
              "referencias": [{"tipo": "diagonal", "etiqueta": "Calibración perfecta"}]},
             ejes={"x": "Probabilidad predicha media", "y": "Fracción observada de impagos"}, clave="calibracion",
             opciones={"formato_x": "pct", "formato_y": "pct"})

# %% [markdown]
# **Interpretación.** Cuanto más cerca de la diagonal, más confiable es la probabilidad como estimación de la
# PD. El Brier de ambas versiones se muestra en la leyenda; la regla de decisión depende de que la
# probabilidad esté calibrada, porque los umbrales de Chow se derivan de costos, no del modelo.

# %% [markdown]
# ## 3. Política de decisión: aprobar, revisar o rechazar
#
# Con costos por unidad de exposición (ADR-002) — aprobar a quien no paga cuesta la LGD, rechazar a un buen
# pagador cuesta el margen y revisar cuesta el tiempo del analista, la demora y su error residual — los
# umbrales óptimos salen en forma cerrada.

# %%
costos = Costos(fn=card["costos"]["lgd_fn"], fp=card["costos"]["margen_fp"], revision=card["costos"]["revision"])
curva = costo_binario(y_te, p_cal, costos)
fig, ax = plt.subplots(figsize=(10, 4.5))
ax.plot(curva["umbral"], curva["costo_medio"], color=PALETA["acento"], lw=2, label="Política de 2 acciones (test)")
ax.axvline(U.bayes, color=PALETA["texto_suave"], ls="--", lw=1, label=f"Umbral bayesiano {U.bayes:.3f}")
ax.axvspan(U.aprobar, U.rechazar, color=PALETA["medio"], alpha=0.12, label="Banda de revisión manual")
ax.axhline(card["decision_test"]["costo_medio"], color=PALETA["bajo"], lw=2,
           label=f"Política de 3 acciones: {card['decision_test']['costo_medio']:.4f}")
ax.set(title="Costo esperado por solicitud según el umbral", xlabel="Umbral de rechazo",
       ylabel="Costo medio (fracción de la exposición)")
ax.legend(fontsize=8)
plt.show()
figura_front("lineas", "Costo esperado por solicitud según el umbral",
             {"series": [{"nombre": "Política de 2 acciones (test)", "x": curva["umbral"].round(2).tolist(),
                          "y": curva["costo_medio"].round(5).tolist()}],
              "referencias": [{"eje": "x", "valor": round(U.bayes, 4), "etiqueta": "Umbral bayesiano"},
                              {"eje": "y", "valor": card["decision_test"]["costo_medio"], "etiqueta": "Política de 3 acciones"}],
              "bandas": [{"desde": round(U.aprobar, 4), "hasta": round(U.rechazar, 4), "etiqueta": "Revisión manual"}]},
             ejes={"x": "Umbral de rechazo", "y": "Costo medio (fracción de la exposición)"}, clave="curva_costo",
             opciones={"formato_x": "pct", "formato_y": "dec3"})

# %% [markdown]
# **Interpretación.** La curva azul es el costo de una política de solo aprobar/rechazar; su mínimo está
# cerca del umbral bayesiano. La franja ámbar es la zona donde enviar la solicitud a un analista cuesta menos
# que equivocarse; la línea verde es el costo de la política de tres acciones servida.

# %%
decision = pd.Series(card["decision_test"]).to_frame("test")
sens = pd.DataFrame(card["sensibilidad_umbrales"])
display(decision)
sens

# %% [markdown]
# **Interpretación.** La primera tabla resume cómo se reparten las solicitudes de test entre aprobar, revisar
# y rechazar, y la tasa de impago que queda entre los aprobados. La segunda muestra que los umbrales se mueven
# de forma razonable cuando cambian los supuestos de LGD y margen (análisis de sensibilidad del ADR-002).

# %% [markdown]
# ## 4. Comparación final de todos los modelos
#
# Clásicos (paso 5), redes neuronales (paso 6), NLP (paso 7), Spark MLlib (paso 9) y el modelo servido,
# con las mismas métricas sobre el mismo test.

# %%
filas = []
for nombre in ["resultados_clasicos", "resultados_dl", "resultados_nlp", "resultados_spark"]:
    ruta = config.MODEL_DIR / f"{nombre}.json"
    if ruta.exists():
        for f in leer_json(ruta)["modelos"]:
            filas.append({"modelo": f["modelo"], "familia": f["familia"], **f["test"],
                          "tiempo_s": f.get("tiempo_entrenamiento_s"), "interpretabilidad": f["interpretabilidad"]})
filas.append({"modelo": f"Servido v{card['version']} ({card['familia']}, calibrado)", "familia": "final",
              **metricas(y_te, p_cal, U.bayes), "tiempo_s": card["duracion_entrenamiento_s"], "interpretabilidad": "alta"})
comparacion = pd.DataFrame(filas).sort_values("roc_auc", ascending=False).reset_index(drop=True)
comparacion

# %%
colores = {"línea base": PALETA["texto_suave"], "clásico": PALETA["programacion"], "deep learning": PALETA["ia"],
           "nlp": "#22D3EE", "big data": PALETA["medio"], "final": PALETA["acento"]}
d = comparacion.iloc[::-1]
fig, ax = plt.subplots(figsize=(10, 0.42 * len(d) + 1.2))
ax.barh(d["modelo"], d["roc_auc"], color=[colores[f] for f in d["familia"]])
for i, v in enumerate(d["roc_auc"]):
    ax.text(v + 0.003, i, f"{v:.3f}", va="center", fontsize=8)
ax.set(title="ROC-AUC en test por modelo y familia", xlabel="ROC-AUC", ylabel="Modelo", xlim=(0.45, 1))
plt.show()
figura_front("barras_h", "ROC-AUC en test por modelo y familia",
             {"categorias": d["modelo"].tolist(), "series": [{"nombre": "ROC-AUC", "valores": d["roc_auc"].round(4).tolist()}],
              "familias": d["familia"].tolist()},
             ejes={"x": "ROC-AUC", "y": "Modelo"}, clave="comparacion_final", opciones={"color_por": "familia", "min_x": 0.45})

# %% [markdown]
# **Interpretación.** El color indica la familia (naranja: clásicos; morado: redes; cian: NLP; ámbar: Spark;
# índigo: servido). El criterio de elección final combina desempeño, interpretabilidad y costo de servir: un
# modelo que gana por milésimas de AUC pero no se puede explicar ni auditar no compensa en crédito.

# %% [markdown]
# ## 5. Auditoría de equidad (IA1.3)
#
# El DI se mide sobre la **aprobación automática**. Primero, las variantes evaluadas con predicciones
# out-of-fold en train (la elección no usa test); luego, la medición final en test con IC bootstrap.

# %%
variantes = pd.DataFrame(card["variantes_equidad"])
variantes[["variante", "roc_auc_oof", "costo_medio", "precio_equidad_costo", "tasa_aprobacion", "di_sexo", "di_edad",
           "cumple_equidad"]]

# %%
fig, ax = plt.subplots(figsize=(8, 4.5))
for (_, v), color in zip(variantes.iterrows(), SERIE):
    ax.scatter(v["di_edad"], v["costo_medio"], s=160, color=color, label=v["variante"], zorder=3)
ax.axvline(config.DI_MINIMO, color=PALETA["alto"], ls="--", lw=1, label="Regla de 4/5 (0,8)")
ax.set(title="Precio de la equidad: costo esperado frente a DI por edad (OOF, train)",
       xlabel="Disparate impact por grupo de edad (aprobación automática)", ylabel="Costo medio por solicitud")
ax.legend(fontsize=8)
plt.show()
figura_front("dispersion", "Precio de la equidad: costo esperado frente a DI por edad (OOF, train)",
             {"series": [{"nombre": v["variante"], "puntos": [[v["di_edad"], v["costo_medio"]]]} for _, v in variantes.iterrows()],
              "referencias": [{"eje": "x", "valor": config.DI_MINIMO, "etiqueta": "Regla de 4/5"}]},
             ejes={"x": "Disparate impact por edad (aprobación automática)", "y": "Costo medio por solicitud"},
             clave="precio_equidad", opciones={"formato_y": "dec3", "tamano_punto": 18})

# %% [markdown]
# **Interpretación.** Cada punto es una variante del modelo. A la derecha de la línea roja se cumple la regla
# de 4/5; entre las que la cumplen se elige la de menor costo. La distancia vertical entre variantes es el
# "precio de la equidad": cuánto costo esperado se paga por mejorar el trato entre grupos.

# %%
for atributo in ["sexo", "edad"]:
    e = card["equidad_test"][atributo]
    display(Markdown(f"**{atributo.capitalize()}** · DI {e['disparate_impact']} (IC 95 % {e['di_ic95']}) · "
                     f"DI igualdad de oportunidades {e['di_igualdad_oportunidades']} · cumple 4/5: {e['cumple_regla_80']}"))
    display(pd.DataFrame(e["grupos"]).set_index("grupo"))

# %% [markdown]
# **Interpretación.** Además de la aprobación, la tabla muestra la aprobación entre **buenos pagadores**
# (igualdad de oportunidades) y el error de calibración por grupo: un modelo puede aprobar menos a un grupo
# porque ese grupo realmente incumple más (diferencia justificada por riesgo) o porque está mal calibrado
# para él (sesgo). La columna `error_calibracion` permite distinguir ambos casos.

# %% [markdown]
# ## 6. Explicabilidad: global (SHAP) y tres casos individuales

# %%
import shap

pipe = estimador_base(artefacto.modelo)
pipe = getattr(pipe, "estimator_", pipe)
Z_tr = pipe.named_steps["preprocessor"].transform(pipe.named_steps["capping"].transform(pipe.named_steps["features"].transform(X_tr)))
Z_te = pipe.named_steps["preprocessor"].transform(pipe.named_steps["capping"].transform(pipe.named_steps["features"].transform(X_te.head(1500))))
nombres = pipe.named_steps["preprocessor"].get_feature_names_out()
if hasattr(pipe.named_steps["model"], "coef_"):
    explainer = shap.LinearExplainer(pipe.named_steps["model"], Z_tr)
else:
    explainer = shap.TreeExplainer(pipe.named_steps["model"])
sv = explainer.shap_values(Z_te)
sv = sv[1] if isinstance(sv, list) else sv
global_ = pd.Series(np.abs(sv).mean(axis=0), index=nombres).sort_values().tail(15)
fig, ax = plt.subplots(figsize=(9, 5))
ax.barh(global_.index, global_.values, color=PALETA["acento"])
ax.set(title="Importancia global SHAP (media de |valor SHAP|, 1.500 clientes de test)", xlabel="Media |SHAP| (log-odds)",
       ylabel="Variable transformada")
plt.show()
figura_front("barras_h", "Importancia global SHAP (1.500 clientes de test)",
             {"categorias": global_.index.tolist(), "series": [{"nombre": "Media |SHAP|", "valores": global_.round(4).tolist()}]},
             ejes={"x": "Media |SHAP| (log-odds)", "y": "Variable"}, clave="shap_global")

# %% [markdown]
# **Interpretación.** SHAP reparte el log-odds de cada predicción entre las variables. Su ranking global
# coincide con el de los coeficientes y la permutación del paso 5: tres métodos distintos señalan los mismos
# factores, lo que da confianza en la explicación.

# %%
casos = {}
for d_ in ["aprobar", "revisar", "rechazar"]:
    idx = np.where(np.array([r["decision"] for r in artefacto.predecir(X_te.head(400).to_dict("records"))]) == d_)[0]
    casos[d_] = X_te.head(400).iloc[[idx[0]]] if len(idx) else None
fig, axes = plt.subplots(1, 3, figsize=(16, 4.6))
for ax, (d_, fila) in zip(axes, casos.items()):
    if fila is None:
        ax.set_visible(False)
        continue
    r = artefacto.predecir(fila.to_dict("records"), top_factores=8)[0]
    f = pd.DataFrame(r["factores_principales"]).iloc[::-1]
    ax.barh(f["variable"], f["contribucion"], color=np.where(f["contribucion"] > 0, PALETA["alto"], PALETA["bajo"]))
    ax.axvline(0, color=PALETA["texto_suave"], lw=1)
    ax.set(title=f"{d_.capitalize()} · p = {r['probabilidad_impago']:.1%} · banda {r['banda_riesgo']}",
           xlabel="Contribución al log-odds")
    figura_front("barras_h", f"Caso {d_}: p = {r['probabilidad_impago']:.1%} · banda {r['banda_riesgo']}",
                 {"categorias": f["variable"].tolist(), "series": [{"nombre": "Contribución", "valores": f["contribucion"].tolist()}]},
                 ejes={"x": "Contribución al log-odds", "y": "Variable"}, clave=f"caso_{d_}", opciones={"color_por": "signo"})
plt.suptitle("Tres casos explicados (contribuciones exactas del modelo servido)", fontweight="bold")
plt.show()

# %% [markdown]
# **Interpretación.** Cada barra es la contribución exacta de una variable al log-odds de la probabilidad
# calibrada, frente al cliente promedio de train; la suma de todas más la base reproduce la probabilidad. Es
# la misma explicación que devuelve la API y que muestra el simulador del front.

# %% [markdown]
# ## 7. Monitoreo: estabilidad poblacional (PSI) entre train y test

# %%
psi_vars = pd.DataFrame(card["monitoreo"]["psi_variables"])
fig, ax = plt.subplots(figsize=(9, 4.8))
d = psi_vars.sort_values("psi")
ax.barh(d["variable"], d["psi"], color=PALETA["acento"])
ax.axvline(config.PSI_ESTABLE, color=PALETA["medio"], ls="--", lw=1, label="0,10 vigilar")
ax.axvline(config.PSI_ALERTA, color=PALETA["alto"], ls="--", lw=1, label="0,25 recalibrar")
ax.set(title=f"PSI por variable (puntaje: {card['monitoreo']['psi_puntaje_train_test']}, {card['monitoreo']['estado']})",
       xlabel="PSI", ylabel="Variable")
ax.legend()
plt.show()
figura_front("barras_h", "PSI por variable (train frente a test)",
             {"categorias": d["variable"].tolist(), "series": [{"nombre": "PSI", "valores": d["psi"].tolist()}],
              "referencias": [{"eje": "x", "valor": config.PSI_ESTABLE, "etiqueta": "0,10 vigilar"},
                              {"eje": "x", "valor": config.PSI_ALERTA, "etiqueta": "0,25 recalibrar"}]},
             ejes={"x": "PSI", "y": "Variable"}, clave="psi_variables", opciones={"formato_x": "dec3"})

# %% [markdown]
# **Interpretación.** Train y test vienen de la misma población, así que el PSI debe ser bajo en todas las
# variables; esta misma medición, aplicada mes a mes en producción, es la alarma que dispara la recalibración
# (plan de operación en `docs/05_despliegue.md`).

# %% [markdown]
# ## 8. Consistencia con la model card servida

# %%
recalculadas = metricas(y_te, p_cal, U.rechazar)
diferencias = {k: abs(recalculadas[k] - v) for k, v in card["metricas_test"].items()}
assert max(diferencias.values()) < 1e-9, diferencias
assert np.allclose(artefacto.modelo.predict_proba(X_te)[:, 1], p_cal)
print("✔ Las métricas recalculadas desde test_predictions.parquet coinciden con model_card.json")
print("✔ El artefacto servido reproduce exactamente las probabilidades de test guardadas")
display(Markdown(
    f"**Resumen calculado.** Modelo servido v{card['version']} ({card['algoritmo']}), variante "
    f"`{card['variante_equidad']}`. Test: AUC {card['metricas_test']['roc_auc']}, KS {card['metricas_test']['ks']}, "
    f"Brier {card['metricas_test']['brier']}. Decisiones en test: aprobar {card['decision_test']['tasa_aprobacion']:.1%}, "
    f"revisar {card['decision_test']['tasa_revision']:.1%}, rechazar {card['decision_test']['tasa_rechazo']:.1%}; "
    f"impago entre aprobados {card['decision_test']['impago_en_aprobados']:.1%}. DI edad "
    f"{card['equidad_test']['edad']['disparate_impact']}, DI sexo {card['equidad_test']['sexo']['disparate_impact']}."))

# %% [markdown]
# ## Conclusiones
#
# *(Se redactan después de la ejecución, a partir de las salidas reales de este notebook.)*

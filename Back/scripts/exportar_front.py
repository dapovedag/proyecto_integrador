"""Construye el "paquete de corrida" que el front lleva precargado (ADR-004). Se ejecuta en local DESPUÉS
de la corrida real del back; su salida se commitea y el front nunca la regenera ni llama al back.

Salidas:
- ``Front/src/data/generated/``: JSON pequeños e importables (card, resultados, agregados, capturas de la
  API, log de entrenamiento, export del modelo para el motor TS, golden, gestión, DoD, manifest).
- ``Front/public/run/``: activos pesados que se cargan una vez (CSV, nube PCA, notebooks del reproductor
  e imágenes WebP).
- ``Front/src/data/schemas/``: JSON Schema de los contratos (para generar los tipos TypeScript).

Uso:  python scripts/exportar_front.py [--sin-notebooks]
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import duckdb
import numpy as np
import pandas as pd

BACK = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACK))
sys.path.insert(0, str(BACK / "src"))

from credit_risk import __version__, config  # noqa: E402
from credit_risk.data import cargar_datos, cargar_procesados, hash_archivo  # noqa: E402
from credit_risk.demo import CLIENTES_DEMO  # noqa: E402
from credit_risk.explain import _pipeline_de, _sigmoide  # noqa: E402
from credit_risk.features import variable_original  # noqa: E402
from credit_risk.nlp import NEGATIVAS, POSITIVAS, STOPWORDS_ES  # noqa: E402
from credit_risk.prediccion import cargar_artefactos  # noqa: E402
from credit_risk.reporting import MIME_FIGURA, guardar_json, sin_nan  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

FIGURAS: list[dict[str, Any]] = []  # índice global de figuras nativas (lo llenan los notebooks exportados)
GEN = config.FRONT_DATA_DIR
RUN = config.FRONT_DIR / "public" / "run"
SCHEMAS = config.FRONT_DIR / "src" / "data" / "schemas"



def _git_sha() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=BACK, capture_output=True, text=True,
                              check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "desconocido"


# --------------------------------------------------------------------------- modelo → JSON (motor TS)
def exportar_modelo(artefacto: Any) -> dict[str, Any]:
    """Parámetros exactos del pipeline servido para reimplementarlo en TypeScript."""
    pipe = _pipeline_de(artefacto.modelo)
    modelo = pipe.named_steps["model"]
    if not hasattr(modelo, "coef_"):
        raise NotImplementedError("El motor TS exacto solo cubre el modelo lineal elegido por parsimonia (ADR-001).")
    a, b = _sigmoide(artefacto.modelo)
    ct = pipe.named_steps["preprocessor"]
    bloques: dict[str, Any] = {}
    for nombre, trans, cols in ct.transformers_:
        if nombre == "remainder":
            continue
        imp = trans.named_steps["imputer"]
        b_: dict[str, Any] = {"columnas": list(cols), "imputacion": imp.strategy}
        if nombre == "num":
            b_["mediana"] = imp.statistics_.astype(float).tolist()
            b_["media"] = trans.named_steps["scaler"].mean_.tolist()
            b_["escala"] = trans.named_steps["scaler"].scale_.tolist()
        elif nombre == "nom":
            b_["relleno"] = imp.fill_value
            b_["categorias"] = [list(map(str, c)) for c in trans.named_steps["onehot"].categories_]
        elif nombre == "ord":
            b_["moda"] = [str(v) for v in imp.statistics_]
            b_["categorias"] = [list(map(str, c)) for c in trans.named_steps["ordinal"].categories_]
            b_["media"] = trans.named_steps["scaler"].mean_.tolist()
            b_["escala"] = trans.named_steps["scaler"].scale_.tolist()
        bloques[nombre] = b_
    nombres = list(ct.get_feature_names_out())
    return {
        "version": artefacto.version, "variante": artefacto.variante, "algoritmo": type(modelo).__name__,
        "columnas_entrada": artefacto.columnas_entrada, "numericas_crudas": config.NUM_COLS_RAW,
        "rango_edad": {"bins": config.RANGO_EDAD_BINS, "etiquetas": config.RANGO_EDAD_LABELS},
        "capping": {c: list(v) for c, v in pipe.named_steps["capping"].limites_.items()},
        "preprocesador": bloques, "orden_salida": nombres,
        "variable_original": [variable_original(n) for n in nombres],
        "coeficientes": modelo.coef_[0].tolist(), "intercepto": float(modelo.intercept_[0]),
        "calibracion": {"a": a, "b": b},
        "umbrales": artefacto.umbrales.como_dict() | {"aprobar_exacto": artefacto.umbrales.aprobar,
                                                      "rechazar_exacto": artefacto.umbrales.rechazar},
        "explicador": {"media_z": artefacto.explicador.media_z.tolist(), "base_logit": artefacto.explicador.base_logit},
    }


def exportar_texto(art_texto: Any) -> dict[str, Any]:
    """Vocabulario, idf y coeficientes del TF-IDF + LR calibrado, más el léxico de sentimiento."""
    cal = art_texto.modelo
    pipe = cal.calibrated_classifiers_[0].estimator
    a, b = _sigmoide(cal)
    tfidf, clf = pipe.named_steps["tfidf"], pipe.named_steps["clf"]
    vocab = sorted(tfidf.vocabulary_.items(), key=lambda kv: kv[1])
    return {
        "ngramas": list(tfidf.ngram_range), "token_pattern": tfidf.token_pattern, "norma": tfidf.norm,
        "sublinear_tf": tfidf.sublinear_tf, "stopwords": sorted(STOPWORDS_ES),
        "vocabulario": [t for t, _ in vocab], "idf": tfidf.idf_.tolist(),
        "coeficientes": clf.coef_[0].tolist(), "intercepto": float(clf.intercept_[0]),
        "calibracion": {"a": a, "b": b},
        "umbrales": art_texto.umbrales.como_dict() | {"aprobar_exacto": art_texto.umbrales.aprobar,
                                                      "rechazar_exacto": art_texto.umbrales.rechazar},
        "lexico": {"positivas": sorted(POSITIVAS), "negativas": sorted(NEGATIVAS)},
        "texto_faltante": config.TEXTO_FALTANTE,
    }


def golden(artefactos: dict[str, Any], test: pd.DataFrame) -> dict[str, Any]:
    """Casos de referencia calculados por Python que el motor TS debe reproducir (|Δ| < 1e-6)."""
    art, txt = artefactos["artefacto"], artefactos["modelo_texto"]
    cols = config.INPUT_COLS + [config.SENSITIVE_COL, config.TEXT_COL]
    muestra = test.sample(300, random_state=config.RANDOM_STATE)[cols]
    clientes = [{k: (None if pd.isna(v) else (v.item() if hasattr(v, "item") else v)) for k, v in r.items()}
                for r in muestra.to_dict("records")]
    rng = np.random.default_rng(config.RANDOM_STATE)
    opcionales = ["situacion_laboral", "antiguedad_laboral_anios", "tipo_vivienda", "ingreso_mensual",
                  "relacion_deuda_ingreso", "puntaje_buro", "texto_solicitud", "sexo"]
    for c in clientes[:60]:  # faltantes: ejercitan la imputación del pipeline
        for k in rng.choice(opcionales, size=2, replace=False):
            c[str(k)] = None
    clientes += list(CLIENTES_DEMO.values())
    X = art.a_dataframe(clientes)
    p = art.modelo.predict_proba(X)[:, 1]
    salidas = art.predecir(clientes)
    textos = (test[config.TEXT_COL].dropna().drop_duplicates().sample(45, random_state=config.RANDOM_STATE).tolist()
              + ["Me atrasé en pagos por pérdida de empleo y quiero consolidar deudas.",
                 "Tengo un empleo estable y ahorros; el crédito es para estudiar una maestría.",
                 "", "ÑANDÚ Árbol ñoño — ¿crédito? ¡Sí! 123 abc_def", config.TEXTO_FALTANTE])
    p_txt = txt.modelo.predict_proba(pd.Series(textos))[:, 1]
    casos = zip(clientes, p, salidas, strict=True)
    casos_texto = zip(textos, p_txt, strict=True)
    return {"clientes": [{"entrada": c, "p": float(pi), "salida": s} for c, pi, s in casos],
            "textos": [{"texto": t, "p": float(pi), "salida": txt.predecir(t)} for t, pi in casos_texto]}


# --------------------------------------------------------------------------- agregados (DuckDB)
def agregados(crudo: pd.DataFrame, train: pd.DataFrame, test: pd.DataFrame) -> dict[str, Any]:
    """Resumen del dataset y tasas por segmento calculados con SQL en DuckDB (ADR-007)."""
    con = duckdb.connect()
    Y = f'"{config.TARGET}"'  # "default" es palabra reservada en SQL
    con.register("crudo", crudo)
    con.register("procesado", pd.concat([train.assign(conjunto="train"), test.assign(conjunto="test")]))
    resumen = con.sql(f"""SELECT count(*) AS filas, count(DISTINCT {config.ID_COL}) AS ids_unicos,
                         avg({Y}) AS tasa_impago FROM crudo""").df().iloc[0].to_dict()
    nulos = {c: int(crudo[c].isna().sum()) for c in crudo.columns if crudo[c].isna().any()}
    por_categoria = {}
    for c in config.CAT_COLS + ["rango_edad", "sexo"]:
        por_categoria[c] = con.sql(f"""SELECT {c} AS categoria, count(*) AS n, avg({Y}) AS tasa_impago
                                       FROM procesado GROUP BY 1 ORDER BY tasa_impago DESC""").df().to_dict("records")
    por_decil = {}
    for c in ["puntaje_buro", "relacion_deuda_ingreso", "uso_cupo_tarjetas", "ratio_cuota_ingreso", "ingreso_mensual",
              "edad", "moras_ultimos_12m"]:
        por_decil[c] = con.sql(f"""WITH d AS (SELECT ntile(10) OVER (ORDER BY {c}) AS decil, {c} AS v, {Y} AS y
                                   FROM procesado) SELECT decil, min(v) AS desde, max(v) AS hasta, count(*) AS n,
                                   avg(y) AS tasa_impago FROM d GROUP BY decil ORDER BY decil""").df()
        por_decil[c] = por_decil[c].to_dict("records")
    histogramas = {}
    for c in config.NUM_COLS_RAW + ["cuota_estimada", "ratio_cuota_ingreso", "ratio_monto_ingreso"]:
        v = train[c].dropna().to_numpy()
        lo, hi = np.quantile(v, [0.005, 0.995])
        y_nn = train.loc[train[c].notna(), config.TARGET].to_numpy()
        cnt0, bordes = np.histogram(v[y_nn == 0], 30, (lo, hi))
        cnt1, _ = np.histogram(v[y_nn == 1], 30, (lo, hi))
        histogramas[c] = {"bordes": bordes.round(4).tolist(), "pago": cnt0.tolist(), "impago": cnt1.tolist()}
    corr = train[config.NUM_MODELO + [config.TARGET]].corr(method="spearman").round(4)
    return {"resumen": resumen, "nulos_crudo": nulos, "por_categoria": por_categoria, "por_decil": por_decil,
            "histogramas": histogramas, "correlacion_spearman": {"variables": corr.columns.tolist(),
                                                                 "matriz": corr.to_numpy().tolist()}}


def nube_pca(artefacto: Any, train: pd.DataFrame, test: pd.DataFrame) -> dict[str, Any]:
    """Proyección PCA 2D real de los 12.000 clientes (matriz preprocesada del modelo servido)."""
    from sklearn.decomposition import PCA

    pipe = _pipeline_de(artefacto.modelo)
    datos = pd.concat([train, test], ignore_index=True)
    Z = pipe.named_steps["preprocessor"].transform(pipe.named_steps["capping"].transform(
        pipe.named_steps["features"].transform(datos)))
    pca = PCA(2, random_state=config.RANDOM_STATE).fit(Z[: len(train)])
    P = pca.transform(Z)
    p = artefacto.modelo.predict_proba(datos)[:, 1]
    banda = np.where(p < artefacto.umbrales.aprobar, 0, np.where(p > artefacto.umbrales.rechazar, 2, 1))
    return {"varianza_explicada": pca.explained_variance_ratio_.round(4).tolist(), "n": int(len(datos)),
            "columnas": ["x", "y", "default", "banda", "test"],
            "puntos": np.column_stack([P.round(3), datos[config.TARGET].to_numpy(), banda,
                                       np.r_[np.zeros(len(train)), np.ones(len(test))]]).tolist()}


# --------------------------------------------------------------------------- notebooks → reproductor
def _sanear_html(html: str) -> str:
    from bs4 import BeautifulSoup

    permitidas = {"table", "thead", "tbody", "tr", "th", "td", "div", "span", "p", "b", "strong", "em", "code",
                  "br", "small", "sup", "sub"}
    soup = BeautifulSoup(html, "html.parser")
    for t in soup.find_all(["style", "script", "iframe", "link"]):
        t.decompose()
    for t in soup.find_all(True):
        if t.name not in permitidas:
            t.unwrap()
            continue
        t.attrs = {k: v for k, v in t.attrs.items() if k in ("colspan", "rowspan")}
    return str(soup).strip()


def _texto(v: Any) -> str:
    return "".join(v) if isinstance(v, list) else str(v)


def exportar_notebook(path: Path, destino: Path) -> dict[str, Any]:
    """Convierte un .ipynb ejecutado en el JSON del reproductor (salidas reales + duración real)."""
    from PIL import Image

    nb = json.loads(path.read_text(encoding="utf-8"))
    pref = path.name[:2]
    celdas, n_img, dur_total = [], 0, 0.0
    for i, c in enumerate(nb["cells"]):
        tags = c.get("metadata", {}).get("tags", [])
        if "injected-parameters" in tags:
            continue
        fuente = _texto(c.get("source", ""))
        if c["cell_type"] == "markdown":
            celdas.append({"tipo": "markdown", "fuente": fuente})
            continue
        salidas = []
        hay_figura = any(MIME_FIGURA in (o.get("data") or {}) for o in c.get("outputs", []))
        for o in c.get("outputs", []):
            ot = o.get("output_type")
            if ot == "stream":
                salidas.append({"tipo": "stream", "nombre": o.get("name", "stdout"),
                                "texto": _texto(o.get("text", ""))})
            elif ot in ("execute_result", "display_data"):
                data = o.get("data", {})
                if MIME_FIGURA in data:
                    spec = data[MIME_FIGURA]
                    spec = json.loads(spec) if isinstance(spec, str) else spec
                    spec["notebook"], spec["celda"] = pref, i
                    salidas.append({"tipo": "figura", "spec": spec})
                    FIGURAS.append(spec)
                elif "image/png" in data:
                    img = Image.open(io.BytesIO(base64.b64decode(_texto(data["image/png"]))))
                    nombre = f"{pref}_c{i:02d}_{n_img:02d}.webp"
                    (destino / "img").mkdir(parents=True, exist_ok=True)
                    img.save(destino / "img" / nombre, "WEBP", quality=88, method=6)
                    # Con figura nativa en la celda, el PNG de matplotlib queda solo como referencia.
                    salidas.append({"tipo": "imagen", "src": f"run/notebooks/img/{nombre}", "ancho": img.width,
                                    "alto": img.height, "referencia": hay_figura})
                    n_img += 1
                elif "text/html" in data:
                    salidas.append({"tipo": "html", "html": _sanear_html(_texto(data["text/html"]))})
                elif "text/markdown" in data:
                    salidas.append({"tipo": "markdown", "texto": _texto(data["text/markdown"])})
                elif "text/plain" in data:
                    salidas.append({"tipo": "texto", "texto": _texto(data["text/plain"])})
            elif ot == "error":
                salidas.append({"tipo": "error", "texto": f"{o.get('ename')}: {o.get('evalue')}"})
        dur = float(c.get("metadata", {}).get("papermill", {}).get("duration") or 0.0)
        dur_total += dur
        celdas.append({"tipo": "codigo", "fuente": fuente, "ejecucion": c.get("execution_count"),
                       "duracion_s": round(dur, 3), "parametros": "parameters" in tags, "salidas": salidas})
    titulo = next((ln.lstrip("# ").strip() for c in celdas if c["tipo"] == "markdown"
                   for ln in c["fuente"].splitlines() if ln.startswith("# ")), path.stem)
    out = {"archivo": path.name, "titulo": titulo, "kernel": nb.get("metadata", {}).get("kernelspec", {}),
           "duracion_total_s": round(dur_total, 1), "celdas": celdas}
    guardar_json(out, destino / f"{pref}.json", indent=None)
    return {"id": pref, "archivo": path.name, "titulo": titulo, "celdas": len(celdas),
            "celdas_codigo": sum(c["tipo"] == "codigo" for c in celdas), "imagenes": n_img,
            "duracion_total_s": round(dur_total, 1)}


# --------------------------------------------------------------------------- capturas reales de la API
def capturas_api() -> dict[str, Any]:
    """Levanta la API en el mismo proceso y graba peticiones/respuestas reales con su latencia."""
    from fastapi.testclient import TestClient

    from api.main import app

    pedidos: list[tuple[str, str, str, Any]] = [
        ("health", "GET", "/health", None),
        ("model_info", "GET", "/model/info", None),
        *[(f"predict_{k}", "POST", "/predict", v) for k, v in CLIENTES_DEMO.items()],
        ("predict_422", "POST", "/predict", dict(CLIENTES_DEMO["medio"], edad=999, proposito="Viajes")),
        ("predict_text", "POST", "/predict/text", {"texto": CLIENTES_DEMO["alto"]["texto_solicitud"]}),
        ("predict_batch", "POST", "/predict/batch", {"clientes": list(CLIENTES_DEMO.values())}),
    ]
    out = []
    with TestClient(app) as cli:
        cli.get("/health")  # calentamiento
        for nombre, metodo, ruta, cuerpo in pedidos:
            t0 = time.perf_counter()
            r = cli.request(metodo, ruta, json=cuerpo)
            ms = (time.perf_counter() - t0) * 1000
            out.append({"nombre": nombre, "metodo": metodo, "ruta": ruta, "peticion": cuerpo, "estado": r.status_code,
                        "latencia_ms": round(ms, 1), "respuesta": r.json(),
                        "request_id": r.headers.get("X-Request-ID")})
        openapi = app.openapi()
    return {"capturado": datetime.now().isoformat(timespec="seconds"),
            "servidor": "FastAPI (TestClient, mismo proceso)", "llamadas": out, "openapi": openapi}


def esquemas() -> None:
    """JSON Schema de los contratos (resultados y API) para generar tipos TypeScript en el front."""
    from api import schemas as api_schemas
    from credit_risk.schemas_resultados import ESQUEMAS

    SCHEMAS.mkdir(parents=True, exist_ok=True)
    for nombre, modelo in ESQUEMAS.items():
        guardar_json(modelo.model_json_schema(), SCHEMAS / f"{nombre}.schema.json")
    for nombre in ["ClienteRequest", "PrediccionResponse", "TextoResponse", "HealthResponse"]:
        guardar_json(getattr(api_schemas, nombre).model_json_schema(), SCHEMAS / f"{nombre}.schema.json")


# --------------------------------------------------------------------------- orquestación
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sin-notebooks", action="store_true", help="no reconvierte los notebooks")
    args = ap.parse_args(argv)
    t0 = time.perf_counter()
    GEN.mkdir(parents=True, exist_ok=True)
    (RUN / "data").mkdir(parents=True, exist_ok=True)
    artefactos = cargar_artefactos()
    card, art = artefactos["card"], artefactos["artefacto"]
    crudo = cargar_datos()
    train, test = cargar_procesados()
    print(f"Modelo {card['version']} · exportando paquete de corrida…")

    guardar_json(exportar_modelo(art), GEN / "modelo_export.json")
    guardar_json(exportar_texto(artefactos["modelo_texto"]), GEN / "texto_export.json")
    guardar_json(golden(artefactos, test), GEN / "golden.json", indent=None)
    guardar_json({k: v for k, v in CLIENTES_DEMO.items()}, GEN / "clientes_demo.json")
    guardar_json(card, GEN / "model_card.json")
    print("  ✔ modelo, texto, golden y card")

    for origen, nombre in [(config.RAW_DATA_PATH, "credit_risk.csv"), (config.PROCESSED_DIR / "train.csv", "train.csv"),
                           (config.PROCESSED_DIR / "test.csv", "test.csv")]:
        shutil.copyfile(origen, RUN / "data" / nombre)
    guardar_json(agregados(crudo, train, test), GEN / "agregados.json")
    guardar_json(nube_pca(art, train, test), RUN / "nube_pca.json", indent=None)
    print("  ✔ CSV, agregados DuckDB y nube PCA")

    for nombre in ["resultados_clasicos", "resultados_dl", "resultados_nlp", "resultados_spark"]:
        p = config.MODEL_DIR / f"{nombre}.json"
        if p.exists():
            shutil.copyfile(p, GEN / f"{nombre}.json")
    for origen, nombre in [(config.REPORTS_DIR / "evaluacion_final.json", "evaluacion_final.json"),
                           (config.REPORTS_DIR / "dod_status.json", "dod_status.json"),
                           (config.REPORTS_DIR / "ejecuciones.json", "ejecuciones.json")]:
        if origen.exists():
            shutil.copyfile(origen, GEN / nombre)
    log = config.REPORTS_DIR / "train_log.jsonl"
    if log.exists():
        guardar_json([json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()],
                     GEN / "train_log.json")
    guardar_json(capturas_api(), GEN / "api_capturas.json")
    esquemas()
    print("  ✔ resultados, log de entrenamiento, capturas reales de la API y esquemas")

    if not args.sin_notebooks:
        destino = RUN / "notebooks"
        if destino.exists():
            shutil.rmtree(destino)
        destino.mkdir(parents=True)
        FIGURAS.clear()
        indice = [exportar_notebook(nb, destino) for nb in sorted(config.NOTEBOOKS_DIR.glob("[0-9][0-9]_*.ipynb"))]
        guardar_json(indice, GEN / "notebooks.json")
        guardar_json(FIGURAS, RUN / "figuras.json", indent=None)
        print(f"  ✔ {len(indice)} notebooks para el reproductor y {len(FIGURAS)} figuras nativas")

    archivos = {}
    for base in (GEN, RUN):
        for f in sorted(base.rglob("*")):
            if f.is_file() and f.name != "manifest.json":
                archivos[f.relative_to(config.FRONT_DIR).as_posix()] = {"sha256": hash_archivo(f),
                                                                        "bytes": f.stat().st_size}
    manifest = {"version": __version__, "card_version": card["version"], "git_sha": _git_sha(),
                "generado": datetime.now().isoformat(timespec="seconds"),
                "datos": {"crudo_sha256": hash_archivo(config.RAW_DATA_PATH),
                          "train_sha256": card["datos"]["hash_train_sha256"],
                          "test_sha256": card["datos"]["hash_test_sha256"]},
                "archivos": archivos}
    guardar_json(sin_nan(manifest), GEN / "manifest.json")
    print(f"Paquete listo: {len(archivos)} archivos en {time.perf_counter() - t0:.0f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())

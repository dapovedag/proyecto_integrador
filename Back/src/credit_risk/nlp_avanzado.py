"""NLP con modelos preentrenados (paso 7; IA3.1, IA3.E1): BERT, sentence-transformers y GPT-2. Solo notebooks.

- Se infiere una sola vez por texto ÚNICO (el dataset tiene muchos textos repetidos) y se cachea en
  ``db/processed/nlp_features.parquet`` por hash del texto normalizado y firma de los modelos.
- En Windows, torch debe cargarse ANTES que scikit-learn (si no, ``c10.dll`` falla con WinError 1114):
  en los notebooks se usa ``setup(torch_primero=True)``; este módulo además intenta importar torch al
  inicio, antes de importar ``credit_risk.nlp`` (que carga scikit-learn).
- Sin APIs de pago: todos los modelos son locales y gratuitos (Hugging Face).
- La API nunca importa este módulo (usa ``credit_risk.nlp``, sin torch).
"""

from __future__ import annotations

import hashlib
import os
import time
from collections.abc import Sequence
from functools import lru_cache
from typing import Any

os.environ.setdefault("HF_HUB_VERBOSITY", "error")  # sin avisos del Hub en las salidas de los notebooks
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

try:  # torch antes que scikit-learn (ver docstring)
    import torch as _torch_mod  # noqa: F401
except (ImportError, OSError):  # pragma: no cover - sin el extra [nlp] o DLL ya en conflicto
    _torch_mod = None  # type: ignore[assignment]

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from credit_risk import config
from credit_risk.features import Winsorizer, build_feature_step, build_preprocessor, columnas_modelo
from credit_risk.nlp import normalizar

MODELO_SENTIMIENTO = "nlptown/bert-base-multilingual-uncased-sentiment"
MODELO_EMBEDDINGS = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MODELO_GPT = "datificate/gpt2-small-spanish"
MODELO_GPT_RESPALDO = "gpt2"  # si el GPT-2 en español no está disponible (se documenta en el notebook)
MAX_LENGTH = 64
CACHE = config.PROCESSED_DIR / "nlp_features.parquet"
COLS_SENTIMIENTO = [f"bert_p{k}" for k in range(1, 6)] + ["bert_estrellas"]
EMBEDDINGS = ("emb_st", "emb_gpt2")

#: Segundos de inferencia por modelo y textos nuevos de la última llamada a ``features_texto``.
ULTIMA_INFERENCIA: dict[str, float] = {}


# --------------------------------------------------------------------------- carga de modelos
def _torch() -> Any:
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    import torch

    torch.manual_seed(config.RANDOM_STATE)  # hilos: el valor por defecto de torch (núcleos físicos)
    return torch


def _orden_longitud(textos: Sequence[str]) -> np.ndarray:
    """Índices que ordenan los textos por longitud: lotes de largo parecido = menos relleno (padding)."""
    return np.argsort([len(t) for t in textos], kind="stable")


@lru_cache(maxsize=1)
def cargar_bert() -> tuple[Any, Any]:
    """Tokenizador y modelo de sentimiento (1–5 estrellas), en modo evaluación. Se carga una vez."""
    _torch()
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    tok = AutoTokenizer.from_pretrained(MODELO_SENTIMIENTO)
    return tok, AutoModelForSequenceClassification.from_pretrained(MODELO_SENTIMIENTO).eval()


@lru_cache(maxsize=1)
def cargar_sentence() -> Any:
    """Modelo de sentence-transformers multilingüe (MiniLM, 384 dimensiones). Se carga una vez."""
    _torch()
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODELO_EMBEDDINGS, device="cpu")


@lru_cache(maxsize=1)
def cargar_gpt2() -> tuple[Any, Any, str]:
    """Tokenizador, modelo y nombre del GPT-2 usado (español; si falla, ``gpt2`` en inglés)."""
    _torch()
    from transformers import AutoModel, AutoTokenizer

    for nombre in (MODELO_GPT, MODELO_GPT_RESPALDO):
        try:
            tok = AutoTokenizer.from_pretrained(nombre)
            mod = AutoModel.from_pretrained(nombre).eval()
        except OSError:
            continue
        tok.pad_token = tok.pad_token or tok.eos_token
        tok.padding_side = "right"
        return tok, mod, nombre
    raise OSError(f"No se pudo cargar {MODELO_GPT} ni {MODELO_GPT_RESPALDO}")


def firma_modelos() -> str:
    """Identifica la combinación de modelos y ``max_length`` con la que se calculó la caché."""
    return f"{MODELO_SENTIMIENTO}|{MODELO_EMBEDDINGS}|{cargar_gpt2()[2]}|{MAX_LENGTH}"


# --------------------------------------------------------------------------- inferencia
def hash_texto(t: str | None) -> str:
    """Identificador estable de un texto (normalizado)."""
    return hashlib.sha1(normalizar(t).encode("utf-8")).hexdigest()[:16]


def sentimiento_bert(textos: list[str], batch: int = 32, max_length: int = MAX_LENGTH) -> pd.DataFrame:
    """Probabilidades de 1 a 5 estrellas y valor esperado (BERT multilingüe afinado en reseñas)."""
    torch = _torch()
    tok, mod = cargar_bert()
    orden = _orden_longitud(textos)
    ordenados = [textos[j] for j in orden]
    probs = []
    with torch.inference_mode():
        for i in range(0, len(ordenados), batch):
            enc = tok(ordenados[i:i + batch], padding=True, truncation=True, max_length=max_length,
                      return_tensors="pt")
            probs.append(torch.softmax(mod(**enc).logits, dim=-1).numpy())
    P = np.empty((len(textos), 5), dtype=np.float32)
    P[orden] = np.vstack(probs)
    df = pd.DataFrame(P, columns=COLS_SENTIMIENTO[:5])
    df["bert_estrellas"] = P @ np.arange(1, 6)
    return df


def embeddings_sentence(textos: list[str], batch: int = 64) -> np.ndarray:
    """Embeddings de oración (MiniLM multilingüe, 384 dimensiones, norma 1)."""
    _torch()
    return np.asarray(cargar_sentence().encode(textos, batch_size=batch, show_progress_bar=False,
                                               normalize_embeddings=True), dtype=np.float32)


def embeddings_gpt2(textos: list[str], batch: int = 32, max_length: int = MAX_LENGTH) -> np.ndarray:
    """Promedio (con máscara de atención) del último estado oculto de GPT-2 (768 dimensiones)."""
    torch = _torch()
    tok, mod, _ = cargar_gpt2()
    orden = _orden_longitud(textos)
    ordenados = [textos[j] for j in orden]
    salida = []
    with torch.inference_mode():
        for i in range(0, len(ordenados), batch):
            enc = tok(ordenados[i:i + batch], padding=True, truncation=True, max_length=max_length,
                      return_tensors="pt")
            h = mod(**enc).last_hidden_state
            m = enc["attention_mask"].unsqueeze(-1).float()
            salida.append(((h * m).sum(1) / m.sum(1)).numpy())
    E = np.empty((len(textos), mod.config.hidden_size), dtype=np.float32)
    E[orden] = np.vstack(salida)
    return E


def _entrada(textos: Sequence[str | None]) -> list[str]:
    return [normalizar(t) or "sin texto" for t in textos]


def features_texto(textos: pd.Series, usar_cache: bool = True) -> pd.DataFrame:
    """Sentimiento BERT y embeddings (ST y GPT-2) por fila, calculados sobre textos únicos y cacheados.

    Devuelve una fila por texto de entrada (mismo orden) con ``hash``, ``bert_p1..p5``, ``bert_estrellas``,
    ``emb_st`` (vector 384) y ``emb_gpt2`` (vector 768). Solo infiere los textos que no están en la caché
    con la misma firma de modelos; los tiempos quedan en ``ULTIMA_INFERENCIA``.
    """
    firma = firma_modelos()
    hashes = textos.map(hash_texto)
    cache = pd.read_parquet(CACHE) if usar_cache and CACHE.exists() else pd.DataFrame({"hash": [], "firma": []})
    cache = cache[cache["firma"] == firma] if "firma" in cache else cache.iloc[0:0]
    faltan = (pd.DataFrame({"hash": hashes.to_numpy(), "texto": textos.to_numpy()})
              .drop_duplicates("hash").loc[lambda d: ~d["hash"].isin(cache["hash"])])
    ULTIMA_INFERENCIA.clear()
    ULTIMA_INFERENCIA.update({"textos_unicos": float(hashes.nunique()), "textos_nuevos": float(len(faltan))})
    if len(faltan):
        lista = _entrada(faltan["texto"].tolist())
        t0 = time.perf_counter()
        nuevo = sentimiento_bert(lista)
        ULTIMA_INFERENCIA["bert_s"] = time.perf_counter() - t0
        nuevo.insert(0, "hash", faltan["hash"].to_numpy())
        t0 = time.perf_counter()
        nuevo["emb_st"] = list(embeddings_sentence(lista))
        ULTIMA_INFERENCIA["sentence_s"] = time.perf_counter() - t0
        t0 = time.perf_counter()
        nuevo["emb_gpt2"] = list(embeddings_gpt2(lista))
        ULTIMA_INFERENCIA["gpt2_s"] = time.perf_counter() - t0
        nuevo["firma"] = firma
        cache = pd.concat([cache, nuevo], ignore_index=True) if len(cache) else nuevo
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        cache.to_parquet(CACHE, index=False)
    return pd.DataFrame({"hash": hashes.to_numpy()}).merge(cache.drop(columns="firma"), on="hash", how="left")


def medir_inferencia(textos: Sequence[str | None], n: int = 256) -> pd.DataFrame:
    """Tiempo de carga y de inferencia (sin caché) de BERT, sentence-transformers y GPT-2 sobre ``n`` textos."""
    muestra = _entrada(list(textos)[:n])
    pasos = [
        ("BERT sentimiento", MODELO_SENTIMIENTO, cargar_bert, lambda: sentimiento_bert(muestra), 5),
        ("Sentence-transformers", MODELO_EMBEDDINGS, cargar_sentence, lambda: embeddings_sentence(muestra), 384),
        ("GPT-2", None, cargar_gpt2, lambda: embeddings_gpt2(muestra), 768),
    ]
    filas = []
    for nombre, id_hf, cargar, inferir, dim in pasos:
        t0 = time.perf_counter()
        cargado = cargar()
        carga = time.perf_counter() - t0
        t0 = time.perf_counter()
        inferir()
        inf = time.perf_counter() - t0
        filas.append({"modelo": nombre, "id_hugging_face": id_hf or cargado[2], "dimension_salida": dim,
                      "carga_s": round(carga, 2), "textos": len(muestra), "inferencia_s": round(inf, 2),
                      "ms_por_texto": round(1000 * inf / max(len(muestra), 1), 2)})
    return pd.DataFrame(filas)


# --------------------------------------------------------------------------- variables para modelos
def matriz(feats: pd.DataFrame, columna: str) -> np.ndarray:
    """Convierte una columna de vectores (``emb_st`` o ``emb_gpt2``) en una matriz ``n × d``."""
    return np.vstack(feats[columna].to_numpy()).astype(np.float32)


def expandir(feats: pd.DataFrame, embeddings: Sequence[str] = EMBEDDINGS) -> pd.DataFrame:
    """Sentimiento + embeddings en columnas planas (``emb_st_000``, ...) para unir a las variables tabulares."""
    partes = [feats[COLS_SENTIMIENTO].reset_index(drop=True)]
    for col in embeddings:
        M = matriz(feats, col)
        partes.append(pd.DataFrame(M, columns=[f"{col}_{j:03d}" for j in range(M.shape[1])]))
    return pd.concat(partes, axis=1)


def clasificador_embeddings(C: float = 1.0) -> Pipeline:
    """Estandarización + regresión logística (sin pesos de clase: probabilidades comparables al umbral 0,25)."""
    return Pipeline([("escala", StandardScaler()),
                     ("clf", LogisticRegression(C=C, max_iter=5000, random_state=config.RANDOM_STATE))])


def build_pipeline_combinado(modelo: Any, columnas_sentimiento: Sequence[str], columnas_embedding: Sequence[str],
                             n_componentes: int = 10, excluir: Sequence[str] = ()) -> Pipeline:
    """Pipeline tabular servido (derivadas → capping → preprocesador) + sentimiento + PCA de embeddings.

    El PCA y las escalas se ajustan dentro del pipeline (solo con la partición de entrenamiento de cada fold),
    de modo que la comparación con el modelo tabular no tiene fuga de información.
    """
    cols = columnas_modelo(excluir)
    tabulares = cols["numericas"] + cols["nominales"] + cols["ordinales"]
    union = ColumnTransformer([
        ("tabular", build_preprocessor(excluir), tabulares),
        ("sentimiento", Pipeline([("imputer", SimpleImputer(strategy="median")), ("escala", StandardScaler())]),
         list(columnas_sentimiento)),
        ("embedding", Pipeline([("escala", StandardScaler()),
                                ("pca", PCA(n_components=n_componentes, random_state=config.RANDOM_STATE)),
                                ("escala_pca", StandardScaler())]), list(columnas_embedding)),
    ])
    return Pipeline([("features", build_feature_step()), ("capping", Winsorizer()),
                     ("preprocessor", union), ("model", modelo)])


# --------------------------------------------------------------------------- evaluación y gráficos
def delta_auc_bootstrap(y: np.ndarray, p_base: np.ndarray, p_nuevo: np.ndarray, n_boot: int = 1000,
                        alpha: float = 0.05, semilla: int = config.RANDOM_STATE
                        ) -> tuple[dict[str, float], np.ndarray]:
    """ΔAUC = AUC(nuevo) − AUC(base) con IC percentil por bootstrap pareado (mismas filas para ambos).

    Devuelve el resumen (valor, IC, AUC de cada modelo, réplicas válidas y fracción de réplicas con ΔAUC ≤ 0)
    y el vector de ΔAUC de las réplicas (para graficar su distribución).
    """
    y, p_base, p_nuevo = np.asarray(y), np.asarray(p_base, float), np.asarray(p_nuevo, float)
    rng = np.random.default_rng(semilla)
    auc_b, auc_n = roc_auc_score(y, p_base), roc_auc_score(y, p_nuevo)
    deltas = []
    for _ in range(n_boot):
        i = rng.integers(0, len(y), len(y))
        if y[i].min() == y[i].max():
            continue
        deltas.append(roc_auc_score(y[i], p_nuevo[i]) - roc_auc_score(y[i], p_base[i]))
    d = np.asarray(deltas)
    lo, hi = np.quantile(d, [alpha / 2, 1 - alpha / 2])
    return {"valor": round(float(auc_n - auc_b), 4), "ic_inferior": round(float(lo), 4),
            "ic_superior": round(float(hi), 4), "auc_base": round(float(auc_b), 4),
            "auc_nuevo": round(float(auc_n), 4), "n_bootstrap": float(len(d)),
            "prob_delta_no_positivo": round(float((d <= 0).mean()), 4)}, d


def proyeccion_2d(X: np.ndarray, y: np.ndarray, n_muestra: int = 1500,
                  semilla: int = config.RANDOM_STATE) -> tuple[list[list[float]], list[float]]:
    """PCA a 2 dimensiones (ajustado con todas las filas) de una muestra de ≤ ``n_muestra`` puntos.

    Devuelve ``[[x, y, default], ...]`` y la varianza explicada por cada componente.
    """
    pca = PCA(n_components=2, random_state=semilla).fit(X)
    idx = np.random.default_rng(semilla).choice(len(X), size=min(n_muestra, len(X)), replace=False)
    Z = pca.transform(X[idx])
    puntos = [[round(float(a), 4), round(float(b), 4), int(c)] for (a, b), c in zip(Z, np.asarray(y)[idx], strict=True)]
    return puntos, pca.explained_variance_ratio_.round(4).tolist()

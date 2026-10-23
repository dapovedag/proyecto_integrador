"""Redes neuronales en TensorFlow/Keras (paso 6; IA3.2, IA3.E2). Import perezoso de TensorFlow.

- MLP base (Dense + BatchNormalization + Dropout) sobre la matriz tabular preprocesada.
- CNN 1D sobre el vector de características reformado a ``(n_features, 1)``.
- RNN (GRU bidireccional) sobre el texto de la solicitud (TextVectorization → Embedding → GRU).
- Híbrido texto + tabular con la API funcional de Keras (dos entradas, una salida).

El preprocesamiento tabular es el MISMO del modelo servido (``features.build_pipeline`` sin el modelo),
ajustado solo con datos de entrenamiento.

**Orden de importación (Windows).** TensorFlow debe cargarse ANTES que scikit-learn: con el orden inverso la
DLL ``_pywrap_tensorflow_internal`` falla al inicializarse (mismo síntoma que torch, ADR-006). Por eso este
módulo no importa scikit-learn al cargarse y el notebook llama a :func:`keras_tf` antes que a todo lo demás.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any

import numpy as np

from credit_risk import config

if TYPE_CHECKING:  # solo para anotaciones: no carga sklearn ni pandas al importar el módulo
    import pandas as pd
    from sklearn.pipeline import Pipeline


def keras_tf() -> Any:
    """Importa TensorFlow y Keras 3 (backend ``tensorflow``) y fija la semilla global de Python/NumPy/TF.

    Se llama al construir y al entrenar cada red, de modo que cada una parte del mismo estado aleatorio sin
    importar el orden de las celdas (reproducibilidad).
    """
    os.environ.setdefault("KERAS_BACKEND", "tensorflow")
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
    import tensorflow as tf

    tf.get_logger().setLevel("ERROR")
    import keras

    keras.utils.set_random_seed(config.RANDOM_STATE)
    return keras


def version_backend() -> str:
    """Texto ``"tensorflow X.Y.Z"`` del backend realmente cargado."""
    keras = keras_tf()
    import tensorflow as tf

    return f"{keras.backend.backend()} {tf.__version__}"


# --------------------------------------------------------------------------- datos
def preprocesador_tabular() -> Pipeline:
    """Mismo preprocesamiento que el modelo servido (derivadas → capping → imputación/escalado/one-hot)."""
    from sklearn.pipeline import Pipeline

    from credit_risk.features import Winsorizer, build_feature_step, build_preprocessor

    return Pipeline([("features", build_feature_step()), ("capping", Winsorizer()),
                     ("preprocessor", build_preprocessor())])


def textos_entrada(textos: pd.Series) -> Any:
    """Textos normalizados (minúsculas, sin tildes; faltante → ``""``) como tensor ``tf.string`` ``(n, 1)``.

    Keras 3 no acepta arreglos NumPy de texto (``dtype`` object/str) en ``fit``; un tensor de TensorFlow sí.
    """
    keras_tf()
    import tensorflow as tf

    from credit_risk.nlp import normalizar

    return tf.constant([[normalizar(t)] for t in textos], dtype=tf.string)


def pesos_clase(y: np.ndarray) -> dict[int, float]:
    """``class_weight`` balanceado para el desbalance (≈35,6 % de impago): cada clase pesa lo mismo."""
    y = np.asarray(y)
    n, pos = len(y), int(y.sum())
    return {0: n / (2 * (n - pos)), 1: n / (2 * pos)}


def corregir_prior(p: np.ndarray, prevalencia: float, prior_entrenamiento: float = 0.5) -> np.ndarray:
    """Deshace el cambio de prior que introduce ``class_weight`` balanceado (Saerens et al., 2002).

    Con pesos balanceados la red aprende como si la prevalencia fuera ``prior_entrenamiento`` (50 %), así que
    sus probabilidades quedan infladas. Se corrigen las *odds*: ``odds_real = odds_red · (π/(1−π)) /
    (π_w/(1−π_w))``. Es monótona (no cambia el AUC) y usa solo la prevalencia de train.
    """
    p = np.clip(np.asarray(p, dtype=float), 1e-7, 1 - 1e-7)
    odds = p / (1 - p) * (prevalencia / (1 - prevalencia)) / (prior_entrenamiento / (1 - prior_entrenamiento))
    return odds / (1 + odds)


# --------------------------------------------------------------------------- arquitecturas
def _vectorizador(keras: Any, textos_train: Any, vocab: int, largo: int) -> Any:
    """TextVectorization adaptada SOLO con los textos de entrenamiento (sin fuga de validación ni test)."""
    import tensorflow as tf

    capa = keras.layers.TextVectorization(max_tokens=vocab, output_sequence_length=largo, name="vectorizar")
    capa.adapt(tf.reshape(tf.convert_to_tensor(textos_train, dtype=tf.string), [-1]))
    return capa


def construir_mlp(n_features: int) -> Any:
    """Perceptrón multicapa de referencia: Dense(64) → BatchNorm → Dropout → Dense(32) → Dropout → sigmoide."""
    keras = keras_tf()
    L = keras.layers
    entrada = keras.Input((n_features,), name="tabular")
    x = L.Dense(64, activation="relu")(entrada)
    x = L.BatchNormalization()(x)
    x = L.Dropout(0.3)(x)
    x = L.Dense(32, activation="relu")(x)
    x = L.Dropout(0.2)(x)
    salida = L.Dense(1, activation="sigmoid", name="prob_default")(x)
    return _compilar(keras.Model(entrada, salida, name="MLP"))


def construir_cnn1d(n_features: int) -> Any:
    """CNN 1D: el vector de características se trata como una secuencia ``(n_features, 1)``."""
    keras = keras_tf()
    L = keras.layers
    entrada = keras.Input((n_features, 1), name="tabular_secuencia")
    x = L.Conv1D(32, 3, padding="same", activation="relu")(entrada)
    x = L.BatchNormalization()(x)
    x = L.Conv1D(64, 3, padding="same", activation="relu")(x)
    x = L.GlobalMaxPooling1D()(x)
    x = L.Dropout(0.3)(x)
    x = L.Dense(32, activation="relu")(x)
    salida = L.Dense(1, activation="sigmoid", name="prob_default")(x)
    return _compilar(keras.Model(entrada, salida, name="CNN1D"))


def construir_gru_texto(textos_train: Any, vocab: int = 3000, largo: int = 32) -> Any:
    """RNN sobre el texto: TextVectorization → Embedding → GRU bidireccional → sigmoide."""
    keras = keras_tf()
    L = keras.layers
    vectorizar = _vectorizador(keras, textos_train, vocab, largo)
    entrada = keras.Input((1,), dtype="string", name="texto")
    x = vectorizar(entrada)
    x = L.Embedding(vocab, 32, mask_zero=True, name="embedding")(x)
    x = L.Bidirectional(L.GRU(32), name="gru_bidireccional")(x)
    x = L.Dropout(0.3)(x)
    salida = L.Dense(1, activation="sigmoid", name="prob_default")(x)
    return _compilar(keras.Model(entrada, salida, name="GRU_texto"))


def construir_hibrido(n_features: int, textos_train: Any, vocab: int = 3000, largo: int = 32) -> Any:
    """API funcional: rama tabular (Dense) + rama de texto (GRU) → concatenación → sigmoide."""
    keras = keras_tf()
    L = keras.layers
    ent_tab = keras.Input((n_features,), name="tabular")
    t = L.Dense(64, activation="relu")(ent_tab)
    t = L.BatchNormalization()(t)
    t = L.Dropout(0.3)(t)
    ent_txt = keras.Input((1,), dtype="string", name="texto")
    s = _vectorizador(keras, textos_train, vocab, largo)(ent_txt)
    s = L.Embedding(vocab, 16, mask_zero=True, name="embedding")(s)
    s = L.Bidirectional(L.GRU(16), name="gru_bidireccional")(s)
    x = L.Concatenate(name="fusion")([t, s])
    x = L.Dense(32, activation="relu")(x)
    x = L.Dropout(0.2)(x)
    salida = L.Dense(1, activation="sigmoid", name="prob_default")(x)
    return _compilar(keras.Model([ent_tab, ent_txt], salida, name="Hibrido_texto_tabular"))


def _compilar(modelo: Any) -> Any:
    keras = keras_tf()
    modelo.compile(optimizer=keras.optimizers.Adam(1e-3), loss="binary_crossentropy",
                   metrics=[keras.metrics.AUC(name="auc"), keras.metrics.Precision(name="precision"),
                            keras.metrics.Recall(name="recall")])
    return modelo


def arquitectura(modelo: Any) -> str:
    """Descripción compacta (capa, tipo, forma de salida y parámetros), legible en el front."""
    lineas = [f"{modelo.name} · {modelo.count_params():,} parámetros entrenables y no entrenables"]
    for capa in modelo.layers:
        try:
            forma = tuple(capa.output.shape)
        except (AttributeError, ValueError):
            forma = ()
        lineas.append(f"{capa.name} ({type(capa).__name__}) → {forma} · {capa.count_params():,} parámetros")
    return "\n".join(lineas)


# --------------------------------------------------------------------------- entrenamiento
def entrenar(modelo: Any, X_tr: Any, y_tr: np.ndarray, X_va: Any, y_va: np.ndarray, epocas: int = 60,
             paciencia: int = 8, checkpoint: Path | None = None, batch: int = 128) -> dict[str, Any]:
    """Entrena con ``class_weight``, EarlyStopping (restaura los mejores pesos) y ModelCheckpoint.

    Ambos callbacks monitorean el AUC de validación. Devuelve el historial por época, la duración y la
    mejor época.
    """
    keras = keras_tf()
    cbs = [keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=paciencia,
                                         restore_best_weights=True)]
    if checkpoint is not None:
        checkpoint.parent.mkdir(parents=True, exist_ok=True)
        cbs.append(keras.callbacks.ModelCheckpoint(str(checkpoint), monitor="val_auc", mode="max",
                                                   save_best_only=True))
    t0 = time.perf_counter()
    h = modelo.fit(X_tr, y_tr, validation_data=(X_va, y_va), epochs=epocas, batch_size=batch,
                   class_weight=pesos_clase(y_tr), callbacks=cbs, verbose=0)
    dur = time.perf_counter() - t0
    hist = {k: [round(float(v), 5) for v in vals] for k, vals in h.history.items()}
    mejor = int(np.argmax(hist["val_auc"]))
    return {"historial": hist, "epocas": len(hist["loss"]), "duracion_s": round(dur, 1),
            "mejor_epoca": mejor + 1, "val_auc": hist["val_auc"][mejor]}


def predecir(modelo: Any, X: Any, batch: int = 512) -> np.ndarray:
    """Probabilidad de impago (salida sigmoide) como vector 1D."""
    return np.asarray(modelo.predict(X, batch_size=batch, verbose=0)).ravel()


def evaluar(modelo: Any, X: Any, y: np.ndarray, umbral: float) -> tuple[dict[str, float], np.ndarray]:
    """Métricas de test (las mismas del paso 5) y probabilidades."""
    from credit_risk.models import metricas

    p = predecir(modelo, X)
    return metricas(y, p, umbral), p

"""Explicabilidad local y global (paso 8; IA1.3).

Para un modelo lineal calibrado con ``ensemble=False`` y calibración sigmoide, el logit de la
probabilidad servida es ``-(a·f(x) + b)`` con ``f(x) = Σ β_j z_j + β_0``. Por tanto la contribución
de cada variable, medida contra el individuo promedio de train, es exacta y aditiva:

    c_j = -a · β_j · (z_j - z̄_j)      y      logit(p) = base + Σ c_j

Para modelos no lineales se usa una atribución por sustitución (cambiar la variable por su valor de
referencia de train y medir el cambio del logit), que es indicativa y no aditiva.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from credit_risk import config
from credit_risk.features import variable_original
from credit_risk.models import estimador_base


def _logit(p: np.ndarray) -> np.ndarray:
    p = np.clip(np.asarray(p, dtype=float), 1e-9, 1 - 1e-9)
    return np.log(p / (1 - p))


def _pipeline_de(modelo: Any) -> Any:
    """Pipeline sin calibrar (desenvuelve ``CalibratedClassifierCV`` y ``Reweighing``)."""
    base = estimador_base(modelo)
    return getattr(base, "estimator_", base)


def _sigmoide(modelo: Any) -> tuple[float, float]:
    """Parámetros (a, b) de la calibración sigmoide; (−1, 0) si el modelo no está calibrado."""
    if hasattr(modelo, "calibrated_classifiers_"):
        cal = modelo.calibrated_classifiers_[0].calibrators[0]
        return float(cal.a_), float(cal.b_)
    return -1.0, 0.0


class Explicador:
    """Contribuciones locales en log-odds de la probabilidad calibrada, agregadas por variable original."""

    def __init__(self, modelo: Any, X_train: pd.DataFrame) -> None:
        pipe = _pipeline_de(modelo)
        self.lineal = hasattr(pipe.named_steps["model"], "coef_")
        self.a, self.b = _sigmoide(modelo)
        Z = self._transformar(pipe, X_train)
        self.columnas = list(pipe.named_steps["preprocessor"].get_feature_names_out())
        self.media_z = Z.mean(axis=0)
        self.referencia = {
            c: (float(pd.to_numeric(X_train[c], errors="coerce").median()) if c in config.NUM_COLS_RAW
                else str(X_train[c].mode().iloc[0]))
            for c in config.INPUT_COLS
        }
        if self.lineal:
            m = pipe.named_steps["model"]
            self.coef = m.coef_[0].astype(float)
            self.intercepto = float(m.intercept_[0])
            self.base_logit = float(-(self.a * (self.coef @ self.media_z + self.intercepto) + self.b))

    @staticmethod
    def _transformar(pipe: Any, X: pd.DataFrame) -> np.ndarray:
        Xf = pipe.named_steps["capping"].transform(pipe.named_steps["features"].transform(X))
        return np.asarray(pipe.named_steps["preprocessor"].transform(Xf), dtype=float)

    def contribuciones(self, modelo: Any, X: pd.DataFrame, top: int | None = None) -> list[list[dict[str, Any]]]:
        """Lista (una por fila de ``X``) de ``{variable, contribucion, efecto}`` ordenada por magnitud."""
        if self.lineal:
            Z = self._transformar(_pipeline_de(modelo), X)
            C = -self.a * self.coef * (Z - self.media_z)
            filas = []
            for fila in C:
                agg: dict[str, float] = {}
                for nombre, c in zip(self.columnas, fila, strict=True):
                    v = variable_original(nombre)
                    agg[v] = agg.get(v, 0.0) + float(c)
                filas.append(agg)
        else:
            filas = self._por_sustitucion(modelo, X)
        salida = []
        for agg in filas:
            orden = sorted(agg.items(), key=lambda kv: abs(kv[1]), reverse=True)
            if top:
                orden = orden[:top]
            salida.append([{"variable": k, "contribucion": round(v, 4),
                            "efecto": "aumenta_riesgo" if v > 0 else "reduce_riesgo"} for k, v in orden])
        return salida

    def _por_sustitucion(self, modelo: Any, X: pd.DataFrame) -> list[dict[str, float]]:
        base = _logit(modelo.predict_proba(X)[:, 1])
        out: list[dict[str, float]] = [{} for _ in range(len(X))]
        for c, ref in self.referencia.items():
            Xr = X.copy()
            Xr[c] = ref
            delta = base - _logit(modelo.predict_proba(Xr)[:, 1])
            for i, dv in enumerate(delta):
                out[i][c] = float(dv)
        return out


def importancia_permutacion(modelo: Any, X: pd.DataFrame, y: np.ndarray, n_repeats: int = 5,
                            muestra: int = 3000) -> pd.DataFrame:
    """Importancia global por permutación (caída de ROC-AUC) sobre las variables de entrada."""
    from sklearn.inspection import permutation_importance

    Xs = X[config.INPUT_COLS]
    if len(Xs) > muestra:
        idx = np.random.default_rng(config.RANDOM_STATE).choice(len(Xs), muestra, replace=False)
        Xs, y = Xs.iloc[idx], np.asarray(y)[idx]
    r = permutation_importance(modelo, Xs, y, scoring="roc_auc", n_repeats=n_repeats,
                               random_state=config.RANDOM_STATE, n_jobs=1)
    return (pd.DataFrame({"variable": Xs.columns, "importancia": r.importances_mean,
                          "desviacion": r.importances_std})
            .sort_values("importancia", ascending=False).reset_index(drop=True))

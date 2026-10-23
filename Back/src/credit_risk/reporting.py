"""Estilo visual único de las figuras (el mismo lenguaje del front editorial oscuro) y exportes JSON."""

from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

# Tokens de diseño compartidos con Front/src/styles/tokens.css
PALETA = {
    "fondo": "#0E0F13",
    "panel": "#16171D",
    "rejilla": "#2A2C36",
    "texto": "#E7E7EA",
    "texto_suave": "#9A9CA8",
    "acento": "#505CFD",
    "programacion": "#F97316",  # módulo 1 (naranja, como en el enunciado)
    "ia": "#8B5CF6",            # módulo 2 (morado)
    "bajo": "#34D399",
    "medio": "#FBBF24",
    "alto": "#F87171",
    "pago": "#60A5FA",
    "impago": "#F87171",
}
SERIE = ["#505CFD", "#F97316", "#34D399", "#8B5CF6", "#FBBF24", "#22D3EE", "#F472B6", "#A3E635"]


def aplicar_estilo() -> None:
    """Estilo de Matplotlib/Seaborn coherente con el front (fondo oscuro, acento índigo)."""
    import matplotlib as mpl
    import seaborn as sns
    from cycler import cycler

    sns.set_theme(style="darkgrid", palette=SERIE)
    mpl.rcParams.update({
        "figure.facecolor": PALETA["fondo"], "axes.facecolor": PALETA["panel"],
        "savefig.facecolor": PALETA["fondo"], "axes.edgecolor": PALETA["rejilla"],
        "grid.color": PALETA["rejilla"], "grid.linewidth": 0.6,
        "text.color": PALETA["texto"], "axes.labelcolor": PALETA["texto"],
        "axes.titlecolor": PALETA["texto"], "xtick.color": PALETA["texto_suave"],
        "ytick.color": PALETA["texto_suave"], "legend.facecolor": PALETA["panel"],
        "legend.edgecolor": PALETA["rejilla"], "legend.labelcolor": PALETA["texto"],
        "axes.titleweight": "bold", "axes.titlesize": 12, "axes.labelsize": 10,
        "figure.dpi": 110, "figure.autolayout": True,
        "axes.prop_cycle": cycler(color=SERIE), "font.family": "DejaVu Sans",
    })


def tema_plotnine() -> Any:
    """Tema de plotnine (gramática de ggplot2) con los mismos tokens."""
    from plotnine import element_blank, element_line, element_rect, element_text, theme, theme_minimal

    return theme_minimal() + theme(
        plot_background=element_rect(fill=PALETA["fondo"], color=PALETA["fondo"]),
        panel_background=element_rect(fill=PALETA["panel"], color=PALETA["panel"]),
        panel_grid_major=element_line(color=PALETA["rejilla"]), panel_grid_minor=element_blank(),
        text=element_text(color=PALETA["texto"]), axis_text=element_text(color=PALETA["texto_suave"]),
        strip_text=element_text(color=PALETA["texto"], weight="bold"),
        plot_title=element_text(weight="bold", size=12), figure_size=(9, 4.5), dpi=110,
    )


def _a_json(o: Any) -> Any:
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return None if np.isnan(o) else float(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (pd.Series,)):
        return o.tolist()
    if isinstance(o, pd.DataFrame):
        return o.to_dict(orient="records")
    if isinstance(o, (date, datetime)):
        return o.isoformat()
    if isinstance(o, Path):
        return o.as_posix()
    if is_dataclass(o) and not isinstance(o, type):
        return asdict(o)
    if hasattr(o, "model_dump"):
        return o.model_dump()
    raise TypeError(f"No serializable: {type(o).__name__}")


def sin_nan(o: Any) -> Any:
    """Convierte recursivamente NaN/inf en ``None`` (JSON estricto, legible por el front)."""
    if isinstance(o, dict):
        return {str(k): sin_nan(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [sin_nan(v) for v in o]
    if isinstance(o, (float, np.floating)):
        return None if not np.isfinite(o) else float(o)
    if isinstance(o, (np.ndarray, pd.Series, pd.DataFrame)) or (is_dataclass(o) and not isinstance(o, type)):
        return sin_nan(_a_json(o))
    return o


def guardar_json(obj: Any, ruta: str | Path, indent: int | None = 2) -> Path:
    """Escribe JSON UTF-8 estricto (sin NaN) convirtiendo tipos de numpy/pandas; crea la carpeta."""
    p = Path(ruta)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(sin_nan(obj), f, ensure_ascii=False, indent=indent, default=_a_json, allow_nan=False)
    return p


MIME_FIGURA = "application/vnd.creditrisk.figura+json"
TIPOS_FIGURA = ("lineas", "area", "barras", "barras_h", "histograma", "dispersion", "boxplot", "heatmap",
                "matriz_confusion", "curva_roc", "curva_pr", "calibracion", "dona", "kpi", "tabla")


def figura_front(tipo: str, titulo: str, datos: dict[str, Any], *, ejes: dict[str, str] | None = None,
                 clave: str | None = None, nota: str | None = None, opciones: dict[str, Any] | None = None) -> None:
    """Adjunta a la salida de la celda los DATOS de la figura para que el front la redibuje con su diseño.

    El PNG de matplotlib queda como referencia; el front renderiza esta especificación de forma nativa e
    interactiva. Se llama en la misma celda que dibuja la figura (una vez por panel). Formas de ``datos``:

    - ``lineas``/``area``: ``{"series": [{"nombre", "x": [...], "y": [...]}]}`` (+ ``referencias``: líneas
      verticales/horizontales ``[{"eje": "x"|"y", "valor", "etiqueta"}]`` y ``bandas``
      ``[{"desde","hasta","etiqueta"}]``).
    - ``barras``/``barras_h``: ``{"categorias": [...], "series": [{"nombre", "valores": [...]}]}``.
    - ``histograma``: ``{"bordes": [...], "series": [{"nombre", "conteos": [...]}]}``.
    - ``dispersion``: ``{"series": [{"nombre", "puntos": [[x, y], ...]}]}``.
    - ``boxplot``: ``{"categorias": [...], "series": [{"nombre", "cajas": [[min, q1, mediana, q3, max], ...]}]}``.
    - ``heatmap``: ``{"x": [...], "y": [...], "valores": [[...], ...]}``.
    - ``matriz_confusion``: ``{"etiquetas": [...], "valores": [[...], ...]}``.
    - ``curva_roc``/``curva_pr``/``calibracion``: como ``lineas`` (x = FPR/recall/prob. media).
    - ``dona``: ``{"categorias": [...], "valores": [...]}``. ``kpi``: ``{"items": [{"etiqueta", "valor", "formato"}]}``.
    - ``tabla``: ``{"columnas": [...], "filas": [[...], ...]}``.
    """
    if tipo not in TIPOS_FIGURA:
        raise ValueError(f"tipo de figura no soportado por el front: {tipo}")
    from IPython.display import display

    spec = sin_nan({"tipo": tipo, "titulo": titulo, "ejes": ejes or {}, "datos": datos, "clave": clave,
                    "nota": nota, "opciones": opciones or {}})
    display({MIME_FIGURA: spec, "text/plain": ""}, raw=True)  # invisible en Jupyter; lo lee el exportador


def leer_json(ruta: str | Path) -> Any:
    """Lee un JSON UTF-8."""
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)

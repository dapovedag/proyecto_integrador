"""Definición de hecho automatizada (docs/gestion/definicion_de_hecho.md, nivel notebook y artefactos).

Uso:  python scripts/verificar_dod.py [--estricto]
Escribe ``Back/reports/dod_status.json`` (lo consume el front) y, con ``--estricto``, sale con código 1
si algún criterio falla.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

BACK = Path(__file__).resolve().parents[1]
NOTEBOOKS = BACK / "notebooks"
MODELS = BACK / "models"
REPORTES = BACK / "reports"
RUTA_ABSOLUTA = re.compile(r"([A-Za-z]:[\\/]{1,2}(Users|Program Files)|/home/[a-z]|/Users/[A-Za-z])")
IDS = re.compile(r"\b(PF1|E[1-5]|F[1-5]|R[1-4]|P[12]\.(\d|E\d)|IA[1-3]\.(\d|E\d))\b")

ARTEFACTOS_POR_NOTEBOOK = {
    "03": ["../db/processed/train.csv", "../db/processed/test.csv", "../db/processed/feature_list.json"],
    "05": ["models/resultados_clasicos.json"],
    "06": ["models/resultados_dl.json", "models/red_neuronal.keras"],
    "07": ["models/resultados_nlp.json", "../db/processed/nlp_features.parquet"],
    "08": ["models/modelo_final.joblib", "models/model_card.json"],
    "09": ["models/resultados_spark.json"],
}


def _texto(celda: dict[str, Any]) -> str:
    s = celda.get("source", "")
    return "".join(s) if isinstance(s, list) else s


def _salidas_texto(celda: dict[str, Any]) -> str:
    partes = []
    for o in celda.get("outputs", []):
        partes.append("".join(o.get("text", "")) if isinstance(o.get("text"), list) else str(o.get("text", "")))
        for k, v in (o.get("data") or {}).items():
            if k.startswith("text/"):
                partes.append("".join(v) if isinstance(v, list) else str(v))
    return "\n".join(partes)


def revisar_notebook(path: Path) -> dict[str, bool]:
    """Criterios de la DoD para un notebook ejecutado."""
    nb = json.loads(path.read_text(encoding="utf-8"))
    celdas = nb.get("cells", [])
    codigo = [c for c in celdas if c["cell_type"] == "code" and _texto(c).strip()]
    md = [c for c in celdas if c["cell_type"] == "markdown"]
    con_imagen = [i for i, c in enumerate(celdas) if c["cell_type"] == "code"
                  and any("image/png" in (o.get("data") or {}) for o in c.get("outputs", []))]
    todo = "\n".join(_texto(c) + "\n" + _salidas_texto(c) for c in celdas)
    return {
        "ejecutado": bool(codigo) and all(c.get("execution_count") is not None for c in codigo),
        "sin_errores": not any(o.get("output_type") == "error" for c in codigo for o in c.get("outputs", [])),
        "kernel_credit_risk": nb.get("metadata", {}).get("kernelspec", {}).get("name") == "credit-risk",
        "celda_ids": bool(celdas) and celdas[0]["cell_type"] == "markdown" and bool(IDS.search(_texto(celdas[0]))),
        "conclusiones": bool(md) and "conclusi" in _texto(md[-1]).lower(),
        "importa_credit_risk": any("credit_risk" in _texto(c) for c in codigo),
        "sin_rutas_absolutas": not RUTA_ABSOLUTA.search(todo),
        "figuras_interpretadas": all(i + 1 < len(celdas) and celdas[i + 1]["cell_type"] == "markdown"
                                     for i in con_imagen),
        "artefactos": all((BACK / a).resolve().exists()
                          for a in ARTEFACTOS_POR_NOTEBOOK.get(path.name[:2], [])),
    }


def _git_sha() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=BACK, capture_output=True,
                              text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "desconocido"


if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--estricto", action="store_true")
    args = ap.parse_args(argv)
    sys.path.insert(0, str(BACK / "src"))
    from credit_risk import __version__

    resultado: dict[str, Any] = {"verificado": datetime.now().isoformat(timespec="seconds"),
                                 "commit": _git_sha(), "version": __version__, "notebooks": {}}
    fallos = 0
    for nb in sorted(NOTEBOOKS.glob("[0-9][0-9]_*.ipynb")):
        crit = revisar_notebook(nb)
        resultado["notebooks"][nb.name] = crit
        malos = [k for k, v in crit.items() if not v]
        fallos += len(malos)
        print(f"{'✔' if not malos else '✘'} {nb.name:<45} {', '.join(malos) or 'cumple la DoD'}")
    card_path = MODELS / "model_card.json"
    card = json.loads(card_path.read_text(encoding="utf-8")) if card_path.exists() else {}
    resultado["modelo"] = {"card_version_coincide": card.get("version") == __version__,
                           "protocolo_documentado": bool(card.get("protocolo")),
                           "equidad_documentada": "equidad_test" in card}
    fallos += sum(not v for v in resultado["modelo"].values())
    resultado["fallos"] = fallos
    REPORTES.mkdir(parents=True, exist_ok=True)
    (REPORTES / "dod_status.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nModelo: {resultado['modelo']}\nFallos totales: {fallos}")
    return 1 if (fallos and args.estricto) else 0


if __name__ == "__main__":
    sys.exit(main())

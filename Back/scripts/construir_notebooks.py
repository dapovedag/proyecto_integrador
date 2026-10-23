"""Construye los ``.ipynb`` a partir de su fuente en formato *percent* (``Back/notebooks/src/*.py``).

La fuente es Python legible y revisable en diffs; el ``.ipynb`` es el entregable que se ejecuta con
papermill y se guarda con salidas. Formato de la fuente::

    # %% [markdown]
    # # Título
    # Texto en Markdown (cada línea empieza con "# ").

    # %% tags=["parameters"]
    FAST = False

    # %%
    código Python

Uso:  python scripts/construir_notebooks.py [prefijos...]   (por defecto, todos)
Las salidas existentes NO se conservan: tras construir hay que ejecutar ``ejecutar_notebooks.py``.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

BACK = Path(__file__).resolve().parents[1]
SRC = BACK / "notebooks" / "src"
DESTINO = BACK / "notebooks"
MARCA = re.compile(r"^# %%(?P<md> \[markdown\])?(?: tags=(?P<tags>\[.*\]))?\s*$")


def parsear(texto: str) -> list[nbformat.NotebookNode]:
    """Divide la fuente en celdas Markdown y de código."""
    celdas: list[nbformat.NotebookNode] = []
    actual: list[str] = []
    tipo, tags = "code", []

    def cerrar() -> None:
        cuerpo = "\n".join(actual).strip("\n")
        if not cuerpo.strip():
            return
        if tipo == "markdown":
            lineas = [ln[2:] if ln.startswith("# ") else ln[1:] if ln.startswith("#") else ln
                      for ln in cuerpo.split("\n")]
            celdas.append(new_markdown_cell("\n".join(lineas)))
        else:
            celda = new_code_cell(cuerpo)
            if tags:
                celda.metadata["tags"] = tags
            celdas.append(celda)

    for linea in texto.splitlines():
        m = MARCA.match(linea)
        if m:
            cerrar()
            actual = []
            tipo = "markdown" if m.group("md") else "code"
            tags = json.loads(m.group("tags")) if m.group("tags") else []
        else:
            actual.append(linea)
    cerrar()
    return celdas


def construir(fuente: Path) -> Path:
    """Escribe el ``.ipynb`` con kernel ``credit-risk`` y metadatos de lenguaje."""
    nb = new_notebook(cells=parsear(fuente.read_text(encoding="utf-8")))
    nb.metadata["kernelspec"] = {"name": "credit-risk", "display_name": "credit-risk (Python 3.10)",
                                 "language": "python"}
    nb.metadata["language_info"] = {"name": "python", "version": "3.10"}
    salida = DESTINO / f"{fuente.stem}.ipynb"
    nbformat.validate(nb)
    nbformat.write(nb, salida)
    return salida


def sincronizar_markdown(fuente: Path) -> Path:
    """Copia el Markdown de la fuente al ``.ipynb`` ejecutado sin tocar código ni salidas.

    Sirve para redactar las conclusiones DESPUÉS de ver las salidas reales. Falla si el código cambió
    (en ese caso hay que reconstruir y volver a ejecutar).
    """
    destino = DESTINO / f"{fuente.stem}.ipynb"
    nuevo = parsear(fuente.read_text(encoding="utf-8"))
    nb = nbformat.read(destino, as_version=4)
    propias = [c for c in nb.cells if "injected-parameters" not in c.get("metadata", {}).get("tags", [])]
    if [c.cell_type for c in nuevo] != [c.cell_type for c in propias]:
        raise ValueError(f"{fuente.name}: cambió la estructura de celdas; reconstruya y ejecute de nuevo")
    for a, b in zip(nuevo, propias, strict=True):
        if a.cell_type == "code" and a.source != b.source:
            raise ValueError(f"{fuente.name}: cambió el código; reconstruya y ejecute de nuevo")
        if a.cell_type == "markdown":
            b.source = a.source
    nbformat.write(nb, destino)
    return destino


if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("prefijos", nargs="*")
    ap.add_argument("--solo-markdown", action="store_true",
                    help="actualiza solo el Markdown del .ipynb ya ejecutado (conserva salidas)")
    args = ap.parse_args(argv)
    fuentes = sorted(SRC.glob("[0-9][0-9]_*.py"))
    if args.prefijos:
        fuentes = [f for f in fuentes if f.name[:2] in args.prefijos]
    for f in fuentes:
        if args.solo_markdown:
            print(f"{f.name} → {sincronizar_markdown(f).name} (Markdown sincronizado)")
        else:
            print(f"{f.name} → {construir(f).name} ({len(parsear(f.read_text(encoding='utf-8')))} celdas)")
    return 0 if fuentes else 1


if __name__ == "__main__":
    sys.exit(main())

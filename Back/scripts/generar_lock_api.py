"""Genera ``requirements-api.lock``: el cierre de dependencias de la API con versiones exactas.

Recorre los metadatos de los paquetes instalados en el venv a partir de las raíces de la API y evalúa los
marcadores de entorno para **Linux / CPython 3.10** (la imagen Docker), así el lock sirve aunque se genere
en Windows. Falla si una dependencia necesaria en Linux no está instalada localmente (hay que fijarla a mano).

Uso:  python scripts/generar_lock_api.py
"""

from __future__ import annotations

import sys
from importlib import metadata
from pathlib import Path

from packaging.markers import default_environment
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

BACK = Path(__file__).resolve().parents[1]
RAICES = ["numpy", "pandas", "scipy", "scikit-learn", "joblib", "pydantic", "fastapi", "uvicorn"]
ENTORNO_LINUX = default_environment() | {"sys_platform": "linux", "platform_system": "Linux", "os_name": "posix",
                                         "platform_machine": "x86_64", "python_version": "3.10",
                                         "python_full_version": "3.10.15", "implementation_name": "cpython"}


def cierre(raices: list[str]) -> dict[str, str]:
    """Nombre canónico → versión instalada de todas las dependencias transitivas aplicables en Linux."""
    pendientes, vistos, faltan = list(raices), {}, []
    while pendientes:
        nombre = canonicalize_name(pendientes.pop())
        if nombre in vistos:
            continue
        try:
            dist = metadata.distribution(nombre)
        except metadata.PackageNotFoundError:
            faltan.append(nombre)
            continue
        vistos[nombre] = dist.version
        for req_txt in dist.requires or []:
            req = Requirement(req_txt)
            if req.marker is None or req.marker.evaluate(ENTORNO_LINUX | {"extra": ""}):
                pendientes.append(req.name)
    if faltan:
        raise SystemExit(f"Dependencias de Linux no instaladas localmente (fíjelas a mano): {sorted(set(faltan))}")
    return vistos


def main() -> int:
    pins = cierre(RAICES)
    lineas = ["# Generado por scripts/generar_lock_api.py — cierre exacto de la API para la imagen Docker (Linux).",
              *[f"{n}=={v}" for n, v in sorted(pins.items())]]
    (BACK / "requirements-api.lock").write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print(f"requirements-api.lock: {len(pins)} paquetes")
    return 0


if __name__ == "__main__":
    sys.exit(main())

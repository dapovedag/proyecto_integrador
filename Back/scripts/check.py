"""Gate de calidad local (DoD de código y release): un solo comando que debe quedar en verde.

Uso (desde la raíz o desde Back/, con el venv):  python Back/scripts/check.py [--sin-front] [--rapido]

Pasos: ruff → mypy → pytest con cobertura (≥ 80 % en el núcleo) → verificar_dod (estricto) →
front: build + pruebas (paridad golden incluida).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

BACK = Path(__file__).resolve().parents[1]
FRONT = BACK.parent / "Front"
PY = sys.executable

if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def paso(nombre: str, cmd: list[str], cwd: Path) -> bool:
    """Ejecuta un paso del gate y reporta su resultado y duración."""
    print(f"\n▶ {nombre}: {' '.join(cmd)}", flush=True)
    t0 = time.perf_counter()
    ok = subprocess.run(cmd, cwd=cwd).returncode == 0
    print(f"{'✔' if ok else '✘'} {nombre} ({time.perf_counter() - t0:.0f} s)", flush=True)
    return ok


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sin-front", action="store_true")
    ap.add_argument("--rapido", action="store_true", help="excluye las pruebas marcadas como lentas")
    args = ap.parse_args(argv)
    pytest = [PY, "-m", "pytest", "-p", "no:cacheprovider", "--cov", "--cov-report=term-missing:skip-covered",
              "--cov-fail-under=80", "-W", "ignore::DeprecationWarning"]
    if args.rapido:
        pytest += ["-m", "not slow"]
    pasos = [
        ("ruff", [PY, "-m", "ruff", "check", "src", "api", "scripts", "tests", "train.py"], BACK),
        ("mypy", [PY, "-m", "mypy", "src", "api"], BACK),
        ("pytest + cobertura", pytest, BACK),
        ("definición de hecho", [PY, "scripts/verificar_dod.py", "--estricto"], BACK),
    ]
    npm = shutil.which("npm")
    if not args.sin_front and npm:
        pasos += [("front: build", [npm, "run", "build"], FRONT), ("front: pruebas", [npm, "test"], FRONT)]
    resultados = {n: paso(n, c, d) for n, c, d in pasos}
    print("\nResumen:", " · ".join(f"{'✔' if v else '✘'} {k}" for k, v in resultados.items()))
    return 0 if all(resultados.values()) else 1


if __name__ == "__main__":
    sys.exit(main())

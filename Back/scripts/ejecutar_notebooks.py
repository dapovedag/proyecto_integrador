"""Ejecuta los notebooks con papermill, en serie y con lock, y registra la duración real de cada uno.

Uso (desde ``Back/`` con el venv activo):
    python scripts/ejecutar_notebooks.py                 # 01→08 y 00 (nb09 corre en Docker)
    python scripts/ejecutar_notebooks.py 05 06 --rapido  # solo esos, en modo FAST
    python scripts/ejecutar_notebooks.py 09 --docker     # nb09 dentro del contenedor de PySpark

Los notebooks se ejecutan en su sitio (las salidas quedan guardadas) y luego se sanean: ninguna ruta
absoluta de la máquina queda en el archivo.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

BACK = Path(__file__).resolve().parents[1]
RAIZ = BACK.parent
NOTEBOOKS = BACK / "notebooks"
REPORTES = BACK / "reports"
LOCK = REPORTES / ".ejecucion.lock"
ORDEN = ["01", "02", "03", "04", "05", "06", "07", "08", "00"]
KERNEL = "credit-risk"


def buscar(prefijo: str) -> Path:
    """Notebook cuyo nombre empieza por el prefijo (p. ej. '05')."""
    hits = sorted(NOTEBOOKS.glob(f"{prefijo}_*.ipynb"))
    if not hits:
        raise FileNotFoundError(f"No hay notebook {prefijo}_*.ipynb")
    return hits[0]


def sanear(path: Path) -> int:
    """Reemplaza rutas absolutas de la máquina por rutas relativas en fuentes y salidas."""
    texto = path.read_text(encoding="utf-8")
    reemplazos = 0
    for base, nuevo in [(str(RAIZ), "."), (str(Path.home()), "~")]:
        for variante in {base, base.replace("\\", "/"), base.replace("\\", "\\\\")}:
            reemplazos += texto.count(variante)
            texto = texto.replace(variante, nuevo)
    texto, n = re.subn(r"[A-Za-z]:\\\\Users\\\\[^\\\"]+", "~", texto)
    path.write_text(texto, encoding="utf-8")
    return reemplazos + n


def _reemplazar(origen: Path, destino: Path, intentos: int = 10) -> None:
    """Reemplazo atómico con reintentos (en Windows otro proceso puede tener el archivo abierto un instante)."""
    for i in range(intentos):
        try:
            os.replace(origen, destino)
            return
        except PermissionError:
            time.sleep(0.5 * (i + 1))
    os.replace(origen, destino)


def ejecutar_local(nb: Path, rapido: bool, timeout: int) -> None:
    """Ejecuta sobre una copia temporal y la publica al final: el original nunca queda a medio escribir."""
    import papermill as pm

    tmp_dir = NOTEBOOKS / ".ejecucion"
    tmp_dir.mkdir(exist_ok=True)
    salida = tmp_dir / nb.name
    try:
        pm.execute_notebook(str(nb), str(salida), parameters={"FAST": rapido}, kernel_name=KERNEL,
                            cwd=str(NOTEBOOKS), progress_bar=False, request_save_on_cell_execute=False,
                            execution_timeout=timeout)
    finally:
        if salida.exists():
            _reemplazar(salida, nb)  # también si falló: el error queda guardado en el notebook


def ejecutar_docker(nb: Path, rapido: bool) -> None:
    """Ejecuta el notebook dentro del contenedor de PySpark (ADR-005); ``--build`` reusa la caché de capas."""
    cmd = ["docker", "compose", "-f", str(BACK / "docker-compose.spark.yml"), "run", "--rm", "--build", "-T",
           "spark", f"notebooks/{nb.name}", "--fast" if rapido else "--completo"]
    subprocess.run(cmd, check=True, cwd=BACK)


if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("prefijos", nargs="*", help="prefijos de notebook (por defecto, todos menos 09)")
    ap.add_argument("--rapido", action="store_true", help="parámetro FAST=True (prueba de humo)")
    ap.add_argument("--docker", action="store_true", help="ejecutar dentro del contenedor de PySpark")
    ap.add_argument("--timeout", type=int, default=3600, help="segundos máximos por celda")
    ap.add_argument("--esperar", action="store_true",
                    help="espera (hasta 3 h) a que se libere el lock en vez de abortar")
    args = ap.parse_args(argv)

    REPORTES.mkdir(parents=True, exist_ok=True)
    if args.esperar:
        limite = time.time() + 3 * 3600
        while LOCK.exists() and time.time() < limite:
            time.sleep(15)
    if LOCK.exists():
        print(f"Otra ejecución está en curso ({LOCK.read_text(encoding='utf-8')}). Abortado.")
        return 2
    LOCK.write_text(f"pid={os.getpid()} desde {datetime.now():%Y-%m-%d %H:%M:%S}", encoding="utf-8")
    registro_path = REPORTES / "ejecuciones.json"
    registro = json.loads(registro_path.read_text(encoding="utf-8")) if registro_path.exists() else {}
    fallos = 0
    try:
        for pref in args.prefijos or ORDEN:
            nb = buscar(pref)
            t0 = time.perf_counter()
            print(f"▶ {nb.name} ...", flush=True)
            try:
                (ejecutar_docker if args.docker or pref == "09" else ejecutar_local)(
                    nb, args.rapido, *([] if args.docker or pref == "09" else [args.timeout]))
                estado = "ok"
            except Exception as e:  # noqa: BLE001 — se registra y se sigue con el siguiente
                estado = f"error: {type(e).__name__}: {str(e)[:300]}"
                fallos += 1
            dur = round(time.perf_counter() - t0, 1)
            n = sanear(nb)
            registro[nb.name] = {"estado": estado, "duracion_s": dur, "modo": "rapido" if args.rapido else "completo",
                                 "fecha": datetime.now().isoformat(timespec="seconds"), "rutas_saneadas": n}
            registro_path.write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  {estado} en {dur} s", flush=True)
    finally:
        LOCK.unlink(missing_ok=True)
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())

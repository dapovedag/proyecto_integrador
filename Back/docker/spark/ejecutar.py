"""Punto de entrada del contenedor de PySpark (ADR-005): ejecuta un notebook con papermill en su sitio.

Uso (dentro del contenedor, ``cwd=/work/Back``)::

    python docker/spark/ejecutar.py notebooks/09_spark_big_data.ipynb --fast       # prueba de humo
    python docker/spark/ejecutar.py notebooks/09_spark_big_data.ipynb --completo   # ejecución real

Desde el host se lanza con ``python scripts/ejecutar_notebooks.py 09 [--rapido]`` (registra la duración y
sanea rutas) o con ``docker compose -f docker-compose.spark.yml run --rm spark <notebook> --completo``.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

BACK = Path("/work/Back")
KERNEL = "credit-risk"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("notebook", nargs="?", default="notebooks/09_spark_big_data.ipynb",
                    help="ruta relativa a Back/ del notebook a ejecutar")
    modo = ap.add_mutually_exclusive_group()
    modo.add_argument("--fast", action="store_true", help="parámetro FAST=True (prueba de humo)")
    modo.add_argument("--completo", action="store_true", help="parámetro FAST=False (por defecto)")
    ap.add_argument("--timeout", type=int, default=3600, help="segundos máximos por celda")
    args = ap.parse_args(argv)

    nb = (BACK / args.notebook).resolve()
    if not nb.is_file() or nb.suffix != ".ipynb":
        print(f"No existe el notebook {args.notebook}", file=sys.stderr)
        return 2

    import papermill as pm

    t0 = time.perf_counter()
    print(f"[spark] {nb.name} · FAST={args.fast} · kernel {KERNEL}", flush=True)
    pm.execute_notebook(str(nb), str(nb), parameters={"FAST": args.fast}, kernel_name=KERNEL,
                        cwd=str(nb.parent), progress_bar=False, request_save_on_cell_execute=True,
                        execution_timeout=args.timeout)
    print(f"[spark] terminado en {time.perf_counter() - t0:.1f} s", flush=True)
    _kernelspec_real(nb)
    return 0


def _kernelspec_real(nb: Path) -> None:
    """Deja en el notebook el ``display_name`` del kernel que lo ejecutó (papermill solo fija el nombre)."""
    import nbformat
    from jupyter_client.kernelspec import KernelSpecManager

    spec = KernelSpecManager().get_kernel_spec(KERNEL)
    cuaderno = nbformat.read(nb, as_version=4)
    cuaderno.metadata.setdefault("kernelspec", {}).update(
        {"name": KERNEL, "display_name": spec.display_name, "language": spec.language})
    nbformat.write(cuaderno, nb)


if __name__ == "__main__":
    sys.exit(main())

"""CLI de entrenamiento del modelo servido (única fuente de verdad, ADR-001).

Uso (desde ``Back/`` con el venv activo):
    python train.py            # protocolo completo
    python train.py --rapido   # humo: CV de 3 particiones y búsqueda mínima (no publicar)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

try:
    from credit_risk.entrenamiento import entrenar
except ModuleNotFoundError:  # permite ejecutar sin instalar el paquete
    sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))
    from credit_risk.entrenamiento import entrenar


if hasattr(sys.stdout, "reconfigure"):  # consola de Windows (cp1252) → UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main(argv: list[str] | None = None) -> int:
    """Punto de entrada: entrena, imprime el resumen y devuelve 0 si la card quedó escrita."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--rapido", action="store_true", help="prueba de humo (no publicar estos artefactos)")
    parser.add_argument("--sin-escribir", action="store_true", help="no escribe artefactos en disco")
    parser.add_argument("--log", type=Path, default=None,
                        help="guarda cada línea con su segundo de ejecución (JSON Lines) para el reproductor del front")
    args = parser.parse_args(argv)
    t0 = time.perf_counter()
    lineas: list[dict[str, object]] = []

    def log(msg: str) -> None:
        print(msg, flush=True)
        lineas.append({"t": round(time.perf_counter() - t0, 2), "linea": msg})

    card = entrenar(rapido=args.rapido, escribir=not args.sin_escribir, log=log)
    if args.log:
        args.log.parent.mkdir(parents=True, exist_ok=True)
        args.log.write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in lineas) + "\n", encoding="utf-8")
    print(f"Modelo {card['version']} · {card['algoritmo']} · variante {card['variante_equidad']}")
    print(f"Umbrales: {card['umbrales']} · AUC test {card['metricas_test']['roc_auc']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Genera la evidencia de gestión a partir de la fuente única ``docs/gestion/backlog.yaml``.

Salidas (todas deterministas: dos ejecuciones seguidas producen los mismos archivos):

* ``docs/gestion/backlog.md``: tabla legible, resumen por estado y puntos por sprint.
* ``docs/gestion/trazabilidad.md``: matriz ID del enunciado → HU → paso → evidencia → estado.
* ``docs/01_enunciado.md``: reescribe **solo** la tabla "Checklist global" (columna Hecho calculada).
* ``Front/src/data/generated/gestion.json``: épicas, historias, sprints, trazabilidad y DoD para el front.

Regla de acreditación de un ID del enunciado: ``[x]`` solo si todas las HU que lo cubren están en
"Hecho", todas sus rutas de evidencia existen y, si existe ``Back/reports/dod_status.json``, los
notebooks citados como evidencia cumplen todos los criterios de ``verificar_dod.py``.

Uso::

    python Back/scripts/generar_evidencia.py            # genera y muestra el conteo n/47
    python Back/scripts/generar_evidencia.py --verificar  # sale con 1 si algún archivo cambiaría

Dependencias: biblioteca estándar y ``pyyaml``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

RAIZ = Path(__file__).resolve().parents[2]
BACKLOG_YAML = RAIZ / "docs" / "gestion" / "backlog.yaml"
BACKLOG_MD = RAIZ / "docs" / "gestion" / "backlog.md"
TRAZABILIDAD_MD = RAIZ / "docs" / "gestion" / "trazabilidad.md"
ENUNCIADO_MD = RAIZ / "docs" / "01_enunciado.md"
DOD_STATUS = RAIZ / "Back" / "reports" / "dod_status.json"
GESTION_JSON = RAIZ / "Front" / "src" / "data" / "generated" / "gestion.json"

ESTADOS = ("Pendiente", "En progreso", "En revisión", "Hecho")
FIBONACCI = {1, 2, 3, 5, 8, 13, 21}
TITULO_CHECKLIST = "## Checklist global"
ID_TOTAL = "**Total acreditado**"
AVISO = ("<!-- Archivo generado por Back/scripts/generar_evidencia.py desde docs/gestion/backlog.yaml. "
         "No editar a mano. -->")

# IDs individuales del enunciado (docs/01_enunciado.md). Las filas agrupadas del checklist
# (p. ej. "P1.E1–E4") se expanden a estos IDs.
IDS_ENUNCIADO: tuple[str, ...] = (
    "PF1",
    *(f"E{i}" for i in range(1, 6)),
    *(f"F{i}" for i in range(1, 6)),
    *(f"R{i}" for i in range(1, 5)),
    *(f"P1.{i}" for i in range(1, 6)),
    *(f"P1.E{i}" for i in range(1, 5)),
    *(f"P2.{i}" for i in range(1, 7)),
    *(f"P2.E{i}" for i in range(1, 5)),
    *(f"IA1.{i}" for i in range(1, 4)),
    *(f"IA1.E{i}" for i in range(1, 3)),
    *(f"IA2.{i}" for i in range(1, 6)),
    *(f"IA2.E{i}" for i in range(1, 3)),
    *(f"IA3.{i}" for i in range(1, 7)),
    *(f"IA3.E{i}" for i in range(1, 4)),
)
_RANGO = re.compile(r"^(?P<pre>[A-Z0-9.]*?[A-Z.])(?P<a>\d+)[–-][A-Z]*(?P<b>\d+)$")


# --------------------------------------------------------------------------- utilidades


def expandir_id(fila_id: str) -> list[str]:
    """Expande un ID de fila del checklist a IDs individuales ("P1.E1–E4" → P1.E1…P1.E4)."""
    fila_id = fila_id.strip()
    m = _RANGO.match(fila_id)
    if not m:
        return [fila_id]
    return [f"{m['pre']}{i}" for i in range(int(m["a"]), int(m["b"]) + 1)]


def sha256(path: Path) -> str:
    """SHA-256 del contenido de un archivo."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def escribir_si_cambia(path: Path, contenido: str, newline: str = "\n") -> bool:
    """Escribe ``contenido`` solo si difiere del actual. Devuelve True si el archivo cambió."""
    datos = contenido.replace("\r\n", "\n").replace("\n", newline).encode("utf-8")
    if path.exists() and path.read_bytes() == datos:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(datos)
    return True


def rel(path: Path) -> str:
    """Ruta relativa a la raíz del repositorio, con barras normales."""
    return path.resolve().relative_to(RAIZ).as_posix()


def celda(texto: Any) -> str:
    """Texto seguro para una celda de tabla Markdown."""
    return str(texto).replace("|", "\\|").replace("\n", " ")


# --------------------------------------------------------------------------- modelo


@dataclass
class Historia:
    """Historia de usuario del backlog con su estado de acreditación calculado."""

    datos: dict[str, Any]
    evidencia: list[tuple[str, bool]] = field(default_factory=list)
    notebooks_fallidos: list[str] = field(default_factory=list)

    @property
    def id(self) -> str:
        return str(self.datos["id"])

    @property
    def estado(self) -> str:
        return str(self.datos["estado"])

    @property
    def puntos(self) -> int | None:
        return self.datos.get("puntos")

    @property
    def evidencia_completa(self) -> bool:
        return bool(self.evidencia) and all(ok for _, ok in self.evidencia) and not self.notebooks_fallidos

    @property
    def acreditada(self) -> bool:
        return self.estado == "Hecho" and self.evidencia_completa

    def frase(self) -> str:
        d = self.datos
        return f"Como {d['rol']}, quiero {d['quiero']}, para {d['para']}."


def cargar_backlog(path: Path = BACKLOG_YAML) -> dict[str, Any]:
    """Lee ``backlog.yaml``."""
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def cargar_dod(path: Path = DOD_STATUS) -> dict[str, Any] | None:
    """Lee ``dod_status.json`` si existe (lo escribe ``verificar_dod.py``)."""
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def validar_backlog(backlog: dict[str, Any]) -> list[str]:
    """Devuelve la lista de errores de estructura del backlog (vacía si es válido)."""
    errores: list[str] = []
    sprints = {s["id"] for s in backlog.get("sprints", [])}
    epicas = {e["id"] for e in backlog.get("epicas", [])}
    vistos: set[str] = set()
    obligatorios = ("id", "epica", "rol", "quiero", "para", "criterios_aceptacion", "puntos", "sprint",
                    "estado", "paso", "ids_enunciado", "evidencia")
    for h in backlog.get("historias", []):
        hid = h.get("id", "?")
        faltan = [k for k in obligatorios if k not in h]
        if faltan:
            errores.append(f"{hid}: faltan campos {faltan}")
            continue
        if hid in vistos:
            errores.append(f"{hid}: ID duplicado")
        vistos.add(hid)
        if h["epica"] not in epicas:
            errores.append(f"{hid}: épica desconocida {h['epica']}")
        if h["sprint"] is not None and h["sprint"] not in sprints:  # null = backlog del producto
            errores.append(f"{hid}: sprint desconocido {h['sprint']}")
        if h.get("sprint_mvp") is not None and h["sprint_mvp"] not in sprints:
            errores.append(f"{hid}: sprint_mvp desconocido {h['sprint_mvp']}")
        if h["estado"] not in ESTADOS:
            errores.append(f"{hid}: estado inválido {h['estado']!r}")
        if h["puntos"] is not None and h["puntos"] not in FIBONACCI:
            errores.append(f"{hid}: puntos no Fibonacci {h['puntos']}")
        for c in h["criterios_aceptacion"]:
            if not all(k in c for k in ("dado", "cuando", "entonces")):
                errores.append(f"{hid}: criterio sin Dado/Cuando/Entonces")
        for i in h["ids_enunciado"]:
            if i not in IDS_ENUNCIADO:
                errores.append(f"{hid}: ID del enunciado desconocido {i}")
    return errores


def evaluar_historias(backlog: dict[str, Any], dod: dict[str, Any] | None) -> list[Historia]:
    """Construye las historias y comprueba la existencia de su evidencia y la DoD de sus notebooks."""
    nb_dod: dict[str, dict[str, bool]] = (dod or {}).get("notebooks", {})
    historias = []
    for d in backlog["historias"]:
        h = Historia(d)
        for ruta in d["evidencia"]:
            p = RAIZ / ruta
            h.evidencia.append((ruta, p.exists()))
            if dod is not None and ruta.endswith(".ipynb"):
                crit = nb_dod.get(Path(ruta).name)
                if crit is None or not all(crit.values()):
                    h.notebooks_fallidos.append(Path(ruta).name)
        historias.append(h)
    return historias


# --------------------------------------------------------------------------- checklist


@dataclass
class FilaChecklist:
    """Fila de la tabla "Checklist global" de 01_enunciado.md."""

    id: str
    item: str
    paso: str
    ids: list[str]
    historias: list[Historia] = field(default_factory=list)

    @property
    def acreditada(self) -> bool:
        cubiertos = {i for h in self.historias for i in h.datos["ids_enunciado"]}
        return (bool(self.historias) and set(self.ids) <= cubiertos
                and all(h.acreditada for h in self.historias))


def _partir_fila(linea: str) -> list[str]:
    return [c.strip() for c in linea.strip()[1:-1].split("|")]


def localizar_checklist(lineas: list[str]) -> tuple[int, int]:
    """Índices [inicio, fin) de las líneas de la tabla del checklist (cabecera incluida)."""
    try:
        titulo = next(i for i, ln in enumerate(lineas) if ln.startswith(TITULO_CHECKLIST))
    except StopIteration as exc:
        raise SystemExit(f"No se encontró '{TITULO_CHECKLIST}' en {rel(ENUNCIADO_MD)}") from exc
    inicio = next(i for i in range(titulo + 1, len(lineas)) if lineas[i].lstrip().startswith("|"))
    fin = inicio
    while fin < len(lineas) and lineas[fin].lstrip().startswith("|"):
        fin += 1
    return inicio, fin


def leer_checklist(lineas: list[str], historias: list[Historia]) -> list[FilaChecklist]:
    """Lee las filas del checklist y les asocia las historias que cubren sus IDs."""
    inicio, fin = localizar_checklist(lineas)
    filas = []
    for linea in lineas[inicio + 2:fin]:
        partes = _partir_fila(linea)
        fid = partes[0]
        if fid.startswith("**"):
            continue  # fila de total generada
        ids = expandir_id(fid)
        cubren = [h for h in historias if set(ids) & set(h.datos["ids_enunciado"])]
        filas.append(FilaChecklist(fid, " | ".join(partes[1:-2]), partes[-2], ids, cubren))
    return filas


def reescribir_checklist(texto: str, filas: list[FilaChecklist]) -> str:
    """Devuelve ``texto`` con solo la tabla del checklist reescrita."""
    lineas = texto.split("\n")
    inicio, fin = localizar_checklist(lineas)
    nuevas = lineas[inicio:inicio + 2]
    for f in filas:
        nuevas.append(f"| {f.id} | {f.item} | {f.paso} | {'[x]' if f.acreditada else '[ ]'} |")
    n = sum(f.acreditada for f in filas)
    calculo = "Calculado con `python Back/scripts/generar_evidencia.py`"
    nuevas.append(f"| {ID_TOTAL} | {calculo} | — | **{n}/{len(filas)}** |")
    return "\n".join(lineas[:inicio] + nuevas + lineas[fin:])


# --------------------------------------------------------------------------- informes


def resumen_estados(historias: list[Historia]) -> dict[str, dict[str, int]]:
    """Historias y puntos por estado."""
    res = {e: {"historias": 0, "puntos": 0} for e in ESTADOS}
    for h in historias:
        res[h.estado]["historias"] += 1
        res[h.estado]["puntos"] += h.puntos or 0
    return res


def cierres_desde_git() -> dict[str, str]:
    """Fecha ISO del último commit que cita cada HU (el log se recorre del más reciente al más antiguo)."""
    try:
        log = subprocess.run(["git", "log", "--format=%cI%x1f%s%x1e"], cwd=RAIZ, capture_output=True,
                             text=True, encoding="utf-8", check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return {}
    cierres: dict[str, str] = {}
    for registro in log.split(""):
        if "" not in registro:
            continue
        fecha, asunto = registro.strip().split("", 1)
        for hu in re.findall(r"HU-\d{2}", asunto):
            cierres.setdefault(hu, fecha)
    return cierres


def burndown_git(historias: list[Historia], comprometidos: int, cierres: dict[str, str]) -> list[dict[str, Any]]:
    """Puntos restantes tras cada cierre real (commit) de una HU acreditada del sprint."""
    eventos = sorted((cierres[h.id], h.id, h.puntos or 0) for h in historias if h.acreditada and h.id in cierres)
    restantes, serie = comprometidos, []
    for fecha, hu, pts in eventos:
        restantes -= pts
        serie.append({"fecha": fecha, "hu": hu, "puntos": pts, "restantes": restantes})
    return serie


def resumen_sprints(backlog: dict[str, Any], historias: list[Historia]) -> list[dict[str, Any]]:
    """Por sprint: HU comprometidas, puntos comprometidos y hechos. S1–S4 usan ``sprint_mvp``."""
    salida = []
    cierres = cierres_desde_git()
    for s in backlog["sprints"]:
        mvp = "burndown" not in s  # los sprints del MVP no tienen burndown ni estimación
        hs = [h for h in historias if (h.datos.get("sprint_mvp") if mvp else h.datos["sprint"]) == s["id"]]
        salida.append({
            "id": s["id"], "nombre": s["nombre"], "inicio": s["inicio"], "fin": s["fin"],
            "objetivo": " ".join(str(s["objetivo"]).split()), "fase": s.get("fase", []),
            "estimado": not mvp, "nota": s.get("nota"),
            "historias": [h.id for h in hs],
            "puntos_comprometidos": None if mvp else sum(h.puntos or 0 for h in hs),
            "puntos_hechos": None if mvp else sum(h.puntos or 0 for h in hs if h.acreditada),
            "burndown": (burndown_git(hs, sum(h.puntos or 0 for h in hs), cierres)
                         if s.get("burndown") == "git" else s.get("burndown")),
        })
    return salida


def generar_backlog_md(backlog: dict[str, Any], historias: list[Historia],
                       sprints: list[dict[str, Any]]) -> str:
    """Contenido de ``docs/gestion/backlog.md``."""
    o = [AVISO, "", "# Backlog del producto", "",
         "> Fuente única: [`backlog.yaml`](backlog.yaml). Este archivo se regenera con "
         "`python Back/scripts/generar_evidencia.py`.",
         "> Una historia solo pasa a **Hecho** si cumple la [definición de hecho](definicion_de_hecho.md); "
         "entra a un sprint solo si cumple la [definición de listo](definicion_de_listo.md).", "",
         "## Resumen por estado", "", "| Estado | Historias | Puntos |", "|---|---|---|"]
    res = resumen_estados(historias)
    for e in ESTADOS:
        o.append(f"| {e} | {res[e]['historias']} | {res[e]['puntos']} |")
    o.append(f"| **Total** | **{len(historias)}** | **{sum(h.puntos or 0 for h in historias)}** |")
    o += ["", "## Puntos por sprint", "",
          "| Sprint | Fechas | Objetivo | Historias | Comprometidos | Hechos (acreditados) |",
          "|---|---|---|---|---|---|"]
    for s in sprints:
        comp = "no estimado" if s["puntos_comprometidos"] is None else s["puntos_comprometidos"]
        hech = "no estimado" if s["puntos_hechos"] is None else s["puntos_hechos"]
        o.append(f"| {s['id']} · {celda(s['nombre'])} | {s['inicio']} → {s['fin']} | {celda(s['objetivo'])} "
                 f"| {', '.join(s['historias']) or '—'} | {comp} | {hech} |")
    o += ["", "S1–S4 son el MVP: sus historias se listan por `sprint_mvp` y no se estimaron. "
          "Al reabrirse en v2 se re-estimaron y se comprometieron en S5–S8.", "",
          "## Épicas", "", "| ID | Épica | Objetivo | Historias | Puntos |", "|---|---|---|---|---|"]
    for e in backlog["epicas"]:
        hs = [h for h in historias if h.datos["epica"] == e["id"]]
        o.append(f"| {e['id']} | {celda(e['nombre'])} | {celda(e['objetivo'])} | {', '.join(h.id for h in hs)} "
                 f"| {sum(h.puntos or 0 for h in hs)} |")
    o += ["", "## Historias", "",
          "| ID | Épica | Historia | Pts | Sprint (MVP) | Estado | Paso | IDs enunciado | Evidencia |",
          "|---|---|---|---|---|---|---|---|---|"]
    for h in historias:
        d = h.datos
        mvp = f" ({d['sprint_mvp']})" if d.get("sprint_mvp") else ""
        ok = sum(x for _, x in h.evidencia)
        sprint = d["sprint"] or "Backlog"  # null = backlog del producto, sin sprint ni paso todavía
        paso = d["paso"] if d["paso"] is not None else "—"
        o.append(f"| {h.id} | {d['epica']} | {celda(h.frase())} | {d['puntos'] if d['puntos'] is not None else '—'} "
                 f"| {sprint}{mvp} | {d['estado']} | {paso} | {', '.join(d['ids_enunciado'])} "
                 f"| {ok}/{len(h.evidencia)} |")
    o += ["", "## Criterios de aceptación", ""]
    for h in historias:
        d = h.datos
        o += [f"### {h.id} · {d['quiero'][0].upper() + d['quiero'][1:]}", "", f"*{h.frase()}*", ""]
        for i, c in enumerate(d["criterios_aceptacion"], 1):
            o.append(f"{i}. **Dado** {c['dado']}, **cuando** {c['cuando']}, **entonces** {c['entonces']}.")
        o += ["", "Evidencia: " + ", ".join(f"`{r}` {'✓' if ok else '✗'}" for r, ok in h.evidencia)]
        if h.notebooks_fallidos:
            o.append(f"DoD de notebooks sin cumplir: {', '.join(h.notebooks_fallidos)}.")
        if d.get("nota"):
            o.append(f"Nota: {d['nota']}")
        o.append("")
    return "\n".join(o).rstrip() + "\n"


def generar_trazabilidad_md(filas: list[FilaChecklist], historias: list[Historia],
                            dod: dict[str, Any] | None) -> str:
    """Contenido de ``docs/gestion/trazabilidad.md``."""
    cubiertos = {i for h in historias for i in h.datos["ids_enunciado"]}
    sin_cubrir = [i for i in IDS_ENUNCIADO if i not in cubiertos]
    n = sum(f.acreditada for f in filas)
    resumen_dod = (f"`dod_status.json` del {dod.get('verificado')}, commit {dod.get('commit')}, "
                   f"fallos {dod.get('fallos')}" if dod else
                   "sin `dod_status.json` (ejecutar `python Back/scripts/verificar_dod.py`)")
    o = [AVISO, "", "# Matriz de trazabilidad", "",
         "> ID del enunciado → historia → paso del plan → evidencia → estado. Se calcula desde "
         "[`backlog.yaml`](backlog.yaml) y, si existe, `Back/reports/dod_status.json`.",
         "> Un ID queda acreditado solo si **todas** las HU que lo cubren están en Hecho, **todas** sus rutas "
         "de evidencia existen y sus notebooks cumplen la DoD.", "",
         "## Resumen", "",
         f"- Filas del checklist acreditadas: **{n}/{len(filas)}**.",
         f"- IDs individuales cubiertos por al menos una HU: "
         f"**{len(IDS_ENUNCIADO) - len(sin_cubrir)}/{len(IDS_ENUNCIADO)}**"
         + (f" (sin cubrir: {', '.join(sin_cubrir)})." if sin_cubrir else "."),
         f"- Historias acreditadas: **{sum(h.acreditada for h in historias)}/{len(historias)}**.",
         f"- DoD de notebooks: {resumen_dod}.",
         "", "## Matriz por fila del checklist", "",
         "| ID | Ítem | Paso | Historias (estado) | Evidencia existente | Acreditado |", "|---|---|---|---|---|---|"]
    for f in filas:
        hs = ", ".join(f"{h.id} ({h.estado})" for h in f.historias) or "**sin HU**"
        ev = [x for h in f.historias for x in h.evidencia]
        o.append(f"| {f.id} | {celda(f.item)} | {celda(f.paso)} | {hs} | {sum(ok for _, ok in ev)}/{len(ev)} "
                 f"| {'[x]' if f.acreditada else '[ ]'} |")
    o += ["", "## Detalle por ID", "", "| ID | HU | Paso | Estado | Evidencia |", "|---|---|---|---|---|"]
    for i in IDS_ENUNCIADO:
        hs = [h for h in historias if i in h.datos["ids_enunciado"]]
        if not hs:
            o.append(f"| {i} | **sin HU** | — | — | — |")
        for h in hs:
            ev = "<br>".join(f"[`{r}`](../../{r}) {'✓' if ok else '✗'}" for r, ok in h.evidencia)
            if h.notebooks_fallidos:
                ev += "<br>DoD ✗: " + ", ".join(h.notebooks_fallidos)
            o.append(f"| {i} | {h.id} | {h.datos['paso']} | {h.estado} | {ev} |")
    if dod and dod.get("notebooks"):
        crit = list(next(iter(dod["notebooks"].values())).keys())
        o += ["", "## DoD de notebooks (`verificar_dod.py`)", "",
              "| Notebook | " + " | ".join(crit) + " |", "|---" * (len(crit) + 1) + "|"]
        for nb, c in dod["notebooks"].items():
            o.append(f"| {nb} | " + " | ".join("✓" if c.get(k) else "✗" for k in crit) + " |")
    return "\n".join(o).rstrip() + "\n"


def generar_gestion_json(backlog: dict[str, Any], historias: list[Historia], sprints: list[dict[str, Any]],
                         filas: list[FilaChecklist], dod: dict[str, Any] | None) -> str:
    """Contenido de ``Front/src/data/generated/gestion.json``."""
    cubiertos = {i for h in historias for i in h.datos["ids_enunciado"]}
    datos = {
        "fuente": {"backlog": rel(BACKLOG_YAML), "backlog_sha256": sha256(BACKLOG_YAML),
                   "dod_status": rel(DOD_STATUS) if dod else None},
        "proyecto": backlog.get("proyecto"),
        "version_modelo_objetivo": backlog.get("version_modelo_objetivo"),
        "metodologia": backlog.get("metodologia"),
        "resumen_estados": resumen_estados(historias),
        "epicas": [{**e, "historias": [h.id for h in historias if h.datos["epica"] == e["id"]],
                    "puntos": sum(h.puntos or 0 for h in historias if h.datos["epica"] == e["id"])}
                   for e in backlog["epicas"]],
        "historias": [{
            **{k: v for k, v in h.datos.items() if k != "evidencia"},
            "historia": h.frase(),
            "evidencia": [{"ruta": r, "existe": ok} for r, ok in h.evidencia],
            "notebooks_dod_fallidos": h.notebooks_fallidos,
            "acreditada": h.acreditada,
        } for h in historias],
        "sprints": sprints,
        "trazabilidad": {
            "filas_total": len(filas),
            "filas_acreditadas": sum(f.acreditada for f in filas),
            "ids_total": len(IDS_ENUNCIADO),
            "ids_cubiertos": len(set(IDS_ENUNCIADO) & cubiertos),
            "ids_sin_cubrir": [i for i in IDS_ENUNCIADO if i not in cubiertos],
            "filas": [{"id": f.id, "item": f.item, "paso": f.paso, "ids": f.ids,
                       "historias": [h.id for h in f.historias], "acreditada": f.acreditada} for f in filas],
        },
        "dod": dod,
    }
    return json.dumps(datos, ensure_ascii=False, indent=2) + "\n"


# --------------------------------------------------------------------------- main


def main(argv: list[str] | None = None) -> int:
    """Punto de entrada del CLI."""
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--verificar", action="store_true", help="no escribe; sale con 1 si algo cambiaría")
    args = ap.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    backlog = cargar_backlog()
    errores = validar_backlog(backlog)
    if errores:
        print("backlog.yaml inválido:\n  - " + "\n  - ".join(errores))
        return 2
    dod = cargar_dod()
    historias = evaluar_historias(backlog, dod)
    sprints = resumen_sprints(backlog, historias)

    texto_enunciado = ENUNCIADO_MD.read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in texto_enunciado else "\n"
    texto_enunciado = texto_enunciado.replace("\r\n", "\n")
    filas = leer_checklist(texto_enunciado.split("\n"), historias)

    salidas = {
        BACKLOG_MD: (generar_backlog_md(backlog, historias, sprints), "\n"),
        TRAZABILIDAD_MD: (generar_trazabilidad_md(filas, historias, dod), "\n"),
        ENUNCIADO_MD: (reescribir_checklist(texto_enunciado, filas), nl),
        GESTION_JSON: (generar_gestion_json(backlog, historias, sprints, filas, dod), "\n"),
    }
    cambios = []
    for path, (contenido, salto) in salidas.items():
        if args.verificar:
            actual = path.read_bytes() if path.exists() else b""
            if actual != contenido.replace("\n", salto).encode("utf-8"):
                cambios.append(rel(path))
        elif escribir_si_cambia(path, contenido, salto):
            cambios.append(rel(path))

    cubiertos = {i for h in historias for i in h.datos["ids_enunciado"]}
    sin_cubrir = [i for i in IDS_ENUNCIADO if i not in cubiertos]
    res = resumen_estados(historias)
    print("Historias por estado: " + ", ".join(f"{e} {res[e]['historias']} ({res[e]['puntos']} pts)" for e in ESTADOS))
    print(f"IDs cubiertos: {len(IDS_ENUNCIADO) - len(sin_cubrir)}/{len(IDS_ENUNCIADO)}"
          + (f" · sin cubrir: {', '.join(sin_cubrir)}" if sin_cubrir else ""))
    print(f"DoD: {'dod_status.json leído' if dod else 'sin dod_status.json'}")
    print(("Cambiarían: " if args.verificar else "Actualizados: ") + (", ".join(cambios) or "ninguno"))
    print(f"Checklist global acreditado: {sum(f.acreditada for f in filas)}/{len(filas)}")
    if sin_cubrir:
        return 1
    return 1 if (args.verificar and cambios) else 0


if __name__ == "__main__":
    sys.exit(main())

/**
 * DataExplorer — explorador de los CSV del paquete de corrida (crudo / train / test).
 * Parser en Web Worker (papaparse), carga única cacheada, tabla virtualizada con encabezado fijo,
 * orden por columna, filtros (texto, categoría, rango), resaltado de nulos y atípicos (crudo) y perfil
 * de la columna seleccionada.
 */
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import agregados from "@/data/generated/agregados.json";
import { Evidencia } from "@/charts/Evidencia";
import { compacto, dec, num, pct } from "@/charts/formatos";
import { Cargando, Faltante } from "@/components/base";
import { Segmentado } from "@/components/Tabs";
import { cargarTextoRun } from "@/data/cargar";
import { conteos, parsearCsv, perfilar, type Celda, type Perfil, type Tabla } from "./perfil";
import "../comun/terminal.css";
import "./datos.css";

type Conjunto = "crudo" | "train" | "test";
const RUTA: Record<Conjunto, string> = { crudo: "data/credit_risk.csv", train: "data/train.csv", test: "data/test.csv" };
const ETIQUETA: Record<Conjunto, string> = { crudo: "Crudo", train: "Train", test: "Test" };

/* Carga única: una promesa por conjunto (texto cacheado por cargar.ts; parseo en Worker). */
const tablas = new Map<Conjunto, Promise<{ tabla: Tabla; ms: number }>>();
function parsearEnWorker(texto: string): Promise<{ tabla: Tabla; ms: number }> {
  if (typeof Worker === "undefined") {
    const t0 = performance.now();
    return Promise.resolve({ tabla: parsearCsv(texto), ms: performance.now() - t0 });
  }
  return new Promise((ok, mal) => {
    const w = new Worker(new URL("./csv.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<{ tabla: Tabla; ms: number }>) => {
      ok({ tabla: e.data.tabla, ms: e.data.ms });
      w.terminate();
    };
    w.onerror = (e) => {
      w.terminate();
      mal(new Error(e.message));
    };
    w.postMessage({ id: "csv", texto });
  });
}
export function cargarTabla(c: Conjunto) {
  let p = tablas.get(c);
  if (!p) {
    p = cargarTextoRun(RUTA[c]).then(parsearEnWorker);
    p.catch(() => tablas.delete(c));
    tablas.set(c, p);
  }
  return p;
}

function useTabla(c: Conjunto) {
  const [r, setR] = useState<{ estado: "cargando" | "listo" | "error"; tabla?: Tabla; ms?: number }>({ estado: "cargando" });
  useEffect(() => {
    let vivo = true;
    setR({ estado: "cargando" });
    cargarTabla(c).then(
      (x) => vivo && setR({ estado: "listo", tabla: x.tabla, ms: x.ms }),
      () => vivo && setR({ estado: "error" }),
    );
    return () => {
      vivo = false;
    };
  }, [c]);
  return r;
}

export function DataExplorer({ conjunto = "crudo" }: { conjunto?: Conjunto }) {
  const [c, setC] = useState<Conjunto>(conjunto);
  useEffect(() => setC(conjunto), [conjunto]);
  const r = useTabla(c);
  return (
    <div className="dexp" data-testid="data-explorer" data-conjunto={c}>
      <div className="dexp__cab">
        <div>
          <span className="versalitas">Explorador de datos · {RUTA[c].replace("data/", "")}</span>
          <p className="dexp__sub">
            {c === "crudo" ? "Tal como llega: nulos, duplicados y atípicos a la vista." : c === "train" ? "Partición de entrenamiento ya limpia, con variables derivadas." : "Partición de prueba: se evalúa una sola vez."}
          </p>
        </div>
        <Segmentado etiqueta="Conjunto de datos" valor={c} onCambio={setC} opciones={(["crudo", "train", "test"] as Conjunto[]).map((id) => ({ id, etiqueta: ETIQUETA[id] }))} />
      </div>
      {r.estado === "cargando" && <Cargando etiqueta={`Leyendo ${RUTA[c]}`} alto={520} />}
      {r.estado === "error" && <Faltante titulo={RUTA[c]}>No se pudo leer el archivo del paquete de corrida.</Faltante>}
      {r.estado === "listo" && r.tabla && <Explorador key={c} tabla={r.tabla} conjunto={c} ms={r.ms ?? 0} />}
    </div>
  );
}
export default DataExplorer;

/* ------------------------------------------------------------------ */
type Orden = { j: number; dir: 1 | -1 } | null;

function anchoCol(tipo: Tabla["tipos"][number], nombre: string): number {
  if (tipo === "texto") return 380;
  if (nombre === "id_cliente") return 120;
  return Math.max(96, Math.min(190, nombre.length * 7.6 + 34));
}

function fmtCelda(v: Celda, col: string): string {
  if (v === null) return "∅";
  if (typeof v === "number") {
    if (/ingreso|monto|cuota_estimada/.test(col)) return num(v, 0);
    return Number.isInteger(v) ? String(v) : num(v, 3);
  }
  return v;
}

function Explorador({ tabla, conjunto, ms }: { tabla: Tabla; conjunto: Conjunto; ms: number }) {
  const [busca, setBusca] = useState("");
  const [orden, setOrden] = useState<Orden>(null);
  const [sel, setSel] = useState(() => Math.max(0, tabla.columnas.indexOf("puntaje_buro")));
  const [cat, setCat] = useState<string>("");
  const [rango, setRango] = useState<[string, string]>(["", ""]);
  const [soloNulos, setSoloNulos] = useState(false);
  const perfiles = useMemo(() => new Map<number, Perfil>(), [tabla]);
  const perfil = useMemo(() => {
    let p = perfiles.get(sel);
    if (!p) perfiles.set(sel, (p = perfilar(tabla, sel)));
    return p;
  }, [sel, tabla, perfiles]);
  const crudo = conjunto === "crudo";
  const limites = useMemo(() => {
    if (!crudo) return new Map<number, [number, number]>();
    const m = new Map<number, [number, number]>();
    tabla.tipos.forEach((t, j) => {
      if (t === "numerico" && tabla.columnas[j] !== "default") {
        const p = perfiles.get(j) ?? perfilar(tabla, j);
        perfiles.set(j, p);
        if (p.limites && p.atipicos) m.set(j, p.limites);
      }
    });
    return m;
  }, [crudo, tabla, perfiles]);

  useEffect(() => {
    setCat("");
    setRango(["", ""]);
    setSoloNulos(false);
  }, [sel]);

  const indices = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lo = rango[0] === "" ? -Infinity : Number(rango[0].replace(",", "."));
    const hi = rango[1] === "" ? Infinity : Number(rango[1].replace(",", "."));
    let idx = tabla.filas.map((_, i) => i);
    if (q) idx = idx.filter((i) => tabla.filas[i].some((v) => v !== null && String(v).toLowerCase().includes(q)));
    if (soloNulos) idx = idx.filter((i) => tabla.filas[i][sel] === null);
    else if (cat) idx = idx.filter((i) => String(tabla.filas[i][sel]) === cat);
    else if (tabla.tipos[sel] === "numerico" && (Number.isFinite(lo) || Number.isFinite(hi)))
      idx = idx.filter((i) => {
        const v = tabla.filas[i][sel];
        return typeof v === "number" && v >= lo && v <= hi;
      });
    if (orden) {
      const { j, dir } = orden;
      idx.sort((a, b) => {
        const x = tabla.filas[a][j];
        const y = tabla.filas[b][j];
        if (x === null) return 1;
        if (y === null) return -1;
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es")) * dir;
      });
    }
    return idx;
  }, [tabla, busca, orden, cat, rango, sel, soloNulos]);

  const anchos = useMemo(() => tabla.columnas.map((c, j) => anchoCol(tabla.tipos[j], c)), [tabla]);
  const plantilla = `56px ${anchos.map((a) => `${a}px`).join(" ")}`;
  const anchoTotal = 56 + anchos.reduce((s, a) => s + a, 0);
  const cont = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({ count: indices.length, getScrollElement: () => cont.current, estimateSize: () => 34, overscan: 14, initialRect: { width: 900, height: 520 } });
  const control = conteos(tabla);
  const totalNulos = Object.values(control.nulos).reduce((s, x) => s + x, 0);

  const ordenar = (j: number) => {
    setSel(j);
    setOrden((o) => (!o || o.j !== j ? { j, dir: 1 } : o.dir === 1 ? { j, dir: -1 } : null));
  };

  return (
    <div className="dexp__cuerpo">
      <div className="dexp__resumen mono">
        <span>
          <strong>{num(control.filas)}</strong> filas
        </span>
        <span>
          <strong>{num(tabla.columnas.length)}</strong> columnas
        </span>
        <span>
          <strong>{num(control.ids_unicos)}</strong> ids únicos
        </span>
        <span>
          <strong>{pct(control.tasa_impago)}</strong> impago
        </span>
        {crudo && (
          <span className="dexp__nulos">
            <strong>{num(totalNulos)}</strong> celdas nulas
          </span>
        )}
        <span className="tk-dim">parseado en {num(ms, 0)} ms · Web Worker</span>
      </div>

      <div className="dexp__rejilla">
        <div className="dexp__tabla-col">
          <div className="dexp__filtros">
            <label className="dexp__buscar">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Buscar en todas las columnas</span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar (id, propósito, texto…)" />
            </label>
            <span className="dexp__conteo mono tabular" aria-live="polite">
              {num(indices.length)} de {num(tabla.filas.length)}
            </span>
          </div>
          <div className="dexp__tabla" ref={cont} role="table" aria-label={`Tabla ${RUTA[conjunto]}`} aria-rowcount={indices.length + 1} tabIndex={0}>
            <div className="dexp__cab-fila" role="row" style={{ gridTemplateColumns: plantilla, width: anchoTotal }}>
              <span className="dexp__th dexp__th--n" role="columnheader">
                #
              </span>
              {tabla.columnas.map((c, j) => (
                <button
                  key={c}
                  type="button"
                  role="columnheader"
                  aria-sort={orden?.j === j ? (orden.dir === 1 ? "ascending" : "descending") : "none"}
                  className={`dexp__th ${sel === j ? "sel" : ""} ${tabla.tipos[j] === "numerico" ? "num" : ""}`}
                  onClick={() => ordenar(j)}
                  title={`Ordenar por ${c} y ver su perfil`}
                >
                  <span>{c}</span>
                  <i aria-hidden="true">{orden?.j === j ? (orden.dir === 1 ? "↑" : "↓") : ""}</i>
                </button>
              ))}
            </div>
            <div style={{ height: v.getTotalSize(), width: anchoTotal, position: "relative" }}>
              {v.getVirtualItems().map((it) => {
                const i = indices[it.index];
                const f = tabla.filas[i];
                return (
                  <div key={it.key} role="row" className="dexp__fila" style={{ gridTemplateColumns: plantilla, transform: `translateY(${it.start}px)`, width: anchoTotal } as CSSProperties}>
                    <span className="dexp__td dexp__td--n mono" role="cell">
                      {i + 1}
                    </span>
                    {f.map((x, j) => {
                      const lim = limites.get(j);
                      const atip = lim && typeof x === "number" && (x < lim[0] || x > lim[1]);
                      return (
                        <span
                          key={j}
                          role="cell"
                          className={`dexp__td ${x === null ? "nulo" : ""} ${atip ? "atipico" : ""} ${typeof x === "number" ? "num" : ""} ${sel === j ? "sel" : ""}`}
                          title={x === null ? "Nulo" : atip ? "Atípico (fuera de 1,5 × IQR)" : tabla.tipos[j] === "texto" ? String(x) : undefined}
                        >
                          {fmtCelda(x, tabla.columnas[j])}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {indices.length === 0 && <p className="dexp__vacio">Ninguna fila cumple los filtros.</p>}
          </div>
          {crudo && (
            <p className="dexp__leyenda">
              <span className="dexp__ley dexp__ley--nulo">∅ nulo</span>
              <span className="dexp__ley dexp__ley--atip">atípico (1,5 × IQR)</span>
              <span className="dexp__pista">Clic en un encabezado: ordena y perfila la columna.</span>
            </p>
          )}
        </div>
        <PanelPerfil perfil={perfil} crudo={crudo} cat={cat} setCat={setCat} rango={rango} setRango={setRango} soloNulos={soloNulos} setSoloNulos={setSoloNulos} />
      </div>
      <Evidencia notebook={crudo ? "02" : "03"} fuente={`public/run/${RUTA[conjunto]} · conteos = agregados.json (DuckDB): ${num(agregados.resumen.filas)} filas`} compacta />
    </div>
  );
}

function PanelPerfil({
  perfil: p,
  crudo,
  cat,
  setCat,
  rango,
  setRango,
  soloNulos,
  setSoloNulos,
}: {
  perfil: Perfil;
  crudo: boolean;
  cat: string;
  setCat: (s: string) => void;
  rango: [string, string];
  setRango: (r: [string, string]) => void;
  soloNulos: boolean;
  setSoloNulos: (b: boolean) => void;
}) {
  const numerico = p.tipo === "numerico";
  const maxH = Math.max(1, ...(p.histograma?.conteos ?? [1]));
  const maxF = Math.max(1, ...(p.frecuencias ?? []).map((f) => f.n));
  return (
    <aside className="dexp__perfil" aria-label={`Perfil de ${p.columna}`} aria-live="polite">
      <span className="versalitas">Perfil de columna</span>
      <h4 className="mono">{p.columna}</h4>
      <span className={`dexp__tipo dexp__tipo--${p.tipo}`}>{p.tipo === "numerico" ? "numérica" : p.tipo === "texto" ? "texto libre" : "categórica"}</span>
      <dl className="dexp__stats">
        <div>
          <dt>Nulos</dt>
          <dd className={p.nulos ? "aviso" : ""}>
            {num(p.nulos)} <small>{pct(p.nulos / p.n)}</small>
          </dd>
        </div>
        <div>
          <dt>Únicos</dt>
          <dd>{num(p.unicos)}</dd>
        </div>
        {numerico && (
          <>
            <div>
              <dt>Media</dt>
              <dd>{compacto(p.media)}</dd>
            </div>
            <div>
              <dt>Mediana</dt>
              <dd>{compacto(p.mediana)}</dd>
            </div>
            <div>
              <dt>Mín.</dt>
              <dd>{compacto(p.min)}</dd>
            </div>
            <div>
              <dt>Máx.</dt>
              <dd>{compacto(p.max)}</dd>
            </div>
            {crudo && (
              <div>
                <dt>Atípicos</dt>
                <dd className={p.atipicos ? "malo" : ""}>{num(p.atipicos ?? 0)}</dd>
              </div>
            )}
          </>
        )}
      </dl>
      {numerico && p.histograma && (
        <div className="dexp__hist" role="img" aria-label={`Histograma de ${p.columna}: de ${compacto(p.min)} a ${compacto(p.max)}`}>
          <div className="dexp__hist-barras">
            {p.histograma.conteos.map((c, i) => {
              const a = p.histograma!.bordes[i];
              const b = p.histograma!.bordes[i + 1];
              const fuera = crudo && p.limites && (b < p.limites[0] || a > p.limites[1]);
              return <i key={i} style={{ height: `${Math.max(c ? 3 : 0, (c / maxH) * 100)}%` }} className={fuera ? "fuera" : ""} title={`${compacto(a)} – ${compacto(b)}: ${num(c)}`} />;
            })}
          </div>
          <div className="dexp__hist-eje mono">
            <span>{compacto(p.min)}</span>
            <span>{compacto(p.max)}</span>
          </div>
        </div>
      )}
      {!numerico && p.frecuencias && (
        <ul className="dexp__freqs">
          {p.frecuencias.slice(0, p.tipo === "texto" ? 4 : 8).map((f) => (
            <li key={f.valor}>
              <button type="button" className={cat === f.valor ? "activo" : ""} onClick={() => setCat(cat === f.valor ? "" : f.valor)} aria-pressed={cat === f.valor} title={f.valor}>
                <span className="dexp__freq-txt">{f.valor}</span>
                <span className="dexp__freq-n mono tabular">{num(f.n)}</span>
                <span className="dexp__freq-barra" style={{ width: `${(f.n / maxF) * 100}%` }} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="dexp__filtro-col">
        <span className="versalitas">Filtrar por esta columna</span>
        {numerico ? (
          <div className="dexp__rango">
            <input inputMode="decimal" placeholder={`≥ ${compacto(p.min)}`} value={rango[0]} onChange={(e) => setRango([e.target.value, rango[1]])} aria-label="Mínimo" />
            <span>—</span>
            <input inputMode="decimal" placeholder={`≤ ${compacto(p.max)}`} value={rango[1]} onChange={(e) => setRango([rango[0], e.target.value])} aria-label="Máximo" />
          </div>
        ) : (
          <p className="dexp__ayuda">{cat ? `Categoría: ${cat}` : "Elija una categoría arriba."}</p>
        )}
        {p.nulos > 0 && (
          <label className="dexp__check">
            <input type="checkbox" checked={soloNulos} onChange={(e) => setSoloNulos(e.target.checked)} /> Solo filas con nulo ({num(p.nulos)})
          </label>
        )}
        {numerico && p.q1 !== undefined && (
          <p className="dexp__ayuda mono">
            Q1 {dec(p.q1, 2)} · Q3 {dec(p.q3, 2)}
          </p>
        )}
      </div>
    </aside>
  );
}

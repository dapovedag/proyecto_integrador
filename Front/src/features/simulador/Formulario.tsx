/**
 * Formulario del simulador: deslizadores con valor editable, opciones en píldoras, listas con etiquetas
 * legibles y texto libre; validación inline idéntica a la API (esquema Pydantic exportado).
 */
import { useId, useState, type CSSProperties } from "react";
import { errorDeCampo, mensajeEs } from "../api/validacion";
import { CAMPOS, GRUPOS, type Campo } from "./campos";

export type ClienteForm = Record<string, unknown>;

function aNumeroEditable(s: string): unknown {
  const t = s.trim().replace(/\s/g, "");
  if (t === "") return "";
  // admite coma decimal y puntos de miles (es-CO): "4.500.000" → 4500000 ; "0,35" → 0.35
  const norm = /,\d*$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  const n = Number(norm);
  return Number.isFinite(n) ? n : s;
}

function Deslizador({ c, valor, onCambio, error }: { c: Campo; valor: unknown; onCambio: (v: unknown) => void; error: string | null }) {
  const id = useId();
  const [edit, setEdit] = useState<string | null>(null);
  const n = typeof valor === "number" ? valor : Number.NaN;
  const min = c.min ?? 0;
  const max = c.max ?? 100;
  const dentro = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  const frac = (dentro - min) / (max - min || 1);
  const crudo = Number.isFinite(n) ? n.toLocaleString("es-CO", { maximumFractionDigits: 2, useGrouping: Math.abs(n) >= 10000 }) : valor == null ? "" : String(valor);
  const mostrado = edit ?? (Number.isFinite(n) && c.formato ? c.formato(n) : crudo);
  const fmt = (v: number) => (c.formato ? c.formato(v) : String(v));
  return (
    <div className={`sim-campo sim-campo--deslizador ${error ? "sim-campo--error" : ""}`}>
      <div className="sim-campo__cab">
        <label htmlFor={`${id}-n`} className="sim-campo__etiqueta">
          {c.etiqueta}
        </label>
        <input
          id={`${id}-n`}
          className="sim-valor mono tabular"
          inputMode="decimal"
          value={mostrado}
          size={Math.max(4, mostrado.length + 1)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          title="Escriba un valor exacto"
          onFocus={(e) => {
            setEdit(crudo);
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => {
            setEdit(e.target.value);
            onCambio(aNumeroEditable(e.target.value));
          }}
          onBlur={() => setEdit(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
      <input
        type="range"
        className="sim-rango"
        min={min}
        max={max}
        step={c.paso ?? 1}
        value={dentro}
        aria-label={`${c.etiqueta} (deslizador)`}
        aria-valuetext={Number.isFinite(n) && c.formato ? c.formato(n) : undefined}
        style={{ "--frac": frac } as CSSProperties}
        onChange={(e) => {
          setEdit(null);
          onCambio(Number(e.target.value));
        }}
      />
      <div className="sim-rango__extremos mono" aria-hidden="true">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
      {error && (
        <p className="sim-campo__error" id={`${id}-e`} role="alert">
          {error}
        </p>
      )}
      {c.ayuda && !error && <p className="sim-campo__ayuda">{c.ayuda}</p>}
    </div>
  );
}

function Opciones({ c, valor, onCambio }: { c: Campo; valor: unknown; onCambio: (v: unknown) => void }) {
  const id = useId();
  return (
    <div className="sim-campo">
      <span className="sim-campo__etiqueta" id={id}>
        {c.etiqueta}
      </span>
      <div className="sim-pildoras" role="radiogroup" aria-labelledby={id}>
        {c.opciones!.map((o) => {
          const sel = o.valor === valor || (o.valor === null && valor == null);
          return (
            <button key={String(o.valor)} type="button" role="radio" aria-checked={sel} className={`sim-pildora ${sel ? "activa" : ""} ${o.valor === null ? "sim-pildora--nulo" : ""}`} onClick={() => onCambio(o.valor)}>
              {o.etiqueta}
            </button>
          );
        })}
      </div>
      {c.ayuda && <p className="sim-campo__ayuda">{c.ayuda}</p>}
    </div>
  );
}

function Lista({ c, valor, onCambio, error }: { c: Campo; valor: unknown; onCambio: (v: unknown) => void; error: string | null }) {
  const id = useId();
  const conocido = c.opciones!.some((o) => o.valor === valor);
  return (
    <div className={`sim-campo ${error ? "sim-campo--error" : ""}`}>
      <label htmlFor={id} className="sim-campo__etiqueta">
        {c.etiqueta}
      </label>
      <div className="sim-select">
        <select id={id} value={conocido ? String(valor) : "__otro"} onChange={(e) => onCambio(e.target.value)} aria-invalid={!!error}>
          {!conocido && <option value="__otro">{String(valor ?? "—")} (no válido)</option>}
          {c.opciones!.map((o) => (
            <option key={String(o.valor)} value={String(o.valor)}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      {error && (
        <p className="sim-campo__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Texto({ c, valor, onCambio, error }: { c: Campo; valor: unknown; onCambio: (v: unknown) => void; error: string | null }) {
  const id = useId();
  const s = typeof valor === "string" ? valor : "";
  return (
    <div className={`sim-campo sim-campo--texto ${error ? "sim-campo--error" : ""}`}>
      <div className="sim-campo__cab">
        <label htmlFor={id} className="sim-campo__etiqueta">
          {c.etiqueta}
        </label>
        <span className="sim-campo__formato mono tabular">{s.length.toLocaleString("es-CO")} / 5.000</span>
      </div>
      <textarea id={id} className="sim-textarea" rows={4} value={s} onChange={(e) => onCambio(e.target.value === "" ? null : e.target.value)} placeholder="Describa para qué necesita el crédito…" />
      {error && (
        <p className="sim-campo__error" role="alert">
          {error}
        </p>
      )}
      {c.ayuda && !error && <p className="sim-campo__ayuda">{c.ayuda}</p>}
    </div>
  );
}

export function Formulario({ cliente, onCambio }: { cliente: ClienteForm; onCambio: (id: string, v: unknown) => void }) {
  return (
    <form className="sim-form" onSubmit={(e) => e.preventDefault()} aria-label="Datos del solicitante" noValidate>
      {GRUPOS.map((g, gi) => (
        <fieldset key={g.id} className="sim-grupo">
          <legend className="sim-grupo__leyenda">
            <span className="sim-grupo__num mono">{String(gi + 1).padStart(2, "0")}</span>
            <span className="sim-grupo__titulo">{g.titulo}</span>
            <span className="sim-grupo__detalle">{g.detalle}</span>
          </legend>
          <div className="sim-grupo__campos">
            {CAMPOS.filter((c) => c.grupo === g.id).map((c) => {
              const v = cliente[c.id];
              const e = errorDeCampo(c.id, v);
              const err = e ? mensajeEs(e) : null;
              const set = (x: unknown) => onCambio(c.id, x);
              switch (c.control) {
                case "deslizador":
                  return <Deslizador key={c.id} c={c} valor={v} onCambio={set} error={err} />;
                case "opciones":
                  return <Opciones key={c.id} c={c} valor={v} onCambio={set} />;
                case "lista":
                  return <Lista key={c.id} c={c} valor={v} onCambio={set} error={err} />;
                default:
                  return <Texto key={c.id} c={c} valor={v} onCambio={set} error={err} />;
              }
            })}
          </div>
        </fieldset>
      ))}
    </form>
  );
}

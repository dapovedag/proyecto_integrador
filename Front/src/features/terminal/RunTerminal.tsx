/**
 * RunTerminal — reproduce la corrida real de `train.py` (train_log.json: cada línea con su segundo real `t`).
 * El tiempo real (490 s) se comprime con √t para conservar el orden y el ritmo; el reloj muestra el segundo real.
 */
import { Fragment, useMemo, type ReactNode } from "react";
import card from "@/data/generated/model_card.json";
import log from "@/data/generated/train_log.json";
import { Evidencia } from "@/charts/Evidencia";
import { dec3, duracion, pct } from "@/charts/formatos";
import type { TrainLog } from "@/data/tipos";
import { ControlesReproduccion, Terminal, useReloj, type EventoTerminal } from "../comun/Terminal";
import "./terminal.css";

const LINEAS = log as TrainLog;
const COMANDO = "python train.py --log reports/train_log.jsonl";
const T_TECLEO = 1100;
const T_ARRANQUE = 1500;
const K = 620; // ms por √s real → 490 s ≈ 15 s de reproducción

/** Segundo real → ms de reproducción. */
export function aReproduccion(t: number): number {
  return T_ARRANQUE + K * Math.sqrt(Math.max(0, t));
}
/** ms de reproducción → segundo real (inversa). */
export function aReal(ms: number): number {
  if (ms <= T_ARRANQUE) return 0;
  return ((ms - T_ARRANQUE) / K) ** 2;
}


/** Resaltado de una línea del log: cifras, variantes, decisiones y diccionarios. */
export function resaltarLinea(l: string): ReactNode {
  const decision = /^(Familia elegida|Variante elegida|Artefactos escritos|Duración)/.test(l);
  const partes: ReactNode[] = [];
  const re = /('[^']*')(\s*:)?|(\d+(?:\.\d+)?)|\b(base|sin_edad|reweighing|Regresión logística|Gradient Boosting \(HGB\))\b|(AUC CV|AUC|DI sexo|edad=|costo=|Test:|decisión:)/g;
  let i = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(l))) {
    if (m.index > i) partes.push(<Fragment key={k++}>{l.slice(i, m.index)}</Fragment>);
    if (m[1]) partes.push(<span key={k++} className={m[2] ? "tk-clave" : "tk-cad"}>{m[1] + (m[2] ?? "")}</span>);
    else if (m[3]) partes.push(<span key={k++} className="tk-num">{m[3]}</span>);
    else if (m[4]) partes.push(<span key={k++} className="tk-var">{m[4]}</span>);
    else if (m[5]) partes.push(<span key={k++} className="tk-acento">{m[5]}</span>);
    i = m.index + m[0].length;
  }
  if (i < l.length) partes.push(<Fragment key={k++}>{l.slice(i)}</Fragment>);
  return <span className={decision ? "rt-decision" : undefined}>{partes}</span>;
}

export function RunTerminal() {
  const eventos = useMemo<EventoTerminal[]>(() => {
    const ev: EventoTerminal[] = [{ t: 0, tipo: "comando", texto: COMANDO, tecleo: T_TECLEO }];
    let previo = -1;
    for (const { t, linea } of LINEAS) {
      let ms = aReproduccion(t);
      if (ms <= previo) ms = previo + 140; // líneas del mismo segundo: escalonadas
      previo = ms;
      ev.push({ t: ms, tipo: "salida", texto: linea, render: resaltarLinea });
    }
    return ev;
  }, []);
  const total = eventos[eventos.length - 1].t + 900;
  const r = useReloj(total);
  const real = Math.min(card.duracion_entrenamiento_s, aReal(r.reloj));
  const fin = r.fase === "fin";
  const progreso = Math.min(1, real / card.duracion_entrenamiento_s);
  const lineasVistas = eventos.filter((e) => e.tipo === "salida" && e.t <= r.reloj).length;

  const m = card.metricas_test;
  const d = card.decision_test;
  const resumen = [
    { etiqueta: "Familia", valor: card.familia, nota: card.algoritmo.replace("LogisticRegression ", "") },
    { etiqueta: "Variante de equidad", valor: card.variante_equidad, nota: `DI edad ${dec3(card.equidad_test.edad.disparate_impact)}` },
    { etiqueta: "AUC test", valor: dec3(m.roc_auc), nota: `KS ${dec3(m.ks)} · Brier ${dec3(m.brier)}` },
    { etiqueta: "Decisión en test", valor: `${pct(d.tasa_aprobacion)} aprueba`, nota: `${pct(d.tasa_revision)} revisa · ${pct(d.tasa_rechazo)} rechaza` },
  ];

  return (
    <div className="rt" data-testid="run-terminal" data-fase={r.fase}>
      <Terminal
        titulo={
          <>
            Back/ — bash · <span className="tk-dim">modelo v{card.version}</span>
          </>
        }
        etiqueta="Terminal: entrenamiento real con train.py"
        eventos={eventos}
        reloj={r.reloj}
        alto={360}
        barra={<ControlesReproduccion {...r} etiquetaPlay="Ejecutar train.py" />}
        pie={
          <div className="rt__pie">
            <div className="rt__barra" aria-hidden="true">
              <span style={{ transform: `scaleX(${progreso})` }} />
              {LINEAS.map((l, i) => (
                <i key={i} style={{ left: `${(l.t / card.duracion_entrenamiento_s) * 100}%` }} className={l.t <= real ? "on" : ""} />
              ))}
            </div>
            <span className="rt__reloj mono tabular" role="timer" aria-label="Tiempo real de la corrida">
              {fin ? "✓ " : r.fase === "corriendo" ? "● " : ""}
              {duracion(real)} <span className="tk-dim">/ {duracion(card.duracion_entrenamiento_s)} reales</span>
            </span>
            <span className="sr-only" aria-live="polite">
              {fin ? `Entrenamiento terminado en ${duracion(card.duracion_entrenamiento_s)}` : lineasVistas ? `${lineasVistas} líneas del registro` : ""}
            </span>
          </div>
        }
      />
      <div className={`rt__card ${fin ? "rt__card--ver" : ""}`} aria-hidden={!fin}>
        <div className="rt__card-cab">
          <span className="versalitas">Model card · v{card.version}</span>
          <span className="mono tk-dim">{card.fecha_entrenamiento}</span>
        </div>
        <dl className="rt__card-rejilla">
          {resumen.map((x) => (
            <div key={x.etiqueta}>
              <dt className="versalitas">{x.etiqueta}</dt>
              <dd className="display">{x.valor}</dd>
              <p className="rt__card-nota">{x.nota}</p>
            </div>
          ))}
        </dl>
        <Evidencia fuente="train_log.json · model_card.json" compacta />
      </div>
    </div>
  );
}

export default RunTerminal;

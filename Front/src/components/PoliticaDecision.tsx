/**
 * Política de decisión (regla de Chow) explicada visualmente con los costos y umbrales de la model card:
 * escala de probabilidad con las tres zonas, aguja interactiva y curva de costo esperado de cada acción.
 */
import { useId, useMemo, useState } from "react";
import card from "@/data/generated/model_card.json";
import { Figura } from "@/charts/Figura";
import { dec, pct } from "@/charts/formatos";
import type { FiguraSpec } from "@/data/tipos";

const C = card.costos;
const U = card.umbrales;

type Dec = "aprobar" | "revisar" | "rechazar";
export const decidirP = (p: number): Dec => (p < U.aprobar ? "aprobar" : p > U.rechazar ? "rechazar" : "revisar");
const ETQ: Record<Dec, string> = { aprobar: "Aprobar", revisar: "Revisar", rechazar: "Rechazar" };

/** Costo esperado (por unidad de exposición) de cada acción para una probabilidad de impago p. */
export const costos = (p: number) => ({ aprobar: p * C.lgd_fn, revisar: C.revision, rechazar: (1 - p) * C.margen_fp });

export function specCostoEsperado(): FiguraSpec {
  const xs = Array.from({ length: 101 }, (_, i) => i / 100);
  return {
    id: "politica_costo_esperado",
    tipo: "lineas",
    titulo: "Costo esperado de cada acción según la probabilidad de impago",
    subtitulo: `Aprobar cuesta p × LGD (${pct(C.lgd_fn, 0)}); rechazar cuesta (1 − p) × margen (${pct(C.margen_fp, 0)}); revisar cuesta ${pct(C.revision, 0)} fijo.`,
    ejes: { x: "Probabilidad de impago (p)", y: "Costo esperado / exposición" },
    datos: {
      series: [
        { nombre: "Aprobar", x: xs, y: xs.map((p) => costos(p).aprobar) },
        { nombre: "Revisar", x: xs, y: xs.map(() => C.revision) },
        { nombre: "Rechazar", x: xs, y: xs.map((p) => costos(p).rechazar) },
      ],
      referencias: [
        { eje: "x", valor: U.aprobar, etiqueta: "aprobar si p <" },
        { eje: "x", valor: U.rechazar, etiqueta: "rechazar si p >" },
      ],
      bandas: [
        { desde: 0, hasta: U.aprobar, etiqueta: "Aprobar" },
        { desde: U.aprobar, hasta: U.rechazar, etiqueta: "Revisar" },
        { desde: U.rechazar, hasta: 1, etiqueta: "Rechazar" },
      ],
    },
    clave: "La política elige, para cada p, la acción de menor costo esperado: por eso los umbrales salen de los costos y no del modelo.",
    opciones: { formato_x: "pct", formato_y: "pct", color_por: "banda", max_y: 0.3 },
    notebook: "08",
    version: card.version,
  };
}

export function PoliticaDecision({ conCurva = true }: { conCurva?: boolean }) {
  const [p, setP] = useState(0.32);
  const id = useId();
  const d = decidirP(p);
  const c = costos(p);
  const spec = useMemo(() => specCostoEsperado(), []);
  const zonas = [
    { d: "aprobar" as Dec, desde: 0, hasta: U.aprobar, share: card.decision_test.tasa_aprobacion },
    { d: "revisar" as Dec, desde: U.aprobar, hasta: U.rechazar, share: card.decision_test.tasa_revision },
    { d: "rechazar" as Dec, desde: U.rechazar, hasta: 1, share: card.decision_test.tasa_rechazo },
  ];
  return (
    <div className="politica">
      <div className="politica__escala-cont">
        <div className="politica__escala" aria-hidden="true">
          {zonas.map((z) => (
            <div
              key={z.d}
              className={`politica__zona politica__zona--${z.d} ${d === z.d ? "activa" : ""}`}
              style={{ left: `${z.desde * 100}%`, width: `${(z.hasta - z.desde) * 100}%` }}
            >
              <span className="politica__zona-etq">{ETQ[z.d]}</span>
              <span className="politica__zona-share">{pct(z.share)} de test</span>
            </div>
          ))}
          <div className="politica__umbral" style={{ left: `${U.aprobar * 100}%` }}>
            <span>{dec(U.aprobar, 3)}</span>
          </div>
          <div className="politica__umbral politica__umbral--bayes" style={{ left: `${U.bayes * 100}%` }}>
            <span>Bayes {dec(U.bayes, 2)}</span>
          </div>
          <div className="politica__umbral" style={{ left: `${U.rechazar * 100}%` }}>
            <span>{dec(U.rechazar, 3)}</span>
          </div>
          <div className={`politica__aguja politica__aguja--${d}`} style={{ left: `${p * 100}%` }}>
            <span className="politica__aguja-etq">
              p = {dec(p, 2)} → <strong>{ETQ[d]}</strong>
            </span>
          </div>
        </div>
        <div className="politica__ticks" aria-hidden="true">
          {[0, 0.5, 1].map((t) => (
            <span key={t} style={{ left: `${t * 100}%` }}>
              {pct(t, 0)}
            </span>
          ))}
        </div>
        <label htmlFor={id} className="sr-only">
          Probabilidad de impago de un cliente hipotético
        </label>
        <input
          id={id}
          className="politica__rango"
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          aria-valuetext={`${pct(p)}: ${ETQ[d]}`}
        />
      </div>

      <div className="politica__costos" aria-live="polite">
        {(["aprobar", "revisar", "rechazar"] as Dec[]).map((k) => (
          <div key={k} className={`politica__costo politica__costo--${k} ${d === k ? "elegida" : ""}`}>
            <span className="versalitas">{ETQ[k]}</span>
            <span className="politica__costo-valor">{pct(c[k])}</span>
            <span className="politica__costo-formula mono">
              {k === "aprobar" ? `p × ${dec(C.lgd_fn, 2)}` : k === "revisar" ? `costo fijo ${dec(C.revision, 2)}` : `(1 − p) × ${dec(C.margen_fp, 2)}`}
            </span>
            {d === k && <span className="politica__menor">menor costo</span>}
          </div>
        ))}
      </div>

      <div className="politica__formulas">
        <p>
          <span className="politica__f-etq politica__f-etq--aprobar">Aprobar</span> si p &lt; C<sub>R</sub> / C<sub>FN</sub> ={" "}
          <span className="mono">
            {dec(C.revision, 2)} / {dec(C.lgd_fn, 2)} = {dec(U.aprobar, 3)}
          </span>
        </p>
        <p>
          <span className="politica__f-etq politica__f-etq--rechazar">Rechazar</span> si p &gt; 1 − C<sub>R</sub> / C<sub>FP</sub> ={" "}
          <span className="mono">
            1 − {dec(C.revision, 2)} / {dec(C.margen_fp, 2)} = {dec(U.rechazar, 3)}
          </span>
        </p>
        <p className="texto-3">
          En medio, revisión manual: {pct(card.decision_test.tasa_revision)} de los casos de test, por debajo de la capacidad de {pct(C.capacidad_revision, 0)}.
        </p>
      </div>

      {conCurva && <Figura spec={spec} alto={300} />}
    </div>
  );
}

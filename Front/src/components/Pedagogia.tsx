/**
 * Piezas pedagógicas de cada capítulo: «Antes de empezar» (objetivos y conceptos explicados para un principiante)
 * y «Comprueba lo aprendido» (preguntas de repaso con su respuesta). Texto en content/recorridos y content/glosario.
 */
import { Link } from "react-router-dom";
import { POR_ID } from "@/content/glosario";
import type { Pregunta, Recorrido } from "@/content/pedagogia";

export function AntesDeEmpezar({ recorrido }: { recorrido: Recorrido }) {
  const conceptos = recorrido.conceptos.map((id) => POR_ID.get(id)).filter((e) => e != null);
  return (
    <div className="antes">
      <div className="antes__objetivos">
        <span className="versalitas">Al terminar este capítulo usted podrá</span>
        <ol>
          {recorrido.objetivos.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ol>
      </div>
      {conceptos.length > 0 && (
        <div className="antes__conceptos">
          <div className="antes__conceptos-cab">
            <span className="versalitas">Conceptos de este capítulo</span>
            <p>Léalos antes de seguir: son las ideas que el capítulo usa. Los términos subrayados en el resto del sitio abren su definición.</p>
          </div>
          <ul className="conceptos">
            {conceptos.map((e) => (
              <li key={e.id} className="concepto" id={`concepto-${e.id}`}>
                <h3 className="concepto__nombre">{e.termino}</h3>
                <p className="concepto__que">{e.queEs}</p>
                <p className="concepto__para">
                  <span className="concepto__rotulo">Para qué sirve</span> {e.paraQue}
                </p>
                <details className="concepto__mas">
                  <summary>{e.comoSeLee ? "Cómo se lee y qué papel cumple aquí" : "Qué papel cumple en este proyecto"}</summary>
                  {e.comoSeLee && (
                    <p>
                      <span className="concepto__rotulo">Cómo se lee</span> {e.comoSeLee}
                    </p>
                  )}
                  <p>
                    <span className="concepto__rotulo">En este proyecto</span> {e.enEsteProyecto}
                  </p>
                  <Link to={`/glosario#${e.id}`} className="concepto__ir">
                    Ver en el glosario →
                  </Link>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Repaso({ preguntas }: { preguntas: Pregunta[] }) {
  if (!preguntas.length) return null;
  return (
    <div className="repaso">
      <span className="versalitas">Comprueba lo aprendido</span>
      <ol className="repaso__lista">
        {preguntas.map((p, i) => (
          <li key={p.pregunta} className="repaso__item">
            <details>
              <summary>
                <span className="repaso__n mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="repaso__pregunta">{p.pregunta}</span>
                <span className="repaso__ver" aria-hidden="true">
                  Ver respuesta
                </span>
              </summary>
              <p className="repaso__respuesta">{p.respuesta}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

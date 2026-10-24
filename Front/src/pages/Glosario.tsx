/**
 * /glosario — Todos los conceptos del proyecto explicados para un principiante: qué es, para qué sirve, cómo se
 * lee y qué papel cumple aquí. Búsqueda, filtro por categoría y anclas #id (los <Termino> enlazan aquí).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buscarGlosario, GLOSARIO } from "@/content/glosario";
import { CATEGORIAS, type CategoriaGlosario } from "@/content/pedagogia";
import { pasoPorNumero } from "@/content/pasos";
import "./glosario.css";

type Filtro = "todas" | CategoriaGlosario;

export default function Glosario() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Filtro>("todas");
  const { hash } = useLocation();
  const lista = useMemo(() => buscarGlosario(q).filter((e) => cat === "todas" || e.categoria === cat), [q, cat]);
  const grupos = useMemo(
    () =>
      (Object.keys(CATEGORIAS) as CategoriaGlosario[])
        .map((c) => ({ c, entradas: lista.filter((e) => e.categoria === c) }))
        .filter((g) => g.entradas.length),
    [lista],
  );

  // Enlace profundo /glosario#id: lleva al término y lo resalta.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("glo-entrada--destino");
      const t = window.setTimeout(() => el.classList.remove("glo-entrada--destino"), 2400);
      return () => window.clearTimeout(t);
    }
  }, [hash]);

  return (
    <div className="glo contenedor">
      <header className="glo__cab">
        <span className="versalitas">Glosario · {GLOSARIO.length} conceptos</span>
        <h1 className="glo__titulo">
          Cada concepto, <span className="texto-2">explicado desde cero.</span>
        </h1>
        <p className="glo__intro">
          Para quien empieza: qué es cada término, para qué sirve, cómo se lee y qué papel cumple en este proyecto de riesgo de crédito.
          En los capítulos, las palabras subrayadas con puntos abren su definición.
        </p>
      </header>

      <div className="glo__filtros">
        <label className="glo__buscar">
          <span className="sr-only">Buscar en el glosario</span>
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: histograma, AUC, pandas, Docker…" />
        </label>
        <div className="glo__cats" role="group" aria-label="Filtrar por categoría">
          {(["todas", ...Object.keys(CATEGORIAS)] as Filtro[]).map((c) => (
            <button key={c} type="button" className={`glo__cat ${cat === c ? "activo" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c === "todas" ? "Todas" : CATEGORIAS[c]}
            </button>
          ))}
        </div>
        <p className="glo__conteo mono" aria-live="polite">
          {lista.length} de {GLOSARIO.length} conceptos
        </p>
      </div>

      {grupos.length === 0 && <p className="glo__vacio">Ningún concepto coincide con «{q}».</p>}

      {grupos.map((g) => (
        <section key={g.c} className="glo__grupo" aria-labelledby={`glo-${g.c}`}>
          <h2 id={`glo-${g.c}`} className="glo__grupo-titulo">
            {CATEGORIAS[g.c]} <span className="mono">{g.entradas.length}</span>
          </h2>
          <div className="glo__lista">
            {g.entradas.map((e) => {
              const cap = e.capitulo != null ? pasoPorNumero(e.capitulo) : undefined;
              return (
                <article key={e.id} id={e.id} className="glo-entrada">
                  <h3 className="glo-entrada__termino">{e.termino}</h3>
                  <p className="glo-entrada__corto">{e.corto}</p>
                  <dl className="glo-entrada__def">
                    <div>
                      <dt>Qué es</dt>
                      <dd>{e.queEs}</dd>
                    </div>
                    <div>
                      <dt>Para qué sirve</dt>
                      <dd>{e.paraQue}</dd>
                    </div>
                    {e.comoSeLee && (
                      <div>
                        <dt>Cómo se lee</dt>
                        <dd>{e.comoSeLee}</dd>
                      </div>
                    )}
                    <div>
                      <dt>En este proyecto</dt>
                      <dd>{e.enEsteProyecto}</dd>
                    </div>
                  </dl>
                  {cap && (
                    <Link to={cap.ruta} className="glo-entrada__cap mono">
                      Aparece en: {cap.n === 0 ? "Metodología" : `Cap. ${String(cap.n).padStart(2, "0")} · ${cap.tituloCorto}`} →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

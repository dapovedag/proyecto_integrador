/**
 * Tabla accesible con los datos exactos de una figura (también es la vista para lectores de pantalla).
 */
import { useId, useMemo, useState } from "react";
import type { FiguraSpec } from "@/data/tipos";
import { num } from "./formatos";
import { tablaDeSpec } from "./tablaDatos";

export function TablaDatos({ spec, id }: { spec: FiguraSpec; id?: string }) {
  const t = useMemo(() => tablaDeSpec(spec), [spec]);
  return (
    <div className="tabla-datos" id={id}>
      <div className="tabla-datos__scroll" tabIndex={0} role="region" aria-label={`Datos de: ${spec.titulo}`}>
        <table>
          <caption className="sr-only">Datos de la figura «{spec.titulo}»</caption>
          <thead>
            <tr>
              {t.columnas.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.filas.map((f, i) => (
              <tr key={i}>
                {f.map((v, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {v}
                    </th>
                  ) : (
                    <td key={j}>{v}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.total > t.filas.length && (
        <p className="tabla-datos__nota">
          Se muestran {num(t.filas.length)} de {num(t.total)} filas.
        </p>
      )}
    </div>
  );
}

export function VerDatos({ spec, inicial = false }: { spec: FiguraSpec; inicial?: boolean }) {
  const [abierto, setAbierto] = useState(inicial);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className="ver-datos"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M2 3.5h12M2 8h12M2 12.5h12M6 3.5v9" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
        {abierto ? "Ocultar datos" : "Ver datos"}
      </button>
      {abierto && (
        <div className="ver-datos__panel">
          <TablaDatos spec={spec} id={id} />
        </div>
      )}
    </>
  );
}

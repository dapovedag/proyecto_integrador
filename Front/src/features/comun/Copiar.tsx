/** Botón "Copiar" con confirmación accesible (portapapeles local; sin red). */
import { useEffect, useState } from "react";

export function Copiar({ texto, etiqueta = "Copiar", className = "" }: { texto: string; etiqueta?: string; className?: string }) {
  const [hecho, setHecho] = useState(false);
  useEffect(() => {
    if (!hecho) return;
    const t = setTimeout(() => setHecho(false), 1600);
    return () => clearTimeout(t);
  }, [hecho]);
  return (
    <button
      type="button"
      className={`copiar ${hecho ? "copiar--hecho" : ""} ${className}`}
      onClick={() => {
        void navigator.clipboard?.writeText(texto).then(
          () => setHecho(true),
          () => setHecho(false),
        );
      }}
      aria-label={hecho ? "Copiado al portapapeles" : etiqueta}
    >
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
        {hecho ? (
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H4.1A1.6 1.6 0 0 0 2.5 3.1v4.8a1.6 1.6 0 0 0 1.6 1.6h.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </>
        )}
      </svg>
      <span>{hecho ? "Copiado" : etiqueta}</span>
    </button>
  );
}

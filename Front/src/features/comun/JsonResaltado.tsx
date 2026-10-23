/** JSON indentado con resaltado propio (claves, cadenas, números, literales) — sin dependencias. */
import { Fragment, useMemo } from "react";

const RE = /("(?:\.|[^"\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])/g;

export function tokensJson(texto: string): { t: string; c?: string }[] {
  const out: { t: string; c?: string }[] = [];
  let i = 0;
  for (const m of texto.matchAll(RE)) {
    const idx = m.index ?? 0;
    if (idx > i) out.push({ t: texto.slice(i, idx) });
    if (m[1]) {
      out.push({ t: m[1], c: m[2] ? "j-clave" : "j-cadena" });
      if (m[2]) out.push({ t: m[2], c: "j-punt" });
    } else if (m[3]) out.push({ t: m[3], c: "j-numero" });
    else if (m[4]) out.push({ t: m[4], c: "j-literal" });
    else if (m[5]) out.push({ t: m[5], c: "j-punt" });
    i = idx + m[0].length;
  }
  if (i < texto.length) out.push({ t: texto.slice(i) });
  return out;
}

export function JsonResaltado({ valor, texto, className = "" }: { valor?: unknown; texto?: string; className?: string }) {
  const s = useMemo(() => texto ?? JSON.stringify(valor, null, 2), [valor, texto]);
  const toks = useMemo(() => tokensJson(s), [s]);
  return (
    <pre className={`json ${className}`}>
      <code>
        {toks.map((k, i) => (k.c ? <span key={i} className={k.c}>{k.t}</span> : <Fragment key={i}>{k.t}</Fragment>))}
      </code>
    </pre>
  );
}

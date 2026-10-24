/**
 * Glosario pedagógico: une las entradas (base, modelos y extra) y ofrece búsqueda por id y por alias.
 * El catálogo de ids (fuente única) está en content/pedagogia.ts; la prueba verifica que no falte ninguno.
 */
import type { EntradaGlosario } from "../pedagogia";
import { GLOSARIO_BASE } from "./base";
import { GLOSARIO_EXTRA } from "./extra";
import { GLOSARIO_MODELOS } from "./modelos";

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const GLOSARIO: EntradaGlosario[] = [...GLOSARIO_BASE, ...GLOSARIO_MODELOS, ...GLOSARIO_EXTRA].sort((a, b) =>
  sinTildes(a.termino).localeCompare(sinTildes(b.termino), "es"),
);

export const POR_ID = new Map(GLOSARIO.map((e) => [e.id, e]));

const POR_ALIAS = new Map<string, EntradaGlosario>();
for (const e of GLOSARIO) for (const a of [e.id, ...e.alias]) if (a && !POR_ALIAS.has(sinTildes(a))) POR_ALIAS.set(sinTildes(a), e);

/** Entrada cuyo alias coincide exactamente con el texto (p. ej. «StandardScaler», «pd», «train_test_split»). */
export function entradaPorAlias(texto: string): EntradaGlosario | undefined {
  const t = sinTildes(texto.trim().replace(/\(\)$/, ""));
  return POR_ALIAS.get(t) ?? POR_ALIAS.get(t.split(".").pop() ?? t);
}

/** Búsqueda libre para la página del glosario (término, alias y texto corto). */
export function buscarGlosario(q: string): EntradaGlosario[] {
  const t = sinTildes(q.trim());
  if (!t) return GLOSARIO;
  return GLOSARIO.filter((e) => sinTildes(`${e.termino} ${e.alias.join(" ")} ${e.corto}`).includes(t));
}

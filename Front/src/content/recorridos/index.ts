/** Recorrido pedagógico por capítulo (objetivos, conceptos previos, repaso y aprendizaje en lenguaje claro). */
import type { Recorrido } from "../pedagogia";
import { RECORRIDO_01 } from "./cap01";
import { RECORRIDO_02 } from "./cap02";
import { RECORRIDO_03 } from "./cap03";
import { RECORRIDO_04 } from "./cap04";
import { RECORRIDO_05 } from "./cap05";
import { RECORRIDO_06 } from "./cap06";
import { RECORRIDO_07 } from "./cap07";
import { RECORRIDO_08 } from "./cap08";
import { RECORRIDO_09 } from "./cap09";
import { RECORRIDO_10 } from "./cap10";
import { RECORRIDO_11 } from "./cap11";

export const RECORRIDOS: Record<number, Recorrido> = {
  1: RECORRIDO_01,
  2: RECORRIDO_02,
  3: RECORRIDO_03,
  4: RECORRIDO_04,
  5: RECORRIDO_05,
  6: RECORRIDO_06,
  7: RECORRIDO_07,
  8: RECORRIDO_08,
  9: RECORRIDO_09,
  10: RECORRIDO_10,
  11: RECORRIDO_11,
};

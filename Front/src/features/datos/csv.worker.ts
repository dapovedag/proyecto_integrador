/// <reference lib="webworker" />
/** Web Worker: parsea el CSV fuera del hilo principal y devuelve la tabla tipada. */
import { parsearCsv } from "./perfil";

self.onmessage = (e: MessageEvent<{ id: string; texto: string }>) => {
  const t0 = performance.now();
  const tabla = parsearCsv(e.data.texto);
  (self as unknown as Worker).postMessage({ id: e.data.id, tabla, ms: performance.now() - t0 });
};

# ADR-004 · Front estático autónomo con simulación fiel

- **Estado:** Aceptado (2026-10-23).
- **Historias:** HU-23, HU-24, HU-25, HU-26, HU-27, HU-28 · **IDs:** F5, R4, E4

## Contexto

El front del MVP tenía cifras escritas a mano y dependía del back: llamaba a `/api` (una función Python en Vercel) o a `127.0.0.1:8000`. Sin back no había demo, y lo mostrado podía no coincidir con lo producido. El usuario fijó como regla de máxima prioridad que **el front no dependa del back en ningún momento**.

## Decisión

- **Vite + React + TypeScript**, 100 % estático. Sin cliente HTTP hacia el back.
- **Paquete de corrida.** Todos los datos salen de `Back/scripts/exportar_front.py`, ejecutado en local después de la corrida real del back. Escribe JSON tipados en `Front/src/data/generated/` y activos pesados en `Front/public/run/`: CSV, notebooks ejecutados, capturas reales de la API, log de `train.py` y `manifest.json` con versión, git sha y SHA-256.
- **Simulación fiel:**
  - `NotebookPlayer` reproduce los notebooks con sus salidas y tiempos reales.
  - `ApiConsole` reproduce las capturas reales de la API.
  - `RunTerminal` reproduce el log de entrenamiento.
- **Motor exacto en TS.** `scoring.ts` y `texto.ts` portan el pipeline servido desde `modelo_export.json` y `texto_export.json`. Vitest compara contra `golden.json` con |Δ| < 1e-6, y el build falla si no coinciden.
- **Despliegue.** Vercel sirve **solo** el estático (`Front/dist`). La API se despliega con **Docker** (IA3.5) y corre en local. Se eliminan `api/index.py` y el `requirements.txt` raíz.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Front que llama a la API (MVP) | Frágil: sin back no hay demo; además expone una función serverless pesada. |
| API serverless en Vercel | Límites de tamaño y arranque en frío con sklearn; duplica el despliegue que ya cubre Docker. |
| Ejecutar Python en el navegador (Pyodide) | Descarga pesada y lenta; no reproduce TensorFlow, BERT ni Spark. |
| Cifras fijas en componentes | Es exactamente el problema del MVP. |

## Consecuencias

- (+) La demo funciona sin conexión al back, y cada cifra es trazable a un archivo con hash.
- (+) El simulador responde al instante, con los mismos valores que la API.
- (−) Hay que mantener el port TS en paridad: lo protege el golden.
- (−) El paquete de corrida se regenera y se commitea tras cada corrida del back.

## Evidencia / verificación

- `npm --prefix Front run build` y `npm --prefix Front run test` (esquemas, golden y consistencia con el manifest).
- `npx --prefix Front playwright test` con el back apagado: **falla si sale cualquier petición** fuera de los estáticos del sitio.
- `vercel.json` (build solo de Vite) y `.vercelignore` (excluye `.env*`, `Back/`, `db/` y `docs/`).

/**
 * Nube PCA real (public/run/nube_pca.json): 12.000 clientes en canvas que respiran y se reorganizan.
 *   modo: "decision" (banda del modelo) · "impago" (desenlace real) · "conjunto" (train / test)
 *   separado: reparte los grupos en paneles (pequeños múltiplos) conservando las coordenadas PCA.
 * DPR acotado a 2, pausa fuera de pantalla y en pestañas ocultas, estático con prefers-reduced-motion.
 */
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { num, pct } from "@/charts/formatos";
import { useRecurso } from "@/data/cargar";
import type { NubePca as TNube } from "@/data/tipos";
import { Cargando } from "./base";

export type ModoNube = "decision" | "impago" | "conjunto";

export const GRUPOS_NUBE: Record<ModoNube, { col: 2 | 3 | 4; etiquetas: string[]; colores: string[] }> = {
  decision: { col: 3, etiquetas: ["Aprobar", "Revisar", "Rechazar"], colores: ["#34D399", "#FBBF24", "#F87171"] },
  impago: { col: 2, etiquetas: ["Pagó", "Impago"], colores: ["#60A5FA", "#F87171"] },
  conjunto: { col: 4, etiquetas: ["Entrenamiento", "Prueba"], colores: ["#7B84FF", "#E8742A"] },
};

const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function cuantil(arr: Float32Array, q: number) {
  const s = Array.from(arr).sort((a, b) => a - b);
  return s[Math.floor(q * (s.length - 1))];
}

export interface ResumenNube {
  n: number;
  varianza: [number, number];
  conteos: number[];
}

export function NubePca({
  modo,
  separado = false,
  alto = 520,
  onResumen,
  className = "",
}: {
  modo: ModoNube;
  separado?: boolean;
  alto?: number;
  onResumen?: (r: ResumenNube) => void;
  className?: string;
}) {
  const r = useRecurso<TNube>("nube_pca.json");
  const canvas = useRef<HTMLCanvasElement>(null);
  const reducido = useReducedMotion();
  const estado = useRef({ modo, separado, t0: 0, tColor: 1, desdeModo: modo });

  // Datos empaquetados en arreglos tipados
  const datos = useMemo(() => {
    if (!r.datos) return null;
    const P = r.datos.puntos;
    const n = P.length;
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const g = { decision: new Uint8Array(n), impago: new Uint8Array(n), conjunto: new Uint8Array(n) };
    const fase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const p = P[i];
      x[i] = p[0];
      y[i] = p[1];
      g.impago[i] = p[2] ? 1 : 0;
      g.decision[i] = Math.max(0, Math.min(2, Math.round(p[3])));
      g.conjunto[i] = p[4] ? 1 : 0;
      fase[i] = (Math.sin(i * 12.9898) * 43758.5453) % (Math.PI * 2);
    }
    const lim = { x0: cuantil(x, 0.004), x1: cuantil(x, 0.996), y0: cuantil(y, 0.004), y1: cuantil(y, 0.996) };
    return { n, x, y, g, fase, lim, varianza: r.datos.varianza_explicada };
  }, [r.datos]);

  const conteos = useMemo(() => {
    if (!datos) return [];
    const k = GRUPOS_NUBE[modo].etiquetas.length;
    const c = new Array(k).fill(0);
    for (let i = 0; i < datos.n; i++) c[datos.g[modo][i]]++;
    return c;
  }, [datos, modo]);

  useEffect(() => {
    if (datos && onResumen) onResumen({ n: datos.n, varianza: datos.varianza, conteos });
  }, [datos, conteos, onResumen]);

  // Cambios de modo / separación → arranca transición
  useEffect(() => {
    const e = estado.current;
    if (e.modo !== modo) {
      e.desdeModo = e.modo;
      e.modo = modo;
      e.tColor = 0;
    }
    e.separado = separado;
  }, [modo, separado]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !datos) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { n, x, y, g, fase, lim } = datos;
    const px = new Float32Array(n); // posición actual (css px)
    const py = new Float32Array(n);
    const tx = new Float32Array(n);
    const ty = new Float32Array(n);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let visible = true;
    let raf = 0;
    let primera = true;
    let ultimoLayout = "";

    const calcularObjetivos = () => {
      const e = estado.current;
      const grupos = GRUPOS_NUBE[e.modo].etiquetas.length;
      const pad = Math.max(14, Math.min(W, H) * 0.06);
      const sep = e.separado;
      const k = sep ? grupos : 1;
      const gap = sep ? Math.max(10, W * 0.025) : 0;
      const pw = (W - pad * 2 - gap * (k - 1)) / k;
      const ph = H - pad * 2 - (sep ? 22 : 0);
      // conserva la proporción del plano PCA
      const sx = (lim.x1 - lim.x0) || 1;
      const sy = (lim.y1 - lim.y0) || 1;
      const esc = Math.min(pw / sx, ph / sy);
      const offX = (pw - sx * esc) / 2;
      const offY = (ph - sy * esc) / 2 + (sep ? 22 : 0);
      const gm = g[e.modo];
      for (let i = 0; i < n; i++) {
        const panel = sep ? gm[i] : 0;
        tx[i] = pad + panel * (pw + gap) + offX + (x[i] - lim.x0) * esc;
        ty[i] = pad + offY + (lim.y1 - y[i]) * esc;
      }
      ultimoLayout = `${e.modo}|${e.separado}|${W}|${H}`;
    };

    const redimensionar = () => {
      const rect = cv.getBoundingClientRect();
      W = Math.max(200, rect.width);
      H = Math.max(160, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      calcularObjetivos();
      if (!primera) pintar(performance.now()); // sin parpadeo al redimensionar
      if (primera) {
        // entrada: desde el centro, con dispersión mínima
        for (let i = 0; i < n; i++) {
          px[i] = reducido ? tx[i] : W / 2 + (tx[i] - W / 2) * 0.05;
          py[i] = reducido ? ty[i] : H / 2 + (ty[i] - H / 2) * 0.05;
        }
        primera = false;
      }
    };

    const colores = (m: ModoNube) => GRUPOS_NUBE[m].colores.map(hexRgb);

    // índices de puntos por par (grupo anterior, grupo nuevo), recalculados solo al cambiar de modo
    const cachePares = new Map<string, Int32Array[][]>();
    const pares = (ma: ModoNube, mb: ModoNube) => {
      const clave = `${ma}|${mb}`;
      let r = cachePares.get(clave);
      if (!r) {
        const A = GRUPOS_NUBE[ma].etiquetas.length;
        const B = GRUPOS_NUBE[mb].etiquetas.length;
        const listas: number[][][] = Array.from({ length: A }, () => Array.from({ length: B }, () => []));
        const ga = g[ma];
        const gb = g[mb];
        for (let i = 0; i < n; i++) listas[ga[i]][gb[i]].push(i);
        r = listas.map((fila) => fila.map((l) => Int32Array.from(l)));
        cachePares.set(clave, r);
      }
      return r;
    };

    let tPrev = performance.now();
    const pintar = (ahora: number) => {
      const e = estado.current;
      const dt = Math.min(0.05, (ahora - tPrev) / 1000);
      tPrev = ahora;
      const layout = `${e.modo}|${e.separado}|${W}|${H}`;
      if (layout !== ultimoLayout) calcularObjetivos();
      if (reducido) {
        e.tColor = 1;
        for (let i = 0; i < n; i++) (px[i] = tx[i]), (py[i] = ty[i]);
      } else {
        e.tColor = Math.min(1, e.tColor + dt / 0.9);
      }
      const k = 1 - Math.pow(0.0009, dt); // suavizado independiente del framerate
      const t = ahora / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const cA = colores(e.desdeModo);
      const cB = colores(e.modo);
      const P = pares(e.desdeModo, e.modo);
      const te = e.tColor < 1 ? 1 - Math.pow(1 - e.tColor, 3) : 1;
      const s = W < 520 ? 1.5 : 1.8;
      const amp = reducido ? 0 : 0.9;
      // lote por par (grupo anterior, grupo nuevo): ≤ 9 cambios de fillStyle por cuadro
      for (let a = 0; a < cA.length; a++) {
        for (let b = 0; b < cB.length; b++) {
          const ca = cA[a];
          const cb = cB[b];
          const rr = Math.round(ca[0] + (cb[0] - ca[0]) * te);
          const gg = Math.round(ca[1] + (cb[1] - ca[1]) * te);
          const bb = Math.round(ca[2] + (cb[2] - ca[2]) * te);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},0.62)`;
          const idx = P[a][b];
          for (let j = 0; j < idx.length; j++) {
            const i = idx[j];
            const demora = (i % 997) / 997;
            const kk = Math.min(1, k * (1.25 - demora * 0.6));
            px[i] += (tx[i] - px[i]) * kk;
            py[i] += (ty[i] - py[i]) * kk;
            const f = fase[i];
            const ox = Math.sin(t * 0.7 + f) * amp;
            const oy = Math.cos(t * 0.55 + f * 1.3) * amp;
            ctx.fillRect(px[i] + ox - s / 2, py[i] + oy - s / 2, s, s);
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
      // rótulos de paneles en modo separado
      if (e.separado) {
        const et = GRUPOS_NUBE[e.modo].etiquetas;
        const grupos = et.length;
        const pad = Math.max(14, Math.min(W, H) * 0.06);
        const gap = Math.max(10, W * 0.025);
        const pw = (W - pad * 2 - gap * (grupos - 1)) / grupos;
        ctx.font = `500 10.5px "JetBrains Mono Variable", ui-monospace, monospace`;
        ctx.fillStyle = "rgba(169,172,186,0.9)";
        ctx.textBaseline = "top";
        for (let j = 0; j < grupos; j++) ctx.fillText(et[j].toUpperCase(), pad + j * (pw + gap), pad - 2);
      }
      if (e.modo !== e.desdeModo && e.tColor >= 1) e.desdeModo = e.modo;
    };
    const bucle = (ahora: number) => {
      pintar(ahora);
      if (visible && !reducido) raf = requestAnimationFrame(bucle);
    };

    redimensionar();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => redimensionar()) : null;
    ro?.observe(cv);
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([en]) => {
            const v = en.isIntersecting && document.visibilityState === "visible";
            if (v && !visible) {
              visible = true;
              tPrev = performance.now();
              raf = requestAnimationFrame(bucle);
            } else if (!v) {
              visible = false;
              cancelAnimationFrame(raf);
            }
          })
        : null;
    io?.observe(cv);
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        visible = false;
        cancelAnimationFrame(raf);
      } else {
        visible = true;
        tPrev = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(bucle);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(bucle);
    // con movimiento reducido: redibuja ante cambios de modo
    const intervalo = reducido ? window.setInterval(() => requestAnimationFrame(pintar), 400) : 0;
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (intervalo) clearInterval(intervalo);
    };
  }, [datos, reducido]);

  const G = GRUPOS_NUBE[modo];
  const total = conteos.reduce((a, b) => a + b, 0) || 1;
  const desc = datos
    ? `Proyección PCA de ${num(datos.n)} clientes reales, coloreada por ${modo === "decision" ? "la decisión del modelo" : modo === "impago" ? "el desenlace real" : "el conjunto de datos"}: ${G.etiquetas
        .map((e, i) => `${e} ${pct(conteos[i] / total)}`)
        .join(", ")}.`
    : "Cargando la nube PCA.";

  return (
    <div className={`nube ${className}`} style={alto ? { height: alto } : undefined}>
      {r.estado === "cargando" && <Cargando etiqueta="Proyectando 12.000 clientes" alto={alto} />}
      {r.estado !== "cargando" && !datos && <div className="nube__vacia">La nube PCA no está en el paquete de corrida.</div>}
      <canvas ref={canvas} className="nube__lienzo" role="img" aria-label={desc} style={{ opacity: datos ? 1 : 0 }} />
      {datos && (
        <ul className="nube__leyenda" aria-hidden="true">
          {G.etiquetas.map((e, i) => (
            <li key={e}>
              <span className="nube__punto" style={{ background: G.colores[i], boxShadow: `0 0 10px ${G.colores[i]}` }} />
              <span className="nube__etq">{e}</span>
              <span className="nube__val">{pct(conteos[i] / total)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {desc}
      </p>
    </div>
  );
}

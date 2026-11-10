// La marca de las animaciones: lo mismo que se usa en todas para que se lean
// como una sola pieza. Los colores de ciclo son los del visor 4D de Syncroniza
// (gantt.ts / ciclos.ts): un rojo acá es el "Ciclo 1" de allá.

export const COLOR = {
  fondo: '#000000',
  superficie: '#181818',
  linea: 'rgba(255,255,255,0.10)',
  lineaFuerte: 'rgba(255,255,255,0.22)',
  texto: '#FFFFFF',
  texto2: '#C8C8C8',
  texto3: '#9B9B9B',
  texto4: '#6E6E6E',
  acento: '#37B6FF', // azul claro del isotipo
  acentoMedio: '#0C699D',
  acentoOscuro: '#20366F',
  bien: '#22c55e', // verde "terminada" del modo avance real
  alerta: '#ECC94B',
  mal: '#E53E3E',
  enCurso: '#888888', // gris del 4D para lo que está en curso
};

export const CICLOS = ['#E53E3E', '#ECC94B', '#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#F687B3', '#81E6D9'];

export const FUENTE = "'Geist Variable', system-ui, sans-serif";
export const FUENTE_MONO = "'Geist Mono Variable', ui-monospace, monospace";

// ── Tiempo de la animación ─────────────────────────────────────────────────
// Todo se calcula a partir de un progreso p ∈ [0, 1]. Nada corre con reloj:
// así la misma escena sirve movida por el scroll o exportada cuadro a cuadro.
export const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const tramo = (p, a, b) => limitar((p - a) / (b - a));
// Ease con inercia (smootherstep): arranca y frena como una grúa.
export const suave = (t) => { t = limitar(t); return t * t * t * (t * (t * 6 - 15) + 10); };
// La curva de la marca, cubic-bezier(0.32, 0.72, 0, 1), resuelta por bisección.
export function fluido(x) {
  x = limitar(x);
  const bz = (t, p1, p2) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 28; i++) { t = (lo + hi) / 2; if (bz(t, 0.32, 0) < x) lo = t; else hi = t; }
  return bz(t, 0.72, 1);
}

// Números como en Chile: punto de miles, coma decimal.
const fmt0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (n, dec = 0) => (dec === 0 ? fmt0 : dec === 1 ? fmt1 : fmt2).format(n);

export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
export const fechaCorta = (f) => `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;

// Generador pseudoaleatorio con semilla: los datos "inventados" salen siempre
// iguales, así el video y la web muestran exactamente lo mismo.
export function azar(semilla = 7) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Piezas comunes de las escenas de datos (SVG). Cada escena tiene dos formatos:
//   horizontal (1920 × 1080): la escena completa, con sello, cabecera e
//     indicadores, para web y YouTube;
//   vertical (1080 × 760): solo el gráfico y con letra de teléfono, para el
//     marco de LinkedIn (linkedin.js), que pone el gancho arriba y los
//     indicadores abajo. La escena se los entrega con indicadores().
import { COLOR, FUENTE, FUENTE_MONO } from '../marca.js';
import { selloSVG } from '../sello.js';

const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, padre) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (padre) padre.appendChild(n);
  return n;
}

export const FORMATOS = {
  horizontal: { W: 1920, H: 1080 },
  vertical: { W: 1080, H: 760 },
};

export function lienzo(contenedor, opciones = {}) {
  const formato = opciones.formato === 'vertical' ? 'vertical' : 'horizontal';
  contenedor.classList.add('escena');
  const { W, H } = FORMATOS[formato];
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, contenedor);
  svg.style.fontFamily = FUENTE;
  return { svg, W, H, vertical: formato === 'vertical' };
}

// Cabecera del formato horizontal: sello, módulo, obra y bajada. El sello
// queda fuera del grupo que aparece con el progreso: se ve desde el primer
// cuadro, que es el que queda de miniatura.
export function cabecera(svg, { eti, titulo, sub = '' }) {
  selloSVG(svg, { x: 170, y: 62, alto: 44 });
  const cab = el('g', {}, svg);
  el('text', { x: 170, y: 150, fill: COLOR.acento, 'font-family': FUENTE_MONO, 'font-size': 20, 'font-weight': 500, 'letter-spacing': 4 }, cab).textContent = eti;
  el('text', { x: 170, y: 212, fill: COLOR.texto, 'font-size': 46, 'font-weight': 600, 'letter-spacing': -0.8 }, cab).textContent = titulo;
  const tSub = el('text', { x: 170, y: 254, fill: COLOR.texto3, 'font-size': 24 }, cab);
  tSub.textContent = sub;
  return { cab, tSub };
}

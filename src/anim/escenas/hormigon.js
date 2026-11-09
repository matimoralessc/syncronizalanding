// Escena de datos: hormigón programado contra colocado, guía por guía.
//
// Sale del MISMO modelo de la torre 3D (datos/torre.js): el programado son los
// m³ de cada losa, muro y pilar en la semana en que el programa los termina.
// Cada camión (~7,5 m³) es una guía de despacho y cae como un punto en la
// semana en que llegó; las que tuvieron sobrestadía quedan en ámbar.
import { hormigonDeLaObra, SEMANA_DESDE } from '../datos/hormigon.js';
import { OBRA, fechaDeSemana } from '../datos/obra.js';
import { COLOR, FUENTE_MONO, MESES, limitar, tramo, fluido, suave, num, lerp } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

const W0 = SEMANA_DESDE, W1 = OBRA.corte; // de las fundaciones al corte

// Gráfico arriba y banda de guías abajo, en los dos formatos.
const MEDIDAS = {
  horizontal: { X0: 170, X1: 1750, Y0: 700, Y1: 330, eje: 17, mes: 16, total: 17, yBanda: 778, base: 1040, altoBanda: 230, rMax: 3.6, banda: 15 },
  vertical: { X0: 118, X1: 1012, Y0: 420, Y1: 88, eje: 21, mes: 20, total: 20, yBanda: 528, base: 744, altoBanda: 190, rMax: 4.2, banda: 18 },
};

export default function crearHormigon(contenedor, opciones = {}) {
  const { svg, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;
  const { totalM3, planM3, realM3, guias } = hormigonDeLaObra();

  // ── Cabecera e indicadores (solo horizontal) ────────────────────────────
  let cab = null, kpis = null, kM3, kGuias, kSobre;
  if (!vertical) {
    ({ cab } = cabecera(svg, { eti: 'HORMIGÓN · PROGRAMADO CONTRA COLOCADO', titulo: OBRA.nombre, sub: 'Cada punto es una guía de despacho leída por WhatsApp' }));
    kpis = el('g', {}, svg);
    const kpi = (x, rotulo, color) => {
      el('text', { x, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, kpis).textContent = rotulo;
      return el('text', { x, y: 222, fill: color, 'font-family': FUENTE_MONO, 'font-size': 60, 'font-weight': 500, 'text-anchor': 'end' }, kpis);
    };
    kM3 = kpi(1270, 'M³ COLOCADOS', COLOR.acento);
    kGuias = kpi(1520, 'GUÍAS', COLOR.texto);
    kSobre = kpi(1750, 'SOBRESTADÍA', COLOR.alerta);
  }

  // ── Gráfico ─────────────────────────────────────────────────────────────
  const { X0, X1, Y0, Y1 } = L;
  const sx = (w) => X0 + ((w - W0) / (W1 - W0)) * (X1 - X0);
  const tope = Math.ceil(totalM3 / 1000) * 1000;
  const sy = (m3) => Y0 - (m3 / tope) * (Y0 - Y1);
  const grilla = el('g', {}, svg);
  for (let m = 0; m <= tope; m += 1000) {
    el('line', { x1: X0, x2: X1, y1: sy(m), y2: sy(m), stroke: m === 0 ? COLOR.lineaFuerte : COLOR.linea }, grilla);
    el('text', { x: X0 - 20, y: sy(m) + L.eje * 0.35, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.eje, 'text-anchor': 'end' }, grilla).textContent = num(m);
  }
  let mesPrevio = null;
  for (let w = W0; w <= W1; w += 0.25) {
    const f = fechaDeSemana(w);
    if (f.getMonth() !== mesPrevio) {
      if (mesPrevio !== null) {
        el('text', { x: sx(w), y: Y0 + L.mes * 2.25, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.mes, 'text-anchor': 'middle' }, grilla).textContent = MESES[f.getMonth()].toUpperCase();
      }
      mesPrevio = f.getMonth();
    }
  }
  const total = el('g', {}, svg);
  el('line', { x1: X0, x2: X1, y1: sy(totalM3), y2: sy(totalM3), stroke: COLOR.texto3, 'stroke-dasharray': '2 6' }, total);
  el('text', { x: X1, y: sy(totalM3) - 12, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.total, 'text-anchor': 'end' }, total).textContent = `${num(totalM3)} M³ DEL MODELO`;

  const pasos = (fn, hasta) => {
    let d = '';
    for (let w = W0; w <= hasta + 1e-9; w += 0.2) d += `${d ? 'L' : 'M'}${sx(w).toFixed(1)},${sy(fn(w)).toFixed(1)}`;
    return d;
  };
  const plan = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.55, 'stroke-width': 3, 'stroke-dasharray': '10 8' }, svg);
  const real = el('path', { fill: 'none', stroke: COLOR.acento, 'stroke-width': 5, 'stroke-linejoin': 'round' }, svg);

  // ── Guías: puntos apilados por semana, bajo el gráfico ──────────────────
  // La pila más alta (la semana de la losa de fundación) define el espaciado,
  // así ninguna se mete en el gráfico.
  const BASE = L.base;
  const maxPila = Math.max(...guias.map((g) => g.pila)) + 1;
  const PASO = Math.min(9, L.altoBanda / maxPila);
  const rotBanda = el('text', { x: X0, y: L.yBanda, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.banda, 'letter-spacing': 2 }, svg);
  rotBanda.textContent = 'GUÍAS POR SEMANA';
  const puntos = guias.map((g) => el('circle', {
    cx: sx(g.x), cy: BASE - g.pila * PASO, r: Math.min(L.rMax, PASO * 0.42),
    fill: g.sobre ? COLOR.alerta : COLOR.acento, 'fill-opacity': g.sobre ? 1 : 0.8,
  }, svg));

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.1));
    grilla.style.opacity = fluido(tramo(p, 0.04, 0.14));
    total.style.opacity = fluido(tramo(p, 0.1, 0.2));
    const uKpis = fluido(tramo(p, 0.12, 0.2));
    if (kpis) kpis.style.opacity = uKpis;

    const wPlan = lerp(W0, W1, suave(tramo(p, 0.12, 0.48)));
    plan.setAttribute('d', pasos(planM3, wPlan));
    const wReal = lerp(W0, W1, suave(tramo(p, 0.4, 0.92)));
    real.setAttribute('d', p > 0.4 ? pasos(realM3, wReal) : '');

    let n = 0, s = 0;
    guias.forEach((g, i) => {
      // Cada guía cae desde arriba cuando la curva real pasa por su semana.
      const u = limitar((wReal - g.semana) / 0.6);
      const c = puntos[i];
      c.style.opacity = u > 0 ? 1 : 0;
      c.setAttribute('cy', BASE - g.pila * PASO - (1 - fluido(u)) * 40);
      if (u > 0) { n++; if (g.sobre) s++; }
    });
    rotBanda.style.opacity = fluido(tramo(p, 0.36, 0.44));
    const m3 = num(p > 0.4 ? realM3(wReal) : 0);
    if (kpis) {
      kM3.textContent = m3;
      kGuias.textContent = num(n);
      kSobre.textContent = num(s);
    }
    ultimos = {
      u: uKpis,
      kpis: [
        { rotulo: 'm³ colocados', valor: m3, color: COLOR.acento },
        { rotulo: 'Guías', valor: num(n) },
        { rotulo: 'Sobrestadía', valor: num(s), color: COLOR.alerta },
      ],
    };
  }

  return { fijarProgreso, redimensionar() {}, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'hormigon' };
}

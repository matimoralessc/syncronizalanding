// Escena de datos: la curva S de la obra dibujándose.
//
// Primero el programado completo; después el real, semana a semana, con los
// indicadores corriendo junto a la punta del trazo. Al llegar al corte se
// marca la brecha: cuántos puntos y cuántas semanas va atrasada la obra.
// Todo por progreso p, igual que las escenas 3D.
import { OBRA, planPct, realPct, fechaDeSemana } from '../datos/obra.js';
import { COLOR, FUENTE_MONO, MESES, limitar, tramo, suave, fluido, num, fechaCorta, lerp } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

// Semana en que el programado llegaba a cierto %: para traducir la brecha a tiempo.
function semanaDelPlan(pct) {
  let lo = 0, hi = OBRA.semanas;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (planPct(m) < pct) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// Medidas por formato. En vertical el gráfico ocupa todo el lienzo (cabecera e
// indicadores los pone el marco de LinkedIn), la letra crece para leerse en un
// teléfono y el acercamiento final es menor: el rótulo de la brecha tiene que
// caber en 1080 de ancho.
const MEDIDAS = {
  horizontal: { X0: 170, X1: 1750, Y0: 905, Y1: 330, eje: 18, mes: 17, cadaMes: 2, rotulo: 18, gPts: 30, gSem: 22, zoom: 2.6, foco: [960, 626], recorte: 285, barras: true },
  vertical: { X0: 128, X1: 1012, Y0: 620, Y1: 104, eje: 22, mes: 20, cadaMes: 3, rotulo: 20, gPts: 40, gSem: 27, zoom: 1.9, foco: [360, 430], recorte: 0, barras: false },
};

export default function crearCurvaS(contenedor, opciones = {}) {
  const { svg, W, H, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;
  const sx = (sem) => L.X0 + (sem / OBRA.semanas) * (L.X1 - L.X0);
  const sy = (pct) => L.Y0 - (pct / 100) * (L.Y0 - L.Y1);
  const puntos = (fn, desde, hasta, paso = 0.25) => {
    const out = [];
    for (let w = desde; w < hasta; w += paso) out.push([sx(w), sy(fn(w))]);
    out.push([sx(hasta), sy(fn(hasta))]);
    return out;
  };
  const xy = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const trazo = (fn, desde, hasta) => `M${puntos(fn, desde, hasta).map(xy).join('L')}`;

  const defs = el('defs', {}, svg);
  const brillo = el('filter', { id: 'brillo', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  el('feGaussianBlur', { stdDeviation: '8', result: 'b' }, brillo);
  const mezcla = el('feMerge', {}, brillo);
  el('feMergeNode', { in: 'b' }, mezcla);
  el('feMergeNode', { in: 'SourceGraphic' }, mezcla);

  // ── Encabezado e indicadores (solo horizontal) ──────────────────────────
  let cab = null, kpis = null, kPlan, kReal, kSpi;
  if (!vertical) {
    ({ cab } = cabecera(svg, {
      eti: 'CURVA S · AVANCE FÍSICO', titulo: OBRA.nombre,
      sub: `${OBRA.semanas} semanas · ${OBRA.pisos} pisos y ${OBRA.subterraneos} subterráneos · ${OBRA.comuna}`,
    }));
    kpis = el('g', {}, svg);
    const kpi = (x, rotulo, color) => {
      const g = el('g', {}, kpis);
      el('text', { x, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, g).textContent = rotulo;
      return el('text', { x, y: 222, fill: color, 'font-family': FUENTE_MONO, 'font-size': 64, 'font-weight': 500, 'text-anchor': 'end' }, g);
    };
    kPlan = kpi(1270, 'PROGRAMADO', COLOR.texto2);
    kReal = kpi(1530, 'REAL', COLOR.acento);
    kSpi = kpi(L.X1, 'SPI', COLOR.texto);
  }

  // Todo el gráfico va en un grupo: al final la "cámara" se acerca al corte.
  // El recorte (fijo, fuera del grupo que se mueve) impide que al acercarse
  // las curvas pasen por detrás de los indicadores de la cabecera.
  const recorte = el('clipPath', { id: 'zona-grafico' }, defs);
  el('rect', { x: 0, y: L.recorte, width: W, height: H - L.recorte }, recorte);
  const marco = el('g', { 'clip-path': 'url(#zona-grafico)' }, svg);
  const grafico = el('g', {}, marco);

  // ── Grilla y ejes ───────────────────────────────────────────────────────
  const grilla = el('g', {}, grafico);
  for (const pct of [0, 25, 50, 75, 100]) {
    el('line', { x1: L.X0, x2: L.X1, y1: sy(pct), y2: sy(pct), stroke: pct === 0 ? COLOR.lineaFuerte : COLOR.linea, 'stroke-width': 1 }, grilla);
    const t = el('text', { x: L.X0 - L.eje * 1.22, y: sy(pct) + L.eje * 0.38, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.eje, 'text-anchor': 'end' }, grilla);
    t.textContent = `${pct}%`;
  }
  // Meses en el eje x (cada dos meses en horizontal y cada tres en vertical, para que respire).
  let mesPrevio = null, k = 0;
  for (let w = 0; w <= OBRA.semanas; w += 0.25) {
    const f = fechaDeSemana(w);
    if (f.getMonth() !== mesPrevio) {
      if (mesPrevio !== null) {
        el('line', { x1: sx(w), x2: sx(w), y1: L.Y0, y2: L.Y0 + 8, stroke: COLOR.lineaFuerte }, grilla);
        if (k % L.cadaMes === 0) {
          const t = el('text', { x: sx(w), y: L.Y0 + L.mes * 2.35, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.mes, 'text-anchor': 'middle' }, grilla);
          t.textContent = `${MESES[f.getMonth()].toUpperCase()}${f.getMonth() === 0 ? ` ${f.getFullYear()}` : ''}`;
        }
        k++;
      }
      mesPrevio = f.getMonth();
    }
  }

  // ── Curvas ──────────────────────────────────────────────────────────────
  const brecha = el('path', { fill: COLOR.mal, 'fill-opacity': 0.16, stroke: 'none' }, grafico);
  const plan = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.55, 'stroke-width': 3, 'stroke-dasharray': '10 8', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, grafico);
  const real = el('path', { fill: 'none', stroke: COLOR.acento, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', filter: 'url(#brillo)', 'vector-effect': 'non-scaling-stroke' }, grafico);
  const rotPlan = el('text', { fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.rotulo, 'letter-spacing': 2 }, grafico);
  rotPlan.textContent = 'PROGRAMADO';
  const anchoRotPlan = L.rotulo * 7.4;

  // Punta del trazo real: punto con halo.
  const halo = el('circle', { r: 22, fill: COLOR.acento, 'fill-opacity': 0.18 }, grafico);
  const punta = el('circle', { r: 8, fill: '#ffffff', stroke: COLOR.acento, 'stroke-width': 4 }, grafico);

  // ── Corte y brecha ──────────────────────────────────────────────────────
  const corte = el('g', {}, grafico);
  const xc = sx(OBRA.corte);
  el('line', { x1: xc, x2: xc, y1: L.Y1 - 20, y2: L.Y0, stroke: COLOR.texto3, 'stroke-dasharray': '4 6', 'stroke-width': 1.5 }, corte);
  const tCorte = el('text', { x: xc, y: L.Y1 - 34, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.rotulo - 1, 'text-anchor': 'middle', 'letter-spacing': 2 }, corte);
  tCorte.textContent = `CORTE ${fechaCorta(fechaDeSemana(OBRA.corte)).toUpperCase()}`;
  const pc = planPct(OBRA.corte), rc = realPct(OBRA.corte);
  // Corchete entre real y programado en el corte.
  const yb0 = sy(pc), yb1 = sy(rc);
  el('path', { d: `M${xc + 18},${yb0} h14 V${yb1} h-14`, fill: 'none', stroke: COLOR.mal, 'stroke-width': 2.5 }, corte);
  const atrasoSem = OBRA.corte - semanaDelPlan(rc);
  const g1 = el('text', { x: xc + 50, y: (yb0 + yb1) / 2 - L.gPts * 0.2, fill: COLOR.mal, 'font-family': FUENTE_MONO, 'font-size': L.gPts, 'font-weight': 500 }, corte);
  g1.textContent = `−${num(pc - rc, 1)} pts`;
  const g2 = el('text', { x: xc + 50, y: (yb0 + yb1) / 2 + L.gSem * 1.27, fill: COLOR.texto2, 'font-size': L.gSem }, corte);
  g2.textContent = `${num(atrasoSem, 1)} semanas de atraso`;

  // ── Barras de avance semanal real (abajo, finas; solo horizontal) ───────
  const barras = el('g', {}, grafico);
  const BASE = 1040; // línea base de la banda de avance semanal
  const listaBarras = [];
  let rotBarras = null;
  if (L.barras) {
    rotBarras = el('text', { x: L.X0, y: BASE - 64, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': 15, 'letter-spacing': 2 }, barras);
    rotBarras.textContent = 'AVANCE SEMANAL REAL';
    for (let w = 1; w <= OBRA.corte; w++) {
      const inc = realPct(w) - realPct(w - 1);
      const h = inc * 22;
      const b = el('rect', { x: sx(w - 1) + 2, y: BASE - h, width: Math.max(2, sx(1) - sx(0) - 4), height: h, rx: 2, fill: COLOR.acento, 'fill-opacity': 0.55 }, barras);
      listaBarras.push({ b, w, h });
    }
  }

  let ultimos = { kpis: [], u: 0 };

  function fijarProgreso(p) {
    const aGrilla = fluido(tramo(p, 0, 0.1));
    if (cab) cab.style.opacity = aGrilla;
    grilla.style.opacity = aGrilla;
    const uKpis = fluido(tramo(p, 0.38, 0.46));
    if (kpis) kpis.style.opacity = uKpis;

    // Programado: se dibuja entero.
    const uPlan = suave(tramo(p, 0.08, 0.44));
    const wPlan = Math.max(0.0001, uPlan * OBRA.semanas);
    plan.setAttribute('d', trazo(planPct, 0, wPlan));
    rotPlan.setAttribute('x', Math.min(sx(wPlan) + 14, W - anchoRotPlan - 8));
    rotPlan.setAttribute('y', sy(planPct(wPlan)) + 6);
    rotPlan.style.opacity = uPlan > 0.02 && uPlan < 0.999 ? 1 : uPlan >= 0.999 ? 0.8 : 0;
    if (uPlan >= 0.999) { rotPlan.setAttribute('x', sx(OBRA.semanas) - (vertical ? 160 : 150)); rotPlan.setAttribute('y', sy(100) - 18); }

    // Real: hasta el corte, con la punta luminosa.
    const uReal = suave(tramo(p, 0.44, 0.84));
    const wReal = Math.max(0.0001, uReal * OBRA.corte);
    const visibleReal = p > 0.44;
    real.setAttribute('d', visibleReal ? trazo(realPct, 0, wReal) : '');
    // La brecha: el programado de ida y el real de vuelta, cerrado.
    if (visibleReal) {
      const ida = puntos(planPct, 0, wReal);
      const vuelta = puntos(realPct, 0, wReal).reverse();
      brecha.setAttribute('d', `M${ida.map(xy).join('L')}L${vuelta.map(xy).join('L')}Z`);
    } else {
      brecha.setAttribute('d', '');
    }
    const xr = sx(wReal), yr = sy(realPct(wReal));
    punta.setAttribute('cx', xr); punta.setAttribute('cy', yr);
    halo.setAttribute('cx', xr); halo.setAttribute('cy', yr);
    halo.setAttribute('r', 18 + 8 * (0.5 + 0.5 * Math.sin(p * Math.PI * 24)));
    punta.style.opacity = halo.style.opacity = visibleReal ? 1 : 0;

    // Indicadores, atados a la punta del real (y al plan antes de que parta).
    const wK = visibleReal ? wReal : 0;
    const pp = planPct(wK), rr = realPct(wK) ?? 0;
    const spi = wK > 2 ? num(rr / pp, 2) : '—';
    const colorSpi = wK > 2 && rr / pp < 0.95 ? COLOR.mal : COLOR.texto;
    if (kpis) {
      kPlan.textContent = `${num(pp, 1)}%`;
      kReal.textContent = `${num(rr, 1)}%`;
      kSpi.textContent = spi;
      kSpi.setAttribute('fill', colorSpi);
    }
    ultimos = {
      u: uKpis,
      kpis: [
        { rotulo: 'Programado', valor: `${num(pp, 1)}%`, color: COLOR.texto2 },
        { rotulo: 'Real', valor: `${num(rr, 1)}%`, color: COLOR.acento },
        { rotulo: 'SPI', valor: spi, color: colorSpi },
      ],
    };

    // Barras semanales que van apareciendo con la punta.
    for (const { b, w, h } of listaBarras) {
      const u = limitar((wReal - (w - 1)) / 1);
      const hh = h * fluido(u);
      b.setAttribute('height', hh);
      b.setAttribute('y', BASE - hh);
      b.style.opacity = u > 0 ? 1 : 0;
    }

    // Corte y brecha al final.
    const uCorte = fluido(tramo(p, 0.84, 0.94));
    corte.style.opacity = uCorte;

    // "Cámara" que se acerca al corte: la brecha de 3,4 puntos en el gráfico
    // completo mide pocos pixeles; acercándose se lee sola.
    const z = fluido(tramo(p, 0.86, 1));
    const zoom = lerp(1, L.zoom, z);
    const fx = xc + 40, fy = (yb0 + yb1) / 2;
    const tx = lerp(0, L.foco[0] - fx, z), ty = lerp(0, L.foco[1] - fy, z);
    grafico.setAttribute('transform', `translate(${tx + fx} ${ty + fy}) scale(${zoom}) translate(${-fx} ${-fy})`);
    if (rotBarras) rotBarras.style.opacity = visibleReal ? 1 - z : 0;
  }

  function redimensionar() {}
  function destruir() { contenedor.innerHTML = ''; }
  return { fijarProgreso, redimensionar, destruir, indicadores: () => ultimos, nombre: 'curva-s' };
}

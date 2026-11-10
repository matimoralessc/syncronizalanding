// Escena de datos: Last Planner. El PPC (porcentaje de plan cumplido) de las
// últimas 16 semanas contra la meta, y las causas de no cumplimiento. El bache
// de julio es el mismo invierno que atrasa la curva S y el hormigón.
import { PPC, PPC_META, CAUSAS, fechaDeSemana, OBRA } from '../datos/obra.js';
import { COLOR, CICLOS, FUENTE_MONO, tramo, fluido, suave, num, MESES } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

const colorPpc = (v) => (v >= PPC_META ? COLOR.bien : v >= 70 ? COLOR.alerta : COLOR.mal);

// Horizontal: barras a la izquierda y anillo de causas a la derecha. Vertical:
// barras arriba y causas abajo, con la etiqueta de la meta como leyenda (al
// lado de la línea no cabe en 1080 de ancho).
const MEDIDAS = {
  horizontal: {
    X0: 170, X1: 1130, Y0: 900, Y1: 360, eje: 16, valor: 17, fecha: 14, cadaFecha: 2,
    causas: { CX: 1480, CY: 600, R: 150, GROSOR: 42, yRot: 380, rot: 17, centro: 44, centro2: 20, xLey: 1330, yLey: 820, pasoLey: 38, ley: 22, xValor: 1640 },
  },
  vertical: {
    X0: 104, X1: 1012, Y0: 400, Y1: 92, eje: 18, valor: 20, fecha: 18, cadaFecha: 4,
    causas: { CX: 190, CY: 636, R: 98, GROSOR: 36, yRot: 500, rot: 18, centro: 40, centro2: 20, xLey: 360, yLey: 566, pasoLey: 44, ley: 27, xValor: 1012 },
  },
};

export default function crearLastPlanner(contenedor, opciones = {}) {
  const { svg, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;
  const promedio = PPC.reduce((a, x) => a + x.ppc, 0) / PPC.length;

  let cab = null, kpis = null, tProm = null;
  if (!vertical) {
    ({ cab } = cabecera(svg, { eti: 'LAST PLANNER · PLAN SEMANAL', titulo: OBRA.nombre, sub: `Porcentaje de plan cumplido, últimas ${PPC.length} semanas` }));
    kpis = el('g', {}, svg);
    el('text', { x: 1750, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, kpis).textContent = 'PPC PROMEDIO';
    tProm = el('text', { x: 1750, y: 222, fill: colorPpc(promedio), 'font-family': FUENTE_MONO, 'font-size': 64, 'font-weight': 500, 'text-anchor': 'end' }, kpis);
    el('text', { x: 1750, y: 258, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': 20, 'text-anchor': 'end' }, kpis).textContent = `meta ${PPC_META} %`;
  }

  // ── Barras ──────────────────────────────────────────────────────────────
  const { X0, X1, Y0, Y1 } = L;
  const sy = (v) => Y0 - (v / 100) * (Y0 - Y1);
  const paso = (X1 - X0) / PPC.length;
  const grilla = el('g', {}, svg);
  for (const v of [0, 25, 50, 75, 100]) {
    el('line', { x1: X0, x2: X1, y1: sy(v), y2: sy(v), stroke: v === 0 ? COLOR.lineaFuerte : COLOR.linea }, grilla);
    el('text', { x: X0 - 18, y: sy(v) + L.eje * 0.38, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.eje, 'text-anchor': 'end' }, grilla).textContent = `${v}%`;
  }
  const barras = PPC.map((s, i) => {
    const x = X0 + i * paso + paso * 0.18, ancho = paso * 0.64;
    const r = el('rect', { x, y: Y0, width: ancho, height: 0, rx: vertical ? 6 : 8, fill: colorPpc(s.ppc) }, svg);
    const t = el('text', { x: x + ancho / 2, y: Y0, fill: COLOR.texto2, 'font-family': FUENTE_MONO, 'font-size': L.valor, 'text-anchor': 'middle' }, svg);
    const f = fechaDeSemana(s.semana);
    el('text', { x: x + ancho / 2, y: Y0 + L.fecha * 2.4, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.fecha, 'text-anchor': 'middle' }, grilla)
      .textContent = i % L.cadaFecha === 0 ? `${f.getDate()} ${MESES[f.getMonth()]}` : '';
    return { r, t, s, x, ancho };
  });
  const meta = el('g', {}, svg);
  const lMeta = el('line', { x1: X0, x2: X0, y1: sy(PPC_META), y2: sy(PPC_META), stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, meta);
  if (vertical) {
    // Leyenda arriba del gráfico: al lado de la línea chocaba con las barras.
    el('line', { x1: X0, x2: X0 + 40, y1: Y1 - 40, y2: Y1 - 40, stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, meta);
    el('text', { x: X0 + 54, y: Y1 - 33, fill: COLOR.texto2, 'font-family': FUENTE_MONO, 'font-size': 19, 'letter-spacing': 2 }, meta).textContent = `META ${PPC_META} %`;
  } else {
    // La etiqueta va fuera del gráfico: adentro chocaba con los números de las barras.
    el('text', { x: X1 + 16, y: sy(PPC_META) + 6, fill: COLOR.texto2, 'font-family': FUENTE_MONO, 'font-size': 16, 'letter-spacing': 2 }, meta).textContent = `META ${PPC_META} %`;
  }

  // ── Causas de no cumplimiento (anillo) ──────────────────────────────────
  const C = L.causas;
  const { CX, CY, R, GROSOR } = C;
  const causas = el('g', {}, svg);
  el('text', { x: vertical ? X0 - 40 : CX, y: C.yRot, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': C.rot, 'letter-spacing': 3, 'text-anchor': vertical ? 'start' : 'middle' }, causas).textContent = 'CAUSAS DE NO CUMPLIMIENTO';
  const largo = 2 * Math.PI * R;
  const colores = [COLOR.acento, CICLOS[4], CICLOS[5], CICLOS[6], COLOR.texto4];
  let acum = 0;
  const arcos = CAUSAS.map((c, i) => {
    const a = el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: colores[i], 'stroke-width': GROSOR,
      'stroke-dasharray': `0 ${largo}`, transform: `rotate(${-90 + (acum / 100) * 360} ${CX} ${CY})` }, causas);
    acum += c.pct;
    const y = C.yLey + i * C.pasoLey;
    const ley = el('g', {}, causas);
    const lado = vertical ? 18 : 16;
    el('rect', { x: C.xLey, y: y - lado + 2, width: lado, height: lado, rx: 4, fill: colores[i] }, ley);
    el('text', { x: C.xLey + lado + 12, y, fill: COLOR.texto2, 'font-size': C.ley }, ley).textContent = c.causa;
    const v = el('text', { x: C.xValor, y, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': C.ley, 'text-anchor': 'end' }, ley);
    return { a, c, ley, v };
  });
  const tCentro = el('text', { x: CX, y: CY + C.centro * 0.32, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': C.centro, 'font-weight': 500, 'text-anchor': 'middle' }, causas);
  tCentro.textContent = `${num(CAUSAS[0].pct, 0)}%`;
  const tCentro2 = el('text', { x: CX, y: CY + C.centro * 0.32 + 34, fill: COLOR.texto3, 'font-size': C.centro2, 'text-anchor': 'middle' }, causas);
  tCentro2.textContent = CAUSAS[0].causa.toLowerCase();

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.1));
    grilla.style.opacity = fluido(tramo(p, 0.04, 0.14));
    const uKpis = fluido(tramo(p, 0.1, 0.18));
    if (kpis) kpis.style.opacity = uKpis;
    let suma = 0, n = 0;
    barras.forEach((b, i) => {
      const u = fluido(tramo(p, 0.12 + i * 0.025, 0.22 + i * 0.025));
      const h = (Y0 - sy(b.s.ppc)) * u;
      b.r.setAttribute('y', Y0 - h);
      b.r.setAttribute('height', h);
      b.t.setAttribute('y', Y0 - h - 12);
      b.t.textContent = u > 0.05 ? `${num(b.s.ppc * u, 0)}` : '';
      if (u > 0.5) { suma += b.s.ppc; n++; }
    });
    const prom = n ? `${num(suma / n, 0)}%` : '—';
    if (tProm) tProm.textContent = prom;
    const um = suave(tramo(p, 0.55, 0.68));
    lMeta.setAttribute('x2', X0 + (X1 - X0) * um);
    meta.style.opacity = um > 0 ? 1 : 0;

    const uCausas = fluido(tramo(p, 0.62, 0.7));
    causas.style.opacity = uCausas;
    arcos.forEach((r, i) => {
      const u = suave(tramo(p, 0.66 + i * 0.05, 0.8 + i * 0.05));
      const largoArco = (largo * r.c.pct) / 100;
      r.a.setAttribute('stroke-dasharray', `${Math.max(0, largoArco * u - 3)} ${largo}`);
      r.ley.style.opacity = fluido(tramo(p, 0.68 + i * 0.05, 0.76 + i * 0.05));
      r.v.textContent = `${num(r.c.pct * u, 1)} %`;
    });

    ultimos = {
      kpis: [
        { rotulo: 'PPC promedio', valor: prom, color: n ? colorPpc(suma / n) : COLOR.texto, u: uKpis },
        { rotulo: 'Meta', valor: `${PPC_META} %`, color: COLOR.texto2, u: fluido(tramo(p, 0.55, 0.62)) },
        { rotulo: 'Causa principal', valor: CAUSAS[0].causa, sufijo: `${num(CAUSAS[0].pct, 0)} %`, u: uCausas },
      ],
    };
  }

  return { fijarProgreso, redimensionar() {}, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'last-planner' };
}

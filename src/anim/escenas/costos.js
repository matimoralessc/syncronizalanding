// Escena de datos: presupuesto contra gastado por familia.
//
// Las barras se llenan con lo gastado mientras el total corre arriba. Al final
// aparece lo que haría notar Syncroniza en una revisión de costos: la familia
// que gasta más rápido de lo que avanza la obra. Los números salen de
// datos/obra.js (la suma del gastado es exactamente el costo real del valor
// ganado), así que cuadran con la curva S.
import { OBRA, FAMILIAS, EVM, fechaDeSemana } from '../datos/obra.js';
import { COLOR, FUENTE_MONO, tramo, fluido, suave, num, fechaCorta, lerp } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

// Filas por formato. En horizontal la barra va a la derecha del nombre; en
// vertical, debajo (nombre y % en una línea, barra, montos), con letra de teléfono.
const MEDIDAS = {
  horizontal: {
    X0: 170, XB: 560, XMAX: 1750, fila: (i) => 400 + i * 140, leyenda: 330,
    nombre: 34, codigo: 19, montos: 21, barra: { dy: -18, alto: 42 }, marca: [-30, 34], dyMontos: 64, caja: { dy: -48, alto: 138 },
  },
  vertical: {
    X0: 64, XB: 64, XMAX: 1016, fila: (i) => 112 + i * 132, leyenda: 34,
    nombre: 30, codigo: 0, montos: 21, barra: { dy: 18, alto: 30 }, marca: [8, 58], dyMontos: 78, caja: { dy: -36, alto: 132 },
  },
};

export default function crearCostos(contenedor, opciones = {}) {
  const { svg, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;

  const avance = EVM.realCorte; // % de avance físico al corte
  // La familia que más se adelanta al avance físico: el hallazgo del final.
  const ritmo = FAMILIAS.map((f) => ({ ...f, pct: (100 * f.gastado) / f.presupuesto }))
    .filter((f) => f.codigo !== 'OG')
    .sort((a, b) => b.pct - a.pct)[0];
  const textoHallazgo = `${ritmo.nombre}: ${num(ritmo.pct, 1)} % gastado con ${num(avance, 1)} % de avance`;

  // ── Cabecera, total y CPI (solo horizontal; en vertical van al marco) ───
  let cab = null, tot = null, cpi = null, tTotal = null;
  if (!vertical) {
    ({ cab } = cabecera(svg, { eti: 'COSTOS · PRESUPUESTO CONTRA GASTADO', titulo: OBRA.nombre, sub: `Corte ${fechaCorta(fechaDeSemana(OBRA.corte))} · montos en UF` }));
    tot = el('g', {}, svg);
    el('text', { x: 1750, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, tot).textContent = 'GASTADO';
    tTotal = el('text', { x: 1750, y: 222, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': 64, 'font-weight': 500, 'text-anchor': 'end' }, tot);
    el('text', { x: 1750, y: 258, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': 22, 'text-anchor': 'end' }, tot).textContent = `de ${num(OBRA.presupuestoUF)} UF`;
    cpi = el('g', {}, svg);
    el('text', { x: 1310, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, cpi).textContent = 'CPI';
    el('text', { x: 1310, y: 222, fill: COLOR.alerta, 'font-family': FUENTE_MONO, 'font-size': 64, 'font-weight': 500, 'text-anchor': 'end' }, cpi).textContent = num(EVM.cpi, 2);
  }

  // ── Filas por familia ───────────────────────────────────────────────────
  const { X0, XB, XMAX } = L;
  const maxPres = Math.max(...FAMILIAS.map((f) => f.presupuesto));
  const filas = FAMILIAS.map((f, i) => {
    const y = L.fila(i);
    const g = el('g', {}, svg);
    el('text', { x: X0, y: y + (vertical ? 0 : 12), fill: COLOR.texto, 'font-size': L.nombre, 'font-weight': 500 }, g).textContent = f.nombre;
    if (L.codigo) el('text', { x: X0, y: y + 48, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.codigo, 'letter-spacing': 2 }, g).textContent = f.codigo;
    const largo = ((XMAX - XB) * f.presupuesto) / maxPres;
    const yb = y + L.barra.dy;
    el('rect', { x: XB, y: yb, width: largo, height: L.barra.alto, rx: L.barra.alto / 2, fill: '#ffffff', 'fill-opacity': 0.07 }, g);
    const relleno = el('rect', { x: XB, y: yb, width: 0, height: L.barra.alto, rx: L.barra.alto / 2, fill: COLOR.acento }, g);
    // Marca del avance físico sobre la barra: hasta ahí "debería" ir el gasto.
    const xAv = XB + (largo * avance) / 100;
    const marca = el('line', { x1: xAv, x2: xAv, y1: y + L.marca[0], y2: y + L.marca[1], stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '3 4', 'stroke-opacity': 0.7 }, g);
    const montos = el('text', { x: XB, y: y + L.dyMontos, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.montos }, g);
    // En horizontal el % va al final de la barra; en vertical, al final de la línea del nombre.
    const pct = vertical
      ? el('text', { x: XMAX, y, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': 27, 'text-anchor': 'end' }, g)
      : el('text', { x: XB + largo, y: y + 64, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': 21, 'text-anchor': 'end' }, g);
    return { f, g, relleno, largo, marca, montos, pct, y };
  });

  // Leyenda de la marca punteada.
  const ley = el('g', {}, svg);
  const tLey = vertical ? 24 : 21;
  el('line', { x1: XB, x2: XB + 30, y1: L.leyenda, y2: L.leyenda, stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '3 4', 'stroke-opacity': 0.7 }, ley);
  el('text', { x: XB + 42, y: L.leyenda + tLey * 0.3, fill: COLOR.texto3, 'font-size': tLey }, ley).textContent = `avance físico de la obra: ${num(avance, 1)} %`;

  // ── Hallazgo final ──────────────────────────────────────────────────────
  // En vertical el texto del hallazgo va al pie del marco, en letra grande.
  const fila = filas.find((x) => x.f.codigo === ritmo.codigo);
  const hallazgo = el('g', {}, svg);
  const caja = el('rect', { x: 0, y: 0, width: 0, height: 0, rx: 18, fill: 'none', stroke: COLOR.alerta, 'stroke-width': 2.5 }, hallazgo);
  if (!vertical) {
    el('text', { x: XMAX, y: fila.y - 68, fill: COLOR.alerta, 'font-size': 24, 'font-weight': 500, 'text-anchor': 'end' }, hallazgo).textContent = textoHallazgo;
  }

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.1));
    const uLey = fluido(tramo(p, 0.08, 0.18));
    ley.style.opacity = uLey;
    // Filas: entran escalonadas.
    filas.forEach((r, i) => {
      const u = fluido(tramo(p, 0.06 + i * 0.05, 0.22 + i * 0.05));
      r.g.style.opacity = u;
      r.g.setAttribute('transform', `translate(0 ${(1 - u) * 40})`);
    });
    // Llenado: todas a la vez pero con su propio ritmo, como un medidor.
    let acumulado = 0;
    filas.forEach((r, i) => {
      const u = suave(tramo(p, 0.3 + i * 0.03, 0.72 + i * 0.03));
      const gastado = r.f.gastado * u;
      acumulado += gastado;
      const pctF = (100 * gastado) / r.f.presupuesto;
      r.relleno.setAttribute('width', Math.max(0, r.largo * (gastado / r.f.presupuesto)));
      // Se adelanta al avance físico: ámbar.
      r.relleno.setAttribute('fill', pctF > avance + 8 && r.f.codigo !== 'OG' ? COLOR.alerta : COLOR.acento);
      r.montos.textContent = `${num(gastado)} de ${num(r.f.presupuesto)}${vertical ? ' UF' : ''}`;
      r.pct.textContent = `${num(pctF, 1)} %`;
    });
    const uTot = fluido(tramo(p, 0.26, 0.34));
    const uCpi = fluido(tramo(p, 0.74, 0.82));
    if (tot) {
      tTotal.textContent = num(acumulado);
      tot.style.opacity = uTot;
      cpi.style.opacity = uCpi;
    }

    // Hallazgo: un recuadro que se dibuja alrededor de la fila.
    const uh = fluido(tramo(p, 0.82, 0.94));
    hallazgo.style.opacity = uh;
    const pad = 22;
    caja.setAttribute('x', X0 - pad);
    caja.setAttribute('y', fila.y + L.caja.dy - (vertical ? 0 : pad / 2));
    caja.setAttribute('width', (XMAX - X0 + pad * 2) * lerp(0.92, 1, uh));
    caja.setAttribute('height', L.caja.alto);
    // Las demás filas se apagan un poco para que el hallazgo mande.
    filas.forEach((r) => { if (r !== fila) r.g.style.opacity = Math.min(Number(r.g.style.opacity), 1 - uh * 0.55); });

    ultimos = {
      kpis: [
        { rotulo: 'Gastado', valor: num(acumulado), total: `${num(OBRA.presupuestoUF)} UF`, u: uTot },
        { rotulo: 'CPI', valor: num(EVM.cpi, 2), color: COLOR.alerta, u: uCpi },
        { rotulo: 'Avance físico', valor: `${num(avance, 1)} %`, u: uLey },
      ],
      nota: { texto: textoHallazgo, color: COLOR.alerta, u: uh },
    };
  }

  return { fijarProgreso, redimensionar() {}, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'costos' };
}

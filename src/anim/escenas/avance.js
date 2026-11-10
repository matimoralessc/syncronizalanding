// Escena de datos: avance por partida, semana a semana.
//
// Corren las semanas de obra y cada partida avanza a saltos (el avance se
// reporta por semana: es una función escalón, no una línea suave). La marca
// blanca es lo programado a esa semana; la barra, lo real. Al final se marca la
// partida que más se quedó atrás.
import { OBRA, PARTIDAS, avancePartida, planPct, realPct, fechaDeSemana } from '../datos/obra.js';
import { COLOR, FUENTE_MONO, tramo, fluido, num, fechaCorta, lerp } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

// Columnas por formato. En vertical no va la columna "prog.": la marca blanca
// ya dice el programado, y el nombre de la partida necesita el espacio.
const MEDIDAS = {
  horizontal: { XN: 170, XP: 760, XR: 880, XB0: 960, XB1: 1750, yCols: 318, fila: (i) => 380 + i * 66, nombre: 26, cifra: 22, cols: 16 },
  vertical: { XN: 64, XP: null, XR: 520, XB0: 556, XB1: 1016, yCols: 34, fila: (i) => 104 + i * 64, nombre: 28, cifra: 24, cols: 18 },
};

export default function crearAvance(contenedor, opciones = {}) {
  const { svg, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;
  const { XN, XP, XR, XB0, XB1 } = L;

  // ── Cabecera y reloj de semanas (solo horizontal) ───────────────────────
  let cab = null, subt = null, reloj = null, tSemana = null, tTotales = null;
  if (!vertical) {
    ({ cab, tSub: subt } = cabecera(svg, { eti: 'AVANCE POR PARTIDA · SEMANA A SEMANA', titulo: OBRA.nombre }));
    reloj = el('g', {}, svg);
    el('text', { x: 1750, y: 150, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 18, 'letter-spacing': 3, 'text-anchor': 'end' }, reloj).textContent = 'SEMANA';
    tSemana = el('text', { x: 1750, y: 222, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': 64, 'font-weight': 500, 'text-anchor': 'end' }, reloj);
    tTotales = el('text', { x: 1750, y: 258, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': 20, 'text-anchor': 'end' }, reloj);
  }

  // ── Tabla ───────────────────────────────────────────────────────────────
  const cols = el('g', {}, svg);
  const titulos = [[XN, 'PARTIDA', 'start'], [XR, 'REAL', 'end'], [XB0, 'AVANCE', 'start']];
  if (XP) titulos.splice(1, 0, [XP, 'PROG.', 'end']);
  if (vertical) titulos[2] = [XB0 + 16, 'PROGRAMADO', 'start'];
  for (const [x, t, anchor] of titulos) {
    el('text', { x, y: L.yCols, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.cols, 'letter-spacing': 3, 'text-anchor': anchor }, cols).textContent = t;
  }
  // En vertical, la columna del avance explica la marca blanca con una muestra.
  if (vertical) el('rect', { x: XB0, y: L.yCols - 17, width: 3, height: 22, rx: 1.5, fill: '#ffffff' }, cols);
  el('line', { x1: XN, x2: XB1, y1: L.yCols + 16, y2: L.yCols + 16, stroke: COLOR.linea }, cols);

  const filas = PARTIDAS.map((partida, i) => {
    const y = L.fila(i);
    const g = el('g', {}, svg);
    el('text', { x: XN, y: y + L.nombre * 0.35, fill: COLOR.texto, 'font-size': L.nombre }, g).textContent = partida.nombre;
    const tPlan = XP ? el('text', { x: XP, y: y + 9, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.cifra, 'text-anchor': 'end' }, g) : null;
    const tReal = el('text', { x: XR, y: y + L.cifra * 0.4, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': L.cifra, 'text-anchor': 'end' }, g);
    el('rect', { x: XB0, y: y - 9, width: XB1 - XB0, height: 18, rx: 9, fill: '#ffffff', 'fill-opacity': 0.07 }, g);
    const barra = el('rect', { x: XB0, y: y - 9, width: 0, height: 18, rx: 9, fill: COLOR.acento }, g);
    const marca = el('rect', { x: XB0, y: y - 16, width: 3, height: 32, rx: 1.5, fill: '#ffffff' }, g);
    el('line', { x1: XN, x2: XB1, y1: y + 33, y2: y + 33, stroke: COLOR.linea }, g);
    return { partida, g, tPlan, tReal, barra, marca, y };
  });

  // La partida con más brecha al corte: el foco del final.
  const brechas = PARTIDAS.map((pa) => avancePartida(pa, OBRA.corte) - avancePartida(pa, OBRA.corte, true));
  const iFoco = brechas.indexOf(Math.max(...brechas));
  const foco = filas[iFoco];
  const textoFoco = `−${num(brechas[iFoco], 1)} puntos contra el programa`;
  const marcoFoco = el('rect', { x: XN - 24, y: foco.y - 30, width: XB1 - XN + 48, height: 60, rx: 14, fill: COLOR.mal, 'fill-opacity': 0.08, stroke: COLOR.mal, 'stroke-width': 2 }, svg);
  // En vertical la nota va al pie del marco, con el nombre de la partida.
  const notaFoco = vertical ? null : el('text', { x: XB1 - 18, y: foco.y + 8, fill: COLOR.mal, 'font-size': 21, 'font-weight': 500, 'text-anchor': 'end' }, svg);
  if (notaFoco) notaFoco.textContent = textoFoco;

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.1));
    cols.style.opacity = fluido(tramo(p, 0.05, 0.14));
    const uReloj = fluido(tramo(p, 0.1, 0.18));
    if (reloj) reloj.style.opacity = uReloj;

    // Semanas: corren de la 1 al corte. El real se lee por semana entera
    // (escalón); el programado, continuo.
    const wCont = lerp(1, OBRA.corte, fluido(tramo(p, 0.14, 0.86)));
    const wEntera = Math.floor(wCont);
    if (tSemana) {
      tSemana.textContent = String(wEntera);
      subt.textContent = `Semana del ${fechaCorta(fechaDeSemana(wEntera))}`;
      tTotales.textContent = `prog. ${num(planPct(wEntera), 1)} % · real ${num(realPct(wEntera), 1)} %`;
    }

    filas.forEach((r, i) => {
      const u = fluido(tramo(p, 0.04 + i * 0.012, 0.16 + i * 0.012));
      r.g.style.opacity = u;
      r.g.setAttribute('transform', `translate(${(1 - u) * -30} 0)`);
      const plan = avancePartida(r.partida, wCont);
      const real = avancePartida(r.partida, wEntera, true);
      const ancho = XB1 - XB0;
      r.marca.setAttribute('x', XB0 + (ancho * plan) / 100 - 1.5);
      r.barra.setAttribute('width', Math.max(real > 0 ? 18 : 0, (ancho * real) / 100));
      const terminada = real >= 99.95;
      const atrasada = plan - real > 8;
      r.barra.setAttribute('fill', terminada ? COLOR.bien : atrasada ? COLOR.mal : COLOR.acento);
      if (r.tPlan) r.tPlan.textContent = `${num(plan, 0)}%`;
      r.tReal.textContent = `${num(real, 0)}%`;
      r.tReal.setAttribute('fill', terminada ? COLOR.bien : atrasada ? COLOR.mal : COLOR.texto);
    });

    const uf = fluido(tramo(p, 0.88, 0.97));
    marcoFoco.style.opacity = uf;
    if (notaFoco) notaFoco.style.opacity = uf;
    filas.forEach((r, i) => { if (i !== iFoco) r.g.style.opacity = Math.min(Number(r.g.style.opacity), 1 - uf * 0.5); });

    ultimos = {
      kpis: [
        { rotulo: 'Semana del', valor: fechaCorta(fechaDeSemana(wEntera)), u: uReloj },
        { rotulo: 'Programado', valor: `${num(planPct(wEntera), 1)} %`, color: COLOR.texto2, u: uReloj },
        { rotulo: 'Real', valor: `${num(realPct(wEntera), 1)} %`, color: COLOR.acento, u: uReloj },
      ],
      nota: { texto: `${foco.partida.nombre}: ${textoFoco}`, color: COLOR.mal, u: uf },
    };
  }

  return { fijarProgreso, redimensionar() {}, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'avance' };
}

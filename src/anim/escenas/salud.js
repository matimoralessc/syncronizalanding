// Escena de datos: salud de la obra en una pantalla.
//
// El puntaje (0 a 100) se llena en un anillo; alrededor, los cuatro índices
// con su tendencia de las últimas semanas, y al final las alertas que lo
// explican. Las alertas citan los mismos números de las otras escenas (costos,
// avance por partida, hormigón): es la misma obra vista desde arriba.
//
// En vertical las tarjetas de índices se van al pie del marco (los cuatro
// valores en letra grande) y el lienzo queda para el anillo y las alertas.
import { OBRA, SALUD, FAMILIAS, PARTIDAS, avancePartida, EVM, fechaDeSemana } from '../datos/obra.js';
import { hormigonDeLaObra } from '../datos/hormigon.js';
import { COLOR, FUENTE_MONO, tramo, fluido, suave, num, fechaCorta, lerp, azar } from '../marca.js';
import { el, lienzo, cabecera } from './svg.js';

const colorPuntaje = (x) => (x >= 85 ? COLOR.bien : x >= 65 ? COLOR.alerta : COLOR.mal);

const MEDIDAS = {
  horizontal: { CX: 520, CY: 590, R: 210, GROSOR: 34, puntaje: 150, dyPuntaje: 40, de: 26, dyDe: 92, rot: 18, dyRot: -110, xAlertas: 930, yAlertas: 838, alerta: 26, pasoAlerta: 52, rotAlertas: 16 },
  vertical: { CX: 540, CY: 236, R: 176, GROSOR: 34, puntaje: 140, dyPuntaje: 46, de: 24, dyDe: 92, rot: 18, dyRot: -96, xAlertas: 64, yAlertas: 528, alerta: 27, pasoAlerta: 62, rotAlertas: 20 },
};

export default function crearSalud(contenedor, opciones = {}) {
  const { svg, vertical } = lienzo(contenedor, opciones);
  const L = vertical ? MEDIDAS.vertical : MEDIDAS.horizontal;

  // Las alertas, con los números de las otras escenas.
  const mo = FAMILIAS.find((f) => f.codigo === 'MO');
  const brechas = PARTIDAS.map((pa) => ({ pa, b: avancePartida(pa, OBRA.corte) - avancePartida(pa, OBRA.corte, true) }));
  const peor = brechas.sort((a, b) => b.b - a.b)[0];
  const { sobrestadia } = hormigonDeLaObra();
  const ALERTAS = [
    { color: COLOR.alerta, texto: `Mano de obra: ${num((100 * mo.gastado) / mo.presupuesto, 1)} % gastado con ${num(EVM.realCorte, 1)} % de avance` },
    { color: COLOR.mal, texto: `${peor.pa.nombre}: −${num(peor.b, 1)} puntos contra el programa` },
    { color: COLOR.alerta, texto: `Hormigón: ${sobrestadia} guías con sobrestadía en lo que va de la obra` },
  ];

  // ── Cabecera (solo horizontal) ──────────────────────────────────────────
  const cab = vertical ? null : cabecera(svg, {
    eti: 'SALUD DE OBRA', titulo: OBRA.nombre,
    sub: `Corte ${fechaCorta(fechaDeSemana(OBRA.corte))} · plazo, costo, compromisos y productividad en un número`,
  }).cab;

  // ── Anillo ──────────────────────────────────────────────────────────────
  const { CX, CY, R, GROSOR } = L;
  const largoAnillo = 2 * Math.PI * R;
  const anillo = el('g', {}, svg);
  el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.07, 'stroke-width': GROSOR }, anillo);
  const arco = el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: colorPuntaje(SALUD.puntaje), 'stroke-width': GROSOR, 'stroke-linecap': 'round',
    'stroke-dasharray': `${largoAnillo} ${largoAnillo}`, 'stroke-dashoffset': largoAnillo, transform: `rotate(-90 ${CX} ${CY})` }, anillo);
  const tPuntaje = el('text', { x: CX, y: CY + L.dyPuntaje, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': L.puntaje, 'font-weight': 500, 'text-anchor': 'middle' }, anillo);
  el('text', { x: CX, y: CY + L.dyDe, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.de, 'text-anchor': 'middle' }, anillo).textContent = 'DE 100';
  el('text', { x: CX, y: CY + L.dyRot, fill: COLOR.texto3, 'font-family': FUENTE_MONO, 'font-size': L.rot, 'letter-spacing': 3, 'text-anchor': 'middle' }, anillo).textContent = 'PUNTAJE DE SALUD';

  // ── Tarjetas de índices (2 × 2, solo horizontal) ────────────────────────
  const rnd = azar(331);
  const tarjetas = SALUD.indices.map((ind, i) => {
    if (vertical) return { ind };
    const x = 930 + (i % 2) * 420, y = 330 + Math.floor(i / 2) * 250;
    const g = el('g', {}, svg);
    el('rect', { x, y, width: 400, height: 230, rx: 24, fill: '#181818', stroke: '#ffffff', 'stroke-opacity': 0.08 }, g);
    el('text', { x: x + 32, y: y + 52, fill: COLOR.texto, 'font-family': FUENTE_MONO, 'font-size': 22, 'font-weight': 500, 'letter-spacing': 2 }, g).textContent = ind.clave;
    el('text', { x: x + 98, y: y + 52, fill: COLOR.texto3, 'font-size': 22 }, g).textContent = ind.nombre;
    const valor = el('text', { x: x + 32, y: y + 128, fill: colorPuntaje(ind.puntaje), 'font-family': FUENTE_MONO, 'font-size': 60, 'font-weight': 500 }, g);
    // Tendencia de 12 semanas que termina en el valor actual.
    const serie = Array.from({ length: 12 }, (_, k) => ind.valor + (rnd() - 0.45) * 0.06 * (1 - k / 12) + (11 - k) * 0.004);
    serie[11] = ind.valor;
    const min = Math.min(...serie) - 0.01, max = Math.max(...serie) + 0.01;
    const sx = (k) => x + 32 + k * (336 / 11);
    const sy = (v) => y + 200 - ((v - min) / (max - min)) * 44;
    const d = serie.map((v, k) => `${k ? 'L' : 'M'}${sx(k).toFixed(1)},${sy(v).toFixed(1)}`).join('');
    const linea = el('path', { d, fill: 'none', stroke: colorPuntaje(ind.puntaje), 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    const largo = 600;
    linea.setAttribute('stroke-dasharray', `${largo} ${largo}`);
    el('text', { x: x + 368, y: y + 52, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': 18, 'text-anchor': 'end' }, g).textContent = `${num(ind.puntaje, 0)} pts`;
    return { ind, g, valor, linea, largo };
  });

  // ── Alertas ─────────────────────────────────────────────────────────────
  const alertas = ALERTAS.map((a, i) => {
    const g = el('g', {}, svg);
    const y = L.yAlertas + 42 + i * L.pasoAlerta;
    el('circle', { cx: L.xAlertas + 10, cy: y - L.alerta * 0.31, r: L.alerta * 0.27, fill: a.color }, g);
    el('text', { x: L.xAlertas + 32 + (vertical ? 2 : 0), y, fill: COLOR.texto2, 'font-size': L.alerta }, g).textContent = a.texto;
    return g;
  });
  const rotAlertas = el('text', { x: L.xAlertas, y: L.yAlertas, fill: COLOR.texto4, 'font-family': FUENTE_MONO, 'font-size': L.rotAlertas, 'letter-spacing': 3 }, svg);
  rotAlertas.textContent = 'POR QUÉ NO ES MÁS ALTO';

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.1));
    const ua = fluido(tramo(p, 0.06, 0.16));
    anillo.style.opacity = ua;
    // El puntaje sube con inercia.
    const u = suave(tramo(p, 0.12, 0.55));
    const puntaje = SALUD.puntaje * u;
    arco.setAttribute('stroke-dashoffset', largoAnillo * (1 - puntaje / 100));
    arco.setAttribute('stroke', colorPuntaje(puntaje < 1 ? SALUD.puntaje : puntaje));
    tPuntaje.textContent = num(puntaje, 0);

    const kpis = [];
    tarjetas.forEach((t, i) => {
      const ut = fluido(tramo(p, 0.3 + i * 0.06, 0.46 + i * 0.06));
      const ul = suave(tramo(p, 0.4 + i * 0.06, 0.66 + i * 0.06));
      // Sube desde cero: arrancar en 1,00 y bajar se leía como un dato de paso.
      const v = lerp(0, t.ind.valor, ul);
      const texto = t.ind.clave === 'PPC' ? `${num(v * 100, 0)}%` : num(v, 2);
      if (t.g) {
        t.g.style.opacity = ut;
        t.g.setAttribute('transform', `translate(0 ${(1 - ut) * 36})`);
        t.linea.setAttribute('stroke-dashoffset', t.largo * (1 - ul));
        t.valor.textContent = texto;
      }
      kpis.push({ rotulo: t.ind.nombre, valor: texto, sufijo: t.ind.clave, color: colorPuntaje(t.ind.puntaje), u: ut });
    });
    ultimos = { kpis };

    rotAlertas.style.opacity = fluido(tramo(p, 0.74, 0.8));
    alertas.forEach((g, i) => {
      const ug = fluido(tramo(p, 0.76 + i * 0.05, 0.86 + i * 0.05));
      g.style.opacity = ug;
      g.setAttribute('transform', `translate(${(1 - ug) * 30} 0)`);
    });
  }

  return { fijarProgreso, redimensionar() {}, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'salud' };
}

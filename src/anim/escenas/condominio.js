// Escena 3D: Condominio Parque Los Alerces, tres torres sobre un
// estacionamiento subterráneo común. Cada torre parte con unas semanas de
// desfase y tiene su propia grúa; cada una usa su tramo de la paleta de ciclos,
// así se distinguen de lejos.
import { crearObra3D } from '../motor/obra3d.js';
import { construirEdificio } from '../datos/edificios.js';
import { porTramos } from './torre.js';
import { lerp, limitar, suave, num } from '../marca.js';

const SIN_NUCLEO = [];

export function construirCondominio() {
  const estacionamiento = construirEdificio({
    nombre: 'Estacionamientos', origen: [0, 0], sectores: 6, paleta: 0,
    excavacion: [2, 9], fundacion: [9, 12], inicio: 12,
    sub: { niveles: 1, largo: 104, ancho: 62, alto: 3.0, losa: 0.25, dur: 4 },
    nucleo: SIN_NUCLEO, techo: null,
  });
  const torre = (nombre, origen, pisos, inicio, paleta, extra = {}) => construirEdificio({
    nombre, origen, sectores: 3, paleta, inicio,
    zocalo: { niveles: 1, largo: 28, ancho: 20, alto: 3.4, losa: 0.22, dur: 2.2 },
    torre: { niveles: pisos, largo: 24, ancho: 14, alto: 2.6, losa: 0.18, dur: 1.2, balcon: 1.4, testeros: true, ...extra },
    nucleo: [[0, 3.6, 5.2]],
    techo: { w: 6, h: 3, d: 6, dur: 0.9 },
  });
  return [
    { modelo: estacionamiento, grua: null },
    { modelo: torre('Torre A', [-33, -10], 19, 16, 0, { retranqueo: { desde: 16, factor: 0.82 } }), grua: { pos: [-33, -27], desde: 13, angulo: 1.2 } },
    { modelo: torre('Torre B', [3, 12], 14, 20.5, 3), grua: { pos: [3, 30], desde: 17, angulo: -1.6 } },
    { modelo: torre('Torre C', [36, -8], 10, 25, 5), grua: { pos: [52, -8], desde: 21, angulo: 3.0 } },
  ];
}

const TRAMOS = [[0, 1], [0.05, 2], [0.14, 9], [0.24, 16], [0.94, 49], [1, 51]];

export default function crearCondominio(contenedor, opciones = {}) {
  const edificios = construirCondominio();
  const torres = edificios.filter((e) => e.grua);
  const total = edificios.reduce((a, e) => a + e.modelo.volumenTotal, 0);
  const piso = (est, modelo) => {
    const id = est?.nivelHecho ?? est?.nivelEnCurso;
    if (!id) return '—';
    const n = id.split(':')[1];
    if (n === 'TECHO') return `${modelo.niveles.length}`;
    const m = /Piso (\d+)/.exec(n);
    return m ? m[1] : '0';
  };
  return crearObra3D(contenedor, {
    ...opciones,
    edificios,
    terreno: { largo: 128, ancho: 86, centro: [0, 0] },
    niebla: [230, 520],
    semilla: 7,
    semanaDe: porTramos(TRAMOS),
    camara: (p) => {
      const m = suave(p);
      const az = (lerp(-58, 34, m) * Math.PI) / 180;
      const el = (lerp(40, 19, m) * Math.PI) / 180;
      const R = lerp(330, 285, m);
      const mira = [0, lerp(-4, 20, suave(limitar((p - 0.15) / 0.8))), 0];
      return { pos: [mira[0] + R * Math.cos(el) * Math.sin(az), mira[1] + R * Math.sin(el), mira[2] + R * Math.cos(el) * Math.cos(az)], mira };
    },
    // Son 104 m de estacionamiento: en vertical hay que alejarse para verlo entero.
    vertical: { distancia: 1.35 },
    hud: {
      titulo: 'Condominio Parque Los Alerces · Peñalolén',
      chips: 8,
      datos: (w, est) => [
        { rotulo: 'Pisos por torre', valor: torres.map((t, i) => `${'ABC'[i]} ${piso(est.porEdificio?.get(t.modelo.nombre), t.modelo)}`).join(' · ') },
        { rotulo: 'Hormigón', valor: num(est.m3), total: `${num(total)} m³` },
      ],
    },
  });
}

// Escena 3D: una ciudad de obras. Las cuatro obras de ejemplo en un mismo
// barrio, cada una con su calendario desfasado (unas excavando, otras subiendo,
// otras vidriando) y la cámara volando de una a otra mientras el scroll avanza
// el tiempo. Es lo que ve una constructora con varias obras en Syncroniza:
// todas en el mismo lugar, al día.
import * as THREE from 'three';
import { crearObra3D } from '../motor/obra3d.js';
import { trasladar, desfasar } from '../datos/edificios.js';
import { construirTorre } from '../datos/torre.js';
import { construirOficinas } from './oficinas.js';
import { construirCondominio } from './condominio.js';
import { construirCasas } from './casas.js';
import { lerp, suave, num, azar } from '../marca.js';

// Dónde va cada obra y cuántas semanas después (o antes) arranca.
const OBRAS = {
  oficinas: { dx: -165, dz: -6, desfase: -22 },
  torre: { dx: 0, dz: 0, desfase: 0 },
  condominio: { dx: 175, dz: 8, desfase: 10 },
  casas: { dx: 10, dz: 125, desfase: 24 },
};

function armarCiudad() {
  const mover = (modelo, o) => desfasar(trasladar(modelo, o.dx, o.dz), o.desfase);
  const gruaDe = (g, o) => (g ? { ...g, pos: [g.pos[0] + o.dx, g.pos[1] + o.dz], desde: g.desde + o.desfase, hasta: (g.hasta ?? 60) + o.desfase } : null);
  const edificios = [];
  const o = OBRAS;
  edificios.push({ modelo: mover(construirOficinas(), o.oficinas), grua: gruaDe({ pos: [-34, 14], desde: 9.5, hasta: 52, pluma: 55, angulo: -0.2 }, o.oficinas), obra: 'Nueva Apoquindo' });
  edificios.push({ modelo: mover(construirTorre(), o.torre), grua: gruaDe({ pos: [-29, -9], desde: 8.6, hasta: 50 }, o.torre), obra: 'Vista Cordillera' });
  for (const e of construirCondominio()) edificios.push({ modelo: mover(e.modelo, o.condominio), grua: gruaDe(e.grua, o.condominio), obra: 'Los Alerces' });
  for (const m of construirCasas()) edificios.push({ modelo: mover(m, o.casas), grua: null, obra: 'Las Encinas' });
  return edificios;
}

// Manzanas de contexto: volúmenes bajos y oscuros en los bordes del barrio.
function manzanas() {
  const rnd = azar(5150);
  const out = [];
  for (const [x0, z0, x1, z1] of [[-300, -230, 300, -110], [-300, 190, 300, 300], [-300, -110, -250, 190], [260, -110, 300, 190], [-110, 75, -55, 190], [80, 95, 260, 190]]) {
    for (let x = x0; x < x1; x += 34) for (let z = z0; z < z1; z += 30) {
      if (rnd() < 0.25) continue;
      out.push({ x: x + 14 + rnd() * 6, z: z + 12 + rnd() * 6, w: 20 + rnd() * 10, d: 16 + rnd() * 10, h: 5 + rnd() * 26 });
    }
  }
  return out;
}

const SEMANAS = [0, 58];

export default function crearCiudad(contenedor, opciones = {}) {
  const edificios = armarCiudad();
  const obras = [...new Set(edificios.map((e) => e.obra))];
  const total = edificios.reduce((a, e) => a + e.modelo.volumenTotal, 0);
  const terminaEn = new Map(obras.map((n) => [n, Math.max(...edificios.filter((e) => e.obra === n).map((e) => e.modelo.finEstructura))]));
  const empiezaEn = new Map(obras.map((n) => [n, Math.min(...edificios.filter((e) => e.obra === n).flatMap((e) => e.modelo.elementos.map((x) => x.inicio)))]));

  // Recorrido de cámara por las cuatro obras (curva suave por puntos de paso).
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const ruta = new THREE.CatmullRomCurve3([
    P(-330, 260, 330), P(-250, 95, 120), P(-60, 80, 150), P(120, 95, 170), P(150, 85, 270), P(-40, 300, 460),
  ], false, 'centripetal');
  const miras = new THREE.CatmullRomCurve3([
    P(0, 0, 40), P(-165, 22, -6), P(0, 20, 0), P(175, 22, 8), P(10, 4, 125), P(0, 0, 40),
  ], false, 'centripetal');

  return crearObra3D(contenedor, {
    ...opciones,
    edificios,
    terrenos: [
      { largo: 72, ancho: 64, centro: [OBRAS.oficinas.dx, OBRAS.oficinas.dz] },
      { largo: 64, ancho: 50, centro: [0, 0] },
      { largo: 128, ancho: 86, centro: [OBRAS.condominio.dx, OBRAS.condominio.dz] },
      { largo: 104, ancho: 52, centro: [OBRAS.casas.dx, OBRAS.casas.dz] },
    ],
    calles: [
      { x: 0, z: 66, largo: 600, ancho: 18 },
      { x: 0, z: -72, largo: 600, ancho: 18 },
      { x: -88, z: 20, largo: 16, ancho: 360 },
      { x: 92, z: 20, largo: 16, ancho: 360 },
    ],
    manzanas: manzanas(),
    vecinos: false,
    sombraSigue: true,
    alcanceSombra: 150,
    niebla: [320, 760],
    semanaDe: (p) => lerp(SEMANAS[0], SEMANAS[1], p),
    camara: (p) => {
      const t = suave(p);
      const pos = ruta.getPoint(t);
      const mira = miras.getPoint(t);
      return { pos: [pos.x, pos.y, pos.z], mira: [mira.x, mira.y, mira.z] };
    },
    hud: {
      titulo: 'Cuatro obras, una plataforma · Santiago',
      chips: 8,
      datos: (w, est) => [
        { rotulo: 'Obras en curso', valor: String(obras.filter((n) => w >= empiezaEn.get(n) && w < terminaEn.get(n)).length), total: String(obras.length) },
        { rotulo: 'Hormigón', valor: num(est.m3), total: `${num(total)} m³` },
      ],
    },
  });
}

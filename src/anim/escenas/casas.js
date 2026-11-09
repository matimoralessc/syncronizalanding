// Escena 3D: Barrio Las Encinas, un loteo de 14 casas de dos pisos. Dos
// cuadrillas avanzan casa por casa, una por cada vereda; cada casa toma un
// color de ciclo distinto, así se ve el orden en que se construyen.
import { crearObra3D } from '../motor/obra3d.js';
import { construirEdificio } from '../datos/edificios.js';
import { porTramos } from './torre.js';
import { lerp, suave, num } from '../marca.js';

const POR_HILERA = 7;

export function construirCasas() {
  const casas = [];
  for (let i = 0; i < POR_HILERA * 2; i++) {
    const hilera = i % 2; // dos cuadrillas, una por vereda
    const k = Math.floor(i / 2);
    const x = -39 + k * 13;
    const z = hilera === 0 ? -12 : 12;
    casas.push(construirEdificio({
      nombre: `Casa ${i + 1}`, origen: [x, z], sectores: 2, paleta: i % 8,
      inicio: 3 + k * 2.4 + hilera * 0.9,
      torre: { niveles: 2, largo: 8, ancho: 10, alto: 2.6, losa: 0.15, dur: 1.6, testeros: true },
      nucleo: [],
      techo: { w: 8.8, h: 1.4, d: 10.8, dur: 0.8 },
    }));
  }
  return casas;
}

const TRAMOS = [[0, 2], [0.06, 3], [0.92, 23], [1, 25]];

export default function crearCasas(contenedor, opciones = {}) {
  const casas = construirCasas();
  const total = casas.reduce((a, c) => a + c.volumenTotal, 0);
  return crearObra3D(contenedor, {
    ...opciones,
    edificios: casas.map((modelo) => ({ modelo, grua: null })),
    terreno: { largo: 104, ancho: 52, centro: [0, 0] },
    niebla: [170, 420],
    semilla: 91,
    semanaDe: porTramos(TRAMOS),
    camara: (p) => {
      const m = suave(p);
      const az = (lerp(-48, 26, m) * Math.PI) / 180;
      const el = (lerp(44, 26, m) * Math.PI) / 180;
      const R = lerp(190, 162, m);
      const mira = [lerp(-14, 6, m), 2, 0];
      return { pos: [mira[0] + R * Math.cos(el) * Math.sin(az), mira[1] + R * Math.sin(el), mira[2] + R * Math.cos(el) * Math.cos(az)], mira };
    },
    // En vertical se mira a lo largo de la calle: las dos hileras quedan en
    // profundidad y la obra avanza hacia la cámara.
    vertical: {
      camara: (p) => {
        const m = suave(p);
        const az = (lerp(68, 104, m) * Math.PI) / 180;
        const el = (lerp(40, 27, m) * Math.PI) / 180;
        const R = lerp(170, 150, m);
        const mira = [lerp(-8, 2, m), 2, 0];
        return { pos: [mira[0] + R * Math.cos(el) * Math.sin(az), mira[1] + R * Math.sin(el), mira[2] + R * Math.cos(el) * Math.cos(az)], mira };
      },
      // Lejos, para que la perspectiva no agrande tanto las casas de adelante
      // y no se metan en los indicadores.
      distancia: 1.3,
      bajar: 0,
    },
    hud: {
      titulo: 'Barrio Las Encinas · Colina',
      chips: 8,
      datos: (w, est) => [
        { rotulo: 'Casas terminadas', valor: String(casas.filter((c) => w >= c.finEstructura).length), total: String(casas.length) },
        { rotulo: 'Hormigón', valor: num(est.m3), total: `${num(total)} m³` },
      ],
    },
  });
}

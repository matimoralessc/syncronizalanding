// Escena 3D: Centro Empresarial Nueva Apoquindo. Una torre de oficinas de
// planta cuadrada con núcleo central: la estructura sube en colores de ciclo y,
// unas semanas atrás, el muro cortina la va cubriendo piso por piso. Es la
// obra gruesa y las terminaciones avanzando a la vez, que es justo cuando el
// programa se pone difícil de leer en un Gantt.
import { crearObra3D } from '../motor/obra3d.js';
import { construirEdificio } from '../datos/edificios.js';
import { porTramos, nivelLegible } from './torre.js';
import { lerp, limitar, suave, num } from '../marca.js';

export function construirOficinas() {
  return construirEdificio({
    nombre: 'Nueva Apoquindo', origen: [0, 0], sectores: 4, paleta: 2,
    excavacion: [2, 9], fundacion: [9, 11.5], inicio: 11.5,
    sub: { niveles: 3, largo: 46, ancho: 46, alto: 2.9, losa: 0.25, dur: 2.6 },
    zocalo: { niveles: 1, largo: 38, ancho: 38, alto: 5.2, losa: 0.25, dur: 2.4 },
    torre: { niveles: 15, largo: 34, ancho: 34, alto: 3.6, losa: 0.22, dur: 1.4 },
    nucleo: [[-3.2, 5.2, 9], [3.2, 5.2, 9]],
    techo: { w: 14, h: 4, d: 10, dur: 1.2 },
    fachada: { inicio: 30, desfase: 7, porPiso: 1.1 },
  });
}

const TRAMOS = [[0, 1], [0.05, 2], [0.14, 9], [0.26, 21], [0.95, 52], [1, 54]];

export default function crearOficinas(contenedor, opciones = {}) {
  const modelo = construirOficinas();
  const vidrios = modelo.elementos.filter((e) => e.tipo === 'vidrio');
  return crearObra3D(contenedor, {
    ...opciones,
    edificios: [{ modelo, grua: { pos: [-34, 14], desde: 9.5, pluma: 55, angulo: -0.2 } }],
    terreno: { largo: 72, ancho: 64, centro: [0, 0] },
    semilla: 23,
    semanaDe: porTramos(TRAMOS),
    camara: (p) => {
      // Contrapicado al final: la torre de vidrio contra el cielo negro.
      const m = suave(p);
      const az = (lerp(-30, 38, m) * Math.PI) / 180;
      const el = (lerp(36, 9, m) * Math.PI) / 180;
      const R = lerp(200, 178, m);
      const mira = [0, lerp(-4, 26, suave(limitar((p - 0.12) / 0.86))), 0];
      return { pos: [mira[0] + R * Math.cos(el) * Math.sin(az), mira[1] + R * Math.sin(el), mira[2] + R * Math.cos(el) * Math.cos(az)], mira };
    },
    // En vertical se aleja más: al final la sala de máquinas se metía en el gancho.
    vertical: { distancia: 1.32 },
    hud: {
      titulo: 'Centro Empresarial Nueva Apoquindo · Las Condes',
      chips: 8,
      datos: (w, est) => [
        { rotulo: 'Estructura', valor: nivelLegible(est.porEdificio?.get(modelo.nombre), w, [2, 9]) },
        { rotulo: 'Muro cortina', valor: `${num((100 * vidrios.filter((v) => w >= v.fin).length) / vidrios.length, 0)} %` },
        { rotulo: 'Hormigón', valor: num(est.m3), total: `${num(modelo.volumenTotal)} m³` },
      ],
    },
  });
}

// Escena 3D: Edificio Vista Cordillera levantándose ciclo por ciclo, de la
// excavación a la sala de máquinas, con la grúa trepando con el edificio.
import { crearObra3D } from '../motor/obra3d.js';
import { construirTorre } from '../datos/torre.js';
import { OBRA } from '../datos/obra.js';
import { lerp, limitar, suave, num } from '../marca.js';

// Progreso → semana de obra, por tramos: la excavación y los subterráneos
// pasan rápido y la torre se lleva la mayor parte, que es lo que se quiere ver.
const TRAMOS = [[0.0, 1.0], [0.05, 2.0], [0.15, 8.0], [0.28, 16.5], [0.36, 22.5], [0.93, 45.2], [1.0, 47.0]];
export function porTramos(tramos) {
  return (p) => {
    p = limitar(p);
    for (let i = 1; i < tramos.length; i++) {
      const [p0, w0] = tramos[i - 1];
      const [p1, w1] = tramos[i];
      if (p <= p1) return lerp(w0, w1, (p - p0) / (p1 - p0));
    }
    return tramos[tramos.length - 1][1];
  };
}

// Nombre legible del nivel en obra según el estado de un edificio.
export function nivelLegible(est, w, excavacion) {
  const id = est?.nivelEnCurso ?? est?.nivelHecho;
  if (!id) return excavacion && w >= excavacion[0] ? 'Excavación' : 'Terreno';
  const n = id.split(':')[1];
  return n === 'FUND' ? 'Fundación' : n === 'TECHO' ? 'Sala de máquinas' : n;
}

export default function crearTorre(contenedor, opciones = {}) {
  const modelo = construirTorre();
  const semanaDe = porTramos(TRAMOS);
  return crearObra3D(contenedor, {
    ...opciones,
    edificios: [{ modelo, grua: { pos: [-29, -9], desde: 8.6 } }],
    terreno: { largo: 64, ancho: 50, centro: [0, 0] },
    semanaDe,
    camara: (p) => {
      // az 0° = frente a la fachada larga, la de los balcones.
      const m = suave(p);
      const az = (lerp(-42, 28, m) * Math.PI) / 180;
      const el = (lerp(38, 13, m) * Math.PI) / 180;
      const R = lerp(185, 172, m);
      const mira = [0, lerp(-3, 17, suave(limitar((p - 0.1) / 0.85))), 0];
      return { pos: [mira[0] + R * Math.cos(el) * Math.sin(az), mira[1] + R * Math.sin(el), mira[2] + R * Math.cos(el) * Math.cos(az)], mira };
    },
    // En vertical la torre cabe de alto; se aleja lo justo para que no se
    // meta en el gancho de arriba.
    vertical: { distancia: 1.22, fov: 32 },
    hud: {
      titulo: `${OBRA.nombre} · ${OBRA.comuna}`,
      chips: modelo.sectores,
      datos: (w, est) => [
        { rotulo: 'Nivel', valor: nivelLegible(est.porEdificio?.get(modelo.nombre), w, [2, 8]) },
        { rotulo: 'Hormigón', valor: num(est.m3), total: `${num(modelo.volumenTotal)} m³` },
      ],
    },
  });
}

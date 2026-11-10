// Edificio Vista Cordillera: la torre de la obra inventada, como especificación
// del generador. La escena 3D, el hormigón y las partidas leen este mismo
// modelo, así los m³ y las fechas cuadran entre animaciones.
import { construirEdificio } from './edificios.js';

export const VISTA_CORDILLERA = {
  nombre: 'Vista Cordillera',
  origen: [0, 0],
  sectores: 4,
  excavacion: [2, 8],
  fundacion: [8, 10.5],
  inicio: 10.5,
  sub: { niveles: 2, largo: 44, ancho: 30, alto: 3.0, losa: 0.25, dur: 3.0 },
  zocalo: { niveles: 2, largo: 40, ancho: 26, alto: 3.6, losa: 0.22, dur: 3.0 },
  torre: { niveles: 16, largo: 30, ancho: 16, alto: 2.6, losa: 0.18, dur: 1.35, balcon: 1.5, testeros: true },
};

export const construirTorre = () => construirEdificio(VISTA_CORDILLERA);

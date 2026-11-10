// Registro de escenas: nombre → constructor. Cada una devuelve
// { fijarProgreso(p), redimensionar(w, h), destruir() }.
import torre from './torre.js';
import condominio from './condominio.js';
import oficinas from './oficinas.js';
import casas from './casas.js';
import ciudad from './ciudad.js';
import curvaS from './curva-s.js';
import costos from './costos.js';
import avance from './avance.js';
import hormigon from './hormigon.js';
import salud from './salud.js';
import lastPlanner from './last-planner.js';
import whatsapp from './whatsapp.js';

// tipo: '3d' van a sangre en el marco vertical; 'datos' van en su franja.
export const ESCENAS = {
  torre: { crear: torre, titulo: 'La torre se levanta', segundos: 14, tipo: '3d' },
  condominio: { crear: condominio, titulo: 'Condominio de tres torres', segundos: 16, tipo: '3d' },
  oficinas: { crear: oficinas, titulo: 'Oficinas y muro cortina', segundos: 14, tipo: '3d' },
  casas: { crear: casas, titulo: 'Loteo de casas', segundos: 12, tipo: '3d' },
  ciudad: { crear: ciudad, titulo: 'Cuatro obras, una plataforma', segundos: 20, tipo: '3d' },
  'curva-s': { crear: curvaS, titulo: 'Curva S', segundos: 12, tipo: 'datos' },
  costos: { crear: costos, titulo: 'Costos por familia', segundos: 10, tipo: 'datos' },
  avance: { crear: avance, titulo: 'Avance por partida', segundos: 12, tipo: 'datos' },
  hormigon: { crear: hormigon, titulo: 'Hormigón y guías', segundos: 12, tipo: 'datos' },
  salud: { crear: salud, titulo: 'Salud de obra', segundos: 11, tipo: 'datos' },
  'last-planner': { crear: lastPlanner, titulo: 'Last Planner', segundos: 11, tipo: 'datos' },
  whatsapp: { crear: whatsapp, titulo: 'Reporte por WhatsApp', segundos: 18, tipo: 'datos' },
};

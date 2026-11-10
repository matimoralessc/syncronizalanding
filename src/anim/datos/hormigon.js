// Hormigón de Vista Cordillera, programado y colocado, y sus guías de
// despacho. Compartido por la escena de hormigón y la de salud de obra, para
// que "32 guías con sobrestadía" diga lo mismo en las dos.
import { construirTorre } from './torre.js';
import { OBRA } from './obra.js';
import { azar, limitar } from '../marca.js';

export const M3_CAMION = 7.5;
export const SEMANA_DESDE = 8;

export function hormigonDeLaObra() {
  const torre = construirTorre();
  const estructura = torre.elementos.filter((e) => e.tipo !== 'vidrio');
  // Atraso real del hormigonado: crece con la torre (invierno), igual que la
  // partida "Obra gruesa torre".
  const atraso = (w) => 4.6 * limitar((w - 22.5) / (OBRA.corte - 22.5)) ** 1.3 + 0.6 * limitar((w - 8) / 14);
  const planM3 = (w) => estructura.reduce((a, e) => a + (w >= e.fin ? e.volumen : 0), 0);
  const realM3 = (w) => estructura.reduce((a, e) => a + (w >= e.fin + atraso(e.fin) ? e.volumen : 0), 0);
  const rnd = azar(1709);
  const guias = [];
  for (let w = SEMANA_DESDE; w < OBRA.corte; w += 1) {
    const camiones = Math.round((realM3(w + 1) - realM3(w)) / M3_CAMION);
    for (let k = 0; k < camiones; k++) guias.push({ x: w + 0.5, semana: w + (k + 0.5) / Math.max(1, camiones), pila: k, sobre: rnd() < 0.045 });
  }
  return { torre, totalM3: torre.volumenTotal, planM3, realM3, guias, sobrestadia: guias.filter((g) => g.sobre).length };
}

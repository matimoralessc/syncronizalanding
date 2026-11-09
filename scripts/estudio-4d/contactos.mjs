// Hoja de contactos: el edificio terminado desde 16 ángulos, para elegir el
// recorrido de cámara mirando y no adivinando.
import * as E from './estudio.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const DIA = +(process.argv[2] ?? 220);
const R = +(process.argv[3] ?? 95);
const centro = [-32.5, 11, 45.7];
const { page } = await E.conectar();
await E.instrumentar(page);
const cdp = await E.modoCine(page, { ancho: 1920, alto: 1080 });
await E.fijarDia(page, DIA);
await E.esperarQuieto(page);

fs.mkdirSync('cap/contactos', { recursive: true });
const archivos = [];
for (const el of [18, 38]) {
  for (let az = 0; az < 360; az += 45) {
    const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
    const pos = [centro[0] + R * Math.cos(e) * Math.sin(a), centro[1] + R * Math.sin(e), centro[2] + R * Math.cos(e) * Math.cos(a)];
    await E.camara(page, pos, centro);
    await E.esperarQuieto(page, { quieto: 200 });
    const f = `cap/contactos/el${el}-az${String(az).padStart(3, '0')}.jpg`;
    await E.cuadro(page, f, { tipo: 'jpeg' });
    archivos.push(f);
  }
}
await E.salirModoCine(page, cdp);
// Montaje 4x4 con el ángulo escrito en cada cuadro.
const entradas = archivos.flatMap((f) => ['-i', f]);
const etiquetas = archivos.map((f, i) => `[${i}]scale=480:-1,drawtext=text='${f.split('/').pop().replace('.jpg', '')}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
const filas = [0, 1, 2, 3].map((r) => `${[0, 1, 2, 3].map((c) => `[v${r * 4 + c}]`).join('')}hstack=4[f${r}]`).join(';');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...entradas, '-filter_complex', `${etiquetas};${filas};[f0][f1][f2][f3]vstack=4`, `cap/contactos-d${DIA}-r${R}.jpg`]);
console.log(`cap/contactos-d${DIA}-r${R}.jpg`);
process.exit(0);

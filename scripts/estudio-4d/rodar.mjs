// Uso: node rodar.mjs <toma> [ancho] [alto] [paso] [salida]
//   paso > 1 rinde uno de cada `paso` cuadros (previa rápida para revisar el
//   movimiento antes de gastar el tiempo de la versión final).
// Deja los cuadros en cuadros/<toma>-<ancho>/ y arma el mp4 al final.
import * as E from './estudio.mjs';
import { TOMAS } from './tomas.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , nombre = 'heroe', ancho = '960', alto = '540', paso = '1', salida] = process.argv;
const toma = TOMAS[nombre];
if (!toma) throw new Error(`no existe la toma ${nombre}`);
const W = +ancho, H = +alto, P = +paso;
const dir = `cuadros/${nombre}-${W}`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const { page } = await E.conectar();
await E.instrumentar(page);
// Las tomas de interfaz muestran el visor entero (programa incluido) y con su
// fondo de siempre; las de cine, solo el 3D sobre negro.
const cdp = toma.ui ? await E.soloTamano(page, { ancho: W, alto: H }) : await E.modoCine(page, { ancho: W, alto: H, fondo: '#000000' });
if (toma.preparar) await toma.preparar(page);

let diaActual = null;
const t0 = Date.now();
let n = 0;
for (let i = 0; i < toma.cuadros; i += P) {
  // En bucle el último cuadro sería igual al primero: t va de 0 a (n-1)/n.
  const t = toma.cuadros === 1 ? 0 : toma.bucle ? i / toma.cuadros : i / (toma.cuadros - 1);
  const { pos, mira, dia, desfase } = toma.en(t);
  if (dia !== undefined && dia !== diaActual) { await E.fijarDia(page, dia); diaActual = dia; }
  await E.camara(page, pos, mira, desfase);
  await E.esperarQuieto(page, { quieto: 120 });
  await E.cuadro(page, `${dir}/${String(n).padStart(4, '0')}.png`);
  n++;
  if (n % 20 === 0) process.stdout.write(`${n} cuadros · ${((Date.now() - t0) / n).toFixed(0)} ms/cuadro\n`);
}
if (toma.terminar) await toma.terminar(page);
if (toma.ui) await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
else await E.salirModoCine(page, cdp);

const fps = Math.round(30 / P);
const mp4 = salida ?? `videos/${nombre}-${W}${P > 1 ? '-previa' : ''}.mp4`;
fs.mkdirSync('videos', { recursive: true });
const escala = W > 1920 ? ['-vf', 'scale=1920:-2:flags=lanczos'] : [];
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', `${dir}/%04d.png`, ...escala,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
console.log(`listo: ${mp4} (${n} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(0);

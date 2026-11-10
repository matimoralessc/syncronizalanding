// Uso: node corto/renderizar.mjs <guion> [paso]
// Fotografía cada cuadro del compositor y lo codifica en H.264 16:9 para web y
// YouTube. `paso` > 1 hace una previa rápida (uno de cada N cuadros).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIONES } from './guiones.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const [, , nombre = 'panoramica-4d', pasoTxt = '1'] = process.argv;
const paso = +pasoTxt;
const guion = GUIONES[nombre];
if (!guion) throw new Error(`no existe el guion ${nombre}`);

const dir = path.join(aqui, 'salida', `${nombre}${paso > 1 ? '-previa' : ''}`);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(`file://${path.join(aqui, 'compositor.html')}`);
await page.evaluate((g) => window.cargarGuion(g), guion);

const t0 = Date.now();
let n = 0;
for (let f = 0; f < guion.cuadros; f += paso) {
  await page.evaluate((f) => window.fijarCuadro(f), f);
  await page.screenshot({ path: path.join(dir, `${String(n).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
  n++;
}
await browser.close();

const fps = Math.round(30 / paso);
const mp4 = path.join(aqui, 'salida', `${nombre}${paso > 1 ? '-previa' : ''}.mp4`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-movflags', '+faststart', mp4]);
console.log(`listo: ${mp4} (${n} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);

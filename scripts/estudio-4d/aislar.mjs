import * as E from './estudio.mjs';
import { orbita, CENTRO } from './tomas.mjs';
import { execFileSync } from 'node:child_process';
const { page } = await E.conectar();
await E.instrumentar(page);
const cdp = await E.modoCine(page, { ancho: 960, alto: 540, fondo: '#000000' });
await E.fijarDia(page, 55);
await E.camara(page, orbita(30, 30, 110, [CENTRO[0], 3, CENTRO[2]]), [CENTRO[0], 3, CENTRO[2]]);
await E.esperarQuieto(page);
const ids = await page.evaluate(() => [...window.ctx.fragments.list.keys()]);
const fs = [];
await E.cuadro(page, 'cap/aislar-todos.png'); fs.push('cap/aislar-todos.png');
for (const [i, id] of ids.entries()) {
  await page.evaluate((id) => { for (const m of window.ctx.fragments.list.values()) m.object.visible = m.modelId === id; window.ctx.world.renderer.needsUpdate = true; }, id);
  await E.esperarQuieto(page);
  const f = `cap/aislar-${i}.png`; await E.cuadro(page, f); fs.push(f);
  console.log(i, id);
}
await page.evaluate(() => { for (const m of window.ctx.fragments.list.values()) m.object.visible = true; window.ctx.world.renderer.needsUpdate = true; });
await E.salirModoCine(page, cdp);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...fs.flatMap((f) => ['-i', f]), '-filter_complex', fs.map((_, i) => `[${i}]drawtext=text='${i === 0 ? 'todos' : 'solo ' + (i - 1)}':x=8:y=8:fontsize=20:fontcolor=white[v${i}]`).join(';') + ';' + fs.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${fs.length}:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h1:fill=black`, 'cap/aislar.jpg']);
process.exit(0);

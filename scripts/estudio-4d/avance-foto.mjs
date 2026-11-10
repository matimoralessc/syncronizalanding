// Foto del modo Avance real tal como está la obra hoy (solo lectura).
import * as E from './estudio.mjs';
import { orbita, CENTRO, lente, encenderTodo } from './tomas.mjs';
const { page } = await E.conectar();
await E.instrumentar(page);
const boton = page.locator('#gantt-btn-toggle-modo');
await boton.click();
await page.waitForFunction(() => /Avance real:/.test(document.getElementById('status')?.textContent ?? ''), null, { timeout: 30000 });
const cdp = await E.modoCine(page, { ancho: 3840, alto: 2160, fondo: '#000000' });
await page.evaluate(() => { for (const m of window.ctx.fragments.list.values()) m.object.visible = !['Alcantarillado', 'AALL Edificio'].some((n) => m.modelId.includes(n)); });
await lente(page, 36);
const mira = [CENTRO[0], 9, CENTRO[2]];
await E.camara(page, orbita(60, 20, 120, mira), mira);
await E.esperarQuieto(page, { quieto: 400 });
await E.cuadro(page, 'cap/avance-hoy-4k.png');
await encenderTodo(page);
await E.salirModoCine(page, cdp);
await boton.click();
process.exit(0);

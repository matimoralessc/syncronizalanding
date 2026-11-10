// Abre un Chromium con perfil propio y puerto de depuración local, para que
// los scripts de grabación se conecten al MISMO navegador donde Matías inició
// sesión (el token queda en el perfil; nunca pasa por estos scripts).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const ctx = await chromium.launchPersistentContext(path.join(aqui, 'perfil'), {
  headless: false,
  viewport: null,
  args: [
    '--remote-debugging-port=9333',
    '--window-size=1920,1080',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
  ],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://www.syncroniza4d.cl', { waitUntil: 'domcontentloaded' });
console.log('LISTO: navegador abierto en puerto 9333');
// Queda vivo hasta que se cierre la ventana.
await new Promise((r) => ctx.on('close', r));
console.log('cerrado');

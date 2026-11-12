// Como abrir-local.mjs, pero contra Syncroniza CO LOCAL (vite en 3010, API en
// 8001, con la copia de producción). La sesión es la cookie `sco_sesion` con un
// token local de prueba (variable SCO_TOKEN): no hay contraseña que escribir.
// Lo usan las tomas de control de obra de la landing (11-nov-2026).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.SCO_URL || 'http://localhost:3010';
const ctx = await chromium.launchPersistentContext(path.join(aqui, 'perfil-co'), {
  headless: false,
  executablePath: process.env.CHROME || undefined,
  viewport: null,
  args: ['--remote-debugging-port=9333', '--window-size=1920,1080'],
});
if (process.env.SCO_TOKEN) {
  await ctx.addCookies([{ name: 'sco_sesion', value: process.env.SCO_TOKEN, url: URL }]);
}
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(URL, { waitUntil: 'domcontentloaded' });
console.log('LISTO: Syncroniza CO local abierto en el puerto 9333');
await new Promise((r) => ctx.on('close', r));

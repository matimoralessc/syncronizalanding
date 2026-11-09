// Igual que abrir.mjs, pero contra el 4D LOCAL (vite en 5174, con la copia de
// producción de Panorámica). La sesión es un token local de prueba que se pasa
// por la variable S4D_TOKEN: no hay contraseña que escribir. Lo usan las tomas
// de herramientas del 4D actual (9-nov-2026).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.S4D_URL || 'http://localhost:5174';
const ctx = await chromium.launchPersistentContext(path.join(aqui, 'perfil-local'), {
  headless: false,
  // El Chromium que ya está en caché (no bajar otro con el disco justo).
  executablePath: process.env.CHROME || undefined,
  viewport: null,
  args: ['--remote-debugging-port=9333', '--window-size=1920,1080', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(URL, { waitUntil: 'domcontentloaded' });
if (process.env.S4D_TOKEN) {
  await page.evaluate((t) => localStorage.setItem('s4d_token', t), process.env.S4D_TOKEN);
  await page.reload({ waitUntil: 'domcontentloaded' });
}
console.log('LISTO: 4D local abierto en el puerto 9333');
await new Promise((r) => ctx.on('close', r));

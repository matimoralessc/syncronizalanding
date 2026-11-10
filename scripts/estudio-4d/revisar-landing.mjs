// Capturas de la landing local en posiciones de scroll fijas, con un Chromium
// propio y sin interfaz (el del estudio está ocupado grabando).
// Uso: node revisar-landing.mjs <ancho> <alto> <salida-prefijo> <pos1,pos2,...>
//   cada pos es "h:<fracción del héroe>" o "#<id>" o un número de px.
import { chromium } from 'playwright';

const [, , ancho = '1440', alto = '900', prefijo = 'cap/landing', posiciones = 'h:0'] = process.argv;
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: +ancho, height: +alto }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCIDO ? 'reduce' : 'no-preference' });
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
await page.goto('http://localhost:5181/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

for (const [k, pos] of posiciones.split(',').entries()) {
  const y = await page.evaluate((pos) => {
    if (pos.startsWith('h:')) {
      const s = document.getElementById('inicio');
      return s.offsetTop + (s.offsetHeight - innerHeight) * parseFloat(pos.slice(2));
    }
    if (pos.startsWith('#')) return document.querySelector(pos).getBoundingClientRect().top + scrollY - 0;
    return +pos;
  }, pos);
  // Scroll en pasos, como una persona: el héroe suaviza hacia el objetivo y los
  // IntersectionObserver necesitan ver pasar los bloques.
  await page.evaluate(async (y) => {
    const paso = Math.sign(y - scrollY) * 400;
    while (Math.abs(y - scrollY) > 400) { scrollBy(0, paso); await new Promise((r) => setTimeout(r, 30)); }
    scrollTo(0, y);
  }, y);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${prefijo}-${k}.png` });
}
console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'sin errores de consola');
await browser.close();

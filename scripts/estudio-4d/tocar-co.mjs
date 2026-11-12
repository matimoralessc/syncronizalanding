// Uso: node tocar-co.mjs "texto del botón" [salida.png] — hace clic en el botón
// con ese texto exacto en la página abierta y saca una foto.
import { chromium } from 'playwright';
const [, , texto, salida = '/tmp/tocar-co.png'] = process.argv;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = browser.contexts()[0].pages()[0];
await page.evaluate((t) => [...document.querySelectorAll('button, a, [role=tab]')].find((b) => b.offsetParent && b.textContent.trim() === t)?.click(), texto);
await page.waitForTimeout(2500);
await page.screenshot({ path: salida });
process.exit(0);

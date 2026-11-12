// Uso: node ver-co.mjs <ruta> [salida.png] — abre una ruta de la app local en el
// Chromium de grabación (9333) a 1600×900 y saca una foto, para planear tomas.
import { chromium } from 'playwright';
const [, , ruta = '/', salida = '/tmp/ver-co.png'] = process.argv;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = browser.contexts()[0].pages()[0];
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
if (ruta !== '-') await page.goto('http://localhost:3010' + ruta, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2500);
await page.screenshot({ path: salida });
console.log(page.url());
process.exit(0);

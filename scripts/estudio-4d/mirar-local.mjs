// Foto del estado del 4D en el navegador del estudio (para revisar).
import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = b.contexts()[0].pages()[0];
const ruta = process.argv[2] || '/tmp/mirar.png';
const js = process.argv[3];
if (js) console.log(JSON.stringify(await page.evaluate(js)));
await page.screenshot({ path: ruta });
console.log(page.url(), await page.title());
process.exit(0);

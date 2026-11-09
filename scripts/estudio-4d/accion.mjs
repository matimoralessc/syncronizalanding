// Ejecuta un trozo de JS (async) en la página del 4D del estudio y muestra el resultado.
import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = b.contexts()[0].pages()[0];
const r = await page.evaluate(`(async () => { ${process.argv[2]} })()`);
console.log(JSON.stringify(r));
if (process.argv[3]) await page.screenshot({ path: process.argv[3] });
process.exit(0);

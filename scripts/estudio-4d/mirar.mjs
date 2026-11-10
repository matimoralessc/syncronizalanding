// Uso: node mirar.mjs [salida.png] [js-a-evaluar]
// Se conecta al navegador del estudio, opcionalmente evalúa JS en la página del
// visor (imprime el resultado) y guarda una captura. No cierra la ventana.
import { chromium } from 'playwright';

const [, , salida = 'mirar.png', codigo] = process.argv;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = browser.contexts()[0].pages().find((p) => p.url().includes('syncroniza4d')) ?? browser.contexts()[0].pages()[0];
if (codigo) {
  const r = await page.evaluate(codigo).catch((e) => `ERROR: ${e.message}`);
  console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
}
if (salida !== '-') {
  await page.screenshot({ path: salida });
  console.log('captura:', salida, page.viewportSize());
}
process.exit(0);

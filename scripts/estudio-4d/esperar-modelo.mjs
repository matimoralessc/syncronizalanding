// Espera a que haya sesión iniciada y un modelo 3D cargado en el navegador del
// estudio. Sale con 0 cuando está listo, para que el aviso llegue solo.
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = browser.contexts()[0].pages().find((p) => p.url().includes('syncroniza4d')) ?? browser.contexts()[0].pages()[0];

const limite = Date.now() + 25 * 60 * 1000;
let ultimo = '';
while (Date.now() < limite) {
  const estado = await page
    .evaluate(() => {
      const visible = (el) => !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none';
      const login = document.getElementById('login-user');
      const conToken = Object.keys(localStorage).some((k) => /token|jwt|auth/i.test(k));
      const canvas = [...document.querySelectorAll('canvas')].filter((c) => c.width > 300 && c.height > 300).length;
      const status = document.getElementById('status')?.textContent?.trim() ?? '';
      return { loginVisible: visible(login), conToken, canvas, status, titulo: document.title, url: location.href };
    })
    .catch((e) => ({ error: String(e) }));
  const linea = JSON.stringify(estado);
  if (linea !== ultimo) { console.log(new Date().toISOString().slice(11, 19), linea); ultimo = linea; }
  // "Listo" = sin login a la vista, con token, con canvas, y un status que ya no dice que está cargando.
  if (estado.conToken && !estado.loginVisible && estado.canvas > 0 && estado.status && !/cargando|descargando|procesando/i.test(estado.status)) {
    console.log('MODELO LISTO');
    break;
  }
  await new Promise((r) => setTimeout(r, 2000));
}
// Salir sin browser.close(): sobre una conexión CDP, close() puede cerrar la
// ventana de verdad, y con ella la sesión que Matías acaba de iniciar.
process.exit(0);

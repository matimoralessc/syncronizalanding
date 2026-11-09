// Librería del estudio de grabación del visor 4D.
//
// Se conecta al Chromium donde Matías inició sesión (puerto 9333) y maneja el
// visor REAL de syncroniza4d.cl: la fecha del 4D por el mismo deslizador que usa
// una persona (input + evento), y la cámara por camera-controls, que el visor
// expone en window.ctx para depurar. Nada de esto escribe datos: solo cambia
// qué se mira y desde dónde.
//
// Cada cuadro espera a que el visor termine de pintar antes de capturar. Por eso
// la grabación no depende de la velocidad de la máquina: el video sale a 30 fps
// perfectos aunque cada cuadro tarde un segundo en calcularse.
import { chromium } from 'playwright';

export async function conectar() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
  const context = browser.contexts()[0];
  const page = context.pages().find((p) => p.url().includes('syncroniza4d')) ?? context.pages()[0];
  return { browser, context, page };
}

// Instrumenta el resaltador y los fragmentos para saber cuándo hay trabajo en
// vuelo. Idempotente: si ya está puesto, no lo vuelve a envolver.
export async function instrumentar(page) {
  await page.evaluate(() => {
    if (window.__estudio) return;
    const est = { enVuelo: 0, ultimoCambio: performance.now() };
    window.__estudio = est;
    const envolver = (obj, metodo) => {
      const orig = obj[metodo].bind(obj);
      obj[metodo] = async (...a) => {
        est.enVuelo++;
        est.ultimoCambio = performance.now();
        try { return await orig(...a); } finally { est.enVuelo--; est.ultimoCambio = performance.now(); }
      };
    };
    const h = window.ctx.highlighter;
    envolver(h, 'highlightByID');
    envolver(h, 'clear');
    envolver(window.ctx.fragments.core, 'update');
  });
}

// Espera a que no haya pintado ni actualización de fragmentos en vuelo durante
// `quieto` ms, y después dos cuadros de animación con el render forzado.
export async function esperarQuieto(page, { quieto = 250, maximo = 20000 } = {}) {
  await page.evaluate(async ({ quieto, maximo }) => {
    const est = window.__estudio;
    const t0 = performance.now();
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    while (performance.now() - t0 < maximo) {
      await new Promise((r) => setTimeout(r, 50));
      if (est.enVuelo === 0 && performance.now() - est.ultimoCambio > quieto) break;
    }
    const r = window.ctx.world.renderer;
    r.needsUpdate = true; await raf();
    r.needsUpdate = true; await raf(); await raf();
  }, { quieto, maximo });
}

// Modo cine: el contenedor del 3D a pantalla completa y nada encima.
export async function modoCine(page, { ancho = 1920, alto = 1080, escala = 1, fondo = null } = {}) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: escala, mobile: false });
  await page.addStyleTag({ content: `
    #container { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483000 !important; }
    #container > :not(canvas) { display: none !important; }
    body.estudio-cine { overflow: hidden !important; }
  ` });
  await page.evaluate(({ fondo }) => {
    document.body.classList.add('estudio-cine');
    window.dispatchEvent(new Event('resize'));
    if (fondo) {
      const THREE_COLOR = window.ctx.world.scene.three.background?.constructor;
      if (THREE_COLOR) window.ctx.world.scene.three.background = new THREE_COLOR(fondo);
    }
  }, { fondo });
  await page.waitForTimeout(400);
  return cdp;
}

// Solo el tamaño de la ventana, sin tocar la interfaz.
export async function soloTamano(page, { ancho = 1920, alto = 1080, escala = 1 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: escala, mobile: false });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(500);
  return cdp;
}

export async function salirModoCine(page, cdp) {
  await page.evaluate(() => {
    document.body.classList.remove('estudio-cine');
    document.querySelectorAll('style').forEach((s) => { if (s.textContent.includes('estudio-cine')) s.remove(); });
    window.dispatchEvent(new Event('resize'));
  });
  if (cdp) await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
}

// Fecha del 4D en días desde el inicio del programa (lo que guarda el deslizador).
export async function fijarDia(page, dia) {
  await page.evaluate((dia) => {
    const s = document.getElementById('gantt-slider');
    s.value = String(dia);
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }, dia);
}

export async function rangoDias(page) {
  return page.evaluate(() => {
    const s = document.getElementById('gantt-slider');
    return { min: +s.min, max: +s.max, valor: +s.value, etiqueta: document.getElementById('gantt-slider-date')?.textContent?.trim() };
  });
}

// Cámara sin transición: posición y punto mirado, en coordenadas del mundo.
// `desfase` es el desplazamiento focal de camera-controls (espacio de la
// cámara): corre el encuadre sin cambiar la perspectiva. x negativo deja el
// sujeto a la derecha; y positivo lo baja.
export async function camara(page, pos, mira, desfase = [0, 0, 0]) {
  await page.evaluate(async ({ pos, mira, desfase }) => {
    const c = window.ctx.world.camera.controls;
    await c.setLookAt(pos[0], pos[1], pos[2], mira[0], mira[1], mira[2], false);
    await c.setFocalOffset(desfase[0], desfase[1], desfase[2], false);
    c.update(0);
  }, { pos, mira, desfase });
}

export async function leerCamara(page) {
  return page.evaluate(() => {
    const c = window.ctx.world.camera.controls;
    const p = c.getPosition(new window.ctx.world.camera.three.position.constructor());
    const t = c.getTarget(new window.ctx.world.camera.three.position.constructor());
    return { pos: [p.x, p.y, p.z], mira: [t.x, t.y, t.z] };
  });
}

// Caja de los modelos encendidos (centro y radio), para encuadrar tomas.
export async function cajaModelos(page, filtro = null) {
  return page.evaluate((filtro) => {
    const V = window.ctx.world.camera.three.position.constructor;
    const B = window.ctx.world.scene.three.position.constructor; // Vector3, no Box3: se arma a mano
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const m of window.ctx.fragments.list.values()) {
      if (filtro && !m.modelId.includes(filtro)) continue;
      const b = m.box; if (!b || b.isEmpty()) continue;
      min = [Math.min(min[0], b.min.x), Math.min(min[1], b.min.y), Math.min(min[2], b.min.z)];
      max = [Math.max(max[0], b.max.x), Math.max(max[1], b.max.y), Math.max(max[2], b.max.z)];
    }
    const centro = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const radio = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;
    return { min, max, centro, radio };
  }, filtro);
}

export async function cuadro(page, ruta, { tipo = 'png' } = {}) {
  await page.screenshot({ path: ruta, type: tipo, ...(tipo === 'jpeg' ? { quality: 95 } : {}) });
}

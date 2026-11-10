// Guiones de las tomas de herramientas del 4D actual (grabar-clip.mjs).
// Cada uno recibe { page, cursor }: cursor.clic('texto=Hormigón') busca el
// botón por su texto exacto; cursor.hacia('#selector', ms, dx, dy) mueve hasta
// el centro de un elemento corrido dx, dy.
import * as E from './estudio.mjs';
import { orbita } from './tomas.mjs';

const espera = (page, ms) => page.waitForTimeout(ms);

// Deja el visor en su vista de siempre: sin cajones ni modales abiertos.
async function limpiar({ page }) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('[aria-label="Cerrar"], .ver-x')) if (b.offsetParent) b.click();
    // El riel vuelve a «Elementos»: así se cierra cualquier panel lateral.
    const el = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Elementos');
    el?.click();
  });
  await espera(page, 900);
}

// El aviso «Falta el avance real» de la copia local (allí no se cargó el
// corte): se oculta solo en la grabación; no es algo que muestre producción.
async function sinAvisoAvance({ page }) {
  await page.addStyleTag({ content: '.lp-avance-banner { display: none !important; }' });
}

// El edificio completo (fecha al final del programa) y la cámara sobre la
// caja real de los modelos, de tres cuartos.
async function edificioCompleto({ page }) {
  await E.instrumentar(page);
  const r = await E.rangoDias(page);
  await E.fijarDia(page, r.max);
  const cm = await E.cajaModelos(page);
  await E.camara(page, orbita(60, 30, cm.radio * 1.05, cm.centro), cm.centro);
  await E.esperarQuieto(page, { quieto: 300 });
}
async function volverAHoy({ page }) {
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Hoy')?.click());
  await espera(page, 800);
}
const canvas3D = '#container canvas';

export const CLIPS = {
  // La Curva S de hormigón: se abre, el real de las guías validadas contra lo
  // planificado, el detalle de una semana.
  hormigon: {
    preparar: limpiar,
    cursorInicio: [1150, 640],
    async guion({ page, cursor }) {
      await espera(page, 400);
      await cursor.clic('texto=Hormigón', 900);
      await espera(page, 1900);
      await cursor.hacia('#curva-hg-canvas', 1100, 250, -25);
      await espera(page, 1100);
      await cursor.hacia('#curva-hg-canvas-semanal', 900, -55, 22);
      await espera(page, 900);
      await cursor.clic(null);
      await espera(page, 1800);
    },
    terminar: limpiar,
  },

  // Last Planner: la semana planificada en el 4D, con sus días, frentes y m³.
  'last-planner': {
    async preparar(x) {
      await limpiar(x);
      await sinAvisoAvance(x);
    },
    cursorInicio: [1100, 620],
    async guion({ page, cursor }) {
      await espera(page, 400);
      await cursor.clic('texto=Last Planner', 900);
      await espera(page, 1500);
      await cursor.hacia('texto=21 oct', 900);
      await espera(page, 700);
      await cursor.hacia('texto=Fundaciones · Subterraneo -3', 800);
      await espera(page, 700);
      await cursor.hacia('texto=151,5', 900);
      await espera(page, 1200);
      await cursor.hacia('texto=14.592', 700);
      await espera(page, 1200);
    },
    terminar: limpiar,
  },

  // Observaciones: la nota sobre el modelo, con sus fotos, y pasarla a
  // restricción del Last Planner (el modal se abre; no se crea nada).
  observaciones: {
    async preparar(x) {
      await limpiar(x);
      // Si quedó abierta la ficha de una observación, el panel vuelve a la lista.
      await x.page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Observaciones')?.click());
      await espera(x.page, 900);
      await x.page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.offsetParent && /Ir al listado/.test(b.textContent))?.click());
      await espera(x.page, 600);
      await limpiar(x);
    },
    cursorInicio: [1100, 640],
    async guion({ page, cursor }) {
      await espera(page, 400);
      await cursor.clic('texto=Observaciones', 900);
      await espera(page, 1300);
      await cursor.clic('contiene=alternativa constructi', 900);
      await espera(page, 2600);
      await cursor.clic('texto=Pasar a restricción', 900);
      await espera(page, 2200);
    },
    async terminar(x) {
      await x.page.keyboard.press('Escape').catch(() => {});
      await limpiar(x);
    },
  },

  // Cubicación: con Shift + arrastre se toma una franja del edificio y suma
  // hormigón, moldaje y fierro, por categoría.
  cubicacion: {
    async preparar(x) {
      await limpiar(x);
      await edificioCompleto(x);
    },
    cursorInicio: [1300, 380],
    async guion({ page, cursor }) {
      await espera(page, 400);
      await cursor.clic('texto=Herramientas', 900);
      await espera(page, 900);
      await cursor.clic('texto=Elegir elementos para sumar', 800);
      await espera(page, 700);
      const c = await page.evaluate((s) => { const q = document.querySelector(s).getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; }, canvas3D);
      await cursor.a(c.x + c.w * 0.42, c.y + c.h * 0.40, 900);
      await page.keyboard.down('Shift');
      await page.mouse.down();
      await cursor.a(c.x + c.w * 0.58, c.y + c.h * 0.58, 1300);
      await page.mouse.up();
      await page.keyboard.up('Shift');
      await espera(page, 1800);
      await cursor.hacia('texto=Por categoría', 900, 60, 60);
      await espera(page, 1500);
    },
    async terminar(x) {
      await x.page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.offsetParent && /Limpiar selección|Terminar cubicación/.test(b.textContent))?.click());
      await volverAHoy(x);
      await limpiar(x);
    },
  },
};

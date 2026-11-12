// Guiones de las tomas de Syncroniza CO para la landing (11-nov-2026, Matías:
// «lo realmente importante, curvas S, datos de variaciones, y demás no lo
// tenemos»). Contra la app LOCAL (3010) con la copia de producción de
// Panorámica; se graban con grabar-clip.mjs (CLIPS=clips-co.mjs).
const BASE = 'http://localhost:3010/obras/panoramica-constructora-inspira';
const espera = (page, ms) => page.waitForTimeout(ms);

async function ir(page, ruta, ms = 2500) {
  await page.goto(BASE + ruta, { waitUntil: 'networkidle' }).catch(() => {});
  // El botón del agente flota sobre los gráficos y no es parte de lo que se muestra.
  await page.addStyleTag({ content: '.agente-anclaje { display: none !important; }' }).catch(() => {});
  await espera(page, ms);
}

/** El rectángulo de un elemento, para moverse dentro de él en fracciones. */
async function caja(page, sel) {
  return page.evaluate((s) => {
    const q = document.querySelector(s).getBoundingClientRect();
    return { x: q.x, y: q.y, w: q.width, h: q.height };
  }, sel);
}

async function desplazar(page, px, ms = 900) {
  await page.evaluate(({ px, ms }) => {
    const m = document.querySelector('main');
    const ini = m.scrollTop, t0 = performance.now();
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      m.scrollTop = ini + px * e;
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }, { px, ms });
  await espera(page, ms + 100);
}

/** Desplaza hasta el título que contiene `texto`, dejándolo arriba. */
async function irA(page, texto, ms = 1200) {
  const px = await page.evaluate((t) => {
    const h = [...document.querySelectorAll('h2, h3')].find((e) => e.textContent.includes(t));
    return h ? h.getBoundingClientRect().top - 130 : 0;
  }, texto);
  await desplazar(page, px, ms);
}

export const CLIPS = {
  // Curva S: programado, real, EE.PP y costo; se recorre la curva y se ve el
  // proyecto entero.
  'co-curva-s': {
    preparar: ({ page }) => ir(page, '/curva-s'),
    cursorInicio: [1250, 700],
    async guion({ page, cursor }) {
      const g = await caja(page, '.recharts-wrapper');
      for (const f of [0.35, 0.55, 0.72, 0.8]) {
        await cursor.a(g.x + g.w * f, g.y + g.h * 0.55, 800);
        await espera(page, 700);
      }
      await cursor.clic('texto=Todo el proyecto', 900);
      await espera(page, 1600);
      const g2 = await caja(page, '.recharts-wrapper');
      await cursor.a(g2.x + g2.w * 0.62, g2.y + g2.h * 0.5, 900);
      await espera(page, 1200);
      await cursor.clic('texto=$', 800);
      await espera(page, 1600);
    },
  },

  // Avance por semana: plan y real de cada semana, en % y en pesos, con su CPI.
  'co-semanal': {
    preparar: ({ page }) => ir(page, '/semanal'),
    cursorInicio: [1200, 500],
    async guion({ page, cursor }) {
      await espera(page, 500);
      await desplazar(page, 260, 1200);
      await cursor.hacia('texto=26 oct 26', 900, 0, 0);
      await espera(page, 900);
      await cursor.hacia('texto=1,92', 900);
      await espera(page, 1000);
      await cursor.clic('texto=Acumulado', 900);
      await espera(page, 1800);
    },
  },

  // Costos: el panorama, dónde está el presupuesto y dónde se gana y dónde se
  // pierde (el resultado proyectado de cada centro de costo).
  'co-costos': {
    preparar: ({ page }) => ir(page, '/costos', 3000),
    cursorInicio: [900, 300],
    async guion({ page, cursor }) {
      await cursor.hacia('texto=GASTADO', 900, 0, 40);
      await espera(page, 1000);
      await irA(page, 'Dónde está el presupuesto', 1300);
      await cursor.hacia('texto=MATERIALES', 900, 0, 40);
      await espera(page, 1100);
      await irA(page, 'gana y dónde se pierde', 1400);
      await cursor.hacia('texto=SUMISTRO FIERRO', 900, 420, 0);
      await espera(page, 900);
      await cursor.hacia('texto=ENSAYOS', 900, 520, 0);
      await espera(page, 1000);
      await irA(page, 'Cuánto lleva gastado cada familia', 1300);
      await espera(page, 1500);
    },
  },

  // Hormigón: lo planificado en el 4D contra lo registrado en las guías.
  'co-hormigon': {
    preparar: ({ page }) => ir(page, '/hormigon/curva'),
    cursorInicio: [1300, 330],
    async guion({ page, cursor }) {
      await espera(page, 400);
      await desplazar(page, 300, 1100);
      const g = await caja(page, '.recharts-wrapper');
      for (const f of [0.15, 0.4, 0.75, 0.9]) {
        await cursor.a(g.x + g.w * f, g.y + g.h * 0.55, 800);
        await espera(page, 700);
      }
      await cursor.clic('texto=Todo', 800);
      await espera(page, 1500);
      await cursor.clic('texto=Ver guías', 900);
      await espera(page, 2400);
    },
  },

  // Last Planner: el tablero de restricciones de la semana.
  'co-last-planner': {
    preparar: ({ page }) => ir(page, '/last-planner'),
    cursorInicio: [1200, 500],
    async guion({ page, cursor }) {
      await cursor.hacia('texto=Cumplimiento de restricciones', 900, 0, 60);
      await espera(page, 1000);
      await cursor.clic('texto=Restricciones', 900);
      await espera(page, 1800);
      await cursor.hacia('contiene=Terminar el picado', 1000);
      await espera(page, 1200);
      await cursor.hacia('contiene=falta impermeabilizacion', 900);
      await espera(page, 1000);
      await cursor.clic('texto=Indicadores', 900);
      await espera(page, 1800);
    },
  },

  // Terminaciones: la unidad sobre su plano, con sus observaciones.
  'co-terminaciones': {
    preparar: ({ page }) => ir(page, '/terminaciones'),
    cursorInicio: [1100, 600],
    async guion({ page, cursor }) {
      await cursor.clic('contiene=11A', 1000);
      await espera(page, 1500);
      await cursor.clic('texto=Plano', 900);
      await espera(page, 3200);
      await cursor.clic('contiene=Falta Instalacion de receptaculo', 1000);
      await espera(page, 2200);
    },
    async terminar({ page }) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
    },
  },
};

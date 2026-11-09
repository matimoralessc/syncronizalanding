// Las tomas, como funciones del tiempo t ∈ [0, 1] → { pos, mira, dia }.
//
// Las coordenadas salen de medir el edificio de Panorámica en el propio visor:
// caja de lo hormigonado x −54..−11, y 0..25, z −6..97 (una tira de 44 × 103 m
// y 25 m de alto). El hormigonado va del día 67 al 218 del programa, y entre el
// 100 y el 215 aparecen ~25 elementos por día casi parejo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CENTRO = [-32.5, 10, 45.7];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
// Ease in-out con inercia: arranca y frena como una grúa, no como un ascensor.
export const suave = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const tramo = (t, a, b) => clamp((t - a) / (b - a));

export function orbita(az, el, R, mira) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return [mira[0] + R * Math.cos(e) * Math.sin(a), mira[1] + R * Math.sin(e), mira[2] + R * Math.cos(e) * Math.cos(a)];
}

// ── Fecha por avance visible, no por calendario ─────────────────────────────
// Si la fecha avanza pareja, el primer tercio de la toma es terreno vacío (del
// día 55 al 100 aparecen 23 elementos) y el edificio sale casi entero de golpe.
// Se invierte la curva de "elementos visibles por día": cada cuadro suma la
// misma cantidad de obra. Un 20 % de calendario puro se mezcla para que el
// tiempo se sienta pasar también en los tramos tranquilos.
const aqui = path.dirname(fileURLToPath(import.meta.url));
const tareas = JSON.parse(fs.readFileSync(path.join(aqui, 'datos-tareas.json'), 'utf8'));
export function diaPorAvance(u, desde = 55, hasta = 222, calendario = 0.2) {
  const total = tareas.reduce((a, x) => a + x.n, 0);
  const visibles = (d) => tareas.reduce((a, x) => a + (d >= x.s ? x.n : 0), 0);
  const meta = clamp(u) * total;
  let porConteo = hasta;
  for (let d = desde; d <= hasta; d++) if (visibles(d) >= meta) { porConteo = d; break; }
  const porCalendario = lerp(desde, hasta, clamp(u));
  return Math.round(lerp(porConteo, porCalendario, calendario));
}

// Modelos que en la toma general se ven como líneas y puntos (cañerías): se
// apagan solo durante la toma, igual que con el ojo del panel de modelos.
const CANERIAS = ['Alcantarillado', 'AALL Edificio'];
async function apagarCanerias(page) {
  await page.evaluate((nombres) => {
    for (const m of window.ctx.fragments.list.values()) m.object.visible = !nombres.some((n) => m.modelId.includes(n));
    window.ctx.world.renderer.needsUpdate = true;
  }, CANERIAS);
}
// Lente: el visor usa 60°, que en una toma de lejos deforma (las casas del
// primer plano crecen y el edificio se achica). Un lente largo aplana la
// perspectiva, como la fotografía de arquitectura.
export async function lente(page, fov) {
  await page.evaluate((fov) => {
    const c = window.ctx.world.camera.three;
    c.fov = fov; c.updateProjectionMatrix();
    window.ctx.world.renderer.needsUpdate = true;
  }, fov);
}
// La interfaz como se quiere mostrar: toda la obra en el Gantt (la línea del
// modelo barre la línea de tiempo mientras el edificio sube), las filas de la
// obra gruesa a la vista (sus barras tienen los colores de ciclo del 3D) y la
// leyenda minimizada para que no tape el modelo. Son ajustes de vista: se
// guardan en el perfil del estudio, no tocan datos de la obra.
async function prepararInterfaz(page) {
  await page.evaluate(async (filaObraGruesa) => {
    document.querySelector('[data-horizonte="obra"]')?.click();
    await new Promise((r) => setTimeout(r, 400));
    const chart = document.getElementById('gantt-chart');
    if (chart) chart.scrollTop = filaObraGruesa * 22;
    const leyenda = document.getElementById('ciclos-legend');
    if (leyenda && !leyenda.classList.contains('minimizada')) leyenda.querySelector('.ciclos-legend-titulo')?.click();
  }, FILA_OBRA_GRUESA);
  await page.waitForTimeout(600);
}
// Fila del Gantt donde empieza "OBRA GRUESA EDIFICIO" con el árbol expandido.
// Se ajusta mirando una captura (filas de 22 px, ver gantt.ts ROW_HEIGHT).
export const FILA_OBRA_GRUESA = 53;

export async function encenderTodo(page) {
  await page.evaluate(() => {
    for (const m of window.ctx.fragments.list.values()) m.object.visible = true;
    window.ctx.world.camera.controls.setFocalOffset(0, 0, 0, false);
    window.ctx.world.renderer.needsUpdate = true;
  });
  await lente(page, 60);
}

export const TOMAS = {
  // El héroe: el terreno vacío y, mientras la cámara se abre y gira, el
  // edificio se levanta ciclo por ciclo hasta quedar de costado con los 8
  // colores. Pensada para scroll: el primer cuadro es el póster y el último se
  // sostiene mientras entra el texto.
  heroe: {
    cuadros: 420,
    preparar: async (page) => { await apagarCanerias(page); await lente(page, 36); },
    terminar: encenderTodo,
    en(t) {
      const m = suave(t);
      const az = lerp(34, 97, m);
      const el = lerp(30, 15, m);
      // R calculado para el lente de 36°: equivale a 108→84 con el de 60°.
      const R = lerp(178, 140, m);
      const mira = [CENTRO[0], lerp(2, 9.5, m), CENTRO[2]];
      const dia = diaPorAvance(tramo(t, 0.07, 0.86));
      // En la landing el texto va arriba a la izquierda: el sujeto parte 15 %
      // a la derecha (portada) y termina un poco más abajo (cierre con botón).
      // Ojo con el signo: en camera-controls un desfase Y POSITIVO sube el
      // sujeto en el cuadro (se probó: +8 lo dejó pisando el botón del cierre).
      const desfase = [lerp(-30, -6, m), lerp(0, -8, m), 0];
      return { pos: orbita(az, el, R, mira), mira, dia, desfase };
    },
  },

  // Versión vertical para teléfonos (9:16). No es un recorte de la horizontal:
  // el edificio mide 100 m de largo y en vertical quedaba cortado. La cámara se
  // para en el extremo turquesa y mira a lo largo; como el hormigonado parte
  // por el extremo rojo (el del fondo), el edificio crece acercándose.
  // `mira` alto deja el edificio en los dos tercios de abajo: arriba van textos.
  heroe_vertical: {
    cuadros: 420,
    preparar: async (page) => { await apagarCanerias(page); await lente(page, 50); },
    terminar: encenderTodo,
    en(t) {
      const m = suave(t);
      const az = lerp(166, 194, m);
      const el = lerp(46, 30, m);
      const R = lerp(150, 122, m);
      const mira = [CENTRO[0], lerp(12, 17, m), CENTRO[2] - 6];
      const dia = diaPorAvance(tramo(t, 0.07, 0.86));
      return { pos: orbita(az, el, R, mira), mira, dia };
    },
  },

  // Giro de 360° a mitad de la obra gruesa: abajo los ciclos ya hormigonados,
  // arriba los pisos que faltan. Es la sección "elige una fecha". El último
  // cuadro no se graba (t < 1): el giro cierra exacto sobre el primero y el
  // video queda en bucle sin salto.
  ciclos: {
    cuadros: 300,
    bucle: true,
    preparar: async (page) => { await apagarCanerias(page); await lente(page, 36); },
    terminar: encenderTodo,
    en(t) {
      const mira = [CENTRO[0], 8, CENTRO[2]];
      return { pos: orbita(40 + 360 * t, 24, 125, mira), mira, dia: 178 };
    },
  },

  // El visor tal cual, con el programa a la vista: el deslizador avanza y el
  // modelo y el Gantt se mueven juntos. Para los cortos ("esto es el producto").
  ui: {
    cuadros: 240,
    ui: true,
    preparar: async (page) => {
      await apagarCanerias(page);
      await lente(page, 45);
      await prepararInterfaz(page);
    },
    terminar: encenderTodo,
    en(t) {
      const m = suave(t);
      const mira = [CENTRO[0], 8, CENTRO[2]];
      const dia = diaPorAvance(tramo(t, 0.05, 0.95));
      return { pos: orbita(lerp(60, 92, m), lerp(26, 20, m), 112, [mira[0], 6, mira[2]]), mira: [mira[0], 6, mira[2]], dia };
    },
  },
};

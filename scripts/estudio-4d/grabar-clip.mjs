// Uso: node grabar-clip.mjs <clip> [ancho] [alto]
//
// Graba una herramienta del 4D en uso (9-nov-2026: «esos videos son viejos,
// hoy Syncroniza 4D tiene muchas herramientas nuevas»). A diferencia de
// rodar.mjs, que fotografía el 3D cuadro a cuadro, acá se graba la interfaz
// en tiempo real: el visor pinta y CDP entrega cada cuadro que pintó
// (Page.startScreencast), con su hora. Un cursor dibujado en la página se
// mueve y hace clic, como en los films de teléfono.
//
// Los guiones están en clips.mjs. Nada de esto escribe en la obra salvo lo que
// el guion haga a propósito (y se graba contra la copia LOCAL, no producción).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { CLIPS } from './clips.mjs';

const [, , nombre, ancho = '1600', alto = '900'] = process.argv;
const clip = CLIPS[nombre];
if (!clip) throw new Error(`no existe el clip ${nombre}. Hay: ${Object.keys(CLIPS).join(', ')}`);
const W = +ancho, H = +alto;

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const page = browser.contexts()[0].pages()[0];
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await page.waitForTimeout(800);

// ── El cursor: una flecha blanca con sombra y un anillo al hacer clic ──────
await page.evaluate(() => {
  document.getElementById('cursor-estudio')?.remove();
  const c = document.createElement('div');
  c.id = 'cursor-estudio';
  c.innerHTML = `<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2 L3 24 L9 18.5 L13 27 L17 25.2 L13 16.8 L21 16.8 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i>`;
  Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none',
    transform: 'translate(-100px,-100px)', transition: 'transform 0ms', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.45))' });
  const st = document.createElement('style');
  st.id = 'cursor-estudio-css';
  st.textContent = `#cursor-estudio i{position:absolute;left:-14px;top:-14px;width:30px;height:30px;border-radius:50%;
    border:2px solid #37b6ff;opacity:0;transform:scale(.4)} #cursor-estudio i.pulso{animation:pulso .45s ease-out}
    @keyframes pulso{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.6)}}`;
  document.head.appendChild(st);
  document.body.appendChild(c);
});

const cursor = {
  x: W * 0.7, y: H * 0.7,
  async a(x, y, ms = 700) {
    await page.evaluate(({ x, y, ms }) => {
      const c = document.getElementById('cursor-estudio');
      c.style.transition = `transform ${ms}ms cubic-bezier(0.32, 0.72, 0, 1)`;
      c.style.transform = `translate(${x}px, ${y}px)`;
    }, { x, y, ms });
    this.x = x; this.y = y;
    await page.mouse.move(x, y, { steps: Math.max(2, Math.round(ms / 40)) });
    await page.waitForTimeout(ms);
  },
  // Mueve hasta el centro de un elemento (selector CSS o texto exacto de un botón).
  async hacia(blanco, ms = 700, dx = 0, dy = 0) {
    const r = await rect(blanco);
    await this.a(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy, ms);
    return r;
  },
  async clic(blanco, ms = 700) {
    if (blanco) await this.hacia(blanco, ms);
    await page.evaluate(() => {
      const i = document.querySelector('#cursor-estudio i');
      i.classList.remove('pulso'); void i.offsetWidth; i.classList.add('pulso');
    });
    await page.mouse.click(this.x, this.y);
    await page.waitForTimeout(120);
  },
};
async function rect(blanco) {
  const r = await page.evaluate((b) => {
    let el = null;
    if (b.startsWith('texto=') || b.startsWith('contiene=')) {
      const exacto = b.startsWith('texto=');
      const t = b.slice(b.indexOf('=') + 1).toLowerCase();
      const norm = (e) => e.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      el = [...document.querySelectorAll('button, a, [role=button], [role=tab], label, span, div, td, li, p, h3, h4, strong, b')]
        .filter((e) => e.offsetParent && (exacto ? norm(e) === t : norm(e).includes(t)))
        .sort((a, z) => a.textContent.length - z.textContent.length)[0];
    } else el = document.querySelector(b);
    if (!el) return null;
    const q = el.getBoundingClientRect();
    return { x: q.x, y: q.y, width: q.width, height: q.height };
  }, blanco);
  if (!r) throw new Error(`no encontré ${blanco}`);
  return r;
}

// ── Preparar (sin grabar), grabar el guion y armar el video ────────────────
if (clip.preparar) await clip.preparar({ page, cursor });
await cursor.a(clip.cursorInicio?.[0] ?? W * 0.72, clip.cursorInicio?.[1] ?? H * 0.72, 10);
await page.waitForTimeout(500);

const dir = path.join('clips', `${nombre}-cuadros`);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const cuadros = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const n = cuadros.length;
  const archivo = path.join(dir, `${String(n).padStart(5, '0')}.jpg`);
  fs.writeFileSync(archivo, Buffer.from(data, 'base64'));
  cuadros.push({ archivo, t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
const t0 = Date.now() / 1000;
await clip.guion({ page, cursor });
await page.waitForTimeout(clip.cola ?? 900);
await cdp.send('Page.stopScreencast');
const tFin = Date.now() / 1000;
await page.waitForTimeout(300);

// El screencast solo manda cuadro cuando algo cambia: cada cuadro dura hasta
// el siguiente, y el último hasta el final de la toma.
const lista = cuadros.map((c, i) => {
  const fin = i + 1 < cuadros.length ? cuadros[i + 1].t : Math.max(c.t + 0.04, tFin - t0 + cuadros[0].t);
  return `file '${path.resolve(c.archivo)}'\nduration ${Math.max(0.001, fin - c.t).toFixed(4)}`;
});
lista.push(`file '${path.resolve(cuadros[cuadros.length - 1].archivo)}'`);
fs.writeFileSync(path.join(dir, 'lista.txt'), lista.join('\n'));
fs.mkdirSync('clips', { recursive: true });
const mp4 = path.join('clips', `${nombre}.mp4`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'),
  '-vf', `fps=30,scale=${W}:${H}:flags=lanczos`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
  '-pix_fmt', 'yuv420p', '-g', '30', '-movflags', '+faststart', mp4]);
fs.rmSync(dir, { recursive: true, force: true });
if (clip.terminar) await clip.terminar({ page, cursor });
await page.evaluate(() => { document.getElementById('cursor-estudio')?.remove(); document.getElementById('cursor-estudio-css')?.remove(); });
await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
console.log(`listo: ${mp4} (${cuadros.length} cuadros, ${(tFin - t0).toFixed(1)} s)`);
process.exit(0);

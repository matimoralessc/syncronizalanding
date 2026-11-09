// Solo lectura: escucha la respuesta del avance que pide el visor al activar
// "Avance real" y la resume. No escribe nada.
import * as E from './estudio.mjs';
const { page } = await E.conectar();
const respuestas = [];
page.on('response', async (r) => {
  if (/avance/i.test(r.url()) && r.request().method() === 'GET') {
    let cuerpo = null;
    try { cuerpo = await r.json(); } catch { /* no json */ }
    respuestas.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ''), status: r.status(), cuerpo });
  }
});
const boton = page.locator('#gantt-btn-toggle-modo');
await boton.click();
await page.waitForTimeout(6000);
await boton.click();
for (const r of respuestas) {
  console.log(r.status, r.url);
  const c = r.cuerpo;
  if (!c) continue;
  const lista = Array.isArray(c) ? c : (c.partidas ?? c.tareas ?? c.items ?? Object.values(c).find(Array.isArray) ?? []);
  console.log('  fila:', JSON.stringify(lista[0]));
  console.log('  soil:', JSON.stringify(lista.filter((x) => /secci|batach/i.test(JSON.stringify(x))).slice(0, 4)));
  const conAvance = lista.filter((x) => (x.av_real ?? x.real ?? x.avance ?? 0) > 0);
  console.log('  con avance > 0:', conAvance.length);
  console.log('  ejemplos:', JSON.stringify(conAvance.slice(0, 6).map((x) => ({ uid: x.uid ?? x.uid_gantt ?? x.task_uid, nombre: (x.nombre ?? x.name ?? '').slice(0, 30), real: x.av_real ?? x.real ?? x.avance, plan: x.av_plan ?? x.plan }))));
}
const uidsMapeados = await page.evaluate(() => window.ctx.msProject.tasks.filter((t) => t.ifc_guids?.length && /secci|soil|batach/i.test(t.name)).map((t) => ({ uid: t.uid, nombre: t.name })));
console.log('soil nailing vinculado en el 4D:', JSON.stringify(uidsMapeados));
process.exit(0);

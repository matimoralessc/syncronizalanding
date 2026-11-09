// Saca del visor los datos con que se arman las tomas y el HUD del héroe:
//   datos-tareas.json        → inicio, término y elementos de cada tarea vinculada
//                              (tomas.mjs reparte la fecha del héroe por obra)
//   datos-heroe-crudos.json  → lo mismo, con el modelo de cada elemento y el
//                              color de su ciclo (generar-datos-heroe.mjs)
// Necesita la obra abierta en el navegador del estudio (abrir.mjs).
import fs from 'node:fs';
import * as E from './estudio.mjs';

const { page } = await E.conectar();
const crudo = await page.evaluate(async () => {
  const p = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };
  const tareas = window.ctx.msProject.tasks;
  const t0 = p(tareas[0].start);
  const dia = (s) => Math.round((p(s) - t0) / 864e5);
  const modelos = [...window.ctx.fragments.list.values()];
  const out = [];
  for (const t of tareas.filter((x) => x.ifc_guids?.length)) {
    const porModelo = {};
    for (const m of modelos) {
      const ids = await m.getLocalIdsByGuids(t.ifc_guids);
      const n = ids.filter((x) => x !== null && x !== undefined).length;
      if (n) porModelo[m.modelId] = n;
    }
    out.push({
      s: dia(t.start), f: dia(t.finish), n: t.ifc_guids.length,
      c: t.cycleUid ?? null,
      color: t.cycleUid !== undefined ? (window.ctx.msProject.cycleColors?.get(t.cycleUid) ?? null) : null,
      nombre: t.name, porModelo,
    });
  }
  return { inicio: tareas[0].start, tareas: out };
});
fs.writeFileSync('datos-heroe-crudos.json', JSON.stringify(crudo));
fs.writeFileSync('datos-tareas.json', JSON.stringify(crudo.tareas.map(({ s, f, n, c, nombre }) => ({ s, f, n, c, nombre }))));
console.log(`${crudo.tareas.length} tareas vinculadas, programa desde ${crudo.inicio}`);
process.exit(0);

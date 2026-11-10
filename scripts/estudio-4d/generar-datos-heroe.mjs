// Datos por cuadro del héroe: fecha del 4D, elementos hormigonados y en qué
// cuadro se enciende cada ciclo. Sale de los mismos datos con que se grabó.
import fs from 'node:fs';
import { TOMAS } from './tomas.mjs';

const crudo = JSON.parse(fs.readFileSync('datos-heroe-crudos.json', 'utf8'));
// Lo que NO se cuenta: desde nov-2026 el estructural está dos veces en el visor
// (el original y el «seccionado» _avance, que es el que se usa); contar los dos
// duplicaba el edificio. Las cañerías sí se cuentan aunque no se vean: así el
// total cuadra con los elementos vinculados de la franja «En obra hoy».
const OCULTOS = ['Calculo_Panoramica_Rev0002.ifc'];
const visiblesDe = (t) => Object.entries(t.porModelo)
  .filter(([m]) => !OCULTOS.some((o) => m.includes(o)))
  .reduce((a, [, n]) => a + n, 0);
const tareas = crudo.tareas.map((t) => ({ ...t, n: visiblesDe(t) })).filter((t) => t.n > 0);
const total = tareas.reduce((a, t) => a + t.n, 0);

const toma = TOMAS.heroe;
const dias = [];
const hormigonados = [];
for (let i = 0; i < toma.cuadros; i++) {
  const { dia } = toma.en(i / (toma.cuadros - 1));
  dias.push(dia);
  // "Levantado" = lo que se ve en pantalla: en curso (gris) o terminado (color).
  // Igual que el visor: aparece el día que empieza la tarea (d >= inicio).
  hormigonados.push(tareas.reduce((a, t) => a + (dia >= t.s ? t.n : 0), 0));
}

// Ciclos con presencia real en la toma (se descartan los de menos de 20
// elementos: un chip que se enciende por 3 piezas invisibles no explica nada).
const porColor = new Map();
for (const t of tareas) {
  if (!t.color) continue;
  const c = porColor.get(t.color) ?? { n: 0, primerTermino: Infinity };
  c.n += t.n;
  c.primerTermino = Math.min(c.primerTermino, t.f);
  porColor.set(t.color, c);
}
const ciclos = [...porColor.entries()]
  .filter(([, c]) => c.n >= 20)
  .map(([color, c]) => ({ color, cuadro: dias.findIndex((d) => d > c.primerTermino), elementos: c.n }))
  .sort((a, b) => a.cuadro - b.cuadro || b.elementos - a.elementos);

const [d, m, y] = crudo.inicio.split('/');
const salida = {
  inicioPrograma: `${y}-${m}-${d}`,
  cuadros: toma.cuadros,
  total,
  dias,
  levantados: hormigonados,
  ciclos,
};
fs.writeFileSync(process.argv[2], JSON.stringify(salida));
console.log('total', total, 'ciclos', ciclos.map((c) => `${c.color}@${c.cuadro}`).join(' '), 'último', hormigonados.at(-1), 'bytes', fs.statSync(process.argv[2]).size);

// La obra inventada que cuentan todas las animaciones.
//
// No es una obra real: es una torre residencial plausible para Santiago, con
// números orgánicos (nada redondo) y, sobre todo, COHERENTES entre sí. La curva
// S, el valor ganado y los costos salen de las mismas fórmulas, así ninguna
// animación contradice a otra si se ven juntas.
import { azar, limitar } from '../marca.js';

export const OBRA = {
  nombre: 'Edificio Vista Cordillera',
  comuna: 'Ñuñoa',
  pisos: 18,
  subterraneos: 2,
  // Lunes de la primera semana del programa.
  inicio: new Date('2025-11-03T12:00:00'),
  semanas: 96,
  // Semana del último corte de avance: la "hoy" de los datos (12 oct 2026).
  corte: 49,
  // Presupuesto a costo directo + GG, en UF.
  presupuestoUF: 412_380,
};

export function fechaDeSemana(semana) {
  const f = new Date(OBRA.inicio);
  f.setDate(f.getDate() + Math.round(semana * 7));
  return f;
}

// ── Curva S (avance físico ponderado, %) ──────────────────────────────────
// Programado: una S de arranque lento (excavación y fundaciones mueven poco
// el avance ponderado) que a mitad de plazo va cerca del 50 %.
function sCurva(x) {
  x = limitar(x);
  const a = 2.2, b = 2.0; // forma de la acumulada (beta suavizada)
  const s = x ** a / (x ** a + (1 - x) ** b);
  return s;
}
export const planPct = (semana) => 100 * sCurva(semana / OBRA.semanas);

// Real: arranca pegado al programa, se atrasa en la obra gruesa (lluvias de
// junio y julio, que en Santiago paran el hormigonado) y en el corte va 7 %
// abajo: SPI 0,93.
const SPI_CORTE = 0.93;
export function realPct(semana) {
  if (semana > OBRA.corte) return null;
  const x = semana / OBRA.corte;
  // Atraso que crece suave hasta el corte, con un bache en invierno.
  const invierno = Math.exp(-(((semana - 36) / 5) ** 2)) * 0.035;
  const atraso = (1 - SPI_CORTE) * (x ** 1.6) + invierno * x;
  return planPct(semana) * (1 - atraso);
}

// Valor ganado al corte (UF), derivado de la curva: así SPI y CPI cuadran.
export const EVM = (() => {
  const bac = OBRA.presupuestoUF;
  const pv = bac * planPct(OBRA.corte) / 100;
  const ev = bac * realPct(OBRA.corte) / 100;
  const cpi = 0.97;
  const ac = ev / cpi;
  return { bac, pv, ev, ac, spi: ev / pv, cpi, planCorte: planPct(OBRA.corte), realCorte: realPct(OBRA.corte) };
})();

// ── Costos por familia (UF) ───────────────────────────────────────────────
// El gastado de cada familia se reparte para que su suma sea exactamente el
// costo real del valor ganado (EVM.ac). Proporciones de una obra en plena obra
// gruesa: la obra gruesa va adelantada, las terminaciones recién parten.
export const FAMILIAS = (() => {
  const base = [
    { codigo: 'OG', nombre: 'Obra gruesa', presupuesto: 148_230, peso: 0.50 },
    { codigo: 'TER', nombre: 'Terminaciones', presupuesto: 121_750, peso: 0.10 },
    { codigo: 'INS', nombre: 'Instalaciones', presupuesto: 63_480, peso: 0.11 },
    { codigo: 'MO', nombre: 'Mano de obra', presupuesto: 41_160, peso: 0.16 },
    { codigo: 'GG', nombre: 'Gastos generales', presupuesto: 37_760, peso: 0.13 },
  ];
  const sumaPesos = base.reduce((a, f) => a + f.peso, 0);
  return base.map((f) => ({ ...f, gastado: Math.round(EVM.ac * f.peso / sumaPesos) }));
})();

// ── Avance semanal (incremento de la curva real, en puntos %) ──────────────
export const SEMANAL = Array.from({ length: OBRA.corte }, (_, w) => ({
  semana: w + 1,
  plan: planPct(w + 1) - planPct(w),
  real: realPct(w + 1) - realPct(w),
}));

// Ruido determinístico disponible para quien lo necesite (barras, guías...).
export const ruido = azar(2611);

// ── Partidas (control de avance semana a semana) ───────────────────────────
// Ventana programada [inicio, fin] en semanas y atraso real en semanas al
// corte. Las de obra gruesa coinciden con el programa de la torre 3D
// (datos/torre.js); las terminaciones arrancan con la obra gruesa a medio
// camino, como en una torre real. El atraso de cada una es el que explica el
// SPI 0,93 de la curva: la obra gruesa de la torre se corrió en invierno.
export const PARTIDAS = [
  { nombre: 'Excavación masiva', ventana: [2, 8], atraso: 0 },
  { nombre: 'Fundaciones', ventana: [8, 10.5], atraso: 0.4 },
  { nombre: 'Obra gruesa subterráneos', ventana: [10.5, 16.5], atraso: 0.8 },
  { nombre: 'Obra gruesa zócalo', ventana: [16.5, 22.5], atraso: 1.1 },
  { nombre: 'Obra gruesa torre', ventana: [22.5, 45.2], atraso: 4.6 },
  { nombre: 'Instalaciones sanitarias', ventana: [26, 70], atraso: 5.2 },
  { nombre: 'Tabiquería', ventana: [34, 74], atraso: 3.1 },
  { nombre: 'Ventanas y fachada', ventana: [40, 78], atraso: 3.4 },
  { nombre: 'Terminaciones húmedas', ventana: [44, 84], atraso: 2.6 },
  { nombre: 'Ascensores', ventana: [60, 86], atraso: 0 },
];
// Avance de una partida a una semana: lineal dentro de su ventana; el real va
// corrido por su atraso, que crece de a poco desde que la partida parte.
export function avancePartida(partida, semana, real = false) {
  const [a, b] = partida.ventana;
  let w = semana;
  if (real) {
    const crecido = limitar((semana - a) / Math.max(1, OBRA.corte - a));
    w = semana - partida.atraso * crecido;
  }
  return 100 * limitar((w - a) / (b - a));
}

// ── Last Planner: PPC semanal de las últimas 16 semanas y causas de no
// cumplimiento. El bache de julio es el mismo invierno que atrasa la curva S.
export const PPC = (() => {
  const base = [84, 79, 86, 82, 77, 88, 81, 73, 64, 61, 69, 76, 83, 79, 85, 81];
  return base.map((v, i) => ({ semana: OBRA.corte - base.length + 1 + i, ppc: v }));
})();
export const PPC_META = 80;
export const CAUSAS = [
  { causa: 'Lluvia', pct: 37.6 },
  { causa: 'Materiales', pct: 24.3 },
  { causa: 'Mano de obra', pct: 20.8 },
  { causa: 'Diseño e info', pct: 9.4 },
  { causa: 'Otros', pct: 7.9 },
];

// ── Salud de obra: cada índice pasado a 0..100 y ponderado. Penaliza fuerte
// bajo 1: un SPI de 0,93 ya es un problema, no un 93 %.
export const SALUD = (() => {
  const a100 = (x) => Math.max(0, Math.min(100, 100 - (1 - x) * 400));
  const ppcProm = PPC.slice(-4).reduce((a, x) => a + x.ppc, 0) / 4;
  const ipi = 0.88; // productividad: m³ por HH contra lo planificado
  const indices = [
    { clave: 'SPI', nombre: 'Plazo', valor: EVM.spi, puntaje: a100(EVM.spi), peso: 0.3 },
    { clave: 'CPI', nombre: 'Costo', valor: EVM.cpi, puntaje: a100(EVM.cpi), peso: 0.3 },
    { clave: 'PPC', nombre: 'Compromisos', valor: ppcProm / 100, puntaje: ppcProm, peso: 0.25 },
    { clave: 'IPI', nombre: 'Productividad', valor: ipi, puntaje: Math.max(0, 100 - (1 - ipi) * 400), peso: 0.15 },
  ];
  const puntaje = indices.reduce((a, i) => a + i.puntaje * i.peso, 0);
  return { indices, puntaje };
})();

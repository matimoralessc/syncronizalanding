// Guiones de los cortos (16:9, 30 fps). Todo en cuadros.
//
// Las cifras de los textos salen de los datos de la obra: las 103 tareas de
// hormigón con ciclo van del 9-nov-2026 al 2-mar-2027 (3,7 meses: "casi
// cuatro"), y la toma de ciclos está en el día 178 del programa (semana del
// 18-ene-2027). Ojo: el soil nailing y el alcantarillado empiezan antes, pero
// no son obra gruesa y no cuentan para esa frase.
import fs from 'node:fs';

const datosHeroe = JSON.parse(fs.readFileSync(new URL('./heroe-datos.json', import.meta.url), 'utf8'));
const iso = (px) => `<img src="syncroniza-isotipo.png" style="height:${px}px;width:auto;vertical-align:middle" alt="">`;
const izq = (top) => ({ left: '128px', top: `${top}px`, maxWidth: '1600px' });

export const GUIONES = {
  'panoramica-4d': {
    cuadros: 870,
    clips: [
      { fuente: 'f/heroe', desde: 75, hasta: 495, inicio: 0, fundido: 20, fundidoSalida: 16 },
      { fuente: 'f/ciclos', desde: 480, hasta: 735, inicio: 0, fundido: 16, fundidoSalida: 24 },
    ],
    hud: { desde: 100, hasta: 495, entra: 16, sale: 14, datos: datosHeroe },
    capas: [
      // ── Título ─────────────────────────────────────────────────────────
      { desde: 0, hasta: 84, entra: 16, sale: 14, estilo: izq(360),
        html: `<div style="display:flex;align-items:center;gap:16px">${iso(40)}<span class="etiqueta">Syncroniza 4D · Obra Panorámica</span></div>` },
      { desde: 8, hasta: 84, entra: 20, sale: 14, estilo: izq(440),
        html: `<div class="titulo degradado">Casi cuatro meses de obra gruesa<br>en catorce segundos.</div>` },
      // ── El edificio ────────────────────────────────────────────────────
      { desde: 130, hasta: 265, estilo: izq(112),
        html: `<div class="etiqueta">Cada color, un ciclo</div><div class="leyenda" style="margin-top:16px">Cada color es un ciclo<br>de hormigonado.</div>` },
      { desde: 285, hasta: 430, estilo: izq(112),
        html: `<div class="etiqueta">El programa, sobre el modelo</div><div class="leyenda" style="margin-top:16px">Cada losa, muro y viga aparece<br>el día que el programa la hormigona.</div>` },
      // ── Ciclos ─────────────────────────────────────────────────────────
      { desde: 505, hasta: 715, estilo: izq(112),
        html: `<div class="etiqueta">Semana del 18 ene 2027</div><div class="leyenda" style="margin-top:16px">Elige una fecha y el modelo<br>muestra la obra de ese día.</div>` },
      // ── Cierre ─────────────────────────────────────────────────────────
      { desde: 735, hasta: 870, entra: 20, estilo: izq(300),
        html: `<div style="display:flex;align-items:center;gap:16px">${iso(40)}<span class="etiqueta">Syncroniza</span></div>
               <div class="titulo degradado" style="margin-top:40px">Mira tu obra<br>antes de construirla.</div>` },
      { desde: 750, hasta: 870, entra: 20, estilo: izq(640),
        html: `<div style="font-size:36px;font-weight:500">Agenda una demo: <span style="color:#37B6FF">contacto@syncroniza.cl</span></div>
               <div class="mono" style="margin-top:24px;font-size:20px;color:#6E6E6E">Grabado en el visor de Syncroniza 4D, con el programa real de la obra.</div>` },
    ],
  },

  // El producto tal cual: el visor con el programa a la vista mientras avanza
  // la fecha. Las leyendas van en vidrio abajo porque la interfaz ocupa todo el
  // cuadro y arriba está el Gantt, que es justamente lo que hay que mirar.
  'visor-4d': {
    cuadros: 660,
    clips: [
      { fuente: 'f/ui', desde: 60, hasta: 315, inicio: 0, ultimo: 239, fundido: 18, fundidoSalida: 16 },
      { fuente: 'f/ciclos', desde: 300, hasta: 525, inicio: 60, fundido: 16, fundidoSalida: 24 },
    ],
    capas: [
      { desde: 0, hasta: 72, entra: 16, sale: 14, estilo: izq(360),
        html: `<div style="display:flex;align-items:center;gap:16px">${iso(40)}<span class="etiqueta">Syncroniza 4D · El visor</span></div>` },
      { desde: 8, hasta: 72, entra: 20, sale: 14, estilo: izq(440),
        html: `<div class="titulo degradado">El programa y el modelo,<br>en la misma pantalla.</div>` },
      { desde: 90, hasta: 190, estilo: { left: '64px', bottom: '64px', maxWidth: '1100px' },
        html: `<div class="vidrio" style="padding:28px 36px"><div class="etiqueta">El deslizador es el calendario</div><div style="font-size:40px;line-height:1.2;font-weight:500;margin-top:12px">Mueves la fecha y el modelo muestra<br>lo que el programa dice que está hecho.</div></div>` },
      { desde: 200, hasta: 300, estilo: { left: '64px', bottom: '64px', maxWidth: '1100px' },
        html: `<div class="vidrio" style="padding:28px 36px"><div class="etiqueta">Un solo dato</div><div style="font-size:40px;line-height:1.2;font-weight:500;margin-top:12px">Las barras del Gantt y los colores del<br>modelo salen del mismo programa.</div></div>` },
      { desde: 325, hasta: 505, estilo: izq(112),
        html: `<div class="etiqueta">Semana del 18 ene 2027</div><div class="leyenda" style="margin-top:16px">Cada ciclo de hormigonado<br>con su color, sobre el modelo.</div>` },
      { desde: 525, hasta: 660, entra: 20, estilo: izq(300),
        html: `<div style="display:flex;align-items:center;gap:16px">${iso(40)}<span class="etiqueta">Syncroniza</span></div>
               <div class="titulo degradado" style="margin-top:40px">Mira tu obra<br>antes de construirla.</div>` },
      { desde: 540, hasta: 660, entra: 20, estilo: izq(640),
        html: `<div style="font-size:36px;font-weight:500">Agenda una demo: <span style="color:#37B6FF">contacto@syncroniza.cl</span></div>
               <div class="mono" style="margin-top:24px;font-size:20px;color:#6E6E6E">Grabado en el visor de Syncroniza 4D, con el programa real de la obra.</div>` },
    ],
  },
};

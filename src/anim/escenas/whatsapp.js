// Escena: el terreno reporta por WhatsApp y Syncroniza lo ordena.
//
// Un jefe de terreno le escribe al número de Syncroniza dos cosas que hoy el
// bot ya entiende: una restricción dicha como se habla ("no llegó el fierro
// del piso 13, lo ve Juan, para el jueves") y la foto de una guía de despacho,
// que la IA lee y la persona confirma. Los textos del bot son los de
// syncroniza-core-mvp (app/services/whatsapp_entrante.py y guia_hormigon.py).
// A la derecha, el panel recibe cada registro: la restricción entra al Last
// Planner y la guía suma sus m³ a la curva de hormigón. Las cifras empalman
// con la escena de hormigón (628 guías y 4.742 m³ al corte).
//
// Es HTML y no SVG (burbujas con texto que se corta solo), dibujado en un
// escenario de medidas fijas que se escala a la caja, igual que un viewBox.
import { OBRA } from '../datos/obra.js';
import { COLOR, limitar, tramo, fluido, num } from '../marca.js';
import { selloHTML, ISOTIPO } from '../sello.js';

const FORMATOS = { horizontal: { W: 1920, H: 1080 }, vertical: { W: 1080, H: 760 } };

// Guión: cuándo aparece cada mensaje (en progreso) y cuándo el bot "escribe".
const MENSAJES = [
  { de: 'yo', t: 0.06, hora: '08:12', texto: 'no llegó el fierro del piso 13, lo ve Juan, para el jueves' },
  { de: 'bot', t: 0.17, escribe: 0.11, hora: '08:12', texto: 'Entendí:\n\n📝 No llegó el fierro del piso 13\n👤 Juan Soto\n📅 15/10/2026\n\n¿Lo registro? «si» para guardar, «no» para corregir.' },
  { de: 'yo', t: 0.27, hora: '08:13', texto: 'si' },
  { de: 'bot', t: 0.34, escribe: 0.30, hora: '08:13', evento: 'restriccion', texto: `✅ *R-047* registrada en ${OBRA.nombre.replace('Edificio ', '')}\n\nNo llegó el fierro del piso 13\nResponsable: Juan Soto\nCompromiso: 15/10/2026\n\nAparece en el Last Planner de la semana.` },
  { de: 'yo', t: 0.46, hora: '11:40', foto: true },
  { de: 'bot', t: 0.58, escribe: 0.5, hora: '11:40', texto: 'Leí la guía 📄\n\nN° 48213 · Hormigones Andes\n7,5 m³ · H-30\n12/10/2026\nPiso 13 · Losa\n\n¿Está correcto? Responde *SÍ* para registrarla, o *NO* para descartarla.' },
  { de: 'yo', t: 0.7, hora: '11:41', texto: 'SÍ' },
  { de: 'bot', t: 0.77, escribe: 0.73, hora: '11:41', evento: 'guia', texto: '✅ Guía validada.\n\nN° 48213 · Hormigones Andes\n7,5 m³ · H-30' },
];
const T_RESTRICCION = 0.34, T_GUIA = 0.77;
const ANTES = { restricciones: 6, guias: 627, m3: 4734.5 }; // y después: 7, 628 y 4.742 (escena de hormigón)

// *negrita* de WhatsApp y saltos de línea.
const formatear = (t) => t.replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

// La guía de despacho "fotografiada": una guía electrónica chilena (el
// recuadro rojo con RUT, tipo y folio; la tabla; el timbre del SII) sobre una
// mesa, algo girada y con la luz cayendo de una esquina, como sale una foto
// tomada al lado del camión. Empresa, RUT y folio son inventados.
export const GUIA_SVG = (() => {
  const mono = "font-family='Geist Mono Variable, monospace'";
  const sans = "font-family='Geist Variable, sans-serif'";
  // Código de barras del timbre electrónico (PDF417): franjas fijas pseudoaleatorias.
  let barras = '';
  let x = 0, k = 7;
  while (x < 196) { k = (k * 37 + 11) % 97; const w = 1 + (k % 4); if (k % 3) barras += `<rect x='${(110 + x).toFixed(1)}' y='298' width='${w}' height='44' fill='#1b1b1b'/>`; x += w + 1; }
  return `
<svg viewBox='0 0 560 400' xmlns='http://www.w3.org/2000/svg'>
  <defs>
    <linearGradient id='mesa' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#3a4048'/><stop offset='1' stop-color='#15181c'/></linearGradient>
    <linearGradient id='luz' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.18'/><stop offset='.55' stop-color='#fff' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.16'/></linearGradient>
    <radialGradient id='vineta' cx='.45' cy='.4' r='.75'><stop offset='.6' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.45'/></radialGradient>
    <filter id='sombra' x='-10%' y='-10%' width='130%' height='130%'><feGaussianBlur stdDeviation='7'/></filter>
  </defs>
  <rect width='560' height='400' fill='url(#mesa)'/>
  <g transform='rotate(-3.2 280 200)'>
    <rect x='52' y='18' width='456' height='368' fill='#000' opacity='.55' filter='url(#sombra)' transform='translate(8 10)'/>
    <rect x='52' y='18' width='456' height='368' fill='#f7f7f3'/>
    <text x='72' y='48' fill='#1b1b1b' font-size='15' font-weight='700' ${sans}>HORMIGONES ANDES S.A.</text>
    <text x='72' y='64' fill='#555' font-size='9.5' ${sans}>Hormigón premezclado · Quilicura</text>
    <rect x='312' y='30' width='184' height='62' fill='none' stroke='#c8211b' stroke-width='2.2'/>
    <text x='404' y='48' fill='#c8211b' font-size='10.5' font-weight='700' text-anchor='middle' ${sans}>R.U.T.: 76.418.552-3</text>
    <text x='404' y='64' fill='#c8211b' font-size='9' font-weight='700' text-anchor='middle' ${sans}>GUÍA DE DESPACHO ELECTRÓNICA</text>
    <text x='404' y='83' fill='#c8211b' font-size='13' font-weight='700' text-anchor='middle' ${sans}>Nº 48213</text>
    <text x='404' y='105' fill='#c8211b' font-size='8.5' text-anchor='middle' ${sans}>S.I.I. - SANTIAGO NORTE</text>
    <g fill='#333' font-size='10' ${mono}>
      <text x='72' y='122'>OBRA     EDIFICIO VISTA CORDILLERA</text>
      <text x='72' y='138'>FECHA    12/10/2026   SALIDA PLANTA 10:58</text>
      <text x='72' y='154'>DESTINO  LOSA PISO 13 · CICLO 2</text>
    </g>
    <rect x='72' y='170' width='416' height='18' fill='#e3e3dd'/>
    <g fill='#333' font-size='9.5' font-weight='700' ${sans}>
      <text x='78' y='183'>CÓDIGO</text><text x='170' y='183'>DESCRIPCIÓN</text><text x='408' y='183'>CANT.</text><text x='452' y='183'>UNID.</text>
    </g>
    <g fill='#1b1b1b' font-size='10' ${mono}>
      <text x='78' y='206'>H30-90-20</text><text x='170' y='206'>HORMIGÓN H-30 (90) 20 10</text><text x='408' y='206'>7,5</text><text x='452' y='206'>M3</text>
      <text x='78' y='224'>SB-01</text><text x='170' y='224'>SERVICIO BOMBA PLUMA</text><text x='408' y='224'>1</text><text x='452' y='224'>SERV</text>
    </g>
    <line x1='72' y1='234' x2='488' y2='234' stroke='#cfcfc8'/>
    <text x='72' y='256' fill='#333' font-size='9.5' ${sans}>LLEGADA OBRA 11:32 · DESCARGA 11:36 a 11:58</text>
    <g>${barras}</g>
    <text x='208' y='356' fill='#555' font-size='8.5' text-anchor='middle' ${sans}>Timbre Electrónico SII · Res. 80 de 2014</text>
    <path d='M352 316 q12 -24 26 -6 t28 -5 t24 7 t20 -9' fill='none' stroke='#22479a' stroke-width='2.2' stroke-linecap='round'/>
    <line x1='344' y1='332' x2='482' y2='332' stroke='#999' stroke-width='1'/>
    <text x='413' y='348' fill='#666' font-size='9' text-anchor='middle' ${sans}>RECIBÍ CONFORME</text>
    <rect x='52' y='18' width='456' height='368' fill='url(#luz)'/>
  </g>
  <rect width='560' height='400' fill='url(#vineta)'/>
</svg>`;
})();

const CSS = `
.wa { position: absolute; transform-origin: 0 0; font-family: 'Geist Variable', system-ui, sans-serif; color: #e9edef; }
.wa .cab-eti { position: absolute; font: 500 20px 'Geist Mono Variable', monospace; letter-spacing: 4px; color: ${COLOR.acento}; }
.wa .cab-tit { position: absolute; font-size: 46px; font-weight: 600; letter-spacing: -0.8px; color: #fff; }
.wa .cab-sub { position: absolute; font-size: 24px; color: ${COLOR.texto3}; }
.wa .telefono { position: absolute; background: #0b141a; overflow: hidden; display: flex; flex-direction: column; }
.wa .horizontal-tel { border-radius: 52px; box-shadow: 0 0 0 10px #1b1b1b, 0 0 0 11px rgba(255,255,255,.12), 0 40px 120px rgba(0,0,0,.6); }
.wa .barra { display: flex; align-items: center; gap: .6em; background: #1f2c34; padding: .55em .9em; flex: none; }
.wa .avatar { width: 2.2em; height: 2.2em; border-radius: 50%; background: #10181f; display: grid; place-items: center; flex: none; }
.wa .avatar img { height: 1.35em; }
.wa .nombre { font-weight: 600; font-size: 1.02em; }
.wa .estado { font-size: .78em; color: #8696a0; margin-top: .1em; }
.wa .chat { position: relative; flex: 1; overflow: hidden; }
.wa .lista { position: absolute; left: 0; right: 0; top: 0; padding: .8em .8em 0; }
.wa .msj { display: flex; align-items: flex-start; overflow: hidden; }
.wa .msj.yo { justify-content: flex-end; }
.wa .burbuja { max-width: 82%; padding: .45em .65em .3em; margin-bottom: .45em; border-radius: .6em; line-height: 1.32; background: #202c33; position: relative; }
.wa .msj.yo .burbuja { background: #005c4b; }
.wa .burbuja b { font-weight: 650; }
.wa .hora { display: block; text-align: right; font-size: .66em; color: rgba(233,237,239,.6); margin-top: .2em; white-space: nowrap; }
.wa .hora .vistos { color: #53bdeb; margin-left: .3em; }
.wa .foto { padding: .25em .25em .3em; }
/* base.css saca de flujo todo SVG dentro de una escena (los gráficos llenan
   su caja); la foto de la guía tiene que volver al flujo para que la burbuja
   crezca con ella, si no el chat la recorta a una tira. */
.wa .foto svg { position: static; inset: auto; display: block; width: 100%; height: auto; aspect-ratio: 560 / 400; border-radius: .45em; }
.wa .escribiendo { display: inline-flex; gap: .3em; padding: .65em .8em; }
.wa .escribiendo i { width: .45em; height: .45em; border-radius: 50%; background: #8696a0; display: block; }
.wa .entrada { flex: none; display: flex; align-items: center; gap: .5em; padding: .5em .7em .9em; background: #0b141a; }
.wa .entrada .caja { flex: 1; background: #1f2c34; border-radius: 1.4em; padding: .55em .9em; color: #8696a0; font-size: .92em; }
.wa .entrada .mic { width: 2.3em; height: 2.3em; border-radius: 50%; background: #00a884; flex: none; }
.wa .tarjeta { position: absolute; box-sizing: border-box; overflow: hidden; border: 1px solid rgba(255,255,255,.09); background: #0e0e0e; border-radius: 24px; padding: 28px 32px; }
.wa .tarjeta .rot { font: 500 17px 'Geist Mono Variable', monospace; letter-spacing: 3px; color: ${COLOR.texto3}; }
.wa .tarjeta .grande { font: 500 56px 'Geist Mono Variable', monospace; color: #fff; }
.wa .tarjeta .chico { font: 400 20px 'Geist Mono Variable', monospace; color: ${COLOR.texto4}; }
.wa .fila { display: grid; align-items: center; border-top: 1px solid rgba(255,255,255,.07); font-size: 21px; color: ${COLOR.texto2}; position: relative; }
.wa .fila .cod { font-family: 'Geist Mono Variable', monospace; color: ${COLOR.acento}; }
.wa .fila .mono { font-family: 'Geist Mono Variable', monospace; color: ${COLOR.texto3}; font-size: 19px; }
.wa .fila .via { font: 500 14px 'Geist Mono Variable', monospace; letter-spacing: 2px; color: #00a884; border: 1px solid rgba(0,168,132,.5); border-radius: 999px; padding: 3px 9px; justify-self: end; }
.wa .fila .ok { color: ${COLOR.bien}; }
`;
let cssPuesto = false;

export default function crearWhatsapp(contenedor, opciones = {}) {
  const vertical = opciones.formato === 'vertical';
  const { W, H } = vertical ? FORMATOS.vertical : FORMATOS.horizontal;
  if (!cssPuesto) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssPuesto = true; }
  contenedor.classList.add('escena');
  const raiz = document.createElement('div');
  raiz.className = 'wa';
  raiz.style.width = `${W}px`;
  raiz.style.height = `${H}px`;
  contenedor.appendChild(raiz);

  // ── Cabecera (solo horizontal; en vertical la pone el marco) ────────────
  let cab = null;
  if (!vertical) {
    raiz.insertAdjacentHTML('beforeend', `
      <div style="position:absolute;left:170px;top:62px;font-size:26px">${selloHTML()}</div>
      <div class="cab" style="position:absolute;inset:0">
        <div class="cab-eti" style="left:170px;top:133px">WHATSAPP · REPORTE DESDE TERRENO</div>
        <div class="cab-tit" style="left:170px;top:168px">${OBRA.nombre}</div>
        <div class="cab-sub" style="left:170px;top:232px">Restricciones y guías de hormigón, sin abrir otra app</div>
      </div>`);
    cab = raiz.querySelector('.cab');
  }

  // ── Teléfono ────────────────────────────────────────────────────────────
  // Horizontal: un teléfono a la izquierda. Vertical: la pantalla del chat a
  // todo lo ancho, con letra de teléfono grande.
  const tel = document.createElement('div');
  tel.className = `telefono ${vertical ? '' : 'horizontal-tel'}`;
  Object.assign(tel.style, vertical
    ? { left: '64px', top: '0px', width: '952px', height: `${H}px`, fontSize: '27px', borderRadius: '28px' }
    : { left: '170px', top: '292px', width: '430px', height: '760px', fontSize: '18px' });
  tel.innerHTML = `
    <div class="barra"><div class="avatar"><img src="${ISOTIPO}" alt=""></div>
      <div><div class="nombre">Syncroniza</div><div class="estado">en línea</div></div></div>
    <div class="chat"><div class="lista"></div></div>
    <div class="entrada"><div class="caja">Mensaje</div><div class="mic"></div></div>`;
  raiz.appendChild(tel);
  const chat = tel.querySelector('.chat');
  const lista = tel.querySelector('.lista');

  // Burbujas y su indicador de "escribiendo…" (los del bot).
  const items = [];
  for (const m of MENSAJES) {
    if (m.escribe != null) {
      const n = document.createElement('div');
      n.className = 'msj bot';
      n.innerHTML = '<div class="burbuja escribiendo"><i></i><i></i><i></i></div>';
      lista.appendChild(n);
      items.push({ n, desde: m.escribe, hasta: m.t, puntos: [...n.querySelectorAll('i')] });
    }
    const n = document.createElement('div');
    n.className = `msj ${m.de}`;
    const hora = `<span class="hora">${m.hora}${m.de === 'yo' ? '<span class="vistos">✓✓</span>' : ''}</span>`;
    n.innerHTML = m.foto
      ? `<div class="burbuja foto" style="width:${vertical ? 560 : 290}px">${GUIA_SVG}${hora}</div>`
      : `<div class="burbuja">${formatear(m.texto)}${hora}</div>`;
    lista.appendChild(n);
    items.push({ n, desde: m.t, hasta: Infinity });
  }

  // ── Panel de Syncroniza (solo horizontal) ───────────────────────────────
  let panel = null;
  if (!vertical) {
    const X = 700, ANCHO = 1050;
    raiz.insertAdjacentHTML('beforeend', `
      <div class="tarjeta t-lp" style="left:${X}px;top:292px;width:${ANCHO}px;height:342px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div class="rot">LAST PLANNER · RESTRICCIONES ABIERTAS</div><div class="chico" style="margin-top:10px">semana del 12 oct 2026</div></div>
          <div class="grande" data-v="abiertas"></div>
        </div>
        <div class="filas-lp" style="position:absolute;left:32px;right:32px;top:118px"></div>
      </div>
      <div class="tarjeta t-hg" style="left:${X}px;top:664px;width:${ANCHO}px;height:388px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div class="rot">HORMIGÓN · GUÍAS DE DESPACHO</div><div class="chico" style="margin-top:10px"><span data-v="guias"></span> guías validadas</div></div>
          <div style="text-align:right"><div class="grande" data-v="m3" style="color:${COLOR.acento}"></div><div class="chico">m³ colocados</div></div>
        </div>
        <div class="filas-hg" style="position:absolute;left:32px;right:32px;top:148px"></div>
      </div>`);
    const fila = (cols, html) => `<div class="fila" style="grid-template-columns:${cols};height:52px">${html}</div>`;
    const colsLp = '110px 1fr 170px 130px 150px';
    const restr = [
      ['R-047', 'No llegó el fierro del piso 13', 'Juan Soto', '15/10', true],
      ['R-046', 'Grúa en mantención el jueves', 'P. Rojas', '15/10'],
      ['R-045', 'Planos de instalaciones sanitarias', 'Oficina técnica', '16/10'],
      ['R-044', 'Moldaje losa piso 12', 'M. Díaz', '14/10'],
    ];
    const colsHg = '150px 1fr 120px 110px 150px';
    const guias = [
      ['48213', 'Hormigones Andes · losa piso 13', '7,5 m³', 'H-30', true],
      ['48212', 'Hormigones Andes · losa piso 13', '7,5 m³', 'H-30'],
      ['48207', 'Hormigones Andes · muros piso 13', '7,0 m³', 'H-30'],
      ['48199', 'Hormigones Andes · losa piso 12', '7,5 m³', 'H-30'],
    ];
    raiz.querySelector('.filas-lp').innerHTML = restr.map(([c, d, r, f, nuevo]) => fila(colsLp,
      `<span class="cod">${c}</span><span>${d}</span><span>${r}</span><span class="mono">vence ${f}</span>${nuevo ? '<span class="via">WHATSAPP</span>' : '<span></span>'}`)).join('');
    raiz.querySelector('.filas-hg').innerHTML = guias.map(([n, d, m3, g, nuevo]) => fila(colsHg,
      `<span class="cod">N° ${n}</span><span>${d}</span><span class="mono">${m3}</span><span class="mono">${g}</span>${nuevo ? '<span class="via">WHATSAPP</span>' : '<span class="ok mono" style="justify-self:end">✓ validada</span>'}`)).join('');
    const filasLp = [...raiz.querySelectorAll('.filas-lp .fila')];
    const filasHg = [...raiz.querySelectorAll('.filas-hg .fila')];
    panel = {
      lp: raiz.querySelector('.t-lp'), hg: raiz.querySelector('.t-hg'),
      abiertas: raiz.querySelector('[data-v="abiertas"]'), guias: raiz.querySelector('[data-v="guias"]'), m3: raiz.querySelector('[data-v="m3"]'),
      nuevaLp: filasLp[0], viejasLp: filasLp.slice(1), nuevaHg: filasHg[0], viejasHg: filasHg.slice(1),
    };
  }

  // Cada envoltorio crece de 0 a la altura natural de su burbuja cuando el
  // mensaje entra (y el "escribiendo…" se encoge al irse): la lista se
  // reacomoda sin saltos y sube como un chat de verdad. La altura se lee en
  // cada cuadro y no una vez al crear la escena: los emojis y la foto de la
  // guía terminan de cargar después y cambian dónde se corta el texto.
  const aire = parseFloat(getComputedStyle(items[0].n.firstElementChild).marginBottom);
  const relleno = parseFloat(getComputedStyle(lista).paddingTop);

  function redimensionar(w = contenedor.clientWidth, h = contenedor.clientHeight) {
    const s = Math.min(w / W, h / H);
    raiz.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`;
  }

  let ultimos = { kpis: [] };

  function fijarProgreso(p) {
    if (cab) cab.style.opacity = fluido(tramo(p, 0, 0.06));
    tel.style.opacity = fluido(tramo(p, 0, 0.05));
    tel.style.transform = `translateY(${(1 - fluido(tramo(p, 0, 0.06))) * 30}px)`;

    // Mensajes: cada uno entra en 0,025 de progreso; el "escribiendo…" se
    // muestra entre su inicio y la llegada del mensaje.
    let alto = 0;
    items.forEach((it) => {
      const entra = fluido(tramo(p, it.desde, it.desde + 0.025));
      const sale = it.hasta === Infinity ? 0 : fluido(tramo(p, it.hasta - 0.012, it.hasta));
      const u = entra * (1 - sale);
      const natural = it.n.firstElementChild.offsetHeight + aire;
      it.n.style.opacity = u;
      it.n.style.height = `${natural * u}px`;
      alto += natural * u;
      if (it.puntos) it.puntos.forEach((d, k) => { d.style.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p * 220 - k * 1.1)); });
    });
    const visible = chat.clientHeight;
    lista.style.transform = `translateY(${-Math.max(0, relleno + alto + 4 - visible)}px)`;

    // Efectos en Syncroniza.
    const uR = fluido(tramo(p, T_RESTRICCION + 0.01, T_RESTRICCION + 0.05));
    const uG = fluido(tramo(p, T_GUIA + 0.01, T_GUIA + 0.06));
    const abiertas = ANTES.restricciones + (uR > 0.5 ? 1 : 0);
    const guias = ANTES.guias + (uG > 0.5 ? 1 : 0);
    const m3 = ANTES.m3 + 7.5 * uG;
    if (panel) {
      const uPanel = fluido(tramo(p, 0.03, 0.09));
      panel.lp.style.opacity = panel.hg.style.opacity = uPanel;
      panel.abiertas.textContent = String(abiertas);
      panel.guias.textContent = num(guias);
      panel.m3.textContent = num(m3, 1);
      // La fila nueva entra arriba y empuja a las otras; brilla un rato.
      for (const [nueva, viejas, u, t0] of [[panel.nuevaLp, panel.viejasLp, uR, T_RESTRICCION], [panel.nuevaHg, panel.viejasHg, uG, T_GUIA]]) {
        nueva.style.opacity = u;
        nueva.style.transform = `translateX(${(1 - u) * 40}px)`;
        viejas.forEach((f) => { f.style.transform = `translateY(${(u - 1) * 52}px)`; });
        const brillo = u * (1 - fluido(tramo(p, t0 + 0.08, t0 + 0.2)));
        nueva.style.background = `rgba(55,182,255,${0.12 * brillo})`;
      }
      panel.lp.style.borderColor = `rgba(55,182,255,${0.09 + 0.5 * uR * (1 - fluido(tramo(p, T_RESTRICCION + 0.08, T_RESTRICCION + 0.2)))})`;
      panel.hg.style.borderColor = `rgba(55,182,255,${0.09 + 0.5 * uG * (1 - fluido(tramo(p, T_GUIA + 0.08, T_GUIA + 0.2)))})`;
    }

    ultimos = {
      u: fluido(tramo(p, 0.03, 0.09)),
      kpis: [
        { rotulo: 'Restricciones abiertas', valor: String(abiertas), color: uR > 0 && uR < 1 ? COLOR.acento : COLOR.texto },
        { rotulo: 'Guías validadas', valor: num(guias) },
        { rotulo: 'm³ colocados', valor: num(m3, 1), color: COLOR.acento },
      ],
      nota: { texto: 'Lo que llega por WhatsApp queda en el Last Planner y en la curva de hormigón.', color: COLOR.texto2, u: fluido(tramo(p, 0.86, 0.94)) },
    };
  }

  return { fijarProgreso, redimensionar, destruir() { contenedor.innerHTML = ''; }, indicadores: () => ultimos, nombre: 'whatsapp' };
}

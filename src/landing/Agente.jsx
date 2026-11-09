import { useEffect, useRef, useState } from 'react';
import Revelar from './Revelar.jsx';
import { OBRA, EVM, FAMILIAS, planPct, fechaDeSemana } from '../anim/datos/obra.js';
import { num, fechaCorta } from '../anim/marca.js';

// El agente Syncroniza (9-nov-2026, Matías: «no estamos incluyendo una
// herramienta muy buena, el agente Syncroniza, eso vende mucho»). Un chat como
// el de WhatsApp donde quien visita toca una pregunta —o la escribe— y el
// agente responde. Las respuestas salen de los mismos datos de ejemplo que los
// gráficos de la suite (anim/datos/obra.js), así la página no se contradice.
// Se llama «el agente Syncroniza», nunca «capataz».

const pts = (v) => num(v, 1);
const brecha = EVM.planCorte - EVM.realCorte;
// Semanas de atraso: cuánto antes el programado iba en el % real de hoy.
const semanasAtraso = (() => {
  let w = OBRA.corte;
  while (w > 0 && planPct(w) > EVM.realCorte) w -= 0.05;
  return OBRA.corte - w;
})();
const peorFamilia = FAMILIAS
  .map((f) => ({ ...f, uso: (100 * f.gastado) / f.presupuesto }))
  .sort((a, b) => (b.uso - EVM.realCorte) - (a.uso - EVM.realCorte))[0];
const corte = fechaCorta(fechaDeSemana(OBRA.corte));

const RESPUESTAS = [
  {
    pregunta: '¿Cómo va el avance de la obra?',
    claves: ['avance', 'atras', 'curva', 'spi', 'plazo', 'va la obra', 'como vamos'],
    respuesta: `Al corte del ${corte} vamos en *${pts(EVM.realCorte)} %* contra ${pts(EVM.planCorte)} % programado: ${pts(brecha)} puntos abajo, unas *${num(semanasAtraso, 1)} semanas de atraso* (SPI ${num(EVM.spi, 2)}).\n\nLo que más pesa es la obra gruesa de la torre, que se corrió con las lluvias de invierno.`,
  },
  {
    pregunta: '¿Qué familia de costos está más complicada?',
    claves: ['costo', 'familia', 'gasto', 'presupuesto', 'plata', 'cpi', 'complicad'],
    respuesta: `*${peorFamilia.nombre}*: lleva ${pts(peorFamilia.uso)} % de su presupuesto gastado con ${pts(EVM.realCorte)} % de avance de la obra. Va gastando más rápido de lo que avanza.\n\nEl CPI de la obra está en ${num(EVM.cpi, 2)}.`,
  },
  {
    pregunta: '¿Cuánto le hemos facturado a Hormigones Andes?',
    claves: ['factur', 'pag', 'proveedor', 'hormigones andes', 'iconstruye'],
    respuesta: 'A *Hormigones Andes* van 38 facturas por *$412.684.300* neto. Pagadas 31; por pagar *$58.920.000*, la más antigua de hace 34 días.\n\nEl detalle por factura está en Costos → Maestro de proveedores.',
  },
  {
    pregunta: '¿Cuántos m³ necesito para el lunes?',
    claves: ['m3', 'm³', 'hormig', 'lunes', 'cubic', 'losa'],
    respuesta: 'Para el lunes hay planificados *84,6 m³* en el 4D: losa del piso 14, sectores 1 y 2 (H-30).\n\nPide 12 camiones de 7,5 m³ con margen de una guía.',
  },
  {
    pregunta: '¿Qué restricciones vencen esta semana?',
    claves: ['restric', 'vence', 'compromiso', 'last planner', 'pendiente', 'ppc'],
    respuesta: 'Vencen 3 esta semana:\n\n• *R-044* Moldaje losa piso 12 · M. Díaz · 14/10\n• *R-047* No llegó el fierro del piso 13 · Juan Soto · 15/10\n• *R-046* Grúa en mantención el jueves · P. Rojas · 15/10',
  },
  {
    pregunta: '¿Quién validó la última guía?',
    claves: ['quien', 'quién', 'valid', 'ultima', 'última', 'guia', 'guía'],
    respuesta: 'La guía *N° 48213* de Hormigones Andes (7,5 m³ H-30, losa piso 13) la validó *Claudio Reyes* hoy a las 11:41, desde el WhatsApp.',
  },
];
const NO_SE = 'Eso te lo muestro con los datos de tu obra en la demo 🙂\n\nPrueba con una de las preguntas de abajo.';

function responder(texto) {
  const t = texto.toLowerCase();
  let mejor = null, puntos = 0;
  for (const r of RESPUESTAS) {
    const n = r.claves.filter((c) => t.includes(c)).length;
    if (n > puntos) { mejor = r; puntos = n; }
  }
  return mejor ? mejor.respuesta : NO_SE;
}

// *negrita* de WhatsApp y saltos de línea.
function Texto({ t }) {
  return t.split('\n').map((linea, i) => (
    <span key={i} className="block min-h-[0.6em]">
      {linea.split(/(\*[^*]+\*)/g).map((x, j) => (x.startsWith('*') && x.endsWith('*') ? <b key={j}>{x.slice(1, -1)}</b> : x))}
    </span>
  ));
}

const hora = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export default function Agente() {
  const [mensajes, setMensajes] = useState([
    { de: 'bot', t: `Hola 👋 Soy el agente Syncroniza de *${OBRA.nombre}*. Pregúntame lo que quieras de la obra.`, h: '08:00' },
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [entrada, setEntrada] = useState('');
  const lista = useRef(null);
  const usadas = new Set(mensajes.filter((m) => m.de === 'yo').map((m) => m.t));

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' });
  }, [mensajes, escribiendo]);

  function preguntar(texto) {
    const limpio = texto.trim();
    if (!limpio || escribiendo) return;
    setMensajes((m) => [...m, { de: 'yo', t: limpio, h: hora() }]);
    setEntrada('');
    setEscribiendo(true);
    const r = RESPUESTAS.find((x) => x.pregunta === limpio)?.respuesta ?? responder(limpio);
    setTimeout(() => {
      setEscribiendo(false);
      setMensajes((m) => [...m, { de: 'bot', t: r, h: hora() }]);
    }, 900 + Math.min(1400, r.length * 6));
  }

  return (
    <section id="agente" aria-label="El agente Syncroniza" className="border-t border-white/10 bg-negro">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-12 sm:py-28 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6">
          <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">El agente Syncroniza</Revelar>
          <Revelar as="h2" retraso={80} className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Pregúntale lo que quieras de tu obra.
          </Revelar>
          <Revelar as="p" retraso={140} className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">
            Por WhatsApp o en la web. Conoce el programa, el avance, los costos, las guías y las restricciones,
            y responde al tiro con las cifras de la obra. Pruébalo aquí al lado.
          </Revelar>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ['Sabe de todos los frentes', 'Avance, costos, hormigón, Last Planner y el 4D, en una sola conversación.'],
              ['Sabe quién hizo qué', 'Quién validó una guía, quién levantó una restricción, cuántas facturas entraron.'],
              ['Respeta los permisos', 'Cada persona ve lo que le corresponde: el capataz no ve los costos si no debe.'],
              ['En el WhatsApp de siempre', 'Sin instalar nada. Por el mismo número se mandan guías y restricciones.'],
            ].map(([t, d], i) => (
              <Revelar as="li" key={t} retraso={180 + i * 60} className="border-t border-white/10 pt-4">
                <p className="text-[15.5px] font-semibold">{t}</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-white/55">{d}</p>
              </Revelar>
            ))}
          </ul>
        </div>

        {/* El chat */}
        <div className="min-w-0 lg:col-span-6">
          <div className="mx-auto flex h-[600px] max-w-[440px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#0b141a] shadow-2xl">
            <div className="flex items-center gap-3 bg-[#1f2c33] px-4 py-3">
              <img src="/agente-syncroniza.webp" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">Agente Syncroniza</p>
                <p className="text-[12px] text-[#8696a0]">{escribiendo ? 'escribiendo…' : 'en línea'}</p>
              </div>
            </div>
            <div ref={lista} className="flex-1 space-y-2 overflow-y-auto px-3 py-4" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.de === 'yo' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[14px] leading-snug ${m.de === 'yo' ? 'rounded-tr-none bg-[#005c4b]' : 'rounded-tl-none bg-[#1f2c33]'}`}>
                    <Texto t={m.t} />
                    <span className="mt-1 block text-right text-[10.5px] text-white/45">{m.h}</span>
                  </div>
                </div>
              ))}
              {escribiendo && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-lg rounded-tl-none bg-[#1f2c33] px-3 py-3">
                    {[0, 1, 2].map((k) => <i key={k} className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: `${k * 0.15}s` }} />)}
                  </div>
                </div>
              )}
            </div>
            <div className="sin-barra flex gap-2 overflow-x-auto bg-[#0b141a] px-3 pb-2 pt-1">
              {RESPUESTAS.filter((r) => !usadas.has(r.pregunta)).map((r) => (
                <button key={r.pregunta} type="button" onClick={() => preguntar(r.pregunta)} disabled={escribiendo}
                  className="shrink-0 rounded-full border border-[#00a884]/50 px-3 py-1.5 text-[12.5px] text-[#25d366] transition hover:bg-[#00a884]/15 disabled:opacity-50">
                  {r.pregunta}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); preguntar(entrada); }} className="flex items-center gap-2 bg-[#1f2c33] px-3 py-2.5">
              <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Escribe una pregunta…" aria-label="Pregunta para el agente"
                className="min-w-0 flex-1 rounded-full bg-[#2a3942] px-4 py-2.5 text-[16px] text-white placeholder:text-[#8696a0] focus:outline-none sm:text-[14px]" />
              <button type="submit" aria-label="Enviar" disabled={!entrada.trim() || escribiendo}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-[16px] text-white disabled:opacity-40">➤</button>
            </form>
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Obra y datos de ejemplo</p>
        </div>
      </div>
    </section>
  );
}

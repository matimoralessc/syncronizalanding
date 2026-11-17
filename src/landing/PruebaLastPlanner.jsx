import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, Lock, MessageCircle, RotateCcw, CircleDashed, X } from 'lucide-react';
import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';

// «Pruébalo tú» del Last Planner (16-nov-2026, Matías: «esto [la simulación
// 4D] necesitamos cambiarlo por algo del last planner»). El 4D ya está en el
// héroe y en sus herramientas, y el chat de WhatsApp en la sección del agente;
// acá el protagonista es el tablero de la semana: quien visita registra lo que
// llega de terreno, libera las restricciones y cierra la semana para ver su
// PPC y las causas de no cumplimiento. Los tipos y las causas son los de la
// plataforma (restricciones_lp.TIPOS y lastplanner.CAUSAS_CNC del MVP). La
// obra y las personas son de ejemplo, como en Syncroniza CO («Obra Demo»).
//
// Segunda vuelta (16-nov, Matías: «no sé si es lo más indicado para mostrar de
// primeras, quizás el video ayudaría y un botoncito que te lleve a la
// interacción»): primero la animación promocional del Last Planner (la escena
// 10 de syncroniza-animaciones, PPC de 16 semanas y causas de no
// cumplimiento) y el simulador se abre con «Probar».

// Las 10 actividades comprometidas para la semana del lunes 23-nov.
// `r`: restricción ya registrada; `wsp`: la que está por llegar de terreno;
// `cnc`: por qué no se cumple si la semana parte con ella abierta.
const ACTIVIDADES = [
  { id: 'a1', nombre: 'Moldaje muros subterráneo', wsp: 'w1', cnc: 'Falta de material' },
  { id: 'a2', nombre: 'Hormigonado losa piso 4', wsp: 'w3', cnc: 'Rechazo de calidad' },
  { id: 'a3', nombre: 'Tabiquería piso 2', wsp: 'w2', cnc: 'Falta de mano de obra' },
  { id: 'a4', nombre: 'Moldaje escalera piso 3', r: 'R-011', cnc: 'Falta de información o planos' },
  { id: 'a5', nombre: 'Enfierradura muros piso 5', r: 'R-012', cnc: 'Falta de material' },
  { id: 'a6', nombre: 'Descimbre losa piso 3' },
  { id: 'a7', nombre: 'Trazado piso 5' },
  { id: 'a8', nombre: 'Ventanas piso 1' },
  // La que se cae igual: no todo depende de las restricciones.
  { id: 'a9', nombre: 'Impermeabilización de jardineras', clima: true },
  { id: 'a10', nombre: 'Retiro de escombros piso 2' },
];

const INICIALES = [
  { id: 'R-011', act: 'a4', que: 'Planos de escalera rev. C sin aprobar', tipo: 'Diseño / información', resp: 'Ana Rojas', vence: 'mié 18/11' },
  { id: 'R-012', act: 'a5', que: 'Fierro de muros piso 5 sin despacho confirmado', tipo: 'Materiales', resp: 'Marcela Vidal', vence: 'jue 19/11' },
];

// Lo que escribe la obra por WhatsApp y lo que el agente entiende.
const ENTRANTES = [
  { id: 'w1', act: 'a1', de: 'Jefe de terreno', msg: 'Falta el moldaje de los muros del subterráneo, lo ve Juan Soto, para el jueves',
    que: 'Falta el moldaje de los muros del subterráneo', tipo: 'Materiales', resp: 'Juan Soto', vence: 'jue 19/11' },
  { id: 'w2', act: 'a3', de: 'Capataz', msg: 'No ha llegado la cuadrilla de tabiques del piso 2, lo ve Carla Muñoz, para el viernes',
    que: 'Sin cuadrilla de tabiques en el piso 2', tipo: 'Mano de obra', resp: 'Carla Muñoz', vence: 'vie 20/11' },
  { id: 'w3', act: 'a2', de: 'Jefe de obra', msg: 'Falta la aprobación de la ITO para hormigonar la losa del piso 4, lo ve Diego Fuentes, para el miércoles',
    que: 'Falta aprobación ITO de la losa del piso 4', tipo: 'Calidad / aprobación ITO', resp: 'Diego Fuentes', vence: 'mié 18/11' },
];

const HISTORIA = [['S44', 64], ['S45', 70], ['S46', 72]];

const inicial = () => ({
  restr: INICIALES.map((r) => ({ ...r, liberada: false })),
  pendientes: ENTRANTES.map((w) => w.id),
  cerrada: null,
  nueva: null,
});

export default function PruebaLastPlanner() {
  const [s, setS] = useState(inicial);
  const siguiente = useRef(13);
  const destello = useRef(null);
  const tablero = useRef(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => () => clearTimeout(destello.current), []);

  const estadoDe = (a) => {
    const r = s.restr.find((x) => x.act === a.id);
    if (r) return r.liberada ? { k: 'lista' } : { k: 'restringida', r };
    if (a.wsp) return { k: 'revisar' };
    return { k: 'lista' };
  };
  const listas = ACTIVIDADES.filter((a) => estadoDe(a).k === 'lista').length;
  const abiertas = s.restr.filter((r) => !r.liberada).length;

  function marcar(id) {
    clearTimeout(destello.current);
    destello.current = setTimeout(() => setS((x) => ({ ...x, nueva: null })), 1600);
    return id;
  }

  function registrar(w) {
    const id = `R-0${siguiente.current++}`;
    setS((x) => ({
      ...x,
      pendientes: x.pendientes.filter((p) => p !== w.id),
      restr: [...x.restr, { id, act: w.act, que: w.que, tipo: w.tipo, resp: w.resp, vence: w.vence, liberada: false }],
      nueva: marcar(id),
    }));
  }
  function liberar(id) {
    setS((x) => ({ ...x, restr: x.restr.map((r) => (r.id === id ? { ...r, liberada: true } : r)), nueva: marcar(id) }));
  }
  function cerrar() {
    const fallas = [];
    ACTIVIDADES.forEach((a) => {
      const e = estadoDe(a);
      if (e.k !== 'lista') fallas.push(a.cnc);
      else if (a.clima) fallas.push('Condiciones climáticas');
    });
    const ppc = Math.round((100 * (ACTIVIDADES.length - fallas.length)) / ACTIVIDADES.length);
    const causas = Object.entries(fallas.reduce((m, c) => ({ ...m, [c]: (m[c] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
    setS((x) => ({ ...x, cerrada: { ppc, cumplidas: ACTIVIDADES.length - fallas.length, causas } }));
  }
  const reiniciar = () => { siguiente.current = 13; setS(inicial()); };

  const ppcProy = Math.round((100 * listas) / ACTIVIDADES.length);
  const barras = [...HISTORIA, ['S47', s.cerrada ? s.cerrada.ppc : null]];

  function abrir() {
    setAbierto(true);
    requestAnimationFrame(() => tablero.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return (
    <section id="last-planner-demo" aria-label="Last Planner" className="bg-negro">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-12 sm:pt-32 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Last Planner System</Revelar>
          <Revelar as="h2" retraso={80} className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            El plan de la semana, cumplido o explicado.
          </Revelar>
          <Revelar as="p" retraso={140} className="mt-5 text-lg leading-relaxed text-white/60">
            PPC semana a semana contra la meta y las causas de no cumplimiento de toda la obra. Las restricciones se
            registran desde la plataforma o por WhatsApp, con responsable y fecha de compromiso.
          </Revelar>
          <Revelar retraso={200}>
            <button type="button" onClick={abierto ? () => setAbierto(false) : abrir} aria-expanded={abierto} aria-controls="lp-simulador"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-black transition hover:bg-white/85">
              {abierto ? <><X size={17} strokeWidth={2.4} />Cerrar el simulador</> : <>Probar<ArrowDown size={17} strokeWidth={2.4} /></>}
            </button>
            {!abierto && <p className="mt-3 text-[13.5px] text-white/45">Prepare una semana y vea su PPC. Toma un minuto.</p>}
          </Revelar>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <Reproductor escena="last-planner" segundos={9} />
        </div>
      </div>

      <div id="lp-simulador" ref={tablero} className="mx-auto max-w-7xl scroll-mt-24 px-3 pb-24 sm:px-12">
        {abierto && (<>
        <div className="mb-5 px-2 sm:px-0">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Simulación</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Prepare la semana antes de que empiece.</p>
          <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-white/60">
            Registre lo que llega de terreno, libere las restricciones y cierre la semana para ver su PPC y las causas de no cumplimiento.
          </p>
        </div>
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-black lg:grid-cols-12">

          {/* Entrante de terreno */}
          <div className="min-w-0 border-b border-white/10 p-4 sm:p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">Llega de terreno</p>
              <span className="flex items-center gap-1.5 text-[11.5px] text-[#25d366]"><MessageCircle size={13} strokeWidth={2.2} />WhatsApp</span>
            </div>
            <div className="mt-3 space-y-3">
              {ENTRANTES.filter((w) => s.pendientes.includes(w.id)).map((w) => (
                <div key={w.id} className="rounded-xl border border-white/10 bg-[#0b141a] p-3">
                  <p className="text-[11.5px] text-white/45">{w.de}</p>
                  <p className="mt-1 rounded-lg rounded-tl-none bg-[#1f2c33] px-3 py-2 text-[14px] leading-snug">{w.msg}</p>
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-white/55">
                    <span>{w.tipo}</span><span>· {w.resp}</span><span>· {w.vence}</span>
                  </div>
                  <button type="button" onClick={() => registrar(w)} disabled={!!s.cerrada}
                    className="mt-3 w-full rounded-lg bg-white py-2 text-[13.5px] font-semibold text-black transition hover:bg-white/85 disabled:opacity-40">
                    Registrar restricción
                  </button>
                </div>
              ))}
              {s.pendientes.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/15 p-4 text-[13.5px] leading-relaxed text-white/55">
                  Todo lo de terreno quedó registrado, con responsable y compromiso. El agente Syncroniza les avisa por
                  WhatsApp antes del vencimiento.
                </p>
              )}
            </div>

            {/* Restricciones abiertas */}
            <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">Restricciones · {abiertas} abiertas</p>
            <ul className="mt-3 space-y-2">
              {s.restr.map((r) => (
                <li key={r.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-500 ${s.nueva === r.id ? 'border-iso-sky/70 bg-iso-sky/10' : 'border-white/10'}`}>
                  <div className="min-w-0 flex-1">
                    <p className={`line-clamp-2 text-[13.5px] leading-snug ${r.liberada ? 'text-white/40 line-through' : ''}`}><span className="font-mono text-white/45">{r.id}</span> {r.que}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-white/45">{r.tipo} · {r.resp} · {r.vence}</p>
                  </div>
                  {r.liberada
                    ? <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#22c55e]"><Check size={14} strokeWidth={2.6} />Liberada</span>
                    : (
                      <button type="button" onClick={() => liberar(r.id)} disabled={!!s.cerrada}
                        className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-[12.5px] font-semibold transition hover:border-white/50 disabled:opacity-40">
                        Liberar
                      </button>
                    )}
                </li>
              ))}
            </ul>
          </div>

          {/* El tablero de la semana */}
          <div className="min-w-0 p-4 sm:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-iso-sky">Edificio Vista Cordillera</p>
                <p className="mt-1 text-xl font-semibold">Semana del 23 nov</p>
              </div>
              <div className="flex gap-6">
                <Dato rotulo="Listas" valor={`${listas} de ${ACTIVIDADES.length}`} />
                <Dato rotulo={s.cerrada ? 'PPC' : 'PPC proyectado'} valor={`${s.cerrada ? s.cerrada.ppc : ppcProy} %`}
                  color={(s.cerrada ? s.cerrada.ppc : ppcProy) >= 80 ? 'text-[#22c55e]' : 'text-white'} />
              </div>
            </div>

            {!s.cerrada ? (
              <>
                <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {ACTIVIDADES.map((a) => {
                    const e = estadoDe(a);
                    return (
                      <li key={a.id} className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5">
                        <Estado k={e.k} />
                        <span className="min-w-0 flex-1 truncate text-[13.5px]">{a.nombre}</span>
                        {e.k === 'restringida' && <span className="shrink-0 font-mono text-[11px] text-[#ECC94B]">{e.r.id}</span>}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-white/55">
                  <span className="flex items-center gap-1.5"><Estado k="lista" />Lista</span>
                  <span className="flex items-center gap-1.5"><Estado k="restringida" />Con restricción</span>
                  <span className="flex items-center gap-1.5"><Estado k="revisar" />Sin revisar</span>
                </div>
                <button type="button" onClick={cerrar}
                  className="mt-5 w-full rounded-full bg-white py-3 text-[14.5px] font-semibold text-black transition hover:bg-white/85">
                  Cerrar la semana
                </button>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-[15px] leading-relaxed text-white/70">
                  Se cumplieron <b className="text-white">{s.cerrada.cumplidas} de {ACTIVIDADES.length}</b> compromisos.
                  {s.cerrada.ppc >= 90 ? ' Lo que no se cumplió no dependía de la obra.' : ' Cada restricción que partió abierta se transformó en un compromiso fallado.'}
                </p>
                <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">Causas de no cumplimiento</p>
                <ul className="mt-2 space-y-1.5">
                  {s.cerrada.causas.map(([c, n]) => (
                    <li key={c} className="flex items-center gap-3 text-[13.5px]">
                      <span className="h-2 rounded-full bg-[#E53E3E]" style={{ width: `${n * 28}px` }} />
                      <span className="text-white/75">{c}</span><span className="font-mono text-white/45">{n}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={reiniciar}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13.5px] font-semibold transition hover:border-white/50">
                  <RotateCcw size={14} strokeWidth={2.2} />Volver a intentar
                </button>
              </div>
            )}

            {/* PPC de las últimas semanas */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">PPC por semana</p>
              <div className="mt-3 flex h-28 items-end gap-3">
                {barras.map(([sem, v]) => (
                  <div key={sem} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="font-mono text-[12px] text-white/70">{v == null ? '—' : `${v} %`}</span>
                    <div className={`w-full max-w-[56px] rounded-t transition-all duration-700 ${v == null ? 'border border-dashed border-white/20' : sem === 'S47' ? 'bg-iso-sky' : 'bg-white/25'}`}
                      style={{ height: v == null ? '12%' : `${v * 0.8}%` }} />
                    <span className="font-mono text-[10.5px] text-white/45">{sem}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Obra y datos de ejemplo</p>
        </>)}
      </div>
    </section>
  );
}

function Estado({ k }) {
  if (k === 'lista') return <Check size={15} strokeWidth={2.6} className="shrink-0 text-[#22c55e]" aria-label="Lista" />;
  if (k === 'restringida') return <Lock size={14} strokeWidth={2.2} className="shrink-0 text-[#ECC94B]" aria-label="Con restricción" />;
  return <CircleDashed size={15} strokeWidth={2} className="shrink-0 text-white/40" aria-label="Sin revisar" />;
}

function Dato({ rotulo, valor, color = 'text-white' }) {
  return (
    <div className="min-w-0 text-right">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{rotulo}</p>
      <p className={`mt-0.5 whitespace-nowrap font-mono text-[17px] ${color}`}>{valor}</p>
    </div>
  );
}

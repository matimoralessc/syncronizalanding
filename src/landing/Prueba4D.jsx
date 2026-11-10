import { useCallback, useEffect, useRef, useState } from 'react';
import Revelar from './Revelar.jsx';
import { crearObra3D } from '../anim/motor/obra3d.js';
import { construirTorre } from '../anim/datos/torre.js';
import { fechaDeSemana } from '../anim/datos/obra.js';
import { nivelLegible } from '../anim/escenas/torre.js';
import { COLOR, CICLOS, fechaCorta, limitar, num } from '../anim/marca.js';
import '../anim/anim.css';

// «Pruébalo tú» (9-nov-2026, Matías: «un módulo más interactivo, donde se
// pueda manipular el 4D, hacer cosas»). La torre de ejemplo de las escenas,
// pero manejada por quien la mira: girarla, acercarla, mover la semana, ver el
// avance real contra el plan y tocar un piso para ver su ficha. Es el mismo
// motor (anim/motor/obra3d.js) con la cámara y el progreso en manos de React.

const SEMANA_INI = 1;
const SEMANA_FIN = 47;
const semanaDe = (p) => SEMANA_INI + (SEMANA_FIN - SEMANA_INI) * limitar(p);

// El «real» de ejemplo: dos sectores se atrasan a mitad de obra (el 3 en la
// torre alta, el 4 hacia el final). Determinista, para que la historia sea
// siempre la misma: casi todo a tiempo y un frente que se queda.
function atrasoDe(e) {
  if (e.sector === 2 && e.fin > 24) return 1.8;
  if (e.sector === 3 && e.fin > 33) return 0.9;
  return 0;
}
const VERDE = '#22c55e';
const AMBAR = '#ECC94B';
const ROJO = '#E53E3E';

function estadoReal(e, w) {
  const fin = e.fin + atrasoDe(e);
  if (w < e.fin) return 'curso';
  if (w < fin) return 'atrasado';
  return atrasoDe(e) > 0.5 ? 'tarde' : 'tiempo';
}


export default function Prueba4D() {
  const caja = useRef(null);
  const motor = useRef(null);
  const estado = useRef({
    p: 0.62, az: -0.55, el: 0.36, R: 128, modo: 'plan', nivel: null,
    tocado: false, jugando: false, sucio: true, visible: false,
  });
  const [p, setP] = useState(0.62);
  const [modo, setModo] = useState('plan');
  const [jugando, setJugando] = useState(false);
  const [datos, setDatos] = useState({ fecha: '', nivel: '', m3: '', real: null });
  const [ficha, setFicha] = useState(null);
  const modelo = useRef(null);

  const dibujar = useCallback(() => { estado.current.sucio = true; }, []);

  useEffect(() => {
    const cont = caja.current;
    if (!cont) return undefined;
    modelo.current = construirTorre();
    const m = modelo.current;
    const total = m.elementos.reduce((a, e) => a + e.volumen, 0);
    const e = estado.current;

    const obra = crearObra3D(cont, {
      formato: 'banda',
      edificios: [{ modelo: m, grua: { pos: [-29, -9], desde: 8.6 } }],
      terreno: { largo: 64, ancho: 50, centro: [0, 0] },
      semanaDe,
      camara: () => {
        const ancho = cont.clientWidth / Math.max(1, cont.clientHeight);
        const R = e.R * (ancho < 1 ? 1.45 : ancho < 1.4 ? 1.15 : 1);
        const mira = [0, 10, 0];
        return {
          pos: [mira[0] + R * Math.cos(e.el) * Math.sin(e.az), mira[1] + R * Math.sin(e.el), mira[2] + R * Math.cos(e.el) * Math.cos(e.az)],
          mira,
        };
      },
      colorear: (el, w) => {
        if (e.nivel && el.nivel === e.nivel) return COLOR.acento;
        if (e.modo !== 'real') return null;
        const s = estadoReal(el, w);
        return s === 'atrasado' ? ROJO : s === 'tarde' ? AMBAR : VERDE;
      },
      hud: {
        titulo: '',
        datos: (w, est) => [
          { rotulo: 'Nivel', valor: nivelLegible(est.porEdificio?.get(m.nombre), w, [2, 8]) },
          { rotulo: 'Hormigón', valor: num(est.m3) },
        ],
      },
    });
    motor.current = obra;

    const leerDatos = () => {
      const w = semanaDe(e.p);
      const ind = obra.indicadores();
      let real = null;
      if (e.modo === 'real') {
        let plan = 0, hecho = 0, atrasados = new Set();
        for (const el of m.elementos) {
          if (el.tipo === 'vidrio') continue;
          if (w >= el.fin) plan += el.volumen;
          if (w >= el.fin + atrasoDe(el)) hecho += el.volumen;
          else if (w >= el.fin) atrasados.add(el.nivel);
        }
        real = { plan: (100 * plan) / total, real: (100 * hecho) / total, atrasados: atrasados.size };
      }
      setDatos({ fecha: ind.fecha, nivel: ind.kpis?.[0]?.valor ?? '', m3: ind.kpis?.[1]?.valor ?? '', real });
    };

    // Un solo bucle: dibuja solo si algo cambió (arrastre, semana, modo) o si
    // está girando solo / reproduciendo. Fuera de pantalla no corre.
    let raf = 0;
    let ultimo = performance.now();
    const bucle = (t) => {
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (e.visible) {
        if (!e.tocado) { e.az += dt * 0.12; e.sucio = true; }
        if (e.jugando) {
          e.p = Math.min(1, e.p + dt / 9);
          setP(e.p);
          if (e.p >= 1) { e.jugando = false; setJugando(false); }
          e.sucio = true;
        }
        if (e.sucio) {
          e.sucio = false;
          obra.fijarProgreso(e.p);
          leerDatos();
        }
      }
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);

    const io = new IntersectionObserver(([x]) => { e.visible = x.isIntersecting; e.sucio = true; }, { threshold: 0.05 });
    io.observe(cont);
    const ro = new ResizeObserver(() => { obra.redimensionar(cont.clientWidth, cont.clientHeight); e.sucio = true; });
    ro.observe(cont);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      obra.destruir();
      motor.current = null;
    };
  }, []);

  // ── Manipulación: arrastrar gira, pellizcar/ctrl+rueda acerca, tocar elige ──
  useEffect(() => {
    const cont = caja.current;
    if (!cont) return undefined;
    const e = estado.current;
    const punteros = new Map();
    let movido = 0;
    let distancia0 = 0, R0 = 0;

    const abajo = (ev) => {
      punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      movido = 0;
      e.tocado = true;
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        distancia0 = Math.hypot(a.x - b.x, a.y - b.y);
        R0 = e.R;
      }
      if (ev.pointerType === 'mouse') { try { cont.setPointerCapture(ev.pointerId); } catch { /* sin puntero activo */ } }
    };
    const mover = (ev) => {
      const prev = punteros.get(ev.pointerId);
      if (!prev) return;
      const dx = ev.clientX - prev.x, dy = ev.clientY - prev.y;
      punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      movido += Math.abs(dx) + Math.abs(dy);
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (distancia0 > 0) e.R = limitar(R0 * (distancia0 / d), 70, 280);
      } else {
        e.az -= dx * 0.008;
        // En el teléfono el arrastre vertical deja hacer scroll a la página.
        if (ev.pointerType === 'mouse') e.el = limitar(e.el + dy * 0.006, 0.08, 1.25);
      }
      dibujar();
    };
    const arriba = (ev) => {
      const prev = punteros.get(ev.pointerId);
      punteros.delete(ev.pointerId);
      if (punteros.size < 2) distancia0 = 0;
      if (!prev || movido > 6 || !motor.current) return;
      // Un toque sin arrastre: ¿qué piso hay ahí?
      const r = cont.getBoundingClientRect();
      const el = motor.current.elegir(ev.clientX - r.left, ev.clientY - r.top);
      elegirNivel(el?.nivel ?? null);
    };
    const rueda = (ev) => {
      // Solo con ctrl (o el pellizco del trackpad, que llega así): la rueda
      // sola tiene que seguir bajando la página.
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      e.tocado = true;
      e.R = limitar(e.R * (1 + ev.deltaY * 0.004), 70, 280);
      dibujar();
    };
    cont.addEventListener('pointerdown', abajo);
    cont.addEventListener('pointermove', mover);
    cont.addEventListener('pointerup', arriba);
    cont.addEventListener('pointercancel', arriba);
    cont.addEventListener('wheel', rueda, { passive: false });
    return () => {
      cont.removeEventListener('pointerdown', abajo);
      cont.removeEventListener('pointermove', mover);
      cont.removeEventListener('pointerup', arriba);
      cont.removeEventListener('pointercancel', arriba);
      cont.removeEventListener('wheel', rueda);
    };
  }, [dibujar]);

  function elegirNivel(nivel) {
    const e = estado.current;
    e.nivel = nivel;
    dibujar();
    if (!nivel || !modelo.current) { setFicha(null); return; }
    const els = modelo.current.elementos.filter((x) => x.nivel === nivel && x.tipo !== 'vidrio');
    const ini = Math.min(...els.map((x) => x.inicio));
    const fin = Math.max(...els.map((x) => x.fin));
    const atraso = Math.max(...els.map(atrasoDe));
    const sectores = [...new Set(els.map((x) => x.ciclo))].sort();
    const nombre = nivel.split(':')[1];
    setFicha({
      nombre: nombre === 'FUND' ? 'Fundación' : nombre === 'TECHO' ? 'Sala de máquinas' : nombre,
      m3: els.reduce((a, x) => a + x.volumen, 0),
      elementos: els.length,
      ini, fin, atraso, sectores,
    });
  }

  const cambiarP = (v) => {
    const e = estado.current;
    e.p = v; e.jugando = false; e.tocado = true;
    setP(v); setJugando(false);
    dibujar();
  };
  const reproducir = () => {
    const e = estado.current;
    if (e.jugando) { e.jugando = false; setJugando(false); return; }
    if (e.p >= 0.999) e.p = 0;
    e.jugando = true; e.tocado = true;
    setJugando(true);
  };
  const cambiarModo = (m) => {
    estado.current.modo = m;
    setModo(m);
    dibujar();
  };
  const acercar = (k) => {
    const e = estado.current;
    e.R = limitar(e.R * k, 70, 280);
    e.tocado = true;
    dibujar();
  };

  const w = semanaDe(p);
  const estadoFicha = ficha && (() => {
    if (w < ficha.ini) return { t: 'Por partir', c: 'text-texto-3' };
    if (w < ficha.fin) return { t: 'En hormigonado', c: 'text-texto-2' };
    if (modo === 'real' && w < ficha.fin + ficha.atraso) return { t: `Atrasado ${Math.round(ficha.atraso * 7)} días`, c: 'text-[#E53E3E]' };
    if (modo === 'real' && ficha.atraso > 0.5) return { t: `Terminado con ${Math.round(ficha.atraso * 7)} días de atraso`, c: 'text-[#ECC94B]' };
    return { t: 'Terminado', c: 'text-[#22c55e]' };
  })();

  return (
    <section id="prueba" aria-label="Prueba el 4D" className="bg-negro">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-24 sm:px-12 sm:pt-32">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Simulación 4D</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Recorra la obra en el tiempo.
        </Revelar>
        <Revelar as="p" retraso={160} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          Rote el modelo, seleccione una semana y compare lo planificado con el avance real. Seleccione un nivel para ver su ficha.
        </Revelar>
      </div>

      <div className="mx-auto max-w-7xl px-3 pb-24 sm:px-12">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div
            ref={caja}
            className="aspect-[4/5] w-full cursor-grab select-none active:cursor-grabbing sm:aspect-[16/9]"
            style={{ touchAction: 'pan-y' }}
            aria-label="Modelo 4D de ejemplo: arrastre para rotarlo y seleccione un nivel para ver su ficha"
          />

          {/* Arriba: el modo y las ayudas */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-3 sm:p-5">
            <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur">
              {[['plan', 'Planificado'], ['real', 'Avance real']].map(([k, t]) => (
                <button key={k} type="button" onClick={() => cambiarModo(k)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${modo === k ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-white/45 md:inline">
                Arrastre para rotar · Ctrl + rueda para acercar
              </span>
              {[['−', 1.15, 'Alejar'], ['+', 0.87, 'Acercar']].map(([t, k, a]) => (
                <button key={t} type="button" onClick={() => acercar(k)} aria-label={a}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/60 text-lg text-white/80 backdrop-blur hover:text-white">
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* La leyenda del modo */}
          <div className="pointer-events-none absolute left-3 top-16 flex flex-wrap gap-x-3 gap-y-1 sm:left-5 sm:top-20">
            {(modo === 'plan'
              ? CICLOS.slice(0, 4).map((c, i) => [c, `Ciclo ${i + 1}`])
              : [[VERDE, 'A tiempo'], [AMBAR, 'Terminado con atraso'], [ROJO, 'Atrasado']]
            ).map(([c, t]) => (
              <span key={t} className="flex items-center gap-1.5 text-[11.5px] text-white/70">
                <i className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{t}
              </span>
            ))}
          </div>

          {/* La ficha del piso tocado */}
          {ficha && (
            <div className="absolute bottom-[132px] right-3 w-[min(300px,calc(100%-24px))] rounded-xl border border-white/15 bg-black/75 p-4 backdrop-blur sm:bottom-auto sm:right-5 sm:top-20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-iso-sky">Vista Cordillera</p>
                  <p className="mt-1 text-xl font-semibold">{ficha.nombre}</p>
                </div>
                <button type="button" onClick={() => elegirNivel(null)} aria-label="Cerrar ficha" className="text-xl leading-none text-white/50 hover:text-white">×</button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <dt className="text-white/50">Hormigón</dt><dd className="text-right font-mono">{num(ficha.m3)} m³</dd>
                <dt className="text-white/50">Elementos</dt><dd className="text-right font-mono">{ficha.elementos}</dd>
                <dt className="text-white/50">Programado</dt>
                <dd className="text-right font-mono text-[12px]">{fechaCorta(fechaDeSemana(Math.floor(ficha.ini)))}<br />→ {fechaCorta(fechaDeSemana(Math.floor(ficha.fin)))}</dd>
                <dt className="text-white/50">Ciclos</dt>
                <dd className="flex justify-end gap-1">{ficha.sectores.map((s) => <i key={s} className="h-3 w-3 rounded-sm" style={{ background: CICLOS[s % CICLOS.length] }} />)}</dd>
              </dl>
              {estadoFicha && <p className={`mt-3 border-t border-white/10 pt-3 text-[13px] font-semibold ${estadoFicha.c}`}>{estadoFicha.t}</p>}
            </div>
          )}

          {/* Abajo: la semana */}
          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/70 p-3 backdrop-blur sm:p-5">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <Dato rotulo="Semana del" valor={datos.fecha} />
              <Dato rotulo="Nivel" valor={datos.nivel} />
              <Dato rotulo="Hormigón" valor={`${datos.m3} m³`} />
              {datos.real && (
                <Dato rotulo="Real / plan" valor={`${num(datos.real.real, 1)}% / ${num(datos.real.plan, 1)}%`}
                  color={datos.real.real + 0.5 < datos.real.plan ? 'text-[#E53E3E]' : 'text-[#22c55e]'} />
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={reproducir} aria-label={jugando ? 'Pausar' : 'Reproducir la obra'}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-black hover:bg-white/85">
                {jugando ? <span className="text-[13px] font-bold">❚❚</span> : <span className="ml-0.5 text-[14px]">▶</span>}
              </button>
              <input type="range" min={0} max={1000} value={Math.round(p * 1000)} onChange={(ev) => cambiarP(Number(ev.target.value) / 1000)}
                aria-label="Semana de la obra" className="rango-4d h-10 w-full cursor-pointer" />
            </div>
          </div>
        </div>
        <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Obra y datos de ejemplo</p>
      </div>
    </section>
  );
}

function Dato({ rotulo, valor, color = 'text-white' }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{rotulo}</p>
      <p className={`mt-0.5 whitespace-nowrap font-mono text-[15px] sm:text-[17px] ${color}`}>{valor}</p>
    </div>
  );
}

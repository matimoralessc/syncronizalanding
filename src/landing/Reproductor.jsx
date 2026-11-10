import { useEffect, useRef, useState } from 'react';
import { ESCENAS } from '../anim/escenas/index.js';
import '../anim/anim.css';

// Una escena de syncroniza-animaciones que se reproduce sola (9-nov-2026: en
// vez de capítulos largos movidos por el scroll, «achicar la página»). Parte
// cuando entra en pantalla, se puede repetir y se puede mover a mano con la
// barra. En el teléfono va en formato vertical —solo el gráfico, en letra
// grande— y sus cifras se ponen abajo, grandes, como en las piezas de LinkedIn.

const esCelular = () => window.matchMedia('(max-width: 767px)').matches;

export default function Reproductor({ escena, segundos = 4, alto = 'aspect-[16/9]' }) {
  const caja = useRef(null);
  const est = useRef({ obj: null, p: 0, jugando: false, visible: false, visto: false });
  const [p, setP] = useState(0);
  const [jugando, setJugando] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [celular, setCelular] = useState(() => typeof window !== 'undefined' && esCelular());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const f = () => setCelular(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  useEffect(() => {
    const cont = caja.current;
    const def = ESCENAS[escena];
    if (!cont || !def) return undefined;
    const e = est.current;
    cont.innerHTML = '';
    e.obj = def.crear(cont, celular ? { formato: 'vertical' } : {});
    e.obj.redimensionar(cont.clientWidth, cont.clientHeight);
    e.p = 0;
    e.obj.fijarProgreso(0);
    setP(0);
    // Cada pestaña nueva arranca sola si la sección ya está a la vista.
    e.jugando = e.visible;
    setJugando(e.visible);
    e.visto = e.visible;

    let raf = 0, ultimo = performance.now();
    const bucle = (t) => {
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (e.jugando) {
        e.p = Math.min(1, e.p + dt / segundos);
        e.obj.fijarProgreso(e.p);
        setP(e.p);
        setKpis(e.obj.indicadores?.().kpis ?? []);
        if (e.p >= 1) { e.jugando = false; setJugando(false); }
      }
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);

    const io = new IntersectionObserver(([x]) => {
      e.visible = x.isIntersecting;
      // La primera vez que se ve, parte sola.
      if (x.isIntersecting && !e.visto) { e.visto = true; e.jugando = true; setJugando(true); }
    }, { threshold: 0.35 });
    io.observe(cont);
    const ro = new ResizeObserver(() => { e.obj?.redimensionar(cont.clientWidth, cont.clientHeight); e.obj?.fijarProgreso(e.p); });
    ro.observe(cont);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      e.obj?.destruir?.();
      e.obj = null;
    };
  }, [escena, segundos, celular]);

  const mover = (v) => {
    const e = est.current;
    e.jugando = false;
    setJugando(false);
    e.p = v;
    e.obj?.fijarProgreso(v);
    setP(v);
    setKpis(e.obj?.indicadores?.().kpis ?? []);
  };
  const reproducir = () => {
    const e = est.current;
    if (e.jugando) { e.jugando = false; setJugando(false); return; }
    if (e.p >= 0.999) e.p = 0;
    e.jugando = true;
    setJugando(true);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div ref={caja} className={`w-full ${celular ? 'aspect-[1080/760]' : alto}`} aria-hidden="true" />
      {celular && kpis.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-4 py-3">
          {kpis.slice(0, 3).map((k) => (
            <div key={k.rotulo} className="min-w-0">
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">{k.rotulo}</p>
              <p className="mt-0.5 truncate font-mono text-[18px]" style={{ color: k.color || '#fff' }}>{k.valor}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2.5 sm:px-4">
        <button type="button" onClick={reproducir} aria-label={jugando ? 'Pausar' : 'Reproducir'}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black hover:bg-white/85">
          {jugando ? <span className="text-[12px] font-bold">❚❚</span> : <span className="ml-0.5 text-[13px]">{p >= 0.999 ? '↻' : '▶'}</span>}
        </button>
        <input type="range" min={0} max={1000} value={Math.round(p * 1000)} onChange={(ev) => mover(Number(ev.target.value) / 1000)}
          aria-label="Avance de la animación" className="rango-4d h-9 w-full cursor-pointer" />
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 sm:inline">Datos de ejemplo</span>
      </div>
    </div>
  );
}

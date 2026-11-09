import { useEffect, useRef } from 'react';
import Revelar from './Revelar.jsx';
import { ESCENAS } from '../anim/escenas/index.js';
import '../anim/anim.css';

// Un capítulo de la landing (9-nov-2026): un título corto y, debajo, una de
// las escenas de syncroniza-animaciones fija en pantalla mientras el scroll
// la recorre de 0 a 1 —el mismo efecto del héroe 4D, que fue lo que gustó—.
// Las escenas son JS puro (fijarProgreso, redimensionar, destruir); acá solo
// se les da una caja y el progreso.
//
// Un solo bucle de animación para todos los capítulos: el progreso persigue al
// scroll suavizado (no salta), y cada escena se crea recién cuando se acerca
// y se destruye cuando se aleja — varias escenas 3D vivas a la vez es mucha GPU.
const vivos = new Set();
let corriendo = false;

function cuadro() {
  for (const c of vivos) {
    const r = c.tramo.getBoundingClientRect();
    const recorrido = c.tramo.offsetHeight - window.innerHeight;
    c.objetivo = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
    const antes = c.actual;
    c.actual = c.reducido ? c.objetivo : c.actual + (c.objetivo - c.actual) * 0.14;
    if (Math.abs(c.objetivo - c.actual) < 0.0005) c.actual = c.objetivo;
    if (c.escena && (Math.abs(antes - c.actual) > 1e-5 || c.primera)) {
      c.escena.fijarProgreso(c.actual);
      c.primera = false;
    }
  }
  if (vivos.size) requestAnimationFrame(cuadro);
  else corriendo = false;
}

function esCelular() {
  return window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
}

export default function Capitulo({ id, escena, etiqueta, titulo, texto, alto = 260, reducido = false }) {
  const tramo = useRef(null);
  const caja = useRef(null);

  useEffect(() => {
    const def = ESCENAS[escena];
    if (!def || !tramo.current || !caja.current) return undefined;
    const c = { tramo: tramo.current, escena: null, objetivo: 0, actual: 0, primera: true, reducido };
    let formato = null;

    const crear = () => {
      formato = esCelular() ? 'vertical' : 'horizontal';
      caja.current.innerHTML = '';
      c.escena = def.crear(caja.current, formato === 'vertical' ? { formato: 'vertical' } : {});
      c.escena.redimensionar(caja.current.clientWidth, caja.current.clientHeight);
      c.primera = true;
      vivos.add(c);
      if (!corriendo) {
        corriendo = true;
        requestAnimationFrame(cuadro);
      }
    };
    const soltar = () => {
      vivos.delete(c);
      c.escena?.destruir?.();
      c.escena = null;
    };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !c.escena) crear();
      else if (!e.isIntersecting && c.escena) soltar();
    }, { rootMargin: '60% 0px' });
    io.observe(tramo.current);

    const alRedimensionar = () => {
      if (!c.escena) return;
      // Girar el teléfono cambia el formato: se rehace la escena.
      if ((esCelular() ? 'vertical' : 'horizontal') !== formato) {
        soltar();
        crear();
        return;
      }
      c.escena.redimensionar(caja.current.clientWidth, caja.current.clientHeight);
      c.escena.fijarProgreso(c.actual);
    };
    window.addEventListener('resize', alRedimensionar);
    return () => {
      io.disconnect();
      window.removeEventListener('resize', alRedimensionar);
      soltar();
    };
  }, [escena, reducido]);

  return (
    <section id={id} aria-label={titulo} className="bg-negro">
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-12 sm:pt-36">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">
          {etiqueta}
        </Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {titulo}
        </Revelar>
        <Revelar as="p" retraso={160} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
          {texto}
        </Revelar>
      </div>
      <div ref={tramo} className="relative" style={{ height: `${alto}vh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <div ref={caja} className="h-full w-full" aria-hidden="true" />
          <p className="pointer-events-none absolute bottom-4 right-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Obra y datos de ejemplo
          </p>
        </div>
      </div>
    </section>
  );
}

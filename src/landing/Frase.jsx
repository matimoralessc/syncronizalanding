import { useEffect, useRef } from 'react';

// La frase grande que se enciende palabra por palabra (B11 de la skill).
//
// Por qué por progreso y no por la posición de cada palabra: las palabras de
// una misma línea cruzan la línea de disparo al mismo tiempo, y se encendería
// la línea entera de golpe. Con el progreso de la sección se encienden las
// primeras N palabras, en orden de lectura, una a una.
//
// El listener de scroll solo existe mientras la sección está a la vista (lo
// prende y lo apaga un IntersectionObserver) y calcula una vez por cuadro.
export default function Frase({ texto, className = '' }) {
  const ref = useRef(null);
  const palabras = texto.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const spans = [...el.querySelectorAll('[data-palabra]')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => { s.dataset.activa = 'si'; });
      return undefined;
    }
    let pedido = false;
    let escuchando = false;
    const calcular = () => {
      pedido = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando el bloque asoma por abajo del 85 %, 1 cuando su base pasa el 45 %.
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.4)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => { s.dataset.activa = i < n ? 'si' : 'no'; });
    };
    const alScroll = () => { if (!pedido) { pedido = true; requestAnimationFrame(calcular); } };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !escuchando) {
        escuchando = true;
        window.addEventListener('scroll', alScroll, { passive: true });
        calcular();
      } else if (!e.isIntersecting && escuchando) {
        escuchando = false;
        window.removeEventListener('scroll', alScroll);
      }
    });
    io.observe(el);
    return () => { io.disconnect(); window.removeEventListener('scroll', alScroll); };
  }, [texto]);

  return (
    <p ref={ref} className={className}>
      {palabras.map((p, i) => (
        <span key={`${p}-${i}`}>
          <span
            data-palabra
            data-activa="no"
            className="text-white transition-opacity duration-700 ease-fluido data-[activa=no]:opacity-30"
          >
            {p}
          </span>
          {i < palabras.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}

import { useEffect, useRef } from 'react';

// Un solo IntersectionObserver para toda la página: con 40 bloques que entran,
// 40 observadores son 40 callbacks por cada cruce. La clase la pone el
// observador y se queda: un bloque que ya entró no vuelve a esconderse al
// subir, porque eso se lee como un error, no como diseño.
let observador = null;
function observar(el) {
  if (typeof IntersectionObserver === 'undefined') {
    el.classList.add('esta-dentro');
    return () => {};
  }
  if (!observador) {
    observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('esta-dentro');
            observador.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );
  }
  observador.observe(el);
  return () => observador?.unobserve(el);
}

export default function Revelar({ as: Tag = 'div', retraso = 0, y, className = '', style, children, ...resto }) {
  const ref = useRef(null);
  useEffect(() => (ref.current ? observar(ref.current) : undefined), []);
  return (
    <Tag
      ref={ref}
      className={`revelar ${className}`}
      style={{ '--revelar-retraso': `${retraso}ms`, ...(y !== undefined ? { '--revelar-y': `${y}px` } : {}), ...style }}
      {...resto}
    >
      {children}
    </Tag>
  );
}

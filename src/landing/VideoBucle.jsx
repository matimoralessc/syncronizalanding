import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';

// Video en bucle de una sección.
//
// - Se reproduce solo mientras está en pantalla: cuatro videos corriendo fuera
//   de vista son batería y decodificador gastados en nada.
// - Siempre tiene pausa (WCAG 2.2.2: lo que se mueve más de 5 s se puede parar).
// - Con movimiento reducido no arranca solo: queda el póster y el botón.
// - `preload="none"` + póster: el MP4 se pide recién cuando el video se acerca.
export default function VideoBucle({ src, poster, ancho, alto, etiqueta, className = '' }) {
  const ref = useRef(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
  const pausadoRef = useRef(false);
  pausadoRef.current = pausadoPorUsuario;

  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) { setPausadoPorUsuario(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !pausadoRef.current) {
        v.play().then(() => setReproduciendo(true)).catch(() => setReproduciendo(false));
      } else if (!e.isIntersecting) {
        v.pause();
        setReproduciendo(false);
      }
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const alternar = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      setPausadoPorUsuario(false);
      v.play().then(() => setReproduciendo(true)).catch(() => {});
    } else {
      setPausadoPorUsuario(true);
      v.pause();
      setReproduciendo(false);
    }
  };

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {/* width/height declaran la proporción: con preload="none" el navegador no
          pide la metadata y sin esto la caja nace en 300×150 y salta al cargar. */}
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        width={ancho}
        height={alto}
        aria-label={etiqueta}
        className="block h-auto w-full"
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={alternar}
        aria-label={reproduciendo ? `Pausar: ${etiqueta}` : `Reproducir: ${etiqueta}`}
        className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition-all duration-300 ease-fluido hover:scale-105 hover:bg-black/80 active:scale-[0.98]"
      >
        {reproduciendo ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
      </button>
    </div>
  );
}

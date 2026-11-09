import { useEffect, useState } from 'react';

// Navegación "isla" (B7 de la skill de landing): una píldora de vidrio que
// flota despegada del borde, en vez de una barra pegada arriba. En el héroe
// queda encima del 4D sin taparlo; una barra de ancho completo cortaba el cielo
// del video.
//
// La sección actual se marca con un IntersectionObserver, no con un listener de
// scroll: el héroe ya tiene su propio cuadro de animación corriendo y no hay
// que sumarle trabajo por cada pixel.

export const ENLACES = [
  { id: 'cuatro-d', texto: '4D' },
  { id: 'avance', texto: 'Avance' },
  { id: 'costos', texto: 'Costos' },
  { id: 'last-planner', texto: 'Last Planner' },
  { id: 'terreno', texto: 'Terreno' },
];

function useSeccionActual(ids) {
  const [actual, setActual] = useState(null);
  useEffect(() => {
    const visibles = new Map();
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
        let mejor = null;
        let max = 0;
        visibles.forEach((r, id) => { if (r > max) { max = r; mejor = id; } });
        setActual(max > 0 ? mejor : null);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.01, 0.5, 1] },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return actual;
}

const IDS = ENLACES.map((e) => e.id);

export default function Nav() {
  const [abierto, setAbierto] = useState(false);
  const actual = useSeccionActual(IDS);

  // Con el menú abierto la página de atrás no se mueve, y Escape lo cierra.
  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alTecla = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', alTecla);
    return () => { document.body.style.overflow = previo; window.removeEventListener('keydown', alTecla); };
  }, [abierto]);

  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform duration-300 ease-fluido focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <header className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <nav
          aria-label="Principal"
          className="flex w-max max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/60 p-2 pl-4 backdrop-blur-xl"
        >
          <a href="#inicio" className="flex items-center gap-2 pr-2" aria-label="Syncroniza, volver al inicio">
            <img src="/syncroniza-isotipo.png" alt="" width={16} height={28} className="h-6 w-auto" />
            <span className="text-sm font-semibold tracking-wide text-white">Syncroniza</span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {ENLACES.map((e) => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  aria-current={actual === e.id ? 'true' : undefined}
                  className="rounded-full px-3 py-2 text-sm text-texto-3 transition-colors duration-300 ease-fluido hover:text-white aria-[current=true]:bg-white/10 aria-[current=true]:text-white"
                >
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#contacto"
            className="hidden rounded-full bg-white px-3 py-2 text-sm font-semibold text-black transition-transform duration-300 ease-fluido hover:-translate-y-0.5 active:scale-[0.98] sm:inline-flex"
          >
            Agenda una demo
          </a>

          {/* Hamburguesa → X: las líneas giran y se cruzan, nunca desaparecen. */}
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="relative z-[70] h-10 w-10 rounded-full transition-colors duration-300 ease-fluido hover:bg-white/10 md:hidden"
          >
            <span className={`absolute left-3 h-0.5 w-4 rounded-full bg-white transition-all duration-700 ease-fluido ${abierto ? 'top-[19px] rotate-45' : 'top-4'}`} />
            <span className={`absolute left-3 h-0.5 w-4 rounded-full bg-white transition-all duration-700 ease-fluido ${abierto ? 'top-[19px] -rotate-45' : 'top-6'}`} />
          </button>
        </nav>
      </header>

      {/* Menú a pantalla completa con vidrio pesado; los enlaces suben escalonados. */}
      <div
        id="menu-movil"
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-black/80 px-8 backdrop-blur-3xl transition-opacity duration-700 ease-fluido md:hidden ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!abierto}
      >
        <ul className="space-y-4">
          {[...ENLACES, { id: 'contacto', texto: 'Agenda una demo' }].map((e, i) => (
            <li key={e.id} className="overflow-hidden">
              <a
                href={`#${e.id}`}
                tabIndex={abierto ? 0 : -1}
                onClick={() => setAbierto(false)}
                className={`block text-4xl font-semibold text-white transition-all duration-700 ease-fluido ${abierto ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                style={{ transitionDelay: abierto ? `${100 + i * 50}ms` : '0ms' }}
              >
                {e.texto}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

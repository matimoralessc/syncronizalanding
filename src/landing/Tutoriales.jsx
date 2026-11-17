import { useEffect, useState } from 'react';
import { ChevronDown, Play, X } from 'lucide-react';
import Revelar from './Revelar.jsx';
import TUTORIALES from './tutoriales.json';

// La Base de conocimientos (16-nov-2026, Matías: «tenemos cursos y tutoriales
// dentro de la plataforma sobre cómo ocupar cada módulo... eso vale la pena
// mostrar»). Una videoteca con los mismos tutoriales que ve el equipo en la
// plataforma, filtrable por módulo. Los videos van SIN AUDIO y con subtítulos:
// la voz es del plan gratis de ElevenLabs, sin licencia comercial. Los prepara
// scripts/estudio-4d/tutorial-docs/landing_tutoriales.py desde el MVP.

const MODULOS = ['Todos', ...new Set(TUTORIALES.map((t) => t.modulo))];
const VISIBLES = 8;
const duracion = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Tutoriales() {
  const [modulo, setModulo] = useState('Todos');
  const [todos, setTodos] = useState(false);
  const [viendo, setViendo] = useState(null);

  useEffect(() => {
    if (!viendo) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') setViendo(null); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [viendo]);

  const lista = TUTORIALES.filter((t) => modulo === 'Todos' || t.modulo === modulo);
  // En el teléfono van todos en un carrusel; en pantallas grandes, una grilla
  // que muestra los primeros y se expande con «Ver los N tutoriales».
  const recortado = !todos && modulo === 'Todos' && lista.length > VISIBLES;

  return (
    <section id="tutoriales" aria-label="Tutoriales de la plataforma" className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-12 sm:py-28">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Base de conocimientos</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Cada módulo, explicado en menos de un minuto.
        </Revelar>
        <Revelar as="p" retraso={140} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          {TUTORIALES.length} tutoriales en video dentro de la plataforma, paso a paso, para que cada persona que se
          suma a la obra aprenda a usar su módulo sin esperar una capacitación.
        </Revelar>

        <div role="tablist" aria-label="Módulos" className="sin-barra -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {MODULOS.map((m) => {
            const n = m === 'Todos' ? TUTORIALES.length : TUTORIALES.filter((t) => t.modulo === m).length;
            return (
              <button key={m} role="tab" type="button" aria-selected={m === modulo} onClick={() => { setModulo(m); setTodos(false); }}
                className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition ${m === modulo ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
                {m} <span className={m === modulo ? 'text-black/45' : 'text-white/35'}>{n}</span>
              </button>
            );
          })}
        </div>

        <ul className="sin-barra -mx-5 mt-6 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-y-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {lista.map((t, i) => (
            <li key={t.codigo} className={`w-[78%] min-w-0 shrink-0 snap-start sm:w-auto ${recortado && i >= VISIBLES ? 'sm:hidden' : ''}`}>
              <button type="button" onClick={() => setViendo(t)} className="group block w-full text-left" aria-label={`Ver tutorial: ${t.titulo}`}>
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-carbon">
                  <img src={`/tutoriales/${t.codigo}.webp`} alt="" width={640} height={360} loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-500 ease-fluido group-hover:scale-[1.03]" />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25">
                    <span className="grid h-12 w-12 scale-90 place-items-center rounded-full bg-white/95 text-black opacity-0 shadow-lg transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11.5px] text-white">{duracion(t.segundos)}</span>
                </div>
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">{t.codigo} · {t.modulo}</p>
                <p className="mt-1 text-[15.5px] font-semibold leading-snug group-hover:text-iso-sky">{t.titulo}</p>
              </button>
            </li>
          ))}
        </ul>

        {recortado && (
          <button type="button" onClick={() => setTodos(true)}
            className="mx-auto mt-10 hidden sm:flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14.5px] font-semibold transition hover:border-white/50">
            Ver los {lista.length} tutoriales <ChevronDown size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {viendo && (
        <div role="dialog" aria-modal="true" aria-label={viendo.titulo}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur" onClick={() => setViendo(null)}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <video key={viendo.codigo} src={`/tutoriales/${viendo.codigo}.mp4`} poster={`/tutoriales/${viendo.codigo}.webp`}
              controls autoPlay muted playsInline className="video-tutorial aspect-video w-full rounded-2xl border border-white/10 bg-black">
              <track kind="subtitles" srcLang="es" label="Español" src={`/tutoriales/${viendo.codigo}.vtt`} default />
            </video>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">{viendo.codigo} · {viendo.modulo}</p>
                <p className="mt-1 text-lg font-semibold">{viendo.titulo}</p>
              </div>
              <button type="button" onClick={() => setViendo(null)} aria-label="Cerrar"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-black hover:bg-white/85">
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

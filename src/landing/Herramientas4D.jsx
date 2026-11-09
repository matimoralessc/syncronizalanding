import { useState } from 'react';
import Revelar from './Revelar.jsx';
import VideoBucle from './VideoBucle.jsx';

// «El 4D de verdad» (9-nov-2026, Matías: «esos videos son viejos, hoy
// Syncroniza 4D tiene muchas nuevas herramientas»). Cuatro herramientas del
// visor actual grabadas con Panorámica (scripts/estudio-4d/grabar-clip.mjs),
// cada una en su pestaña. Al lado de «Pruébalo tú», que es la torre de
// ejemplo: esto es el producto con una obra real.
const HERRAMIENTAS = [
  {
    id: 'hormigon-4d', video: 'hormigon', pestaña: 'Curva S de hormigón',
    titulo: 'Lo planificado contra lo que de verdad llegó.',
    texto: 'Los m³ del modelo, semana a semana, contra las guías validadas. Se marca lo que pasa del límite semanal y cada semana se abre en sus ciclos, día por día.',
  },
  {
    id: 'last-planner-4d', video: 'last-planner', pestaña: 'Last Planner',
    titulo: 'La semana se planifica sobre el modelo.',
    texto: 'Cada frente con sus elementos, repartido por día. Hormigón, moldaje y fierro de la semana salen solos para la reunión.',
  },
  {
    id: 'observaciones-4d', video: 'observaciones', pestaña: 'Observaciones',
    titulo: 'Una nota en el modelo pasa a restricción.',
    texto: 'Se anota sobre la vista, con fotos y responsable. Con un clic queda como restricción del Last Planner, con su compromiso.',
  },
  {
    id: 'cubicacion-4d', video: 'cubicacion', pestaña: 'Cubicación',
    titulo: 'Elige una zona y suma hormigón, moldaje y fierro.',
    texto: 'Con un arrastre sobre el modelo se toman cientos de elementos y salen los totales por categoría: fundaciones, losas, muros, vigas y columnas.',
  },
];

export default function Herramientas4D() {
  const [activa, setActiva] = useState(HERRAMIENTAS[0].id);
  const h = HERRAMIENTAS.find((x) => x.id === activa);
  return (
    <section id="herramientas" aria-label="Herramientas de Syncroniza 4D" className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-12 sm:py-28">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Syncroniza 4D · Panorámica</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          El 4D de verdad, con una obra de verdad.
        </Revelar>
        <Revelar as="p" retraso={140} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          Grabado en el visor con el programa, el modelo y los datos reales de Panorámica.
        </Revelar>

        <div role="tablist" aria-label="Herramientas del 4D" className="sin-barra -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {HERRAMIENTAS.map((x) => (
            <button key={x.id} id={x.id} role="tab" type="button" aria-selected={x.id === activa} onClick={() => setActiva(x.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition ${x.id === activa ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
              {x.pestaña}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-labelledby={h.id} className="mt-6 grid items-start gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4 lg:pt-4">
            <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{h.titulo}</h3>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/65">{h.texto}</p>
          </div>
          <div className="min-w-0 lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <VideoBucle
                key={h.video}
                src={`/4d/herramientas/${h.video}.mp4`}
                poster={`/4d/herramientas/${h.video}.webp`}
                ancho={1280}
                alto={720}
                etiqueta={`${h.pestaña} en Syncroniza 4D, con la obra Panorámica`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

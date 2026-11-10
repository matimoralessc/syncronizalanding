import Revelar from './Revelar.jsx';

// «Por qué Syncroniza», de la landing de Pedro (SyncronizaLanding2.jsx, 06).
const RAZONES = [
  ['Desarrollado en Chile', 'Diseñado sobre Last Planner System, MS Project y los procesos de las constructoras locales.'],
  ['Implementación en días', 'El equipo de terreno mantiene WhatsApp; la oficina técnica accede a los datos en tiempo real.'],
  ['Suite modular', 'Implementación por módulo (Last Planner, guías, 4D) y escalamiento según el proyecto.'],
];

export default function PorQue() {
  return (
    <section id="por-que" aria-label="Por qué Syncroniza" className="border-t border-white/10 bg-carbon">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-12 sm:py-24">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Por qué Syncroniza</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Una plataforma. Toda la obra.
        </Revelar>
        <Revelar as="p" retraso={140} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          Syncroniza no reemplaza al jefe de terreno: le devuelve las horas que hoy destina a planillas.
        </Revelar>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {RAZONES.map(([t, d], i) => (
            <Revelar key={t} retraso={180 + i * 70} className="border-t border-white/15 pt-6">
              <p className="font-mono text-sm text-iso-sky">0{i + 1}</p>
              <p className="mt-3 text-xl font-semibold leading-snug">{t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</p>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}

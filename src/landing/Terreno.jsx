import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';

// El canal de terreno (9-nov-2026): la escena de WhatsApp, que parte sola al
// aparecer, al lado de lo que hace. Título y puntos de la landing de Pedro.
const PUNTOS = [
  ['Fotos clasificadas', 'La IA detecta el tipo de elemento, la ubicación y el avance estimado.'],
  ['Audios transcritos', 'Las instrucciones y los reportes de voz quedan como texto que se puede buscar.'],
  ['Guías de hormigón', 'Lectura de m³, proveedor, hora de llegada y elemento vaciado.'],
  ['Contexto persistente', 'El agente recuerda el proyecto, las partidas activas y a los participantes.'],
];

export default function Terreno() {
  return (
    <section id="terreno" aria-label="Canal de terreno" className="border-t border-white/10 bg-negro">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-24 sm:px-12 sm:py-28 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Terreno</Revelar>
          <Revelar as="h2" retraso={80} className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            WhatsApp es el sistema operativo de la obra.
          </Revelar>
          <Revelar as="p" retraso={140} className="mt-5 text-lg leading-relaxed text-white/60">
            En vez de pelear con apps que nadie usa, Syncroniza convierte los mensajes que ya pasan en datos
            estructurados: fotos, audios y guías llegan al sistema con su partida, ciclo y nivel.
          </Revelar>
          <dl className="mt-8 space-y-5">
            {PUNTOS.map(([t, d], i) => (
              <Revelar key={t} retraso={180 + i * 60}>
                <dt className="text-[16px] font-semibold">{t}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-white/60">{d}</dd>
              </Revelar>
            ))}
          </dl>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <Reproductor escena="whatsapp" segundos={9} />
        </div>
      </div>
    </section>
  );
}

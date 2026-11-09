import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';

// El canal de terreno (9-nov-2026): la escena de WhatsApp, que parte sola al
// aparecer, al lado de lo que hace. Los textos del bot son los del MVP.
const PUNTOS = [
  ['Restricciones como se dicen', '«Mañana no llega el fierro del piso 13, lo ve Juan»: queda registrada con responsable y fecha.'],
  ['Guías por foto', 'La foto de la guía de despacho entra, la IA la lee y alguien la valida con un botón.'],
  ['Un agente que responde', 'Pregúntale cuánto se ha facturado, cómo va el avance o qué restricciones están vencidas.'],
];

export default function Terreno() {
  return (
    <section id="terreno" aria-label="Canal de terreno" className="border-t border-white/10 bg-negro">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-24 sm:px-12 sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Terreno</Revelar>
          <Revelar as="h2" retraso={80} className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            El terreno reporta por WhatsApp.
          </Revelar>
          <Revelar as="p" retraso={140} className="mt-5 text-lg leading-relaxed text-white/60">Sin instalar nada y sin aprender otra app.</Revelar>
          <dl className="mt-8 space-y-5">
            {PUNTOS.map(([t, d], i) => (
              <Revelar key={t} retraso={180 + i * 60}>
                <dt className="text-[16px] font-semibold">{t}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-white/60">{d}</dd>
              </Revelar>
            ))}
          </dl>
        </div>
        <div className="lg:col-span-7">
          <Reproductor escena="whatsapp" segundos={9} />
        </div>
      </div>
    </section>
  );
}

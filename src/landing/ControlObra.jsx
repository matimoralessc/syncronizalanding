import { useState } from 'react';
import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';

// «Control de obra» (9-nov-2026): los cuatro módulos de control en una sola
// pantalla con pestañas, en vez de cuatro capítulos de tres pantallas cada uno.
// Al elegir una pestaña su gráfico se dibuja solo; la barra lo mueve a mano.
const MODULOS = [
  {
    id: 'avance', escena: 'curva-s', pestaña: 'Avance', segundos: 4.5,
    titulo: 'Programado contra real, sin esperar el informe del mes.',
    puntos: [
      'La toma de avance de cada semana dibuja la Curva S y el SPI apenas se registra.',
      'La brecha se mide en puntos y en semanas, cuando todavía se puede corregir.',
    ],
  },
  {
    id: 'costos', escena: 'costos', pestaña: 'Costos', segundos: 4,
    titulo: 'Cada peso contra su presupuesto.',
    puntos: [
      'Centros de costo con las facturas que llegan solas desde iConstruye.',
      'Resultado proyectado por familia y aprobación por niveles para cambiar un monto.',
    ],
  },
  {
    id: 'hormigon', escena: 'hormigon', pestaña: 'Hormigón', segundos: 4.5,
    titulo: 'Cada guía de despacho, en su lugar.',
    puntos: [
      'La foto de la guía llega por WhatsApp y la IA la lee.',
      'Los m³ quedan contra lo planificado en el modelo 4D, semana a semana.',
    ],
  },
  {
    id: 'last-planner', escena: 'last-planner', pestaña: 'Last Planner', segundos: 4,
    titulo: 'Compromisos que se cumplen.',
    puntos: [
      'El PPC de cada semana y las restricciones con responsable y fecha.',
      'El informe de la reunión le llega a todo el equipo por WhatsApp.',
    ],
  },
];

export default function ControlObra() {
  const [activo, setActivo] = useState(MODULOS[0].id);
  const m = MODULOS.find((x) => x.id === activo);

  return (
    <section id="control" aria-label="Control de obra" className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-12 sm:py-28">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">Control de obra</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Avance, costos, hormigón y Last Planner, con los mismos números.
        </Revelar>

        {/* Pestañas: en el teléfono se deslizan de lado */}
        <div role="tablist" aria-label="Módulos de control" className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {MODULOS.map((x) => (
            <button key={x.id} id={x.id} role="tab" type="button" aria-selected={x.id === activo} onClick={() => setActivo(x.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition ${x.id === activo ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
              {x.pestaña}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-labelledby={m.id} className="mt-6 grid items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:pt-4">
            <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{m.titulo}</h3>
            <ul className="mt-5 space-y-3">
              {m.puntos.map((t) => (
                <li key={t} className="flex gap-3 text-[15.5px] leading-relaxed text-white/65">
                  <i className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iso-sky" />{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-8">
            <Reproductor key={m.id} escena={m.escena} segundos={m.segundos} />
          </div>
        </div>
      </div>
    </section>
  );
}

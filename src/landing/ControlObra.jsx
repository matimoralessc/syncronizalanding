import { useState } from 'react';
import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';

// «La suite» (9-nov-2026): los módulos de control en una sola pantalla con
// pestañas, en vez de capítulos de tres pantallas cada uno. Al elegir una
// pestaña su gráfico se dibuja solo; la barra lo mueve a mano. Los textos de
// la suite, el −12 % de hormigón y la app de salud de obra vienen de la
// landing de Pedro (SyncronizaLanding2.jsx), que es la que está publicada.
const MODULOS = [
  {
    id: 'avance', escena: 'curva-s', pestaña: 'Avance', segundos: 4.5,
    titulo: 'Control de avance y valor ganado.',
    puntos: [
      'Curva S programada versus real, actualizada con cada corte semanal.',
      'SPI y desviación expresada en puntos y en semanas de atraso.',
    ],
  },
  {
    id: 'costos', escena: 'costos', pestaña: 'Costos', segundos: 4,
    titulo: 'Control de costos por centro.',
    puntos: [
      'Integración con iConstruye: facturas, órdenes de compra y estados de pago.',
      'Resultado proyectado por familia y aprobación por niveles para cambios de monto contrato.',
    ],
  },
  {
    id: 'hormigon', escena: 'hormigon', pestaña: 'Guías de hormigón', segundos: 4.5,
    titulo: 'Cero sobrecostos en hormigón.',
    puntos: [
      'Lectura OCR de guías de despacho vía WhatsApp: proveedor, volumen y elemento.',
      'Control de sobrestadía, devoluciones y diferencias entre volumen despachado y colocado.',
    ],
    cifra: { valor: '−12 %', texto: 'promedio en sobrecostos de hormigón' },
  },
  {
    id: 'last-planner', escena: 'last-planner', pestaña: 'Last Planner', segundos: 4,
    titulo: 'Last Planner System.',
    puntos: [
      'Plan semanal, Look Ahead, asistencia y restricciones con responsable y compromiso.',
      'Informe semanal automático con QR de proyecto, distribuido al equipo por WhatsApp.',
    ],
  },
  {
    id: 'salud', escena: 'salud', pestaña: 'Salud de obra', segundos: 4,
    titulo: 'Salud de obra.',
    puntos: [
      'Índice consolidado de plazo, costo, productividad y compromisos (Health Score).',
      'SPI, CPI, PPC y estimación de costo final (EAC) en la aplicación móvil, con alertas tempranas.',
    ],
  },
];

export default function ControlObra() {
  const [activo, setActivo] = useState(MODULOS[0].id);
  const m = MODULOS.find((x) => x.id === activo);

  return (
    <section id="control" aria-label="La suite" className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-12 sm:py-28">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">La suite</Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Cinco módulos. Una sola fuente de datos.
        </Revelar>
        <Revelar as="p" retraso={140} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          La información ingresada en terreno se refleja en la programación 4D, el control de hormigón y los
          indicadores de gerencia, sin traspaso manual de datos.
        </Revelar>

        {/* Pestañas: en el teléfono se deslizan de lado */}
        <div role="tablist" aria-label="Módulos de control" className="sin-barra -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {MODULOS.map((x) => (
            <button key={x.id} id={x.id} role="tab" type="button" aria-selected={x.id === activo} onClick={() => setActivo(x.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition ${x.id === activo ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
              {x.pestaña}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-labelledby={m.id} className="mt-6 grid items-start gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4 lg:pt-4">
            <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{m.titulo}</h3>
            <ul className="mt-5 space-y-3">
              {m.puntos.map((t) => (
                <li key={t} className="flex gap-3 text-[15.5px] leading-relaxed text-white/65">
                  <i className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iso-sky" />{t}
                </li>
              ))}
            </ul>
            {m.cifra && (
              <div className="mt-8 flex items-center gap-5 border-t border-white/10 pt-6">
                <span className="font-mono text-5xl font-medium tabular-nums text-[#22c55e]">{m.cifra.valor}</span>
                <span className="text-[15px] font-semibold leading-snug">{m.cifra.texto}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 lg:col-span-8">
            <Reproductor key={m.id} escena={m.escena} segundos={m.segundos} />
          </div>
        </div>
      </div>
    </section>
  );
}

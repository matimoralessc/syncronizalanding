import { useState } from 'react';
import Revelar from './Revelar.jsx';
import Reproductor from './Reproductor.jsx';
import VideoBucle from './VideoBucle.jsx';

// Syncroniza CO (11-nov-2026, Matías: «hoy solo hay enfoque en 4D y un poco del
// agente, pero lo realmente importante, curvas S, datos de variaciones y demás
// no lo tenemos»). Cada pestaña es un registro de la plataforma con la obra
// Panorámica en ejecución (scripts/estudio-4d/clips-co.mjs), como las
// herramientas del 4D. «Salud de obra» sigue siendo la animación de la landing
// de Pedro: la app móvil no se graba desde acá. El −12 % de hormigón también
// viene de su landing.
const MODULOS = [
  {
    id: 'curva-s', video: 'curva-s', pestaña: 'Curva S',
    titulo: 'Curva S programada versus real.',
    puntos: [
      'Avance programado, real, estados de pago y costo real sobre el mismo eje, actualizado con cada corte semanal.',
      'SPI, CPI, variación de plazo y atraso en días, calculados desde el programa de la obra.',
    ],
  },
  {
    id: 'semanal', video: 'semanal', pestaña: 'Avance semanal',
    titulo: 'Avance y costo, semana a semana.',
    puntos: [
      'Plan y real de cada semana en porcentaje y en pesos, con su CPI y los estados de pago del período.',
      'Informe semanal en PDF, distribuido al equipo y a la gerencia cada viernes.',
    ],
  },
  {
    id: 'costos', video: 'costos', pestaña: 'Costos y variaciones',
    titulo: 'Variaciones por centro de costo.',
    puntos: [
      'Presupuesto oficial, gastado y restante por familia, integrado con iConstruye: facturas, órdenes de compra y estados de pago.',
      'Resultado proyectado de cada centro de costo: dónde se gana y dónde se pierde, antes del cierre.',
      'Cambios de monto contrato y traspasos con aprobación por niveles.',
    ],
  },
  {
    id: 'hormigon', video: 'hormigon', pestaña: 'Hormigón',
    titulo: 'Hormigón planificado versus colocado.',
    puntos: [
      'Guías de despacho leídas desde WhatsApp y validadas en la plataforma: proveedor, volumen, elemento y ciclo.',
      'Camiones devueltos y diferencias valorizadas, contra la planificación del 4D.',
    ],
    cifra: { valor: '−12 %', texto: 'promedio en sobrecostos de hormigón' },
  },
  {
    id: 'last-planner', video: 'last-planner', pestaña: 'Last Planner',
    titulo: 'Last Planner y restricciones.',
    puntos: [
      'Tablero semanal de restricciones con responsable, compromiso y vencimiento.',
      'PPC, tiempo medio de liberación y causas de no cumplimiento por semana.',
    ],
  },
  {
    id: 'terminaciones', video: 'terminaciones', pestaña: 'Terminaciones',
    titulo: 'Terminaciones por unidad, sobre el plano.',
    puntos: [
      'Avance por partida y por departamento, ponderado por costo como la Curva S.',
      'Observaciones ubicadas en el plano de cada unidad, con fotografía, y código QR en cada puerta.',
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
    <section id="control" aria-label="Syncroniza CO" className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-12 sm:py-28">
        <Revelar as="p" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-iso-sky">
          Syncroniza CO · Control de obra
        </Revelar>
        <Revelar as="h2" retraso={80} className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Avance, costos y variaciones, con los datos de la obra.
        </Revelar>
        <Revelar as="p" retraso={140} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          Registros de la plataforma con la obra Panorámica en ejecución. La información de terreno, del programa y
          de iConstruye llega a los mismos indicadores, sin traspaso manual de datos.
        </Revelar>

        {/* Pestañas: en el teléfono se deslizan de lado */}
        <div role="tablist" aria-label="Módulos de control de obra" className="sin-barra -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {MODULOS.map((x) => (
            <button key={x.id} id={`co-${x.id}`} role="tab" type="button" aria-selected={x.id === activo} onClick={() => setActivo(x.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition ${x.id === activo ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
              {x.pestaña}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-labelledby={`co-${m.id}`} className="mt-6 grid items-start gap-8 lg:grid-cols-12">
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
                <span className="whitespace-nowrap font-mono text-5xl font-medium tabular-nums text-[#22c55e]">{m.cifra.valor}</span>
                <span className="text-[15px] font-semibold leading-snug">{m.cifra.texto}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 lg:col-span-8">
            {m.video ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <VideoBucle
                  key={m.video}
                  src={`/co/${m.video}.mp4`}
                  poster={`/co/${m.video}.webp`}
                  ancho={1280}
                  alto={720}
                  etiqueta={`${m.pestaña} en Syncroniza CO, con la obra Panorámica`}
                />
              </div>
            ) : (
              <Reproductor key={m.id} escena={m.escena} segundos={m.segundos} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

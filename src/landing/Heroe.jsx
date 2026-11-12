import { useCallback, useMemo, useRef } from 'react';
import { ArrowRight, ArrowDown } from '@phosphor-icons/react';
import { useVideoScroll } from './useVideoScroll.js';
import datos from './heroe-datos.json';

// El héroe es la obra Panorámica levantándose en el visor 4D real.
//
// El video no es una animación hecha para la página: son 420 cuadros grabados
// del visor de producción con el programa y los vínculos de la obra, y el
// scroll del visitante mueve la fecha del 4D. Por eso el contador y la semana
// que se ven abajo no son decorativos: salen del mismo programa, cuadro por
// cuadro (src/landing/heroe-datos.json, generado al grabar).

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const inicioPrograma = new Date(`${datos.inicioPrograma}T12:00:00`);
const fechaDelDia = (dia) => {
  const f = new Date(inicioPrograma);
  f.setDate(f.getDate() + dia);
  return f;
};
// La semana de obra se nombra por su lunes, como en el visor.
const lunesDe = (f) => {
  const l = new Date(f);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  return l;
};
const fmtCorta = (f) => `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
const fmtNumero = new Intl.NumberFormat('es-CL');

const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => { x = limitar(x); return x * x * (3 - 2 * x); };
// Opacidad de una etapa de texto: entra en [a, a+f], sale en [b-f, b].
const etapa = (p, a, b, f = 0.05) => Math.min(suave((p - a) / f), suave((b - p) / f));

export default function Heroe({ reducido }) {
  const fechaRef = useRef(null);
  const contadorRef = useRef(null);
  const cabezalRef = useRef(null);
  const chipsRef = useRef(null);
  const portadaRef = useRef(null);
  const leyendasRef = useRef([]);
  const cierreRef = useRef(null);
  const pistaRef = useRef(null);
  const veloRef = useRef(null);

  // Las marcas de mes de la línea de tiempo: dónde cae el primer día de cada
  // mes dentro de los cuadros grabados (la fecha no avanza pareja: ver tomas).
  const marcas = useMemo(() => {
    const out = [];
    let mesPrevio = null;
    datos.dias.forEach((dia, i) => {
      const f = fechaDelDia(dia);
      const clave = `${f.getFullYear()}-${f.getMonth()}`;
      if (clave !== mesPrevio) {
        const x = i / (datos.dias.length - 1);
        // Los meses tranquilos ocupan pocos cuadros (la fecha avanza por obra,
        // no por calendario) y sus etiquetas se pisaban: OCT y NOV caían a 2 %
        // una de otra. Se queda la más reciente.
        if (mesPrevio !== null) {
          if (out.length && x - out[out.length - 1].x < 0.06) out.pop();
          out.push({ x, mes: MESES[f.getMonth()] });
        }
        mesPrevio = clave;
      }
    });
    return out;
  }, []);

  const alProgreso = useCallback((p) => {
    // Con movimiento reducido el héroe es la foto de la obra terminada y el HUD
    // queda en su estado final (ver el render): no se mueve con el scroll.
    if (reducido) return;
    const n = datos.dias.length;
    const i = Math.round(limitar(p) * (n - 1));
    const dia = datos.dias[i];
    if (fechaRef.current) fechaRef.current.textContent = fmtCorta(lunesDe(fechaDelDia(dia)));
    if (contadorRef.current) contadorRef.current.textContent = fmtNumero.format(datos.levantados[i]);
    if (cabezalRef.current) cabezalRef.current.style.transform = `scaleX(${limitar(p)})`;
    if (chipsRef.current) {
      [...chipsRef.current.children].forEach((chip, k) => {
        chip.dataset.encendido = i >= datos.ciclos[k].cuadro ? 'si' : 'no';
      });
    }
    // Portada: se va en el primer 12 % del recorrido, subiendo un poco.
    if (portadaRef.current) {
      const o = 1 - suave(p / 0.12);
      portadaRef.current.style.opacity = o;
      portadaRef.current.style.transform = reducido ? 'none' : `translate3d(0, ${-p * 240}px, 0)`;
      portadaRef.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      // Lo que no se ve tampoco se puede enfocar con Tab.
      portadaRef.current.inert = o < 0.5;
      // El video queda a media luz mientras se lee la portada y se enciende al
      // bajar: el texto no compite con los muros grises y la obra "se prende".
      if (veloRef.current) veloRef.current.style.opacity = 0.55 * o;
    }
    const tramos = [[0.13, 0.42], [0.42, 0.72]];
    leyendasRef.current.forEach((el, k) => {
      if (!el) return;
      const o = etapa(p, tramos[k][0], tramos[k][1]);
      el.style.opacity = o;
      el.style.transform = reducido ? 'none' : `translate3d(0, ${(1 - o) * 16}px, 0)`;
    });
    if (cierreRef.current) {
      const o = suave((p - 0.8) / 0.08);
      cierreRef.current.style.opacity = o;
      cierreRef.current.style.transform = reducido ? 'none' : `translate3d(0, ${(1 - o) * 24}px, 0)`;
      cierreRef.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      cierreRef.current.inert = o < 0.5;
    }
    if (pistaRef.current) pistaRef.current.style.opacity = 1 - suave(p / 0.04);
  }, [reducido]);

  const { seccionRef, videoRef, posterRef } = useVideoScroll({
    src: '/4d/heroe-1080.mp4',
    srcMovil: '/4d/heroe-movil.mp4',
    alProgreso,
    reducido,
  });

  const total = fmtNumero.format(datos.total);
  const iInicial = reducido ? datos.dias.length - 1 : 0;

  return (
    // 250vh (9-nov-2026, la página se hacía larga): pantalla y media de
    // recorrido para 420 cuadros.
    // Una rueda de mouse avanza medio segundo de obra por muesca.
    <section ref={seccionRef} id="inicio" aria-label="Panorámica en el visor 4D" className={reducido ? 'relative' : 'relative h-[250vh]'}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-negro">
        {/* Movimiento reducido: ni video ni scrub. Se muestra la obra terminada. */}
        <picture>
          <source media="(max-width: 860px), (orientation: portrait)" srcSet={reducido ? '/4d/heroe-final-movil.webp' : '/4d/heroe-poster-movil.webp'} />
          <img
            ref={posterRef}
            src={reducido ? '/4d/heroe-final.webp' : '/4d/heroe-poster.webp'}
            alt="Modelo BIM de la obra Panorámica en el visor de Syncroniza 4D"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          />
        </picture>
        {!reducido && (
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Velo de color plano (no degradado: los fondos van planos, B4). */}
        <div ref={veloRef} className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0.55 }} />

        {/* ---- Portada: lo que se lee antes de tocar nada ---------------- */}
        <div ref={portadaRef} className="sombra-texto absolute inset-x-0 top-0 z-10 px-6 pt-24 sm:px-12 lg:px-16">
          <p className="etiqueta text-iso-sky">Plataforma de control de proyectos · Obra Panorámica, Constructora Inspira</p>
          <h1 className="titulo-degradado mt-6 max-w-[680px] text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Su obra en 4D,
            <br />
            antes de construirla.
          </h1>
          <p className="mt-6 max-w-[680px] text-lg text-texto-2">
            Programación, avance y costos de la obra en una sola plataforma: Curva S y valor
            ganado, control de costos integrado con iConstruye, BIM 4D, Last Planner System y canal
            de terreno por WhatsApp, sobre una base de datos única.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#contacto" className="boton-principal">
              Solicitar demostración
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </a>
            <a href="#prueba" className="boton-secundario">Ver simulación 4D</a>
          </div>
          {/* La pista se apaga apenas el visitante empieza a bajar. */}
          {!reducido && (
            <p ref={pistaRef} className="etiqueta mt-12 flex items-center gap-2">
              <ArrowDown size={16} aria-hidden="true" />
              Desplácese para avanzar el programa
            </p>
          )}
        </div>

        {/* ---- Leyendas que acompañan la subida --------------------------- */}
        <div className="sombra-texto pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-24 sm:px-12 lg:px-16">
          {[
            { eti: 'Ciclos de hormigonado', txt: 'Cada elemento aparece en la fecha programada, con el color de su ciclo.' },
            { eti: 'Programa vinculado al modelo', txt: 'El desplazamiento recorre el programa de Panorámica sobre su modelo IFC.' },
          ].map((l, k) => (
            <div
              key={l.eti}
              ref={(el) => { leyendasRef.current[k] = el; }}
              className="absolute max-w-md opacity-0"
            >
              <p className="etiqueta text-iso-sky">{l.eti}</p>
              <p className="mt-3 text-2xl font-medium text-white sm:text-3xl">{l.txt}</p>
            </div>
          ))}
        </div>

        {/* ---- Cierre: la obra gruesa terminada --------------------------- */}
        <div ref={cierreRef} inert className="sombra-texto pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-24 opacity-0 sm:px-12 lg:px-16">
          {/* En el teléfono el edificio llena la pantalla y el texto lo pisaba:
              ahí va en vidrio. En escritorio el sujeto ya quedó a la derecha. */}
          <div className="max-sm:rounded-2xl max-sm:border max-sm:border-white/10 max-sm:bg-black/60 max-sm:p-6 max-sm:backdrop-blur-md">
          <p className="etiqueta text-iso-sky">Obra gruesa · Modelo IFC</p>
          <h2 className="titulo-degradado mt-4 max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
            El programa, visualizado
            <br />
            antes del inicio de obra.
          </h2>
          <a href="#contacto" className="boton-principal mt-8">
            Solicitar demostración
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </a>
          </div>
        </div>

        {/* ---- HUD: semana, contador, ciclos y línea de tiempo ------------ */}
        {/* El HUD va en vidrio oscuro: cuando el edificio pasa por detrás, un
            número gris sobre casas grises desaparecía. */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 sm:px-8 sm:pb-8 lg:px-12" aria-hidden="true">
          <div className="rounded-2xl border border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-6 sm:gap-8">
              <div>
                <p className="etiqueta">Semana<span className="max-sm:hidden"> del</span></p>
                <p ref={fechaRef} className="mt-2 whitespace-nowrap font-mono text-base text-white sm:text-2xl">
                  {fmtCorta(lunesDe(fechaDelDia(datos.dias[iInicial])))}
                </p>
              </div>
              <div>
                <p className="etiqueta">Elementos<span className="max-sm:hidden"> levantados</span></p>
                <p className="mt-2 whitespace-nowrap font-mono text-base text-white sm:text-2xl">
                  <span ref={contadorRef} className="tabular-nums">{fmtNumero.format(datos.levantados[iInicial])}</span>
                  <span className="text-texto-4"> / {total}</span>
                </p>
              </div>
            </div>
            <div className="max-sm:w-full">
              <p className="etiqueta text-right max-sm:hidden">Ciclos de hormigonado</p>
              <div ref={chipsRef} className="mt-3 flex justify-end gap-2 max-sm:mt-0 max-sm:justify-start">
                {datos.ciclos.map((c) => (
                  <span
                    key={c.color}
                    data-encendido={iInicial >= c.cuadro ? 'si' : 'no'}
                    className="h-3 w-6 rounded-full transition-all duration-700 ease-fluido data-[encendido=no]:scale-75 data-[encendido=no]:opacity-20"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* La línea de tiempo: el cabezal avanza con el scroll. */}
          <div className="relative mt-4 h-6">
            <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
            <div ref={cabezalRef} className={`absolute inset-x-0 top-0 h-px origin-left bg-iso-sky ${reducido ? '' : 'scale-x-0'}`} />
            {marcas.map((m) => (
              <span
                key={`${m.mes}-${m.x}`}
                className="absolute top-2 -translate-x-1/2 font-mono text-xs uppercase text-texto-4"
                style={{ left: `${m.x * 100}%` }}
              >
                {m.mes}
              </span>
            ))}
          </div>
          </div>
        </div>

      </div>
    </section>
  );
}

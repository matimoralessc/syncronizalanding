import { useState } from 'react';
import {
  Cube, FileArrowUp, LinkSimple, WhatsappLogo, Stack, CalendarDots,
  ChartLineUp, Truck, Camera, Microphone, Plus, Buildings, CheckCircle,
} from '@phosphor-icons/react';
import Revelar from './Revelar.jsx';
import Frase from './Frase.jsx';
import VideoBucle from './VideoBucle.jsx';

// Las cifras de esta página salen de la obra Panorámica tal como está cargada
// en el visor 4D de producción (octubre 2026). No son redondeos de marketing:
// si cambian en la obra, se cambian acá.
const OBRA = {
  tareas: '1.756',
  elementos: '2.918',
  partidasVinculadas: '114',
  modelos: '6',
  semanas: '83',
};

function Encabezado({ etiqueta, titulo, children, centrado = false }) {
  return (
    <div className={centrado ? 'mx-auto max-w-[680px] text-center' : 'max-w-[680px]'}>
      <Revelar as="p" className="etiqueta text-iso-sky">{etiqueta}</Revelar>
      <Revelar as="h2" retraso={80} className="titulo-degradado mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        {titulo}
      </Revelar>
      {children && (
        <Revelar as="p" retraso={160} className="mt-6 text-lg text-texto-2">{children}</Revelar>
      )}
    </div>
  );
}

// Marco de los videos: tarjeta de 16px de radio con 8px de aire, así que el
// video adentro va a 8px (radio interno = externo menos el aire, B3).
function Marco({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-carbon p-2 ${className}`}>
      <div className="overflow-hidden rounded-lg">{children}</div>
    </div>
  );
}

// ─── Prueba ────────────────────────────────────────────────────────────────
export function Prueba() {
  const datos = [
    { n: OBRA.tareas, t: 'tareas en el programa de MS Project' },
    { n: OBRA.elementos, t: 'elementos del modelo vinculados a su partida' },
    { n: OBRA.modelos, t: 'modelos federados en una sola vista' },
    { n: OBRA.semanas, t: 'semanas de obra, de julio 2026 a febrero 2028' },
  ];
  return (
    <section aria-label="En obra hoy" className="border-y border-white/10 bg-negro">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-12 lg:grid-cols-12 lg:items-center lg:px-16">
        <Revelar className="lg:col-span-4">
          <p className="etiqueta">En obra hoy</p>
          <img
            src="/logo-inspira-blanco.png"
            alt="Constructora Inspira"
            width={438}
            height={126}
            className="mt-6 h-10 w-auto opacity-80"
          />
          <p className="mt-6 text-base text-texto-3">
            Panorámica, de Constructora Inspira. El edificio que se levanta arriba es
            esta obra, grabada en el visor de Syncroniza 4D.
          </p>
        </Revelar>
        <dl className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-4">
          {datos.map((d, i) => (
            <Revelar key={d.t} retraso={i * 80} className="border-t border-white/10 pt-6">
              <dt className="sr-only">{d.t}</dt>
              <dd className="font-mono text-4xl font-medium tabular-nums text-white">{d.n}</dd>
              <dd className="mt-2 text-sm text-texto-3">{d.t}</dd>
            </Revelar>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ─── Frase ─────────────────────────────────────────────────────────────────
export function FraseCentral() {
  return (
    <section aria-label="Qué hace Syncroniza" className="bg-negro">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:px-12">
        <Frase
          className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          texto="Lo que el terreno reporta en la mañana, la oficina lo ve sobre el modelo antes de almuerzo."
        />
      </div>
    </section>
  );
}

// ─── Cómo funciona ─────────────────────────────────────────────────────────
export function ComoFunciona() {
  const pasos = [
    {
      icono: FileArrowUp,
      titulo: 'Sube el modelo y el programa',
      texto: 'El IFC que exporta Revit y el XML de MS Project. Son los archivos que tu oficina técnica ya tiene: no se dibuja ni se programa nada de nuevo.',
    },
    {
      icono: LinkSimple,
      titulo: 'Vincula cada elemento con su partida',
      texto: `El visor detecta los ciclos de hormigonado y te sugiere los vínculos. En Panorámica son ${OBRA.elementos} elementos en ${OBRA.partidasVinculadas} partidas.`,
    },
    {
      icono: WhatsappLogo,
      titulo: 'El terreno reporta y el modelo se pinta',
      texto: 'El capataz manda fotos, audios y guías por WhatsApp. El avance real queda en el modelo, en la curva S y en el informe de la semana.',
    },
  ];
  return (
    <section id="como-funciona" className="bg-negro">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 lg:px-16">
        <Encabezado etiqueta="Cómo funciona" titulo="Tres pasos y la obra queda al día">
          Sin cambiar de herramientas: tu programa sigue en MS Project, tu modelo en
          Revit y tu equipo en WhatsApp. Syncroniza los junta.
        </Encabezado>
        <ol className="mt-16 grid gap-4 lg:grid-cols-3">
          {pasos.map((p, i) => (
            <Revelar as="li" key={p.titulo} retraso={i * 120} className="group rounded-2xl border border-white/10 bg-carbon p-8 transition-colors duration-700 ease-fluido hover:border-white/20 hover:bg-grafito">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-negro text-iso-sky transition-transform duration-700 ease-fluido group-hover:-translate-y-1">
                  <p.icono size={24} aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-texto-4">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-white">{p.titulo}</h3>
              <p className="mt-3 text-base text-texto-3">{p.texto}</p>
            </Revelar>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Escena: texto + video ─────────────────────────────────────────────────
function Escena({ id, etiqueta, titulo, texto, puntos, leyenda, media, invertida = false }) {
  return (
    <section id={id} className="bg-negro">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 sm:px-12 lg:grid-cols-12 lg:gap-16 lg:px-16">
        <div className={`lg:col-span-5 ${invertida ? 'lg:order-2' : ''}`}>
          <Encabezado etiqueta={etiqueta} titulo={titulo}>{texto}</Encabezado>
          {leyenda && (
            <Revelar retraso={200} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {leyenda.map((l) => (
                <span key={l.t} className="flex items-center gap-2 text-sm text-texto-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: l.c, opacity: l.o ?? 1 }} />
                  {l.t}
                </span>
              ))}
            </Revelar>
          )}
          {puntos && (
            <ul className="mt-8 space-y-4">
              {puntos.map((p, i) => (
                <Revelar as="li" key={p.t} retraso={240 + i * 80} className="flex gap-4">
                  <p.icono size={20} className="mt-0.5 shrink-0 text-iso-sky" aria-hidden="true" />
                  <span className="text-base text-texto-2">
                    <strong className="font-semibold text-white">{p.t}.</strong> {p.d}
                  </span>
                </Revelar>
              ))}
            </ul>
          )}
        </div>
        <Revelar retraso={120} className={`lg:col-span-7 ${invertida ? 'lg:order-1' : ''}`}>
          {media}
        </Revelar>
      </div>
    </section>
  );
}

export function CuatroD() {
  return (
    <Escena
      id="cuatro-d"
      etiqueta="Planificación 4D"
      titulo="Elige una fecha y el modelo muestra la obra de ese día"
      texto="Lo que ya se hormigonó tiene el color de su ciclo, lo que está en curso aparece en gris y lo que viene todavía no existe. Es el programa, pero se entiende de un vistazo."
      puntos={[
        { icono: CalendarDots, t: 'Por semana, ciclo o partida', d: 'El deslizador recorre la obra día por día, y el programa queda al lado para ubicar cada tarea.' },
        { icono: Stack, t: 'Modelos federados', d: `Estructura, casas, soil nailing y urbanización en una sola vista: en Panorámica conviven ${OBRA.modelos} modelos.` },
        { icono: Cube, t: 'Hormigón cubicado del modelo', d: 'Los m³ por ciclo salen del IFC y alimentan la curva S de hormigón.' },
      ]}
      media={(
        <Marco>
          <VideoBucle src="/4d/ciclos.mp4" poster="/4d/ciclos-poster.webp" ancho={1920} alto={1080} etiqueta="Ciclos de hormigonado de Panorámica en el visor 4D" />
        </Marco>
      )}
    />
  );
}

export function Avance() {
  return (
    <Escena
      id="avance"
      invertida
      etiqueta="Avance real"
      titulo="Lo programado contra lo real, pintado sobre el modelo"
      texto="Con un clic el modelo deja de mostrar el plan y muestra la obra como va. Así está Panorámica hoy: su obra gruesa parte en noviembre, por eso el edificio sigue en gris. Cuando el terreno reporte, cada partida toma su color."
      leyenda={[
        { c: '#22c55e', t: 'Terminada' },
        { c: '#ECC94B', t: 'En curso' },
        { c: '#E53E3E', t: 'Atrasada' },
        { c: '#888888', t: 'Sin empezar', o: 0.5 },
      ]}
      puntos={[
        { icono: ChartLineUp, t: 'Curva S y SPI al día', d: 'El mismo avance alimenta el valor ganado: programado, real y la variación de plazo.' },
        { icono: CheckCircle, t: 'Semanas que no se reescriben', d: 'Una semana pasada solo la corrige un administrador, con motivo, y queda el historial de quién y cuándo.' },
      ]}
      media={(
        // Foto y no video: hoy el modo avance de Panorámica es un edificio
        // entero en gris (la obra gruesa todavía no parte) y girarlo no cuenta
        // nada más. Cuando la obra avance se regraba con el estudio.
        <figure>
          <Marco>
            <img
              src="/4d/avance-hoy.webp"
              alt="Panorámica en modo avance real: el edificio en gris, sin partidas iniciadas"
              width={1280}
              height={720}
              loading="lazy"
              className="block h-auto w-full"
            />
          </Marco>
          <figcaption className="mt-3 font-mono text-xs text-texto-4">
            Panorámica en modo avance real, 11 de octubre de 2026.
          </figcaption>
        </figure>
      )}
    />
  );
}

export function Terreno() {
  return (
    <Escena
      id="terreno"
      etiqueta="Canal de terreno"
      titulo="El capataz reporta por WhatsApp, sin instalar nada"
      texto="Una foto de la guía de despacho basta. Syncroniza lee proveedor, m³, hora y elemento, la cruza con el ciclo programado y avisa si algo no calza."
      puntos={[
        { icono: Camera, t: 'Fotos clasificadas', d: 'Cada foto queda asociada a su partida, ciclo y nivel.' },
        { icono: Microphone, t: 'Audios transcritos', d: 'Lo que se dice en terreno queda como texto que se puede buscar.' },
        { icono: Truck, t: 'Guías de hormigón leídas', d: 'm³, proveedor, hora de llegada y elemento vaciado, sin tipear.' },
      ]}
      media={(
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-carbon p-2">
          <div className="overflow-hidden rounded-2xl">
            <VideoBucle src="/hormigon-demo.mp4" poster="/hormigon-poster.jpg" ancho={540} alto={960} etiqueta="Un capataz reporta una guía de hormigón por WhatsApp" />
          </div>
        </div>
      )}
    />
  );
}

// ─── Preguntas ─────────────────────────────────────────────────────────────
const PREGUNTAS = [
  { p: '¿Necesito el modelo BIM completo para partir?', r: 'No. Con el programa de MS Project ya partes con el control de avance, la curva S y el Last Planner. El 4D se suma cuando tengas el IFC, aunque sea solo la estructura.' },
  { p: '¿Qué archivos hay que entregar?', r: 'El IFC que exporta Revit u otro software BIM, y el XML de MS Project. Si programas en Primavera, se exporta a XML de MS Project.' },
  { p: '¿El equipo de terreno tiene que instalar algo?', r: 'No. El capataz reporta por el WhatsApp que ya usa: fotos, audios y guías de despacho. Syncroniza ordena cada mensaje por partida y ciclo.' },
  { p: '¿Reemplaza a MS Project?', r: 'No. Sigues programando donde programas. Syncroniza importa el programa y lo exporta de vuelta en XML cuando lo necesitas.' },
  { p: '¿Sirve para una obra que ya empezó?', r: 'Sí. Al importar el programa se toma el avance que trae a su fecha de estado, y la curva S parte desde ahí.' },
  { p: '¿Funciona con varios modelos?', r: `Sí. El visor federa modelos: en Panorámica conviven ${OBRA.modelos}, entre edificio, casas, soil nailing, pavimentación, alcantarillado y aguas lluvia.` },
  { p: '¿Cuánto toma partir?', r: 'El piloto parte en una obra, no en toda la constructora. Cargamos tu programa y tu modelo, y el equipo sigue trabajando como hoy mientras tanto.' },
  { p: '¿Cuánto cuesta?', r: 'Depende del tamaño de la obra y de los módulos que uses. Te lo cotizamos en la demo, con tu obra sobre la mesa.' },
];

// Datos estructurados para buscadores y asistentes (A7 de la skill), armados
// desde la misma lista que se muestra: si se edita una respuesta acá, el
// esquema no queda desfasado.
const ESQUEMA_PREGUNTAS = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PREGUNTAS.map((q) => ({
    '@type': 'Question',
    name: q.p,
    acceptedAnswer: { '@type': 'Answer', text: q.r },
  })),
});

export function Preguntas() {
  const [abierta, setAbierta] = useState(0);
  return (
    <section id="preguntas" className="bg-negro">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ESQUEMA_PREGUNTAS }} />
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-12">
        <Encabezado etiqueta="Preguntas" titulo="Lo que nos preguntan antes de partir" centrado />
        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {PREGUNTAS.map((q, i) => {
            const abiertaEsta = abierta === i;
            return (
              <Revelar key={q.p} retraso={i * 40} y={24}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setAbierta(abiertaEsta ? -1 : i)}
                    aria-expanded={abiertaEsta}
                    aria-controls={`respuesta-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium text-white transition-colors duration-300 ease-fluido hover:text-texto-2"
                  >
                    {q.p}
                    <Plus size={20} aria-hidden="true" className={`shrink-0 text-texto-3 transition-transform duration-700 ease-fluido ${abiertaEsta ? 'rotate-45' : ''}`} />
                  </button>
                </h3>
                {/* grid-rows 0fr→1fr anima el alto real sin medirlo en JS. */}
                <div
                  id={`respuesta-${i}`}
                  role="region"
                  className={`grid transition-all duration-700 ease-fluido ${abiertaEsta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 text-base text-texto-3">{q.r}</p>
                  </div>
                </div>
              </Revelar>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Contacto ──────────────────────────────────────────────────────────────
// El formulario no postea a ningún lado: arma el mensaje y abre el canal que el
// visitante elija. Sin backend y, sobre todo, sin el paso que hace que la gente
// no escriba: quedarse mirando un WhatsApp en blanco pensando cómo presentarse.
export function Contacto() {
  const [form, setForm] = useState({ nombre: '', empresa: '', obra: '', mensaje: '' });
  const [intentado, setIntentado] = useState(false);
  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errores = {
    nombre: form.nombre.trim() === '' ? 'Escribe tu nombre.' : null,
    empresa: form.empresa.trim() === '' ? 'Escribe el nombre de tu empresa.' : null,
  };
  const listo = !errores.nombre && !errores.empresa;

  const cuerpo = () => [
    `Hola, soy ${form.nombre.trim()} de ${form.empresa.trim()}.`,
    form.obra.trim() && `Obra: ${form.obra.trim()}.`,
    'Quiero ver una demo de Syncroniza.',
    form.mensaje.trim() && `\n${form.mensaje.trim()}`,
  ].filter(Boolean).join('\n');

  const irAWhatsapp = (e) => {
    e.preventDefault();
    setIntentado(true);
    if (!listo) return;
    window.open(`https://wa.me/56975114550?text=${encodeURIComponent(cuerpo())}`, '_blank', 'noopener,noreferrer');
  };
  const irAMail = () => {
    setIntentado(true);
    if (!listo) return;
    const asunto = `Demo Syncroniza · ${form.empresa.trim()}`;
    window.location.href = `mailto:contacto@syncroniza.cl?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo())}`;
  };

  return (
    <section id="contacto" className="border-t border-white/10 bg-negro">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-12 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <Encabezado etiqueta="Demo" titulo="¿Vemos tu obra en 4D?">
            Treinta minutos con Panorámica en vivo: el 4D, el avance real y el canal de
            WhatsApp. Después vemos qué necesita tu obra para partir.
          </Encabezado>
          <Revelar as="ul" retraso={240} className="mt-8 space-y-3">
            {[
              'No hay que dejar MS Project: se importa el programa que ya tienes.',
              'El piloto parte en una obra, no en toda la constructora.',
              'El capataz no instala nada: usa el WhatsApp que ya tiene.',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-base text-texto-2">
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-iso-sky" aria-hidden="true" />
                {t}
              </li>
            ))}
          </Revelar>
        </div>

        <Revelar retraso={120} className="lg:col-span-7">
          <form onSubmit={irAWhatsapp} noValidate className="rounded-3xl border border-white/10 bg-carbon p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id="nombre" etiqueta="Nombre" autoComplete="name" valor={form.nombre} alCambiar={campo('nombre')} error={intentado && errores.nombre} />
              <Campo id="empresa" etiqueta="Empresa" autoComplete="organization" valor={form.empresa} alCambiar={campo('empresa')} error={intentado && errores.empresa} />
            </div>
            <div className="mt-6">
              <Campo id="obra" etiqueta="Obra" opcional valor={form.obra} alCambiar={campo('obra')} />
            </div>
            <div className="mt-6">
              <label htmlFor="mensaje" className="text-sm font-medium text-texto-2">
                Qué quieres resolver <span className="text-texto-4">(opcional)</span>
              </label>
              <textarea
                id="mensaje"
                rows={3}
                value={form.mensaje}
                onChange={campo('mensaje')}
                placeholder="Ej: no sé cuánto hormigón llegó realmente a la obra esta semana."
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-negro px-4 py-3 text-base text-white placeholder:text-texto-4 transition-colors duration-300 ease-fluido focus:border-iso-sky focus:outline-none"
              />
            </div>
            <button type="submit" className="boton-principal mt-8 w-full">
              <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
              Abrir WhatsApp con el mensaje listo
            </button>
            <p className="mt-4 text-center text-sm text-texto-3">
              ¿Prefieres correo?{' '}
              <button type="button" onClick={irAMail} className="font-medium text-white underline underline-offset-4 transition-colors duration-300 hover:text-iso-sky">
                contacto@syncroniza.cl
              </button>
            </p>
            <p className="mt-2 text-center text-xs text-texto-4">Se abre con tus datos escritos. Tú decides cuándo enviar.</p>
          </form>
        </Revelar>
      </div>
    </section>
  );
}

function Campo({ id, etiqueta, valor, alCambiar, error, opcional = false, autoComplete = 'off' }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-texto-2">
        {etiqueta} {opcional && <span className="text-texto-4">(opcional)</span>}
      </label>
      <input
        id={id}
        type="text"
        value={valor}
        onChange={alCambiar}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full rounded-xl border bg-negro px-4 py-3 text-base text-white transition-colors duration-300 ease-fluido focus:outline-none ${error ? 'border-ciclo-rojo focus:border-ciclo-rojo' : 'border-white/10 focus:border-iso-sky'}`}
      />
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-ciclo-rojo">{error}</p>}
    </div>
  );
}

// ─── Pie ───────────────────────────────────────────────────────────────────
export function Pie() {
  return (
    <footer className="border-t border-white/10 bg-negro">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-12 lg:px-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <a href="#inicio" className="flex items-center gap-2">
              <img src="/syncroniza-isotipo.png" alt="" width={16} height={28} className="h-8 w-auto" />
              <span className="text-lg font-semibold text-white">Syncroniza</span>
            </a>
            <p className="mt-4 max-w-sm text-sm text-texto-3">
              Programación, avance y control de obra sobre el modelo. Hecho en Chile, para la obra chilena.
            </p>
          </div>
          <nav aria-label="Pie" className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
            <div>
              <p className="etiqueta">Producto</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#cuatro-d">Planificación 4D</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#avance">Control de avance</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#costos">Costos</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#hormigon">Hormigón</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#last-planner">Last Planner</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#terreno">Canal de terreno</a></li>
              </ul>
            </div>
            <div>
              <p className="etiqueta">Empresa</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a className="text-texto-2 transition-colors hover:text-white" href="#contacto">Agenda una demo</a></li>
              </ul>
            </div>
            <div>
              <p className="etiqueta">Contacto</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a className="text-texto-2 transition-colors hover:text-white" href="mailto:contacto@syncroniza.cl">contacto@syncroniza.cl</a></li>
                <li><a className="text-texto-2 transition-colors hover:text-white" href="https://wa.me/56975114550" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li className="text-texto-3">Santiago, Chile</li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-texto-4 sm:flex-row">
          <p>© 2026 Syncroniza</p>
          <p className="flex items-center gap-2"><Buildings size={14} aria-hidden="true" /> Grabaciones reales del producto, con datos de obra.</p>
        </div>
      </div>
    </footer>
  );
}

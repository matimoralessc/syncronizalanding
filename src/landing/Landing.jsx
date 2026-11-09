import { useEffect, useState } from 'react';
import Nav from './Nav.jsx';
import Heroe from './Heroe.jsx';
import Capitulo from './Capitulo.jsx';
import Prueba4D from './Prueba4D.jsx';
import { FraseCentral, Contacto, Pie } from './Secciones.jsx';

// La landing es el 4D y las animaciones (9-nov-2026, Matías: «ármala con el
// 4D y las escenas»). Del rediseño de octubre solo gustó el héroe movido por
// el scroll; las secciones con tarjetas no. Ahora el relato son capítulos: un
// título corto y una escena que avanza con el scroll, módulo por módulo, y al
// final la demo. Las escenas usan obras y datos de ejemplo y lo dicen.
const CAPITULOS = [
  {
    id: 'obras', escena: 'ciudad', etiqueta: 'Una plataforma',
    titulo: 'Todas tus obras, en el mismo lugar.',
    texto: 'Programa, avance, costos y terreno de cada obra, con los mismos números para la oficina técnica, la gerencia y el mandante.',
  },
  {
    id: 'cuatro-d', escena: 'torre', etiqueta: 'Syncroniza 4D',
    titulo: 'La obra se construye antes en la pantalla.',
    texto: 'El modelo BIM unido al programa: cada ciclo de hormigonado, piso por piso y semana a semana, con la grúa donde va a estar.',
  },
  {
    id: 'avance', escena: 'curva-s', etiqueta: 'Control de avance',
    titulo: 'Programado contra real, sin esperar el informe del mes.',
    texto: 'La toma de avance de cada semana dibuja la Curva S y el SPI apenas se registra. La brecha se ve cuando todavía se puede corregir.',
  },
  {
    id: 'costos', escena: 'costos', etiqueta: 'Costos',
    titulo: 'Cada peso contra su presupuesto.',
    texto: 'Centros de costo, facturas que llegan solas desde iConstruye y el resultado proyectado de cada familia, con aprobación por niveles para cambiar un monto.',
  },
  {
    id: 'hormigon', escena: 'hormigon', etiqueta: 'Hormigón',
    titulo: 'Cada guía de despacho, en su lugar.',
    texto: 'La foto de la guía llega por WhatsApp, la lee la IA y los m³ quedan contra lo planificado en el modelo.',
  },
  {
    id: 'last-planner', escena: 'last-planner', etiqueta: 'Last Planner',
    titulo: 'Compromisos que se cumplen.',
    texto: 'El PPC semana a semana, las restricciones con responsable y fecha, y las causas de lo que no se cumplió.',
  },
  {
    id: 'terreno', escena: 'whatsapp', etiqueta: 'Terreno',
    titulo: 'El terreno reporta por WhatsApp.',
    texto: 'Restricciones dichas como se habla, guías por foto y un agente que responde lo que preguntes de la obra. Sin instalar nada.',
  },
];

export default function Landing() {
  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = () => setReducido(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  return (
    <>
      <Nav />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <Heroe reducido={reducido} />
        <Prueba4D />
        <FraseCentral />
        {CAPITULOS.map((c) => <Capitulo key={c.id} {...c} reducido={reducido} />)}
        <Contacto />
      </main>
      <Pie />
    </>
  );
}

import { useEffect, useState } from 'react';
import Nav from './Nav.jsx';
import Heroe from './Heroe.jsx';
import Prueba4D from './Prueba4D.jsx';
import Herramientas4D from './Herramientas4D.jsx';
import ControlObra from './ControlObra.jsx';
import Terreno from './Terreno.jsx';
import Agente from './Agente.jsx';
import PorQue from './PorQue.jsx';
import { Prueba, FraseCentral, ComoFunciona, Contacto, Pie } from './Secciones.jsx';

// La landing (9-nov-2026, segunda vuelta): «el scroll es muy largo, hay que
// achicar la página y sectorizar mejor». El héroe con el 4D de Panorámica, la
// obra en curso (Inspira), un 4D que se manipula, la suite en pestañas, el
// agente Syncroniza con un chat de prueba, el canal de terreno, por qué
// Syncroniza, cómo se parte y la demo. Lo de la landing publicada de Pedro se
// mantiene: su posicionamiento, la suite, la app de salud de obra, el −12 % de
// hormigón y «Por qué Syncroniza». Las animaciones usan datos de ejemplo.
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
        <Prueba />
        <Prueba4D />
        <Herramientas4D />
        <ControlObra />
        <Agente />
        <Terreno />
        <FraseCentral />
        <PorQue />
        <ComoFunciona />
        <Contacto />
      </main>
      <Pie />
    </>
  );
}

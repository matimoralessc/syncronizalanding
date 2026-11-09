import { useEffect, useState } from 'react';
import Nav from './Nav.jsx';
import Heroe from './Heroe.jsx';
import Prueba4D from './Prueba4D.jsx';
import ControlObra from './ControlObra.jsx';
import Terreno from './Terreno.jsx';
import { FraseCentral, ComoFunciona, Contacto, Pie } from './Secciones.jsx';

// La landing (9-nov-2026, segunda vuelta): «el scroll es muy largo, hay que
// achicar la página y sectorizar mejor». El héroe con el 4D de Panorámica, un
// 4D que se manipula, los cuatro módulos de control en una sección con
// pestañas, el canal de terreno, cómo se parte y la demo. Las animaciones usan
// obras y datos de ejemplo y lo dicen.
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
        <ControlObra />
        <Terreno />
        <ComoFunciona />
        <Contacto />
      </main>
      <Pie />
    </>
  );
}

import { useEffect, useState } from 'react';
import Nav from './Nav.jsx';
import Heroe from './Heroe.jsx';
import { Prueba, FraseCentral, ComoFunciona, CuatroD, Avance, Terreno, Preguntas, Contacto, Pie } from './Secciones.jsx';

// Relato largo (layout B de la skill): es software B2B para constructoras y
// hay que mostrar antes de pedir. El orden es el argumento:
//   1. el 4D levantando Panorámica (lo que no se puede explicar con texto),
//   2. quién lo usa y con qué números, 3. la frase que lo resume,
//   4. cómo se parte, 5. cada módulo con su grabación, 6. las dudas, 7. la demo.
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
        <FraseCentral />
        <ComoFunciona />
        <CuatroD />
        <Avance />
        <Terreno />
        <Preguntas />
        <Contacto />
      </main>
      <Pie />
    </>
  );
}

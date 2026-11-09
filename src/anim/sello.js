// El sello de Syncroniza: isotipo + "Syncroniza" en Geist, el mismo de la
// barra de la landing. Lo llevan todas las piezas, en el mismo lugar de la
// cabecera, para que un video suelto (reenviado, recortado) siga diciendo de
// quién es.
export const ISOTIPO = '/isotipo.png';
const PROPORCION = 1162 / 2036; // ancho / alto del isotipo

// Precarga: el sello se ve desde el primer cuadro, así que el exportador
// espera a que la imagen esté decodificada antes de capturar.
export const isotipoListo = (() => {
  if (typeof Image === 'undefined') return Promise.resolve(); // en node (scripts de sonido) no hay imágenes
  const img = new Image();
  img.src = ISOTIPO;
  return img.decode().catch(() => {});
})();

const NS = 'http://www.w3.org/2000/svg';

// Versión SVG (escenas de datos). (x, y) es la esquina superior izquierda y
// `alto` el del isotipo; el nombre va a 0,6 de esa altura, como en la landing.
export function selloSVG(padre, { x, y, alto = 44 }) {
  const g = document.createElementNS(NS, 'g');
  const img = document.createElementNS(NS, 'image');
  const ancho = alto * PROPORCION;
  for (const [k, v] of Object.entries({ href: ISOTIPO, x, y, width: ancho, height: alto })) img.setAttribute(k, v);
  const t = document.createElementNS(NS, 'text');
  const letra = alto * 0.6;
  for (const [k, v] of Object.entries({ x: x + ancho + alto * 0.3, y: y + alto / 2 + letra * 0.36, fill: '#ffffff', 'font-size': letra, 'font-weight': 600, 'letter-spacing': -0.2 })) t.setAttribute(k, v);
  t.textContent = 'Syncroniza';
  g.append(img, t);
  padre.appendChild(g);
  return g;
}

// Versión HTML (HUD 3D, marco de LinkedIn, tarjetas). Se dimensiona con el
// font-size de donde se ponga: el isotipo mide 1,7 veces la letra.
export const selloHTML = () => `<span class="sello"><img src="${ISOTIPO}" alt="">Syncroniza</span>`;

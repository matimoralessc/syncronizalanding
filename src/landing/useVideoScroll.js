import { useEffect, useRef } from 'react';

// Video que avanza con el scroll: el scroll no reproduce, MUEVE el tiempo.
//
// Es un port del motor de la skill scroll-world (references/scrub-engine.js)
// reducido a un solo clip, con sus arreglos que costaron caro:
//
// - El clip se baja como Blob y se reproduce desde memoria. Muchos hostings no
//   responden a pedidos por rango de bytes y entonces `video.seekable` queda en
//   [0,0]: cada búsqueda vuelve al cuadro 0 y el video parece congelado. Un blob
//   siempre se puede recorrer.
// - Nunca se pide un cuadro nuevo mientras el decodificador sigue buscando el
//   anterior. En un teléfono, un scroll rápido apilaba búsquedas y el video se
//   quedaba pegado; así salta al último pedido apenas queda libre.
// - En iOS un video mudo que nunca se reprodujo no pinta el cuadro buscado: se
//   "despierta" con play→pause en el primer toque, y el póster no se saca hasta
//   que el video pintó de verdad.
// - En pantallas táctiles la barra de URL dispara `resize` al aparecer y
//   desaparecer; se ignoran los cambios que son solo de alto.
//
// El progreso NO pasa por el estado de React: se entrega a `alProgreso` dentro
// del mismo cuadro de animación, y quien lo recibe escribe directo en el DOM.
// Re-renderizar la página 60 veces por segundo para mover un contador sería
// pagar el layout entero por un número.
export function useVideoScroll({ src, srcMovil, alProgreso, reducido }) {
  const seccionRef = useRef(null);
  const videoRef = useRef(null);
  const posterRef = useRef(null);
  const alProgresoRef = useRef(alProgreso);
  alProgresoRef.current = alProgreso;

  useEffect(() => {
    const seccion = seccionRef.current;
    const video = videoRef.current;
    if (!seccion) return undefined;

    const tactil = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    // Dos preguntas distintas. Qué video bajar depende de la FORMA de la
    // pantalla: una tablet horizontal tiene que ver la toma horizontal, no la
    // vertical recortada. Cuánta precisión pedirle al decodificador depende de
    // si es un teléfono (táctil): ahí cada búsqueda cuesta más.
    const pantallaVertical = () => window.innerWidth <= 860 || window.innerHeight > window.innerWidth;
    const esMovil = () => tactil || pantallaVertical();
    const limitar = (x) => Math.min(1, Math.max(0, x));

    let inicio = 0;
    let recorrido = 1;
    let anchoMedido = window.innerWidth;
    let objetivo = 0;
    let actual = 0;
    let listo = false;
    let urlBlob = null;
    let vivo = true;
    let raf = 0;
    let pidiendoLectura = false;
    let ultimoEmitido = -1;

    const medir = () => {
      anchoMedido = window.innerWidth;
      const r = seccion.getBoundingClientRect();
      inicio = r.top + window.scrollY;
      // La sección mide N pantallas; el escenario fijo ocupa una. El progreso
      // va de 0 a 1 en las N-1 restantes.
      recorrido = Math.max(1, seccion.offsetHeight - window.innerHeight);
      leer();
    };

    const leer = () => {
      pidiendoLectura = false;
      objetivo = limitar((window.scrollY - inicio) / recorrido);
      if (reducido) emitir(objetivo);
    };

    const emitir = (p) => {
      if (Math.abs(p - ultimoEmitido) < 0.0005) return;
      ultimoEmitido = p;
      alProgresoRef.current?.(p);
    };

    const alScroll = () => {
      if (pidiendoLectura) return;
      pidiendoLectura = true;
      requestAnimationFrame(leer);
    };

    const alResize = () => {
      if (tactil && window.innerWidth === anchoMedido) return;
      medir();
    };

    const cuadro = () => {
      if (!vivo) return;
      // Suavizado: el video persigue al scroll en vez de saltar. 0,16 por cuadro
      // es lo que usa scroll-world; más alto se siente brusco con la rueda.
      actual += (objetivo - actual) * 0.16;
      if (Math.abs(objetivo - actual) < 0.0004) actual = objetivo;
      emitir(actual);
      if (listo && video && !video.seeking) {
        const t = limitar(actual) * 0.999 * (video.duration || 1);
        const eps = esMovil() ? 0.02 : 0.008;
        if (Math.abs(video.currentTime - t) > eps) {
          try { video.currentTime = t; } catch { /* el decodificador no estaba listo */ }
        }
      }
      raf = requestAnimationFrame(cuadro);
    };

    let usuarioListo = false;
    const despertar = () => {
      if (!video || !esMovil()) return;
      try {
        const p = video.play();
        if (p && p.then) p.then(() => video.pause()).catch(() => {});
      } catch { /* sin gesto todavía */ }
    };
    const primerGesto = () => {
      if (usuarioListo) return;
      usuarioListo = true;
      despertar();
    };

    if (!reducido && video) {
      const url = pantallaVertical() && srcMovil ? srcMovil : src;
      fetch(url)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status}`))))
        .then((blob) => {
          if (!vivo) return;
          urlBlob = URL.createObjectURL(blob);
          video.addEventListener('loadedmetadata', () => { listo = true; }, { once: true });
          video.addEventListener('loadeddata', () => {
            try { video.pause(); } catch { /* noop */ }
            if (usuarioListo) despertar();
          }, { once: true });
          // El póster se va recién cuando hay un cuadro pintado (ver iOS arriba).
          video.addEventListener('seeked', () => {
            posterRef.current?.classList.add('opacity-0');
          }, { once: true });
          video.src = urlBlob;
        })
        .catch(() => { /* sin video queda el póster: la página sigue entera */ });
    }

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alResize);
    window.addEventListener('orientationchange', medir);
    window.addEventListener('pointerdown', primerGesto, { once: true, passive: true });
    window.addEventListener('touchstart', primerGesto, { once: true, passive: true });
    window.addEventListener('load', medir);
    medir();
    if (!reducido) raf = requestAnimationFrame(cuadro);

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', alScroll);
      window.removeEventListener('resize', alResize);
      window.removeEventListener('orientationchange', medir);
      window.removeEventListener('pointerdown', primerGesto);
      window.removeEventListener('touchstart', primerGesto);
      window.removeEventListener('load', medir);
      if (urlBlob) URL.revokeObjectURL(urlBlob);
    };
  }, [src, srcMovil, reducido]);

  return { seccionRef, videoRef, posterRef };
}

// Lee prefers-reduced-motion una vez y lo sigue si el usuario lo cambia.
export function leerMovimientoReducido() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

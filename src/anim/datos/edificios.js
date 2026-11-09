// Generador de edificios "BIM" por código.
//
// Cada edificio sale de una especificación: subterráneos, zócalo, torre (con
// balcones, testeros y retranqueos), núcleo, sala de máquinas y, si se pide,
// una fachada de vidrio que se monta después de la estructura. Cada elemento
// es una caja con su ciclo (sector) y sus fechas en semanas de obra, igual que
// un modelo IFC vinculado a un programa en Syncroniza 4D.

// Ventanas de un sector dentro de un nivel: primero lo vertical (pilares y
// muros) y después la losa de arriba, con los sectores traslapados.
function ventanas(inicioNivel, durNivel, sector, sectores) {
  const paso = durNivel / (sectores + 1);
  const ini = inicioNivel + sector * paso;
  const largo = paso * 2;
  return { vertical: [ini, ini + largo * 0.5], losa: [ini + largo * 0.45, ini + largo] };
}

// Grilla de pilares dentro de una planta: luces de ~7,5 m en x y ~8 m en z.
function grilla(largo, ancho, margen = 0) {
  const nx = Math.max(2, Math.round(largo / 7.5) + 1);
  const nz = Math.max(2, Math.round(ancho / 8) + 1);
  const xs = Array.from({ length: nx }, (_, i) => -largo / 2 + margen + (i * (largo - 2 * margen)) / (nx - 1));
  const zs = Array.from({ length: nz }, (_, i) => -ancho / 2 + margen + (i * (ancho - 2 * margen)) / (nz - 1));
  return { xs, zs };
}

export function construirEdificio(spec) {
  const {
    nombre = 'Edificio', origen = [0, 0], sectores = 4, paleta = 0,
    inicio = 10.5, excavacion = null, fundacion = null,
    sub = null, zocalo = null, torre = null, nucleo = [[-2.1, 3.6, 5.2], [2.1, 3.6, 5.2]],
    techo = { w: 8.8, h: 3.2, d: 6.2, dur: 1.1 }, fachada = null,
  } = spec;
  const [ox, oz] = origen;
  const elementos = [];
  const push = (e) => elementos.push({ ...e, edificio: nombre, ciclo: (e.sector + paleta), volumen: e.caja.w * e.caja.h * e.caja.d,
    caja: { ...e.caja, x: e.caja.x + ox, z: e.caja.z + oz } });
  const sectorDeX = (x, largo) => Math.min(sectores - 1, Math.max(0, Math.floor(((x + largo / 2) / largo) * sectores)));

  // Niveles de abajo hacia arriba; el terreno está en y = 0.
  const niveles = [];
  const nSub = sub?.niveles ?? 0;
  let y = -nSub * (sub?.alto ?? 0);
  const fondoExcavacion = y - (nSub ? 0.6 : 0);
  const agregar = (tipo, cfg, i, nombreNivel) => { niveles.push({ tipo, cfg, y, id: `${nombre}:${nombreNivel}`, nombre: nombreNivel, i }); y += cfg.alto; };
  for (let i = 0; i < nSub; i++) agregar('sub', sub, i, `Subterráneo -${nSub - i}`);
  for (let i = 0; i < (zocalo?.niveles ?? 0); i++) agregar('zocalo', zocalo, i, `Piso ${i + 1}`);
  const pisosZocalo = zocalo?.niveles ?? 0;
  for (let i = 0; i < (torre?.niveles ?? 0); i++) agregar('torre', torre, i, `Piso ${pisosZocalo + i + 1}`);

  // Fundación (si hay subterráneos): losa de 60 cm en el fondo, por sectores.
  if (nSub && fundacion) {
    const [fIni, fFin] = fundacion;
    for (let s = 0; s < sectores; s++) {
      const largo = sub.largo / sectores;
      const d = (fFin - fIni) / sectores;
      push({ tipo: 'losa', nivel: `${nombre}:FUND`, sector: s, inicio: fIni + s * d * 0.8, fin: fIni + (s + 1) * d,
        caja: { x: -sub.largo / 2 + largo * (s + 0.5), y: fondoExcavacion + 0.3, z: 0, w: largo, h: 0.6, d: sub.ancho } });
    }
  }

  let t = inicio;
  for (const n of niveles) {
    const c = n.cfg;
    // Retranqueo: los últimos pisos de la torre se angostan.
    let { largo, ancho } = c;
    if (n.tipo === 'torre' && c.retranqueo && n.i >= c.retranqueo.desde) {
      largo *= c.retranqueo.factor;
      ancho *= c.retranqueo.factor;
    }
    const hVert = c.alto - c.losa;
    const v = (s) => ventanas(t, c.dur, s, sectores);

    const { xs, zs } = grilla(largo, ancho, n.tipo === 'sub' ? 4 : 0.6);
    for (const x of xs) for (const z of zs) {
      // Sin pilares dentro del núcleo.
      if (nucleo.some(([cx, w, d]) => Math.abs(x - cx) < w / 2 + 0.8 && Math.abs(z) < d / 2 + 0.8)) continue;
      const s = sectorDeX(x, largo);
      const [a, b] = v(s).vertical;
      push({ tipo: 'pilar', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x, y: n.y + hVert / 2, z, w: 0.6, h: hVert, d: 0.6 } });
    }

    if (n.tipo === 'sub' && c.muros !== false) {
      for (let s = 0; s < sectores; s++) {
        const lx = largo / sectores;
        const x = -largo / 2 + lx * (s + 0.5);
        const [a, b] = v(s).vertical;
        for (const z of [-ancho / 2, ancho / 2]) push({ tipo: 'muro', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x, y: n.y + hVert / 2, z, w: lx, h: hVert, d: 0.3 } });
        if (s === 0 || s === sectores - 1) {
          push({ tipo: 'muro', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x: s === 0 ? -largo / 2 : largo / 2, y: n.y + hVert / 2, z: 0, w: 0.3, h: hVert, d: ancho } });
        }
      }
    }

    if (n.tipo === 'torre' && c.testeros) {
      for (const [x, s] of [[-largo / 2, 0], [largo / 2, sectores - 1]]) {
        const [a, b] = v(s).vertical;
        push({ tipo: 'muro', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x, y: n.y + hVert / 2, z: 0, w: 0.25, h: hVert, d: ancho } });
      }
    }

    for (const [cx, w, d] of nucleo) {
      const s = sectorDeX(cx, largo);
      const [a, b] = v(s).vertical;
      const yy = n.y + hVert / 2, e = 0.25;
      push({ tipo: 'nucleo', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x: cx, y: yy, z: -d / 2, w, h: hVert, d: e } });
      push({ tipo: 'nucleo', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x: cx, y: yy, z: d / 2, w, h: hVert, d: e } });
      push({ tipo: 'nucleo', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x: cx + (cx < 0 ? -w / 2 : w / 2), y: yy, z: 0, w: e, h: hVert, d } });
    }

    const anchoLosa = n.tipo === 'torre' && c.balcon ? ancho + 2 * c.balcon : ancho;
    for (let s = 0; s < sectores; s++) {
      const lx = largo / sectores;
      const [a, b] = v(s).losa;
      push({ tipo: 'losa', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x: -largo / 2 + lx * (s + 0.5), y: n.y + c.alto - c.losa / 2, z: 0, w: lx, h: c.losa, d: anchoLosa } });
    }

    // Fachada de vidrio (terminaciones): paños por sector en las cuatro caras,
    // montados piso por piso cuando la estructura ya está arriba.
    if (fachada && n.tipo !== 'sub') {
      // Cada piso se vidria `desfase` semanas después de su estructura, nunca antes del inicio de la partida.
      const ini = Math.max(fachada.inicio, t + fachada.desfase);
      for (let s = 0; s < sectores; s++) {
        const lx = largo / sectores;
        const x = -largo / 2 + lx * (s + 0.5);
        const a = ini + s * fachada.porPiso * 0.25, b = a + fachada.porPiso;
        for (const z of [-ancho / 2 - 0.15, ancho / 2 + 0.15]) push({ tipo: 'vidrio', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x, y: n.y + hVert / 2, z, w: lx - 0.1, h: hVert - 0.05, d: 0.08 } });
      }
      for (const x of [-largo / 2 - 0.15, largo / 2 + 0.15]) {
        const s = x < 0 ? 0 : sectores - 1;
        const a = ini + s * fachada.porPiso * 0.25, b = a + fachada.porPiso;
        push({ tipo: 'vidrio', nivel: n.id, sector: s, inicio: a, fin: b, caja: { x, y: n.y + hVert / 2, z: 0, w: 0.08, h: hVert - 0.05, d: ancho - 0.1 } });
      }
    }
    t += c.dur;
  }

  // Sala de máquinas sobre el núcleo.
  let finEstructura = t;
  if (techo && torre) {
    const tope = elementos.filter((e) => e.tipo !== 'vidrio').reduce((m, e) => Math.max(m, e.caja.y + e.caja.h / 2), 0);
    push({ tipo: 'muro', nivel: `${nombre}:TECHO`, sector: Math.floor(sectores / 2), inicio: t, fin: t + techo.dur, caja: { x: 0, y: tope + techo.h / 2, z: 0, w: techo.w, h: techo.h, d: techo.d } });
    finEstructura = t + techo.dur;
  }

  const estructura = elementos.filter((e) => e.tipo !== 'vidrio');
  const altura = estructura.reduce((m, e) => Math.max(m, e.caja.y + e.caja.h / 2), 0);
  const huella = { largo: Math.max(sub?.largo ?? 0, zocalo?.largo ?? 0, torre?.largo ?? 0), ancho: Math.max(sub?.ancho ?? 0, zocalo?.ancho ?? 0, (torre?.ancho ?? 0) + 2 * (torre?.balcon ?? 0)) };
  return {
    nombre, origen, elementos, niveles, sectores, paleta, finEstructura, altura, huella,
    volumenTotal: estructura.reduce((a, e) => a + e.volumen, 0),
    excavacion: nSub && excavacion ? { ventana: excavacion, largo: sub.largo + 4, ancho: sub.ancho + 4, fondo: fondoExcavacion } : null,
  };
}

// Mueve un modelo en planta (para armar varias obras en una misma ciudad).
export function trasladar(modelo, dx, dz) {
  return {
    ...modelo,
    origen: [modelo.origen[0] + dx, modelo.origen[1] + dz],
    elementos: modelo.elementos.map((e) => ({ ...e, caja: { ...e.caja, x: e.caja.x + dx, z: e.caja.z + dz } })),
  };
}

// Corre el calendario de un modelo: la misma obra, empezada `semanas` después.
export function desfasar(modelo, semanas) {
  return {
    ...modelo,
    finEstructura: modelo.finEstructura + semanas,
    elementos: modelo.elementos.map((e) => ({ ...e, inicio: e.inicio + semanas, fin: e.fin + semanas })),
    excavacion: modelo.excavacion ? { ...modelo.excavacion, ventana: modelo.excavacion.ventana.map((w) => w + semanas) } : null,
  };
}

// Motor 3D de las escenas de obra: uno o varios edificios levantándose con el
// lenguaje del visor 4D de Syncroniza (lo que no parte no existe, lo que se
// está hormigonando va en gris translúcido, lo terminado toma el color de su
// ciclo y los paños de vidrio se montan después de la estructura).
//
// La escena no tiene reloj: fijarProgreso(p) calcula la semana de obra, la
// cámara, las grúas y el HUD, y dibuja. Sirve igual movida por el scroll o
// exportada cuadro a cuadro.
import * as THREE from 'three';
import { COLOR, CICLOS, limitar, num, fechaCorta, azar, MESES } from '../marca.js';
import { fechaDeSemana } from '../datos/obra.js';
import { selloHTML } from '../sello.js';

function texturaReticulado() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff';
  g.lineWidth = 5; g.strokeRect(2.5, 2.5, 59, 59);
  g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Grúa torre de reticulado. `fijar(H, angulo, carro, bajada)` la pone en estado.
function crearGrua(reticulado, largoPluma = 50) {
  const matRet = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6, map: reticulado, alphaTest: 0.5, side: THREE.DoubleSide });
  const matSolida = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6 });
  const grupo = new THREE.Group();
  const mastil = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1.8), matRet.clone());
  mastil.material.map = reticulado.clone(); mastil.material.map.needsUpdate = true;
  mastil.castShadow = true;
  const giro = new THREE.Group();
  const pluma = new THREE.Mesh(new THREE.BoxGeometry(largoPluma, 1.4, 1.4), matRet.clone());
  pluma.material.map = reticulado.clone(); pluma.material.map.repeat.set(largoPluma * 0.72, 1); pluma.material.map.needsUpdate = true;
  pluma.position.set(largoPluma / 2, 0.7, 0);
  const contrapluma = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 1.6), matSolida);
  contrapluma.position.set(-7, 0.6, 0);
  const contrapeso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 }));
  contrapeso.position.set(-12.4, -0.6, 0);
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), new THREE.MeshStandardMaterial({ color: COLOR.acento, roughness: 0.4 }));
  cabina.position.set(1.8, -1.2, 1.6);
  const punta = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7, 1.4), matRet.clone());
  punta.position.set(0, 3.8, 0);
  const cable = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), new THREE.MeshBasicMaterial({ color: 0x9a9a9a }));
  const carga = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 }));
  for (const m of [pluma, contrapluma, contrapeso, cabina, punta, carga]) m.castShadow = true;
  giro.add(pluma, contrapluma, contrapeso, cabina, punta, cable, carga);
  grupo.add(mastil, giro);
  return {
    grupo,
    fijar(H, angulo, carro, bajada) {
      mastil.scale.y = H; mastil.position.y = H / 2;
      mastil.material.map.repeat.set(1, H / 1.8);
      giro.position.y = H;
      giro.rotation.y = angulo;
      cable.scale.y = Math.max(1, bajada);
      cable.position.set(carro, -bajada / 2, 0);
      carga.position.set(carro, -bajada - 0.7, 0);
    },
  };
}

/**
 * @param contenedor  elemento donde se dibuja
 * @param cfg.edificios  [{ modelo (construirEdificio), grua: { pos:[x,z], desde: semana, pluma } }]
 * @param cfg.terreno    { largo, ancho, centro:[x,z] } deslinde punteado
 * @param cfg.semanaDe   p → semana de obra
 * @param cfg.camara     (p, w) → { pos:[x,y,z], mira:[x,y,z], fov? }
 * @param cfg.hud        { titulo, datos(w, estado) → [{ rotulo, valor, total? }] } | false
 * @param cfg.formato    'vertical' o 'banda' para el marco de LinkedIn: sin HUD (el marco
 *                       pone sello, gancho e indicadores); 'vertical' usa además cfg.vertical
 * @param cfg.vertical   { distancia, fov, bajar, niebla, camara? } encuadre para pantallas más altas que anchas
 */
export function crearObra3D(contenedor, cfg) {
  const { edificios, semanaDe, camara: camaraDe, hud = null, pixelRatio, semilla = 42 } = cfg;
  // 'vertical': marco de LinkedIn con la obra a sangre (sin HUD y con el
  // encuadre de cfg.vertical). 'banda': sin HUD pero con el encuadre normal,
  // para obras muy anchas que en el marco van en una franja 16:9.
  const vertical = cfg.formato === 'vertical';
  const sinHud = vertical || cfg.formato === 'banda';
  // Uno o varios terrenos (la ciudad de obras tiene uno por obra).
  const sitios = cfg.terrenos ?? [cfg.terreno];
  const terreno = (() => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const t of sitios) {
      const [cx, cz] = t.centro ?? [0, 0];
      x0 = Math.min(x0, cx - t.largo / 2); x1 = Math.max(x1, cx + t.largo / 2);
      z0 = Math.min(z0, cz - t.ancho / 2); z1 = Math.max(z1, cz + t.ancho / 2);
    }
    return { largo: x1 - x0, ancho: z1 - z0, centro: [(x0 + x1) / 2, (z0 + z1) / 2] };
  })();
  contenedor.classList.add('escena');
  const elementos = edificios.flatMap((e) => e.modelo.elementos);
  const N = elementos.length;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio ?? Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft quedó obsoleto en r183 y three ya usaba este
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(COLOR.fondo);
  const niebla = (vertical && cfg.vertical?.niebla) || cfg.niebla;
  escena.fog = new THREE.Fog(0x000000, niebla?.[0] ?? 130, niebla?.[1] ?? 340);
  const camara = new THREE.PerspectiveCamera(30, 16 / 9, 1, 3000);

  escena.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.95));
  const sol = new THREE.DirectionalLight(0xffffff, 2.1);
  const alcance = cfg.sombraSigue ? (cfg.alcanceSombra ?? 140) : Math.max(90, Math.max(terreno.largo, terreno.ancho) * 0.9);
  sol.position.set(-alcance * 0.8, alcance * 1.5, alcance * 0.7);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  Object.assign(sol.shadow.camera, { left: -alcance, right: alcance, top: alcance, bottom: -alcance, near: 10, far: alcance * 5 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  sol.target.position.set(terreno.centro?.[0] ?? 0, 0, terreno.centro?.[1] ?? 0);
  escena.add(sol, sol.target);
  const contraluz = new THREE.DirectionalLight(0x9fc4ff, 0.45);
  contraluz.position.set(80, 40, -90);
  escena.add(contraluz);

  // ── Suelo con un hoyo por edificio con subterráneos ─────────────────────
  const forma = new THREE.Shape();
  forma.moveTo(-1500, -1500); forma.lineTo(1500, -1500); forma.lineTo(1500, 1500); forma.lineTo(-1500, 1500); forma.lineTo(-1500, -1500);
  const hoyos = [];
  for (const e of edificios) {
    const ex = e.modelo.excavacion;
    if (!ex) continue;
    const [ox, oz] = e.modelo.origen;
    const hx = ex.largo / 2, hz = ex.ancho / 2;
    const h = new THREE.Path();
    h.moveTo(ox - hx, oz - hz); h.lineTo(ox - hx, oz + hz); h.lineTo(ox + hx, oz + hz); h.lineTo(ox + hx, oz - hz); h.lineTo(ox - hx, oz - hz);
    forma.holes.push(h);
    hoyos.push({ ex, ox, oz });
  }
  // La forma está en el plano XY; al rotarla -90° en X, y pasa a ser -z.
  // Por eso los hoyos se trazan con z negado.
  forma.holes.forEach((h) => h.curves.forEach((c) => { c.v1.y *= -1; c.v2.y *= -1; }));
  const suelo = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  escena.add(suelo);
  const grilla = new THREE.GridHelper(1600, 320, 0x161616, 0x0e0e0e);
  grilla.position.y = 0.01;
  escena.add(grilla);

  const matDeslinde = new THREE.LineDashedMaterial({ color: COLOR.acento, dashSize: 1.4, gapSize: 0.9, transparent: true, opacity: 0.65 });
  for (const t of sitios) {
    const deslinde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(t.largo, 0.001, t.ancho)), matDeslinde);
    deslinde.computeLineDistances();
    deslinde.position.set(t.centro?.[0] ?? 0, 0.03, t.centro?.[1] ?? 0);
    escena.add(deslinde);
  }

  // Calles: franjas un poco más claras que el suelo, con línea central.
  const matCalle = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 1 });
  const matLinea = new THREE.LineDashedMaterial({ color: 0x3a3a3a, dashSize: 3, gapSize: 4 });
  for (const c of cfg.calles ?? []) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(c.largo, c.ancho), matCalle);
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x, 0.015, c.z);
    m.receiveShadow = true;
    escena.add(m);
    const horizontal = c.largo >= c.ancho;
    const g = new THREE.BufferGeometry().setFromPoints(horizontal
      ? [new THREE.Vector3(c.x - c.largo / 2, 0.04, c.z), new THREE.Vector3(c.x + c.largo / 2, 0.04, c.z)]
      : [new THREE.Vector3(c.x, 0.04, c.z - c.ancho / 2), new THREE.Vector3(c.x, 0.04, c.z + c.ancho / 2)]);
    const l = new THREE.Line(g, matLinea);
    l.computeLineDistances();
    escena.add(l);
  }

  const tierra = new THREE.MeshStandardMaterial({ color: 0x17140f, roughness: 1, side: THREE.DoubleSide });
  const excavaciones = hoyos.map(({ ex, ox, oz }) => {
    const g = new THREE.Group();
    const hx = ex.largo / 2, hz = ex.ancho / 2;
    const paredes = [[ex.largo, 0.01, ox, oz - hz], [ex.largo, 0.01, ox, oz + hz], [0.01, ex.ancho, ox - hx, oz], [0.01, ex.ancho, ox + hx, oz]].map(([w, d, x, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), tierra);
      m.position.set(x, 0, z); m.receiveShadow = true; g.add(m); return m;
    });
    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ex.largo, ex.ancho), tierra);
    fondo.rotation.x = -Math.PI / 2; fondo.position.set(ox, 0, oz); fondo.receiveShadow = true;
    g.add(fondo);
    escena.add(g);
    return { ex, paredes, fondo };
  });

  // ── Vecinos ─────────────────────────────────────────────────────────────
  const rnd = azar(semilla);
  const vecinoMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.95 });
  const radio0 = Math.hypot(terreno.largo, terreno.ancho) / 2 + 22;
  const cx0 = terreno.centro?.[0] ?? 0, cz0 = terreno.centro?.[1] ?? 0;
  for (let i = 0; i < (cfg.vecinos === false ? 0 : 26); i++) {
    const ang = (i / 26) * Math.PI * 2 + rnd() * 0.2;
    const dist = radio0 + 16 + rnd() * 90;
    const w = 12 + rnd() * 20, d = 10 + rnd() * 18, h = 4 + rnd() * (dist > radio0 + 50 ? 30 : 12);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), vecinoMat);
    m.position.set(cx0 + Math.cos(ang) * dist, h / 2, cz0 + Math.sin(ang) * dist * 0.85);
    m.rotation.y = rnd() * 0.3 - 0.15;
    m.castShadow = true; m.receiveShadow = true;
    escena.add(m);
  }

  for (const v of cfg.manzanas ?? []) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(v.w, v.h, v.d), vecinoMat);
    m.position.set(v.x, v.h / 2, v.z);
    m.castShadow = true; m.receiveShadow = true;
    escena.add(m);
  }

  // ── Elementos: hechos (color de ciclo), en curso (gris) y vidrio ────────
  const caja = new THREE.BoxGeometry(1, 1, 1);
  const hechos = new THREE.InstancedMesh(caja, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 }), N);
  const enCurso = new THREE.InstancedMesh(caja, new THREE.MeshStandardMaterial({ color: COLOR.enCurso, roughness: 0.9, transparent: true, opacity: 0.28, depthWrite: false }), N);
  const vidrios = new THREE.InstancedMesh(caja, new THREE.MeshStandardMaterial({ color: 0x8fd3ff, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.42, depthWrite: false }), N);
  // Sin recorte por frustum: three calcula la esfera de un InstancedMesh una
  // vez, en el primer cuadro, y como las instancias cambian en cada cuadro esa
  // esfera queda vieja. En la ciudad de obras eso hacía desaparecer TODOS los
  // elementos cuando la cámara dejaba de mirar la primera obra. Con unos miles
  // de cajas, dibujarlas siempre no cuesta nada.
  for (const m of [hechos, enCurso, vidrios]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; }
  hechos.castShadow = true; hechos.receiveShadow = true;
  hechos.setColorAt(0, new THREE.Color());
  escena.add(hechos, enCurso, vidrios);

  // ── Grúas ───────────────────────────────────────────────────────────────
  const reticulado = texturaReticulado();
  const gruas = edificios.filter((e) => e.grua).map((e) => {
    const g = crearGrua(reticulado, e.grua.pluma ?? 50);
    g.grupo.position.set(e.grua.pos[0], 0, e.grua.pos[1]);
    escena.add(g.grupo);
    return { ...g, edificio: e, fase: rnd() * 10 };
  });

  // ── HUD ─────────────────────────────────────────────────────────────────
  // En vertical no se dibuja: el marco de LinkedIn arma su propio pie con
  // indicadores() y la línea de tiempo con `meses`.
  const capa = document.createElement('div');
  capa.className = 'hud';
  contenedor.appendChild(capa);
  // Cambios de mes a lo largo del progreso, para las líneas de tiempo.
  const meses = [];
  {
    const [w0, w1] = [semanaDe(0), semanaDe(1)];
    let mesPrevio = null;
    for (let w = w0; w <= w1; w += 0.25) {
      const f = fechaDeSemana(w);
      if (f.getMonth() !== mesPrevio) {
        if (mesPrevio !== null) {
          let p = 0;
          for (let q = 0; q <= 1; q += 0.002) if (semanaDe(q) <= w) p = q;
          meses.push({ p, mes: MESES[f.getMonth()] });
        }
        mesPrevio = f.getMonth();
      }
    }
  }
  let celdas = [];
  if (hud && !sinHud) {
    const muestra = hud.datos(0, { m3: 0, niveles: [], porEdificio: new Map(), sectoresEnCurso: new Set() });
    capa.innerHTML = `
      <div class="cabecera">${selloHTML()}<div class="eti azul">${hud.etiqueta ?? 'Planificación 4D'}</div><div class="titulo">${hud.titulo}</div></div>
      <div class="panel">
        <div class="fila">
          <div class="datos">
            <div><div class="eti">Semana del</div><div class="valor" data-v="fecha"></div></div>
            ${muestra.map((d, i) => `<div><div class="eti">${d.rotulo}</div><div class="valor"><span data-d="${i}"></span>${d.total ? `<span class="total"> / ${d.total}</span>` : ''}</div></div>`).join('')}
          </div>
          <div><div class="eti" style="text-align:right">Ciclo en curso</div>
            <div class="chips">${CICLOS.slice(0, hud.chips ?? 4).map((c) => `<span class="chip" style="background:${c};color:${c}"></span>`).join('')}</div></div>
        </div>
        <div class="linea-tiempo"><div class="base"></div><div class="cabezal" data-v="cabezal"></div></div>
      </div>`;
    celdas = muestra.map((_, i) => capa.querySelector(`[data-d="${i}"]`));
    const lt = capa.querySelector('.linea-tiempo');
    for (const { p, mes } of meses) {
      const span = document.createElement('span');
      span.className = 'mes';
      span.style.left = `${p * 100}%`;
      span.textContent = mes;
      lt.appendChild(span);
    }
  }
  const vFecha = capa.querySelector('[data-v="fecha"]');
  const vCabezal = capa.querySelector('[data-v="cabezal"]');

  function redimensionar(w = contenedor.clientWidth, h = contenedor.clientHeight) {
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // En vertical la obra baja un poco: arriba va el gancho del marco y abajo
    // los indicadores, así que el centro útil queda bajo el centro del cuadro.
    const bajar = vertical ? (cfg.vertical?.bajar ?? 0.05) : 0;
    if (bajar) camara.setViewOffset(w, h, 0, -bajar * h, w, h);
    else camara.clearViewOffset();
    camara.updateProjectionMatrix();
    capa.style.setProperty('--u', `${Math.max(11, h / 54)}px`);
  }
  redimensionar();

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), esc = new THREE.Vector3();
  // El destello de lo que se termina: blanco por defecto; el film usa el azul de la marca.
  const color = new THREE.Color(), blanco = new THREE.Color(cfg.destello ?? 0xffffff);
  const semanasDestello = cfg.semanasDestello ?? 0.4;
  const fuerzaDestello = cfg.fuerzaDestello ?? 0.65;
  const ciclos = CICLOS.map((c) => new THREE.Color(c));

  function fijarProgreso(p) {
    const w = semanaDe(p);

    for (const { ex, paredes, fondo } of excavaciones) {
      const [a, b] = ex.ventana;
      const prof = Math.max(0.02, -ex.fondo * limitar((w - a) / (b - a)));
      paredes.forEach((m) => { m.scale.y = prof; m.position.y = -prof / 2; });
      fondo.position.y = -prof;
    }

    let nh = 0, nc = 0, nv = 0, m3 = 0;
    const sectoresEnCurso = new Set();
    const porEdificio = new Map(); // nombre → { techo, nivelEnCurso, nivelHecho }
    for (const e of elementos) {
      if (w < e.inicio) continue;
      const { x, y, z, w: cw, h: ch, d: cd } = e.caja;
      const est = porEdificio.get(e.edificio) ?? { techo: 0, nivelEnCurso: null, nivelHecho: null };
      porEdificio.set(e.edificio, est);
      if (w < e.fin) {
        const u = (w - e.inicio) / (e.fin - e.inicio);
        const crece = e.tipo !== 'losa' && e.tipo !== 'vidrio'; // pilares y muros suben; losas y vidrio aparecen
        const hh = crece ? Math.max(0.05, ch * u) : ch;
        pos.set(x, crece ? y - ch / 2 + hh / 2 : y, z);
        esc.set(cw, hh, cd);
        m4.compose(pos, q, esc);
        enCurso.setMatrixAt(nc++, m4);
        if (e.tipo !== 'vidrio') { sectoresEnCurso.add(e.ciclo); est.nivelEnCurso = e.nivel; }
      } else {
        pos.set(x, y, z); esc.set(cw, ch, cd);
        m4.compose(pos, q, esc);
        if (e.tipo === 'vidrio') { vidrios.setMatrixAt(nv++, m4); continue; }
        hechos.setMatrixAt(nh, m4);
        // Destello lineal por defecto; 'sostenido' queda pleno la mitad del
        // tiempo y después vuelve rápido al color del ciclo (sin tonos barrosos).
        const kf = limitar((w - e.fin) / semanasDestello);
        const flash = cfg.formaDestello === 'sostenido' ? (kf < 0.45 ? 1 : 1 - (kf - 0.45) / 0.55) ** 2 : 1 - kf;
        // Un modo del visor (ciclo aislado, cubicar, avance real) puede pintar
        // el elemento de otro color; si no, va el de su ciclo con el destello.
        const propio = cfg.colorear?.(e, w);
        if (propio) color.set(propio);
        else color.copy(ciclos[e.ciclo % ciclos.length]).lerp(blanco, flash * fuerzaDestello);
        hechos.setColorAt(nh, color);
        nh++;
        m3 += e.volumen;
        est.techo = Math.max(est.techo, y + ch / 2);
        est.nivelHecho = e.nivel;
      }
    }
    hechos.count = nh; enCurso.count = nc; vidrios.count = nv;
    for (const m of [hechos, enCurso, vidrios]) m.instanceMatrix.needsUpdate = true;
    if (hechos.instanceColor) hechos.instanceColor.needsUpdate = true;

    for (const g of gruas) {
      const visible = w >= g.edificio.grua.desde && w <= (g.edificio.grua.hasta ?? Infinity);
      g.grupo.visible = visible;
      if (!visible) continue;
      const techo = porEdificio.get(g.edificio.modelo.nombre)?.techo ?? 0;
      const H = Math.max(28, Math.ceil((techo + 16) / 6) * 6);
      const angulo = (g.edificio.grua.angulo ?? -0.55) + 0.45 * Math.sin(p * Math.PI * 4.2 + g.fase) + 0.09 * Math.sin(p * Math.PI * 9.1 + g.fase);
      const carro = 18 + 14 * (0.5 + 0.5 * Math.sin(p * Math.PI * 6.3 + g.fase));
      const bajada = Math.min(H - 2, H - techo - 4 + 6 * (0.5 + 0.5 * Math.sin(p * Math.PI * 7.7 + g.fase)));
      g.fijar(H, angulo, carro, bajada);
    }

    let cam = vertical && cfg.vertical?.camara ? cfg.vertical.camara(p, w) : camaraDe(p, w);
    if (vertical && cfg.vertical) {
      // Más alta que ancha: se aleja (o abre) para que la obra quepa de lado a lado.
      const k = cfg.vertical.distancia ?? 1;
      if (k !== 1) cam = { ...cam, pos: cam.pos.map((c, i) => cam.mira[i] + (c - cam.mira[i]) * k) };
      if (cfg.vertical.fov) cam = { ...cam, fov: cfg.vertical.fov };
    }
    if (cfg.sombraSigue) {
      // El mapa de sombras cubre ±alcance alrededor de donde mira la cámara:
      // en una ciudad de 500 m, cubrir todo dejaba la sombra borrosa.
      const [mx, , mz] = cam.mira;
      sol.target.position.set(mx, 0, mz);
      sol.position.set(mx - alcance * 0.8, alcance * 1.5, mz + alcance * 0.7);
    }
    if (cam.fov && cam.fov !== camara.fov) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
    camara.position.set(...cam.pos);
    camara.lookAt(...cam.mira);
    renderer.render(escena, camara);

    if (hud) {
      const fecha = fechaCorta(fechaDeSemana(Math.floor(w)));
      const datos = hud.datos(w, { m3, porEdificio, sectoresEnCurso });
      ultimos = { fecha, kpis: datos };
      if (!sinHud) {
        vFecha.textContent = fecha;
        vCabezal.style.transform = `scaleX(${limitar(p)})`;
        datos.forEach((d, i) => { if (celdas[i]) celdas[i].textContent = d.valor; });
        capa.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('activo', sectoresEnCurso.has(i)));
      }
    }
  }

  let ultimos = { fecha: '', kpis: [] };
  function destruir() { renderer.dispose(); contenedor.innerHTML = ''; }
  // Dónde cae en pantalla (pixeles CSS) una caja del mundo, con la cámara del
  // último cuadro: el film la usa para cerrar la ola azul sobre la losa.
  const v3 = new THREE.Vector3();
  function proyectarCaja({ x, y, z, w: cw, h: ch, d: cd }) {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      v3.set(x + (sx * cw) / 2, y + (sy * ch) / 2, z + (sz * cd) / 2).project(camara);
      const px = ((v3.x + 1) / 2) * w, py = ((1 - v3.y) / 2) * h;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return { x0, x1, y0, y1 };
  }
  return { fijarProgreso, redimensionar, destruir, meses, proyectarCaja, indicadores: () => ultimos };
}

export { num };

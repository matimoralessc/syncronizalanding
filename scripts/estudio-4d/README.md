# Estudio 4D: cómo se graban los videos de la landing

Los videos del 4D de la landing (el héroe que se levanta con el scroll, el giro
de ciclos, la toma de interfaz) y los cortos para web y YouTube **no son
grabaciones de pantalla**: se graban cuadro a cuadro desde el visor real de
producción (`www.syncroniza4d.cl`), con el programa y los vínculos reales de la
obra.

Cuadro a cuadro y no con un grabador porque así el resultado no depende de la
máquina. El visor tarda entre 0,3 y 1,3 segundos en pintar cada cuadro en 4K
con una GPU integrada; un grabador de pantalla se lo saltaría. Acá cada cuadro
espera a que el visor termine de pintar (`esperarQuieto`) y el video sale a 30
fps perfectos.

## Qué se necesita

- Node 22, `ffmpeg` y una cuenta del visor 4D con acceso a la obra.
- En esta carpeta: `npm i playwright && npx playwright install chromium`.
  Es un `package.json` aparte a propósito: Playwright no tiene que entrar al
  build de la landing.

## Paso a paso

```bash
# 1. Abre un Chromium con perfil propio en el puerto 9333. Inicia sesión A MANO
#    en esa ventana y abre la obra. La contraseña nunca pasa por estos scripts:
#    el token queda en ./perfil (ignorado por git).
node abrir.mjs &
node esperar-modelo.mjs          # sale solo cuando el modelo terminó de cargar

# 2. Los datos de la obra (tomas.mjs los necesita para repartir la fecha).
node sacar-datos.mjs

# 3. Previa rápida en baja (1 de cada 3 cuadros) para revisar el movimiento.
node rodar.mjs heroe 960 540 3

# 4. Final: se rinde en 4K y se reduce a 1080 (bordes limpios sin antialias
#    del visor). La vertical para teléfono es otra toma, no un recorte.
node rodar.mjs heroe 3840 2160 1
node rodar.mjs heroe_vertical 1440 2560 1
node rodar.mjs ciclos 3840 2160 1
node rodar.mjs ui 1920 1080 1

# 5. Datos por cuadro del héroe (semana, elementos, ciclos) para el HUD.
#    sacar-datos.mjs lee las tareas vinculadas del visor abierto; tomas.mjs
#    también los usa, así que va antes de grabar si cambió el programa.
node sacar-datos.mjs
node generar-datos-heroe.mjs ../../src/landing/heroe-datos.json
```

### Codificación para el scroll (receta de la skill scroll-world, paso 6)

```bash
# Escritorio: GOP 8 para que cualquier posición se encuentre rápido.
ffmpeg -framerate 30 -i cuadros/heroe-3840/%04d.png -vf "scale=1920:1080:flags=lanczos" \
  -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -g 8 -keyint_min 8 \
  -sc_threshold 0 -movflags +faststart ../../public/4d/heroe-1080.mp4

# Teléfono: 720 de ancho y GOP 4 (el costo de buscar en un teléfono depende de
# cuántos cuadros hay desde el último cuadro clave).
ffmpeg -framerate 30 -i cuadros/heroe_vertical-1440/%04d.png -vf "scale=720:1280:flags=lanczos" \
  -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -g 4 -keyint_min 4 \
  -sc_threshold 0 -movflags +faststart ../../public/4d/heroe-movil.mp4
```

No se usa el `unsharp` de la receta original: está pensado para video generado
con IA, que sale blando. Estas tomas ya vienen supermuestreadas desde 4K.

Calidad 23 y no la 20 de la receta: con fondo negro y colores planos no se
distinguen a tamaño real y la 23 pesa 29 % menos (3,8 MB contra 5,3 MB el héroe
de escritorio, que se baja entero al entrar).

### Cortos (16:9, web y YouTube)

`corto/compositor.html` es una página con la misma letra, colores y curva que la
landing. `corto/renderizar.mjs` la fotografía cuadro a cuadro según un guion de
`corto/guiones.mjs` (clips, fundidos, títulos y el HUD con los datos reales).

```bash
# Los clips se leen como JPG 1920 en corto/f/<toma>/NNNN.jpg
ffmpeg -i cuadros/heroe-centrado-3840/%04d.png -vf scale=1920:1080:flags=lanczos -q:v 2 -start_number 0 corto/f/heroe/%04d.jpg
node corto/renderizar.mjs panoramica-4d 6     # previa
node corto/renderizar.mjs panoramica-4d       # final
```

`corto/fuentes.css` (Geist en base64, porque `fetch` y las fuentes no cargan
desde `file://`) se regenera desde `node_modules/@fontsource-variable` de la
landing; está ignorado por git porque pesa 70 KB y es derivado.

## Herramientas de exploración

- `contactos.mjs <día> <radio>`: el edificio desde 16 ángulos en una sola
  imagen. Es como se eligió el recorrido del héroe: mirando, no adivinando.
- `aislar.mjs`: cada modelo federado solo, para saber de dónde sale cada cosa
  (así se encontró que las líneas con puntos eran las cañerías).
- `avance-foto.mjs`: el modo "Avance real" tal como está la obra hoy.
- `ver-avance.mjs`: qué responde el servicio de avance cuando el visor lo pide.
  Con él se encontró, el 11-oct-2026, que el 4D y el control de Panorámica
  tienen cargados XML distintos y los UID quedaron corridos en 5 (Sección 1
  es 11 en el control y 16 en el 4D): el modo avance busca en la tarea
  equivocada. Hay que volver a cargar el mismo XML en los dos.

## Trampas que ya costaron

- **El estudio depende de `window.ctx`.** El visor expone `ctx`, `components` y
  `OBCF` para depurar (`main.ts`). Si alguien los saca, la cámara y el
  resaltador dejan de estar al alcance y esto no graba nada.
- **Los scripts salen con `process.exit`, no con `browser.close()`.** En
  Playwright 1.64, `close()` sobre una conexión CDP solo desconecta (se probó),
  pero no hay que depender de eso: cerrar la ventana es perder la sesión. Para
  cerrar el navegador de verdad se termina `abrir.mjs`, y al terminar conviene
  borrar `perfil/`, que guarda el token de quien inició sesión.
- **La fecha no avanza por calendario sino por obra** (`diaPorAvance` en
  `tomas.mjs`). Con la fecha pareja, el primer tercio del héroe era terreno
  vacío y el edificio salía casi entero de golpe.
- **Las cañerías se apagan en las tomas generales** (Alcantarillado y Aguas
  Lluvia): a esa distancia se ven como un gráfico de líneas pegado encima. Se
  apagan solo durante la toma, con el mismo `visible` que usa el panel.
- **Lente de 36° y no los 60° del visor** en las tomas de lejos: aplana la
  perspectiva como la fotografía de arquitectura; con 60° las casas del primer
  plano tapaban el edificio.
- **El fondo se graba en `#000`**, igual que la página: el video se funde sin
  borde.
- **Toda cifra que vaya en un texto se verifica contra los datos.** El primer
  guion decía "cinco meses de obra gruesa" porque tomó como inicio el soil
  nailing; las 103 tareas con ciclo van del 9-nov-2026 al 2-mar-2027 (3,7
  meses).

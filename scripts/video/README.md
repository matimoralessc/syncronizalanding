# Cómo se arman los videos de `public/`

Los `.mp4` que están en `public/` no son las grabaciones originales: son
recortes con parches encima. Acá está la receta, porque las coordenadas de esos
parches salieron de medir el video frame por frame y no hay forma de deducirlas
mirando el resultado.

**El master no está en el repo** (pesa 24 MB). Para rehacer el video hay que
dejarlo en `/tmp/master/hormigon.mp4`.

## Hormigón

El clip es una grabación de pantalla de iOS de WhatsApp. Trae dos cosas que no
pueden salir publicadas:

- el header del chat y el globo del menú decían **"Obra Test Staging — Edificio
  Las Acacias"**, que es el ambiente de pruebas;
- un globo saliente con el código de obra **"Obr-test-001"**.

Se tapa, no se reemplaza. Poner ahí el nombre de una obra real sería inventar
dónde se grabó, y la página de al lado afirma que todo lo que se ve es producto
funcionando en obra. Queda `Hola 👋` + línea en blanco + `Que quieres hacer?`,
que es una forma normal de escribir un menú por WhatsApp.

```bash
# 1. intermedio CFR 25 sin pérdida + header reemplazado
REHACER_BASE=1 scripts/video/hormigon.sh        # falla pidiendo la tabla, es esperable

# 2. medir dónde está el globo en cada frame del intermedio
mkdir -p /tmp/base25
ffmpeg -i /tmp/horm-base.mkv -vf "select='lt(n,40)+between(n,235,260)'" \
       -vsync 0 -frame_pts 1 /tmp/base25/f%04d.png
python3 scripts/video/medir-offsets.py /tmp/base25 /tmp/horm-offsets.txt

# 3. tapar y codificar
scripts/video/hormigon.sh

# 4. verificar que no quedó ni un frame con el texto
mkdir -p /tmp/full25
ffmpeg -i public/hormigon-demo.mp4 -vf fps=25 -frame_pts 1 /tmp/full25/f%04d.png
python3 scripts/video/verificar.py /tmp/full25
#   → "mejor residual: (0.60, ...)". 0.60 es el piso de ruido del comparador;
#     cualquier cosa arriba de 0.75 es texto que quedó sin tapar.

# 5. el poster sale del frame 10, que es el que cuenta la historia solo:
#    el menú completo y el capataz respondiendo "5"
ffmpeg -i public/hormigon-demo.mp4 -vf "select='eq(n,10)'" -frames:v 1 -q:v 3 \
       -y public/hormigon-poster.jpg
```

### Las dos trampas que costaron caro

1. **El master es VFR.** En una sola pasada, el `n` que ven los filtros cuenta
   frames de entrada, y el `fps=25` duplica y descarta después. Las cajas se
   corrían un frame y tapaban el globo equivocado. De ahí las dos pasadas.
2. **`yuv420p` corre los colores planos.** Pedir el color medido del globo deja
   el parche más apagado que el fondo y se ve el rectángulo. Los valores del
   script ya están compensados: `0xFEFEFE` sale 253 (el globo es 253) y
   `0xDEFFDA` sale (219,249,217) contra (216,250,215) del original.

## 4D

El video del 4D ya no sale de una grabación de pantalla: se graba cuadro a cuadro
desde el visor real. Ver `scripts/estudio-4d/README.md`.

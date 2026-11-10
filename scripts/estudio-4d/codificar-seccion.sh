#!/bin/bash
# Uso: codificar-seccion.sh <carpeta-de-cuadros> <nombre> [cuadro-del-poster]
# Videos de sección: bucle, no scrub. 1280x720 (se muestran a ~700 px en
# escritorio; 1280 cubre retina) y GOP normal, que pesa la mitad que el del héroe.
set -e
D=/home/maticrack/Proyects/syncronizalanding/public/4d
ffmpeg -v error -y -framerate 30 -i "$1/%04d.png" -vf "scale=1280:720:flags=lanczos" -an \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$D/$2.mp4"
P=$(printf "%04d" "${3:-0}")
ffmpeg -v error -y -i "$1/$P.png" -vf "scale=1280:720:flags=lanczos" -c:v libwebp -quality 82 "$D/$2-poster.webp"
ls -la "$D/$2.mp4" "$D/$2-poster.webp"

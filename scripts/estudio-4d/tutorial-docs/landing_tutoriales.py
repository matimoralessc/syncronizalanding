"""Prepara la videoteca de tutoriales de la landing (16-nov-2026).

Toma los tutoriales publicados en la plataforma (web/public/tutoriales del MVP)
y deja en la landing, para cada uno:
  - public/tutoriales/<código>.webp  portada a 640 px
  - public/tutoriales/<código>.mp4   720p SIN AUDIO: la voz de Esteban es del
    plan gratis de ElevenLabs, sin licencia comercial, y la landing es publicidad
  - public/tutoriales/<código>.vtt   los subtítulos, para que se entienda igual
y el índice src/landing/tutoriales.json (código, módulo, título, segundos).

    python3 landing_tutoriales.py
"""
import json
import re
import subprocess
from pathlib import Path

AQUI = Path(__file__).parent
PUB = Path.home() / "Proyects/syncroniza-core-mvp/web/public/tutoriales"
LANDING = AQUI.parents[2]
SAL = LANDING / "public" / "tutoriales"
SAL.mkdir(parents=True, exist_ok=True)

# Los mismos títulos que las portadas (portadas_videos.mjs).
TITULOS = {"HG-01": "Cargar una guía desde WhatsApp", "DOC-01": "Documentación de la obra",
           "PWA-01": "Instalar Syncroniza en Android", "PWA-02": "Instalar Syncroniza en iPhone"}
MODULOS = {"AV": "Avance y Curva S", "CO": "Costos", "HG": "Hormigón", "LP": "Last Planner",
           "DOC": "Documentación", "PWA": "App de terreno"}


def segundos(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                capture_output=True, text=True, check=True).stdout)


def vtt(srt_txt):
    # El texto leído dice «punto ce ele»; en pantalla va el dominio (como en montar.py).
    t = srt_txt.replace("\r", "").replace("Syncronizaco punto ce ele", "syncronizaco.cl")
    t = re.sub(r"(\d\d:\d\d:\d\d),(\d\d\d)", r"\1.\2", t)
    t = re.sub(r"^\d+\n(?=\d\d:)", "", t, flags=re.M)
    return "WEBVTT\n\n" + t.strip() + "\n"


indice = []
for mp4 in sorted(PUB.glob("*.mp4")):
    cod = re.match(r"^[A-Z]+-\d{2}", mp4.name).group(0)
    pref = cod.split("-")[0]
    spec = AQUI / cod.lower().replace("-", "") / "spec.json"
    titulo = TITULOS.get(cod) or (json.loads(spec.read_text())["portada"]["titulo"] if spec.exists() else None)
    if not titulo:
        print("sin título, se salta:", mp4.name)
        continue
    srt = mp4.with_suffix(".srt")
    if not srt.exists():
        srt = AQUI / cod.lower().replace("-", "") / "salida" / mp4.with_suffix(".srt").name
    if not srt.exists():
        print("sin subtítulos, se salta:", mp4.name)
        continue
    destino = SAL / f"{cod}.mp4"
    if not destino.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-an", "-vf", "scale=1280:-2", "-c:v", "libx264",
                        "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destino)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4.with_suffix(".jpg")), "-vf", "scale=640:-2",
                    "-c:v", "libwebp", "-quality", "82", str(SAL / f"{cod}.webp")], check=True)
    (SAL / f"{cod}.vtt").write_text(vtt(srt.read_text()))
    indice.append({"codigo": cod, "modulo": MODULOS[pref], "titulo": titulo, "segundos": round(segundos(mp4))})
    print(cod, titulo)

(LANDING / "src" / "landing" / "tutoriales.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n")
print(len(indice), "tutoriales")

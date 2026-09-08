#!/usr/bin/env bash
# Rendert stinger.html frame voor frame en plakt er een webm met alpha van.
# Vereist een draaiende ./serve.sh en ffmpeg met libvpx-vp9.
#
#   ./build-stinger.sh [aantal_frames]     (standaard 24 = 0,8 s bij 30 fps)
set -euo pipefail
cd "$(dirname "$0")"

N=${1:-24}; W=1920; H=1080; FPS=30; OUT=stinger.webm
PORT=8777

CHROME=""
for c in google-chrome google-chrome-stable chromium chromium-browser; do
  command -v "$c" >/dev/null && { CHROME=$c; break; }
done
[ -n "$CHROME" ] || { echo "geen Chrome/Chromium gevonden"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg ontbreekt"; exit 1; }

curl -sf -o /dev/null "http://127.0.0.1:$PORT/stinger.html" \
  || { echo "start eerst ./serve.sh"; exit 1; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "rendert $N frames op ${W}x${H}..."
for ((i=0; i<N; i++)); do
  printf -v f "%03d" "$i"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --default-background-color=00000000 --force-device-scale-factor=1 \
    --window-size=$W,$H --virtual-time-budget=2500 \
    --screenshot="$TMP/$f.png" \
    "http://127.0.0.1:$PORT/stinger.html?f=$i&n=$N" >/dev/null 2>&1
  printf '\r  %d/%d' "$((i+1))" "$N"
done
echo

# -auto-alt-ref 0 is verplicht: zonder dat gooit libvpx-vp9 het alphakanaal weg
ffmpeg -y -loglevel error -framerate $FPS -i "$TMP/%03d.png" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -auto-alt-ref 0 -an "$OUT"

MS=$(( N * 1000 / FPS ))
echo "klaar: $OUT  (${MS} ms)"
echo "OBS > Scene Transitions > Stinger:"
echo "   Video File      = $(pwd)/$OUT"
echo "   Transition Point = $(( MS / 2 )) ms"

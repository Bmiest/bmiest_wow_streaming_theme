#!/usr/bin/env bash
# Rendert de kanaalgraphics uit graphics.html naar graphics/*.png, op de maten
# die Twitch wil. Vereist een draaiende ./serve.sh.
#
#   ./build-graphics.sh
set -euo pipefail
cd "$(dirname "$0")"

PORT=8777
OUT=graphics

CHROME=""
for c in google-chrome google-chrome-stable chromium chromium-browser; do
  command -v "$c" >/dev/null && { CHROME=$c; break; }
done
[ -n "$CHROME" ] || { echo "geen Chrome/Chromium gevonden"; exit 1; }

curl -sf -o /dev/null "http://127.0.0.1:$PORT/graphics.html" \
  || { echo "start eerst ./serve.sh"; exit 1; }

mkdir -p "$OUT"

shoot(){ # naam breedte hoogte querystring
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --default-background-color=00000000 --force-device-scale-factor=1 \
    --window-size="$2","$3" --virtual-time-budget=9000 \
    --screenshot="$OUT/$1.png" \
    "http://127.0.0.1:$PORT/graphics.html?$4" >/dev/null 2>&1
  printf '  %-22s %sx%s\n' "$OUT/$1.png" "$2" "$3"
}

echo "rendert kanaalgraphics..."
shoot offline        1920 1080 "a=offline"
shoot profile-banner 1200  480 "a=profile"

# De panelknoppen komen uit config.default.js, zodat de lijst op één plek
# staat. Slug van het label wordt de bestandsnaam.
node -e '
  global.window = {};
  require("./config.default.js");
  var p = (window.OVERLAY_CONFIG.graphics || {}).panels || [];
  p.forEach(function(x, i){
    var slug = String(x.label).toLowerCase().replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "");
    console.log(i + " " + slug);
  });
' | while read -r i slug; do
  shoot "panel-$slug" 320 100 "a=panel&i=$i"
done

echo
echo "klaar. Uploaden bij Twitch:"
echo "   offline.png        Creator Dashboard > Settings > Channel > Video Player Banner"
echo "   profile-banner.png Settings > Channel > Brand > Profile Banner"
echo "   panel-*.png        je kanaalpagina > About > Edit Panels"

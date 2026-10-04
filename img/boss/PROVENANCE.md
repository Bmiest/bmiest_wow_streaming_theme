# Boss cut-outs: provenance

Sourced, not generated. Every PNG here is one of Blizzard's World of Warcraft boss
renders (render CDN, 600x600 JPEG on a flat rgb(24,24,24) ground), as listed in
`js/bossart.js` (written by `build-bossart.py` from wago.tools' DB2 exports).
`build-bosscutouts.py` keyed that ground to alpha (colour distance <=10 transparent,
>=34 opaque, 0.6px blur on the matte) and trimmed each to the body plus 6px; no other
edits. The same text, with the source URL, is in each PNG's `impeccable:prompt` chunk.
Same thresholds as the race site's `scripts/boss-cutouts.py`. Written by
`build-bosscutouts.py`; do not edit by hand.

| File | Boss | Source |
| --- | --- | --- |
| `creature-display-140369.png` | Ula'tek | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-140369.jpg |
| `creature-display-140993.png` | Vexhul | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-140993.jpg |
| `creature-display-141309.png` | Ithraz | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-141309.jpg |
| `creature-display-141675.png` | Vashnik the Malignant | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-141675.jpg |
| `creature-display-142077.png` | Nek'zali | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-142077.jpg |
| `creature-display-142140.png` | Hex Lord Malacrass | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-142140.jpg |
| `creature-display-142472.png` | Zul'jan | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-142472.jpg |
| `creature-display-142788.png` | Sszorak | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-142788.jpg |
| `creature-display-143082.png` | Scrollsage Iku | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-143082.jpg |
| `creature-display-143436.png` | Blood of Ula'tek | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-143436.jpg |
| `creature-display-143437.png` | Breath of Ula'tek | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-143437.jpg |
| `creature-display-143824.png` | Mor'zahi | https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-143824.jpg |

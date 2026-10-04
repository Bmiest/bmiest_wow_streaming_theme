#!/usr/bin/env python3
"""Snijdt de bossrenders uit js/bossart.js los van hun egale grijze achtergrond.

    uv run --with pillow ./build-bosscutouts.py

Blizzards render-CDN levert elke creature als JPEG van 600x600 op een egaal vlak van
rgb(24,24,24). Op de voorpagina staat de boss van je guild achter je character, en dat
vlak zou daar een grijs blok zijn. Dit script zet het om naar alpha en schrijft
img/boss/creature-display-<id>.png, met de herkomst in het `impeccable:prompt`-tekstblok
van de PNG (zo controleert `impeccable embed-prompt --scan img` dat elke raster zegt waar
hij vandaan komt).

Overgenomen van scripts/boss-cutouts.py op racetodutchfirst.bmiest.be, met dezelfde
drempels, zodat een boss op beide sites hetzelfde silhouet heeft. Draai het opnieuw na
./build-bossart.py voor een nieuwe raid-tier; bestaande bestanden worden overschreven.
"""
import io
import pathlib
import re
import urllib.request

from PIL import Image, ImageFilter
from PIL.PngImagePlugin import PngInfo

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'js' / 'bossart.js'
OUT = ROOT / 'img' / 'boss'
GROUND = (24, 24, 24)
LO, HI = 10, 34  # kleurafstand tot de grond: <= LO doorzichtig, >= HI dekkend
PAD = 6  # px rond het lijf die blijven staan bij het bijsnijden
PROVENANCE = (
    "Sourced, not generated. Origin: Blizzard's World of Warcraft render CDN, {url} "
    "(as listed in js/bossart.js, written by build-bossart.py). The flat rgb(24,24,24) "
    "backdrop was keyed to alpha by build-bosscutouts.py (distance <=10 transparent, "
    ">=34 opaque, 0.6px blur on the matte) and trimmed to the body plus 6px; no other edits."
)


def cutout(data: bytes) -> Image.Image:
    im = Image.open(io.BytesIO(data)).convert('RGB')
    px = im.load()
    alpha = Image.new('L', im.size)
    a = alpha.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b = px[x, y]
            d = max(abs(r - GROUND[0]), abs(g - GROUND[1]), abs(b - GROUND[2]))
            a[x, y] = 0 if d <= LO else 255 if d >= HI else int((d - LO) * 255 / (HI - LO))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    # Bijsnijden tot het lijf: de pagina schaalt de boss zelf, en een dunne slang zou in
    # een vierkant van 600x600 een reepje blijven.
    x0, y0, x1, y1 = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    return out.crop((max(x0 - PAD, 0), max(y0 - PAD, 0),
                     min(x1 + PAD, im.size[0]), min(y1 + PAD, im.size[1])))


def write_provenance():
    """img/boss/PROVENANCE.md: dezelfde herkomst als in de PNG's, maar leesbaar zonder
    PNG-tool. Eén regel per bestand, met de boss uit js/bossart.js."""
    rows = re.findall(r'"name":\s*"([^"]+)",\s*"img":\s*"(https://render\.worldofwarcraft\.com/[\w/.-]+\.jpg)"',
                      SRC.read_text())
    lines = [
        '# Boss cut-outs: provenance',
        '',
        'Sourced, not generated. Every PNG here is one of Blizzard\'s World of Warcraft boss',
        'renders (render CDN, 600x600 JPEG on a flat rgb(24,24,24) ground), as listed in',
        '`js/bossart.js` (written by `build-bossart.py` from wago.tools\' DB2 exports).',
        '`build-bosscutouts.py` keyed that ground to alpha (colour distance <=10 transparent,',
        '>=34 opaque, 0.6px blur on the matte) and trimmed each to the body plus 6px; no other',
        'edits. The same text, with the source URL, is in each PNG\'s `impeccable:prompt` chunk.',
        'Same thresholds as the race site\'s `scripts/boss-cutouts.py`. Written by',
        '`build-bosscutouts.py`; do not edit by hand.',
        '',
        '| File | Boss | Source |',
        '| --- | --- | --- |',
    ]
    for name, url in sorted(set(rows), key=lambda r: r[1]):
        png = url.rsplit('/', 1)[1].replace('.jpg', '.png')
        lines.append(f'| `{png}` | {name} | {url} |')
    (OUT / 'PROVENANCE.md').write_text('\n'.join(lines) + '\n')


def main():
    urls = sorted(set(re.findall(r'https://render\.worldofwarcraft\.com/[\w/.-]+\.jpg',
                                 SRC.read_text())))
    OUT.mkdir(parents=True, exist_ok=True)
    for url in urls:
        name = url.rsplit('/', 1)[1].replace('.jpg', '.png')
        req = urllib.request.Request(url, headers={'User-Agent': 'bmiest overlay bosscutouts'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            info = PngInfo()
            info.add_text('impeccable:prompt', PROVENANCE.format(url=url))
            cutout(resp.read()).save(OUT / name, optimize=True, pnginfo=info)
        print(name)
    write_provenance()


if __name__ == '__main__':
    main()

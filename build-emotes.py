#!/usr/bin/env python3
"""Rendert de emotes uit emotes.html naar GIF en PNG, op de maten van Twitch.

    ./serve.sh                  # in een andere terminal
    ./build-emotes.py           # alle emotes
    ./build-emotes.py wig tea   # alleen deze

Per emote in graphics/emotes/:
    <naam>-112.gif  -56.gif  -28.gif   geanimeerd (alleen als frames > 1)
    <naam>-112.png  -56.png  -28.png   statisch, of het eerste frame
plus preview.png (geanimeerd) en preview-static.png, op Twitch' donkere en
lichte chat.

Elke maat wordt apart getekend, niet teruggeschaald: js/emotes.js geeft een
28 een dikkere rand en laat de kleine details weg. Upload ze dus met
auto-resize UIT, alle drie los. Laat je Twitch zelf schalen, dan krijg je de
112 verkleind en is het werk aan de 28 voor niets geweest.

Vereist Chrome/Chromium, node en Pillow.
"""
import json, math, os, shutil, subprocess, sys, tempfile, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PORT = 8777
OUT = os.path.join('graphics', 'emotes')
SIZES = (112, 56, 28)
COLS = 10
# GIF kent alleen aan of uit. Op 50% afsnijden houdt de rand even dik als in
# de SVG; lager maakt hem vetter, hoger rafelt hij.
ALPHA_CUT = 128
# Twitch' grenzen voor een geanimeerde emote
MAX_BYTES = 1024 * 1024
MAX_FRAMES = 60
# Twitch' chatkleuren, voor preview.png
DARK, LIGHT = (24, 24, 27), (255, 255, 255)


def chrome():
    for c in ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'):
        if shutil.which(c):
            return c
    sys.exit('geen Chrome/Chromium gevonden')


def manifest():
    js = ('global.window = {}; require("./js/emotes.js");'
          'console.log(JSON.stringify(window.EMOTES.list.map(function(e){'
          '  return { id:e.id, name:e.name, slot:e.slot, frames:e.frames, fps:e.fps,'
          '           maxKB:e.maxKB || 1024 }; })));')
    return json.loads(subprocess.check_output(['node', '-e', js], text=True))


def shoot(exe, e, size, path):
    cols = min(COLS, e['frames'])
    rows = math.ceil(e['frames'] / cols)
    url = 'http://127.0.0.1:%d/emotes.html?e=%s&s=%d&c=%d&strip=1' % (PORT, e['id'], size, cols)
    subprocess.run([exe, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                    '--default-background-color=00000000', '--force-device-scale-factor=1',
                    '--window-size=%d,%d' % (cols * size, rows * size),
                    '--virtual-time-budget=3000', '--screenshot=' + path, url],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    sheet = Image.open(path).convert('RGBA')
    return [sheet.crop(((i % cols) * size, (i // cols) * size,
                        (i % cols + 1) * size, (i // cols + 1) * size)) for i in range(e['frames'])]


def hard(frame):
    """RGBA met alpha alleen 0 of 255, zoals de GIF hem gaat tonen."""
    r, g, b, a = frame.split()
    a = a.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    return Image.merge('RGBA', (r, g, b, a))


def write_gif(frames, fps, path):
    """Eén palet voor alle frames, index 255 is doorzichtig."""
    frames = [hard(f) for f in frames]
    # palet uit alleen de zichtbare pixels, anders kost het doorzicht kleuren
    px = np.concatenate([a[a[:, 3] > 0][:, :3] for a in
                         (np.asarray(f).reshape(-1, 4) for f in frames)])
    strip = Image.fromarray(px.reshape(1, -1, 3).astype('uint8'), 'RGB')
    pal = strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colours = pal.getpalette()[:255 * 3]
    colours += [0, 0, 0] * (255 - len(colours) // 3) + [255, 0, 255]
    pal.putpalette(colours)

    out = []
    for f in frames:
        q = f.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE)
        mask = f.getchannel('A').point(lambda v: 255 if v == 0 else 0)
        q.paste(255, mask=mask)
        q.info['transparency'] = 255
        out.append(q)
    out[0].save(path, save_all=True, append_images=out[1:], duration=round(1000 / fps),
                loop=0, disposal=2, transparency=255, optimize=False)
    return frames


def check(path, want, fps):
    """Lees de GIF terug en vergelijk elk frame met wat erin moest.

    Pillow voegt gelijke opeenvolgende frames samen en telt hun duur op, dus
    een frame van 150 ms staat hier voor drie bronframes."""
    im = Image.open(path)
    step = round(1000 / fps)
    got = []
    for i in range(getattr(im, 'n_frames', 1)):
        im.seek(i)
        f = np.asarray(im.convert('RGBA')).astype(int)
        got.extend([f] * max(1, round(im.info.get('duration', step) / step)))
    if len(got) != len(want):
        return len(got), '%d frames terug, %d verwacht' % (len(got), len(want))
    worst = 0.0
    for i, (g, w) in enumerate(zip(got, want)):
        w = np.asarray(w).astype(int)
        if not np.array_equal(g[..., 3] > 0, w[..., 3] > 0):
            return len(got), 'masker wijkt af in frame %d' % i
        vis = w[..., 3] > 0
        # gemiddelde afwijking per zichtbare pixel: het palet mag afronden,
        # maar niet een kleur door een andere vervangen
        if vis.any():
            worst = max(worst, float(np.abs(g[vis][:, :3] - w[vis][:, :3]).mean()))
    return len(got), None if worst < 6 else 'kleur wijkt gemiddeld %.1f af' % worst


def preview(results, path):
    """Per emote vier momenten op 112, en 56 en 28 op ware grootte, in beide thema's."""
    font = ImageFont.load_default(size=15)
    pad, w_name = 16, 150
    picks = (0, .25, .5, .75)
    block_w = len(picks) * (112 + 8) + 56 + 8 + 28 + pad * 2
    W = w_name + 2 * block_w + pad
    H = len(results) * (112 + pad) + pad
    sheet = Image.new('RGB', (W, H), (10, 11, 13))
    d = ImageDraw.Draw(sheet)
    for r, (e, by_size) in enumerate(results):
        y = pad + r * (112 + pad)
        d.text((pad, y + 46), e['name'], fill=(238, 241, 245), font=font)
        for b, bg in enumerate((DARK, LIGHT)):
            x = w_name + b * block_w
            d.rectangle((x, y - 6, x + block_w - pad, y + 118), fill=bg)
            x += pad
            for p in picks:
                f = by_size[112][int(p * e['frames'])]
                sheet.paste(f, (x, y), f)
                x += 120
            for s in (56, 28):
                f = by_size[s][0]
                sheet.paste(f, (x, y + 112 - s), f)
                x += s + 8
    sheet.save(path)


def preview_static(results, path):
    """Per emote zijn naam en slot, en 112, 56 en 28 op donker en op licht."""
    font = ImageFont.load_default(size=14)
    small = ImageFont.load_default(size=11)
    pad, cols = 12, 5
    cw = pad + 112 + 8 + 56 + 8 + 28 + pad
    ch = 40 + 2 * (112 + pad)
    rows = math.ceil(len(results) / cols)
    sheet = Image.new('RGB', (cols * (cw + pad) + pad, rows * (ch + pad) + pad), (10, 11, 13))
    d = ImageDraw.Draw(sheet)
    for i, (e, by_size) in enumerate(results):
        x0 = pad + (i % cols) * (cw + pad)
        y0 = pad + (i // cols) * (ch + pad)
        d.text((x0, y0 + 2), e['name'], fill=(238, 241, 245), font=font)
        d.text((x0, y0 + 21), e['slot'], fill=(129, 139, 152), font=small)
        for b, bg in enumerate((DARK, LIGHT)):
            y = y0 + 40 + b * (112 + pad)
            d.rectangle((x0, y, x0 + cw, y + 112 + pad - 2), fill=bg)
            x = x0 + pad
            for s in SIZES:
                f = by_size[s][0]
                sheet.paste(f, (x, y + (112 + pad - 2 - s) // 2), f)
                x += s + 8
    sheet.save(path)


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    exe = chrome()
    try:
        urllib.request.urlopen('http://127.0.0.1:%d/emotes.html' % PORT, timeout=3)
    except Exception:
        sys.exit('start eerst ./serve.sh')

    want = set(sys.argv[1:])
    emotes = [e for e in manifest() if not want or e['id'] in want or e['name'] in want]
    if not emotes:
        sys.exit('geen emote met die naam')
    os.makedirs(OUT, exist_ok=True)

    ok = True
    results = []
    with tempfile.TemporaryDirectory() as tmp:
        for e in emotes:
            if e['frames'] > MAX_FRAMES:
                print('  %s: %d frames, Twitch neemt er %d' % (e['name'], e['frames'], MAX_FRAMES))
                ok = False
            by_size = {}
            for s in SIZES:
                frames = shoot(exe, e, s, os.path.join(tmp, '%s-%d.png' % (e['id'], s)))
                base = os.path.join(OUT, '%s-%d' % (e['name'], s))
                frames[0].save(base + '.png')
                if e['frames'] == 1:
                    # statisch: PNG met volle alpha, geen GIF en dus niets af te snijden
                    by_size[s] = frames
                    kb = os.path.getsize(base + '.png') / 1024
                    flag = '  <-- groter dan %d KB' % e['maxKB'] if kb > e['maxKB'] else ''
                    ok = ok and not flag
                    print('  %-30s %-9s %6.1f KB%s' % (base + '.png', 'static', kb, flag))
                    continue
                hardf = write_gif(frames, e['fps'], base + '.gif')
                by_size[s] = hardf
                n, err = check(base + '.gif', hardf, e['fps'])
                kb = os.path.getsize(base + '.gif') / 1024
                flag = ''
                if err:
                    flag = '  <-- ' + err
                    ok = False
                if kb * 1024 > MAX_BYTES:
                    flag += '  <-- groter dan 1 MB'
                    ok = False
                print('  %-30s %2d frames %6.1f KB%s' % (base + '.gif', n, kb, flag))
            results.append((e, by_size))

    if not want:
        anim = [r for r in results if r[0]['frames'] > 1]
        stat = [r for r in results if r[0]['frames'] == 1]
        preview(anim, os.path.join(OUT, 'preview.png'))
        preview_static(stat, os.path.join(OUT, 'preview-static.png'))
        print('  %s\n  %s' % (os.path.join(OUT, 'preview.png'), os.path.join(OUT, 'preview-static.png')))

    print()
    print('Uploaden bij Twitch: Creator Dashboard > Viewer Rewards > Emotes.')
    print('Auto-resize UIT, en per emote de -28, -56 en -112 los:')
    print('de GIF\'s in Tier 1 animated, de PNG\'s van de rest in hun eigen slot.')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Genereert een OBS scene collection met alle overlay-sources op hun plek.

    ./make-obs-collection.py --install
    ./make-obs-collection.py --root 'C:\\Users\\benne\\wow_streaming_overlay'

--install zet het bestand in de scenes-map van OBS; herstart OBS en kies de
collectie onder Scene Collection. Gebruik NIET de Import-knop -- die is voor
het overnemen van Streamlabs en dergelijke, en doet niets met een OBS-eigen
collectie.

Je bestaande collecties blijven ongemoeid; dit is er een naast.
"""
import argparse, json, os, platform, re, shutil, subprocess, sys, uuid

ap = argparse.ArgumentParser()
ap.add_argument('--base-url', default='http://localhost:8777',
                help='waar serve.sh draait (standaard)')
ap.add_argument('--local-files', action='store_true',
                help="OBS' Local file-modus in plaats van een server; geen serve.sh nodig, "
                     "maar minder beproefd")
ap.add_argument('--root', default=None,
                help='pad naar de overlaymap zoals OBS het ziet, bv. C:\\overlay')
ap.add_argument('--name', default='bmiest overlay')
ap.add_argument('--no-stinger', action='store_true',
                help='laat de stinger-transitie weg; voeg hem in OBS zelf toe. '
                     'Scheelt een pad met backslashes in de JSON, en dat is de '
                     'enige plek waar handmatig bewerken stuk kan gaan.')
ap.add_argument('--jwt', default=None,
                help='StreamElements JWT; wordt aan elke browser-URL gehangen. '
                     'Alleen zinvol bij een gehoste site. Het resultaat bevat dan '
                     'je token -- deel dat bestand niet.')
ap.add_argument('--stinger', default=None,
                help='pad naar stinger.webm zoals OBS het ziet; standaard naast dit script')
ap.add_argument('--out',  default='obs-scene-collection.json')
ap.add_argument('--os', choices=['windows','linux','mac'], default=None,
                help='doelsysteem; bepaalt de audio-apparaten. Standaard afgeleid van --root')
ap.add_argument('--install', action='store_true',
                help='zet het bestand meteen in de scenes-map van OBS op deze machine')
a = ap.parse_args()

HERE   = os.path.dirname(os.path.abspath(__file__))
def join_as_target(root, name):
    """os.path.join kiest de scheiding van dit systeem, niet die van het
    doelsysteem. Een Windows-pad moet backslashes houden."""
    sep = '\\' if ('\\' in root or (len(root) > 1 and root[1] == ':')) else '/'
    return root.rstrip('/\\') + sep + name

def file_url(root):
    """file:///C:/overlay  of  file:///home/benne/overlay"""
    r = root.replace('\\', '/').rstrip('/')
    return 'file:///' + r.lstrip('/')

ROOT   = a.root or HERE
BASE   = a.base_url.rstrip('/')
STING  = a.stinger or join_as_target(ROOT, 'stinger.webm')

def stinger_point_ms(default=500):
    """Transitiepunt = halve duur van stinger.webm. Uitlezen in plaats van
    hardcoderen, zodat het klopt als je hem met een ander aantal frames bouwt."""
    try:
        out = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
                              '-of','default=nw=1:nk=1', STING],
                             capture_output=True, text=True, timeout=10)
        return int(round(float(out.stdout.strip()) * 1000 / 2))
    except Exception:
        return default

TP = stinger_point_ms()

# --- vaste geometrie, gelijk aan css/banner.css en css/chatting.css -------
TOP_H, GAME_H, BOT_H = 120, 1072, 248
CANVAS_W, CANVAS_H   = 2560, 1440

# ---- doelsysteem ---------------------------------------------------------
def guess_os():
    if a.os: return a.os
    if a.root and ('\\' in a.root or (len(a.root) > 1 and a.root[1] == ':')):
        return 'windows'
    return {'Windows':'windows', 'Darwin':'mac'}.get(platform.system(), 'linux')

TARGET = guess_os()
AUDIO = {
    'windows': ('wasapi_output_capture', 'wasapi_input_capture'),
    'linux'  : ('pulse_output_capture',  'pulse_input_capture'),
    'mac'    : ('coreaudio_output_capture', 'coreaudio_input_capture'),
}[TARGET]

def src(name, sid, settings, **extra):
    s = {
        'prev_ver': 520093699, 'name': name, 'uuid': str(uuid.uuid4()),
        'id': sid, 'versioned_id': sid, 'settings': settings,
        'mixers': 0, 'sync': 0, 'flags': 0, 'volume': 1.0, 'balance': 0.5,
        'enabled': True, 'muted': False,
        'push-to-mute': False, 'push-to-mute-delay': 0,
        'push-to-talk': False, 'push-to-talk-delay': 0,
        'hotkeys': {}, 'deinterlace_mode': 0, 'deinterlace_field_order': 0,
        'monitoring_type': 0, 'private_settings': {},
    }
    s.update(extra)
    return s

def browser(name, path, w, h):
    """OBS' CEF weigert een file:// URL in het gewone url-veld. Voor lokale
    bestanden moet is_local_file aan met een pad in local_file -- en dat veld
    slikt geen querystring, vandaar de scene-*.html wrappers."""
    if a.local_files:
        base = path.split('?')[0]
        if base == 'scene.html':
            mode = path.split('mode=')[1]
            base = 'scene-%s.html' % mode
        return src(name, 'browser_source', {
            'is_local_file': True,
            'local_file': join_as_target(ROOT, base),
            'width': w, 'height': h,
            'fps_custom': True, 'fps': 30,
            'shutdown': False, 'restart_when_active': False,
            'reroute_audio': False,
        })
    return src(name, 'browser_source', {
        'is_local_file': False,
        'url': BASE + '/' + path + (
            ('&' if '?' in path else '?') + 'jwt=' + a.jwt if a.jwt else ''),
        'width': w, 'height': h,
        'fps_custom': True, 'fps': 30,
        'shutdown': False, 'restart_when_active': False,
        'reroute_audio': False,
    })

def rgb(hexcolour):
    """OBS bewaart kleuren als ABGR (0xAABBGGRR), niet als RGB."""
    r = (hexcolour >> 16) & 0xFF; g = (hexcolour >> 8) & 0xFF; b = hexcolour & 0xFF
    return 0xFF000000 | (b << 16) | (g << 8) | r

def placeholder(name, w, h, colour=0x202830):
    # Kleurvlak als maatvoorbeeld: vervang door je echte capture of camera
    # en plak de transform erop (rechtsklik > Transform > Copy/Paste Transform).
    return src(name, 'color_source_v3', {'color': rgb(colour), 'width': w, 'height': h})

def item(source, x, y, item_id, bounds=None, btype=0):
    return {
        'name': source['name'], 'source_uuid': source['uuid'],
        'visible': True, 'locked': False, 'rot': 0.0,
        'pos': {'x': float(x), 'y': float(y)},
        'scale': {'x': 1.0, 'y': 1.0}, 'align': 5,
        'bounds_type': btype, 'bounds_align': 0,
        'bounds': {'x': float(bounds[0]), 'y': float(bounds[1])} if bounds else {'x': 0.0, 'y': 0.0},
        'crop_left': 0, 'crop_top': 0, 'crop_right': 0, 'crop_bottom': 0,
        'id': item_id, 'group_item_backup': False,
        'scale_filter': 'disable', 'blend_method': 'default', 'blend_type': 'normal',
        'show_transition': {'duration': 0}, 'hide_transition': {'duration': 0},
        'private_settings': {},
    }

# --- sources --------------------------------------------------------------
alerts   = browser('Alerts',        'alerts.html',                 CANVAS_W, GAME_H)
topbar   = browser('Bovenbalk',     'topbar.html',                 CANVAS_W, TOP_H)
bottom   = browser('Onderbalk',     'banner.html',                 CANVAS_W, BOT_H)
jc       = browser('Just Chatting', 'chatting.html',               CANVAS_W, CANVAS_H)
sc_start = browser('Straks live',   'scene.html?mode=starting',    CANVAS_W, CANVAS_H)
sc_brb   = browser('Even weg',      'scene.html?mode=brb',         CANVAS_W, CANVAS_H)
sc_end   = browser('Einde',         'scene.html?mode=ending',      CANVAS_W, CANVAS_H)

cam      = placeholder('[VERVANG] Webcam',   1280, 720, 0x1E5B4A)
game     = placeholder('[VERVANG] Gameplay', 3440, 1440, 0x161A20)

def scene(name, items):
    return src(name, 'scene', {'custom_size': False, 'id_counter': len(items) + 1,
                               'items': items}, id='scene', versioned_id='scene')

# items zijn onderop-eerst: index 0 ligt achteraan
gameplay = scene('Gameplay', [
    item(game,   0, TOP_H, 1, (CANVAS_W, GAME_H), 2),          # scale to inner bounds
    item(cam,    24, TOP_H + GAME_H + 24, 2, (340, 200), 3),   # scale to outer bounds
    item(bottom, 0, TOP_H + GAME_H, 3),
    item(topbar, 0, 0, 4),
    item(alerts, 0, TOP_H, 5),
])
chatting = scene('Just Chatting', [
    item(cam,    60, 196, 1, (1650, 930), 3),
    item(jc,     0, 0, 2),
    item(alerts, 0, TOP_H, 3),
])
s_start = scene('Straks live', [item(sc_start, 0, 0, 1), item(alerts, 0, TOP_H, 2)])
s_brb   = scene('Even weg',    [item(sc_brb,   0, 0, 1), item(alerts, 0, TOP_H, 2)])
s_end   = scene('Einde',       [item(sc_end,   0, 0, 1)])

# Zonder deze twee heeft de collectie geen geluid -- OBS zet ze normaal zelf
# neer bij een nieuwe collectie, maar niet bij een die van schijf komt.
def audio(name, sid):
    return src(name, sid, {'device_id': 'default'},
               muted=False, mixers=255, monitoring_type=0)

desktop = audio('Desktop Audio', AUDIO[0])
mic     = audio('Mic/Aux',       AUDIO[1])

col = {
    'name': a.name,
    'DesktopAudioDevice1': desktop,
    'AuxAudioDevice1': mic,
    'current_scene': 'Gameplay',
    'current_program_scene': 'Gameplay',
    'current_transition': 'Fade' if a.no_stinger else 'bmiest stinger',
    'transition_duration': 300,
    'preview_locked': False,
    'scaling_enabled': False, 'scaling_level': 0,
    'scaling_off_x': 0.0, 'scaling_off_y': 0.0,
    'groups': [], 'modules': {}, 'quick_transitions': [], 'saved_projectors': [],
    'scene_order': [{'name': n} for n in
                    ['Straks live', 'Gameplay', 'Just Chatting', 'Even weg', 'Einde']],
    'transitions': [] if a.no_stinger else [{
        'name': 'bmiest stinger', 'id': 'obs_stinger_transition',
        'settings': {'path': STING, 'transition_point': TP, 'tp_type': 0,
                     'audio_monitoring': 0, 'audio_fade_style': 0,
                     'track_matte_enabled': False},
    }],
    'sources': [alerts, topbar, bottom, jc, sc_start, sc_brb, sc_end, cam, game,
                gameplay, chatting, s_start, s_brb, s_end],
    'virtual-camera': {'type2': 3},
}

with open(os.path.join(HERE, a.out), 'w', encoding='utf-8') as fh:
    json.dump(col, fh, indent=2, ensure_ascii=False)

OUT = os.path.join(HERE, a.out)

# ---- installeren ---------------------------------------------------------
def scenes_dir():
    sysname = platform.system()
    if sysname == 'Windows':
        base = os.environ.get('APPDATA', '')
        cands = [os.path.join(base, 'obs-studio', 'basic', 'scenes')]
    elif sysname == 'Darwin':
        cands = [os.path.expanduser('~/Library/Application Support/obs-studio/basic/scenes')]
    else:
        cands = [os.path.expanduser('~/.config/obs-studio/basic/scenes'),
                 os.path.expanduser('~/.var/app/com.obsproject.Studio/config/obs-studio/basic/scenes'),
                 os.path.expanduser('~/snap/obs-studio/current/.config/obs-studio/basic/scenes')]
    return [c for c in cands if os.path.isdir(c)]

if a.install:
    dirs = scenes_dir()
    if not dirs:
        print('geen scenes-map van OBS gevonden; start OBS een keer en probeer opnieuw')
        sys.exit(1)
    slug = re.sub(r'[^A-Za-z0-9_-]+', '_', a.name).strip('_') or 'overlay'
    for d in dirs:
        dst = os.path.join(d, slug + '.json')
        shutil.copyfile(OUT, dst)
        print('geinstalleerd: %s' % dst)
    print()
    print('Herstart OBS en kies de collectie onder Scene Collection.')
    print('Niet via Import -- die knop is voor het overnemen van andere software.')

print('geschreven: %s' % a.out)
print('  basis     : %s' % BASE)
if a.jwt:
    print('  jwt       : meegegeven in de URLs -- deel dit bestand niet')
print('  stinger   : %s' % STING)
print()
print('  transitiepunt: %d ms (halve duur van de stinger)' % TP)
print()
if not a.install:
    print('Installeren:  ./make-obs-collection.py --install')
    print('Dat zet het bestand in de scenes-map van OBS. Gebruik NIET de')
    print('Import-knop: die is bedoeld voor het overnemen van andere software')
    print('en doet niets met een OBS-collectie.')
print()
if a.local_files:
    print('Lokale-bestandsmodus: geen server nodig.')
else:
    print('Start ./serve.sh en laat dat venster open staan.')
print()
print('Daarna nog twee dingen zelf: vervang de sources die met [VERVANG]')
print('beginnen door je echte Game Capture en Video Capture Device.')

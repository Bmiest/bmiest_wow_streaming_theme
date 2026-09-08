#!/usr/bin/env python3
"""Genereert een OBS scene collection met alle overlay-sources op hun plek.

    ./make-obs-collection.py                        # http://localhost:8777
    ./make-obs-collection.py --base-url http://192.168.0.10:8777

Importeren: OBS > Scene Collection > Import > kies obs-scene-collection.json.
Dat maakt een NIEUWE collectie aan; je bestaande blijft ongemoeid.
"""
import argparse, json, os, subprocess, uuid

ap = argparse.ArgumentParser()
ap.add_argument('--base-url', default='http://localhost:8777',
                help='waar serve.sh draait; gebruik het LAN-adres als OBS op een andere machine staat')
ap.add_argument('--name', default='bmiest overlay')
ap.add_argument('--out',  default='obs-scene-collection.json')
a = ap.parse_args()

HERE   = os.path.dirname(os.path.abspath(__file__))
BASE   = a.base_url.rstrip('/')
STING  = os.path.join(HERE, 'stinger.webm')

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
    return src(name, 'browser_source', {
        'url': BASE + '/' + path, 'width': w, 'height': h,
        'fps_custom': True, 'fps': 30,
        'shutdown': False, 'restart_when_active': False,
        'reroute_audio': False,
    })

def placeholder(name, w, h, colour=0xFF202830):
    # Kleurvlak als maatvoorbeeld: vervang door je echte capture of camera
    # en plak de transform erop (rechtsklik > Transform > Copy/Paste Transform).
    return src(name, 'color_source_v3', {'color': colour, 'width': w, 'height': h})

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

cam      = placeholder('[VERVANG] Webcam',   1280, 720, 0xFF1E5B4A)
game     = placeholder('[VERVANG] Gameplay', 3440, 1440, 0xFF161A20)

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

col = {
    'name': a.name,
    'current_scene': 'Gameplay',
    'current_program_scene': 'Gameplay',
    'current_transition': 'bmiest stinger',
    'transition_duration': 300,
    'preview_locked': False,
    'scaling_enabled': False, 'scaling_level': 0,
    'scaling_off_x': 0.0, 'scaling_off_y': 0.0,
    'groups': [], 'modules': {}, 'quick_transitions': [], 'saved_projectors': [],
    'scene_order': [{'name': n} for n in
                    ['Straks live', 'Gameplay', 'Just Chatting', 'Even weg', 'Einde']],
    'transitions': [{
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

print('geschreven: %s' % a.out)
print('  basis-URL : %s' % BASE)
print('  stinger   : %s' % STING)
print()
print('  transitiepunt: %d ms (halve duur van de stinger)' % TP)
print()
print('OBS > Scene Collection > Import > kies dit bestand.')
print('Daarna nog twee dingen zelf: vervang de sources die met [VERVANG]')
print('beginnen door je echte Game Capture en Video Capture Device.')

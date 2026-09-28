#!/usr/bin/env python3
"""Genereert een statische gegevensbestand met bosses en hun renders.

    ./build-bossart.py 3004
    ./build-bossart.py "The Venomous Abyss"

Dit script haalt de encounters en hun creatures op uit Blizzard's DB2 via wago.tools
(gratis, geen credentials nodig), controleert of de full-body renders bereikbaar zijn
op de Blizzard CDN, en schrijft ze uit als JavaScript.

--region eu/us/kr/tw (standaard eu): bepaalt alleen de render CDN host
--out js/bossart.js (standaard): waar het bestand heen gaat

Instanties kunnen gegeven als getal (MapID) of naam. De output bevat alleen de
instanties die je opgeeft.
"""
import argparse, csv, json, os, sys, urllib.request, urllib.error
from io import StringIO

# Encounters met meerdere bosses. De Journal heeft geen kolom om bosses van adds
# te scheiden (UiModelSceneID is 9 voor bijna alles), dus nemen we standaard het
# eerste creature, tenzij hier genoemd. Beperkt tot 2: de alert heeft twee flanken.
LEADS = {
    2874: 2,  # Entombed Sentinels
    2887: 2,  # The Twin Fangs
    2894: 2,  # The Lost Explorers
    2883: 2,  # The Coiled Altar
}

def fetch_csv(url):
    """Haal een CSV van wago.tools op."""
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (WoW Overlay Builder)')
        with urllib.request.urlopen(req, timeout=10) as r:
            if r.status != 200:
                raise urllib.error.HTTPError(url, r.status, 'HTTP error', {}, None)
            return r.read().decode('utf-8')
    except Exception as e:
        print('Fout bij %s: %s' % (url, e), file=sys.stderr)
        raise

def head_check(url, name, display_id):
    """Controleer of een URL bereikbaar is (HEAD-request).

    Retourneert (success, should_abort). 200 = keep. 403/404 = skip met
    waarschuwing. Ander = abort.
    """
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as r:
            if r.status == 200:
                return True, False
            elif r.status in (403, 404):
                print('geen render voor %s (creature-display-%d, HTTP %d): overgeslagen' % (name, display_id, r.status), file=sys.stderr)
                return False, False
            else:
                print('Onverwachte HTTP %d voor %s (creature-display-%d)' % (r.status, name, display_id), file=sys.stderr)
                return False, True
    except urllib.error.HTTPError as e:
        if e.code in (403, 404):
            print('geen render voor %s (creature-display-%d, HTTP %d): overgeslagen' % (name, display_id, e.code), file=sys.stderr)
            return False, False
        else:
            print('HTTP-fout %d voor %s (creature-display-%d)' % (e.code, name, display_id), file=sys.stderr)
            return False, True
    except Exception as e:
        print('Fout bij render voor %s (creature-display-%d): %s' % (name, display_id, e), file=sys.stderr)
        return False, True

def parse_csv(data):
    """Parse CSV-data in dictionaries."""
    reader = csv.DictReader(StringIO(data))
    return list(reader)

def get_instances(raw):
    """Zet JournalInstance-rijen in een list."""
    return raw

def get_encounters(raw):
    """Zet JournalEncounter-rijen in een dict op JournalInstanceID."""
    by_instance = {}
    for r in raw:
        inst_id = int(r['JournalInstanceID'])
        enc_id = int(r['ID'])
        dungeon_id = int(r['DungeonEncounterID'])
        order = int(r['OrderIndex'])

        if inst_id not in by_instance:
            by_instance[inst_id] = []
        by_instance[inst_id].append({
            'id': enc_id,
            'dungeon_id': dungeon_id,
            'name': r['Name_lang'],
            'order': order
        })
    # Sorteer per instance op OrderIndex
    for inst_id in by_instance:
        by_instance[inst_id].sort(key=lambda x: x['order'])
    return by_instance

def get_creatures(raw):
    """Zet JournalEncounterCreature-rijen in een dict op JournalEncounterID."""
    by_encounter = {}
    for r in raw:
        enc_id = int(r['JournalEncounterID'])
        creature_id = int(r['ID'])
        display_id = int(r['CreatureDisplayInfoID'])
        order = int(r['OrderIndex'])

        if enc_id not in by_encounter:
            by_encounter[enc_id] = []
        by_encounter[enc_id].append({
            'id': creature_id,
            'display_id': display_id,
            'name': r['Name_lang'],
            'order': order
        })
    # Sorteer per encounter op OrderIndex
    for enc_id in by_encounter:
        by_encounter[enc_id].sort(key=lambda x: x['order'])
    return by_encounter

def build(instances, encounters, creatures, region, out):
    """Zet encounters + creatures samen en controleer de render-URLs."""
    by_encounter = {}
    by_name = {}

    for inst in instances:
        journal_id = int(inst['ID'])
        enc_list = encounters.get(journal_id, [])

        for enc in enc_list:
            enc_id = enc['id']
            dungeon_id = str(enc['dungeon_id'])
            enc_creatures = creatures.get(enc_id, [])

            # Hoeveel creatures moeten we nemen?
            n = LEADS.get(enc_id, 1)
            selected = enc_creatures[:n]

            # Controleer of de renders bestaan
            arts = []
            for creature in selected:
                display_id = creature['display_id']
                url = 'https://render.worldofwarcraft.com/%s/npcs/zoom/creature-display-%d.jpg' % (region, display_id)

                ok, abort = head_check(url, creature['name'], display_id)
                if abort:
                    sys.exit(1)
                if ok:
                    arts.append({
                        'name': creature['name'],
                        'img': url
                    })

            if arts:
                by_encounter[dungeon_id] = arts
                by_name[enc['name'].lower()] = dungeon_id

    # Schrijf als JavaScript
    with open(out, 'w', encoding='utf-8') as f:
        # Header
        f.write('/* Gegenereerd door build-bossart.py.\n')
        f.write('   Bewerk dit bestand niet met de hand: draai het script opnieuw\n')
        f.write('   met de nieuwe raid-tier als een tier begint.\n\n')
        f.write('   Bronnen: wago.tools DB2 exports + Blizzard render CDN */\n')
        f.write('window.BossArt = ')

        # Output
        output = {
            'byEncounter': by_encounter,
            'byName': by_name
        }
        f.write(json.dumps(output, ensure_ascii=False, indent=2))
        f.write(';\n')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('instances', nargs='+',
                    help='Raid instance als getal (MapID) of naam')
    ap.add_argument('--region', default='eu',
                    help='CDN region: eu, us, kr, tw (standaard eu)')

    # Bepaal default --out relatief aan het script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_out = os.path.join(script_dir, 'js', 'bossart.js')
    ap.add_argument('--out', default=default_out,
                    help='Uitvoerbestand (standaard js/bossart.js)')
    a = ap.parse_args()

    # Haal alle data op
    print('Fetching wago.tools databases...', file=sys.stderr)
    inst_raw = parse_csv(fetch_csv('https://wago.tools/db2/JournalInstance/csv'))
    enc_raw = parse_csv(fetch_csv('https://wago.tools/db2/JournalEncounter/csv'))
    crt_raw = parse_csv(fetch_csv('https://wago.tools/db2/JournalEncounterCreature/csv'))

    instances = get_instances(inst_raw)
    encounters = get_encounters(enc_raw)
    creatures = get_creatures(crt_raw)

    # Resolv arguments naar instances
    wanted_instances = []
    for arg in a.instances:
        try:
            # Probeer als getal (MapID)
            map_id = int(arg)
            found = [inst for inst in instances if int(inst['MapID']) == map_id]
            if not found:
                print('Instance niet gevonden: %s' % arg, file=sys.stderr)
                sys.exit(1)
            wanted_instances.extend(found)
        except ValueError:
            # Moet een naam zijn
            found = [inst for inst in instances if inst['Name_lang'].lower() == arg.lower()]
            if not found:
                print('Instance niet gevonden: %s' % arg, file=sys.stderr)
                sys.exit(1)
            wanted_instances.extend(found)

    print('Building %s...' % a.out, file=sys.stderr)
    build(wanted_instances, encounters, creatures, a.region, a.out)
    print('Wrote %s' % a.out, file=sys.stderr)

if __name__ == '__main__':
    main()

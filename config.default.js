// Gedeelde instellingen. Dit bestand bevat GEEN geheimen en mag publiek.
//
// Je StreamElements JWT hoort hier niet in. Geef die mee in de URL van de
// browser source:   topbar.html?jwt=eyJ...
// Die URL staat alleen in jouw OBS-configuratie. Zo werkt de overlay-URL
// van StreamElements zelf ook.
//
// Wil je lokaal iets anders? Maak config.js aan (staat in .gitignore) met
// window.OVERLAY_OVERRIDE = { ... } -- dat wordt hier overheen gelegd.
window.OVERLAY_CONFIG = {

  // ---- canvas -------------------------------------------------------
  // De banner is ontworpen op 2560 breed. Zet je OBS-canvas ooit naar
  // 1920, dan zet je designWidth op 2560 en outputWidth op 1920; de
  // hele overlay schaalt dan mee. Verder niks aanpassen.
  designWidth : 2560,
  outputWidth : 2560,

  // De 368px die overblijft is opgesplitst: een dunne statusstrook boven
  // de gameplay en een bredere databalk eronder.
  //   top 120 + gameplay 1072 + bodem 248 = 1440
  layout: {
    topHeight   : 120,
    gameHeight  : 1072,   // 3440x1440 geschaald naar 2560 breed
    bottomHeight: 248,
  },

  // ---- twitch -------------------------------------------------------
  twitch: {
    channel: 'bmiest',         // je kanaalnaam, kleine letters
  },

  // Naamplaatje onderaan de camera. Leeg = je kanaalnaam.
  camName: 'bmiest',

  // ---- streamelements ----------------------------------------------
  // JWT vind je op streamelements.com -> Account Settings -> Show secrets
  // -> JWT Token. Leeg laten = overlay draait door zonder live events.
  streamelements: {
    jwt: '',
  },

  // ---- raider.io (geen key nodig) ----------------------------------
  raiderio: {
    region: 'eu',
    // Twee characters staan naast elkaar in de kaart. Zet je er meer in,
    // dan rouleert de kaart per paar.
    characters: [
      { realm: 'ragnaros',        name: 'Shiftheal' },  // cross-realm lid van Kelderklasse
      { realm: 'twisting-nether', name: 'Bhikhu'    },  // cross-realm lid van Kelderklasse
    ],
    guild: { realm: 'draenor', name: 'Kelderklasse' },
    raidSlug      : '',    // '' = automatisch de nieuwste raid

    // Live boss progress: de boss waar de guild nu op zit, met pullcount,
    // beste percentage en de pull-historie. Draait op de ongedocumenteerde
    // endpoints achter Raider.IO's eigen widget -- die kunnen zonder
    // aankondiging veranderen. Gaat er iets stuk, dan verdwijnt alleen dit
    // blok. Zet enabled op false om het uit te schakelen.
    liveTracking: {
      enabled    : true,

      // 'widget' = Raider.IO's eigen boss-progress widget in een iframe.
      //            Simpel en onderhoudsvrij, maar komt in hun Dragonflight-
      //            thema: bossart, serif-tekst, volle kleur. Het is een
      //            iframe van een ander domein, dus niet bij te stylen --
      //            in een balk die verder één vormtaal spreekt valt dat op.
      // 'native' = dezelfde gegevens, maar getekend in de huisstijl van de
      //            banner, met de pull-historie als staafjes.
      // 'off'    = blok verbergen.
      mode       : 'native',

      raid       : 'latest',        // of een slug, bv. 'the-venomous-abyss'

      // latest | normal | heroic | mythic. 'latest' betekent bij Raider.IO
      // "waar het laatst iets gebeurde", en dat sleept eenbaas-raids mee:
      // de kaart stond zo op 1/1 Heroic in de Tidebound Grotto terwijl de
      // guild op 2/8 Mythic in de hoofdraid zat. 'mythic' houdt hem op de
      // hoofdtier, dezelfde die de characterkaart toont.
      difficulty : 'mythic',
      period     : 'until_kill',    // until_kill | week
      pollSeconds: 30,              // alleen voor mode 'native'

      // Leeg = automatisch opgebouwd uit region/realm/guild hierboven.
      // Vul in als je de widget-instellingen op raider.io zelf wil kiezen.
      widgetUrl  : '',
    },
    rotateSeconds : 20,
    pollSeconds   : 300,
  },

  // ---- doelen -------------------------------------------------------
  goals: {
    followers: 200,
  },

  // ---- scenes (starting / brb / ending) ------------------------------
  sceneHeight: 1440,
  scenes: {
    // Achtergrond van de scene-schermen: 'ribbons' (grote schuine vlakken
    // plus traag drijvende stofjes) of 'plain' (kaal zwart).
    background: 'ribbons',

    countdownMinutes: 10,

    // Onder de klok op 'straks live' staat de streamtitel van Twitch. Dit
    // is de terugval voor als DecAPI die niet geeft.
    topic: 'Mythic+ push richting 3000',
    // note is optioneel en komt als tagje achter de tijd te staan.
    schedule: [
      { day: 'woensdag', time: '20:00 - 23:00', note: 'raid' },
      { day: 'zondag',   time: '20:00 - 23:00', note: 'raid' },
    ],
    // Vul je eigen handles in -- deze verschijnen op de scene-schermen.
    // De guild-regel is informatie voor kijkers, geen huisstijl; weghalen mag.
    socials: [
      { label: 'discord', value: 'bmiest' },
      { label: 'guild',   value: 'Kelderklasse - EU Draenor' },
    ],
  },

  // Tekst in de stinger-transitie. Leeg = camName.
  stinger: { text: 'bmiest' },

  // ---- bovenbalk -----------------------------------------------------
  // Welke labels in de rail staan, en in welke volgorde. Een label dat nog
  // geen waarde heeft blijft verborgen, dus de balk vult zich vanzelf.
  // Beschikbaar (sleutels exact zoals StreamElements ze levert):
  //   follower-latest, follower-session, follower-week, follower-total,
  //   subscriber-latest, subscriber-new-latest, subscriber-gifted-latest,
  //   subscriber-alltime-gifter, subscriber-session,
  //   cheer-latest, cheer-session, cheer-alltime-top-donator,
  //   tip-latest, tip-session, tip-alltime-top-donator, raid-latest.
  topbar: {
    showTitle: true,           // streamtitel in het midden; vult de balk
    // Labels waar nog niets voor gebeurd is: tonen met een streepje (true)
    // of weglaten tot er een waarde is (false).
    showEmptyLabels: true,
    labels: [
      'follower-latest',
      'subscriber-latest',
      'cheer-latest',
      'tip-alltime-top-donator',
    ],
  },

  // ---- chat ---------------------------------------------------------
  chat: {
    maxMessages : 7,
    hideCommands: true,
    ignore      : ['nightbot','streamelements','moobot','sery_bot'],
  },

  // ---- handmatige progress-regel -----------------------------------
  // Raider.IO's publieke API geeft wel boss-kills, maar niet het
  // "43.89% best / 7 pulls" cijfer -- dat komt bij hen uit Warcraft
  // Logs. Wil je dat tonen, typ het hier; leeg = regel verdwijnt.
  progressNote: { boss: '', best: '', pulls: '' },
};

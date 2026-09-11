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
    // Achtergrond achter de balken: 'bands' toont de strook van hetzelfde
    // doek dat achter de scene-schermen hangt, 'plain' laat het zwart.
    // Naast gameplay beweegt hij drie keer zo traag als op de scenes.
    background  : 'bands',

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

      // Melding over je hele beeld (alerts.html) bij raidprogress:
      //   'both' = nieuwe beste poging én kills
      //   'kill' = alleen kills
      //   'off'  = geen
      alerts     : 'both',

      // Volume van het belletje bij die melding, 0 is stil. Het geluid komt
      // uit de Web Audio API (js/chime.js), dus er is geen bestand bij.
      // Zet in OBS op de alerts-bron 'Control audio via OBS' aan, anders
      // hoort alleen jij het niet en je kijkers wel -- of omgekeerd.
      soundVolume: 0.6,

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

    // Subdoel: teller plus balk in de bovenbalk, met de beloning als
    // bijschrift op de rand. Bij een doel tot en met twaalf wordt de balk
    // een rij vakjes -- "drie van vijf" lees je zo in een oogopslag, waar
    // een balk op 60% je laat rekenen. Daarboven een gewone balk.
    subs: {
      target: 5,
      reward: 'priest wig',   // leeg = alleen de teller, geen belofte

      // Waar de stand vandaan komt. Let op wat je eigenlijk vraagt: een
      // teller die optelt is iets anders dan het aantal subs dat je NU hebt.
      // Begin je vanaf nul, dan vallen die twee samen en is 'streamelements'
      // de beste keuze. Begin je ergens middenin, dan weet alleen DecAPI je
      // echte stand.
      //
      //   'streamelements' = SE's eigen doelteller (subscriber-goal). Die
      //        staat op hun server, dus hij overleeft een herstart van OBS en
      //        loopt door over meerdere streams -- en hij is met de hand te
      //        zetten of te wissen. Dat gaat niet altijd via hun dashboard:
      //        dat scherm toont doelen van een SE goal-widget, en deze
      //        overlay is er geen, dus de teller kan in de sessiedata staan
      //        zonder dat er iets te klikken valt. Via de sessie-API lukt het
      //        wel; zie de README. Zet hem op nul als je vanaf nul begint, SE
      //        reset hem niet tussen sessies. Hij telt sub-events, dus een resub telt ook
      //        mee en iemand die opzegt gaat er niet af. Bij een doel van
      //        vijf zie je dat gebeuren, en dan corrigeer je het getal in
      //        datzelfde scherm.
      //
      //   'decapi' = DecAPI's subcount: je werkelijke aantal actieve subs,
      //        rechtstreeks bij Twitch opgehaald. Het enige dat klopt als je
      //        niet vanaf nul begint. Vraagt eenmalig jouw toestemming:
      //        https://decapi.me/auth/twitch?redirect=subcount&scopes=channel:read:subscriptions+user:read:email
      //        Zonder die toestemming antwoordt DecAPI met proza in plaats
      //        van een getal; de balk zegt dat in de console en telt door
      //        vanaf count hieronder.
      //
      //   'manual' = het getal uit count, plus wat er live binnenkomt. Geen
      //        autorisatie nodig, maar de optelling zit in de pagina en is
      //        dus weg zodra de browser source herlaadt.
      //
      // Wat SE NIET heeft is je aantal actieve subs als losse waarde, en dat
      // is nagemeten in plaats van aangenomen: subscriber-total is een
      // sessieteller (stond op 0 met subs in subscriber-recent),
      // subscriber-recent is een eventlijst zonder afloopdatum, en endpoints
      // als subscribers/<id> of channels/<id>/subscribers geven 404. Hun
      // eigen goal-widgets bevestigen het: die laten je de "min value" zelf
      // op je huidige aantal zetten, "if you already have 150 followers".
      // Een widget dat het wist zou er niet naar vragen.
      source: 'streamelements',
      count : 0,

      // Een nieuwe sub of gift tijdens de stream telt meteen mee in plaats
      // van pas bij de volgende poll -- dat moment is precies waarvoor het
      // balkje er staat. Een resub telt niet: die sub was al actief.
      liveBump: true,
    },
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
    topic: 'Mythic+ push to 3000',
    // note is optioneel en komt als tagje achter de tijd te staan.
    // De dagnaam moet overeenkomen met de lijst in js/scene.js, anders
    // kleurt vandaag niet jade. Die staat in het Engels, net als de rest
    // van wat er op je stream te lezen valt.
    schedule: [
      { day: 'wednesday', time: '20:00 - 23:00', note: 'raid' },
      { day: 'sunday',    time: '20:00 - 23:00', note: 'raid' },
    ],
    // Vul je eigen handles in -- deze verschijnen op de scene-schermen.
    // De guild-regel is informatie voor kijkers, geen huisstijl; weghalen mag.
    socials: [
      { label: 'discord', value: 'bmiest' },
      { label: 'guild',   value: 'Kelderklasse - EU Draenor' },
    ],
  },

  // ---- kanaalgraphics -----------------------------------------------
  // build-graphics.sh rendert hier PNG's uit, op de maten die Twitch wil:
  // offline-scherm 1920x1080, profile banner 1200x480, panels 320 breed.
  // Zelfde tokens en dezelfde ribbons als de overlay, dus je kanaalpagina
  // en je stream lopen niet uit elkaar.
  graphics: {
    tagline: 'Mythic+ and raiding on EU-Draenor',

    // Het infopaneel over de overlay zelf (a=overlay). Geen knop maar een
    // heel paneel: wie op je kanaalpagina doorklikt wil weten wat hij op
    // je stream ziet staan, en dat past niet in één label. De tekst staat
    // hier omdat het jouw woorden zijn, niet die van de overlay.
    about: {
      cap  : 'the overlay',
      title: 'Built in the open',
      body : 'The bars, the alerts and the scene screens on this channel are ' +
             'one static site. No plugin and nothing installed: OBS just ' +
             'points a browser at a page.',
      bullets: [
        'served from GitHub Pages',
        'MIT licensed, fork it',
        'raid data from Raider.IO',
      ],
      // Staat ook als klikdoel onder de panelknop bij Twitch; hier staat
      // hij in beeld, want een PNG is niet aan te klikken.
      url: 'github.com/Bmiest/bmiest_wow_streaming_theme',
    },

    // Eén PNG per knop, vernoemd naar het label. De soort bepaalt icoon en
    // tint; kies er een die bestaat in js/ribbon.js (follow, sub, cheer,
    // tip, raid, clock, chat, link, cam, sword, live, viewers).
    panels: [
      { label: 'discord',   kind: 'link'   },
      { label: 'guild',     kind: 'sword'  },
      { label: 'schedule',  kind: 'clock'  },
      { label: 'about',     kind: 'follow' },
      { label: 'raider.io', kind: 'raid'   },
      { label: 'subscribe', kind: 'sub'    },
      { label: 'tip jar',   kind: 'tip'    },
      { label: 'setup',     kind: 'cam'    },
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
};

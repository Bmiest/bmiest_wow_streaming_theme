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

  // ---- taal ---------------------------------------------------------
  // 'en' of 'nl': de taal van alles wat er op je stream staat. ?lang=nl op
  // de URL van een browser source wint hiervan, en dat is de bedoelde weg:
  // make-obs-collection.py --lang nl zet hem op elke bron. De browsertaal
  // telt op de stream-pagina's bewust niet mee -- OBS neemt die van Windows
  // over, en dan zou je stream ongevraagd van taal wisselen. Speldata
  // (boss-, raid-, characternamen) blijft altijd zoals Blizzard ze noemt.
  // Zie js/i18n.js.
  lang: 'en',

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
    // dan rouleert de kaart per paar -- en de flanken van de pauzeschermen
    // rouleren mee, op dezelfde rotateSeconds. De volgorde hier is de
    // volgorde waarin ze langskomen, dus je hoofdpaar bovenaan.
    characters: [
      { realm: 'ragnaros',        name: 'Shiftheal' },  // cross-realm lid van Kelderklasse
      { realm: 'twisting-nether', name: 'Bhikhu'    },  // cross-realm lid van Kelderklasse
      // Alts, even uit beeld (oktober 2026): met alleen het hoofdpaar
      // rouleert er niets en kon de kaart smaller voor het raceklassement.
      // Terugzetten = weghalen van de //; dan rouleert de kaart weer per paar.
      // { realm: 'ragnaros',        name: 'Beo'       },  // arms warrior
      // { realm: 'ragnaros',        name: 'Beos'      },  // prot paladin
      // { realm: 'ragnaros',        name: 'Beoh'      },  // druid
    ],
    // image: het guildplaatje op de guildpagina van de raidkaart (pad of
    // URL, vierkant werkt het best). Leeg = die pagina zonder plaatje.
    guild: { realm: 'draenor', name: 'Kelderklasse', image: 'img/guild/kelderklasse.png' },
    raidSlug      : '',    // '' = automatisch de nieuwste raid

    // Live boss progress: de boss waar de guild nu op zit, met pullcount,
    // beste percentage en de pull-historie. Draait op de live-tracking
    // endpoints uit Raider.IO's swagger. Gaat er iets stuk, dan verdwijnt
    // alleen dit blok. Zet enabled op false om het uit te schakelen.
    //
    // Raider.IO's voorwaarden: persoonlijk en community-gebruik mag, maar
    // "public-facing applications that use data from this API must include
    // a link back to raider.io". Vandaar het bronlabel op de raidkaart en
    // de characterkaart; haal je dat weg, dan voldoe je niet meer.
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

      // Eigen bossplaatje, naast (en vóór) js/bossart.js. Sleutel is een
      // DungeonEncounterID (als string of getal) of de exacte bossnaam in
      // kleine letters; waarde is één URL of een lijst van ten hoogste twee
      // (tweebossgevechten). Alleen https:// of een relatief pad wordt
      // gebruikt -- zie isArtUrl() in js/alerts.js. Leeg laten gebruikt
      // gewoon wat js/bossart.js voor die boss heeft.
      //   bossArt: { '3421': 'media/vexhul.jpg',
      //              'the twin fangs': ['media/vexhul.jpg', 'media/ithraz.jpg'] },
      bossArt    : {},

      // Volume van elk meldingsgeluid: de klok uit js/chime.js en de clips
      // uit alertSounds (onderaan dit bestand). 0 is stil.
      // Zet in OBS op de alerts-bron 'Control audio via OBS' aan, anders
      // hoort alleen jij het niet en je kijkers wel -- of omgekeerd.
      soundVolume: 0.6,

      // Welke bron de kaart en de meldingen vullen:
      //
      //   'warcraftlogs-first' = WCL wint zodra hij antwoordt, Raider.IO is
      //                          de terugval. Hij draait wel mee, want het
      //                          bossportret en de voortgangsregel (4/8
      //                          Mythic) komen alleen van hem.
      //   'auto'               = de verste stand wint, op tijdstempel, met
      //                          switchAfterSeconds als drempel.
      //   'raiderio'           = vast op Raider.IO, WCL wordt niet opgehaald.
      //   'warcraftlogs'       = vast op WCL, Raider.IO wordt niet opgehaald
      //                          -- dus ook geen portret en geen 4/8-regel.
      //
      // WCL voorop omdat Raider.IO zijn live-tracking uit dezelfde logs
      // afleidt: hij kan per definitie niet vóórlopen, alleen achter. Zie de
      // kop van js/progress.js.
      source     : 'warcraftlogs-first',
      // Hoeveel een bron vóór moet liggen voor de kaart overstapt. Alleen
      // voor 'auto': zonder drempel wipt hij heen en weer tussen twee bronnen
      // die elkaar om beurten een paar seconden verslaan.
      switchAfterSeconds: 60,

      raid       : 'latest',        // of een slug, bv. 'the-venomous-abyss'

      // latest | normal | heroic | mythic. 'latest' betekent bij Raider.IO
      // "waar het laatst iets gebeurde", en dat sleept eenbaas-raids mee:
      // de kaart stond zo op 1/1 Heroic in de Tidebound Grotto terwijl de
      // guild op 2/8 Mythic in de hoofdraid zat. 'mythic' houdt hem op de
      // hoofdtier, dezelfde die de characterkaart toont.
      difficulty : 'mythic',
      period     : 'until_kill',    // until_kill | week
      // Elke 20 seconden, en dat getal hangt aan het puntenbudget van
      // Warcraft Logs (3600 per uur). Er pollen twee pagina's los van elkaar,
      // dus 20s = 360 queries per uur, en met reportLimit 6 op 7 punten is
      // dat 2520 -- 70% van je budget, met ruimte om compare.html open te
      // zetten. Op 30 seconden mét reportLimit 25 zat je op 93%. Zie de kop
      // van js/wcl.js voor de meting; sneller pollen kan alleen als je de
      // prijs per query eerst omlaag brengt.
      pollSeconds: 20,              // alleen voor mode 'native'

      // Hoe lang het ribbonnetje (last try, new best, boss down) over de
      // raidkaart blijft staan. Het schuift over het grote getal en de
      // staafjes, dus zolang het er staat zie je die niet -- wel wat de
      // laatste poging deed, en dat is waar het tijdens het teruglopen over
      // gaat. Stond op 3,2 s voor een wipe en 5,2 s voor de rest: te kort om
      // op stream te lezen.
      flashSeconds: 20,

      // Leeg = automatisch opgebouwd uit region/realm/guild hierboven.
      // Vul in als je de widget-instellingen op raider.io zelf wil kiezen.
      widgetUrl  : '',
    },
    rotateSeconds : 20,
    pollSeconds   : 300,

    // Zet in het bronlabel van de character- en de raidkaart hoe vers de
    // gegevens erin zijn ("raider.io · 21:04"). Dat is de tijd die in de
    // data zit -- Raider.IO's crawl van je character, en de laatste pull
    // die hun live-tracking verwerkt heeft -- en niet het moment waarop
    // deze overlay ophaalde.
    //
    // Precies dat onderscheid is waar het voor bedoeld is: loopt Raider.IO
    // achter met het parsen van je log, dan slagen onze polls gewoon en
    // blijft de kaart op dezelfde stand staan. Een klokje van onze eigen
    // fetch zou dan doortikken en niets melden. Wanneer wij pollen staat in
    // de diagnoseregel (?health=1), want dat hoort niet op je stream.
    //
    // Loopt de bron te ver achter -- een kwartier voor een pull, twaalf uur
    // voor een crawl -- dan komt de ouderdom erbij ("21:04 · 38m late") en
    // kleurt het stempeltje goud. Die twee grenzen verschillen zo veel omdat
    // live-tracking per seconde hoort mee te lopen en een charactercrawl van
    // een paar uur oud gewoon het ritme van Raider.IO is.
    //
    // In widget-modus krijgt de raidkaart geen tijd: die iframe ververst
    // zichzelf op een ander domein, dus wat daar in staat weten we niet.
    showUpdated   : true,
  },

  // ---- warcraft logs (hoofdbron voor de raidkaart) ------------------
  // Staat aan zolang liveTracking.source op 'warcraftlogs-first' (standaard),
  // 'auto' of 'warcraftlogs' staat -- alleen 'raiderio' zet hem uit.
  //
  // Het token komt NIET uit dit bestand maar uit ?wcl=<token> op je browser
  // source, net als het StreamElements-token. En het is een *token*, geen
  // client secret: dat secret mint tokens, leeft 360 dagen, en hoort op je
  // eigen machine te blijven -- niet in een pagina die iedereen kan openen.
  //
  // Een token maken: client aanmaken op warcraftlogs.com/api/clients (laat
  // 'Public Client' uit), dan
  //   curl -u "<client id>:<secret>" -d grant_type=client_credentials \
  //        https://www.warcraftlogs.com/oauth/token
  warcraftlogs: {
    // Het getal uit de URL van je gildepagina op warcraftlogs.com.
    guildId    : 797151,
    guildName  : 'Kelderklasse',
    // De zone van de huidige tier. Op te vragen met worldData{zones{id name}}.
    zoneId     : 53,
    zoneName   : 'The Venomous Abyss',
    difficulty : 'mythic',        // mythic | heroic | normal
    // Hoeveel verslagen elke poll ophaalt. De pullteller hangt er niet aan:
    // die komt uit de hele tier, die elke pagina bij het laden één keer
    // ophaalt (zie history() in js/wcl.js). Dit is wat de kaart heeft als dat
    // mislukt -- en het is de prijs per poll: 25 kost 14 punten, 6 kost er 7,
    // en je hebt er 3600 per uur. Zet je hem hoger, reken pollSeconds na.
    reportLimit: 6,
    token      : '',
  },

  // ---- race to dutch first ------------------------------------------
  // De stand in de race naar Cutting Edge tussen Nederlandse guilds, van
  // racetodutchfirst.nl. Rechtstreeks dat adres: het oude
  // racetodutchfirst.bmiest.be stuurt door, en een browser breekt een
  // ophaalactie naar een ander domein af op een doorverwijzing zonder
  // CORS-header. Op de scene-schermen als regel onder de
  // klok ("6/9 M · #1 of 5 NL · now on ..."), in de onderbalk als rang in de
  // raidkaart. guild leeg = raiderio.guild.name. Lukt ophalen niet, dan
  // verdwijnt alleen dat stukje. Zie js/race.js.
  //
  // Het klassement (elke guild met zijn baan van acht bosses) staat op de
  // scene-schermen onder de klok, en in de onderbalk als tweede pagina van
  // de raidkaart. boardRows: zoveel guilds hoogstens; de jouwe staat er
  // altijd bij. bar: de raidkaart toont bossSeconds de boss en dan
  // raceSeconds het klassement. Na elke pull blijft de boss holdMinutes
  // staan, zodat het klassement nooit een melding verstopt. Na het
  // klassement komt het raceverslag (logSeconds): de laatste logRows kills
  // en beste pogingen van alle guilds; log:false slaat die pagina over.
  // Daarna de guildpagina (guildSeconds): raiderio.guild.image met de
  // wereld-, regio- en realmrang en je beste killrang; guild:false slaat
  // hem over.
  // rotate:false houdt de kaart op de boss. banner.html?page=race of
  // ?page=log zet die pagina vast.
  race: {
    enabled    : true,
    url        : 'https://racetodutchfirst.nl/data/race.json',
    guild      : '',
    pollSeconds: 600,
    boardRows  : 6,
    logRows    : 5,
    bar        : { rotate: true, bossSeconds: 45, raceSeconds: 15, logSeconds: 15,
                   guildSeconds: 12, log: true, guild: true, holdMinutes: 3 },
  },

  // ---- geluid per melding --------------------------------------------
  // Zonder clip piept een raidmelding de klok uit js/chime.js (kill/best) en
  // zeggen de andere meldingen niets. Een clip hier vervangt de klok, of
  // geeft een melding die stil was een stem.
  //
  // Sleutels: kill, best, follow, sub, cheer, tip, raid. Waarde is '' (de
  // klok of stilte), één pad/URL, of een lijst. Een lijst speelt geschud af,
  // en elke clip komt één keer voorbij voor er iets herhaalt -- zie
  // nextSound() in js/alerts.js. Volume: liveTracking.soundVolume.
  //
  // De clips hieronder zijn peon- en orcregels uit de spelbestanden van
  // World of Warcraft, dus Blizzards materiaal en niet MIT; welk bestand
  // waar vandaan komt staat in media/NOTICE.txt. Fork je dit thema, zet dan
  // je eigen clips in media/sounds/ of maak deze leeg. .ogg is het veilige
  // formaat: OBS' ingebouwde Chromium speelt dat altijd af, .mp3 en .m4a
  // hangen van de build af.
  //
  // Lukt afspelen niet (bestand weg, verkeerd formaat), dan valt kill en
  // best terug op de klok; de rest blijft stil, zoals voorheen. Alleen
  // https:// of een relatief pad, dezelfde regel als bossArt hierboven.
  alertSounds: {
    // Wat de peon zegt als het gebouw af is, en twee strijdkreten.
    kill  : ['media/sounds/work-complete.ogg',
             'media/sounds/for-the-horde.ogg',
             'media/sounds/victory-or-death.ogg'],
    // Nog niet dood, wel verder dan ooit: terug aan het werk.
    best  : ['media/sounds/work-work.ogg',
             'media/sounds/something-need-doing.ogg',
             'media/sounds/ill-try.ogg',
             'media/sounds/okie-dokie.ogg'],
    // Een nieuwe peon meldt zich.
    follow: ['media/sounds/ready-to-work.ogg',
             'media/sounds/what-you-want.ogg',
             'media/sounds/not-that-kind-of-orc.ogg'],
    sub   : ['media/sounds/be-happy-to.ogg',
             'media/sounds/i-can-do-that.ogg',
             'media/sounds/dabu.ogg'],
    cheer : '', tip: '', raid: ''
  },

  // ---- vuurwerk bij een SE-melding ------------------------------------
  // Dezelfde vonken als de killmelding (alerts.html), maar klein: een paar
  // bursts naast de melding in plaats van een vlak vol. De kill blijft het
  // grootste moment van de avond -- zelfde argument als "een nieuwe beste
  // poging krijgt niets" -- dus deze tellers blijven ver onder de bursts
  // van een kill.
  //
  // Sleutels: follow, sub, cheer, tip, raid. Waarde is het aantal bursts;
  // 0 is geen vuurwerk. Follow staat lager dan de rest: bij een follow-trein
  // (vlak na elkaar) krijgt elke follow zijn eigen show, en te veel bursts
  // per stuk stapelt dan op tot chaos in plaats van een leuk extraatje.
  alertFireworks: {
    follow: 4, sub: 8, cheer: 6, tip: 6, raid: 10,
  },

  // ---- doelen -------------------------------------------------------
  goals: {
    followers: 200,

    // Subdoel: teller plus balk in de bovenbalk, met de eerstvolgende
    // beloning als bijschrift op de rand. Tot en met twaalf wordt de balk
    // een rij vakjes -- "drie van tien" lees je zo in een oogopslag, waar
    // een balk op 30% je laat rekenen. Daarboven een gewone balk.
    subs: {
      // Trappen. Elke trap is een aantal subs met wat je daarvoor doet; de
      // hoogste bepaalt hoe lang de balk is. Op de rand staat steeds de
      // eerstvolgende die je nog niet gehaald hebt, want dat is de enige die
      // je kijkers nog iets kan schelen. Gehaalde trappen kleuren goud.
      //
      // Eén trap mag ook: dan is het gewoon een doel met een beloning.
      tiers: [
        { at:  5, reward: 'priest/monk wig' },
        { at: 10, reward: 'priest/monk wig', note: 'till end of tier' },
      ],

      // Plaatje van de beloning, te zien in de melding bij elke sub. Leeg
      // laten geeft de getekende wig uit js/ribbon.js. Wil je een foto, zet
      // hem dan op media/reward.jpg en vul dat pad hier in -- dat pad staat
      // in .gitignore, want een productfoto van een verkoper is andermans
      // materiaal en hoort niet in een publieke repo onder MIT. Zie
      // media/NOTICE.txt. Een eigen foto van je eigen wig mag natuurlijk wel
      // mee; haal hem dan uit .gitignore.
      image: '',

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
      //        deze grootte zie je dat gebeuren, en dan corrigeer je het
      //        getal in datzelfde scherm.
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
    // kleurt vandaag niet jade. Schrijf hem in het Engels; met lang 'nl'
    // toont de pagina hem zelf als 'woensdag'.
    //
    // Onder de lijst staat hoe lang het nog duurt tot de eerstvolgende
    // ("next raid in 2d 4h"). Daarvoor moet time als 'uu:mm - uu:mm'
    // geschreven zijn; een regel die zo niet leest telt niet mee. De tijden
    // gelden in scheduleTimeZone, niet in de tijdzone van de pc waar OBS op
    // draait. Staat er bij de eerstvolgende note 'raid', dan zegt hij raid,
    // anders stream.
    schedule: [
      { day: 'wednesday', time: '20:00 - 23:00', note: 'raid' },
      { day: 'sunday',    time: '20:00 - 23:00', note: 'raid' },
    ],
    scheduleTimeZone: 'Europe/Brussels',
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
    tagline: 'Super average mythic raiding on EU-Draenor',

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
        'raid data from Raider.IO and Warcraft Logs',
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

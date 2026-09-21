/* Welke bron vertelt de raidkaart? -- Raider.IO of Warcraft Logs.

   Beide beschrijven hetzelfde: de boss waar je op zit, hoeveel pulls, hoe
   ver je kwam, welke fase, en of hij ligt. Ze lopen alleen niet gelijk.
   Raider.IO leidt zijn live-tracking af van dezelfde logs die WCL bewaart,
   dus hij kan achterlopen maar niet vooruit. Gemeten op 17 september 2026,
   dezelfde minuut:

       WCL        21 pulls, kill
       Raider.IO  19 pulls, geen kill   (terwijl zijn eigen regel al 4/8 zei)

   ---- wie er standaard wint ------------------------------------------
   Warcraft Logs, zodra hij antwoordt. Dat is `source` op
   'warcraftlogs-first', en het is een keuze uit de praktijk: Raider.IO leidt
   zijn live-tracking af van dezelfde logs, dus hij kan per definitie niet
   vooruit lopen -- en in september 2026 liep hij er vaak genoeg achter of lag
   hij er helemaal uit. Een bron die alleen maar kan achterlopen is geen bron
   om op te wachten.

   Raider.IO blijft wel meedraaien, en dat is het verschil met 'warcraftlogs'
   (die pint hem vast en haalt de ander niet eens op):

   - valt WCL weg, dan vult Raider.IO de kaart alsnog;
   - het bossportret en de voortgangsregel (4/8 Mythic) komen hoe dan ook van
     hem, want die heeft WCL niet -- zie borrow() hieronder.

   Bijvangst voor de melding over je beeld: die kijkt naar het *verschil*
   tussen twee polls, en de watcher in js/rio-live.js ijkt opnieuw zodra de
   bron wisselt -- die ene poll meldt dan niets. Tijdens progressie wisselden
   de twee zowat elke pull van plek (Raider.IO stempelt een pull als hij
   begint, WCL pas als het segment geüpload is), en dat heen en weer is hier
   weg.

   Hier stond eerst dat er daarmee "niets meer te wisselen valt". Dat klopt
   niet, en het is het soort zin dat een gat afdekt: valt WCL één poll uit,
   dan levert pick() hieronder Raider.IO ('only'), wisselt de bron alsnog, en
   op de poll erna terug. Twee keer opnieuw ijken, en een kill of een nieuwe
   beste poging die daartussen valt komt nooit in beeld. De echte oplossing
   zit in watcher(): die zou per bron een stand moeten bijhouden in plaats van
   bij elke wissel te vergeten wat hij wist. Zolang dat er niet is, is dit een
   bekend gat en geen opgelost probleem.

   ---- de keuze in 'auto' ---------------------------------------------
   De verste stand wint, op tijdstempel. Niet "WCL altijd als hij antwoordt":
   het tellen van pulls-over-avonden-heen doen we zelf in js/wcl.js, en een
   fout daarin zou dan stilletjes op je stream staan. Zo houden de twee
   bronnen elkaar tegen het licht -- loopt onze WCL-telling achter op wat
   Raider.IO ziet, dan wint Raider.IO en zie je dat aan het bronlabel.

   Wisselen doet hij pas als de ander een minuut vóór ligt. Zonder die drempel
   wipt de kaart tijdens een raid heen en weer tussen twee bronnen die elkaar
   om beurten een paar seconden verslaan, en dat leest als kapot.

   ---- samenvoegen en niet vervangen ----------------------------------
   Twee dingen heeft alleen Raider.IO: het bossportret (dat achter de
   schermvullende melding staat) en de voortgangsregel (4/8 Mythic). Die
   laatste kunnen we niet uit WCL halen -- daar zit Nymrissa Wavecaller in de
   encounterlijst van de tier terwijl het een losse raid is, dus tellen geeft
   5/8 waar iedereen 4/8 toont. Wint WCL, dan nemen we die twee velden alsnog
   van Raider.IO over, zolang het over dezelfde boss gaat.

   ---- geheugen -------------------------------------------------------
   Valt alles weg, dan blijft de laatste geslaagde stand staan in plaats van
   dat de kaart leegloopt. Dat is precies wat er op 15 september misging: hun
   API lag eruit en de kaart had niets om op terug te vallen. Een bewaarde
   stand krijgt stale:true mee, zodat de kaart hem gedempt kan tonen. */
(function(){
'use strict';
var U   = window.U;
var LT  = (U.CFG.raiderio && U.CFG.raiderio.liveTracking) || {};
var MODES = { 'warcraftlogs-first':1, 'auto':1, 'raiderio':1, 'warcraftlogs':1 };
var SRC = LT.source || 'warcraftlogs-first';
/* Een waarde die we niet kennen is een typefout, en die hoort zichtbaar te
   zijn. Toen de keuze hieronder nog met == 'auto' werkte viel zo'n typefout
   vanzelf op (dan stond er 'no source'), maar met de huidige tests glijdt hij
   er stilletjes doorheen en draait de kaart als 'auto'. Vandaar: terugvallen
   op de standaard, en het onder ?health=1 melden. */
var BAD = !MODES[SRC];
if(BAD) SRC = 'warcraftlogs-first';
var LEAD = (LT.switchAfterSeconds != null ? LT.switchAfterSeconds : 60) * 1000;
var KEY = 'overlay.progress.last';

/* Welke bron nu in beeld staat. Blijft binnen deze pagina; een herladen
   browser source begint gewoon opnieuw met kiezen. */
var held = null;

function cacheGet(){
  try {
    var raw = localStorage.getItem(KEY);
    if(!raw) return null;
    var o = JSON.parse(raw);
    return (o && o.rec) ? o : null;
  } catch(e){ return null; }
}

function cacheSet(rec){
  try { localStorage.setItem(KEY, JSON.stringify({ rec: rec, at: Date.now() })); }
  catch(e){ /* private window, geblokkeerde site-data: dan zonder geheugen */ }
}

function tryLoad(fn){
  try { return fn().catch(function(){ return null; }); }
  catch(e){ return Promise.resolve(null); }
}

/* Alleen de velden die alleen Raider.IO heeft, en alleen als het over
   dezelfde boss gaat -- anders hangt het portret van de vorige boss achter
   de melding van de volgende. */
function borrow(win, rio){
  if(!rio || !win) return win;
  if(win.bossName && rio.bossName && win.bossName !== rio.bossName) return win;
  if(!win.bossImg && rio.bossImg) win.bossImg = rio.bossImg;
  if(!win.summary && rio.summary) win.summary = rio.summary;
  if(win.total == null && rio.total != null){
    win.total  = rio.total;
    win.tier   = rio.tier;
    win.normal = rio.normal; win.heroic = rio.heroic; win.mythic = rio.mythic;
  }
  return win;
}

/* Zuiver: welke bron er nu staat komt van de aanroeper mee. load() houdt zijn
   eigen stand bij en compare.html de zijne, en juist daardoor komt die pagina
   op hetzelfde oordeel uit als de kaart. Las deze functie de stand uit de
   module, dan stond hij op compare.html eeuwig op null en kon die pagina het
   ene geval waar de drempel voor bestaat niet eens laten zien.

   De sleutels in `why` zijn codes en geen zinnen: de kaart en die pagina
   schrijven er hun eigen tekst bij, en zo lekt er geen Nederlands een Engels
   scherm op. */
function pick(wcl, rio, held, mode){
  var m = mode || SRC;

  /* Vastgepind: dan telt de ander niet mee, ook niet als hij als enige
     antwoordt. load() haalt hem in die stand niet eens op -- maar compare.html
     haalt allebei de bronnen zelf op, en zonder deze twee regels meldde die
     pagina 'warcraftlogs' terwijl de kaart op Raider.IO vastzat. Precies de
     leugen die hij moet vangen. */
  if(m === 'raiderio')     return rio ? { rec: rio, why: 'pinned' } : null;
  if(m === 'warcraftlogs') return wcl ? { rec: wcl, why: 'pinned' } : null;

  if(wcl && !rio) return { rec: wcl, why: 'only' };
  if(rio && !wcl) return { rec: rio, why: 'only' };
  if(!wcl && !rio) return null;

  /* Vaste winnaar. Bewust onder de gevallen hierboven: antwoordt WCL niet,
     dan valt de kaart op Raider.IO terug in plaats van leeg te lopen. */
  if(m === 'warcraftlogs-first') return { rec: wcl, why: 'preferred' };

  /* Geen tijdstempel is geen mening. Raider.IO levert er geen zodra bosspulls
     wegvalt (die mag falen) en er nog geen pull loopt -- dat betekent "ik weet
     het niet", niet "oneindig oud". Met `|| 0` erin won de ander met
     anderhalf miljard seconden voorsprong, dwars langs de drempel heen, en
     dan stond de kaart vast op één bron tot de andere weer een tijd had. */
  var a = wcl.updated, b = rio.updated;
  if(a == null && b == null)
    return { rec: held === 'raiderio' ? rio : wcl, why: 'untimed' };
  if(a == null) return { rec: rio, why: 'only-timed' };
  if(b == null) return { rec: wcl, why: 'only-timed' };

  var lead = a - b;

  /* Wie er staat, blijft staan tot de ander echt vooruit ligt. */
  if(held === 'warcraftlogs' && lead > -LEAD) return { rec: wcl, why: 'held' };
  if(held === 'raiderio'     && lead <  LEAD) return { rec: rio, why: 'held' };

  return lead >= 0 ? { rec: wcl, why: 'ahead' } : { rec: rio, why: 'ahead' };
}

function load(){
  /* Alleen 'raiderio' zet WCL uit, en alleen 'warcraftlogs' zet Raider.IO
     uit. 'warcraftlogs-first' haalt ze dus allebei op: de een wint altijd, de
     ander levert het portret, de voortgangsregel en de terugval. */
  var wantW = SRC !== 'raiderio'     && window.WCL && window.WCL.available();
  var wantR = SRC !== 'warcraftlogs' && window.RioLive;

  /* Zolang WCL de kaart hoort te vullen heeft Raider.IO alleen nog het
     portret en de voortgangsregel te leveren, en die staan in boss-progress.
     Dan hoeft zijn tweede endpoint niet mee. */
  var light = wantW && SRC === 'warcraftlogs-first';

  return Promise.all([
    wantW ? tryLoad(function(){ return window.WCL.load(); }) : Promise.resolve(null),
    wantR ? tryLoad(function(){ return window.RioLive.load({ light: light }); })
          : Promise.resolve(null)
  ]).then(function(res){
    var wcl = res[0], rio = res[1];

    /* WCL antwoordde niet, dus Raider.IO moet de kaart tóch vullen -- en dan
       hebben we zijn pulls alsnog nodig voor de staafjes en de duur. Eén extra
       verzoek, alleen op het faalpad. Mislukt ook dat, dan gaan we verder met
       de lichte stand: minder in beeld is beter dan een lege kaart. */
    if(!wcl && rio && rio.light)
      return tryLoad(function(){ return window.RioLive.load(); })
        .then(function(full){ return finish(wcl, full || rio); });

    return finish(wcl, rio);
  });
}

/* De keuze vellen en opbergen. Zat eerst in load()'s .then; het staat nu los
   omdat er twee wegen naartoe lopen -- de gewone, en die waarop Raider.IO
   alsnog volledig opgehaald moest worden. */
function finish(wcl, rio){
  var got = pick(wcl, rio, held);

  if(!got){
    /* Niets binnen. De laatste stand dan maar, met een vlag erop. */
    var c = cacheGet();
    U.setHealth('progress', false, c ? 'using remembered reading' : 'no source');
    if(!c) return null;
    var old = c.rec;
    old.stale = true;
    old.staleSince = c.at;
    return old;
  }

  var rec = got.rec;
  rec.stale = false;
  borrow(rec, rio);
  held = rec.source;

  /* Deze regel staat achter ?health=1 op je stream, dus Engels net als de
     rest van wat in beeld komt. */
  U.setHealth('progress', true,
    rec.source + (wcl && rio ? ' (' + got.why + ')' : '') +
    (BAD ? ' \u00b7 unknown source setting, using the default' : ''));
  cacheSet(rec);
  return rec;
}

window.Progress = { load: load, pick: pick };
})();

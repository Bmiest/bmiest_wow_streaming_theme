/* Welke bron vertelt de raidkaart? -- Raider.IO of Warcraft Logs.

   Beide beschrijven hetzelfde: de boss waar je op zit, hoeveel pulls, hoe
   ver je kwam, welke fase, en of hij ligt. Ze lopen alleen niet gelijk.
   Raider.IO leidt zijn live-tracking af van dezelfde logs die WCL bewaart,
   dus hij kan achterlopen maar niet vooruit. Gemeten op 17 september 2026,
   dezelfde minuut:

       WCL        21 pulls, kill
       Raider.IO  19 pulls, geen kill   (terwijl zijn eigen regel al 4/8 zei)

   ---- de keuze -------------------------------------------------------
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
var SRC = LT.source || 'auto';            // auto | raiderio | warcraftlogs
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

function pick(wcl, rio){
  if(wcl && !rio) return { rec: wcl, why: 'enige bron' };
  if(rio && !wcl) return { rec: rio, why: 'enige bron' };
  if(!wcl && !rio) return null;

  var a = wcl.updated || 0, b = rio.updated || 0;
  var lead = a - b;

  /* Wie er staat, blijft staan tot de ander echt vooruit ligt. */
  if(held === 'warcraftlogs' && lead > -LEAD) return { rec: wcl, why: 'blijft staan' };
  if(held === 'raiderio'     && lead <  LEAD) return { rec: rio, why: 'blijft staan' };

  return lead >= 0 ? { rec: wcl, why: 'verste stand' }
                   : { rec: rio, why: 'verste stand' };
}

function load(){
  var wantW = (SRC === 'auto' || SRC === 'warcraftlogs') &&
              window.WCL && window.WCL.available();
  var wantR = (SRC === 'auto' || SRC === 'raiderio') && window.RioLive;

  return Promise.all([
    wantW ? tryLoad(window.WCL.load)     : Promise.resolve(null),
    wantR ? tryLoad(window.RioLive.load) : Promise.resolve(null)
  ]).then(function(res){
    var wcl = res[0], rio = res[1];
    var got = pick(wcl, rio);

    if(!got){
      /* Niets binnen. De laatste stand dan maar, met een vlag erop. */
      var c = cacheGet();
      U.setHealth('progress', false, c ? 'terug op geheugen' : 'geen bron');
      if(!c) return null;
      var old = c.rec;
      old.stale = true;
      old.staleSince = c.at;
      return old;
    }

    var rec = got.rec;
    rec.stale = false;
    /* js/rio-live.js zet zelf geen bronnaam; die is daar impliciet. */
    if(!rec.source) rec.source = 'raiderio';
    borrow(rec, rio);
    held = rec.source;

    U.setHealth('progress', true,
      rec.source + (wcl && rio ? ' (' + got.why + ')' : ''));
    cacheSet(rec);
    return rec;
  });
}

window.Progress = { load: load, pick: pick };
})();

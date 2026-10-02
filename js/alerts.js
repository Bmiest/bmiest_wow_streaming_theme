/* Alert-wachtrij. Eén tegelijk, netjes achter elkaar.
   Zet StreamElements' eigen alert-overlay uit als je deze gebruikt,
   anders krijg je alles dubbel. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, R = window.Ribbon;
var T = window.I18N.t;
/* ?test=1 loopt alles af, ?test=kill of ?test=best pakt er één. Anders moet
   je dertig seconden wachten tot de cyclus bij de melding is die je wil
   zien -- die twee staan achteraan. */
var TEST = (location.search.match(/[?&]test=([a-z0-9]+)/) || [])[1];

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  stage.style.width  = dw + 'px';
  stage.style.height = (CFG.alertHeight || 1072) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';
})();

var LABEL = {
  follow:T('alert.follow'), sub:T('alert.sub'), cheer:T('alert.cheer'),
  tip:T('alert.tip'), raid:T('alert.raid')
};

var HOLD  = 5200;

/* Volume van de raidmelding, 0 zet het geluid uit. Welke gebeurtenissen een
   melding geven regelt liveTracking.alerts. */
var SOUND = (function(){
  /* ?mute=1 zet het geluid uit zonder de config aan te raken. De previews op
     de voorpagina staan daarop: een pagina die uit zichzelf begint te piepen
     zodra je hem opent is geen visitekaartje. */
  if(/[?&]mute=1/.test(location.search)) return 0;
  var LT = (CFG.raiderio && CFG.raiderio.liveTracking) || {};
  return LT.soundVolume == null ? 0.6 : LT.soundVolume;
})();

/* ---- bossart: renders van de boss achter de kill-melding -------------
   js/bossart.js (los gegenereerd bestand, kan ontbreken -- de pagina moet
   het zonder kunnen) levert 600x600 renders per DungeonEncounterID, met tot
   twee bossen per encounter (tweebossgevechten). CFG...bossArt gaat daarvoor
   -- een eigen plaatje neerzetten zonder op een nieuwe build van dat
   bestand te wachten.

   Volgorde: eigen config (op encounter-ID, anders op naam), dan
   bossart.js op encounter-ID, dan bossart.js op naam. Encounter-ID eerst,
   want de naam is tekst uit twee verschillende bronnen (Raider.IO,
   Warcraft Logs) die niet altijd letterlijk gelijk gespeld is -- de ID is
   dat wel. */
var BOSS_ART = ((CFG.raiderio && CFG.raiderio.liveTracking) || {}).bossArt || {};

/* Alleen https:// of een relatief pad. bossArt is config en js/bossart.js is
   een gegenereerd bestand, maar allebei zijn het uiteindelijk invoer die in
   style.backgroundImage terechtkomt -- 'javascript:' of 'data:' als stijl
   boss-plaatje hoort daar niet in. */
function isArtUrl(s){
  return typeof s === 'string' && s.length > 0 &&
    (/^https:\/\//.test(s) || !/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(s));
}

/* Geeft 0, 1 of 2 URL's terug -- nooit meer, ook niet als de config of
   bossart.js zelf een langere lijst levert (zie de layout in
   css/alerts.css: één render tegen de rechterflank, twee tegen allebei). */
function artUrls(encounter, bossName){
  var name   = String(bossName || '').toLowerCase();
  var encKey = encounter != null ? String(encounter) : null;

  var override = encKey != null ? BOSS_ART[encKey] : null;
  if(override == null && name) override = BOSS_ART[name];
  if(override != null){
    return (Array.isArray(override) ? override : [override]).slice(0, 2).filter(isArtUrl);
  }

  var BA   = window.BossArt || {};
  var enc  = encKey != null ? encKey : (BA.byName && BA.byName[name]);
  var list = enc != null && BA.byEncounter && BA.byEncounter[enc];
  if(!list) return [];
  return list.map(function(entry){ return entry && entry.img; }).filter(isArtUrl);
}

/* ---- achtergrond wegkeren uit een render ------------------------------
   OBS componeert een browser source als een textuur met alpha; je gameplay
   zit niet IN de pagina. Dat maakt mix-blend-mode:screen zinloos voor een
   scherpe render: waar de rgb(24,24,24)-grond van het model staat, is de
   pixel gewoon een ondoorzichtig bijna-zwart vlak (alpha 1), en dat is
   donkerder dan de halfdoorzichtige was eromheen -- dus zie je een harde
   rand waar het canvas ophoudt. contrast() vóór screen verandert daar niets
   aan: het verft de grond zwarter, maar maakt 'm niet doorzichtig. Er was
   hier eerder een oudere versie van dit bestand die claimde dat screen
   "zwart niet laat meetellen" -- dat klopt alleen als er iets ACHTER de
   laag zit binnen dezelfde compositie (zoals bij .raid__art, dat over de
   halfdoorzichtige was van de melding zelf ligt); tegen OBS' eigen
   textuur-alpha helpt het niet, en dat is precies waar deze functie voor
   is: de grond er echt uit knippen, met een canvas, vóórdat de laag ooit in
   beeld komt.

   Vlamvullen vanaf de rand: elke randpixel die op de achtergrondkleur lijkt
   wordt doorzichtig, en dat golft verder naar binnen zolang de buren ook
   op die kleur lijken. Donker harnas MIDDEN in een model blijft zo gewoon
   staan, ook al lijkt het bijna net zo donker als de grond -- het is niet
   met de rand verbonden via een aaneengesloten vlak van gelijke kleur.

   Vier hoeken eerst gecheckt (moeten ondoorzichtig zijn en onderling binnen
   ART_CORNER_TOLERANCE liggen): staat er geen egale grond -- een eigen PNG
   uit bossArt met zijn eigen alpha bijvoorbeeld -- dan raken we niets aan en
   gebruiken we het plaatje zoals het is. ART_KEY_TOLERANCE is ruimer dan de
   hoektolerantie, want JPEG-compressie maakt van één egale kleur een waaier
   van net iets andere buurpixels. De rand van wat overblijft krijgt halve
   alpha in plaats van een harde overgang, anders zie je toch weer een
   kartelrand -- nu gewoon op vonkgrootte in plaats van op canvasgrootte. */
var ART_CORNER_TOLERANCE = 6;
var ART_KEY_TOLERANCE    = 10;

function keyFlood(imgData, w, h){
  var px = imgData.data;

  function ch(i, k){ return px[i * 4 + k]; }
  function close3(i, j, tol){
    return Math.abs(ch(i,0) - ch(j,0)) <= tol &&
           Math.abs(ch(i,1) - ch(j,1)) <= tol &&
           Math.abs(ch(i,2) - ch(j,2)) <= tol;
  }

  var pTL = 0, pTR = w - 1, pBL = (h - 1) * w, pBR = (h - 1) * w + (w - 1);
  if(ch(pTL,3) < 255 || ch(pTR,3) < 255 || ch(pBL,3) < 255 || ch(pBR,3) < 255) return false;
  if(!close3(pTL,pTR,ART_CORNER_TOLERANCE) || !close3(pTL,pBL,ART_CORNER_TOLERANCE) ||
     !close3(pTL,pBR,ART_CORNER_TOLERANCE)) return false;

  var bgR = ch(pTL,0), bgG = ch(pTL,1), bgB = ch(pTL,2);
  var n = w * h;
  var isBg = new Uint8Array(n), seen = new Uint8Array(n), stack = [];

  function consider(x, y){
    if(x < 0 || y < 0 || x >= w || y >= h) return;
    var p = y * w + x;
    if(seen[p]) return;
    seen[p] = 1;
    if(ch(p,3) < 255 ||
       (Math.abs(ch(p,0)-bgR) <= ART_KEY_TOLERANCE &&
        Math.abs(ch(p,1)-bgG) <= ART_KEY_TOLERANCE &&
        Math.abs(ch(p,2)-bgB) <= ART_KEY_TOLERANCE)){
      isBg[p] = 1;
      stack.push(p);
    }
  }

  for(var x = 0; x < w; x++){ consider(x,0); consider(x,h-1); }
  for(var y = 0; y < h; y++){ consider(0,y); consider(w-1,y); }
  while(stack.length){
    var p = stack.pop();
    var py = (p / w) | 0, px2 = p - py * w;
    consider(px2-1,py); consider(px2+1,py); consider(px2,py-1); consider(px2,py+1);
  }

  for(var q = 0; q < n; q++) if(isBg[q]) px[q*4+3] = 0;

  /* randvervaging: halve alpha op een voorgrondpixel die aan een weggevallen
     pixel grenst */
  for(var yy = 0; yy < h; yy++){
    for(var xx = 0; xx < w; xx++){
      var pp = yy * w + xx;
      if(isBg[pp]) continue;
      if((xx > 0 && isBg[pp-1]) || (xx < w-1 && isBg[pp+1]) ||
         (yy > 0 && isBg[pp-w]) || (yy < h-1 && isBg[pp+w])){
        px[pp*4+3] = Math.round(px[pp*4+3] * 0.5);
      }
    }
  }
  return true;
}

/* Cache per bron-URL: 'pending' (nog bezig), 'done' (entry.url is bruikbaar
   -- de weggekeerde blob, of de bron zelf als er geen egale grond was om weg
   te keren) of 'failed' (CORS/decodeerfout; entry.url is dan de rauwe bron
   en entry.masked staat aan, zodat de aanroeper een ovaal masker gebruikt in
   plaats van een harde rand). preloadArt() hieronder start dit ruim voor
   een kill al op; renderRaid() hergebruikt gewoon dezelfde cache-entry. */
var artCache = {};
function keyArt(url){
  var hit = artCache[url];
  if(hit) return hit;

  var entry = { status:'pending', url:null, masked:false };
  artCache[url] = entry;

  function done(u, masked){
    entry.status = 'done'; entry.url = u; entry.masked = !!masked;
    entry.resolve(entry);
  }
  function failed(){
    entry.status = 'failed'; entry.url = url; entry.masked = true;
    entry.resolve(entry);
  }

  entry.promise = new Promise(function(resolve){
    entry.resolve = resolve;
    var img = new Image();
    /* render.worldofwarcraft.com stuurt Access-Control-Allow-Origin:*, dus
       dit tekent zonder het canvas te 'besmetten'. Een eigen bossArt-URL
       zonder CORS faalt hier in plaats van te taineren -- vandaar de vangst
       hieronder in plaats van een stilzwijgend kapot canvas. */
    img.crossOrigin = 'anonymous';
    img.onerror = failed;
    img.onload = function(){
      var w = img.naturalWidth, h = img.naturalHeight;
      if(!w || !h) return failed();
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var data;
      try { data = ctx.getImageData(0, 0, w, h); }
      catch(e){ return failed(); }

      if(!keyFlood(data, w, h)){
        /* Geen egale grond gevonden -- eigen alpha, met rust laten. */
        return done(url, false);
      }
      ctx.putImageData(data, 0, 0);
      cv.toBlob(function(blob){
        if(!blob) return failed();
        done(URL.createObjectURL(blob), false);
      });
    };
    img.src = url;
  });

  return entry;
}

/* keyArt() opstarten per URL, één keer: zo is het canvaswerk al klaar tegen
   de tijd dat de kill afgaat, in plaats van pas dan te beginnen. keyArt()
   memoiseert zelf op url, dus dubbel aanroepen (bv. dezelfde render die
   straks ook de was vult) kost niets extra. */
function preloadArt(L){
  artUrls(L.encounter, L.bossName).forEach(function(u){ keyArt(u); });
}

/* Hangt een weggekeerde afbeelding op als achtergrond van cls, en wacht
   erop als hij nog niet klaar is (typisch alleen bij de allereerste kill
   van een sessie, vóór een poll 'm kon voorladen) -- pas dan komt het
   element in de DOM, dus zijn intro-animatie (css/alerts.css) begint vanaf
   dat moment vanzelf, in plaats van een kant-en-klare laag die ineens van
   niets naar een plaatje springt. maskedClass staat alleen aan bij een
   mislukte wegkering, voor het ovale noodmasker. */
function placeKeyedArt(node, url, cls, maskedClass){
  var entry = keyArt(url);
  function place(e){
    var l = U.el('div', cls + (maskedClass && e.masked ? ' ' + maskedClass : ''));
    l.style.backgroundImage = 'url("' + e.url + '")';
    node.appendChild(l);
  }
  if(entry.status === 'pending') entry.promise.then(place);
  else place(entry);
}

/* Gildenaam op de kill-melding. L.guild komt van de live-tracking-bron zelf
   (Warcraft Logs of Raider.IO); ontbreekt dat, dan valt het terug op de
   config -- allebei beschrijven dezelfde ene guild die deze overlay draait,
   dus er is altijd een antwoord. */
function guildOf(L){
  return (L && L.guild) ||
    (CFG.warcraftlogs && CFG.warcraftlogs.guildName) ||
    (CFG.raiderio && CFG.raiderio.guild && CFG.raiderio.guild.name) || '';
}
/* ---- de beloning bij een sub ----------------------------------------
   Boven de melding, zodat wie net gesubd heeft ziet waar hij aan meebetaalt.
   Getekend uit js/ribbon.js, tenzij goals.subs.image naar een eigen plaatje
   wijst. Het bijschrift komt uit dezelfde config als het doel op de
   bovenbalk, dus de belofte staat maar op een plek. */
var SUB = (CFG.goals && CFG.goals.subs) || {};

/* Dezelfde trappen als de bovenbalk, en dezelfde regel: toon de
   eerstvolgende die nog niet gehaald is. Daarvoor is de stand nodig, dus
   die komt uit SE's doelteller -- lukt dat niet, dan valt hij terug op de
   eerste trap, wat aan het begin van een doel het juiste antwoord is. */
var TIERS = (SUB.tiers && SUB.tiers.length
      ? SUB.tiers.slice()
      : (SUB.target ? [{ at:SUB.target, reward:SUB.reward, note:SUB.note }] : []))
    .filter(function(t){ return t && t.at > 0; })
    .sort(function(a, b){ return a.at - b.at; });

var subCount = 0;
if(window.SE && window.SE.onSession){
  window.SE.onSession(function(d){
    var g = d && d['subscriber-goal'];
    if(g && typeof g.amount === 'number') subCount = g.amount;
  });
}

function nextTier(){
  for(var i = 0; i < TIERS.length; i++) if(subCount < TIERS[i].at) return TIERS[i];
  return TIERS[TIERS.length - 1];
}

function reward(){
  var tier = nextTier();
  if(!tier && !SUB.image) return document.createDocumentFragment();
  var wrap = U.el('div','alert__reward');

  if(SUB.image){
    var img = U.el('img','alert__wig');
    img.alt = '';
    /* Eerst in de DOM, dan pas de src: valt het laden om, dan moet er iets
       zijn om te vervangen. Ontbreekt het bestand, dan komt de tekening
       ervoor in plaats van een kapot plaatje over je stream. */
    wrap.appendChild(img);
    img.onerror = function(){
      var d = U.el('div','alert__wig');
      d.innerHTML = R.WIG;
      if(img.parentNode === wrap) wrap.replaceChild(d, img);
    };
    img.src = SUB.image;
  } else {
    var d = U.el('div','alert__wig');
    d.innerHTML = R.WIG;
    wrap.appendChild(d);
  }

  if(tier && tier.reward){
    var done = subCount >= tier.at;
    wrap.appendChild(U.el('div','alert__promise',
      (done ? tier.reward + ' unlocked' : tier.reward + ' at ' + tier.at) +
      (tier.note ? ' \u00b7 ' + tier.note : '')));
  }
  return wrap;
}

var stage = document.getElementById('stage');
var box   = document.getElementById('alertHost');
var rbox  = document.getElementById('raidHost');
var queue = [], busy = false;

/* Raidmelding over het hele vlak: eyebrow, de boss groot, en de cijfers van
   die poging eronder. Zelfde blokjes als de stats in de characterkaart, dus
   groot mono getal met een klein label. De was erachter is vlak en half
   doorzichtig -- je gameplay blijft er vaag door zichtbaar, en een egaal
   vlak kost de encoder minder dan een verloop. */
/* Vuurwerk, alleen bij een kill. Eerst een rustige opbouw, dan een dichte
   hoofdshow, dan een finale over de volle breedte -- de tijdlijn staat
   hieronder bij buildShow(). Een nieuwe beste poging krijgt niets: als een
   wipe ook al vuurwerk kreeg, zegt het bij een kill niets meer.

   Twee geneste elementen per vonk: de buitenste vliegt radiaal weg met een
   ease-out, de binnenste valt met een ease-in. Twee transform-animaties op
   één element gaat niet, en geneste transforms vermenigvuldigen -- dus krijg
   je zo een parabool in plaats van een rechte lijn, en dat is het verschil
   tussen vuurwerk en een asterisk. Vier vormen delen die opbouw (addRing()
   hieronder), op de gewone ring na alle drie nieuw:
     ring     de bestaande burst, nu met wisselende straal en telling
     double   dezelfde ring, met een kleinere ring in een tweede kleur erbinnen
     willow   goud, lang leven (~2,4s), zware val, kleine vonken -- een wilg
              die naar beneden hangt in plaats van een knal die openspringt
     crackle  kleine vonken die knipperen (getrapte opacity, css/alerts.css)
              in plaats van vloeiend uit te doven

   Deterministisch, net als de stofjes op de scene-schermen: elke kill ziet
   er hetzelfde uit. Een boss down is één keer per avond, dus dit hoeft niet
   te variëren -- en beweging die je kan nagaan is makkelijker bij te stellen
   dan beweging die elke keer anders is.

   Bij tien handgeplaatste bursts (de oude tabel hier) was dat met de hand te
   overzien en na te rekenen. Bij vijfenveertig tot vijfenvijftig is dat niet
   meer zo, en zo'n tabel met de hand uitschrijven -- en bij elke aanpassing
   opnieuw alle marges nakijken -- is precies het soort werk waar een paar
   regels code beter in zijn dan een mens met een rekenmachine. mulberry32
   hieronder is een kleine, seeded PRNG: dezelfde seed geeft bij elke aanroep
   dezelfde reeks getallen, dus de show blijft net zo deterministisch als de
   oude tabel, terwijl de tabel zelf nu uitgerekend wordt in plaats van
   overgetypt. Een handgeschreven tabel van deze omvang was net zo geldig
   geweest; dit schaalt alleen beter als er ooit weer iets aan de tijdlijn
   verandert. */
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* Vaste seed: welk getal het is maakt niet uit, alleen dat het altijd
   hetzelfde is -- dat is wat de show deterministisch houdt. */
var FW_SEED = 20260928;

/* Maten in doekpixels, en dat doek is 2560 breed, 1072 hoog. Eerste versie
   (de oude SHOTS-tabel) stond op stipjes van 3px en een radius van 210: op
   zich netjes, maar naast een bossnaam van 132px zag je er niets van. Alles
   staat nu op de schaal van dit vlak. */
var FW_CANVAS_W = 2560, FW_CANVAS_H = 1072, FW_MARGIN = 12, FW_SQUASH = 0.82;
var FW_COLORS = ['var(--jade)', 'var(--paper)', 'var(--gold)'];
/* 330ms: dezelfde wachttijd als vroeger, voor het opstijgende stipje om
   boven te zijn voordat de ring opengaat. */
var FW_SPARK_DELAY = 330;

/* Eén plek voor alle timing/vorm-getallen per type, want dezelfde tabel
   moet zowel de vonken tekenen als bepalen wanneer een burst weer opgeruimd
   mag worden (burstEnd() hieronder) -- twee plekken die uit elkaar konden
   lopen was hoe de oude "6,4s / 11s"-som ooit is misgegaan. */
var FW_LIFE = {
  ring   : { base:1250, step:110, mod:5, dropBase:170, dropStep:62, szBig:15, szSmall: 9 },
  double : { base:1200, step:100, mod:5, dropBase:160, dropStep:55, szBig:14, szSmall: 8 },
  double2: { base: 900, step: 80, mod:4, dropBase:120, dropStep:40, szBig:10, szSmall: 6 },
  willow : { base:2200, step: 70, mod:4, dropBase:260, dropStep:40, szBig: 8, szSmall: 5 },
  crackle: { base: 900, step: 90, mod:3, dropBase: 90, dropStep:40, szBig: 8, szSmall: 6 }
};
function fwMaxLife(type){ var L = FW_LIFE[type]; return L.base + (L.mod - 1) * L.step; }

function fwRange(rng, a, b){ return a + rng() * (b - a); }

/* Zwaartepunt op de flanken, zoals de oude tabel ook had -- dat is toch het
   lege deel van het vlak. 'wide' (alleen de finale) spreidt over het hele
   doek in plaats van de twee flankclusters, voor de acht tot tien bursts
   die daar de volle breedte moeten dekken. */
function fwFlankX(rng, wide){
  if(wide) return fwRange(rng, 4, 96);
  return rng() < 0.5 ? fwRange(rng, 8, 34) : fwRange(rng, 66, 92);
}

/* palette is optioneel en valt terug op FW_COLORS -- de killshow roept dit
   nooit met een derde argument aan, dus die blijft precies hetzelfde
   getal uit rng() trekken als voorheen. De SE-shows verderop geven hun
   eigen palet mee (het accent van die melding plus paper/gold). */
function fwColor(rng, prev, palette){
  palette = palette || FW_COLORS;
  var c;
  do { c = palette[(rng() * palette.length) | 0]; }
  while(c === prev && palette.length > 1 && rng() < 0.7);
  return c;
}

function fwType(rng){
  var r = rng();
  if(r < 0.56) return 'ring';
  if(r < 0.74) return 'double';
  if(r < 0.90) return 'willow';
  return 'crackle';
}

/* Klemt elke burst binnen het doek: x in doekpixels min de straal blijft
   minstens 12px van de rand, y min 0,82 maal de straal (de y-component is
   ingedrukt) ook. De straal gaat naar beneden, de positie niet -- die stond
   al vast door de tijdlijn hierboven. Zelfde regel als de oude tabel had,
   nu uitgerekend in plaats van met de hand nagekeken. */
function fwClampMargin(b){
  var xpx = b.x / 100 * FW_CANVAS_W, ypx = b.y / 100 * FW_CANVAS_H;
  var maxRw = Math.min(xpx, FW_CANVAS_W - xpx) - FW_MARGIN;
  var maxRh = (ypx - FW_MARGIN) / FW_SQUASH;
  var maxR  = Math.min(maxRw, maxRh);
  if(b.r > maxR) b.r = Math.max(40, maxR);
  return b;
}

/* De bossnaam staat op 132px, hoog in het midden (36-64% breed). Daar mag
   maar één ding staan: een kleine ring, hoog boven de tekst -- wat voor
   type of straal er ook uitrolde. Tien volle ringen over die tekst was bij
   de oude tabel al een rommeltje, en dat wordt niet beter met vijf keer
   zoveel bursts. */
function fwClampCenterBand(b){
  if(b.x >= 36 && b.x <= 64){
    b.type = 'ring';
    if(b.y > 24) b.y = 14 + (b.y % 10);
    if(b.r > 260) b.r = 180 + (b.r % 60);
  }
  return b;
}

/* De show: opbouw, hoofdshow, finale. Bouwt de burst-tabel één keer op bij
   het laden van de pagina (puur rekenwerk, geen DOM) -- fireworks()
   hieronder plant 'm pas echt in zodra er een kill is. */
function buildShow(seed){
  var rng = mulberry32(seed);
  var bursts = [];
  var prevColor = null;

  function segment(startT, endT, spacingBase, spacingJitter, rMin, rMax, yMin, yMax, wide, nBoost){
    var t = startT;
    while(t <= endT){
      var type = fwType(rng);
      var c = fwColor(rng, prevColor); prevColor = c;
      var b = {
        d: Math.round(t), x: fwFlankX(rng, wide && rng() < 0.6),
        y: fwRange(rng, yMin, yMax), r: fwRange(rng, rMin, rMax),
        type: type, c: c
      };
      if(type === 'ring'){
        b.n = (14 + (rng() * 10 | 0)) + (nBoost || 0);
      } else if(type === 'double'){
        b.n  = 12 + (rng() * 6 | 0);
        b.n2 = 8  + (rng() * 5 | 0);
        b.c2 = fwColor(rng, c);
        b.r  = Math.min(b.r, 340); // dubbele ring blijft compacter, anders vult hij het vlak
      } else if(type === 'willow'){
        b.n = 10 + (rng() * 5 | 0);
        b.c = 'var(--gold)'; // altijd goud, zie de kop hierboven
      } else if(type === 'crackle'){
        b.n = 16 + (rng() * 10 | 0);
      }
      fwClampCenterBand(b);
      fwClampMargin(b);
      bursts.push(b);
      t += spacingBase + (rng() * 2 - 1) * spacingJitter;
    }
  }

  /* Opbouw 0,25-3,5s: ongeveer één burst per 450ms, nog rustig. */
  segment(250, 3500, 420, 70, 200, 300, 16, 34, false, 0);
  /* Hoofdshow 3,5-10,5s: ongeveer twee per 500ms, met 6 tot 8 tegelijk in de
     lucht -- de brandduur (1,25 tot 2,4s, al naar het type) ligt ruim boven
     de tussenruimte, en dat is de hele truc: met een levensduur langer dan
     de tussenruimte zie je er altijd meerdere tegelijk in plaats van één
     wolk per keer. */
  segment(3500, 10500, 260, 55, 230, 380, 14, 38, false, 0);
  /* Finale 10,8-12,6s: acht tot tien bursts over de volle breedte binnen
     ruim anderhalve seconde, de grootste ringen (nBoost erbij). Daarna is
     het voorbij: de laatste vonk dooft rond 14,5s, wat van de negentien
     seconden die de kill aanhoudt ruim vier seconden rust overlaat om de
     cijfers te lezen. Alle drie de fases hebben oneven tussenruimtes, want
     een metronoom leest mechanisch. */
  segment(10800, 12600, 185, 35, 360, 480, 30, 46, true, 8);

  /* Garandeert minstens één van elk nieuw type, ook als de kans dat
     toevallig niet opleverde -- variatie hoort er gewoon te zijn, niet van
     geluk af te hangen. */
  ['double', 'willow', 'crackle'].forEach(function(need){
    if(bursts.some(function(b){ return b.type === need; })) return;
    var mid = bursts[(bursts.length * 0.5) | 0];
    mid.type = need;
    if(need === 'double'){ mid.n = 14; mid.n2 = 10; mid.c2 = fwColor(rng, mid.c); mid.r = Math.min(mid.r, 340); }
    if(need === 'willow'){ mid.n = 12; mid.c = 'var(--gold)'; }
    if(need === 'crackle'){ mid.n = 20; }
    fwClampCenterBand(mid); fwClampMargin(mid);
  });

  return bursts;
}
/* Eén keer berekend bij het laden van de pagina, niet per kill -- de seed
   ligt vast, dus het resultaat toch ook. */
var SHOW = buildShow(FW_SEED);

/* ---- vuurwerk bij een SE-melding (follow/sub/cheer/tip/raid) -----------
   Kleinschalig: de kill blijft het grootste moment van de avond, zelfde
   argument als "een nieuwe beste poging krijgt niets" hierboven. Het aantal
   bursts per soort staat in CFG.alertFireworks (0 = uit).

   Elke burst gaat binnen ~2,5s af en de laatste vonk is rond de 4s voorbij
   -- ruim binnen de 5200ms die zo'n melding sowieso al aanhoudt, dus geen
   eigen hold nodig. Kleiner dan de kill in straal (140-280 tegen 200-480)
   en telling (12-24 tegen 12-31): dit moet een leuk extraatje zijn naast
   een compacte melding, niet een tweede killshow.

   Alleen ring/double/crackle; willow (lang leven, ~2,4s) mag bij sub en
   raid. SE_WILLOW_CUTOFF duwt 'm terug naar ring/crackle als hij te laat
   zou afgaan om zijn volle leven nog binnen de 4s te krijgen (330ms wachten
   + 2410ms leven = 2740ms staart, en die moet nog vóór 4000ms voorbij zijn).

   Plek: de SE-kolom staat boven-midden (#alertHost op top:52px, en een sub
   of een bericht maakt 'm nog hoger of lager) -- bursts blijven daar
   helemaal van weg: x 12-34% en 66-88%, y 10-32%, kant alternerend, nooit
   in het midden (34-66%). Geen uitzondering zoals fwClampCenterBand bij de
   killshow: die kolom staat er altijd, in tegenstelling tot de bossnaam die
   alleen bij een raidmelding in beeld is, dus hoeft hier niets geklemd te
   worden -- er wordt gewoon nooit in dat midden geloot. Dezelfde ≥12px-marge
   als de killshow (fwClampMargin hergebruikt, ongewijzigd).

   Kleur: het eigen accent van de melding (var(--acc), al gezet op de node
   door render()) plus paper en gold in plaats van jade/paper/gold -- vijf
   soorten met allemaal hun eigen tint (R.TINT), dus jade zou voor cheer of
   tip niet kloppen.

   Deterministisch per soort: een eigen seed afgeleid van FW_SEED en de naam
   van de soort (seedForAlertShow), en dezelfde mulberry32 als de killshow.
   Elke soort wordt precies één keer opgebouwd bij het laden van de pagina
   (ALERT_SHOWS hieronder), niet per keer dat de melding komt.

   Geen was achter deze meldingen: de vonken staan rechtstreeks op je
   gameplay, en de kill-minimum van 9px las in een screenshot te dun tegen
   drukke gameplay zonder die donkere achtergrond. b.szBoost telt er drie
   pixels bovenop -- zie fwBuildBurst hierboven, dat blijft 0 voor de
   killshow. */
var SE_COLORS       = ['var(--acc)', 'var(--paper)', 'var(--gold)'];
var SE_WILLOW_KINDS = { sub:1, raid:1 };
var SE_WILLOW_CUTOFF = 1260;
var SE_SPAN          = 1900;

function seedForAlertShow(kind){
  var h = 0;
  for(var i = 0; i < kind.length; i++) h = (h * 31 + kind.charCodeAt(i)) | 0;
  return FW_SEED ^ h;
}

function seFlankX(rng, left){
  return left ? fwRange(rng, 12, 34) : fwRange(rng, 66, 88);
}

function seType(rng, allowWillow){
  var r = rng();
  if(allowWillow){
    if(r < 0.40) return 'ring';
    if(r < 0.68) return 'double';
    if(r < 0.86) return 'willow';
    return 'crackle';
  }
  if(r < 0.46) return 'ring';
  if(r < 0.76) return 'double';
  return 'crackle';
}

function buildAlertShow(seed, count, allowWillow){
  if(!count) return [];
  var rng = mulberry32(seed);
  var bursts = [];
  var prevColor = null;
  var left = true;
  var spacing = SE_SPAN / count;
  for(var i = 0; i < count; i++){
    var d = Math.round(i * spacing + rng() * spacing * 0.5);
    var type = seType(rng, allowWillow);
    if(type === 'willow' && d > SE_WILLOW_CUTOFF) type = (rng() < 0.5 ? 'ring' : 'crackle');
    var c = fwColor(rng, prevColor, SE_COLORS); prevColor = c;
    var b = {
      d: d, x: seFlankX(rng, left), y: fwRange(rng, 10, 32), r: fwRange(rng, 140, 280),
      type: type, c: c, szBoost: 3
    };
    left = !left;
    if(type === 'ring'){
      b.n = 12 + (rng() * 12 | 0);
    } else if(type === 'double'){
      b.n  = 9 + (rng() * 6 | 0);
      b.n2 = 6 + (rng() * 5 | 0);
      b.c2 = fwColor(rng, c, SE_COLORS);
      b.r  = Math.min(b.r, 220); // dubbele ring blijft compact, zelfde reden als bij de kill
    } else if(type === 'willow'){
      b.n = 10 + (rng() * 5 | 0);
      b.c = 'var(--gold)';
    } else if(type === 'crackle'){
      b.n = 14 + (rng() * 10 | 0);
    }
    fwClampMargin(b);
    bursts.push(b);
  }
  return bursts;
}

/* Eén keer per soort opgebouwd, net als SHOW hierboven -- niet per melding. */
var ALERT_SHOWS = {};
['follow', 'sub', 'cheer', 'tip', 'raid'].forEach(function(kind){
  var count = (CFG.alertFireworks && CFG.alertFireworks[kind]) || 0;
  ALERT_SHOWS[kind] = buildAlertShow(seedForAlertShow(kind), count, !!SE_WILLOW_KINDS[kind]);
});

/* Hangt een eigen .fw-laag in #stage, los van de melding zelf: die is een
   smalle flex-kolom met een eigen translateY-animatie, en vuurwerk daarin
   zou meebewegen en -schalen met dat kolommetje. #stage is zelf al
   position:absolute op de volle 2560x1072, dus .fw{inset:0} (css/alerts.css)
   vult hem meteen -- vóór #alertHost in de DOM, dus erachter in beeld. */
function seFireworks(kind, alertNode){
  var bursts = ALERT_SHOWS[kind];
  if(!bursts || !bursts.length) return;
  var fw = scheduleFireworks(bursts, alertNode);
  fw.style.setProperty('--acc', R.TINT[kind] || R.TINT.follow);
  stage.insertBefore(fw, box);
}

/* Eén ring vonken, gedeeld door ring/double/willow (crackle heeft zijn eigen
   opbouw hieronder ivm de flikker-klasse). colorOverride zet --c rechtstreeks
   op de vonk in plaats van 'm te laten erven van .fw__b -- nodig voor de
   binnenste ring van een 'double', die een tweede kleur heeft. */
function fwAddRing(wrap, sd, r, n, type, colorOverride, sizeBoost){
  var L = FW_LIFE[type];
  sizeBoost = sizeBoost || 0;
  for(var i = 0; i < n; i++){
    var a  = (i / n) * Math.PI * 2;
    /* Elke tweede vonk korter, anders is de ring een perfecte cirkel en dat
       leest als een tandwiel. De y-component is ingedrukt, zodat de wolk
       breder is dan hoog -- zo kijk je er tegenaan in plaats van recht in. */
    var rr  = r * (i % 2 ? 0.72 : 1);
    var sp  = U.el('i', 'fw__s');
    var css =
      '--tx:'   + Math.round(Math.cos(a) * rr)        + 'px;' +
      '--ty:'   + Math.round(Math.sin(a) * rr * FW_SQUASH) + 'px;' +
      '--drop:' + (L.dropBase + (i % 3) * L.dropStep) + 'px;' +
      '--sz:'   + ((i % 4 === 0 ? L.szBig : L.szSmall) + sizeBoost) + 'px;' +
      '--life:' + (L.base + (i % L.mod) * L.step)     + 'ms;' +
      '--sd:'   + sd                                  + 'ms';
    if(colorOverride) css += ';--c:' + colorOverride;
    sp.style.cssText = css;
    sp.appendChild(document.createElement('b'));
    wrap.appendChild(sp);
  }
}

/* Crackle heeft zijn eigen lus omdat de binnenste 'b' de fw__s--crk-klasse
   nodig heeft (css/alerts.css): de getrapte flikker naast de gewone val. */
function fwAddCrackle(wrap, sd, r, n, sizeBoost){
  var L = FW_LIFE.crackle;
  sizeBoost = sizeBoost || 0;
  for(var i = 0; i < n; i++){
    var a  = (i / n) * Math.PI * 2;
    var rr = r * (0.55 + (i % 3) * 0.15);
    var sp = U.el('i', 'fw__s');
    sp.style.cssText =
      '--tx:'   + Math.round(Math.cos(a) * rr)        + 'px;' +
      '--ty:'   + Math.round(Math.sin(a) * rr * FW_SQUASH) + 'px;' +
      '--drop:' + (L.dropBase + (i % 3) * L.dropStep) + 'px;' +
      '--sz:'   + ((i % 4 === 0 ? L.szBig : L.szSmall) + sizeBoost) + 'px;' +
      '--life:' + (L.base + (i % L.mod) * L.step)     + 'ms;' +
      '--sd:'   + sd                                  + 'ms';
    var dot = document.createElement('b');
    dot.className = 'fw__s--crk';
    sp.appendChild(dot);
    wrap.appendChild(sp);
  }
}

/* b.szBoost is alleen gezet door buildAlertShow() hieronder (SE-vuurwerk,
   zonder de donkere was van de kill onder zich, dus iets grotere stipjes om
   niet weg te vallen tegen gameplay) -- de killshow zet dat veld nooit, dus
   fwAddRing/fwAddCrackle krijgen daar altijd 0 en blijft dit exact het oude
   gedrag. */
function fwBuildBurst(b){
  var wrap = U.el('div', 'fw__b');
  wrap.style.cssText = 'left:' + b.x + '%;top:' + b.y + '%;--c:' + b.c;

  /* animation-delay telt vanaf het moment dat een element in de DOM komt, en
     dat is hier al b.d ms na de start van de melding (de setTimeout in
     fireworks() hieronder wachtte daar al op). --d en --sd zijn dus relatief
     aan die aanhechting: 0 voor het stipje (stijgt meteen op) en 330ms
     daarna voor de ring, niet nog eens b.d erbovenop -- dat laatste was de
     bug in de eerste versie hiervan: hoe later een burst gepland stond, hoe
     langer zijn eigen vonken nog wachtten nadat ze allang in de DOM stonden,
     tot voorbij hun eigen opruimtijd toe. */
  var trail = U.el('i', 'fw__t');
  trail.style.cssText = '--rise:430px;--d:0ms';
  wrap.appendChild(trail);

  var sd    = FW_SPARK_DELAY;
  var boost = b.szBoost || 0;
  if(b.type === 'ring'){
    fwAddRing(wrap, sd, b.r, b.n, 'ring', null, boost);
  } else if(b.type === 'double'){
    fwAddRing(wrap, sd, b.r,        b.n,  'double', null, boost);
    fwAddRing(wrap, sd, b.r * 0.45, b.n2, 'double2', b.c2, boost);
  } else if(b.type === 'willow'){
    fwAddRing(wrap, sd, b.r, b.n, 'willow', null, boost);
  } else if(b.type === 'crackle'){
    fwAddCrackle(wrap, sd, b.r, b.n, boost);
  }
  return wrap;
}

function fwBurstEnd(b){
  var life = fwMaxLife(b.type);
  if(b.type === 'double') life = Math.max(life, fwMaxLife('double2'));
  return b.d + FW_SPARK_DELAY + life;
}

/* Bouwt elke burst z'n DOM-elementen pas vlak voor hij afgaat (setTimeout op
   b.d) en raakt ze weer kwijt zodra zijn laatste vonk is uitgedoofd. Met
   45 tot 55 bursts en tot ruim twintig vonken elk zou alles in één keer
   opbouwen een paar honderd elementen neerzetten die de eerste seconden nog
   niets doen -- puur geheugen en style-recalc voor niets. Zo blijft het
   aantal levende vonken ruim onder de 350.

   Gedeeld door de killshow en de kleinere shows bij een SE-melding
   hieronder: alleen de bursts-tabel en waar de .fw-laag moet hangen
   verschillen, de planning en opruim is voor allebei hetzelfde verhaal.
   stopHost._fwStop wordt aangeroepen vanuit render()'s opruimcode zodra die
   melding de DOM verlaat: zonder dat zou een setTimeout best nog een burst
   kunnen afvuren in een <div> die al weg is -- en _fwStop() haalt de
   .fw-laag zelf ook meteen van zijn ouder, want bij een SE-melding hangt
   die los in #stage en niet als kind onder stopHost (zie seFireworks()). */
function scheduleFireworks(bursts, stopHost){
  var fw = U.el('div', 'fw');
  var timers = [];

  /* Onder prefers-reduced-motion plannen we helemaal niets in -- geen enkele
     setTimeout, naast de .fw{display:none} in css/alerts.css. Vuurwerk is
     puur beweging; honderden timers voorbereiden voor een element dat toch
     nooit zichtbaar wordt is werk voor niets. */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
    bursts.forEach(function(b){
      timers.push(setTimeout(function(){
        var node = fwBuildBurst(b);
        fw.appendChild(node);
        timers.push(setTimeout(function(){
          if(node.parentNode) node.parentNode.removeChild(node);
        }, fwBurstEnd(b) - b.d));
      }, b.d));
    });
  }

  stopHost._fwStop = function(){
    timers.forEach(function(id){ clearTimeout(id); });
    timers.length = 0;
    if(fw.parentNode) fw.parentNode.removeChild(fw);
  };

  return fw;
}

/* De killmelding is zelf al een vlak dat het hele doek vult (.alert--raid),
   dus zijn vuurwerk mag gewoon een kind zijn -- vandaar deze dunne wikkel
   in plaats van renderRaid() rechtstreeks scheduleFireworks() te laten
   aanroepen. */
function fireworks(alertNode){
  return scheduleFireworks(SHOW, alertNode);
}

function renderRaid(e){
  var node = U.el('div','alert alert--raid' + (e.kill ? ' alert--kill' : ''));
  node.style.setProperty('--acc', e.kill ? 'var(--jade)' : 'var(--gold)');

  /* Bossart achter de melding. js/bossart.js levert scherpe renders per
     encounter; zijn die er, dan vervangen ze de oude buste (zie de vorm van
     allebei in css/alerts.css, en keyArt()/placeKeyedArt() hierboven voor
     hoe de rgb(24,24,24)-grond eruit gaat). e.art -- Raider.IO's 128x64
     portret -- blijft de was erachter zoals hij was (geen canvaswerk nodig:
     die laag is toch al zwaar geblurd en ligt over de eigen halfdoorzichtige
     achtergrond van de melding, niet over OBS' textuur-alpha), en is ook de
     terugval voor de was als er geen Raider.IO-plaatje was maar wel een
     render -- dan wél door keyArt(), anders staat er een egale rgb(24,24,24)
     waas achter je tekst. Zonder allebei blijft de melding wat hij hiervoor
     was: een lege laag is een lege laag. */
  var renders = artUrls(e.encounter, e.boss);
  if(renders.length){
    if(e.art){
      var wash = U.el('div', 'raid__art');
      wash.style.backgroundImage = 'url("' + e.art + '")';
      node.appendChild(wash);
    } else {
      placeKeyedArt(node, renders[0], 'raid__art', null);
    }
    renders.forEach(function(url, i){
      var side = renders.length === 1 ? 'right' : (i === 0 ? 'left' : 'right');
      placeKeyedArt(node, url, 'raid__render raid__render--' + side, 'raid__render--masked');
    });
  } else if(e.art){
    ['raid__art','raid__bust'].forEach(function(cls){
      var l = U.el('div', cls);
      l.style.backgroundImage = 'url("' + e.art + '")';
      node.appendChild(l);
    });
  }

  /* Achter de tekst, dus vóór mid in de DOM. Een nieuwe beste krijgt niets:
     dan betekent het bij een kill niets meer. */
  if(e.kill) node.appendChild(fireworks(node));

  var mid = U.el('div','raid__mid');
  mid.appendChild(U.el('div','raid__eyebrow', T(e.kill ? 'flash.down' : 'flash.best')));
  mid.appendChild(U.el('div','raid__boss', e.boss || ''));
  /* Alleen bij een kill: wie 'm neerlegde. Zelfde haakjes als de raidkaart,
     zie guildOf() hierboven en '‹' + guild + '›' in js/banner.js. */
  if(e.kill && e.guild) mid.appendChild(U.el('div','raid__guild', '‹' + e.guild + '›'));
  if(e.where) mid.appendChild(U.el('div','raid__where', e.where));

  var row = U.el('div','raid__stats');
  (e.stats || []).forEach(function(s){
    var b = U.el('div','raid__stat');
    b.appendChild(U.el('div','raid__v', s[0]));
    b.appendChild(U.el('div','raid__l', s[1]));
    row.appendChild(b);
  });
  mid.appendChild(row);

  node.appendChild(mid);
  /* Bron in de hoek. Deze melding draait op Raider.IO's live-tracking en
     staat hier los van de onderbalk in beeld, dus de vermelding hoort ook
     hier. Klein en gedempt: het is een bronregel, niet het nieuws. */
  /* Dezelfde vermelding als op de kaart, en om dezelfde reden: wie deze
     cijfers leverde. js/progress.js kan per poll van bron wisselen. */
  node.appendChild(U.el('div','raid__src',
    { warcraftlogs: 'warcraftlogs.com', demo: 'demo' }[e.src] || 'raider.io'));
  /* Hier mag .com wel: de melding vult je scherm, dus daar is ruimte zat.
     Op de raidkaart niet -- zie SRC_LABEL in js/banner.js. */
  return node;
}

/* ---- eigen geluid per melding, in plaats van (of naast) de klok --------
   Kill en best klinken standaard uit js/chime.js; follow/sub/cheer/tip/raid
   waren tot nu toe stil. CFG.alertSounds kan dat per soort vervangen (kill,
   best) of gewoon toevoegen (de rest) -- zie config.default.js voor de
   sleutels en het waarom van .ogg.

   Eén bestand is gewoon dat ene bestand; een lijst is een geschud rondje,
   zodat niet elke kill of follow met dezelfde peon klinkt. Geschud met kaal
   Math.random --
   dit is geluid en geen lay-out, dus het argument achter de seeded PRNG bij
   het vuurwerk (herhaalbaar zodat je een beeld kan nazien en bijstellen)
   gaat hier niet op: niemand stelt een afspeelvolgorde bij aan de hand van
   een screenshot, en willekeur is hier juist het punt. Elke clip komt één
   keer voorbij voor er herhaald wordt; loopt een rondje leeg, dan komt er
   een nieuw geschud rondje voor terug, met als enige regel dat de eerste
   clip daarvan nooit de clip is die net speelde -- anders hoor je 'm twee
   keer na elkaar op de naad tussen twee rondjes. */
var SOUND_CFG   = CFG.alertSounds || {};
var soundCache  = {};   // url -> HTMLAudioElement (preload:'auto')
var soundState  = {};   // kind -> { order:[], pos:0, last:null }, alleen bij een lijst

/* Dubbelen eruit: nextSound() schudt opnieuw tot de eerste clip niet de
   vorige is, en met ['a.ogg','a.ogg'] in de config zou dat nooit lukken. */
function soundList(kind){
  var v = SOUND_CFG[kind];
  if(!v) return [];
  return (Array.isArray(v) ? v : [v]).filter(function(u, i, all){
    return isArtUrl(u) && all.indexOf(u) === i;
  });
}

function shuffle(list){
  var a = list.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* Het eerste rondje ligt al geschud vóór de eerste melding, net als de
   voorgeladen <audio>-elementen hieronder -- niet pas bij de eerste keer
   afspelen. */
function ensureOrder(kind, list){
  if(list.length > 1 && !soundState[kind]){
    soundState[kind] = { order: shuffle(list), pos: 0, last: null };
  }
}

function nextSound(kind, list){
  if(list.length < 2) return list[0];
  var st = soundState[kind] || (soundState[kind] = { order:[], pos:0, last:null });
  if(st.pos >= st.order.length){
    var order;
    do { order = shuffle(list); } while(order[0] === st.last);
    st.order = order;
    st.pos = 0;
  }
  var url = st.order[st.pos++];
  st.last = url;
  return url;
}

function preloadSounds(){
  Object.keys(SOUND_CFG).forEach(function(kind){
    var list = soundList(kind);
    list.forEach(function(u){
      if(soundCache[u]) return;
      var a = new Audio();
      a.preload = 'auto';
      a.src = u;
      soundCache[u] = a;
    });
    ensureOrder(kind, list);
  });
}
preloadSounds();

/* Speelt de geconfigureerde clip voor deze soort en meldt of er überhaupt
   iets geprobeerd is -- of het uiteindelijk lukt, weet je pas later (het
   'error'-event of play()'s eigen promise), vandaar de onFail-callback in
   plaats van een simpel waar/onwaar. Geen configuratie of ?mute=1 / volume
   0: meteen nee, net als Chime.play doet. */
function playAlertSound(kind, volume, onFail){
  if(!volume) return false;
  var list = soundList(kind);
  if(!list.length) return false;

  var url  = nextSound(kind, list);
  var base = soundCache[url];
  /* Klonen ipv hetzelfde element hergebruiken: twee subs vlak na elkaar
     zouden anders de eerste afspelende clip afkappen in plaats van hem
     twee keer te horen. */
  var a = base ? base.cloneNode(true) : new Audio(url);
  a.volume = Math.max(0, Math.min(1, volume));
  /* Zowel het 'error'-event als play()'s eigen promise kunnen op dezelfde
     misser afgaan (een kapotte bron faalt vaak op allebei) -- één vlag
     zodat de terugval maar één keer klinkt in plaats van twee keer over
     elkaar heen. */
  var failed = false;
  function fail(){ if(failed) return; failed = true; if(onFail) onFail(); }
  a.addEventListener('error', fail);
  var p = a.play();
  if(p && typeof p.catch === 'function') p.catch(fail);
  return true;
}

function chime(kind){ if(window.Chime) window.Chime.play(kind, SOUND); }

function render(e){
  var node;
  if(e.kind === 'progress'){
    node = renderRaid(e);
  } else {
    node = U.el('div','alert');
    node.style.setProperty('--acc', R.TINT[e.kind] || R.TINT.follow);
    if(e.kind === 'sub') node.appendChild(reward());
    node.appendChild(R.make(e.kind, LABEL[e.kind] || e.kind, e.who));
    if(e.extra)   node.appendChild(U.el('div','alert__meta', e.extra));
    if(e.message) node.appendChild(U.el('div','alert__msg',  e.message));
    seFireworks(e.kind, node);
  }

  /* Het geluid hangt aan de weergave en niet aan de detectie: zo klinkt het
     gelijk met wat je ziet, en doet het testpad het ook. Kill/best vallen
     terug op de klok als er niets geconfigureerd staat of de clip niet wil
     afspelen; de SE-soorten waren stil en blijven dat gewoon bij zo'n
     misser -- die hadden nooit een klok om op terug te vallen. */
  var soundKind = e.kind === 'progress' ? (e.kill ? 'kill' : 'best') : e.kind;
  var isRaid = e.kind === 'progress';
  if(!playAlertSound(soundKind, SOUND, isRaid ? function(){ chime(soundKind); } : null)){
    if(isRaid) chime(soundKind);
  }

  (e.kind === 'progress' ? rbox : box).appendChild(node);
  void node.offsetWidth;
  node.classList.add('in');

  setTimeout(function(){
    node.classList.remove('in');
    node.classList.add('out');
    setTimeout(function(){
      /* Alleen gezet bij een kill (zie fireworks()): stopt de nog geplande
         bursts en hun opruim-timers voordat de melding zelf verdwijnt. */
      if(node._fwStop) node._fwStop();
      if(node.parentNode) node.parentNode.removeChild(node);
      busy = false;
      next();
    }, 320);
  }, e.hold || HOLD);
}

function next(){
  if(busy || !queue.length) return;
  busy = true;
  render(queue.shift());
}

function push(e){
  queue.push(e);
  if(queue.length > 12) queue.shift();   // bij een giftbom niet oneindig stapelen
  next();
}

window.SE.start(push);

/* ---- raidprogress ---------------------------------------------------
   Deze pagina ligt over je hele gameplayzone, dus hier past wat in de
   raidkaart niet kan: een melding over het volle vlak bij een nieuwe beste
   poging of een kill. Dezelfde endpoints als de onderbalk, met een eigen
   stand -- twee pagina's die los van elkaar kijken, geen afstemming nodig.

   Uitzetten of beperken met liveTracking.alerts: 'both' | 'kill' | 'off'. */
(function(){
  var LT = (CFG.raiderio && CFG.raiderio.liveTracking) || {};
  var WANT = LT.alerts || 'both';
  if(!window.RioLive || LT.enabled === false || WANT === 'off') return;

  var watch = window.RioLive.watcher();

  function mmss(sec){
    if(!sec) return null;
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function fire(L, ev){
    var kill = ev.down;
    var p = window.RioLive.pullOf(L, kill ? 'kill' : 'best') || {};
    var stats = [];
    if(kill){
      stats.push([U.num(L.pullCount || 0), T('boss.toKill', { n:L.pullCount || 0 })]);
    } else {
      stats.push([L.bestPct.toFixed(2) + '%', T('alert.hpLeft')]);
      stats.push([U.num(L.pullCount || 0), T('boss.pulls', { n:L.pullCount || 0 })]);
    }
    if(p.phase || L.bestPhase) stats.push([p.phase || L.bestPhase, T('alert.phase')]);
    if(mmss(p.seconds))        stats.push([mmss(p.seconds), T('alert.duration')]);
    if(p.deaths)               stats.push([U.num(p.deaths), T('alert.deaths', { n:p.deaths })]);

    push({
      kind     : 'progress',
      kill     : kill,
      boss     : L.bossName || '',
      art      : L.bossImg || '',
      encounter: L.encounter,
      guild    : guildOf(L),
      src      : L.source || 'raiderio',
      where: [L.raidName, L.difficulty ? L.difficulty.charAt(0).toUpperCase() + L.difficulty.slice(1) : '',
              L.summary].filter(Boolean).join('  \u00b7  '),
      stats: stats,
      /* Langer dan een nieuwe beste, want hier loopt eerst het vuurwerk: dat
         is pas rond 14,5s voorbij, en dan nog ruim vier seconden rust. */
      hold : kill ? 19000 : 8000
    });
  }

  /* Zelfde gedeelde klok als de onderbalk: anders vuurt deze melding tot een
     halve minuut na het ribbonnetje in de raidkaart. */
  U.pollAligned(function(){
    return window.Progress.load().then(function(L){
      if(!L) return;
      /* De renders van de huidige boss vast opvragen, los van of dit een
         kill wordt: zo hangt de afbeelding al in de cache van de browser
         tegen de tijd dat de melding 'm nodig heeft. */
      preloadArt(L);
      var ev = watch(L);
      if(ev.down)                                  fire(L, ev);
      else if(ev.better && WANT === 'both' && L.bestPct != null) fire(L, ev);
    }).catch(function(e){ console.warn('[rio-live]', e.message); });
  }, LT.pollSeconds || 30);
})();

/* alerts.html?test=1 -- loopt door alle types zodat je kan uitlijnen */
if(TEST){
  var demo = [
    {kind:'follow', who:'joesswow'},
    {kind:'sub',    who:'vassham',    extra:'T2 · ' + T('ev.months', { n:14 }),
     message:'blijf lekker pushen die keys, we kijken mee'},
    {kind:'cheer',  who:'TheNoremac', extra:T('ev.bits', { n:184 })},
    {kind:'raid',   who:'Amphroxia',  extra:T('ev.viewers', { n:42 })},
    {kind:'tip',    who:'xxmaebeexx', extra:'EUR 5,00', message:'voor de guildbank'},
    {kind:'progress', src:'demo', boss:'The Lost Explorers',
     where:'The Venomous Abyss  \u00b7  Mythic  \u00b7  2/8 Mythic',
     stats:[['43.89%',T('alert.hpLeft')],['7',T('boss.pulls', { n:7 })],['P3',T('alert.phase')],
            ['4:12',T('alert.duration')],['18',T('alert.deaths', { n:18 })]], hold:8000},
    {kind:'progress', kill:true, src:'demo', boss:'The Lost Explorers',
     where:'The Venomous Abyss  \u00b7  Mythic  \u00b7  3/8 Mythic',
     /* Wel de echte gildenaam: dat is geen verzonnen cijfer maar wie deze
        overlay draait, en dat verandert een testpad niet. */
     guild:guildOf(null),
     stats:[['8',T('boss.toKill', { n:8 })],['P3',T('alert.phase')],['5:46',T('alert.duration')],
            ['11',T('alert.deaths', { n:11 })]],
     hold:19000}
  ];
  /* kill en best zitten allebei in 'progress', dus die hebben een eigen
     filter. Voor de rest is het type zelf genoeg: ?test=sub zet meteen de
     melding neer waar je de beloning mee uitlijnt, in plaats van je een
     halve cyclus te laten wachten. */
  var pick = {
    kill: function(e){ return e.kind === 'progress' &&  e.kill; },
    best: function(e){ return e.kind === 'progress' && !e.kill; }
  }[TEST] || (LABEL[TEST] && function(e){ return e.kind === TEST; });
  if(pick){
    var one = demo.filter(pick);
    if(one.length) demo = one;
  }

  /* De bossart van de demo is die van de boss waar de guild nu op zit. Een
     verzonnen plaatje zou hier niet kloppen, en het vaste portret van een
     boss uit een oude tier gaat een keer verlopen; dit klopt altijd of het
     is er niet. De naam in de demo blijft wel verzonnen -- dit pad is om op
     uit te lijnen, en de voorbeelden op de voorpagina draaien erop.

     Eén losse aanroep die niets ophoudt: komt het antwoord binnen terwijl er
     al een melding staat, dan pakt de volgende ronde hem op. Faalt hij, dan
     is de melding wat hij hiervoor was. */
  if(window.Progress){
    window.Progress.load().then(function(L){
      if(!L) return;
      demo.forEach(function(e){
        if(e.kind !== 'progress') return;
        /* Alleen het plaatje lenen, niet de bronnaam. De cijfers in deze
           melding zijn verzonnen, dus een echte dienst eronder zetten is een
           vermelding voor iets wat zij niet geleverd hebben -- daar staat
           'demo'. Wie de art leverde staat in de bronnenlijst op de
           voorpagina, waar het over de hele site gaat. Het encounter-ID
           leent om dezelfde reden mee: dat is wat de bossart-renders opzoekt
           (zie artUrls() hierboven), en zonder is het testpad de enige
           plek waar dat opzoeken niet te zien is. */
        if(L.bossImg) e.art = L.bossImg;
        if(L.encounter != null) e.encounter = L.encounter;
      });
    }).catch(function(){});
  }

  /* Wachten tot de vorige weg is plus een adempauze; met een vaste 6,4 s
     loopt de wachtrij vol bij een melding die 7,6 s blijft staan. */
  var i = 0;
  (function loop(){
    var e = demo[i++ % demo.length];
    push(e);
    setTimeout(loop, (e.hold || HOLD) + 1400);
  })();
}
})();

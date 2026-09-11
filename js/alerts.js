/* Alert-wachtrij. Eén tegelijk, netjes achter elkaar.
   Zet StreamElements' eigen alert-overlay uit als je deze gebruikt,
   anders krijg je alles dubbel. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, R = window.Ribbon;
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
  follow:'new follower', sub:'subscriber', cheer:'bits',
  tip:'tip', raid:'raid'
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

var box   = document.getElementById('alertHost');
var rbox  = document.getElementById('raidHost');
var queue = [], busy = false;

/* Raidmelding over het hele vlak: eyebrow, de boss groot, en de cijfers van
   die poging eronder. Zelfde blokjes als de stats in de characterkaart, dus
   groot mono getal met een klein label. De was erachter is vlak en half
   doorzichtig -- je gameplay blijft er vaag door zichtbaar, en een egaal
   vlak kost de encoder minder dan een verloop. */
/* Vuurwerk, alleen bij een kill. Drie inslagen in de bovenste helft van het
   vlak, elk een stipje dat opstijgt en daarna een ring vonken die naar
   buiten vliegt en valt.

   Twee geneste elementen per vonk: de buitenste vliegt radiaal weg met een
   ease-out, de binnenste valt met een ease-in. Twee transform-animaties op
   één element gaat niet, en geneste transforms vermenigvuldigen -- dus krijg
   je zo een parabool in plaats van een rechte lijn, en dat is het verschil
   tussen vuurwerk en een asterisk.

   Deterministisch, net als de stofjes op de scene-schermen: elke kill ziet
   er hetzelfde uit. Een boss down is één keer per avond, dus dit hoeft niet
   te variëren -- en beweging die je kan nagaan is makkelijker bij te stellen
   dan beweging die elke keer anders is. */
/* Maten in doekpixels, en dat doek is 2560 breed. Eerste versie stond op
   stipjes van 3px en een radius van 210: op zich netjes, maar naast een
   bossnaam van 132px zag je er niets van. Alles staat nu op de schaal van
   dit vlak. */
var SHOTS = [
  { x:17.5, y:34, d: 260, n:22, r:430, c:'var(--jade)'  },
  { x:84,   y:30, d: 690, n:20, r:370, c:'var(--paper)' },
  { x:30,   y:23, d:1150, n:18, r:280, c:'var(--gold)'  },
  { x:71,   y:37, d:1560, n:20, r:340, c:'var(--jade)'  },
  { x:21,   y:20, d:2080, n:16, r:230, c:'var(--paper)' },
  { x:79,   y:20, d:2500, n:16, r:240, c:'var(--gold)'  },
  { x:38,   y:31, d:2960, n:18, r:330, c:'var(--jade)'  },
  { x:62,   y:24, d:3380, n:16, r:270, c:'var(--paper)' },
  { x:14,   y:27, d:3900, n:18, r:300, c:'var(--gold)'  },
  { x:87,   y:33, d:4380, n:18, r:310, c:'var(--jade)'  }
];
/* Tien inslagen, 182 vonken, de laatste dooft op 6,4 s. Daarom houdt de kill
   8,4 s aan in plaats van 7,6: eerst vuurwerk, dan nog twee seconden rust om
   de cijfers te lezen.

   De tussenruimte is 420 tot 520 ms en een wolk leeft 1,25 tot 1,7 s, dus er
   hangen er drie tot vier tegelijk in de lucht. Dat is de hele truc: met een
   tussenruimte groter dan de levensduur zie je één wolk per keer en dat leest
   als minder vuurwerk, niet als meer. De afstanden zijn niet allemaal gelijk,
   want metronoom leest mechanisch.

   De zwaartepunten liggen op de flanken en de kleine ringen hoog in het
   midden. Daar staat de bossnaam, en tien volle ringen over die tekst wordt
   een rommeltje -- de flanken waren toch het lege deel van het vlak.

   Elke ring blijft binnen het doek. Horizontaal moet x in doekpixels min de
   radius boven nul komen, verticaal y min 0,82 maal de radius (de y-component
   is ingedrukt). Nagerekend op alle tien: de krapste marge is 12 pixels.
   Eerder werden de bovenste vonken afgesneden, en een afgeknipt stipje op de
   rand leest als een fout en niet als kadrering. Tien verschillende radii,
   want identieke ringen lezen mechanisch. */
function fireworks(){
  var fw = U.el('div','fw');
  SHOTS.forEach(function(s){
    var burst = U.el('div','fw__b');
    burst.style.cssText = 'left:' + s.x + '%;top:' + s.y + '%;--c:' + s.c;

    var trail = U.el('i','fw__t');
    trail.style.cssText = '--rise:430px;--d:' + s.d + 'ms';
    burst.appendChild(trail);

    for(var i = 0; i < s.n; i++){
      var a  = (i / s.n) * Math.PI * 2;
      /* Elke tweede vonk korter, anders is de ring een perfecte cirkel en
         dat leest als een tandwiel. De y-component is ingedrukt, zodat de
         wolk breder is dan hoog -- zo kijk je er tegenaan in plaats van
         recht in. */
      var rr = s.r * (i % 2 ? 0.72 : 1);
      var sp = U.el('i','fw__s');
      sp.style.cssText =
        '--tx:'   + Math.round(Math.cos(a) * rr)        + 'px;' +
        '--ty:'   + Math.round(Math.sin(a) * rr * 0.82) + 'px;' +
        '--drop:' + (170 + (i % 3) * 62)                + 'px;' +
        '--sz:'   + (i % 4 === 0 ? 15 : 9)              + 'px;' +
        '--life:' + (1250 + (i % 5) * 110)              + 'ms;' +
        '--sd:'   + (s.d + 330)                         + 'ms';
      sp.appendChild(document.createElement('b'));
      burst.appendChild(sp);
    }
    fw.appendChild(burst);
  });
  return fw;
}

function renderRaid(e){
  var node = U.el('div','alert alert--raid' + (e.kill ? ' alert--kill' : ''));
  node.style.setProperty('--acc', e.kill ? 'var(--jade)' : 'var(--gold)');

  /* Het geluid hangt aan de weergave en niet aan de detectie: zo klinkt het
     gelijk met wat je ziet, en doet het testpad het ook. */
  if(window.Chime) window.Chime.play(e.kill ? 'kill' : 'best', SOUND);

  /* Achter de tekst, dus vóór mid in de DOM. Een nieuwe beste krijgt niets:
     dan betekent het bij een kill niets meer. */
  if(e.kill) node.appendChild(fireworks());

  var mid = U.el('div','raid__mid');
  mid.appendChild(U.el('div','raid__eyebrow', e.kill ? 'boss down' : 'new best'));
  mid.appendChild(U.el('div','raid__boss', e.boss || ''));
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
  node.appendChild(U.el('div','raid__src','raider.io'));
  return node;
}

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
  }

  (e.kind === 'progress' ? rbox : box).appendChild(node);
  void node.offsetWidth;
  node.classList.add('in');

  setTimeout(function(){
    node.classList.remove('in');
    node.classList.add('out');
    setTimeout(function(){
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
      stats.push([U.num(L.pullCount || 0), (L.pullCount === 1 ? 'pull' : 'pulls') + ' to kill']);
    } else {
      stats.push([L.bestPct.toFixed(2) + '%', 'boss hp left']);
      stats.push([U.num(L.pullCount || 0), 'pulls']);
    }
    if(p.phase || L.bestPhase) stats.push([p.phase || L.bestPhase, 'phase']);
    if(mmss(p.seconds))        stats.push([mmss(p.seconds), 'duration']);
    if(p.deaths)               stats.push([U.num(p.deaths), p.deaths === 1 ? 'death' : 'deaths']);

    push({
      kind : 'progress',
      kill : kill,
      boss : L.bossName || '',
      where: [L.raidName, L.difficulty ? L.difficulty.charAt(0).toUpperCase() + L.difficulty.slice(1) : '',
              L.summary].filter(Boolean).join('  \u00b7  '),
      stats: stats,
      /* Langer dan een nieuwe beste, want hier loopt vuurwerk tot 5,6 s. */
      hold : kill ? 8400 : 5600
    });
  }

  /* Zelfde gedeelde klok als de onderbalk: anders vuurt deze melding tot een
     halve minuut na het ribbonnetje in de raidkaart. */
  U.pollAligned(function(){
    return window.RioLive.load().then(function(L){
      if(!L) return;
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
    {kind:'sub',    who:'vassham',    extra:'T2 · 14 mo',
     message:'blijf lekker pushen die keys, we kijken mee'},
    {kind:'cheer',  who:'TheNoremac', extra:'184 bits'},
    {kind:'raid',   who:'Amphroxia',  extra:'42 viewers'},
    {kind:'tip',    who:'xxmaebeexx', extra:'EUR 5,00', message:'voor de guildbank'},
    {kind:'progress', boss:'The Lost Explorers',
     where:'The Venomous Abyss  \u00b7  Mythic  \u00b7  2/8 Mythic',
     stats:[['43.89%','boss hp left'],['7','pulls'],['P3','phase'],
            ['4:12','duration'],['18','deaths']], hold:5600},
    {kind:'progress', kill:true, boss:'The Lost Explorers',
     where:'The Venomous Abyss  \u00b7  Mythic  \u00b7  3/8 Mythic',
     stats:[['8','pulls to kill'],['P3','phase'],['5:46','duration'],['11','deaths']],
     hold:8400}
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

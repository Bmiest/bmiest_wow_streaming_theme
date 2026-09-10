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
var box   = document.getElementById('alertHost');
var rbox  = document.getElementById('raidHost');
var queue = [], busy = false;

/* Raidmelding over het hele vlak: eyebrow, de boss groot, en de cijfers van
   die poging eronder. Zelfde blokjes als de stats in de characterkaart, dus
   groot mono getal met een klein label. De was erachter is vlak en half
   doorzichtig -- je gameplay blijft er vaag door zichtbaar, en een egaal
   vlak kost de encoder minder dan een verloop. */
function renderRaid(e){
  var node = U.el('div','alert alert--raid' + (e.kill ? ' alert--kill' : ''));
  node.style.setProperty('--acc', e.kill ? 'var(--jade)' : 'var(--gold)');

  /* Het geluid hangt aan de weergave en niet aan de detectie: zo klinkt het
     gelijk met wat je ziet, en doet het testpad het ook. */
  if(window.Chime) window.Chime.play(e.kill ? 'kill' : 'best', SOUND);

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
  return node;
}

function render(e){
  var node;
  if(e.kind === 'progress'){
    node = renderRaid(e);
  } else {
    node = U.el('div','alert');
    node.style.setProperty('--acc', R.TINT[e.kind] || R.TINT.follow);
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
      hold : kill ? 7600 : 5600
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
     hold:7600}
  ];
  var pick = {
    kill: function(e){ return e.kind === 'progress' &&  e.kill; },
    best: function(e){ return e.kind === 'progress' && !e.kill; }
  }[TEST];
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

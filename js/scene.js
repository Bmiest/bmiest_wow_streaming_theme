/* Starting / BRB / Ending schermen.
   Modus via de URL: scene.html?mode=starting | brb | ending */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var SC = CFG.scenes || {};
// Modus uit de URL, of uit een wrapper-bestand (scene-starting.html enz.)
// zodat OBS' "Local file"-vinkje bruikbaar blijft -- dat slikt geen querystring.
var MODE = (location.search.match(/[?&]mode=([a-z]+)/) || [, window.SCENE_MODE || 'starting'])[1];

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  stage.style.width  = dw + 'px';
  stage.style.height = (CFG.sceneHeight || 1440) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';
})();

window.Backdrop.mount(document.getElementById('stage'), {motes:18});

var elEyebrow = U.$('#eyebrow'), elClock = U.$('#clock'),
    elHead    = U.$('#headline'), elTopic = U.$('#topic'),
    elFoot    = U.$('#foot');

/* ---- modus --------------------------------------------------------- */
var t0 = Date.now();

function pad(n){ return n < 10 ? '0' + n : '' + n; }
function mmss(sec){
  sec = Math.max(0, Math.round(sec));
  var h = Math.floor(sec/3600), m = Math.floor(sec%3600/60), s = sec%60;
  return h ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
}

var MODES = {
  starting: {
    eyebrow: 'starting soon',
    tick: function(){
      var left = (SC.countdownMinutes || 10) * 60 - (Date.now() - t0) / 1000;
      if(left <= 0){ elClock.textContent = 'almost there'; elClock.classList.add('small'); }
      else elClock.textContent = mmss(left);
    }
  },
  brb: {
    eyebrow: 'be right back',
    tick: function(){ elClock.textContent = mmss((Date.now() - t0) / 1000); }
  },
  ending: {
    eyebrow: 'thanks for watching',
    headline: 'See you next time',
    tick: null
  }
};

var M = MODES[MODE] || MODES.starting;
elEyebrow.textContent = M.eyebrow;

if(M.headline){
  elClock.style.display = 'none';
  elHead.style.display  = '';
  elHead.textContent    = M.headline;
}
/* Onder de klok hoort waar de stream over gaat, en dat weet Twitch beter
   dan een vaste regel in de config. Die blijft als terugval staan voor als
   DecAPI niets bruikbaars teruggeeft. */
if(MODE === 'starting'){
  elTopic.textContent = SC.topic || '';
  window.Stats.title().then(function(t){
    if(t) elTopic.textContent = t;
  }).catch(function(){});
}

if(M.tick){ M.tick(); setInterval(M.tick, 1000); }

/* De klok begint te lopen zodra de scene in beeld komt, niet zodra OBS de
   pagina laadt. Een browser source blijft namelijk draaien terwijl je in
   een andere scene zit: zonder dit stond de aftelklok al op 'almost there'
   voordat je 'starting soon' opzette, en liep 'be right back' op een half
   uur. OBS' eigen source-events geven dat moment door; visibilitychange is
   de terugval in een gewone browser. */
function restartClock(){
  t0 = Date.now();
  if(M.tick) M.tick();
}
window.addEventListener('obsSourceActiveChanged', function(e){
  if(!e.detail || e.detail.active) restartClock();
});
window.addEventListener('obsSourceVisibleChanged', function(e){
  if(!e.detail || e.detail.visible) restartClock();
});
document.addEventListener('visibilitychange', function(){
  if(!document.hidden) restartClock();
});

/* ---- schema -------------------------------------------------------- */
var DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
function buildSchedule(root){
  var list = SC.schedule || [];
  if(!list.length){ root.appendChild(U.el('div','sup__empty','no fixed schedule')); return; }
  var today = DAYS[new Date().getDay()];
  list.forEach(function(r){
    var row = U.el('div','sched__row');
    if(String(r.day).toLowerCase() === today) row.className += ' today';
    if(!r.time || /off|none|free/i.test(r.time)) row.className += ' off';
    row.appendChild(U.el('span','sched__d', r.day));
    row.appendChild(U.el('span','sched__t', r.time || 'off'));
    if(r.note) row.appendChild(U.el('span','sched__tag', r.note));
    root.appendChild(row);
  });
}

function buildSocials(root){
  (SC.socials || []).forEach(function(s){
    root.appendChild(window.Ribbon.make('link', s.label, s.value));
  });
}

/* ---- supporters ---------------------------------------------------- */
var supRoot = null, supSeen = [];
function pushSupporter(e){
  supSeen.unshift(e);
  if(supSeen.length > 3) supSeen.pop();
  if(!supRoot) return;
  supRoot.innerHTML = '';
  supSeen.forEach(function(x){
    supRoot.appendChild(window.Ribbon.make(
      x.kind, x.word, x.who + (x.extra ? '  \u00b7  ' + x.extra : '')));
  });
}

/* ---- chat (alleen op het BRB-scherm) ------------------------------- */
function buildChatCard(){
  var c = window.Ribbon.card('chat', 'info');
  c.classList.add('rcard--chat');
  var box = U.el('div', null); box.id = 'sceneChat';
  c.body.appendChild(box);
  return c;
}

/* ---- voet samenstellen --------------------------------------------- */
(function(){
  elFoot.innerHTML = '';

  var card = window.Ribbon.card;

  if(MODE === 'brb'){
    elFoot.appendChild(buildChatCard());
    var cs = card('links', 'info');
    var sc = U.el('div','socials'); buildSocials(sc); cs.body.appendChild(sc);
    elFoot.appendChild(cs);
  } else {
    var c1 = card('schedule', 'info');
    var sd = U.el('div','sched'); buildSchedule(sd); c1.body.appendChild(sd);
    elFoot.appendChild(c1);

    var c2 = card('links', 'info');
    var so = U.el('div','socials'); buildSocials(so); c2.body.appendChild(so);
    elFoot.appendChild(c2);

    var c3 = card('recent', 'follow');
    supRoot = U.el('div','sup');
    supRoot.appendChild(U.el('div','sup__empty','nothing yet this session'));
    c3.body.appendChild(supRoot);
    elFoot.appendChild(c3);
  }
})();

/* ---- kop: kanaal links, kijkers en volgers rechts -------------------
   Zelfde ribbons als de bovenbalk, één maat groter. Het character stond
   hier ook; dat is de kaart in de onderbalk al, en op een scherm dat om
   aandacht voor één ding vraagt was het ruis. */
var R = window.Ribbon;
var ribName = R.make('live',    'channel',
                     CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live');
var ribView = R.make('viewers', 'viewers',   '\u2014');
var ribFoll = R.make('follow',  'followers', '\u2014');
[ribView, ribFoll].forEach(function(n){ n.classList.add('rib--num','rib--empty'); });
ribView.classList.add('rib--r');
[ribName, ribView, ribFoll].forEach(function(n){ U.$('#sceneTop').appendChild(n); });

/* Kijkers staat er ook voor 'starting soon': zodra je live gaat loopt hij mee
   terwijl dit scherm nog staat, en dat is precies wanneer je het wil zien.
   Offline geeft DecAPI niets, dan blijft de balk gedempt. */
function refresh(){
  window.Stats.followers().then(function(n){
    if(n == null) return;
    ribFoll.classList.remove('rib--empty');
    ribFoll.setValue(U.num(n));
  }).catch(function(){});
  window.Stats.viewers().then(function(n){
    if(n == null) return;
    ribView.classList.remove('rib--empty');
    ribView.setValue(U.num(n), true);
  }).catch(function(){});
}

/* ---- characters op de flanken --------------------------------------
   De flanken stonden leeg naast de halo, en op een pauzescherm zijn jouw
   characters het onderwerp. De render komt van Blizzard via de omweg in
   js/raiderio.js; daarvoor staat dat script hier weer bij.

   Twee vensters, links en rechts, en staan er meer characters in je config
   dan die twee, dan rouleert het paar door op raiderio.rotateSeconds --
   dezelfde cadans als de characterkaart in de onderbalk. Anders zou alles
   achter de eerste twee van je lijst hier nooit in beeld komen.

   Het paar schuift per twee op maar loopt rond de lijst heen, dus bij een
   oneven aantal blijft er nooit een flank leeg: bij vijf characters komen
   ze als 1-2, 3-4, 5-1, 2-3, 4-5 langs. Twee keer dezelfde render naast
   elkaar kan daardoor niet, op één character in je config na -- dan blijft
   de rechterflank leeg, want dat leest als een fout en niet als ontwerp. */
(function(){
  var list = (CFG.raiderio && CFG.raiderio.characters) || [];
  if(!list.length || !window.RaiderIO) return;
  var stage = document.getElementById('stage');

  /* De characters op de flanken komen van Raider.IO, en op deze schermen is
     de onderbalk met zijn bronlabel niet in beeld. Dus hier een eigen
     vermelding, zodra er ook echt een character verschijnt -- staat er niks,
     dan valt er niks te crediteren. */
  var credited = false;
  function credit(){
    if(credited) return;
    credited = true;
    stage.appendChild(U.el('div','scene__src','raider.io'));
  }

  /* Twee vaste vensters; wat erin staat wisselt. Ze hangen er al voordat de
     eerste render binnen is, want een leeg venster is niets te zien. */
  var slots = [0, 1].map(function(i){
    var box = U.el('div', 'scene__char' + (i ? ' scene__char--r' : ''));
    var img = document.createElement('img');
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    /* Zelfde CORS-modus als het plaatje waarop we meten, anders haalt de
       browser dezelfde render twee keer op: een CORS-fetch en een gewone
       staan los van elkaar in zijn cache. */
    img.crossOrigin = 'anonymous';
    box.appendChild(img);
    box.style.opacity = '0';
    stage.appendChild(box);
    return { box: box, img: img };
  });

  /* Alleen wie een render heeft die Blizzard ook echt teruggeeft. Raider.IO
     leidt die URL af van de thumbnail en weet niet of hij nog bestaat: van
     een character dat lang niet ingelogd heeft, is de render van hun CDN
     verdwenen en geeft elke variant 403. In de kaart onderaan valt dat mee,
     daar blijft de portretschijf gewoon leeg, maar hier zou het een lege
     flank worden die twintig seconden in beeld staat. Dus laden we ze
     vooruit en houden we over wie er doorkomt -- dat vooruitladen is
     sowieso nodig: het zijn PNG's van een megabyte, en pas bij de overgang
     beginnen betekent een venster dat leeg staat tot hij binnen is. */
  function preload(url){
    return new Promise(function(done){
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function(){
        /* Meteen ook uitrekenen hoe dit figuur in het venster past. Beide
           vensters zijn even groot, dus één meting volstaat. */
        done({ url: url,
               geo: window.RaiderIO.fitRender(im, slots[0].box.clientWidth,
                                                  slots[0].box.clientHeight) });
      };
      im.onerror = function(){ done(null); };
      im.src = url;
    });
  }

  /* Waar de rotatie begint. index.html zet zijn drie voorbeelden hiermee uit
     de pas (?rot=1, ?rot=2), want die laden tegelijk en lieten anders drie
     keer hetzelfde paar zien. In OBS staat er niets achter de URL en begint
     hij gewoon bij het eerste paar. */
  var pool = [],
      page = +((location.search.match(/[?&]rot=(\d+)/) || [])[1] || 0);

  function pageCount(){
    var n = pool.length;
    if(n < 3) return 1;
    return (n % 2) ? n : n / 2;
  }

  /* Het paar dat bij pagina p hoort. Bij één character blijft rechts leeg. */
  function pairAt(p){
    var n = pool.length;
    if(n === 1) return [pool[0], null];
    return [pool[(2 * p) % n], pool[(2 * p + 1) % n]];
  }

  function paint(p){
    pairAt(p).forEach(function(c, i){
      var s = slots[i];
      if(c){
        s.img.src = c.url;
        /* Geen meting gelukt: inline stijlen weghalen en het vaste offset
           uit scene.css laten staan. Dat kan scheef vallen voor een groot
           ras, maar het is wat er voorheen ook stond. */
        ['width','height','left','top'].forEach(function(k){
          s.img.style[k] = c.geo ? c.geo[k] + 'px' : '';
        });
      }
      s.box.style.opacity = c ? '1' : '0';
    });
  }

  /* Uitfaden, wisselen, infaden. De 420ms is de overgang uit scene.css; een
     src-wissel op een zichtbaar venster zou anders als een sprong lezen. */
  function rotate(){
    slots.forEach(function(s){ s.box.style.opacity = '0'; });
    setTimeout(function(){
      page = (page + 1) % pageCount();
      paint(page);
    }, 420);
  }

  Promise.all(list.map(function(spec){
    return window.RaiderIO.character(spec)
      .then(function(c){ return c.render ? preload(c.render) : null; })
      .catch(function(){ return null; });
  })).then(function(res){
    pool = res.filter(Boolean);
    if(!pool.length) return;
    page = page % pageCount();
    paint(page);
    credit();
    if(pageCount() > 1){
      setInterval(rotate, ((CFG.raiderio && CFG.raiderio.rotateSeconds) || 20) * 1000);
    }
  });
})();

/* ---- start ---------------------------------------------------------- */
U.poll(refresh, 60);
window.SE.start(pushSupporter);

if(MODE === 'brb'){
  window.Chat.start(function(m){
    var box = document.getElementById('sceneChat');
    if(!box) return;
    var row = U.el('div','msg');
  /* Id en login op de rij, zodat een verwijderd bericht of een timeout
     terug te vinden is (js/chat.js prune). */
  row.dataset.mid  = m.id || '';
  row.dataset.user = m.login || '';
    if(m.badges.length){
      var bw = U.el('span','msg__badges');
      m.badges.forEach(function(b){ bw.appendChild(U.el('span','bdg', b.label)); });
      row.appendChild(bw);
    }
    var nm = U.el('span','msg__name', m.name);
    if(m.color) nm.style.color = m.color;
    row.appendChild(nm);
    var bd = U.el('span','msg__body'); bd.innerHTML = m.html;
    row.appendChild(bd);
    box.appendChild(row);
    while(box.children.length > 8) box.removeChild(box.firstChild);
  }, function(what){
    window.Chat.prune(document.getElementById('sceneChat'), what);
  });
}

/* scene.html?demo=1 -- vult de supporterskaart zodat je kan uitlijnen */
if(U.flag('demo')){
  [['follow','joesswow','follows',''],
   ['sub','vassham','sub','T2 · 14 mo'],
   ['cheer','TheNoremac','bits','184 bits']].forEach(function(p,i){
    setTimeout(function(){
      pushSupporter({kind:p[0], who:p[1], word:p[2], extra:p[3]});
    }, 300 + i*400);
  });
}
})();

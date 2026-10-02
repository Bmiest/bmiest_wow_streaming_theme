/* Starting / BRB / Ending schermen.
   Modus via de URL: scene.html?mode=starting | brb | ending */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var SC = CFG.scenes || {};
var T  = window.I18N.t;
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
    eyebrow: T('scene.starting'),
    tick: function(){
      var left = (SC.countdownMinutes || 10) * 60 - (Date.now() - t0) / 1000;
      if(left <= 0){ elClock.textContent = T('scene.almost'); elClock.classList.add('small'); }
      else elClock.textContent = mmss(left);
    }
  },
  brb: {
    eyebrow: T('scene.brb'),
    tick: function(){ elClock.textContent = mmss((Date.now() - t0) / 1000); }
  },
  ending: {
    eyebrow: T('scene.ending'),
    headline: T('scene.headline'),
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
  setTopic(SC.topic || '');
  window.Stats.title().then(function(t){
    if(t) setTopic(t);
  }).catch(function(){});
}

/* De titel hoort binnen de halo te blijven. Op 1500px breed liep een lange
   streamtitel over beide characters op de flanken heen (die staan op 611 en
   1949, de halo op 760-1800). Dus: smaller dan de halo, afbreken over
   hoogstens drie regels, en een titel die dan nog niet past wordt kleiner
   tot TOPIC_MIN. Wat daarna nog overblijft, knipt de line-clamp in
   scene.css af met een beletselteken -- liever dat dan tekst over een
   character. */
var TOPIC_MAX = 38, TOPIC_MIN = 26, TOPIC_LINES = 3;
function setTopic(text){
  elTopic.textContent = text;
  fitTopic();
}
function fitTopic(){
  if(!elTopic.textContent) return;
  var size = TOPIC_MAX;
  elTopic.style.fontSize = size + 'px';
  while(size > TOPIC_MIN && lines(elTopic) > TOPIC_LINES){
    size -= 2;
    elTopic.style.fontSize = size + 'px';
  }
}
function lines(n){
  var lh = parseFloat(getComputedStyle(n).lineHeight) || 1;
  return Math.round(n.scrollHeight / lh);
}
/* Outfit komt van Google Fonts en is bij de eerste meting misschien nog
   niet binnen; de terugvalletter is breder, dus opnieuw meten zodra hij er
   is. */
if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitTopic);

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
var WEEK = 7 * 1440;
var TZ   = SC.scheduleTimeZone || 'Europe/Brussels';

/* Waar we nu zitten in de week, in minuten sinds zondag 00:00, en dat in de
   tijdzone van het schema. De tijden in de config zijn Belgische tijden;
   staat OBS op een pc in een andere zone, of draait deze pagina ergens
   anders, dan klopt "volgende raid over" nog steeds. Een onbekende zone
   valt terug op de klok van de pc. */
function weekMinute(){
  var d = new Date();
  try {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone:TZ, weekday:'long',
                                       hour:'2-digit', minute:'2-digit', hourCycle:'h23' })
      .formatToParts(d).forEach(function(x){ p[x.type] = x.value; });
    var wd = DAYS.indexOf(String(p.weekday).toLowerCase());
    if(wd >= 0) return wd * 1440 + (+p.hour % 24) * 60 + (+p.minute);
  } catch(e){}
  return d.getDay() * 1440 + d.getHours() * 60 + d.getMinutes();
}

/* De dagnaam in de taal van de pagina. In de config staat hij in het
   Engels, want daar matcht hij op; 1 januari 2023 was een zondag. */
function dayName(day){
  var i = DAYS.indexOf(String(day).toLowerCase());
  if(i < 0) return day;
  try {
    return new Intl.DateTimeFormat(window.I18N.locale(), { weekday:'long', timeZone:'UTC' })
      .format(new Date(Date.UTC(2023, 0, 1 + i)));
  } catch(e){ return day; }
}

/* '20:00 - 23:00' -> begin en duur in minuten. Over middernacht mag. */
function slotOf(r){
  var d = DAYS.indexOf(String(r.day).toLowerCase());
  var m = String(r.time || '').match(/(\d{1,2}):(\d{2})\s*[-\u2013]\s*(\d{1,2}):(\d{2})/);
  if(d < 0 || !m) return null;
  var s = +m[1] * 60 + +m[2], e = +m[3] * 60 + +m[4];
  return { start: d * 1440 + s, len: ((e - s + 1440) % 1440) || 1440,
           raid: /raid/i.test(r.note || '') };
}

/* De eerstvolgende stream, of die van nu. */
function nextSlot(){
  var now = weekMinute(), best = null;
  (SC.schedule || []).forEach(function(r){
    var s = slotOf(r);
    if(!s) return;
    var since = (now - s.start + WEEK) % WEEK;
    var c = since < s.len ? { now:true, wait:0, raid:s.raid }
                          : { now:false, wait:(s.start - now + WEEK) % WEEK, raid:s.raid };
    if(!best || (c.now && !best.now) || (c.now === best.now && c.wait < best.wait)) best = c;
  });
  return best;
}

function dur(min){
  min = Math.max(1, min);
  var d = Math.floor(min / 1440), h = Math.floor(min % 1440 / 60), m = min % 60;
  if(d) return T('dur.d', { d:d, h:h });
  if(h) return T('dur.h', { h:h, m:m });
  return T('dur.m', { m:m });
}

var elNext = null;
function paintNext(){
  if(!elNext) return;
  var n = nextSlot();
  if(!n){ elNext.style.display = 'none'; return; }
  elNext.style.display = '';
  elNext.classList.toggle('is-now', n.now);
  elNext.textContent = n.now
    ? T(n.raid ? 'sched.nowRaid' : 'sched.nowStream')
    : T(n.raid ? 'sched.nextRaid' : 'sched.nextStream', { t: dur(n.wait) });
}

function buildSchedule(root){
  var list = SC.schedule || [];
  if(!list.length){ root.appendChild(U.el('div','sup__empty', T('sched.none'))); return; }
  var today = DAYS[Math.floor(weekMinute() / 1440)];
  list.forEach(function(r){
    var row = U.el('div','sched__row');
    if(String(r.day).toLowerCase() === today) row.className += ' today';
    if(!r.time || /off|none|free/i.test(r.time)) row.className += ' off';
    row.appendChild(U.el('span','sched__d', dayName(r.day)));
    row.appendChild(U.el('span','sched__t', r.time || T('sched.off')));
    if(r.note) row.appendChild(U.el('span','sched__tag', r.note));
    root.appendChild(row);
  });
  elNext = U.el('div','sched__next');
  root.appendChild(elNext);
  paintNext();
  setInterval(paintNext, 30 * 1000);
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
  var c = window.Ribbon.card(T('cap.chat'), 'info');
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
    var cs = card(T('cap.links'), 'info');
    var sc = U.el('div','socials'); buildSocials(sc); cs.body.appendChild(sc);
    elFoot.appendChild(cs);
  } else {
    var c1 = card(T('cap.schedule'), 'info');
    var sd = U.el('div','sched'); buildSchedule(sd); c1.body.appendChild(sd);
    elFoot.appendChild(c1);

    var c2 = card(T('cap.links'), 'info');
    var so = U.el('div','socials'); buildSocials(so); c2.body.appendChild(so);
    elFoot.appendChild(c2);

    var c3 = card(T('cap.recent'), 'follow');
    supRoot = U.el('div','sup');
    supRoot.appendChild(U.el('div','sup__empty', T('empty.session')));
    c3.body.appendChild(supRoot);
    elFoot.appendChild(c3);
  }
})();

/* ---- kop: kanaal links, kijkers en volgers rechts -------------------
   Zelfde ribbons als de bovenbalk, één maat groter. Het character stond
   hier ook; dat is de kaart in de onderbalk al, en op een scherm dat om
   aandacht voor één ding vraagt was het ruis. */
var R = window.Ribbon;
var ribName = R.make('live',    T('rib.channel'),
                     CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live');
var ribView = R.make('viewers', T('rib.viewers'),   '\u2014');
var ribFoll = R.make('follow',  T('rib.followers'), '\u2014');
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

/* ---- race to dutch first --------------------------------------------
   Onder de klok (of de afsluiter): hoe ver je guild is en waar hij staat
   tussen de Nederlandse guilds. Dat stond tot nu met de hand in je
   streamtitel, en die liep achter ("5/8M" terwijl de race al 6/9 telde).
   Deze regel komt van dezelfde data als racetodutchfirst.bmiest.be. Geen
   antwoord, geen regel: het blok blijft verborgen. Goud alleen voor de
   rang en alleen als je eerste staat -- dezelfde regel als op de site, waar
   goud de koploper is. */
(function(){
  if(!window.Race || !window.Race.enabled()) return;
  var box = U.el('div','race');
  box.style.display = 'none';
  box.appendChild(U.el('div','race__cap', T('race.cap')));
  var line = U.el('div','race__line');
  box.appendChild(line);
  U.$('.scene__mid').appendChild(box);

  window.Race.watch(function(s){
    var parts = window.Race.parts(s);
    if(!parts.length){ box.style.display = 'none'; return; }
    line.innerHTML = '';
    parts.forEach(function(p, i){
      if(i) line.appendChild(U.el('span','race__sep','\u00b7'));
      line.appendChild(U.el('span','race__p race__p--' + p.k + (p.lead ? ' is-lead' : ''), p.text));
    });
    box.style.display = '';
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
  [['follow','joesswow',T('ev.follow'),''],
   ['sub','vassham',T('ev.sub'),'T2 · ' + T('ev.months', { n:14 })],
   ['cheer','TheNoremac',T('ev.cheer'),T('ev.bits', { n:184 })]].forEach(function(p,i){
    setTimeout(function(){
      pushSupporter({kind:p[0], who:p[1], word:p[2], extra:p[3]});
    }, 300 + i*400);
  });
}
})();

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
    eyebrow: 'straks live',
    tick: function(){
      var left = (SC.countdownMinutes || 10) * 60 - (Date.now() - t0) / 1000;
      if(left <= 0){ elClock.textContent = 'bijna zover'; elClock.classList.add('small'); }
      else elClock.textContent = mmss(left);
    }
  },
  brb: {
    eyebrow: 'even weg',
    tick: function(){ elClock.textContent = mmss((Date.now() - t0) / 1000); }
  },
  ending: {
    eyebrow: 'bedankt voor het kijken',
    headline: 'Tot de volgende keer',
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
   een andere scene zit: zonder dit stond de aftelklok al op 'bijna zover'
   voordat je 'straks live' opzette, en liep 'even weg' meteen op een half
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
var DAYS = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
function buildSchedule(root){
  var list = SC.schedule || [];
  if(!list.length){ root.appendChild(U.el('div','sup__empty','geen vast schema')); return; }
  var today = DAYS[new Date().getDay()];
  list.forEach(function(r){
    var row = U.el('div','sched__row');
    if(String(r.day).toLowerCase() === today) row.className += ' today';
    if(!r.time || /vrij|geen|off/i.test(r.time)) row.className += ' off';
    row.appendChild(U.el('span','sched__d', r.day));
    row.appendChild(U.el('span','sched__t', r.time || 'vrij'));
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
    var cs = card('volg mee', 'info');
    var sc = U.el('div','socials'); buildSocials(sc); cs.body.appendChild(sc);
    elFoot.appendChild(cs);
  } else {
    var c1 = card('schema', 'info');
    var sd = U.el('div','sched'); buildSchedule(sd); c1.body.appendChild(sd);
    elFoot.appendChild(c1);

    var c2 = card('volg mee', 'info');
    var so = U.el('div','socials'); buildSocials(so); c2.body.appendChild(so);
    elFoot.appendChild(c2);

    var c3 = card('recent', 'follow');
    supRoot = U.el('div','sup');
    supRoot.appendChild(U.el('div','sup__empty','nog niets deze sessie'));
    c3.body.appendChild(supRoot);
    elFoot.appendChild(c3);
  }
})();

/* ---- kop: kanaal links, kijkers en volgers rechts -------------------
   Zelfde ribbons als de bovenbalk, één maat groter. Het character stond
   hier ook; dat is de kaart in de onderbalk al, en op een scherm dat om
   aandacht voor één ding vraagt was het ruis. */
var R = window.Ribbon;
var ribName = R.make('live',    'kanaal',
                     CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live');
var ribView = R.make('viewers', 'kijkers', '\u2014');
var ribFoll = R.make('follow',  'volgers', '\u2014');
[ribView, ribFoll].forEach(function(n){ n.classList.add('rib--num','rib--empty'); });
ribView.classList.add('rib--r');
[ribName, ribView, ribFoll].forEach(function(n){ U.$('#sceneTop').appendChild(n); });

/* Kijkers staat er ook voor 'straks live': zodra je live gaat loopt hij mee
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

/* ---- start ---------------------------------------------------------- */
U.poll(refresh, 60);
window.SE.start(pushSupporter);

if(MODE === 'brb'){
  window.Chat.start(function(m){
    var box = document.getElementById('sceneChat');
    if(!box) return;
    var row = U.el('div','msg');
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
  });
}

/* scene.html?demo=1 -- vult de supporterskaart zodat je kan uitlijnen */
if(/[?&]demo=1/.test(location.search)){
  [['follow','joesswow','volgt nu',''],
   ['sub','vassham','sub','T2 · 14 mnd'],
   ['cheer','TheNoremac','bits','184 bits']].forEach(function(p,i){
    setTimeout(function(){
      pushSupporter({kind:p[0], who:p[1], word:p[2], extra:p[3]});
    }, 300 + i*400);
  });
}
})();

/* Kanaalgraphics: offline-scherm, profile banner en de panelknoppen.

   Deze pagina haalt geen data op. Een PNG met een kijkersaantal erin is een
   leugen zodra hij een minuut oud is, dus alles komt uit config.js. Welke
   asset je krijgt staat in ?a=; build-graphics.sh loopt ze af. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, R = window.Ribbon;
var G  = CFG.graphics || {}, SC = CFG.scenes || {};
var q  = new URLSearchParams(location.search);
var A  = q.get('a') || 'offline';
var stage = document.getElementById('stage');
var NAME = CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live';

document.body.classList.add('g');

/* Ontwerpmaat, en de breedte waarop hij uiteindelijk uit moet komen. Zo kan
   het offline-scherm dezelfde 2560x1440-indeling als de scenes gebruiken en
   er op 1920 uit rollen. */
function size(w, h, outW){
  stage.style.width  = w + 'px';
  stage.style.height = h + 'px';
  stage.style.transform = 'scale(' + ((outW || w) / w) + ')';
}

function rib(kind, cap, val, cls){
  var el = R.make(kind, cap, val);
  if(cls) el.classList.add(cls);
  return el;
}

/* ---- offline-scherm ------------------------------------------------- */
function offline(){
  size(2560, 1440, 1920);
  document.body.classList.add('g--offline');

  stage.innerHTML =
    '<svg class="halo-big" viewBox="0 0 400 400" aria-hidden="true">' +
      '<circle class="r3" cx="200" cy="200" r="198"></circle>' +
      '<circle class="r1" cx="200" cy="200" r="190"></circle>' +
      '<circle class="r2" cx="200" cy="200" r="168"></circle>' +
    '</svg>' +
    '<div class="scene">' +
      '<div class="scene__top" id="gTop"></div>' +
      '<div class="scene__mid">' +
        '<div class="eyebrow-xl">offline</div>' +
        '<div class="headline">' + U.esc(NAME) + '</div>' +
        '<div class="topic">' + U.esc(G.tagline || SC.topic || '') + '</div>' +
      '</div>' +
      '<div class="scene__foot" id="gFoot"></div>' +
    '</div>';

  window.Backdrop.mount(stage, {motes:14});
  U.$('#gTop').appendChild(rib('live', 'channel', NAME));

  /* Zelfde character op de flank als de scene-schermen. Dit is een render,
     dus build-graphics.sh moet even wachten tot Blizzards PNG binnen is. */
  var list = (CFG.raiderio && CFG.raiderio.characters) || [];
  if(list.length && window.RaiderIO){
    window.RaiderIO.character(list[0]).then(function(c){
      if(!c.render) return;
      var box = U.el('div','scene__char');
      var img = document.createElement('img');
      img.alt = ''; img.src = c.render;
      box.appendChild(img);
      stage.appendChild(box);
    }).catch(function(){});
  }

  var foot = U.$('#gFoot');

  var c1 = R.card('schedule', 'info');
  var sd = U.el('div','sched');
  (SC.schedule || []).forEach(function(r){
    var row = U.el('div','sched__row');
    row.appendChild(U.el('span','sched__d', r.day));
    row.appendChild(U.el('span','sched__t', r.time || 'off'));
    if(r.note) row.appendChild(U.el('span','sched__tag', r.note));
    sd.appendChild(row);
  });
  c1.body.appendChild(sd);
  foot.appendChild(c1);

  var c2 = R.card('links', 'info');
  var so = U.el('div','socials');
  (SC.socials || []).forEach(function(s){ so.appendChild(R.make('link', s.label, s.value)); });
  c2.body.appendChild(so);
  foot.appendChild(c2);

  var c3 = R.card('back soon', 'follow');
  var tx = U.el('div','g__note',
    'The stream is offline. The schedule on the left is the plan; anything ' +
    'extra gets announced on Discord.');
  c3.body.appendChild(tx);
  foot.appendChild(c3);
}

/* ---- profile banner -------------------------------------------------
   Twitch snijdt deze banner responsief aan de zijkanten af, dus alles wat
   telt staat gecentreerd en met ruime marge. */
function profile(){
  size(1200, 480);
  document.body.classList.add('g--profile');
  window.Backdrop.slice(stage, { top:980, height:480 });

  /* Hier stond ook een 'channel bmiest'-ribbon boven de naam. Dat zei
     twee keer hetzelfde; de naam staat er al groot. */
  var box = U.el('div','g__profile');
  box.appendChild(U.el('div','g__name', NAME));
  box.appendChild(U.el('div','g__tag', G.tagline || ''));
  stage.appendChild(box);
}

/* ---- panelknop ------------------------------------------------------ */
function panel(){
  var list = G.panels || [];
  var p = list[parseInt(q.get('i') || '0', 10)] || { label:'panel', kind:'link' };
  size(320, 100);
  document.body.classList.add('g--panel');
  var el = R.make(p.kind || 'link', '', p.label);
  el.classList.add('rib--lg');
  /* Eén tint voor de hele set. De soort bepaalt normaal ook de kleur, en dan
     krijg je vijf knoppen in vijf kleuren die niets betekenen. Hier
     differentieert het icoon; jade houdt ze bij elkaar. De inline --acc van
     Ribbon.make overschrijven kan niet uit CSS, dus hier. */
  el.style.setProperty('--acc', 'var(--jade)');
  stage.appendChild(el);
}

({ offline:offline, profile:profile, panel:panel }[A] || offline)();
})();

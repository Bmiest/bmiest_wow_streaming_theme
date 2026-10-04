/* De voorpagina (index.html): de characterkeuze en alles eronder.

   Dezelfde bronnen als de overlay zelf, zodat deze pagina niet uit de pas
   kan lopen met wat er op stream staat:
     - characters  js/raiderio.js (Raider.IO), in de volgorde van de config
     - de boss     js/race.js (racetodutchfirst.bmiest.be): de boss waar de
                   guild op zit, na Cutting Edge de CE-boss van de tier. Valt
                   die weg, dan js/rio-live.js (Raider.IO live tracking). De
                   render is een uitsnede uit img/boss/ (build-bosscutouts.py)
                   via de koppeling in js/bossart.js.
     - LIVE        js/stats.js (DecAPI uptime)
     - emotes      js/emotes.js, panelknoppen uit config.graphics.panels

   Alles wat van buiten komt gaat via textContent of een attribuut de pagina
   in, nooit via innerHTML. innerHTML staat hier alleen voor de vaste
   Nederlandse teksten uit js/i18n-index.js. Elk onderdeel faalt op zichzelf:
   geen boss is een lege achtergrond, geen Raider.IO is een character zonder
   cijfers. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, I = window.I18N;
var RM = matchMedia('(prefers-reduced-motion: reduce)');
var $ = function(id){ return document.getElementById(id); };

/* ---- strings ------------------------------------------------------------
   Vaste blokken: Engels in de HTML, Nederlands uit js/i18n-index.js. Wat
   hier in JavaScript ontstaat gaat via t(). Spelnamen worden niet vertaald. */
var DYN = {
  en: {
    follow: 'followed', sub: 'subscribed', cheer: 'cheered', raidIn: 'raided', tip: 'tipped',
    best: 'new best', kill: 'boss down',
    months: '{n} months', bitsN: '{n} bits', viewersN: '{n} viewers',
    rClass: 'Class', rRealm: 'Realm', rIlvl: 'ilvl', rScore: 'M+', rRace: 'Race',
    bossOn: 'Now on', bossCe: 'Cutting Edge', killsM: '{k}/{n} M',
    snap: 'Raider.IO is not answering; figures are back once it does.'
  },
  nl: {
    follow: 'volgt nu', sub: 'is sub', cheer: 'cheerde', raidIn: 'raidde', tip: 'tipte',
    best: 'nieuwe beste', kill: 'boss down',
    months: '{n} maanden', bitsN: '{n} bits', viewersN: '{n} kijkers',
    rClass: 'Klasse', rRealm: 'Realm', rIlvl: 'ilvl', rScore: 'M+', rRace: 'Ras',
    bossOn: 'Nu op', bossCe: 'Cutting Edge', killsM: '{k}/{n} M',
    snap: 'Raider.IO antwoordt niet; de cijfers komen terug zodra dat weer lukt.'
  }
};
function t(k, v){
  var s = (DYN[I.lang] || DYN.en)[k]; if(s == null) s = DYN.en[k]; if(s == null) return k;
  return s.replace(/\{(\w+)\}/g, function(_, x){ return v && v[x] != null ? v[x] : ''; });
}
function txt(tag, cls, s){
  var n = document.createElement(tag);
  if(cls) n.className = cls;
  if(s != null) n.textContent = s;
  return n;
}
var repaints = [];
function onLang(fn){ repaints.push(fn); }

/* ---- scaled screens -------------------------------------------------------
   De previews zijn echte pagina's op ontwerpmaat (2560 breed), geschaald naar
   de breedte die ze hier krijgen. */
function fit(){
  Array.prototype.forEach.call(document.querySelectorAll('.scr, .frame'), function(b){
    b.style.setProperty('--s', (b.clientWidth / 2560).toFixed(5));
    if(b.dataset.h) b.style.setProperty('--h', b.dataset.h);
  });
}

/* ---- the bug: guild from the config, LIVE from DecAPI ----------------------- */
(function(){
  var g = (CFG.raiderio || {}).guild || {}, el = $('bugGuild');
  if(el && g.name){
    var realm = String(g.realm || '').split('-').map(function(w){
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
    el.textContent = g.name;
    if(realm) el.appendChild(txt('span', 'bug__realm',
      ' · ' + String((CFG.raiderio || {}).region || 'eu').toUpperCase() + '-' + realm));
  }
  /* Elke twee minuten: lang genoeg om DecAPI niet te belasten, kort genoeg
     dat LIVE er staat als iemand van Twitch hierheen klikt. */
  if(window.Stats) U.poll(function(){
    return window.Stats.uptime().then(function(s){ $('bugLive').hidden = !(s > 0); },
                                      function(){ $('bugLive').hidden = true; });
  }, 120);
})();

/* ==== character select =====================================================
   Een character per knop, in configvolgorde. Wisselen laat de render
   overvloeien terwijl de boss blijft staan. */
var chars = [], active = -1, renders = [];
var fig = $('fig'), stage = $('stage');

/* Wat er van de twee hoofdcharacters vaststaat, voor als Raider.IO weer
   eens een 500 geeft: naam, klasse, ras en de render (Blizzard rendert op
   dezelfde URL opnieuw). Geen cijfers: een oude item level als de huidige
   tonen is erger dan een streepje. */
var SNAP = {
  shiftheal: { name: 'Shiftheal', realm: 'Ragnaros', klass: 'Priest', spec: 'Holy', race: 'Dracthyr',
    thumb: 'https://render.worldofwarcraft.com/eu/character/ragnaros/158/106746782-avatar.jpg' },
  bhikhu: { name: 'Bhikhu', realm: 'Twisting Nether', klass: 'Monk', spec: 'Mistweaver', race: 'Troll',
    thumb: 'https://render.worldofwarcraft.com/eu/character/twisting-nether/253/188521725-avatar.jpg' }
};
function renderOf(thumb){
  var plain = String(thumb || '').split('?')[0], base = plain.replace(/-avatar\.jpg$/, '');
  return base === plain ? null : base + '-main-raw.png';
}

/* Blizzards priesterkleur is puur #fff, en dat gebruikt deze familie nooit:
   die wordt paper. */
function classColour(k){
  if(k === 'Priest') return 'var(--paper)';
  return (U.CLASS_COLORS || {})[k] || 'var(--jade)';
}

/* Raider.IO geeft met enige regelmaat een 500 die bij de volgende poging
   gewoon werkt; deze pagina vraagt één keer, dus één herkansing. */
function fetchChar(spec){
  return window.RaiderIO.character(spec).catch(function(){
    return new Promise(function(done){ setTimeout(done, 900); })
      .then(function(){ return window.RaiderIO.character(spec); });
  });
}

function rib(k, v, opts){
  opts = opts || {};
  var li = txt('li', 'rib' + (opts.cls ? ' rib--cls' : '') + (opts.wide ? ' rib--wide' : ''));
  var bar = txt('span', 'rib__bar'), inn = txt('span', 'rib__in');
  inn.appendChild(txt('span', 'rib__acc', k));
  inn.appendChild(txt('span', 'rib__val' + (opts.mono ? ' mono' : ''), v));
  bar.appendChild(inn); li.appendChild(bar);
  return li;
}

function paintInfo(){
  var c = chars[active]; if(!c) return;
  stage.style.setProperty('--cls', classColour(c.klass));
  $('charName').textContent = c.name;
  fitName();
  var sp = $('charSpec'); sp.textContent = '';
  if(c.spec){ sp.appendChild(txt('em', '', c.spec)); sp.appendChild(document.createTextNode(' ')); }
  sp.appendChild(document.createTextNode(c.klass || ''));
  var ul = $('charRibs'); ul.textContent = '';
  ul.appendChild(rib(t('rClass'), [c.spec, c.klass].filter(Boolean).join(' '), { cls: true }));
  ul.appendChild(rib(t('rRealm'), c.realm + ' · ' + String((CFG.raiderio || {}).region || 'eu').toUpperCase(), { wide: true }));
  ul.appendChild(rib(t('rIlvl'), c.ilvl != null ? Number(c.ilvl).toFixed(1) : '—', { mono: true }));
  ul.appendChild(rib(t('rScore'), c.score != null ? U.num(c.score) : '—', { mono: true }));
  if(c.race) ul.appendChild(rib(t('rRace'), c.race, { wide: true }));
  ul.title = c.snap ? t('snap') : '';
  Array.prototype.forEach.call(document.querySelectorAll('.pick'), function(b){
    b.setAttribute('aria-pressed', String(+b.dataset.i === active));
  });
}
onLang(paintInfo);

/* Een naam is één woord: nooit midden in breken, maar kleiner zetten tot hij
   in zijn kolom past (de CSS-clamp blijft het maximum). */
function fitName(){
  var el = $('charName'); if(!el) return;
  el.style.removeProperty('font-size');
  var room = el.clientWidth, need = el.scrollWidth;
  if(room && need > room){
    var px = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = Math.max(24, Math.floor(px * room / need)) + 'px';
  }
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);

/* De render in zijn vak, gemeten op zijn alpha zoals de pauzeschermen dat
   doen (RaiderIO.fitRender): voeten op de onderrand, figuur gecentreerd. */
function place(img){
  var w = fig.clientWidth, h = fig.clientHeight;
  var f = img.naturalWidth && window.RaiderIO.fitRender(img, w, h);
  if(!f){ img.style.cssText = 'width:100%;height:auto;left:0;bottom:0'; return; }
  img.style.cssText = 'width:' + f.width + 'px;height:' + f.height + 'px;left:' +
    f.left + 'px;top:' + f.top + 'px';
}
var placing = 0;
addEventListener('resize', function(){
  if(placing) return;
  placing = requestAnimationFrame(function(){
    placing = 0; fit(); fitName();
    renders.forEach(function(im){ if(im && im.naturalWidth) place(im); });
  });
});

/* Eén <img> per character, pas aangemaakt als iemand hem kiest of ernaar
   wijst: vijf renders van 1600x1200 vooraf laden is op een telefoon zonde. */
function renderFor(i){
  if(renders[i] !== undefined) return renders[i];
  var c = chars[i];
  if(!c || !c.render) return (renders[i] = null);
  var im = new Image(); im.crossOrigin = 'anonymous'; im.alt = ''; im.decoding = 'async';
  im.className = 'fig__img';
  im.addEventListener('load', function(){ im.dataset.ready = '1'; place(im); if(active === i) reveal(i); });
  /* Een character dat lang niet ingelogd heeft, heeft geen render meer op
     Blizzards CDN: dan blijft het vak leeg in plaats van een kapot plaatje. */
  im.addEventListener('error', function(){ im.remove(); renders[i] = null; if(active === i) reveal(i); });
  im.src = c.render;
  fig.appendChild(im);
  return (renders[i] = im);
}
/* Het overvloeien: de nieuwe gaat aan zodra hij geladen is, en pas dan gaat
   de vorige uit. Zo staat er nooit een leeg vak tussen twee characters. */
function reveal(i){
  var im = renders[i];
  if(im && !im.dataset.ready) return;
  Array.prototype.forEach.call(fig.querySelectorAll('.fig__img'), function(x){
    x.classList.toggle('is-on', x === im);
  });
}
function show(i){
  if(i === active || !chars[i]) return;
  active = i;
  paintInfo();
  renderFor(i);
  reveal(i);
}

(function(){
  var list = ((CFG.raiderio || {}).characters) || [], host = $('picks');
  if(!list.length || !window.RaiderIO) return;
  var state = list.map(function(){ return 'wait'; });

  /* Plekken vooruit, zodat de knoppen in configvolgorde staan en niet in de
     volgorde waarin de antwoorden binnenkomen. */
  var btns = list.map(function(spec, i){
    var b = txt('button', 'pick rib'); b.type = 'button'; b.dataset.i = i;
    b.disabled = true; b.setAttribute('aria-pressed', 'false');
    var bar = txt('span', 'rib__bar'), inn = txt('span', 'rib__in');
    var acc = txt('span', 'rib__acc'), tx = txt('span', 'pick__t');
    tx.appendChild(txt('span', 'pick__n', spec.name));
    tx.appendChild(txt('span', 'pick__s', ' '));
    inn.appendChild(acc); inn.appendChild(tx); bar.appendChild(inn); b.appendChild(bar);
    b.addEventListener('click', function(){ show(i); });
    b.addEventListener('pointerenter', function(){ renderFor(i); });
    b.addEventListener('focus', function(){ renderFor(i); });
    host.appendChild(b);
    return b;
  });

  function fill(i, c){
    chars[i] = c;
    var b = btns[i];
    b.disabled = false;
    b.style.setProperty('--cls', classColour(c.klass));
    b.querySelector('.pick__n').textContent = c.name;
    b.querySelector('.pick__s').textContent =
      [c.spec, c.klass].filter(Boolean).join(' ') + ' · ' + c.realm;
    if(c.thumb){
      var av = new Image(64, 64); av.alt = ''; av.decoding = 'async';
      av.onerror = function(){ av.remove(); };
      av.src = String(c.thumb).split('?')[0];
      b.querySelector('.rib__acc').appendChild(av);
    }
  }

  /* De eerste die er is, maar nooit een latere voor een eerdere die nog
     onderweg is: anders springt de pagina van Bhikhu naar Shiftheal. */
  function settle(){
    if(active >= 0) return;
    for(var i = 0; i < state.length; i++){
      if(state[i] === 'wait') return;
      if(state[i] === 'ok'){ show(i); return; }
    }
  }

  list.forEach(function(spec, i){
    fetchChar(spec).then(function(c){
      c.render = c.render || null;
      fill(i, c);
      state[i] = 'ok';
    }, function(){
      var s = SNAP[String(spec.name).toLowerCase()];
      if(s){
        fill(i, { name: s.name, realm: s.realm, klass: s.klass, spec: s.spec, race: s.race,
          thumb: s.thumb, render: renderOf(s.thumb), ilvl: null, score: null, snap: true });
        state[i] = 'ok';
      } else {
        btns[i].remove();
        state[i] = 'gone';
      }
    }).then(settle);
  });
})();

/* ==== the boss ===============================================================
   De boss waar de guild nu op zit, uit de race-stand; na Cutting Edge de
   CE-boss van de tier. Een councilgevecht heeft meer lijven: hooguit twee. */
var boss = null;
function artFor(name, encounter){
  var art = window.BossArt; if(!art) return [];
  var enc = encounter || (name && art.byName[String(name).toLowerCase()]);
  return ((enc && art.byEncounter[enc]) || []).map(function(x){
    var m = /creature-display-(\d+)\.jpg$/.exec(x.img || '');
    return m && 'img/boss/creature-display-' + m[1] + '.png';
  }).filter(Boolean).slice(0, 2);
}
function paintBoss(){
  var tag = $('bossTag');
  if(!boss){ tag.hidden = true; return; }
  $('bossTagK').textContent = t(boss.ce ? 'bossCe' : 'bossOn');
  $('bossTagN').textContent = boss.name;
  $('bossTagM').textContent = boss.total ? t('killsM', { k: boss.kills, n: boss.total }) : '';
  tag.hidden = false;
}
onLang(paintBoss);
function setBoss(b){
  if(!b || !b.name) return;
  boss = b;
  var host = $('bossArt'), srcs = artFor(b.name, b.encounter);
  host.textContent = '';
  host.classList.toggle('boss--pair', srcs.length > 1);
  srcs.forEach(function(src){
    var im = new Image(); im.alt = ''; im.decoding = 'async';
    /* Sommige renders van Blizzard zijn piepklein: nooit meer dan twee keer
       hun eigen hoogte, anders wordt het pap. Een lange, lage boss krijgt
       het brede vak. */
    im.addEventListener('load', function(){
      im.style.setProperty('--nat-h', im.naturalHeight + 'px');
      if(srcs.length === 1 && im.naturalWidth > 2 * im.naturalHeight) host.classList.add('boss--wide');
      im.classList.add('is-on');
    });
    im.addEventListener('error', function(){ im.remove(); });
    im.src = src;
    host.appendChild(im);
  });
  paintBoss();
}
(function(){
  var race = window.Race && window.Race.enabled() ? window.Race.guild() : Promise.resolve(null);
  race.then(function(g){
    if(g && (g.ce ? g.ceBoss : g.current)){
      return { name: g.ce ? g.ceBoss : g.current, ce: g.ce, kills: g.kills, total: g.total };
    }
    /* Geen race-stand (site plat, of een guild die er niet in staat): de
       live tracking van Raider.IO, licht, want alleen de boss telt hier. */
    if(!window.RioLive) return null;
    return window.RioLive.load({ light: true }).then(function(r){
      return r && r.bossName ? { name: r.bossName, encounter: r.encounter, kills: r.mythic,
        total: r.total } : null;
    }, function(){ return null; });
  }).then(setBoss);
})();

/* ---- multiplane: de boss blijft verder achter dan het character -----------
   Onder reduced motion staat alles stil. */
(function(){
  var bp = $('bossPlane'), cp = $('charPlane'), raf = 0;
  function frame(){
    raf = 0;
    if(RM.matches){ bp.style.transform = cp.style.transform = ''; return; }
    var y = Math.min(window.scrollY, stage.offsetHeight);
    bp.style.transform = 'translate3d(0,' + (y * .32).toFixed(1) + 'px,0)';
    cp.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0)';
  }
  addEventListener('scroll', function(){ if(!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  if(RM.addEventListener) RM.addEventListener('change', frame);
})();

/* ---- ticker: de cyclus van alerts.html?test=1, demonamen -------------------
   De lijst twee keer achter elkaar voor een naadloze lus; de kopie is
   verborgen voor schermlezers. */
function pct(x){ return new Intl.NumberFormat(I.locale(), { minimumFractionDigits: 2 }).format(x) + '%'; }
function money(x){ return 'EUR ' + new Intl.NumberFormat(I.locale(), { minimumFractionDigits: 2 }).format(x); }
var DEMO = [
  ['follow', 'joesswow', function(){ return ''; }],
  ['sub', 'vassham', function(){ return 'T2 · ' + t('months', { n: 14 }); }],
  ['cheer', 'TheNoremac', function(){ return t('bitsN', { n: 184 }); }],
  ['raidIn', 'Amphroxia', function(){ return t('viewersN', { n: 42 }); }],
  ['tip', 'xxmaebeexx', function(){ return money(5); }],
  ['best', 'The Lost Explorers', function(){ return pct(43.89); }],
  ['kill', 'The Lost Explorers', function(){ return (CFG.raiderio.guild || {}).name || ''; }]
];
function paintTicker(){
  var list = $('ticker'); list.textContent = '';
  [0, 1].forEach(function(pass){
    DEMO.forEach(function(a){
      var li = txt('li', 'tk');
      if(pass) li.setAttribute('aria-hidden', 'true');
      li.appendChild(txt('span', 'tk__t' + (a[0] === 'best' ? ' tk__t--gold' : ''), t(a[0])));
      li.appendChild(txt('b', '', a[1]));
      var x = a[2](); if(x) li.appendChild(document.createTextNode(' · ' + x));
      list.appendChild(li);
    });
  });
}
paintTicker(); onLang(paintTicker);

/* ---- emotes per slot; de drie bits-trappen als één groep ------------------- */
(function(){
  var host = $('emotes'), E = window.EMOTES;
  if(!host || !E) return;
  var groups = [];
  E.list.forEach(function(e){
    var key = /^Bits/.test(e.slot) ? 'Bits' : e.slot, g = groups[groups.length - 1];
    if(!g || g.slot !== key) groups.push(g = { slot: key, list: [] });
    g.list.push(e);
  });
  groups.forEach(function(g){
    var box = txt('div', 'egroup');
    box.appendChild(txt('span', 'pill' + (/animated/i.test(g.slot) ? ' pill--jade' : ''), g.slot));
    var row = txt('div', 'egroup__row');
    g.list.forEach(function(e){
      var src = 'graphics/emotes/' + e.name + '-112.' + (e.frames > 1 ? 'gif' : 'png');
      var f = txt('figure', 'emo'), a = document.createElement('a'); a.href = src;
      var im = new Image(112, 112); im.src = src; im.alt = e.name; im.title = e.about || ''; im.loading = 'lazy';
      a.appendChild(im); f.appendChild(a);
      var cap = txt('figcaption', '', e.name);
      if(/^Bits · /.test(e.slot)){
        cap.appendChild(document.createTextNode(' '));
        cap.appendChild(txt('b', '', e.slot.replace('Bits · ', '')));
      }
      f.appendChild(cap); row.appendChild(f);
    });
    box.appendChild(row); host.appendChild(box);
  });
})();

/* ---- panelknoppen uit de config, met dezelfde slugregel als build-graphics.sh */
(function(){
  var strip = $('panelStrip'), list = ((CFG.graphics || {}).panels) || [];
  if(!strip) return;
  list.forEach(function(p){
    var slug = String(p.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var a = document.createElement('a'); a.href = 'graphics/panel-' + slug + '.png';
    var im = new Image(320, 100); im.src = a.getAttribute('href'); im.alt = String(p.label); im.loading = 'lazy';
    a.appendChild(im); strip.appendChild(a);
  });
})();

/* ---- copy: de volledige URL van de bron, zonder token ---------------------- */
var base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
$('base').textContent = base;
function copy(text, btn){
  var done = function(){
    btn.textContent = I.t('copied'); btn.classList.add('ok');
    setTimeout(function(){ btn.classList.remove('ok'); btn.textContent = I.t('copy'); }, 1400);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, function(){});
    return;
  }
  var ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch(e){}
  document.body.removeChild(ta);
}
document.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('.copy') : null;
  if(!btn) return;
  var row = btn.closest('tr');
  if(row && row.dataset.file) copy(I.withLang(base + row.dataset.file), btn);
});

/* ---- taal --------------------------------------------------------------------
   De Engelse tekst staat in de HTML en blijft de bron; bij de eerste wissel
   bewaren we hem per blok. De voorbeelden zijn echte pagina's, dus die
   krijgen ?lang= mee en laden opnieuw. */
(function(){
  var NL = (window.I18N_INDEX || {}).nl || {};
  var blocks = document.querySelectorAll('[data-i18n-html]'), EN = {};
  Array.prototype.forEach.call(blocks, function(n){ EN[n.getAttribute('data-i18n-html')] = n.innerHTML; });
  var TITLE = { en: document.title, nl: document.body.dataset.titleNl || document.title };
  function paint(l){
    Array.prototype.forEach.call(blocks, function(n){
      var k = n.getAttribute('data-i18n-html');
      var h = l === 'nl' && NL[k] != null ? NL[k] : EN[k];
      if(n.innerHTML !== h) n.innerHTML = h;
    });
    document.title = TITLE[l] || TITLE.en;
    Array.prototype.forEach.call(document.querySelectorAll('#langPick button'), function(b){
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.copy'), function(b){
      if(!b.classList.contains('ok')) b.textContent = I.t('copy');
    });
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      var src = f.getAttribute('src'), next = I.withLang(src, l);
      if(next !== src) f.setAttribute('src', next);
    });
    repaints.forEach(function(fn){ fn(l); });
  }
  paint(I.lang);
  I.onChange(paint);
  $('langPick').addEventListener('click', function(e){
    var b = e.target.closest('button[data-lang]');
    if(b) I.set(b.getAttribute('data-lang'));
  });
})();

fit();
document.addEventListener('DOMContentLoaded', fit);
addEventListener('load', fit);
})();

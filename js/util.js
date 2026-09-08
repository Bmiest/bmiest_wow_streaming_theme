/* Gedeelde helpers. Klassiek script (geen ES-modules): OBS' Chromium
   weigert modules zodra de pagina ooit via file:// geopend wordt. */
(function(){
'use strict';

/* Instellingen komen uit drie lagen, in deze volgorde:
     1. config.default.js  -- gedeeld, geen geheimen, mag publiek
     2. config.js          -- lokaal en optioneel (window.OVERLAY_OVERRIDE)
     3. de URL             -- ?jwt=... en ?channel=...

   Het token hoort in laag 3. Een gehoste pagina heeft geen config.js, en
   de URL staat alleen in jouw OBS-configuratie -- net als bij de
   overlay-URL van StreamElements zelf. */
function merge(base, over){
  Object.keys(over || {}).forEach(function(k){
    var v = over[k], b = base[k];
    if(v && typeof v === 'object' && !Array.isArray(v) &&
       b && typeof b === 'object' && !Array.isArray(b)) merge(b, v);
    else base[k] = v;
  });
  return base;
}

var CFG = merge(window.OVERLAY_CONFIG || {}, window.OVERLAY_OVERRIDE);

(function(){
  var q = new URLSearchParams(location.search);
  var jwt = q.get('jwt');
  /* De kant-en-klare OBS-collectie bevat de plaatshouder __JWT__. Wie die
     vergeet te vervangen kreeg een overlay die stil deed alsof er nooit
     iets gebeurde: SE weigert het token, dus geen alerts en geen events.
     Een echt token is base64.base64.base64. */
  if(jwt && !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(jwt)){
    console.error('[config] jwt in de URL is geen token (' + jwt + '). ' +
      'Vervang __JWT__ in je OBS-bron door je StreamElements JWT.');
    jwt = null;
  }
  if(jwt){ CFG.streamelements = CFG.streamelements || {}; CFG.streamelements.jwt = jwt; }
  var ch = q.get('channel');
  if(ch){ CFG.twitch = CFG.twitch || {}; CFG.twitch.channel = ch; }
})();

// Officiele WoW klassekleuren. Ze worden alleen op kleine vlakken
// gebruikt (ring, bolletje, naam) zodat ze het grijs niet verstoren.
var CLASS_COLORS = {
  'Death Knight':'#C41E3A','Demon Hunter':'#A330C9','Druid':'#FF7C0A',
  'Evoker':'#33937F','Hunter':'#AAD372','Mage':'#3FC7EB','Monk':'#00FF98',
  'Paladin':'#F48CBA','Priest':'#FFFFFF','Rogue':'#FFF468','Shaman':'#0070DD',
  'Warlock':'#8788EE','Warrior':'#C69B6D'
};

function $(sel,root){ return (root||document).querySelector(sel); }
function el(tag,cls,txt){
  var n=document.createElement(tag);
  if(cls) n.className=cls;
  if(txt!=null) n.textContent=txt;
  return n;
}
function esc(s){
  return String(s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

// nl-BE dunne spatie als duizendtal: 1 284
function num(n){
  if(n==null||isNaN(n)) return '\u2014';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');
}

// Telt op naar de nieuwe waarde en flasht jade. Kort en op een klein
// vlak, dus goedkoop voor de encoder.
function countTo(node,to,fmt){
  fmt = fmt || num;
  var from = parseInt(String(node.dataset.v||'0'),10) || 0;
  if(from===to){ node.textContent=fmt(to); return; }
  node.dataset.v = to;
  node.classList.remove('flash'); void node.offsetWidth; node.classList.add('flash');
  var t0=performance.now(), dur=600;
  (function step(t){
    var p=Math.min(1,(t-t0)/dur);
    p = 1-Math.pow(1-p,3);
    node.textContent = fmt(from + (to-from)*p);
    if(p<1) requestAnimationFrame(step);
  })(t0);
}

function slug(s){
  return String(s).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/['\u2019]/g,'').replace(/\s+/g,'-');
}

// fetch met timeout; faalt stil zodat een dode API de overlay niet sloopt.
// De timer wordt in beide takken opgeruimd -- bij een afgewezen fetch bleef
// hij anders gewapend achter, en dat is er één per mislukte poll.
function fetchT(url, ms, read){
  var ctl = new AbortController();
  var to  = setTimeout(function(){ ctl.abort(); }, ms || 8000);
  function done(){ clearTimeout(to); }
  return fetch(url, {signal: ctl.signal, cache: 'no-store'}).then(
    function(r){ done(); if(!r.ok) throw new Error(r.status + ' ' + url); return read(r); },
    function(e){ done(); throw e; }
  );
}
function getJSON(url, ms){ return fetchT(url, ms, function(r){ return r.json(); }); }
function getText(url, ms){ return fetchT(url, ms, function(r){ return r.text(); }); }

// Herhaalt fn direct en daarna elke n seconden, met jitter zodat drie
// pollers niet allemaal op dezelfde seconde vuren.
function poll(fn,seconds){
  var run=function(){
    Promise.resolve().then(fn).catch(function(e){ console.warn('[poll]',e.message); });
  };
  run();
  setInterval(run, seconds*1000 + Math.random()*2000);
}

/* Statusregeltje rechtsboven. Dit is een diagnosehulpje, geen onderdeel van
   je stream -- een rode "offline" in beeld is erger dan het probleem dat hij
   meldt. Daarom alleen zichtbaar met ?health=1 in de URL. */
var health = {};
var SHOW_HEALTH = /[?&]health=1/.test(location.search);
function setHealth(key,ok){
  health[key]=ok;
  if(!SHOW_HEALTH) return;
  var node=document.getElementById('health'); if(!node) return;
  var bad=Object.keys(health).filter(function(k){ return !health[k]; });
  node.textContent = bad.length ? bad.join(' \u00b7 ')+' offline' : '';
  node.classList.toggle('show', bad.length>0);
}

window.U = {
  CFG:CFG, CLASS_COLORS:CLASS_COLORS,
  $:$, el:el, esc:esc, num:num, countTo:countTo, slug:slug,
  getJSON:getJSON, getText:getText, poll:poll, setHealth:setHealth
};
})();

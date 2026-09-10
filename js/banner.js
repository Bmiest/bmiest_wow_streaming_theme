/* Onderbalk: camera, character, boss progress, chat, recente events.
   De sessiestatus (volgers, kijkers, uptime) zit in de bovenbalk. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var DEMO = /[?&]demo=1/.test(location.search);
var RIO  = (location.search.match(/[?&]rio=([a-z]+)/) || [])[1];   // testoverride

if(DEMO){
  document.body.classList.add('demo');
  var h = document.getElementById('health');
  if(h) h.style.display = 'none';
}

/* ---- schaal -------------------------------------------------------- */
(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  var L  = CFG.layout || {};
  stage.style.width  = dw + 'px';
  stage.style.height = (L.bottomHeight || 248) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';

  /* De onderste strook van hetzelfde doek. Je ziet hem alleen in de kieren
     tussen de kaarten en in de marges -- meer ruimte is er hier niet. */
  window.Backdrop.slice(stage, {
    top   : (L.topHeight || 120) + (L.gameHeight || 1072),
    height: (L.bottomHeight || 248)
  });
})();

/* De bijschriften van de kaarten dragen hetzelfde icoon als het kopblok
   van een ribbon; één bron voor die glyphs (js/ribbon.js). */
Array.prototype.forEach.call(document.querySelectorAll('[data-icon]'), function(n){
  var g = window.Ribbon.GLYPH[n.getAttribute('data-icon')];
  if(g) n.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 18 18">' + g + '</svg>');
});

/* Naamplaatje onder de camera: dezelfde ribbon als de gebeurtenisbalk die
   er straks overheen schuift (js/camevent.js). */
U.$('#camPlate').appendChild(window.Ribbon.make('live', '',
  CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live'));

/* =====================================================================
   CHARACTERS  --  één kolom per character, naast elkaar in dezelfde kaart
   ===================================================================== */
var MAX_SLOTS = 2;                 // meer kolommen wordt te smal om te lezen
var raidSlug  = null;              // huidige tier, komt uit live-tracking
var chars = [], page = 0, rotTimer = null, slots = [];
var elCard = U.$('.card--char'), elRow = U.$('#charRow'), elDots = U.$('#charDots');

/* Eén kolom: het gekloonde template plus verwijzingen naar de velden erin. */
function makeSlot(){
  var node = U.$('#charTpl').content.firstElementChild.cloneNode(true);
  elRow.appendChild(node);
  return {
    root  : node,
    img   : U.$('.char__portrait img', node),
    ring  : U.$('.char__halo .ring',  node),
    name  : U.$('.char__name',        node),
    swatch: U.$('.swatch',            node),
    spec  : U.$('.char__spec',        node),
    guild : U.$('.char__guild',       node),
    ilvl  : U.$('.char__ilvl',        node),
    score : U.$('.char__score',       node),
    scorel: U.$('.char__scorel',      node),
    raid  : U.$('.prog__nm',          node),
    tiers : U.$('.prog__t',           node)
  };
}

function buildSlots(n){
  if(slots.length === n) return;
  elRow.innerHTML = ''; slots = [];
  for(var i=0;i<n;i++) slots.push(makeSlot());
  elCard.classList.toggle('is-two', n > 1);
}

/* Raidprogress van het character zelf, per moeilijkheid. De hoogste graad
   waar kills staan krijgt de tint; de rest blijft grijs. */
function paintProgress(s, raids){
  var r = window.RaiderIO.pickRaid(raids, raidSlug);
  s.tiers.innerHTML = '';
  if(!r || !r.total){
    s.raid.textContent = '';
    s.tiers.appendChild(U.el('span','prog__empty','no raid progress yet'));
    return;
  }
  s.raid.textContent = r.title;
  var top = null;
  [['m', r.mythic], ['h', r.heroic], ['n', r.normal]].forEach(function(t){
    if(top === null && t[1]) top = t[0];
    var g = U.el('span', 'tier' + (t[1] ? (t[0] === top ? ' tier--top' : '')
                                        : ' tier--none'));
    g.appendChild(U.el('span','tier__v', t[1] + '/' + r.total));
    g.appendChild(U.el('span','tier__l', t[0]));
    s.tiers.appendChild(g);
  });
}

function paintSlot(s, c){
  // Laatste pagina niet vol: kolom leeg laten, niet een character herhalen.
  s.root.style.visibility = c ? '' : 'hidden';
  if(!c) return;
  s.name.textContent  = c.name;
  s.spec.textContent  = [c.spec, c.klass].filter(Boolean).join(' ');
  s.guild.textContent = c.guild ? '‹' + c.guild + '›' : c.realm;
  s.ilvl.textContent  = c.ilvl  != null ? Number(c.ilvl).toFixed(1) : '—';
  s.score.textContent = c.score != null ? U.num(c.score) : '—';
  /* De klasse-realmrank van Raider.IO hoort bij het getal dat hij
     rangschikt, dus in het label: "m+ score · #132" -- 132e Holy Priest op
     Ragnaros zegt op een stream iets, 114745e van de regio niet. Als derde
     blokje ernaast paste het net niet: de statsrij vulde de kolom exact, en
     een rank van vijf cijfers liep eruit. Zo is het ook korter. */
  s.scorel.textContent = 'm+ score' +
    (c.rank != null ? '  \u00b7  #' + U.num(c.rank) : '');
  if(c.thumb) s.img.src = c.thumb;
  // Klassekleur alleen op ring en bolletje: kleine vlakken, grijs blijft grijs.
  s.swatch.style.background = c.color;
  s.ring.style.stroke = c.color;
  paintProgress(s, c.raids);
}

function pageCount(){
  return Math.max(1, Math.ceil(chars.length / Math.max(1, slots.length)));
}

function showPage(p){
  if(!slots.length) return;
  var n = pageCount();
  page = (p + n) % n;
  elRow.style.opacity = '0';
  elRow.style.transform = 'translateY(5px)';
  setTimeout(function(){
    slots.forEach(function(s,i){ paintSlot(s, chars[page*slots.length + i]); });
    elRow.style.opacity = '1';
    elRow.style.transform = 'none';
  }, 220);
  Array.prototype.forEach.call(elDots.children, function(d,i){ d.classList.toggle('on', i===page); });
}

// Bolletjes staan voor pagina's, niet voor characters; bij twee characters
// in twee kolommen is er dus niks te rouleren en verdwijnen ze.
function buildDots(n){
  elDots.innerHTML = '';
  if(n < 2) return;
  for(var i=0;i<n;i++) elDots.appendChild(U.el('i'));
}

function showChars(list){
  chars = list;
  buildSlots(Math.min(chars.length, MAX_SLOTS));
  buildDots(pageCount());
  showPage(page < pageCount() ? page : 0);
  if(!rotTimer && pageCount() > 1){
    rotTimer = setInterval(function(){ showPage(page+1); },
                           ((CFG.raiderio && CFG.raiderio.rotateSeconds) || 20) * 1000);
  }
}

/* Welke tier de huidige is, vragen we bij elke poll opnieuw. Eén extra
   request per vijf minuten, en de characterkaart volgt de guild als die een
   nieuwe raid binnenstapt -- eerder moest de browser source daarvoor
   herladen. Faalt de aanroep, dan houden we de vorige slug; is die er nog
   niet, dan valt pickRaid terug op de laatste sleutel. */
function loadRaidSlug(){
  if(!window.RioLive) return Promise.resolve();
  return window.RioLive.currentRaid().then(function(s){
    if(s) raidSlug = s;
  }).catch(function(e){
    console.warn('[rio-live] huidige raid onbekend:', e.message);
  });
}

/* Raider.IO crawlt characters op hun eigen ritme en zet er last_crawled_at
   bij. Staat daar iets van dagen oud, dan verspringt er tijdens je stream
   niets en is dat geen fout van de overlay. Onder twee uur melden we niets:
   die regel moet alleen aangaan als er iets te zien is. */
function crawlNote(list){
  var oldest = null;
  list.forEach(function(c){
    var t = c.crawled ? Date.parse(c.crawled) : NaN;
    if(!isNaN(t) && (oldest === null || t < oldest)) oldest = t;
  });
  if(oldest === null) return '';
  var min = Math.round((Date.now() - oldest) / 60000);
  if(min < 120)  return '';
  if(min < 2880) return Math.round(min / 60) + 'u oud';
  return Math.round(min / 1440) + 'd oud';
}

function loadChars(){
  var list = (CFG.raiderio && CFG.raiderio.characters) || [];
  if(!list.length) return Promise.resolve();
  return loadRaidSlug().then(function(){
    return Promise.all(list.map(function(c){
      return window.RaiderIO.character(c).catch(function(e){
        console.warn('[raiderio]', c.name, e.message); return null;
      });
    }));
  }).then(function(res){
    var ok = res.filter(Boolean);
    U.setHealth('raider.io', ok.length > 0, crawlNote(ok));
    if(!ok.length) return;
    showChars(ok);
  });
}

/* =====================================================================
   BOSS PROGRESS  --  Raider.IO widget of eigen weergave
   ===================================================================== */
var LT    = (CFG.raiderio && CFG.raiderio.liveTracking) || {};
var LMODE = RIO || (LT.enabled === false ? 'off' : (LT.mode || 'widget'));

function widgetUrl(){
  var R = CFG.raiderio || {}, g = R.guild || {};
  if(LT.widgetUrl) return LT.widgetUrl;
  return 'https://raider.io/widgets/boss-progress'
    + '?raid='       + encodeURIComponent(LT.raid || 'latest')
    + '&name_style=logo'
    + '&difficulty=' + encodeURIComponent(LT.difficulty || 'latest')
    + '&region='     + encodeURIComponent(R.region || 'eu')
    + '&realm='      + encodeURIComponent(U.slug(g.realm || ''))
    + '&guild='      + encodeURIComponent(g.name || '')
    + '&boss=latest'
    + '&period='     + encodeURIComponent(LT.period || 'until_kill')
    + '&orientation=rect&hide=logo&chromargb=transparent&theme=dragonflight&refresh=60';
}

function mountWidget(){
  var box = U.$('#rioWidget'), fr = U.$('#rioFrame');
  box.style.display = '';
  // De widget is vast 500x312; passend schalen zodat er geen tekst wegvalt.
  var s = Math.min(box.clientWidth / 500, box.clientHeight / 312);
  fr.style.transform = 'translate(-50%,-50%) scale(' + s.toFixed(4) + ')';
  fr.src = widgetUrl();
}

function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

/* Wat er sinds de vorige poll veranderde. De detectie zit in js/rio-live.js,
   want alerts.html doet hetzelfde met zijn eigen stand. */
var bossDiff = window.RioLive ? window.RioLive.watcher()
                              : function(){ return {}; };

/* Ribbonnetje dat over de kaart omhoog schuift, zoals de gebeurtenisbalk
   over het naamplaatje van je camera. Boven de kaart uitkomen kan niet: de
   onderbalk is 248px hoog en OBS knipt de bron daar af. Wil je een echte
   alert over je gameplay, dan hoort die in alerts.html. */
var flashTimer = null;
function bossFlash(capText, val, minor){
  var host = U.$('#bossFlash');
  if(!host) return;
  host.innerHTML = '';
  var r = window.Ribbon.make('raid', capText, val);
  /* Een poging erbij is klein nieuws: zelfde vorm, maar een gedempte kop en
     korter in beeld. Kreeg een wipe dezelfde jade balk als een kill, dan zegt
     die kleur niets meer. */
  if(minor) r.style.setProperty('--acc', 'var(--ink-300)');
  host.appendChild(r);
  host.classList.remove('on'); void host.offsetWidth; host.classList.add('on');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(function(){ host.classList.remove('on'); },
                          minor ? 3200 : 5200);
}

/* De poging die er net bij kwam. Bij een kill en een nieuwe beste hangt de
   melding aan een ander getal, dus dit is alleen voor 'last try'. Het
   percentage is boss-HP dat nog overstond, net als bij 'new best'. */
function lastTry(L){
  var all = L.pulls || [], p = all[all.length - 1];
  if(!p) return U.num(L.pullCount || 0) + ' pulls';
  return p.pct.toFixed(2) + '%' + (p.phase ? '  \u00b7  ' + p.phase : '');
}

function paintBoss(L){
  if(!L) return;
  var ev = bossDiff(L);
  U.$('#raidName').textContent =
    [L.raidName, cap(L.difficulty)].filter(Boolean).join('  ·  ');
  U.$('#bossName').textContent = L.bossName || '—';

  var art = U.$('#bossArt');
  art.style.backgroundImage = L.bossImg ? 'url("' + L.bossImg + '")' : 'none';

  var tag = U.$('#bossTag');
  if(L.bossName){
    tag.style.display = '';
    tag.className   = 'boss__tag ' + (L.defeated ? 'down' : 'prog');
    tag.textContent = L.defeated ? 'down' : 'progress';
  } else tag.style.display = 'none';

  var sub = U.$('#bossSub');
  sub.innerHTML = '';
  if(L.guild)   sub.appendChild(U.el('span', null, '‹' + L.guild + '›  '));
  if(L.summary) sub.appendChild(U.el('b', null, L.summary));

  var big = U.$('#bossBig'), lbl = U.$('#bossLbl');
  var n = L.pullCount || 0;
  if(L.defeated){
    big.textContent = U.num(n); big.className = 'boss__v jade';
    lbl.textContent = (n === 1 ? 'pull' : 'pulls') + ' to kill';
  } else if(L.bestPct != null){
    big.textContent = L.bestPct.toFixed(2) + '%'; big.className = 'boss__v gold';
    lbl.textContent = 'best of ' + n + ' pulls' +
                      (L.bestPhase ? '  \u00b7  ' + L.bestPhase : '');
  } else {
    big.textContent = U.num(n); big.className = 'boss__v';
    lbl.textContent = n === 1 ? 'pull' : 'pulls';
  }

  /* className wordt hierboven opnieuw gezet, dus de flits komt erna. */
  if(ev.fresh){
    big.classList.remove('hit'); void big.offsetWidth; big.classList.add('hit');
  }
  /* Kill eerst, dan een nieuwe beste, dan een gewone poging. Dezelfde
     rangorde als in js/alerts.js: landen er twee pulls in één venster -- een
     goede wipe en daarna de kill -- dan noemen de kaart en de melding over je
     beeld hetzelfde. Stond 'better' hier eerst, dan zei de kaart "new best"
     terwijl er "BOSS DOWN" over je gameplay lag. */
  if(ev.down)        bossFlash('boss down', U.num(L.pullCount || 0) + ' pulls');
  else if(ev.better) bossFlash('new best', L.bestPct.toFixed(2) + '%');
  else if(ev.fresh)  bossFlash('last try', lastTry(L), true);

  var sp = U.$('#bossSpark');
  sp.innerHTML = '';
  /* De beste pull over de hele reeks bepalen, niet alleen binnen de laatste
     14 -- anders licht er een ander staafje op dan het percentage hierboven. */
  var all = L.pulls || [], bestOf = null;
  all.forEach(function(p){ if(!p.kill && (bestOf === null || p.pct < bestOf)) bestOf = p.pct; });
  var last = all.length - 1;
  all.slice(-14).forEach(function(p, i, arr){
    var b = U.el('i');
    b.style.height = Math.max(2, Math.round((1 - p.pct/100) * 30)) + 'px';
    if(p.kill)                              b.className = 'kill';
    else if(bestOf !== null && p.pct === bestOf) b.className = 'best';
    /* Alleen het nieuwe staafje groeit in. De rest staat stil, want de hele
       reeks laten animeren bij elke poll is beweging zonder nieuws. */
    if(ev.fresh && i === arr.length - 1) b.className += ' fresh';
    sp.appendChild(b);
  });
}

/* Faalt stil: ongedocumenteerde endpoints, dus als Raider.IO ze verandert
   blijft alleen dit blok leeg en loopt de rest door. */
function loadLive(){
  if(!window.RioLive) return Promise.resolve();
  return window.RioLive.load().then(paintBoss).catch(function(e){
    console.warn('[rio-live]', e.message);
  });
}

/* =====================================================================
   CHAT
   ===================================================================== */
var chatBox = U.$('#chatList');
var MAXMSG  = (CFG.chat && CFG.chat.maxMessages) || 5;

/* Twitch geeft geen kleur voor wie er nooit een koos; dan een tint uit de
   huisstijl in plaats van Twitch' willekeurige felle set. */
var FALLBACK = ['#eef1f5','#a8b1bc','#3fd9a4','#c9d0d8','#d8b263','#818b98'];
function colorFor(name, given){
  if(given) return given;
  var h = 0;
  for(var i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) | 0;
  return FALLBACK[Math.abs(h) % FALLBACK.length];
}

function addMessage(m){
  var row = U.el('div', 'msg' + (m.action ? ' msg--action' : ''));
  /* Id en login op de rij, zodat een verwijderd bericht of een timeout
     terug te vinden is (js/chat.js prune). */
  row.dataset.mid  = m.id || '';
  row.dataset.user = m.login || '';
  if(m.badges.length){
    var bw = U.el('span','msg__badges');
    m.badges.forEach(function(b){ bw.appendChild(U.el('span','bdg bdg--'+b.key, b.label)); });
    row.appendChild(bw);
  }
  var nm = U.el('span','msg__name', m.name);
  nm.style.color = colorFor(m.name, m.color);
  row.appendChild(nm);
  var body = U.el('span','msg__body');
  body.innerHTML = m.html;
  row.appendChild(body);
  chatBox.appendChild(row);
  while(chatBox.children.length > MAXMSG) chatBox.removeChild(chatBox.firstChild);
}

/* =====================================================================
   RECENTE EVENTS
   ===================================================================== */
var camEv = window.CamEvent.mount(U.$('.cam'), { hold:4600 });

var feed = [];
function pushEvent(e){
  camEv.push(e);
  feed.unshift(e);
  if(feed.length > 4) feed.pop();
  var root = U.$('#events');
  root.innerHTML = '';
  feed.forEach(function(x){
    var row = U.el('div','ev');
    row.appendChild(U.el('span','tag tag--' + x.kind, x.word));
    row.appendChild(U.el('b', null, x.who));
    if(x.extra) row.appendChild(U.el('i', null, x.extra));
    root.appendChild(row);
  });
}

/* =====================================================================
   DEMO
   ===================================================================== */
function demo(){
  if(!chars.length){
    showChars([
      { name:'Shiftheal', realm:'Ragnaros', klass:'Priest', spec:'Holy',
        guild:'', color:'#FFFFFF', thumb:'',
        ilvl:318.75, score:2932,
        raids:{'the-venomous-abyss':{ total_bosses:8, normal_bosses_killed:8,
                                      heroic_bosses_killed:6, mythic_bosses_killed:2 }} },
      { name:'Bhikhu', realm:'Twisting Nether', klass:'Monk', spec:'Mistweaver',
        guild:'Kelderklasse', color:'#00FF98', thumb:'',
        ilvl:295.5, score:1841,
        raids:{'the-venomous-abyss':{ total_bosses:8, normal_bosses_killed:8,
                                      heroic_bosses_killed:3, mythic_bosses_killed:0 }} }
    ]);
  }
  U.$('#rioWidget').style.display = 'none';
  U.$('#bossNative').style.display = '';

  /* De demo speelt een avondje na, zodat je alle drie de meldingen ziet:
     eerst de stand, dan een gewone wipe ('last try'), dan een nieuwe beste,
     dan de kill. De pulls staan op oplopende kwaliteit zodat het beste
     staafje in de sparkline hetzelfde percentage aanwijst als het grote
     getal -- anders licht er een ander staafje op dan de kaart noemt. */
  var PULLS = [{pct:65.01},{pct:54.02},{pct:52.45},{pct:47.19},
               {pct:52.08},{pct:43.89},{pct:44.87},{pct:0,kill:true}];
  function stand(n, best, dead){
    paintBoss({
      raidName:'The Venomous Abyss', difficulty:'mythic', guild:'Kelderklasse',
      bossName:'The Lost Explorers', bossImg:'', summary:'2/8 Mythic',
      defeated:dead, pullCount:n, bestPct:best, bestPhase:'P3',
      pulls:PULLS.slice(0, n)
    });
  }
  /* De eerste stand zet alleen de beginwaarde: de watcher meldt op zijn
     eerste aanroep niets, anders kondigt de overlay bij het opstarten van
     OBS een pull van een uur geleden aan. */
  stand(4, 47.19, false);
  setTimeout(function(){ stand(5, 47.19, false); }, 2400);   // last try
  setTimeout(function(){ stand(6, 43.89, false); }, 5800);   // new best
  setTimeout(function(){ stand(8, 43.89, true);  }, 9000);   // boss down

  [['follow','joesswow','follows',''],
   ['sub','vassham','sub','T2 · 14 mo'],
   ['cheer','TheNoremac','bits','184 bits']].forEach(function(p,i){
    setTimeout(function(){ pushEvent({kind:p[0],who:p[1],word:p[2],extra:p[3]}); }, 200 + i*300);
  });

  [['Amphroxia','gogo gogo','#3fd9a4',[{key:'moderator',label:'mod'}]],
   ['Jhaetra','die pull was clean',null,[{key:'subscriber',label:'sub'}]],
   ['Wvoker','o.O',null,[]],
   ['Hamtaro Wombat','find the fish','#d8b263',[{key:'vip',label:'vip'}]],
   ['Nocteirah','ilvl 318 al zeg, en dan nog een bericht dat lang genoeg is om over meerdere regels te lopen zodat je ziet waar de naam en de badges blijven staan',null,[]]
  ].forEach(function(l,i){
    setTimeout(function(){
      addMessage({name:l[0], html:U.esc(l[1]), color:l[2], badges:l[3], action:false,
                  /* Echte berichten dragen altijd een id en een login; de demo
                     doet dat na, zodat een moderatieactie hier ook werkt. */
                  id:'demo-' + i, login:l[0].toLowerCase().replace(/\s+/g,'')});
    }, 400 + i*550);
  });
}

/* =====================================================================
   START
   ===================================================================== */
U.poll(loadChars, (CFG.raiderio && CFG.raiderio.pollSeconds) || 300);

if(LMODE === 'widget' && !DEMO){
  mountWidget();
} else if(LMODE === 'native' && !DEMO){
  U.$('#bossNative').style.display = '';
  /* Op de gedeelde klok, zodat deze kaart en de melding over je beeld
     dezelfde pull op hetzelfde moment zien. */
  U.pollAligned(loadLive, LT.pollSeconds || 30);
}

window.Chat.start(addMessage, function(what){ window.Chat.prune(chatBox, what); });
window.SE.start(pushEvent);
if(DEMO) demo();
})();

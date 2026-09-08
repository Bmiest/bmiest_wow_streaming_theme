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
})();

U.$('#camName').textContent = CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live';

/* =====================================================================
   CHARACTER
   ===================================================================== */
var chars = [], idx = 0, rotTimer = null;
var elName = U.$('#charName'), elSpec = U.$('#charSpec'), elGuild = U.$('#charGuild'),
    elImg  = U.$('#charImg'),  elIlvl = U.$('#charIlvl'), elScore = U.$('#charMplus'),
    elSwatch = U.$('#charSwatch'), elHalo = U.$('#charHalo'),
    elDots = U.$('#charDots'), elBlock = U.$('#charBlock');

function paintKeys(runs){
  var box = U.$('#keyList');
  box.innerHTML = '';
  if(!runs || !runs.length){
    box.appendChild(U.el('div','keys__empty','geen keys deze week'));
    return;
  }
  runs.slice(0,2).forEach(function(r){
    var row = U.el('div','key');
    row.appendChild(U.el('span','key__lvl','+' + r.level));
    row.appendChild(U.el('span','key__n', r.name));
    box.appendChild(row);
  });
}

function paintChar(c){
  if(!c) return;
  elName.textContent  = c.name;
  elSpec.textContent  = [c.spec, c.klass].filter(Boolean).join(' ');
  elGuild.textContent = c.guild ? '‹' + c.guild + '›' : c.realm;
  elIlvl.textContent  = c.ilvl  != null ? Number(c.ilvl).toFixed(1) : '—';
  elScore.textContent = c.score != null ? U.num(c.score) : '—';
  if(c.thumb) elImg.src = c.thumb;
  // Klassekleur alleen op ring en bolletje: kleine vlakken, grijs blijft grijs.
  elSwatch.style.background = c.color;
  elHalo.style.stroke = c.color;
  paintKeys(c.runs);
}

function showChar(i){
  if(!chars.length) return;
  idx = (i + chars.length) % chars.length;
  elBlock.style.opacity = '0';
  elBlock.style.transform = 'translateY(5px)';
  setTimeout(function(){
    paintChar(chars[idx]);
    elBlock.style.opacity = '1';
    elBlock.style.transform = 'none';
  }, 220);
  Array.prototype.forEach.call(elDots.children, function(d,n){ d.classList.toggle('on', n===idx); });
}

function buildDots(n){
  elDots.innerHTML = '';
  if(n < 2) return;
  for(var i=0;i<n;i++) elDots.appendChild(U.el('i'));
}

function loadChars(){
  var list = (CFG.raiderio && CFG.raiderio.characters) || [];
  if(!list.length) return Promise.resolve();
  return Promise.all(list.map(function(c){
    return window.RaiderIO.character(c).catch(function(e){
      console.warn('[raiderio]', c.name, e.message); return null;
    });
  })).then(function(res){
    var ok = res.filter(Boolean);
    U.setHealth('raider.io', ok.length > 0);
    if(!ok.length) return;
    chars = ok;
    buildDots(chars.length);
    showChar(idx >= chars.length ? 0 : idx);
    if(!rotTimer && chars.length > 1){
      rotTimer = setInterval(function(){ showChar(idx+1); },
                             (CFG.raiderio.rotateSeconds || 20) * 1000);
    }
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

function paintBoss(L){
  if(!L) return;
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
    lbl.textContent = (n === 1 ? 'pull' : 'pulls') + ' tot kill';
  } else if(L.bestPct != null){
    big.textContent = L.bestPct.toFixed(2) + '%'; big.className = 'boss__v gold';
    lbl.textContent = 'beste van ' + n + ' pulls' +
                      (L.bestPhase ? '  \u00b7  ' + L.bestPhase : '');
  } else {
    big.textContent = U.num(n); big.className = 'boss__v';
    lbl.textContent = n === 1 ? 'pull' : 'pulls';
  }

  var sp = U.$('#bossSpark');
  sp.innerHTML = '';
  /* De beste pull over de hele reeks bepalen, niet alleen binnen de laatste
     14 -- anders licht er een ander staafje op dan het percentage hierboven. */
  var all = L.pulls || [], bestOf = null;
  all.forEach(function(p){ if(!p.kill && (bestOf === null || p.pct < bestOf)) bestOf = p.pct; });
  all.slice(-14).forEach(function(p){
    var b = U.el('i');
    b.style.height = Math.max(2, Math.round((1 - p.pct/100) * 30)) + 'px';
    if(p.kill)                              b.className = 'kill';
    else if(bestOf !== null && p.pct === bestOf) b.className = 'best';
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
    chars = [{ name:'Shiftheal', realm:'Ragnaros', klass:'Priest', spec:'Holy',
               guild:'', color:'#FFFFFF', thumb:'',
               ilvl:318.75, score:2932,
               runs:[{level:16,name:'Den of Nalorakk'},{level:14,name:'Voidscar Arena'}] }];
    buildDots(1); paintChar(chars[0]);
  }
  U.$('#rioWidget').style.display = 'none';
  U.$('#bossNative').style.display = '';
  paintBoss({
    raidName:'The Venomous Abyss', difficulty:'mythic', guild:'Kelderklasse',
    bossName:'The Lost Explorers', bossImg:'', summary:'2/8 Mythic',
    defeated:true, pullCount:8, bestPct:43.89,
    pulls:[{pct:52.45},{pct:47.19},{pct:54.02},{pct:65.01},
           {pct:43.89},{pct:44.87},{pct:52.08},{pct:0,kill:true}]
  });

  [['follow','joesswow','volgt nu',''],
   ['sub','vassham','sub','T2 · 14 mnd'],
   ['cheer','TheNoremac','bits','184 bits']].forEach(function(p,i){
    setTimeout(function(){ pushEvent({kind:p[0],who:p[1],word:p[2],extra:p[3]}); }, 200 + i*300);
  });

  [['Amphroxia','gogo gogo','#3fd9a4',[{key:'moderator',label:'mod'}]],
   ['Jhaetra','die pull was clean',null,[{key:'subscriber',label:'sub'}]],
   ['Wvoker','o.O',null,[]],
   ['Hamtaro Wombat','find the fish','#d8b263',[{key:'vip',label:'vip'}]],
   ['Nocteirah','ilvl 318 al zeg',null,[]]
  ].forEach(function(l,i){
    setTimeout(function(){
      addMessage({name:l[0], html:U.esc(l[1]), color:l[2], badges:l[3], action:false});
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
  U.poll(loadLive, LT.pollSeconds || 30);
}

window.Chat.start(addMessage);
window.SE.start(pushEvent);
if(DEMO) demo();
})();

/* Just Chatting-scherm. Camera links (transparant gat), chat rechts.
   Zelfde ribbon-taal als de balken en de scenes. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, R = window.Ribbon;
var SC = CFG.scenes || {};
var DEMO = /[?&]demo=1/.test(location.search);
if(DEMO) document.body.classList.add('demo');

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  stage.style.width  = dw + 'px';
  stage.style.height = (CFG.sceneHeight || 1440) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';
})();

/* Geen Backdrop op dit scherm. Dat vlak ligt over de hele stage, en de
   camera is hier een transparant gat: de schuine vlakken en de stofjes
   dreven dus dwars over je webcam. Buiten het gat is er op deze indeling
   nauwelijks ruimte over om te vullen, dus er valt niks te missen. Op de
   scene-schermen (geen camera) blijft hij staan. */

/* ---- kop ------------------------------------------------------------
   Het character stond hier ook. Dat is de kaart in de onderbalk al, en op
   een scherm waar je zelf het onderwerp bent voegde het niks toe. */
var ribFoll = R.make('follow', 'followers', '—');
U.$('#jcTopRibs').appendChild(ribFoll);

U.$('#jcPlate').appendChild(
  R.make('cam', 'camera', CFG.camName || (CFG.twitch && CFG.twitch.channel) || 'live'));

/* De streamtitel komt van DecAPI; valt terug op 'Just Chatting'. */
U.getText('https://decapi.me/twitch/title/' +
          ((CFG.twitch && CFG.twitch.channel) || '').toLowerCase())
 .then(function(t){
   if(t && !/offline|error|unable|not found/i.test(t)) U.$('#jcTitle').textContent = t.trim();
 }).catch(function(){});

/* ---- kaarten -------------------------------------------------------- */
var chatCard = R.card('chat', 'info');
U.$('#jcChatCard').appendChild(chatCard);
var box = U.el('div'); box.id = 'jcChat';
chatCard.body.appendChild(box);

var strip = R.card('channel', 'info');
U.$('#jcStrip').appendChild(strip);

var colSoc = U.el('div','jc__cols');
(SC.socials || []).forEach(function(s){ colSoc.appendChild(R.make('link', s.label, s.value)); });
strip.body.appendChild(colSoc);
strip.body.appendChild(U.el('div','jc__div'));

var colRec = U.el('div','jc__cols jc__recent');
strip.body.appendChild(colRec);

/* Deze kolom stond leeg tot er tijdens je stream iets gebeurde -- precies
   het moment waarop het scherm het minst te vertellen heeft. StreamElements'
   sessie-API weet wel wie je laatste volger en sub zijn, dus die vullen de
   open plekken. Met hun eigen bijschrift, want dat is 'laatst' en niet 'deze
   sessie'. Komt er een echt event binnen, dan schuift dat erbovenop en valt
   de onderste opvulling weg.

   Twee rijen, geen drie: de strook is 241px hoog en drie ribbons van 44px
   lopen eruit. Twee houdt ook het ritme van de socialskolom ernaast aan. */
var ROWS = 2;
var FILL = [
  { key:'follower-latest',   kind:'follow', text:'latest follower' },
  { key:'subscriber-latest', kind:'sub',    text:'latest sub' },
  { key:'cheer-latest',      kind:'cheer',  text:'latest bits' },
  { key:'tip-latest',        kind:'tip',    text:'latest tip' }
];

/* ---- data ----------------------------------------------------------- */
function loadFollowers(){
  window.Stats.followers().then(function(n){
    if(n != null) ribFoll.setValue(U.num(n));
  }).catch(function(){});
}

function addMessage(m){
  var row = U.el('div','msg');
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
  if(m.color) nm.style.color = m.color;
  row.appendChild(nm);
  var bd = U.el('span','msg__body'); bd.innerHTML = m.html;
  row.appendChild(bd);
  box.appendChild(row);
  while(box.children.length > 14) box.removeChild(box.firstChild);
}

var camEv = window.CamEvent.mount(U.$('.jc__cam'), { hold:5000 });

var feed = [];
function paintRecent(){
  colRec.innerHTML = '';
  var rows = 0;
  feed.forEach(function(x){
    if(rows >= ROWS) return;
    colRec.appendChild(R.make(x.kind, x.word, x.who + (x.extra ? '  ·  ' + x.extra : '')));
    rows++;
  });
  FILL.forEach(function(f){
    if(rows >= ROWS) return;
    var v = window.Labels && window.Labels.get(f.key);
    if(!v) return;
    colRec.appendChild(R.make(f.kind, f.text, v));
    rows++;
  });
  if(!rows) colRec.appendChild(U.el('div','jc__empty','nothing yet this session'));
}

function pushEvent(e){
  camEv.push(e);
  feed.unshift(e);
  if(feed.length > ROWS) feed.pop();
  paintRecent();
}

/* De labels komen via de REST-aanroep binnen, meestal binnen een seconde na
   het laden. Opnieuw tekenen zodra er een bijkomt. */
if(window.Labels) window.Labels.on(paintRecent);
paintRecent();

U.poll(loadFollowers, 120);
window.Chat.start(addMessage, function(what){ window.Chat.prune(box, what); });
window.SE.start(pushEvent);

if(DEMO){
  [['follow','joesswow','follows',''],
   ['sub','vassham','sub','T2 · 14 mo'],
   ['cheer','TheNoremac','bits','184 bits']].forEach(function(p,i){
    setTimeout(function(){ pushEvent({kind:p[0],who:p[1],word:p[2],extra:p[3]}); }, 200 + i*300);
  });
  [['Amphroxia','wanneer gaan we raiden','#3fd9a4',[{key:'moderator',label:'mod'}]],
   ['Jhaetra','die +16 was clean',null,[{key:'subscriber',label:'sub'}]],
   ['Wvoker','o.O',null,[]],
   ['Hamtaro Wombat','find the fish','#d8b263',[{key:'vip',label:'vip'}]],
   ['Nocteirah','ilvl 318 al zeg',null,[]],
   ['Thirive','disc priest supremacy','#eef1f5',[]]
  ].forEach(function(l,i){
    setTimeout(function(){
      addMessage({name:l[0], html:U.esc(l[1]), color:l[2], badges:l[3], action:false,
                  /* Echte berichten dragen altijd een id en een login; de demo
                     doet dat na, zodat een moderatieactie hier ook werkt. */
                  id:'demo-' + i, login:l[0].toLowerCase().replace(/\s+/g,'')});
    }, 400 + i*350);
  });
}
})();

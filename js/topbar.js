/* Bovenbalk: live-status, label-rail, kijkers en volgers.
   Welke labels er staan komt uit config.topbar.labels. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var TB   = CFG.topbar || {};
var DEMO = /[?&]demo=1/.test(location.search);

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560, L = CFG.layout || {};
  stage.style.width  = dw + 'px';
  stage.style.height = (L.topHeight || 120) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';

  /* De bovenste strook van hetzelfde doek dat achter de scene-schermen
     hangt, dus de compositie loopt door achter je gameplay. */
  window.Backdrop.slice(stage, { top:0, height:(L.topHeight || 120) });
})();

var GOAL = (CFG.goals && CFG.goals.followers) || 0;
var SUB  = (CFG.goals && CFG.goals.subs) || {};

/* Trappen, oplopend. Een doel zonder trappen mag ook: target/reward/note
   wordt dan die ene trap, zodat een simpele config simpel blijft. */
var TIERS = (SUB.tiers && SUB.tiers.length
      ? SUB.tiers.slice()
      : (SUB.target ? [{ at:SUB.target, reward:SUB.reward, note:SUB.note }] : []))
    .filter(function(t){ return t && t.at > 0; })
    .sort(function(a, b){ return a.at - b.at; });

/* De hoogste trap bepaalt hoe lang de balk is. */
var SUBGOAL = TIERS.length ? TIERS[TIERS.length - 1].at : 0;
var MARKS   = TIERS.map(function(t){ return t.at; });

/* ---- labels --------------------------------------------------------
   Sleutel -> bijschrift en tint. De sleutels zijn die van StreamElements,
   en de bestandsherkenning in labels.js gebruikt dezelfde. */
/* Sleutels exact zoals StreamElements ze in de sessiedata zet. Namen als
   'tip-top' bestaan daar niet -- dat is 'tip-alltime-top-donator'. */
var LABELS = {
  'follower-latest'           : { text:'latest follower',      kind:'follow' },
  'follower-session'          : { text:'followers this stream', kind:'follow' },
  'follower-week'             : { text:'followers this week',   kind:'follow' },
  'follower-total'            : { text:'followers total',       kind:'follow' },
  'subscriber-latest'         : { text:'latest sub',            kind:'sub'    },
  'subscriber-new-latest'     : { text:'latest new sub',        kind:'sub'    },
  'subscriber-gifted-latest'  : { text:'latest gift sub',       kind:'sub'    },
  'subscriber-alltime-gifter' : { text:'top gifter',            kind:'sub'    },
  'subscriber-session'        : { text:'subs this stream',      kind:'sub'    },
  'cheer-latest'              : { text:'latest bits',           kind:'cheer'  },
  'cheer-session'             : { text:'bits this stream',      kind:'cheer'  },
  'cheer-alltime-top-donator' : { text:'top cheer',             kind:'cheer'  },
  'tip-latest'                : { text:'latest tip',            kind:'tip'    },
  'tip-session'               : { text:'tips this stream',      kind:'tip'    },
  'tip-alltime-top-donator'   : { text:'top tip',               kind:'tip'    },
  'raid-latest'               : { text:'latest raid',           kind:'raid'   }
};

var WANT = TB.labels || ['follower-latest','subscriber-latest','cheer-latest','tip-top'];
var pills = {};

/* Labels zonder waarde: tonen of verbergen. Tonen houdt de indeling vast en
   laat zien dat bits en tips kunnen; verbergen houdt de balk stiller. */
var SHOW_EMPTY = TB.showEmptyLabels !== false;

(function buildRail(){
  var rail = U.$('#rail');
  WANT.forEach(function(key){
    var def = LABELS[key] || { text:key.replace(/-/g,' '), kind:'follow' };
    var el  = window.Ribbon.make(def.kind, def.text, SHOW_EMPTY ? '\u2014' : '');
    if(SHOW_EMPTY) el.classList.add('rib--empty');
    else el.style.display = 'none';
    rail.appendChild(el);
    pills[key] = el;
  });
})();

window.Labels.on(function(key, val){
  var el = pills[key];
  if(!el) return;
  el.style.display = '';
  el.classList.remove('rib--empty');
  el.setValue(val);
});
/* SE levert de labels: loadSession haalt de huidige stand op, de socket
   houdt 'm bij. De events zelf gaan naar de onderbalk; ze schrijven
   onderweg al in de labelopslag, dus hier hoeft niets mee te gebeuren. */
var LSRC = (CFG.labels && CFG.labels.source) || 'streamelements';
if(LSRC === 'streamelements' || LSRC === 'both') window.SE.start(onEvent);

/* ---- status, kijkers en volgers -------------------------------------
   Dezelfde ribbons als de labelrail: kopblok met icoon, bijschrift op de
   rand. Zonder waarde staan ze gedempt, net als een leeg label. */
var ribLive = window.Ribbon.make('live',   'status',  'offline');
var ribView = window.Ribbon.make('viewers','viewers',   '\u2014');
var ribFoll = window.Ribbon.make('follow', 'followers', '\u2014');
[ribLive, ribView, ribFoll].forEach(function(r){ r.classList.add('rib--num'); });
ribLive.classList.add('rib--empty');

/* ---- doelbalkje ------------------------------------------------------
   Eén bouwer voor allebei de doelen. Tot en met twaalf wordt het een rij
   vakjes: "drie van vijf" lees je dan af zonder te rekenen, waar een balk
   op 60% je dat wel laat doen. Daarboven zouden dat haarlijntjes worden,
   dus dan een gewone balk met het doelgetal ernaast. */
var PIP_MAX = 12;

function goalBar(target, marks){
  var node = U.el('span','goal'), boxes = [];
  var pips = target > 0 && target <= PIP_MAX;

  if(pips){
    node.classList.add('goal--pips');
    var track = U.el('span','goal__track');
    for(var i = 0; i < target; i++){
      boxes.push(track.appendChild(U.el('span','goal__pip')));
      /* Streepje waar een trap eindigt die niet het eind van de balk is:
         daar ligt een belofte die eerder ingaat. */
      if(marks && marks.indexOf(i + 1) > -1 && i + 1 < target)
        track.appendChild(U.el('span','goal__tick'));
    }
    node.appendChild(track);
  } else {
    node.innerHTML = '<span class="goal__track"><span class="goal__fill"></span></span>' +
                     '<span class="goal__t"></span>';
    node.querySelector('.goal__t').textContent = target ? U.num(target) : '';
  }

  var fill = node.querySelector('.goal__fill');
  node.set = function(n){
    if(!target || n == null) return;
    if(!pips){ fill.style.width = Math.min(100, n / target * 100).toFixed(1) + '%'; return; }
    /* Gehaalde trappen kleuren goud: die beloning is binnen. De vakjes
       daarboven horen bij de lopende trap en blijven wit. */
    var won = 0;
    (marks || []).forEach(function(m){ if(n >= m) won = m; });
    boxes.forEach(function(b, i){
      b.classList.toggle('on',  i < n);
      b.classList.toggle('won', i < won);
    });
  };
  return node;
}

/* Volgersdoel als staafje achter het getal, binnen dezelfde balk. */
var goal = goalBar(GOAL);
ribFoll.querySelector('.rib__in').appendChild(goal);
var elFoll = ribFoll.querySelector('.rib__val');

U.$('#status').appendChild(ribLive);
U.$('#stats').appendChild(ribView);
U.$('#stats').appendChild(ribFoll);

/* ---- subdoel ---------------------------------------------------------
   Teller, vakjes en de belofte als bijschrift op de rand: "priest wig at
   5". Het is de enige ribbon in de balk die niet alleen een stand toont
   maar ook een afspraak, dus de tekst ervan komt uit de config -- de
   overlay verzint geen beloftes namens jou. */
var ribSub = null, subBar = null, subShown = null, subDone = false;

/* De eerstvolgende trap die nog niet gehaald is. Dat is de enige die een
   kijker nog iets kan schelen; zijn ze allemaal binnen, dan de laatste,
   want dan is die het nieuws. */
function tierAt(n){
  for(var i = 0; i < TIERS.length; i++) if(n < TIERS[i].at) return { t:TIERS[i], done:false };
  return { t:TIERS[TIERS.length - 1], done:true };
}

function subCap(n){
  var s = tierAt(n), t = s.t;
  if(!t || !t.reward) return 'subs';
  /* De toevoeging hoort bij de belofte en blijft dus ook staan als de trap
     gehaald is: juist dan wil een kijker weten hoe lang de wig blijft. */
  return (s.done ? t.reward + ' unlocked' : t.reward + ' at ' + t.at)
       + (t.note ? ' \u00b7 ' + t.note : '');
}

var SUBSRC = (SUB.source || 'streamelements').toLowerCase();

if(SUBGOAL){
  ribSub = window.Ribbon.make('sub', subCap(0), '\u2014');
  ribSub.classList.add('rib--num', 'rib--empty');
  subBar = goalBar(SUBGOAL, MARKS);
  ribSub.querySelector('.rib__in').appendChild(subBar);
  U.$('#stats').appendChild(ribSub);

  /* SE houdt per doel een teller bij (subscriber-goal). Die staat op hun
     server, dus hij overleeft een herstart van OBS en loopt door over
     meerdere streams -- anders dan een optelling in de pagina, die bij elke
     refresh op nul zou staan. Wat hij telt zijn sub-events sinds jij hem
     voor het laatst op nul zette, en dat is je aantal actieve subs zolang
     je vanaf nul begon. */
  /* In demo staat de stand al klaar; de poll voor de andere bronnen draait
     daar toch niet, dus deze abonnee hoort er ook buiten te blijven. Anders
     overschrijft je echte sessie het cijfer waar je de balk mee uitlijnt. */
  if(!DEMO && SUBSRC === 'streamelements' && window.SE && window.SE.onSession){
    window.SE.onSession(function(d){
      var g = d && d['subscriber-goal'];
      if(g && typeof g.amount === 'number') setSubBase(g.amount);
    });
  }
}

function setSubs(n){
  if(!ribSub || n == null) return;
  n = Math.max(0, Math.round(n));
  if(n === subShown) return;
  subShown = n;
  ribSub.classList.remove('rib--empty');
  ribSub.setValue(n + ' / ' + SUBGOAL);
  subBar.set(n);

  /* Doel gehaald: het bijschrift wordt de mededeling zelf. Bewust zonder
     doorlopende animatie -- dit vlak staat de hele stream in beeld, en iets
     dat blijft pulseren kost elke frame bitrate die de gameplay nodig heeft.
     De ribbon flitst al één keer, via setValue hierboven. */
  /* Het bijschrift verspringt bij elke trap, niet alleen aan het eind. */
  var cap = ribSub.querySelector('.rib__cap');
  if(cap) cap.textContent = subCap(n);

  var done = n >= SUBGOAL;
  if(done === subDone) return;
  subDone = done;
  ribSub.classList.toggle('rib--done', done);
}

/* De stand uit de bron, plus wat er sinds de laatste poll live binnenkwam.
   Die twee staan los omdat ze op verschillende momenten binnenkomen: de
   sub is er meteen, DecAPI weet het pas een poll later. */
var subBase = null, subBump = 0, authWarned = false;

function pushSubs(){ setSubs(subBase == null ? null : subBase + subBump); }

function setSubBase(n){
  /* Een poll die de nieuwe sub al meetelt maakt de optelling overbodig. Een
     poll die nog achterloopt -- DecAPI cachet, en Twitch zelf loopt ook
     achter -- mag het balkje niet terugzetten; vandaar de vergelijking in
     plaats van een harde reset. */
  if(subBase != null && n >= subBase + subBump) subBump = 0;
  subBase = n;
  pushSubs();
}

/* De events gaan naar de onderbalk; hier is alleen een sub interessant, en
   alleen als het er een is die er nog niet was. norm() in js/streamelements.js
   zet 'new' of 'gift' in extra bij zo'n sub en "3 mo" bij een resub -- die was
   al actief en hoort dus niet mee te tellen in een doel van actieve subs. */
function onEvent(e){
  if(!ribSub || SUB.liveBump === false || !e) return;
  if(e.kind !== 'sub' || !/\b(new|gift)\b/.test(e.extra || '')) return;
  subBump++;
  pushSubs();
}

var AUTH_URL = 'https://decapi.me/auth/twitch?redirect=subcount' +
               '&scopes=channel:read:subscriptions+user:read:email';

function refreshSubs(){
  if(!ribSub) return;
  /* StreamElements duwt zelf; die heeft deze poll niet nodig. */
  if(SUBSRC === 'streamelements') return;
  /* Handmatig: het getal staat in de config en de live subs komen erbij.
     Er is dan niets om tegen te ijken, dus de optelling blijft de stream
     lang staan -- en is weg zodra de browser source herlaadt. */
  if(SUBSRC !== 'decapi'){
    if(subBase == null) setSubBase(+SUB.count || 0);
    return;
  }
  window.Stats.subs().then(function(n){
    if(n === 'auth'){
      if(!authWarned){
        authWarned = true;
        console.warn('[subs] DecAPI mag je subcount niet lezen. Log eenmalig in ' +
          'op ' + AUTH_URL + ' -- tot dan telt de balk door vanaf goals.subs.count.');
        U.setHealth('subcount', true, 'decapi niet geautoriseerd');
      }
      if(subBase == null) setSubBase(+SUB.count || 0);
      return;
    }
    if(n == null) return;          // offline is geen nul subs
    U.setHealth('subcount', true, '');
    setSubBase(n);
  }).catch(function(){});
}

/* De uptime kwam elke 60 seconden van DecAPI, en stond er dus een minuut
   stil om daarna een minuut vooruit te springen. Dat leest als een klok die
   stuk is. Nu telt hij zelf per seconde door vanaf het laatste antwoord, en
   synchroniseert hij bij elke poll opnieuw: DecAPI blijft de bron, dit is
   alleen de tussenstand. Het veranderende vlak is een paar cijfers mono, dus
   het kost de encoder niets noemenswaardigs. */
var upSec = null, upAt = 0;

function pad(n){ return n < 10 ? '0' + n : '' + n; }
function clock(sec){
  var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.floor(sec % 60);
  return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}

function setLive(on, sec){
  ribLive.classList.toggle('rib--empty', !on);
  if(!on){ upSec = null; ribLive.setValue('offline', true); return; }
  upSec = sec;
  upAt  = Date.now();
  ribLive.setValue(sec == null ? 'live' : clock(sec), true);
}

setInterval(function(){
  if(upSec == null) return;
  ribLive.setValue(clock(upSec + (Date.now() - upAt) / 1000), true);
}, 1000);

function setFollowers(n){
  if(n == null) return;
  U.countTo(elFoll, n);
  goal.set(n);
}

function refresh(){
  window.Stats.followers().then(setFollowers).catch(function(){});
  refreshSubs();
  window.Stats.viewers().then(function(v){
    ribView.setValue(v == null ? '—' : U.num(v), true);
  }).catch(function(){});
  /* t is nu een getal, dus op !!t testen zou je op de eerste seconde van je
     stream offline zetten. */
  window.Stats.uptime().then(function(t){ setLive(t != null, t); })
    .catch(function(){ setLive(false); });
  if(TB.showTitle !== false){
    window.Stats.title().then(function(t){
      if(t) U.$('#title').textContent = t;
    }).catch(function(){});
  }
}

if(DEMO){
  setLive(true, 2*3600 + 14*60 + 7);   // seconden nu, geen opgemaakte tekst
  setFollowers(154);
  ribView.setValue('31', true);
  window.Labels.set('follower-latest',   'joesswow');
  window.Labels.set('subscriber-latest', 'vassham');
  window.Labels.set('cheer-latest',      'TheNoremac · 184');
  window.Labels.set('tip-top',           'xxmaebeexx · EUR 42,00');
  window.Labels.set('tip-latest',        'maxartyom · EUR 5,00');
  window.Labels.set('follower-session',  '3');
  setSubBase(3);
} else {
  U.poll(refresh, 60);
}
})();

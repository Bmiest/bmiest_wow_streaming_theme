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
if(LSRC === 'streamelements' || LSRC === 'both') window.SE.start(function(){});

/* ---- status, kijkers en volgers -------------------------------------
   Dezelfde ribbons als de labelrail: kopblok met icoon, bijschrift op de
   rand. Zonder waarde staan ze gedempt, net als een leeg label. */
var ribLive = window.Ribbon.make('live',   'status',  'offline');
var ribView = window.Ribbon.make('viewers','viewers',   '\u2014');
var ribFoll = window.Ribbon.make('follow', 'followers', '\u2014');
[ribLive, ribView, ribFoll].forEach(function(r){ r.classList.add('rib--num'); });
ribLive.classList.add('rib--empty');

/* Volgersdoel als staafje achter het getal, binnen dezelfde balk. */
var goal = U.el('span','goal');
goal.innerHTML = '<span class="goal__track"><span class="goal__fill"></span></span>' +
                 '<span class="goal__t"></span>';
ribFoll.querySelector('.rib__in').appendChild(goal);
goal.querySelector('.goal__t').textContent = GOAL ? U.num(GOAL) : '';
var elFill = goal.querySelector('.goal__fill');
var elFoll = ribFoll.querySelector('.rib__val');

U.$('#status').appendChild(ribLive);
U.$('#stats').appendChild(ribView);
U.$('#stats').appendChild(ribFoll);

function setLive(on, up){
  ribLive.classList.toggle('rib--empty', !on);
  ribLive.setValue(on ? (up || 'live') : 'offline', true);
}

function setFollowers(n){
  if(n == null) return;
  U.countTo(elFoll, n);
  if(GOAL) elFill.style.width = Math.min(100, n / GOAL * 100).toFixed(1) + '%';
}

function refresh(){
  window.Stats.followers().then(setFollowers).catch(function(){});
  window.Stats.viewers().then(function(v){
    ribView.setValue(v == null ? '—' : U.num(v), true);
  }).catch(function(){});
  window.Stats.uptime().then(function(t){ setLive(!!t, t); }).catch(function(){ setLive(false); });
  if(TB.showTitle !== false){
    window.Stats.title().then(function(t){
      if(t) U.$('#title').textContent = t;
    }).catch(function(){});
  }
}

if(DEMO){
  setLive(true, '2:14:07');
  setFollowers(154);
  ribView.setValue('31', true);
  window.Labels.set('follower-latest',   'joesswow');
  window.Labels.set('subscriber-latest', 'vassham');
  window.Labels.set('cheer-latest',      'TheNoremac · 184');
  window.Labels.set('tip-top',           'xxmaebeexx · EUR 42,00');
  window.Labels.set('tip-latest',        'maxartyom · EUR 5,00');
  window.Labels.set('follower-session',  '3');
} else {
  U.poll(refresh, 60);
}
})();

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
})();

var CH   = ((CFG.twitch && CFG.twitch.channel) || '').toLowerCase();
var GOAL = (CFG.goals && CFG.goals.followers) || 0;
U.$('#goalTarget').textContent = GOAL ? U.num(GOAL) : '';

/* ---- labels --------------------------------------------------------
   Sleutel -> bijschrift en tint. De sleutels zijn die van StreamElements,
   en de bestandsherkenning in labels.js gebruikt dezelfde. */
var LABELS = {
  'follower-latest'    : { text:'laatste volger',      kind:'follow' },
  'follower-session'   : { text:'volgers deze stream', kind:'follow' },
  'subscriber-latest'  : { text:'laatste sub',         kind:'sub'    },
  'subscriber-session' : { text:'subs deze stream',    kind:'sub'    },
  'cheer-latest'       : { text:'laatste bits',        kind:'cheer'  },
  'cheer-top'          : { text:'topcheer',            kind:'cheer'  },
  'tip-latest'         : { text:'laatste tip',         kind:'tip'    },
  'tip-top'            : { text:'topdonatie',          kind:'tip'    },
  'tip-session-top'    : { text:'topdonatie sessie',   kind:'tip'    },
  'raid-latest'        : { text:'laatste raid',        kind:'raid'   }
};

var WANT = TB.labels || ['follower-latest','subscriber-latest','cheer-latest','tip-top'];
var pills = {};

(function buildRail(){
  var rail = U.$('#rail');
  WANT.forEach(function(key){
    var def = LABELS[key] || { text:key.replace(/-/g,' '), kind:'follow' };
    var el  = window.Ribbon.make(def.kind, def.text, '');
    el.style.display = 'none';         // pas tonen als er een waarde is
    rail.appendChild(el);
    pills[key] = el;
  });
})();

window.Labels.on(function(key, val){
  var el = pills[key];
  if(!el) return;
  el.style.display = '';
  el.setValue(val);
});
window.Labels.start();

/* SE levert de labels: loadSession haalt de huidige stand op, de socket
   houdt 'm bij. De events zelf gaan naar de onderbalk; ze schrijven
   onderweg al in de labelopslag, dus hier hoeft niets mee te gebeuren. */
var LSRC = (CFG.labels && CFG.labels.source) || 'streamelements';
if(LSRC === 'streamelements' || LSRC === 'both') window.SE.start(function(){});

/* ---- status --------------------------------------------------------- */
function setLive(on, up){
  var p = U.$('#livePill');
  p.className = 'pill ' + (on ? 'pill--live' : 'pill--off');
  U.$('#liveState').textContent = on ? 'live' : 'offline';
  U.$('#uptime').textContent    = on ? (up || '') : '';
}

function setFollowers(n){
  if(n == null) return;
  U.countTo(U.$('#followCount'), n);
  if(GOAL) U.$('#goalFill').style.width = Math.min(100, n / GOAL * 100).toFixed(1) + '%';
}

function refresh(){
  window.Stats.followers().then(setFollowers).catch(function(){});
  window.Stats.viewers().then(function(v){
    U.$('#viewers').textContent = v == null ? '—' : U.num(v);
  }).catch(function(){});
  window.Stats.uptime().then(function(t){ setLive(!!t, t); }).catch(function(){ setLive(false); });
  if(TB.showTitle){
    U.getText('https://decapi.me/twitch/title/' + CH).then(function(t){
      if(t && !/offline|error|unable|not found/i.test(t)){
        var el = U.$('#title'); el.style.display = ''; el.textContent = t.trim();
      }
    }).catch(function(){});
  }
}

if(DEMO){
  setLive(true, '2:14:07');
  setFollowers(154);
  U.$('#viewers').textContent = '31';
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

/* Kale kanaalcijfers via DecAPI: publiek, geen auth, CORS open.
   Bewust naast StreamElements: SE levert de live events, DecAPI de
   totalen. Zo hangt je followercount niet aan je SE-sessie. */
(function(){
'use strict';
var U = window.U;
var CH = (U.CFG.twitch && U.CFG.twitch.channel || '').toLowerCase();
var BASE = 'https://decapi.me/twitch/';

function digits(s){
  var m = String(s||'').replace(/[^\d]/g,'');
  return m ? parseInt(m,10) : null;
}
function offline(s){ return /offline|not live|error|unable/i.test(String(s||'')); }

function followers(){
  return U.getText(BASE+'followcount/'+CH).then(function(t){
    return offline(t) ? null : digits(t);
  });
}
function viewers(){
  return U.getText(BASE+'viewercount/'+CH).then(function(t){
    return offline(t) ? null : digits(t);
  });
}
// DecAPI geeft "2 hours, 14 minutes, 7 seconds" -> "2:14:07"
function uptime(){
  return U.getText(BASE+'uptime/'+CH).then(function(t){
    if(offline(t)) return null;
    var h = /(\d+)\s*hour/.exec(t), m = /(\d+)\s*minute/.exec(t), s = /(\d+)\s*second/.exec(t);
    var H = h?+h[1]:0, M = m?+m[1]:0, S = s?+s[1]:0;
    var pad = function(n){ return n<10 ? '0'+n : ''+n; };
    return H ? H+':'+pad(M)+':'+pad(S) : M+':'+pad(S);
  });
}

/* De streamtitel. DecAPI antwoordt op een offline kanaal met proza in
   plaats van een status, dus dezelfde check als hierboven -- die stond
   eerder los in de bovenbalk. */
function title(){
  return U.getText(BASE+'title/'+CH).then(function(t){
    t = String(t||'').trim();
    return (!t || offline(t) || /not found/i.test(t)) ? null : t;
  });
}

window.Stats = { followers:followers, viewers:viewers, uptime:uptime, title:title };
})();

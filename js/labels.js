/* Kleine sleutel/waarde-opslag voor "labels": losse feitjes over je kanaal
   die live bijwerken -- laatste volger, laatste sub, hoogste donatie,
   aantallen deze sessie.

   Bron 1: Streamlabs' Stream Labels. Die app schrijft platte .txt-bestanden
           naar een map. Wijs hem naar ./labels in dit project, dan serveert
           serve.sh ze mee en leest de overlay ze op. Geen token nodig.
   Bron 2: StreamElements, via de socket (js/streamelements.js).

   Wie er ook schrijft, de balken lezen alleen hieruit.

   De bestandsnamen worden niet gegokt: we lezen de maplijst uit die
   python's http.server teruggeeft en herkennen de bestanden op patroon.
   Zo blijft het werken als Streamlabs andere namen gebruikt. */
(function(){
'use strict';
var U   = window.U;
var CFG = U.CFG.labels || {};

var store = {}, subs = [];

function set(key, val){
  if(val == null) return;
  val = String(val).trim();
  if(!val || val === '0' || store[key] === val) return;
  store[key] = val;
  subs.forEach(function(fn){ try{ fn(key, val); }catch(e){ console.warn('[labels]', e.message); } });
}
function get(key, dflt){ return store[key] != null ? store[key] : (dflt || null); }
function on(fn){
  subs.push(fn);
  Object.keys(store).forEach(function(k){ fn(k, store[k]); });
}

/* ---- bestandsnaam -> sleutel ----------------------------------------
   Elk patroon eist een aantal woorden in de naam. 'session' telt als een
   minpunt bij de all-time labels, zodat most_recent_follower.txt wint van
   session_most_recent_follower.txt. */
var RULES = [
  { key:'follower-latest',    need:['follower','recent'],      avoid:['session'] },
  { key:'follower-session',   need:['follower','session','recent'] },
  { key:'follower-total',     need:['follower','count'],       avoid:['session'] },
  { key:'subscriber-latest',  need:['sub','recent'],           avoid:['session'] },
  { key:'subscriber-session', need:['sub','count','session'] },
  { key:'tip-latest',         need:['don','recent'],           avoid:['session'] },
  { key:'tip-alltime-top-donator', need:['don','top'],         avoid:['session','month','week'] },
  { key:'cheer-latest',       need:['cheer','recent'],         avoid:['session'] },
  { key:'cheer-alltime-top-donator', need:['cheer','top'],     avoid:['session'] }
];

function classify(name){
  var n = name.toLowerCase();
  var hits = [];
  RULES.forEach(function(r){
    if(!r.need.every(function(w){ return n.indexOf(w) >= 0; })) return;
    if(r.avoid && r.avoid.some(function(w){ return n.indexOf(w) >= 0; })) return;
    hits.push(r.key);
  });
  return hits[0] || null;
}

var fileMap = null;   // { sleutel: bestandsnaam }

function readDir(){
  var dir = (CFG.dir || 'labels').replace(/\/+$/, '') + '/';
  return U.getText(dir, 5000).then(function(html){
    var files = [], m, re = /href="([^"]+\.txt)"/gi;
    while((m = re.exec(html))) files.push(decodeURIComponent(m[1].split('/').pop()));
    var map = {};
    files.forEach(function(f){
      var k = classify(f);
      if(k && !map[k]) map[k] = f;
    });
    fileMap = map;
    if(!files.length) console.info('[labels] map ' + dir + ' is leeg');
    return map;
  });
}

function pollFiles(){
  var dir = (CFG.dir || 'labels').replace(/\/+$/, '') + '/';
  var go = fileMap ? Promise.resolve(fileMap) : readDir();
  return go.then(function(map){
    Object.keys(map).forEach(function(key){
      U.getText(dir + map[key], 4000).then(function(t){ set(key, t); }).catch(function(){});
    });
  }).catch(function(e){
    console.info('[labels] geen labelmap gevonden (' + e.message + ')');
  });
}

function start(){
  var src = CFG.source || 'streamelements';   // zelfde standaard als js/topbar.js
  if(src === 'files' || src === 'both'){
    // maplijst af en toe opnieuw lezen, voor als Stream Labels later start
    setInterval(function(){ fileMap = null; }, 300000);
    U.poll(pollFiles, CFG.pollSeconds || 15);
  }
}

window.Labels = { set:set, get:get, on:on, start:start, classify:classify };
})();

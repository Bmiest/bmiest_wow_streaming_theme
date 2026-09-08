/* Kleine sleutel/waarde-opslag voor "labels": losse feitjes over je kanaal
   die live bijwerken -- laatste volger, laatste sub, hoogste donatie,
   aantallen deze sessie.

   StreamElements schrijft erin (js/streamelements.js: de sessiedata bij het
   verbinden, daarna de socket), de balken lezen eruit. De sleutelnamen zijn
   die van SE zelf, bijvoorbeeld follower-latest of tip-alltime-top-donator. */
(function(){
'use strict';

var store = {}, subs = [];

function set(key, val){
  if(val == null) return;
  val = String(val).trim();
  // SE geeft "nog niets gebeurd" terug als 0, niet als leeg
  if(!val || val === '0' || store[key] === val) return;
  store[key] = val;
  subs.forEach(function(fn){
    try { fn(key, val); } catch(e){ console.warn('[labels]', e.message); }
  });
}

function get(key, dflt){ return store[key] != null ? store[key] : (dflt || null); }

function on(fn){
  subs.push(fn);
  Object.keys(store).forEach(function(k){ fn(k, store[k]); });
}

window.Labels = { set:set, get:get, on:on };
})();

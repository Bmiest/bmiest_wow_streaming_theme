/* StreamElements realtime socket -> live follows, subs, cheers, tips,
   raids. Vereist je JWT uit config.js. Zonder token doet dit niks en
   draait de rest van de overlay gewoon door.

   SE gebruikt nog het socket.io 2.x protocol; daarom die pinned versie
   in de HTML. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG.streamelements || {};
var sink = function(){};

// SE is niet consequent: 'follow' en 'follower' komen allebei voor,
// afhankelijk van of het een echt event of een testknop is.
var TYPES = {
  follow:'follow', follower:'follow',
  subscriber:'sub', sub:'sub',
  cheer:'cheer', tip:'tip', donation:'tip',
  raid:'raid', host:'raid'
};
var WORD = {
  follow:'follows', sub:'sub', cheer:'bits', tip:'tip', raid:'raid'
};

function norm(type, d){
  d = d || {};
  var kind = TYPES[String(type||'').toLowerCase()];
  if(!kind) return null;

  var who = d.displayName || d.username || d.name || d.from || 'iemand';
  var extra = '';
  if(kind==='sub'){
    var months = d.amount || d.streak || 0;
    var tier = d.tier != null ? String(d.tier) : '';
    extra = (tier && tier !== '1000' && tier !== 'prime' ? 'T'+tier.charAt(0)+' ' : '')
          + (months > 1 ? months+' mo' : 'new');
    if(d.gifted || d.bulkGifted) extra = 'gift';
  } else if(kind==='cheer'){
    extra = U.num(d.amount)+' bits';
  } else if(kind==='tip'){
    extra = (d.currency||'') + ' ' + (d.amount||'');
  } else if(kind==='raid'){
    extra = U.num(d.amount||0)+' viewers';
  }

  return { kind:kind, who:who, word:WORD[kind], extra:extra.trim(),
           message:d.message || '', ts:Date.now() };
}

var LKEY = {follow:'follower-latest', sub:'subscriber-latest',
            cheer:'cheer-latest', tip:'tip-latest', raid:'raid-latest'};

function emit(type,data){
  var e = norm(type,data);
  if(!e) return;
  // ook wegschrijven als label, zodat de bovenbalk 'latest follower' toont
  if(window.Labels && LKEY[e.kind]) window.Labels.set(LKEY[e.kind], e.who);
  sink(e);
}

/* ---- sessiedata via de REST-API -------------------------------------
   De socket stuurt alleen wat er tijdens je stream gebeurt. Deze aanroep
   haalt de huidige stand op, zodat 'latest follower' meteen gevuld is in
   plaats van pas bij de volgende follow.

   CORS staat open (allow-origin *, authorization toegestaan in de
   preflight), dus dit mag rechtstreeks vanuit de browser source. */
var API = 'https://api.streamelements.com/kappa/v2';

function auth(){ return { headers: { Authorization: 'Bearer ' + CFG.jwt } }; }

/* SE geeft "nog niets gebeurd" terug als het getal 0, niet als null of een
   lege string. Zonder deze check toont de balk letterlijk "0" bij een label
   waar nog nooit iets voor binnenkwam. */
function display(v){
  if(v == null || Array.isArray(v)) return null;
  if(typeof v !== 'object') return (v === 0 || v === '') ? null : v;
  var n = v.name || v.username || v.displayName;
  if(n) return n;
  if(v.amount) return v.amount;   // 0 telt als leeg
  if(v.count)  return v.count;
  return null;
}

function loadSession(){
  if(!CFG.jwt || !window.Labels) return Promise.resolve();
  return fetch(API + '/channels/me', auth())
    .then(function(r){ if(!r.ok) throw new Error('channels/me ' + r.status); return r.json(); })
    .then(function(me){
      var id = me._id || me.id;
      if(!id) throw new Error('geen channel id');
      return fetch(API + '/sessions/' + id, auth());
    })
    .then(function(r){ if(!r.ok) throw new Error('sessions ' + r.status); return r.json(); })
    .then(function(res){
      // SE's sleutels heten al follower-latest, tip-top enzovoort
      var data = res.data || res;
      Object.keys(data).forEach(function(k){
        var v = display(data[k]);
        if(v != null) window.Labels.set(k, v);
      });
      U.setHealth('se-session', true);
    })
    .catch(function(e){
      console.warn('[SE] sessiedata:', e.message);
      U.setHealth('se-session', false);
    });
}

function start(cb){
  sink = cb || sink;

  if(!CFG.jwt){
    console.info('[SE] geen JWT ingevuld -- live events staan uit');
    U.setHealth('streamelements', false);
    return;
  }
  /* De labels komen via REST en hebben socket.io niet nodig. Die aanroep
     staat daarom vóór de check: valt de socket weg, dan blijft de bovenbalk
     het gewoon doen. */
  U.poll(loadSession, 90);

  if(typeof io === 'undefined'){
    console.warn('[SE] socket.io niet geladen -- live events staan uit, labels werken wel');
    U.setHealth('streamelements', false);
    return;
  }

  var socket = io('https://realtime.streamelements.com', { transports:['websocket'] });

  socket.on('connect', function(){
    socket.emit('authenticate', { method:'jwt', token:CFG.jwt });
  });
  socket.on('authenticated', function(){ U.setHealth('streamelements', true); });
  socket.on('unauthorized', function(e){
    console.error('[SE] JWT geweigerd', e);
    U.setHealth('streamelements', false);
  });
  socket.on('disconnect', function(){ U.setHealth('streamelements', false); });

  // echte events
  socket.on('event', function(e){
    if(!e) return;
    if(e.type) emit(e.type, e.data);
  });

  /* Sessiedata: SE stuurt hier onder meer follower-latest en
     subscriber-latest, ook meteen na verbinden. Precieze vorm verschilt
     per eventtype, dus defensief uitpakken. */
  socket.on('event:update', function(e){
    if(!e || !e.name || !window.Labels) return;
    var v = display(e.data || {});
    if(v != null) window.Labels.set(e.name, v);
  });

  // testknoppen in de SE-editor
  socket.on('event:test', function(e){
    if(!e) return;
    var t = e.listener ? String(e.listener).replace('-latest','') : e.type;
    emit(t, e.event || e.data);
  });
}

window.SE = { start:start, norm:norm, loadSession:loadSession };
})();

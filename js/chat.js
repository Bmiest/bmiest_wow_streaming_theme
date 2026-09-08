/* Twitch chat via anonieme IRC-websocket. Geen token, geen app, geen
   rate limit om je zorgen over te maken -- justinfan-login mag gewoon
   meelezen. Herverbindt met oplopende backoff. */
(function(){
'use strict';
var U = window.U;
var CFG  = U.CFG.chat || {};
var CHAN = (U.CFG.twitch && U.CFG.twitch.channel || '').toLowerCase();

var IGNORE = (CFG.ignore||[]).map(function(s){ return s.toLowerCase(); });
var EMOTE_CDN = 'https://static-cdn.jtvnw.net/emoticons/v2/';

var ws, backoff = 1000, onMsg = function(){};

function parseTags(raw){
  var t={};
  raw.split(';').forEach(function(p){
    var i=p.indexOf('='); if(i<0) return;
    // In één pass: drie losse replaces zijn volgordeafhankelijk en verminken
    // een ontsnapte backslash (\\s hoort \s te worden, niet backslash+spatie).
    t[p.slice(0,i)] = p.slice(i+1).replace(/\\([snr:\\])/g, function(_, c){
      return c === 's' ? ' ' : c === 'n' ? '\n' : c === 'r' ? '\r' : c === ':' ? ';' : '\\';
    });
  });
  return t;
}

/* Twitch geeft emote-posities als codepoint-indexen, niet byte- of
   JS-string-indexen. Splitsen op Array.from is daarom de enige manier
   die ook klopt bij emoji in het bericht. */
function renderBody(text, emotesTag){
  var chars = Array.from(text);
  var marks = [];
  if(emotesTag){
    emotesTag.split('/').forEach(function(grp){
      var bits = grp.split(':'); if(bits.length<2) return;
      bits[1].split(',').forEach(function(range){
        var se = range.split('-');
        marks.push({ id:bits[0], a:+se[0], b:+se[1] });
      });
    });
    marks.sort(function(x,y){ return x.a-y.a; });
  }
  var out='', cur=0;
  marks.forEach(function(m){
    if(m.a<cur) return;
    out += U.esc(chars.slice(cur,m.a).join(''));
    // id gecodeerd: de enige plek in deze weergave die niet door esc() liep
    out += '<img class="emote" src="'+EMOTE_CDN+encodeURIComponent(m.id)+'/default/dark/2.0" alt="'+
           U.esc(chars.slice(m.a,m.b+1).join(''))+'">';
    cur = m.b+1;
  });
  out += U.esc(chars.slice(cur).join(''));
  return out;
}

function badgesOf(tag){
  if(!tag) return [];
  var want = {broadcaster:1, moderator:1, vip:1, subscriber:1, founder:1};
  return tag.split(',').map(function(b){ return b.split('/')[0]; })
            .filter(function(b){ return want[b]; })
            .map(function(b){ return b==='founder' ? 'subscriber' : b; });
}

var LABEL = {broadcaster:'host', moderator:'mod', vip:'vip', subscriber:'sub'};

function handle(line){
  if(line.indexOf('PING')===0){ ws.send('PONG :tmi.twitch.tv'); return; }

  var m = line.match(/^@([^ ]+) :([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/);
  if(!m) return;

  var tags = parseTags(m[1]);
  var user = m[2];
  var text = m[3];

  if(IGNORE.indexOf(user.toLowerCase())>=0) return;
  if(CFG.hideCommands && /^\s*!/.test(text)) return;

  var action = false;
  var act = text.match(/^\x01ACTION (.*)\x01$/);
  if(act){ action = true; text = act[1]; }

  onMsg({
    id     : tags.id || String(Math.random()),
    name   : tags['display-name'] || user,
    color  : tags.color || null,
    badges : badgesOf(tags.badges).map(function(b){ return {key:b, label:LABEL[b]}; }),
    html   : renderBody(text, tags.emotes),
    action : action
  });
}

function connect(){
  if(!CHAN){ console.warn('[chat] geen kanaal in config'); return; }
  ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

  ws.onopen = function(){
    backoff = 1000;
    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    ws.send('NICK justinfan'+Math.floor(Math.random()*99999));
    ws.send('JOIN #'+CHAN);
    U.setHealth('chat', true);
  };
  ws.onmessage = function(ev){
    ev.data.split('\r\n').forEach(function(l){ if(l) handle(l); });
  };
  ws.onclose = function(){
    U.setHealth('chat', false);
    setTimeout(connect, backoff);
    backoff = Math.min(backoff*2, 30000);
  };
  ws.onerror = function(){ try{ ws.close(); }catch(e){} };
}

window.Chat = {
  start: function(cb){ onMsg = cb; connect(); }
};
})();

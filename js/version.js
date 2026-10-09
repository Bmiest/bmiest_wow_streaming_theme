/* De versie in de voet van de voorpagina en de lijst op changelog.html.

   Versies zijn GitHub-releases (v1.9.0, v1.10.0, ...), met de hand gemaakt
   na een merge -- zie "Releases" in de README. Er is geen buildstap op
   GitHub Pages, dus de versie komt niet uit een bestand in de repo maar
   rechtstreeks van GitHub's API: wat er als laatste release staat, is wat
   hier staat. GitHub stuurt CORS mee en geeft zonder token 60 vragen per uur
   per IP; daarom een kwartier in sessionStorage. Lukt het niet, dan blijft
   het versielabel weg en ziet niemand een fout.

   Release-notities zijn markdown. Ze komen uit onze eigen repo, maar worden
   toch eerst ge-escaped en daarna pas opgemaakt, met alleen wat de notities
   gebruiken: koppen, lijstjes, vet, schuin, code en links (http(s) of
   relatief naar de repo; al het andere blijft tekst). */
(function(){
'use strict';
var REPO = 'Bmiest/bmiest_wow_streaming_theme';
var API  = 'https://api.github.com/repos/' + REPO + '/releases';
var TTL  = 15 * 60 * 1000;

function cached(key){
  try {
    var v = JSON.parse(sessionStorage.getItem(key) || 'null');
    return v && Date.now() - v.at < TTL ? v.data : null;
  } catch(e){ return null; }
}
function keep(key, data){
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data })); } catch(e){}
}

function releases(){
  var c = cached('releases');
  if(c) return Promise.resolve(c);
  return fetch(API + '?per_page=30', { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(list){
      var out = (list || []).filter(function(x){ return !x.draft; }).map(function(x){
        return { tag: x.tag_name, name: x.name || x.tag_name, at: x.published_at,
                 url: x.html_url, body: x.body || '', pre: !!x.prerelease };
      });
      keep('releases', out);
      return out;
    });
}

/* ---- markdown, het kleine stuk dat de notities gebruiken -------------- */
function esc(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
var BASE = 'https://github.com/' + REPO + '/releases/tag/';
function href(u){
  u = u.replace(/&amp;/g, '&');
  if(/^https?:\/\//i.test(u)) return u;
  if(/^[a-z][a-z0-9+.-]*:/i.test(u)) return null;          // javascript:, data:, ...
  try { return new URL(u, BASE).href; } catch(e){ return null; }
}
function inline(s){
  var codes = [];
  s = s.replace(/`([^`]+)`/g, function(_, c){ codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(m, t, u){
    var h = href(u);
    return h ? '<a href="' + esc(h) + '" rel="noopener">' + t + '</a>' : t;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
       .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
       .replace(/(^|[\s(])#(\d+)\b/g, '$1<a href="https://github.com/' + REPO + '/pull/$2" rel="noopener">#$2</a>');
  return s.replace(/\u0000(\d+)\u0000/g, function(_, i){ return '<code>' + codes[+i] + '</code>'; });
}
function md(src){
  var out = [], list = false, para = [];
  function flush(){ if(para.length){ out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
  function close(){ if(list){ out.push('</ul>'); list = false; } }
  esc(src).replace(/\r/g, '').split('\n').forEach(function(line){
    var h = /^#{1,6}\s+(.*)$/.exec(line), li = /^\s*[-*]\s+(.*)$/.exec(line);
    if(h){ flush(); close(); out.push('<h3>' + inline(h[1]) + '</h3>'); }
    else if(li){ flush(); if(!list){ out.push('<ul>'); list = true; } out.push('<li>' + inline(li[1]) + '</li>'); }
    else if(!line.trim()){ flush(); close(); }
    else { if(list) close(); para.push(line.trim()); }
  });
  flush(); close();
  return out.join('\n');
}

/* ---- de voet: het nieuwste versienummer, als link naar de lijst ------- */
function paintFooter(list){
  var last = list && list[0];
  if(!last) return;
  Array.prototype.forEach.call(document.querySelectorAll('.js-ver'), function(a){
    a.textContent = last.tag;
    a.hidden = false;
  });
}

window.OverlayVersion = { releases: releases, md: md };
releases().then(paintFooter).catch(function(e){ console.warn('[version]', e.message); });
})();

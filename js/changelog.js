/* changelog.html: de releases van GitHub als lijst, nieuwste eerst. De
   notities zelf zijn Engels (zo staan ze op GitHub); in het Nederlands
   vertaalt alleen de pagina eromheen, en dat staat er dan ook bij. */
(function(){
'use strict';
var NL = window.I18N && window.I18N.lang === 'nl';
var D  = (window.I18N_INDEX || {}).nl || {};
document.documentElement.lang = NL ? 'nl' : 'en';
if(NL) Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-html]'), function(n){
  var k = n.getAttribute('data-i18n-html');
  if(D[k] != null) n.innerHTML = D[k];
});
function T(en, key){ return NL && D[key] != null ? D[key] : en; }

var list = document.getElementById('clList');
function day(iso){
  var d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString(NL ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

window.OverlayVersion.releases().then(function(rs){
  list.innerHTML = '';
  if(!rs.length){ list.innerHTML = '<li class="cl__note">' + T('No releases yet.', 'cl.none') + '</li>'; return; }
  rs.forEach(function(r, i){
    var li = document.createElement('li');
    li.className = 'cl__rel' + (i === 0 ? ' is-latest' : '');
    li.id = r.tag;
    var head = document.createElement('div'); head.className = 'cl__head';
    var tag = document.createElement('a'); tag.className = 'cl__tag'; tag.href = r.url; tag.rel = 'noopener'; tag.textContent = r.tag;
    var when = document.createElement('time'); when.className = 'cl__when'; when.dateTime = r.at; when.textContent = day(r.at);
    head.appendChild(tag); head.appendChild(when);
    if(i === 0){ var b = document.createElement('span'); b.className = 'cl__badge'; b.textContent = T('latest', 'cl.latest'); head.appendChild(b); }
    var body = document.createElement('div'); body.className = 'cl__body';
    body.innerHTML = window.OverlayVersion.md(r.body);
    li.appendChild(head); li.appendChild(body);
    list.appendChild(li);
  });
  if(NL){ var n = document.createElement('p'); n.className = 'cl__note cl__note--en'; n.textContent = D['cl.en'] || ''; list.parentNode.insertBefore(n, list); }
  if(location.hash){ var t = document.getElementById(location.hash.slice(1)); if(t) t.scrollIntoView(); }
}).catch(function(){
  list.innerHTML = '<li class="cl__note">' + T('GitHub did not answer, so the list is not here right now.', 'cl.fail')
    + ' <a href="https://github.com/Bmiest/bmiest_wow_streaming_theme/releases" rel="noopener">' + T('Read them on GitHub', 'cl.failLink') + '</a>.</li>';
});
})();

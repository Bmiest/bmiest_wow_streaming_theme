/* changelog.html, built like wijzigingen.html on racetodutchfirst.nl: both languages in the
   page, a version per entry on a rail, the newest marked "live now". The entries come from
   js/changelog-data.js. The language is js/i18n.js's (?lang, then the visitor's choice on the
   front page, then the browser); the NL | EN switch changes it here and remembers it. */
(function(){
'use strict';
var LIST = window.CHANGELOG || [];
var DATE = { en: 'en-US', nl: 'nl-BE' };
var LIVE = { en: 'Live now', nl: 'Nu live' };

function el(tag, cls, text){
  var n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text != null) n.textContent = text;
  return n;
}
function day(iso, lang){
  var d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString(DATE[lang], { day: 'numeric', month: 'long', year: 'numeric' });
}

['en', 'nl'].forEach(function(lang){
  var ol = document.querySelector('[data-ch="' + lang + '"]');
  LIST.forEach(function(e, i){
    var li = el('li', 'ch__day' + (i === 0 ? ' is-live' : ''));
    li.id = 'v' + e.version;
    var h = el('div', 'ch__h');
    var t = el('time', 'ch__date', day(e.date, lang)); t.dateTime = e.date;
    h.appendChild(t);
    h.appendChild(el('span', 'ch__ver mono', 'v' + e.version));
    if(i === 0) h.appendChild(el('span', 'ch__live', LIVE[lang]));
    li.appendChild(h);
    var ul = el('ul', 'ch__items');
    (e[lang] || []).forEach(function(line){ ul.appendChild(el('li', null, line)); });
    li.appendChild(ul);
    ol.appendChild(li);
  });
});
Array.prototype.forEach.call(document.querySelectorAll('.js-live'), function(n){
  n.textContent = LIST[0] ? 'v' + LIST[0].version : '—';
});

var body = document.body.dataset;
function show(lang){
  Array.prototype.forEach.call(document.querySelectorAll('[data-pv]'), function(n){ n.hidden = n.getAttribute('data-pv') !== lang; });
  Array.prototype.forEach.call(document.querySelectorAll('.lang-switch [data-lang]'), function(b){
    b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
  });
  document.documentElement.lang = lang;
  document.title = lang === 'nl' ? body.titleNl : body.titleEn;
  var back = document.querySelector('.pv-bug');
  if(back) back.href = lang === 'nl' ? './?lang=nl' : './';
}
Array.prototype.forEach.call(document.querySelectorAll('.lang-switch [data-lang]'), function(b){
  b.addEventListener('click', function(){ window.I18N.set(b.getAttribute('data-lang')); });
});
window.I18N.onChange(show);
show(window.I18N.lang);
if(location.hash){ var target = document.getElementById(location.hash.slice(1)); if(target) target.scrollIntoView(); }
})();

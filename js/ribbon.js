/* Gedeelde bouwer voor de ribbon-elementen. Eén bron voor de tints en de
   iconen, zodat de bovenbalk, de scenes en Just Chatting niet uit elkaar
   gaan lopen. */
(function(){
'use strict';
var U = window.U;

var TINT = {
  follow:'var(--jade)', sub:'var(--paper)', cheer:'var(--gold)',
  tip   :'var(--gold)', raid:'var(--jade)', neutral:'var(--ink-300)',
  sword :'var(--paper)',
  live  :'var(--jade)', info:'var(--paper-dim)',
  viewers:'var(--paper-dim)', cam:'var(--jade)', chat:'var(--paper-dim)'
};

var GLYPH = {
  follow :'<path d="M9 9a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 9 9Zm0 1.7c-3.3 0-6 1.9-6 4.2v1.3h12v-1.3c0-2.3-2.7-4.2-6-4.2Z" fill="currentColor"/>',
  sub    :'<path d="M9 1.6l2.1 4.6 5 .5-3.8 3.4 1.1 5L9 12.5l-4.4 2.6 1.1-5L1.9 6.7l5-.5z" fill="currentColor"/>',
  cheer  :'<path d="M9 1.4l5.8 5.2L9 16.6 3.2 6.6z" fill="currentColor"/>',
  tip    :'<path d="M13.4 4.8a5.6 5.6 0 1 0 0 8.4M3.4 7.7h7.4M3.4 10.3h7.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  raid   :'<path d="M3.4 4.2 7.8 9l-4.4 4.8M9.8 4.2 14.2 9l-4.4 4.8" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
  clock  :'<circle cx="9" cy="9" r="7.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 4.8V9l3 1.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  chat   :'<path d="M2.4 4.2h13.2v8.2H7.2l-3.4 2.8v-2.8H2.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  link   :'<path d="M7.4 10.6a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 1 0-4.2-4.2l-.9.9M10.6 7.4a3 3 0 0 0-4.2 0L3.8 10a3 3 0 1 0 4.2 4.2l.9-.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  cam    :'<path d="M2.4 5.2h8.4v7.6H2.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10.8 9l4.8-2.6v5.2z" fill="currentColor"/>',
  sword  :'<path d="M14.6 3.4 7.8 10.2M12.4 3.4h2.2v2.2M3.4 14.6l3.2-3.2M4.6 12.2l1.2 1.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  live   :'<circle cx="9" cy="9" r="3" fill="currentColor"/><path d="M4.2 4.2a6.8 6.8 0 0 0 0 9.6M13.8 4.2a6.8 6.8 0 0 1 0 9.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  viewers:'<path d="M9 4.4c-3.3 0-6 2-7.2 4.6C3 11.6 5.7 13.6 9 13.6s6-2 7.2-4.6C15 7.4 12.3 4.4 9 4.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="9" cy="9" r="2.1" fill="currentColor"/>'
};

/* De beloning van het subdoel, getekend in plaats van gefotografeerd. Een
   productfoto van een verkoper is andermans materiaal en hoort niet in een
   repo die MIT is; een witte studiofoto vecht bovendien met een overlay die
   verder uit vlakke tinten bestaat, en een verloop over een foto is precies
   wat er op 505 kbps als eerste gaat banden.

   Wie wel een foto wil zet goals.subs.image; dan komt die hiervoor in de
   plaats. Zie media/NOTICE.txt. */
var WIG =
  '<svg class="wig" viewBox="0 0 120 150" aria-hidden="true">' +
    '<ellipse cx="60" cy="66" rx="26" ry="33" fill="var(--ink-500)"/>' +
    '<path fill="var(--paper)" d="M20 116C20 58 18 8 60 8s40 50 40 108c0 12-3 22-8 28-4 4-10 1-9-5 ' +
      '5-26 5-56 0-76-4-18-11-26-23-26s-19 8-23 26c-5 20-5 50 0 76 1 6-5 9-9 5-5-6-8-16-8-28Z"/>' +
    '<path fill="var(--paper)" d="M36 44c4-13 12-20 24-20s20 7 24 20c-7-7-15-10-24-10s-17 3-24 10Z"/>' +
  '</svg>';

/* maakt <div class="rib"><span cap><div bar><div in><acc><val> */
function make(kind, caption, value){
  var el = U.el('div', 'rib');
  el.style.setProperty('--acc', TINT[kind] || TINT.neutral);
  el.innerHTML =
    (caption ? '<span class="rib__cap">' + U.esc(caption) + '</span>' : '') +
    '<div class="rib__bar"><div class="rib__in">' +
      '<span class="rib__acc"><svg viewBox="0 0 18 18">' + (GLYPH[kind] || '') + '</svg></span>' +
      '<span class="rib__val"></span>' +
    '</div></div>';
  var v = el.querySelector('.rib__val');
  if(value != null) v.textContent = value;
  /* quiet = wel bijwerken, niet oplichten. Voor waarden die uit zichzelf
     doorlopen (uptime, kijkers); een flits elke minuut is geen nieuws. */
  el.setValue = function(t, quiet){
    t = t == null ? '' : String(t);
    if(v.textContent === t) return;
    v.textContent = t;
    if(quiet) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  };
  return el;
}

/* kaart met schuine hoek en een bijschrift dat op de rand rijdt */
function card(caption, kind){
  var el = U.el('div','rcard-wrap');
  if(kind) el.style.setProperty('--acc', TINT[kind] || TINT.neutral);
  el.innerHTML = (caption ? '<span class="rcard__cap">' + U.esc(caption) + '</span>' : '') +
                 '<div class="rcard"><div class="rcard__in"></div></div>';
  el.body = el.querySelector('.rcard__in');
  return el;
}

window.Ribbon = { make:make, card:card, TINT:TINT, GLYPH:GLYPH, WIG:WIG };
})();

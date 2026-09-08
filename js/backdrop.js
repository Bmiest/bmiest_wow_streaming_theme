/* Achtergrond voor de scenes en Just Chatting.
   Zet scenes.background op 'plain' in config.js om hem uit te zetten. */
(function(){
'use strict';
var U = window.U;

function mount(root, opts){
  opts = opts || {};
  var SC = (U.CFG.scenes || {});
  if((SC.background || 'ribbons') === 'plain') return null;

  var bg = U.el('div','bg');
  bg.setAttribute('aria-hidden','true');
  bg.innerHTML =
    '<span class="bg__rib bg__rib--1"></span>' +
    '<span class="bg__rib bg__rib--2"></span>' +
    '<span class="bg__rib bg__rib--3"></span>' +
    '<span class="bg__corner bg__corner--tl"></span>' +
    '<span class="bg__corner bg__corner--br"></span>';

  /* Stofjes: deterministisch geplaatst, niet willekeurig -- anders ziet
     elke scenewissel er net anders uit. */
  var n = opts.motes == null ? 16 : opts.motes;
  for(var i = 0; i < n; i++){
    var m = U.el('span','bg__mote');
    var seed = (i * 2654435761) % 1000 / 1000;      // stabiele pseudo-spreiding
    var seed2 = (i * 40503) % 997 / 997;
    var size = 3 + Math.round(seed2 * 4);
    m.style.width  = size + 'px';
    m.style.height = size + 'px';
    m.style.left   = (4 + seed * 92).toFixed(2) + '%';
    m.style.top    = (18 + seed2 * 78).toFixed(2) + '%';
    m.style.background = (i % 3 === 0) ? 'var(--jade)' : 'var(--paper)';
    m.style.opacity = (0.05 + seed2 * 0.09).toFixed(3);
    m.style.animationDuration = (34 + seed * 30).toFixed(1) + 's';
    m.style.animationDelay    = (-seed2 * 40).toFixed(1) + 's';
    bg.appendChild(m);
  }

  root.insertBefore(bg, root.firstChild);
  return bg;
}

window.Backdrop = { mount:mount };
})();

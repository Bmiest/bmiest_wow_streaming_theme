/* Achtergrond voor de scene-schermen.
   Zet scenes.background op 'plain' in config.js om hem uit te zetten.

   Just Chatting heeft er geen: dat vlak ligt over de hele stage en de
   camera is daar een transparant gat, dus de banen zouden dwars over de
   webcam drijven. */
(function(){
'use strict';
var U = window.U;

/* Eén baan van constante dikte: bovenrand als kromme naar rechts, dan
   dezelfde kromme h lager terug. Vier controlepunten op vaste x -- de
   vorm zit dus volledig in de y-waarden hieronder. De banen lopen aan
   beide kanten 200 buiten het doek door, zodat je nergens een uiteinde
   ziet als ze opschuiven. */
function band(y, h){
  return 'M-200 ' + y[0] +
         'C640 ' + y[1] + ' 1780 ' + y[2] + ' 2760 ' + y[3] +
         'L2760 ' + (y[3] + h) +
         'C1780 ' + (y[2] + h) + ' 640 ' + (y[1] + h) + ' -200 ' + (y[0] + h) + 'Z';
}
function edge(y){
  return 'M-200 ' + y[0] + 'C640 ' + y[1] + ' 1780 ' + y[2] + ' 2760 ' + y[3];
}

/* Doek 2560x1440. De compositie is een langzame golf, en de klok moet in
   een gat vallen: in het midden zit tussen y 520 en 800 dus niets. Baan 1
   en 4 kruisen elkaar in de bovenste derde, baan 3 loopt door de open
   strook tussen het onderwerp (y 870) en de kaarten (y 1130) en klimt aan
   beide kanten het lege flank in. Alle vier hebben genoeg hoogteverschil
   om nergens een lange vlakke rand te hebben -- dat is wat een baan weer
   in een streep verandert. */
var BANDS = [
  { y:[ 420, 120,  180,  460], h:150 },   // 1 jade, bovenste flank
  { y:[1120,1300, 1240, 1080], h:320 },   // 2 wit, onderste massa
  { y:[ 760,1150, 1150,  700], h: 80 },   // 3 jade, dun, door de open strook
  { y:[ 180, 520,  380,  120], h:110 }    // 4 wit, dun, kruist baan 1
];
/* Haarlijn op de bovenrand van baan 3. Beide krijgen in de CSS dezelfde
   animatie, anders schuift de lijn van zijn baan af. */
var EDGE = 2;

function mount(root, opts){
  opts = opts || {};
  var SC = (U.CFG.scenes || {});
  if((SC.background || 'ribbons') === 'plain') return null;

  var bg = U.el('div','bg');
  bg.setAttribute('aria-hidden','true');

  var svg = '<svg class="bg__flow" viewBox="0 0 2560 1440" preserveAspectRatio="none">';
  BANDS.forEach(function(b, i){
    svg += '<g class="bg__band bg__band--' + (i+1) + '"><path d="' + band(b.y, b.h) + '"/></g>';
  });
  svg += '<path class="bg__edge" d="' + edge(BANDS[EDGE].y) + '"/></svg>';

  bg.innerHTML = svg;

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

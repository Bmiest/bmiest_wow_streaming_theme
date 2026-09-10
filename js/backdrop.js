/* Achtergrond: één doek van 2560x1440, en drie stroken die er een stuk van
   tonen. De scene-schermen tekenen het hele doek; de boven- en onderbalk
   tekenen via de viewBox alleen het stuk dat op hun eigen hoogte valt. Zo
   loopt dezelfde compositie door achter je gameplay: je ziet hem in de
   bovenbalk, en onder komt hij terug in de kieren tussen de kaarten.

   Zet scenes.background op 'plain' voor de scene-schermen, of
   layout.background op 'plain' voor de balken.

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
  { y:[ 180, 520,  380,  120], h:110 },   // 4 wit, dun, kruist baan 1
  /* Twee dunne banen die in de balkstroken zelf liggen. Zonder deze bleef
     de bovenste 120px van het doek bijna leeg, en dan valt er in de
     bovenbalk niets te zien. Op de scene-schermen lopen ze achter de kop
     en achter de voetkaarten langs. */
  { y:[  90,  20,   60,   10], h: 46 },   // 5 jade, door de bovenbalk
  { y:[1250,1330, 1290, 1360], h: 60 }    // 6 wit, door de onderbalk
];
/* Haarlijn op de bovenrand van baan 3. Beide krijgen in de CSS dezelfde
   animatie, anders schuift de lijn van zijn baan af. De lijn zit daarom in
   een eigen groepje: baan 3 schuift horizontaal op de <g> en zakt verticaal
   op de <path>, en één element kan geen twee transform-animaties dragen. Met
   een wrapper eromheen krijgt de lijn precies dezelfde twee. */
var EDGE = 2;

/* De viewBox bepaalt welk stuk van het doek je ziet; de paden zijn overal
   dezelfde. preserveAspectRatio staat op none, maar strook en viewBox zijn
   even hoog, dus er wordt niets uitgerekt. */
function flowSVG(top, height){
  var svg = '<svg class="bg__flow" viewBox="0 ' + top + ' 2560 ' + height +
            '" preserveAspectRatio="none">';
  BANDS.forEach(function(b, i){
    svg += '<g class="bg__band bg__band--' + (i+1) + '"><path d="' + band(b.y, b.h) + '"/></g>';
  });
  return svg + '<g class="bg__edgewrap"><path class="bg__edge" d="' +
         edge(BANDS[EDGE].y) + '"/></g></svg>';
}

/* Een strook van het doek, voor de balken. */
function slice(root, opts){
  opts = opts || {};
  if(((U.CFG.layout || {}).background || 'bands') === 'plain') return null;
  var bg = U.el('div','bg bg--slice');
  bg.setAttribute('aria-hidden','true');
  bg.innerHTML = flowSVG(opts.top || 0, opts.height || 1440);
  root.insertBefore(bg, root.firstChild);
  return bg;
}

function mount(root, opts){
  opts = opts || {};
  var SC = (U.CFG.scenes || {});
  if((SC.background || 'ribbons') === 'plain') return null;

  var bg = U.el('div','bg');
  bg.setAttribute('aria-hidden','true');

  var svg = flowSVG(0, 1440);

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

window.Backdrop = { mount:mount, slice:slice };
})();

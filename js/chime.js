/* Geluid bij een raidmelding, gemaakt in de browser met de Web Audio API.

   Geen sample, dus geen bestand om te hosten, niets dat een 404 kan geven en
   niets dat je moet downloaden bij een release. En je kan de toonhoogte
   veranderen door een getal te wijzigen in plaats van audio te bewerken.

   In OBS moet je op de bron 'Control audio via OBS' aanzetten, anders komt
   dit geluid niet in je mix en dus ook niet bij je kijkers. */
(function(){
'use strict';
var ctx = null;

function ac(){
  if(ctx) return ctx;
  var C = window.AudioContext || window.webkitAudioContext;
  if(!C) return null;
  try { ctx = new C(); } catch(e){ return null; }
  return ctx;
}

/* Eén toon met een korte aanslag en een uitdovende staart. Exponentieel
   uitdoven klinkt als een aanslag; lineair klinkt als een knop die dichtgaat. */
function note(t0, n, volume){
  var c = ac(); if(!c) return;
  var osc = c.createOscillator(), g = c.createGain();
  osc.type = n.type || 'triangle';
  osc.frequency.value = n.hz;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(n.gain * volume, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + n.dur + 0.03);
}

var SCORE = {
  /* Nieuwe beste poging: twee korte tonen, een kwint omhoog. Klein en
     helder, want dit kan op een avond tien keer gebeuren. */
  best: [
    { at:0,   hz:880,     dur:0.18, gain:0.55 },
    { at:0.09,hz:1318.51, dur:0.26, gain:0.45 }
  ],
  /* Kill: een drieklank omhoog met een lage grondtoon eronder die langer
     nagalmt. Dit hoort één keer per boss te gebeuren, dus die mag vol. */
  kill: [
    { at:0,   hz:523.25,  dur:0.22, gain:0.50 },
    { at:0.10,hz:659.25,  dur:0.22, gain:0.50 },
    { at:0.20,hz:783.99,  dur:0.50, gain:0.55 },
    { at:0.20,hz:261.63,  dur:0.90, gain:0.32, type:'sine' }
  ]
};

function play(kind, volume){
  var score = SCORE[kind];
  if(!score || !volume) return;
  var c = ac(); if(!c) return;
  /* Staat de context nog geparkeerd (autoplay-beleid), dan eerst wekken.
     OBS start zijn browser met autoplay toegestaan, een gewone browser niet
     zonder dat je eerst iets aangeklikt hebt. */
  if(c.state === 'suspended' && c.resume) c.resume();
  var t0 = c.currentTime + 0.03;
  score.forEach(function(n){ note(t0 + n.at, n, volume); });
}

/* In een gewone browser mag audio pas nadat je iets hebt aangeraakt; tot dan
   meldt Chrome dat de context geparkeerd staat. Deze luisteraar wekt hem bij
   de eerste klik of toetsaanslag, zodat het testpad in een tab ook hoorbaar
   is. In OBS is dit niet nodig -- die start zijn browser met autoplay
   toegestaan. */
['pointerdown','keydown'].forEach(function(ev){
  addEventListener(ev, function(){
    var c = ac();
    if(c && c.state === 'suspended' && c.resume) c.resume();
  }, { once:true });
});

window.Chime = { play:play };
})();

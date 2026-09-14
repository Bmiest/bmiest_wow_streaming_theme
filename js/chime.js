/* Geluid bij een raidmelding, gemaakt in de browser met de Web Audio API.

   Geen sample, dus geen bestand om te hosten, niets dat een 404 kan geven en
   niets dat je moet downloaden bij een release. En je kan de toonhoogte
   veranderen door een getal te wijzigen in plaats van audio te bewerken.

   Dit begon als één kale oscillator per toon, rechtstreeks op de uitgang --
   structureel een piepje. Wat er nu staat is een klok, en een klok bestaat
   uit vier dingen die je los kan horen:

     1. de aanslag   -- een korte ruisflits, de hamer die het metaal raakt
     2. het lijf     -- FM, geen opgestapelde sinussen (zie bell())
     3. de zweving   -- twee dragers een halve hertz uit elkaar
     4. de ruimte    -- een galm met een voorvertraging en een donkere staart

   Het moet ook nog door je gameplay heen komen, en dat is geen kwestie van
   harder: er zit een lichte nadruk rond 3 kHz op de uitgang, want daar zit
   ruimte in een spelmix en daar hoor je een aanslag.

   In OBS moet je op de bron 'Control audio via OBS' aanzetten, anders komt
   dit geluid niet in je mix en dus ook niet bij je kijkers. */
(function(){
'use strict';
var ctx = null, bus = null, wet = null, noise = null;

function ac(){
  if(ctx) return ctx;
  var C = window.AudioContext || window.webkitAudioContext;
  if(!C) return null;
  try { ctx = new C(); } catch(e){ return null; }
  return ctx;
}

/* ---------------------------------------------------------------------
   RUIMTE
   --------------------------------------------------------------------- */

/* Een galmstaart zonder bestand. Ruis die uitdooft is de bekende truc, maar
   kale witte ruis klinkt als een sisser: in een echte ruimte doven de hoge
   tonen veel sneller dan de lage, want elke weerkaatsing slikt hoog weg.

   Vandaar een eenpolig laagdoorlaatfilter waarvan de coefficient gaandeweg
   dichtknijpt -- de staart wordt donkerder naarmate hij wegsterft. Dat ene
   detail is het verschil tussen "galm" en "ruis onder mijn geluid".

   De eerste 50 ms krijgen daarbovenop een paar losse tikken: vroege
   weerkaatsingen. Zonder die tikken hoor je een wolk, met die tikken hoor
   je een zaal met wanden. Per kanaal eigen ruis en eigen tikken, anders
   staat de galm in mono in het midden geplakt. */
function impulse(c, seconds, decay){
  var n = Math.floor(c.sampleRate * seconds);
  var buf = c.createBuffer(2, n, c.sampleRate);
  for(var ch = 0; ch < 2; ch++){
    var d = buf.getChannelData(ch), lp = 0;
    for(var i = 0; i < n; i++){
      var t = i / n;
      var coef = 0.34 - 0.30 * t;          // filter knijpt dicht
      lp += coef * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - t, decay);
    }
    var taps = 5 + ch;                      // links en rechts niet gelijk
    for(var k = 0; k < taps; k++){
      var at = Math.floor(c.sampleRate * (0.007 + Math.random() * 0.045));
      if(at < n) d[at] += (Math.random() * 2 - 1) * 0.5;
    }
  }
  return buf;
}

/* Eén buffer ruis voor alle aanslagen; opnieuw genereren per tik is werk
   zonder opbrengst. */
function noiseBuf(c){
  if(noise) return noise;
  var n = Math.floor(c.sampleRate * 0.25);
  noise = c.createBuffer(1, n, c.sampleRate);
  var d = noise.getChannelData(0);
  for(var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/* Master. De hoogdoorlaat haalt gerommel onder de 35 Hz weg -- dat hoor je
   niet, maar het eet wel koppen en het maakt de galm modderig. De nadruk
   rond 3 kHz erna is puur om door spelaudio heen te komen. De compressor
   staat er zacht op: vier tonen die samenvallen tellen op, en zonder rem
   tikt een kill tegen de 0 dB. */
function mix(){
  var c = ac(); if(!c) return null;
  if(bus) return bus;

  var comp = c.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.knee.value      = 12;
  comp.ratio.value     = 4;
  comp.attack.value    = 0.004;
  comp.release.value   = 0.28;
  comp.connect(c.destination);

  var air = c.createBiquadFilter();
  air.type = 'peaking';
  air.frequency.value = 3000;
  air.Q.value = 0.8;
  air.gain.value = 2.5;
  air.connect(comp);

  var hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 35;
  hp.connect(air);

  bus = c.createGain();
  bus.gain.value = 0.85;
  bus.connect(hp);

  /* Galm als aparte weg ernaast, niet in serie: de aanslag blijft droog en
     strak terwijl alleen de staart de ruimte in gaat. De voorvertraging van
     22 ms zet die twee uit elkaar -- zonder dat plakt de galm aan de aanslag
     vast en klinkt het alsof het geluid zelf wazig is. */
  var rev = c.createConvolver();
  rev.buffer = impulse(c, 2.4, 2.3);

  var revHP = c.createBiquadFilter();
  revHP.type = 'highpass';
  revHP.frequency.value = 250;   // lage tonen niet laten nagalmen: dat mompelt
  rev.connect(revHP);
  revHP.connect(hp);

  var pre = c.createDelay(0.2);
  pre.delayTime.value = 0.022;
  pre.connect(rev);

  wet = c.createGain();
  wet.gain.value = 0.38;
  wet.connect(pre);

  return bus;
}

/* ---------------------------------------------------------------------
   STEM
   --------------------------------------------------------------------- */

/* De hamer. Een ruisflits van een paar milliseconden door een banddoorlaat
   rond de toon: te kort om een toonhoogte te hebben, lang genoeg om te
   horen dat er iets geraakt is. Dit is het goedkoopste stukje realisme in
   het hele bestand -- zonder aanslag begint een toon gewoon te bestaan, en
   niets in de echte wereld doet dat. */
function strike(t0, hz, gain, out){
  var c = ac();
  var src = c.createBufferSource(); src.buffer = noiseBuf(c);
  var bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = Math.min(hz * 3.2, 9000);
  bp.Q.value = 0.9;
  var g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
  src.connect(bp); bp.connect(g); g.connect(out);
  src.start(t0); src.stop(t0 + 0.06);
}

/* Het lijf, met FM in plaats van opgestapelde sinussen.

   Een klok klinkt metaalachtig omdat er boventonen in zitten die niet in
   hele verhoudingen tot de grondtoon staan. Die er los bijstapelen kan, en
   dat stond hier eerst, maar dan staat de klankkleur stil: even hard
   metaal aan het begin als aan het eind. Bij FM bepaalt de diepte van de
   modulatie hoeveel boventonen er zijn, en die diepte is een envelope --
   dus je begint met een harde metalen tik en houdt een zuivere toon over,
   precies zoals echt metaal zich gedraagt. Dezelfde reden dat de klassieke
   klokgeluiden uit de jaren tachtig FM zijn.

   De modulator staat op 1.41 keer de drager: een verhouding die bewust geen
   heel getal is, want daar zit het valse in.

   Twee dragers, een halve hertz uit elkaar en licht uit elkaar gepand. Die
   zweving -- de traag golvende luidheid die je bij elke echte klok hoort --
   is wat een enkele oscillator nooit haalt.

   En de toonhoogte zakt in de eerste 40 ms een paar cent naar zijn plek: de
   aanslag van een klok is even te hoog voordat hij zich zet. */
function bell(t0, n, volume, out){
  var c = ac();
  var dur = n.dur, hz = n.hz, peak = n.gain * volume;

  var body = c.createGain();
  body.gain.setValueAtTime(0.0001, t0);
  body.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  body.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  var tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 0.6;
  tone.frequency.setValueAtTime(Math.min(hz * 10, 18000), t0);
  tone.frequency.exponentialRampToValueAtTime(Math.max(hz * 2.2, 300), t0 + dur);
  tone.connect(body);

  [-1, 1].forEach(function(side){
    var car = c.createOscillator();
    car.type = 'sine';
    car.frequency.setValueAtTime(hz * 1.004, t0);
    car.frequency.exponentialRampToValueAtTime(hz + side * 0.25, t0 + 0.04);

    var mod = c.createOscillator();
    mod.type = 'sine';
    mod.frequency.value = hz * 1.41;

    /* Modulatiediepte in hertz. Hoog bij de aanslag, binnen een fractie van
       de toon weg -- dat is de metalen tik die wegtrekt. */
    var idx = c.createGain();
    idx.gain.setValueAtTime(hz * 2.6, t0);
    idx.gain.exponentialRampToValueAtTime(hz * 0.02, t0 + dur * 0.45);
    mod.connect(idx); idx.connect(car.frequency);

    var half = c.createGain();
    half.gain.value = 0.5;
    car.connect(half);

    if(c.createStereoPanner){
      var pan = c.createStereoPanner();
      pan.pan.value = side * 0.18;
      half.connect(pan); pan.connect(tone);
    } else half.connect(tone);

    mod.start(t0); car.start(t0);
    mod.stop(t0 + dur + 0.05); car.stop(t0 + dur + 0.05);
  });

  body.connect(out);
  if(wet) body.connect(wet);
  strike(t0, hz, peak * 0.5, out);
}

/* Een zuivere sinus eronder, zonder aanslag en zonder galm: alleen gewicht.
   Door hem langzaam in te laten komen duwt hij de kill omhoog in plaats van
   hem te laten bonken. */
function sub(t0, n, volume, out){
  var c = ac();
  var osc = c.createOscillator(), g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = n.hz;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(n.gain * volume, t0 + 0.09);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
  osc.connect(g); g.connect(out);
  osc.start(t0); osc.stop(t0 + n.dur + 0.05);
}

var SCORE = {
  /* Nieuwe beste poging: twee klokken, een kwint omhoog, met een zachte
     schittering erboven. Klein en kort, want dit kan op een avond tien keer
     gebeuren -- het mag opvallen en daarna weg zijn. */
  best: [
    { at:0,     hz:880,     dur:0.34, gain:0.44 },
    { at:0.080, hz:1318.51, dur:0.46, gain:0.38 },
    { at:0.165, hz:1760,    dur:0.40, gain:0.12 }
  ],
  /* Kill: de drieklank omhoog, landend op de octaaf in plaats van op de
     kwint -- het verschil tussen een zin die stopt en een zin die afmaakt.
     Dit hoort één keer per boss te gebeuren, dus die mag vol en die mag
     nagalmen. De lage C eronder draagt hem. */
  kill: [
    { at:0,     hz:523.25,  dur:0.34, gain:0.40 },
    { at:0.100, hz:659.25,  dur:0.36, gain:0.40 },
    { at:0.200, hz:783.99,  dur:0.40, gain:0.42 },
    { at:0.320, hz:1046.50, dur:1.40, gain:0.48 },
    { at:0.300, hz:130.81,  dur:1.60, gain:0.26, sub:true }
  ]
};

function play(kind, volume){
  var score = SCORE[kind];
  if(!score || !volume) return;
  var c = ac(); if(!c) return;
  var out = mix(); if(!out) return;
  /* Staat de context nog geparkeerd (autoplay-beleid), dan eerst wekken.
     OBS start zijn browser met autoplay toegestaan, een gewone browser niet
     zonder dat je eerst iets aangeklikt hebt. */
  if(c.state === 'suspended' && c.resume) c.resume();
  var t0 = c.currentTime + 0.03;
  score.forEach(function(n){
    (n.sub ? sub : bell)(t0 + n.at, n, volume, out);
  });
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

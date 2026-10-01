/* =====================================================================
   EMOTES  --  geanimeerde Twitch-emotes, getekend in SVG

   Elke emote is een functie van t (0..1, één lus) naar een SVG-string.
   Niets hier raakt de DOM, dus build-emotes.py kan de lijst met node
   uitlezen, en emotes.html tekent dezelfde functies als voorbeeld of als
   strook frames voor headless Chrome.

   De hoofdrol is de monnik met de pruik uit het subdoel (WIG in
   js/ribbon.js): een kale kruin, een rand haar met een rechte pony, een
   jade Mistweaver-pij en een witte priesterboord. Twee kanten van het
   kanaal, één poppetje.

   Wat een emote anders maakt dan de rest van de overlay:
   - Hij moet leesbaar zijn op 28 bij 28. Daarom tekent elke maat apart, met
     zijn eigen lijndikte (SZ hieronder), in plaats van dat Twitch 112
     terugschaalt en de lijnen tot grijs pap middelt.
   - GIF kent geen halve transparantie. Alles heeft dus een donkere rand die
     buitenom loopt; build-emotes.py snijdt de alpha op de helft af, en wat
     dan op de rand overblijft is inkt, niet een lichte zoom die op
     Twitch' donkere chat gaat gloeien.
   - Het eerste frame is ook de statische versie (voor wie animatie uit
     heeft). Elke lus begint dus op zijn beste pose, niet halverwege iets.
   - Niets knippert sneller dan drie keer per seconde.
   ===================================================================== */
(function(root){
'use strict';

var INK = '#0e1014';
var C = {
  skin  :'#e6c9a8', skinSh:'#cfa984',
  hair  :'#9a6e45', hairSh:'#79532f',
  jade  :'#3fd9a4', jadeDeep:'#1f8d68', jadeHi:'#a6f3d6',
  paper :'#eef1f5', paperDim:'#c9d0d8',
  gold  :'#d8b263',
  blush :'#e9a294', mouth:'#4a2328', tongue:'#e58a8a',
  tea   :'#b98b4e', white:'#ffffff',
  slate :'#2a2f37', lid:'#b38d6a',
  // Niet uit het palet, net als de huid: een traan is lichtblauw en mana is
  // WoW-blauw, anders leest niemand het.
  tear  :'#9fd4f5', mana:'#3d7fd9', rose:'#d98b8b',
  bubble:'rgba(166,243,214,.2)'
};

/* Per maat: L = zichtbare buitenrand, line = gezichtslijnen, k = schaal van
   ogen en mond, D = kleine details tekenen. Alles in viewBox-eenheden
   (112 per emote), dus op 28 is één eenheid een kwart pixel: een rand van
   5,6 is daar 1,4 px, op 112 is 3 gewoon 3 px. */
var SZ = {
  112: { L:3.0, line:3.4, k:1.00, D:true  },
  56 : { L:3.8, line:4.0, k:1.06, D:true  },
  28 : { L:5.6, line:5.4, k:1.20, D:false }
};

/* ---- rekenhulp ------------------------------------------------------ */
var TAU = Math.PI * 2;
function r2(x){ return Math.round(x * 100) / 100; }
function lerp(a, b, p){ return a + (b - a) * p; }
function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function seg(t, a, b){ return clamp01((t - a) / (b - a)); }
function easeOut(p){ return 1 - (1 - p) * (1 - p); }
function easeIn(p){ return p * p; }
function back(p){ var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
function bump(p){ return Math.sin(Math.PI * p); }

/* ---- tekenhulp ------------------------------------------------------
   ol(): rand buitenom. paint-order=stroke legt de vulling over de binnenste
   helft van de lijn, dus de zichtbare rand is de helft van stroke-width. */
function ol(k, m){
  return ' stroke="' + INK + '" stroke-width="' + r2(2 * k.L * (m || 1)) +
         '" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"';
}
function inkLine(k, d, m){
  return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' +
         r2(k.line * (m || 1)) + '" stroke-linecap="round" stroke-linejoin="round"/>';
}
/* gekleurde lijn met inktrand: eerst dik in inkt, dan dun in kleur */
function oLine(k, d, col, w){
  var a = '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  return '<path d="' + d + '" stroke="' + INK + '" stroke-width="' + r2(w + 2 * k.L) + a +
         '<path d="' + d + '" stroke="' + col + '" stroke-width="' + r2(w) + a;
}
function P(x, y){ return r2(x) + ' ' + r2(y); }

/* ---- de monnik --------------------------------------------------------
   Lokale coördinaten: midden van het hoofd op 0,0, kin op y=38. */
/* De rand haar loopt hol over het voorhoofd en staat aan de zijkanten op in
   plukken: zo leest het als tonsuur. Met een bolle bovenkant, zoals de wig
   in js/ribbon.js op alertformaat, werd het op 28 een pot-coupe. */
var HAIR =
  'M-44 -8C-45 -20 -39 -27 -33 -24C-24 -15 24 -15 33 -24C39 -27 45 -20 44 -8L43 12' +
  'C43 16.5 37.5 17.5 35 14L34 -4L-34 -4L-35 14C-37.5 17.5 -43 16.5 -43 12Z';

/* look = [dx, dy] schuift de pupil: opzij kijken, omhoog kijken */
function eye(k, x, y, kind, right, look){
  var g = '', lx = look ? look[0] : 0, ly = look ? look[1] : 0;
  switch(kind){
    case 'open':
    case 'wide':
    case 'big':
      var w = kind === 'wide', b = kind === 'big';
      g = '<ellipse cx="' + lx + '" cy="' + ly + '" rx="' + (b ? 6.2 : w ? 5.4 : 4.4) + '" ry="' +
          (b ? 8.2 : w ? 7 : 5.8) + '" fill="' + INK + '"/>';
      if(k.D || b) g += '<circle cx="' + r2(lx + (b ? 2 : 1.4)) + '" cy="' + r2(ly - (b ? 3 : 2.2)) +
                        '" r="' + (b ? 2.5 : w ? 1.9 : 1.5) + '" fill="' + C.white + '"/>';
      if(b && k.D) g += '<circle cx="' + r2(lx - 2) + '" cy="' + r2(ly + 3.2) + '" r="1.1" fill="' + C.white + '"/>';
      break;
    // half dicht: pupil, het bovenste stuk weggeplakt in huidkleur, en het ooglid
    case 'half':
    case 'tired':
      g = '<ellipse cx="' + lx + '" cy="1.2" rx="4.6" ry="5.4" fill="' + INK + '"/>' +
          '<rect x="-7" y="-8" width="14" height="8" fill="' + C.skin + '"/>' +
          inkLine(k, 'M-6 0H6');
      if(kind === 'tired' && k.D)
        g += '<path d="M-5 9.5Q0 12 5 9.5" fill="none" stroke="' + C.lid + '" stroke-width="1.8" stroke-linecap="round"/>';
      break;
    case 'star':
      g = star(k, 0, 0, 7.5, C.gold);
      break;
    case 'happy' : g = inkLine(k, 'M-5.5 2.5Q0 -5 5.5 2.5'); break;
    case 'closed': g = inkLine(k, 'M-5.5 -1Q0 4.5 5.5 -1'); break;
    case 'blink' : g = inkLine(k, 'M-5 .5H5'); break;
    // op 28 groter en dunner, anders loopt het kruis dicht tot een stip
    case 'x'     : g = k.D ? inkLine(k, 'M-4.2 -4.2L4.2 4.2M4.2 -4.2L-4.2 4.2')
                           : inkLine(k, 'M-5.6 -5.6L5.6 5.6M5.6 -5.6L-5.6 5.6', .8); break;
    case 'tight' : g = inkLine(k, right ? 'M4.5 -4L-4 0L4.5 4' : 'M-4.5 -4L4 0L-4.5 4'); break;
  }
  return '<g transform="translate(' + P(x, y) + ') scale(' + k.k + ')">' + g + '</g>';
}

function mouth(k, kind){
  var g = '', edge = ' stroke="' + INK + '" stroke-width="' + r2(k.line * .7) + '" stroke-linejoin="round"';
  switch(kind){
    case 'smile': g = inkLine(k, 'M-6 -1.5Q0 4.5 6 -1.5'); break;
    case 'flat' : g = inkLine(k, 'M-5 0H5'); break;
    case 'o'    : g = '<ellipse cy="1" rx="3.6" ry="4.4" fill="' + C.mouth + '"' + edge + '/>'; break;
    case 'ahh'  : g = '<ellipse cy="1" rx="5" ry="3.4" fill="' + C.mouth + '"' + edge + '/>'; break;
    case 'grin' :
      g = '<path d="M-8 -3Q0 -1 8 -3Q7 7 0 7Q-7 7 -8 -3Z" fill="' + C.mouth + '"' + edge + '/>' +
          '<path d="M-4.5 5Q0 1.5 4.5 5Q2 7 0 7Q-2 7 -4.5 5Z" fill="' + C.tongue + '"/>';
      break;
    case 'open' :
      g = '<path d="M-10 -5Q0 -3 10 -5Q9 11 0 11Q-9 11 -10 -5Z" fill="' + C.mouth + '"' + edge + '/>' +
          '<path d="M-6 8Q0 2.5 6 8Q3 11 0 11Q-3 11 -6 8Z" fill="' + C.tongue + '"/>';
      break;
    case 'tongue':
      g = '<path d="M1 0Q1.5 9 5.5 8.5Q9 8 8 0Z" fill="' + C.tongue + '"' + edge + '/>' +
          inkLine(k, 'M-7 .5Q0 -1.5 9 .5');
      break;
    case 'pog'  :
      g = '<ellipse cy="2.5" rx="5.6" ry="8" fill="' + C.mouth + '"' + edge + '/>' +
          '<ellipse cy="7.4" rx="3.4" ry="2.2" fill="' + C.tongue + '"/>';
      break;
    case 'wail' :
      g = '<path d="M-10 7Q-9 -6 0 -6Q9 -6 10 7Q0 4 -10 7Z" fill="' + C.mouth + '"' + edge + '/>';
      break;
    case 'pant' :
      g = '<path d="M-6.5 -3Q0 -4 6.5 -3Q6 6.5 0 6.5Q-6 6.5 -6.5 -3Z" fill="' + C.mouth + '"' + edge + '/>' +
          '<path d="M-3.5 4.5Q0 1.5 3.5 4.5Q2 9 0 9Q-2 9 -3.5 4.5Z" fill="' + C.tongue + '"' + edge + '/>';
      break;
    case 'frown': g = inkLine(k, 'M-6 3Q0 -3 6 3'); break;
    case 'slant': g = inkLine(k, 'M-5.5 1.5L5.5 -1.5'); break;
    case 'smug' : g = inkLine(k, 'M-7 -1Q1 4.5 7.5 -3.5'); break;
  }
  return '<g transform="translate(0 22) scale(' + k.k + ')">' + g + '</g>';
}

/* Het hoofd. o.wigDy/o.wigRot tillen de pruik op; o.wig=false laat hem weg. */
function head(k, o){
  var s = '';
  // oren, achter het hoofd zodat alleen de lel eronder uitsteekt
  s += '<ellipse cx="-40" cy="14" rx="6.5" ry="8.5" fill="' + C.skin + '"' + ol(k) + '/>' +
       '<ellipse cx="40" cy="14" rx="6.5" ry="8.5" fill="' + C.skin + '"' + ol(k) + '/>';
  if(k.D) s += '<ellipse cx="-41.5" cy="15" rx="2.6" ry="4.2" fill="' + C.skinSh + '"/>' +
               '<ellipse cx="41.5" cy="15" rx="2.6" ry="4.2" fill="' + C.skinSh + '"/>';
  s += '<ellipse rx="40" ry="38" fill="' + C.skin + '"' + ol(k) + '/>';
  // glimmer op de kale kruin -- het enige stukje wit op het hoofd
  s += '<ellipse cx="-14" cy="-27.5" rx="8.5" ry="' + (k.D ? 3.3 : 4) +
       '" transform="rotate(-22 -14 -27.5)" fill="' + C.white + '"/>';
  if(k.D) s += '<circle cx="-1" cy="-33" r="1.8" fill="' + C.white + '"/>';
  if(o.blush && k.D)
    s += '<ellipse cx="-25" cy="19" rx="5.5" ry="3" fill="' + C.blush + '"/>' +
         '<ellipse cx="25" cy="19" rx="5.5" ry="3" fill="' + C.blush + '"/>';
  s += eye(k, -14, 8, o.eyes || 'open', false, o.look) + eye(k, 14, 8, o.eyes || 'open', true, o.look);
  s += mouth(k, o.mouth || 'smile');
  if(o.wig !== false){
    s += '<g transform="translate(0 ' + r2(o.wigDy || 0) + ') rotate(' + r2(o.wigRot || 0) + ' 0 -8)">' +
         '<path d="' + HAIR + '" fill="' + C.hair + '"' + ol(k) + '/>' +
         (k.D ? '<path d="M-13 -4.5V-9M12 -4.5V-9" stroke="' + C.hairSh +
                '" stroke-width="2" stroke-linecap="round"/>' : '') +
         '</g>';
  }
  // o.over: in hoofdcoördinaten, over alles heen (tranen, halo, kroon)
  return s + (o.over || '');
}

/* Pij met boord, en eventueel de handen tegen elkaar. Lokaal, onder de kin. */
function robe(k, o){
  var body = o.robeCol || C.jade, fold = o.robeCol ? C.paperDim : C.jadeDeep;
  var s = '<path d="M-48 84C-46 50 -26 34 0 34C26 34 46 50 48 84Z" fill="' + body + '"' + ol(k) + '/>' +
          '<path d="M-14 35L0 54L14 35Z" fill="' + (o.collarCol || C.paper) + '"' + ol(k, .75) + '/>';
  if(k.D) s += '<path d="M0 56V84" stroke="' + fold + '" stroke-width="2.4"/>';
  if(o.hands === 'pray')
    s += '<ellipse cx="-5" cy="50" rx="6.5" ry="11.5" transform="rotate(14 -5 50)" fill="' + C.skin + '"' + ol(k) + '/>' +
         '<ellipse cx="5" cy="50" rx="6.5" ry="11.5" transform="rotate(-14 5 50)" fill="' + C.skin + '"' + ol(k) + '/>';
  return s;
}

/* Monnik op positie. sx/sy knijpen vanuit de kin, rot draait alleen het
   hoofd (een gekantelde pij laat een gat onderin zien). */
function monk(k, o){
  var cx = o.cx == null ? 56 : o.cx, cy = o.cy == null ? 56 : o.cy, sc = o.sc || 1;
  var s = '<g transform="translate(' + P(cx, cy) + ') scale(' + sc + ')">';
  // o.back / o.front: in dezelfde lokale coördinaten, achter de pij en voor
  // het hoofd. Vleugels achter, handen en wat ze vasthouden voor.
  if(o.back) s += o.back;
  if(o.robe !== false) s += robe(k, o);
  s += '<g transform="rotate(' + r2(o.rot || 0) + ') translate(0 38) scale(' +
       r2(o.sx || 1) + ' ' + r2(o.sy || 1) + ') translate(0 -38)">' + head(k, o) + '</g>';
  if(o.front) s += o.front;
  return s + '</g>';
}

/* ---- losse vormen ---------------------------------------------------- */
function plus(k, x, y, r, col){
  var w = r * .4;
  var d = 'M' + P(x - w, y - r) + 'H' + r2(x + w) + 'V' + r2(y - w) + 'H' + r2(x + r) +
          'V' + r2(y + w) + 'H' + r2(x + w) + 'V' + r2(y + r) + 'H' + r2(x - w) +
          'V' + r2(y + w) + 'H' + r2(x - r) + 'V' + r2(y - w) + 'H' + r2(x - w) + 'Z';
  return '<path d="' + d + '" fill="' + col + '"' + ol(k) + '/>';
}

/* vierpuntige ster, dik genoeg om op 28 niet te verdwijnen */
function star(k, x, y, r, col){
  if(r < .6) return '';
  var q = r * .22;
  var d = 'M' + P(x, y - r) + 'Q' + P(x + q, y - q) + ' ' + P(x + r, y) +
          'Q' + P(x + q, y + q) + ' ' + P(x, y + r) + 'Q' + P(x - q, y + q) + ' ' + P(x - r, y) +
          'Q' + P(x - q, y - q) + ' ' + P(x, y - r) + 'Z';
  return '<path d="' + d + '" fill="' + col + '"' + ol(k, .8) + '/>';
}

/* Vuurwerk: stralen die uitvliegen en korter worden. p = 0..1 van zijn
   eigen leven, daarbuiten is hij er niet. */
function burst(k, x, y, p, col, n, R, rot){
  if(p <= 0 || p >= 1) return '';
  var r1 = 2 + R * easeOut(p), len = Math.max(1.6, R * .55 * (1 - p)), r0 = Math.max(0, r1 - len);
  var w = (k.D ? 4.2 : 5.4) * (1 - .45 * p), d = '';
  for(var i = 0; i < n; i++){
    var a = rot * TAU + i * TAU / n, c = Math.cos(a), sn = Math.sin(a);
    d += 'M' + P(x + c * r0, y + sn * r0) + 'L' + P(x + c * r1, y + sn * r1);
  }
  var s = '';
  if(p < .16) s += '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(1.5 + 6 * (1 - p / .16)) +
                   '" fill="' + C.white + '"' + ol(k) + '/>';
  s += oLine(k, d, col, w);
  if(k.D && p > .3){
    for(var j = 0; j < n; j++){
      var b = rot * TAU + (j + .5) * TAU / n, rr = r1 * .62;
      s += '<circle cx="' + r2(x + Math.cos(b) * rr) + '" cy="' + r2(y + Math.sin(b) * rr) +
           '" r="' + r2(2.2 * (1 - p) + .4) + '" fill="' + col + '"' + ol(k, .6) + '/>';
    }
  }
  return s;
}

/* ---- de emotes ------------------------------------------------------- */

/* bmiestWig -- het subdoel. Hij tilt de pruik als een hoed, de kale kruin
   geeft een ster, en de pruik ploft terug. */
function drawWig(k, t){
  // iets kleiner en lager dan de rest: de pruik moet omhoog kunnen zonder
  // tegen de bovenrand te lopen
  var o = { cy:61, sc:.92, robe:true, eyes:'open', mouth:'smile' };
  if(t > .12 && t < .16) o.eyes = 'blink';
  // aanloop: even door de knieën
  if(t >= .30 && t < .42){ var a = bump(seg(t, .30, .42)); o.sy = 1 - .05 * a; o.sx = 1 + .03 * a; }
  // omhoog en zweven
  if(t >= .40 && t < .72){
    var u = easeOut(seg(t, .40, .52)), h = seg(t, .52, .72);
    o.wigDy = -25 * u + 2.5 * bump(h);
    o.wigRot = -10 * u + 5 * h;
    o.eyes = 'wide'; o.mouth = 'o';
  }
  // neer
  if(t >= .72 && t < .80){
    var q = easeIn(seg(t, .72, .80));
    o.wigDy = -25 * (1 - q); o.wigRot = -5 * (1 - q);
    o.eyes = 'wide'; o.mouth = 'o';
  }
  // landing: platdrukken, terugveren
  if(t >= .80 && t < .97){
    var sq = bump(seg(t, .80, .86)), st = bump(seg(t, .86, .93));
    o.sy = 1 - .10 * sq + .04 * st;
    o.sx = 1 + .07 * sq - .025 * st;
    o.eyes = 'happy'; o.mouth = t < .92 ? 'grin' : 'smile'; o.blush = true;
  }
  var s = monk(k, o);
  var sp = seg(t, .46, .66);
  if(sp > 0 && sp < 1) s += star(k, 56 - 16, 61 - 29, 12 * bump(sp), C.white);
  return s;
}

/* bmiestHeal -- Holy en Mistweaver tegelijk: ogen dicht, handen gevouwen,
   witte en jade kruisjes die opstijgen. */
function drawHeal(k, t){
  var s = monk(k, { cy:56 - 1.6 * Math.sin(TAU * t), robe:true, hands:'pray',
                    eyes:'closed', mouth:'smile', blush:true });
  var CR = [
    { x:13, ph:0,   r:8.5, col:C.jade  },
    { x:97, ph:.25, r:7.5, col:C.paper },
    { x:19, ph:.5,  r:7,   col:C.paper },
    { x:93, ph:.75, r:8.5, col:C.jade  }
  ];
  CR.forEach(function(c){
    var p = (t + c.ph) % 1;
    var sc = p < .14 ? back(p / .14) : p > .8 ? 1 - easeIn((p - .8) / .2) : 1;
    if(sc > .03) s += plus(k, c.x + 2 * Math.sin(TAU * p + c.ph * 6), lerp(98, 9, p), c.r * sc, c.col);
  });
  if(k.D){
    s += star(k, 33, 16, 5.5 * Math.pow(Math.max(0, Math.sin(TAU * t)), 3), C.jadeHi);
    s += star(k, 82, 12, 5 * Math.pow(Math.max(0, Math.sin(TAU * (t + .5))), 3), C.white);
  }
  return s;
}

/* bmiestKill -- boss down. Twee sprongen per lus en vuurwerk erachter, in
   de drie accenten van de overlay. */
function drawKill(k, t){
  /* Op 28 is een straal meer een stip dan een lijn, dus minder en dikkere. */
  var n = k.D ? 8 : 6;
  var B = [
    { x:22, y:24, col:C.jade,  ph:.72, n:n, R:19, rot:0   },
    { x:90, y:22, col:C.gold,  ph:.38, n:n, R:18, rot:.06 },
    { x:56, y:14, col:C.paper, ph:.05, n:n, R:13, rot:.03 }
  ];
  var s = '', life = .75;
  B.forEach(function(b){ s += burst(k, b.x, b.y, ((t - b.ph + 1) % 1) / life, b.col, b.n, b.R, b.rot); });
  var c = Math.abs(Math.cos(TAU * t * 2)), g = c < .3 ? 1 - c / .3 : 0;
  s += monk(k, { cy:68 - 6 * c, sc:.84, robe:true, eyes:'happy', mouth:'open', blush:true,
                 sy:1 - .08 * g, sx:1 + .05 * g });
  return s;
}

/* Geestje boven het lijk: bol hoofd, golvende zoom, gouden halo. */
function ghost(k, x, y, t, rot){
  var b = 15, wv = TAU * t * 2, d = 'M' + P(-b, 0) + 'C' + P(-b, -18) + ' ' + P(b, -18) + ' ' + P(b, 0) + 'L' + P(b, 14);
  for(var j = 0; j < 3; j++){
    var x0 = b - j * 10;
    d += 'Q' + P(x0 - 5, 20.5 + 2.5 * Math.sin(wv + j * 2.1)) + ' ' + P(x0 - 10, 14);
  }
  d += 'Z';
  var s = '<g transform="translate(' + P(x, y) + ') rotate(' + r2(rot) + ')">';
  s += oLine(k, 'M-10 -21.5A10 3.4 0 1 0 10 -21.5A10 3.4 0 1 0 -10 -21.5', C.gold, k.D ? 3 : 3.6);
  s += '<path d="' + d + '" fill="' + C.paper + '"' + ol(k) + '/>';
  if(k.D) s += '<path d="M9 -8C11 -4 11 4 10 12" fill="none" stroke="' + C.paperDim + '" stroke-width="2.6" stroke-linecap="round"/>';
  s += '<g transform="scale(' + k.k + ')"><circle cx="-5" cy="-1" r="2.3" fill="' + INK + '"/>' +
       '<circle cx="5" cy="-1" r="2.3" fill="' + INK + '"/>' +
       '<ellipse cx="0" cy="6" rx="2" ry="2.6" fill="' + C.mouth + '"/></g>';
  return s + '</g>';
}

/* bmiestWipe -- de raid ligt erbij. X-ogen, tong eruit, en de geest zweeft
   er met een halo boven: een knipoog naar Spirit of Redemption. */
function drawWipe(k, t){
  var s = monk(k, { cx:45, cy:66, sc:.86, rot:-9, robe:true, eyes:'x', mouth:'tongue' });
  s += ghost(k, 84 + 2.5 * Math.sin(TAU * t), 29 + 3.2 * Math.sin(TAU * t * 2), t, 5 * Math.sin(TAU * t));
  return s;
}

/* stoom: een golvende draad die wegdrijft naar rechts. amt 0..1 is hoe ver
   hij uit de kom komt. */
function steam(k, x0, y0, len, t, ph, amt){
  if(amt < .04) return '';
  var L = len * amt, d = '';
  for(var i = 0; i <= 14; i++){
    var u = i / 14, y = y0 - u * L;
    var x = x0 + u * L * .2 + (1.2 + 3.6 * u) * Math.sin(TAU * (u * 1.5 - t * 2) + ph);
    d += (i ? 'L' : 'M') + P(x, y);
  }
  return oLine(k, d, C.jadeHi, k.D ? 3.4 : 4.4);
}

/* kom zonder oor, jade met een witte rand en amberkleurige thee */
function cup(k, x, y, rot){
  var s = '<g transform="translate(' + P(x, y) + ') rotate(' + r2(rot) + ')">';
  s += '<path d="M-15 0C-15 14 -8 20 0 20C8 20 15 14 15 0Z" fill="' + C.jade + '"' + ol(k) + '/>';
  if(k.D) s += '<path d="M-13.6 7.5C-8 10 8 10 13.6 7.5" fill="none" stroke="' + C.jadeDeep + '" stroke-width="2.2"/>';
  s += '<ellipse rx="15" ry="4.6" fill="' + C.paper + '"' + ol(k, .8) + '/>' +
       '<ellipse cy=".6" rx="11" ry="2.8" fill="' + C.tea + '"/>';
  s += '<ellipse cx="-15" cy="9" rx="6" ry="7" fill="' + C.skin + '"' + ol(k) + '/>' +
       '<ellipse cx="15" cy="9" rx="6" ry="7" fill="' + C.skin + '"' + ol(k) + '/>';
  return s + '</g>';
}

/* bmiestTea -- Thunder Focus Tea, of gewoon thee. Rustig stomen, slurp,
   en een tevreden ahh. */
function drawTea(k, t){
  var o = { cx:46, robe:true, eyes:'closed', mouth:'smile', blush:true };
  var lift = easeOut(seg(t, .40, .52)) * (1 - easeIn(seg(t, .72, .84)));
  if(t >= .52 && t < .74){ o.eyes = 'tight'; o.mouth = 'o'; }
  if(t >= .84 && t < .97){ o.eyes = 'happy'; o.mouth = 'ahh'; }
  var amt = 1 - seg(t, .40, .46) + seg(t, .84, 1);
  var cx = lerp(84, 66, lift), cy = lerp(90, 76, lift), rot = -28 * lift;
  if(t >= .52 && t < .72) rot -= 3 * Math.sin(TAU * seg(t, .52, .72) * 2);
  var s = monk(k, o);
  s += steam(k, 80, 86, 50, t, 0, Math.min(1, amt)) + steam(k, 89, 87, 40, t, 2.4, Math.min(1, amt));
  s += cup(k, cx, cy, rot);
  return s;
}

/* =====================================================================
   DE STATISCHE SET  --  volgers, Tier 1, Tier 2/3 en de bits-trappen

   Eén frame per emote. Dezelfde monnik en dezelfde regels, met één verschil:
   een PNG mag wel halve transparantie, dus de bel van bmiestShield is echt
   doorschijnend. Op Twitch' donkere chat wordt dat een jade waas, op de
   lichte een mintgroene.
   ===================================================================== */

/* want: duim en vingers in één vorm, vingers omhoog. flip spiegelt hem. */
function mitten(k, x, y, rot, flip){
  return '<g transform="translate(' + P(x, y) + ') rotate(' + r2(rot || 0) + ')' + (flip ? ' scale(-1 1)' : '') + '">' +
    '<ellipse cx="-7.5" cy="1.5" rx="3.8" ry="6.2" transform="rotate(-28 -7.5 1.5)" fill="' + C.skin + '"' + ol(k) + '/>' +
    '<path d="M-6 9C-7.5 0 -7 -10 -2.5 -11.5C2 -13 6.5 -10.5 7 -5L7.5 9C7.5 12.5 -6 12.5 -6 9Z" fill="' + C.skin + '"' + ol(k) + '/>' +
    (k.D ? '<path d="M-1.2 -11.2V-5M3 -10.6V-5" stroke="' + C.skinSh + '" stroke-width="1.6" stroke-linecap="round"/>' : '') +
  '</g>';
}

/* vingertoppen over een rand: wie meekijkt van achter de kaart */
function grip(k, x, y){
  return '<ellipse cx="' + r2(x) + '" cy="' + r2(y) + '" rx="9" ry="5.5" fill="' + C.skin + '"' + ol(k) + '/>' +
    (k.D ? '<path d="M' + P(x - 3, y + .5) + 'V' + r2(y + 5) + 'M' + P(x + 3, y + .5) + 'V' + r2(y + 5) +
           '" stroke="' + C.skinSh + '" stroke-width="1.6" stroke-linecap="round"/>' : '');
}

/* de edelsteen van de cheer-glyph in js/ribbon.js, met een lichter bovenvlak */
function gem(k, x, y, sc, col, hi){
  return '<g transform="translate(' + P(x, y) + ') scale(' + sc + ')">' +
    '<path d="M-11 -4L-5.5 -11H5.5L11 -4L0 11Z" fill="' + col + '"' + ol(k, 1 / sc) + '/>' +
    '<path d="M-5.5 -11H5.5L11 -4H-11Z" fill="' + hi + '"/>' +
    (k.D ? '<path d="M-11 -4H11M-5.5 -11L-2.5 -4L0 11L2.5 -4L5.5 -11" fill="none" stroke="' + INK +
           '" stroke-width="' + r2(1.3 / sc) + '" stroke-linejoin="round"/>' : '') +
  '</g>';
}

function heart(k, x, y, sc, col){
  var d = 'M' + P(x, y + 8 * sc) + 'C' + P(x - 14 * sc, y - 2 * sc) + ' ' + P(x - 10 * sc, y - 14 * sc) + ' ' + P(x, y - 7 * sc) +
          'C' + P(x + 10 * sc, y - 14 * sc) + ' ' + P(x + 14 * sc, y - 2 * sc) + ' ' + P(x, y + 8 * sc) + 'Z';
  return '<path d="' + d + '" fill="' + col + '"' + ol(k) + '/>';
}

/* halo en kroon staan in hoofdcoördinaten: ze gaan via o.over mee */
function halo(k, y){
  return oLine(k, 'M-19 ' + y + 'A19 5.5 0 1 0 19 ' + y + 'A19 5.5 0 1 0 -19 ' + y, C.gold, k.D ? 4.2 : 5.4);
}
function crown(k){
  var s = '<path d="M-20 -31L-23 -51L-11 -41L0 -56L11 -41L23 -51L20 -31Q0 -43 -20 -31Z" fill="' + C.gold + '"' + ol(k) + '/>';
  s += gem(k, 0, -45, .5, C.jade, C.jadeHi);
  if(k.D) [[-23, -51], [0, -56], [23, -51]].forEach(function(p){
    s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="' + C.white + '"' + ol(k, .6) + '/>';
  });
  return s;
}

/* vleugels van Spirit of Redemption, in lokale coördinaten achter de pij */
var WING = 'M24 38C30 14 46 -8 62 -32C68 -12 66 8 58 22Q62 30 52 33Q56 42 44 44Q46 52 32 50Z';
function wings(k){
  var w = '<path d="' + WING + '" fill="' + C.paper + '"' + ol(k) + '/>' +
    (k.D ? '<path d="M38 30Q48 12 57 -14M44 38Q52 26 57 12" fill="none" stroke="' + C.paperDim +
           '" stroke-width="2.2" stroke-linecap="round"/>' : '');
  return w + '<g transform="scale(-1 1)">' + w + '</g>';
}

/* de kaart uit de onderbalk: schuine hoek linksboven, jade rand */
function card(k){
  return '<path d="M15 72H108V118H4V83Z" fill="' + C.slate + '"' + ol(k) + '/>' +
         '<path d="M15 72H108V79H8Z" fill="' + C.jade + '"/>';
}

/* een ribbon met de schuine kop, als spandoek */
function banner(k, y0, y1){
  return '<path d="M4 ' + y0 + 'H108L' + r2(108 - (y1 - y0) * .3) + ' ' + y1 + 'H4Z" fill="' + C.jade + '"' + ol(k) + '/>';
}
/* een G als lijn, zodat er geen lettertype geladen hoeft te worden */
function letterG(k, x, y, r, w){
  var a = -50 * Math.PI / 180;
  var d = 'M' + P(x + r * Math.cos(a), y + r * Math.sin(a)) + 'A' + r + ' ' + r + ' 0 1 0 ' +
          P(x + r, y + r * .2) + 'V' + r2(y) + 'H' + r2(x + r * .15);
  return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + r2(w) +
         '" stroke-linecap="round" stroke-linejoin="round"/>';
}

/* de vakjes van het subdoel in de bovenbalk, n stuks waarvan 'vol' gevuld */
function boxes(k, x, y, n, vol, w, h, gap){
  var s = '';
  for(var i = 0; i < n; i++){
    var bx = x + i * (w + gap);
    s += '<path d="M' + P(bx, y) + 'H' + r2(bx + w) + 'L' + P(bx + w - h * .25, y + h) + 'H' + r2(bx) +
         'Z" fill="' + (i < vol ? C.jade : C.slate) + '"' + ol(k) + '/>';
  }
  return s;
}

function drop(k, x, y, sc, col){
  return '<path transform="translate(' + P(x, y) + ') scale(' + sc + ')" ' +
         'd="M0 -8C3.5 -3 5.5 0 5.5 2.5A5.5 5.5 0 0 1 -5.5 2.5C-5.5 0 -3.5 -3 0 -8Z" fill="' + col + '"' + ol(k, 1 / sc) + '/>';
}

function question(k, x, y, col){
  // op 28 een kwart groter, anders is het een komma
  if(!k.D) return '<g transform="translate(' + P(x, y) + ') scale(1.25) translate(' + P(-x, -y) + ')">' +
                  question({ L:k.L / 1.25, D:true, line:k.line }, x, y, col) + '</g>';
  return oLine(k, 'M' + P(x - 5.5, y - 6) + 'C' + P(x - 5.5, y - 12.5) + ' ' + P(x + 5.5, y - 12.5) + ' ' + P(x + 5.5, y - 5.5) +
               'C' + P(x + 5.5, y - 1) + ' ' + P(x, y - .5) + ' ' + P(x, y + 4.5), col, k.D ? 4.6 : 5.6) +
         '<circle cx="' + r2(x) + '" cy="' + r2(y + 11) + '" r="' + (k.D ? 3 : 3.6) + '" fill="' + col + '"' + ol(k) + '/>';
}

/* naamplaatje boven het hoofd, mana bijna op */
function manabar(k){
  return '<path d="M22 6H92L88.5 16H22Z" fill="' + C.slate + '"' + ol(k) + '/>' +
         '<path d="M22 6H29.5V16H22Z" fill="' + C.mana + '"/>';
}

/* Power Word: Shield. Het id moet uniek zijn: het voorbeeld zet tientallen
   SVG's in één document, en clip-path zoekt in het hele document. */
var UID = 0;
function shield(k, inner){
  var id = 'emclip' + (++UID), r = 49;
  return '<clipPath id="' + id + '"><circle cx="56" cy="56" r="' + r + '"/></clipPath>' +
    '<circle cx="56" cy="56" r="' + r + '" fill="' + C.bubble + '"/>' +
    '<g clip-path="url(#' + id + ')">' + inner + '</g>' +
    oLine(k, 'M7 56A49 49 0 1 0 105 56A49 49 0 1 0 7 56', C.jade, k.D ? 3.6 : 4.4) +
    '<path d="M20 34A42 42 0 0 1 43 13" fill="none" stroke="' + C.white + '" stroke-width="' +
    (k.D ? 4.4 : 5.4) + '" stroke-linecap="round"/>';
}

/* ---- volgers --------------------------------------------------------- */
function drawHi(k){
  var front = oLine(k, 'M38 50Q58 42 54 6', C.jade, 12) + mitten(k, 54, -4, 8) +
              (k.D ? inkLine(k, 'M67 -17Q70 -10 67 -3M73 -21Q78 -10 73 1', .75) : '');
  return monk(k, { cx:46, cy:58, sc:.9, eyes:'happy', mouth:'grin', blush:true, front:front });
}
function drawLurk(k){
  return monk(k, { cx:56, cy:52, robe:false, eyes:'open', look:[2.4, 0], mouth:'flat' }) +
         card(k) + grip(k, 31, 73) + grip(k, 81, 73);
}
function drawGG(k){
  var w = k.D ? 6.4 : 7.6;
  return monk(k, { cx:56, cy:44, sc:.88, robe:false, eyes:'happy', mouth:'grin', blush:true }) +
         banner(k, 70, 106) + letterG(k, 39, 88, 10.5, w) + letterG(k, 69, 88, 10.5, w);
}
function drawLove(k){
  var front = heart(k, 0, 47, 1.55, C.jade) +
              (k.D ? '<ellipse cx="-9" cy="38" rx="4" ry="2.4" transform="rotate(-35 -9 38)" fill="' + C.jadeHi + '"/>' : '') +
              mitten(k, -20, 50, -38) + mitten(k, 20, 50, 38, true);
  var s = monk(k, { cx:56, cy:52, eyes:'happy', mouth:'smile', blush:true, front:front });
  if(k.D) s += heart(k, 96, 17, .55, C.rose) + heart(k, 15, 26, .4, C.rose);
  return s;
}
/* "super average mythic raiding": half dichte ogen en precies half vol */
function drawAverage(k){
  return monk(k, { cx:56, cy:52, eyes:'half', mouth:'flat' }) + boxes(k, 13, 88, 4, 2, 19, 15, 5);
}

/* ---- Tier 1 ----------------------------------------------------------- */
function drawShield(k){
  return shield(k, monk(k, { cx:56, cy:60, sc:.8, eyes:'happy', mouth:'smug', blush:true }));
}
function drawOom(k){
  return monk(k, { cx:56, cy:62, eyes:'tired', mouth:'pant', over:drop(k, 30, 2, 1.25, C.tear) }) + manabar(k);
}
function drawPog(k){
  var front = mitten(k, -33, 26, 20) + mitten(k, 33, 26, -20, true);
  return monk(k, { cx:56, cy:56, eyes:'big', mouth:'pog', blush:true, front:front });
}
function drawHmm(k){
  var front = oLine(k, 'M30 64L18 46', C.jade, 12) + mitten(k, 16, 40, -18);
  return monk(k, { cx:48, cy:60, eyes:'open', look:[-1.8, -2.2], mouth:'slant', front:front }) +
         question(k, 98, 18, C.jade);
}
function drawCry(k){
  var w = k.D ? 4.6 : 5.6;
  var over = oLine(k, 'M-15 13C-16 20 -19 27 -17 37', C.tear, w) + oLine(k, 'M15 13C16 20 19 27 17 37', C.tear, w) +
             (k.D ? drop(k, -47, -2, .8, C.tear) + drop(k, 47, -2, .8, C.tear) : '');
  return monk(k, { cx:56, cy:56, eyes:'tight', mouth:'wail', over:over });
}

/* ---- Tier 2 en 3: van priester naar engel ---------------------------- */
function drawHalo(k){
  var s = monk(k, { cx:56, cy:60, robeCol:C.paper, collarCol:C.gold, hands:'pray',
                    eyes:'closed', mouth:'smile', blush:true, over:halo(k, -47) });
  s += star(k, 16, 30, 6, C.gold) + star(k, 97, 22, 5, C.gold);
  if(k.D) s += star(k, 92, 50, 3.4, C.white);
  return s;
}
function drawAngel(k){
  return monk(k, { cx:56, cy:62, sc:.82, back:wings(k), robeCol:C.paper, collarCol:C.gold,
                   eyes:'happy', mouth:'smile', blush:true, over:halo(k, -48) }) +
         star(k, 12, 16, 5.5, C.gold) + star(k, 100, 14, 5, C.gold);
}

/* ---- bits: 1K, 5K, 10K ------------------------------------------------ */
function drawGem(k){
  var front = gem(k, 0, 47, 1.35, C.jade, C.jadeHi) + mitten(k, -19, 50, -35) + mitten(k, 19, 50, 35, true) +
              star(k, 14, 32, 5, C.white);
  return monk(k, { cx:56, cy:52, eyes:'big', mouth:'grin', blush:true, front:front });
}
function drawShiny(k){
  var front = gem(k, 0, 50, 1.5, C.jade, C.jadeHi) + mitten(k, -23, 54, -35) + mitten(k, 23, 54, 35, true);
  var s = monk(k, { cx:56, cy:46, eyes:'star', mouth:'open', blush:true, front:front });
  s += star(k, 14, 22, 6.5, C.gold) + star(k, 98, 30, 5.5, C.gold);
  if(k.D) s += star(k, 90, 8, 4, C.white);
  return s;
}
function drawCrown(k){
  var s = monk(k, { cx:56, cy:62, collarCol:C.gold, eyes:'happy', mouth:'smug', blush:true, over:crown(k) });
  s += star(k, 14, 22, 6, C.gold) + star(k, 99, 26, 5, C.gold);
  if(k.D) s += star(k, 22, 50, 3.4, C.white);
  return s;
}

/* ---- kanaalpunten ----------------------------------------------------
   Geen emote, maar dezelfde drie maten en dezelfde regels. Twitch toont hem
   op ongeveer 18 px naast je puntensaldo, dus één silhouet en verder niets:
   een jade munt met een vierkant gat. Een edelsteen zou de bits van Twitch
   zelf zijn, en een gezicht wordt op die maat pap. */
function drawPoints(k){
  var h = k.D ? 13 : 16;                       // halve gatbreedte; op 28 ruimer,
  var a = 56 - h, b = 56 + h;                  // want de inktrand eet hem op
  var d = 'M6 56A50 50 0 1 0 106 56A50 50 0 1 0 6 56Z' +
          'M' + a + ' ' + a + 'H' + b + 'V' + b + 'H' + a + 'Z';
  var s = '<path d="' + d + '" fill="' + C.jade + '" fill-rule="evenodd"' + ol(k) + '/>';
  if(k.D)
    s += '<circle cx="56" cy="56" r="39" fill="none" stroke="' + C.jadeDeep + '" stroke-width="3"/>' +
         '<path d="M' + (a - 7) + ' ' + (a - 7) + 'H' + (b + 7) + 'V' + (b + 7) + 'H' + (a - 7) + 'Z" ' +
         'fill="none" stroke="' + C.jadeDeep + '" stroke-width="3" stroke-linejoin="round"/>';
  s += '<path d="M21 44A37 37 0 0 1 41 20" fill="none" stroke="' + C.white + '" stroke-width="' +
       (k.D ? 6 : 8) + '" stroke-linecap="round"/>';
  return s;
}

/* slot = waar hij bij Twitch heen gaat; frames 1 = statisch, alleen PNG */
var A = 'Tier 1 · animated';
var LIST = [
  { id:'wig',  name:'bmiestWig',  slot:A, frames:48, fps:20, draw:drawWig,
    about:'the sub goal: he tips the wig, the bald crown sparkles, it lands back' },
  { id:'heal', name:'bmiestHeal', slot:A, frames:40, fps:20, draw:drawHeal,
    about:'holy and mistweaver at once: eyes closed, hands together, heals rising' },
  { id:'kill', name:'bmiestKill', slot:A, frames:40, fps:20, draw:drawKill,
    about:'boss down: two hops and fireworks in jade, gold and white' },
  { id:'wipe', name:'bmiestWipe', slot:A, frames:48, fps:20, draw:drawWipe,
    about:'wipe: x-eyes, tongue out, and his ghost floats up with a halo' },
  { id:'tea',  name:'bmiestTea',  slot:A, frames:56, fps:20, draw:drawTea,
    about:'tea: steam drifting, a sip, a happy ahh' },

  { id:'hi',      name:'bmiestHi',      slot:'Follower', frames:1, fps:1, draw:drawHi,      about:'a wave' },
  { id:'lurk',    name:'bmiestLurk',    slot:'Follower', frames:1, fps:1, draw:drawLurk,    about:'peeking over a card from the bottom bar' },
  { id:'gg',      name:'bmiestGG',      slot:'Follower', frames:1, fps:1, draw:drawGG,      about:'GG on a ribbon' },
  { id:'love',    name:'bmiestLove',    slot:'Follower', frames:1, fps:1, draw:drawLove,    about:'holding a jade heart' },
  { id:'average', name:'bmiestAverage', slot:'Follower', frames:1, fps:1, draw:drawAverage, about:'super average: half-lidded, two of four boxes' },

  { id:'shield', name:'bmiestShield', slot:'Tier 1', frames:1, fps:1, draw:drawShield, about:'smug inside Power Word: Shield' },
  { id:'oom',    name:'bmiestOom',    slot:'Tier 1', frames:1, fps:1, draw:drawOom,    about:'out of mana: empty nameplate, sweat, panting' },
  { id:'pog',    name:'bmiestPog',    slot:'Tier 1', frames:1, fps:1, draw:drawPog,    about:'hands on cheeks, big eyes' },
  { id:'hmm',    name:'bmiestHmm',    slot:'Tier 1', frames:1, fps:1, draw:drawHmm,    about:'hand on chin, looking up, a question mark' },
  { id:'cry',    name:'bmiestCry',    slot:'Tier 1', frames:1, fps:1, draw:drawCry,    about:'bawling, tears streaming' },

  { id:'halo',  name:'bmiestHalo',  slot:'Tier 2', frames:1, fps:1, draw:drawHalo,  about:'holy priest: white robe, gold collar, halo' },
  { id:'angel', name:'bmiestAngel', slot:'Tier 3', frames:1, fps:1, draw:drawAngel, about:'Spirit of Redemption: wings and halo' },

  { id:'gem',   name:'bmiestGem',   slot:'Bits · 1K',  frames:1, fps:1, draw:drawGem,   about:'a jade gem, eyes wide' },
  { id:'shiny', name:'bmiestShiny', slot:'Bits · 5K',  frames:1, fps:1, draw:drawShiny, about:'a bigger gem, star eyes' },
  { id:'crown', name:'bmiestCrown', slot:'Bits · 10K', frames:1, fps:1, draw:drawCrown, about:'a gold crown with a jade stone' },

  // maxKB: Twitch neemt voor het punten-icoon niet meer dan 25 KB per maat
  { id:'points', name:'channel-points', slot:'Channel points', frames:1, fps:1, maxKB:25, draw:drawPoints,
    about:'the points icon: a jade coin with a square hole' }
];

function render(id, t, size){
  var e = LIST.filter(function(x){ return x.id === id; })[0];
  var k = SZ[size] || SZ[112];
  k = { s:size, L:k.L, line:k.line, k:k.k, D:k.D };
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="' + size +
         '" height="' + size + '">' + e.draw(k, t) + '</svg>';
}

root.EMOTES = { list:LIST, render:render, sizes:[112, 56, 28] };
})(typeof window !== 'undefined' ? window : this);

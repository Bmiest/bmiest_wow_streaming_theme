/* Warcraft Logs v2 -- tweede bron voor de raidkaart, naast Raider.IO.

   Waarom naast en niet in plaats van: Raider.IO leidt zijn live-tracking af
   van dezelfde logs, dus hij kan wel achterlopen maar niet vooruit. Op 17
   september 2026 stond Vashnik bij hen op 19 pulls en niet verslagen terwijl
   hun eigen voortgangsregel al 4/8 zei -- WCL had op dat moment 21 pulls en
   de kill. Dat is precies het gat dat deze bron dicht.

   ---- de sleutel -----------------------------------------------------
   v2 praat OAuth. De client-credentials-flow wisselt client id + secret om
   voor een bearer token, en dat token leeft 360 dagen. Het **secret hoort
   hier niet**: dat mint tokens en staat op je eigen machine, buiten deze
   repo. In de pagina komt alleen het token, net als het StreamElements-token
   via ?jwt= -- dus ?wcl=<token> op je browser source, of warcraftlogs.token
   in config.js (die staat in .gitignore).

   Hun API stuurt access-control-allow-origin terug op de Origin die vraagt,
   dus dit werkt rechtstreeks vanuit een browser source. Geen proxy nodig.

   ---- wat we eruit halen ---------------------------------------------
   Een verslag per raidavond, met de fights erin. Eén query levert alles:
   reports(guildID, zoneID) met fights(difficulty) eronder.

   ---- wat het kost ---------------------------------------------------
   Niet "ruim", zoals hier eerst stond. Gemeten op 21 september 2026 via
   rateLimitData, met de query die deze bron echt verstuurt:

       reportLimit 25 -> 14 punten     reportLimit 8 -> 9 punten
       reportLimit 10 -> 11 punten     reportLimit 6 -> 7 punten

   De limiet is 3600 punten per uur, en er pollen *twee* pagina's los van
   elkaar (banner.html en alerts.html). Op reportLimit 25 en elke 30 seconden
   is dat 240 queries per uur = 3360 punten, oftewel 93% van je uurbudget --
   compare.html openzetten tijdens een raid duwt je eroverheen. Dat cijfer van
   8 punten hierboven klopte in september nog wel; het loopt op naarmate er
   verslagen bijkomen, dus het is geen getal om op te vertrouwen.

   Vandaar reportLimit 6: zes raidavonden terug is ruim genoeg voor de
   pullteller van één boss, en het halveert de prijs. Wil je verder terug, zet
   hem hoger en reken het na -- pollSeconds staat op 20, dus 360 queries per
   uur, en 3600 / 360 = 10 punten is je plafond per query.

   Er is nog een knop als je die ooit nodig hebt: `fights` neemt ook een
   encounterID, dus filteren op de huidige boss in plaats van de hele tier
   ophalen. Dat kost een extra ronde om te weten welke boss dat is, dus het is
   hier niet gedaan.

   Let op drie dingen die in de cijfers zitten:

   1. "pulls to kill" loopt over avonden heen, niet over één verslag. WCL's
      eigen tegel zei 21 voor Vashnik terwijl er 7 in het verslag van die
      avond stonden. We tellen dus door alle verslagen van de tier heen, tot
      en met de eerste kill -- daarna niet meer, anders telt een reclear van
      volgende week gewoon door.

   2. Het percentage is `fightPercentage` en niet `bossPercentage`. Dat is
      dezelfde val die js/rio-live.js beschrijft: bossPercentage is
      fase-relatief, dus een pull die P3 haalde staat daar lager op dan een
      pull die in P1 sneuvelde, en dan rangschik je je beste pogingen
      verkeerd. fightPercentage telt de hele fight, net als Raider.IO's
      overall_percent -- en juist omdat de twee bronnen elkaar afwisselen
      moeten ze hetzelfde meten, anders verspringt de betekenis van het getal
      op je stream zonder dat er iets te zien is.

   3. De voortgangssamenvatting (4/8) halen we hier **niet** uit. WCL zet
      Nymrissa Wavecaller in de encounterlijst van zone 53 terwijl dat een
      losse raid is, dus tellen op deze gegevens geeft 5/8 waar iedereen 4/8
      toont. Die regel blijft van Raider.IO komen; zie js/progress.js. */
(function(){
'use strict';
var U = window.U, CFG = (U.CFG.warcraftlogs || {});
var API = 'https://www.warcraftlogs.com/api/v2/client';

/* Token uit de URL gaat voor op de config: zo kan je in OBS per bron iets
   anders instellen zonder het bestand aan te raken. */
var TOKEN = (location.search.match(/[?&]wcl=([^&]+)/) || [])[1] || CFG.token || '';
if (TOKEN) TOKEN = decodeURIComponent(TOKEN);

/* Difficulty is bij WCL een getal. 5 is mythic, 4 heroic, 3 normal -- het
   is dezelfde schaal die Blizzard gebruikt. */
var DIFF = { mythic: 5, heroic: 4, normal: 3 };

function available(){ return !!(TOKEN && CFG.guildId && CFG.zoneId); }

var QUERY =
  'query($g:Int!,$z:Int!,$d:Int!,$n:Int!){' +
    'reportData{reports(guildID:$g,zoneID:$z,limit:$n){data{' +
      'code startTime ' +
      'fights(difficulty:$d){' +
        'name encounterID kill bossPercentage fightPercentage ' +
        'lastPhase lastPhaseIsIntermission startTime endTime inProgress' +
      '}' +
    '}}}' +
  '}';

function gql(vars){
  return fetch(API, {
    method : 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN,
               'Content-Type' : 'application/json' },
    body   : JSON.stringify({ query: QUERY, variables: vars })
  }).then(function(r){
    if(!r.ok) throw new Error('wcl http ' + r.status);
    return r.json();
  }).then(function(d){
    if(d.errors && d.errors.length) throw new Error(d.errors[0].message || 'wcl error');
    return d.data;
  });
}

/* 'P3', of 'INT' in een tussenfase, en niets bij een boss zonder fases
   (lastPhase is dan 0, en "P0" is geen fase). Dezelfde vorm als phase_label
   uit Raider.IO's pulls, en dat is de bedoeling: js/banner.js en js/alerts.js
   lezen `pull.phase` zonder te weten welke bron eronder zat, dus stond hier
   het kale getal, dan zette de schermvullende melding "3" neer waar bij
   Raider.IO "P3" staat. */
function phaseLabel(n, interm){
  return n ? (interm ? 'INT' : 'P' + n) : '';
}

/* Alle fights van de tier op één tijdlijn. WCL geeft fight.startTime als
   milliseconden binnen het verslag, dus pas opgeteld bij report.startTime is
   het een tijdstip waarop je kan sorteren en vergelijken. */
function timeline(reports){
  var out = [];
  (reports || []).forEach(function(r){
    (r.fights || []).forEach(function(f){
      out.push({
        enc      : f.encounterID,
        name     : f.name,
        kill     : !!f.kill,
        /* fightPercentage, met bossPercentage als vangnet: zie punt 2 in de
           kop. Ze zijn gelijk op een boss van één fase -- op Sszorak stond
           elke pull van 20 september op precies hetzelfde getal -- dus het
           verschil zie je pas op een boss met fases, en dan zie je het meteen
           verkeerd. */
        pct      : f.fightPercentage != null ? f.fightPercentage : f.bossPercentage,
        phase    : phaseLabel(f.lastPhase, f.lastPhaseIsIntermission),
        /* De duur van de poging. js/alerts.js zet hem als eigen tegel in de
           schermvullende melding en las hem tot nu toe alleen uit Raider.IO's
           pulls, dus toen WCL de hoofdbron werd verdween die tegel stilletjes.
           Hier is hij gratis: start en eind staan er allebei al.

           Het aantal doden komt niet mee. ReportFight heeft geen veld
           daarvoor -- dat zijn losse events, een query per fight -- en dat is
           die tegel niet waard. */
        seconds  : Math.round((f.endTime - f.startTime) / 1000),
        running  : !!f.inProgress,
        at       : r.startTime + f.startTime,
        ended    : r.startTime + f.endTime,
        code     : r.code
      });
    });
  });
  out.sort(function(a,b){ return a.at - b.at; });
  return out;
}

function load(){
  if(!available()) return Promise.resolve(null);
  var diff = DIFF[(CFG.difficulty || 'mythic')] || 5;

  return gql({ g: +CFG.guildId, z: +CFG.zoneId, d: diff,
               n: CFG.reportLimit || 25 }).then(function(d){
    var all = timeline(((d.reportData || {}).reports || {}).data);
    if(!all.length) return null;

    /* De boss waar je nu op zit is die van de laatste pull. Niet de laatste
       ongekillde: na een kill hoort de kaart die kill te laten zien, net
       zoals de melding dat doet. */
    var cur  = all[all.length - 1];
    var same = all.filter(function(f){ return f.enc === cur.enc; });

    /* Tellen tot en met de eerste kill. Zonder die grens telt elke reclear
       er vrolijk bij op en staat er over een maand 60 pulls boven een boss
       die je in 21 hebt gelegd. */
    var first = -1;
    for(var i = 0; i < same.length; i++){ if(same[i].kill){ first = i; break; } }
    var upto  = first >= 0 ? same.slice(0, first + 1) : same;

    /* De fase van de beste poging komt mee, want de kaart zet hem achter het
       percentage ("best of 43 pulls · P2") en de melding als eigen tegel.
       Zonder dit veld bleef dat leeg zodra WCL de kaart vulde. */
    /* Kills tellen niet mee, net als in js/rio-live.js. WCL zet een kill op
       bossPercentage 0.01 (nagerekend op alle tien de kills in de verslagen
       van deze tier), dus zonder die uitzondering zakt de beste poging na een
       kill naar 0.01% met de fase van de kill erbij -- en dan meldt
       compare.html een verschil tussen de bronnen dat alleen maar een
       verschil in definitie is. */
    var best = null, bestPhase = '';
    upto.forEach(function(f){
      if(!f.kill && f.pct != null && (best === null || f.pct < best)){
        best = f.pct; bestPhase = f.phase;
      }
    });

    /* `upto` kan niet leeg zijn: all.length is hierboven gecontroleerd, cur
       zit per definitie in same, en upto is same of een slice die tot en met
       cur loopt. Vandaar geen `last &&` meer hieronder. */
    var last = upto[upto.length - 1];

    return {
      source    : 'warcraftlogs',
      guild     : CFG.guildName || '',
      raidName  : CFG.zoneName  || '',
      difficulty: CFG.difficulty || 'mythic',
      bossName  : cur.name,
      encounter : cur.enc,
      pullCount : upto.length,
      bestPct   : best,
      bestPhase : bestPhase,
      phase     : last.phase,
      defeated  : first >= 0,
      running   : last.running,
      updated   : last.ended,
      pulls     : upto,
      /* Bewust geen summary: zie de kop van dit bestand. */
      summary   : ''
    };
  });
}

window.WCL = { load: load, available: available };
})();

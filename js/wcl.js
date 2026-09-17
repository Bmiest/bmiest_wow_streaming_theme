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
   reports(guildID, zoneID) met fights(difficulty) eronder. Kostte gemeten
   8 punten van de 3600 per uur, dus pollen op dezelfde klok als de rest kan
   ruim.

   Let op twee dingen die in de cijfers zitten:

   1. "pulls to kill" loopt over avonden heen, niet over één verslag. WCL's
      eigen tegel zei 21 voor Vashnik terwijl er 7 in het verslag van die
      avond stonden. We tellen dus door alle verslagen van de tier heen, tot
      en met de eerste kill -- daarna niet meer, anders telt een reclear van
      volgende week gewoon door.

   2. De voortgangssamenvatting (4/8) halen we hier **niet** uit. WCL zet
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
        'id name encounterID kill bossPercentage fightPercentage ' +
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
        pct      : f.bossPercentage,
        phase    : f.lastPhase,
        interm   : !!f.lastPhaseIsIntermission,
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

    var best = null;
    upto.forEach(function(f){
      if(f.pct != null && (best === null || f.pct < best)) best = f.pct;
    });

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
      /* lastPhase is 0 bij een boss zonder fases; dan liever niets tonen dan
         "P0". Een intermission krijgt een eigen label, want "P3" terwijl je
         in de tussenfase staat klopt niet. */
      phase     : last && last.phase ? (last.interm ? 'INT' : 'P' + last.phase) : '',
      defeated  : first >= 0,
      running   : !!(last && last.running),
      updated   : last ? last.ended : null,
      pulls     : upto,
      /* Bewust geen summary: zie de kop van dit bestand. */
      summary   : ''
    };
  });
}

window.WCL = { load: load, available: available };
})();

/* Raider.IO live-tracking.
   Deze endpoints staan in hun swagger (raider.io/swagger.json) als
   /api/v1/live-tracking/guild/boss-progress en .../guild/boss-pulls. Eerder
   riep dit bestand /bossprogress en /bosspulls aan, afgeleid uit de
   netwerkcalls van hun eigen widget. Dat gaf byte voor byte hetzelfde
   antwoord, maar hun Acceptable Use zegt "automated scraping beyond the
   published endpoints is prohibited" -- dus gebruiken we de gepubliceerde
   naam, en niet die ene die toevallig ook werkt.

   Alles faalt stil: gaat het endpoint stuk, dan verdwijnt het blok en
   draait de rest van de banner door.

   CORS staat open (de server spiegelt je Origin) en de responses hebben
   cache-control max-age=10, dus pollen is goedkoop. */
(function(){
'use strict';
var U = window.U;
var CFG  = U.CFG.raiderio || {};
var LT   = CFG.liveTracking || {};
var BASE = 'https://raider.io/api/v1/live-tracking';
var CDN  = 'https://cdn.raiderio.net';

function params(){
  var g = CFG.guild || {};
  return 'raid='       + encodeURIComponent(LT.raid || 'latest')
       + '&difficulty='+ encodeURIComponent(LT.difficulty || 'mythic')
       + '&boss=latest'
       + '&period='    + encodeURIComponent(LT.period || 'until_kill')
       + '&region='    + encodeURIComponent(CFG.region || 'eu')
       + '&realm='     + encodeURIComponent(U.slug(g.realm || ''))
       + '&guild='     + encodeURIComponent(g.name || '');
}

function img(path){ return path ? CDN + path : ''; }

/* Welke difficulty is er nu eigenlijk aan de gang? De hoogste waarop al
   iets ligt -- anders staat er "0/8 Mythic" terwijl je heroic clearet. */
function activeTier(p){
  if(p.mythicBossesKilled > 0) return {key:'m', label:'M',  killed:p.mythicBossesKilled};
  if(p.heroicBossesKilled > 0) return {key:'h', label:'HC', killed:p.heroicBossesKilled};
  return {key:'n', label:'N', killed:p.normalBossesKilled || 0};
}

function load(){
  if(LT.enabled === false) return Promise.resolve(null);
  var q = params();

  return Promise.all([
    U.getJSON(BASE + '/guild/boss-progress?' + q, 9000),
    U.getJSON(BASE + '/guild/boss-pulls?'    + q, 9000).catch(function(){ return null; })
  ]).then(function(r){
    var d = r[0], pr = d.overallProgress || {};
    if(d.error) throw new Error(d.error);

    /* overall_percent, niet boss_percent. Dat laatste is fase-relatief:
       een pull die P3 haalde staat op boss_percent 0.49 terwijl overall
       0.12 is, en een pull die in P1 sneuvelde op 0.60 zou er dan beter
       uitzien. overall_percent telt de hele fight. */
    var pulls = ((r[1] && r[1].pulls) || []).map(function(p){
      var x = p.details || {}, h = x.encounter_health || {};
      return {
        pct    : (h.overall_percent || 0) * 100,
        phase  : h.phase_label || '',
        kill   : !!x.is_success,
        seconds: Math.round((x.duration_ms || 0) / 1000),
        deaths : x.num_deaths || 0
      };
    });

    // Beste poging = laagste overall-percentage van de niet-geslaagde pulls.
    var best = null, bestPhase = '';
    pulls.forEach(function(p){
      if(!p.kill && (best === null || p.pct < best)){ best = p.pct; bestPhase = p.phase; }
    });
    /* d.bestPercent is al een percentage (12.22 = 12,22%), geen fractie.
       De server is gezaghebbend, maar de fase komt uit onze eigen pulls --
       laat die vallen als hij niet bij het servergetal hoort. */
    if(d.bestPercent != null && d.bestPercent > 0){
      if(best === null || Math.abs(best - d.bestPercent) > 0.5) bestPhase = '';
      best = d.bestPercent;
    }

    return {
      guild     : d.guild ? d.guild.name : '',
      raidName  : d.raid  ? d.raid.name  : '',
      raidSlug  : d.raid  ? d.raid.slug  : '',
      difficulty: d.raid  ? d.raid.difficulty : '',
      bossName  : d.boss  ? d.boss.name  : '',
      bossImg   : img(d.boss && (d.boss.portraitUrl || d.boss.iconUrl)),
      summary   : pr.summary || '',
      total     : pr.totalBosses || 0,
      normal    : pr.normalBossesKilled || 0,
      heroic    : pr.heroicBossesKilled || 0,
      mythic    : pr.mythicBossesKilled || 0,
      tier      : activeTier(pr),
      pullCount : d.pullCount || pulls.length,
      bestPct   : best,
      bestPhase : bestPhase,
      phase     : d.phase_label || '',
      defeated  : !!d.isDefeated,
      pulls     : pulls
    };
  });
}

/* Welke tier is de huidige? raid_progression geeft dat niet weg -- de
   laatste sleutel is soms een tier die nog niet loopt. Live-tracking weet
   het wel.

   Bewust difficulty=mythic, ook als de kaart zelf op 'latest' staat:
   'latest' betekent bij Raider.IO "waar het laatst iets gebeurde", en dat
   sleept eenbaas-raids mee (Kelderklasse stond zo op 1/1 Heroic in de
   Tidebound Grotto). Met mythic komt de hoofdtier eruit, en dat is wat er
   in de characterkaart hoort. */
function currentRaid(){
  if(LT.enabled === false) return Promise.resolve(null);
  var g = CFG.guild || {};
  var q = 'raid=' + encodeURIComponent(LT.raid || 'latest')
        + '&difficulty=mythic&boss=latest&period=until_kill'
        + '&region=' + encodeURIComponent(CFG.region || 'eu')
        + '&realm='  + encodeURIComponent(U.slug(g.realm || ''))
        + '&guild='  + encodeURIComponent(g.name || '');
  return U.getJSON(BASE + '/guild/boss-progress?' + q, 9000).then(function(d){
    return (d.raid && d.raid.slug) || null;
  });
}

/* Wat is er sinds de vorige stand veranderd? Dat hoort bij deze bron en niet
   bij één weergave: de onderbalk en de alerts willen het allebei weten, elk
   in hun eigen pagina. Vandaar een fabriek -- elke aanroeper houdt zijn eigen
   stand bij.

   Op de eerste aanroep meldt hij niets, anders kondigt de overlay bij het
   opstarten van OBS een pull van een uur geleden aan. Bij een andere boss
   begint hij opnieuw, anders leest de lagere pullcount van een verse boss als
   een verbetering. */
function watcher(){
  var seen = { boss:null, pulls:null, best:null, down:false };
  return function(L){
    if(!L) return { fresh:false, better:false, down:false };
    var n = L.pullCount || 0;
    if(L.bossName !== seen.boss){
      seen = { boss:L.bossName, pulls:n, best:L.bestPct, down:!!L.defeated };
      return { fresh:false, better:false, down:false };
    }
    var out = {
      fresh : seen.pulls != null && n > seen.pulls,
      /* Een lager percentage is beter: dat is boss-HP dat nog overstond. */
      better: seen.best != null && L.bestPct != null && L.bestPct < seen.best,
      down  : seen.pulls != null && !!L.defeated && !seen.down
    };
    seen.pulls = n;
    if(L.bestPct != null) seen.best = L.bestPct;
    seen.down = !!L.defeated;
    return out;
  };
}

/* De pull waar het om gaat: bij een kill de geslaagde, bij een beste poging
   die met datzelfde percentage. Daar hangen de cijfers aan die de alert
   toont -- duur en aantal doden per pull komen uit bosspulls. */
function pullOf(L, kind){
  var list = (L && L.pulls) || [], hit = null;
  list.forEach(function(p){
    if(kind === 'kill' ? p.kill
                       : (!p.kill && L.bestPct != null && Math.abs(p.pct - L.bestPct) < 0.005)) hit = p;
  });
  return hit;
}

window.RioLive = { load:load, currentRaid:currentRaid, watcher:watcher, pullOf:pullOf };
})();

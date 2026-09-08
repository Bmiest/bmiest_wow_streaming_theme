/* Raider.IO live-tracking.
   Dit zijn de endpoints die Raider.IO's eigen boss-progress widget
   gebruikt. Ze staan NIET in hun publieke API-documentatie -- ik heb ze
   afgeleid uit de netwerkcalls van raider.io/widgets. Ze kunnen dus zonder
   aankondiging veranderen. Alles faalt stil: gaat het endpoint stuk, dan
   verdwijnt het blok en draait de rest van de banner door.

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
    U.getJSON(BASE + '/bossprogress?' + q, 9000),
    U.getJSON(BASE + '/bosspulls?'    + q, 9000).catch(function(){ return null; })
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

window.RioLive = { load:load };
})();

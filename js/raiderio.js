/* Raider.IO -- publieke API, geen key, CORS staat open.
   Levert character (ilvl, M+ score, beste keys) en guild raid progress. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG.raiderio || {};
var API = 'https://raider.io/api/v1';

var FIELDS = [
  'gear',
  'mythic_plus_scores_by_season:current',
  'raid_progression'
].join(',');

function character(c){
  var url = API+'/characters/profile?region='+encodeURIComponent(CFG.region||'eu')
          + '&realm='+encodeURIComponent(U.slug(c.realm))
          + '&name='+encodeURIComponent(c.name)
          + '&fields='+FIELDS;

  return U.getJSON(url).then(function(d){
    var season = (d.mythic_plus_scores_by_season||[])[0];

    return {
      name  : d.name,
      realm : d.realm,
      klass : d.class,
      spec  : d.active_spec_name,
      guild : d.guild ? d.guild.name : '',
      color : U.CLASS_COLORS[d.class] || '#eef1f5',
      thumb : d.thumbnail_url,
      ilvl  : d.gear ? d.gear.item_level_equipped : null,
      score : season && season.scores ? Math.round(season.scores.all) : null,
      raids : d.raid_progression || {},
      /* Wanneer Raider.IO dit character voor het laatst ophaalde. Zij leveren
         geen live data; sneller pollen dan hun crawl geeft hetzelfde antwoord.
         De onderbalk zet de ouderdom in de diagnoseregel. */
      crawled: d.last_crawled_at || null
    };
  });
}

function guild(){
  var g = CFG.guild;
  if(!g || !g.name) return Promise.resolve(null);
  var url = API+'/guilds/profile?region='+encodeURIComponent(CFG.region||'eu')
          + '&realm='+encodeURIComponent(U.slug(g.realm))
          + '&name='+encodeURIComponent(g.name)
          + '&fields=raid_progression';
  return U.getJSON(url).then(function(d){
    return { name:d.name, raids:d.raid_progression||{} };
  });
}

/* raid_progression is een object met raid-slugs als sleutel, maar welke
   daarvan de huidige tier is staat er niet in -- en de laatste sleutel is
   het niet altijd: Raider.IO zet er ook tiers tussen die nog niet lopen.
   Vandaar deze voorkeur: de slug die de aanroeper meegeeft (die komt uit
   live-tracking, dus van Raider.IO zelf), anders raidSlug uit de config,
   anders alsnog de laatste sleutel. */
function pickRaid(raids, slug){
  var keys = Object.keys(raids||{});
  if(!keys.length) return null;
  var key = (slug && raids[slug])                 ? slug
          : (CFG.raidSlug && raids[CFG.raidSlug]) ? CFG.raidSlug
          : keys[keys.length-1];
  var r = raids[key];
  return {
    slug   : key,
    title  : key.replace(/-/g,' ').replace(/\b\w/g,function(m){ return m.toUpperCase(); }),
    total  : r.total_bosses,
    normal : r.normal_bosses_killed,
    heroic : r.heroic_bosses_killed,
    mythic : r.mythic_bosses_killed
  };
}

window.RaiderIO = { character:character, guild:guild, pickRaid:pickRaid };
})();

/* Race to Dutch First: waar je guild staat in de race naar Cutting Edge
   tussen de Nederlandse guilds. De stand komt van racetodutchfirst.bmiest.be,
   die hem elk half uur uit Raider.IO (en Warcraft Logs) opbouwt. Hier wordt
   niets opnieuw uitgerekend: de rangorde daar is de rangorde, anders staan
   er twee verschillende standen op je stream en op die site.

   GitHub Pages stuurt Access-Control-Allow-Origin: * mee, dus ophalen kan
   rechtstreeks vanuit een browser source. Gaat het mis, dan geeft guild()
   null en verdwijnt het blok; de rest van de pagina merkt er niets van.

   Velden die gebruikt worden: guilds[].name, mythicKills, totalBosses, rank,
   ceKilledAt, current.name. Die bestaan al sinds de eerste versie van de
   site en de Warcraft Logs-PR daar laat ze staan. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var RC = CFG.race || {};

function enabled(){
  return RC.enabled !== false && !!RC.url;
}

function guildName(){
  return RC.guild || (CFG.raiderio && CFG.raiderio.guild && CFG.raiderio.guild.name) || '';
}

/* De stand van één guild, of null. */
function guild(){
  if(!enabled()) return Promise.resolve(null);
  var want = guildName().toLowerCase();
  return U.getJSON(RC.url, 8000).then(function(d){
    var list = (d && d.guilds) || [];
    var g = list.filter(function(x){ return String(x.name).toLowerCase() === want; })[0];
    if(!g || typeof g.mythicKills !== 'number') return null;
    return {
      name   : g.name,
      kills  : g.mythicKills,
      total  : g.totalBosses || (d.tier && d.tier.totalBosses) || null,
      rank   : g.rank || null,
      count  : list.length,
      ce     : !!g.ceKilledAt,
      current: g.current && g.current.name || null
    };
  }).catch(function(e){
    console.warn('[race]', e.message);
    return null;
  });
}

/* Als losse delen, zodat de scenes ze op één regel zetten en de onderbalk
   alleen de rang neemt. */
function parts(s){
  var T = window.I18N.t, out = [];
  if(!s) return out;
  if(s.total) out.push({ k:'kills', text: T('race.kills', { k:s.kills, n:s.total }) });
  if(s.rank)  out.push({ k:'rank', lead: s.rank === 1,
                         text: T('race.rank', { r:s.rank, c:s.count }) });
  if(s.ce)           out.push({ k:'ce', text: T('race.ce') });
  else if(s.current) out.push({ k:'on', text: T('race.on', { boss:s.current }) });
  return out;
}

/* Elke tien minuten: de site zelf ververst elk half uur en zet een cache
   van tien minuten op het bestand. Vaker vragen levert niets op. */
function watch(fn){
  if(!enabled()) return;
  U.poll(function(){ return guild().then(fn); }, RC.pollSeconds || 600);
}

window.Race = { guild:guild, parts:parts, watch:watch, enabled:enabled };
})();

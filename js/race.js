/* Race to Dutch First: waar je guild staat in de race naar Cutting Edge
   tussen de Nederlandse guilds. De stand komt van racetodutchfirst.bmiest.be,
   die hem elk half uur uit Raider.IO (en Warcraft Logs) opbouwt. Hier wordt
   niets opnieuw uitgerekend: de rangorde daar is de rangorde, anders staan
   er twee verschillende standen op je stream en op die site.

   GitHub Pages stuurt Access-Control-Allow-Origin: * mee, dus ophalen kan
   rechtstreeks vanuit een browser source. Gaat het mis, dan geeft guild()
   null en verdwijnt het blok; de rest van de pagina merkt er niets van.

   Velden die gebruikt worden: guilds[].name, mythicKills, totalBosses, rank,
   ceKilledAt, current.name, en tier.ceBoss.name (alleen de voorpagina).
   De eerste zes bestaan al sinds de eerste versie van de
   site en de Warcraft Logs-PR daar laat ze staan. Het klassement (board)
   leest daarnaast racePosition en current.bestPercent, en generatedAt voor
   het tijdstempel in de onderbalk. */
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
    var total = g.totalBosses || (d.tier && d.tier.totalBosses) || null;
    return {
      name   : g.name,
      kills  : g.mythicKills,
      total  : total,
      rank   : g.rank || null,
      count  : list.length,
      ce     : !!g.ceKilledAt,
      current: g.current && g.current.name || null,
      /* De CE-boss van de tier, voor de voorpagina: na Cutting Edge staat
         daar die boss achter je character in plaats van niets. */
      ceBoss : d.tier && d.tier.ceBoss && d.tier.ceBoss.name || null,
      at     : d.generatedAt || null,
      board  : board(list, g.name, total)
    };
  }).catch(function(e){
    console.warn('[race]', e.message);
    return null;
  });
}

/* Het klassement zoals de site het toont: op de rang van de site, niet
   opnieuw gesorteerd. racePosition is kills plus het deel van de huidige
   boss dat eraf is (6.30 = zes kills en 30% van de zevende), en dat is wat
   de balk vult -- niet de bosses in volgorde, want guilds killen niet in
   dezelfde volgorde. Je eigen guild staat er altijd bij, ook als hij buiten
   de eerste RC.boardRows valt; dan valt de laatste plek ervoor weg. */
function board(list, own, total){
  var rows = list.filter(function(x){ return typeof x.mythicKills === 'number'; })
    .map(function(x){
      var n = x.totalBosses || total || 0;
      var pos = typeof x.racePosition === 'number' ? x.racePosition : x.mythicKills;
      return {
        name : x.name,
        rank : x.rank || null,
        kills: x.mythicKills,
        total: n,
        pos  : Math.max(0, Math.min(n, pos)),
        best : !x.ceKilledAt && x.current && typeof x.current.bestPercent === 'number'
               ? x.current.bestPercent : null,
        ce   : !!x.ceKilledAt,
        own  : x.name === own
      };
    })
    .sort(function(a, b){ return (a.rank || 99) - (b.rank || 99); });
  var max = RC.boardRows || 6;
  if(rows.length <= max) return rows;
  var top = rows.slice(0, max);
  if(!top.some(function(r){ return r.own; })){
    var mine = rows.filter(function(r){ return r.own; })[0];
    if(mine) top[max - 1] = mine;
  }
  return top;
}

/* Eén baan: een blokje per boss, gevuld tot de racepositie. Het blokje van
   de boss waar ze op zitten loopt half vol met wat er van die boss af is.
   Een binnenblok met een breedte en geen verloop: geen gradients op een
   streampagina. */
function track(r){
  var box = U.el('span', 'rtrack');
  for(var i = 0; i < r.total; i++){
    var seg = U.el('i', null), f = Math.max(0, Math.min(1, r.pos - i));
    if(f >= 1) seg.className = 'is-full';
    else if(f > 0){
      var part = U.el('b', null);
      part.style.width = (f * 100).toFixed(1) + '%';
      seg.appendChild(part);
    }
    box.appendChild(seg);
  }
  return box;
}

/* Wat er rechts in een rij staat: de kills, en de beste poging op de boss
   waar ze op zitten als resterend HP -- dezelfde getallen als de site
   ("6/8 · 69,8%"). Na Cutting Edge alleen dat. */
function figures(r){
  var T = window.I18N.t;
  if(r.ce) return { kills: T('race.ce'), best: '' };
  return { kills: r.kills + '/' + r.total,
           best : r.best != null ? r.best.toFixed(1) + '%' : '' };
}

/* Een rij van het klassement, voor de scenes en de onderbalk. Dezelfde
   opbouw, de maten zitten in hun eigen css. */
function row(r){
  var f = figures(r);
  var el = U.el('div', 'rrow' + (r.own ? ' is-own' : '') + (r.rank === 1 ? ' is-lead' : '')
                       + (r.ce ? ' is-ce' : ''));
  el.appendChild(U.el('span', 'rrow__rank', r.rank ? String(r.rank) : '\u2014'));
  el.appendChild(U.el('span', 'rrow__nm', r.name));
  el.appendChild(track(r));
  el.appendChild(U.el('span', 'rrow__k', f.kills));
  el.appendChild(U.el('span', 'rrow__b', f.best));
  return el;
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

window.Race = { guild:guild, parts:parts, watch:watch, enabled:enabled, row:row };
})();

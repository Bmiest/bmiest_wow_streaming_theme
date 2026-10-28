/* Race to Dutch First: waar je guild staat in de race naar Cutting Edge
   tussen de Nederlandse guilds. De stand komt van racetodutchfirst.nl, die
   hem uit Raider.IO en Warcraft Logs opbouwt: op raidavonden elke vijf
   minuten, anders elk uur. Hier wordt niets opnieuw uitgerekend: de
   rangorde daar is de rangorde, anders staan er twee verschillende standen
   op je stream en op die site.

   De site stuurt Access-Control-Allow-Origin: * mee op data/*.json, dus
   ophalen kan rechtstreeks vanuit een browser source. Gaat het mis, dan
   geeft guild() null en verdwijnt het blok; de rest van de pagina merkt er
   niets van.

   Velden die gebruikt worden: guilds[].name, mythicKills, totalBosses, rank,
   ceKilledAt, current.name, en tier.ceBoss.name (alleen de voorpagina).
   De eerste zes bestaan al sinds de eerste versie van de
   site en de Warcraft Logs-PR daar laat ze staan. Het klassement (board)
   leest daarnaast racePosition en current.bestPercent, en generatedAt voor
   het tijdstempel in de onderbalk. Op een boss met fases (sinds 27 oktober
   2026) ook current.bestPhase ({label, percent}), current.pulls[].phase en
   tier.raids[].bosses[].phases: waar elke fase begint, op de schaal van
   bestPercent. */
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
    var book = phaseBook(d);
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
      board  : board(list, g.name, total, RC.boardRows || 7, book),
      boardBar: board(list, g.name, total, (RC.bar && RC.bar.rows) || 6, book),
      log    : log(d, g.name, book),
      ranks  : ranks(d, g)
    };
  }).catch(function(e){
    console.warn('[race]', e.message);
    return null;
  });
}

/* De fases per boss, op naam: alleen bosses die ze in race.json hebben
   (guilds.toml op de site). Een boss zonder lijst toont geen fase, ook als
   een pull er een meekreeg -- dat doet de site ook. */
function phaseBook(d){
  var out = {};
  ((d.tier && d.tier.raids) || []).forEach(function(r){
    (r.bosses || []).forEach(function(b){
      if(Array.isArray(b.phases) && b.phases.length) out[b.name] = b.phases;
    });
  });
  return out;
}

/* "P3 4.9%": zoals raiders het zeggen en de site het schrijft. */
function phaseText(label, pct, digits){ return label + ' ' + pct.toFixed(digits) + '%'; }

/* Het klassement zoals de site het toont: op de rang van de site, niet
   opnieuw gesorteerd. racePosition is kills plus het deel van de huidige
   boss dat eraf is (6.30 = zes kills en 30% van de zevende), en dat is wat
   de balk vult -- niet de bosses in volgorde, want guilds killen niet in
   dezelfde volgorde. Je eigen guild staat er altijd bij, ook als hij buiten
   de eerste max valt; dan valt de laatste plek ervoor weg. Twee lengtes:
   de scenes hebben ruimte voor 7 (RC.boardRows), de raidkaart voor 6
   (RC.bar.rows) -- sinds Lelijkerds als twee teams meedoet zijn het er 7. */
function board(list, own, total, max, book){
  var rows = list.filter(function(x){ return typeof x.mythicKills === 'number'; })
    .map(function(x){
      var n = x.totalBosses || total || 0;
      var pos = typeof x.racePosition === 'number' ? x.racePosition : x.mythicKills;
      var c = x.current, phases = c && book[c.name] || null;
      var bp = !x.ceKilledAt && phases && c.bestPhase;
      return {
        name : x.name,
        rank : x.rank || null,
        kills: x.mythicKills,
        total: n,
        pos  : Math.max(0, Math.min(n, pos)),
        best : !x.ceKilledAt && x.current && typeof x.current.bestPercent === 'number'
               ? x.current.bestPercent : null,
        /* De fase van de beste pull en wat daarvan overbleef, alleen op een
           boss met fases; dan zegt de rij "P3 4.9%" in plaats van de hele
           fight, net als de site. */
        phase: bp && typeof bp.percent === 'number' && bp.label ? bp : null,
        /* Waar de fases beginnen, voor de streepjes in het blokje van de
           huidige boss (track()). */
        phases: !x.ceKilledAt ? phases : null,
        ce   : !!x.ceKilledAt,
        own  : x.name === own
      };
    })
    .sort(function(a, b){ return (a.rank || 99) - (b.rank || 99); });
  if(rows.length <= max) return rows;
  var top = rows.slice(0, max);
  if(!top.some(function(r){ return r.own; })){
    var mine = rows.filter(function(r){ return r.own; })[0];
    if(mine) top[max - 1] = mine;
  }
  return top;
}

/* De rangen van je guild buiten Nederland, voor de guildpagina van de
   raidkaart: Raider.IO's raidranking op de raid met de CE-boss (wereld,
   regio, realm), plus de beste killrang van een boss die meetelt -- de
   kill waarmee je het hoogst in de wereld eindigde. */
function ranks(d, g){
  var ce = d.tier && d.tier.ceBoss, counts = {};
  ((d.tier && d.tier.raids) || []).forEach(function(r){ counts[r.slug] = r.counts !== false; });
  var r = (ce && g.raids && g.raids[ce.raid]) || {};
  var best = null;
  (g.bosses || []).forEach(function(b){
    var k = b.killRank;
    if(!k || typeof k.world !== 'number' || counts[b.raid] === false) return;
    if(!best || k.world < best.world) best = { boss: b.name, world: k.world, region: k.region };
  });
  return { world: r.worldRank || g.worldRank || null, region: r.regionRank || null,
           realm: r.realmRank || null, realmName: g.realm || '', regionName: g.region || '',
           summary: r.summary || '', best: best };
}

/* Het raceverslag: de laatste kills en nieuwe beste pogingen van alle
   guilds, nieuwste eerst -- dezelfde momenten als 'Laatste nieuws' op de
   site, die dat in de browser uit dezelfde race.json opbouwt
   (site/voortgang.js, logItems). Twee soorten:

   - een kill op een boss die meetelt (een raid met counts:false, zoals de
     Tidebound Grotto, niet); 'first' als die guild hem als eerste lag;
   - een reeks nieuwe beste pogingen van één guild op zijn huidige boss op
     één avond, als één regel met de beste van die avond. Op de site heet
     dat ook één regel; elke pull apart zou de kaart vullen met één guild.

   Inhalen (de site zegt "X haalt Y in") staat er bewust niet bij: de site
   rekent dat uit de voortgangslijnen over tijd, en een eigen versie hier
   zou soms een ander verhaal vertellen dan de site. */
function log(d, own, book){
  var counts = {}, firsts = {};
  ((d.tier && d.tier.raids) || []).forEach(function(r){
    counts[r.slug] = r.counts !== false;
    (r.bosses || []).forEach(function(b){
      if(b.firstKill) firsts[r.slug + '/' + b.slug] = b.firstKill.guild;
    });
  });
  var out = [];
  (d.guilds || []).forEach(function(g){
    (g.bosses || []).forEach(function(b){
      if(b.state !== 'killed' || !b.defeatedAt || counts[b.raid] === false) return;
      out.push({ t: Date.parse(b.defeatedAt), guild: g.name, own: g.name === own, boss: b.name,
                 kind: firsts[b.raid + '/' + b.slug] === g.name ? 'first' : 'kill',
                 pulls: b.pullCount || null });
    });
    var c = g.current;
    if(!c || g.ceKilledAt || !Array.isArray(c.pulls)) return;
    var was = null, run = null;
    /* Op een boss met fases: welke fase de beste pulls tot nu toe haalden
       (top), zodat een avond die verder kwam een tag per nieuwe fase krijgt
       ("eerste P3"). Dezelfde regel als newPhases() op de site: vóór de
       eerste beste pull is er niets om mee te vergelijken, dus niets nieuw. */
    var phases = book[c.name] || null, top = -1;
    function at(label){
      for(var i = 0; phases && i < phases.length; i++) if(phases[i].label === label) return i;
      return -1;
    }
    c.pulls.forEach(function(p){
      if(typeof p.percent !== 'number' || p.success || !(was === null || p.percent < was)) return;
      var t = Date.parse(p.at), day = new Date(t).toDateString();
      if(!(run && run.day === day)){
        run = { t: t, day: day, guild: g.name, own: g.name === own, boss: c.name,
                kind: 'best', best: p.percent, phases: [] };
        out.push(run);
      }
      run.t = t; run.best = p.percent;
      var i = phases && p.phase ? at(p.phase) : -1;
      run.phase = i >= 0 && typeof p.phasePercent === 'number'
                ? { label: p.phase, percent: p.phasePercent } : null;
      if(i > top){
        if(top >= 0){ run.phases.push(p.phase); run.kind = 'phase'; }
        top = i;
      }
      was = p.percent;
    });
  });
  return out.filter(function(e){ return !isNaN(e.t); })
            .sort(function(a, b){ return b.t - a.t; })
            .slice(0, RC.logRows || 5);
}

/* Eén regel van het verslag: wanneer, wat, wie op welke boss, en het getal
   dat erbij hoort (pulls tot de kill, of de beste poging als resterend HP). */
function logRow(e){
  var T = window.I18N.t, d = new Date(e.t);
  var when = d.toLocaleDateString(window.I18N.locale(), { weekday: 'short' }).replace('.', '')
           + ' ' + U.hhmm(d);
  var el = U.el('div', 'rlog rlog--' + e.kind + (e.own ? ' is-own' : ''));
  el.appendChild(U.el('span', 'rlog__t', when));
  el.appendChild(U.el('span', 'rlog__tag', e.kind === 'phase'
    ? T('log.phase', { p: e.phases[e.phases.length - 1] }) : T('log.' + e.kind)));
  var txt = U.el('span', 'rlog__txt');
  txt.appendChild(U.el('b', null, e.guild));
  txt.appendChild(U.el('span', null, e.boss));
  el.appendChild(txt);
  var best = e.phase ? phaseText(e.phase.label, e.phase.percent, 1) : e.best != null ? e.best.toFixed(1) + '%' : '';
  el.appendChild(U.el('span', 'rlog__v', e.kind === 'best' || e.kind === 'phase' ? best
                                       : e.pulls ? T('boss.pullsN', { n: e.pulls }) : ''));
  return el;
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
    /* Het blokje van de boss waar ze op zitten (net als racePosition de
       hele fight) krijgt een streepje waar elke fase na de eerste begint,
       zoals de baan op de site: dan zie je dat 70% eraf "in P3" betekent. */
    if(r.phases && i === Math.floor(r.pos) && i < r.total){
      seg.classList.add('has-ph');
      r.phases.forEach(function(ph){
        if(!(ph.from < 100)) return;
        var n = U.el('s', 'rtrack__ph');
        n.style.left = (100 - ph.from).toFixed(1) + '%';
        seg.appendChild(n);
      });
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
           best : r.phase ? phaseText(r.phase.label, r.phase.percent, 1)
                : r.best != null ? r.best.toFixed(1) + '%' : '' };
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

/* Elke tien minuten (race.pollSeconds). De site ververst op raidavonden
   elke vijf minuten; wil je kills sneller in het raceverslag, zet hem op
   300. Daaronder levert vragen niets op. */
function watch(fn){
  if(!enabled()) return;
  U.poll(function(){ return guild().then(fn); }, RC.pollSeconds || 600);
}

window.Race = { guild:guild, parts:parts, watch:watch, enabled:enabled, row:row, logRow:logRow };
})();

/* Raider.IO -- publieke API, geen key, CORS staat open.
   Levert character (ilvl, M+ score, beste keys) en guild raid progress. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG.raiderio || {};
var API = 'https://raider.io/api/v1';

var FIELDS = [
  'gear',
  'mythic_plus_scores_by_season:current',
  'mythic_plus_ranks',
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
      /* Blizzards volledige render, afgeleid van diezelfde thumbnail: dezelfde
         basis met -main-raw.png in plaats van -avatar.jpg. Dat is een PNG van
         1600x1200 met transparante achtergrond waarin de figuur rond
         (555,260) tot (1060,1000) staat -- gemeten op beide characters.

         De officiele weg hiernaartoe is Blizzards eigen profiel-API, en die
         wil OAuth met een client secret. Dat kan niet op een publieke pagina,
         en deze omweg heeft geen sleutel nodig. Blizzard rendert opnieuw als
         je uitlogt met andere gear; de URL verandert dan mee en wij volgen,
         want we leiden hem elke poll opnieuw af. */
      render: (function(t){
        if(!t) return null;
        var plain = String(t).split('?')[0];
        var base  = plain.replace(/-avatar\.jpg$/, '');
        return base === plain ? null : base + '-main-raw.png';
      })(d.thumbnail_url),
      ilvl  : d.gear ? d.gear.item_level_equipped : null,
      score : season && season.scores ? Math.round(season.scores.all) : null,
      /* Raider.IO geeft ranks per klasse en overall, elk voor wereld, regio
         en realm. De klasse-realmrank is de enige die op een stream iets
         zegt: 132e van je klasse op je realm leest, 114745e van de regio
         niet. */
      rank  : (function(r){
        var c = r && r['class'];
        return c && c.realm != null ? c.realm : null;
      })(d.mythic_plus_ranks),
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

/* ---- een render passend in zijn venster -----------------------------
   De pauzeschermen en de offline-graphic zetten zo'n render van 1600x1200
   in een venster van 515x755. Dat ging met een vast offset, gemeten op de
   twee characters die er toen in stonden. Dat houdt geen stand: Blizzard
   rendert elk ras in hetzelfde kader, dus een tauren of een orc vult dat
   kader veel breder en hoger dan een mensachtige, en met vijf characters
   in de rotatie liep de ene zijn hoorns eruit terwijl de andere scheef in
   het venster hing.

   Meten kan gewoon: de render heeft een transparante achtergrond, dus het
   figuur is de bounding box van alles wat niet doorzichtig is. Op een
   kwart van het formaat is dat nauwkeurig genoeg en kost het niets.
   Blizzards CDN stuurt access-control-allow-origin:*, dus het canvas
   blijft leesbaar -- lukt dat toch niet, dan geven we null terug en valt
   de aanroeper stil terug op het vaste offset uit de CSS. */
function fitRender(im, boxW, boxH){
  var STEP = 4,               // op kwartformaat meten is nauwkeurig zat
      MAX  = 1.15,            // niet opschalen tot het gaat pixelen
      /* Het figuur mag de zijkanten niet raken. In de oorspronkelijke
         uitsnede vulde Shiftheal 463 van de 515px, en die lucht ernaast is
         wat het een portret maakt in plaats van een uitsnede. Verticaal
         niet: daar hoort hij vol te staan, met zijn voeten in het masker. */
      WIDE = 0.90;
  try {
    var cw = Math.max(1, Math.round(im.naturalWidth  / STEP)),
        ch = Math.max(1, Math.round(im.naturalHeight / STEP));
    var cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, cw, ch);
    var d = cx.getImageData(0, 0, cw, ch).data;
    var x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for(var y = 0; y < ch; y++){
      for(var x = 0; x < cw; x++){
        /* Verkleinen middelt de alpha uit, dus de rand van het figuur komt
           er halfdoorzichtig uit. Onder deze drempel is het schaduw. */
        if(d[(y * cw + x) * 4 + 3] > 24){
          if(x < x0) x0 = x;
          if(x > x1) x1 = x;
          if(y < y0) y0 = y;
          if(y > y1) y1 = y;
        }
      }
    }
    if(x1 < 0) return null;                       // volledig transparant
    var bx = x0 * STEP, by = y0 * STEP,
        bw = (x1 - x0 + 1) * STEP, bh = (y1 - y0 + 1) * STEP;
    var s = Math.min(boxW * WIDE / bw, boxH / bh, MAX);
    /* Horizontaal gecentreerd op het figuur zelf, en met de voeten op de
       onderrand -- daar loopt het masker toch uit, en zo staan ze allemaal
       op dezelfde lijn in plaats van elk op hun eigen hoogte te zweven. */
    return {
      width : im.naturalWidth  * s,
      height: im.naturalHeight * s,
      left  : (boxW - bw * s) / 2 - bx * s,
      top   : boxH - (by + bh) * s
    };
  } catch(e){
    return null;
  }
}

window.RaiderIO = { character:character, guild:guild, pickRaid:pickRaid,
                    fitRender:fitRender };
})();

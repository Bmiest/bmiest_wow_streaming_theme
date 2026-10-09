/* Taal: Engels of Nederlands. Klassiek script, net als js/util.js, en hij
   moet ná util.js geladen worden (hij leest U.CFG).

   Welke taal, in deze volgorde:
     1. ?lang=en of ?lang=nl in de URL
     2. alleen op de voorpagina: wat je daar eerder koos (localStorage), en
        anders de taal van je browser
     3. lang in de config, standaard 'en'

   Stap 2 slaat de stream-pagina's bewust over. OBS' browser neemt de taal
   van Windows over, en op een Nederlandstalige pc zou je stream dan zonder
   waarschuwing Nederlands worden. Een browser source krijgt zijn taal dus
   alleen via de URL -- make-obs-collection.py --lang zet die erachter.

   Wat níét vertaald wordt: speldata. Boss-, item-, raid- en characternamen
   blijven zoals Blizzard ze noemt, ook in het Nederlands; daar zoekt een
   kijker ze ook op. En je eigen woorden uit de config (topic, beloning,
   socials) staan er zoals je ze schreef. */
(function(){
'use strict';

var LANGS = ['en', 'nl'];

/* Een waarde is een string met {plaatshouders}, of een functie voor
   meervoud. Ontbreekt een sleutel in het Nederlands, dan valt hij terug op
   het Engels, en daarna op de sleutel zelf -- liever een Engels woord op je
   stream dan een gat. */
function plural(one, many){
  return function(v){ return (v.n === 1 ? one : many).replace('{n}', v.n); };
}

var DICT = {
  en: {
    // ---- scenes
    'scene.starting'   : 'starting soon',
    'scene.brb'        : 'be right back',
    'scene.ending'     : 'thanks for watching',
    'scene.headline'   : 'See you next time',
    'scene.almost'     : 'almost there',
    'cap.schedule'     : 'schedule',
    'cap.links'        : 'links',
    'cap.recent'       : 'recent',
    'cap.chat'         : 'chat',
    'cap.characters'   : 'characters',
    'cap.raid'         : 'raid',
    'cap.race'         : 'race',
    'cap.log'          : 'race log',
    'cap.guild'        : 'guild',
    'gr.world'         : 'world',
    'gr.nl'            : 'NL',
    'gr.best'          : 'best kill',
    'log.first'        : 'first',
    'log.kill'         : 'kill',
    'log.best'         : 'best',
    'cap.camera'       : 'camera',
    'rib.channel'      : 'channel',
    'rib.viewers'      : 'viewers',
    'rib.followers'    : 'followers',
    'rib.status'       : 'status',
    'sched.none'       : 'no fixed schedule',
    'sched.off'        : 'off',
    'sched.nextRaid'   : 'next raid in {t}',
    'sched.nextStream' : 'next stream in {t}',
    'sched.nowRaid'    : 'raiding now',
    'sched.nowStream'  : 'live now',
    'dur.d'            : '{d}d {h}h',
    'dur.h'            : '{h}h {m}m',
    'dur.m'            : '{m}m',
    'empty.session'    : 'nothing yet this session',

    // ---- race to dutch first
    'race.cap'         : 'race to dutch first',
    'race.kills'       : '{k}/{n} M',
    'race.rank'        : '#{r} of {c} NL',
    'race.on'          : 'now on {boss}',
    'race.ce'          : 'Cutting Edge',

    // ---- onderbalk
    'stat.ilvl'        : 'item level',
    'stat.score'       : 'm+ score',
    'prog.none'        : 'no raid progress yet',
    'boss.down'        : 'down',
    'boss.progress'    : 'progress',
    'boss.toKill'      : plural('pull to kill', 'pulls to kill'),
    'boss.bestOf'      : 'best of {n} pulls',
    'boss.pulls'       : plural('pull', 'pulls'),
    'boss.pullsN'      : plural('{n} pull', '{n} pulls'),
    'flash.down'       : 'boss down',
    'flash.best'       : 'new best',
    'flash.last'       : 'last try',
    'stamp.ago'        : '{t} ago',

    // ---- bovenbalk
    'live.offline'     : 'offline',
    'live.live'        : 'live',
    'lbl.follower-latest'           : 'latest follower',
    'lbl.follower-session'          : 'followers this stream',
    'lbl.subscriber-latest'         : 'latest sub',
    'lbl.subscriber-new-latest'     : 'latest new sub',
    'lbl.subscriber-gifted-latest'  : 'latest gift sub',
    'lbl.subscriber-alltime-gifter' : 'top gifter',
    'lbl.subscriber-session'        : 'subs this stream',
    'lbl.cheer-latest'              : 'latest bits',
    'lbl.cheer-session'             : 'bits this stream',
    'lbl.cheer-alltime-top-donator' : 'top cheer',
    'lbl.tip-latest'                : 'latest tip',
    'lbl.tip-session'               : 'tips this stream',
    'lbl.tip-alltime-top-donator'   : 'top tip',
    'lbl.raid-latest'               : 'latest raid',
    'goal.subs'        : 'subs',
    'goal.unlocked'    : '{r} unlocked',
    'goal.at'          : '{r} at {n}',

    // ---- gebeurtenissen (StreamElements)
    'ev.follow'        : 'follows',
    'ev.sub'           : 'sub',
    'ev.cheer'         : 'bits',
    'ev.tip'           : 'tip',
    'ev.raid'          : 'raid',
    'ev.someone'       : 'someone',
    'ev.months'        : '{n} mo',
    'ev.new'           : 'new',
    'ev.gift'          : 'gift',
    'ev.bits'          : '{n} bits',
    'ev.viewers'       : '{n} viewers',

    // ---- meldingen
    'alert.follow'     : 'new follower',
    'alert.sub'        : 'subscriber',
    'alert.cheer'      : 'bits',
    'alert.tip'        : 'tip',
    'alert.raid'       : 'raid',
    'alert.hpLeft'     : 'boss hp left',
    'alert.phase'      : 'phase',
    'alert.duration'   : 'duration',
    'alert.deaths'     : plural('death', 'deaths'),

    // ---- voorpagina
    'lang.label'       : 'Language',
    'copy'             : 'copy',
    'copied'           : 'copied'
  },

  nl: {
    'scene.starting'   : 'straks live',
    'scene.brb'        : 'zo terug',
    'scene.ending'     : 'bedankt voor het kijken',
    'scene.headline'   : 'Tot de volgende keer',
    'scene.almost'     : 'bijna zover',
    'cap.schedule'     : 'schema',
    'cap.links'        : 'links',
    'cap.recent'       : 'recent',
    'cap.chat'         : 'chat',
    'cap.characters'   : 'characters',
    'cap.raid'         : 'raid',
    'cap.race'         : 'race',
    'cap.log'          : 'raceverslag',
    'cap.guild'        : 'guild',
    'gr.world'         : 'wereld',
    'gr.nl'            : 'NL',
    'gr.best'          : 'beste kill',
    'log.first'        : 'eerste',
    'log.kill'         : 'kill',
    'log.best'         : 'beste',
    'cap.camera'       : 'camera',
    'rib.channel'      : 'kanaal',
    'rib.viewers'      : 'kijkers',
    'rib.followers'    : 'volgers',
    'rib.status'       : 'status',
    'sched.none'       : 'geen vast schema',
    'sched.off'        : 'vrij',
    'sched.nextRaid'   : 'volgende raid over {t}',
    'sched.nextStream' : 'volgende stream over {t}',
    'sched.nowRaid'    : 'nu aan het raiden',
    'sched.nowStream'  : 'nu live',
    'dur.d'            : '{d}d {h}u',
    'dur.h'            : '{h}u {m}m',
    'dur.m'            : '{m}m',
    'empty.session'    : 'nog niets deze sessie',

    'race.cap'         : 'race to dutch first',
    'race.kills'       : '{k}/{n} M',
    'race.rank'        : '#{r} van {c} NL',
    'race.on'          : 'nu op {boss}',
    'race.ce'          : 'Cutting Edge',

    'stat.ilvl'        : 'item level',
    'stat.score'       : 'm+ score',
    'prog.none'        : 'nog geen raidprogress',
    'boss.down'        : 'dood',
    'boss.progress'    : 'progress',
    'boss.toKill'      : plural('pull tot de kill', 'pulls tot de kill'),
    'boss.bestOf'      : 'beste van {n} pulls',
    'boss.pulls'       : plural('pull', 'pulls'),
    'boss.pullsN'      : plural('{n} pull', '{n} pulls'),
    'flash.down'       : 'boss dood',
    'flash.best'       : 'nieuwe beste',
    'flash.last'       : 'laatste poging',
    'stamp.ago'        : '{t} geleden',

    'live.offline'     : 'offline',
    'live.live'        : 'live',
    'lbl.follower-latest'           : 'laatste volger',
    'lbl.follower-session'          : 'volgers deze stream',
    'lbl.subscriber-latest'         : 'laatste sub',
    'lbl.subscriber-new-latest'     : 'laatste nieuwe sub',
    'lbl.subscriber-gifted-latest'  : 'laatste gift sub',
    'lbl.subscriber-alltime-gifter' : 'top gifter',
    'lbl.subscriber-session'        : 'subs deze stream',
    'lbl.cheer-latest'              : 'laatste bits',
    'lbl.cheer-session'             : 'bits deze stream',
    'lbl.cheer-alltime-top-donator' : 'top cheer',
    'lbl.tip-latest'                : 'laatste tip',
    'lbl.tip-session'               : 'tips deze stream',
    'lbl.tip-alltime-top-donator'   : 'top tip',
    'lbl.raid-latest'               : 'laatste raid',
    'goal.subs'        : 'subs',
    'goal.unlocked'    : '{r} vrijgespeeld',
    'goal.at'          : '{r} bij {n}',

    'ev.follow'        : 'volgt',
    'ev.sub'           : 'sub',
    'ev.cheer'         : 'bits',
    'ev.tip'           : 'tip',
    'ev.raid'          : 'raid',
    'ev.someone'       : 'iemand',
    'ev.months'        : '{n} mnd',
    'ev.new'           : 'nieuw',
    'ev.gift'          : 'gift',
    'ev.bits'          : '{n} bits',
    'ev.viewers'       : '{n} kijkers',

    'alert.follow'     : 'nieuwe volger',
    'alert.sub'        : 'subscriber',
    'alert.cheer'      : 'bits',
    'alert.tip'        : 'tip',
    'alert.raid'       : 'raid',
    'alert.hpLeft'     : 'boss-hp over',
    'alert.phase'      : 'fase',
    'alert.duration'   : 'duur',
    'alert.deaths'     : plural('dode', 'doden'),

    'lang.label'       : 'Taal',
    'copy'             : 'kopieer',
    'copied'           : 'gekopieerd'
  }
};

var CFG = (window.U && window.U.CFG) || window.OVERLAY_CONFIG || {};

function fromUrl(){
  var m = location.search.match(/[?&]lang=(en|nl)(?:&|$)/);
  return m ? m[1] : null;
}
/* localStorage kan gooien (privévenster, geblokkeerde sitedata) of leeg
   terugkomen; dan gewoon door naar de volgende stap. */
function stored(){
  try {
    var v = localStorage.getItem('lang');
    return LANGS.indexOf(v) >= 0 ? v : null;
  } catch(e){ return null; }
}
function browser(){
  return /^nl\b/i.test(navigator.language || '') ? 'nl' : null;
}

var lang = fromUrl() ||
           (window.I18N_INTERACTIVE ? (stored() || browser()) : null) ||
           (CFG.lang === 'nl' ? 'nl' : 'en');

function t(key, v){
  var s = DICT[lang][key];
  if(s == null) s = DICT.en[key];
  if(s == null) return key;
  v = v || {};
  if(typeof s === 'function') return s(v);
  return s.replace(/\{(\w+)\}/g, function(_, k){ return v[k] != null ? v[k] : ''; });
}

/* Alles met data-i18n="sleutel" krijgt de tekst uit het woordenboek. Voor
   de statische bijschriften in de HTML, zodat die niet in JavaScript
   opnieuw opgebouwd hoeven te worden. */
function apply(root){
  Array.prototype.forEach.call((root || document).querySelectorAll('[data-i18n]'),
    function(n){ n.textContent = t(n.getAttribute('data-i18n')); });
}

/* Alleen de voorpagina wisselt terwijl hij openstaat. Een stream-pagina
   leest zijn taal één keer, bij het laden. */
var listeners = [];
function set(l){
  if(LANGS.indexOf(l) < 0 || l === lang) return;
  lang = l;
  try { localStorage.setItem('lang', l); } catch(e){}
  document.documentElement.lang = l;
  apply();
  listeners.forEach(function(fn){ fn(l); });
}

/* Een URL met deze taal erachter, of zonder als het Engels is -- de
   standaard hoeft niet in elke link te staan. */
function withLang(url, l){
  l = l || lang;
  var hash = '', i = url.indexOf('#');
  if(i >= 0){ hash = url.slice(i); url = url.slice(0, i); }
  url = url.replace(/([?&])lang=[a-z]+(&|$)/, function(_, a, b){ return b ? a : ''; })
           .replace(/[?&]$/, '');
  if(l !== 'en') url += (url.indexOf('?') >= 0 ? '&' : '?') + 'lang=' + l;
  return url + hash;
}

document.documentElement.lang = lang;

window.I18N = {
  t: t, apply: apply, set: set, withLang: withLang,
  get lang(){ return lang; },
  locale: function(){ return lang === 'nl' ? 'nl-BE' : 'en-GB'; },
  onChange: function(fn){ listeners.push(fn); },
  LANGS: LANGS
};

/* Statische bijschriften meteen invullen. Dit script staat onderaan de
   pagina, dus de HTML is er al. */
apply();
})();

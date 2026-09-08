# bmiest overlay

Twitch-overlay voor een 3440x1440 ultrawide die als 2560x1440 naar Twitch gaat.
De 368px die onderaan overblijft wordt de banner: camera, character, raid
progress, chat en stats.

Vormtaal geleend van Nerd or Die's *Amused* (capsules, ribbon-balken, veel
witruimte, korte micro-animaties), maar ontkleurd: houtskool/wit/grijs met
Priest-wit en gedempt Mistweaver-jade (`#3fd9a4`) als enige accenten.

De huisstijl is van het kanaal **bmiest**. Kelderklasse komt alleen voor waar
het gegevens zijn -- de raid progress van je guild -- niet als merknaam.

---

## 1. Eenmalig instellen

Instellingen komen uit drie lagen, in deze volgorde:

| Laag | Bestand | Geheimen? |
|---|---|---|
| 1 | `config.default.js` | nee -- gedeeld, mag publiek |
| 2 | `config.js` (optioneel) | ja -- staat in `.gitignore` |
| 3 | de URL van de browser source | ja |

**Je JWT hoort in laag 3.** Geef 'm mee als parameter:

```
topbar.html?jwt=eyJ...
```

Die URL staat alleen in jouw OBS-configuratie, precies zoals de overlay-URL
van StreamElements zelf werkt. Zo hoeft het token nergens op schijf te staan,
en kan de overlay ook gehost worden.

Wil je het toch lokaal: maak `config.js` met
`window.OVERLAY_OVERRIDE = { streamelements: { jwt: '...' } };`

```bash
./serve.sh                       # http://localhost:8777
```

Kijken zonder OBS:

| URL | wat |
|---|---|
| `http://localhost:8777/banner.html?demo=1` | banner met nepdata |
| `http://localhost:8777/banner.html` | banner met je echte data |
| `http://localhost:8777/alerts.html?test=1` | alerts, loopt door alle types |

In een gewone browser is het cameravlak **wit**. Dat hoort zo: daar zit een
transparant gat. In OBS zie je daar je webcam.

---

## 1b. Gehost op GitHub Pages

De overlay staat live op
**https://bmiest.github.io/bmiest_wow_streaming_theme/**

Daardoor is er niets te installeren: geen zip, geen paden, geen server, geen
Python. OBS haalt de pagina's rechtstreeks op, en bijwerken gaat met
`git push`.

Je JWT geef je mee in de URL:

```
https://bmiest.github.io/bmiest_wow_streaming_theme/topbar.html?jwt=eyJ...
```

Die URL staat alleen in jouw OBS-configuratie. `config.js` staat in
`.gitignore` en geeft op de site een 404, dus je token staat nergens publiek.

### De collectie

Klaar om te downloaden:
**[`obs-scene-collection.pages.json`](obs-scene-collection.pages.json)**

Of zelf genereren:

```bash
./make-obs-collection.py \
  --base-url https://bmiest.github.io/bmiest_wow_streaming_theme \
  --os windows --jwt '__JWT__' --stinger '__STINGER__'
```

Open het bestand in een teksteditor en vervang:

| Plaatshouder | Waarmee |
|---|---|
| `__JWT__` | je StreamElements JWT |

Meer niet. De stinger zit er bewust **niet** in: dat zou een pad met
backslashes in de JSON zetten, en dat is de enige plek waar handmatig
bewerken stuk kan gaan. Voeg hem in OBS zelf toe:

**Scene Transitions → + → Stinger** → wijs `stinger.webm` aan →
Transition Point op `500` ms.

Zet het bestand daarna in `%APPDATA%\obs-studio\basic\scenes\`, start OBS
en kies **bmiest overlay** onder Scene Collection.

> **De stinger moet lokaal staan.** OBS' stinger-transitie speelt geen video
> van een URL af. Download `stinger.webm` van de site en wijs `__STINGER__`
> daarnaartoe. Al de rest komt van het web.

Daarna alleen nog de twee `[VERVANG]`-vlakken vervangen door je Game Capture
en camera.

## 2. OBS -- video-instellingen

**Settings > Video**

| | |
|---|---|
| Base (Canvas) Resolution | `2560x1440` |
| Output (Scaled) Resolution | `2560x1440` |
| Downscale Filter | Lanczos |
| FPS | 60 |

**Settings > Output > Streaming** (Output Mode: Advanced)

| | |
|---|---|
| Encoder | AMD HW H.264 (AVC) |
| Rate Control | CBR |
| Bitrate | 8000 Kbps |
| Keyframe Interval | 2 s |
| Preset / Quality | Quality |
| Profile | high |
| Pre-Analysis | aan |
| VBAQ | aan |

Pre-Analysis en VBAQ staan standaard uit en zijn op AMF precies wat je nodig
hebt bij donkere, drukke beelden -- ze verdelen de bitrate slimmer over het
frame. Zet ze aan.

> **Eerlijk over de bitrate:** 8000 Kbps op 1440p60 is krap, zeker met AMF en
> zeker met WoW-raidbeelden vol particles. De overlay is daarop ontworpen
> (vlakke vlakken, geen gradients, geen doorlopende beweging), maar je
> gameplay blijft het zware deel. Ziet een raidpull er te blokkerig uit, dan
> is 1440p48 of een 1920x1080-canvas de knop die het meeste oplevert -- niet
> een hogere bitrate, want 8000 is het affiliate-plafond.

---

## 3. OBS -- de sources

De 368px die overblijft is opgesplitst: een dunne statusstrook **boven** de
gameplay en een bredere databalk **eronder**.

```
  y=0      +--------------------------------------+  120  bovenbalk
  y=120    |                                      |
           |          gameplay 2560 x 1072        |
  y=1192   +--------------------------------------+  248  onderbalk
  y=1440   +--------------------------------------+
```

Boven staat de sessiestatus (live, uptime, titel, kijkers, volgers), onder de
inhoud (camera, character, boss progress, chat, events). Symmetrisch splitsen
(184/184) kan ook, maar dan is boven te ruim voor wat er staat en onder te
krap voor camera plus character. Aanpassen doe je in `config.js` onder
`layout` -- de drie getallen moeten samen 1440 zijn.

Volgorde in de scene, **van boven naar beneden**:

```
1. Alerts        (browser)
2. Bovenbalk     (browser)
3. Onderbalk     (browser)
4. Webcam        (video capture device)
5. Gameplay      (game/display capture)
```

De onderbalk moet boven de webcam liggen: hij stanst het gat en tekent de rand
en het naamplaatje eroverheen.

### Bovenbalk

Source > **Browser**:

| | |
|---|---|
| URL | `http://localhost:8777/topbar.html` |
| Width | `2560` |
| Height | `120` |
| Custom frame rate | aan, `30` FPS |
| Shutdown source when not visible | **uit** |

Transform > Position `0`, `0`.

Alles in deze balk behalve de streamtitel is een ribbon: links de status
(kopblok met broadcast-icoon, waarde is je uptime of `offline`), dan de
labelrail, rechts kijkers en volgers. Zolang er geen waarde is staat een
ribbon gedempt, precies zoals een leeg label. Het volgersdoel zit als staafje
in de volgersbalk zelf.

### Gameplay

Game Capture of Display Capture, dan rechtsklik > **Transform > Edit Transform**:

| | |
|---|---|
| Position | `0`, `120` |
| Bounding Box Type | Scale to inner bounds |
| Bounding Box Size | `2560` x `1072` |

3440x1440 past daar exact in: 3440/1440 en 2560/1072 schelen 0,03%.

### Onderbalk

Source > **Browser**:

| | |
|---|---|
| URL | `http://localhost:8777/banner.html` |
| Width | `2560` |
| Height | `248` |
| Custom frame rate | aan, `30` FPS |
| Shutdown source when not visible | **uit** |
| Refresh browser when scene becomes active | **uit** |

Transform > Position `0`, `1192`.

30 FPS is genoeg -- geen enkele animatie in de balken heeft 60 nodig, en het
scheelt rendertijd die je encoder beter kan gebruiken. Die twee vinkjes uit
zorgen dat je chatgeschiedenis een scenewissel overleeft.

In de characterkaart stond een verenwatermerk. In een kaart van 189px hoog
viel daar maar een lob van binnen beeld, en die lag precies achter de naam
van het tweede character: geen watermerk meer, wel een vlek. Op de
scene-schermen staat hij nog wel -- daar heeft hij de ruimte.

De vier vlakken (characters, raid, chat, recent) zijn `rcard`s uit
`css/ribbon.css`: schuine hoek rechtsonder, 1px omlijning uit twee geklipte
lagen, en het bijschrift als tag op de bovenrand met hetzelfde icoon dat een
ribbon in zijn kopblok draagt. Het camera-gat heeft diezelfde schuine hoek en
het naamplaatje eronder is een echte ribbon -- dezelfde die de gebeurtenisbalk
gebruikt die er overheen schuift.

### Alerts

Source > **Browser**:

| | |
|---|---|
| URL | `http://localhost:8777/alerts.html` |
| Width | `2560` |
| Height | `1072` |
| Shutdown source when not visible | uit |

Transform > Position `0`, `120` -- de alerts horen over de gameplay, en die
begint nu 120px lager.

> Zet StreamElements' eigen alert-overlay uit als je deze gebruikt, anders
> krijg je elke follow dubbel.

De alert is een ribbon: bijschrift met het type, gekleurd kopblok met icoon,
en de naam groot. Hij schuift 34px omlaag terwijl hij invaagt, het kopblok
licht kort op, en na 5,2 seconden schuift hij weer weg. Subs en tips krijgen
er een pilletje met tier of bedrag bij en het bericht eronder.

### Webcam

Video Capture Device, dan **Transform > Edit Transform**:

| | |
|---|---|
| Position | `24`, `1216` |
| Bounding Box Type | Scale to outer bounds |
| Bounding Box Size | `340` x `200` |
| Alignment in Bounding Box | Center |

*Outer bounds* vult het vlak en snijdt de zijkanten van je 16:9-beeld weg --
dat is wat je wil, anders krijg je balken. De vorm hoef je niet te regelen:
die komt uit het gat dat de banner erover stanst -- rechte hoeken met dezelfde
schuine hoek rechtsonder als de kaarten. Geen Image Mask/Blend-filter nodig.

Wil je de camera elders of groter? Dan zitten de maten op drie plekken in
`css/banner.css` en `banner.html`, en die moeten gelijk blijven:
`.ground__hole` (positie en formaat van het gat), `.ground__frame` (dezelfde
positie; de omlijning is een polygon, want een `border` volgt geen diagonaal)
en de `340px`-kolom in `.banner`. Neem daarna dezelfde getallen over in de
OBS-transform.

---

## 4. Wat waar vandaan komt

| Gegeven | Bron | Auth |
|---|---|---|
| Chat | Twitch IRC websocket (anoniem) | geen |
| Character, keys, raid progress | Raider.IO public API | geen |
| Followers, kijkers, uptime | DecAPI | geen |
| Follows, subs, cheers, tips, raids | StreamElements realtime socket | JWT |
| Labels (laatste volger, laatste sub, ...) | StreamElements sessie-API | JWT |

Bewust gesplitst: SE levert de events en de labels, DecAPI de totalen. Zo valt
je followercount niet weg als je SE-sessie hapert.

**Ingevuld en geverifieerd:**

- `twitch.channel` = `bmiest` -- 154 volgers via DecAPI.
- `raiderio.characters` = Shiftheal op **EU-Ragnaros** (cross-realm lid van
  Kelderklasse, ilvl 318.75, M+ 2932) en Bhikhu op **EU-Twisting Nether**
  (Mistweaver monk, Kelderklasse, ilvl 295.5). Ze staan naast elkaar in de
  characterkaart; zet je er meer in, dan rouleert de kaart per paar.
  Raider.IO geeft bij cross-realm lidmaatschap geen guild terug op het
  character zelf, dus staat onder zo'n naam de realm; de guild staat al bij
  de raid progress.
- Onder elk character staat zijn **eigen raidprogress** per moeilijkheid
  (`2/8 M · 8/8 H · 8/8 N`), niet meer de hoogste key van de week. De hoogste
  graad waar kills staan kleurt jade. Welke tier dat is komt uit Raider.IO's
  live-tracking, dezelfde bron als de raidkaart ernaast -- `raid_progression`
  zelf zegt niet welke van zijn sleutels de huidige is, en de laatste is het
  niet altijd.
- `raiderio.guild` = Kelderklasse op EU-Draenor.
- `goals.followers` = 200.

**Nog te doen aan jouw kant:**

1. `streamelements.jwt` -- leeg. Zonder token blijven follows, subs, cheers en
   tips leeg. Te vinden op streamelements.com onder Account Settings >
   Show secrets > JWT Token.

## 5. Labels

"Labels" zijn losse feitjes over je kanaal die live bijwerken: laatste volger,
laatste sub, hoogste donatie, aantallen deze sessie. Anders dan de eventlijst
(die chronologisch is) staat elk label op een vaste plek en toont het precies
één ding.

**Waarom dit niet vanzelf gaat:** Twitch heeft z'n publieke follower-endpoint
dichtgezet. DecAPI geeft er `410 Gone - this API has been deprecated` op terug.
Je followerc*ount* werkt nog, maar wie je laatste volger is moet ergens anders
vandaan komen.

### Welke labels in de balk staan

In `config.js` onder `topbar.labels`, als geordende lijst:

```js
topbar: {
  showTitle: false,
  labels: [
    'follower-latest',      // laatste volger
    'subscriber-latest',    // laatste sub
    'cheer-latest',         // laatste bits
    'tip-top',              // topdonatie
  ],
},
```

Beschikbaar, met de sleutelnamen **exact zoals StreamElements ze levert**:

| Sleutel | Toont |
|---|---|
| `follower-latest` | laatste volger |
| `follower-session` / `-week` / `-total` | volgers deze stream / week / totaal |
| `subscriber-latest` | laatste sub |
| `subscriber-new-latest` | laatste nieuwe sub |
| `subscriber-gifted-latest` | laatste gift-sub |
| `subscriber-alltime-gifter` | grootste gifter |
| `subscriber-session` | subs deze stream |
| `cheer-latest` / `cheer-session` | laatste bits / bits deze stream |
| `cheer-alltime-top-donator` | topcheer |
| `tip-latest` / `tip-session` | laatste tip / tips deze stream |
| `tip-alltime-top-donator` | topdonatie |
| `raid-latest` | laatste raid |

Let op: er bestaat bij SE geen `tip-top` of `cheer-top` -- dat zijn
`tip-alltime-top-donator` en `cheer-alltime-top-donator`. Een sleutel die niet
bestaat geeft geen foutmelding, de pil verschijnt gewoon nooit.

SE geeft "nog niets gebeurd" terug als het **getal 0**, niet als leeg. Zowel
`display()` in `js/streamelements.js` als `Labels.set()` vangen dat af, anders
staat er letterlijk `0` in je balk.

**Labels zonder waarde** staan standaard wél in beeld, maar gedempt: grijs
kopblok, streepje als waarde. Dat houdt de indeling vast en laat kijkers zien
dat bits en tips kunnen. Zodra er een waarde binnenkomt springt de pil in zijn
eigen kleur aan.

Liever een stillere balk waarin alleen staat wat er echt is? Zet
`topbar.showEmptyLabels` op `false`; dan verschijnen ze pas als er iets
gebeurd is.

### De vorm: ribbons

De hele overlay deelt één vormtaal, geleend van Amused ("flowing ribbons",
"angled ribbon aesthetic"): balken die naar rechts taps toelopen, bijschriften
als tag op de rand, en een gekleurd kopblok met icoon.

Die taal staat in `css/ribbon.css` en `js/ribbon.js` -- één bron voor alle
pagina's, zodat de balken, de scenes, Just Chatting en de transitie niet uit
elkaar gaan lopen. `Ribbon.make(soort, bijschrift, waarde, maat)` maakt een
ribbon, `Ribbon.card(bijschrift, soort)` een kaart met schuine hoek.

Soorten en hun tint: `follow`, `raid`, `live` en `cam` jade, `sub` wit,
`cheer` en `tip` goud, `sword` wit, `link`/`info`/`neutral`/`viewers` grijs.
Elk heeft een eigen icoon.
Maten: `rib--sm` 34px, standaard 44px, `rib--lg` 58px, `rib--xl` 72px.
`rib--num` zet de waarde in mono met tabelcijfers -- voor getallen die
bijwerken, zodat ze niet staan te dansen.

Alle vlakken spreken die taal, ook de onderbalk: de vier kaarten daar zijn
`rcard`s en hun bijschrift draagt hetzelfde icoon als het kopblok van een
ribbon. Wat de taal *niet* kan bijstylen is het Raider.IO-widget-iframe;
dat komt van een ander domein. Vandaar dat de raidkaart standaard op
`liveTracking.mode: 'native'` staat -- dezelfde gegevens, zelf getekend.

**Wat er niet in zit** is het volvlakse kleurverloop uit het origineel. Grote
verzadigde vlakken en gradients kosten bitrate die de gameplay nodig heeft, en
banden op 8000 kbps. De kleur zit in het kopblok en het bijschrift -- kleine
vlakken.

Twee dingen om te weten als je gaat sleutelen:

- De 1px omlijning komt overal uit **twee lagen `clip-path`** over elkaar. Een
  gewone `border` volgt een schuine clip-path niet mee; die wordt weggeknipt.
- Een bijschrift dat op de rand van een kaart rijdt moet **buiten** het geklipte
  element staan. `clip-path` klipt ook absoluut gepositioneerde kinderen.
  Vandaar `.rcard-wrap` om `.rcard` heen.

### Waar het vandaan komt

Vul je JWT in bij `streamelements.jwt` -- die heb je toch al nodig voor de
alerts. Verder niets. Geen extra programma, geen aparte app naast OBS.

Twee dingen gebeuren dan:

1. `channels/me` + `sessions/{id}` halen de **huidige stand** op, zodat
   'laatste volger' meteen gevuld is in plaats van pas bij de volgende follow.
   Ververst elke 90 s.
2. De socket houdt het daarna **live** bij.

CORS staat open bij SE (`access-control-allow-origin: *`, en de preflight staat
de `authorization`-header expliciet toe), dus dit mag rechtstreeks vanuit een
browser source.

> Ongetest tot je het token invult -- ik kon deze aanroepen hier niet
> uitproberen zonder jouw JWT. De 401 die ik terugkreeg met een neptoken
> bewees wel dat het endpoint bestaat en dat de browser erbij mag.

## 6. Live boss progress

De boss-progress uit je oude Raider.IO-widget zit er nu in, maar getekend in
je eigen stijl: bossportret, naam, een tag (`down` / `progress`) en de
**pull-historie als staafjes** -- hoger betekent meer boss-HP eraf, de kill
kleurt jade, je beste poging lichtgrijs.

Als je nog mídden in een boss zit toont hij het **beste percentage** groot in
goud, met daaronder het aantal pulls en de fase waarin die beste poging
strandde -- bijvoorbeeld `12.22%` / `beste van 184 pulls · P3`. Is de boss
down, dan wordt het het aantal pulls tot de kill, in jade.

Twee dingen die ik hier fout had en die de moeite waard zijn om te weten als
je zelf aan `js/rio-live.js` sleutelt:

- `bestPercent` uit de API is **al een percentage** (`12.22` = 12,22%), geen
  fractie. Vermenigvuldigen met 100 geeft 1222%.
- De pulls hebben `boss_percent` én `overall_percent`. Het eerste is
  **fase-relatief**: een pull die P3 haalde staat op `boss_percent 0.489`
  terwijl `overall_percent 0.122` is. Sorteer je op `boss_percent`, dan lijkt
  een pull die in P1 sneuvelde op 60% béter dan een P3-pull op 49%. Voor de
  sparkline en de beste poging moet je `overall_percent` hebben.

Dat draait op twee endpoints:

```
https://raider.io/api/v1/live-tracking/bossprogress?...
https://raider.io/api/v1/live-tracking/bosspulls?...
```

**Die staan niet in Raider.IO's publieke API-documentatie.** Het zijn de calls
die hun eigen boss-progress widget doet; ik heb ze afgeleid uit de
netwerkverzoeken van `raider.io/widgets`. Praktische gevolgen:

- Ze kunnen zonder aankondiging veranderen of verdwijnen. Gebeurt dat, dan
  verdwijnt alleen dit blok -- `js/rio-live.js` faalt stil en de rest van de
  banner draait door.
- CORS staat open (de server spiegelt je Origin) en de responses hebben
  `cache-control: max-age=10`, dus pollen is goedkoop. Standaard elke 30 s.
- Uitzetten kan met `liveTracking.enabled: false` in `config.js`.
- `mode: 'native'` is de standaard, omdat het widget-iframe van een ander
  domein komt en dus niet in de huisstijl te krijgen is. Wil je toch hun
  eigen widget: `mode: 'widget'`.
- `difficulty` staat op `mythic`, niet op `latest`. 'latest' betekent bij
  Raider.IO "waar het laatst iets gebeurde", en dat sleept eenbaas-raids mee:
  de kaart stond zo op `1/1 Heroic` in de Tidebound Grotto terwijl de guild
  op `2/8 Mythic` in de hoofdraid zat. Diezelfde slug bepaalt welke tier de
  characterkaart toont, zodat de twee kaarten niet uit elkaar lopen.

Het handmatige `progressNote` blijft bestaan als terugvaloptie voor als je
het zelf wil typen.

Wat er wel uit blijft: geluid bij de alerts.

## 7. Scenes, Just Chatting en de transitie

### Starting / BRB / Ending

Eén pagina, drie standen via de URL:

| Scene | URL | Wat |
|---|---|---|
| Straks live | `scene.html?mode=starting` | aftellen, onderwerp, schema, socials, recente supporters |
| Even weg | `scene.html?mode=brb` | klok telt op, chat blijft zichtbaar zodat mensen blijven |
| Einde | `scene.html?mode=ending` | afsluiter, schema, socials |

Allemaal browser source, `2560 x 1440`, positie `0, 0`. Aftelduur, onderwerp,
schema en socials staan in `config.js` onder `scenes`. De dag van vandaag
kleurt jade in het schema, en een regel met `note` krijgt er een tagje bij --
zo staat er `20:00 - 23:00` `RAID` achter je raidavonden.

**De klok begint te lopen zodra de scene in beeld komt**, niet zodra OBS de
pagina laadt. Dat is het verschil tussen een aftelklok die op 10:00 begint als
je 'straks live' opzet, en een die al op 'bijna zover' staat omdat de browser
source al een uur meedraaide in een andere scene. Hetzelfde geldt voor 'even
weg', die anders meteen op een half uur stond. OBS' eigen
`obsSourceActiveChanged` / `obsSourceVisibleChanged` geven dat moment door;
in een gewone browser doet `visibilitychange` hetzelfde. Je hoeft *Refresh
browser when scene becomes active* dus niet aan te zetten.

Hier mag wél animatie staan -- de halo draait langzaam rond, de klok tikt --
want op deze schermen is er geen gameplay die om bitrate vecht. Dat is precies
de reden dat de banner het zonder moet doen.

### Achtergrond van de scenes

Op de scene-schermen staat geen gameplay die om bitrate vecht, dus daar mag
beweging wél. Maar geen verlopen: een zachte was van `#0a0b0d` naar iets
lichters is over 1000px maar een handvol 8-bit stappen, en dat geeft
zichtbare concentrische banden. De diepte komt daarom uit vlakke vormen.

Het motief komt van Amused: *flowing ribbons*. `css/backdrop.css` +
`js/backdrop.js` leggen achter de scene-schermen:

- **vier banen** als bezier-paden, die aan beide kanten 200px buiten het doek
  doorlopen en elkaar kruisen. Dat kruisen is het punt: waar twee banen over
  elkaar liggen is het vlak iets lichter, en dat is de enige schaduw in het
  hele ontwerp -- gemaakt met geometrie in plaats van met een verloop. Ze
  schuiven over 62 tot 110 seconden een stukje op;
- **één scherpe jade haarlijn** op de bovenrand van de dunne baan, door de
  open strook onder de klok. Zonder zo'n lijn wordt een veld van vlakken op
  een paar procent dekking pap; met meer dan één gaat het strepen;
- een handvol traag opstijgende stofjes (de mist van een Mistweaver),
  deterministisch geplaatst zodat elke scenewissel er hetzelfde uitziet.

De vorm van elke baan zit in vier y-waarden in `BANDS` (`js/backdrop.js`);
de x van de controlepunten staat vast. De compositie houdt het midden leeg:
tussen y 520 en 800 zit daar niets, want daar staat de klok.

Uitzetten met `scenes.background: 'plain'`.

Drie dingen die hier fout zaten en die de moeite waard zijn als je gaat
sleutelen:

- De banen stonden op `skewX`. Skew schuift alleen horizontaal: de boven- en
  onderrand blijven kaarsrecht. Over 2560px las dat niet als een schuine
  ribbon maar als drie **horizontale strepen** met een harde rand -- precies
  het bandeneffect dat hierboven de reden is om geen verlopen te gebruiken.
  Een kromme rand kan alleen uit een pad komen, niet uit een transform.
- Ze stonden op 2% dekking en waren op stream onzichtbaar. Een plat vlak kost
  de encoder niets extra, ook niet als het lichter is -- het is het verloop
  dat betaalt. Nu 2,5 tot 7%.
- Just Chatting krijgt **geen** achtergrond meer. Dat vlak ligt over de hele
  stage, en de camera is daar een transparant gat: de banen en de stofjes
  dreven dwars over de webcam. Buiten het gat is er op die indeling
  nauwelijks ruimte over, dus er valt niks te missen.

### Gebeurtenisbalk onder de camera

Bij een follow, sub, cheer, tip of raid schuift er een ribbon omhoog over het
naamplaatje van je camera, houdt vier à vijf seconden aan en zakt weer weg.
Eén tegelijk; bij een giftbom stapelen ze netjes achter elkaar in plaats van
over elkaar. Zit zowel in de onderbalk (compact, over het plaatje heen) als in
Just Chatting (breed, over de onderrand van het camerabeeld).

Staat in `js/camevent.js`; hij hangt aan dezelfde eventstroom als de alerts,
dus je hoeft niets extra's in te stellen.

### Just Chatting

`chatting.html`, browser source `2560 x 1440` op positie `0, 0`. Camera links
als transparant gat, chat rechts, socials en recente events eronder. De
streamtitel komt automatisch van Twitch.

Webcam-source hiervoor:

| | |
|---|---|
| Position | `60`, `196` |
| Bounding Box Type | Scale to outer bounds |
| Bounding Box Size | `1650` x `930` |

Zelfde volgorde als in de gameplayscene: de browser source ligt **boven** de
camera.

### Stinger-transitie

Een stinger is een videobestand, geen webpagina. `stinger.html` tekent één
frame (framenummer via de URL) en `build-stinger.sh` rendert ze los af en
plakt er een webm met alphakanaal van.

De vorm is nagemaakt naar de stingers uit Amused, die uit drie acts bestaan:

1. Een paneel schuift in met een **golvende voorrand** -- geen rechte diagonaal
   maar twee sinussen over elkaar -- met een jade band die er net voor uit loopt
   als schaduw.
2. Op het dekpunt staat het merk in beeld.
3. Een **iris opent** vanuit het midden: een jade ring op de rand van het gat,
   een dunne witte halo eromheen, en twee sikkels die meedraaien terwijl hij
   opengaat.

Het gat is een `radial-gradient` met een **harde stop**, geen zachte overgang,
dus er valt niets te banden.

Duur 1000 ms bij 30 frames; het beeld is dicht op 440 ms en de iris begint op
500 ms, dus het transitiepunt ligt op de helft.

Dan in OBS onder **Scene Transitions > Stinger**:

| | |
|---|---|
| Video File | `stinger.webm` |
| Transition Point | `500` ms |

Het beeld is exact op de helft van de duur volledig dicht, dus dat transitiepunt
is geen schatting. Wil je 'm sneller of trager: `./build-stinger.sh 24` voor
800 ms, `./build-stinger.sh 36` voor 1,2 s -- het transitiepunt is altijd de
helft, en `make-obs-collection.py` leest de duur uit met ffprobe zodat het
vanzelf meeloopt. De tekst staat in `config.js` onder `stinger.text`.

Technisch: VP9 met `yuva420p` en `-auto-alt-ref 0`; zonder die laatste vlag
gooit libvpx het alphakanaal weg. `ffprobe` meldt `pix_fmt=yuv420p` -- dat
klopt, VP9 zet alpha in een aparte stream, zichtbaar aan `alpha_mode=1`.

## 7b. Als er iets niet werkt

Zet `?health=1` achter de URL van een browser source. Dan verschijnt rechtsboven
een regeltje met de bronnen die niet reageren. Standaard staat dat uit: een rode
"offline" in beeld is erger dan het probleem dat hij meldt.

De onderdelen falen onafhankelijk van elkaar, met opzet:

| Valt weg | Gevolg |
|---|---|
| StreamElements-socket | geen live events; labels blijven werken via de REST-aanroep |
| StreamElements-REST | labels blijven leeg; events komen nog binnen |
| Raider.IO | character en boss progress leeg; de rest draait door |
| DecAPI | kijkers en uptime leeg |
| Twitch IRC | chat leeg; herverbindt vanzelf met oplopende wachttijd |

`socket.io` wordt **meegeleverd** in `vendor/`, niet van een CDN gehaald. Dat
was eerder wel zo, en als die aanroep faalde viel niet alleen de socket weg maar
ook de labels -- die stonden achter dezelfde controle.

### Geen alerts, geen events

Twee dingen om na te lopen, in deze volgorde:

1. **Staat `__JWT__` nog in je bron-URL?** De kant-en-klare collectie levert
   die plaatshouder mee en je hoort hem te vervangen. Deed je dat niet, dan
   weigert SE het token en komt er nooit een event binnen -- geen alerts, geen
   regels in 'recent', geen labels. Sinds kort schrijft de overlay daar een
   duidelijke fout over in de console (F12 in de bron-eigenschappen) en gooit
   ze het neptoken weg in plaats van het te proberen. `?health=1` zet
   `streamelements` dan op offline.
2. **Werkt de alert zelf?** `alerts.html?test=1` loopt door alle types heen:
   volger, sub, bits, raid, tip. Zie je die wel en echte events niet, dan zit
   het in het token of in de socket, niet in de weergave.

En zet StreamElements' eigen alert-overlay uit als je deze gebruikt, anders
krijg je elke follow dubbel.

## 8. Bestanden

```
topbar.html      sessiestatus boven je beeld  (2560 x 120)
banner.html      databalk onder je beeld      (2560 x 248)
alerts.html      alerts over je beeld         (2560 x 1072)
config.js        jouw instellingen            (gitignored)
css/tokens.css   palet, typografie, motion
css/ribbon.css   gedeelde vormtaal (ribbons, kaarten)
css/backdrop.css achtergrond van scenes en Just Chatting
css/topbar.css   bovenbalk
css/banner.css   onderbalk
css/alerts.css   alerts
js/util.js       helpers
js/raiderio.js   character + guild
js/rio-live.js   live boss progress + pull-historie
scene.html       starting / brb / ending      (2560 x 1440)
chatting.html    Just Chatting                (2560 x 1440)
stinger.html     één frame van de transitie
build-stinger.sh rendert stinger.webm
css/scene.css    scenes
css/chatting.css Just Chatting
js/scene.js      scenes
js/chatting.js   Just Chatting
js/chat.js       Twitch IRC
js/labels.js     labelopslag
vendor/socket.io.js  meegeleverd, geen CDN
js/stats.js      DecAPI
js/streamelements.js  SE socket
js/ribbon.js     ribbon- en kaartbouwer
js/backdrop.js   achtergrond
js/camevent.js   gebeurtenisbalk onder de camera
js/topbar.js     bovenbalk
js/banner.js     onderbalk
js/alerts.js     alert-wachtrij
```

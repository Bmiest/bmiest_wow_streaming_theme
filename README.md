# bmiest overlay

Twitch overlay for a 3440x1440 ultrawide that goes out to Twitch as 2560x1440.
The 368px left over at the bottom becomes the banner: camera, characters, raid
progress, chat and stats.

The shape language is borrowed from Nerd or Die's *Amused* (capsules, ribbon
bars, plenty of white space, short micro-animations), but drained of colour:
charcoal, white and grey, with Priest white and a muted Mistweaver jade
(`#3fd9a4`) as the only accents.

The house style belongs to the channel **bmiest**. Kelderklasse only appears
where it is data -- your guild's raid progress -- never as a brand.

---

## 1. One-time setup

Settings come from three layers, in this order:

| Layer | File | Secrets? |
|---|---|---|
| 1 | `config.default.js` | no -- shared, may be public |
| 2 | `config.js` (optional) | yes -- listed in `.gitignore` |
| 3 | the browser source URL | yes |

**Your JWT belongs in layer 3.** Pass it as a parameter:

```
topbar.html?jwt=eyJ...
```

That URL only lives in your OBS configuration, exactly the way StreamElements'
own overlay URL works. The token never has to sit on disk, and the overlay can
be hosted.

Prefer to keep it local? Create `config.js` with
`window.OVERLAY_OVERRIDE = { streamelements: { jwt: '...' } };`

```bash
./serve.sh                       # http://localhost:8777
```

Looking at it without OBS:

| URL | what |
|---|---|
| `http://localhost:8777/banner.html?demo=1` | banner with fake data |
| `http://localhost:8777/banner.html` | banner with your real data |
| `http://localhost:8777/alerts.html?test=1` | alerts, cycles through every type |

In a normal browser the camera area is **white**. That is correct: there is a
transparent hole there. In OBS you see your webcam through it.

---

## 1b. Hosted on GitHub Pages

The overlay is live at
**https://bmiest.github.io/bmiest_wow_streaming_theme/**

That leaves nothing to install: no zip, no paths, no server, no Python. OBS
fetches the pages directly, and updating is a `git push`.

Your JWT goes in the URL:

```
https://bmiest.github.io/bmiest_wow_streaming_theme/topbar.html?jwt=eyJ...
```

That URL only lives in your OBS configuration. `config.js` is in `.gitignore`
and returns a 404 on the site, so your token is never public.

The **front page of the site** (`index.html`) is an overview: a live preview of
the overlay in the proportions it has on your stream, every source URL with a
copy button, and the sizes and positions OBS asks for. Those previews are the
real pages in an `iframe`, scaled down -- not screenshots, so nothing goes
stale when the overlay changes.

### The collection

Ready to download:
**[`obs-scene-collection.pages.json`](obs-scene-collection.pages.json)**

Or generate it yourself:

```bash
./make-obs-collection.py \
  --base-url https://bmiest.github.io/bmiest_wow_streaming_theme \
  --os windows --jwt '__JWT__' --stinger '__STINGER__'
```

Open the file in a text editor and replace:

| Placeholder | With |
|---|---|
| `__JWT__` | your StreamElements JWT |

That is all. The stinger is deliberately **not** in there: it would put a path
full of backslashes into the JSON, and that is the one place where editing by
hand can break. Add it in OBS itself:

**Scene Transitions -> + -> Stinger** -> point it at `stinger.webm` ->
Transition Point at `500` ms.

Then drop the file in `%APPDATA%\obs-studio\basic\scenes\`, start OBS and pick
**bmiest overlay** under Scene Collection.

> **The stinger has to be local.** OBS' stinger transition will not play video
> from a URL. Download `stinger.webm` from the site and point `__STINGER__` at
> it. Everything else comes from the web.

After that, only the two `[VERVANG]` placeholders are left: replace them with
your Game Capture and your camera.

## 2. OBS -- video settings

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
| Pre-Analysis | on |
| VBAQ | on |

Pre-Analysis and VBAQ are off by default and are exactly what AMF needs for
dark, busy footage: they spread the bitrate across the frame more sensibly.
Turn them on.

### What actually goes out

Those Output settings are not what leaves the machine. With **Enable Enhanced
Broadcasting** on (Settings > Stream), Twitch supplies its own encoder
configuration, and OBS shows a banner saying Twitch is controlling some of your
stream settings. The encoder dropdown still reads H.264, because OBS' plain
Twitch profile only offers H.264 -- you cannot pick HEVC there by hand.
Enhanced Broadcasting does it for you.

Twitch Inspector for the broadcast of 8 September 2026, 23:54:52 - 00:01:57,
shows four simultaneous video encodes:

| Track | Codec | Resolution | FPS | Bitrate |
|---|---|---|---|---|
| landscape #1 | H.265/HEVC | 2560x1440 | 60.03 | 9,033 Kbps |
| landscape #2 | H.264/AVC | 1920x1080 | 60.03 | 7,523 Kbps |
| landscape #3 | H.264/AVC | 1280x720 | 60.03 | 3,519 Kbps |
| landscape #4 | H.264/AVC | 640x360 | 30.02 | 505 Kbps |

Audio is AAC at 48 kHz, once for the live stream and once for the Twitch VOD.
The two top tracks line up with the targets Twitch publishes for Enhanced
Broadcasting: 9 Mbps for 1440p HEVC and 7.5 Mbps for 1080p AVC.

Three things follow from that table.

**The top track is 1440p60 HEVC, not H.264 at 8000.** HEVC fits more detail
into the same bitrate than AVC does, which is why busy raid footage holds up
better than it used to. The change was AVC to HEVC, both on the GPU: the AMD HW
H.264 encoder was already hardware encoding, so this was never CPU work. The
RX 6950 XT has been able to encode HEVC since it launched in 2022; what was
missing was Twitch accepting it, and Enhanced Broadcasting is that path. No
hardware upgrade unlocked this.

**All four encodes happen on your PC.** Added up that is roughly 20.6 Mbps of
video going upstream, plus audio and overhead, rather than the 8 Mbps under
Output. If that is too much for your connection, cap it under **Stream >
Maximum Streaming Bandwidth** and limit the number of simultaneous encodes with
**Maximum Video Tracks**. Both are on automatic by default.

**The bottom rungs are why this overlay looks the way it does.** The 720p track
gets 3.5 Mbps and the 360p one gets 505 Kbps, and the overlay is scaled into
both of them. Flat fills, no gradients and no full-width motion cost the encoder
almost nothing at any rung; a gradient across 2560px costs it every frame, and
banding shows up on the low rungs first. The design rules in section 5 and
section 7 exist for that reason, and Enhanced Broadcasting does not retire them.

> If a raid pull still looks blocky, 1440p48 or a 1920x1080 canvas is the knob
> that pays the most. Raising the manual bitrate does nothing while Enhanced
> Broadcasting is in charge of the ladder.

---

## 3. OBS -- the sources

The URLs below are the hosted ones; the ready-made collection in 1b fills them
in already. Working locally instead? Put `./serve.sh` in front and it becomes
`http://localhost:8777/...` -- and then you can leave `?jwt=` off, because
locally the overlay reads your token from `config.js`.

The 368px left over is split in two: a thin status strip **above** the gameplay
and a wider data bar **below** it.

```
  y=0      +--------------------------------------+  120  top bar
  y=120    |                                      |
           |          gameplay 2560 x 1072        |
  y=1192   +--------------------------------------+  248  bottom bar
  y=1440   +--------------------------------------+
```

The top holds session status (live, uptime, title, viewers, followers), the
bottom holds content (camera, characters, boss progress, chat, events).
Splitting it evenly (184/184) also works, but then the top is roomier than what
sits in it and the bottom too tight for camera plus characters. Change it in
`config.js` under `layout` -- the three numbers have to add up to 1440.

Order in the scene, **top to bottom**:

```
1. Alerts        (browser)
2. Top bar       (browser)
3. Bottom bar    (browser)
4. Webcam        (video capture device)
5. Gameplay      (game/display capture)
```

The bottom bar has to sit above the webcam: it punches the hole and draws the
frame and the name plate over it.

### Top bar

Source > **Browser**:

| | |
|---|---|
| URL | `https://bmiest.github.io/bmiest_wow_streaming_theme/topbar.html?jwt=eyJ...` |
| Width | `2560` |
| Height | `120` |
| Custom frame rate | on, `30` FPS |
| Shutdown source when not visible | **off** |

Transform > Position `0`, `0`.

Everything in this bar except the stream title is a ribbon: status on the left
(head block with a broadcast icon, value is your uptime or `offline`), then the
label rail, then viewers and followers on the right. As long as a ribbon has no
value it sits muted, exactly like an empty label. The follower goal is a small
bar inside the follower ribbon itself.

### Gameplay

Game Capture or Display Capture, then right-click > **Transform > Edit
Transform**:

| | |
|---|---|
| Position | `0`, `120` |
| Bounding Box Type | Scale to inner bounds |
| Bounding Box Size | `2560` x `1072` |

3440x1440 fits exactly: 3440/1440 and 2560/1072 differ by 0.03%.

### Bottom bar

Source > **Browser**:

| | |
|---|---|
| URL | `https://bmiest.github.io/bmiest_wow_streaming_theme/banner.html?jwt=eyJ...` |
| Width | `2560` |
| Height | `248` |
| Custom frame rate | on, `30` FPS |
| Shutdown source when not visible | **off** |
| Refresh browser when scene becomes active | **off** |

Transform > Position `0`, `1192`.

30 FPS is enough -- no animation in the bars needs 60, and it saves render time
your encoder can put to better use. Those two checkboxes being off is what lets
your chat history survive a scene switch.

The character card used to carry a feather watermark. In a card 189px tall only
one lobe of it landed inside the frame, right behind the second character's
name: not a watermark any more, just a smudge. It is still on the scene screens,
where it has the room.

Two things about the chat in this bar, because both were wrong:

- A chat line is **text, not a row of boxes**. As a flex row, badge and name
  stayed on the first line while the message dropped into its own column: a gap
  under the name and badge, and on a three-line message the badge sank to the
  middle of the row (`align-self:center` on a row that grows). Badge, name and
  text now run inline, so it wraps the way chat should wrap. Same fix in Just
  Chatting and on the BRB screen.
- `min-height:0` on `.rcard-wrap` is not a detail. A grid item does not shrink
  below its content by default (`min-height:auto`), so the moment a long message
  arrived the card became 225px tall in a 200px row and ran out below the bar:
  `#stage` cut the last line off. With that zero the chain `.rcard-wrap` ->
  `.rcard` -> `.rcard__in` -> `#chatList` can shrink, and the oldest line slides
  away under the mask at the top the way it was meant to. `banner.html?demo=1`
  deliberately includes one long message.

The four panels (characters, raid, chat, recent) are `rcard`s from
`css/ribbon.css`: bottom-right corner cut off, a 1px outline made of two clipped
layers, and the caption as a tag on the top edge carrying the same icon a ribbon
wears in its head block. The camera hole has that same cut corner, and the name
plate under it is a real ribbon, the same one used by the event bar that slides
over it.

### Alerts

Source > **Browser**:

| | |
|---|---|
| URL | `https://bmiest.github.io/bmiest_wow_streaming_theme/alerts.html?jwt=eyJ...` |
| Width | `2560` |
| Height | `1072` |
| Shutdown source when not visible | off |

Transform > Position `0`, `120` -- alerts belong over the gameplay, and that
now starts 120px lower.

> Turn StreamElements' own alert overlay off if you use this one, or every
> follow shows up twice.

The alert is a ribbon: caption with the event type, coloured head block with an
icon, and the name large. It slides down 34px while it fades in, the head block
flashes briefly, and after 5.2 seconds it slides away again. Subs and tips get a
small pill with the tier or amount, and the message below it.

### Webcam

Video Capture Device, then **Transform > Edit Transform**:

| | |
|---|---|
| Position | `24`, `1216` |
| Bounding Box Type | Scale to outer bounds |
| Bounding Box Size | `340` x `200` |
| Alignment in Bounding Box | Center |

*Outer bounds* fills the area and crops the sides off your 16:9 image, which is
what you want, otherwise you get bars. You do not have to arrange the shape: it
comes from the hole the banner punches over it, square corners with the same cut
bottom-right corner as the cards. No Image Mask/Blend filter needed.

Want the camera somewhere else, or bigger? The measurements live in three places
across `css/banner.css` and `banner.html`, and they have to stay in step:
`.ground__hole` (position and size of the hole), `.ground__frame` (same
position; the outline is a polygon, because a `border` will not follow a
diagonal) and the `340px` column in `.banner`. Then carry the same numbers into
the OBS transform.

---

## 4. Where each piece of data comes from

| Data | Source | Auth |
|---|---|---|
| Chat | Twitch IRC websocket (anonymous) | none |
| Characters, raid progress | Raider.IO public API | none |
| Followers, viewers, uptime, title | DecAPI | none |
| Follows, subs, cheers, tips, raids | StreamElements realtime socket | JWT |
| Labels (last follower, last sub, ...) | StreamElements session API | JWT |

Split on purpose: SE delivers the events and the labels, DecAPI the totals. That
way your follower count does not disappear when your SE session hiccups.

### How often it updates

Three different clocks, and the slowest one is not in this overlay.

**Characters, every 5 minutes.** `raiderio.pollSeconds` (300) drives that: once
on load, then every 300 s with up to 2 s of jitter so the pollers in the bar do
not all fire on the same second. Raider.IO does not serve live character data,
though. They crawl a character on their own schedule and stamp the response
with `last_crawled_at`. While that stamp is old, polling faster returns exactly
the same answer and nothing in the card moves during your stream; a fresh crawl
is something you trigger on raider.io, not here. `?health=1` reports the age of
the oldest crawl among the characters in the card (`raider.io: 45u oud`) once it
is over two hours old, so you can see at a glance whether you are on stage with
stale numbers.

**The raid card, every 30 seconds.** This is the one that moves on a raid night.
`liveTracking.pollSeconds` polls the two live-tracking endpoints, and their
responses carry `cache-control: max-age=10`, so they really are near live: the
pull count climbs, the best percentage drops, and on a kill the block flips to
"pulls to the kill" in jade, all within half a minute. In `widget` mode the
iframe carries `refresh=60` instead and Raider.IO refreshes its own widget every
60 s.

**Which tier, also every 5 minutes.** The character rows show the tier
Raider.IO's live tracking calls current, and that lookup runs on every poll
rather than once at load, so the cards follow the guild into a new raid without
the browser source having to reload. It costs one extra request per poll.

Everything else that is live stays live regardless: chat over the IRC websocket,
alerts and the event rows over the StreamElements socket, and viewers,
followers, uptime and title from DecAPI every 60 s in the top bar.

**The uptime ticks per second**, even though DecAPI is only asked once a
minute. It used to stand still for a minute and then jump a minute, which reads
as a broken clock. `Stats.uptime()` now returns seconds instead of formatted
text, and the top bar counts on from the last answer and re-syncs on every
poll: DecAPI stays the source, the ticking is just the in-between. The changing
area is a few mono digits, so it costs the encoder nothing worth mentioning.

### Moderation

A timeout, a ban or a deleted message arrives over the same anonymous IRC
connection as the chat itself. We already asked for the `commands` capability;
`handle()` in `js/chat.js` simply did not look at it, so a deleted message
stayed on screen. It does now:

| Twitch sends | Means | What happens |
|---|---|---|
| `CLEARMSG` with `target-msg-id` | one message deleted | that row goes |
| `CLEARCHAT` with a login | timeout or ban | every row from that person goes |
| `CLEARCHAT` without a login | chat cleared | the box empties |

Every chat row carries its message id and the sender's login as data
attributes, and `Chat.prune(box, what)` does the removal for all three chat
views. So no, you do not need to pull chat from StreamElements for this: their
widget reads the same IRC feed, and it would cost you a token for something the
anonymous connection already tells you. `banner.html?demo=1` gives its fake
messages an id and a login too, so the removal works there as well.

**Filled in and verified:**

- `twitch.channel` = `bmiest` -- 154 followers via DecAPI.
- `raiderio.characters` = Shiftheal on **EU-Ragnaros** (cross-realm member of
  Kelderklasse) and Bhikhu on **EU-Twisting Nether** (Mistweaver monk,
  Kelderklasse). Item level and score are not written down here on purpose:
  they change, and the card shows them. They sit side by side in the
  character card; add more and the card rotates through them in pairs. For a
  cross-realm member Raider.IO returns no guild on the character itself, so the
  realm shows under such a name; the guild already appears with the raid
  progress.
- Under each character is that character's **own raid progress** per difficulty
  (`2/8 M`, `8/8 H`, `8/8 N`), instead of the highest key of the week. The
  highest difficulty with kills is tinted jade. Which tier that is comes from
  Raider.IO's live tracking, the same source as the raid card beside it:
  `raid_progression` itself does not say which of its keys is the current one,
  and the last one is not always it.
- `raiderio.guild` = Kelderklasse on EU-Draenor.
- `goals.followers` = 200.

**Left for you:**

1. `streamelements.jwt` is empty in the shared config, and it should stay that
   way. Pass your token in the browser source URL instead (`?jwt=eyJ...`).
   Without a token, follows, subs, cheers and tips stay empty. Find it on
   streamelements.com under Account Settings > Show secrets > JWT Token.

## 5. Labels

"Labels" are single facts about your channel that update live: last follower,
last sub, biggest donation, counts for this session. Unlike the event list
(which is chronological) every label has a fixed spot and shows exactly one
thing.

**Why this is not automatic:** Twitch closed its public follower endpoint.
DecAPI answers it with `410 Gone - this API has been deprecated`. Your follower
*count* still works, but who your last follower is has to come from somewhere
else.

### Which labels the bar shows

In `config.js` under `topbar.labels`, as an ordered list:

```js
topbar: {
  showTitle: false,
  labels: [
    'follower-latest',      // last follower
    'subscriber-latest',    // last sub
    'cheer-latest',         // last bits
    'tip-top',              // top donation
  ],
},
```

Available, with the key names **exactly as StreamElements delivers them**:

| Key | Shows |
|---|---|
| `follower-latest` | last follower |
| `follower-session` / `-week` / `-total` | followers this stream / week / total |
| `subscriber-latest` | last sub |
| `subscriber-new-latest` | last new sub |
| `subscriber-gifted-latest` | last gifted sub |
| `subscriber-alltime-gifter` | biggest gifter |
| `subscriber-session` | subs this stream |
| `cheer-latest` / `cheer-session` | last bits / bits this stream |
| `cheer-alltime-top-donator` | top cheer |
| `tip-latest` / `tip-session` | last tip / tips this stream |
| `tip-alltime-top-donator` | top donation |
| `raid-latest` | last raid |

Watch out: SE has no `tip-top` or `cheer-top`. Those are
`tip-alltime-top-donator` and `cheer-alltime-top-donator`. A key that does not
exist raises no error, the pill simply never appears.

SE reports "nothing has happened yet" as the **number 0**, not as empty. Both
`display()` in `js/streamelements.js` and `Labels.set()` catch that, otherwise
your bar literally reads `0`.

**Labels without a value** do stay on screen by default, but muted: grey head
block, a dash for the value. That keeps the layout fixed and shows viewers that
bits and tips are possible. As soon as a value arrives the pill lights up in its
own colour.

Prefer a quieter bar that only shows what is really there? Set
`topbar.showEmptyLabels` to `false`; then they appear once something has
happened.

### The shape: ribbons

The whole overlay shares one shape language, borrowed from Amused ("flowing
ribbons", "angled ribbon aesthetic"): bars that taper to the right, captions as
a tag on the edge, and a coloured head block with an icon.

That language lives in `css/ribbon.css` and `js/ribbon.js`, one source for every
page, so the bars, the scenes, Just Chatting and the transition cannot drift
apart. `Ribbon.make(kind, caption, value, size)` builds a ribbon,
`Ribbon.card(caption, kind)` a card with a cut corner.

Kinds and their tint: `follow`, `raid`, `live` and `cam` jade, `sub` white,
`cheer` and `tip` gold, `sword` white, `link`/`info`/`neutral`/`viewers` grey.
Each has its own icon.
Sizes: `rib--sm` 34px, default 44px, `rib--lg` 58px, `rib--xl` 72px. `rib--num`
sets the value in mono with tabular figures, for numbers that update, so they do
not dance.

Every panel speaks that language, the bottom bar included: the four cards there
are `rcard`s and their caption carries the same icon as a ribbon's head block.
What the language *cannot* restyle is the Raider.IO widget iframe; that comes
from another domain. Which is why the raid card defaults to
`liveTracking.mode: 'native'`, the same data drawn here.

**What is not in it** is the full-surface colour gradient from the original.
Large saturated areas and gradients cost bitrate the gameplay needs, and they
band on the lower rungs of the ladder in section 2. The colour sits in the head
block and the caption instead: small areas.

Two things worth knowing before you start changing it:

- The 1px outline is everywhere made of **two `clip-path` layers** on top of
  each other. A normal `border` does not follow an angled clip-path; it gets
  clipped away.
- A caption riding the edge of a card has to sit **outside** the clipped
  element. `clip-path` clips absolutely positioned children too. Hence
  `.rcard-wrap` around `.rcard`.

### Where it comes from

Fill in your JWT and that is it. No extra program, no separate app next to OBS.
Two things then happen:

1. `channels/me` + `sessions/{id}` fetch the **current state**, so "last
   follower" is filled in immediately instead of only at the next follow.
   Refreshes every 90 s.
2. The socket keeps it **live** after that.

CORS is open at SE (`access-control-allow-origin: *`, and the preflight
explicitly allows the `authorization` header), so this is allowed straight from
a browser source. Confirmed working with a real token: the top bar fills its
labels from the session API within a second of loading.

## 6. Live boss progress

The boss progress from your old Raider.IO widget is in here, but drawn in your
own style: boss portrait, name, a tag (`down` / `progress`) and the **pull
history as bars**. Taller means more boss HP gone, the kill is jade, your best
attempt light grey.

While you are still mid-boss it shows the **best percentage** large in gold,
with the pull count and the phase that best attempt died in underneath, for
example `12.22%` / `best of 184 pulls, P3`. Once the boss is down it becomes the
number of pulls to the kill, in jade.

Two things I had wrong here that are worth knowing if you go into
`js/rio-live.js` yourself:

- `bestPercent` from the API is **already a percentage** (`12.22` = 12.22%), not
  a fraction. Multiplying by 100 gives you 1222%.
- The pulls carry both `boss_percent` and `overall_percent`. The first is
  **phase-relative**: a pull that reached P3 sits at `boss_percent 0.489` while
  `overall_percent` is 0.122. Sort on `boss_percent` and a pull that died in P1
  at 60% looks *better* than a P3 pull at 49%. The sparkline and the best
  attempt need `overall_percent`.

It runs on two endpoints:

```
https://raider.io/api/v1/live-tracking/bossprogress?...
https://raider.io/api/v1/live-tracking/bosspulls?...
```

**Neither is in Raider.IO's public API documentation.** They are the calls their
own boss-progress widget makes; I derived them from the network requests on
`raider.io/widgets`. Practical consequences:

- They can change or disappear without notice. If that happens only this panel
  goes empty: `js/rio-live.js` fails quietly and the rest of the banner keeps
  running.
- CORS is open (the server mirrors your Origin) and the responses carry
  `cache-control: max-age=10`, so polling is cheap. Every 30 s by default.
- Turn it off with `liveTracking.enabled: false` in `config.js`.
- `mode: 'native'` is the default, because the widget iframe comes from another
  domain and therefore cannot be brought into the house style. If you do want
  their own widget: `mode: 'widget'`.
- `difficulty` is set to `mythic`, not `latest`. At Raider.IO 'latest' means
  "where something happened most recently", and that drags single-boss raids in:
  the card sat on `1/1 Heroic` in the Tidebound Grotto while the guild was on
  `2/8 Mythic` in the main raid. That same slug decides which tier the character
  card shows, so the two cards cannot contradict each other.

**It reacts to what happens.** Between two polls the card compares the pull
count, the best percentage and whether the boss is down:

- a new pull makes the newest bar in the sparkline grow in and the big number
  flash once. The rest of the series stays still, because animating the whole
  row on every poll is motion without news;
- a new best attempt (a *lower* percentage: that is boss HP still standing)
  slides a `new best` ribbon up over the card, which holds for five seconds and
  drops away, the same way the event bar moves over your camera's name plate;
- a kill does the same with `boss down` and the pull count.

On a different boss the comparison resets, otherwise the lower pull count of a
fresh boss would read as an improvement. And nothing fires on the first poll,
or the card would announce a pull from an hour ago the moment OBS starts.

The card itself cannot rise *above* its own edges: that source is 248px tall
and OBS clips it there. The full-screen version lives in `alerts.html`, which
covers the whole gameplay zone:

- a **kill** always fires one: `boss down`, the boss name large, the raid and
  difficulty under it, and the numbers of that pull -- pulls to kill, the
  phase, how long the fight ran and how many people died. Jade, held for 7.6
  seconds.
- a **new best** fires the same shape in gold with the percentage that was
  still standing, held for 5.6 seconds.

The wash behind it is flat and 72% opaque, so your gameplay stays faintly
visible and there is nothing to band. Duration and deaths come from the
`bosspulls` endpoint, which carries them per pull; `RioLive.pullOf()` picks the
pull the alert is about.

`liveTracking.alerts` decides what fires: `both` (default), `kill` for kills
only, or `off`. The alerts page keeps its own state and polls the same
endpoints as the bottom bar, so the two never have to agree on anything.
`alerts.html?test=1` ends its cycle with both of them.

The detection itself sits in `RioLive.watcher()`, not in either page: both
want to know what changed since the last poll, each with their own state.

`banner.html?demo=1` plays a short evening: the standing score, then a pull
with a new best, then the kill.

The manual `progressNote` stays as a fallback for when you would rather type it
yourself.

What stays out: sound on the alerts.

## 7. Scenes, Just Chatting and the transition

### Starting / BRB / Ending

One page, three modes via the URL:

| Scene | URL | What |
|---|---|---|
| Starting soon | `scene.html?mode=starting` | countdown, stream title, schedule, socials, recent supporters |
| Be right back | `scene.html?mode=brb` | clock counts up, chat stays visible so people stick around |
| Ending | `scene.html?mode=ending` | sign-off, schedule, socials |

The header has your channel on the left and viewers and followers on the right,
the same ribbons as the top bar, one size up. Viewers is there on the starting
screen too: go live while that screen is still up and it runs along, which is
exactly when you want to see it. Offline, DecAPI returns nothing and the ribbon
stays muted. The character used to be here as well; that is already the card in
the bottom bar, and on a screen that asks for attention on one thing it was
noise.

Under the clock, the starting screen shows the **stream title**, because Twitch
knows that better than a fixed line in the config. `scenes.topic` remains the
fallback for when DecAPI returns nothing usable.

All of them are browser sources, `2560 x 1440`, position `0, 0`. Countdown
length, fallback topic, schedule and socials live in `config.js` under `scenes`.
Today's day is tinted jade in the schedule, and a row with a `note` gets a small
tag after it, so your raid nights read `20:00 - 23:00` `RAID`. The day name has
to match the weekday list in `js/scene.js`, which is in English like the rest of
what ends up on screen; a name that does not match simply never highlights.

**The clock starts running when the scene comes on screen**, not when OBS loads
the page. That is the difference between a countdown that starts at 10:00 when
you put the starting screen up, and one that already reads "almost there"
because the browser source had been running for an hour in another scene. Same
for the BRB screen, which otherwise sat at half an hour immediately. OBS' own
`obsSourceActiveChanged` / `obsSourceVisibleChanged` pass that moment along; in
a normal browser `visibilitychange` does the same. So you do not need to turn
*Refresh browser when scene becomes active* on.

Animation is allowed here, the halo turns slowly and the clock ticks, because
these screens have no gameplay competing for bitrate. That is exactly why the
banner has to do without.

### Background of the scenes, and of the bars

One canvas of 2560x1440, three slices. The scene screens draw the whole thing;
the top bar and the bottom bar draw the same bands but show only the part that
falls at their own height, by offsetting the SVG `viewBox`. So the composition
runs on behind your gameplay: you see it in the top bar, and it comes back in
the gutters between the cards below. `Backdrop.slice(root, {top, height})` is
that slice; `Backdrop.mount(root)` is the whole canvas.

Two things had to give for the bars. Bands 5 and 6 exist because the top 120px
of the canvas was almost empty, so slicing it gave the top bar nothing to show.
And next to gameplay the drift runs three times slower, with only the bands
that actually cross a strip raised in opacity: a band at 2% in a 120px strip is
motion you cannot see, which is the expensive half without the payoff. Turn the
bars' backdrop off with `layout.background: 'plain'`; the scene screens have
their own switch below.

In the bottom bar the slice is clipped to everything right of x=384, so the
bands never drift across the camera hole. That is the same mistake Just
Chatting had, and there it was solved by leaving the backdrop off entirely.

No gameplay is fighting for bitrate on the scene screens, so movement is fine
there. Gradients are not: a soft wash from `#0a0b0d` to something lighter is
only a handful of 8-bit steps across 1000px, and that shows as concentric bands.
The depth comes from flat shapes instead.

The motif comes from Amused: *flowing ribbons*. `css/backdrop.css` +
`js/backdrop.js` put behind the scene screens:

- **four bands** as bezier paths, running 200px past the canvas on both sides
  and crossing each other. The crossing is the point: where two bands overlap
  the surface is slightly lighter, and that is the only shading in the whole
  design, made with geometry instead of a gradient. They drift a little over 62
  to 110 seconds;
- **one crisp jade hairline** on the top edge of the thin band, through the open
  strip below the clock. Without a line like that, a field of shapes at a few
  percent opacity turns to mush; with more than one it starts to stripe;
- a handful of slowly rising motes (a Mistweaver's mist), placed
  deterministically so every scene switch looks the same.

The shape of each band is four y values in `BANDS` (`js/backdrop.js`); the x of
the control points is fixed. The composition keeps the middle clear: nothing
sits between y 520 and 800 there, because that is where the clock is.

Turn it off with `scenes.background: 'plain'`.

Three things that were wrong here and are worth knowing if you go changing it:

- The bands were on `skewX`. Skew only shifts horizontally: the top and bottom
  edges stay dead straight. Across 2560px that did not read as an angled ribbon
  but as three **horizontal stripes** with a hard edge, exactly the banding that
  is the reason not to use gradients in the first place. A curved edge can only
  come from a path, not from a transform.
- They were at 2% opacity and invisible on stream. A flat shape costs the
  encoder nothing extra even when it is lighter; it is the gradient that pays.
  Now 2.5 to 7%.
- Just Chatting gets **no** background any more. That layer covers the whole
  stage, and the camera there is a transparent hole: the bands and the motes
  drifted straight across the webcam. Outside the hole that layout has almost no
  room left, so there is nothing to miss.

### Event bar under the camera

On a follow, sub, cheer, tip or raid, a ribbon slides up over your camera's name
plate, holds for four or five seconds and drops away again. One at a time; on a
gift bomb they queue up neatly instead of stacking on top of each other. It is
in the bottom bar (compact, over the plate) and in Just Chatting (wide, over the
bottom edge of the camera image).

It lives in `js/camevent.js` and hangs off the same event stream as the alerts,
so there is nothing extra to configure.

### Just Chatting

`chatting.html`, browser source `2560 x 1440` at position `0, 0`. Camera on the
left as a transparent hole, chat on the right, and a strip below it with your
socials on one side and recent activity on the other. The stream title comes
from Twitch automatically.

The character used to sit in the header here too. It is the card in the bottom
bar already, and on a screen where you are the subject it added nothing, so it
is gone (and with it the Raider.IO script on this page).

The recent column used to say "nothing yet this session" until something
happened during your stream, which is the moment the screen has the least to
say. StreamElements' session API does know who your latest follower and sub
are, so those fill the open slots, each with its own caption because "latest"
is not "this session". A real event pushes in on top and the bottom filler
drops off. Two rows, not three: the strip is 241px tall and three 44px ribbons
run out of it. That also matches the rhythm of the socials column next to it,
and both groups now spread to the edges of the strip instead of huddling on
the left with 900px of nothing beside them. Filling that column is why this
page loads `js/labels.js`.

Webcam source for this one:

| | |
|---|---|
| Position | `60`, `196` |
| Bounding Box Type | Scale to outer bounds |
| Bounding Box Size | `1650` x `930` |

Same order as in the gameplay scene: the browser source sits **above** the
camera.

### Stinger transition

A stinger is a video file, not a web page. `stinger.html` draws a single frame
(frame number via the URL) and `build-stinger.sh` renders them one by one and
assembles a webm with an alpha channel.

The shape is modelled on the stingers in Amused, which come in three acts:

1. A panel slides in with a **wavy leading edge**, not a straight diagonal but
   two sines layered over each other, with a jade band running just ahead of it
   as a shadow.
2. At full cover the brand sits on screen.
3. An **iris opens** from the middle: a jade ring on the edge of the hole, a
   thin white halo around it, and two crescents turning along as it opens.

The hole is a `radial-gradient` with a **hard stop**, not a soft transition, so
there is nothing to band.

Duration is 1000 ms at 30 frames; the image is closed at 440 ms and the iris
starts at 500 ms, so the transition point is at the halfway mark.

Then in OBS under **Scene Transitions > Stinger**:

| | |
|---|---|
| Video File | `stinger.webm` |
| Transition Point | `500` ms |

The image is fully closed at exactly half the duration, so that transition point
is not a guess. Want it faster or slower: `./build-stinger.sh 24` for 800 ms,
`./build-stinger.sh 36` for 1.2 s. The transition point is always half, and
`make-obs-collection.py` reads the duration with ffprobe so it follows along.
The text lives in `config.js` under `stinger.text`.

Technically: VP9 with `yuva420p` and `-auto-alt-ref 0`; without that last flag
libvpx throws the alpha channel away. `ffprobe` reports `pix_fmt=yuv420p`, which
is correct: VP9 keeps alpha in a separate stream, visible as `alpha_mode=1`.

## 7b. When something is not working

Put `?health=1` after a browser source URL. A small line then appears in the top
right listing the sources that are not responding, plus any source that answers
but has something to say: Raider.IO returning a crawl that is days old shows up
as `raider.io: 45u oud`. The line stays empty while there is nothing to report,
so visible means "look at this". It is off by default: a red "offline" on screen
is worse than the problem it reports.

The parts fail independently, on purpose:

| Drops out | Consequence |
|---|---|
| StreamElements socket | no live events; labels keep working via the REST call |
| StreamElements REST | labels stay empty; events still arrive |
| Raider.IO | characters and boss progress empty; the rest keeps running |
| DecAPI | viewers and uptime empty |
| Twitch IRC | chat empty; reconnects on its own with a growing delay |

`socket.io` is **bundled** in `vendor/`, not pulled from a CDN. It used to be,
and when that request failed it took out not just the socket but the labels too,
because they sat behind the same check.

### No alerts, no events

Two things to check, in this order:

1. **Is `__JWT__` still in your source URL?** The ready-made collection ships
   that placeholder and you are meant to replace it. If you did not, SE refuses
   the token and no event ever arrives: no alerts, no rows in 'recent', no
   labels. The overlay now writes a clear error about that to the console (F12
   in the source properties) and throws the fake token away instead of trying
   it. `?health=1` then puts `streamelements` on offline.
2. **Does the alert itself work?** `alerts.html?test=1` cycles through every
   type: follower, sub, bits, raid, tip. If you see those and real events never
   arrive, the problem is in the token or the socket, not in the rendering.

And turn StreamElements' own alert overlay off if you use this one, or every
follow shows up twice.

## 8. Channel graphics

Your channel page is not the stream, but it should not look like someone
else's. `graphics.html` draws the channel assets with the same `tokens.css` and
`ribbon.css` as the overlay, and `build-graphics.sh` shoots them to PNG with
headless Chrome. Same machinery as the stinger, which is also rendered from a
web page rather than drawn by hand.

```bash
./serve.sh              # in one terminal
./build-graphics.sh     # in another
```

That writes `graphics/`:

| File | Size | Where it goes |
|---|---|---|
| `offline.png` | 1920 x 1080 | Creator Dashboard > Settings > Channel > Video Player Banner |
| `profile-banner.png` | 1200 x 480 | Settings > Channel > Brand > Profile Banner |
| `panel-*.png` | 320 x 100 | your channel page > About > Edit Panels |

The offline screen is the scene layout at 2560x1440 scaled down to 1920, so it
is literally the same design as the starting and ending screens, with the
schedule and socials from `config.js`. It fetches nothing: a PNG with a viewer
count in it is a lie the moment it is a minute old.

The panel buttons come from `graphics.panels` in the config, as label plus
kind. The kind picks the icon from `js/ribbon.js`, and the slugged label
becomes the filename, so adding a button is one line and one rerun. All five
get the same jade head on purpose: normally the kind picks the tint too, and
then you have five buttons in five colours that mean nothing. Here the icon
differentiates and the colour holds them together. Their canvas stays
transparent, so a button sits on Twitch's own background in either theme.

All motion is frozen in these renders. Without that, where the bands and the
halo happen to be depends on how much virtual time Chrome had, and no two
builds would come out the same.

`graphics.tagline` is the line under your name on both banners.

## 9. Files

```
index.html       front page: previews, URLs, OBS numbers
css/index.css    front page
graphics.html    channel assets: offline screen, banner, panel buttons
css/graphics.css channel assets
js/graphics.js   channel assets
graphics/*.png   the rendered result
topbar.html      session status above your gameplay  (2560 x 120)
banner.html      data bar below your gameplay        (2560 x 248)
alerts.html      alerts over your gameplay           (2560 x 1072)
config.js        your settings                       (gitignored)
css/tokens.css   palette, typography, motion
css/ribbon.css   shared shape language (ribbons, cards)
css/backdrop.css background of the scene screens
css/topbar.css   top bar
css/banner.css   bottom bar
css/alerts.css   alerts
js/util.js       helpers
js/raiderio.js   character + guild
js/rio-live.js   live boss progress + pull history
scene.html       starting / brb / ending             (2560 x 1440)
scene-starting.html  wrappers for OBS' Local file mode, which takes no
scene-brb.html       query string; they set window.SCENE_MODE
scene-ending.html
chatting.html    Just Chatting                       (2560 x 1440)
stinger.html     one frame of the transition
css/scene.css    scenes
css/chatting.css Just Chatting
js/scene.js      scenes
js/chatting.js   Just Chatting
js/chat.js       Twitch IRC
js/labels.js     label store
vendor/socket.io.js  bundled, no CDN
js/stats.js      DecAPI
js/streamelements.js  SE socket
js/ribbon.js     ribbon and card builder
js/backdrop.js   background
js/camevent.js   event bar under the camera
js/topbar.js     top bar
js/banner.js     bottom bar
js/alerts.js     alert queue

serve.sh         local preview on http://localhost:8777
build-stinger.sh renders stinger.webm
build-graphics.sh renders graphics/*.png
make-obs-collection.py           builds an OBS scene collection
obs-scene-collection.pages.json  ready-made, points at the hosted site
```

> Everything on screen is in English: the label captions, the card captions,
> the scene screens and the event wording. The code comments are in Dutch, and
> so is the fake chat in demo mode, because that stands in for what viewers
> actually type.

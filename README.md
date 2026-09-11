# Personal WoW overlay for Twitch

A World of Warcraft overlay for a 3440x1440 ultrawide that goes out to Twitch
as 2560x1440. The 368px left over at the bottom becomes the banner: camera,
characters, raid progress, chat and stats. Game specific on purpose -- it reads
Raider.IO for the characters and the guild's boss progress, so it has opinions
about what a raid night looks like.

Built for the channel **bmiest**, which is why that name is in the OBS scene
collection and on the graphics; the overlay itself carries no branding beyond
the palette.

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

### The sub goal

Right of the followers sits a sub counter: `0 / 10`, ten boxes behind it, and
the promise on the rim, `priest wig at 10 · till end of tier`. Every other ribbon
in the bar reports a number; this one makes a promise. So the target, the
reward and the terms all come from the config. The overlay does not invent
promises on your behalf.

```js
goals: {
  followers: 200,
  subs: {
    target  : 10,
    reward  : 'priest wig',
    note    : 'till end of tier', // optional, sits behind the promise
    source  : 'streamelements',
  },
},
```

Up to a target of twelve the bar is a row of boxes instead of a fill. You can
count boxes; a bar sitting at 60% you have to work out. Above twelve it falls
back to the same fill the follower goal uses, because twenty boxes is twenty
hairlines. When the last box lights
up the rim turns gold and reads `priest wig unlocked`, and then holds still.
No pulse, no glow: that ribbon is in frame all stream, and anything that keeps
moving costs bitrate the gameplay needs.

**Where the number comes from.** A counter that adds up is not the same thing
as the number of subs you have right now. Start from zero and the two are the
same number. Start anywhere else and only DecAPI knows your real count.

| `source` | What it is | Survives a reload |
|---|---|---|
| `streamelements` | SE's own goal counter, `subscriber-goal` | yes, it lives on their server |
| `decapi` | your real active sub count, straight from Twitch | yes, it is fetched every 60 s |
| `manual` | `count` from the config, plus what comes in live | no, the tally is in the page |

**`streamelements` is the default, and the right one if you start from zero.**
SE keeps a counter per goal, `subscriber-goal` in the session data. It does not
reset between sessions, so it survives an OBS restart and runs on across
streams. Clear it to zero on the day you announce the goal and the bar is your
active sub count, because you had none.

You do not have to clear it. Leaving the counter where it stands and setting
`target` above it is the same trick as SE's own min value: the bar starts part
filled and the remainder is what you are asking for. It does mean the bar shows
progress you did not make, so decide which you would rather have on screen.

Clearing it is the awkward part. SE's dashboard edits goal values under **Widget
Data**, but that page lists goals belonging to an SE goal widget, and this
overlay is not one, so the counter can be there in the session data with nothing
in the interface to click. The session API holds the same value:

```bash
# channel id
curl -H "Authorization: Bearer $JWT" \
  https://api.streamelements.com/kappa/v2/channels/me | jq -r ._id
# set the counter
curl -X PUT -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' \
  -d '{"subscriber-goal":{"amount":0}}' \
  https://api.streamelements.com/kappa/v2/sessions/<channel id>
```

Read the session back afterwards and check that the other keys are untouched.
Failing all that, add an SE sub goal widget to any overlay, reset it there, and
delete it again.
It counts sub events, so a resub counts too and someone who lapses is not
subtracted. Over a goal this size you will spot that.

**`decapi` is the one that knows your real count.** Use it if you are not
starting from zero. Your active sub count is not public, so it is the one source
in the whole overlay that needs permission from you:

```
https://decapi.me/auth/twitch?redirect=subcount&scopes=channel:read:subscriptions+user:read:email
```

One login, once, and `decapi.me/twitch/subcount/bmiest` starts answering with a
number instead of prose. Until then the bar says so once in the console and
counts on from `goals.subs.count` rather than showing a goal stuck at zero.

**What SE does not have** is your active sub count as a value, and that was
measured rather than assumed: `subscriber-total` is a session counter (`0` on
this channel while `subscriber-recent` listed subs), `subscriber-recent` is a
list of events with no expiry, and there is no endpoint for it --
`subscribers/<id>`, `channels/<id>/subscribers` and `twitch/<id>/subscribers`
all 404. That is structural. SE's session data is event-driven: it counts what
happens while it is watching. Active subs is a state question put to Twitch
itself (Helix, scope `channel:read:subscriptions`), and SE does not re-expose
it. DecAPI is that one Helix call, hosted -- which is why it asks for the same
scope. SE's own goal widgets point the same way: their instructions have you
set the *"min value"* to your current number by hand, *"if you already have 150
followers"*. A widget that knew would not ask.

**A sub during the stream counts immediately.** The socket fires before either
source has caught up, so a new sub or a gift lights the next box on the spot,
which is what the bar is there for. A resub does not light one: that sub was
already active. The next refresh reconciles, and a source that
is still behind cannot pull the bar back down. Note that SE's own counter does
count resubs, so on `source: 'streamelements'` one can still arrive that way;
the Goals screen is where you correct it.

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

A sub also gets the reward above the ribbon: the wig, with the promise under it
in small caps. Whoever just subscribed sees what they paid into, and everyone
else sees what is on offer. The text is the same `goals.subs` the top bar reads,
so the promise is written in one place. It swings in over 620 ms and then stands
still, because the alert is only on screen for five seconds and something that
keeps moving costs bitrate for nothing.

The wig is drawn, in `js/ribbon.js`, and there are three reasons for that rather
than a photo. A seller's product shot is someone else's material and does not
belong in a repository that is MIT. A cut-out on white fights an overlay made of
flat tints. And a photographic gradient across a light object is the first thing
to band at 505 Kbps. Your own photo is a different matter:

```js
goals: { subs: { image: 'media/reward.jpg' } }
```

`media/reward.*` is in `.gitignore` for the first reason above. A photo of your
own wig is yours, so take it out of there if you want it committed. If the file
is missing the alert falls back to the drawing instead of putting a broken
image on your stream.

To line it up: `alerts.html?test=sub` shows the sub alert on repeat. That works
for every type now, next to `?test=kill` and `?test=best` for the two raid
alerts, which need their own names because both are `progress`.

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
| The sub goal | StreamElements `subscriber-goal`, or DecAPI `subcount` | JWT, or one login -- see section 3 |
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

### Your characters on the pause screens

The starting, BRB and ending screens put a character on each flank, full body,
and so does the offline graphic. The first two from
`raiderio.characters` in config order, left and right. Those flanks were empty
next to the halo, and on a pause screen your characters are the subject.

With one character configured the right flank stays empty: the same render
twice reads as a mistake rather than a design. Each fetch stands on its own, so
if one fails the other still arrives.

The image is Blizzard's own render, and getting at it needs no key. Raider.IO
already hands us a thumbnail from Blizzard's render CDN; the same base with
`-main-raw.png` instead of `-avatar.jpg` is the full-body version, a 1600x1200
PNG with a transparent background. The official route is Blizzard's profile
API, which wants OAuth with a client secret, and that cannot live on a public
page. Because the URL is derived from Raider.IO's answer on every poll, a
re-render after a gear change follows along on its own.

There is a lot of transparent space around the figure, so `.scene__char` is a
window with a fixed offset that crops it out. Measured on both characters:
Shiftheal occupies 588-1051 horizontally, Bhikhu 555-1042, so one window fits
both. The bottom fades out, otherwise the figure ends on a hard edge above the
cards.

Both flanks use that same offset. Because the figures do not sit equally far
left in their renders, the right one lands 25px closer to the edge than the
left one, which on 2560 pixels is not something you can see. And the right
flank is moved, not mirrored: these renders face front, so mirroring changes
nothing about the composition and does put the weapons in the wrong hand.

The two windows sit at 96-611 and 1949-2464. The halo is 1040 wide and
centred, so it runs 760 to 1800 and they do not touch it; the foot cards start
at 1136 and the windows stop at 1048.

`js/raiderio.js` is back on the scene pages for this. It was there before for
a character ribbon in the header, which only repeated the bottom bar; a
portrait is a different thing.

### Gameplay behind the preview

The hero plays `media/gameplay.mp4` behind the bars, muted and looping: the
Nymrissa Wavecaller kill from 9 September, twelve seconds of fight, kill and
loot. Remove the file and nothing breaks -- a `<video>` with no loadable source
and no poster is simply transparent, so the hatched placeholder shows through
and nothing has to check whether the file exists.

Four things went into that clip, if you ever swap it:

- **Raw gameplay in 21:9.** The zone is 2560x1072, the same 2.39:1 as a
  3440x1440 capture, so it scales without cropping. Never use a Twitch clip of
  your own stream: those have the bars burned in and you get overlay over
  overlay.
- **1600x670 at 24 fps**, not the full size. The zone is at most ~1600 CSS
  pixels wide on this page, and this is a background behind an overlay, not
  footage anyone studies. That is the difference between 12 MB and 2 MB.
- **One mp4, no webm.** At a size where the file is small enough to ship, VP9
  did not beat x264 here (3.8 MB against 2.0 MB), and the browser takes the
  first source it can play. So one h264 file, which every browser handles, and
  no second request that 404s.
- **A 0.3 s fade at both ends**, so the loop point reads as a cut on purpose
  rather than a glitch.

```bash
ffmpeg -i raw.mp4 -an \
  -vf "scale=1600:670:flags=lanczos,fps=24,fade=t=in:st=0:d=0.3,fade=t=out:st=11.7:d=0.3" \
  -c:v libx264 -crf 32 -preset slow -pix_fmt yuv420p -movflags +faststart \
  media/gameplay.mp4
```

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
- Next to the M+ score sits the **class rank on the realm** (`m+ score
  · #132`), from Raider.IO's `mythic_plus_ranks`. That set has four kinds
  (overall, class, faction, faction-class) times three scopes (world, region,
  realm), and only this one means anything on a stream: 132nd Holy Priest on
  Ragnaros lands, 114745th in the region does not. It rides in the label
  because it ranks that exact number. As a third stat block beside the others
  it did not fit -- the row filled the column exactly and a five-digit rank
  ran out of it.
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
  row on every poll is motion without news. It also slides a small `last try`
  ribbon up with the percentage that pull died at, in grey and held for 3.2
  seconds;
- a new best attempt (a *lower* percentage: that is boss HP still standing)
  slides a `new best` ribbon up over the card, which holds for five seconds and
  drops away, the same way the event bar moves over your camera's name plate;
- a kill does the same with `boss down` and the pull count.

Only one ribbon shows at a time, and a kill outranks a new best, which outranks
a plain pull. That order matters when two pulls land inside one poll window: a
good wipe and then the kill. The full-screen layer picks the same way, so the
card and the alert over your gameplay always name the same thing.

On a different boss the comparison resets, otherwise the lower pull count of a
fresh boss would read as an improvement. And nothing fires on the first poll,
or the card would announce a pull from an hour ago the moment OBS starts.

The card itself cannot rise *above* its own edges: that source is 248px tall
and OBS clips it there. The full-screen version lives in `alerts.html`, which
covers the whole gameplay zone:

- a **kill** always fires one: `boss down`, the boss name large, the raid and
  difficulty under it, and the numbers of that pull -- pulls to kill, the
  phase, how long the fight ran and how many people died. Jade, held for 8.4
  seconds.
- a **new best** fires the same shape in gold with the percentage that was
  still standing, held for 5.6 seconds.

A plain pull deliberately fires nothing here. That is what the small ribbon in
the card is for: a wipe every two minutes has no business covering your
gameplay.

A kill also gets **fireworks**: ten bursts across the upper half, each a rising
streak and then a ring of sparks that flies out and falls. Jade, white and gold,
182 sparks in total, the last of them fading at 6.4 seconds. That is why a kill
holds for 8.4 seconds and a new best for 5.6: fireworks first, then two seconds
of quiet to read the numbers. A new best gets none, because if a wipe gets
fireworks they mean nothing on a kill.

The bursts are 420 to 520ms apart and a cloud lives 1.25 to 1.7 seconds, so
three or four of them hang in the air at once. That is the whole trick. Spaced
further apart than they live, you see one cloud at a time and it reads as less
fireworks rather than more, which is exactly what the first six-burst version
looked like. The gaps are not all equal either, because a metronome reads
mechanical.

Two nested elements per spark: the outer one flies out radially on an ease-out,
the inner one falls on an ease-in. One element cannot carry two `transform`
animations and nested transforms multiply, so that gives a parabola instead of
a straight line, which is the difference between fireworks and an asterisk.

The sizes are in canvas pixels, and that canvas is 2560 wide. The first version
had 3px dots and a 210px radius, which is invisible next to a 132px boss name;
they are 9 to 15px across rings of 230 to 430 now. The heavy rings sit on the
flanks and the small ones high in the middle, because the boss name is in the
middle and ten full rings over that text is a mess. The flanks were the empty
part of the frame anyway.

Every ring stays inside the frame. Horizontally, x in canvas pixels minus the
radius has to clear zero; vertically, y minus 0.82 times the radius, because the
y component of each spark is squashed so the cloud is wider than it is tall.
Checked on all ten: the tightest margin is 12 pixels. Earlier versions clipped
the top sparks, and a spark cut off on the edge reads as a bug and not as
framing.

The wash behind it is flat and 72% opaque, so your gameplay stays faintly
visible and there is nothing to band. Duration and deaths come from the
`bosspulls` endpoint, which carries them per pull; `RioLive.pullOf()` picks the
pull the alert is about.

`liveTracking.alerts` decides what fires: `both` (default), `kill` for kills
only, or `off`. The alerts page keeps its own state and polls the same
endpoints as the bottom bar, so the two never have to agree on anything.

To look at them: `alerts.html?test=kill` shows the kill one on repeat and
`?test=best` the other, instead of waiting out the full cycle of
`?test=1`, where the two raid alerts come last. Any other type works by name,
so `?test=sub` for the sub alert. `?mute=1` silences the sound
for a look without a noise, which is what the previews on the front page use
-- a page that starts beeping when you open it is not a business card.

The detection itself sits in `RioLive.watcher()`, not in either page: both
want to know what changed since the last poll, each with their own state.

**The two pages tick together.** StreamElements events need no help there: a
follow is *pushed* over the socket, so the alert, the row in 'recent' and the
bar over your camera all fire on the same instant. Raid progress is *polled*,
and `U.poll` deliberately adds jitter so three pollers in one bar do not fire
on the same second. For these two pages that jitter was wrong: the bottom bar
and the alerts page look at the same endpoint, and with random offsets the
full-screen alert could land up to half a minute after the ribbon in the card.
They now use `U.pollAligned()`, which recomputes every tick from the wall
clock, so whenever either page was loaded, both land on the same 30-second
grid from the first boundary on. Each still makes its own request, so a slow
or failed one puts that page a tick behind until the next boundary.

`banner.html?demo=1` plays a short evening: the standing score, then an
ordinary wipe, then a new best, then the kill, so all three ribbons come past.

### Sound

The raid alert makes a noise: two short notes a fifth apart for a new best,
and a triad with a low root under it for a kill. It comes out of the Web Audio
API in `js/chime.js`, not from a file, so there is nothing to host, nothing
that can 404 and nothing to download with a release -- and you retune it by
changing a number instead of editing audio.

`liveTracking.soundVolume` sets the level; `0` turns it off. In OBS, tick
**Control audio via OBS** on the alerts source, otherwise the sound never
reaches your mix and your viewers hear nothing.

The StreamElements alerts stay silent, as before.

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
  design, made with geometry instead of a gradient;
- **one crisp jade hairline** on the top edge of the thin band, through the open
  strip below the clock. Without a line like that, a field of shapes at a few
  percent opacity turns to mush; with more than one it starts to stripe;
- a handful of slowly rising motes (a Mistweaver's mist), placed
  deterministically so every scene switch looks the same.

The shape of each band is four y values in `BANDS` (`js/backdrop.js`); the x of
the control points is fixed. The composition keeps the middle clear: nothing
sits between y 520 and 800 there, because that is where the clock is, and the
drift amplitudes stay small enough that it is still clear at both extremes.

The group does the horizontal slide, the path inside it the vertical one. One
element cannot carry two `transform` animations, and nested transforms multiply.
That is also why the hairline sits in a wrapper of its own: it has to inherit
exactly the same two movements as the band it rides on, or it slides off it.

The offline graphic is a rendered PNG, so it holds one frame of all this. Rerun
`./build-graphics.sh` if you change the bands.

Turn it off with `scenes.background: 'plain'`.

Three things that were wrong here and are worth knowing if you go changing it:

- Sliding sideways was not enough on its own. Each band drifted horizontally
  over 62 to 132 seconds and nothing else, and a smooth curve sliding along
  itself barely changes shape. Measured over half a period, 7.6% of the pixels
  changed, by an average of 0.7 out of 255. On screen that reads as a still
  image. Every band now also sinks and rises, on a period that does not line up
  with its own horizontal one, so the two run out of phase and the crossings
  keep moving. Same measurement after: 28% of the pixels, average 2.0.
- The vertical drift is on the scene screens only, not in the bar strips. A
  strip is 120 or 248px tall, so drifting a band vertically pushes it out of the
  strip and leaves the top bar empty for half a minute. The bars keep their
  slow horizontal slide, three times slower than the scene screens because they
  sit next to gameplay.
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
| `panel-overlay.png` | 320 x 430 | same place; put the repo URL under it as the link |

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

`panel-overlay.png` is the odd one out: a whole panel rather than a button,
about the overlay itself. Someone who clicks through on your channel page wants
to know what they were looking at, and that does not fit in a label. It is the
same angled card as the ones in the bottom bar, at panel width. On it is a
small plan of what sits on screen: top bar, gameplay, and the data bar with the
camera notch. Those heights come from `config.layout`, so the picture on your
channel page cannot drift away from what is on your stream. Text, bullets and
URL come from `graphics.about`. The URL is in the image because a PNG cannot be
clicked, so give the panel the same link in Twitch's panel editor. It breaks on
the last slash, so a repo name never splits mid-word.

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

---

## 10. License

The code -- every `.html`, `.css`, `.js`, the build scripts and
`make-obs-collection.py` -- is [MIT](LICENSE). Fork it, point it at your own
channel, take a snippet for your own overlay. No need to ask.

Three things in this repo are not mine to hand out, so the MIT does not reach
them:

| Path | What it is | Terms |
|---|---|---|
| `media/gameplay.mp4` | World of Warcraft footage | Blizzard's. Used here under their game content policy, which covers me using it, not me relicensing it. Drop in your own clip. |
| `graphics/*.png` | rendered channel assets | the **bmiest** name and profile art. The generator (`graphics.html`) is MIT, so rebuild them with your own name rather than reusing the PNGs. |
| `vendor/socket.io.js` | Socket.IO 2.3.1 | MIT, (c) 2014-2020 Guillermo Rauch. Its own notice is in the file header. |

Outfit and JetBrains Mono are pulled from Google Fonts at runtime and are not
redistributed here; both are under the SIL Open Font License.

The shape language is a re-implementation of the ideas in Nerd or Die's
*Amused* -- capsules, ribbon bars, short micro-animations -- not a copy of its
assets. Nothing from that theme ships in this repo.

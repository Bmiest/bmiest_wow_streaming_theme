---
name: bmiest stream overlay
description: The bmiest World of Warcraft stream theme and its showcase page, opened like WoW's character select (design language v2 on the web page; the OBS pages keep their v1 surface).
colors:
  ink-900: "#0a0b0d"
  ink-850: "#0e1014"
  ink-800: "#131519"
  ink-750: "#171a1f"
  ink-700: "#1e2228"
  ink-600: "#2a2f37"
  ink-500: "#3a414b"
  ink-400: "#5b6470"
  ink-300: "#818b98"
  ink-200: "#a8b1bc"
  paper: "#eef1f5"
  paper-dim: "#c9d0d8"
  jade: "#3fd9a4"
  jade-deep: "#1f8d68"
  jade-ghost: "rgba(63,217,164,.13)"
  gold: "#d8b263"
  rose: "#d98b8b"
  live-red: "#c93339"
  holy: "#ffffff"
  void-glow: "rgba(150,90,255,.24)"
typography:
  display:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(44px, 5vw, 76px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-.03em"
  headline:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(24px, 2.6vw, 32px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-.01em"
  headline-sub:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(20px, 2vw, 24px)"
    fontWeight: 800
    lineHeight: 1.05
  spec:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  pick-name:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.1
  ribbon:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  fold:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 700
  lead:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    letterSpacing: ".1em"
  bug:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    letterSpacing: ".1em"
  label:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: ".14em"
  label-micro:
    fontFamily: "'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: ".16em"
  numeric-stat:
    fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace"
    fontSize: "18px"
    fontWeight: 700
    fontFeature: "tnum"
  numeric:
    fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  none: "0px"
  pill: "999px"
  cap: "30px"
spacing:
  gutter: "24px"
  gutter-phone: "16px"
  wrap: "1320px"
  ribbon-row: "8px"
  stage-col: "32px"
  section: "72px"
  section-phone: "56px"
  cols: "40px"
  grid: "28px"
components:
  bug-live:
    backgroundColor: "{colors.live-red}"
    textColor: "{colors.paper}"
    typography: "{typography.bug}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "40px"
  bug-mark:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.none}"
    size: "40px"
  bug-name:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.paper}"
    typography: "{typography.bug}"
    rounded: "{rounded.none}"
    padding: "0 20px 0 0"
    height: "40px"
  bug-slot:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    typography: "{typography.bug}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "40px"
  lang-block:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.ink-300}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "40px"
  lang-block-active:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
  pill:
    backgroundColor: "{colors.ink-750}"
    textColor: "{colors.ink-200}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 15px 6px 11px"
  pill-jade:
    backgroundColor: "{colors.ink-750}"
    textColor: "{colors.jade}"
  ribbon:
    backgroundColor: "{colors.ink-800}"
    textColor: "{colors.paper}"
    typography: "{typography.ribbon}"
    rounded: "{rounded.none}"
    height: "44px"
  ribbon-outline:
    backgroundColor: "{colors.ink-600}"
  ribbon-key:
    backgroundColor: "{colors.ink-700}"
    textColor: "{colors.ink-200}"
    typography: "{typography.label-micro}"
    width: "76px"
  pick:
    backgroundColor: "{colors.ink-800}"
    textColor: "{colors.paper}"
    typography: "{typography.pick-name}"
    rounded: "{rounded.none}"
    height: "60px"
  pick-active:
    backgroundColor: "{colors.ink-750}"
    textColor: "{colors.jade}"
  button-primary:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 30px 0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.paper}"
  copy-button:
    backgroundColor: "{colors.ink-750}"
    textColor: "{colors.jade}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 15px 6px 11px"
  copy-button-done:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
  ticker:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.paper-dim}"
    height: "52px"
  ticker-label:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    padding: "0 20px"
  tally-key:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 11px"
    height: "28px"
  tally-name:
    backgroundColor: "{colors.ink-800}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "0 11px"
    height: "28px"
  step-number:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.ink-900}"
    typography: "{typography.numeric}"
    width: "34px"
    height: "30px"
  screen-frame:
    backgroundColor: "{colors.ink-850}"
    rounded: "{rounded.none}"
  fold:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.paper}"
    typography: "{typography.fold}"
    padding: "18px 2px"
---

# Design System: bmiest stream overlay

<!-- Design language v2, recorded from the shipped build of index.html on branch design/v2-showcase
     (finish review: ship, 2026-10-04; build capture .impeccable/mocks/build-b2-1440.png).
     Contract: .impeccable/surfaces/index-html.md. Family record: Bmiest/bmiest-design DESIGN.md.
     Scope tags: [family] = the shared v2 language, should match the family DESIGN.md;
     [overlay] = this product only. The OBS pages (topbar, banner, alerts, scenes, chatting, stinger)
     share css/tokens.css but were not redesigned: they keep their v1 surface (capsules, pills, the
     stream-bitrate rules) and are described here only through the tokens. -->

## Overview

**Creative North Star: "The Character Select Screen"**

The showcase page opens like WoW's character select. The healer (Shiftheal, Holy Priest, by default) stands whole in the middle of the stage, in front of the raid boss Kelderklasse is fighting right now, on separate planes: the boss far back and dimmed, the character in front, the text on top. Stat ribbons on the left, the character picker as ribbons on the right, a broadcast bug top left, the language switch top right, and an edge-to-edge alerts ticker labelled demo closing the hero. Below it the stream theme is shown working, not described: the real OBS pages in demo mode, scaled into frames, then the emotes, the channel graphics, and the install notes folded away at the bottom.

It speaks the family's v2 language: flat near-black ink, Outfit 800 caps, jade as the brand, right-edge slants on ribbons, pills and buttons, flush square blocks for the bug, the switch and the ticker, mono for figures. Colour is scarce. Jade is the brand and the live data; gold marks a first or a best; live-red appears only on LIVE; the class colour of the chosen character tints its glow, its spec word and its class ribbon.

Confirmed rejection (contract thesis): the docs page with a screenshot on top. The page shows the screens running; installation is for streamers and sits folded below the work.

**Key Characteristics:**
- [family] Flat ink scale, Outfit + JetBrains Mono, jade + gold + live-red, from tokens.css.
- [family] Right-edge slant on ribbons, pills, buttons and section caps; flush square blocks for the bug, the language switch and the ticker.
- [family] Colour as meaning: jade = brand/live, gold = earned (first, best, leader, winner), live-red = on air; failures and lateness are rose.
- [overlay] Character-select hero: character and boss as transparent cut-outs on two planes, the class colour as the character's light.
- [overlay] The real OBS pages as live, scaled previews instead of screenshots.
- [overlay] OBS pages keep the v1 surface; only tokens.css is shared.

## Colors

The family's near-black ink ramp with one cool green voice and one warm gold voice, plus the chosen character's class colour; red appears only on the LIVE block.

### Primary
- **Mistweaver Jade** (jade): [family] the brand. The bug's mark block and guild slot, the active language block, the active pick's outline and subline, the primary button, the ticker label and its 2px top edge, section-head caps, the tally key ("PGM"), step numbers, the copy button's text, links, the fold chevron, the boss's kill count in the boss tag, and focus rings (2px outline, 3px offset). Its ghost (jade-ghost) only for link underlines and text selection.
- **Deep Jade** (jade-deep): [family] a token from tokens.css used by the OBS pages; the showcase page does not use it.

### Secondary
- **Podium Gold** (gold): [family] earned: a first, a best, a leader or a winner. On this page only the "new best" tag in the alerts ticker; on stream, the new-best alert ("the same shape in gold").

### Tertiary
- **Broadcast Red** (live-red): [family] on air only: the LIVE block in the bug, shown only while DecAPI says the channel is live; never on a stream page. Lives in tokens.css (since this branch), so the race site can read it from here. Value #c93339 (darkened from #e5484d on 2026-10-04) so paper text on it reaches 4.6:1.
- **Faded Rose** (rose): [family] a token the OBS pages use; not used on the showcase page.

### Class colour [overlay]
- **The character's class colour** (set at runtime as `--cls` from the overlay's class table): the hero's second glow (20% mix), the spec word ("Holy" in "Holy Priest"), and the class ribbon's key block. Blizzard's Priest colour is pure white, which this family never uses, so Priest maps to paper. Falls back to jade.

### Neutral
- **Raid Night Black** (ink-900): page ground, bug name block, ticker band, inactive language block, ink text on jade.
- **Table Ink** (ink-850): screen-preview wells and the gameplay zone, pick thumbnails' ground, the boss tag's count block, the base-URL value.
- **Panel Ink** (ink-800): ribbon bodies, pick bodies, the tally and boss-tag name blocks.
- **Raised Ink** (ink-750): pills, copy buttons, stat-ribbon key blocks on the boss tag, the active pick's body, inline code.
- **Rule Ink** (ink-700): 1px outlines of previews and graphics, fold hairlines, table rules, the footer rule, the hero's bottom border, stat-ribbon key blocks.
- **Outline Ink** (ink-600): the ribbon's 1px slanted outline, the scrollbar thumb.
- **Muted Ink** (ink-500): a pick's outline on hover.
- **Caption Grey** (ink-300): captions, the picker heading, pick sublines, table heads, inactive language, fold hints, footer links.
- **Soft Grey** (ink-200): notes and step text, pill text, stat-ribbon keys, facts.
- **Paper** (paper): primary text and the Priest class colour; the primary button's hover; never pure white.
- **Faded Paper** (paper-dim): the spec line, the install intro, ticker body, emote names.

### OBS-only tokens [overlay, v1]
- **Holy** (holy): pure white, the Priest class colour as a light accent on the v1 stream pages. Never on the web page (see the Paper Priest Rule).
- **Void Glow** (void-glow): [overlay value] the violet radial behind the boss plane, at 24% (the race site's hero uses the same hue at 32%).

### Named Rules
**The Gold Is Earned Rule.** [family] Gold marks something earned (a first, a new best, the leader, the winner) and nothing else: not a tag colour, not a hover, not a state.

**The Red Means On Air Rule.** [family] Live-red only on the LIVE block, only while the channel is really live, and never on a page that is itself the stream.

**The Paper Priest Rule.** [overlay] A class colour that is pure white is drawn as paper; nothing on the web page is #fff.

## Typography

**Display Font:** Outfit (with Segoe UI, system-ui), weights 300 to 800 (800 added to the tokens.css import on this branch)
**Label/Mono Font:** JetBrains Mono (with Cascadia Mono, Consolas), tabular figures

**Character:** One geometric sans from the 76px poster name down to 10px labels; the mono carries figures and file names.

### Hierarchy
- **Display** (display): [overlay size] the character's name, once per page, uppercase, balanced; clamp(44px, 11vw, 72px) under 1180px.
- **Headline** (headline): [family] section heads, uppercase, behind a 14px slanted jade cap.
- **Headline sub** (headline-sub): [family] a subsection head ("During the raid"), 11px cap.
- **Spec** (spec): [overlay] the line under the name, paper-dim with the spec word in the class colour; 19px under 1180px.
- **Pick name** (pick-name): character names in the picker; 16px under 900px. Sublines 12px ink-300.
- **Ribbon** (ribbon): stat-ribbon values; 15px under 560px. Figures (ilvl, M+) in numeric-stat.
- **Fold** (fold): [family] the title of a folded install section, with a 14px ink-300 hint.
- **Lead** (lead): the install intro, max 70ch, paper-dim.
- **Body** (body): the page base. Notes at 14px/1.6 in ink-200 (max 68ch); ticker items at 15px.
- **Caption** (caption): one-line section captions and figure captions, ink-300, max 72ch.
- **Button** (button): the primary button, uppercase.
- **Bug** (bug): [family] the broadcast bug, uppercase; LIVE at 13px/.14em; 12px under 900px.
- **Label** (label): pills, the picker heading, tally and boss-tag blocks, table heads, copy buttons; uppercase.
- **Label micro** (label-micro): ticker event tags, the "demo" tag, stat-ribbon keys; uppercase.
- **Numeric stat** (numeric-stat): item level and Mythic+ score on the stat ribbons.
- **Numeric** (numeric): file names and sizes in the sources table, the base URL, step numbers (14px/700), emote codes (12px).

### Named Rules
**The Poster Voice Rule.** [family] Display and section heads are Outfit 800 uppercase with tight tracking; nothing else is that heavy except the bug, the button and the label blocks.

**The Figure Is Mono Rule.** [family] A number a visitor reads as a value (ilvl, score, a kill count, a size) is JetBrains Mono with tabular figures.

## Layout

[overlay] One container, 1320px max, 24px gutters (16px under 900px). The hero is a three-column stage (380px info, the open middle, 300px picker, 32px column gaps) between the bug row and the ticker, at least 620px and at most 860px tall, otherwise the viewport minus the bug and the ticker. The two planes sit behind it: the boss from 24% to 78% of the width, top-aligned, its feet faded by a mask from 55% to 94%; the character centred, at most 600px or 46% wide, standing whole with its feet 36px above the ticker. A council (two bodies) flanks the character instead of hiding behind it (34% each); a low, wide boss hangs above it (max 52% of the height). Art is never drawn past 2x its natural height.

Under 1180px the stage becomes one column: the planes as a 500px band (420px under 900px, 380px under 480px), the boss tag, the name, the spec, the picker as a horizontal swipe row with scroll snap, the stat ribbons two per row (class and race spanning), the note, the button. Everything works at 360px.

Below the hero, sections stack 72px apart (56px under 900px) in a 56px/96px padded column. The stream preview is a full-width programme frame (top bar, gameplay, bottom bar at their real heights, scaled), notes in two columns (40px gap), then the four scene previews in a 2x2 grid (28px/24px) and the two raid alerts side by side; all collapse to one column under 900px. Previews are the real pages at their 2560px design width, scaled by script to the box.

## Elevation & Depth

[family] Flat. No drop shadows. Depth comes from the ink ramp and 1px ink-700 lines, and in the hero from the two planes: the boss at 55% opacity behind the character, each in its own soft radial glow (violet behind the boss, the class colour behind the character), drifting apart on scroll (boss at 0.32 of the scroll, character at 0.12), still under reduced motion. The only `box-shadow` is the 2px paper ring around the LIVE dot, a drawn line.

### Named Rules
**The Flat Ink Rule.** [family] Surfaces separate by tone and 1px rules, never by shadow or blur.

**The Two Planes Rule.** [overlay] Depth in the hero is the boss behind the character, never a shadow under either; nothing is drawn on the renders.

## Shapes

[family] Corners are square. The signature is the right-edge slant, `clip-path: polygon(0 0, 100% 0, calc(100% - N) 100%, 0 100%)`: N is 11px on ribbons and the primary button, 10px on a ribbon's key block, 8px on the boss tag's last block, 6px on pills, copy buttons and step numbers, 5px on the section-head cap, 4px on the subsection cap. Ribbons draw their 1px outline as a slanted outer clip one pixel larger than the inner one. The only round thing is the LIVE dot. The fold chevron is drawn (7px, two 2px jade strokes, -45deg closed, 45deg open). The bug, the language switch, the ticker and the tally strips are flush, square, gapless blocks.

[overlay] The OBS pages keep the v1 form language from tokens.css (30px capsules, 999px pills); it is not part of v2 and new web surfaces do not use it.

### Named Rules
**The One Slant Rule.** [family] Slants go down and to the right, on the trailing edge only, and a slanted element never also gets rounded corners.

## Components

### Broadcast bug [family form, overlay content]
Flush square blocks at 40px (34px under 900px): LIVE (live-red, pulsing dot, hidden unless the channel is live), a 40px jade mark block with the drawn broadcast mark, "bmiest" on ink-900 (jade on hover), and the guild ("Kelderklasse · EU-Draenor", realm dropped under 560px) on solid jade.

### Language switch [family]
EN | NL as two flush blocks at the bug's height, 13px/800 label type; the active one solid jade with ink text, the other ink-900 with ink-300 text (paper on hover).

### Ribbon [family]
The overlay's ribbon: a 1px slanted outline (ink-600) around an ink-800 body, a square key block on the left, the value in ribbon type with an ellipsis. Stat ribbons (44px; 38px under 560px) carry a 76px ink-700 key block with a micro label (class, realm, ilvl, M+, race); the class ribbon's key block takes the class colour with ink text.

### Character pick [overlay]
A 60px ribbon (52px under 900px) whose key block is the character's square avatar on ink-850, then the name (pick-name) over "spec class · realm" (12px ink-300). Hover turns the outline ink-500; focus turns it paper; the chosen pick has a jade outline, an ink-750 body and a jade subline. Switching crossfades the character render (420ms) while the boss plane stays.

### Boss tag [overlay]
A 30px flush strip under the stat ribbons naming the boss behind the character: key ("Now on", ink-750, ink-200), boss name (ink-800, paper), and the guild's kills in mono jade on ink-850 with an 8px trailing slant. It sits on the left, not under the character, so it never covers the feet.

### Primary button [family candidate]
A 48px solid jade block with an 11px trailing slant, button type, an 18px drawn icon (the Twitch mark); hover turns it paper. One per view ("Watch on Twitch").

### Pills and copy button [family]
Slanted ink-750 chips in label type. The copy button is a pill-shaped button with jade text (ink-700 on hover) that turns solid jade with ink text once copied.

### Alerts ticker [family form, overlay content]
A 52px ink-900 band spanning the viewport, a 2px jade top edge only, a solid jade label block ("Alerts" with an ink-900 "demo" tag in jade) flush left. Items are "event tag · name · detail": tags in label-micro jade (gold for new best), names bold paper, detail paper-dim. The list is rendered twice and slides one width in 56s, pauses on hover and focus, and becomes a static scrollable row under reduced motion. A 64px fade hides the right edge.

### Section head [family]
Headline type behind a slanted jade cap (14px wide, 0.9em tall), 8px above a one-line caption. Subsections use headline-sub with an 11px cap.

### Screen preview [overlay]
A real page in an iframe at its 2560px design width, scaled to the box, in an ink-850 well with a 1px inset ink-700 outline. Above it a tally strip: flush 28px blocks, an optional jade key ("PGM"), the name on ink-800, and the file names in mono ink-300. The programme frame stacks top bar, gameplay (optional video, alerts layer, a centred "gameplay 2560 x 1072" tag) and bottom bar with a camera placeholder at their real heights.

### Install folds [family]
Folds between 1px ink-700 hairlines: the drawn jade chevron, the fold title (jade on hover) and its ink-300 hint. Inside: numbered steps in two columns (a 34x30 jade step number with a 6px slant, mono 14px/700), a sources table (label heads, 1px ink-700 rules, mono file names, copy buttons), a facts list, and the base URL as a flush key/value strip.

## Do's and Don'ts

### Do:
- **Do** take colours, fonts and radii from tokens.css variables; set runtime values (class colour, preview scale, natural height) as custom properties with `style.setProperty()`.
- **Do** keep jade for the brand and live data, gold for a first or a best, live-red for LIVE only.
- **Do** show character and boss as transparent cut-outs on separate planes, with nothing drawn on them, never past 2x natural height; every shipped boss raster carries its provenance (img/boss/PROVENANCE.md).
- **Do** map a pure-white class colour to paper.
- **Do** slant the trailing edge of ribbons, pills, buttons and caps; keep the bug, the language switch, the ticker and tally strips flush and square.
- **Do** show the theme with the real pages in demo mode, scaled, rather than screenshots.
- **Do** stop the ticker, the plane drift and the crossfades under reduced motion.
- **Do** ship every string in English and Dutch (`data-i18n-html`); game names are never translated.
- **Do** keep the stream-bitrate rules from tokens.css (no gradients, no full-width animation, no pure white) on the OBS pages; the showcase page may use the hero glows and the ticker because it is not encoded.

### Don't:
- **Don't** put a coloured side stripe on cards, cells or rows.
- **Don't** use text glyphs (★, ✓, ▸, emoji) as icons or disclosure marks; icons are drawn SVG.
- **Don't** add drop shadows, rounded cards or blur.
- **Don't** use #fff on the web page, the holy token included.
- **Don't** show LIVE or a live dot unless the channel is live.
- **Don't** bring the v1 capsules and round pills of the OBS pages to a v2 web surface.
- **Don't** let the install notes lead the page; they stay folded below the work.

/* Wat er voor streamers en kijkers veranderde, per versie, nieuwste eerst. changelog.html
   maakt er de lijst van, en de voet van de voorpagina toont de bovenste versie als "nu live".

   Zoals changelog.toml op racetodutchfirst.nl: elke release die iets zichtbaars verandert,
   krijgt hier een blok met de versie (de git-tag zonder v) en de datum van de release
   (Europe/Brussels), en regels in `nl` en in `en`: gewone taal, wat je op stream of op de
   voorpagina merkt (geen code, geen PR-nummers). De Nederlandse regel is het origineel; de
   Engelse zegt hetzelfde. Zet het blok erbij in de PR die de release maakt, en tag daarna. */
window.CHANGELOG = [
  {
    version: '1.10.0', date: '2026-10-09',
    nl: [
      'Op de wacht-, pauze- en eindschermen staat het klassement van Race to Dutch First: elke guild met een baan van acht bosses, de kills en de beste pull. Kelderklasse in jade.',
      'De raidkaart onderaan wisselt tussen vier pagina\'s: de boss, het klassement, het raceverslag met de laatste kills en beste pulls van alle Nederlandse guilds, en de guild met zijn wereldrangen. Na elke pull springt hij terug naar de boss.',
      'De boss staat groot en uitgesneden op de raidkaart, in plaats van als vage achtergrond.',
      'De raidkaart is breder en de characterkaart smaller; die toont nu Shiftheal en Bhikhu.',
      'De voorpagina heeft onderaan de bronnen, hoe het werkt, feedback en deze lijst met wijzigingen, in het Nederlands en het Engels.',
      'Een nieuw icoontje in je browsertab.',
    ],
    en: [
      'The starting, break and ending screens show the Race to Dutch First standings: every guild with a track of eight bosses, its kills and its best pull. Kelderklasse in jade.',
      'The raid card at the bottom rotates through four pages: the boss, the standings, the race log with the latest kills and best pulls of every Dutch guild, and the guild with its world ranks. After every pull it goes back to the boss.',
      'The boss stands large and cut out on the raid card, instead of as a faint background.',
      'The raid card is wider and the character card narrower; it now shows Shiftheal and Bhikhu.',
      'The front page ends with the sources, how it works, feedback and this list of changes, in Dutch and English.',
      'A new icon in your browser tab.',
    ],
  },
  {
    version: '1.9.0', date: '2026-10-04',
    nl: [
      'Onder de klok op de schermen staat waar Kelderklasse staat in de race, in goud zolang de guild eerste is.',
      'Onder het schema staat wanneer de volgende raid begint, of dat er nu geraid wordt.',
      'De streamtitel blijft binnen de cirkel en wordt kleiner als hij te lang is.',
      'De raidkaart toont de plek in de race.',
      'Alles op stream kan in het Nederlands.',
      'Twintig emotes en een icoon voor de kanaalpunten.',
      'Een nieuwe voorpagina als characterselectie, met de boss waar de guild op zit erachter.',
    ],
    en: [
      'Under the clock on the screens: where Kelderklasse stands in the race, in gold while the guild is first.',
      'Under the schedule: when the next raid starts, or that a raid is on right now.',
      'The stream title stays inside the circle and gets smaller when it is too long.',
      'The raid card shows the place in the race.',
      'Everything on stream can be in Dutch.',
      'Twenty emotes and an icon for the channel points.',
      'A new front page as a character select, with the boss the guild is on behind it.',
    ],
  },
  {
    version: '1.8.0', date: '2026-09-28',
    nl: [
      'Ook volgers, subs, bits, tips en raids krijgen vuurwerk, kleiner dan bij een kill en in de kleur van die melding.',
    ],
    en: [
      'Followers, subs, bits, tips and raids get fireworks too, smaller than for a kill and in that alert\'s own colour.',
    ],
  },
  {
    version: '1.7.0', date: '2026-09-28',
    nl: [
      'Een bosskill is een echt feest: veel meer vuurwerk, de boss zelf in beeld en je guild onder zijn naam.',
      'Een kill en een nieuwe beste pull zeggen iets: een peonregel uit Warcraft.',
    ],
    en: [
      'A boss kill is a proper celebration: a lot more fireworks, the boss itself on screen and your guild under its name.',
      'A kill and a new best pull say something: a peon line from Warcraft.',
    ],
  },
  {
    version: '1.6.0', date: '2026-09-24',
    nl: [
      'Een boss die al ligt, toont zijn echte kill: verslagen, en hoeveel pulls het kostte. Wipes op een reclear veranderen daar niets aan.',
      'De raidmeldingen blijven langer in beeld, zodat je ze kunt lezen.',
    ],
    en: [
      'A boss that is already down shows its real kill: defeated, and how many pulls it took. Wipes on a reclear change nothing about it.',
      'The raid alerts stay on screen longer, so you can read them.',
    ],
  },
  {
    version: '1.5.0', date: '2026-09-21',
    nl: [
      'De raidkaart en de meldingen geloven eerst Warcraft Logs, met Raider.IO als terugval.',
      'Het percentage van een pull klopt weer, en een kill telt niet meer als beste pull.',
    ],
    en: [
      'The raid card and the alerts believe Warcraft Logs first, with Raider.IO as the fallback.',
      'A pull\'s percentage is right again, and a kill no longer counts as a best pull.',
    ],
  },
  {
    version: '1.4.1', date: '2026-09-17',
    nl: [
      'Twee kleine verbeteringen aan de voorpagina.',
    ],
    en: [
      'Two small fixes to the front page.',
    ],
  },
  {
    version: '1.4.0', date: '2026-09-17',
    nl: [
      'De raidkaart heeft een tweede bron: valt Raider.IO uit, dan leest hij Warcraft Logs.',
      'Het tijdstempel zegt hoe oud de gegevens zijn, zonder verwijt.',
    ],
    en: [
      'The raid card has a second source: when Raider.IO goes down, it reads Warcraft Logs.',
      'The time stamp says how old the data is, without blame.',
    ],
  },
  {
    version: '1.3.0', date: '2026-09-15',
    nl: [
      'Alle characters komen langs: de onderbalk en de pauzeschermen tonen er twee tegelijk en wisselen door.',
      'Elke render wordt gemeten, zodat elk character goed in zijn venster staat.',
      'De boss staat achter de grote raidmeldingen.',
    ],
    en: [
      'Every character comes past: the bottom bar and the pause screens show two at a time and rotate.',
      'Every render is measured, so each character sits right in its window.',
      'The boss stands behind the big raid alerts.',
    ],
  },
  {
    version: '1.2.2', date: '2026-09-11',
    nl: [
      'Elke pagina met gegevens van Raider.IO noemt Raider.IO nu als bron.',
    ],
    en: [
      'Every page with Raider.IO data now names Raider.IO as its source.',
    ],
  },
  {
    version: '1.2.1', date: '2026-09-11',
    nl: [
      'De onderbalk noemt Raider.IO als bron.',
    ],
    en: [
      'The bottom bar names Raider.IO as its source.',
    ],
  },
  {
    version: '1.2.0', date: '2026-09-11',
    nl: [
      'Een subdoel in stappen, met de beloning erbij, en die beloning in beeld bij elke sub.',
      'Een kanaalpaneel over de overlay zelf.',
    ],
    en: [
      'A sub goal in steps, with its reward, and that reward on screen with every sub.',
      'A channel panel about the overlay itself.',
    ],
  },
  {
    version: '1.1.2', date: '2026-09-10',
    nl: [
      'Veel meer vuurwerk bij een bosskill.',
    ],
    en: [
      'A lot more fireworks on a boss kill.',
    ],
  },
  {
    version: '1.1.1', date: '2026-09-10',
    nl: [
      'Vuurwerk over je gameplay bij een bosskill.',
    ],
    en: [
      'Fireworks over your gameplay on a boss kill.',
    ],
  },
  {
    version: '1.1.0', date: '2026-09-10',
    nl: [
      'De raidkaart leeft mee: een nieuwe pull groeit erbij, een nieuwe beste pull schuift in goud omhoog, een kill in jade.',
      'De klok van de stream loopt weer, en een verwijderd chatbericht verdwijnt ook uit beeld.',
      'De voorpagina toont de meldingen en echte gameplay achter de balken, en de kanaalgraphics.',
    ],
    en: [
      'The raid card follows along: a new pull grows in, a new best pull slides up in gold, a kill in jade.',
      'The stream clock runs again, and a deleted chat message also leaves the screen.',
      'The front page shows the alerts and real gameplay behind the bars, and the channel graphics.',
    ],
  },
  {
    version: '1.0.0', date: '2026-09-09',
    nl: [
      'De overlay staat online: een bovenbalk en onderbalk rond de gameplay van een ultrawide, meldingen, wacht-, pauze- en eindschermen en kanaalgraphics, met een kant-en-klare OBS-scene.',
    ],
    en: [
      'The overlay is online: a top and bottom bar around ultrawide gameplay, alerts, starting, break and ending screens and channel graphics, with a ready-made OBS scene.',
    ],
  },
];

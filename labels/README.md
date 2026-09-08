# Labelmap

Richt Streamlabs' **Stream Labels** op deze map. De app schrijft er platte
.txt-bestanden in (`most_recent_follower.txt`, `top_donator.txt`, ...) en de
overlay leest ze hier op.

Streamlabs Desktop: Settings > Stream Labels > Output Folder.
De losse Stream Labels-app heeft dezelfde instelling.

De overlay gokt geen bestandsnamen: hij leest de maplijst uit en herkent de
bestanden op patroon (`recent` + `follower`, `top` + `donator`, ...). Andere
namen werken dus ook.

De .txt-bestanden staan in .gitignore -- ze bevatten namen van kijkers.

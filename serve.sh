#!/usr/bin/env bash
# Serveer de overlay op http://localhost:8777
# OBS browser source wijst hiernaartoe (niet naar het file:// pad --
# fetch() naar raider.io werkt niet betrouwbaar vanaf file://).
cd "$(dirname "$0")"
exec python3 -m http.server 8777 --bind 127.0.0.1

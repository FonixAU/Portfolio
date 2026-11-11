# Prototype: system map

Throwaway single-file prototype (`index.html`, three.js from a CDN, no build step).
It answers one question: do procedural planets and an Outer Wilds-style map look good enough without modelled assets?

Open `index.html` through any static server, e.g. `python3 -m http.server` in this folder.

What carries over to the real site: the shaders, the camera and focus behaviour, the label/bracket/card/entry-panel pattern, the log view layout.
What does not: the single file, the hard-coded content array (becomes one Markdown file per entry), the absence of a framework.

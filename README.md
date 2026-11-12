# space-portfolio

A portfolio that is a place, not a page — a galaxy you fly around instead of a menu you click.

Starting fresh. This repo currently holds only the thinking: **read [VISION.md](VISION.md)**
for what I want, why, what the first attempt got wrong, and the order to build it in.

Nothing technical is decided yet. No stack, no scaffold, no components — deliberately, because
last time the engine got built before the content and the site ended up impressive and empty.

## Running it

```
npm install
npm run dev      # local development
npm run build    # static site in dist/; also validates every entry
```

- Content: one Markdown file per entry in `src/content/entries/`. See `AGENTS.md` for the format.
- Pages and log view: `src/layouts/Shell.astro`, `src/components/Entry.astro`, `src/styles/site.css`.
- 3D map: `src/scripts/scene.ts` and `src/scripts/shaders.ts`, loaded only when the 3D view is opened.
- `SITE` and `BASE` environment variables set the public URL and sub-path at build time.
- Contact form: set `PUBLIC_EMAILJS_SERVICE`, `PUBLIC_EMAILJS_TEMPLATE` and `PUBLIC_EMAILJS_PK` at build time (the same EmailJS values the old site used). Without them the form is left out and only the links show.

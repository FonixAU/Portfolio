# Instructions for agents working on this site

This is a portfolio drawn as a solar system. The content is plain Markdown; the map is generated from it.
To add or change work on the site you edit content files only. You should not need to touch `src/scripts/`.

## Adding an entry

1. Create one Markdown file in `src/content/entries/`.
   - A top-level file (`my-project.md`) is a planet or an asteroid.
   - A file inside a folder named after a planet (`linfox/graduate.md`) is a moon of that planet: a role at an employer, or a part of a project.
2. Fill in the frontmatter. `src/content.config.ts` is the schema and the source of truth; the build fails if an entry does not match it.
3. Write the description as the Markdown body: 80 to 150 words on the problem, what was built and how it works.
4. Run `npm run build`. It must pass.
5. Open a pull request. Never push to `main`. The owner reviews and merges.

## Frontmatter

```yaml
title: "Project name"
short: "PN"                 # optional: label on the 3D map when the title is long
kind: "project"             # sun | employer | role | project | part | asteroid
lane: "projects"            # career | projects | games. Planets only.
order: 30                   # planets: orbit order from the sun. Moons: date order.
what: "One line: what it is and who it is for"
when: "2026 to present"
status: "live"              # live | in-progress | archived | incomplete
part: "Team of four; I built the API"   # only when it is NOT a solo build
outcome: "One concrete result"
achievements: ["Up to three", "for employers and roles"]
highlights: ["Up to three", "hard or interesting parts"]
stack: ["Up to five", "technologies"]
links: [{ label: "Repo", url: "https://github.com/..." }]
images: [{ src: "/images/my-project/1.png", alt: "What the image shows" }]
body: { shape: "rugged", size: 2, palette: ["#3c6e5a", "#7fc8a9", "#1e3a30"] }   # planets only
```

Rules:
- `kind: asteroid` is for minor works and things still in progress (shown as "Minor works & in-progress"). Asteroids have no `lane` and no `body`.
- Employers are always `shape: world`. Other planets pick the shape that suits them from: `ocean`, `giant`, `crystal`, `twin`, `rugged`, `holo`, `shattered`, `molten`, `comet`.
- `palette` is three hex colours: main, secondary, accent. `size` is 1 to 3 for how substantial the work is.
- Reuse the exact spelling of technologies already used in other entries (`Next.js`, not `NextJS`).
- Only real work. If something is not real yet, it does not get an entry.
- Never invent an outcome, a number or a date. Leave the field out and say so in the pull request.
- Never add contact details, employer-confidential material or anything from a private repository the owner has not approved.

## Images

Put images in `public/images/<entry-slug>/` (at most 1400 pixels wide) and list them in `images` with honest alt text. They appear as a slideshow at the top of the entry.

## What is generated for you

Every entry automatically gets its own page, a place in the log view, a body in the 3D map, a line in `/llms.txt` and a line in `/resume/`.

## Checking your work

`npm run build`, then `npm run preview` and open the entry's page. Check it in the log view and the 3D map.

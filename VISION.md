# Space Portfolio — Vision & Lessons

Notes from the first attempt (the "GALACTIC PORTFOLIO OS" / Outer Spore Dashboard build,
Aug–Sep 2026). This file records **what I wanted and why**, not how it was coded. The old
code lives in `outer-spore-dashboard-copied` if I ever want to raid it for parts; this repo
starts clean.

---

## The core desire

I don't want a portfolio that is a *page*. I want a portfolio that is a **place I can fly
around**. Someone lands, sees a galaxy, and has to explore to find out who I am. The
navigation *is* the content.

The feeling I'm chasing: the galactic map in **Spore** (systems, planets, a sense of a whole
map of a life) plus the curiosity of **Outer Wilds** (you figure things out by going there,
not by reading a menu). Not a game — a site that borrows the *feeling* of one.

Intention here is not to build a space flying SIM, it should be dragable, clickable and navigated like a Menu. Just like Spore's Space gameplay map or the Outer wilds Map screen.

## What each part of the map meant

| Place | What it is | Why it exists |
|---|---|---|
| Galaxy | The whole thing, first thing you see | Gives the "this is a world" hit before any text |
| Portfolio system | Career timeline | Companies are **planets**, roles are their **moons**. A career as a system you can zoom into |
| Projects system | Things I've built | Each project its own planet; tech and achievements orbit as nodes |
| Lab | Experiments, prototypes, half-finished ideas | Room to be unfinished in public without it looking sloppy |
| Tools | Small utilities | Proof of "I make useful things" in one click, no résumé speak |
| Contact | How to reach me | Function of the Black hole/Center of galaxy |
| Admin | Private | Me-only controls; also a place to show I can build gated things |

Zoom levels, one per URL: galaxy → system → planet → moon → detail. **Every view has a
shareable URL**, so a recruiter can be sent straight to one moon instead of "click around
until you find it".

## Desires that mattered more than they sound

- **Memorable over complete.** One person should remember "the space one" a week later. Nobody
  remembers a hero image and three cards.
- **Explorable, not clever.** If a visitor can't find my work in ~10 seconds, the metaphor
  failed. The galaxy must be a shortcut, not a maze.
- **Fast and quiet.** Cheap to load, no spinners, no marketing animation, nothing moves unless
  I move it. Reduced-motion users get a still map, not a broken one.
- **Keyboard and screen-reader equal.** If the only way in is dragging a 3D camera, it's a
  toy, not a portfolio. Every place needs a real, reachable, labelled equivalent.
- **Data-driven content.** Adding a job or project should be editing one typed entry, never
  touching scene code. Content outlives the renderer.
- **Deterministic.** Same URL, same galaxy, every load. No random layout that changes the
  story between visits.
- **Mine, hosted cheap.** Static build, my own domain, behind Cloudflare. No CMS, no vendor.
- **Honest.** Real history (Linfox, Diverse Tech Lab, real side projects) rather than invented
  planets to fill the map.

## The "investigation board" idea (keep this one)

A whole-galaxy view where clues pin together: project → tech → company → role, drawn as
threads. A visitor can pull one thread — "what has this person done with Terraform?" — and
watch the path light up across the map. This was the most interesting idea in the first
attempt and the one I'd most regret dropping.

## What went wrong last time (so it doesn't again)

1. **Built the engine before the content.** Weeks went into camera, orbits, shaders and
   picking while the actual portfolio was placeholder text. The site was impressive and said
   nothing.
2. **Scope as a universe.** Seven systems, moons, belts, binary stars, investigation mode,
   auth policies, admin — all at once. Nothing was finished enough to show anyone.
3. **Metaphor outran usability.** Too many click targets, labels that only made sense if you
   already knew the model, and no plain fallback list of the same information.
4. **Tooling friction ate the fun.** Build/watcher problems on the work setup turned a
   creative project into infrastructure chores.
5. **No "good enough to send" milestone.** There was never a version I'd actually put in front
   of a recruiter, so it never shipped.

## How the fresh start should go

1. **Content first, in plain text.** Write the real career/project copy before any 3D. If the
   words don't hold up as a boring list, the galaxy won't save them. Investigation mode planning happens here when applicable.
2. **One system, end to end.** Galaxy → Portfolio system → one planet → one moon → a real
   role, on a phone and with a keyboard, deployed publicly. That's the first ship.
3. **Then the boring-but-necessary twin:** a plain `/index` list of everything in the galaxy,
   reachable in one click, for anyone who doesn't want to fly.
4. **Then widen** — projects, lab, writing, tools — one system at a time, each shippable on
   its own.
5. **Investigation board last**, once there's enough real content for threads to be worth
   pulling.
6. **Keep the map honest.** If something isn't real yet, it doesn't get a planet.

## Non-negotiables

- Shareable URL per view; back button always works.
- Keyboard + screen-reader path to every piece of content.
- Respects reduced motion.
- Mobile-first: pinch/zoom/tap must feel deliberate, not accidental.
- Real content only.

## Reference

- Earlier site (content source, plain version): `github.com/FonixAU/PersonalWebsite`
- First space attempt (code, if needed): `outer-spore-dashboard-copied` — Spore/Outer Wilds
  inspired galaxy dashboard, React + Three.js, 7 systems, investigation mode.

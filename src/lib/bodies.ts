import { getCollection, type CollectionEntry } from 'astro:content';

export type Body = CollectionEntry<'entries'>['data'] & {
  id: string; parent: string | null; url: string; label: string; entry: CollectionEntry<'entries'>;
  // layout, derived from the data so the same content always gives the same system
  a: number; ang: number; seed: number;
  e: number; inc: number; node: number; peri: number; // orbital elements: eccentricity, inclination, ascending node, argument of periapsis
};

export const LANES = { career: 'Career', projects: 'Projects', games: 'Games' } as const;

// deterministic pseudo-random stream from a string
const rnd = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
};

export async function loadBodies(): Promise<Body[]> {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const all = (await getCollection('entries')).sort((x, y) => x.data.order - y.data.order);
  const bodies = all.map((entry) => ({
    ...entry.data, entry, id: entry.id,
    parent: entry.id.includes('/') ? entry.id.split('/')[0] : null,
    url: `${base}${entry.id}/`, label: entry.data.short ?? entry.data.title, a: 0, ang: 0, seed: 0, e: 0, inc: 0, node: 0, peri: 0,
  })) as Body[];

  const planets = bodies.filter((b) => !b.parent && b.body);
  const rocks = bodies.filter((b) => b.kind === 'asteroid');
  // Spacing grows outward by a fixed ratio, roughly as real planetary systems do (Titius-Bode).
  // Each orbit gets a small eccentricity and a tilt of a few degrees, like the real planets (all within about 7 degrees).
  // Eccentricity is capped so an orbit never crosses its neighbours: periapsis stays clear of the previous apoapsis.
  let prevApo = 10; // keeps the innermost orbit clear of the sun
  planets.forEach((b, i) => {
    const R = rnd(b.id); b.seed = R() * 50; b.a = 11 * 1.2 ** i; b.ang = R() * Math.PI * 2;
    b.e = Math.max(0, Math.min(0.02 + R() ** 2 * 0.16, 1 - prevApo * 1.04 / b.a)); prevApo = b.a * (1 + b.e);
    b.inc = (0.5 + R() * 6) * Math.PI / 180; b.node = R() * Math.PI * 2; b.peri = R() * Math.PI * 2;
  });
  const belt = prevApo + 6;
  rocks.forEach((b, i) => { const R = rnd(b.id); b.seed = R() * 50; b.a = belt + (R() - 0.5) * 2; b.ang = (i / rocks.length) * Math.PI * 2 + 0.6; });
  for (const b of bodies.filter((b) => b.parent)) {
    const sibs = bodies.filter((s) => s.parent === b.parent), R = rnd(b.id);
    b.seed = R() * 50; b.a = sibs.indexOf(b); b.ang = R() * Math.PI * 2; // a = index; the client turns it into a radius
  }
  for (const b of bodies) if (b.parent && !bodies.some((p) => p.id === b.parent)) throw new Error(`${b.id}: no parent entry "${b.parent}.md"`);
  return bodies;
}

/** What the browser needs to draw the map. Text content stays in the HTML. */
export const sceneData = (bodies: Body[]) => bodies.map((b) => ({
  id: b.id, url: b.url, title: b.title, label: b.label, kind: b.kind, lane: b.lane ?? null, parent: b.parent,
  shape: b.body?.shape ?? null, size: b.body?.size ?? 1, pal: b.body?.palette ?? null,
  a: +b.a.toFixed(3), ang: +b.ang.toFixed(4), seed: +b.seed.toFixed(3),
  e: +b.e.toFixed(4), inc: +b.inc.toFixed(4), node: +b.node.toFixed(4), peri: +b.peri.toFixed(4),
}));

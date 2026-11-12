import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

// One Markdown file per entry. A file in a folder (linfox/graduate.md) is a moon of that folder's planet.
// The Markdown body is the description (80-150 words).
const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string(),
    short: z.string().optional(), // label on the 3D map when the title is long
    kind: z.enum(['sun', 'employer', 'role', 'project', 'part', 'asteroid']),
    lane: z.enum(['career', 'projects', 'games']).optional(),
    order: z.number(), // orbit order for planets, date order for moons
    what: z.string().optional(), // one line
    when: z.string().optional(),
    status: z.enum(['live', 'in-progress', 'archived', 'incomplete']).optional(),
    part: z.string().optional(), // only when it is not a solo build
    outcome: z.string().optional(),
    achievements: z.array(z.string()).max(3).default([]),
    highlights: z.array(z.string()).max(3).default([]),
    stack: z.array(z.string()).max(5).default([]),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    images: z.array(z.object({ src: z.string(), alt: z.string() })).max(6).default([]),
    body: z.object({
      shape: z.enum(['world', 'ocean', 'giant', 'crystal', 'twin', 'rugged', 'holo', 'shattered', 'molten', 'comet']),
      size: z.number().int().min(1).max(3),
      palette: z.tuple([hex, hex, hex]),
    }).optional(),
  }),
});

export const collections = { entries };

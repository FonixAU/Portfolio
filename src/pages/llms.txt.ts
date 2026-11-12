// Plain-text index of the site for AI tools and anything else that wants words only.
import type { APIRoute } from 'astro';
import { loadBodies, LANES } from '../lib/bodies';

export const GET: APIRoute = async ({ site }) => {
  const bodies = await loadBodies();
  const abs = (u: string) => (site ? new URL(u, site).href : u);
  const line = (b: (typeof bodies)[number]) => `- [${b.title}](${abs(b.url)})${b.what ? `: ${b.what}` : ''}${b.when ? ` (${b.when})` : ''}${b.stack.length ? ` [${b.stack.join(', ')}]` : ''}`;
  const sun = bodies.find((b) => b.kind === 'sun')!;
  const out = [`# Felipe Ortiz`, '', `> ${sun.what ?? ''}`, '', sun.entry.body?.trim() ?? ''];
  for (const [k, name] of Object.entries(LANES)) {
    out.push('', `## ${name}`);
    for (const b of bodies.filter((b) => b.lane === k && !b.parent)) {
      out.push(line(b), ...bodies.filter((m) => m.parent === b.id).map((m) => '  ' + line(m)));
    }
  }
  out.push('', '## Minor works and in-progress', ...bodies.filter((b) => b.kind === 'asteroid').map(line));
  return new Response(out.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

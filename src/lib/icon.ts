// Stylised 2D drawing of a body, for the ship-log line-up. Mirrors the 3D shapes.
type IconBody = { kind: string; parent?: string | null; body?: { shape: string; palette: string[] } };

const rockPts = '-34,-18 -8,-40 26,-30 40,-2 28,30 -6,40 -36,20';
const hexv = [0, 1, 2, 3, 4, 5].map((i) => [Math.cos((i * Math.PI) / 3) * 42, Math.sin((i * Math.PI) / 3) * 42]);
const f = (n: number) => n.toFixed(1);
const shade = '<circle r="40" fill="url(#shade)"/>';

export function icon(b: IconBody): string {
  const [A, B, C] = b.body?.palette ?? ['#6b6964', '#a7a59c', '#3d3d3a'];
  const rock = `<polygon points="${rockPts}" fill="${A}"/><polygon points="-8,-40 26,-30 4,-4" fill="${B}"/><polygon points="40,-2 28,30 4,-4" fill="${C}" opacity=".85"/><polygon points="-36,20 -6,40 4,-4" fill="${B}" opacity=".35"/>`;
  const land = `<path d="M-30 -8q10 -14 22 -6t16 2q4 10 -8 14t-22 2z" fill="${B}"/><path d="M6 14q12 -6 20 2t-2 14q-14 4 -18 -6z" fill="${B}"/>`;
  const shape = b.kind === 'sun' ? 'sun' : b.parent ? 'moon' : b.kind === 'asteroid' ? 'rugged' : b.body?.shape ?? 'rugged';
  const art: Record<string, string> = {
    sun: `<circle r="53" fill="url(#sunCorona)"/><circle r="40" fill="url(#sunDisc)"/><circle r="40" fill="#7a1c00" filter="url(#sunGrain)" opacity=".5"/>
      <path d="M-33 -30q-14 -10 -6 -22M30 -34q16 -6 14 -20M40 18q16 6 12 20" fill="none" stroke="#ff7a20" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`,
    world: `<circle r="46" fill="none" stroke="#7fc4ff" stroke-opacity=".5" stroke-width="3.5"/><circle r="40" fill="${A}"/>${land}<path d="M-22 -33a40 40 0 0 1 44 0q-22 9 -44 0z" fill="${C}"/>${shade}`,
    ocean: `<circle r="40" fill="${A}"/>${land}${shade}`,
    giant: `<g transform="rotate(-14)"><ellipse rx="34" ry="30" fill="${A}"/><path d="M-31 -10h62M-32 4h64M-26 17h52" stroke="${B}" stroke-width="5" stroke-linecap="round" opacity=".8"/><ellipse rx="34" ry="30" fill="url(#shade)"/><ellipse rx="50" ry="11" fill="none" stroke="${B}" stroke-width="4"/><ellipse rx="42" ry="8" fill="none" stroke="${C}" stroke-width="2"/></g>`,
    twin: `<circle cx="-18" cy="6" r="25" fill="${A}"/><circle cx="-26" cy="0" r="7" fill="${B}"/><circle cx="-18" cy="6" r="25" fill="url(#shade)"/><circle cx="24" cy="-10" r="20" fill="#b0522a"/><circle cx="28" cy="-4" r="6" fill="#f0c090"/><circle cx="24" cy="-10" r="20" fill="url(#shade)"/>`,
    rugged: rock,
    moon: `<circle r="40" fill="#8a8882"/><circle cx="-12" cy="-10" r="9" fill="#5f5e5a"/><circle cx="14" cy="12" r="6" fill="#5f5e5a"/>${shade}`,
    holo: `<g fill="none" stroke="#7fe0ff" stroke-width="2.5" stroke-linejoin="round"><polygon points="${hexv.map((v) => v.map(f)).join(' ')}"/><path d="${hexv.map((v) => `M0 0L${f(v[0])} ${f(v[1])}`).join('')}" stroke-opacity=".6"/><polygon points="0,-20 17,10 -17,10" stroke="#fff"/></g>`,
    shattered: `<circle r="26" fill="#ff6a1a" opacity=".3"/><circle r="15" fill="#ff8a2a"/>` + hexv.map((v, i) => {
      const w = hexv[(i + 1) % 6], a = ((i + 0.5) * Math.PI) / 3, k = i % 2 ? 1 : 0.88;
      return `<polygon points="${f(v[0] * k)},${f(v[1] * k)} ${f(w[0] * k)},${f(w[1] * k)} ${f(Math.cos(a) * 24)},${f(Math.sin(a) * 24)}" fill="${i % 2 ? '#70504a' : '#4a3530'}"/>`;
    }).join(''),
    molten: `<circle r="40" fill="${A}"/><path d="M-34 -10l14 6 8 -14 16 10 10 -8 18 12M-28 18l16 -6 12 12 14 -10 16 8" fill="none" stroke="${B}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>${shade}`,
    comet: `<path d="M2 -8L46 -44M10 2L50 -24M-6 -16L30 -50" stroke="#9fd8ff" stroke-width="4" stroke-linecap="round" opacity=".55"/><g transform="translate(-12 12) scale(.62)">${rock}</g>`,
    crystal: `<path d="M0 -50L8 -24 34 -40 24 -12 50 0 24 12 34 40 8 24 0 50 -8 24 -34 40 -24 12 -50 0 -24 -12 -34 -40 -8 -24z" fill="${B}"/><circle r="24" fill="${A}"/><circle r="24" fill="url(#shade)"/>`,
  };
  return `<svg viewBox="-54 -54 108 108" aria-hidden="true">${art[shape]}</svg>`;
}

/** Shared gradients and filters; include once per page. */
export const iconDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<radialGradient id="shade" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<radialGradient id="sunDisc"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#ffb734"/><stop offset=".84" stop-color="#ff6412"/><stop offset="1" stop-color="#b82a00"/></radialGradient>
<radialGradient id="sunCorona"><stop offset=".7" stop-color="#ff7a1e" stop-opacity=".7"/><stop offset=".85" stop-color="#ff5a10" stop-opacity=".25"/><stop offset="1" stop-color="#ff4a00" stop-opacity="0"/></radialGradient>
<filter id="sunGrain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .48  0 0 0 0 .11  0 0 0 0 0  0 0 0 2.4 -1.05"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs></svg>`;

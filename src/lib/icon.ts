// Stylised 2D drawing of a body, for the ship-log line-up. Mirrors the 3D shapes.
type IconBody = { id?: string; kind: string; parent?: string | null; body?: { shape: string; palette: string[] } };

const rockPts = '-34,-18 -8,-40 26,-30 40,-2 28,30 -6,40 -36,20';
const hexv = [0, 1, 2, 3, 4, 5].map((i) => [Math.cos((i * Math.PI) / 3) * 42, Math.sin((i * Math.PI) / 3) * 42]);
const f = (n: number) => n.toFixed(1);

// The sun, drawn once, in the manner of an old engraving: a ring of curling flames, a spiral of fire
// inside, ink contours and stippled shading. Hand-drawn wobble comes from the #ink filter.
const sunArt = (() => {
  let h = 20261113;
  const R = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const P = (a: number, r: number) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;
  const INK = '#5a1606';
  // flames: each tongue leans the same way round, so the sun seems to turn
  let flames = '';
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + R() * 0.12, w = 0.2 + R() * 0.05, len = i % 2 ? 7 + R() * 3 : 11 + R() * 4, lean = 0.3 + R() * 0.12;
    flames += `M${P(a - w, 38)}Q${P(a - w * 0.2, 40 + len * 0.55)} ${P(a + lean, 40 + len)}Q${P(a + w * 0.9, 40 + len * 0.35)} ${P(a + w, 38)}Z`;
  }
  // spiral of fire from the centre outwards
  const spiral = (turns: number, r0: number, r1: number, phase: number) => {
    let d = '';
    for (let k = 0; k <= 60; k++) { const t = k / 60; d += `${k ? 'L' : 'M'}${P(phase + t * turns * 6.2832, r0 + (r1 - r0) * Math.pow(t, 0.85))}`; }
    return d;
  };
  // short curved licks that follow the turn of the spiral
  let licks = '';
  for (let i = 0; i < 9; i++) { const a = R() * 6.2832, r = 16 + R() * 17, sw = 0.35 + R() * 0.25; licks += `M${P(a, r)}Q${P(a + sw / 2, r + 4)} ${P(a + sw, r - 1)}`; }
  // stipple: denser towards the lower right, the way an engraver shades a sphere
  let dots = '';
  for (let i = 0; i < 70; i++) { const a = 0.75 + (R() - 0.5) * 2.4, r = 40 * Math.sqrt(0.45 + R() * 0.52); dots += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(0.45 + R() * 0.55)}"/>`; }
  return `<path d="${flames}" fill="#f0741f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle r="40" fill="#e55a1b" stroke="${INK}" stroke-width="2"/>
    <circle r="33" fill="#f07a22"/><circle r="22" fill="#f89a2b"/><circle r="10" fill="#ffc64a"/>
    <path d="${spiral(2.3, 2, 35, 0.4)}" fill="none" stroke="#ffd066" stroke-width="5" stroke-linecap="round"/>
    <path d="${spiral(2.3, 4, 37, 0.62)}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="${licks}" fill="none" stroke="#ffe08a" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="${INK}" opacity=".8">${dots}</g>`;
})();

// Engraver's shading, shared by every round body: dots that thicken towards the lower right.
const stipple = (() => {
  let h = 4711;
  const R = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  let d = '';
  for (let i = 0; i < 64; i++) { const a = 0.75 + (R() - 0.5) * 2.3, r = 39 * Math.sqrt(0.38 + R() * 0.58); d += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(0.5 + R() * 0.6)}"/>`; }
  return d;
})();
const darken = (hex: string, k: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

/** Every body is drawn like the sun: flat colour, an ink line, a motif, and stippled shade. Round bodies fill the same height. */
export function icon(b: IconBody): string {
  const [A, B, C] = b.body?.palette ?? ['#6b6964', '#a7a59c', '#3d3d3a'];
  const INK = darken(A, 0.32);
  const dots = (scale = 1, x = 0, y = 0) => `<g fill="${INK}" opacity=".8" transform="translate(${x} ${y}) scale(${scale})">${stipple}</g>`;
  const disc = (fill = A, r = 40) => `<circle r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2"/>`;
  const line = (d: string, stroke: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const waves = (rows: number[][]) => line(rows.map(([x, y]) => `M${x} ${y}q4 -3.5 8 0t8 0`).join(''), C, 1.5, 'opacity=".75"');
  const rock = `<polygon points="${rockPts}" fill="${A}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><polygon points="-8,-40 26,-30 4,-4" fill="${B}"/><polygon points="40,-2 28,30 4,-4" fill="${C}" opacity=".9"/>`
    + line('M-8 -40L4 -4L-36 20M4 -4L40 -2M4 -4L-6 40M26 -30L4 -4L28 30', INK, 1.2) + line('M-28 -8l10 8M-30 2l12 10M-30 12l10 9M10 8l14 12M8 18l10 9', INK, 0.9, 'opacity=".7"');
  // Land is generated from the entry's id: the same entry always gets the same continents, and no two entries share them.
  let h = 2166136261;
  for (const c of b.id ?? 'x') h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const R = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const blob = (cx: number, cy: number, r: number, n = 8, jit = 0.75) => {
    const p = Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.2832, k = r * (1 - jit / 2 + R() * jit); return [cx + Math.cos(a) * k * 1.25, cy + Math.sin(a) * k * 0.85]; });
    return p.map((a, i) => { const q = p[(i + 1) % n], z = p[(i + n - 1) % n]; return `${i ? '' : `M${f((z[0] + a[0]) / 2)} ${f((z[1] + a[1]) / 2)}`}Q${f(a[0])} ${f(a[1])} ${f((a[0] + q[0]) / 2)} ${f((a[1] + q[1]) / 2)}`; }).join('') + 'Z';
  };
  const lands = (count: number, rmin: number, rmax: number) => {
    let d = '';
    for (let i = 0; i < count; i++) { const a = (i / count) * 6.2832 + R() * 1.6, q = 10 + R() * 18; d += blob(Math.cos(a) * q, Math.sin(a) * q * 0.8 + 4, rmin + R() * (rmax - rmin)); }
    // outline first, then the fill again on top: where blotches overlap, the inner lines are covered and the land reads as one mass
    return `<g clip-path="url(#discClip)"><path d="${d}" fill="${B}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="${d}" fill="${B}"/></g>`;
  };
  const sea = (count: number) => waves(Array.from({ length: count }, () => { const a = R() * 6.2832, q = Math.sqrt(R()) * 28; return [Math.round(Math.cos(a) * q - 8), Math.round(Math.sin(a) * q)]; }));
  const shape = b.kind === 'sun' ? 'sun' : b.parent ? 'moon' : b.kind === 'asteroid' ? 'rugged' : b.body?.shape ?? 'rugged';
  const art: Record<string, string> = {
    sun: sunArt,
    // an inhabited world: continents, a cap of ice, a few waves, and a dotted ring for its air
    world: `<circle r="47" fill="none" stroke="${B}" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="1.5 4.5" stroke-linecap="round"/>${disc()}${sea(4)}${lands(2 + Math.floor(R() * 3), 8, 15)}<path d="M-22 -33a40 40 0 0 1 44 0q-22 9 -44 0z" fill="${C}" stroke="${INK}" stroke-width="1.3"/>${dots()}`,
    ocean: `${disc()}${sea(8)}${lands(1 + Math.floor(R() * 2), 5, 9)}${dots()}`,
    // a banded giant with its ring drawn as two ink lines
    giant: `<g transform="rotate(-14)"><ellipse rx="40" ry="38" fill="${A}" stroke="${INK}" stroke-width="2"/>${line('M-38 -14q38 9 76 0M-39 3q39 9 78 0M-34 20q34 8 68 0', B, 6, 'opacity=".85"')}${line('M-36 -20q36 8 72 0M-40 -4q40 9 80 0M-38 12q38 9 76 0', INK, 0.9, 'opacity=".7"')}${dots(0.97)}
      <ellipse rx="54" ry="11" fill="none" stroke="${B}" stroke-width="4.5"/><ellipse rx="57" ry="12.6" fill="none" stroke="${INK}" stroke-width="1"/><ellipse rx="50.5" ry="9" fill="none" stroke="${INK}" stroke-width="1"/></g>`,
    twin: `<circle cx="-18" cy="6" r="27" fill="${A}" stroke="${INK}" stroke-width="2"/><circle cx="-26" cy="0" r="7" fill="${B}"/>${dots(0.66, -18, 6)}<circle cx="26" cy="-12" r="21" fill="#b0522a" stroke="#3a1a0e" stroke-width="2"/><circle cx="30" cy="-6" r="6" fill="#f0c090"/>${dots(0.5, 26, -12)}`,
    rugged: rock,
    moon: `${disc('#8a8882')}<circle cx="-12" cy="-10" r="9" fill="#6a6964" stroke="#2c2c2a" stroke-width="1.6"/><circle cx="14" cy="12" r="6" fill="#6a6964" stroke="#2c2c2a" stroke-width="1.6"/><circle cx="12" cy="-20" r="3.5" fill="#6a6964" stroke="#2c2c2a" stroke-width="1.2"/>${dots()}`,
    // a made thing: only lines, with a bead at each joint
    holo: `<g fill="none" stroke="#7fe0ff" stroke-width="2.2" stroke-linejoin="round"><polygon points="${hexv.map((v) => v.map(f)).join(' ')}"/><path d="${hexv.map((v) => `M0 0L${f(v[0])} ${f(v[1])}`).join('')}" stroke-opacity=".6"/><polygon points="0,-20 17,10 -17,10" stroke="#fff"/></g>` + hexv.map((v) => `<circle cx="${f(v[0])}" cy="${f(v[1])}" r="2.6" fill="#dff6ff"/>`).join(''),
    shattered: `<circle r="27" fill="#ff6a1a" opacity=".3"/><circle r="15" fill="#ff8a2a" stroke="#5a1606" stroke-width="1.6"/><circle r="6" fill="#ffd066"/>` + hexv.map((v, i) => {
      const w = hexv[(i + 1) % 6], a = ((i + 0.5) * Math.PI) / 3, k = i % 2 ? 1 : 0.88;
      return `<polygon points="${f(v[0] * k)},${f(v[1] * k)} ${f(w[0] * k)},${f(w[1] * k)} ${f(Math.cos(a) * 24)},${f(Math.sin(a) * 24)}" fill="${i % 2 ? '#7a5850' : '#523a34'}" stroke="#1e1210" stroke-width="1.6" stroke-linejoin="round"/>`;
    }).join(''),
    molten: `${disc()}${line('M-34 -10l14 6 8 -14 16 10 10 -8 18 12M-28 18l16 -6 12 12 14 -10 16 8', B, 4.5)}${line('M-20 -4l6 12M12 -8l4 12M0 24l-4 10', B, 2.5)}${dots()}`,
    comet: line('M2 -8C16 -24 30 -32 52 -36M10 2C24 -10 38 -16 54 -16M-6 -16C4 -32 18 -44 38 -52', '#9fd8ff', 3, 'opacity=".7"') + `<g transform="translate(-12 12) scale(.62)">${rock}</g>`,
    // a spiked crystal: sixteen points, ink lines from the heart to each tip
    crystal: `<path d="M0 -50L8 -24 34 -40 24 -12 50 0 24 12 34 40 8 24 0 50 -8 24 -34 40 -24 12 -50 0 -24 -12 -34 -40 -8 -24z" fill="${B}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>${line('M0 -50V50M-50 0H50M-34 -40L34 40M34 -40L-34 40', INK, 0.9, 'opacity=".55"')}<circle r="23" fill="${A}" stroke="${INK}" stroke-width="2"/>${dots(0.56)}`,
  };
  return `<svg viewBox="-58 -58 116 116" aria-hidden="true"><g filter="url(#ink)">${art[shape]}</g></svg>`;
}

/** Shared gradients and filters; include once per page. */
export const iconDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<clipPath id="discClip"><circle r="39"/></clipPath>
<filter id="ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs></svg>`;

// @ts-nocheck
// The 3D system map. Loaded only when the 3D view is opened.
// Everything is generated in code from the scene data: no models, no textures.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { VERT, PVERT, PLANET, ATMO, RING, SUN, CORONA, SKY } from './shaders';

THREE.ColorManagement.enabled = false; // colours are authored as display values; bright values (>1) feed the bloom

const rgb = (h) => { if (typeof h === 'string') h = parseInt(h.slice(1), 16); return new THREE.Vector3((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255); };
const rnd = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ h >>> 15, 2246822507) ^ Math.imul(h ^ h >>> 13, 3266489909)) >>> 0) / 4294967296; };
const LANE_TINT = { career: 0xfac775, projects: 0x9fe1cb, games: 0xcecbf6 };
const SURFACE = { world: 2, ocean: 2, giant: 1, crystal: 4, twin: 0, rugged: 0, holo: 0, shattered: 0, molten: 3, comet: 0 }; // shader surface per shape
const GREY = [0x5f5e5a, 0x9a988f, 0x2c2c2a], MOON = [0x777570, 0xb4b2a9, 0x444441];
const UP = new THREE.Vector3(0, 1, 0), SYS = 100;
const ease = (t) => 1 - Math.pow(1 - t, 3); // starts moving at once, lands softly

export function createScene({ canvas, labels, brk, bodies, motion, skills = [] }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 0.92));

  const sphere = new THREE.SphereGeometry(1, 64, 48), rock = new THREE.IcosahedronGeometry(1, 3);
  const B = bodies.map((b) => ({ ...b })), byId = Object.fromEntries(B.map((b) => [b.id, b]));
  const pick = [];

  // ----- sky: faint dust band and two layers of stars
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SKY, side: THREE.BackSide, depthWrite: false }));
  sky.rotation.set(0.9, 0.3, 0.4); scene.add(sky);
  for (const [n, size, lo] of [[4200, 1.3, 0.25], [260, 2.6, 0.7]]) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), R = rnd('stars' + n);
    for (let i = 0; i < n; i++) {
      const u = R() * 2 - 1, a = R() * 6.2832, s = Math.sqrt(1 - u * u), k = lo + R() * (1.15 - lo), w = R();
      pos.set([Math.cos(a) * s * 1500, u * 1500, Math.sin(a) * s * 1500], i * 3);
      col.set([k * (w > 0.85 ? 1.1 : 0.92), k * 0.94, k * (w < 0.2 ? 1.15 : 0.86)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true })));
  }

  // ----- sun: granulated surface, limb darkening, sunspots, and a corona that always faces the camera
  const sun = B.find((b) => b.kind === 'sun'); sun.r = 3.4; sun.moons = []; sun.group = new THREE.Group(); scene.add(sun.group);
  const clock = { value: 0 };
  sun.mesh = new THREE.Mesh(sphere, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SUN, uniforms: { t: clock } }));
  sun.mesh.scale.setScalar(sun.r); sun.mesh.userData.b = sun; sun.group.add(sun.mesh); pick.push(sun.mesh);
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ fragmentShader: CORONA, uniforms: { t: clock }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}` }));
  corona.scale.setScalar(sun.r * 4); scene.add(corona);
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,130,40,.9)'); g.addColorStop(0.45, 'rgba(255,80,10,.25)'); g.addColorStop(1, 'rgba(255,40,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  })();

  // ----- bodies
  function planetMat(b, o = {}) {
    const pal = o.pal || b.pal;
    return new THREE.ShaderMaterial({ vertexShader: PVERT, fragmentShader: PLANET, side: o.side || THREE.FrontSide,
      uniforms: { A: { value: rgb(pal[0]) }, Bc: { value: rgb(pal[1]) }, C: { value: rgb(pal[2]) }, T: { value: o.type ?? b.type }, S: { value: b.seed }, D: { value: o.D || 0 }, F: { value: o.F || 0 } } });
  }
  const ghost = () => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); // invisible, still clickable
  function build(b) {
    const s = b.shape;
    if (s === 'rugged' || s === 'comet') return new THREE.Mesh(rock, planetMat(b, { D: 0.24, F: 1 }));
    if (s === 'molten') return new THREE.Mesh(rock, planetMat(b, { D: 0.1, F: 1 }));
    if (s === 'twin' || s === 'holo' || s === 'shattered') return new THREE.Mesh(sphere, ghost());
    return new THREE.Mesh(sphere, planetMat(b));
  }
  function decorate(b, R) {
    const m = b.mesh, s = b.shape;
    if (s === 'world' || s === 'ocean') {
      const h = new THREE.Mesh(sphere, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: ATMO, uniforms: { C: { value: rgb(s === 'world' ? 0x7fc4ff : 0x8fe0d8) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      h.scale.setScalar(s === 'world' ? 1.16 : 1.1); m.add(h);
    }
    if (s === 'giant') {
      m.scale.y *= 0.88;
      const rg = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.3, 128), new THREE.ShaderMaterial({ uniforms: { C: { value: rgb(b.pal[1]) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: `varying vec3 vP;varying vec3 vW;void main(){vP=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`, fragmentShader: RING }));
      rg.rotation.x = Math.PI / 2; m.add(rg);
    }
    if (s === 'crystal') {
      const n = 30, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 1, 5), planetMat(b, { F: 1 }), n), d = new THREE.Object3D();
      for (let i = 0; i < n; i++) { const dir = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), h = 0.5 + R() * 0.9; d.position.copy(dir).multiplyScalar(0.85 + h / 2); d.quaternion.setFromUnitVectors(UP, dir); d.scale.set(0.7 + R() * 0.8, h, 0.7 + R() * 0.8); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
      m.add(im);
    }
    if (s === 'twin') { b.spin = 0.5; [[-0.8, b.pal], [0.8, [0xb0522a, 0xf0c090, 0x5a2416]]].forEach(([x, pal]) => { const t = new THREE.Mesh(sphere, planetMat(b, { pal })); t.position.x = x; t.scale.setScalar(0.6); m.add(t); }); }
    if (s === 'holo') {
      b.spin = 0.3;
      const mk = (g, c, o) => new THREE.LineSegments(new THREE.WireframeGeometry(g), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o }));
      m.add(mk(new THREE.IcosahedronGeometry(1, 1), new THREE.Color(0.7, 1.6, 2.0), 0.9), mk(new THREE.OctahedronGeometry(0.5, 0), new THREE.Color(1.6, 1.6, 1.6), 0.8));
    }
    if (s === 'shattered') {
      b.spin = 0.08;
      const ico = new THREE.IcosahedronGeometry(1, 1).attributes.position, pts = [], v3 = (i) => new THREE.Vector3().fromBufferAttribute(ico, i);
      for (let i = 0; i < ico.count; i += 3) {
        if (R() < 0.22) continue;
        const t = [v3(i), v3(i + 1), v3(i + 2)], c = t[0].clone().add(t[1]).add(t[2]).divideScalar(3), k = 1 + R() * 0.16;
        const o = t.map((p) => p.lerp(c, 0.14).multiplyScalar(k)); pts.push(...o, ...o.map((p) => p.clone().multiplyScalar(0.86)).reverse());
      }
      m.add(new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(pts), planetMat(b, { F: 1, side: THREE.DoubleSide, type: 0, pal: [0x3a2a26, 0x70504a, 0x1a1210] })));
      const core = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.2) })); core.scale.setScalar(0.48); m.add(core);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false })); g.scale.setScalar(2.6); m.add(g);
    }
    if (s === 'comet') {
      const g = new THREE.ConeGeometry(0.9, 9, 24, 1, true); g.rotateX(Math.PI); g.translate(0, 4.5, 0);
      b.tail = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: `varying float h;void main(){h=position.y/9.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying float h;void main(){gl_FragColor=vec4(.6,.85,1.,pow(1.-h,2.5)*.2);}` }));
      b.tail.scale.setScalar(b.r); b.group.add(b.tail);
    }
  }
  const line = (pts, color, op) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op }));
  const orbit = (r, color, op, seg = 96) => line(Array.from({ length: seg + 1 }, (_, i) => { const a = i / seg * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); }), color, op);
  // Planets follow Kepler ellipses with the sun at one focus. E is the eccentric anomaly; b.q tilts the ellipse into its own plane.
  const onEllipse = (b, E, out = new THREE.Vector3()) => out.set(b.a * (Math.cos(E) - b.e), 0, b.a * Math.sqrt(1 - b.e * b.e) * Math.sin(E)).applyQuaternion(b.q);
  const anomaly = (b) => { let E = b.ang; for (let k = 0; k < 6; k++) E -= (E - b.e * Math.sin(E) - b.ang) / (1 - b.e * Math.cos(E)); return E; }; // Kepler's equation, Newton steps; b.ang is the mean anomaly
  const Q = (axis, a) => new THREE.Quaternion().setFromAxisAngle(axis, a), X = new THREE.Vector3(1, 0, 0);

  const planets = B.filter((b) => !b.parent && b.kind !== 'sun' && b.kind !== 'asteroid');
  for (const b of planets) {
    const R = rnd(b.id + 'shape'); b.type = SURFACE[b.shape]; b.r = [0.6, 1.0, 1.45][b.size - 1]; b.speed = 0.3 / Math.pow(b.a, 1.5);
    b.q = Q(UP, b.node).multiply(Q(X, b.inc)).multiply(Q(UP, b.peri));
    scene.add(line(Array.from({ length: 257 }, (_, i) => onEllipse(b, i / 256 * Math.PI * 2)), new THREE.Color(LANE_TINT[b.lane] ?? 0xffffff).offsetHSL((R() - 0.5) * 0.06, 0, (R() - 0.5) * 0.1), 0.5));
    b.group = new THREE.Group(); scene.add(b.group);
    const tilt = (R() - 0.5) * 0.6; // axial tilt; moons orbit in the planet's equatorial plane, so their orbits share it
    b.mesh = build(b); b.mesh.scale.setScalar(b.r); b.mesh.rotation.z = tilt; b.mesh.userData.b = b; b.group.add(b.mesh); pick.push(b.mesh); decorate(b, R);
    b.moons = B.filter((m) => m.parent === b.id);
    const plane = new THREE.Group(); plane.rotation.z = tilt; b.group.add(plane);
    for (const m of b.moons) {
      m.r = b.r * 0.22; m.orbit = b.r * (2.4 + m.a * 0.7); m.speed = 0.25 / (m.a + 1); m.type = 0; m.pal = MOON; m.moons = [];
      plane.add(orbit(m.orbit, 0xffffff, 0.18));
      m.mesh = new THREE.Mesh(sphere, planetMat(m)); m.mesh.scale.setScalar(m.r); m.mesh.userData.b = m; plane.add(m.mesh); pick.push(m.mesh);
    }
  }
  // asteroid belt: named rocks plus filler
  const rocks = B.filter((b) => b.kind === 'asteroid'), belt = new THREE.Group(); scene.add(belt);
  const beltR = rocks.length ? rocks.reduce((s, b) => s + b.a, 0) / rocks.length : 60;
  {
    const n = 520, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial(), n), d = new THREE.Object3D(), R = rnd('belt'), c = new THREE.Color();
    for (let i = 0; i < n; i++) { const a = R() * 6.283, r = beltR + (R() - 0.5) * 4.5; d.position.set(Math.cos(a) * r, (R() - 0.5) * 0.9, Math.sin(a) * r); d.rotation.set(R() * 6, R() * 6, R() * 6); d.scale.setScalar(0.05 + R() * 0.14); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c.setScalar(0.2 + R() * 0.3)); }
    belt.add(im);
  }
  for (const b of rocks) {
    b.r = 0.36; b.type = 0; b.pal = GREY; b.moons = []; b.group = new THREE.Group(); b.group.position.set(Math.cos(b.ang) * b.a, 0, Math.sin(b.ang) * b.a); belt.add(b.group);
    b.mesh = new THREE.Mesh(rock, planetMat(b, { D: 0.35, F: 1 })); b.mesh.scale.set(b.r, b.r * 0.75, b.r * 0.85); b.mesh.userData.b = b; b.group.add(b.mesh); pick.push(b.mesh);
  }
  // skills as background stars, one constellation per group, low in the sky where the tilted camera looks.
  // Hover names a star; clicking one (via app.ts) lights the bodies that use that skill.
  const starTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(0.18, 'rgba(250,199,117,.9)'); g.addColorStop(0.5, 'rgba(250,170,80,.18)'); g.addColorStop(1, 'rgba(250,150,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const SKY_R = 1200, sky2 = new THREE.Group(); scene.add(sky2);
  const groups = [...new Set(skills.map((k) => k.group))];
  const dir = (az, el) => new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const SK = [], CONST = groups.map((g, gi) => {
    const R = rnd('const' + g), az = gi / groups.length * Math.PI * 2 + 0.4, el = -(gi % 2 ? 30 : 15) * Math.PI / 180;
    const c = dir(az, el), e1 = new THREE.Vector3().crossVectors(c, UP).normalize(), e2 = new THREE.Vector3().crossVectors(e1, c);
    const stars = skills.filter((k) => k.group === g).map((k) => {
      const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.15; // within about 9 degrees of the centre
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, sizeAttenuation: false, depthWrite: false, transparent: true, opacity: k.used.length ? 1 : 0.5 }));
      sp.position.copy(c).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r).normalize().multiplyScalar(SKY_R);
      sp.userData.base = k.used.length ? 0.022 : 0.015; sp.scale.setScalar(sp.userData.base); sky2.add(sp);
      const el2 = document.createElement('span'); el2.className = 'lab skill'; el2.textContent = k.name; el2.style.display = 'none'; labels.append(el2);
      const st = { ...k, m: sp, el: el2, sx: 0, sy: 0, on: false }; SK.push(st); return st;
    });
    // join the stars nearest-first into one line, like a drawn constellation
    const left = [...stars], path = [left.shift()];
    while (left.length) { const p = path.at(-1).m.position; left.sort((x, y) => x.m.position.distanceTo(p) - y.m.position.distanceTo(p)); path.push(left.shift()); }
    const ln = line(path.map((k) => k.m.position.clone().multiplyScalar(0.999)), 0xfac775, 0.16); sky2.add(ln);
    const name = document.createElement('span'); name.className = 'lab const'; name.textContent = g; labels.append(name);
    return { g, ln, name, pos: stars.reduce((p, k) => p.add(k.m.position), new THREE.Vector3()).divideScalar(stars.length) }; // name sits at the middle of its stars
  });
  let hov = null, act = null;
  function setSkill(n) {
    act = SK.find((k) => k.name === n) || null;
    for (const b of B) b.el.classList.toggle('lit', !!act && (act.used.includes(b.id) || b.moons?.some((m) => act.used.includes(m.id))));
    for (const k of SK) k.m.scale.setScalar(k.m.userData.base * (k === act ? 2 : 1));
    for (const c of CONST) c.ln.material.opacity = act && act.group === c.g ? 0.45 : 0.16;
  }
  const skillAt = (x, y, touch) => { let best = null, d0 = touch ? 26 : 16; for (const k of SK) { const d = Math.hypot(x - k.sx, y - k.sy); if (k.on && d < d0) { d0 = d; best = k; } } return best; };

  // grid that fades in beneath the focused body
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { o: { value: 0 } },
    vertexShader: `varying vec2 u;void main(){u=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 u;uniform float o;void main(){vec2 g=abs(fract(u*36.)-.5);vec2 w=fwidth(u*36.);float l=1.-min(smoothstep(0.,w.x*1.5,g.x),smoothstep(0.,w.y*1.5,g.y));
      float f=smoothstep(.5,.12,length(u));gl_FragColor=vec4(.75,.85,.9,l*f*.26*o);}` }));
  grid.rotation.x = -Math.PI / 2; scene.add(grid);

  // ----- labels are real links, so they work with the keyboard and with the click handler in app.ts
  for (const b of B) {
    const el = document.createElement('a'); el.className = 'lab' + (b.parent || b.kind === 'asteroid' ? ' minor' : ''); el.textContent = b.kind === 'sun' ? 'Contact' : b.label; el.href = b.url; el.dataset.id = b.id;
    labels.append(el); b.el = el;
  }

  // ----- camera
  let sel = null, running = false, raf = 0, last = 0, gridO = 0, fly = null;
  const cam = { yaw: 0.9, pitch: 0.48, dist: SYS, goal: SYS, target: new THREE.Vector3() };
  const wp = new THREE.Vector3(), v = new THREE.Vector3();
  const wide = () => Math.max(1, 1.15 / camera.aspect); // pull back on narrow screens
  const focusDist = (b) => (b.kind === 'sun' ? b.r * 6.5 : b.parent ? b.r * 14 : b.kind === 'asteroid' ? b.r * 16 : b.r * (b.moons.length ? 9 : 7)) * wide();
  const dest = (out) => (sel ? sel.mesh.getWorldPosition(out) : out.set(0, 0, 0));

  function select(id) {
    if (running && (byId[id] || null) === sel) return; // already there: keep the visitor's zoom and angle
    sel = byId[id] || null; cam.goal = sel ? focusDist(sel) : SYS * wide();
    if (motion && running) {
      // fly there: eased, pulling back a little mid-way so the trip reads as travel
      const travel = cam.target.distanceTo(dest(wp));
      fly = { t: 0, dur: Math.min(1.9, 0.85 + travel / 70), fromT: cam.target.clone(), fromD: cam.dist, arc: Math.min(34, travel * 0.3) };
    } else {
      fly = null; dest(cam.target); cam.dist = cam.goal;
      canvas.classList.remove('cut'); void canvas.offsetWidth; canvas.classList.add('cut'); // motion off: a short fade, no travel
    }
  }

  // Picking is done in screen space, not against the geometry: every visible body gets a hit circle of at least
  // 24 px (34 px for touch), so small, distant, moving or oddly shaped bodies are as easy to hit as large ones.
  // The closest match relative to its own circle wins, so a planet in front of the sun beats the sun.
  function hitAt(x, y, touch) {
    let best = null, bestScore = 1;
    for (const b of B) {
      if (!b.hit) continue;
      const score = Math.hypot(x - b.sx, y - b.sy) / Math.max(b.pr * 1.15, touch ? 34 : 24);
      if (score < bestScore) { bestScore = score; best = b; }
    }
    return best;
  }
  const ptrs = new Map(); let moved = 0, pinch = 0, downX = 0, downY = 0;
  const zoom = (f) => { fly = null; cam.goal = Math.min(280, Math.max(sel ? sel.r * 2.6 : 14, cam.goal * f)); };
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e); moved = 0; pinch = 0; downX = e.clientX; downY = e.clientY; });
  canvas.addEventListener('pointermove', (e) => { if (ptrs.size || e.pointerType !== 'mouse') return; const h = hitAt(e.clientX, e.clientY, false); hov = h ? null : skillAt(e.clientX, e.clientY, false); canvas.style.cursor = h || hov ? 'pointer' : 'grab'; });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (ptrs.size === 1) { cam.yaw -= (e.clientX - p.clientX) * 0.005; cam.pitch = Math.min(1.45, Math.max(0.06, cam.pitch + (e.clientY - p.clientY) * 0.004)); moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY)); }
    ptrs.set(e.pointerId, e);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pinch) zoom(pinch / d); pinch = d; moved = 99; }
  });
  const up = (e) => {
    const touch = e.pointerType !== 'mouse';
    if (!ptrs.delete(e.pointerId) || moved >= (touch ? 12 : 6) || e.type !== 'pointerup') return; // a small wobble is still a click
    const h = hitAt(e.clientX, e.clientY, touch);
    const k = h ? null : skillAt(e.clientX, e.clientY, touch);
    if (k) document.dispatchEvent(new CustomEvent('skill', { detail: k === act ? null : k.name }));
    if (h && h !== sel) document.dispatchEvent(new CustomEvent('pick', { detail: h.id }));
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });

  function resize() {
    const w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio, 2);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    const drift = motion ? dt : 0; clock.value += drift;
    for (const b of planets) {
      b.ang += b.speed * drift; onEllipse(b, anomaly(b), b.group.position); b.mesh.rotation.y += drift * (b.spin || 0.05); // mean motion is steady, so planets speed up near the sun
      if (b.tail) b.tail.quaternion.setFromUnitVectors(UP, v.copy(b.group.position).normalize());
      for (const m of b.moons) { m.ang += m.speed * drift; m.mesh.position.set(Math.cos(m.ang) * m.orbit, 0, Math.sin(m.ang) * m.orbit); }
    }
    belt.rotation.y -= drift * 0.0012; scene.updateMatrixWorld();
    dest(wp);
    if (fly) {
      fly.t += dt / fly.dur; const e = ease(Math.min(1, fly.t));
      cam.target.lerpVectors(fly.fromT, wp, e); cam.dist = fly.fromD + (cam.goal - fly.fromD) * e + Math.sin(Math.PI * e) * fly.arc;
      if (fly.t >= 1) fly = null;
    } else { cam.target.lerp(wp, 1 - Math.exp(-dt * 10)); cam.dist += (cam.goal - cam.dist) * (1 - Math.exp(-dt * 6)); }
    camera.position.set(Math.cos(cam.pitch) * Math.sin(cam.yaw), Math.sin(cam.pitch), Math.cos(cam.pitch) * Math.cos(cam.yaw)).multiplyScalar(cam.dist).add(cam.target);
    camera.lookAt(cam.target); camera.updateMatrixWorld();
    sky2.position.copy(camera.position); sky2.updateMatrixWorld(); // stars sit at infinity: no parallax
    corona.quaternion.copy(camera.quaternion);
    const showGrid = sel && sel.kind !== 'sun', k = 1 - Math.exp(-dt * 4);
    gridO += ((showGrid ? 1 : 0) - gridO) * k; grid.material.uniforms.o.value = gridO;
    if (showGrid) { grid.scale.setScalar(sel.r * 26); grid.position.copy(wp).setY(-sel.r * 1.25); }
    composer.render();

    // overlay: labels, brackets, and where the card should sit
    const W = innerWidth, H = innerHeight, f = H / 2 / Math.tan(camera.fov * Math.PI / 360), open = 'open' in document.body.dataset;
    for (const b of B) {
      b.mesh.getWorldPosition(v); const d = v.distanceTo(camera.position); v.project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; b.sx = x; b.sy = y; b.pr = b.r * f / d;
      b.hit = v.z < 1 && (!b.parent || (sel && (sel.id === b.parent || sel.parent === b.parent))) && (b.kind !== 'asteroid' || cam.dist < SYS * 1.7);
      const vis = b.hit && b !== sel && !(open && x < 480) && !(y < 56 && x > W - 420);
      b.el.style.display = vis ? '' : 'none';
      if (vis) b.el.style.transform = `translate(${(x + Math.max(8, b.pr + 6)).toFixed(1)}px,${y.toFixed(1)}px) translate(0,-50%)`;
    }
    for (const k of SK) {
      k.m.getWorldPosition(v); v.project(camera); k.sx = (v.x + 1) / 2 * W; k.sy = (1 - v.y) / 2 * H; k.on = v.z < 1 && !open && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
      const show = (k === hov || k === act) && k.on; k.el.style.display = show ? '' : 'none';
      if (show) k.el.style.transform = `translate(${(k.sx + 10).toFixed(1)}px,${k.sy.toFixed(1)}px) translate(0,-50%)`;
    }
    for (const c of CONST) {
      v.copy(c.pos).add(camera.position); v.project(camera); const on = v.z < 1 && !open && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      c.name.style.display = on ? '' : 'none'; if (on) c.name.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px,${((1 - v.y) / 2 * H).toFixed(1)}px) translate(-50%,-50%)`;
    }
    if (sel) {
      const s = Math.max(54, sel.pr * 2.7), st = document.body.style;
      brk.style.cssText = `display:block;width:${s}px;height:${s}px;left:${sel.sx - s / 2}px;top:${sel.sy - s / 2}px`;
      st.setProperty('--cx', Math.round(Math.min(W - 344, sel.sx + s / 2 + 18)) + 'px'); st.setProperty('--cy', Math.round(Math.max(60, Math.min(H - 280, sel.sy - 40))) + 'px');
    } else brk.style.display = 'none';
  }

  return {
    select, setSkill,
    setMotion(on) { motion = on; },
    start() { if (running) return; running = true; resize(); dest(cam.target); cam.dist = cam.goal; fly = null; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}

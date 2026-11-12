// Page behaviour. Every URL already contains the whole log as HTML; this script only
// switches which entry is showing, keeps the URL in step, and adds the 3D map when asked.
type SceneBody = { id: string; url: string; title: string; label: string; kind: string; lane: string | null; parent: string | null };
type Scene = { select(id: string): void; setMotion(on: boolean): void; start(): void; stop(): void };

const doc = document, body = doc.body, base = body.dataset.base!;
const bodies: SceneBody[] = JSON.parse(doc.getElementById('scene')!.textContent!);
const byId = new Map(bodies.map((b) => [b.id, b]));
const LANES: Record<string, string> = { career: 'Career', projects: 'Projects', games: 'Games' };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => doc.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

doc.documentElement.classList.add('js');
let scene: Scene | null = null, sceneFailed = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion = (store.get('motion') ?? (reduced ? 'off' : 'on')) === 'on';

/** Show an entry. '' is the whole system. */
function show(id: string, push = true) {
  if (id && !byId.has(id)) id = '';
  const b = byId.get(id), shown = id || 'contact';
  body.dataset.sel = id;
  delete body.dataset.open;
  doc.querySelectorAll<HTMLElement>('.entry').forEach((a) => (a.hidden = a.dataset.id !== shown));
  doc.querySelectorAll<HTMLElement>('[data-match]').forEach((a) => (a.dataset.match === shown ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('logtitle').firstElementChild!.textContent = byId.get(shown)!.title;
  doc.title = b ? `${b.title} · ${body.dataset.name}` : body.dataset.home!;
  const parent = b?.parent ? byId.get(b.parent)! : null;
  $('crumb').innerHTML = `<a href="${base}" data-id="">System</a>` + (b
    ? (b.lane ? `<span> / ${LANES[b.lane]}</span>` : b.kind === 'asteroid' ? '<span> / Minor works &amp; in-progress</span>' : '') + (parent ? `<span> / <a href="${parent.url}" data-id="${parent.id}">${esc(parent.title)}</a></span>` : '') + `<span> / ${esc(b.title)}</span>`
    : '');
  if (push) history.pushState(null, '', b ? b.url : base);
  scene?.select(id);
}
const idFromUrl = () => decodeURIComponent(location.pathname.slice(base.length)).replace(/\/$/, '');

async function setView(v: '3d' | 'log', remember = true) {
  if (v === '3d' && !scene && !sceneFailed) {
    try {
      const { createScene } = await import('./scene');
      scene = createScene({ canvas: $<HTMLCanvasElement>('map'), labels: $('labels'), brk: $('brk'), bodies, motion }) as Scene;
    } catch (e) {
      console.warn('3D map unavailable, staying in the log view', e);
      sceneFailed = true; $('v3d').hidden = true;
    }
  }
  if (v === '3d' && !scene) v = 'log';
  body.dataset.view = v;
  $('v3d').setAttribute('aria-pressed', String(v === '3d'));
  $('vlog').setAttribute('aria-pressed', String(v === 'log'));
  if (remember) store.set('view', v);
  if (v === '3d') { scene!.select(body.dataset.sel!); scene!.start(); } else scene?.stop();
}

doc.addEventListener('click', (ev) => {
  const e = ev as MouseEvent, t = e.target as HTMLElement;
  const a = t.closest<HTMLAnchorElement>('a[data-id]');
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
    e.preventDefault(); show(a.dataset.id!);
    return;
  }
  if (t.closest('[data-open]')) { body.dataset.open = ''; doc.querySelector<HTMLElement>('.entry:not([hidden]) [data-close]')?.focus(); }
  else if (t.closest('[data-close]')) { delete body.dataset.open; doc.querySelector<HTMLElement>('.entry:not([hidden]) [data-open]')?.focus(); }
});
doc.addEventListener('submit', async (e) => {
  const form = (e.target as HTMLElement).closest<HTMLFormElement>('form[data-mail]');
  if (!form) return;
  e.preventDefault();
  const status = form.querySelector<HTMLElement>('[data-status]')!, f = new FormData(form), btn = form.querySelector('button')!;
  if (f.get('website')) return; // honeypot: bots fill every field
  btn.disabled = true; status.textContent = 'Sending…';
  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: form.dataset.service, template_id: form.dataset.template, user_id: form.dataset.key,
        template_params: { name: f.get('name'), email: f.get('email'), subject: f.get('subject'), message: f.get('message') } }) });
    if (!r.ok) throw new Error(await r.text());
    form.reset(); status.textContent = 'Message sent. Thank you for reaching out.';
  } catch (err) {
    console.warn('contact form', err); status.textContent = "That didn't send. Try again, or use one of the links below.";
  }
  btn.disabled = false;
});
addEventListener('popstate', () => show(idFromUrl(), false));
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || body.dataset.view !== '3d') return;
  if ('open' in body.dataset) delete body.dataset.open;
  else if (body.dataset.sel) show(byId.get(body.dataset.sel)!.parent ?? '');
});
doc.addEventListener('pick', (e) => show((e as CustomEvent<string>).detail)); // a body was clicked in the 3D map

$('v3d').onclick = () => setView('3d');
$('vlog').onclick = () => setView('log');
const motionBtn = $('motion');
motionBtn.setAttribute('aria-pressed', String(motion));
motionBtn.onclick = () => { motion = !motion; store.set('motion', motion ? 'on' : 'off'); motionBtn.setAttribute('aria-pressed', String(motion)); scene?.setMotion(motion); };

// 3D by default only where it is likely to be pleasant: a roomy screen, WebGL 2, and no reduced-motion request.
const capable = () => { try { return !!doc.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const want = store.get('view') ?? (!reduced && innerWidth >= 760 && capable() ? '3d' : 'log');
if (want === '3d') setView('3d', false);
(window as any).__ready = true;

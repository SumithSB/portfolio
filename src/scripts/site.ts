import { inView, scroll } from 'motion';
import Lenis from 'lenis';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];

/* ---------- Smooth, weighted scrolling (skipped for reduced motion) ---------- */
const lenis = reduce ? null : new Lenis({ lerp: 0.12, wheelMultiplier: 0.9, anchors: false });
if (lenis) {
  const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ---------- The walk: 3D when the device can, plain chapters when it can't ---------- */
const walk = $('.walk');
const canvas = $<HTMLCanvasElement>('#walk-canvas');
const webgl = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();

let closeReading = () => {};

const restoreStory = () => {
  if (!walk) return;
  const reading = Number(walk.dataset.chapter ?? 0);
  walk.classList.remove('is-3d', 'at-start', 'ready', 'leaving');
  walk.querySelectorAll<HTMLElement>('.chapter').forEach((el) => { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); });
  const hud = $('.hud', walk); if (hud) hud.hidden = true;
  walk.classList.remove('reading'); lenis?.start();
  walk.querySelectorAll('details').forEach((d) => { d.open = true; });
  if (scrollY > 100) walk.querySelector<HTMLElement>(`#ch-${reading}`)?.scrollIntoView();
};

if (walk && canvas && webgl && !reduce) {
  walk.classList.add('is-3d', 'at-start');
  const hud = $('.hud', walk); if (hud) hud.hidden = false;
  import('./walk/walk')
    .then(({ startWalk }) => startWalk({
      root: walk,
      canvas,
      cards: $$('.chapter', walk),
      mapButtons: $$<HTMLButtonElement>('.map button', walk),
      sound: $<HTMLButtonElement>('.sound', walk),
      progress: $('#walk-progress'),
      scrollTo: lenis ? (y) => lenis.scrollTo(y, { duration: 1.6 }) : undefined,
      onFailure: restoreStory,
    }))
    .catch(restoreStory);

  // Reading a chapter holds the walk still, so the scene can't move on to the next chapter under the words.
  const details = $$<HTMLDetailsElement>('.chapter-detail', walk);
  const reading = () => walk.classList.contains('is-3d') && walk.classList.contains('reading');
  details.forEach((d) => d.addEventListener('toggle', () => {
    if (!walk.classList.contains('is-3d')) return;
    if (d.open) details.forEach((other) => { if (other !== d) other.open = false; });
    const on = details.some((x) => x.open);
    walk.classList.toggle('reading', on);
    if (on) lenis?.stop(); else lenis?.start();
  }));
  closeReading = () => { if (reading()) details.forEach((d) => { d.open = false; }); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReading(); });
  $('.chapters', walk)?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeReading(); });
  $$('.map button', walk).forEach((b) => b.addEventListener('click', closeReading, { capture: true }));
  // Only the panel scrolls while reading; nothing else moves the page.
  const hold = (e: Event) => { if (reading() && !(e.target as Element).closest?.('.chapter.is-on article')) e.preventDefault(); };
  walk.addEventListener('wheel', hold, { passive: false });
  walk.addEventListener('touchmove', hold, { passive: false });
}

// One owner for anchor navigation; the sticky story has its own real scroll destination.
$$<HTMLAnchorElement>('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  const id = link.getAttribute('href')!.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  closeReading();
  const story = id === 'story' && walk?.classList.contains('is-3d');
  const y = story ? walk!.offsetTop + (0.35 / 6) * (walk!.offsetHeight - innerHeight) : target.getBoundingClientRect().top + scrollY - (id === 'top' ? 0 : 84);
  const focus = () => {
    const heading = story ? $('#ch-0') : target.querySelector<HTMLElement>('h2') ?? target;
    heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true });
  };
  if (lenis) lenis.scrollTo(y, { duration: 1, onComplete: focus });
  else { scrollTo({ top: y, behavior: 'instant' }); focus(); }
  history.replaceState(null, '', `#${id}`);
}));

/* ---------- Header: solid once you leave the walk ---------- */
const top = $('.top');
if (top && walk) {
  new IntersectionObserver(([e]) => top.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px', threshold: 0 }).observe(walk);
  // As the walk scrolls away, its controls fade out so they never slide up under the header.
  const leaving = () => { const b = walk.getBoundingClientRect().bottom; walk.classList.toggle("leaving", b < innerHeight - 40); };
  addEventListener('scroll', leaving, { passive: true }); leaving();
}

/* ---------- Demo video plays muted while in view ---------- */
if (!reduce) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }
  }, { threshold: 0.5 });
  $$<HTMLVideoElement>('video.autoplay').forEach((v) => io.observe(v));
}

/* ---------- Things rise in as you reach them ---------- */
if (!reduce) {
  const items = $$('[data-reveal]');
  const buckets = new Map<Element, HTMLElement[]>();
  items.forEach((el) => {
    const key = el.closest('section') ?? document.body;
    const list = buckets.get(key) ?? [];
    list.push(el);
    buckets.set(key, list);
  });
  buckets.forEach((list) => {
    list.forEach((el, idx) => {
      inView(el, () => {
        // Animate the independent translate property, leaving card tilt/lift untouched.
        el.animate([{ opacity: 0.25, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], { duration: 650, delay: Math.min(idx, 3) * 55, easing: 'cubic-bezier(.16,1,.3,1)' });
      }, { margin: '0px 0px -5% 0px' });
    });
  });
}

/* ---------- Journey spine draws itself as the track crosses the viewport ---------- */
if (!reduce) {
  $$('.track').forEach((track) => {
    const stops = $<HTMLElement>('.stops', track);
    if (!stops) return;
    const rows = $$(':scope > li', stops);
    scroll((progress: number) => {
      stops.style.setProperty('--spine-progress', progress.toFixed(4));
      rows.forEach((li, i) => li.classList.toggle('is-reached', progress >= (i + 0.35) / rows.length));
    }, { target: track, offset: ['start end', 'end start'] });
  });
}

/* ---------- Project cards pick up a soft pointer sheen ---------- */
const coarse = matchMedia('(pointer: coarse)').matches;
if (!reduce && !coarse) {
  $$<HTMLElement>('.projects .project').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${nx * 100}%`);
      card.style.setProperty('--my', `${ny * 100}%`);
      card.style.setProperty('--ry', `${(nx - 0.5) * 5}deg`);
      card.style.setProperty('--rx', `${(0.5 - ny) * 4}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });
}

/* ---------- Privacy-friendly analytics (GoatCounter: no cookies, no personal data) ---------- */
// The walk scrolls instead of changing page, so the chapters and the main links are counted as events.
// If GoatCounter is blocked or slow to load, nothing happens and nothing is shown.
declare global { interface Window { goatcounter?: { count?: (vars: { path: string; title?: string; event?: boolean }) => void } } }
const track = (name: string, retry = true) => {
  try {
    const count = window.goatcounter?.count;
    if (typeof count === 'function') count.call(window.goatcounter, { path: name, title: name, event: true });
    else if (retry) setTimeout(() => track(name, false), 1500); // its script loads async; give it a moment, once
  } catch { /* blocked or broken: stay silent */ }
};

// Each chapter, the first time it is on screen: the walk's captions switch on, or in the plain layout the chapter scrolls into view.
const seen = new Set<number>();
const chapterSeen = (i: number) => { if (!seen.has(i)) { seen.add(i); track(`chapter-${String(i + 1).padStart(2, '0')}`); } };
if (walk) {
  const cards = $$('.chapter', walk);
  const mo = new MutationObserver((records) => {
    if (!walk.classList.contains('is-3d')) return;
    for (const r of records) { const el = r.target as HTMLElement; if (el.classList.contains('is-on')) chapterSeen(cards.indexOf(el)); }
  });
  cards.forEach((c) => mo.observe(c, { attributes: true, attributeFilter: ['class'] }));
  const io = new IntersectionObserver((entries) => {
    if (walk.classList.contains('is-3d')) return;
    for (const e of entries) if (e.isIntersecting) chapterSeen(cards.indexOf(e.target as HTMLElement));
  }, { threshold: 0.5 });
  cards.forEach((c) => io.observe(c));
}

// The few links worth knowing about.
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a');
  if (!a) return;
  const href = a.getAttribute('href') ?? '';
  if (a.classList.contains('skip-walk')) track('click-skip-to-work');
  else if (/\.pdf($|\?)/i.test(href)) track('click-cv');
  else if (/^https:\/\/github\.com\/SumithSB\/?$/i.test(href)) track('click-github');
  else if (/^https:\/\/(www\.)?linkedin\.com\//i.test(href)) track('click-linkedin');
  else if (href.startsWith('mailto:')) track('click-email');
});

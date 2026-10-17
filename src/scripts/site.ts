import { animate, inView, scroll } from 'motion';
import Lenis from 'lenis';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];

/* ---------- Smooth, weighted scrolling (skipped for reduced motion) ---------- */
const lenis = reduce ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: -72 } });
if (lenis) {
  const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ---------- The walk: 3D when the device can, plain chapters when it can't ---------- */
const walk = $('.walk');
const canvas = $<HTMLCanvasElement>('#walk-canvas');
const webgl = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();

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
    }))
    .catch(() => { walk.classList.remove('is-3d', 'at-start'); if (hud) hud.hidden = true; });
}

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
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    const key = el.closest('section') ?? document.body;
    const list = buckets.get(key) ?? [];
    list.push(el);
    buckets.set(key, list);
  });
  buckets.forEach((list) => {
    list.forEach((el, idx) => {
      inView(el, () => {
        animate(el, { opacity: 1, transform: 'translateY(0px)' }, { duration: 0.7, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] });
      }, { margin: '0px 0px -12% 0px' });
    });
  });
}

/* ---------- Journey spine draws itself as the track crosses the viewport ---------- */
if (!reduce) {
  $$('.track').forEach((track) => {
    const stops = $<HTMLElement>('.stops', track);
    if (!stops) return;
    const rows = $$('li', stops);
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

import { animate, inView } from 'motion';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];

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
    }))
    .catch(() => { walk.classList.remove('is-3d', 'at-start'); if (hud) hud.hidden = true; });
}

/* ---------- Header: solid once you leave the walk ---------- */
const top = $('.top');
if (top && walk) {
  const solid = () => top.classList.toggle('solid', walk.getBoundingClientRect().bottom < 80);
  addEventListener('scroll', solid, { passive: true }); solid();
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
  items.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; });
  inView(items, (el) => {
    animate(el, { opacity: 1, transform: 'translateY(0px)' }, { type: 'spring', stiffness: 120, damping: 22 });
  }, { margin: '0px 0px -12% 0px' });
}

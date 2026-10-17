import { animate, scroll, inView, stagger } from 'motion';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll<T>(sel)];
const outEase = [0.22, 1, 0.36, 1] as const;
const expo = [0.16, 1, 0.3, 1] as const;

/* ---------- Works with or without motion ---------- */

// Copy email.
const copyBtn = $<HTMLButtonElement>('#copy-email');
const copyStatus = $('#copy-status');
if (copyBtn && copyStatus && navigator.clipboard) {
  copyBtn.hidden = false;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('sumithsbhandari@gmail.com');
      copyStatus.textContent = 'Copied';
    } catch {
      copyStatus.textContent = 'Copy failed. Select the address instead.';
    }
    setTimeout(() => { copyStatus.textContent = ''; }, 2500);
  });
}

// Demo video plays muted while in view, unless reduced motion is on.
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }
  }, { threshold: 0.5 });
  $$<HTMLVideoElement>('video.autoplay').forEach((v) => io.observe(v));
}

// Demo / How it works views on each project sheet.
$$('.sheet').forEach((sheet) => {
  const tabs = $('.views', sheet);
  if (!tabs) return;
  tabs.hidden = false;
  const buttons = $$<HTMLButtonElement>('[data-view]', tabs);
  const panels = $$('[data-panel]', sheet);
  const show = (i: number) => {
    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    panels.forEach((p, k) => { p.hidden = k !== i; });
    const v = $<HTMLVideoElement>('video', sheet);
    if (v && i !== 0) v.pause();
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => show(i)));
  show(0);
});

// Request tracing: a marker travels the wire and lights each part it reaches.
$$('[data-trace]').forEach((tr) => {
  const hops: string[] = JSON.parse(tr.dataset.hops || '[]');
  const btn = $<HTMLButtonElement>('[data-send]', tr);
  const status = $('.status', tr);
  const wire = $<SVGPathElement>('path.w', tr);
  const pk = $<SVGRectElement>('.pk', tr);
  const nodes = $$<SVGGElement>('.nd', tr);
  if (!btn || !status || !wire || !pk) return;
  btn.hidden = false;
  status.textContent = 'Press the button to trace a request.';
  let run: { stop: () => void } | null = null;
  btn.addEventListener('click', () => {
    const L = wire.getTotalLength();
    const fr: number[] = [];
    let k = 0;
    for (let l = 0; l <= L && k < nodes.length; l += 2) {
      const p = wire.getPointAtLength(l);
      if (Math.abs(p.x - +nodes[k].dataset.x!) < 2 && Math.abs(p.y - +nodes[k].dataset.y!) < 2) { fr.push(l / L); k++; }
    }
    while (fr.length < nodes.length) fr.push(1);
    nodes.forEach((n) => n.classList.remove('lit'));
    run?.stop();
    pk.setAttribute('opacity', '1');
    const place = (t: number) => {
      const p = wire.getPointAtLength(t * L);
      pk.setAttribute('transform', `translate(${p.x} ${p.y})`);
      let reached = 0;
      for (let i = 0; i < fr.length; i++) if (t >= fr[i] - 0.001) { nodes[i].classList.add('lit'); reached = i; }
      status.textContent = t >= 1 ? 'Delivered: ' + hops.join(' → ') : 'At ' + hops[reached] + '…';
    };
    if (reduce) { place(1); return; }
    run = animate(0, 1, { duration: 0.65 * hops.length, ease: 'easeInOut', onUpdate: place });
  });
});

// Case studies open in a dialog when the sheets scroll sideways.
const dialog = $<HTMLDialogElement>('#case-dialog');
$$<HTMLButtonElement>('.case-open').forEach((b) => {
  b.addEventListener('click', () => {
    const sheet = b.closest('.sheet')!;
    $('#case-dialog-h')!.textContent = $('h3', sheet)!.textContent;
    $('#case-content')!.innerHTML = $('.case', sheet)!.innerHTML;
    dialog?.showModal();
  });
});
$('#case-close')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

// About: the step in the middle of the screen lights its layer.
const pinSlabs = $$('#pin-stack .slab');
const steps = $$('.step');
const setLayer = (i: number) => {
  steps.forEach((s, k) => s.classList.toggle('on', k === i));
  pinSlabs.forEach((s, k) => s.classList.toggle('on', k === i));
};
setLayer(0);
const stepIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setLayer(+(e.target as HTMLElement).dataset.i!); }), { rootMargin: '-45% 0px -45% 0px' });
steps.forEach((s) => stepIo.observe(s));

// Hero flow window: the active card walks a route, then the other branch.
const flowNodes = $$('.fnode');
const routes = [[0, 1, 3], [0, 2, 3]];
let routeTimer = 0;
const startRoutes = () => {
  if (routeTimer || reduce) return;
  let r = 0, s = 0;
  routeTimer = window.setInterval(() => {
    flowNodes.forEach((n) => n.classList.remove('active'));
    flowNodes[routes[r][s]]?.classList.add('active');
    s++;
    if (s >= routes[r].length) { s = 0; r = (r + 1) % routes.length; }
  }, 900);
};
const stopRoutes = () => { clearInterval(routeTimer); routeTimer = 0; };

/* ---------- Motion layer ---------- */

if (reduce) {
  root.classList.remove('intro');
  flowNodes[3]?.classList.add('active');
} else {
  const once = (el: Element | null, fn: () => void, amount = 0.25) => {
    if (!el) return;
    const stop = inView(el, () => { fn(); stop(); }, { amount });
  };
  const hide = (els: Element[] | NodeListOf<Element>, y = 32) => animate(els as Element[], { opacity: 0, y }, { duration: 0 });
  const rise = (els: Element[], d = 0) => animate(els, { opacity: 1, y: 0 }, { duration: 0.9, ease: outEase, delay: stagger(0.08, { startDelay: d }) });

  // 1. Intro: the sheet plots itself, lifts away, the headline rises line by line.
  const plot = $('#plot')!;
  const lines = $$<SVGPathElement>('#plot .p');
  lines.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = String(L); p.style.strokeDashoffset = String(L); });
  const heroLines = $$('#hero-title .ln > span');
  const heroRise = $$('.hero [data-rise]');
  const flowStage = $('#flow-stage');
  animate(heroLines, { y: '110%' }, { duration: 0 });
  hide(heroRise, 24);
  if (flowStage) animate(flowStage, { opacity: 0 }, { duration: 0 });
  const intro = animate([
    [lines, { strokeDashoffset: 0 }, { duration: 0.6, ease: 'easeInOut', delay: stagger(0.1) }],
    [plot, { y: '-100%' }, { duration: 0.8, ease: [0.76, 0, 0.24, 1], at: '+0.1' }],
    [heroLines, { y: '0%' }, { duration: 1.1, ease: expo, delay: stagger(0.1), at: '-0.35' }],
    [heroRise, { opacity: 1, y: 0 }, { duration: 0.8, ease: outEase, delay: stagger(0.08), at: '-0.7' }],
    ...(flowStage ? [[flowStage, { opacity: 1 }, { duration: 1, ease: outEase, at: '-0.9' }] as const] : []),
  ] as never);
  const endIntro = () => root.classList.remove('intro');
  intro.finished.then(endIntro);
  plot.addEventListener('click', () => { intro.complete(); endIntro(); });


  // 2. Hero flow window follows the cursor; idle drift after 90 frames.
  const rig = $('#rig');
  const glare = $('#glare');
  const hero = $('#top');
  if (rig && hero && flowStage) {
    const layers = $$('.layer', rig);
    const st = layers.map(() => ({ x: 0, y: 0 }));
    let tx = 0, ty = 0, cx = 0, cy = 0, idle = 0, running = false, raf = 0;
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const b = flowStage.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
      idle = 0;
    });
    const frame = (t: number) => {
      idle++;
      if (idle > 90 || !finePointer) { tx = Math.sin(t / 2800) * 0.3; ty = Math.cos(t / 3300) * 0.2; }
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      const sp = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      rig.style.transform = `rotateY(${-16 * (1 - sp * 0.5) + cx * 13}deg) rotateX(${7 - cy * 9}deg) translateY(${sp * -40}px)`;
      for (let i = 0; i < layers.length; i++) {
        const k = +layers[i].dataset.depth! / 100;
        const e = 0.06 + i * 0.025;
        st[i].x += (cx - st[i].x) * e; st[i].y += (cy - st[i].y) * e;
        layers[i].style.transform = `translate3d(${st[i].x * k * 40}px, ${st[i].y * k * 30}px, ${+layers[i].dataset.depth!}px)`;
      }
      for (let i = 0; i < flowNodes.length; i++) {
        flowNodes[i].style.setProperty('--px', `${cx * (16 + i * 4)}px`);
        flowNodes[i].style.setProperty('--py', `${cy * (12 + i * 3)}px`);
      }
      if (glare) { glare.style.setProperty('--gx', `${50 + cx * 40}%`); glare.style.setProperty('--gy', `${40 + cy * 40}%`); }
      raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); startRoutes(); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); stopRoutes(); }
    }).observe(hero);
    if (finePointer) {
      const mag = $('#magnet')!;
      mag.addEventListener('pointermove', (e) => {
        const b = mag.getBoundingClientRect();
        animate(mag, { x: (e.clientX - b.left - b.width / 2) * 0.3, y: (e.clientY - b.top - b.height / 2) * 0.4 }, { type: 'spring', stiffness: 300, damping: 20 });
      });
      mag.addEventListener('pointerleave', () => animate(mag, { x: 0, y: 0 }, { type: 'spring', stiffness: 300, damping: 18 }));
    }
  }

  // 3. Section headings and blocks rise once as they arrive.
  $$('.sec-head').forEach((h) => { const kids = [...h.children]; hide(kids, 40); once(h, () => rise(kids)); });
  $$('[data-in]').forEach((el, i) => { hide([el]); once(el, () => rise([el], (i % 3) * 0.06)); });

  // 4. Projects: sideways on wide screens; each drawing plots itself on arrival.
  const track = $('#track')!;
  const hscroll = $('#hscroll')!;
  const sheets = $$('.sheet', track);
  const drawn = new Set<Element>();
  const drawIn = (sheet: Element) => {
    if (drawn.has(sheet)) return;
    drawn.add(sheet);
    animate($$('.tab', sheet), { y: ['100%', '0%'] }, { duration: 0.6, ease: outEase });
    $$<SVGPathElement>('path.w', sheet).forEach((w) => {
      const L = w.getTotalLength();
      w.style.strokeDasharray = String(L);
      animate(w, { strokeDashoffset: [L, 0] }, { duration: 1.2, ease: 'easeInOut' });
    });
    const nds = $$<SVGGElement>('.nd', sheet);
    nds.forEach((g) => { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center'; });
    animate(nds, { opacity: [0, 1], scale: [0.6, 1] }, { type: 'spring', bounce: 0.35, visualDuration: 0.45, delay: stagger(0.12, { startDelay: 0.3 }) });
  };
  if (window.innerWidth >= 1024) {
    root.classList.add('h-mode');
    const setup = () => {
      const dist = track.scrollWidth - window.innerWidth;
      hscroll.style.height = `${dist + window.innerHeight}px`;
      return dist;
    };
    const dist = setup();
    scroll(animate(track, { x: [0, -dist] }, { ease: 'linear' }), { target: hscroll, offset: ['start start', 'end end'] });
    const bar = $('#hbar');
    if (bar) scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }), { target: hscroll, offset: ['start start', 'end end'] });
    once(hscroll, () => drawIn(sheets[0]), 0.3);
    scroll((p: number) => { for (let k = 1; k < sheets.length; k++) if (p > (k - 0.45) / (sheets.length - 1)) drawIn(sheets[k]); }, { target: hscroll, offset: ['start start', 'end end'] });
  } else {
    sheets.forEach((s) => once(s, () => drawIn(s), 0.3));
  }

  // 5. Experience: the record unrolls, then each entry prints in.
  const record = $('#record');
  const jobs = $$('.job');
  if (record) {
    hide(jobs, 18);
    animate(record, { clipPath: 'inset(0 0 100% 0)' }, { duration: 0 });
    // Watch the section: a fully clipped element never counts as in view.
    once($('#experience'), () => {
      animate(record, { clipPath: 'inset(0 0 0% 0)' }, { duration: 1.1, ease: [0.76, 0, 0.24, 1] });
      animate(jobs, { opacity: 1, y: 0 }, { duration: 0.6, ease: outEase, delay: stagger(0.12, { startDelay: 0.5 }) });
    }, 0.15);
  }

  // 6. Reveal line: words light up in order as you scroll.
  const line = $('#reveal-line');
  const reveal = $('#reveal');
  if (line && reveal) {
    const words = (line.textContent || '').trim().split(/\s+/);
    line.innerHTML = words.map((w) => `<span class="wd">${w}</span>`).join(' ');
    const spans = $$('.wd', line);
    scroll((p: number) => {
      const lit = Math.floor(p * spans.length * 1.15);
      for (let i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < lit);
    }, { target: reveal, offset: ['start start', 'end end'] });
  }

  // 7. About: the stack spreads as you read down the layers.
  const pinStack = $('#pin-stack');
  const about = $('#about');
  if (pinStack && about) scroll(animate(pinStack, { '--gap': ['18px', '58px'] } as never, { ease: 'linear' }), { target: about, offset: ['start center', 'end end'] });

  // 8. Contact: the address rises out of its mask; the plan builds, amber block last.
  const mailLines = $$('#mail .ln > span');
  const blocks = $$('#plan div');
  animate(mailLines, { y: '110%' }, { duration: 0 });
  animate(blocks, { scaleY: 0 }, { duration: 0 });
  once($('#mail'), () => animate(mailLines, { y: '0%' }, { duration: 1.1, ease: expo, delay: stagger(0.12) }), 0.5);
  once($('#plan'), () => animate(blocks, { scaleY: 1 }, { type: 'spring', bounce: 0.2, visualDuration: 0.8, delay: stagger(0.12) }), 0.3);
}

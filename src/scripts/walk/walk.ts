import * as THREE from 'three';
import { buildWorld, SPAN, CHAPTERS, END_X } from './scenes';
import { makePerson, pose, setPersonTransition, type Person, type PoseState } from './person';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAmbience } from './audio';
import { createPost, type Quality } from './post';
import { dressWorld, weather, createBackdrops } from './dressing';
import type { Sculpted } from './figure';
import { LOOKS } from './looks';
import { advanceRoot } from './locomotion';

// Light across one day: dawn, morning, noon, golden hour, dusk in the rain, night.
interface Key { top: number; bottom: number; fog: number; sun: number; sunI: number; sunY: number; hemi: number; night: number; rain: number; exp: number }
const KEYS: Key[] = [
  { top: 0x8FB3C9, bottom: 0xF6CBA4, fog: 0xF3CBA6, sun: 0xFFC98A, sunI: 3.0, sunY: 5, hemi: 1.35, night: 0, rain: 0, exp: 1.05 },
  { top: 0x9DBFD6, bottom: 0xE6E2D6, fog: 0xDCDAD2, sun: 0xFFF0D8, sunI: 2.5, sunY: 5.5, hemi: 1.25, night: 0, rain: 0, exp: 1.0 },
  { top: 0x5E9BCF, bottom: 0xD8E7EF, fog: 0xD5E2E8, sun: 0xFFFFFF, sunI: 3.2, sunY: 6.5, hemi: 1.4, night: 0, rain: 0, exp: 1.0 },
  { top: 0x6C7FAA, bottom: 0xF6B46E, fog: 0xEFB27A, sun: 0xFFA95A, sunI: 2.9, sunY: 2.6, hemi: 1.1, night: 0.15, rain: 0, exp: 1.05 },
  { top: 0x2B3250, bottom: 0x857A92, fog: 0x6C6A80, sun: 0xA9B4D6, sunI: 0.9, sunY: 14, hemi: 1.0, night: 0.6, rain: 1, exp: 1.1 },
  { top: 0x060A16, bottom: 0x1C2442, fog: 0x141A30, sun: 0x8EA2D6, sunI: 0.6, sunY: 20, hemi: 0.7, night: 1, rain: 0, exp: 1.2 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const setStyle = (element: HTMLElement, property: string, value: string) => {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
};
const TIME_LABELS = ['Dawn', 'Morning', 'Noon', 'Golden hour', 'After the rain', 'Night'];
const PLACE_LABELS = ['Karnataka, India', 'Lockdown, 2020', 'The first startup', 'Bengaluru, India', 'Leicester, UK', 'London, UK'];

// Each chapter is a short walk through the heart of its scene: [start, length] along the road from the chapter's edge.
// He moves only when you scroll: his place on the road is tied to the scroll position. Between chapters he keeps
// walking while the old place dissolves into the next one (and he grows up a little mid-stride). It all follows
// the scroll, so it plays backwards too. A big jump (the chapter map) is a cut rather than a sprint.
const RANGES: Array<[number, number]> = [[14, 9], [20, 9], [16, 9], [26, 9], [22, 9], [END_X - 5 * SPAN - 9, 9]];
const CUT_GAP = 6;
const TZ = 0.14; // the share of a chapter's scroll on each side of a border spent dissolving
const K = 9 / (1 - 2 * TZ); // metres walked per chapter of scroll
/** Where on the road he is in chapter `c`, at `g` chapters of scroll; outside the chapter's stretch it runs on. */
const roadX = (c: number, g: number) => c * SPAN + RANGES[c][0] + (g - c - TZ) * K;
/** Scroll progress (0..1) to metres walked. He stops at the end of the last chapter and holds there. */
const targetWalk = (p: number) => Math.min(p * CHAPTERS, CHAPTERS - TZ) * K;

export interface WalkUI {
  root: HTMLElement;          // the tall scroll section
  canvas: HTMLCanvasElement;
  cards: HTMLElement[];       // one per chapter
  mapButtons: HTMLButtonElement[];
  sound: HTMLButtonElement | null;
  progress: HTMLElement | null;
  onFailure?: () => void;
  scrollTo?: (top: number) => void; // smooth scroller, when the page has one
}

export function startWalk(ui: WalkUI) {
  let stopped = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let worker: Worker | undefined;
  let loadTimer: ReturnType<typeof setTimeout>;
  let amb: ReturnType<typeof createAmbience> | undefined;
  let releaseResources = () => {};
  const fail = () => {
    if (stopped) return;
    stopped = true; worker?.terminate(); clearTimeout(loadTimer); amb?.stop();
    releaseResources(); r.dispose(); ui.onFailure?.();
  };

  const r = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: !coarse, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.25 : 1.5));
  ui.canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); fail(); }, { once: true });
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xF3CBA6, 16, 75);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 260);

  // Sky: a gradient dome with a glowing sun and slow drifting clouds. It follows the camera.
  const skyU = {
    top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0.8, 0.2, -0.5).normalize() }, sunCol: { value: new THREE.Color() },
    time: { value: 0 }, night: { value: 0 }, cloud: { value: 0.5 },
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 top, bottom, sunDir, sunCol; uniform float time, night, cloud; varying vec3 vP;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vP);
        float h = clamp(d.y * 1.6 + 0.08, 0.0, 1.0);
        vec3 col = mix(bottom, top, pow(h, 0.8));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += sunCol * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.5) * (1.0 - night * 0.7);
        col += sunCol * smoothstep(0.9993, 0.9997, s) * (1.0 - night) * 1.6;
        // clouds on a plane above the street, thinning toward the horizon
        if (d.y > 0.0) {
          vec2 uv = d.xz / (d.y + 0.12) * 1.4 + vec2(time * 0.012, 0.0);
          float c = smoothstep(0.52 - cloud * 0.18, 0.86, fbm(uv));
          c *= smoothstep(0.0, 0.18, d.y);
          vec3 cc = mix(mix(bottom, vec3(1.0), 0.55), sunCol, pow(s, 4.0) * 0.6);
          cc = mix(cc, top * 1.4, night);
          col = mix(col, cc, c * 0.55);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  sky.renderOrder = -1; scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xFFE2C2, 0x5A4636, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFC98A, 3); sun.castShadow = true;
  const sm = coarse ? 1024 : 1536; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -6, far: 90 }); sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  // A warm light that stays with him, so he is never lost in the dark chapters.
  const fill = new THREE.PointLight(0xFFD9A8, 0, 9, 2); scene.add(fill);

  // Soft studio reflections so glass, wet roads and metal pick up light.
  const pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // A single art-directed sky and studio environment keep every chapter's light coherent.
  const world = buildWorld(scene);
  dressWorld(scene, world.nightMats); // rows of buildings, trees and road markings out to the horizon
  weather(scene); // grime, colour variation and contact darkening on every surface built so far
  const assetBase = (document.querySelector('link[rel=icon]') as HTMLLinkElement | null)?.href.replace(/favicon\.svg.*$/, '') ?? './';
  const backdrops = createBackdrops(scene, assetBase, RANGES.map(([rs0, rl0], i) => i * SPAN + rs0 + rl0 / 2));

  let ratio = Math.min(devicePixelRatio, coarse ? 1.25 : 1.5);
  // ?quality=0|1|2 pins the quality level, for checking how the walk looks on any device.
  const pinned = new URLSearchParams(location.search).get('quality');
  const post = createPost(r, scene, cam, (pinned !== null ? clamp(Number(pinned) || 0, 0, 2) : coarse ? 0 : 1) as Quality);
  releaseResources = () => {
    post.dispose();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => materials.add(m));
    });
    geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose());
    scene.environment?.dispose();
  };
  // Watch the frame rate and step quality down if the device struggles. Never steps back up, so it can't flicker.
  let slowFrames = 0, sampled = 0;
  const adapt = (dt: number) => {
    // Judge in short windows by majority, so one hitch never counts but a slow device steps down within a second or two.
    sampled++; if (dt > 1 / 40) slowFrames++;
    if (sampled < 12) return;
    if (slowFrames > 8) {
      if (post.quality > 0) post.setQuality((post.quality - 1) as Quality);
      else if (ratio > 1) { ratio = 1; r.setPixelRatio(1); lastW = 0; }
    }
    sampled = 0; slowFrames = 0;
  };

  // Six versions of him, one per age. Each is sculpted in a background worker, the current chapter's first.
  const people: Array<Person | undefined> = new Array(CHAPTERS);
  let loopStarted = false;
  const arrive = (stage: number, data: Sculpted) => {
    if (stopped) return;
    const p = makePerson(stage, data); p.visible = false; scene.add(p); people[stage] = p;
    if (stage === first) {
      clearTimeout(loadTimer);
      if (!loopStarted) { loopStarted = true; requestAnimationFrame(frame); }
    }
  };
  const r0 = ui.root.getBoundingClientRect();
  const first = Math.min(CHAPTERS - 1, Math.floor(clamp(-r0.top / Math.max(1, r0.height - innerHeight)) * CHAPTERS));
  backdrops.start(first);
  const order = [first, ...Array.from({ length: CHAPTERS }, (_, i) => i).filter((i) => i !== first)];
  loadTimer = setTimeout(fail, 12000);
  try {
    worker = new Worker(new URL('./figure.worker.ts', import.meta.url), { type: 'module' });
    let arrived = 0;
    worker.onerror = (event) => { event.preventDefault(); fail(); };
    worker.onmessageerror = fail;
    worker.onmessage = (e: MessageEvent<{ stage: number; out: Sculpted }>) => {
      try { arrive(e.data.stage, e.data.out); } catch { fail(); return; }
      if (++arrived === CHAPTERS) worker?.terminate();
    };
    order.forEach((i) => worker!.postMessage(i));
  } catch { fail(); }

  const tmp = { a: new THREE.Color(), b: new THREE.Color() };
  const mixCol = (out: THREE.Color, a: number, b: number, t: number) => out.copy(tmp.a.set(a)).lerp(tmp.b.set(b), t);

  /* ---------- input ---------- */
  let pointerX = 0.5, pointerY = 0.5;
  addEventListener('pointermove', (e) => { pointerX = e.clientX / innerWidth; pointerY = e.clientY / innerHeight; }, { passive: true });

  const progressAt = () => {
    const rect = ui.root.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - innerHeight));
  };
  const scrollToChapter = (i: number) => {
    const top = ui.root.offsetTop + ((i + 0.35) / CHAPTERS) * (ui.root.offsetHeight - innerHeight);
    if (ui.scrollTo && !reduce) ui.scrollTo(top); else scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };
  ui.mapButtons.forEach((b, i) => b.addEventListener('click', () => {
    scrollToChapter(i);
    let attempts = 0;
    const focusCard = () => {
      if (stopped || attempts++ > 30) return;
      if (ui.cards[i].classList.contains('is-on')) ui.cards[i].querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      else setTimeout(focusCard, 100);
    };
    setTimeout(focusCard, 1700);
  }));

  amb = createAmbience();
  document.addEventListener('visibilitychange', () => { if (document.hidden) amb?.setMix(-1); });
  ui.sound?.addEventListener('click', () => {
    const on = ui.sound!.getAttribute('aria-pressed') !== 'true';
    ui.sound!.setAttribute('aria-pressed', String(on));
    ui.sound!.querySelector('span')!.textContent = on ? 'Sound on' : 'Sound off';
    if (on) amb!.start(); else amb!.stop();
  });

  /* ---------- size ---------- */
  let lastW = 0, lastH = 0;
  const fit = () => {
    const w = ui.canvas.clientWidth, h = ui.canvas.clientHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    r.setPixelRatio(ratio); r.setSize(w, h, false); post.setSize(w, h, ratio);
    cam.aspect = w / h; cam.fov = cam.aspect < 0.8 ? 42 : 38; cam.updateProjectionMatrix();
  };

  /* ---------- the loop ---------- */
  // `w` is how far he has walked, in metres along one long road that runs through every chapter; it trails the
  // scroll at a walking pace. `camW` trails `w` a little, so the camera follows him like an operator would.
  let w = targetWalk(progressAt()), prevW = w, camW = w, phase = 0, stillFor = 0, waved = false, waveT = 0, endT = 0;
  let cutT = -1, fade = 0, jumped = false;
  let smoothPtrX = 0, smoothPtrY = 0;
  let portraitShift = progressAt() < 0.012 ? -0.21 : 0.17;
  let visible = true, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) amb!.setMix(-1); }).observe(ui.root);
  const phoneAt = new THREE.Vector3();
  const ps: PoseState = { phase: 0, moving: 0, mode: 'walk', t: 0, time: 0, look: 0, dt: 0, signedSpeed: 0, dx: 0 };

  // When nobody has scrolled or moved the pointer for a few seconds, the world keeps breathing at a third of
  // the frame rate: the ambient life still moves, and phones keep their battery.
  let lastActive = performance.now(), idleTick = 0;
  const wake = () => { lastActive = performance.now(); };
  addEventListener('scroll', wake, { passive: true });
  addEventListener('pointermove', wake, { passive: true });

  // Light one chapter's place for where he stands in it. The light drifts a little as he walks through.
  const light = (c: number, x: number, t: number) => {
    const [rs, rl] = RANGES[c];
    const f = clamp(c - 0.12 + clamp((x - c * SPAN - rs) / rl) * 0.3, 0, CHAPTERS - 1);
    const k0 = Math.floor(f), k1 = Math.min(CHAPTERS - 1, k0 + 1), kt = smooth(f - k0);
    const A = KEYS[k0], B = KEYS[k1];
    mixCol(skyU.top.value, A.top, B.top, kt); mixCol(skyU.bottom.value, A.bottom, B.bottom, kt);
    mixCol((scene.fog as THREE.Fog).color, A.fog, B.fog, kt);
    mixCol(sun.color, A.sun, B.sun, kt); skyU.sunCol.value.copy(sun.color);
    sun.intensity = lerp(A.sunI, B.sunI, kt); hemi.intensity = lerp(A.hemi, B.hemi, kt);
    const exp = lerp(A.exp, B.exp, kt); r.toneMappingExposure = exp;
    const night = lerp(A.night, B.night, kt), rain = lerp(A.rain, B.rain, kt);
    skyU.time.value = t; skyU.night.value = night; skyU.cloud.value = 0.35 + rain * 0.6;
    scene.environmentIntensity = lerp(0.4, 0.25, night);
    fill.intensity = 1.4 + night * 7; fill.position.set(x + 1.6, 2.6, 2.6);
    world.nightMats.forEach((m) => { m.emissiveIntensity = 0.06 + night * 0.55; });
    (world.stars.material as THREE.PointsMaterial).opacity = clamp((night - 0.55) * 2.2);
    (world.rain.material as THREE.LineBasicMaterial).opacity = rain * 0.75;
    world.rain.position.x = x;
    hemi.groundColor.setRGB(lerp(0.35, 0.08, night), lerp(0.27, 0.09, night), lerp(0.21, 0.16, night));
    const sunY = lerp(A.sunY, B.sunY, kt);
    skyU.sunDir.value.set(30, sunY, -18).normalize();
    sun.position.set(x + 30, sunY, -18); sun.target.position.set(x + 4, 0, 0);
    return { f, exp, night, warmth: clamp(1 - Math.abs(f - 3) / 1.5) };
  };

  // Frame one chapter's shot. Through each chapter the camera slowly swings from a three-quarter view of him
  // walking towards us round to his side, and eases in a little, so the place opens up in depth as he goes.
  const frameShot = (c: number, t: number, H = LOOKS[c].H) => {
    const narrow = cam.aspect < 0.8;
    const xc = roadX(c, camW / K), u = clamp(camW / K - c, -0.3, 1.3);
    const still = reduce || coarse;
    const px = still ? 0 : smoothPtrX * 0.09, py = still ? 0 : smoothPtrY * 0.045;
    // a hand-held drift, far too small to notice on its own but it stops the frame feeling locked off
    const hx = reduce ? 0 : (Math.sin(t * 0.61) + Math.sin(t * 1.07 + 1.3)) * 0.012;
    const hy = reduce ? 0 : (Math.sin(t * 0.83 + 2.1) + Math.sin(t * 1.41)) * 0.008;
    const lead = narrow ? 0.75 : 2.1 - 1.3 * u;
    const dist = H * (narrow ? 6.2 : 6.4) * (1.06 - 0.1 * u);
    cam.position.set(xc + lead + px + hx, H * 0.95 + py + hy, dist);
    cam.lookAt(xc - (narrow ? 0 : 1.35), H * 0.78, 0);
    cam.rotation.z += reduce ? 0 : Math.sin(t * 0.37) * 0.0025;
    sky.position.copy(cam.position);
    backdrops.update(c, cam.position.y);
  };

  const frame = (now: number) => {
    if (stopped) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    if (now - lastActive > 4500 && cutT < 0 && (endT === 0 || endT > 4) && ++idleTick % 3 !== 0) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const t = now / 1000;
    fit();

    const prog = progressAt();
    const target = targetWalk(prog);
    if (reduce) { w = target; camW = w; }
    else if (cutT >= 0) {
      // A cut: dip to black, move him, come back up.
      cutT += dt;
      if (cutT >= 0.22 && !jumped) { w = targetWalk(progressAt()); prevW = w; camW = w; jumped = true; }
      fade = cutT < 0.22 ? cutT / 0.22 : Math.max(0, 1 - (cutT - 0.22) / 0.3);
      if (cutT > 0.52) { cutT = -1; fade = 0; }
    } else if (Math.abs(target - w) > CUT_GAP) { cutT = 0; jumped = false; }
    else w = advanceRoot(w, target, dt);
    camW += (w - camW) * (1 - Math.exp(-dt * 3.5));
    if (!reduce && pinned === null) adapt(dt);
    const dx = w - prevW; prevW = w;
    const signedSpeed = cutT >= 0 ? 0 : dx / Math.max(dt, 1e-3);
    const speed = Math.abs(signedSpeed);
    phase += dx * 4.2;
    const ptrBlend = 1 - Math.exp(-dt * 4);
    smoothPtrX += ((pointerX * 2 - 1) - smoothPtrX) * ptrBlend;
    smoothPtrY += ((pointerY * 2 - 1) - smoothPtrY) * ptrBlend;

    // Which places are on screen: one, or two while one dissolves into the next.
    const g = w / K;
    const b = Math.round(g);
    const crossing = b > 0 && b < CHAPTERS && Math.abs(g - b) < TZ;
    const mix = crossing ? smooth((g - b + TZ) / (2 * TZ)) : 1;
    const from = crossing ? b - 1 : Math.min(CHAPTERS - 1, Math.max(0, Math.floor(g)));
    const to = crossing ? b : from;
    const ch = mix < 0.5 ? from : to; // the chapter the words and labels belong to
    const xFrom = roadX(from, g), xTo = roadX(to, g), x = ch === from ? xFrom : xTo;

    // The words fade with the shots: out just before the dissolve, in just after it.
    if (ui.root.dataset.chapter !== String(ch)) ui.root.dataset.chapter = String(ch);
    const atStart = prog < 0.012;
    ui.root.classList.toggle('at-start', atStart);
    if (prog > 0.95) ui.root.dataset.walkEnd = 'true';
    else delete ui.root.dataset.walkEnd;
    ui.cards.forEach((c, i) => {
      const u = g - i;
      const vin = i === 0 ? 1 : smooth(clamp((u - 0.05) / 0.1));
      const vout = i === CHAPTERS - 1 ? 1 : smooth(clamp((0.95 - u) / 0.1));
      const vis = atStart ? 0 : Math.min(vin, vout);
      const on = vis > 0.04;
      if (c.classList.contains('is-on') !== on) c.classList.toggle('is-on', on);
      c.toggleAttribute('inert', !on);
      if (c.getAttribute('aria-hidden') !== String(!on)) c.setAttribute('aria-hidden', String(!on));
      setStyle(c, '--card-vis', vis.toFixed(3));
      if (on) setStyle(c, '--card-p', clamp(u).toFixed(3));
    });
    const pc = Math.min(CHAPTERS - 1, Math.floor(prog * CHAPTERS)), pu = clamp(prog * CHAPTERS - pc);
    ui.mapButtons.forEach((btn, i) => {
      setStyle(btn, '--ch-fill', (i < pc ? 1 : i > pc ? 0 : pu).toFixed(3));
      if (i === ch && !atStart) { if (!btn.hasAttribute('aria-current')) btn.setAttribute('aria-current', 'step'); }
      else if (btn.hasAttribute('aria-current')) btn.removeAttribute('aria-current');
    });
    if (ui.progress) ui.progress.style.transform = `scaleX(${prog.toFixed(4)})`;

    // Him: walking while you scroll, turning to you when you stop. The version of him in each shot walks
    // in step, so he grows up mid-stride as one place becomes the next.
    const moving = clamp(speed * 0.6);
    stillFor = moving > 0.05 ? 0 : stillFor + dt;
    if (moving > 0.05) waved = false;
    const atEnd = x > END_X - 2.5 && ch === CHAPTERS - 1;
    endT = atEnd ? endT + dt : 0;

    let mode: PoseState['mode'] = 'walk';
    if (atEnd) mode = 'phone';
    else if (atStart && stillFor > 3 && !waved && !reduce) { mode = 'wave'; waveT += dt; if (waveT > 1.8) { waved = true; waveT = 0; } }
    else if (stillFor > 0.4) mode = 'idle';
    else waveT = 0;

    const turn = stillFor > 0.4 || atEnd ? -0.55 : 0;
    const turnBlend = reduce ? 1 : 1 - Math.exp(-dt * 3.2); // a weighty turn; the head leads it
    ps.phase = phase; ps.moving = moving; ps.mode = mode; ps.t = t; ps.time = t; ps.dt = dt; ps.signedSpeed = signedSpeed; ps.dx = dx;
    const lookTarget = coarse ? 0 : (pointerX - 0.5) * 1.4 * (stillFor > 0.4 ? 1 : 0.4) - (pointerY - 0.5) * 0.1;
    ps.look += (lookTarget - ps.look) * (1 - Math.exp(-dt * 5));
    people.forEach((person, i) => {
      if (!person) return;
      const shown = i === from || i === to;
      person.visible = shown;
      if (!shown) return;
      setPersonTransition(person, 1);
      person.position.x = i === from ? xFrom : xTo;
      person.rotation.y += (turn - person.rotation.y) * turnBlend;
      pose(person, ps);
    });
    const p = people[ch];

    // At the end the phone in his hand sends lines of light out across the city.
    const phoneObj = p?.userData.phone;
    if (p && phoneObj && atEnd) {
      p.updateMatrixWorld(true); phoneObj.getWorldPosition(phoneAt);
      world.lightLines.forEach((l) => l.position.set(phoneAt.x - END_X - 0.2, phoneAt.y - 1.3, phoneAt.z - 0.3));
    }
    world.lightLines.forEach((l, i) => {
      const grow = reduce ? (atEnd ? 1 : 0) : clamp((endT - 0.6 - i * 0.25) / 1.6);
      l.geometry.setDrawRange(0, Math.floor(smooth(grow) * 41));
      (l.material as THREE.LineBasicMaterial).opacity = grow * 0.9;
    });

    // Life in the world.
    if (!reduce) world.tick(t, x, dt);

    // Framing for portrait screens: the captions sit below a dedicated character viewing area.
    portraitShift += ((atStart ? -0.21 : lastH < 700 ? 0.2 : 0.17) - portraitShift) * (1 - Math.exp(-dt * 6));
    cam.setViewOffset(lastW, lastH, 0, cam.aspect < 0.8 ? lastH * portraitShift : 0, lastW, lastH);
    if (ui.root.dataset.caption !== String(ch)) {
      ui.root.dataset.caption = String(ch);
      const time = ui.root.querySelector('.scene-time'), place = ui.root.querySelector('.scene-location');
      if (time) time.textContent = TIME_LABELS[ch]; if (place) place.textContent = PLACE_LABELS[ch];
    }

    // Render: the old place first, kept aside, then the new one dissolving over it.
    const solo = (i: number) => people.forEach((person, j) => { if (person) person.visible = j === i; });
    let lit: ReturnType<typeof light>;
    if (crossing && mix > 0.002 && mix < 0.998) {
      // both shots share one lens, sized between his two heights, so he stays put and visibly grows
      const H = lerp(LOOKS[from].H, LOOKS[to].H, mix);
      solo(from); const a = light(from, xFrom, t); frameShot(from, t, H);
      post.capture(mix);
      solo(to); const bl = light(to, xTo, t); frameShot(to, t, H);
      lit = { f: lerp(a.f, bl.f, mix), exp: bl.exp, night: lerp(a.night, bl.night, mix), warmth: lerp(a.warmth, bl.warmth, mix) };
    } else {
      solo(ch); lit = light(ch, x, t); frameShot(ch, t, crossing ? lerp(LOOKS[from].H, LOOKS[to].H, mix) : LOOKS[ch].H);
    }
    post.update(t, lit.night, lit.warmth, fade);
    amb!.setMix(lit.f);
    post.render(dt);
    if (people[ch]) ui.root.classList.add('ready');
  };

}

export { SPAN, CHAPTERS, END_X };

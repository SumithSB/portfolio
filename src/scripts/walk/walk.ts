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
// Between chapters the camera tilts up into the sky while the light moves on to the next time of day, then comes
// back down in the next place. It all follows the scroll, so it plays backwards too.
const RANGES: Array<[number, number]> = [[14, 9], [20, 9], [16, 9], [26, 9], [22, 9], [END_X - 5 * SPAN - 9, 9]];
// He moves only when you scroll: his place on the road is tied to the scroll position. A big jump (a new chapter,
// or the chapter map) is a cut rather than a sprint.
const CUT_GAP = 6;
const TZ = 0.14; // the share of each chapter's scroll spent tilting to and from the sky
const FADE = 3.5;
const chapterWeight = (i: number, x: number) => {
  const left = i * SPAN, right = (i + 1) * SPAN;
  let w = 1;
  if (i > 0) w = Math.min(w, clamp((x - (left - FADE / 2)) / FADE));
  if (i < CHAPTERS - 1) w = Math.min(w, clamp(((right + FADE / 2) - x) / FADE));
  return w;
};

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

  // Scroll position -> chapter, how far through it (0..1), and where on the road he should be.
  const place = (p: number) => {
    const c = Math.min(CHAPTERS - 1, Math.floor(p * CHAPTERS));
    const u = clamp(p * CHAPTERS - c);
    const [start, len] = RANGES[c];
    const a = c > 0 ? TZ : 0, b = c < CHAPTERS - 1 ? 1 - TZ : 1;
    const walk = clamp((u - a) / (b - a)); // how far along this chapter's stretch he is
    // tilt: 0 looking at him, 1 looking up at the sky; `toNext` says which way the light is heading
    const into = c > 0 && u < TZ ? 1 - u / TZ : 0, out = c < CHAPTERS - 1 && u > 1 - TZ ? (u - (1 - TZ)) / TZ : 0;
    return { c, u, walk, tilt: smooth(Math.max(into, out)), toNext: out > 0, x: c * SPAN + start + walk * len };
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
  const first = place(clamp(-r0.top / Math.max(1, r0.height - innerHeight))).c;
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
  let x = place(progressAt()).x, lastX = x, phase = 0, stillFor = 0, waved = false, waveT = 0, endT = 0;
  let cutT = -1, fade = 0, jumped = false;
  let smoothPtrX = 0, smoothPtrY = 0;
  let portraitShift = progressAt() < 0.012 ? -0.21 : 0.17;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false;
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

  const frame = (now: number) => {
    if (stopped) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    if (now - lastActive > 4500 && cutT < 0 && (endT === 0 || endT > 4) && ++idleTick % 3 !== 0) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const t = now / 1000;
    fit();

    const prog = progressAt();
    const pl = place(prog);
    if (reduce) x = pl.x;
    else if (cutT >= 0) {
      // A cut: dip to black, move him, come back up. He lands just short so he walks the last step in.
      cutT += dt;
      if (cutT >= 0.22 && !jumped) { x = place(progressAt()).x; lastX = x; camInit = false; jumped = true; }
      fade = cutT < 0.22 ? cutT / 0.22 : Math.max(0, 1 - (cutT - 0.22) / 0.3);
      if (cutT > 0.52) { cutT = -1; fade = 0; }
    } else {
      const gap = pl.x - x;
      // Crossing into another chapter while the camera is up in the sky: move him there unseen.
      const otherChapter = Math.floor(x / SPAN) !== pl.c;
      if (otherChapter && pl.tilt > 0.75) { x = pl.x; lastX = x; }
      else if (Math.abs(gap) > CUT_GAP) { cutT = 0; jumped = false; }
      else x = advanceRoot(x, pl.x, dt);
    }
    if (!reduce && pinned === null) adapt(dt);
    const dx = x - lastX; lastX = x;
    const signedSpeed = cutT >= 0 ? 0 : dx / Math.max(dt, 1e-3);
    const speed = Math.abs(signedSpeed);
    phase += dx * 4.2;
    const ptrBlend = 1 - Math.exp(-dt * 4);
    smoothPtrX += ((pointerX * 2 - 1) - smoothPtrX) * ptrBlend;
    smoothPtrY += ((pointerY * 2 - 1) - smoothPtrY) * ptrBlend;

    // The scene follows where he is; the words follow the scroll.
    const ch = Math.min(CHAPTERS - 1, Math.max(0, Math.floor(x / SPAN)));
    // Captions and characters change together, after the cut reaches the new chapter.
    const localP = ch === pl.c ? pl.u : 0;
    if (ui.root.dataset.chapter !== String(ch)) ui.root.dataset.chapter = String(ch);
    const atStart = prog < 0.012;
    const cardVis = atStart ? 0 : pl.c === CHAPTERS - 1
      ? smooth(clamp((localP - 0.02) / 0.08))
      : localP < 0.1 ? smooth(clamp((localP - 0.02) / 0.08))
      : localP > 0.9 ? smooth(clamp((0.98 - localP) / 0.08))
      : 1;
    const cardOn = cardVis > 0.04;
    ui.root.classList.toggle('at-start', atStart);
    if (prog > 0.95) ui.root.dataset.walkEnd = 'true';
    else delete ui.root.dataset.walkEnd;
    ui.cards.forEach((c, i) => {
      const vis = i === ch ? cardVis : 0;
      const on = vis > 0.04;
      if (c.classList.contains('is-on') !== on) c.classList.toggle('is-on', on);
      c.toggleAttribute('inert', !on);
      if (c.getAttribute('aria-hidden') !== String(!on)) c.setAttribute('aria-hidden', String(!on));
      setStyle(c, '--card-vis', vis.toFixed(3));
      if (i === ch) setStyle(c, '--card-p', localP.toFixed(3));
    });
    ui.mapButtons.forEach((b, i) => {
      const fillAmt = i < pl.c ? 1 : i > pl.c ? 0 : localP;
      setStyle(b, '--ch-fill', fillAmt.toFixed(3));
      if (i === ch && !atStart) { if (!b.hasAttribute('aria-current')) b.setAttribute('aria-current', 'step'); }
      else if (b.hasAttribute('aria-current')) b.removeAttribute('aria-current');
    });
    people.forEach((person, i) => { if (person) setPersonTransition(person, chapterWeight(i, x)); });
    // The light drifts a little through each chapter and travels the rest of the way during the sky tilt.
    const [rs, rl] = RANGES[ch];
    const drift = clamp((x - ch * SPAN - rs) / rl);
    const f = clamp(ch !== pl.c ? ch + 0.5
      : pl.tilt > 0 && pl.toNext ? ch + 0.18 + 0.32 * pl.tilt
      : pl.tilt > 0 ? ch - 0.12 - 0.38 * pl.tilt
      : ch - 0.12 + drift * 0.3, 0, CHAPTERS - 1);
    const k0 = Math.floor(f), k1 = Math.min(CHAPTERS - 1, k0 + 1), kt = smooth(f - k0);
    const A = KEYS[k0], B = KEYS[k1];
    mixCol(skyU.top.value, A.top, B.top, kt); mixCol(skyU.bottom.value, A.bottom, B.bottom, kt);
    mixCol((scene.fog as THREE.Fog).color, A.fog, B.fog, kt);
    mixCol(sun.color, A.sun, B.sun, kt); skyU.sunCol.value.copy(sun.color);
    sun.intensity = lerp(A.sunI, B.sunI, kt); hemi.intensity = lerp(A.hemi, B.hemi, kt);
    r.toneMappingExposure = lerp(A.exp, B.exp, kt);
    const night = lerp(A.night, B.night, kt), rain = lerp(A.rain, B.rain, kt);
    skyU.time.value = t; skyU.night.value = night; skyU.cloud.value = 0.35 + rain * 0.6;
    scene.environmentIntensity = lerp(0.4, 0.25, night);
    post.update(t, night, clamp(1 - Math.abs(f - 3) / 1.5), fade);
    fill.intensity = 1.4 + night * 7; fill.position.set(x + 1.6, 2.6, 2.6);
    world.nightMats.forEach((m) => { m.emissiveIntensity = 0.06 + night * 0.55; });
    (world.stars.material as THREE.PointsMaterial).opacity = clamp((night - 0.55) * 2.2);
    (world.rain.material as THREE.LineBasicMaterial).opacity = rain * 0.75;
    hemi.groundColor.setRGB(lerp(0.35, 0.08, night), lerp(0.27, 0.09, night), lerp(0.21, 0.16, night));
    if (ui.progress) ui.progress.style.transform = `scaleX(${prog.toFixed(4)})`;
    amb!.setMix(f);

    // Him: walking while you scroll, turning to you when you stop.
    const moving = clamp(speed * 0.6);
    stillFor = moving > 0.05 ? 0 : stillFor + dt;
    if (moving > 0.05) waved = false;
    const atEnd = x > END_X - 2.5 && pl.c === CHAPTERS - 1;
    endT = atEnd ? endT + dt : 0;

    let mode: PoseState['mode'] = 'walk';
    if (atEnd) mode = 'phone';
    else if (prog < 0.012 && stillFor > 3 && !waved && !reduce) { mode = 'wave'; waveT += dt; if (waveT > 1.8) { waved = true; waveT = 0; } }
    else if (stillFor > 0.4) mode = 'idle';
    else waveT = 0;

    const turn = stillFor > 0.4 || atEnd ? -0.55 : 0;
    const turnBlend = reduce ? 1 : 1 - Math.exp(-dt * 3.2); // a weighty turn; the head leads it
    ps.phase = phase; ps.moving = moving; ps.mode = mode; ps.t = t; ps.time = t; ps.dt = dt; ps.signedSpeed = signedSpeed; ps.dx = dx;
    const lookTarget = coarse ? 0 : (pointerX - 0.5) * 1.4 * (stillFor > 0.4 ? 1 : 0.4) - (pointerY - 0.5) * 0.1;
    ps.look += (lookTarget - ps.look) * (1 - Math.exp(-dt * 5));
    const p = people[ch];
    for (const person of people) {
      if (!person || !person.visible) continue;
      person.position.x = x;
      person.rotation.y += (turn - person.rotation.y) * turnBlend;
      pose(person, ps);
    }

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
    world.rain.position.x = x;

    // Age-aware framing. Portrait captions sit below a dedicated character viewing area.
    const narrow = cam.aspect < 0.8;
    const H = LOOKS[ch].H;
    const atHero = atStart;
    const lensDistance = H * (narrow ? 6.2 : 6.4); // pulled back so the place reads around him
    const px = reduce || coarse ? 0 : smoothPtrX * 0.09;
    const py = reduce || coarse ? 0 : smoothPtrY * 0.045;
    const cx = x + (narrow ? 0.75 : 1.25) + px;
    const skyward = pl.tilt;
    const cy = H * 0.95 + py + skyward * 1.4;
    const lookX = x - (narrow ? 0 : 1.35);
    const lookY = H * 0.78 + skyward * skyward * 22; // close to level, so the horizon and the backdrop sit in the shot
    const k = !camInit ? 1 : 1 - Math.exp(-dt * 7);
    camPos.x += (cx - camPos.x) * k; camPos.y += (cy - camPos.y) * k; camPos.z += (lensDistance + skyward * 1.5 - camPos.z) * k;
    camLook.set(lookX, lookY, 0);
    camInit = true;
    portraitShift += ((atHero ? -0.21 : lastH < 700 ? 0.2 : 0.17) - portraitShift) * (1 - Math.exp(-dt * 6));
    cam.setViewOffset(lastW, lastH, 0, narrow ? lastH * portraitShift : 0, lastW, lastH);
    cam.position.copy(camPos); cam.lookAt(camLook);
    sky.position.copy(cam.position);
    backdrops.update(ch, cam.position.y);
    if (ui.root.dataset.caption !== String(ch)) {
      ui.root.dataset.caption = String(ch);
      const time = ui.root.querySelector('.scene-time'), place = ui.root.querySelector('.scene-location');
      if (time) time.textContent = TIME_LABELS[ch]; if (place) place.textContent = PLACE_LABELS[ch];
    }
    // The sun's direction from where we stand, for the glow in the sky.
    skyU.sunDir.value.set(30, lerp(A.sunY, B.sunY, kt), -18).normalize();
    sun.position.set(x + 30, lerp(A.sunY, B.sunY, kt), -18); sun.target.position.set(x + 4, 0, 0);
    post.render(dt);
    if (people[ch]) ui.root.classList.add('ready');
  };

}

export { SPAN, CHAPTERS, END_X };

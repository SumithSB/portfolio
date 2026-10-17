import * as THREE from 'three';
import { buildWorld, SPAN, CHAPTERS, END_X } from './scenes';
import { makePerson, pose, setPersonTransition, type Person, type PoseState } from './person';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAmbience } from './audio';
import { createPost, type Quality } from './post';

// Light across one day: dawn, morning, noon, golden hour, dusk in the rain, night.
interface Key { top: number; bottom: number; fog: number; sun: number; sunI: number; sunY: number; hemi: number; night: number; rain: number; exp: number }
const KEYS: Key[] = [
  { top: 0x8FB3C9, bottom: 0xF6CBA4, fog: 0xF3CBA6, sun: 0xFFC98A, sunI: 3.0, sunY: 9, hemi: 1.35, night: 0, rain: 0, exp: 1.05 },
  { top: 0x9DBFD6, bottom: 0xE6E2D6, fog: 0xDCDAD2, sun: 0xFFF0D8, sunI: 2.5, sunY: 16, hemi: 1.25, night: 0, rain: 0, exp: 1.0 },
  { top: 0x5E9BCF, bottom: 0xD8E7EF, fog: 0xD5E2E8, sun: 0xFFFFFF, sunI: 3.2, sunY: 30, hemi: 1.4, night: 0, rain: 0, exp: 1.0 },
  { top: 0x6C7FAA, bottom: 0xF6B46E, fog: 0xEFB27A, sun: 0xFFA95A, sunI: 2.9, sunY: 7, hemi: 1.1, night: 0.15, rain: 0, exp: 1.05 },
  { top: 0x2B3250, bottom: 0x857A92, fog: 0x6C6A80, sun: 0xA9B4D6, sunI: 0.9, sunY: 14, hemi: 1.0, night: 0.6, rain: 1, exp: 1.1 },
  { top: 0x060A16, bottom: 0x1C2442, fog: 0x141A30, sun: 0x8EA2D6, sunI: 0.6, sunY: 20, hemi: 0.7, night: 1, rain: 0, exp: 1.2 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

const CAM_FRAMES = [
  { y: 2.35, z: 8.6, lookY: 1.45 },
  { y: 2.15, z: 7.9, lookY: 1.38 },
  { y: 2.45, z: 8.8, lookY: 1.55 },
  { y: 2.30, z: 8.3, lookY: 1.48 },
  { y: 2.50, z: 9.0, lookY: 1.58 },
  { y: 2.40, z: 8.7, lookY: 1.52 },
];
const sampleChapterFrame = (u: number) => {
  const f = clamp(u, 0, CHAPTERS - 1);
  const i = Math.floor(f);
  const j = Math.min(CHAPTERS - 1, i + 1);
  const t = i === j ? 0 : smooth(f - i);
  const A = CAM_FRAMES[i], B = CAM_FRAMES[j];
  return { y: lerp(A.y, B.y, t), z: lerp(A.z, B.z, t), lookY: lerp(A.lookY, B.lookY, t) };
};
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
  scrollTo?: (top: number) => void; // smooth scroller, when the page has one
}

export function startWalk(ui: WalkUI) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const r = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: !coarse, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
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
  const sm = coarse ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -6, far: 90 }); sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  // A warm light that stays with him, so he is never lost in the dark chapters.
  const fill = new THREE.PointLight(0xFFD9A8, 0, 9, 2); scene.add(fill);

  // Soft studio reflections so glass, wet roads and metal pick up light.
  const pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const world = buildWorld(scene);

  let ratio = Math.min(devicePixelRatio, coarse ? 1.5 : 2);
  // ?quality=0|1|2 pins the quality level, for checking how the walk looks on any device.
  const pinned = new URLSearchParams(location.search).get('quality');
  const post = createPost(r, scene, cam, (pinned !== null ? clamp(+pinned, 0, 2) : coarse ? 1 : 2) as Quality);
  // Watch the frame rate and step quality down if the device struggles. Never steps back up, so it can't flicker.
  let slowFrames = 0, sampled = 0;
  const adapt = (dt: number) => {
    // Judge in short windows by majority, so one hitch never counts but a slow device steps down within a second or two.
    sampled++; if (dt > 1 / 40) slowFrames++;
    if (sampled < 30) return;
    if (slowFrames > 18) {
      if (post.quality > 0) post.setQuality((post.quality - 1) as Quality);
      else if (ratio > 1) { ratio = 1; r.setPixelRatio(1); lastW = 0; }
    }
    sampled = 0; slowFrames = 0;
  };

  // Six versions of him, one per chapter. Only the current one is shown.
  const people: Person[] = Array.from({ length: CHAPTERS }, (_, i) => { const p = makePerson(i); p.visible = i === 0; scene.add(p); return p; });

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
    const x = i * SPAN + SPAN * 0.32;
    const top = ui.root.offsetTop + (x / END_X) * (ui.root.offsetHeight - innerHeight);
    if (ui.scrollTo && !reduce) ui.scrollTo(top); else scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };
  ui.mapButtons.forEach((b, i) => b.addEventListener('click', () => scrollToChapter(i)));

  const amb = createAmbience();
  ui.sound?.addEventListener('click', () => {
    const on = ui.sound!.getAttribute('aria-pressed') !== 'true';
    ui.sound!.setAttribute('aria-pressed', String(on));
    ui.sound!.querySelector('span')!.textContent = on ? 'Sound on' : 'Sound off';
    if (on) amb.start(); else amb.stop();
  });

  /* ---------- size ---------- */
  let lastW = 0, lastH = 0;
  const fit = () => {
    const w = ui.canvas.clientWidth, h = ui.canvas.clientHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    r.setPixelRatio(ratio); r.setSize(w, h, false); post.setSize(w, h, ratio);
    cam.aspect = w / h; cam.fov = cam.aspect < 0.8 ? 58 : cam.aspect < 1.3 ? 48 : 40; cam.updateProjectionMatrix();
  };

  /* ---------- the loop ---------- */
  let x = progressAt() * END_X, lastX = x, phase = 0, stillFor = 0, waved = false, waveT = 0, endT = 0;
  let smoothPtrX = 0, smoothPtrY = 0, sideS = 0.35;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false;
  let visible = true, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) amb.setMix(-1); }).observe(ui.root);
  const phoneAt = new THREE.Vector3();
  const ps: PoseState = { phase: 0, moving: 0, mode: 'walk', t: 0, time: 0, look: 0, dt: 0, signedSpeed: 0, dx: 0 };

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(0.5, (now - last) / 1000); last = now;
    const t = now / 1000;
    fit();

    const target = progressAt() * END_X;
    x = reduce ? target : x + (target - x) * (1 - Math.exp(-dt * 6));
    if (!reduce && pinned === null) adapt(dt);
    const dx = x - lastX; lastX = x;
    const signedSpeed = dx / Math.max(dt, 1e-3);
    const speed = Math.abs(signedSpeed);
    phase += dx * 4.2;
    const ptrBlend = 1 - Math.exp(-dt * 4);
    smoothPtrX += ((pointerX * 2 - 1) - smoothPtrX) * ptrBlend;
    smoothPtrY += ((pointerY * 2 - 1) - smoothPtrY) * ptrBlend;

    // Which chapter, and where between the keyframes.
    const ch = Math.min(CHAPTERS - 1, Math.max(0, Math.floor(x / SPAN)));
    const localP = clamp((x - ch * SPAN) / SPAN);
    const atStart = x < 4;
    const cardVis = atStart ? 0 : ch === CHAPTERS - 1
      ? smooth(clamp((localP - 0.05) / 0.08))
      : localP < 0.08 ? smooth(localP / 0.08)
      : localP > 0.88 ? smooth(clamp((1 - localP) / 0.12))
      : 1;
    const cardOn = cardVis > 0.04;
    ui.root.classList.toggle('at-start', atStart);
    if (x / END_X > 0.92) ui.root.dataset.walkEnd = 'true';
    else delete ui.root.dataset.walkEnd;
    ui.cards.forEach((c, i) => {
      const vis = i === ch ? cardVis : 0;
      const on = vis > 0.04;
      if (c.classList.contains('is-on') !== on) c.classList.toggle('is-on', on);
      c.style.setProperty('--card-vis', vis.toFixed(3));
      if (i === ch) c.style.setProperty('--card-p', localP.toFixed(3));
    });
    ui.mapButtons.forEach((b, i) => {
      const fill = i < ch ? 1 : i > ch ? 0 : localP;
      b.style.setProperty('--ch-fill', fill.toFixed(3));
      b.toggleAttribute('aria-current', i === ch && !atStart);
    });
    people.forEach((person, i) => setPersonTransition(person, chapterWeight(i, x)));
    const f = clamp(x / SPAN - 0.5, 0, CHAPTERS - 1);
    const k0 = Math.floor(f), k1 = Math.min(CHAPTERS - 1, k0 + 1), kt = smooth(f - k0);
    const A = KEYS[k0], B = KEYS[k1];
    mixCol(skyU.top.value, A.top, B.top, kt); mixCol(skyU.bottom.value, A.bottom, B.bottom, kt);
    mixCol((scene.fog as THREE.Fog).color, A.fog, B.fog, kt);
    mixCol(sun.color, A.sun, B.sun, kt); skyU.sunCol.value.copy(sun.color);
    sun.intensity = lerp(A.sunI, B.sunI, kt); hemi.intensity = lerp(A.hemi, B.hemi, kt);
    r.toneMappingExposure = lerp(A.exp, B.exp, kt);
    const night = lerp(A.night, B.night, kt), rain = lerp(A.rain, B.rain, kt);
    skyU.time.value = t; skyU.night.value = night; skyU.cloud.value = 0.35 + rain * 0.6;
    scene.environmentIntensity = lerp(0.22, 0.12, night);
    post.update(t, night, clamp(1 - Math.abs(f - 3) / 1.5));
    fill.intensity = night * 14; fill.position.set(x + 1.6, 2.6, 2.6);
    world.nightMats.forEach((m) => { m.emissiveIntensity = 0.15 + night * 1.8; });
    (world.stars.material as THREE.PointsMaterial).opacity = clamp((night - 0.55) * 2.2);
    (world.rain.material as THREE.LineBasicMaterial).opacity = rain * 0.75;
    hemi.groundColor.setRGB(lerp(0.35, 0.08, night), lerp(0.27, 0.09, night), lerp(0.21, 0.16, night));
    if (ui.progress) ui.progress.style.transform = `scaleX(${(x / END_X).toFixed(4)})`;
    amb.setMix(f);

    // Him: walking while you scroll, turning to you when you stop.
    const moving = clamp(speed * 0.6);
    stillFor = moving > 0.05 ? 0 : stillFor + dt;
    if (moving > 0.05) waved = false;
    const atEnd = x > END_X - 5;
    endT = atEnd ? endT + dt : 0;

    let mode: PoseState['mode'] = 'walk';
    if (atEnd) mode = 'phone';
    else if (stillFor > 1.2 && !waved && !reduce) { mode = 'wave'; waveT += dt; if (waveT > 1.8) { waved = true; waveT = 0; } }
    else if (stillFor > 0.4) mode = ch === CHAPTERS - 1 ? 'pockets' : 'idle';
    else waveT = 0;

    const turn = stillFor > 0.4 || atEnd ? -0.85 : 0;
    const turnBlend = reduce ? 1 : 1 - Math.exp(-dt * 3.2); // a weighty turn; the head leads it
    ps.phase = phase; ps.moving = moving; ps.mode = mode; ps.t = t; ps.time = t; ps.dt = dt; ps.signedSpeed = signedSpeed; ps.dx = dx;
    const lookTarget = coarse ? 0 : (pointerX - 0.5) * 1.4 * (stillFor > 0.4 ? 1 : 0.4) - (pointerY - 0.5) * 0.1;
    ps.look += (lookTarget - ps.look) * (1 - Math.exp(-dt * 5));
    let p: Person = people[ch];
    for (const person of people) {
      if (!person.visible) continue;
      person.position.x = x;
      person.rotation.y += (turn - person.rotation.y) * turnBlend;
      pose(person, ps);
      if (person === people[ch]) p = person;
    }

    // At the end the phone in his hand sends lines of light out across the city.
    const endK = reduce ? (atEnd ? 1 : 0) : smooth(clamp(endT / 1.4));
    if (p.userData.phone && atEnd) {
      p.updateMatrixWorld(true); p.userData.phone.getWorldPosition(phoneAt);
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

    // Camera follows, a little higher and further out on narrow screens.
    const narrow = cam.aspect < 0.8;
    const fr = sampleChapterFrame(x / SPAN);
    const breathe = reduce ? 0 : Math.sin(t * 1.1) * 0.03;
    const dolly = reduce ? 0 : Math.min(speed, 1.2) * 0.45;
    const px = reduce || coarse ? 0 : smoothPtrX * 0.35;
    const py = reduce || coarse ? 0 : smoothPtrY * 0.22;
    // Card sits on the left, so the camera sits a little ahead-left and he reads on the open side.
    // Card sits on the left, so the camera drifts ahead-left and he reads on the open side. Eased, never snapped.
    sideS += ((cardOn ? -1.15 : 0.35) - sideS) * (1 - Math.exp(-dt * 1.6));
    const hand = reduce ? 0 : 1; // a faint hand-held drift
    const hx = (Math.sin(t * 0.37) + Math.sin(t * 0.91) * 0.5) * 0.025 * hand;
    const hy = (Math.sin(t * 0.53 + 1.3) + Math.sin(t * 1.27) * 0.4) * 0.02 * hand;
    const cx = x + (narrow ? 0.15 : lerp(sideS, -1.7, endK)) + px + hx;
    const cy = (narrow ? fr.y + 0.35 : fr.y) + breathe + py + hy;
    const cz = (narrow ? fr.z + 2.3 : fr.z) + dolly;
    const lookY = (narrow ? fr.lookY + 0.22 : fr.lookY) + endK * 0.35;
    const k = reduce || !camInit ? 1 : 1 - Math.exp(-dt * 4.5);
    camPos.x += (cx - camPos.x) * k; camPos.y += (cy - camPos.y) * k; camPos.z += (cz - camPos.z) * k;
    camLook.x += (cx + (narrow ? 0.1 : 0.2) - camLook.x) * k; camLook.y += (lookY - camLook.y) * k; camLook.z = -4;
    camInit = true;
    cam.position.copy(camPos);
    cam.lookAt(camLook);
    sky.position.copy(cam.position);
    // The sun's direction from where we stand, for the glow in the sky.
    skyU.sunDir.value.set(30, lerp(A.sunY, B.sunY, kt), -18).normalize();
    sun.position.set(x + 30, lerp(A.sunY, B.sunY, kt), -18); sun.target.position.set(x + 4, 0, 0);
    post.render(dt);
  };
  requestAnimationFrame(frame);
  requestAnimationFrame(() => requestAnimationFrame(() => ui.root.classList.add('ready')));
}

export { SPAN, CHAPTERS, END_X };

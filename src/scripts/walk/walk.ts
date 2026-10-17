import * as THREE from 'three';
import { buildWorld, SPAN, CHAPTERS, END_X } from './scenes';
import { makePerson, pose, type Person, type PoseState } from './person';
import { createAmbience } from './audio';

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

export interface WalkUI {
  root: HTMLElement;          // the tall scroll section
  canvas: HTMLCanvasElement;
  cards: HTMLElement[];       // one per chapter
  mapButtons: HTMLButtonElement[];
  sound: HTMLButtonElement | null;
  progress: HTMLElement | null;
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

  // Sky: a big gradient dome that follows the camera.
  const skyU = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6 + 0.08, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0); }',
  }));
  sky.renderOrder = -1; scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xFFE2C2, 0x5A4636, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFC98A, 3); sun.castShadow = true;
  const sm = coarse ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -6, far: 90 }); sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  // A warm light that stays with him, so he is never lost in the dark chapters.
  const fill = new THREE.PointLight(0xFFD9A8, 0, 9, 2); scene.add(fill);

  const world = buildWorld(scene);

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
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
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
  const fit = () => {
    const w = ui.canvas.clientWidth, h = ui.canvas.clientHeight;
    if (!w || !h) return;
    if (ui.canvas.width !== Math.floor(w * r.getPixelRatio()) || ui.canvas.height !== Math.floor(h * r.getPixelRatio())) {
      r.setSize(w, h, false); cam.aspect = w / h; cam.fov = cam.aspect < 0.8 ? 58 : cam.aspect < 1.3 ? 48 : 40; cam.updateProjectionMatrix();
    }
  };

  /* ---------- the loop ---------- */
  let x = progressAt() * END_X, lastX = x, phase = 0, chapter = -2, stillFor = 0, waved = false, waveT = 0, endT = 0;
  let visible = true, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) amb.setMix(-1); }).observe(ui.root);
  const phoneAt = new THREE.Vector3();
  const ps: PoseState = { phase: 0, moving: 0, mode: 'walk', t: 0, look: 0 };

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(0.5, (now - last) / 1000); last = now;
    const t = now / 1000;
    fit();

    const target = progressAt() * END_X;
    x = reduce ? target : x + (target - x) * (1 - Math.exp(-dt * 5));
    const dx = x - lastX; lastX = x;
    const speed = Math.abs(dx) / Math.max(dt, 1e-3);
    phase += Math.abs(dx) * 4.2;

    // Which chapter, and where between the keyframes.
    const ch = Math.min(CHAPTERS - 1, Math.floor(x / SPAN));
    const shown = x < 4 ? -1 : ch; // the title card owns the first few steps
    if (shown !== chapter) {
      people.forEach((p, i) => { p.visible = i === ch; });
      ui.cards.forEach((c, i) => c.classList.toggle('is-on', i === shown));
      ui.mapButtons.forEach((b, i) => b.toggleAttribute('aria-current', i === shown));
      ui.root.classList.toggle('at-start', shown < 0);
      chapter = shown;
    }
    const f = clamp(x / SPAN - 0.5, 0, CHAPTERS - 1);
    const k0 = Math.floor(f), k1 = Math.min(CHAPTERS - 1, k0 + 1), kt = smooth(f - k0);
    const A = KEYS[k0], B = KEYS[k1];
    mixCol(skyU.top.value, A.top, B.top, kt); mixCol(skyU.bottom.value, A.bottom, B.bottom, kt);
    mixCol((scene.fog as THREE.Fog).color, A.fog, B.fog, kt);
    mixCol(sun.color, A.sun, B.sun, kt);
    sun.intensity = lerp(A.sunI, B.sunI, kt); hemi.intensity = lerp(A.hemi, B.hemi, kt);
    r.toneMappingExposure = lerp(A.exp, B.exp, kt);
    const night = lerp(A.night, B.night, kt), rain = lerp(A.rain, B.rain, kt);
    fill.intensity = night * 14; fill.position.set(x + 1.6, 2.6, 2.6);
    world.nightMats.forEach((m) => { m.emissiveIntensity = 0.15 + night * 1.8; });
    (world.stars.material as THREE.PointsMaterial).opacity = clamp((night - 0.55) * 2.2);
    (world.rain.material as THREE.PointsMaterial).opacity = rain * 0.75;
    hemi.groundColor.setRGB(lerp(0.35, 0.08, night), lerp(0.27, 0.09, night), lerp(0.21, 0.16, night));
    if (ui.progress) ui.progress.style.transform = `scaleX(${(x / END_X).toFixed(4)})`;
    amb.setMix(f);

    // Him: walking while you scroll, turning to you when you stop.
    const p = people[ch];
    p.position.x = x;
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
    p.rotation.y += (turn - p.rotation.y) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
    ps.phase = phase; ps.moving = moving; ps.mode = mode; ps.t = t;
    // He follows your pointer with his eyes when he is facing you.
    const lookTarget = coarse ? 0 : (pointerX - 0.5) * 1.4 * (stillFor > 0.4 ? 1 : 0.4) - (pointerY - 0.5) * 0.1;
    ps.look += (lookTarget - ps.look) * (1 - Math.exp(-dt * 5));
    pose(p, ps);

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
    if (!reduce) {
      world.train.position.x = 3 * SPAN - 30 + ((t * 6) % (SPAN + 40));
      world.plane.position.x = 4 * SPAN - 20 + ((t * 5) % (SPAN + 50)); world.plane.position.y = 24 + Math.sin(t * 0.3);
      world.bus.position.x = 5 * SPAN - 20 + ((t * 2.4) % (SPAN + 25));
      world.steam.forEach((s, i) => { const k = (t * 0.35 + i / world.steam.length) % 1; s.position.y = 1.5 + k * 1.4; s.material.opacity = 0.45 * (1 - k); s.scale.setScalar(0.4 + k * 0.8); });
      const pos = world.rain.geometry.attributes.position as THREE.BufferAttribute;
      if (rain > 0.01) { for (let i = 0; i < pos.count; i++) { let y = pos.getY(i) - dt * 14; if (y < 0) y += 14; pos.setY(i, y); } pos.needsUpdate = true; }
    }
    world.rain.position.x = x;

    // Camera follows, a little higher and further out on narrow screens.
    const narrow = cam.aspect < 0.8;
    // At the end the camera eases left so he stands clear of the chapter card.
    const cx = x + (narrow ? 0.6 : lerp(2.6, -1.6, endK));
    cam.position.set(cx, narrow ? 2.6 : 2.3, narrow ? 10.5 : 8.2);
    cam.lookAt(cx + (narrow ? 0.1 : 0.2), narrow ? 2.0 : 1.75 + endK * 0.6, -4);
    sky.position.copy(cam.position);
    sun.position.set(x + 30, lerp(A.sunY, B.sunY, kt), -18); sun.target.position.set(x + 4, 0, 0);
    r.render(scene, cam);
  };
  requestAnimationFrame(frame);
  requestAnimationFrame(() => requestAnimationFrame(() => ui.root.classList.add('ready')));
}

export { SPAN, CHAPTERS, END_X };

import * as THREE from 'three';
import { mat, box, capsule, sphere, cyl, at, rng, instanced } from './kit';

// Six scenes laid end to end along the road (the walker moves along +x at z = 0).
export const SPAN = 70;
export const CHAPTERS = 6;
export const END_X = SPAN * CHAPTERS - 18;

export interface World {
  nightMats: THREE.MeshStandardMaterial[]; // windows and lamps: brighter as the day ends
  rain: THREE.Points;
  plane: THREE.Group;
  bus: THREE.Group;
  train: THREE.Group;
  steam: THREE.Sprite[];
  lightLines: THREE.Line[];
  stars: THREE.Points;
}

const textTexture = (text: string, w = 256, h = 96, bg = '#F7F2E6', fg = '#1A1A1A', size = 54) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.font = `600 ${size}px "Public Sans", Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const glowTexture = (inner = 'rgba(255,240,205,1)', mid = 'rgba(255,214,140,.6)') => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.3, mid); gr.addColorStop(1, 'rgba(255,214,140,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export function buildWorld(scene: THREE.Scene): World {
  const R = rng(7);
  const train = new THREE.Group();
  const nightMats: THREE.MeshStandardMaterial[] = [];
  const lit = (color: number) => { const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.4 }); nightMats.push(m); return m; };
  const add = <T extends THREE.Object3D>(o: T) => { scene.add(o); return o; };
  const ox = (i: number) => i * SPAN;
  const glow = glowTexture();
  const halo = (x: number, y: number, z: number, s: number) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); sp.scale.set(s, s, 1); sp.position.set(x, y, z); return add(sp); };

  /* ---------- ground: one strip per chapter ---------- */
  const groundCols = [0x8DAF5E, 0x9A948A, 0x8A8378, 0x8F887C, 0x55515E, 0x1E2333];
  const roadCols = [0xC09A70, 0x5E5A56, 0x55524F, 0x5A544E, 0x3C3946, 0x1C2030];
  for (let i = 0; i < CHAPTERS; i++) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(SPAN + 0.2, 140), mat(groundCols[i], { r: 1 }));
    g.rotation.x = -Math.PI / 2; g.position.set(ox(i) + SPAN / 2, 0, -40); g.receiveShadow = true; add(g);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(SPAN + 0.2, 3.4), mat(roadCols[i], { r: i >= 4 ? 0.25 : 1, m: i >= 4 ? 0.2 : 0 }));
    road.rotation.x = -Math.PI / 2; road.position.set(ox(i) + SPAN / 2, 0.01, 0); road.receiveShadow = true; add(road);
    if (i >= 1) { // a pavement kerb behind the walker in the city chapters
      const kerb = box(SPAN, 0.16, 1.4, mat(i >= 4 ? 0x4A4656 : 0xA39C90, { r: 0.9 })); kerb.position.set(ox(i) + SPAN / 2, 0.08, -2.4); add(kerb);
    }
  }
  const front = new THREE.Mesh(new THREE.PlaneGeometry(SPAN * CHAPTERS, 30), mat(0x6E8A4E, { r: 1 }));
  front.rotation.x = -Math.PI / 2; front.position.set(SPAN * CHAPTERS / 2, -0.01, 16); add(front);

  /* ---------- sky dome + stars ---------- */
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => {
    const a = R() * Math.PI, b = R() * Math.PI * 0.45; const r = 180; return i % 3 === 0 ? Math.cos(a) * Math.sin(b) * r + SPAN * 5 : i % 3 === 1 ? Math.cos(b) * r * 0.6 + 10 : -Math.sin(a) * Math.sin(b) * r;
  }), 3)), new THREE.PointsMaterial({ color: 0xE9E6EE, size: 0.9, transparent: true, opacity: 0, fog: false }));
  add(stars);

  /* ---------- shared props ---------- */
  const palm = (x: number, z: number, h: number) => {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, h * 0.4, 0), new THREE.Vector3(0.1, h * 0.75, 0.1), new THREE.Vector3(0.6, h, 0)]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.14, 7), mat(0x6B5235, { r: 1 })); trunk.castShadow = true; g.add(trunk);
    for (let k = 0; k < 9; k++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.6, 4, 1), mat(k % 2 ? 0x3F6232 : 0x4E7A3A)); frond.scale.z = 0.12; frond.castShadow = true;
      const pv = new THREE.Group(); pv.position.set(0.6, h, 0); pv.rotation.y = (k / 9) * Math.PI * 2; frond.position.set(1.15, -0.35, 0); frond.rotation.z = -1.9; pv.add(frond); g.add(pv);
    }
    g.position.set(x, 0, z); return add(g);
  };
  const tree = (x: number, z: number, s: number, col: number) => {
    const g = new THREE.Group(); const t = cyl(0.18 * s, 0.26 * s, 2.4 * s, mat(0x5A4430)); t.position.y = 1.2 * s; g.add(t);
    [[0, 3.1, 0, 1.5], [1.0, 2.7, 0.4, 1.1], [-1.0, 2.8, -0.3, 1.15], [0.3, 3.6, -0.6, 1.0]].forEach(([a, b, c, rr]) => { const l = sphere(rr * s, mat(col), 12); l.position.set(a * s, b * s, c * s); g.add(l); });
    g.position.set(x, 0, z); return add(g);
  };
  const lamp = (x: number, z: number, h = 4.2) => {
    const g = new THREE.Group(); const post = cyl(0.06, 0.08, h, mat(0x2B2833)); post.position.y = h / 2; g.add(post);
    const head = box(0.5, 0.16, 0.3, mat(0x2B2833)); head.position.set(0.2, h, 0); g.add(head);
    const bulb = box(0.36, 0.06, 0.2, lit(0xFFD58A)); bulb.position.set(0.2, h - 0.1, 0); g.add(bulb);
    g.position.set(x, 0, z); add(g); halo(x + 0.2, h - 0.1, z + 0.2, 3.2); return g;
  };
  const person = (x: number, z: number, col: number, h = 1) => {
    const g = new THREE.Group(); const b = capsule(0.17 * h, 0.6 * h, mat(col)); b.position.y = 0.75 * h; g.add(b);
    const hd = sphere(0.13 * h, mat(0xA8693F)); hd.position.y = 1.35 * h; g.add(hd); const hr = sphere(0.135 * h, mat(0x14110F), 10); hr.scale.y = 0.6; hr.position.y = 1.42 * h; g.add(hr);
    g.position.set(x, 0, z); return add(g);
  };
  const building = (x: number, z: number, w: number, h: number, d: number, col: number, opts: { windows?: number; tank?: boolean; balcony?: boolean; shutter?: boolean } = {}) => {
    const g = new THREE.Group();
    const b = box(w, h, d, mat(col, { r: 0.95 })); b.position.y = h / 2; g.add(b);
    const parapet = box(w + 0.1, 0.25, d + 0.1, mat(new THREE.Color(col).multiplyScalar(0.85).getHex())); parapet.position.y = h + 0.12; g.add(parapet);
    const floors = Math.max(1, Math.floor(h / 3));
    for (let f = 1; f < floors; f++) for (let k = 0; k < Math.max(1, Math.floor(w / 2.2)); k++) {
      const win = box(0.9, 1.0, 0.05, (f + k) % 3 === 0 ? lit(0xF6D59A) : mat(0x3A4650, { r: 0.3 }));
      win.position.set(-w / 2 + 1.1 + k * 2.2, f * 3 + 1.2, d / 2 + 0.02); g.add(win);
      if (opts.balcony) { const bal = box(1.5, 0.08, 0.6, mat(0x6E6A64)); bal.position.set(-w / 2 + 1.1 + k * 2.2, f * 3 + 0.5, d / 2 + 0.3); g.add(bal); const rail = box(1.5, 0.5, 0.03, mat(0x4A4744)); rail.position.set(-w / 2 + 1.1 + k * 2.2, f * 3 + 0.78, d / 2 + 0.6); g.add(rail); }
    }
    if (opts.shutter) {
      const sh = box(w - 0.6, 2.4, 0.06, mat(0x8E949A, { r: 0.5, m: 0.4 })); sh.position.set(0, 1.2, d / 2 + 0.03); g.add(sh);
      for (let k = 0; k < 11; k++) { const l = box(w - 0.6, 0.03, 0.07, mat(0x6E747A)); l.position.set(0, 0.15 + k * 0.21, d / 2 + 0.05); g.add(l); }
    }
    if (opts.tank) { const t = cyl(0.55, 0.55, 0.9, mat(0x1B1D1F, { r: 0.6 })); t.position.set(w * 0.25, h + 0.7, 0); g.add(t); const lid = cyl(0.3, 0.3, 0.1, mat(0x1B1D1F)); lid.position.set(w * 0.25, h + 1.2, 0); g.add(lid); }
    g.position.set(x, 0, z); return add(g);
  };
  const auto = (x: number, z: number, ry = 0) => {
    const g = new THREE.Group();
    const lower = box(2.2, 0.6, 1.3, mat(0x2F7A3A)); lower.position.y = 0.55; g.add(lower);
    const nose = box(0.5, 0.7, 1.3, mat(0xE9C33A)); nose.position.set(1.05, 0.65, 0); g.add(nose);
    const canopy = box(1.8, 0.12, 1.36, mat(0x1E2A20)); canopy.position.set(-0.1, 1.7, 0); g.add(canopy);
    for (const zz of [0.62, -0.62]) { const post = box(0.05, 1.0, 0.05, mat(0x1E2A20)); post.position.set(0.7, 1.2, zz); g.add(post); }
    const back = box(0.1, 1.0, 1.36, mat(0x1E2A20)); back.position.set(-1.0, 1.2, 0); g.add(back);
    const ws = box(0.06, 0.6, 1.1, mat(0xA9C6D3, { r: 0.1 })); ws.position.set(0.8, 1.3, 0); g.add(ws);
    for (const [wx, wz] of [[0.95, 0], [-0.8, 0.62], [-0.8, -0.62]]) { const w = cyl(0.28, 0.28, 0.2, mat(0x151515)); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.28, wz); g.add(w); }
    g.position.set(x, 0, z); g.rotation.y = ry; return add(g);
  };
  const doubleDecker = (x: number, z: number) => {
    const g = new THREE.Group(); const red = mat(0xC8282E, { r: 0.45 });
    const body = box(8.5, 3.9, 2.5, red); body.position.y = 2.35; g.add(body);
    for (const y of [1.85, 3.45]) { const strip = box(8.1, 0.85, 2.52, lit(0xFFE3A0)); strip.position.y = y; g.add(strip); }
    const band = box(8.52, 0.18, 2.54, mat(0xF3EEE4)); band.position.y = 2.6; g.add(band);
    for (const wx of [-2.9, 2.7]) for (const wz of [-1.15, 1.15]) { const w = cyl(0.5, 0.5, 0.3, mat(0x151515)); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.5, wz); g.add(w); }
    g.position.set(x, 0, z); return add(g);
  };

  /* ===== 1 · a small town at dawn (0..70) ===== */
  {
    const o = ox(0);
    for (let i = 0; i < 12; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), mat(0xB9C9C4, { r: 0.15, m: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.set(o + i * 6, 0.02, -11 - (i % 2) * 2.5); add(w); }
    for (let i = 0; i < 14; i++) add(at(box(4.6, 0.12, 0.25, mat(0x7A9450)), o + i * 5, 0.06, -8 - (i % 3) * 3));
    add(instanced(new THREE.ConeGeometry(0.05, 0.3, 4), mat(0x9AB55C), Array.from({ length: 360 }, () => [o + R() * SPAN, 0.14, -4 - R() * 14, 0.8 + R() * 0.6, R() * 3])));
    [[3, -3.6, 6], [9, -12, 6.5], [18, -4, 7], [27, -14, 8], [33, -4.2, 6.2], [44, -9, 7], [52, -3.8, 6.8], [63, -13, 7.6]].forEach(([x, z, h]) => palm(o + x, z, h));
    const house = (x: number, z: number, w: number, d: number, h: number, col: number) => {
      const g = new THREE.Group();
      const walls = box(w, h, d, mat(col)); walls.position.y = h / 2; g.add(walls);
      const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.3, 0); shape.lineTo(0, 1.1); shape.lineTo(w / 2 + 0.3, 0); shape.lineTo(-w / 2 - 0.3, 0);
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }), mat(0xA9512F, { r: 0.85 })); roof.position.set(0, h, -d / 2 - 0.3); roof.castShadow = true; g.add(roof);
      const door = box(0.7, 1.5, 0.05, mat(0x6E4A33)); door.position.set(0, 0.75, d / 2 + 0.02); g.add(door);
      for (const sx of [-1, 1]) { const win = box(0.6, 0.55, 0.05, mat(0x3A4650)); win.position.set(sx * w * 0.3, 1.5, d / 2 + 0.02); g.add(win); }
      g.position.set(x, 0, z); add(g);
    };
    house(o + 6, -5.2, 4, 3, 2.6, 0xEBDDC0); house(o + 13, -6.5, 3.4, 3, 2.4, 0xE3C9A2); house(o + 38, -5.5, 4.4, 3.2, 2.7, 0xD8E0D2); house(o + 47, -6.6, 3.6, 3, 2.5, 0xEBDDC0);
    { // temple tower
      const g = new THREE.Group();
      g.add(at(box(4.2, 1.8, 3.4, mat(0xA9774A)), 0, 0.9, 0));
      for (let k = 0; k < 6; k++) { const w = 3.6 - k * 0.5; g.add(at(box(w, 0.9, w * 0.78, mat(k % 2 ? 0xC8935E : 0xD3A46E)), 0, 2.25 + k * 0.9, 0)); for (let n = -1; n <= 1; n++) g.add(at(box(0.22, 0.5, 0.06, mat(0x6E4A30)), n * w * 0.3, 2.25 + k * 0.9, w * 0.39 + 0.01)); }
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16, 1, false, 0, Math.PI), mat(0xC8935E)); barrel.rotation.set(0, Math.PI / 2, Math.PI / 2); barrel.position.y = 7.4; g.add(barrel);
      for (let k = -1; k <= 1; k++) g.add(at(sphere(0.14, mat(0xE3B64A, { r: 0.35, m: 0.6 }), 10), k * 0.5, 8.0, 0));
      g.position.set(o + 22, 0, -12); add(g);
    }
    { // school with an old computer in a window
      const g = new THREE.Group();
      g.add(at(box(9, 3, 3.6, mat(0xEFE3C9)), 0, 1.5, 0)); g.add(at(box(9.6, 0.25, 4.6, mat(0xB7A27D)), 0, 3.1, 0.4));
      for (let k = 0; k < 6; k++) g.add(at(box(0.22, 3, 0.22, mat(0xE7D8BA)), -4.2 + k * 1.68, 1.5, 2.45));
      g.add(at(box(4.2, 0.6, 0.06, mat(0x2F5D7C)), 0, 2.55, 1.84));
      for (let k = 0; k < 4; k++) g.add(at(box(1.1, 0.9, 0.05, mat(0xBFD2D8, { r: 0.2 })), -3.2 + k * 2.1, 1.5, 1.81));
      g.add(at(box(0.5, 0.4, 0.45, mat(0xD8D2C4)), -1.1, 1.4, 1.5)); g.add(at(box(0.36, 0.28, 0.02, mat(0x8FD0E8, { e: 0x4FA0C8, ei: 0.6 })), -1.1, 1.42, 1.74));
      g.position.set(o + 30, 0, -7.2); add(g);
    }
    { // bus stand and a state bus
      const g = new THREE.Group(); g.add(at(box(4, 0.15, 1.8, mat(0x7C7062)), 0, 2.4, 0));
      for (const sx of [-1.8, 1.8]) g.add(at(box(0.12, 2.4, 0.12, mat(0x8C857A)), sx, 1.2, 0.7));
      g.position.set(o + 55, 0, -4.4); add(g);
      person(o + 54.2, -4.6, 0x7A2E35); person(o + 55.4, -4.6, 0xC9A23B); person(o + 56.2, -4.6, 0x3E7CB1);
      const bus = new THREE.Group(); bus.add(at(box(7.5, 1.3, 2.3, mat(0xB3352B, { r: 0.5 })), 0, 1.0, 0)); bus.add(at(box(7.5, 1.1, 2.3, mat(0xD9D4CA)), 0, 2.2, 0)); bus.add(at(box(7.0, 0.7, 2.32, mat(0x3A4650, { r: 0.2 })), 0, 2.2, 0));
      for (const x of [-2.6, 2.4]) for (const z of [-1.1, 1.1]) { const w = cyl(0.45, 0.45, 0.3, mat(0x1A1A1A)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.45, z); bus.add(w); }
      bus.position.set(o + 62, 0, -3.6); add(bus);
    }
    const poles: number[] = [];
    for (let i = 0; i < 8; i++) { const x = o + 2 + i * 9; add(at(cyl(0.07, 0.09, 6.5, mat(0x8C857A), 8), x, 3.25, -3.2)); add(at(box(0.08, 0.08, 1.6, mat(0x8C857A)), x, 6.1, -3.2)); poles.push(x); }
    const wireM = new THREE.LineBasicMaterial({ color: 0x3A332C });
    for (let i = 0; i < poles.length - 1; i++) for (const dz of [-0.7, 0, 0.7]) add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 17 }, (_, k) => new THREE.Vector3(poles[i] + (k / 16) * 9, 6.1 - Math.sin((k / 16) * Math.PI) * 0.45, -3.2 + dz))), wireM));
    [[-14, 7, 24], [8, 5, 20], [30, 8, 26], [54, 6, 22]].forEach(([x, h, w], i) => { const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(i % 2 ? 0x9FA58E : 0x8E977F, { r: 1 })); hill.scale.set(w, h, 6); hill.position.set(o + x, -0.2, -52 - (i % 2) * 6); add(hill); });
  }

  /* ===== 2 · lockdown, morning (70..140) ===== */
  {
    const o = ox(1);
    const cols = [0xD9CDB6, 0xC8B89C, 0xD2C3A6, 0xC9BFAE];
    for (let i = 0; i < 9; i++) {
      const x = o + 3 + i * 7.6, h = 6 + (i % 3) * 3;
      if (i === 4) continue;
      building(x, -6, 7, h, 5, cols[i % 4], { windows: 1, tank: i % 2 === 0, balcony: i % 2 === 1, shutter: true });
    }
    { // the one grocery shop that is open
      const x = o + 3 + 4 * 7.6; const g = new THREE.Group();
      g.add(at(box(7, 6, 5, mat(0xE8D5B0)), 0, 3, 0));
      g.add(at(box(7.4, 0.2, 1.8, mat(0x2F7A5B)), 0, 2.9, 3.2));
      g.add(at(box(6.4, 2.6, 0.2, mat(0x3A2A1C)), 0, 1.3, 2.4));
      const goods = [0xD98A3A, 0xB5432F, 0x6E8A4E, 0xE3C25A, 0x8A5A3C];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) g.add(at(box(0.5, 0.45, 0.3, mat(goods[(r + c) % 5])), -2.6 + c * 0.65, 0.5 + r * 0.7, 2.55));
      g.add(at(box(2.2, 1.0, 0.8, mat(0xC9A36B)), 0, 0.5, 3.2));
      g.position.set(x, 0, -6); add(g);
      person(x - 0.4, -3.4, 0x6E8A4E);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: textTexture('1 km') }));
      sign.position.set(x + 9, 2.3, -1.6); add(sign); add(at(cyl(0.05, 0.05, 2.2, mat(0x3A3530)), x + 9, 1.1, -1.65));
    }
    for (let k = 0; k < 6; k++) add(at(box(0.6, 0.18, 0.08, mat(k % 2 ? 0xC8382C : 0xF7F2E6)), o + 46 + k * 0.6, 1.0, 1.4));
    add(at(box(0.08, 1.0, 0.08, mat(0x555555)), o + 46, 0.5, 1.4)); add(at(box(0.08, 1.0, 0.08, mat(0x555555)), o + 49.2, 0.5, 1.4));
    for (let k = 0; k < 5; k++) add(at(sphere(0.12, mat(0x8A8E96), 8), o + 20 + k * 1.3, 0.12, -1.7 + (k % 2) * 0.3));
  }

  /* ===== 3 · Bengaluru, noon: the first startup (140..210) ===== */
  {
    const o = ox(2);
    // flyover on pillars behind
    add(at(box(SPAN, 0.9, 6, mat(0xB7B3A6)), o + SPAN / 2, 7.2, -18));
    add(at(box(SPAN, 0.8, 0.3, mat(0x9E9A8E)), o + SPAN / 2, 7.9, -15.1));
    for (let i = 0; i < 6; i++) add(at(box(1.2, 7, 1.6, mat(0x9E9A8E)), o + 6 + i * 12, 3.5, -18));
    // the giant windowless warehouse
    { const g = new THREE.Group(); g.add(at(box(26, 13, 12, mat(0x33302D, { r: 0.9 })), 0, 6.5, 0)); g.add(at(box(26.4, 0.6, 12.4, mat(0x24221F)), 0, 13.1, 0));
      for (let k = 0; k < 5; k++) g.add(at(box(3.4, 3.6, 0.1, mat(0x24221F)), -10 + k * 5, 1.8, 6.05));
      g.position.set(o + 48, 0, -12); add(g); }
    // the small shop in its shadow
    { const g = new THREE.Group(); g.add(at(box(5, 4, 4, mat(0xE8D5B0)), 0, 2, 0)); g.add(at(box(5.4, 0.15, 1.4, mat(0xC4562F)), 0, 3.0, 2.6));
      g.add(at(box(4.2, 2.6, 0.06, mat(0x7A6247)), 0, 1.3, 2.03)); g.position.set(o + 30, 0, -5.5); add(g); }
    // chai stall with steam and people
    { const g = new THREE.Group(); g.add(at(box(2.4, 1.0, 1.2, mat(0x6B4A2F)), 0, 0.5, 0)); g.add(at(box(2.6, 0.08, 1.4, mat(0x4E3523)), 0, 1.04, 0));
      g.add(at(cyl(0.22, 0.26, 0.35, mat(0xC9CED1, { r: 0.3, m: 0.7 })), -0.6, 1.25, 0));
      for (let k = 0; k < 5; k++) g.add(at(cyl(0.05, 0.04, 0.12, mat(0xF3E6C8)), 0.2 + k * 0.16, 1.14, 0.3));
      g.add(at(box(2.8, 0.06, 1.8, mat(0x2F6FA8)), 0, 2.4, 0)); for (const sx of [-1.3, 1.3]) g.add(at(box(0.06, 1.4, 0.06, mat(0x3A3A3A)), sx, 1.7, 0.85));
      g.position.set(o + 12, 0, -4.2); add(g); }
    person(o + 10.6, -3.2, 0x7A2E35); person(o + 13.6, -3.0, 0x3E7CB1); person(o + 14.4, -3.6, 0xD8B37A);
    auto(o + 40, 1.6, 0); auto(o + 22, -1.2, Math.PI); auto(o + 58, 1.4, 0);
    { const g = new THREE.Group(); for (const x of [-0.6, 0.6]) { const w = cyl(0.3, 0.3, 0.12, mat(0x151515)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.3, 0); g.add(w); }
      g.add(at(box(1.3, 0.12, 0.2, mat(0x2F6FA8)), 0, 0.6, 0)); g.add(at(box(0.6, 0.5, 0.5, mat(0xF2A93B)), -0.35, 0.95, 0)); g.position.set(o + 34, 0, -1.8); add(g); }
    tree(o + 4, -9, 1.3, 0x4E6B3A); tree(o + 64, -6, 1.2, 0x5A7A40);
  }

  /* ===== 4 · golden hour: a small startup (210..280) ===== */
  {
    const o = ox(3);
    const glass = lit(0xF6C88A);
    [[4, -16, 9, 26], [16, -22, 10, 34], [30, -18, 9, 22], [46, -22, 11, 38], [60, -17, 9, 28]].forEach(([x, z, w, h]) => {
      const g = new THREE.Group(); g.add(at(box(w, h, 8, mat(0x5C6E80, { r: 0.25, m: 0.4 })), 0, h / 2, 0));
      const items: Array<[number, number, number]> = [];
      for (let f = 0; f < Math.floor(h / 2.2) - 1; f++) for (let c = 0; c < Math.floor(w / 1.6); c++) if ((f * 7 + c * 3) % 5 !== 0) items.push([-w / 2 + 0.8 + c * 1.6, 1.4 + f * 2.2, 4.03]);
      const win = instanced(new THREE.BoxGeometry(1.1, 1.3, 0.04), glass, items); win.castShadow = false; g.add(win);
      g.position.set(o + x, 0, z); add(g);
    });
    // metro viaduct and a purple train
    add(at(box(SPAN, 0.7, 3, mat(0xC9BBA8)), o + SPAN / 2, 6.2, -9));
    for (let i = 0; i < 6; i++) add(at(cyl(0.6, 0.7, 6, mat(0xB2A592), 12), o + 5 + i * 12, 3, -9));
    { const coach = (x: number) => { train.add(at(box(9, 2.2, 2.4, mat(0xE9E4DA, { r: 0.4 })), x, 7.7, 0)); train.add(at(box(8.6, 0.8, 2.42, mat(0x7FA6BF, { r: 0.1 })), x, 7.95, 0)); train.add(at(box(9.02, 0.3, 2.42, mat(0x8E3B6A)), x, 7.1, 0)); };
      [0, 9.4, 18.8].forEach(coach); train.position.set(o + 10, 0, -9); add(train); }
    // café with people on laptops
    { const g = new THREE.Group(); g.add(at(box(8, 3.4, 4, mat(0x3A3330)), 0, 1.7, 0)); g.add(at(box(7, 2, 0.06, lit(0xF7C987)), 0, 1.6, 2.03)); g.add(at(box(8.4, 0.2, 1.6, mat(0x2A2420)), 0, 3.2, 2.6));
      g.position.set(o + 34, 0, -5.4); add(g);
      for (let k = 0; k < 3; k++) { person(o + 31.5 + k * 2.4, -3.6, [0x2A2420, 0x6B4A2F, 0x3E7CB1][k], 0.8); add(at(box(0.45, 0.04, 0.3, mat(0x9BB7C9, { e: 0x5F88A8, ei: 0.4 })), o + 31.5 + k * 2.4, 0.95, -3.2)); }
    }
    tree(o + 22, -4.6, 1.2, 0xC2452F); tree(o + 52, -5, 1.4, 0xC2452F); tree(o + 6, -4.8, 1.1, 0x4E6B3A);
  }

  /* ===== 5 · the UK at dusk, first rain (280..350) ===== */
  {
    const o = ox(4);
    { const g = new THREE.Group();
      g.add(at(box(28, 9, 8, mat(0x8E7B6A, { r: 0.95 })), 0, 4.5, 0));
      const shape = new THREE.Shape(); shape.moveTo(-14.6, 0); shape.lineTo(0, 4); shape.lineTo(14.6, 0); shape.lineTo(-14.6, 0);
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 8.6, bevelEnabled: false }), mat(0x5E4F44)); roof.position.set(0, 9, -4.3); roof.castShadow = true; g.add(roof);
      for (let k = 0; k < 8; k++) { const x = -12 + k * 3.4;
        g.add(at(box(2.0, 4.6, 0.1, lit(0xF2C27A)), x, 2.9, 4.05));
        const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 16, 1, false, -Math.PI / 2, Math.PI), lit(0xF2C27A)); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2; arch.position.set(x, 5.2, 4.06); g.add(arch);
        g.add(at(box(0.6, 6.6, 0.4, mat(0x9C8977)), x + 1.7, 3.3, 4.2)); }
      g.add(at(box(3.4, 6, 3.4, mat(0x7E6B5C)), 0, 12, 0)); g.add(at(cyl(1.0, 1.0, 0.1, mat(0xF3EEE4)), 0, 13, 1.75)); (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
      g.position.set(o + 34, 0, -14); add(g); }
    for (let i = 0; i < 6; i++) lamp(o + 6 + i * 12, -2.6);
    for (let k = 0; k < 3; k++) { person(o + 18 + k * 9, -4 - (k % 2), 0x2B2833); add(at(new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat([0x2F5D7C, 0x7A2E35, 0x2E4A3A][k])), o + 18 + k * 9, 1.9, -4 - (k % 2))); }
    [[-6, 6, 26], [24, 5, 22], [56, 7, 28]].forEach(([x, h, w]) => { const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4C4566, { r: 1 })); hill.scale.set(w, h, 6); hill.position.set(o + x, -0.2, -50); add(hill); });
  }
  const plane = new THREE.Group(); {
    const pm = mat(0xE9E6EE, { r: 0.4 });
    const body = capsule(0.5, 6, pm); body.rotation.z = Math.PI / 2; plane.add(body);
    const wing = box(1.4, 0.1, 9, pm); plane.add(wing); const tail = box(1.0, 1.6, 0.1, pm); tail.position.set(-3.2, 0.9, 0); plane.add(tail);
    plane.position.set(ox(4) + 10, 24, -40); add(plane);
  }

  /* ===== 6 · London at night (350..420) ===== */
  {
    const o = ox(5);
    // river beyond the embankment, lights reflected in it
    const river = new THREE.Mesh(new THREE.PlaneGeometry(SPAN, 26), new THREE.MeshStandardMaterial({ color: 0x0F1A2E, roughness: 0.15, metalness: 0.6 }));
    river.rotation.x = -Math.PI / 2; river.position.set(o + 34 + SPAN / 2, 0.03, -18); add(river);
    add(at(box(SPAN, 1.0, 0.6, mat(0x3A3E4E)), o + SPAN / 2, 0.5, -4.6));
    for (let i = 0; i < 40; i++) add(at(box(0.6 + R() * 1.2, 0.02, 0.08, lit(0xF2A93B)), o + 35 + R() * (SPAN - 35), 0.06, -8 - R() * 18));
    // far bank skyline
    const win = lit(0xF2A93B);
    for (let i = 0; i < 14; i++) { const w = 4 + R() * 4, h = 8 + R() * 22, x = o + i * 5.6;
      const g = new THREE.Group(); g.add(at(box(w, h, 5, mat(0x151C33, { r: 0.9 })), 0, h / 2, 0));
      const items: Array<[number, number, number]> = []; for (let f = 0; f < h / 1.8 - 1; f++) for (let c = 0; c < w / 1.2; c++) if (R() > 0.55) items.push([-w / 2 + 0.6 + c * 1.2, 1 + f * 1.8, 2.53]);
      if (items.length) { const inst = instanced(new THREE.BoxGeometry(0.5, 0.6, 0.04), win, items); inst.castShadow = false; g.add(inst); }
      g.position.set(x, 0, -36); add(g); }
    { const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1B2440)); dome.position.set(o + 46, 14, -40); add(dome); add(at(box(8, 14, 8, mat(0x151C33)), o + 46, 7, -40)); add(at(cyl(0.4, 0.4, 3, mat(0x1B2440)), o + 46, 19.4, -40)); }
    // terraced houses along our side
    for (let i = 0; i < 6; i++) { const x = o + 6 + i * 5.2; const g = new THREE.Group(); g.add(at(box(5, 7, 4, mat([0x3A2F35, 0x33303F, 0x3B3530, 0x2F3340][i % 4])), 0, 3.5, 0));
      for (const [wx, wy] of [[-1.2, 2], [1.2, 2], [-1.2, 4.8], [1.2, 4.8]]) g.add(at(box(1.0, 1.3, 0.05, (i + wx + wy) % 3 > 1 ? win : mat(0x4A4F63)), wx, wy, 2.03));
      g.add(at(box(1.0, 2.0, 0.05, mat(0x1E1E2A)), 0, 1.0, 2.03)); g.position.set(x, 0, -9); add(g); }
    for (let i = 0; i < 6; i++) lamp(o + 4 + i * 12, -4.2);
  }
  const bus = doubleDecker(ox(5) + 4, -1.5);

  /* ---------- weather and life ---------- */
  const rainGeo = new THREE.BufferGeometry();
  const rainPts = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) { rainPts[i * 3] = R() * 60 - 30; rainPts[i * 3 + 1] = R() * 14; rainPts[i * 3 + 2] = R() * 18 - 12; }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPts, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xC9D2E8, size: 0.06, transparent: true, opacity: 0 }));
  add(rain);

  const steam: THREE.Sprite[] = [];
  const steamTex = glowTexture('rgba(255,255,255,.9)', 'rgba(255,255,255,.35)');
  for (let k = 0; k < 4; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.5 })); s.scale.set(0.5, 0.5, 1); s.position.set(ox(2) + 11.4, 1.6 + k * 0.3, -4.2); add(s); steam.push(s); }

  // Lines of light from the phone at the end, drawn when he arrives.
  const lightLines: THREE.Line[] = [];
  const lm = new THREE.LineBasicMaterial({ color: 0xF2A93B, transparent: true, opacity: 0 });
  [[-6, 14, -36], [8, 20, -36], [22, 12, -36], [-14, 8, -9], [16, 17, -40]].forEach(([dx, y, z]) => {
    const start = new THREE.Vector3(END_X + 0.2, 1.3, 0.3), end = new THREE.Vector3(END_X + dx, y, z);
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 4, 0));
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), lm.clone()); line.geometry.setDrawRange(0, 0); add(line); lightLines.push(line);
  });

  return { nightMats, rain, plane, bus, train, steam, lightLines, stars };
}

import * as THREE from 'three';

// Small helpers shared by the character and the scenes.
const cache = new Map<string, THREE.MeshStandardMaterial>();

export const mat = (color: number, o: { r?: number; m?: number; e?: number; ei?: number } = {}) => {
  const key = `${color}-${o.r}-${o.m}-${o.e}-${o.ei}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.8, metalness: o.m ?? 0 });
    if (o.e !== undefined) { m.emissive = new THREE.Color(o.e); m.emissiveIntensity = o.ei ?? 1; }
    cache.set(key, m);
  }
  return m;
};

export const shadowy = <T extends THREE.Object3D>(o: T, cast = true, receive = false) => {
  o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = cast; c.receiveShadow = receive; } });
  return o;
};

export const box = (w: number, h: number, d: number, m: THREE.Material) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.castShadow = true; b.receiveShadow = true;
  return b;
};
export const capsule = (r: number, len: number, m: THREE.Material) => {
  const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), m);
  c.castShadow = true;
  return c;
};
export const sphere = (r: number, m: THREE.Material, seg = 20) => {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), m);
  s.castShadow = true;
  return s;
};
export const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 16) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  c.castShadow = true;
  return c;
};
export const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => { o.position.set(x, y, z); return o; };

// Deterministic randomness so every visitor sees the same town.
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Many copies of one shape in a single draw call.
export const instanced = (geo: THREE.BufferGeometry, m: THREE.Material, items: Array<[number, number, number, number?, number?]>) => {
  const inst = new THREE.InstancedMesh(geo, m, items.length);
  const d = new THREE.Object3D();
  items.forEach(([x, y, z, s = 1, ry = 0], i) => { d.position.set(x, y, z); d.scale.setScalar(s); d.rotation.set(0, ry, 0); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
  inst.castShadow = true; inst.receiveShadow = true;
  return inst;
};

// Fine surface grain (dirt, asphalt, grass) so big flat areas don't read as plastic.
let grainCanvas: HTMLCanvasElement | null = null;
const grain = () => {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d')!; const img = x.createImageData(256, 256); const R = rng(11);
  for (let i = 0; i < 256 * 256; i++) {
    const px = i % 256, py = (i / 256) | 0;
    const v = 200 + R() * 40 + Math.sin(px * 0.11) * Math.sin(py * 0.07) * 10;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0); grainCanvas = c; return c;
};
export const detailed = (m: THREE.MeshStandardMaterial, w: number, d: number, tile = 3) => {
  const out = m.clone();
  const t = new THREE.CanvasTexture(grain()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / tile, d / tile); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  out.map = t; out.bumpMap = t; out.bumpScale = 0.6; out.roughnessMap = t;
  return out;
};

import * as THREE from 'three';
import { rng } from './kit';
import { polygonize, blend, sphere, type Field } from './sculpt';
import { SPAN } from './scenes';
import { CELL, facadeSet, type Facade } from './facade';

// Fills each chapter out to the horizon: rows of textured buildings behind the street, full tree canopies and
// road markings, then weathers every surface so nothing reads as a flat untextured block.

/* ---------- trees with full, lumpy canopies ---------- */
function canopyGeometry(seed: number) {
  const R = rng(seed);
  const blobs: Field[] = [];
  for (let i = 0; i < 7; i++) {
    const a = R() * Math.PI * 2, d = R() * 0.9;
    blobs.push(sphere([Math.cos(a) * d, 0.2 + R() * 0.9, Math.sin(a) * d], 0.55 + R() * 0.45));
  }
  const f = blend(0.45, ...blobs);
  const lumpy: Field = (x, y, z) => f(x, y, z) + 0.06 * Math.sin(x * 7.3 + z * 3.1) * Math.sin(y * 6.7 + x * 2.3) + 0.04 * Math.sin(z * 11 + y * 9);
  const g = polygonize(lumpy, [-2, -0.6, -2], [2, 2.4, 2], 0.11);
  g.computeBoundingSphere();
  return g;
}

/* ---------- the dressing, chapter by chapter ---------- */
interface Plan { facades: Facade[]; tint: number[]; floors: [number, number]; rows: number[]; trees: number; leaf: number[]; markings: boolean }
const PLANS: Plan[] = [
  { facades: ['plaster'], tint: [0xF2E3C8, 0xE8D2B0, 0xD9E4D8, 0xF0D9C0], floors: [1, 2], rows: [], trees: 14, leaf: [0x4E7A3A, 0x5E8A3E, 0x3F6232], markings: false },
  { facades: ['plaster'], tint: [0xE9DCC6, 0xD8E0E4, 0xF0E0C8, 0xE4D0D8, 0xCFDCCB], floors: [3, 5], rows: [-20, -32], trees: 10, leaf: [0x4E7A3A, 0x5B7F4E], markings: true },
  { facades: ['plaster', 'glass'], tint: [0xEADFCB, 0xD9D4E6, 0xF2DDBB, 0xCFE0D6], floors: [3, 7], rows: [-22, -34], trees: 14, leaf: [0x3F6E35, 0x4E7A3A], markings: true },
  { facades: ['glass', 'plaster'], tint: [0xFFFFFF, 0xE8E0D4, 0xD6E2EC], floors: [4, 10], rows: [-30, -42], trees: 16, leaf: [0x4E6843, 0x797047], markings: true },
  { facades: ['brick'], tint: [0xFFFFFF, 0xF0E4DC, 0xE0D4CC], floors: [2, 4], rows: [-24, -34], trees: 14, leaf: [0x51633A, 0x6B6A3A, 0x7A5A32], markings: true },
  { facades: ['brick', 'glass'], tint: [0xD8D0D0, 0xC8C8D4, 0xE0D8D0], floors: [3, 8], rows: [], trees: 12, leaf: [0x2E3E2A, 0x34452E], markings: true }, // across the river is the real skyline, in the backdrop
];

export function dressWorld(scene: THREE.Scene, nightMats: THREE.MeshStandardMaterial[]) {
  const R = rng(91);
  const facadeMat = facadeSet(nightMats);
  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const d = new THREE.Object3D(), col = new THREE.Color();

  // Buildings: rows behind the street, heights stepping up and down like a real block.
  const lists: Record<Facade, Array<{ x: number; z: number; w: number; h: number; dd: number; tint: number }>> = { plaster: [], brick: [], glass: [], stone: [], concrete: [], cladding: [] };
  PLANS.forEach((p, i) => {
    const o = i * SPAN;
    p.rows.forEach((z, ri) => {
      for (let x = o - 2; x < o + SPAN; ) {
        const kind = p.facades[Math.floor(R() * p.facades.length)];
        const w = 5 + R() * 7, fl = p.floors[0] + Math.floor(R() * (p.floors[1] - p.floors[0] + 1)) + ri;
        const h = fl * CELL[kind][1] + 0.6;
        lists[kind].push({ x: x + w / 2, z: z - R() * 3, w, h, dd: 6 + R() * 4, tint: p.tint[Math.floor(R() * p.tint.length)] });
        x += w + (i === 0 ? 3 + R() * 6 : R() < 0.2 ? 1.5 : 0.2);
      }
    });
  });
  (Object.keys(lists) as Facade[]).forEach((kind) => {
    const L = lists[kind]; if (!L.length) return;
    const inst = new THREE.InstancedMesh(unit, facadeMat[kind], L.length);
    L.forEach((b, n) => {
      d.position.set(b.x, 0, b.z); d.scale.set(b.w, b.h, b.dd); d.rotation.set(0, 0, 0); d.updateMatrix();
      inst.setMatrixAt(n, d.matrix); inst.setColorAt(n, col.setHex(b.tint));
    });
    inst.castShadow = false; inst.receiveShadow = true;
    scene.add(inst);
  });

  // Trees: three canopy shapes, instanced with varied size, tint and turn.
  const canopies = [canopyGeometry(11), canopyGeometry(23), canopyGeometry(37)];
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5A4632, roughness: 1 });
  const trees: Array<{ x: number; z: number; s: number; leaf: number; v: number }> = [];
  PLANS.forEach((p, i) => {
    const o = i * SPAN;
    for (let k = 0; k < p.trees; k++) trees.push({ x: o + R() * SPAN, z: -6.5 - R() * 14, s: 0.9 + R() * 0.8, leaf: p.leaf[Math.floor(R() * p.leaf.length)], v: k % 3 });
  });
  canopies.forEach((geo, v) => {
    const mine = trees.filter((t) => t.v === v);
    const crown = new THREE.InstancedMesh(geo, leafMat, mine.length), trunk = new THREE.InstancedMesh(trunkGeo, trunkMat, mine.length);
    mine.forEach((t, n) => {
      const trunkH = 2.2 * t.s;
      d.position.set(t.x, trunkH, t.z); d.scale.setScalar(t.s * 1.15); d.rotation.set(0, t.x * 1.7, 0); d.updateMatrix();
      crown.setMatrixAt(n, d.matrix); crown.setColorAt(n, col.setHex(t.leaf).multiplyScalar(0.85 + (t.x * 13.1 % 1) * 0.3));
      d.position.set(t.x, 0, t.z); d.scale.set(t.s, trunkH + 0.4, t.s); d.updateMatrix(); trunk.setMatrixAt(n, d.matrix);
    });
    crown.castShadow = true; crown.receiveShadow = true; trunk.castShadow = true;
    scene.add(crown, trunk);
  });

  // Road markings: dashed centre line and a kerb edge in the city chapters.
  const dash = new THREE.PlaneGeometry(1.6, 0.1); dash.rotateX(-Math.PI / 2);
  const paint = new THREE.MeshStandardMaterial({ color: 0xE8E2D2, roughness: 0.7 });
  const dashes: number[] = [];
  PLANS.forEach((p, i) => { if (p.markings) for (let x = i * SPAN + 1; x < (i + 1) * SPAN; x += 4) dashes.push(x); });
  const lines = new THREE.InstancedMesh(dash, paint, dashes.length);
  dashes.forEach((x, n) => { d.position.set(x, 0.025, 0.9); d.scale.setScalar(1); d.rotation.set(0, 0, 0); d.updateMatrix(); lines.setMatrixAt(n, d.matrix); });
  lines.receiveShadow = true; scene.add(lines);
}

/* ---------- weathering: every surface gets grime, colour variation and contact darkening ---------- */
const NOISE = `
  float wh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float wn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(wh(i), wh(i + vec3(1,0,0)), f.x), mix(wh(i + vec3(0,1,0)), wh(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(wh(i + vec3(0,0,1)), wh(i + vec3(1,0,1)), f.x), mix(wh(i + vec3(0,1,1)), wh(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float wf(vec3 p){ return wn(p) * 0.55 + wn(p * 2.3) * 0.3 + wn(p * 5.1) * 0.15; }`;

export function weather(scene: THREE.Scene) {
  const done = new Set<THREE.Material>();
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m || !(m as THREE.MeshStandardMaterial).isMeshStandardMaterial || done.has(m) || m.transparent) return;
    if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0 && !m.emissiveMap) return; // lit windows and lamps stay clean
    done.add(m);
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          vec4 wpw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wpw = instanceMatrix * wpw;
          #endif
          vWPos = (modelMatrix * wpw).xyz;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;${NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wN = wf(vWPos * 0.45);
          float wG = smoothstep(0.0, 1.4, vWPos.y);
          float wS = smoothstep(0.62, 0.95, wn(vec3(vWPos.x * 2.6 + vWPos.z * 2.6, vWPos.y * 0.12, 0.0)));
          diffuseColor.rgb *= mix(0.74, 1.0, wG) * (0.84 + 0.3 * wN) * (1.0 - 0.1 * wS);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = clamp(roughnessFactor * (0.88 + 0.24 * wN), 0.04, 1.0);`);
    };
    const key = m.customProgramCacheKey.bind(m);
    m.customProgramCacheKey = () => `weathered-${key()}`;
    m.needsUpdate = true;
  });
}

/* ---------- painted backdrops: one generated panorama per chapter, far behind the street ---------- */
// name, and where its horizon sits as a fraction from the top of the image
const BACKDROPS: Array<[string, number]> = [['dawn', 0.45], ['morning', 0.44], ['noon', 0.31], ['golden', 0.39], ['dusk', 0.37], ['night', 0.55]];
const BD_WIDTH = 190, BD_ASPECT = 1376 / 768, BD_Z = -100;

export function createBackdrops(scene: THREE.Scene, base: string, centres: number[]) {
  const planes: Array<THREE.Mesh | null> = BACKDROPS.map(() => null);
  const geo = new THREE.PlaneGeometry(BD_WIDTH, BD_WIDTH / BD_ASPECT);
  const loader = new THREE.TextureLoader();
  const load = (i: number) => new Promise<void>((done) => {
    loader.load(`${base}backdrops/${BACKDROPS[i][0]}.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
      m.position.set(centres[i], 0, BD_Z); m.visible = false; scene.add(m); planes[i] = m;
      // London's backdrop has the real skyline, so the drawn one across the river steps aside
      if (BACKDROPS[i][0] === 'night') scene.traverse((o) => { if (o.userData.farBank) o.visible = false; });
      done();
    }, undefined, () => done());
  });
  return {
    /** Load the given chapter first, then the rest, one at a time. */
    start(first: number) { const order = [first, ...BACKDROPS.map((_, i) => i).filter((i) => i !== first)]; order.reduce((p, i) => p.then(() => load(i)), Promise.resolve()); },
    /** Show the current chapter's backdrop with its horizon at the camera's eye level. */
    update(ch: number, eyeY: number) {
      planes.forEach((m, i) => {
        if (!m) return;
        m.visible = i === ch;
        if (m.visible) m.position.y = eyeY - (BD_WIDTH / BD_ASPECT) * (0.5 - BACKDROPS[i][1]);
      });
    },
  };
}

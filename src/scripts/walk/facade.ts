import * as THREE from 'three';
import { rng } from './kit';

// Facades drawn in code: a wall texture with windows, plus an emissive map for the lit ones.
// Instanced unit boxes get world-scaled UVs, so a window keeps its size on any building.
export type Facade = 'plaster' | 'brick' | 'glass' | 'stone' | 'concrete' | 'cladding';
// Metres covered by one window bay (the texture holds 4 x 4 bays).
export const CELL: Record<Facade, [number, number]> = { plaster: [3.2, 3.1], brick: [2.6, 2.9], glass: [1.8, 3.6], stone: [3.4, 4.4], concrete: [3.0, 3.4], cladding: [3.0, 3.0] };
const SEEDS: Record<Facade, number> = { plaster: 3, brick: 5, glass: 9, stone: 13, concrete: 17, cladding: 21 };

function facadeTextures(kind: Facade, seed: number) {
  const S = kind === 'glass' ? 512 : 1024, E = 256, cols = 4, rows = 4, cw = 128, ch = 128, W = 512;
  const mk = (n: number) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d')!; g.scale(n / W, n / W); return [c, g] as const; };
  const [c, x] = mk(S), [e, ex] = mk(E);
  const R = rng(seed);
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, W);
  const speckle = (n: number, rgb: string, a: number, big: number) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${rgb},${R() * a})`; x.fillRect(R() * W, R() * W, 1 + R() * big, 1 + R() * big); } };
  const streaks = (n: number, rgb: string, a: number, len: number) => { for (let i = 0; i < n; i++) { const g = x.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.save(); x.translate(R() * W, R() * W); x.fillRect(0, 0, 1.5 + R() * 3, len); x.restore(); } };
  if (kind === 'plaster') {
    x.fillStyle = '#ECE6DA'; x.fillRect(0, 0, W, W);
    speckle(5000, '120,105,80', 0.05, 5); streaks(40, '70,60,45', 0.09, 90); // rain streaks
  } else if (kind === 'brick') {
    x.fillStyle = '#C9B8A6'; x.fillRect(0, 0, W, W); // mortar
    for (let y = 0; y < W; y += 12) for (let bx = (y / 12) % 2 ? -14 : 0; bx < W; bx += 28) {
      const t = 0.85 + R() * 0.3; x.fillStyle = `rgb(${Math.round(150 * t)},${Math.round(76 * t)},${Math.round(58 * t)})`; x.fillRect(bx + 1, y + 1, 26, 10);
    }
    speckle(500, '40,28,22', 0.12, 8);
  } else if (kind === 'stone') {
    x.fillStyle = '#C4B7A0'; x.fillRect(0, 0, W, W); // joints
    for (let y = 0; y < W; y += 10) for (let bx = (y / 10) % 2 ? -18 : 0; bx < W; bx += 36) { const t = 0.96 + R() * 0.07; x.fillStyle = `rgb(${Math.round(222 * t)},${Math.round(208 * t)},${Math.round(184 * t)})`; x.fillRect(bx + 1, y + 1, 34, 8); }
    speckle(4000, '90,72,52', 0.06, 5); streaks(30, '60,50,40', 0.08, 100);
  } else if (kind === 'concrete') {
    x.fillStyle = '#B7B1A6'; x.fillRect(0, 0, W, W);
    speckle(6000, '70,64,54', 0.07, 5); speckle(2500, '230,226,216', 0.08, 4); streaks(30, '60,55,45', 0.1, 110);
  } else if (kind === 'cladding') {
    x.fillStyle = '#4A4743'; x.fillRect(0, 0, W, W);
    for (let px = 0; px < W; px += 8) { x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(px, 0, 2, W); x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(px + 5, 0, 3, W); } // corrugation
    streaks(26, '120,70,40', 0.22, 120); // rust runs
    for (let k = 1; k < 4; k++) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, k * ch - 1, W, 3); } // panel seams
  } else {
    x.fillStyle = '#5E7385'; x.fillRect(0, 0, W, W);
  }
  const GLAZE = ['#27303A', '#2D3640', '#34404C'];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const ox = k * cw, oy = r * ch;
    const lit = R() < 0.32, curtain = R() < 0.4;
    if (kind === 'cladding') continue;
    if (kind === 'glass') {
      const g = x.createLinearGradient(ox, oy, ox + cw, oy + ch); g.addColorStop(0, '#8FA7B8'); g.addColorStop(1, '#3E5162');
      x.fillStyle = g; x.fillRect(ox + 4, oy + 4, cw - 8, ch - 14);
      x.fillStyle = '#2A3540'; x.fillRect(ox, oy + ch - 10, cw, 10); // spandrel
      x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.moveTo(ox + 14, oy + 4); x.lineTo(ox + 44, oy + 4); x.lineTo(ox + 14, oy + ch - 10); x.closePath(); x.fill(); // sky glint
      if (lit) { ex.fillStyle = '#FFD9A0'; ex.fillRect(ox + 4, oy + 4, cw - 8, ch - 14); }
      continue;
    }
    if (kind === 'concrete') {
      const wx = ox + 4, ww = cw - 8, wy = oy + ch * 0.26, wh = ch * 0.44;
      x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(ox, oy + ch - 12, cw, 3); x.fillStyle = '#CFCABF'; x.fillRect(ox, oy + ch - 10, cw, 10); // floor slab edge
      x.fillStyle = '#4A4D50'; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6); // aluminium frame
      const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, lit ? '#C9A56E' : curtain ? '#6D7A82' : '#55687A'); g.addColorStop(1, lit ? '#E2BE84' : curtain ? '#4F5C64' : '#26333F');
      x.fillStyle = g; x.fillRect(wx, wy, ww, wh); x.fillStyle = '#4A4D50'; x.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      if (R() < 0.3) { x.fillStyle = 'rgba(50,40,30,0.2)'; x.fillRect(wx + 10, wy + wh + 26, 26, 30); x.fillStyle = '#8A8D8E'; x.fillRect(wx + 6, wy + wh + 8, 34, 18); x.fillStyle = '#5C5F61'; x.fillRect(wx + 8, wy + wh + 11, 30, 3); } // AC unit, stained below
      if (lit) { ex.fillStyle = '#FFCF8A'; ex.fillRect(wx, wy, ww, wh); }
      continue;
    }
    if (kind === 'stone') {
      const ww = cw * 0.4, wh = ch * 0.62, wx = ox + (cw - ww) / 2, wy = oy + ch * 0.16;
      x.fillStyle = '#E4DAC6'; x.fillRect(wx - 7, wy - 9, ww + 14, wh + 16); // dressed stone surround
      x.fillStyle = 'rgba(0,0,0,0.14)'; x.fillRect(wx - 7, wy + wh + 7, ww + 14, 3);
      x.fillStyle = lit ? '#E9C58A' : curtain ? '#7A6A5A' : GLAZE[(R() * 3) | 0]; x.fillRect(wx, wy, ww, wh);
      x.fillStyle = '#EFE8DA'; x.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); for (const f of [0.34, 0.68]) x.fillRect(wx, wy + wh * f - 1.5, ww, 3); // painted sash bars
      x.fillStyle = 'rgba(80,66,48,0.28)'; x.fillRect(ox, oy + ch - 5, cw, 5); x.fillStyle = '#E4DAC6'; x.fillRect(ox, oy + ch - 9, cw, 4); // string course
      if (lit) { ex.fillStyle = '#FFCF8A'; ex.fillRect(wx, wy, ww, wh); }
      continue;
    }
    const wx = ox + cw * 0.26, wy = oy + ch * 0.2, ww = cw * 0.48, wh = ch * 0.56;
    if (kind === 'brick') { x.fillStyle = '#EEE9DF'; x.fillRect(wx - 5, wy - 5, ww + 10, wh + 10); } // painted sash frame
    else { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(wx - 3, wy + wh, ww + 6, 6); } // sill shadow
    x.fillStyle = lit ? '#E9C58A' : curtain ? '#7A6A5A' : '#2D3640'; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = kind === 'brick' ? '#EEE9DF' : '#5B4A3C';
    x.fillRect(wx + ww / 2 - 2, wy, 4, wh); x.fillRect(wx, wy + wh / 2 - 2, ww, 4); // glazing bars
    if (kind === 'plaster' && R() < 0.5) { x.fillStyle = ['#3E7C6A', '#2F5D7C', '#8A4B32'][Math.floor(R() * 3)]; x.fillRect(wx - 14, wy, 12, wh); x.fillRect(wx + ww + 2, wy, 12, wh); } // shutters
    if (kind === 'plaster' && R() < 0.35) { x.fillStyle = '#4A4038'; x.fillRect(wx - 10, wy + wh + 8, ww + 20, 5); } // balcony rail
    if (lit) { ex.fillStyle = '#FFCF8A'; ex.fillRect(wx, wy, ww, wh); }
  }
  // keep a plain wall texel at the corner, used for roofs and edges
  x.fillStyle = { glass: '#4C5E6E', brick: '#8E4A3A', plaster: '#E4DCCD', stone: '#CFC2AA', concrete: '#B2ACA1', cladding: '#3E3B37' }[kind]; x.fillRect(0, 0, 4, 4);
  const map = new THREE.CanvasTexture(c), emit = new THREE.CanvasTexture(e);
  for (const t of [map, emit]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; }
  return { map, emit, cols, rows };
}

function facadeMaterial(kind: Facade, nightMats: THREE.MeshStandardMaterial[]) {
  const { map, emit, cols, rows } = facadeTextures(kind, SEEDS[kind]);
  const glass = kind === 'glass', metal = kind === 'cladding';
  const m = new THREE.MeshStandardMaterial({ map, emissiveMap: emit, emissive: 0xffffff, emissiveIntensity: 0.06, roughness: glass ? 0.25 : metal ? 0.6 : 0.9, metalness: glass ? 0.4 : metal ? 0.15 : 0 });
  const [cw, chh] = CELL[kind];
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
      #ifdef USE_INSTANCING
        vec3 sz = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec2 faceSize = abs(normal.x) > 0.5 ? sz.zy : abs(normal.z) > 0.5 ? sz.xy : vec2(0.0);
        vec2 cells = faceSize / vec2(${cw.toFixed(2)}, ${chh.toFixed(2)}) / vec2(${cols}.0, ${rows}.0);
        vec2 u = abs(normal.y) > 0.5 ? vec2(0.002, 0.998) : uv * cells;
        vMapUv = u; vEmissiveMapUv = u;
      #endif`);
  };
  m.customProgramCacheKey = () => `facade-${kind}`;
  nightMats.push(m);
  return m;
}

/** The shared facade materials for one world, created once. */
export type FacadeSet = Record<Facade, THREE.MeshStandardMaterial>;
const sets = new WeakMap<object, FacadeSet>();
export function facadeSet(nightMats: THREE.MeshStandardMaterial[]): FacadeSet {
  let s = sets.get(nightMats);
  if (!s) {
    s = {} as FacadeSet;
    for (const k of Object.keys(CELL) as Facade[]) s[k] = facadeMaterial(k, nightMats);
    sets.set(nightMats, s);
  }
  return s;
}

let unit: THREE.BoxGeometry | null = null;
/** A near building: base on the ground at its origin, w wide, h tall, d deep, wearing a facade. */
export function facadeBlock(set: FacadeSet, kind: Facade, w: number, h: number, d: number, tint = 0xffffff) {
  if (!unit) { unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0); }
  const m = new THREE.InstancedMesh(unit, set[kind], 1);
  m.setMatrixAt(0, new THREE.Matrix4().makeScale(w, h, d)); m.setColorAt(0, new THREE.Color(tint));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

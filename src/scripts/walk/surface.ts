import * as THREE from 'three';
import { rng } from './kit';

// Ground that reads as its material: asphalt, paving, grass and packed dirt.
// Each is drawn once into a tiling colour map, a normal map worked out from a height field, and a roughness map.
export type Surface = 'asphalt' | 'paving' | 'grass' | 'dirt';
/** Metres covered by one texture tile. */
export const TILE: Record<Surface, number> = { asphalt: 4, paving: 4.8, grass: 4, dirt: 4 };
const SIZE: Record<Surface, number> = { asphalt: 1024, paving: 1024, grass: 512, dirt: 512 };
// Wheel paths and ruts sit at these heights in the tile (road is 3.4 m wide, lanes about 1.7 m apart).
const LANES = [0.2125, 0.6375];

interface Raw { col: Float32Array; h: Float32Array; rough: Float32Array } // col is rgb 0..1 per pixel

// Smooth value noise that wraps at the tile edge, 0..1.
const noise = (n: number, cells: number, R: () => number) => {
  const g = Float32Array.from({ length: cells * cells }, R), out = new Float32Array(n * n), k = cells / n;
  const xi = new Int32Array(n), xj = new Int32Array(n), xs = new Float32Array(n);
  for (let x = 0; x < n; x++) { const f = x * k, i = f | 0, t = f - i; xi[x] = i; xj[x] = (i + 1) % cells; xs[x] = t * t * (3 - 2 * t); }
  for (let y = 0; y < n; y++) {
    const f = y * k, i = f | 0, t = f - i, s = t * t * (3 - 2 * t), r0 = i * cells, r1 = ((i + 1) % cells) * cells;
    for (let x = 0; x < n; x++) { const a = g[r0 + xi[x]] + (g[r0 + xj[x]] - g[r0 + xi[x]]) * xs[x], b = g[r1 + xi[x]] + (g[r1 + xj[x]] - g[r1 + xi[x]]) * xs[x]; out[y * n + x] = a + (b - a) * s; }
  }
  return out;
};
const fbm = (n: number, R: () => number, o: Array<[number, number]>) => {
  const out = new Float32Array(n * n); let sum = 0;
  for (const [cells, w] of o) { const a = noise(n, cells, R); for (let i = 0; i < out.length; i++) out[i] += a[i] * w; sum += w; }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
};
const sm = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

function draw(kind: Surface): Raw {
  const n = SIZE[kind], R = rng({ asphalt: 31, paving: 37, grass: 41, dirt: 43 }[kind]);
  const N = n * n, col = new Float32Array(N * 3), h = new Float32Array(N), rough = new Float32Array(N).fill(0.9);
  const wrap = (v: number) => ((v % n) + n) % n;
  const tone = (i: number, r: number, g: number, b: number) => { col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b; };
  const mul = (i: number, k: number) => { col[i * 3] *= k; col[i * 3 + 1] *= k; col[i * 3 + 2] *= k; };
  // A soft round bump (a stone, a chip) or dent; dh is its height, k how much it lightens or darkens.
  const blob = (cx: number, cy: number, r: number, dh: number, k: number) => {
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      const d = (dx * dx + dy * dy) / (r * r); if (d > 1) continue;
      const i = wrap(cy + dy) * n + wrap(cx + dx), f = 1 - d; h[i] += dh * Math.sqrt(f); mul(i, 1 + (k - 1) * f);
    }
  };
  const lane = (v: number) => Math.min(Math.abs(v - LANES[0]), Math.abs(v - LANES[1])); // distance from the nearest wheel path, in tile units
  if (kind === 'asphalt') {
    const p = fbm(n, R, [[3, 0.5], [8, 0.3], [21, 0.2]]);
    for (let i = 0; i < N; i++) { tone(i, 0.86, 0.86, 0.87); mul(i, (0.92 + (p[i] - 0.5) * 0.2) * (p[i] > 0.66 ? 0.88 : 1) * (0.95 + R() * 0.1)); h[i] = R() * 0.25; }
    for (let i = 0; i < 16000; i++) { const r = 0.8 + R() * 1.8; blob((R() * n) | 0, (R() * n) | 0, r, 0.5 + R() * 0.5, R() < 0.5 ? 0.7 + R() * 0.1 : 1.1 + R() * 0.15); } // aggregate
    for (let c = 0; c < 6; c++) { // cracks: a wandering line, mostly along the road, with a branch or two
      let x = R() * n, y = R() * n, a = (R() < 0.7 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.6;
      for (let s = 0; s < 500; s++) { a += (R() - 0.5) * 0.35; x += Math.cos(a); y += Math.sin(a); for (let w = 0; w < 2; w++) { const i = wrap(y + w) * n + wrap(x); h[i] -= 1; mul(i, 0.55); } if (R() < 0.004) { /* branch */ let bx = x, by = y, ba = a + (R() - 0.5) * 1.6; for (let t = 0; t < 90; t++) { ba += (R() - 0.5) * 0.4; bx += Math.cos(ba); by += Math.sin(ba); const i = wrap(by) * n + wrap(bx); h[i] -= 0.8; mul(i, 0.6); } } }
    }
    for (let y = 0; y < n; y++) { const v = 1 - y / n, f = 1 - sm(0, 0.075, lane(v)); for (let x = 0; x < n; x++) { const i = y * n + x; rough[i] = 0.92 - f * 0.28 + (p[i] - 0.5) * 0.1; mul(i, 1 - f * 0.07); h[i] *= 1 - f * 0.5; } } // polished wheel paths
    for (let i = 0; i < 14; i++) { const cx = (R() * n) | 0, cy = ((1 - LANES[i % 2] + (R() - 0.5) * 0.04) * n) | 0; blob(cx, cy, 6 + R() * 8, 0, 0.7); } // oil drips
  } else if (kind === 'paving') {
    const p = fbm(n, R, [[4, 0.5], [12, 0.5]]), sl = n / 8, J = 4;
    for (let sy = 0; sy < 8; sy++) for (let sx = 0; sx < 8; sx++) {
      const t = 0.9 + R() * 0.15, tr = 1 + (R() - 0.5) * 0.05, tb = 1 + (R() - 0.5) * 0.06, gx = (R() - 0.5) * 0.3, gy = (R() - 0.5) * 0.3;
      for (let y = 0; y < sl; y++) for (let x = 0; x < sl; x++) {
        const i = (sy * sl + y) * n + sx * sl + x, edge = Math.min(x, y, sl - 1 - x, sl - 1 - y), pv = p[i];
        tone(i, 0.9 * t * tr, 0.9 * t, 0.9 * t * tb); mul(i, (0.93 + (pv - 0.5) * 0.14) * (0.97 + R() * 0.06));
        h[i] = (x / sl - 0.5) * gx + (y / sl - 0.5) * gy + (pv - 0.5) * 0.3 + R() * 0.08; rough[i] = 0.82 + (pv - 0.5) * 0.15;
        if (edge < J) { mul(i, 0.7 + edge * 0.05); h[i] = -1.2; rough[i] = 1; } else if (edge < J + 2) { mul(i, 1.05); h[i] -= 0.25 * (J + 2 - edge) / 2; } // joint, then a worn arris
      }
    }
    for (let i = 0; i < 9000; i++) blob((R() * n) | 0, (R() * n) | 0, 0.8 + R() * 1.4, R() < 0.5 ? -0.3 : 0.3, R() < 0.6 ? 0.82 : 1.1);
    for (let i = 0; i < 70; i++) blob((R() * n) | 0, (R() * n) | 0, 2 + R() * 3, 0, 0.6); // dark gum spots
  } else if (kind === 'grass') {
    const p = fbm(n, R, [[3, 0.4], [7, 0.35], [17, 0.25]]), dry = fbm(n, R, [[4, 0.6], [11, 0.4]]);
    for (let i = 0; i < N; i++) {
      const d = sm(0.52, 0.72, dry[i]), k = 0.78 + p[i] * 0.4;
      tone(i, (0.78 + 0.22 * d) * k, (0.92 - 0.02 * d) * k, (0.66 - 0.06 * d) * k); h[i] = R() * 0.2; rough[i] = 0.95;
    }
    for (let b = 0; b < 26000; b++) { // blades: short strokes leaning mostly upright
      let x = R() * n, y = R() * n; const a = -Math.PI / 2 + (R() - 0.5) * 1.3, len = 3 + R() * 5, lit = R() < 0.5 ? 0.78 : 1.2, dry2 = R() < 0.12;
      for (let s = 0; s < len; s++) { const i = wrap(y) * n + wrap(x); mul(i, 1 + (lit - 1) * (1 - s / len * 0.4)); if (dry2) { col[i * 3] *= 1.12; col[i * 3 + 2] *= 0.7; } h[i] += 0.5; x += Math.cos(a); y += Math.sin(a); }
    }
    for (let i = 0; i < 110; i++) blob((R() * n) | 0, (R() * n) | 0, 1.2 + R(), 0.4, 1.3); // clover and daisy flecks
  } else {
    const p = fbm(n, R, [[3, 0.4], [9, 0.35], [23, 0.25]]), dust = fbm(n, R, [[4, 0.6], [10, 0.4]]);
    for (let y = 0; y < n; y++) {
      const v = 1 - y / n, l = lane(v), rut = 1 - sm(0, 0.085, l), berm = sm(0.085, 0.13, l) * (1 - sm(0.13, 0.2, l));
      for (let x = 0; x < n; x++) {
        const i = y * n + x, d = sm(0.5, 0.75, dust[i]);
        tone(i, 0.93 + 0.07 * d, 0.86 + 0.09 * d, 0.76 + 0.12 * d); mul(i, (0.88 + p[i] * 0.22) * (1 - rut * 0.12) * (0.96 + R() * 0.08));
        h[i] = -rut * 1.6 + berm * 0.5 + R() * 0.2; rough[i] = 0.98 - rut * 0.08;
      }
    }
    for (let i = 0; i < 1500; i++) { const r = 1.2 + R() * 2.8; blob((R() * n) | 0, (R() * n) | 0, r, 0.7 + R() * 0.8, 0.72 + R() * 0.45); } // pebbles
    for (let i = 0; i < 5000; i++) blob((R() * n) | 0, (R() * n) | 0, 0.7 + R() * 0.8, 0.4, R() < 0.5 ? 0.85 : 1.1);
  }
  return { col, h, rough };
}

function bake(kind: Surface, strength: number) {
  const { col, h, rough } = draw(kind), n = SIZE[kind];
  const cv = (w: number) => { const c = document.createElement('canvas'); c.width = c.height = w; return c; };
  const cc = cv(n), nc = cv(n), rc = cv(256);
  const ci = new ImageData(n, n), ni = new ImageData(n, n), ri = new ImageData(256, 256);
  const at = (x: number, y: number) => h[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, o = i * 4;
    ci.data[o] = col[i * 3] * 255; ci.data[o + 1] = col[i * 3 + 1] * 255; ci.data[o + 2] = col[i * 3 + 2] * 255; ci.data[o + 3] = 255;
    // Normal from the height differences; canvas y runs down while the texture's v runs up, so dy flips.
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1);
    ni.data[o] = (-dx / l * 0.5 + 0.5) * 255; ni.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; ni.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; ni.data[o + 3] = 255;
  }
  const step = n / 256;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = Math.min(1, rough[((y * step) | 0) * n + ((x * step) | 0)]) * 255, o = (y * 256 + x) * 4; ri.data[o] = ri.data[o + 1] = ri.data[o + 2] = v; ri.data[o + 3] = 255; }
  cc.getContext('2d')!.putImageData(ci, 0, 0); nc.getContext('2d')!.putImageData(ni, 0, 0); rc.getContext('2d')!.putImageData(ri, 0, 0);
  const tex = (c: HTMLCanvasElement, srgb: boolean) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cc, true), normalMap: tex(nc, false), roughnessMap: tex(rc, false) };
}

const STRENGTH: Record<Surface, number> = { asphalt: 1.4, paving: 1.3, grass: 1.0, dirt: 1.8 };
const baked = new Map<Surface, ReturnType<typeof bake>>();
const mats = new Map<string, THREE.MeshStandardMaterial>();

/**
 * A ground material: the surface's textures multiplied by the chapter's tint. Pair it with `tileUV`.
 * A second, differently scaled sample is blended in so the tile never shows as a repeat; `along` keeps lanes in place on roads.
 */
export function surface(kind: Surface, color: number, o: { r?: number; m?: number; along?: boolean; grid?: boolean; normal?: number; vertex?: boolean } = {}) {
  const key = `${kind}-${color}-${o.r}-${o.m}-${o.along}-${o.grid}-${o.normal}-${o.vertex}`;
  let m = mats.get(key);
  if (m) return m;
  let t = baked.get(kind); if (!t) { t = bake(kind, STRENGTH[kind]); baked.set(kind, t); }
  m = new THREE.MeshStandardMaterial({ color: o.vertex ? 0xffffff : color, vertexColors: !!o.vertex, map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: o.r ?? 1, metalness: o.m ?? 0 });
  m.normalScale.setScalar(o.normal ?? 1);
  const second = o.along ? 'vec2(tuv.x * 0.41 + 0.37, tuv.y)' : o.grid ? 'tuv + vec2(0.375, 0.625)' : 'tuv * 0.41 + vec2(0.37, 0.11)'; // a grid is only shifted by whole slabs, so its joints stay lined up
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 tuv = vMapUv;
        float tm = 0.5 + 0.5 * sin(tuv.x * 0.83 + sin(tuv.y * 0.71) * 2.0) * sin(tuv.y * 0.57 + sin(tuv.x * 0.43) * 2.0);
        diffuseColor *= mix(texture2D(map, tuv), texture2D(map, ${second}), tm);
      #endif`);
  };
  m.customProgramCacheKey = () => `surface-${o.along ? 'u' : o.grid ? 'g' : 'uv'}`;
  mats.set(key, m);
  return m;
}

/** Scale a plane's UVs so one texture tile covers `tile` metres. */
export const tileUV = (geo: THREE.BufferGeometry, w: number, d: number, kind: Surface) => {
  const uv = geo.attributes.uv; const t = TILE[kind];
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / t, uv.getY(i) * d / t);
  return geo;
};

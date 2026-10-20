import * as THREE from 'three';
import { edgeTable as ET, triTable as TT } from 'three/examples/jsm/objects/MarchingCubes.js';

const edgeTable = ET as unknown as Int32Array, triTable = TT as unknown as Int32Array;

// Sculpting with distance fields: describe a shape as smooth primitives blended together, then turn it into one
// seamless mesh with marching cubes. Normals come from the field itself, so the surface shades smoothly.

export type V3 = [number, number, number];
export type Field = (x: number, y: number, z: number) => number;

/* ---------- primitives (Inigo Quilez's formulas) ---------- */
export const ellipsoid = (c: V3, r: V3): Field => (x, y, z) => {
  const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  const qx = px / r[0], qy = py / r[1], qz = pz / r[2];
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
};
export const sphere = (c: V3, r: number): Field => (x, y, z) => { const dx = x - c[0], dy = y - c[1], dz = z - c[2]; return Math.sqrt(dx * dx + dy * dy + dz * dz) - r; };
// A capsule whose radius changes from r1 at a to r2 at b.
export const cone = (a: V3, b: V3, r1: number, r2: number): Field => {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const l2 = bx * bx + by * by + bz * bz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const yy = px * bx + py * by + pz * bz, zz = yy - l2;
    const vx = px * l2 - bx * yy, vy = py * l2 - by * yy, vz = pz * l2 - bz * yy;
    const x2 = vx * vx + vy * vy + vz * vz, y2 = yy * yy * l2, z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
};
export const roundBox = (c: V3, half: V3, r: number): Field => (x, y, z) => {
  const qx = Math.abs(x - c[0]) - half[0] + r, qy = Math.abs(y - c[1]) - half[1] + r, qz = Math.abs(z - c[2]) - half[2] + r;
  const mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0);
  return Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(qx, qy, qz), 0) - r;
};
export const smin = (a: number, b: number, k: number) => {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** Blend several fields smoothly. */
export const blend = (k: number, ...fs: Field[]): Field => (x, y, z) => {
  let d = fs[0](x, y, z);
  for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k);
  return d;
};

/* ---------- marching cubes ---------- */
const CORNERS: V3[] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const EDGES: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

export function polygonize(f: Field, min: V3, max: V3, step: number): THREE.BufferGeometry {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1, ny = Math.ceil((max[1] - min[1]) / step) + 1, nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const val = new Float32Array(nx * ny * nz);
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) val[id(i, j, k)] = f(min[0] + i * step, min[1] + j * step, min[2] + k * step);

  const pos: number[] = [], idx: number[] = [];
  const shared = new Map<number, number>(); // one vertex per crossed grid edge, so the mesh is welded
  const edgeVert = (i: number, j: number, k: number, e: number) => {
    const [a, b] = EDGES[e];
    const ca = CORNERS[a], cb = CORNERS[b];
    const ia = id(i + ca[0], j + ca[1], k + ca[2]), ib = id(i + cb[0], j + cb[1], k + cb[2]);
    const lo = Math.min(ia, ib), hi = Math.max(ia, ib);
    const key = lo * 3 + (hi - lo === 1 ? 0 : hi - lo === nx ? 1 : 2);
    const got = shared.get(key);
    if (got !== undefined) return got;
    const va = val[ia], vb = val[ib], t = va / (va - vb);
    pos.push(
      min[0] + (i + ca[0] + (cb[0] - ca[0]) * t) * step,
      min[1] + (j + ca[1] + (cb[1] - ca[1]) * t) * step,
      min[2] + (k + ca[2] + (cb[2] - ca[2]) * t) * step,
    );
    const n = pos.length / 3 - 1; shared.set(key, n); return n;
  };
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let cube = 0;
    for (let c = 0; c < 8; c++) if (val[id(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])] < 0) cube |= 1 << c;
    if (!edgeTable[cube]) continue;
    for (let t = cube * 16; triTable[t] !== -1; t += 3) idx.push(edgeVert(i, j, k, triTable[t]), edgeVert(i, j, k, triTable[t + 1]), edgeVert(i, j, k, triTable[t + 2]));
  }

  // Normals from the field's gradient: smooth, and they tell us which way the triangles should face.
  const nrm = new Float32Array(pos.length), e = step * 0.5;
  for (let v = 0; v < pos.length; v += 3) {
    const [x, y, z] = [pos[v], pos[v + 1], pos[v + 2]];
    const gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    nrm[v] = gx / l; nrm[v + 1] = gy / l; nrm[v + 2] = gz / l;
  }
  if (idx.length >= 3) { // make the winding agree with the outward normals
    const [a, b, c] = [idx[0] * 3, idx[1] * 3, idx[2] * 3];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
    if (cx * nrm[a] + cy * nrm[a + 1] + cz * nrm[a + 2] < 0) for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

/* ---------- skin weights ---------- */
export interface Segment { bone: number; a: V3; b: V3 }
const segDist = (x: number, y: number, z: number, s: Segment) => {
  const bx = s.b[0] - s.a[0], by = s.b[1] - s.a[1], bz = s.b[2] - s.a[2];
  const px = x - s.a[0], py = y - s.a[1], pz = z - s.a[2];
  const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz || 1)));
  const dx = px - bx * t, dy = py - by * t, dz = pz - bz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
/** Up to four bone weights, falling off with distance to each candidate bone's segment. */
export function weigh(x: number, y: number, z: number, segs: Segment[], soft: number): { i: number[]; w: number[] } {
  const per = new Map<number, number>();
  for (const s of segs) {
    const d = segDist(x, y, z, s);
    const w = 1 / Math.pow(d * d + soft * soft, 2);
    per.set(s.bone, Math.max(per.get(s.bone) ?? 0, w));
  }
  const top = [...per.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = top.reduce((a, [, w]) => a + w, 0);
  const i = [0, 0, 0, 0], w = [0, 0, 0, 0];
  top.forEach(([bone, wt], n) => { i[n] = bone; w[n] = wt / sum; });
  return { i, w };
}

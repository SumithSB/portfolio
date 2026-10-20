import * as THREE from 'three';
import { polygonize, blend, cone, ellipsoid, roundBox, sphere, smin, weigh, type Field, type Segment, type V3 } from './sculpt';
import { dims, SKIN } from './looks';

// Sculpts his body at one age: one seamless skinned surface, plus hair and beard. Pure maths with no page access,
// so it can run in a background worker and never stall scrolling.

export interface Arrays { position: Float32Array; normal: Float32Array; index: Uint32Array; color?: Float32Array; skinIndex?: Uint16Array; skinWeight?: Float32Array }
export interface Sculpted { body: Arrays; hair: Arrays; beard: Arrays | null }

const arrays = (g: THREE.BufferGeometry): Arrays => ({
  position: g.attributes.position.array as Float32Array,
  normal: g.attributes.normal.array as Float32Array,
  index: new Uint32Array(g.index!.array),
  color: g.attributes.color?.array as Float32Array | undefined,
  skinIndex: g.attributes.skinIndex?.array as Uint16Array | undefined,
  skinWeight: g.attributes.skinWeight?.array as Float32Array | undefined,
});

export function sculptStage(stage: number): Sculpted {
  const { L, H, b, S, r, legLen, torsoLen, hipY, shY, zL, shZ, shJY, kneeY, ankleY, elbowY, wristY, headY, armR, elbowOut, wristOut } = dims(stage);
  void S;
  /* ---------- the body as one sculpted surface ---------- */
  const legField = (z: number) => blend(0.022 * H,
    cone([0, hipY, z], [0, kneeY, z], 0.062 * H * b, 0.044 * H * b),
    cone([0, kneeY, z], [0, ankleY, z], 0.043 * H * b, 0.026 * H),
    ellipsoid([-0.012 * H, kneeY - legLen * 0.13, z], [0.034 * H * b, legLen * 0.13, 0.033 * H * b]),
    roundBox([0.035 * H, ankleY - legLen * 0.01 - 0.004, z], [0.08 * H, 0.03 * H, 0.044 * H], 0.026 * H),
  );
  const armField = (z: number) => {
    const s = Math.sign(z), ez = z + s * elbowOut, wz = z + s * wristOut;
    return blend(0.012 * H,
      cone([0, shJY, z], [0, elbowY, ez], armR, 0.031 * H * b),
      cone([0, elbowY, ez], [0, wristY, wz], 0.029 * H * b, 0.021 * H),
      ellipsoid([0.006 * H, wristY - 0.035 * H, wz + s * 0.006 * H], [0.021 * H, 0.032 * H, 0.014 * H]),
      ...[-0.012, -0.004, 0.004, 0.012].map((dx) => cone([dx * H, wristY - 0.05 * H, wz], [dx * H, wristY - (0.08 - Math.abs(dx) * 0.5) * H, wz], 0.006 * H, 0.0045 * H)),
    );
  };
  const torsoField = blend(0.05 * H,
    ellipsoid([0, hipY + 0.02 * H, 0], [0.075 * H * b, 0.075 * H, zL + 0.05 * H * b]),
    ellipsoid([0, hipY + 0.42 * torsoLen, 0], [0.068 * H * b, 0.42 * torsoLen, 0.1 * H * b]),
    ellipsoid([0.005 * H, hipY + 0.74 * torsoLen, 0], [0.078 * H * b, 0.3 * torsoLen, shZ - armR - 0.008]),
    sphere([0, shJY - 0.005, shZ - 0.014 * H], 0.033 * H * b), sphere([0, shJY - 0.005, -(shZ - 0.014 * H)], 0.033 * H * b),
  );
  const chinC: V3 = [0.62 * r, -0.82 * r, 0], chinR: V3 = [0.24 * r, 0.19 * r, 0.32 * r];
  const jawC: V3 = [0.08 * r, headY - 0.32 * r, 0], jawR: V3 = [0.88 * r, 0.74 * r, 0.88 * r]; // a fuller jaw, so the head is not a balloon on a stalk
  const headField = blend(0.05 * r,
    // skull, jaw and a defined chin (forward and down), blended into one shape
    blend(0.22 * r, ellipsoid([0, headY, 0], [r, 1.12 * r, 0.94 * r]), ellipsoid(jawC, jawR), ellipsoid([chinC[0], headY + chinC[1], 0], chinR)),
    ellipsoid([0.97 * r, headY - 0.12 * r, 0], [0.22 * r, 0.16 * r, 0.14 * r]),
    ellipsoid([-0.05 * r, headY - 0.05 * r, 0.9 * r], [0.17 * r, 0.25 * r, 0.08 * r]),
    ellipsoid([-0.05 * r, headY - 0.05 * r, -0.9 * r], [0.17 * r, 0.25 * r, 0.08 * r]),
  );
  const neckField = cone([0, shY - 0.03, 0], [0.01, headY - 0.7 * r, 0], 0.5 * r, 0.44 * r);
  const lF = legField(zL), lB = legField(-zL), aF = armField(shZ), aB = armField(-shZ);
  const parts = (x: number, y: number, z: number) => [torsoField(x, y, z), lF(x, y, z), lB(x, y, z), aF(x, y, z), aB(x, y, z), neckField(x, y, z), headField(x, y, z)];
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const bodyField: Field = (x, y, z) => {
    const [t, l1, l2, a1, a2, n, h] = parts(x, y, z);
    // Legs and arms join the trunk softly only near the hips and shoulders; elsewhere they stay apart.
    let d = smin(t, Math.min(l1, l2), 0.04 * H * clamp01((y - (hipY - 0.12 * H)) / (0.1 * H)));
    d = smin(d, Math.min(a1, a2), 0.001 + 0.02 * H * clamp01((y - (shJY - 0.08 * H)) / (0.06 * H)));
    d = smin(d, n, 0.03 * H);
    return smin(d, h, 0.02 * H);
  };


  const step = 0.0085 * H;
  const geo = polygonize(bodyField, [-0.17 * H, -0.04 * H, -(shZ + armR + 0.04)], [0.2 * H, headY + 1.3 * r, shZ + armR + 0.04], step);
  // Colour by region (skin, clothes, shoes) and weight each vertex to the bones of the part it belongs to.
  const P = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(P.count * 3), si = new Uint16Array(P.count * 4), sw = new Float32Array(P.count * 4);
  const c = new THREE.Color();
  const sneaker = L.shoe === 0xECE8DE;
  const legSegs = (zz: number, b0: number): Segment[] => [
    { bone: 0, a: [0, hipY + 0.02, 0], b: [0, hipY + 0.15, 0] },
    { bone: b0, a: [0, hipY, zz], b: [0, kneeY, zz] },
    { bone: b0 + 1, a: [0, kneeY, zz], b: [0, ankleY, zz] },
    { bone: b0 + 2, a: [0, ankleY, zz], b: [0.11 * H, ankleY - 0.02 * H, zz] },
  ];
  const armSegs = (zz: number, b0: number): Segment[] => {
    const s = Math.sign(zz), ez = zz + s * elbowOut, wz = zz + s * wristOut;
    return [
      { bone: 7, a: [0, shJY, zz * 0.55], b: [0, shJY, zz * 0.85] },
      { bone: b0, a: [0, shJY, zz], b: [0, elbowY, ez] },
      { bone: b0 + 1, a: [0, elbowY, ez], b: [0, wristY, wz] },
      { bone: b0 + 2, a: [0, wristY, wz], b: [0, wristY - 0.09 * H, wz] },
    ];
  };
  const SEGS: Segment[][] = [
    [{ bone: 0, a: [0, hipY - 0.08, 0], b: [0, hipY + 0.1 * torsoLen, 0] }, { bone: 7, a: [0, hipY + 0.45 * torsoLen, 0], b: [0, shY, 0] }],
    legSegs(zL, 1), legSegs(-zL, 4), armSegs(shZ, 8), armSegs(-shZ, 11),
    [{ bone: 7, a: [0, shY - 0.1, 0], b: [0, shY, 0] }, { bone: 14, a: [0, headY - 0.9 * r, 0], b: [0, headY, 0] }],
  ];
  const sleeve = L.short ? 0.55 * (shJY - elbowY) : shJY - wristY - 0.012 * H;
  for (let v = 0; v < P.count; v++) {
    const x = P.getX(v), y = P.getY(v), z = P.getZ(v);
    const d = parts(x, y, z);
    let part = 0; for (let k = 1; k < d.length; k++) if (d[k] < d[part]) part = k;
    // colour
    let hex = SKIN;
    if (part === 0) {
      hex = y < hipY + 0.04 * H ? L.bottom : L.top;

    } else if (part === 1 || part === 2) {
      if (y < ankleY + 0.015 * H) hex = y < ankleY - 0.034 * H ? (sneaker ? 0xB9B3A6 : 0x2A1C14) : L.shoe;
      else if (L.shorts) hex = y > kneeY + 0.06 * H ? L.bottom : y < ankleY + 0.08 * H ? 0xF2EFE8 : SKIN;
      else hex = L.bottom;
    } else if (part === 3 || part === 4) {
      hex = y > wristY + 0.01 * H && shJY - y < sleeve ? L.top : SKIN;
    } else if (part === 5) {
      hex = L.extra === 'turtleneck' && y < headY - 0.8 * r ? L.top : SKIN;
    }
    c.setHex(hex); col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
    // weights
    if (part === 6) { si[v * 4] = 14; sw[v * 4] = 1; continue; }
    const { i, w } = weigh(x, y, z, SEGS[part], 0.02 * H);
    for (let k = 0; k < 4; k++) { si[v * 4 + k] = i[k]; sw[v * 4 + k] = w[k]; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));

  // Hair, as in his photos: thick and swept up and back, highest at the front and tapering toward the crown, cut
  // short at the sides with the ears clear. Fine grooves run front to back so it reads as combed hair, not a wrap.
  const v = L.hairVol;
  const clampU = (t: number) => Math.max(0, Math.min(1, t));
  const shell = ellipsoid([0, 0.01 * r, 0], [1.035 * r, 1.155 * r, 0.975 * r]); // short all over, hugging the skull
  const top = blend(0.22 * r,
    ellipsoid([0.5 * r, (0.97 + 0.05 * v) * r, 0], [0.42 * r, (0.14 + 0.07 * v) * r, 0.56 * r]),  // the lift at the front
    ellipsoid([0.12 * r, (1.0 + 0.03 * v) * r, 0], [0.52 * r, (0.13 + 0.05 * v) * r, 0.64 * r]),
    ellipsoid([-0.3 * r, 1.0 * r, 0], [0.5 * r, 0.12 * r, 0.6 * r]),                            // flattening toward the crown
  );
  const hairline = (x: number, z: number) => {
    const az = Math.abs(z) / r;
    // forehead high, temples a touch higher, down to the nape at the back; a slight unevenness so it isn't a ruled line
    let h = 0.08 * r + 0.42 * x + 0.16 * r * az * az * clampU(x / r) + 0.025 * r * Math.sin(z / r * 23);
    // short back and sides: a rounded cut around each ear
    const u = (x + 0.08 * r) / (0.56 * r);
    if (az > 0.5 && Math.abs(u) < 1) h = Math.max(h, 0.05 * r + 0.17 * r * Math.sqrt(1 - u * u));
    return h;
  };
  const hairField: Field = (x, y, z) => {
    let d = smin(shell(x, y, z), top(x, y, z), 0.12 * r);
    // combed-back grooves, deeper on top where the hair is longer
    d += 0.012 * r * Math.sin(z / r * 34 + Math.sin(x / r * 3) * 1.5) * clampU((y + 0.1 * r) / r);
    return Math.max(d, hairline(x, z) - y);
  };
  const hair = polygonize(hairField, [-1.2 * r, -0.5 * r, -1.1 * r], [1.2 * r, 1.45 * r, 1.1 * r], r / 22);
  let beard: THREE.BufferGeometry | null = null;
  if (L.beard !== 'none') {
    // A trimmed beard that follows the jaw: kept short, with fine vertical texture so it reads as hair.
    const th = L.beard === 'full' ? 0.055 * r : L.beard === 'short' ? 0.04 * r : 0.02 * r;
    const jc: V3 = [jawC[0], jawC[1] - headY, 0];
    // the shell reaches well inside the face so it is thick enough to sculpt; only `th` shows above the skin
    // the beard wraps the jaw and the chin
    const jawOut = ellipsoid(jc, [jawR[0] + th, jawR[1] + th, jawR[2] + th]), jawIn = ellipsoid(jc, [jawR[0] - 0.06 * r, jawR[1] - 0.06 * r, jawR[2] - 0.06 * r]);
    const chinOut = ellipsoid(chinC, [chinR[0] + th, chinR[1] + th, chinR[2] + th]), chinIn = ellipsoid(chinC, [chinR[0] - 0.05 * r, chinR[1] - 0.05 * r, chinR[2] - 0.05 * r]);
    const outer: Field = (x, y, z) => smin(jawOut(x, y, z), chinOut(x, y, z), 0.2 * r);
    const inner: Field = (x, y, z) => smin(jawIn(x, y, z), chinIn(x, y, z), 0.2 * r);
    const mouth = ellipsoid([0.95 * r, -0.4 * r, 0], [0.22 * r, 0.085 * r, 0.3 * r]);
    const stache = L.beard === 'stubble' ? null : ellipsoid([0.95 * r, -0.29 * r, 0], [0.06 * r, 0.032 * r, 0.25 * r]);
    const beardField: Field = (x, y, z) => {
      // the cheek line rises toward the sideburns
      // the cheek line rises toward the ear, so the beard meets the hair like a sideburn
      const cheek = -0.1 * r - 0.12 * r * Math.max(0, (x - 0.2 * r) / r) + 0.75 * r * Math.max(0, 0.18 * r - x) / r;
      let d = Math.max(outer(x, y, z), -inner(x, y, z), y - cheek, -(x + 0.2 * r));
      if (stache) d = smin(d, stache(x, y, z), 0.02 * r);
      d += 0.006 * r * Math.sin(z / r * 60) * Math.sin(y / r * 18);
      return Math.max(d, -mouth(x, y, z));
    };
    beard = polygonize(beardField, [-0.45 * r, -1.2 * r, -1.05 * r], [1.1 * r, 0.15 * r, 1.05 * r], r / 26);
  }
  return { body: arrays(geo), hair: arrays(hair), beard: beard ? arrays(beard) : null };
}

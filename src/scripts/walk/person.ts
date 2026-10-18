import * as THREE from 'three';
import { mat, box, cyl } from './kit';
import { polygonize, roundBox } from './sculpt';
import { LOOKS, SKIN, HAIR, dims, type Look } from './looks';
import type { Arrays, Sculpted } from './figure';
import { advanceGait } from './locomotion';

export { LOOKS };

// The character at six ages. Faces +x. One sculpted, skinned body per age; features taken from Sumith's photos:
// medium-brown skin, thick black hair swept up and back, a wide smile, a trimmed full beard as an adult,
// a solid build, hands in pockets at rest.

export interface JointState {
  armFZ: number; armFX: number; armBZ: number; armBX: number;
  elbowFZ: number; elbowFX: number; elbowBZ: number; elbowBX: number;
  torsoZ: number; torsoY: number;
  headY: number; headZ: number;
  handHide: number;
  transitionAlpha: number;
  // gait: its own phase, a smoothed speed, and how much he is walking (0 standing, 1 walking)
  gait: number; speed: number; walkAmt: number; vel: number;
  // idle life: weight shifts and glances
  glance: number; glanceTarget: number; nextGlance: number; wave: number;
}

export interface Person extends THREE.Group {
  torso: THREE.Object3D;
  pelvis: THREE.Object3D;
  footF: THREE.Object3D;
  footB: THREE.Object3D;
  eyes: THREE.Group;
  joints: JointState;
  baseY: number;
  facing: number;
  blinkEvery: number;
  userData: {
    look: Look;
    legF: THREE.Object3D; legB: THREE.Object3D; armF: THREE.Object3D; armB: THREE.Object3D; head: THREE.Object3D; phone?: THREE.Object3D;
    /** Set once a generated model replaces the sculpted body. */
    realistic?: boolean;
  };
}

const phoneMesh = (kind: 'keypad' | 'early' | 'today') => {
  if (kind === 'keypad') {
    const p = box(0.03, 0.11, 0.05, mat(0x2B3A44, { r: 0.4 }));
    const s = box(0.032, 0.035, 0.04, mat(0xB9D88A, { e: 0x6E8A3A, ei: 0.4 })); s.position.y = 0.03; p.add(s);
    return p;
  }
  if (kind === 'early') {
    const p = box(0.02, 0.12, 0.065, mat(0x1B1F24, { r: 0.3 }));
    const s = box(0.022, 0.095, 0.055, mat(0x5FA8D3, { e: 0x3F88B3, ei: 0.5 })); p.add(s);
    return p;
  }
  const p = box(0.012, 0.15, 0.075, mat(0x101317, { r: 0.25, m: 0.3 }));
  const s = box(0.014, 0.14, 0.068, mat(0xF2A93B, { e: 0xF2A93B, ei: 1.2 })); p.add(s);
  return p;
};

const toGeo = (a: Arrays) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normal, 3));
  if (a.color) g.setAttribute('color', new THREE.BufferAttribute(a.color, 3));
  if (a.skinIndex) g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(a.skinIndex, 4));
  if (a.skinWeight) g.setAttribute('skinWeight', new THREE.BufferAttribute(a.skinWeight, 4));
  g.setIndex(new THREE.BufferAttribute(a.index, 1));
  return g;
};

/** Puts him together at one age from the sculpted surfaces: skeleton, skin, hair, face and what he carries. */
export function makePerson(stage: number, sculpted: Sculpted): Person {
  const { L, H, b, S, r, legLen, torsoLen, hipY, zL, shZ, shJY, elbowY, wristY, headY, armR, elbowOut, wristOut } = dims(stage);
  const g = new THREE.Group() as Person;
  /* ---------- skeleton: the same joints the walk code has always driven ---------- */
  const bone = (parent: THREE.Object3D, x: number, y: number, z: number) => { const o = new THREE.Bone(); o.position.set(x, y, z); parent.add(o); return o; };
  const pelvis = bone(g, 0, hipY, 0);
  const leg = (z: number) => {
    const G = bone(pelvis, 0, 0, z);
    const knee = bone(G, 0, -legLen * 0.5, 0);
    const foot = bone(knee, 0, -legLen * 0.46, 0);
    G.userData.knee = knee; G.userData.foot = foot; return G;
  };
  const legF = leg(zL), legB = leg(-zL);
  const torso = bone(g, 0, hipY, 0);
  const arm = (z: number) => {
    const s = Math.sign(z);
    const A = bone(torso, 0, shJY - hipY, z);
    const elbow = bone(A, 0, elbowY - shJY, s * elbowOut);
    const hand = bone(elbow, 0, wristY - elbowY, s * (wristOut - elbowOut));
    A.userData.elbow = elbow; A.userData.hand = hand; return A;
  };
  const armF = arm(shZ), armB = arm(-shZ);
  const head = bone(torso, 0, headY - hipY, 0);
  const bones = [pelvis, legF, legF.userData.knee, legF.userData.foot, legB, legB.userData.knee, legB.userData.foot, torso, armF, armF.userData.elbow, armF.userData.hand, armB, armB.userData.elbow, armB.userData.hand, head] as THREE.Bone[];

  const cached = { geo: toGeo(sculpted.body), hair: toGeo(sculpted.hair), beard: sculpted.beard ? toGeo(sculpted.beard) : null };

  g.updateMatrixWorld(true);
  const skin = new THREE.SkinnedMesh(cached.geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.78, sheen: 0.16, sheenRoughness: 0.8, sheenColor: new THREE.Color(0xCDBEA9) }));
  skin.castShadow = true; skin.receiveShadow = true; skin.frustumCulled = false;
  g.add(skin);
  skin.bind(new THREE.Skeleton(bones));

  const mHair = new THREE.MeshStandardMaterial({ color: 0x17120E, roughness: 0.62 });
  const hairMesh = new THREE.Mesh(cached.hair, mHair); hairMesh.castShadow = true; head.add(hairMesh);
  if (cached.beard) {
    const bm = L.beard === 'stubble' ? new THREE.MeshStandardMaterial({ color: 0x2A1F19, roughness: 1, transparent: true, opacity: 0.5 }) : new THREE.MeshStandardMaterial({ color: 0x17120F, roughness: 0.9 });
    head.add(new THREE.Mesh(cached.beard, bm));
  }

  /* ---------- face ---------- */
  const eyes = new THREE.Group(); eyes.position.set(0, 0, 0); head.add(eyes);
  const sclera = mat(0xD9C8AD, { r: 0.5 }), iris = mat(0x2C2018, { r: 0.35 });
  for (const sign of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(r * 0.14, 16, 10), sclera);
    eye.scale.set(0.35, 0.55, 1); eye.position.set(r * 0.93, r * 0.03, sign * r * 0.34); eyes.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 0.078, 12, 8), iris);
    pupil.scale.set(0.3, 0.9, 1); pupil.position.set(r * 0.981, r * 0.03, sign * r * 0.34 + r * 0.025); eyes.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(r * 0.018, 6, 4), mat(0xFFF2D9, { r: 0.15 }));
    glint.position.set(r * 1.007, r * 0.06, sign * r * 0.34); eyes.add(glint);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.028, r * 0.23, 3, 8), mat(HAIR));
    brow.rotation.x = Math.PI / 2 + sign * 0.12; brow.position.set(r * 0.93, r * 0.235, sign * r * 0.34); head.add(brow);
  }
  // His wide, open smile: a curved opening with a row of teeth, corners lifted.
  const smileShape = new THREE.Shape();
  smileShape.moveTo(-0.24 * r, 0.03 * r);
  smileShape.quadraticCurveTo(0, -0.035 * r, 0.24 * r, 0.03 * r);
  smileShape.quadraticCurveTo(0.12 * r, -0.17 * r, 0, -0.17 * r);
  smileShape.quadraticCurveTo(-0.12 * r, -0.17 * r, -0.24 * r, 0.03 * r);
  const smile = new THREE.Mesh(new THREE.ShapeGeometry(smileShape, 12), mat(0x3A1512, { r: 0.8 }));
  smile.rotation.y = Math.PI / 2; smile.position.set(r * 1.02, -r * 0.36, 0); head.add(smile);
  const teethShape = new THREE.Shape();
  teethShape.moveTo(-0.2 * r, 0.018 * r);
  teethShape.quadraticCurveTo(0, -0.04 * r, 0.2 * r, 0.018 * r);
  teethShape.lineTo(0.17 * r, -0.03 * r);
  teethShape.quadraticCurveTo(0, -0.085 * r, -0.17 * r, -0.03 * r);
  const teeth = new THREE.Mesh(new THREE.ShapeGeometry(teethShape, 12), mat(0xF4EEE2, { r: 0.35 }));
  teeth.rotation.y = Math.PI / 2; teeth.position.set(r * 1.026, -r * 0.36, 0); head.add(teeth);
  if (L.cap) {
    const board = box(r * 2.6, 0.02, r * 2.6, mat(0x151110)); board.position.y = r * 1.42; board.rotation.y = Math.PI / 4; head.add(board);
    const crown = cyl(r * 0.98, r * 1.03, r * 0.42, mat(0x151110)); crown.position.y = r * 1.2; head.add(crown);
    const tassel = box(0.01, r * 0.8, 0.01, mat(0xF2A93B, { e: 0xF2A93B, ei: 0.3 })); tassel.position.set(r * 0.9, r * 1.05, r * 0.9); head.add(tassel);
  }

  // Cuffs and a real collar give clothing thickness and clean silhouettes.
  const collar = new THREE.Mesh(new THREE.TorusGeometry(r * 0.43, r * 0.065, 6, 20), mat(L.topShade ?? L.top));
  collar.rotation.x = Math.PI / 2; collar.position.y = torsoLen + 0.016; torso.add(collar);
  for (const A of [armF, armB]) {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.023 * H, 0.025 * H, 0.025 * H, 12), mat(L.topShade ?? L.top));
    if (!L.short) { cuff.position.y = -0.002 * H; A.userData.hand.add(cuff); }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.007 * H, 0.025 * H, 3, 8), mat(SKIN));
    thumb.rotation.z = -0.5; thumb.position.set(0.019 * H, -0.035 * H, 0); A.userData.hand.add(thumb);
  }
  if (L.extra === 'blazer') {
    const shirt = box(0.012, torsoLen * 0.65, 0.06 * H, mat(0xE8DFCE));
    shirt.position.set(0.078 * H * b + 0.007, torsoLen * 0.63, 0); torso.add(shirt);
    for (const sign of [-1, 1]) {
      const lapel = box(0.016, torsoLen * 0.52, 0.025 * H, mat(0x1D2C48));
      lapel.position.set(0.078 * H * b + 0.018, torsoLen * 0.7, sign * 0.045 * H); lapel.rotation.x = sign * 0.22; torso.add(lapel);
    }
  }

  /* ---------- what he carries ---------- */
  const front = 0.078 * H * b; // chest surface, facing forward
  if (L.extra === 'schoolbag') { const bag = roundedBag(0.13, torsoLen * 0.72, (shZ - armR) * 1.6, 0xB5432F); bag.position.set(-front - 0.06, torsoLen * 0.58, 0); torso.add(bag); }
  if (L.shorts) { const tie = box(0.012, torsoLen * 0.45, 0.04, mat(0x22325A)); tie.position.set(front + 0.004, torsoLen * 0.62, 0); torso.add(tie); }
  if (stage === 3) {
    const hood = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, r * 0.22, 10, 24), mat(L.topShade ?? L.top)); hood.rotation.x = Math.PI / 2; hood.scale.set(0.8, 1.15, 1); hood.position.set(-r * 0.25, torsoLen + 0.01, 0); torso.add(hood);
    for (const z of [0.035, -0.035]) { const st = box(0.006, torsoLen * 0.22, 0.006, mat(0xE8E4DA)); st.position.set(front + 0.004, torsoLen * 0.82, z); torso.add(st); }
  }
  if (L.extra === 'sling') {
    const strap = box(0.01, torsoLen * 1.1, 0.026, mat(0x3A2A1C)); strap.position.set(front + 0.006, torsoLen * 0.55, 0); strap.rotation.x = 0.7; torso.add(strap);
    const pouch = roundedBag(0.07, 0.15, 0.19, 0x6B4A2F); pouch.position.set(front - 0.02, torsoLen * 0.14, -S * 0.5); torso.add(pouch);
  }
  if (L.extra === 'laptop') {
    const strap = box(0.01, torsoLen * 1.15, 0.03, mat(0x151110)); strap.position.set(front + 0.006, torsoLen * 0.55, 0); strap.rotation.x = -0.7; torso.add(strap);
    const bag = roundedBag(0.07, 0.27, 0.37, 0x2A2420); bag.position.set(0.0, -torsoLen * 0.05, shZ + armR + 0.03); torso.add(bag);
  }
  let phone: THREE.Object3D | undefined;
  if (L.phone) { phone = phoneMesh(L.phone); phone.position.set(0.02, -0.06 * H, 0); phone.visible = L.phone !== 'today'; armF.userData.hand.add(phone); }

  const joints: JointState = {
    armFZ: 0, armFX: 0, armBZ: 0, armBX: 0,
    elbowFZ: 0.25, elbowFX: 0, elbowBZ: 0.25, elbowBX: 0,
    torsoZ: 0, torsoY: 0, headY: 0, headZ: 0, handHide: 0, transitionAlpha: 1, gait: 0, speed: 0, walkAmt: 0, vel: 0, glance: 0, glanceTarget: 0, nextGlance: 2 + stage, wave: 0
  };
  g.torso = torso; g.pelvis = pelvis;
  g.footF = legF.userData.foot; g.footB = legB.userData.foot;
  g.eyes = eyes; g.joints = joints; g.baseY = 0; g.facing = 1; g.blinkEvery = 3.2 + stage * 0.46;
  g.userData = { look: L, legF, legB, armF, armB, head, phone };
  return g;
}

// Bags with rounded edges, so even the props avoid hard boxes.
const bagCache = new Map<string, THREE.BufferGeometry>();
function roundedBag(w: number, h: number, d: number, color: number) {
  const key = `${w}-${h}-${d}`;
  let geo = bagCache.get(key);
  if (!geo) { geo = polygonize(roundBox([0, 0, 0], [w / 2, h / 2, d / 2], Math.min(w, h, d) * 0.3), [-w, -h, -d], [w, h, d], Math.min(w, h, d) / 8); bagCache.set(key, geo); }
  const m = new THREE.Mesh(geo, mat(color, { r: 0.8 })); m.castShadow = true; return m;
}

export interface PoseState {
  phase: number;
  moving: number;
  mode: 'walk' | 'wave' | 'idle' | 'phone' | 'pockets';
  t: number;
  time: number;
  look: number;
  dt: number;
  signedSpeed: number;
  dx: number; // distance moved along the road this frame
}

const damp = (cur: number, target: number, k: number) => cur + (target - cur) * k;

/** Weight 0 hides the stage. Weight 1 is full size on the road. */
export function setPersonTransition(p: Person, weight: number) {
  const w = Math.min(1, Math.max(0, weight));
  p.visible = w > 0.01;
  p.scale.setScalar(0.92 + 0.08 * w);
  p.baseY = -(1 - w) * 0.35;
  p.joints.transitionAlpha = w;
}

// One function drives every pose so transitions stay smooth.
// The walk is built like a person's: the stride comes from the distance actually covered (so feet don't slide),
// cadence has a human ceiling, a stopping step is finished rather than frozen, and the body carries its weight.
export function pose(p: Person, s: PoseState) {
  const { legF, legB, armF, armB, head, phone, look } = p.userData;
  const j = p.joints;
  const dt = Math.max(0, Math.min(0.1, s.dt));
  const e = (rate: number) => 1 - Math.exp(-dt * rate);
  const legLen = look.H * (look.H < 1.3 ? 0.43 : 0.47);

  // How fast he is going, smoothed, and whether he is walking at all (eases in quickly, out more slowly).
  const v = Math.abs(s.dx) / Math.max(dt, 1e-3);
  j.speed += (v - j.speed) * e(4);
  const going = s.mode === 'walk' && j.speed > 0.15 ? 1 : 0;
  j.walkAmt += (going - j.walkAmt) * e(going ? 5 : 2.6);
  const w = j.walkAmt;
  const brisk = Math.min(1, j.speed / 2.6);
  const amp = w * (0.36 + 0.24 * brisk); // longer strides when brisk

  // Phase: one half-turn per step. The phase follows signed root distance; the root controller bounds physical walking speed.
  const stepLen = 2 * legLen * Math.sin(Math.max(amp, 0.2));
  if (going) j.gait = advanceGait(j.gait, s.dx, stepLen);
  else if (w > 0.02) { // finish the step he was on, then stand
    const rest = Math.round(j.gait / Math.PI) * Math.PI;
    j.gait += Math.sign(rest - j.gait) * Math.min(Math.abs(rest - j.gait), Math.PI * 2.2 * dt);
  }
  const ph = j.gait;
  const stride = Math.sin(ph);

  // Legs by inverse kinematics. Each foot has a target: planted feet slide back at exactly the body's pace (so they
  // stay put on the road), swinging feet arc forward to the next footfall. Hip and knee angles are solved to reach it.
  const TAU = Math.PI * 2;
  const S = 2 * legLen * Math.sin(amp);
  const thigh = legLen * 0.5, shin = legLen * 0.46, reach = (thigh + shin) * 0.999;
  const ankle0 = -0.955 * legLen; // ankle height below the hip when standing, knees soft
  const footAt = (q: number) => {
    let u = q % TAU; if (u < 0) u += TAU;
    if (u >= Math.PI / 2 && u < Math.PI * 1.5) { // planted, rolling onto the toes at the end
      const k = (u - Math.PI / 2) / Math.PI;
      return { x: S / 2 - S * k, lift: 0, pitch: -(Math.max(0, (k - 0.7) / 0.3) ** 2) * 0.55 * w, stance: true };
    }
    const k = ((u + Math.PI / 2) % TAU) / Math.PI; // swinging: 0 at toe-off, 1 at heel strike
    const ease = k * k * (3 - 2 * k);
    return {
      x: -S / 2 + S * ease,
      lift: Math.sin(Math.PI * Math.min(1, k * 1.15)) * legLen * 0.11 * w,
      pitch: (-0.5 * (1 - k) ** 3 + 0.28 * Math.max(0, (k - 0.6) / 0.4) ** 2) * w,
      stance: false,
    };
  };
  const fF = footAt(ph), fB = footAt(ph + Math.PI);
  // The hips ride as high as the planted leg allows: highest over the foot, lowest when both feet are down.
  const hipFor = (f: { x: number; lift: number }) => Math.sqrt(Math.max(0, reach * reach - f.x * f.x)) + ankle0 + f.lift;
  let bob = Math.min(fF.stance ? hipFor(fF) : Infinity, fB.stance ? hipFor(fB) : Infinity);
  if (!Number.isFinite(bob)) bob = 0;
  bob = Math.min(bob, 0.02 * legLen) - 0.012 * w;
  const solve = (leg: THREE.Object3D, f: { x: number; lift: number; pitch: number }) => {
    const dx = f.x, ty = ankle0 + f.lift - bob; // the target, relative to the hip
    const dist = Math.min(Math.hypot(dx, ty), reach);
    const flex = Math.PI - Math.acos(Math.max(-1, Math.min(1, (thigh * thigh + shin * shin - dist * dist) / (2 * thigh * shin))));
    const hip = Math.atan2(dx, -ty) + Math.acos(Math.max(-1, Math.min(1, (thigh * thigh + dist * dist - shin * shin) / (2 * thigh * dist))));
    leg.rotation.z = hip;
    (leg.userData.knee as THREE.Group).rotation.z = -flex;
    (leg.userData.foot as THREE.Group).rotation.z = f.pitch - hip + flex; // keeps the sole level on the ground
  };
  solve(legF, fF); solve(legB, fB);

  // Weight: hips sway over the standing foot.
  const breath = Math.sin(s.time * 1.7) * 0.004 * (1 - w);
  p.position.y = p.baseY + bob + breath;
  // Standing still, he shifts his weight from foot to foot every few seconds.
  const shift = Math.sin(s.time * 0.42 + p.blinkEvery) * (1 - w);
  p.position.z = Math.cos(ph) * 0.022 * w + shift * 0.025;
  p.pelvis.rotation.y = -stride * 0.12 * amp;
  p.pelvis.rotation.x = Math.cos(ph) * 0.07 * w + shift * 0.035;

  const holds = !!look.phone && s.mode !== 'pockets' && s.mode !== 'wave';
  const showPhone = holds && (look.phone !== 'today' || s.mode === 'phone');
  if (phone) phone.visible = showPhone;

  // Arms swing against the legs, a beat late, with more elbow on the forward swing.
  const armPh = ph - 0.3;
  const armSwing = Math.sin(armPh) * amp * 0.85;
  let tArmFZ = -armSwing, tArmFX = 0.06, tArmBZ = armSwing, tArmBX = -0.06;
  let tElbowFZ = 0.18 + Math.max(0, -Math.sin(armPh)) * 0.45 * w, tElbowFX = 0;
  let tElbowBZ = 0.18 + Math.max(0, Math.sin(armPh)) * 0.45 * w, tElbowBX = 0;
  let hideHands = 0, rate = 9;
  j.wave += ((s.mode === 'wave' ? 1 : 0) - j.wave) * e(s.mode === 'wave' ? 3.2 : 4);
  if (s.mode === 'wave') {
    // Raise the arm, then wave from the elbow, not the shoulder.
    // Arm out to the side and up, forearm upright, hand waving side to side from the elbow.
    tArmFX = -2.2; tArmFZ = 0.25; tElbowFZ = 0.15; tElbowFX = -0.9 + Math.sin(s.t * 7.5) * 0.38 * j.wave;
    tArmBZ = 0.04; tElbowBZ = 0.12; rate = 6;
  } else if (s.mode === 'pockets') {
    tArmFX = -0.32; tArmBX = 0.32; tArmFZ = -0.1; tArmBZ = -0.1;
    tElbowFZ = 0.15; tElbowBZ = 0.15; tElbowFX = 0.75; tElbowBX = -0.75;
    rate = 5;
  } else if (showPhone) {
    tArmFZ = 0.82 + Math.sin(s.time * 1.3) * 0.02; tElbowFZ = 1.3; tArmBZ = armSwing; tElbowBZ = 0.22; rate = 6;
  } else if (s.mode === 'idle') {
    tArmFZ = 0.02 + shift * 0.03; tArmBZ = -0.02 - shift * 0.03; tElbowFZ = 0.2; tElbowBZ = 0.2;
  }

  if (p.userData.realistic) {
    // The generated model's arms are joined to its sides, so they only swing a little and never lift.
    tArmFX = 0.02; tArmBX = -0.02; tArmFZ = -armSwing * 0.3; tArmBZ = armSwing * 0.3;
    tElbowFX = 0; tElbowBX = 0; tElbowFZ = 0.06; tElbowBZ = 0.06;
    if (phone) phone.visible = false;
  }

  // Idle glances: every few seconds he looks somewhere else for a moment.
  if (w < 0.3 && s.time > j.nextGlance) {
    j.glanceTarget = j.glanceTarget === 0 ? (Math.sin(s.time * 12.9898) > 0 ? 0.5 : -0.35) : 0;
    j.nextGlance = s.time + (j.glanceTarget === 0 ? 3 + (s.time % 2.5) : 0.9 + (s.time % 0.8));
  }
  if (w > 0.5) j.glanceTarget = 0;
  j.glance += (j.glanceTarget - j.glance) * e(j.glanceTarget === 0 ? 4 : 7);

  const blend = e(rate);
  j.armFZ = damp(j.armFZ, tArmFZ, blend); j.armFX = damp(j.armFX, tArmFX, blend);
  j.armBZ = damp(j.armBZ, tArmBZ, blend); j.armBX = damp(j.armBX, tArmBX, blend);
  j.elbowFZ = damp(j.elbowFZ, tElbowFZ, blend); j.elbowFX = damp(j.elbowFX, tElbowFX, blend);
  j.elbowBZ = damp(j.elbowBZ, tElbowBZ, blend); j.elbowBX = damp(j.elbowBX, tElbowBX, blend);
  j.handHide = damp(j.handHide, hideHands, blend);

  // Lean into acceleration, not speed: forward as he sets off, back as he stops.
  const vel = s.signedSpeed;
  const accel = (vel - j.vel) / Math.max(dt, 1e-3); j.vel += (vel - j.vel) * e(6);
  const lean = -(0.05 * w + Math.max(-0.06, Math.min(0.06, accel * 0.004))) * p.facing;
  j.torsoZ = damp(j.torsoZ, lean, e(5));
  j.torsoY = damp(j.torsoY, stride * 0.16 * amp, e(12)); // shoulders counter the hips
  // The head stays level while the body moves (people keep their eyes steady), and leads any turn.
  const headZ = -lean * 0.6 + (showPhone ? -0.2 : 0) + Math.sin(s.time * 0.8) * 0.01 * (1 - w);
  j.headY = damp(j.headY, s.look * 0.6 + j.glance - j.torsoY, e(6));
  j.headZ = damp(j.headZ, headZ, e(5));

  armF.rotation.set(j.armFX, 0, j.armFZ);
  armB.rotation.set(j.armBX, 0, j.armBZ);
  const eF = armF.userData.elbow as THREE.Group, eB = armB.userData.elbow as THREE.Group;
  eF.rotation.set(j.elbowFX, 0, j.elbowFZ);
  eB.rotation.set(j.elbowBX, 0, j.elbowBZ);
  const handScale = 1;
  const handF = armF.userData.hand as THREE.Object3D, handB = armB.userData.hand as THREE.Object3D;
  handF.visible = true; handB.visible = true;
  handF.scale.setScalar(handScale); handB.scale.setScalar(handScale);

  p.torso.rotation.z = j.torsoZ;
  p.torso.rotation.y = j.torsoY;
  p.torso.scale.y = 1 + Math.sin(s.time * 1.7) * 0.012 * (1 - w * 0.6); // breathing
  head.rotation.set(0, j.headY, j.headZ);

  const local = s.time % p.blinkEvery;
  const close = local < 0.06 ? local / 0.06 : local < 0.12 ? (0.12 - local) / 0.06 : 0;
  p.eyes.scale.y = 1 - close * 0.9;
}

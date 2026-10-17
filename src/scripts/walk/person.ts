import * as THREE from 'three';
import { mat, box, capsule, sphere, cyl } from './kit';

// The character at six ages. Faces +x. Built from rounded shapes; features taken from Sumith's photos:
// medium-brown skin, thick black hair swept up and back, a wide smile, a trimmed full beard as an adult,
// a solid build, hands in pockets at rest.
const SKIN = 0xA8693F, SKIN_SHADE = 0x8E5634, HAIR = 0x14110F, HAIR_SIDE = 0x2A2420;

type Beard = 'none' | 'stubble' | 'short' | 'full';
interface Look {
  H: number; head: number; shoulder: number; build: number;
  top: number; topShade?: number; short: boolean; bottom: number; shorts?: boolean; shoe: number;
  beard: Beard; hairVol: number; phone?: 'keypad' | 'early' | 'today';
  extra?: 'schoolbag' | 'sling' | 'laptop' | 'blazer' | 'turtleneck' | 'hoodie' | 'tee';
  cap?: boolean;
}

export const LOOKS: Look[] = [
  { H: 1.18, head: 0.135, shoulder: 0.15, build: 0.85, top: 0xF2EFE8, short: true, bottom: 0x22325A, shorts: true, shoe: 0x16181B, beard: 'none', hairVol: 0.6, extra: 'schoolbag' },
  { H: 1.6, head: 0.126, shoulder: 0.19, build: 0.88, top: 0x3E7CB1, short: true, bottom: 0x2F3B48, shoe: 0xECE8DE, beard: 'none', hairVol: 0.85, phone: 'keypad', extra: 'tee' },
  { H: 1.7, head: 0.128, shoulder: 0.23, build: 0.95, top: 0x5B7F4E, short: true, bottom: 0x34404C, shoe: 0xECE8DE, beard: 'stubble', hairVol: 1, phone: 'early', extra: 'sling' },
  { H: 1.74, head: 0.13, shoulder: 0.25, build: 1, top: 0x3A4A5C, topShade: 0x2C3948, short: false, bottom: 0x2A3138, shoe: 0xECE8DE, beard: 'short', hairVol: 1, extra: 'laptop' },
  { H: 1.74, head: 0.13, shoulder: 0.26, build: 1, top: 0x2C3E6B, short: false, bottom: 0x1F2B4A, shoe: 0x8A5A34, beard: 'full', hairVol: 1, extra: 'blazer', cap: true },
  { H: 1.74, head: 0.13, shoulder: 0.26, build: 1, top: 0xF2EFE8, short: false, bottom: 0x16181B, shoe: 0x8A5A34, beard: 'full', hairVol: 1, phone: 'today', extra: 'turtleneck' },
];

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
  torso: THREE.Group;
  pelvis: THREE.Group;
  footF: THREE.Group;
  footB: THREE.Group;
  eyes: THREE.Group;
  joints: JointState;
  baseY: number;
  facing: number;
  blinkEvery: number;
  userData: {
    look: Look;
    legF: THREE.Group; legB: THREE.Group; armF: THREE.Group; armB: THREE.Group; head: THREE.Group; phone?: THREE.Object3D;
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

export function makePerson(stage: number): Person {
  const L = LOOKS[stage];
  const g = new THREE.Group() as Person;
  const mSkin = mat(SKIN, { r: 0.6 }), mTop = mat(L.top, { r: 0.85 }), mBottom = mat(L.bottom, { r: 0.8 }), mShoe = mat(L.shoe, { r: 0.45 }), mHair = mat(HAIR, { r: 0.55 });
  const legLen = L.H * (stage === 0 ? 0.43 : 0.47), torsoLen = L.H * 0.29;
  const hipY = legLen, shY = hipY + torsoLen, b = L.build;

  const pelvis = new THREE.Group(); pelvis.position.y = hipY; g.add(pelvis);
  const leg = (z: number) => {
    const G = new THREE.Group(); G.position.set(0, 0, z);
    const thigh = capsule(L.H * 0.062 * b, legLen * 0.42, mBottom); thigh.position.y = -legLen * 0.25; G.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -legLen * 0.5; G.add(knee);
    const shin = capsule(L.H * 0.05 * b, legLen * 0.38, L.shorts ? mSkin : mBottom); shin.position.y = -legLen * 0.22; knee.add(shin);
    if (L.shorts) { const sock = capsule(L.H * 0.051, legLen * 0.1, mat(0xF2EFE8)); sock.position.y = -legLen * 0.4; knee.add(sock); }
    const foot = new THREE.Group(); foot.position.y = -legLen * 0.46; knee.add(foot);
    const shoe = box(L.H * 0.16, L.H * 0.06, L.H * 0.095, mShoe); shoe.position.set(L.H * 0.035, -legLen * 0.01, 0); foot.add(shoe);
    if (L.shoe === 0xECE8DE) { const sole = box(L.H * 0.162, L.H * 0.015, L.H * 0.097, mat(0xB9B3A6)); sole.position.set(L.H * 0.035, -legLen * 0.01 - L.H * 0.027, 0); foot.add(sole); }
    G.userData.knee = knee; G.userData.foot = foot; pelvis.add(G); return G;
  };
  const legF = leg(0.072 * L.H), legB = leg(-0.072 * L.H);

  const torso = new THREE.Group(); torso.position.y = hipY; g.add(torso);
  const body = capsule(L.shoulder * 0.62, torsoLen * 0.62, mTop); body.scale.set(0.95 * b, 1, 1.42 * b); body.position.y = torsoLen * 0.52; torso.add(body);
  if (L.shorts) {
    const shorts = capsule(L.shoulder * 0.62, torsoLen * 0.12, mBottom); shorts.scale.set(0.96, 1, 1.43); shorts.position.y = torsoLen * 0.05; torso.add(shorts);
    const tie = box(0.02, torsoLen * 0.5, 0.05, mat(0x22325A)); tie.position.set(L.shoulder * 0.6, torsoLen * 0.6, 0); torso.add(tie);
  } else {
    const waist = capsule(L.shoulder * 0.6, torsoLen * 0.1, mBottom); waist.scale.set(0.95 * b, 1, 1.4 * b); waist.position.y = 0.02; torso.add(waist);
  }
  if (L.extra === 'schoolbag') { const bag = box(0.14, torsoLen * 0.75, L.shoulder * 1.45, mat(0xB5432F)); bag.position.set(-L.shoulder * 0.66, torsoLen * 0.55, 0); torso.add(bag); }
  if (L.extra === 'turtleneck') {
    const collar = cyl(0.078, 0.088, 0.1, mTop, 20); collar.position.y = torsoLen + 0.02; torso.add(collar);
    const hem = cyl(L.shoulder * 0.58, L.shoulder * 0.58, 0.05, mat(0xE2DED6), 24); hem.scale.set(0.95, 1, 1.42); hem.position.y = 0.05; torso.add(hem);
  }
  if (L.extra === 'hoodie' || stage === 3) {
    const hood = sphere(L.shoulder * 0.42, mat(L.topShade ?? L.top), 16); hood.scale.set(0.9, 0.6, 1.3); hood.position.set(-L.shoulder * 0.35, torsoLen * 0.98, 0); torso.add(hood);
    const pocket = box(0.02, torsoLen * 0.22, L.shoulder * 0.9, mat(L.topShade ?? L.top)); pocket.position.set(L.shoulder * 0.56, torsoLen * 0.32, 0); torso.add(pocket);
    for (const z of [0.04, -0.04]) { const s = box(0.008, torsoLen * 0.25, 0.008, mat(0xE8E4DA)); s.position.set(L.shoulder * 0.58, torsoLen * 0.78, z); torso.add(s); }
  }
  if (L.extra === 'blazer') {
    const shirt = box(0.02, torsoLen * 0.42, L.shoulder * 0.42, mat(0xF2B8C6)); shirt.position.set(L.shoulder * 0.6, torsoLen * 0.78, 0); torso.add(shirt);
    const vest = box(0.02, torsoLen * 0.38, L.shoulder * 0.28, mat(0x1E2A44)); vest.position.set(L.shoulder * 0.61, torsoLen * 0.5, 0); torso.add(vest);
    for (const z of [1, -1]) { const lapel = box(0.03, torsoLen * 0.42, L.shoulder * 0.16, mat(0x253660)); lapel.position.set(L.shoulder * 0.6, torsoLen * 0.7, z * L.shoulder * 0.26); lapel.rotation.x = z * 0.25; torso.add(lapel); }
  }
  if (L.extra === 'sling') {
    const strap = box(0.012, torsoLen * 1.1, 0.03, mat(0x3A2A1C)); strap.position.set(L.shoulder * 0.62, torsoLen * 0.55, 0); strap.rotation.x = 0.7; torso.add(strap);
    const pouch = box(0.08, 0.16, 0.2, mat(0x6B4A2F)); pouch.position.set(L.shoulder * 0.45, torsoLen * 0.12, -L.shoulder * 0.55); torso.add(pouch);
  }
  if (L.extra === 'laptop') {
    const strap = box(0.012, torsoLen * 1.15, 0.035, mat(0x151110)); strap.position.set(L.shoulder * 0.64, torsoLen * 0.55, 0); strap.rotation.x = -0.7; torso.add(strap);
    const bag = box(0.08, 0.28, 0.38, mat(0x2A2420)); bag.position.set(0.02, -torsoLen * 0.05, L.shoulder * 0.98); torso.add(bag);
    const tag = box(0.082, 0.02, 0.3, mat(0xF2A93B, { e: 0xF2A93B, ei: 0.3 })); tag.position.set(0.02, 0.02, L.shoulder * 0.98); torso.add(tag);
  }

  const arm = (z: number) => {
    const A = new THREE.Group(); A.position.set(0, shY - 0.04 - hipY, z);
    const upper = capsule(L.H * 0.043 * b, torsoLen * 0.42, mTop); upper.position.y = -torsoLen * 0.24; A.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -torsoLen * 0.5; A.add(elbow);
    const fore = capsule(L.H * 0.037 * b, torsoLen * 0.4, L.short ? mSkin : mTop); fore.position.y = -torsoLen * 0.22; elbow.add(fore);
    const hand = sphere(L.H * 0.035, mSkin, 14); hand.position.y = -torsoLen * 0.47; elbow.add(hand);
    A.userData.elbow = elbow; A.userData.hand = hand; torso.add(A); return A;
  };
  const armF = arm(L.shoulder * 1.02), armB = arm(-L.shoulder * 1.02);
  let phone: THREE.Object3D | undefined;
  if (L.phone) { phone = phoneMesh(L.phone); phone.position.set(0.03, -0.02, 0); phone.visible = L.phone !== 'today'; armF.userData.hand.add(phone); }

  // Head
  const r = L.head;
  const head = new THREE.Group(); head.position.y = shY + 0.06 + r * 1.05 - hipY; torso.add(head);
  const neck = capsule(r * 0.4, 0.06, mSkin); neck.position.y = -r * 0.95; head.add(neck);
  const skull = sphere(r, mSkin, 32); skull.scale.set(1.0, 1.12, 0.98); head.add(skull);
  const jaw = sphere(r * 0.88, mSkin, 24); jaw.scale.set(1.0, 0.82, 1.0); jaw.position.set(r * 0.08, -r * 0.32, 0); head.add(jaw);
  for (const z of [1, -1]) { const ear = sphere(r * 0.22, mat(SKIN_SHADE), 12); ear.scale.set(0.6, 1, 0.4); ear.position.set(-r * 0.05, -r * 0.05, z * r * 0.97); head.add(ear); }
  const mEye = mat(0x120E0C, { r: 0.3 });
  const eyes = new THREE.Group(); eyes.position.set(r * 0.9, r * 0.02, 0); head.add(eyes);
  for (const z of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(r * 0.12, r * 0.035, 8, 16, Math.PI), mEye);
    eye.rotation.y = Math.PI / 2; eye.position.set(0, 0, z * r * 0.36); eyes.add(eye);
    const brow = box(0.02, r * 0.1, r * 0.36, mHair); brow.position.set(r * 0.9, r * 0.31, z * r * 0.36); brow.rotation.x = z * 0.12; head.add(brow);
  }
  const nose = sphere(r * 0.17, mSkin, 14); nose.scale.set(1.1, 0.9, 1); nose.position.set(r * 1.02, -r * 0.16, 0); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(r * 0.36, 24, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), mat(0x5A1E1A));
  mouth.scale.set(0.4, 0.6, 1.15); mouth.position.set(r * 0.9, -r * 0.4, 0); head.add(mouth);
  const teeth = box(0.014, r * 0.13, r * 0.62, mat(0xF7F3EA, { r: 0.3 })); teeth.position.set(r * 1.0, -r * 0.42, 0); head.add(teeth);
  if (L.beard !== 'none') {
    const bm = L.beard === 'stubble' ? new THREE.MeshStandardMaterial({ color: 0x2A1F19, roughness: 1, transparent: true, opacity: 0.42 }) : mat(0x17120F, { r: 0.9 });
    const thick = L.beard === 'full' ? 1.04 : L.beard === 'short' ? 1.02 : 1.008;
    const band = new THREE.Mesh(new THREE.SphereGeometry(r * 0.99, 32, 16, -Math.PI * 0.62, Math.PI * 1.24, Math.PI * 0.5, Math.PI * 0.4), bm);
    band.scale.set(thick, 1.05, thick); band.position.set(r * 0.06, -r * 0.2, 0); head.add(band);
    const chin = new THREE.Mesh(new THREE.SphereGeometry(r * 0.99, 32, 16, 0, Math.PI * 2, Math.PI * 0.76, Math.PI * 0.2), bm);
    chin.scale.set(thick, 1.05, thick); chin.position.set(r * 0.06, -r * 0.2, 0); head.add(chin);
    if (L.beard !== 'stubble') { const stache = capsule(r * 0.07, r * 0.42, bm); stache.rotation.x = Math.PI / 2; stache.position.set(r * 0.98, -r * 0.3, 0); head.add(stache); }
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), mHair);
  cap.scale.set(1.02, 1.1, 1.0); cap.position.y = r * 0.08; cap.rotation.z = 0.15; cap.castShadow = true; head.add(cap);
  for (const z of [1, -1]) { const side = sphere(r * 0.5, mat(HAIR_SIDE, { r: 0.9 }), 14); side.scale.set(1.2, 0.7, 0.25); side.position.set(-r * 0.15, r * 0.4, z * r * 0.88); head.add(side); }
  const v = L.hairVol;
  [[0.55, 0.95, 0, 0.32], [0.25, 1.05, 0.25, 0.3], [0.25, 1.05, -0.25, 0.3], [-0.1, 1.0, 0, 0.32], [-0.45, 0.85, 0, 0.3]].forEach(([x, y, z, rr]) => {
    const t = sphere(r * rr * (0.8 + 0.4 * v), mHair, 14); t.scale.set(1.3, 0.75 + 0.35 * v, 1.1); t.position.set(r * x, r * y * (0.95 + 0.1 * v), r * z); head.add(t);
  });
  if (L.cap) {
    const board = box(r * 2.6, 0.02, r * 2.6, mat(0x151110)); board.position.y = r * 1.32; board.rotation.y = Math.PI / 4; head.add(board);
    const crown = cyl(r * 0.95, r * 1.0, r * 0.4, mat(0x151110)); crown.position.y = r * 1.12; head.add(crown);
    const tassel = box(0.01, r * 0.8, 0.01, mat(0xF2A93B, { e: 0xF2A93B, ei: 0.3 })); tassel.position.set(r * 0.9, r * 0.95, r * 0.9); head.add(tassel);
  }

  const joints: JointState = {
    armFZ: 0, armFX: 0, armBZ: 0, armBX: 0,
    elbowFZ: 0.25, elbowFX: 0, elbowBZ: 0.25, elbowBX: 0,
    torsoZ: 0, torsoY: 0, headY: 0, headZ: 0, handHide: 0, transitionAlpha: 1, gait: 0, speed: 0, walkAmt: 0, vel: 0, glance: 0, glanceTarget: 0, nextGlance: 2 + stage, wave: 0
  };
  g.torso = torso; g.pelvis = pelvis;
  g.footF = legF.userData.foot as THREE.Group; g.footB = legB.userData.foot as THREE.Group;
  g.eyes = eyes; g.joints = joints; g.baseY = 0; g.facing = 1; g.blinkEvery = 3.2 + stage * 0.46;
  g.userData = { look: L, legF, legB, armF, armB, head, phone };
  return g;
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

  // Phase: one half-turn per step. The step length matches the leg swing, and cadence is capped at about three steps a second.
  const stepLen = 2 * legLen * Math.sin(Math.max(amp, 0.2));
  const maxRate = Math.PI * (2 + brisk);
  if (going) j.gait += Math.min(Math.abs(s.dx) * Math.PI / stepLen, maxRate * dt);
  else if (w > 0.02) { // finish the step he was on, then stand
    const rest = Math.ceil(j.gait / Math.PI - 0.15) * Math.PI;
    j.gait += Math.min(Math.max(0, rest - j.gait), Math.PI * 2.2 * dt);
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
  const solve = (leg: THREE.Group, f: { x: number; lift: number; pitch: number }) => {
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
    hideHands = 1; rate = 5;
  } else if (showPhone) {
    tArmFZ = 0.82 + Math.sin(s.time * 1.3) * 0.02; tElbowFZ = 1.3; tArmBZ = armSwing; tElbowBZ = 0.22; rate = 6;
  } else if (s.mode === 'idle') {
    tArmFZ = 0.02 + shift * 0.03; tArmBZ = -0.02 - shift * 0.03; tElbowFZ = 0.2; tElbowBZ = 0.2;
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
  const handScale = Math.max(0.02, 1 - j.handHide);
  const handF = armF.userData.hand as THREE.Object3D, handB = armB.userData.hand as THREE.Object3D;
  handF.visible = j.handHide < 0.92; handB.visible = j.handHide < 0.92;
  handF.scale.setScalar(handScale); handB.scale.setScalar(handScale);

  p.torso.rotation.z = j.torsoZ;
  p.torso.rotation.y = j.torsoY;
  p.torso.scale.y = 1 + Math.sin(s.time * 1.7) * 0.012 * (1 - w * 0.6); // breathing
  head.rotation.set(0, j.headY, j.headZ);

  const local = s.time % p.blinkEvery;
  const close = local < 0.06 ? local / 0.06 : local < 0.12 ? (0.12 - local) / 0.06 : 0;
  p.eyes.scale.y = 1 - close * 0.9;
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makePresence } from './presence';

// Him, as a properly made human: rigged avatars from the Microsoft Rocketbox library (MIT licence), moved by its
// motion-captured walk, idle, wave and texting clips. The walk is played by distance, not time, so he only takes
// a step when you scroll, and his feet keep pace with the road.

export interface ActorSpec {
  model: string;     // glb under people/
  skins: string;     // colour texture name prefix: `${skins}_body_color`, `${skins}_head_color`
  normals: string;   // normal map name prefix
  bones: string;     // the rig's bone prefix: the adults use Bip01, the children Bip02
  height: number;    // metres, to the top of his head
  tint?: number;     // a colour multiplied into his clothes, so each chapter dresses him differently
  prop?: Prop;       // what he carries in this chapter
}
export type Prop = 'schoolbag' | 'sling' | 'backpack' | 'umbrella';
export type ActorMode = 'walk' | 'idle' | 'wave' | 'phone' | 'pockets';
export interface ActorState {
  mode: ActorMode; moving: number; distance: number; dt: number;
  look: THREE.Vector3; // where his attention is, in the world
  gaze: number;        // how much of it: 0 leaves the captured motion alone, 1 is looking straight at it
}

export interface Actor {
  root: THREE.Group;
  phone: THREE.Object3D;
  update(s: ActorState): void;
}

const CLIPS = ['walk', 'idle', 'wave', 'phone'] as const;
const CLIP_HEIGHT = 1.615; // the adult the clips were captured on
// One full walk cycle (two steps) of the captured walk covers this much ground, in metres, at his height.
const STRIDE = 1.29;

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const models = new Map<string, Promise<THREE.Group>>();
const textures = new Map<string, Promise<THREE.Texture>>();
let clips: Promise<Record<string, THREE.AnimationClip>> | undefined;

const texture = (url: string, srgb: boolean) => {
  let t = textures.get(url);
  if (!t) {
    t = new THREE.TextureLoader().loadAsync(url).then((tex) => {
      tex.flipY = false; tex.anisotropy = 8;
      if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
    textures.set(url, t);
  }
  return t;
};

/** A clip made for one rig, renamed for another and scaled to a body of another height. Only rotations carry
 *  over, plus the root's movement, so a child isn't stretched to an adult's bone lengths. */
function retarget(clip: THREE.AnimationClip, bones: string, scale: number) {
  const tracks: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    const [node, prop] = [t.name.slice(0, t.name.lastIndexOf('.')), t.name.slice(t.name.lastIndexOf('.') + 1)];
    if (node.endsWith('Footsteps') || (prop !== 'quaternion' && !(prop === 'position' && node === 'Bip01'))) continue;
    const c = t.clone();
    c.name = node.replace(/^Bip01/, bones) + '.' + prop;
    if (prop === 'position') {
      // the captured walk carries him forward; take that out so only the scroll moves him, and keep the sway
      const v = c.values, n = c.times.length, t0 = c.times[0], span = Math.max(1e-6, c.times[n - 1] - t0);
      const drift = [0, 1, 2].map((k) => v[(n - 1) * 3 + k] - v[k]);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) v[i * 3 + k] = (v[i * 3 + k] - drift[k] * (c.times[i] - t0) / span) * scale;
    }
    tracks.push(c);
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

export async function makeActor(base: string, spec: ActorSpec): Promise<Actor> {
  clips ??= Promise.all(CLIPS.map((n) => loader.loadAsync(`${base}people/${n}.glb`).then((g) => [n, g.animations[0]] as const)))
    .then((list) => Object.fromEntries(list));
  let model = models.get(spec.model);
  if (!model) { model = loader.loadAsync(`${base}people/${spec.model}.glb`).then((g) => g.scene); models.set(spec.model, model); }
  const tex = (name: string, srgb: boolean) => texture(`${base}people/${name}.webp`, srgb);
  const [src, all, bodyMap, headMap, bodyNormal, headNormal, bodyRough, headRough] = await Promise.all([
    model, clips, tex(`${spec.skins}_body_color`, true), tex(`${spec.skins}_head_color`, true),
    tex(`${spec.normals}_body_normal`, false), tex(`${spec.normals}_head_normal`, false),
    tex(`${spec.normals}_body_rough`, false), tex(`${spec.normals}_head_rough`, false),
  ]);

  const body = cloneSkinned(src) as THREE.Group;
  body.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    m.material = (Array.isArray(m.material) ? m.material : [m.material]).map((old) => {
      const head = old.name.endsWith('head');
      // skin and cloth each get their own finish: the artist's shine maps say where (lips, eyes, nose, leather),
      // and skin has a faint sheen, the soft glow at grazing angles that makes it read as skin, not plastic
      const mat = new THREE.MeshPhysicalMaterial({
        name: old.name, map: head ? headMap : bodyMap, normalMap: head ? headNormal : bodyNormal,
        roughnessMap: head ? headRough : bodyRough, roughness: 1, metalness: 0,
        sheen: head ? 0.12 : 0.25, sheenRoughness: head ? 0.65 : 0.8, sheenColor: new THREE.Color(head ? 0xFFC9A8 : 0x9AA0A8),
      });
      dress(mat, head ? undefined : spec.tint);
      return mat;
    }) as unknown as THREE.Material;
    if ((m.material as unknown as THREE.Material[]).length === 1) m.material = (m.material as unknown as THREE.Material[])[0];
  });
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const scale = spec.height / Math.max(0.1, box.max.y - box.min.y);
  body.scale.setScalar(scale);
  body.rotation.y = Math.PI / 2; // the avatars face +z; the road runs along +x
  const root = new THREE.Group(); root.add(body);
  root.add(contactShadow(spec.height));

  const mixer = new THREE.AnimationMixer(body);
  const clipScale = spec.height / scale / CLIP_HEIGHT; // the root's movement, in the model's own units
  const act = Object.fromEntries(CLIPS.map((n) => {
    const a = mixer.clipAction(retarget(all[n], spec.bones, clipScale));
    a.play(); a.setEffectiveWeight(n === 'idle' ? 1 : 0);
    return [n, a];
  })) as Record<(typeof CLIPS)[number], THREE.AnimationAction>;
  act.walk.timeScale = 0; // driven by distance below
  act.wave.setLoop(THREE.LoopOnce, 1); act.wave.clampWhenFinished = true; // a wave is a single gesture, not a loop
  const weight = { walk: 0, idle: 1, wave: 0, phone: 0 };
  // Learn which way his face and eyes point from the rig's rest pose; fit what he carries to him standing at ease.
  const presence = makePresence(body, spec.bones);
  mixer.update(0); root.updateMatrixWorld(true);
  const carried = spec.prop ? carry(body, spec.prop, spec.height, spec.bones) : undefined;
  if (carried?.umbrella) root.add(carried.umbrella);
  let previousMode: ActorMode = 'idle';
  const stride = STRIDE * spec.height / 1.74;
  // His feet count the ground he covers in the direction he faces, so when he turns round to walk back he
  // walks forwards, and when he turns on the spot he takes a few small steps instead of spinning on his heels.
  let gait = 0, lastDistance = NaN, lastYaw = NaN, speed = 0, accel = 0, gazeWas = 0, lastFlash = -99, clock = 0;
  const facing = new THREE.Vector3(), left = new THREE.Vector3(), grip = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const chest = body.getObjectByName(`${spec.bones}_Spine2`) ?? body.getObjectByName(`${spec.bones} Spine2`);
  const leftHand = body.getObjectByName(`${spec.bones}_L_Hand`) ?? body.getObjectByName(`${spec.bones} L Hand`);

  // a phone for the end of the story, in his right hand
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.009), new THREE.MeshStandardMaterial({ color: 0x15171A, roughness: 0.35, metalness: 0.4, emissive: 0x9FC3FF, emissiveIntensity: 0 }));
  const hand = body.getObjectByName(`${spec.bones}_R_Hand`) ?? body.getObjectByName(`${spec.bones} R Hand`);
  phone.visible = false;
  if (hand) { hand.add(phone); phone.scale.setScalar(1 / scale); phone.position.set(0.09 / scale, 0.02 / scale, 0.03 / scale); phone.rotation.set(0, 0, Math.PI / 2); }

  return {
    root, phone,
    update(s) {
      const dt = Math.max(0, Math.min(0.1, s.dt));
      clock += dt;
      const yaw = root.rotation.y;
      facing.set(Math.cos(yaw), 0, -Math.sin(yaw));
      let moved = Number.isNaN(lastDistance) ? 0 : s.distance - lastDistance;
      if (Math.abs(moved) > 1) moved = 0; // a cut, not a step
      const turned = Number.isNaN(lastYaw) ? 0 : yaw - lastYaw;
      lastDistance = s.distance; lastYaw = yaw;
      gait += moved * Math.cos(yaw) + Math.abs(turned) * 0.3 * spec.height / 1.74;
      if (dt > 0) {
        const v = moved / dt;
        accel += ((v - speed) / dt - accel) * (1 - Math.exp(-dt * 6));
        speed = v;
      }
      const stepping = Math.min(1, Math.abs(turned) / Math.max(dt, 1e-3) * 0.7);

      const target = { walk: 0, idle: 0, wave: 0, phone: 0 };
      if (s.mode === 'phone') target.phone = 1;
      else if (s.mode === 'wave') target.wave = 1;
      else { target.walk = Math.max(THREE.MathUtils.smoothstep(s.moving, 0.015, 0.25), stepping * 0.8); target.idle = 1 - target.walk; }
      if (s.mode !== previousMode) {
        if (s.mode === 'phone') act.phone.reset().play();
        if (s.mode === 'wave') { act.wave.reset().play(); presence?.flash(); lastFlash = clock; }
        previousMode = s.mode;
      }
      // Catching your eye after a while walking, he gives you a small lift of the eyebrows.
      if (s.gaze > 0.6 && gazeWas <= 0.6 && clock - lastFlash > 14) { presence?.flash(); lastFlash = clock; }
      gazeWas = s.gaze;
      const k = 1 - Math.exp(-dt * 6);
      let sum = 0;
      for (const n of CLIPS) { weight[n] += (target[n] - weight[n]) * k; sum += weight[n]; }
      for (const n of CLIPS) act[n].setEffectiveWeight(weight[n] / Math.max(sum, 1e-4));
      // the walk plays by distance: one cycle per stride, backwards if he steps back
      const cycle = ((gait / stride) % 1 + 1) % 1;
      act.walk.time = cycle * act.walk.getClip().duration;
      // starting the wave from its beginning each time he waves
      if (target.wave === 0 && weight.wave < 0.01) act.wave.time = 0;
      phone.visible = weight.phone > 0.5;
      (phone.material as THREE.MeshStandardMaterial).emissiveIntensity = weight.phone * 0.15;
      mixer.update(dt);
      root.updateMatrixWorld(true);

      // The umbrella is held out in front of his chest, where his left hand meets it.
      if (carried?.umbrella && chest) {
        left.crossVectors(up, facing);
        chest.getWorldPosition(grip).addScaledVector(facing, 0.3).addScaledVector(up, -0.1).addScaledVector(left, 0.06);
      }
      presence?.update({ dt, look: s.look, gaze: s.gaze, facing, accel, speed: Math.abs(speed), grip: carried?.umbrella ? grip : undefined });
      if (carried?.umbrella && leftHand) {
        leftHand.getWorldPosition(grip);
        carried.umbrella.position.copy(root.worldToLocal(grip));
        carried.umbrella.rotation.z = 0.24 - Math.max(-0.1, Math.min(0.1, speed * 0.06)); // tipped back over his head, and a little into the wind as he walks
      }
    },
  };
}

/** A soft dark patch where he meets the ground. The sun's shadow does this by day; at night and in the rain he
 *  would otherwise seem to float. */
function contactShadow(height: number) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!, grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(0.45, 'rgba(0,0,0,0.3)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x000000, polygonOffset: true, polygonOffsetFactor: -2 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.04;
  shadow.scale.set(0.62 * height / 1.74, 0.5 * height / 1.74, 1);
  shadow.renderOrder = 1;
  return shadow;
}

/** Make what he carries, fitted to his body as it stands in its rest pose: bags strapped to his back or across
 *  his chest so they move with him, an umbrella to be held. */
function carry(body: THREE.Object3D, prop: Prop, height: number, bones: string) {
  body.updateMatrixWorld(true);
  const k = height / 1.74;
  // how far his body reaches front and back at a height, from the mesh itself
  const torso = (y: number) => {
    let front = -Infinity, back = Infinity;
    const v = new THREE.Vector3();
    body.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        m.applyBoneTransform(i, v.fromBufferAttribute(pos, i)).applyMatrix4(m.matrixWorld);
        if (Math.abs(v.y - y) > 0.025 || Math.abs(v.z) > 0.16 * k) continue;
        front = Math.max(front, v.x); back = Math.min(back, v.x);
      }
    });
    return Number.isFinite(front) ? { front, back } : { front: 0.12 * k, back: -0.12 * k };
  };
  const bone = (n: string) => body.getObjectByName(`${bones}_${n}`) ?? body.getObjectByName(`${bones} ${n}`);
  const chest = bone('Spine2'), pelvis = bone('Pelvis');
  const fabric = (color: number, r = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: 0 });
  const box = (w: number, h: number, d: number, m: THREE.Material, radius = 0.02) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(d, h, w, 2, radius), m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  };
  const strap = (from: THREE.Vector3, to: THREE.Vector3, m: THREE.Material, width = 0.035) => {
    const s = box(width, from.distanceTo(to), 0.008, m, 0.003);
    s.position.lerpVectors(from, to, 0.5);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return s;
  };
  // parts are placed in his own frame (the root's, which is still at the origin), then handed to a bone
  const fasten = (to: THREE.Object3D | undefined, ...parts: THREE.Object3D[]) => parts.forEach((p) => { body.parent!.add(p); p.updateMatrixWorld(true); (to ?? body).attach(p); });

  if (prop === 'umbrella') {
    // A plain black umbrella: eight panels on ribs, a shaft, a crook handle. Its origin is where the hand holds it.
    const umbrella = new THREE.Group();
    const canopyMat = new THREE.MeshPhysicalMaterial({ color: 0x15181E, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide, flatShading: true });
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 8, 5, Math.PI / 8, Math.PI * 2, 0, 0.92), canopyMat);
    canopy.position.y = 0.98 - 0.72; canopy.castShadow = true; umbrella.add(canopy);
    const metal = new THREE.MeshStandardMaterial({ color: 0x9A9EA4, roughness: 0.35, metalness: 0.9 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1.04, 6), metal);
    shaft.position.y = 0.48; umbrella.add(shaft);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), fabric(0x3A2A1E, 0.5));
    handle.position.set(0.035, -0.06, 0); handle.rotation.z = Math.PI; umbrella.add(handle);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.05, 6), metal);
    tip.position.y = 1.0; umbrella.add(tip);
    umbrella.scale.setScalar(k);
    return { umbrella };
  }

  const y = (f: number) => f * height;
  const chestY = y(0.7), t = torso(chestY), lower = torso(y(0.6));
  const back = Math.min(t.back, lower.back), front = Math.max(t.front, torso(y(0.76)).front);
  if (prop === 'schoolbag' || prop === 'backpack') {
    // a backpack: the pack itself, its front pocket, and the shoulder straps rising to his shoulders
    const school = prop === 'schoolbag';
    const m = fabric(school ? 0x2F4E8C : 0x23272D), trim = fabric(school ? 0xC8A23A : 0x3A3F46, 0.7);
    const w = (school ? 0.28 : 0.3) * k, h = (school ? 0.34 : 0.42) * k, d = (school ? 0.12 : 0.13) * k;
    const pack = box(w, h, d, m, 0.035 * k); pack.position.set(back - d / 2 + 0.01, y(0.64), 0);
    const pocket = box(w * 0.7, h * 0.4, d * 0.4, trim, 0.02 * k); pocket.position.set(back - d - d * 0.1, y(0.6), 0);
    const parts: THREE.Object3D[] = [pack, pocket];
    for (const z of [-0.085 * k, 0.085 * k]) {
      parts.push(strap(new THREE.Vector3(back + 0.01, y(0.74), z), new THREE.Vector3((front + back) / 2, y(0.815), z), trim));
    }
    fasten(chest, ...parts);
  } else {
    // a small sling bag at his hip, its strap running from his left shoulder across his chest
    const m = fabric(0x2B2F2A), trim = fabric(0x161816, 0.7);
    const bag = box(0.2 * k, 0.15 * k, 0.07 * k, m, 0.025 * k);
    const hip = torso(y(0.52));
    bag.position.set(hip.front + 0.02 * k, y(0.5), 0.09 * k);
    const from = new THREE.Vector3((front + back) / 2, y(0.815), -0.09 * k), to = new THREE.Vector3(hip.front + 0.02 * k, y(0.56), 0.1 * k);
    const mid = new THREE.Vector3(front + 0.01, y(0.7), 0);
    fasten(pelvis, bag);
    fasten(chest, strap(from, mid, trim, 0.03 * k), strap(mid, to, trim, 0.03 * k));
  }
  return { umbrella: undefined };
}

/** The light that edges him against the scene, like a film's back light; the walk sets it to each place's sky. */
export const rimLight = { color: { value: new THREE.Color(0xBFD4FF) }, strength: { value: 0.35 } };

/** Add the rim light to his materials and, for his top, dye its strongly coloured panels, keeping their shading;
 *  skin, denim, white and black stay. */
function dress(mat: THREE.MeshPhysicalMaterial, tint?: number) {
  const c = new THREE.Color(tint ?? 0xffffff);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tint = { value: c };
    sh.uniforms.rimColor = rimLight.color; sh.uniforms.rimStrength = rimLight.strength;
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec3 tint, rimColor; uniform float rimStrength;\nvoid main() {')
      .replace('#include <map_fragment>', tint === undefined ? '#include <map_fragment>' : `#include <map_fragment>
        {
          vec3 t = diffuseColor.rgb;
          float hi = max(t.r, max(t.g, t.b)), lo = min(t.r, min(t.g, t.b));
          float dyed = smoothstep(0.04, 0.1, (hi - lo) / max(hi, 1e-3) * hi) * step(max(t.r, t.g), t.b);
          vec3 c = tint * (hi / max(max(tint.r, max(tint.g, tint.b)), 1e-3));
          diffuseColor.rgb = mix(t, c, dyed);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
          totalEmissiveRadiance += rimColor * rim * rimStrength * (0.4 + 0.6 * diffuseColor.rgb);
        }`);
  };
  mat.customProgramCacheKey = () => `dress-${tint ?? 'none'}`;
}

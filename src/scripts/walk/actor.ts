import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

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
}
export type ActorMode = 'walk' | 'idle' | 'wave' | 'phone' | 'pockets';
export interface ActorState { mode: ActorMode; moving: number; distance: number; dt: number }

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
      tex.flipY = false; tex.anisotropy = 4;
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
  const [src, all, bodyMap, headMap, bodyNormal, headNormal] = await Promise.all([
    model, clips, tex(`${spec.skins}_body_color`, true), tex(`${spec.skins}_head_color`, true),
    tex(`${spec.normals}_body_normal`, false), tex(`${spec.normals}_head_normal`, false),
  ]);

  const body = cloneSkinned(src) as THREE.Group;
  body.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    m.material = (Array.isArray(m.material) ? m.material : [m.material]).map((old) => {
      const head = old.name.endsWith('head');
      const mat = new THREE.MeshStandardMaterial({
        name: old.name, map: head ? headMap : bodyMap, normalMap: head ? headNormal : bodyNormal,
        roughness: head ? 0.62 : 0.82, metalness: 0,
      });
      if (!head && spec.tint !== undefined) tintClothes(mat, spec.tint);
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

  const mixer = new THREE.AnimationMixer(body);
  const clipScale = spec.height / scale / CLIP_HEIGHT; // the root's movement, in the model's own units
  const act = Object.fromEntries(CLIPS.map((n) => {
    const a = mixer.clipAction(retarget(all[n], spec.bones, clipScale));
    a.play(); a.setEffectiveWeight(n === 'idle' ? 1 : 0);
    return [n, a];
  })) as Record<(typeof CLIPS)[number], THREE.AnimationAction>;
  act.walk.timeScale = 0; // driven by distance below
  const weight = { walk: 0, idle: 1, wave: 0, phone: 0 };
  const stride = STRIDE * spec.height / 1.74;

  // a phone for the end of the story, in his right hand
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.009), new THREE.MeshStandardMaterial({ color: 0x15171A, roughness: 0.35, metalness: 0.4, emissive: 0x9FC3FF, emissiveIntensity: 0 }));
  const hand = body.getObjectByName(`${spec.bones}_R_Hand`) ?? body.getObjectByName(`${spec.bones} R Hand`);
  phone.visible = false;
  if (hand) { hand.add(phone); phone.scale.setScalar(1 / scale); phone.position.set(0.09 / scale, 0.02 / scale, 0.03 / scale); phone.rotation.set(0, 0, Math.PI / 2); }

  return {
    root, phone,
    update(s) {
      const dt = Math.max(0, Math.min(0.1, s.dt));
      const target = { walk: 0, idle: 0, wave: 0, phone: 0 };
      if (s.mode === 'phone') target.phone = 1;
      else if (s.mode === 'wave') target.wave = 1;
      else { target.walk = clamp01(s.moving * 1.6); target.idle = 1 - target.walk; }
      const k = 1 - Math.exp(-dt * 6);
      let sum = 0;
      for (const n of CLIPS) { weight[n] += (target[n] - weight[n]) * k; sum += weight[n]; }
      for (const n of CLIPS) act[n].setEffectiveWeight(weight[n] / Math.max(sum, 1e-4));
      // the walk plays by distance: one cycle per stride, backwards if he steps back
      const cycle = ((s.distance / stride) % 1 + 1) % 1;
      act.walk.time = cycle * act.walk.getClip().duration;
      // starting the wave from its beginning each time he waves
      if (target.wave === 0 && weight.wave < 0.01) act.wave.time = 0;
      phone.visible = weight.phone > 0.5;
      (phone.material as THREE.MeshStandardMaterial).emissiveIntensity = weight.phone * 0.6;
      mixer.update(dt);
    },
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Recolour the strongly coloured panels of his top, keeping their shading; skin, denim, white and black stay. */
function tintClothes(mat: THREE.MeshStandardMaterial, tint: number) {
  const c = new THREE.Color(tint);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tint = { value: c };
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec3 tint;\nvoid main() {')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 t = diffuseColor.rgb;
          float hi = max(t.r, max(t.g, t.b)), lo = min(t.r, min(t.g, t.b));
          float dyed = smoothstep(0.04, 0.1, (hi - lo) / max(hi, 1e-3) * hi) * step(max(t.r, t.g), t.b);
          vec3 c = tint * (hi / max(max(tint.r, max(tint.g, tint.b)), 1e-3));
          diffuseColor.rgb = mix(t, c, dyed);
        }`);
  };
  mat.customProgramCacheKey = () => `tint-${tint}`;
}

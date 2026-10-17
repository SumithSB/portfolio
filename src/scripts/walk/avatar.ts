import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// A rigged, motion-captured figure (any Mixamo-style skeleton). Idle, walk and run are blended by how fast he
// actually moves, and each clip plays at the rate that keeps the planted foot still. Waving and holding the phone
// are layered on top by aiming the arm bones in world space, so they work on any rig with the usual bone names.

export type AvatarMode = 'walk' | 'idle' | 'wave' | 'phone' | 'pockets';
export interface AvatarState {
  dt: number;
  time: number;
  speed: number;   // along the road, units per second
  mode: AvatarMode;
  look: number;    // -1..1, where the head turns
  turn: number;    // 0 walking along the road, 1 turned toward the camera
}

// Planted-foot speeds of the clips at a 1.8 m figure, measured offline (units per second at time scale 1).
const CLIP_SPEED = { walk: 1.558, run: 3.517 };
const MODEL_HEIGHT = 1.8;

const UP = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();

const key = (name: string) => name.replace(/^mixamorig:?/i, '').replace(/[:_\s]/g, '').toLowerCase();

export interface Avatar {
  root: THREE.Group;
  phone: THREE.Object3D;
  setHeight(h: number): void;
  update(s: AvatarState): void;
}

export async function loadAvatar(url: string, clipsUrl?: string): Promise<Avatar> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  // Clips can come from the avatar itself, or from a separate file with the same skeleton names.
  const clipSource = clipsUrl ? (await loader.loadAsync(clipsUrl)).animations : gltf.animations;

  const model = gltf.scene;
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
  });
  const bones = new Map<string, THREE.Object3D>();
  model.traverse((o) => { if ((o as THREE.Bone).isBone || /hips|spine|arm|hand|head|neck|leg|foot/i.test(o.name)) bones.set(key(o.name), o); });
  const bone = (n: string) => bones.get(n.toLowerCase());

  // Point every track at this model's bones, whatever prefix the clip's rig used. Positions are dropped (the clips are
  // in place and rigs differ in scale); rotations carry the motion.
  const retarget = (clip: THREE.AnimationClip) => {
    const tracks = clip.tracks.flatMap((t) => {
      const [node, prop] = [t.name.slice(0, t.name.lastIndexOf('.')), t.name.slice(t.name.lastIndexOf('.') + 1)];
      const b = bones.get(key(node));
      if (!b || prop !== 'quaternion') return [];
      const c = t.clone(); c.name = `${b.name}.${prop}`; return [c];
    });
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  };
  const find = (n: string) => clipSource.find((c) => c.name.toLowerCase() === n);
  const mixer = new THREE.AnimationMixer(model);
  const act = (n: string) => { const c = find(n); if (!c) return null; const a = mixer.clipAction(retarget(c)); a.play(); a.setEffectiveWeight(0); return a; };
  const idle = act('idle'), walk = act('walk'), run = act('run');
  if (!idle || !walk) throw new Error('avatar needs idle and walk clips');
  idle.setEffectiveWeight(1);

  const root = new THREE.Group();
  root.add(model);

  // The phone lives in his right hand; sized in world units whatever the rig's scale.
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.009), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.35, metalness: 0.4 }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), new THREE.MeshStandardMaterial({ color: 0x9fd0f0, emissive: 0x6fb0e8, emissiveIntensity: 0.35 }));
  screen.position.z = 0.0048; phone.add(body, screen); phone.visible = false;
  const hand = bone('righthand');
  if (hand) hand.add(phone);

  let scale = 1;
  const w = { idle: 1, walk: 0, run: 0, wave: 0, phone: 0, turn: 0, look: 0 };
  const e = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

  // Turn a bone so the direction to its child points along `dir` (world space), blended by `amt`.
  const aim = (b: THREE.Object3D | undefined, child: THREE.Object3D | undefined, dir: THREE.Vector3, amt: number) => {
    if (!b || !child || amt < 0.001) return;
    b.updateWorldMatrix(true, true);
    b.getWorldPosition(v1); child.getWorldPosition(v2);
    const cur = v2.sub(v1).normalize();
    q1.setFromUnitVectors(cur, dir);                    // world-space correction
    b.getWorldQuaternion(q2);
    q3.copy(q1).multiply(q2);                            // desired world rotation
    b.parent!.getWorldQuaternion(q1).invert();
    q3.premultiply(q1);                                  // back to local
    b.quaternion.slerp(q3, amt);
  };

  return {
    root,
    phone,
    setHeight(h: number) { scale = h / MODEL_HEIGHT; model.scale.setScalar(scale); },
    update(s: AvatarState) {
      const dt = Math.min(0.1, s.dt);
      const v = Math.abs(s.speed);
      const walkV = CLIP_SPEED.walk * scale, runV = CLIP_SPEED.run * scale;
      const moving = s.mode === 'walk' ? Math.min(1, v / (walkV * 0.35)) : 0;
      // Only a real hurry turns into a run; a brisk walk stays a walk.
      const runMix = run ? THREE.MathUtils.clamp((v - walkV * 1.6) / (runV * 0.9 - walkV * 1.6), 0, 1) : 0;
      w.walk += (moving * (1 - runMix) - w.walk) * e(dt, moving > w.walk ? 8 : 4);
      w.run += (moving * runMix - w.run) * e(dt, 6);
      w.idle = Math.max(0, 1 - w.walk - w.run);
      idle.setEffectiveWeight(w.idle);
      walk.setEffectiveWeight(w.walk);
      // Play each clip at the rate that keeps the planted foot still at this speed.
      walk.setEffectiveTimeScale(THREE.MathUtils.clamp(v / walkV, 0.6, 1.5));
      if (run) {
        run.setEffectiveWeight(w.run);
        run.setEffectiveTimeScale(THREE.MathUtils.clamp(v / runV, 0.7, 1.3));
        // keep the run in step with the walk so blending between them never scissors the legs
        run.time = (walk.time / walk.getClip().duration) * run.getClip().duration;
      }
      mixer.update(dt);

      // Facing: along the road (+x), easing round toward the camera (+z) when he stops.
      w.turn += (s.turn - w.turn) * e(dt, 3);
      model.rotation.y = Math.PI / 2 - w.turn * 1.15;
      model.updateMatrixWorld(true);

      const F = v1.set(0, 0, 1).applyQuaternion(model.getWorldQuaternion(q1)).clone();
      const R = F.clone().cross(UP).normalize(); // his right
      w.wave += ((s.mode === 'wave' ? 1 : 0) - w.wave) * e(dt, s.mode === 'wave' ? 4 : 5);
      w.phone += ((s.mode === 'phone' ? 1 : 0) - w.phone) * e(dt, 3);
      phone.visible = w.phone > 0.3;
      if (hand && phone.visible) {
        hand.getWorldScale(v2); phone.scale.setScalar(1 / v2.x);
        phone.position.set(0, 0.09 / v2.x, 0.03 / v2.x); phone.rotation.set(0.3, 0, 0);
      }

      const arm = bone('rightarm'), fore = bone('rightforearm'), handB = bone('righthand');
      if (w.wave > 0.001) {
        aim(arm, fore, R.clone().multiplyScalar(0.55).add(UP.clone().multiplyScalar(0.75)).add(F.clone().multiplyScalar(0.12)).normalize(), w.wave);
        aim(fore, handB, UP.clone().add(R.clone().multiplyScalar(Math.sin(s.time * 7.5) * 0.4)).normalize(), w.wave);
      }
      if (w.phone > 0.001) {
        aim(arm, fore, UP.clone().multiplyScalar(-0.88).add(F.clone().multiplyScalar(0.32)).add(R.clone().multiplyScalar(0.12)).normalize(), w.phone);
        aim(fore, handB, F.clone().multiplyScalar(0.8).add(UP.clone().multiplyScalar(0.5)).add(R.clone().multiplyScalar(-0.3)).normalize(), w.phone);
      }

      // Head: looks where you point, and down at the phone.
      w.look += (s.look - w.look) * e(dt, 5);
      const head = bone('head');
      if (head) {
        head.updateWorldMatrix(true, false);
        q1.setFromAxisAngle(UP, w.look * 0.5);
        q2.setFromAxisAngle(R, w.phone * 0.35);
        head.getWorldQuaternion(q3);
        const want = q1.multiply(q2).multiply(q3);
        head.parent!.getWorldQuaternion(q2).invert();
        head.quaternion.copy(want.premultiply(q2));
      }
    },
  };
}

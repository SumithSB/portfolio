import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { dims } from './looks';
import { weigh, type Segment } from './sculpt';
import type { Person } from './person';

// Puts a generated, photo-real model of him onto the skeleton the walk already drives. The model is scaled to the
// figure's height, turned to face along the road, and each vertex is weighted to the bones nearest it, so the
// same gait, wave and phone poses move it.

/** Bone segments in the figure's rest pose, in the same order as the skeleton's bones. */
function segments(stage: number): Segment[] {
  const { H, r, torsoLen, hipY, shY, zL, shZ, shJY, kneeY, ankleY, elbowY, wristY, headY, elbowOut, wristOut } = dims(stage);
  const leg = (z: number, b0: number): Segment[] => [
    { bone: b0, a: [0, hipY, z], b: [0, kneeY, z] },
    { bone: b0 + 1, a: [0, kneeY, z], b: [0, ankleY, z] },
    { bone: b0 + 2, a: [0, ankleY, z], b: [0.11 * H, ankleY - 0.02 * H, z] },
  ];
  const arm = (z: number, b0: number): Segment[] => {
    const s = Math.sign(z), ez = z + s * elbowOut, wz = z + s * wristOut;
    return [
      { bone: b0, a: [0, shJY, z], b: [0, elbowY, ez] },
      { bone: b0 + 1, a: [0, elbowY, ez], b: [0, wristY, wz] },
      { bone: b0 + 2, a: [0, wristY, wz], b: [0, wristY - 0.09 * H, wz] },
    ];
  };
  return [
    { bone: 0, a: [0, hipY - 0.08, 0], b: [0, hipY + 0.1 * torsoLen, 0] },
    ...leg(zL, 1), ...leg(-zL, 4),
    { bone: 7, a: [0, hipY + 0.45 * torsoLen, 0], b: [0, shY, 0] },
    ...arm(shZ, 8), ...arm(-shZ, 11),
    { bone: 14, a: [0, headY - 0.9 * r, 0], b: [0, headY + r, 0] },
  ];
}

export interface RealOptions { yaw?: number }

/** Replace the sculpted body of `p` with the model at `url`. Resolves once the swap is done. */
export async function wearModel(p: Person, stage: number, url: string, opts: RealOptions = {}) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  let src: THREE.Mesh | undefined;
  gltf.scene.traverse((o) => { if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh; });
  if (!src) throw new Error('no mesh in model');

  // Bake its transform, turn it to face +x, stand it on the ground and size it to the figure.
  const geo = src.geometry.clone();
  geo.applyMatrix4(src.matrixWorld);
  geo.rotateY(opts.yaw ?? Math.PI / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox!, d = dims(stage);
  const height = d.headY + 1.17 * d.r;
  const s = height / (bb.max.y - bb.min.y);
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  geo.scale(s, s, s);

  // Weights: each vertex follows the nearest few bones, the head rigidly.
  const segs = segments(stage);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const si = new Uint16Array(pos.count * 4), sw = new Float32Array(pos.count * 4);
  const neckTop = d.headY - 0.95 * d.r;
  for (let v = 0; v < pos.count; v++) {
    const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
    if (y > neckTop + 0.04 * d.r) { si[v * 4] = 14; sw[v * 4] = 1; continue; }
    const { i, w } = weigh(x, y, z, segs, 0.018 * d.H);
    for (let k = 0; k < 4; k++) { si[v * 4 + k] = i[k]; sw[v * 4 + k] = w[k]; }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));

  const old = p.children.find((c) => (c as THREE.SkinnedMesh).isSkinnedMesh) as THREE.SkinnedMesh;
  const mat = (src.material as THREE.MeshStandardMaterial).clone();
  mat.roughness = Math.max(0.55, mat.roughness ?? 0.7); mat.metalness = 0;
  const skin = new THREE.SkinnedMesh(geo, mat);
  skin.castShadow = true; skin.receiveShadow = true; skin.frustumCulled = false;
  p.add(skin);
  skin.bind(old.skeleton, old.bindMatrix);

  // The drawn hair, beard and face belong to the sculpted figure; the model has its own.
  const head = p.userData.head;
  head.children.forEach((c) => { if (!(c as THREE.Bone).isBone) c.visible = false; });
  old.visible = false;
}

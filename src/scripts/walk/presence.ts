import * as THREE from 'three';

// What makes him a person rather than a playback: where he looks, how he blinks, that he breathes, and how his
// body answers a start or a stop. It is layered on after the mixer has posed him, and worked out in world space,
// so it never depends on how each bone's axes happen to be set up in the rig.

export interface Presence {
  /** Run after the mixer, every frame. `look` is a point in the world, `gaze` how much he attends to it. */
  update(o: { dt: number; look: THREE.Vector3; gaze: number; facing: THREE.Vector3; accel: number; speed: number; grip?: THREE.Vector3 }): void;
  /** Eyebrows up and down: the quick, universal hello people give when they recognise someone. */
  flash(): void;
}

const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qd = new THREE.Quaternion();
const _v = new THREE.Vector3(), _f = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const _id = new THREE.Quaternion(), _side = new THREE.Vector3();

/** Turn a bone by a rotation given in world space. */
function turnWorld(bone: THREE.Object3D, delta: THREE.Quaternion) {
  bone.getWorldQuaternion(_q);
  bone.parent!.getWorldQuaternion(_qp);
  bone.quaternion.copy(_qp.invert().multiply(delta).multiply(_q));
  bone.updateMatrixWorld(true);
}

/** The rotation, in world space, that would point `fwd` (a direction in `from`'s own space) at `target`, by `share` of
 *  the way and at most `max` radians. */
function aimDelta(fwd: THREE.Vector3, from: THREE.Object3D, target: THREE.Vector3, share: number, max: number) {
  from.getWorldQuaternion(_qp);
  _f.copy(fwd).applyQuaternion(_qp);
  from.getWorldPosition(_p);
  _d.copy(target).sub(_p).normalize();
  const angle = _f.angleTo(_d);
  if (angle > max) _d.lerpVectors(_f, _d, max / angle).normalize();
  return _qd.setFromUnitVectors(_f, _d).slerp(_id, 1 - share);
}

/** A direction in a bone's own space that points along `world` while the rig stands in its rest pose. */
function localDir(bone: THREE.Object3D, world: THREE.Vector3) {
  return world.clone().applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
}

/** `metres` along `world`, expressed in the coordinates of `bone`'s parent (where its position lives). */
function parentOffset(bone: THREE.Object3D, world: THREE.Vector3, metres: number) {
  const parent = bone.parent!;
  const s = parent.getWorldScale(new THREE.Vector3()).x;
  return localDir(parent, world).multiplyScalar(metres / s);
}

const _s = new THREE.Vector3(), _e = new THREE.Vector3(), _h = new THREE.Vector3(), _t = new THREE.Vector3(), _pole = new THREE.Vector3();
/** Two-bone reach: put the hand at `target`, the elbow bending toward `pole`. */
function reach(upper: THREE.Object3D, fore: THREE.Object3D, hand: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3) {
  upper.getWorldPosition(_s); fore.getWorldPosition(_e); hand.getWorldPosition(_h);
  const a = _e.distanceTo(_s), b = _h.distanceTo(_e);
  _d.copy(target).sub(_s);
  const d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, _d.length()));
  _d.normalize();
  const along = (a * a - b * b + d * d) / (2 * d), out = Math.sqrt(Math.max(0, a * a - along * along));
  _pole.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
  _t.copy(_s).addScaledVector(_d, along).addScaledVector(_pole, out); // where the elbow goes
  turnWorld(upper, _qd.setFromUnitVectors(_f.copy(_e).sub(_s).normalize(), _p.copy(_t).sub(_s).normalize()));
  fore.getWorldPosition(_e); hand.getWorldPosition(_h);
  _t.copy(_s).addScaledVector(_d, d);
  turnWorld(fore, _qd.setFromUnitVectors(_f.copy(_h).sub(_e).normalize(), _p.copy(_t).sub(_e).normalize()));
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Call with the body in its rest pose, turned to face +x, before anything has animated it. */
export function makePresence(body: THREE.Object3D, prefix: string): Presence | null {
  body.updateMatrixWorld(true);
  const bone = (n: string) => body.getObjectByName(`${prefix}_${n.replace(/ /g, '_')}`) ?? body.getObjectByName(`${prefix} ${n}`);
  const head = bone('Head'), neck = bone('Neck'), chest = bone('Spine2'), spine = bone('Spine');
  if (!head || !neck || !chest || !spine) return null;
  const arm = ['L UpperArm', 'L Forearm', 'L Hand'].map(bone);
  const ahead = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 1, 0);
  const face = localDir(head, ahead);
  const eyes = ['REye', 'LEye'].map(bone).filter(Boolean).map((e) => ({ bone: e!, fwd: localDir(e!, ahead) }));

  // Lids and brows move by sliding, not turning. Each lid closes toward the other one.
  const lids = (['R', 'L'] as const).flatMap((s) => {
    const top = bone(`${s}EyeBlinkTop`), bottom = bone(`${s}EyeBlinkBottom`);
    if (!top || !bottom || top.parent !== bottom.parent) return [];
    return [{ top, bottom, top0: top.position.clone(), bottom0: bottom.position.clone() }];
  });
  const brows = ['RInnerEyebrow', 'LInnerEyebrow', 'MMiddleEyebrow', 'ROuterEyebrow', 'LOuterEyebrow'].map(bone).filter(Boolean)
    .map((b) => ({ bone: b!, rest: b!.position.clone(), lift: parentOffset(b!, up, b!.name.includes('Outer') ? 0.0045 : 0.006) }));

  // Gaze: the eyes get there first, the head follows a beat later, the way people actually look round.
  const eyeAt = new THREE.Vector3(), headAt = new THREE.Vector3();
  let started = false, attention = 0;
  // Saccades: while he holds your gaze his eyes flick between your eyes and your mouth, a degree or two apart.
  const glint = new THREE.Vector3(); let nextGlint = 0;
  let blink = -1, nextBlink = rand(1, 4), doubleBlink = false;
  let brow = -1;
  let breath = Math.random() * 6, exert = 0, lean = 0;
  const lastLook = new THREE.Vector3();

  return {
    flash() { if (brow < 0) brow = 0; },
    update({ dt, look, gaze, facing, accel, speed, grip }) {
      if (!started) { eyeAt.copy(look); headAt.copy(look); lastLook.copy(look); started = true; }
      // A big change of what he's looking at comes with a blink, as it does for everyone.
      head.getWorldPosition(_p);
      if (_v.copy(look).sub(_p).normalize().angleTo(_f.copy(lastLook).sub(_p).normalize()) > 0.5 && blink < 0) blink = 0;
      lastLook.copy(look);
      attention += (gaze - attention) * (1 - Math.exp(-dt * 3));

      nextGlint -= dt;
      if (nextGlint <= 0) {
        nextGlint = rand(0.5, 2.2);
        const pick = Math.floor(Math.random() * 3);
        glint.set(pick === 0 ? -0.09 : pick === 1 ? 0.09 : 0, pick === 2 ? -0.12 : 0, 0);
      }
      _v.copy(look).add(glint);
      eyeAt.lerp(_v, 1 - Math.exp(-dt * 30));
      headAt.lerp(look, 1 - Math.exp(-dt * 4.5));

      // Breathing: slow and shallow at rest, deeper and quicker for a while after he has walked a long way.
      exert = Math.min(1, Math.max(0, exert + (speed > 0.8 ? 0.035 : -0.05) * dt));
      breath += dt * Math.PI * 2 * (0.22 + exert * 0.14);
      const side = _side.crossVectors(up, facing).normalize(); // his left
      turnWorld(chest, _qd.setFromAxisAngle(side, Math.sin(breath) * (0.01 + exert * 0.012)));
      // He leans into a start and sits back into a stop, and walks a touch forward when he's going briskly.
      lean += (Math.max(-0.07, Math.min(0.09, accel * 0.022 + speed * 0.02)) - lean) * (1 - Math.exp(-dt * 5));
      turnWorld(spine, _qd.setFromAxisAngle(side, lean));

      // Something held in the far hand (an umbrella) stays put while the rest of him walks.
      if (grip && arm[0] && arm[1] && arm[2]) {
        reach(arm[0], arm[1], arm[2], grip, _pole.set(0, -1, 0).addScaledVector(side, 0.6).addScaledVector(facing, -0.4));
      }

      if (attention > 0.002) {
        // spread the turn down through the chest and neck, so it doesn't all happen at the neck like an owl
        turnWorld(chest, aimDelta(face, head, headAt, 0.18 * attention, 1.4));
        turnWorld(neck, aimDelta(face, head, headAt, 0.4 * attention, 1.1));
        turnWorld(head, aimDelta(face, head, headAt, attention, 0.9));
        for (const e of eyes) turnWorld(e.bone, aimDelta(e.fwd, e.bone, eyeAt, Math.min(1, attention * 1.5), 0.38));
      }

      // Blinks every few seconds, now and then twice; quick to close, slower to open.
      nextBlink -= dt;
      if (nextBlink <= 0 && blink < 0) { blink = 0; doubleBlink = Math.random() < 0.15; }
      let shut = 0;
      if (blink >= 0) {
        blink += dt;
        shut = blink < 0.06 ? blink / 0.06 : Math.max(0, 1 - (blink - 0.06) / 0.13);
        if (blink > 0.19) {
          blink = doubleBlink ? 0 : -1; doubleBlink = false;
          if (blink < 0) nextBlink = rand(2, 5.5);
        }
      }
      for (const l of lids) {
        l.top.position.lerpVectors(l.top0, l.bottom0, shut * 0.85);
        l.bottom.position.lerpVectors(l.bottom0, l.top0, shut * 0.12);
      }
      let lift = 0;
      if (brow >= 0) {
        brow += dt;
        lift = brow < 0.12 ? brow / 0.12 : brow < 0.45 ? 1 : Math.max(0, 1 - (brow - 0.45) / 0.25);
        if (brow > 0.7) brow = -1;
      }
      for (const b of brows) b.bone.position.copy(b.rest).addScaledVector(b.lift, lift);
    },
  };
}

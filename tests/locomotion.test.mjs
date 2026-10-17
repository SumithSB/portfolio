import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'portfolio-rig-'));
const output = join(temporary, 'rig.mjs');
await build({
  stdin: {
    contents: `export { sculptStage } from './src/scripts/walk/figure'; export { makePerson, pose } from './src/scripts/walk/person'; export { advanceRoot, advanceGait } from './src/scripts/walk/locomotion'; export * as THREE from 'three';`,
    resolveDir: root,
  },
  bundle: true, platform: 'node', format: 'esm', outfile: output,
});
const { advanceRoot, advanceGait, sculptStage, makePerson, pose, THREE } = await import(pathToFileURL(output).href);
await rm(temporary, { recursive: true });

test('root motion stays within walking speed in either direction and never overshoots', () => {
  for (const target of [-100, -0.0001, 0, 0.0001, 100]) {
    for (const dt of [0, 1 / 120, 1 / 60, 0.1]) {
      const next = advanceRoot(0, target, dt);
      assert(Math.abs(next) <= 1.75 * dt + 1e-10);
      assert(Math.abs(next) <= Math.abs(target));
      assert.equal(Math.sign(next), dt === 0 ? 0 : Math.sign(target));
    }
  }
});

test('reversing displacement reverses gait without a phase discontinuity', () => {
  const phase = advanceGait(0.6, 0.2, 0.5);
  assert(Math.abs(advanceGait(phase, -0.2, 0.5) - 0.6) < 1e-10);
});

test('the actual adult rig keeps stance feet stable at supported forward and reverse speeds', () => {
  const sculpt = sculptStage(5);
  for (const speed of [1, -1, 1.75, -1.75]) {
    const person = makePerson(5, sculpt);
    let previous;
    const drift = [];
    for (let frame = 0; frame < 300; frame++) {
      const dt = 1 / 60;
      person.position.x += speed * dt;
      pose(person, { phase: 0, moving: 1, mode: 'walk', t: frame * dt, time: frame * dt, look: 0, dt, signedSpeed: speed, dx: speed * dt });
      person.updateMatrixWorld(true);
      const foot = person.footF.getWorldPosition(new THREE.Vector3());
      const phase = ((person.joints.gait % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const stance = phase > Math.PI / 2 + 0.1 && phase < 1.5 * Math.PI - 0.1;
      if (previous?.stance && stance && frame > 120) drift.push(Math.abs(foot.x - previous.x) / dt);
      previous = { x: foot.x, stance };
    }
    assert(drift.length > 20, `stance samples missing at speed ${speed}`);
    const mean = drift.reduce((sum, value) => sum + value, 0) / drift.length;
    // Allow the small ankle displacement from pelvic rotation, not root sliding.
    assert(mean < 0.06, `stance-foot drift ${mean} at speed ${speed}`);
  }
});

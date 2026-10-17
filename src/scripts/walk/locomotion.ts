/** Bound root movement before solving the gait; jumps are handled by the scene cut. */
export function advanceRoot(current: number, target: number, dt: number): number {
  const gap = target - current;
  const step = Math.min(Math.abs(gap) * (1 - Math.exp(-Math.max(0, dt) * 14)), Math.max(0, dt) * 1.75);
  return current + Math.sign(gap) * step;
}

/** Signed distance keeps the planted foot stable in both scroll directions. */
export function advanceGait(phase: number, distance: number, stepLength: number): number {
  return phase + distance * Math.PI / Math.max(stepLength, 0.01);
}

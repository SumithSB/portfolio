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

/** Acceleration-limited travel, with braking distance reserved before the destination.
 * Substeps keep the response consistent across 30–120 Hz and after brief stalls. */
export function advanceTravel(current: number, velocity: number, target: number, dt: number) {
  let position = current;
  let remaining = Math.min(0.1, Math.max(0, dt));
  const acceleration = 3.8;
  while (remaining > 1e-8) {
    const step = Math.min(remaining, 1 / 120);
    const gap = target - position;
    const desired = Math.sign(gap) * Math.min(1.65, Math.abs(gap) * 3, Math.sqrt(acceleration * Math.abs(gap)));
    const next = velocity + Math.max(-acceleration * step, Math.min(acceleration * step, desired - velocity));
    const displacement = (velocity + next) * 0.5 * step;
    if (Math.abs(displacement) >= Math.abs(gap) && displacement * gap >= 0) {
      position = target; velocity = 0;
    } else {
      position += displacement; velocity = next;
    }
    remaining -= step;
  }
  return { position, velocity };
}

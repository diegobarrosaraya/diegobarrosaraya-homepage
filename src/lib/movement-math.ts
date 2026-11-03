// Gear train kinematics for the 3D movement: real tooth counts, pure so they can be tested.
export const TEETH = { barrel: 72, cPin: 10, center: 80, tPin: 8, third: 75, fPin: 8, fourth: 80, ePin: 7, escape: 15 } as const;

/** Turns of each wheel per turn of the escape wheel; each mesh reverses direction. */
export function trainRatios() {
  const fourth = -TEETH.ePin / TEETH.fourth;
  const third = fourth * -(TEETH.fPin / TEETH.third);
  const center = third * -(TEETH.tPin / TEETH.center);
  const barrel = center * -(TEETH.cPin / TEETH.barrel);
  return { escape: 1 as const, fourth, third, center, barrel };
}

const STEP = (Math.PI * 2) / TEETH.escape / 2; // half a tooth

/** Escape wheel angle at `t` balance periods: each half swing snaps it on by half a tooth, then it locks. */
export function escapeAngle(t: number): number {
  const half = Math.floor(t * 2), snap = Math.min(1, (t * 2 - half) * 8);
  return -(half + snap) * STEP;
}

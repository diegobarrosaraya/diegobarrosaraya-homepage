// Loupe zoom on the movement drawing: pure geometry and timing, shared by the build and the browser.
export interface Box { x: number; y: number; width: number; height: number }

export const FULL_VIEWBOX: Box = { x: 0, y: 0, width: 600, height: 600 };

/** A square view box centred on `bbox`, `factor` times its longer side. */
export function viewBoxFor(bbox: Box, factor = 1.12): Box {
  const r = (n: number) => Math.round(n * 100) / 100; // hundredths are plenty for SVG, and drop float noise
  const size = Math.max(bbox.width, bbox.height) * factor;
  return { x: r(bbox.x + bbox.width / 2 - size / 2), y: r(bbox.y + bbox.height / 2 - size / 2), width: r(size), height: r(size) };
}

export function lerpBox(a: Box, b: Box, t: number): Box {
  const l = (p: number, q: number) => p + (q - p) * t;
  return { x: l(a.x, b.x), y: l(a.y, b.y), width: l(a.width, b.width), height: l(a.height, b.height) };
}

export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function shouldAnimate(reducedMotion: boolean, hasViewTransitions: boolean): boolean {
  return !reducedMotion && hasViewTransitions;
}

/** Bounding box of a set of points, used at build time where getBBox is not available. */
export function boundsOf(points: [number, number][]): Box {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export const toViewBox = (b: Box) => [b.x, b.y, b.width, b.height].map((n) => +n.toFixed(2)).join(' ');
export const parseViewBox = (s: string): Box => {
  const [x, y, width, height] = s.trim().split(/[\s,]+/).map(Number);
  return { x, y, width, height };
};

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewBoxFor, lerpBox, easeOutExpo, shouldAnimate, boundsOf } from './zoom';

test('viewBoxFor returns a square centred on the part', () => {
  assert.deepEqual(viewBoxFor({ x: 100, y: 200, width: 200, height: 100 }), { x: 88, y: 138, width: 224, height: 224 });
});
test('easing starts at 0 and lands exactly on 1', () => {
  assert.equal(easeOutExpo(0), 0);
  assert.equal(easeOutExpo(1), 1);
});
test('lerpBox at t=0.5 is the midpoint', () => {
  assert.deepEqual(lerpBox({ x: 0, y: 0, width: 600, height: 600 }, { x: 100, y: 100, width: 200, height: 200 }, 0.5), { x: 50, y: 50, width: 400, height: 400 });
});
test('no animation under reduced motion or without view transitions', () => {
  assert.equal(shouldAnimate(true, true), false);
  assert.equal(shouldAnimate(false, false), false);
  assert.equal(shouldAnimate(false, true), true);
});
test('boundsOf spans every point', () => {
  assert.deepEqual(boundsOf([[10, 40], [-5, 20], [30, 25]]), { x: -5, y: 20, width: 35, height: 20 });
});

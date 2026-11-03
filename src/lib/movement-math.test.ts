import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeAngle, trainRatios } from './movement-math';

test('every wheel turns by its tooth ratio, alternating direction', () => {
  const r = trainRatios();
  assert.equal(r.fourth, -7 / 80);
  assert.equal(r.third, r.fourth * -(8 / 75));
  assert.ok(Math.sign(r.fourth) !== Math.sign(r.third) && Math.sign(r.third) !== Math.sign(r.center));
});
test('the escape wheel advances half a tooth per half swing and holds between ticks', () => {
  const half = (2 * Math.PI) / 15 / 2;
  assert.ok(Math.abs(escapeAngle(0.5) - -half) < 1e-9);
  assert.equal(escapeAngle(0.6), escapeAngle(0.95));
});
test('the escape wheel is partway through its snap mid-step', () => {
  // The snap takes 1/8 of a half swing; t=0.53125 is halfway through the second snap: 1.5 half teeth.
  const half = (2 * Math.PI) / 15 / 2, mid = escapeAngle(0.53125);
  assert.ok(Math.abs(mid - -1.5 * half) < 1e-9);
  assert.ok(mid < escapeAngle(0.5) && mid > escapeAngle(0.6));
});

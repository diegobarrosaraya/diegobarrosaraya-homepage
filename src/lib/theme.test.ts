import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTheme, writeTheme } from './theme';

test('readTheme returns null when storage throws', () => {
  assert.equal(readTheme({ getItem() { throw new Error('blocked'); } }), null);
});
test('readTheme returns null without storage', () => {
  assert.equal(readTheme(undefined), null);
});
test('readTheme ignores unknown values', () => {
  assert.equal(readTheme({ getItem: () => 'sepia' }), null);
});
test('readTheme returns a saved theme', () => {
  assert.equal(readTheme({ getItem: () => 'dark' }), 'dark');
});
test('writeTheme swallows storage errors', () => {
  assert.doesNotThrow(() => writeTheme({ setItem() { throw new Error('quota'); } }, 'dark'));
});
test('writeTheme stores under dba-theme', () => {
  let saved: string[] = [];
  writeTheme({ setItem: (k, v) => { saved = [k, v]; } }, 'light');
  assert.deepEqual(saved, ['dba-theme', 'light']);
});

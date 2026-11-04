import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tagAnchors, tagSlug } from './tags';

test('tagSlug lowercases and joins runs of other characters with one hyphen', () => {
  assert.equal(tagSlug('Zeta Tag'), 'zeta-tag');
  assert.equal(tagSlug('a/b'), 'a-b');
  assert.equal(tagSlug('NixOS'), 'nixos');
  assert.equal(tagSlug('c++'), 'c');
  assert.equal(tagSlug('  --Odd // spacing--  '), 'odd-spacing');
});
test('tagSlug gives an empty string for a tag of only symbols', () => {
  assert.equal(tagSlug('+++'), '');
  assert.equal(tagSlug(''), '');
});
test('tagAnchors gives every tag a unique id, the same for any input order', () => {
  const a = tagAnchors(['c', 'C', 'c++', 'Zeta Tag']);
  const b = tagAnchors(['Zeta Tag', 'c++', 'C', 'c']);
  assert.deepEqual(a, b);
  assert.equal(a.get('Zeta Tag'), 'tag-zeta-tag');
  assert.deepEqual(['C', 'c', 'c++'].map((t) => a.get(t)), ['tag-c', 'tag-c-2', 'tag-c-3']);
  assert.equal(new Set(a.values()).size, a.size);
});
test('tagAnchors names a tag of only symbols after the Other group', () => {
  assert.equal(tagAnchors(['+++']).get('+++'), 'tag-other');
});
test('a suffixed id never collides with a real tag of that name', () => {
  const ids = tagAnchors(['c', 'C', 'c 2']);
  assert.equal(new Set(ids.values()).size, 3);
});

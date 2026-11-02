import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, recordRef } from './work';

test('five areas numbered 01 to 05 in order, unique slugs and parts', () => {
  assert.deepEqual(AREAS.map(a => a.number), ['01', '02', '03', '04', '05']);
  assert.equal(new Set(AREAS.map(a => a.slug)).size, 5);
  assert.equal(new Set(AREAS.map(a => a.part)).size, 5);
});
test('every record has all four parts of its story and a unique slug in its area', () => {
  for (const a of AREAS) {
    assert.ok(a.records.length > 0, a.slug);
    assert.equal(new Set(a.records.map(r => r.slug)).size, a.records.length);
    for (const r of a.records) for (const k of ['constraint', 'approach', 'safeguard', 'result'] as const)
      assert.ok(r[k].trim().length > 0, `${a.slug}/${r.slug}.${k}`);
  }
});
test('work copy never mentions the day job', () => {
  const text = JSON.stringify(AREAS);
  assert.doesNotMatch(text, /atlassian|jira|confluence|servicerocket/i);
  assert.doesNotMatch(text, /—/); // no em dashes
});
test('recordRef pads the record index', () => {
  assert.equal(recordRef(AREAS[0], 1), '01.02');
});

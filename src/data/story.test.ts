import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME, PRINCIPLES, CASES, principleBySlug, principleForPart, caseBySlug } from './story';

test('six principles, one per part, in the agreed order', () => {
  assert.deepEqual(PRINCIPLES.map(p => p.slug), ['security', 'way-back', 'people', 'gates', 'verify', 'agents']);
  assert.equal(new Set(PRINCIPLES.map(p => p.part)).size, 6);
  assert.equal(principleForPart('fork').slug, 'agents');
});
test('every proof points at a real case study, and every case study is proof of something', () => {
  const used = new Set(PRINCIPLES.flatMap(p => p.proof === 'team' ? [] : p.proof));
  for (const c of CASES) assert.ok(used.has(c.slug), c.slug);
  for (const s of used) assert.ok(caseBySlug(s), s);
  assert.equal(principleBySlug('people')!.proof, 'team');
});
test('home copy is verbatim', () => {
  assert.equal(HOME.headline, "Hard constraints, high stakes, short deadlines. That's where I do my best work.");
  assert.equal(HOME.atWork, '8 apps I designed and built now run in production for an enterprise platform used by more than 30,000 people.');
  assert.equal(HOME.team.length, 2);
});
test('copy has no day-job words and no em dashes', () => {
  const text = JSON.stringify({ HOME, PRINCIPLES, CASES });
  assert.doesNotMatch(text, /atlassian|jira|confluence|servicerocket|forge/i);
  assert.doesNotMatch(text, /—/);
});
test('every case study tells the whole story', () => {
  for (const c of CASES) for (const k of ['summary', 'constraint', 'decision', 'safeguard', 'result', 'tradeoff'] as const)
    assert.ok(c[k].trim().length > 0, `${c.slug}.${k}`);
});

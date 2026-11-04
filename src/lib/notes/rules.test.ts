import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkNote, DAY_JOB_PATTERN, type Rules } from './rules';
import type { ParsedNote } from './types';

const rules: Rules = { denyPaths: ['Private/'], privateTerms: ['acme-example'] };
const note = (over: Partial<ParsedNote> = {}): ParsedNote => ({
  relPath: 'Guides/Clean.md', title: 'A clean note', description: 'How a clean note reads.',
  tags: ['guide'], updated: '2026-01-01', body: 'Plain text.\n', publish: true, draft: false, ...over,
});
const check = (n: ParsedNote, md = n.body) => checkNote(n, md, rules);

test('a clean note has no problems', () => {
  assert.deepEqual(check(note()), []);
});

test('a note under a denied path is flagged, boundary and case aware', () => {
  assert.deepEqual(check(note({ relPath: 'Private/Deep/x.md' })).map(p => p.rule), ['deny-path']);
  assert.deepEqual(check(note({ relPath: 'PrivateStuff/x.md' })), []);
  assert.deepEqual(check(note({ relPath: 'private/x.md' })), []);
});

test('a private term is found in title, description, tags and body, case-insensitive', () => {
  assert.deepEqual(check(note({ title: 'About ACME-Example' })),
    [{ rule: 'private-term', where: 'Guides/Clean.md: title' }]);
  assert.deepEqual(check(note({ description: 'acme-example inside' })),
    [{ rule: 'private-term', where: 'Guides/Clean.md: description' }]);
  assert.deepEqual(check(note({ tags: ['ok', 'acme-example'] })),
    [{ rule: 'private-term', where: 'Guides/Clean.md: tags' }]);
  assert.deepEqual(check(note({ body: 'one\ntwo acme-example\n' })),
    [{ rule: 'private-term', where: 'Guides/Clean.md: body', line: 2 }]);
});

test('markdown that keeps the plain text of a private-titled link fails', () => {
  const n = note({ body: 'See [[acme-example plan]].\n' });
  const problems = check(n, 'See acme-example plan.\n');
  assert.deepEqual(problems, [{ rule: 'private-term', where: 'Guides/Clean.md: body', line: 1 }]);
});

test('the day-job words are flagged as whole words, any case', () => {
  assert.deepEqual(check(note({ body: 'a\nWe use Jira here\n' })),
    [{ rule: 'day-job-word', where: 'Guides/Clean.md: body', line: 2 }]);
  assert.deepEqual(check(note({ title: 'FORGE apps' })),
    [{ rule: 'day-job-word', where: 'Guides/Clean.md: title' }]);
});

test('forget, enforced and reforged are not day-job words', () => {
  assert.deepEqual(check(note({ body: 'Do not forget. Rules are enforced. It was reforged.\n' })), []);
  assert.ok(!DAY_JOB_PATTERN.test('forgery'));
});

test('problems never contain the private term or note text', () => {
  const n = note({ title: 'acme-example', body: 'secret acme-example jira\n' });
  const json = JSON.stringify(check(n));
  assert.ok(!json.includes('acme-example'));
  assert.ok(!json.includes('secret'));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNote, slugify } from './parse';

const doc = (fm: string, body = 'Body text.\n') => `---\n${fm}\n---\n${body}`;
const base = 'title: Sample\ndescription: A sample note.\ntags: [a, b]\n';

test('publish is true only for publish: true', () => {
  assert.equal(parseNote(doc(base + 'publish: true\nupdated: 2026-08-14'), 'x.md').note?.publish, true);
  assert.equal(parseNote(doc(base + 'updated: 2026-08-14'), 'x.md').note?.publish, false);
  assert.equal(parseNote(doc(base + 'publish: "true"\nupdated: 2026-08-14'), 'x.md').note?.publish, false);
});
test('draft is reported separately from publish', () => {
  const n = parseNote(doc(base + 'publish: true\ndraft: true\nupdated: 2026-08-14'), 'x.md').note!;
  assert.equal(n.publish, true);
  assert.equal(n.draft, true);
});
test('updated falls back to timestamp, then created', () => {
  assert.equal(parseNote(doc(base + 'timestamp: 2026-07-01\ncreated: 2026-06-01'), 'x.md').note?.updated, '2026-07-01');
  assert.equal(parseNote(doc(base + 'created: 2026-06-01'), 'x.md').note?.updated, '2026-06-01');
});
test('dates stay strings', () => {
  const n = parseNote(doc(base + 'created: 2026-06-01\nupdated: 2026-08-14'), 'x.md').note!;
  assert.equal(n.updated, '2026-08-14');
  assert.equal(n.created, '2026-06-01');
});
test('a note with no date fails with missing-date and no note', () => {
  const r = parseNote(doc(base), 'x.md');
  assert.equal(r.note, undefined);
  assert.deepEqual(r.problems.map(p => p.rule), ['missing-date']);
});
test('missing title or description gives missing-field naming the field', () => {
  const r = parseNote(doc('updated: 2026-08-14\ndescription: d'), 'x.md');
  assert.equal(r.problems[0].rule, 'missing-field');
  assert.match(r.problems[0].where, /title/);
  const r2 = parseNote(doc('updated: 2026-08-14\ntitle: t'), 'x.md');
  assert.match(r2.problems[0].where, /description/);
});
test('extra frontmatter fields are dropped', () => {
  const n = parseNote(doc(base + 'updated: 2026-08-14\nowner: someone\ntype: note'), 'x.md').note!;
  assert.deepEqual(Object.keys(n).sort(), ['body', 'created', 'description', 'draft', 'publish', 'relPath', 'tags', 'title', 'updated']);
});
test('body excludes the frontmatter block', () => {
  assert.equal(parseNote(doc(base + 'updated: 2026-08-14', 'Hello\n'), 'x.md').note?.body, 'Hello\n');
});
test('slugify', () => {
  assert.equal(slugify('Linux Terminal and Shell Scripting'), 'linux-terminal-and-shell-scripting');
  assert.equal(slugify('Guía de Terminal: Cómo Empezar'), 'guia-de-terminal-como-empezar');
  assert.equal(slugify('???'), '');
});

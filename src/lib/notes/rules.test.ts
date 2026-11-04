import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUsableRules, checkNote, DAY_JOB_PATTERN, maskAllowedPhrases, type Rules } from './rules';
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

test('assertUsableRules rejects empty or blank lists and accepts a blank plus a real entry', () => {
  const ok = { denyPaths: ['Private/'], privateTerms: ['acme-example'] };
  assert.throws(() => assertUsableRules({ ...ok, privateTerms: [] }), /privateTerms/);
  assert.throws(() => assertUsableRules({ ...ok, privateTerms: ['', '  '] }), /privateTerms/);
  assert.throws(() => assertUsableRules({ ...ok, denyPaths: [] }), /denyPaths/);
  assert.throws(() => assertUsableRules({ ...ok, denyPaths: [' ', './'] }), /denyPaths/);
  assert.doesNotThrow(() => assertUsableRules({ denyPaths: ['', 'Private/'], privateTerms: ['', 'acme-example'] }));
  try { assertUsableRules({ ...ok, denyPaths: [] }); } catch (e) { assert.ok(!String(e).includes('acme-example')); }
});

test('fullwidth day-job words are caught', () => {
  assert.deepEqual(check(note({ body: 'ＪＩＲＡ\n' })),
    [{ rule: 'day-job-word', where: 'Guides/Clean.md: body', line: 1 }]);
});

test('accents match across NFC and NFD forms, both ways', () => {
  const nfc = 'café-example', nfd = 'café-example';
  const r = (t: string): Rules => ({ denyPaths: ['Private/'], privateTerms: [t] });
  assert.equal(checkNote(note({ body: `${nfc}\n` }), `${nfc}\n`, r(nfd)).length, 1);
  assert.equal(checkNote(note({ body: `${nfd}\n` }), `${nfd}\n`, r(nfc)).length, 1);
});

test('zero-width characters inside a word do not hide it', () => {
  const md = 'acme​-exam­ple and ji⁠ra\n';
  const problems = check(note({ body: md }), md);
  assert.deepEqual(problems.map(p => p.rule).sort(), ['day-job-word', 'private-term']);
  assert.ok(problems.every(p => p.line === 1));
  assert.ok(!JSON.stringify(problems).includes('acme'));
});

test('deny paths ignore backslashes and a leading ./', () => {
  assert.deepEqual(check(note({ relPath: 'Private\\x.md' })).map(p => p.rule), ['deny-path']);
  assert.deepEqual(check(note({ relPath: './Private/x.md' })).map(p => p.rule), ['deny-path']);
  assert.deepEqual(checkNote(note({ relPath: 'Private/x.md' }), '', { denyPaths: ['.\\Private\\'], privateTerms: ['acme-example'] }).map(p => p.rule), ['deny-path']);
  assert.deepEqual(check(note({ relPath: 'PrivateStuff/x.md' })), []);
});

test('an allowed phrase is masked before the private-term check only', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['acme-example-cli', 'the acme-example driver'] };
  const run = (body: string, n = note({ body })) => checkNote(n, body, allow);
  assert.deepEqual(run('Run acme-example-cli, then update the acme-example driver.\n'), []);
  assert.deepEqual(run('Run acme-example-cli.\nAsk acme-example.\n'),
    [{ rule: 'private-term', where: 'Guides/Clean.md: body', line: 2 }]);
  assert.deepEqual(run('acme-example-cli-extra acme-example\n'),
    [{ rule: 'private-term', where: 'Guides/Clean.md: body', line: 1 }]);
  assert.deepEqual(checkNote(note({ title: 'Using acme-example-cli' }), '', allow), []);
});

test('case and NFKC variants of an allowed phrase are allowed', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['the acme-example driver'] };
  const md = 'Install THE ＡＣＭＥ-Example Driver now.\nThe acme​-example driver.\n';
  assert.deepEqual(checkNote(note({ body: md }), md, allow), []);
});

test('allowed phrases do not hide day-job words', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['acme-example-cli', 'the acme-example jira tool'] };
  const md = 'Run acme-example-cli with the acme-example jira tool.\n';
  assert.deepEqual(checkNote(note({ body: md }), md, allow),
    [{ rule: 'day-job-word', where: 'Guides/Clean.md: body', line: 1 }]);
});

test('assertUsableRules rejects a blank or short allowed phrase without naming it', () => {
  const ok: Rules = { denyPaths: ['Private/'], privateTerms: ['acme-example'] };
  assert.doesNotThrow(() => assertUsableRules({ ...ok, allowedPhrases: [] }));
  assert.doesNotThrow(() => assertUsableRules({ ...ok, allowedPhrases: ['acme-example-cli'] }));
  for (const bad of ['', '   ', 'acme-', ' ＡＢＣ　 ', 'ab​cde']) {
    assert.throws(() => assertUsableRules({ ...ok, allowedPhrases: ['acme-example-cli', bad] }), (e: Error) =>
      e.message.includes('allowPhrases') && (!bad.trim() || !e.message.includes(bad.trim())));
  }
});

test('assertUsableRules rejects a phrase that equals a term or holds only a piece of one', () => {
  const named = (e: Error) => e.message.includes('allowPhrases')
    && !/acme|example|xample|driver/i.test(e.message);
  const cases: [string[], string[]][] = [
    [['acme-example'], ['acme-example']],
    [['acme-example'], ['ACME-Example']],
    [['acme-example'], ['acme-exa']],
    [['acme-example driver'], ['xample driver']],
    [['acme-example-cli'], ['example-cli']],
  ];
  for (const [privateTerms, allowedPhrases] of cases) {
    assert.throws(() => assertUsableRules({ denyPaths: ['Private/'], privateTerms, allowedPhrases }), named,
      allowedPhrases[0]);
  }
  assert.doesNotThrow(() => assertUsableRules({
    denyPaths: ['Private/'], privateTerms: ['acme-example'],
    allowedPhrases: ['acme-example-cli', 'the acme-example driver'],
  }));
});

test('a phrase that equals or splits a term never hides it, even without assertUsableRules', () => {
  for (const [term, phrase, md] of [
    ['acme-example', 'acme-example', 'Ask acme-example.'],
    ['acme-example', 'acme-exa', 'Ask acme-example.'],
    ['acme-example driver', 'xample driver', 'the acme-example driver'],
    ['acme-example-cli', 'example-cli', 'run acme-example-cli'],
  ]) {
    const r: Rules = { denyPaths: ['Private/'], privateTerms: [term], allowedPhrases: [phrase] };
    assert.deepEqual(checkNote(note({ body: md }), md, r).map((p) => p.rule), ['private-term'], phrase);
  }
});

test('an allowed phrase inside a longer word does not hide the term', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['acme-example-cli'] };
  for (const md of ['acme-example-cli-extra', 'xacme-example-cli', 'acme-example-clix', 'myacme-example-cli-team',
    'acme-example-cli_x', 'acme-example-cli2']) {
    assert.deepEqual(checkNote(note({ body: md }), md, allow).map((p) => p.rule), ['private-term'], md);
  }
});

test('masking runs once, so one masked phrase cannot make room for another', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['the acme-example driver', 'acme-example driver'] };
  const md = 'acme-examplethe acme-example driverdriver';
  assert.deepEqual(checkNote(note({ body: md }), md, allow).map((p) => p.rule), ['private-term']);
});

test('an allowed phrase next to punctuation is still allowed', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['acme-example-cli'] };
  for (const md of ['acme-example-cli.', 'acme-example-cli,', '(acme-example-cli)', '`acme-example-cli`',
    '[acme-example-cli]', '/acme-example-cli/', 'see acme-example-cli', 'a\tacme-example-cli\t']) {
    assert.deepEqual(checkNote(note({ body: md }), md, allow), [], md);
  }
});

test('invisible operator characters do not hide a term', () => {
  for (const md of ['acme\u2061-example', 'acme\u2062-example', 'acme\u2063-example', 'acme\u2064-example']) {
    assert.deepEqual(check(note({ body: md }), md).map((p) => p.rule), ['private-term'], JSON.stringify(md));
  }
});

test('maskAllowedPhrases blanks a whole allowed phrase and leaves a bare term', () => {
  const r: Rules = { ...rules, allowedPhrases: ['acme-example-cli'] };
  assert.ok(!maskAllowedPhrases('Run Acme-Example-CLI now', r).includes('acme-example'));
  assert.ok(maskAllowedPhrases('Run acme-example-clix now', r).includes('acme-example'));
  assert.ok(maskAllowedPhrases('Run acme-example now', r).includes('acme-example'));
});

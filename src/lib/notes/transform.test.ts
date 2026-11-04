import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskCode, transformBody, type TransformContext } from './transform';

const ctx: TransformContext = {
  title: 'Acme Guide', slug: 'acme-guide',
  published: new Map([['other note', 'other-note']]),
};
const run = (body: string) => transformBody(body, ctx);
const rules = (body: string) => run(body).problems.map(p => p.rule);

test('a wikilink to a published note becomes a site link', () => {
  assert.equal(run('See [[Other note]].\n').markdown, 'See [Other note](/notes/other-note/).\n');
});
test('a wikilink alias is used as the link text', () => {
  assert.equal(run('See [[Other note|the guide]].\n').markdown, 'See [the guide](/notes/other-note/).\n');
});
test('an escaped alias pipe inside a table cell works', () => {
  assert.equal(run('| [[Other note\\|the guide]] |\n').markdown, '| [the guide](/notes/other-note/) |\n');
});
test('a wikilink with a heading or folder still resolves the note', () => {
  assert.equal(run('[[folder/Other note#Part]]\n').markdown, '[Other note](/notes/other-note/)\n');
});
test('a wikilink to an unpublished note becomes plain text', () => {
  const r = run('See [[Hidden note]] and [[Hidden note|that one]].\n');
  assert.equal(r.markdown, 'See Hidden note and that one.\n');
  assert.ok(!r.markdown.includes(']('));
  assert.deepEqual(r.problems, []);
});

test('bash test brackets in a fence and in inline code are untouched', () => {
  const body = [
    'Run `[[ -f "$x" ]] && echo ok` first.',
    '```bash',
    'if [[ -f "$x" ]]; then',
    '  echo "![[not an embed]]"',
    'fi',
    '```',
    '~~~',
    '[[ -d "$y" ]] || exit 1',
    '~~~',
    '> ```sh',
    '> [[ -n "$z" ]]',
    '> ```',
    '',
  ].join('\n');
  const r = run(body);
  assert.equal(r.markdown, body);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.images, []);
});
test('a longer fence is not closed by a shorter one', () => {
  const body = '````md\n```\n[[ -f "$x" ]]\n```\n````\n';
  assert.equal(run(body).markdown, body);
});
test('an indented line with brackets is kept and gives indented-code', () => {
  const body = 'Text\n\n    if [[ -f "$x" ]]; then\n';
  const r = run(body);
  assert.equal(r.markdown, body);
  assert.deepEqual(r.problems, [{ rule: 'indented-code', where: 'Acme Guide', line: 3 }]);
});
test('a fence nested four spaces under a list item is untouched', () => {
  const body = '- Step one\n\n    ```bash\n    # c\n    [[ -f x ]]\n    ```\n';
  const r = run(body);
  assert.equal(r.markdown, body);
  assert.deepEqual(r.problems, []);
});
test('a fence nested two spaces under a list item is untouched', () => {
  const body = '- Step one\n  ```bash\n  # c\n  [[ -f x ]]\n  ```\n';
  const r = run(body);
  assert.equal(r.markdown, body);
  assert.deepEqual(r.problems, []);
});
test('a CRLF body gives the same result as LF', () => {
  const lf = '# Acme Guide\nSee [[Other note]].\n```bash\n# c\n[[ -f x ]]\n```\n';
  assert.deepEqual(run(lf.replace(/\n/g, '\r\n')), run(lf));
  assert.equal(run(lf.replace(/\n/g, '\r\n')).markdown,
    'See [Other note](/notes/other-note/).\n```bash\n# c\n[[ -f x ]]\n```\n');
});
test('a link next to inline code is still converted', () => {
  assert.equal(run('`[[x]]` and [[Other note]]\n').markdown, '`[[x]]` and [Other note](/notes/other-note/)\n');
});

test('image embeds and markdown images point at the note folder', () => {
  const r = run('![[diagram.png]]\n![[diagram.png|300]]\n![alt](diagram.png)\n');
  assert.equal(r.markdown,
    '![diagram.png](/notes/acme-guide/diagram.png)\n'
    + '![diagram.png](/notes/acme-guide/diagram.png)\n'
    + '![alt](/notes/acme-guide/diagram.png)\n');
  assert.deepEqual(r.images, ['diagram.png']);
  assert.deepEqual(r.problems, []);
});
test('an image in a subfolder keeps its referenced name and a flat url', () => {
  const r = run('![[assets/chart.svg]]\n');
  assert.equal(r.markdown, '![chart.svg](/notes/acme-guide/chart.svg)\n');
  assert.deepEqual(r.images, ['assets/chart.svg']);
});
test('a remote image is left alone', () => {
  const body = '![logo](https://example.com/logo.png)\n';
  assert.equal(run(body).markdown, body);
  assert.deepEqual(run(body).images, []);
});
test('a note embed gives an embed problem with the line', () => {
  const r = run('Intro\n![[Another note]]\n\n![[Another note#Part]]\n');
  assert.deepEqual(r.problems, [
    { rule: 'embed', where: 'Acme Guide', line: 2 },
    { rule: 'embed', where: 'Acme Guide', line: 4 },
  ]);
});

test('plugin code blocks give plugin-block', () => {
  for (const lang of ['dataview', 'dataviewjs', 'query', 'tasks']) {
    assert.deepEqual(run(`Text\n\`\`\`${lang}\nLIST\n\`\`\`\n`).problems,
      [{ rule: 'plugin-block', where: 'Acme Guide', line: 2 }], lang);
  }
});
test('a mermaid block passes through unchanged', () => {
  const body = '```mermaid\nflowchart LR\n  A[[sub]] --> B\n```\n';
  const r = run(body);
  assert.equal(r.markdown, body);
  assert.deepEqual(r.problems, []);
});

test('a leading title heading is removed in any case', () => {
  assert.equal(run('# acme GUIDE\n\nBody.\n').markdown, '\nBody.\n');
  assert.equal(run('\n# Acme Guide\nBody.\n').markdown, '\nBody.\n');
});
test('a second h1 outside code gives extra-h1', () => {
  assert.deepEqual(run('# Acme Guide\nBody.\n# Another\n').problems,
    [{ rule: 'extra-h1', where: 'Acme Guide', line: 3 }]);
});
test('an h1 that is not the title gives extra-h1', () => {
  assert.deepEqual(rules('# Something else\nBody.\n'), ['extra-h1']);
});
test('a hash comment in a bash fence is not a heading', () => {
  const body = '# Acme Guide\n```bash\n# install\nmake\n```\n## Section\n';
  const r = run(body);
  assert.deepEqual(r.problems, []);
  assert.equal(r.markdown, '```bash\n# install\nmake\n```\n## Section\n');
});

test('maskCode blanks fenced blocks and inline code and keeps the line count', () => {
  const body = 'a `![x](y.png)` b\n```\n![x](y.png)\n```\n![z](w.png)\n';
  const masked = maskCode(body);
  assert.equal(masked.split('\n').length, body.split('\n').length);
  assert.ok(!masked.includes('y.png'));
  assert.equal(masked.split('\n')[4], '![z](w.png)');
});

test('lineMap gives the body line of each output line, skipping the removed title heading', () => {
  const r = run('\n# Acme Guide\nBody.\n```\ncode\n```\n');
  assert.equal(r.markdown, '\nBody.\n```\ncode\n```\n');
  assert.deepEqual(r.lineMap, [1, 3, 4, 5, 6, 7]);
  assert.equal(r.lineMap.length, r.markdown.split('\n').length);
});

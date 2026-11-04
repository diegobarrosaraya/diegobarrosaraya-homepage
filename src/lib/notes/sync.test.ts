import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { syncVault } from './sync';
import type { Rules } from './rules';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'vault');
const rules: Rules = { denyPaths: ['Private/'], privateTerms: ['acme-example'] };
const PNG = readFileSync(join(FIXTURE, 'Attachments', 'diagram.png'));

const roots: string[] = [];
after(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

// A temp copy of the fixture vault plus extra files, and empty output folders.
function setup(extra: Record<string, string | Buffer> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'notes-sync-'));
  roots.push(root);
  const vault = join(root, 'vault');
  cpSync(FIXTURE, vault, { recursive: true });
  for (const [rel, content] of Object.entries(extra)) {
    mkdirSync(dirname(join(vault, rel)), { recursive: true });
    writeFileSync(join(vault, rel), content);
  }
  const out = join(root, 'out');
  const publicDir = join(root, 'public');
  mkdirSync(out);
  writeFileSync(join(out, '.gitkeep'), '');
  const run = (r: Rules = rules) => syncVault({ vault, out, publicDir, rules: r });
  return { root, vault, out, publicDir, run };
}

const note = (fm: string, body = 'Body text.\n') => `---\n${fm}\n---\n${body}`;
const flagged = (title: string, body?: string, more = '') =>
  note(`title: ${title}\ndescription: How ${title} reads.\nupdated: 2026-01-01\npublish: true${more}`, body);
const rulesOf = (r: { problems: { rule: string }[] }) => r.problems.map((p) => p.rule);
const outFiles = (out: string) => readdirSync(out).sort();

test('flagged notes are written as <slug>.md with only the five kept fields', () => {
  const { out, run } = setup();
  const r = run();
  assert.deepEqual(r.problems, []);
  assert.equal(r.ok, true);
  assert.deepEqual([...r.published].sort(), ['acme-guide', 'other-guide']);
  assert.deepEqual(outFiles(out), ['.gitkeep', 'acme-guide.md', 'other-guide.md']);

  const raw = readFileSync(join(out, 'acme-guide.md'), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n\n/);
  assert.ok(m, 'frontmatter, then a blank line');
  assert.deepEqual(parse(m![1]), {
    title: 'Acme Guide', description: 'How the placeholder guide reads.', tags: ['guide', 'example'],
    created: '2026-01-01', updated: '2026-02-01',
  });
  assert.ok(!raw.includes('# Acme Guide'), 'the title heading is stripped');

  const other = parse(readFileSync(join(out, 'other-guide.md'), 'utf8').split('---\n')[1]);
  assert.deepEqual(Object.keys(other), ['title', 'description', 'tags', 'updated']);
  assert.equal(other.updated, '2026-03-01');
});

test('unflagged, draft and dot-folder notes are not written', () => {
  const { out, run } = setup();
  run();
  const files = outFiles(out);
  for (const slug of ['unflagged-note', 'draft-guide', 'settings-note', 'kept-back', 'no-fields']) {
    assert.ok(!files.includes(`${slug}.md`), slug);
  }
});

test('a wikilink between two published notes becomes a link, an aliased one to an unpublished note stays text', () => {
  const { out, run } = setup();
  run();
  const acme = readFileSync(join(out, 'acme-guide.md'), 'utf8');
  assert.ok(acme.includes('See [Other Guide](/notes/other-guide/) for more.'));
  assert.ok(acme.includes('A hidden link: that note.'));
  assert.ok(readFileSync(join(out, 'other-guide.md'), 'utf8').includes('Back to [Acme Guide](/notes/acme-guide/).'));
});

test('a wikilink by file name resolves when the title differs', () => {
  const { out, run } = setup({ 'Guides/short-name.md': flagged('Long Title'), 'Guides/Linker.md': flagged('Linker', 'See [[short-name]].\n') });
  assert.equal(run().ok, true);
  assert.ok(readFileSync(join(out, 'linker.md'), 'utf8').includes('[short-name](/notes/long-title/)'));
});

test('an image is copied only for a published note', () => {
  const { out, publicDir, run } = setup();
  run();
  assert.deepEqual(readdirSync(publicDir), ['acme-guide']);
  assert.deepEqual(readdirSync(join(publicDir, 'acme-guide')), ['diagram.png']);
  assert.deepEqual(readFileSync(join(publicDir, 'acme-guide', 'diagram.png')), PNG);
  assert.ok(readFileSync(join(out, 'acme-guide.md'), 'utf8').includes('![diagram.png](/notes/acme-guide/diagram.png)'));
});

test('an image given by a relative path resolves', () => {
  const { publicDir, run } = setup({ 'Guides/Pathed.md': flagged('Pathed', '![[Attachments/diagram.png]]\n![a](../Attachments/unused.png)\n') });
  const r = run();
  assert.deepEqual(r.problems, []);
  assert.deepEqual(readdirSync(join(publicDir, 'pathed')).sort(), ['diagram.png', 'unused.png']);
});

// Every failure case below must write nothing at all, not even the valid notes.
function assertFailsAndWritesNothing(extra: Record<string, string | Buffer>, expected: string[]) {
  const { out, publicDir, run } = setup(extra);
  const r = run();
  assert.equal(r.ok, false);
  assert.deepEqual(rulesOf(r), expected);
  assert.deepEqual(r.published, []);
  assert.deepEqual(outFiles(out), ['.gitkeep']);
  assert.ok(!existsSync(publicDir));
  return r;
}

test('a flagged note with no date fails and writes nothing', () => {
  const r = assertFailsAndWritesNothing(
    { 'Guides/Undated.md': note('title: Undated\ndescription: How it reads.\npublish: true') }, ['missing-date']);
  assert.equal(r.problems[0].where, 'Guides/Undated.md');
});

test('a flagged note under a denied path fails and writes nothing', () => {
  assertFailsAndWritesNothing({ 'Private/Leak.md': flagged('Leak') }, ['deny-path']);
});

test('a private term or day-job word in a flagged note fails; the unflagged note with one does not', () => {
  assertFailsAndWritesNothing({ 'Guides/Term.md': flagged('Term', 'About acme-example.\n') }, ['private-term']);
  assertFailsAndWritesNothing({ 'Guides/Work.md': flagged('Work', 'About jira.\n') }, ['day-job-word']);
});

test('a flagged note with malformed frontmatter fails; an unflagged one is ignored', () => {
  assertFailsAndWritesNothing({ 'Guides/Broken.md': '---\ntitle: [unclosed\npublish: true\n---\nx\n' }, ['bad-frontmatter']);
  const { run } = setup({ 'Guides/Broken.md': '---\ntitle: [unclosed\n---\nx\n' });
  assert.equal(run().ok, true);
});

test('two notes with one slug fail, and so does a title that slugifies to nothing', () => {
  const dup = assertFailsAndWritesNothing({ 'Guides/Copy.md': flagged('Acme  guide!') }, ['slug', 'slug']);
  assert.deepEqual(dup.problems.map((p) => p.where).sort(), ['Guides/Acme Guide.md', 'Guides/Copy.md']);
  assertFailsAndWritesNothing({ 'Guides/Empty.md': flagged('"!!!"') }, ['slug']);
});

test('a missing image gives image-missing', () => {
  assertFailsAndWritesNothing({ 'Guides/Pics.md': flagged('Pics', '![[nowhere.png]]\n') }, ['image-missing']);
});

test('an image name that matches two vault files gives image-collision', () => {
  const r = assertFailsAndWritesNothing({ 'Other/diagram.png': PNG }, ['image-collision']);
  assert.equal(r.problems[0].where, 'Guides/Acme Guide.md');
});

test('two different images that share a file name in one note give image-collision', () => {
  assertFailsAndWritesNothing({
    'A/pic.png': PNG, 'B/pic.png': PNG, 'Guides/Pics.md': flagged('Pics', '![[A/pic.png]]\n![[B/pic.png]]\n'),
  }, ['image-collision']);
});

test('a local markdown image the transform leaves in place gives image-missing with its line', () => {
  const r = assertFailsAndWritesNothing({
    'Guides/Pics.md': flagged('Pics', 'one\n![a](my image.png)\n![a](<my image.png>)\n![a](diagram.png "title")\n'),
  }, ['image-missing', 'image-missing', 'image-missing']);
  assert.deepEqual(r.problems.map((p) => p.line), [8, 9, 10]);
});

test('image syntax inside code and remote images are left alone', () => {
  const body = '`![a](my image.png)`\n```\n![a](x.png "t")\n```\n![a](https://example.com/x.png)\n';
  const { out, run } = setup({ 'Guides/Code.md': flagged('Code', body) });
  const r = run();
  assert.deepEqual(r.problems, []);
  assert.ok(readFileSync(join(out, 'code.md'), 'utf8').endsWith(body));
});

test('unusable rules throw before anything is read or written', () => {
  const { out, publicDir, run } = setup();
  assert.throws(() => run({ denyPaths: ['Private/'], privateTerms: [' '] }), /privateTerms/);
  assert.throws(() => run({ denyPaths: [], privateTerms: ['acme-example'] }), /denyPaths/);
  assert.deepEqual(outFiles(out), ['.gitkeep']);
  assert.ok(!existsSync(publicDir));
});

test('unflagging a note removes its file and images and keeps files the sync did not create', () => {
  const { vault, out, publicDir, run } = setup();
  assert.equal(run().ok, true);
  writeFileSync(join(out, 'notes.txt'), 'mine');
  mkdirSync(join(out, 'sub'));
  writeFileSync(join(out, 'sub', 'kept.md'), 'mine');
  writeFileSync(join(publicDir, 'top.png'), PNG);

  const acmePath = join(vault, 'Guides', 'Acme Guide.md');
  writeFileSync(acmePath, readFileSync(acmePath, 'utf8').replace('publish: true\n', ''));
  const r = run();
  assert.equal(r.ok, true);
  assert.deepEqual(r.published, ['other-guide']);
  assert.deepEqual([...r.removed].sort(), [join(out, 'acme-guide.md'), join(publicDir, 'acme-guide')]);
  assert.deepEqual(outFiles(out), ['.gitkeep', 'notes.txt', 'other-guide.md', 'sub']);
  assert.ok(existsSync(join(out, 'sub', 'kept.md')));
  assert.deepEqual(readdirSync(publicDir), ['top.png']);
});

test('an image no longer used by a published note is removed from its folder', () => {
  const { vault, publicDir, run } = setup();
  run();
  const acmePath = join(vault, 'Guides', 'Acme Guide.md');
  writeFileSync(acmePath, readFileSync(acmePath, 'utf8').replace('![[diagram.png]]', ''));
  const r = run();
  assert.equal(r.ok, true);
  assert.ok(!existsSync(join(publicDir, 'acme-guide')));
  assert.ok(r.removed.includes(join(publicDir, 'acme-guide')));
});

test('a failed run keeps the output of the last good run', () => {
  const { vault, out, run } = setup();
  run();
  writeFileSync(join(vault, 'Private', 'Leak.md'), flagged('Leak'));
  rmSync(join(vault, 'Guides', 'Other Guide.md'));
  assert.equal(run().ok, false);
  assert.deepEqual(outFiles(out), ['.gitkeep', 'acme-guide.md', 'other-guide.md']);
});

// Every file and link under a folder with its content, to show a refused run changed nothing.
function snapshot(dir: string, rel = ''): Record<string, string> {
  const shot: Record<string, string> = {};
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const path = join(rel, e.name);
    if (e.isSymbolicLink()) shot[path] = `link:${readlinkSync(join(dir, path))}`;
    else if (e.isDirectory()) Object.assign(shot, { [path]: 'dir' }, snapshot(dir, path));
    else shot[path] = readFileSync(join(dir, path), 'base64');
  }
  return shot;
}

test('output folders that overlap the vault or each other, or are symlinks, throw and change nothing', () => {
  const { root, vault, out, publicDir, run } = setup();
  assert.equal(run().ok, true);
  const elsewhere = join(root, 'elsewhere');
  mkdirSync(join(elsewhere, 'foreign'), { recursive: true });
  writeFileSync(join(elsewhere, 'foreign', 'keep.txt'), 'keep');
  symlinkSync(elsewhere, join(root, 'public-link'));
  symlinkSync(out, join(root, 'out-link'));
  const before = snapshot(root);
  const cases: [string, string, RegExp][] = [
    [out, vault, /publicDir overlaps the vault/],
    [vault, publicDir, /out overlaps the vault/],
    [join(vault, 'Guides'), publicDir, /out overlaps the vault/],
    [out, join(vault, 'new', 'images'), /publicDir overlaps the vault/],
    [out, root, /publicDir overlaps the vault/],
    [out, out, /out and publicDir overlap/],
    [out, join(out, 'images'), /out and publicDir overlap/],
    [join(publicDir, 'md'), publicDir, /out and publicDir overlap/],
    [out, join(root, 'public-link'), /publicDir is a symlink/],
    [join(root, 'out-link'), publicDir, /out is a symlink/],
  ];
  for (const [o, p, message] of cases) {
    assert.throws(() => syncVault({ vault, out: o, publicDir: p, rules }), message, `${o} ${p}`);
  }
  assert.deepEqual(snapshot(root), before);
});

test('a basename shared by two published notes fails only where a link uses it', () => {
  const extra = {
    'A/Guide.md': flagged('Guide A'), 'B/Guide.md': flagged('Guide B'),
    'Guides/Linker.md': flagged('Linker', 'See [[Guide]].\nAnd [[A/Guide#Part|this]].\n`[[Guide]]`\n'),
  };
  const r = assertFailsAndWritesNothing(extra, ['ambiguous-link', 'ambiguous-link']);
  assert.deepEqual(r.problems.map((p) => [p.where, p.line]), [['Guides/Linker.md', 7], ['Guides/Linker.md', 8]]);

  const { run } = setup({ 'A/Guide.md': flagged('Guide A'), 'B/Guide.md': flagged('Guide B') });
  assert.deepEqual(run().problems, []);
});

test('a file basename wins over a title, so a link to an unpublished file stays unlinked', () => {
  const { out, run } = setup({
    'Guides/Foo.md': note('title: Real Foo File\ndescription: How it reads.\nupdated: 2026-01-01'),
    'Guides/x.md': flagged('Foo'),
    'Guides/Linker.md': flagged('Linker', 'See [[Foo|Foo]] and [[Long Title]] and [[short-name]].\n'),
    'Guides/short-name.md': flagged('Long Title'),
  });
  assert.deepEqual(run().problems, []);
  const linker = readFileSync(join(out, 'linker.md'), 'utf8');
  assert.ok(linker.includes('See Foo and [Long Title](/notes/long-title/) and [short-name](/notes/long-title/).'));
});

// Lines 1-6 are frontmatter and line 7 is the title heading, so body problems start at line 9.
const LINES_NOTE = [
  '---', 'title: Lines', 'description: How Lines reads.', 'updated: 2026-01-01', 'publish: true', '---',
  '# Lines', '', 'We use Jira here.', 'About acme-example.', '![[Some note]]', '# Second', '    [[x]]',
  'See [[Guide]].', '![a](my image.png)', '',
].join('\n');
const LINES_EXPECTED = [
  ['day-job-word', 9], ['private-term', 10], ['embed', 11], ['extra-h1', 12], ['indented-code', 13],
  ['ambiguous-link', 14], ['image-missing', 15],
];
const lineProblems = (text: string) => {
  const { run } = setup({ 'Guides/Lines.md': text, 'A/Guide.md': flagged('Guide A'), 'B/Guide.md': flagged('Guide B') });
  return run().problems.map((p) => [p.rule, p.line]).sort((a, b) => Number(a[1]) - Number(b[1]));
};

test('problems report the line in the vault file, counting frontmatter and the title heading', () => {
  assert.deepEqual(lineProblems(LINES_NOTE), LINES_EXPECTED);
});

test('CRLF notes report the same vault-file lines as LF', () => {
  assert.deepEqual(lineProblems(LINES_NOTE.replace(/\n/g, '\r\n')), LINES_EXPECTED);
});

test('allowed phrases pass through the sync for private terms only', () => {
  const allow: Rules = { ...rules, allowedPhrases: ['acme-example-cli'] };
  const { run } = setup({ 'Guides/Tool.md': flagged('Tool', 'Run acme-example-cli.\n') });
  assert.deepEqual(run(allow).problems, []);
  assert.deepEqual(rulesOf(run()), ['private-term']);
  assert.throws(() => run({ ...rules, allowedPhrases: ['cli'] }), /allowPhrases/);
});

test('an image that lives under a denied path is refused, even when a published note embeds it', () => {
  assertFailsAndWritesNothing(
    { 'Private/secret-shot.png': PNG, 'Guides/Pic.md': flagged('Pic', '![[secret-shot.png]]\n') }, ['image-denied']);
});

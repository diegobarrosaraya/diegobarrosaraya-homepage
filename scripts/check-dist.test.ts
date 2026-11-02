import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { AREAS } from '../src/data/work';

test('home page is built HTML, not the Vite source', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('/src/main.tsx'));
  assert.match(html, /<title>[^<]+<\/title>/);
});

test('custom domain survives the build', () => {
  assert.equal(readFileSync('dist/CNAME', 'utf8').trim(), 'diegobarrosaraya.com');
});

test('home links every work area from the drawing', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  for (const s of ['integrations', 'backend', 'agents', 'open-source', 'infrastructure'])
    assert.match(html, new RegExp(`class="callout[^"]*"[^>]*href="/work/${s}/"|href="/work/${s}/"[^>]*class="callout[^"]*"`));
});
test('home has the resume action without JavaScript', () => {
  assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/resume\.pdf"/);
});

// shortcut: pages built in Task 7; remove this list there
const PENDING_PAGES = ['/resume/', '/contact/', '/now/'];

const htmlFilesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) return htmlFilesUnder(path);
    return path.endsWith('.html') ? [path] : [];
  });
const internalHrefs = (html: string): string[] =>
  [...html.matchAll(/\shref="(\/(?!\/)[^"]*)"/g)].map((m) => m[1].split(/[#?]/)[0]);
const resolvesInDist = (href: string): boolean =>
  (existsSync(`dist${href}`) && statSync(`dist${href}`).isFile()) ||
  existsSync(`dist${href}/index.html`) || existsSync(`dist${href}index.html`);

test('every area and record has a built page', () => {
  for (const a of AREAS) {
    assert.ok(existsSync(`dist/work/${a.slug}/index.html`), a.slug);
    for (const r of a.records) assert.ok(existsSync(`dist/work/${a.slug}/${r.slug}/index.html`), `${a.slug}/${r.slug}`);
  }
});
test('every internal link resolves to a built file', () => {
  for (const file of htmlFilesUnder('dist')) {
    for (const href of internalHrefs(readFileSync(file, 'utf8'))) {
      if (PENDING_PAGES.includes(href)) continue;
      assert.ok(resolvesInDist(href), `${file} -> ${href}`);
    }
  }
});

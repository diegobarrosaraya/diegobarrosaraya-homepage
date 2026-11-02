import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

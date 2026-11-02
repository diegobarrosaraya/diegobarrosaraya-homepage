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

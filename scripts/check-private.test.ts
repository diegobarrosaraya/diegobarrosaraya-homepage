import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

test('no private term appears in the built site', (t) => {
  if (!existsSync('.private-terms')) return t.skip('no local .private-terms list');
  const terms = readFileSync('.private-terms', 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
  for (const f of filesUnder('dist')) {
    const body = readFileSync(f, 'utf8').toLowerCase();
    for (const term of terms) assert.ok(!body.includes(term), `${f} contains a term from .private-terms`);
  }
});

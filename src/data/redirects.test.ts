import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_REDIRECTS } from './redirects';
import { CASES, PRINCIPLES } from './story';

test('every legacy URL forwards to a page that exists in the new structure', () => {
  const targets = new Set(['/', ...PRINCIPLES.map(p => `/how/${p.slug}/`), ...CASES.map(c => `/work/${c.slug}/`)]);
  for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) assert.ok(targets.has(to), `${from} -> ${to}`);
});
test('the legacy map covers every old area and record', () => {
  assert.equal(LEGACY_REDIRECTS['/work/agents/'], '/how/agents/');
  assert.equal(LEGACY_REDIRECTS['/work/open-source/'], '/how/verify/');
  assert.equal(LEGACY_REDIRECTS['/work/infrastructure/'], '/how/way-back/');
  assert.equal(LEGACY_REDIRECTS['/work/integrations/teams-calls-fetcher/'], '/work/teams-calls-fetcher/');
  assert.equal(LEGACY_REDIRECTS['/work/agents/nix-ai-tooling/'], '/work/home-agent-platform/');
  assert.equal(LEGACY_REDIRECTS['/work/backend/pulsovivo/'], '/');
});

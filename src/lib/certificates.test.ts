import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeCertificates } from './certificates';

test('expired certificates drop out, undated ones stay', () => {
  const certs = [{ name: 'a', expires: '2026-01' }, { name: 'b', expires: '2026-12' }, { name: 'c' }];
  assert.deepEqual(activeCertificates(certs, '2026-11-03').map(c => c.name), ['b', 'c']);
});
test('a certificate stays active through its expiry month', () => {
  assert.equal(activeCertificates([{ expires: '2026-11-01' }], '2026-11-30').length, 1);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { maskAllowedPhrases } from "../src/lib/notes/rules";

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

test('no private term appears in the built site', (t) => {
  if (!existsSync('.private-terms')) return t.skip('no local .private-terms list');
  const terms = readFileSync('.private-terms', 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
  assert.ok(terms.length > 0, '.private-terms exists but has no terms');
  // The same allow-list the sync uses (phrases such as a tool name), read from the local config.
  const allowedPhrases: string[] = existsSync(".notes-sync.json") ? (JSON.parse(readFileSync(".notes-sync.json", "utf8")).allowPhrases ?? []) : [];
  for (const f of filesUnder('dist')) {
    const html = readFileSync(f, "utf8");
    // Phrases can be split by markup (emphasis, code spans), so allow-list the text with each tag turned into a space,
    // and scan the tags and attributes on their own (link targets can hold an allowed phrase) so nothing hides there.
    const text = maskAllowedPhrases(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "), { denyPaths: [], privateTerms: terms, allowedPhrases });
    const markup = maskAllowedPhrases((html.match(/<[^>]*>/g) ?? []).join("\n"), { denyPaths: [], privateTerms: terms, allowedPhrases });
    for (const term of terms) assert.ok(!text.includes(term) && !markup.includes(term), `${f} contains a term from .private-terms`);
  }
});

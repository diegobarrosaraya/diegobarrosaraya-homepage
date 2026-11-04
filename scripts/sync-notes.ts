// Publishes flagged vault notes into src/content/notes and their images into public/notes.
// Reads the vault path and deny paths from .notes-sync.json and the private terms from
// .private-terms (both gitignored). Writes files only; Diego reviews the diff and commits.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { syncVault } from '../src/lib/notes/sync';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!existsSync('.notes-sync.json')) fail('missing .notes-sync.json in the repo root ({ "vault": string, "denyPaths": string[] })');
if (!existsSync('.private-terms')) fail('missing .private-terms in the repo root (one term per line)');

let config: { vault?: unknown; denyPaths?: unknown };
try {
  config = JSON.parse(readFileSync('.notes-sync.json', 'utf8'));
} catch {
  fail('.notes-sync.json is not valid JSON');
}
const { vault, denyPaths } = config ?? {};
if (typeof vault !== 'string' || !vault.trim()) fail('.notes-sync.json needs "vault" as a string');
if (!Array.isArray(denyPaths) || !denyPaths.every((p) => typeof p === 'string')) {
  fail('.notes-sync.json needs "denyPaths" as an array of strings');
}
if (!existsSync(vault) || !statSync(vault).isDirectory()) fail('the vault in .notes-sync.json is not a folder');

const privateTerms = readFileSync('.private-terms', 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);

let result;
try {
  result = syncVault({ vault, out: 'src/content/notes', publicDir: 'public/notes', rules: { denyPaths, privateTerms } });
} catch (e) {
  // assertUsableRules names the empty list, never a term.
  fail(`notes sync refused to run: ${(e as Error).message}`);
}

if (!result.ok) {
  for (const p of result.problems) console.error(`${p.where}: ${p.rule}${p.line ? ` (line ${p.line})` : ''}`);
  fail(`notes sync failed with ${result.problems.length} problem(s); nothing was written`);
}
console.log(`published ${result.published.length} note(s)`);
for (const r of result.removed) console.log(`removed ${r}`);

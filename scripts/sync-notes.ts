// Publishes flagged vault notes into src/content/notes and their images into public/notes.
// Reads the vault path and deny paths from .notes-sync.json and the private terms from
// .private-terms (both gitignored). The optional "allowPhrases" in .notes-sync.json lists exact
// phrases that may contain a private term, such as a tool name.
// Writes files only; Diego reviews the diff and commits.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { SyncConfigError, syncVault } from '../src/lib/notes/sync';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!existsSync('.notes-sync.json')) {
  fail('missing .notes-sync.json in the repo root ({ "vault": string, "denyPaths": string[], "allowPhrases"?: string[] })');
}
if (!existsSync('.private-terms')) fail('missing .private-terms in the repo root (one term per line)');

let config: { vault?: unknown; denyPaths?: unknown; allowPhrases?: unknown };
try {
  config = JSON.parse(readFileSync('.notes-sync.json', 'utf8'));
} catch {
  fail('.notes-sync.json is not valid JSON');
}
const { vault, denyPaths, allowPhrases = [] } = config ?? {};
if (typeof vault !== 'string' || !vault.trim()) fail('.notes-sync.json needs "vault" as a string');
if (!Array.isArray(denyPaths) || !denyPaths.every((p) => typeof p === 'string')) {
  fail('.notes-sync.json needs "denyPaths" as an array of strings');
}
if (!Array.isArray(allowPhrases) || !allowPhrases.every((p) => typeof p === 'string')) {
  fail('.notes-sync.json needs "allowPhrases" as an array of strings when it is set');
}
if (!existsSync(vault) || !statSync(vault).isDirectory()) fail('the vault in .notes-sync.json is not a folder');

const privateTerms = readFileSync('.private-terms', 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);

let result;
try {
  result = syncVault({ vault, out: 'src/content/notes', publicDir: 'public/notes', rules: { denyPaths, privateTerms, allowedPhrases: allowPhrases } });
} catch (e) {
  // Config errors name a list or a folder, never a term. Anything else may have come mid-write.
  if (!(e instanceof SyncConfigError)) fail('notes sync stopped partway, check git status');
  const { message } = e;
  const file = message.startsWith('privateTerms') ? '.private-terms: '
    : /^(denyPaths|allowPhrases|vault)/.test(message) ? '.notes-sync.json: ' : '';
  fail(`notes sync refused to run: ${file}${message}`);
}

if (!result.ok) {
  for (const p of result.problems) console.error(`${p.where}: ${p.rule}${p.line ? ` (line ${p.line})` : ''}`);
  fail(`notes sync failed with ${result.problems.length} problem(s); nothing was written`);
}
console.log(`published ${result.published.length} note(s)`);
for (const r of result.removed) console.log(`removed ${r}`);

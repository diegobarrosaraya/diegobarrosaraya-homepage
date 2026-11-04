import type { ParsedNote, Problem } from './types';

export const DAY_JOB_PATTERN = /\b(atlassian|jira|confluence|servicerocket|forge)\b/i;

// allowedPhrases: exact technical phrases that contain a private term but are harmless (a tool name, say).
export interface Rules { denyPaths: string[]; privateTerms: string[]; allowedPhrases?: string[] }

// Below this length an allowed phrase could hide too much of the text.
const MIN_ALLOWED_LENGTH = 6;

// Soft hyphen, zero-width characters, word joiner, invisible operators and BOM hide a word from a plain match.
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060-\u2064\uFEFF]/g;
const fold = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').toLowerCase();
const normPath = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').trim()
  .replace(/\\/g, '/').replace(/^(\.\/)+/, '');

const usableTerms = (rules: Rules) => rules.privateTerms.map(fold).map((t) => t.trim()).filter(Boolean);
const usableDenyPaths = (rules: Rules) => rules.denyPaths.map(normPath).filter(Boolean);
const foldedAllowed = (rules: Rules) => (rules.allowedPhrases ?? []).map((p) => fold(p).trim());
// A phrase may only excuse a term inside a longer phrase. One that equals a term, or holds no
// whole term (a piece of one), would switch that term off.
const usableAllowed = (phrase: string, terms: string[]) => phrase.length >= MIN_ALLOWED_LENGTH
  && terms.some((t) => phrase.includes(t)) && !terms.includes(phrase);

// One pass over the text, longest phrase first, so a masked phrase never makes room for another.
// The phrase must stand alone: a letter, digit, underscore or hyphen next to it means a longer word.
function allowedPattern(phrases: string[]): RegExp | undefined {
  if (!phrases.length) return undefined;
  const alts = [...phrases].sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));
  return new RegExp(`(?<![\\p{L}\\p{N}_-])(?:${alts.join('|')})(?![\\p{L}\\p{N}_-])`, 'gu');
}

// An empty rule list would let every note through, so refuse it. The message names the list, never a term.
export function assertUsableRules(rules: Rules): void {
  if (!usableTerms(rules).length) throw new Error('privateTerms has no usable entry');
  if (!usableDenyPaths(rules).length) throw new Error('denyPaths has no usable entry');
  const terms = usableTerms(rules);
  if (foldedAllowed(rules).some((p) => !usableAllowed(p, terms))) {
    throw new Error(`allowPhrases has an entry under ${MIN_ALLOWED_LENGTH} characters, equal to a term, or with no whole term in it`);
  }
}

// Folded text with the allowed phrases blanked out; the post-build check reuses it on built HTML.
export function maskAllowedPhrases(text: string, rules: Rules): string {
  const terms = usableTerms(rules);
  const allowed = allowedPattern(foldedAllowed(rules).filter((p) => usableAllowed(p, terms)));
  const folded = fold(text);
  return allowed ? folded.replace(allowed, " ") : folded;
}

// Reports rule names and locations only, never the matched text.
export function checkNote(note: ParsedNote, markdown: string, rules: Rules): Problem[] {
  const problems: Problem[] = [];
  const { relPath } = note;
  const path = normPath(relPath);
  if (usableDenyPaths(rules).some((p) => path.startsWith(p.endsWith('/') ? p : `${p}/`))) {
    problems.push({ rule: 'deny-path', where: relPath });
  }
  const terms = usableTerms(rules);
  // Unusable phrases are dropped here too, so checkNote never masks more than assertUsableRules accepts.
  const allowed = allowedPattern(foldedAllowed(rules).filter((p) => usableAllowed(p, terms)));
  // A space keeps the words on either side of a masked phrase from joining into a term.
  const maskAllowed = (folded: string) => (allowed ? folded.replace(allowed, ' ') : folded);
  const scan = (text: string, where: string, line?: number) => {
    const at = line === undefined ? {} : { line };
    const folded = maskAllowed(fold(text));
    if (terms.some((t) => folded.includes(t))) problems.push({ rule: 'private-term', where, ...at });
    if (DAY_JOB_PATTERN.test(text.normalize('NFKC').replace(INVISIBLE, ''))) problems.push({ rule: 'day-job-word', where, ...at });
  };
  scan(note.title, `${relPath}: title`);
  scan(note.description, `${relPath}: description`);
  scan(note.tags.join('\n'), `${relPath}: tags`);
  markdown.split(/\r?\n/).forEach((text, i) => scan(text, `${relPath}: body`, i + 1));
  return problems;
}

import type { ParsedNote, Problem } from './types';

export const DAY_JOB_PATTERN = /\b(atlassian|jira|confluence|servicerocket|forge)\b/i;

// allowedPhrases: exact technical phrases that contain a private term but are harmless (a tool name, say).
export interface Rules { denyPaths: string[]; privateTerms: string[]; allowedPhrases?: string[] }

// Below this length an allowed phrase could hide too much of the text.
const MIN_ALLOWED_LENGTH = 6;

// Soft hyphen, zero-width characters, word joiner and BOM hide a word from a plain match.
const INVISIBLE = /[­​-‍⁠﻿]/g;
const fold = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').toLowerCase();
const normPath = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').trim()
  .replace(/\\/g, '/').replace(/^(\.\/)+/, '');

const usableTerms = (rules: Rules) => rules.privateTerms.map(fold).map((t) => t.trim()).filter(Boolean);
const usableDenyPaths = (rules: Rules) => rules.denyPaths.map(normPath).filter(Boolean);
// Longest first, so a phrase that contains a shorter one is masked whole.
const foldedAllowed = (rules: Rules) => (rules.allowedPhrases ?? []).map((p) => fold(p).trim())
  .sort((a, b) => b.length - a.length);

// An empty rule list would let every note through, so refuse it. The message names the list, never a term.
export function assertUsableRules(rules: Rules): void {
  if (!usableTerms(rules).length) throw new Error('privateTerms has no usable entry');
  if (!usableDenyPaths(rules).length) throw new Error('denyPaths has no usable entry');
  if (foldedAllowed(rules).some((p) => p.length < MIN_ALLOWED_LENGTH)) {
    throw new Error(`allowPhrases has an entry shorter than ${MIN_ALLOWED_LENGTH} characters`);
  }
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
  // Short phrases are dropped here too, so checkNote never masks more than assertUsableRules accepts.
  const allowed = foldedAllowed(rules).filter((p) => p.length >= MIN_ALLOWED_LENGTH);
  // A space keeps the words on either side of a masked phrase from joining into a term.
  const maskAllowed = (folded: string) => allowed.reduce((s, p) => s.split(p).join(' '), folded);
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

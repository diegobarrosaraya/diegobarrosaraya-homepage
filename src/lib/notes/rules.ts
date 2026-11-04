import type { ParsedNote, Problem } from './types';

export const DAY_JOB_PATTERN = /\b(atlassian|jira|confluence|servicerocket|forge)\b/i;

export interface Rules { denyPaths: string[]; privateTerms: string[] }

// Soft hyphen, zero-width characters, word joiner and BOM hide a word from a plain match.
const INVISIBLE = /[­​-‍⁠﻿]/g;
const fold = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').toLowerCase();
const normPath = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '').trim()
  .replace(/\\/g, '/').replace(/^(\.\/)+/, '');

const usableTerms = (rules: Rules) => rules.privateTerms.map(fold).map((t) => t.trim()).filter(Boolean);
const usableDenyPaths = (rules: Rules) => rules.denyPaths.map(normPath).filter(Boolean);

// An empty rule list would let every note through, so refuse it. The message names the list, never a term.
export function assertUsableRules(rules: Rules): void {
  if (!usableTerms(rules).length) throw new Error('privateTerms has no usable entry');
  if (!usableDenyPaths(rules).length) throw new Error('denyPaths has no usable entry');
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
  const scan = (text: string, where: string, line?: number) => {
    const at = line === undefined ? {} : { line };
    const folded = fold(text);
    if (terms.some((t) => folded.includes(t))) problems.push({ rule: 'private-term', where, ...at });
    if (DAY_JOB_PATTERN.test(text.normalize('NFKC').replace(INVISIBLE, ''))) problems.push({ rule: 'day-job-word', where, ...at });
  };
  scan(note.title, `${relPath}: title`);
  scan(note.description, `${relPath}: description`);
  scan(note.tags.join('\n'), `${relPath}: tags`);
  markdown.split(/\r?\n/).forEach((text, i) => scan(text, `${relPath}: body`, i + 1));
  return problems;
}

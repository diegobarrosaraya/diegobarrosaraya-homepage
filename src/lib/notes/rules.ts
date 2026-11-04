import type { ParsedNote, Problem } from './types';

export const DAY_JOB_PATTERN = /\b(atlassian|jira|confluence|servicerocket|forge)\b/i;

export interface Rules { denyPaths: string[]; privateTerms: string[] }

// Reports rule names and locations only, never the matched text.
export function checkNote(note: ParsedNote, markdown: string, rules: Rules): Problem[] {
  const problems: Problem[] = [];
  const { relPath } = note;
  if (rules.denyPaths.some((p) => relPath.startsWith(p.endsWith('/') ? p : `${p}/`))) {
    problems.push({ rule: 'deny-path', where: relPath });
  }
  const terms = rules.privateTerms.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const hasTerm = (text: string) => { const l = text.toLowerCase(); return terms.some((t) => l.includes(t)); };
  const scan = (text: string, where: string, line?: number) => {
    const at = line === undefined ? {} : { line };
    if (hasTerm(text)) problems.push({ rule: 'private-term', where, ...at });
    if (DAY_JOB_PATTERN.test(text)) problems.push({ rule: 'day-job-word', where, ...at });
  };
  scan(note.title, `${relPath}: title`);
  scan(note.description, `${relPath}: description`);
  scan(note.tags.join('\n'), `${relPath}: tags`);
  markdown.split(/\r?\n/).forEach((text, i) => scan(text, `${relPath}: body`, i + 1));
  return problems;
}

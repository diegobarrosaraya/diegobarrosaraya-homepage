import { parse } from 'yaml';
import type { ParsedNote, Problem } from './types';

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export function parseNote(raw: string, relPath: string): { note?: ParsedNote; problems: Problem[] } {
  const m = raw.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  let fm: Record<string, unknown>;
  try {
    fm = (m ? parse(m[1]) : null) ?? {};
  } catch {
    // The YAML error text can quote note content, so report only the path.
    return { problems: [{ rule: 'bad-frontmatter', where: relPath }] };
  }
  const body = m ? raw.slice(raw.indexOf(m[0]) + m[0].length) : raw;
  const problems: Problem[] = [];

  const title = str(fm.title);
  const description = str(fm.description);
  if (!title) problems.push({ rule: 'missing-field', where: `${relPath}: title` });
  if (!description) problems.push({ rule: 'missing-field', where: `${relPath}: description` });
  const created = str(fm.created);
  const updated = str(fm.updated) ?? str(fm.timestamp) ?? created;
  if (!updated) problems.push({ rule: 'missing-date', where: relPath });
  if (problems.length) return { problems };

  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
  return {
    note: {
      relPath, title: title!, description: description!, tags, created, updated: updated!, body,
      publish: fm.publish === true, draft: fm.draft === true,
    },
    problems,
  };
}

export function slugify(title: string): string {
  return title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

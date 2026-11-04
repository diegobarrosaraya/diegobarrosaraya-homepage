import {
  copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, posix, resolve, sep } from 'node:path';
import { parse, stringify } from 'yaml';
import { FRONTMATTER, parseNote, slugify } from './parse';
import { assertUsableRules, checkNote, type Rules } from './rules';
import { maskCode, transformBody } from './transform';
import type { ParsedNote, Problem } from './types';

export interface SyncOptions { vault: string; out: string; publicDir: string; rules: Rules }
export interface SyncResult { ok: boolean; published: string[]; removed: string[]; problems: Problem[] }

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
// Any markdown image; group 1 is the target, in angle brackets or up to the first space.
const ANY_MD_IMAGE = /!\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]*)[^)]*\)/g;

const baseName = (p: string) => p.slice(p.lastIndexOf('/') + 1);

// Vault-relative posix paths of every file, skipping dot folders such as .obsidian and .git.
function walk(root: string, rel = ''): string[] {
  return readdirSync(join(root, rel), { withFileTypes: true }).flatMap((e) => {
    const path = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return e.name.startsWith('.') ? [] : walk(root, path);
    return e.isFile() ? [path] : [];
  });
}

// True for `publish: true` without `draft: true`. Unreadable YAML with a publish line counts as
// flagged, so its error is reported instead of the note being skipped.
function isFlagged(raw: string): boolean {
  const m = raw.replace(/^﻿/, '').match(FRONTMATTER);
  if (!m) return false;
  try {
    const fm = parse(m[1]);
    return fm?.publish === true && fm?.draft !== true;
  } catch {
    return /^\s*publish\s*:\s*true\b/im.test(m[1]);
  }
}

// Vault files an image name can refer to: by basename, or by path from the vault root,
// from the note's folder, or as a path suffix when the name contains a slash.
function findImage(name: string, noteRel: string, images: string[]): string[] {
  if (!name.includes('/')) return images.filter((f) => baseName(f) === name);
  const fromNote = posix.normalize(posix.join(posix.dirname(noteRel), name));
  const plain = posix.normalize(name);
  return images.filter((f) => f === fromNote || f === plain || f.endsWith(`/${plain}`));
}

interface Output { slug: string; content: string; images: Map<string, string> }  // file name -> vault path

// Thrown before anything is read or written: bad rules or unsafe output folders.
export class SyncConfigError extends Error {}

// Real path of `p`, or of its nearest existing parent plus the missing part, so nothing is created.
function resolveReal(p: string): string {
  const abs = resolve(p);
  if (existsSync(abs)) return realpathSync(abs);
  const parent = dirname(abs);
  if (parent === abs) return abs;
  return join(resolveReal(parent), basename(abs));
}

const within = (inner: string, outer: string) => inner === outer || inner.startsWith(outer.endsWith(sep) ? outer : outer + sep);
const overlaps = (a: string, b: string) => within(a, b) || within(b, a);

// The cleanup deletes files, so `out` and `publicDir` must be real folders apart from the vault and each other.
function checkFolders(vault: string, out: string, publicDir: string): { vault: string; out: string; publicDir: string } {
  for (const [name, p] of [['out', out], ['publicDir', publicDir]] as const) {
    let link = false;
    try { link = lstatSync(p).isSymbolicLink(); } catch { /* missing is fine */ }
    if (link) throw new SyncConfigError(`${name} is a symlink`);
  }
  if (!existsSync(vault)) throw new SyncConfigError('vault does not exist');
  const real = { vault: realpathSync(vault), out: resolveReal(out), publicDir: resolveReal(publicDir) };
  if (overlaps(real.out, real.vault)) throw new SyncConfigError('out overlaps the vault');
  if (overlaps(real.publicDir, real.vault)) throw new SyncConfigError('publicDir overlaps the vault');
  if (overlaps(real.out, real.publicDir)) throw new SyncConfigError('out and publicDir overlap');
  return real;
}

const noteKey = (target: string) => baseName(target.split('#')[0]).replace(/\.md$/i, '').trim().toLowerCase();

// Wikilink keys to slugs, with Obsidian's order: a file basename wins over a title. A key that
// points at two notes is left out and returned as ambiguous; a key whose only note is unpublished
// is left out, so the link becomes plain text.
function linkTargets(mdFiles: string[], notes: ParsedNote[], slugs: string[]) {
  const slugByPath = new Map(notes.map((n, i) => [n.relPath, slugs[i]]));
  const byBasename = new Map<string, Set<string | null>>();
  for (const rel of mdFiles) {
    const k = noteKey(rel);
    if (!byBasename.has(k)) byBasename.set(k, new Set());
    byBasename.get(k)!.add(slugByPath.get(rel) ?? null);
  }
  const byTitle = new Map<string, Set<string>>();
  notes.forEach((n, i) => {
    const k = n.title.toLowerCase();
    if (byBasename.has(k)) return;
    if (!byTitle.has(k)) byTitle.set(k, new Set());
    byTitle.get(k)!.add(slugs[i]);
  });
  const published = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const [k, values] of [...byBasename, ...byTitle] as [string, Set<string | null>][]) {
    if (values.size > 1) ambiguous.add(k);
    else { const [v] = values; if (v) published.set(k, v); }
  }
  return { published, ambiguous };
}

const WIKILINK = /(?<!!)\[\[([^[\]]+?)\]\]/g;

export function syncVault(opts: SyncOptions): SyncResult {
  try { assertUsableRules(opts.rules); } catch (e) { throw new SyncConfigError((e as Error).message); }
  const { vault, out, publicDir } = checkFolders(opts.vault, opts.out, opts.publicDir);
  const { rules } = opts;
  const files = walk(vault);
  const vaultImages = files.filter((f) => IMAGE_EXT.test(f));
  const problems: Problem[] = [];

  const notes: ParsedNote[] = [];
  for (const relPath of files.filter((f) => f.toLowerCase().endsWith('.md'))) {
    const raw = readFileSync(join(vault, relPath), 'utf8');
    if (!isFlagged(raw)) continue;
    const parsed = parseNote(raw, relPath);
    problems.push(...parsed.problems);
    if (parsed.note) notes.push(parsed.note);
  }

  const slugs = notes.map((n) => slugify(n.title));
  notes.forEach((n, i) => {
    const slug = slugs[i];
    if (!slug || slugs.indexOf(slug) !== slugs.lastIndexOf(slug)) problems.push({ rule: 'slug', where: n.relPath });
  });
  const { published, ambiguous } = linkTargets(files.filter((f) => f.toLowerCase().endsWith('.md')), notes, slugs);

  const outputs: Output[] = notes.map((note, i) => {
    const slug = slugs[i];
    const where = note.relPath;
    const t = transformBody(note.body, { title: note.title, slug, published });
    // Transform problems carry the title; report the path, like every other check.
    problems.push(...t.problems.map((p) => ({ ...p, where })));
    problems.push(...checkNote(note, t.markdown, rules));

    // A link whose target names two notes would be guessed, so it fails instead.
    maskCode(note.body).split('\n').forEach((text, line) => {
      for (const m of text.matchAll(WIKILINK)) {
        if (ambiguous.has(noteKey(m[1].split(/\\?\|/)[0]))) problems.push({ rule: 'ambiguous-link', where, line: line + 1 });
      }
    });

    const images = new Map<string, string>();
    for (const name of t.images) {
      const found = findImage(name, note.relPath, vaultImages);
      if (!found.length) { problems.push({ rule: 'image-missing', where }); continue; }
      const file = baseName(name);
      const prior = images.get(file);
      if (found.length > 1 || (prior && prior !== found[0])) problems.push({ rule: 'image-collision', where });
      else images.set(file, found[0]);
    }

    // A local image the transform did not rewrite would point at nothing on the site.
    const written = new Set(t.images.map(baseName));
    maskCode(t.markdown).split('\n').forEach((text, line) => {
      for (const m of text.matchAll(ANY_MD_IMAGE)) {
        const target = m[1].replace(/^<|>$/g, '');
        if (/^https?:\/\//i.test(target)) continue;
        const prefix = `/notes/${slug}/`;
        let rest = target.slice(prefix.length);
        try { rest = decodeURI(rest); } catch { /* compared as written */ }
        if (target.startsWith(prefix) && written.has(rest)) continue;
        problems.push({ rule: 'image-missing', where, line: line + 1 });
      }
    });

    const fm = {
      title: note.title, description: note.description, tags: note.tags,
      ...(note.created ? { created: note.created } : {}), updated: note.updated,
    };
    return { slug, content: `---\n${stringify(fm, { lineWidth: 0 })}---\n\n${t.markdown}`, images };
  });

  if (problems.length) return { ok: false, published: [], removed: [], problems };

  mkdirSync(out, { recursive: true });
  for (const o of outputs) {
    writeFileSync(join(out, `${o.slug}.md`), o.content);
    if (!o.images.size) continue;
    const dir = join(publicDir, o.slug);
    mkdirSync(dir, { recursive: true });
    for (const [file, src] of o.images) copyFileSync(join(vault, src), join(dir, file));
  }

  // The sync owns *.md directly in `out` and the subfolders of `publicDir`, nothing else.
  const removed: string[] = [];
  const remove = (path: string) => { rmSync(path, { recursive: true, force: true }); removed.push(path); };
  const mdNames = new Set(outputs.map((o) => `${o.slug}.md`));
  for (const e of readdirSync(out, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.md') && !mdNames.has(e.name)) remove(join(out, e.name));
  }
  if (existsSync(publicDir)) {
    const byFolder = new Map(outputs.filter((o) => o.images.size).map((o) => [o.slug, o.images]));
    for (const e of readdirSync(publicDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const keep = byFolder.get(e.name);
      if (!keep) { remove(join(publicDir, e.name)); continue; }
      for (const f of readdirSync(join(publicDir, e.name))) {
        if (!keep.has(f)) remove(join(publicDir, e.name, f));
      }
    }
  }
  return { ok: true, published: outputs.map((o) => o.slug), removed, problems };
}

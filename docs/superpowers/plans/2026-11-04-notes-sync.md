# Notes Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish selected vault notes on the site through a local sync script that refuses anything private, with `/notes/` pages, an RSS feed, a header link and a "Latest notes" list on the home page.

**Architecture:** A local-only script reads a vault folder named in a gitignored config file, keeps only notes flagged `publish: true`, runs every check on the title, description, tags and body, and writes finished markdown into `src/content/notes/` (images into `public/notes/`). Astro builds those committed files through a content collection. CI never sees the vault. The header link, the home list and the teams link render only when at least one note exists.

**Tech Stack:** Astro 7 static, TypeScript, `node:test` via `tsx`, `yaml` (frontmatter, dev dependency), `rehype-mermaid` (diagrams to SVG at build time, uses the Chromium already in CI).

**Spec:** the private notes design (kept outside this repo), plus the earlier plans in `docs/superpowers/plans/`.

## Global Constraints

- The vault path, the deny-path list and the private-term list are never written into this repo. They live in two gitignored files in the repo root: `.notes-sync.json` (`{ "vault": string, "denyPaths": string[] }`) and `.private-terms` (one term per line, already exists). Tests use placeholder values only.
- A note publishes only with `publish: true` in its frontmatter. `draft: true` skips it even when flagged.
- The sync fails (non-zero exit, nothing written) when any flagged note breaks a rule. It never skips a flagged note silently.
- Checks cover title, description, tags and body: deny-path, `.private-terms`, and the day-job words `atlassian`, `jira`, `confluence`, `servicerocket`, `forge` (whole words, any case). Failure messages name the note and the rule, never the matched private term.
- Kept frontmatter: `title`, `description`, `tags`, `created`, `updated`. Everything else is dropped.
- `updated` comes from the vault's `updated`, else `timestamp`, else `created`; a note with none of them fails. No file modification times.
- Wikilinks to published notes become links to `/notes/<slug>/`; links to unpublished notes become plain text (the alias if there is one, else the note name). Images are copied only for published notes. Any other embed (`![[note]]`, `![[note#heading]]`) fails. Fenced blocks of Dataview or other plugin code fail. Mermaid blocks are allowed.
- Slugs are flat, from the title, stable; a duplicate or empty slug fails the sync.
- The sync writes files and never commits. Diego reviews the diff and pushes.
- Every page works with JavaScript off. No em dashes in copy. Avoid the words on Diego's buzzword list.
- Commit messages end with a blank line and: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Work on branch `notes/sync`. Never push.
- Pass `PLAYWRIGHT_BROWSERS_PATH=$(nix build nixpkgs#playwright-driver.browsers --no-link --print-out-paths)` and `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true` when running `pnpm build`, and run pnpm as `nix shell nixpkgs#pnpm -c pnpm ...`.

## Review Focus

1. Bash such as `[[ -f "$x" ]]` inside a fenced block or inline code is not read as a wikilink or embed. Pinned in Task 2.
2. A body with a second `# ` heading, or a first `# ` heading equal to the title: the first is stripped, a second fails. Pinned in Task 2.
3. A wikilink to an unpublished note leaves plain text with no `href`, and that text still goes through the checks, so a private title in it fails the sync. Pinned in Tasks 2 and 3.
4. Two notes with the same slug, or a title that slugifies to nothing, fail. Pinned in Tasks 1 and 4.
5. Unflagging a note and syncing again removes its generated file and images, and touches nothing the sync did not create. Pinned in Task 4.
6. A build with zero notes passes and shows no Notes link anywhere. Pinned in Task 5 and Task 6.

## File Structure

```
src/lib/notes/types.ts            Problem, ParsedNote, Rules
src/lib/notes/rules.ts            DAY_JOB_PATTERN, checkNote
src/lib/notes/parse.ts            parseNote, slugify
src/lib/notes/transform.ts        transformBody (code-aware)
src/lib/notes/sync.ts             syncVault (pure over a vault dir and an output dir)
src/lib/notes/rss.ts              renderRss
src/lib/notes/rehype-callouts.ts  Obsidian callouts to <aside>
src/lib/notes/*.test.ts           unit tests
src/lib/notes/fixtures/vault/     placeholder vault for tests
scripts/sync-notes.ts             CLI: reads .notes-sync.json and .private-terms, calls syncVault
src/content.config.ts             notes collection
src/content/notes/.gitkeep        keeps the folder when empty (owned by the sync)
src/pages/notes/index.astro, [slug].astro, rss.xml.ts
src/components/NoteList.astro
```

---

### Task 1: Parsing, slugs and dates

**Files:**
- Create: `src/lib/notes/types.ts`, `src/lib/notes/parse.ts`, `src/lib/notes/parse.test.ts`
- Modify: `package.json` (add `yaml` as a dev dependency)

**Interfaces:**
- Produces:

```ts
export interface Problem {
  rule: 'deny-path' | 'private-term' | 'day-job-word' | 'embed' | 'plugin-block'
      | 'extra-h1' | 'missing-field' | 'missing-date' | 'slug' | 'image-missing';
  where: string;       // note path, plus field name for frontmatter fields
  line?: number;       // 1-based line in the body when known
}
export interface ParsedNote {
  relPath: string; title: string; description: string; tags: string[];
  created?: string; updated: string; body: string; publish: boolean; draft: boolean;
}
export function parseNote(raw: string, relPath: string): { note?: ParsedNote; problems: Problem[] };
export function slugify(title: string): string;   // '' when nothing usable remains
```

- [ ] **Step 1: Write the failing tests** in `parse.test.ts`: `parseNote` returns `publish: true` only for `publish: true` and `draft: true` is reported separately; `updated` falls back to `timestamp` then `created` and a note with none returns `problems: [{ rule: 'missing-date', ... }]` and no `note`; missing `title` or `description` gives `missing-field` with the field in `where`; dates stay strings (`'2026-08-14'`); extra frontmatter fields do not appear on the result. `slugify('Linux Terminal and Shell Scripting')` is `'linux-terminal-and-shell-scripting'`, `slugify('Guía de Terminal: Cómo Empezar')` is `'guia-de-terminal-como-empezar'`, `slugify('???')` is `''`.
- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm test`
Expected: FAIL, cannot find module `./parse`

- [ ] **Step 3: Implement** `parseNote` (split the leading `---` block, parse it with `yaml`) and `slugify` (NFKD, drop diacritics, lowercase, runs of non-alphanumerics to one hyphen, trim hyphens).
- [ ] **Step 4: Run to see them pass**, then
- [ ] **Step 5: Commit** `feat: note parsing, slugs and dates`.

---

### Task 2: Body transform

**Files:**
- Create: `src/lib/notes/transform.ts`, `src/lib/notes/transform.test.ts`

**Interfaces:**
- Consumes: `Problem` (Task 1).
- Produces:

```ts
export interface TransformContext {
  title: string; slug: string;
  published: ReadonlyMap<string, string>;  // lowercased note title or file basename -> slug
}
export function transformBody(body: string, ctx: TransformContext):
  { markdown: string; images: string[]; problems: Problem[] };
// images: names as referenced in the note, in order, without duplicates
```

- [ ] **Step 1: Write the failing tests**, each with a small literal body:
  - `[[Other note]]` with `published` containing `other note` becomes `[Other note](/notes/<slug>/)`; `[[Other note|the guide]]` uses the alias; a link to a note not in `published` becomes plain text with no `](`.
  - Review focus 1: a fenced block and an inline code span containing `[[ -f "$x" ]]` come out byte-identical, with no problems.
  - `![[diagram.png]]` and `![[diagram.png|300]]` and `![alt](diagram.png)` become `![...](/notes/<slug>/diagram.png)` and `images` is `['diagram.png']`; `![[Another note]]` and `![[Another note#Part]]` each give an `embed` problem with the 1-based line.
  - A fenced block whose language is `dataview`, `dataviewjs`, `query` or `tasks` gives `plugin-block`; a `mermaid` block passes through unchanged.
  - Review focus 2: a leading `# <title>` line (any case) is removed; a second `# ` line outside code gives `extra-h1`; a `#` comment line inside a bash fence is ignored.
- [ ] **Step 2: Run to see them fail.**
- [ ] **Step 3: Implement `transformBody`.** One pass line by line that tracks whether the cursor is inside a fenced block, and masks inline code spans before it looks for `[[`, `![[` and `![](`.
- [ ] **Step 4: Run to see them pass**, then
- [ ] **Step 5: Commit** `feat: note body transform`.

---

### Task 3: Rules

**Files:**
- Create: `src/lib/notes/rules.ts`, `src/lib/notes/rules.test.ts`
- Modify: `scripts/check-dist.test.ts` (the day-job test imports `DAY_JOB_PATTERN` and no longer uses its own regex)

**Interfaces:**
- Consumes: `ParsedNote`, `Problem` (Task 1).
- Produces:

```ts
export const DAY_JOB_PATTERN: RegExp;   // /\b(atlassian|jira|confluence|servicerocket|forge)\b/i
export interface Rules { denyPaths: string[]; privateTerms: string[] }
export function checkNote(note: ParsedNote, markdown: string, rules: Rules): Problem[];
```

- [ ] **Step 1: Write the failing tests**: a note under a denied path prefix gives `deny-path`; a placeholder term (`acme-example`) in the title, the description, a tag, or the body gives `private-term` with the right `where`; the word `Jira` gives `day-job-word`; the words `forget`, `enforced` and `reforged` do not (whole words only); the problem objects contain no private term text (`JSON.stringify(problems)` does not include `acme-example`); a clean note gives `[]`. Review focus 3: markdown that still contains the plain text of a private-titled link fails.
- [ ] **Step 2: Run to see them fail.**
- [ ] **Step 3: Implement** `checkNote`. Update `scripts/check-dist.test.ts` to use `DAY_JOB_PATTERN` (whole words) so a note containing "forget" cannot break the build.
- [ ] **Step 4: Run** `pnpm test`, then `pnpm build && pnpm test:dist`. Expected: all pass.
- [ ] **Step 5: Commit** `feat: note publishing rules`.

---

### Task 4: The sync

**Files:**
- Create: `src/lib/notes/sync.ts`, `src/lib/notes/sync.test.ts`, `src/lib/notes/fixtures/vault/**` (placeholder notes), `scripts/sync-notes.ts`, `src/content/notes/.gitkeep`
- Modify: `.gitignore` (add `.notes-sync.json`), `package.json` (script `sync-notes`: `tsx scripts/sync-notes.ts`)

**Interfaces:**
- Consumes: Tasks 1 to 3.
- Produces:

```ts
export interface SyncOptions { vault: string; out: string; publicDir: string; rules: Rules }
export interface SyncResult { ok: boolean; published: string[]; removed: string[]; problems: Problem[] }
export function syncVault(opts: SyncOptions): SyncResult;   // writes only when ok
```

The CLI reads `.notes-sync.json` and `.private-terms`, calls `syncVault({ vault, out: 'src/content/notes', publicDir: 'public/notes', rules })`, prints `note: rule (line N)` per problem, exits 1 when `ok` is false.

- [ ] **Step 1: Write the failing tests** against the fixture vault in a temp output folder: flagged notes are written as `<slug>.md` with only the five kept fields; unflagged and `draft` notes are not; a fixture with a missing date and a fixture with a denied-path note make `ok` false and write nothing, even for the valid notes; two notes with one slug, and a title that slugifies to `''`, give `slug` problems (review focus 4); an image is copied to `<publicDir>/<slug>/` only for a published note and a missing image gives `image-missing`; a wikilink between two published fixture notes becomes a link; review focus 5: sync, then remove the flag in a copy of the vault and sync again: the file and its images are removed and a `.gitkeep` placed in the output folder beforehand is still there.
- [ ] **Step 2: Run to see them fail.**
- [ ] **Step 3: Implement `syncVault`.** Collect and check every flagged note first (resolving wikilinks needs the full set of published titles and basenames), and write only when there are no problems. The sync owns `*.md` in `out` and the subfolders of `publicDir` and removes ones no longer produced.
- [ ] **Step 4: Run** `pnpm test`; expected PASS. Then run `pnpm sync-notes` without `.notes-sync.json`; expected: a clear "missing .notes-sync.json" message and exit 1.
- [ ] **Step 5: Commit** `feat: notes sync script`.

---

### Task 5: Collection, pages and feed

**Files:**
- Create: `src/content.config.ts`, `src/lib/notes/rehype-callouts.ts`, `src/lib/notes/rehype-callouts.test.ts`, `src/lib/notes/rss.ts`, `src/lib/notes/rss.test.ts`, `src/components/NoteList.astro`, `src/pages/notes/index.astro`, `src/pages/notes/[slug].astro`, `src/pages/notes/rss.xml.ts`
- Modify: `astro.config.ts` (markdown: exclude `mermaid` from syntax highlighting, add `rehype-mermaid` with inline SVG and `rehypeCallouts`), `scripts/check-dist.test.ts`, `package.json` (add `rehype-mermaid`)

**Interfaces:**
- Consumes: the collection entries written by Task 4.
- Produces:

```ts
export function rehypeCallouts(): (tree: HastRoot) => void;
// <blockquote> whose first paragraph starts "[!type] Title" becomes
// <aside class="callout callout-<type>"> with a <p class="callout-title"> then the rest
export interface FeedItem { title: string; slug: string; description: string; updated: string }
export function renderRss(items: FeedItem[], site: string): string;
```

`NoteList` props `{ notes: Array<{ slug: string; title: string; description: string; updated: string; tags: string[] }> }`.

- [ ] **Step 1: Write the failing tests.** Unit: a hand-built hast blockquote with `[!warning] Careful` becomes an `aside` with class `callout callout-warning` and a `callout-title` paragraph reading `Careful`; a plain blockquote is unchanged; `renderRss` escapes `&`, `<` and `>` in titles and orders items newest first. Dist (conditional, using `readdirSync('src/content/notes')` for `.md` files): when there are none, `dist/notes/index.html` may exist but contains no links to `/notes/<slug>/`; when there are some, every note has `dist/notes/<slug>/index.html` with exactly one `h1`, the index lists each under each of its tags, and `dist/notes/rss.xml` starts with `<?xml` and contains each slug.
- [ ] **Step 2: Run to see them fail.**
- [ ] **Step 3: Implement** the collection schema (`title`, `description`, `tags`, `created`, `updated`), the three routes and the plugin. The index groups by tag, newest first inside a group, and shows a plain "No notes yet." when empty. Reading layout in the current direction: comfortable measure, Archivo headings, Barlow body, themed code blocks, callouts as quiet asides, tables, and diagrams legible in both the Dial and LCD views. Use a temporary sample note in `src/content/notes/` for the captures, and delete it before the commit.
- [ ] **Step 4: Verify.** Run `pnpm test`, then `pnpm build && pnpm test:dist` with zero notes (expected PASS, no Notes link anywhere), then again with the temporary sample note including a callout, a table and a mermaid block (expected PASS). Capture `/notes/` and a note page at 1440 and 390 in both views, and look at them.
- [ ] **Step 5: Commit** `feat: notes pages, feed and callouts`.

---

### Task 6: Header, home list and teams link

**Files:**
- Modify: `src/components/Header.astro`, `src/pages/index.astro`, `scripts/check-dist.test.ts`

**Interfaces:**
- Consumes: `NoteList` and the collection (Task 5); `HOME.team` (unchanged text).
- Produces: a Notes item in the header (`current` accepts `'notes'`), a "Latest notes" section after "How I work" (three newest, link to `/notes/`), and the word "guides" in the second `HOME.team` line linked to `/notes/`. All three render only when the collection has at least one entry.

- [ ] **Step 1: Write the failing tests** (conditional on `src/content/notes` having `.md` files, using the same helper as Task 5): with notes, every built page's header links to `/notes/`, the home page has a `Latest notes` heading after `id="how"` with at most three note links, and the teams line links "guides" to `/notes/`; without notes, no built page contains `href="/notes/"` (review focus 6) and `HOME.team` text is unchanged.
- [ ] **Step 2: Run to see them fail** (with a temporary sample note in place).
- [ ] **Step 3: Implement.** Do not change `src/data/story.ts`; wrap the word in the page markup.
- [ ] **Step 4: Verify** both states as in Task 5, and capture the home page at 1440 and 390.
- [ ] **Step 5: Commit** `feat: notes in the header, home page and teams line`.

---

### Task 7: First batch (stops for Diego)

This task changes private notes and publishes public text. Claude prepares each step and waits for Diego before the next.

- [ ] **Step 1:** Create `.notes-sync.json` locally from the private design (vault folder and deny-path list) and confirm `.notes-sync.json` and `.private-terms` are ignored by git.
- [ ] **Step 2:** In the vault, add `publish: true` to the eight guides named in the private design. Run `pnpm sync-notes`. Expected: failures on the guides that mention day-job tools, listing note and line.
- [ ] **Step 3 (Diego approves each):** For each failing guide, propose the smallest rewording in the vault note (a generic phrase in place of the product name), show the before and after, and apply it only after Diego says yes.
- [ ] **Step 4 (Diego edits):** Draft the "skills library and second brain" note in the vault in plain first person, from the existing Obsidian setup note and the skill names only, with `publish: false`. Diego edits it and flips the flag.
- [ ] **Step 5:** Run `pnpm sync-notes`, then `pnpm test`, `pnpm build` and `pnpm test:dist` (with `.private-terms` present). Expected: all pass. Review `git diff` of `src/content/notes/` and `public/notes/` with Diego.
- [ ] **Step 6:** Commit `content: first notes batch`. Diego pushes.

---

### Task 8: Finish

- [ ] **Step 1:** One batched capture round: `/notes/`, one note page, `/` (with the new list and header link) at 1440 and 390, Dial and LCD, into `.impeccable/review/`. Fix what they show in one batch. Run `impeccable detect --json src/` once.
- [ ] **Step 2:** Fresh finish review against the current design direction, then update `DESIGN.md` for the notes pages (reading layout, callouts, diagrams).
- [ ] **Step 3:** Final whole-branch review with a stronger model, pointed at private information: the committed notes, the sync output, the built site and the git history.
- [ ] **Step 4:** After Diego pushes, check the live `/notes/`, one note, the feed, and that CI passed without `.private-terms`.

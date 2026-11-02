# Caliber Sheet Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken React "terminal OS" site with a static Astro site in the Caliber Sheet world (home, work areas with service records and the zoom interaction, resume, contact, now), deployed to GitHub Pages through Actions.

**Architecture:** Astro static output. All content is typed TypeScript data or Astro pages, prerendered to HTML so every URL works without JavaScript. Two small client enhancements: the theme toggle and the zoom into a part of the movement drawing, which rides Astro's View Transitions (`<ClientRouter />`) with the drawing persisted across pages.

**Tech Stack:** Astro 7 (static), TypeScript, pnpm, Node 24 (Astro 7 needs Node >= 22.23.4), `tsx` for tests with `node:test`, `@astrojs/sitemap`, GitHub Actions (`actions/upload-pages-artifact`, `actions/deploy-pages`), existing pandoc resume pipeline.

**Spec:** the private design note (kept outside this repo). Product record: `PRODUCT.md`. Approved mockup: the approved mockup (kept outside this repo) (the reference for drawing, layout, tokens and zoom behaviour).

**Scope:** This plan covers spec phases 0 and 1. Two later plans follow once this ships: notes sync (phase 2), and motion, console and extras (phases 3 and 4).

## Global Constraints

- Nothing about Atlassian, Jira, Confluence or ServiceRocket appears outside `/resume`. No client names anywhere, including tests and comments.
- Every page renders its full content with JavaScript off. Every callout on the drawing is a real link.
- Under `prefers-reduced-motion: reduce`: no zoom animation, no view-transition animation, instant navigation.
- Watch vocabulary only in labels (Specification, Service records, Parts list, Lume view). Body copy is plain English.
- Colour roles: ground `#EDF0F2`, plate `#E2E6E9`, ink `#121518`, ink-2 `#47515A`, hairline `#9AA4AD`, steel (clickable only) `#1F3F8F`, ruby (active only) `#A3142D`. Lume view: ground `#060807`, ink `#D5DCD2`, ink-2 `#93A08F`, hairline `#34403A`, steel and active `#A6F58A` with glow.
- Fonts: Barlow (body), Barlow Condensed (labels, headings), JetBrains Mono (refs, part numbers, data). Self-host with `@fontsource` packages, not Google Fonts links.
- No em dashes in any copy.
- Custom domain `diegobarrosaraya.com` (`public/CNAME`). Site URL `https://diegobarrosaraya.com`, base `/`.
- All copy is drafted from public sources only (repo READMEs, `public/resume.json`) and marked for Diego's review before cutover.

## Review Focus

1. Direct visit to a deep URL (`/work/integrations/`, `/work/integrations/teams-calls-fetcher/`) on GitHub Pages: full page renders, not a 404 or empty shell. Pinned by Task 5's dist check.
2. Internal links with or without trailing slash: every internal `href` in `dist/` resolves to a built file. Pinned by Task 5's link check.
3. Banned words slipping into hand-written copy (work data, home, now, contact). Pinned by Task 3's copy test.
4. Blocked or throwing `localStorage` (private windows, previews): theme toggle still works and never throws. Pinned by Task 2's `readTheme` test.
5. Reduced motion or missing View Transitions support: navigation still lands on the right area with the right part highlighted, no animation. Pinned by Task 6's `shouldAnimate` test plus the manual check.

---

## File Structure

```
astro.config.mjs                  site, sitemap, static output
package.json                      scripts: dev, build, preview, test, test:dist, generate-resume
flake.nix                         dev shell: nodejs_24, pnpm, pandoc, texliveFull
.github/workflows/deploy.yml      build, test, deploy to Pages; push to main, nightly, manual
public/                           CNAME, favicon.svg, me.jpg, resume.json, resume.pdf
scripts/json-to-markdown.ts       existing resume pipeline (kept)
scripts/check-dist.test.ts        post-build checks over dist/
src/data/work.ts                  work areas and service records (single source)
src/data/work.test.ts
src/lib/zoom.ts                   viewBox math, easing, shouldAnimate
src/lib/zoom.test.ts
src/lib/theme.ts                  readTheme / writeTheme, never throw
src/lib/theme.test.ts
src/lib/build-info.ts             build date and short commit
src/styles/tokens.css             colour, type, spacing tokens, light and lume
src/styles/global.css             base elements, selection, focus, scrollbars
src/layouts/Sheet.astro           html shell, meta, OG, ClientRouter, header, footer
src/components/Header.astro       title block and part-number nav
src/components/Footer.astro       build date, commit, contact
src/components/ThemeToggle.astro  Lume view / Day view button
src/components/Movement.astro     exploded drawing, callouts as links, focus prop
src/components/SpecTable.astro
src/components/RecordsTable.astro
src/components/AreaDetail.astro   right column of a work area
src/scripts/zoom-client.ts        animates the persisted drawing between pages
src/pages/index.astro
src/pages/work/[area]/index.astro
src/pages/work/[area]/[record].astro
src/pages/resume.astro
src/pages/contact.astro
src/pages/now.astro
src/pages/404.astro
```

Removed: `index.html`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/pages/*.tsx`, `src/vite-env.d.ts`, `assets/` (committed build output), `.nojekyll`, `public/_redirects`, `package-lock.json`, React, React Router, react-icons, Tailwind and ESLint React plugins.

---

### Task 1: Astro skeleton that deploys

**Files:**
- Create: `astro.config.mjs`, `src/pages/index.astro` (placeholder), `scripts/check-dist.test.ts`, `.github/workflows/deploy.yml` (replace)
- Modify: `package.json`, `flake.nix`, `tsconfig.json`, `.gitignore`
- Delete: everything in the "Removed" list above

**Interfaces:**
- Produces: `pnpm build` writes `dist/`; `pnpm test:dist` runs `scripts/check-dist.test.ts` against `dist/`; `pnpm test` runs `node --import tsx --test "src/**/*.test.ts"`.

- [ ] **Step 1: Create the branch**

```bash
git switch -c redesign/caliber feature/typescript-react
```

- [ ] **Step 2: Remove the React app and add Astro**

Delete the "Removed" files. Then:

```bash
pnpm remove react react-dom react-router-dom react-icons @vitejs/plugin-react @tailwindcss/vite tailwindcss eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
pnpm add astro @astrojs/sitemap @fontsource/barlow @fontsource/barlow-condensed @fontsource/jetbrains-mono
```

`astro.config.mjs`: `site: 'https://diegobarrosaraya.com'`, `output: 'static'`, `trailingSlash: 'always'`, `build: { format: 'directory' }`, `integrations: [sitemap()]`. `tsconfig.json` extends `astro/tsconfigs/strict`. Add `dist/`, `.astro/`, `resume.md` to `.gitignore`. `flake.nix`: `pkgs.nodejs_20` becomes `pkgs.nodejs_24`; shellHook port becomes 4321.

Scripts in `package.json`: `dev: astro dev`, `build: astro build`, `preview: astro preview`, `test: node --import tsx --test "src/**/*.test.ts"`, `test:dist: node --import tsx --test scripts/check-dist.test.ts`, `generate-resume` unchanged.

- [ ] **Step 3: Write the failing dist test**

```ts
// scripts/check-dist.test.ts
test('home page is built HTML, not the Vite source', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('/src/main.tsx'));
  assert.match(html, /<title>[^<]+<\/title>/);
});
test('custom domain survives the build', () => {
  assert.equal(readFileSync('dist/CNAME', 'utf8').trim(), 'diegobarrosaraya.com');
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `pnpm test:dist`
Expected: FAIL, `ENOENT ... dist/index.html`

- [ ] **Step 5: Add a placeholder `src/pages/index.astro`** with `<title>Diego Barros Araya</title>` and one line of text, then build.

Run: `pnpm build && pnpm test:dist`
Expected: build succeeds, 2 tests pass.

- [ ] **Step 6: Replace `.github/workflows/deploy.yml`**

Triggers: `push` to `main`, `schedule: cron '0 6 * * *'`, `workflow_dispatch`. Permissions `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages`, `cancel-in-progress: false`. Steps: checkout, `pnpm/action-setup`, `actions/setup-node` with `node-version: 24` and pnpm cache, `pnpm install --frozen-lockfile`, apt install `pandoc texlive-latex-extra`, `pnpm generate-resume`, `pnpm test`, `pnpm build`, `pnpm test:dist`, `actions/upload-pages-artifact` with `path: dist`, `actions/deploy-pages`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace React SPA with Astro skeleton and Actions deploy"
```

- [ ] **Step 8: Cutover gate (stop and ask Diego)**

Diego flips Settings, Pages, Source to "GitHub Actions". Then, with his OK in the current conversation:

```bash
git fetch origin
git tag -a legacy-jekyll origin/main -m "Old Jekyll site before the Caliber redesign"
git merge -s ours origin/main -m "Keep Jekyll history; Caliber site replaces it"
git push origin legacy-jekyll redesign/caliber:main
```

The merge keeps the old history, so the push to `main` is a fast-forward, not a force push.

Run: `gh run watch` on the triggered run, then `curl -s https://diegobarrosaraya.com | grep -c main.tsx`
Expected: run succeeds; grep prints `0`.

---

### Task 2: Tokens, layout, header, footer, theme

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Sheet.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ThemeToggle.astro`, `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/lib/build-info.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `Sheet.astro` props `{ title: string; description: string; current?: 'work' | 'records' | 'notes' | 'resume' | 'contact' }`, default slot. `readTheme(storage: Pick<Storage, 'getItem'> | undefined): 'light' | 'dark' | null`. `writeTheme(storage: Pick<Storage, 'setItem'> | undefined, theme: 'light' | 'dark'): void`. `buildInfo(): { date: string; commit: string }` (date `YYYY-MM-DD`; commit is `GITHUB_SHA` first 7 chars, else `git rev-parse --short HEAD`, else `local`).

- [ ] **Step 1: Record the direction contract (no code yet)**

Write the surface brief with the six contract blocks from the spec's "Visual direction: Caliber Sheet" section (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM with seed key `af12aab7`, FINISH line verbatim):

```bash
~/.config/claude-code-personal/skills/impeccable/scripts/impeccable surface-brief write src/pages/index.astro /path/to/brief.md
```

Never copy the contract into source files.

- [ ] **Step 2: Write the failing theme tests**

```ts
test('readTheme returns null when storage throws', () => {
  assert.equal(readTheme({ getItem() { throw new Error('blocked'); } }), null);
});
test('readTheme ignores unknown values', () => {
  assert.equal(readTheme({ getItem: () => 'sepia' }), null);
});
test('readTheme returns a saved theme', () => {
  assert.equal(readTheme({ getItem: () => 'dark' }), 'dark');
});
test('writeTheme swallows storage errors', () => {
  assert.doesNotThrow(() => writeTheme({ setItem() { throw new Error('quota'); } }, 'dark'));
});
```

- [ ] **Step 3: Run to see them fail**

Run: `pnpm test`
Expected: FAIL, cannot find module `./theme`

- [ ] **Step 4: Implement `src/lib/theme.ts`**, storage key `dba-theme`. Then run `pnpm test`; expected PASS.

- [ ] **Step 5: Build tokens, layout and chrome from the mockup**

Port the mockup's `:root` tokens, lume overrides (`prefers-color-scheme` guarded by `:root:not([data-theme="light"])`, plus `:root[data-theme="dark"]`), header title block, nav with part numbers, footer and the toggle into the files above. Use the colour values in Global Constraints. `Sheet.astro` includes `<ClientRouter />`, OG tags (`og:title`, `og:description`, `og:image` = `/me.jpg`), canonical URL, and an inline head script that applies the saved theme before paint. Theme `::selection`, `:focus-visible`, scrollbars and underline offset from tokens. The footer shows `Last regulated {date} · build {commit}`.

- [ ] **Step 6: Verify**

Run: `pnpm build && pnpm test:dist`, then `pnpm preview` and open `http://localhost:4321/`.
Expected: tests pass; header, footer and the Lume view toggle render and switch theme, which survives reload.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: Caliber Sheet tokens, layout and theme toggle"
```

---

### Task 3: Work data

**Files:**
- Create: `src/data/work.ts`, `src/data/work.test.ts`

**Interfaces:**
- Produces:

```ts
export type AreaSlug = 'integrations' | 'backend' | 'agents' | 'open-source' | 'infrastructure';
export type PartId = 'train' | 'barrel' | 'escape' | 'balance' | 'plate';
export interface ServiceRecord {
  slug: string; name: string; repo?: string;
  constraint: string; approach: string; safeguard: string; result: string;
}
export interface WorkArea {
  slug: AreaSlug; number: '01' | '02' | '03' | '04' | '05'; part: PartId;
  title: string; lede: string; records: ServiceRecord[];
}
export const AREAS: readonly WorkArea[];
export function areaBySlug(slug: string): WorkArea | undefined;
export function recordRef(area: WorkArea, index: number): string; // "01.02"
```

Area to part mapping (matches the mockup): `01 integrations` to `train`, `02 backend` to `barrel`, `03 agents` to `escape`, `04 open-source` to `balance`, `05 infrastructure` to `plate`.

- [ ] **Step 1: Write the failing tests**

```ts
test('five areas numbered 01 to 05 in order, unique slugs and parts', () => {
  assert.deepEqual(AREAS.map(a => a.number), ['01', '02', '03', '04', '05']);
  assert.equal(new Set(AREAS.map(a => a.slug)).size, 5);
  assert.equal(new Set(AREAS.map(a => a.part)).size, 5);
});
test('every record has all four parts of its story and a unique slug in its area', () => {
  for (const a of AREAS) {
    assert.ok(a.records.length > 0, a.slug);
    assert.equal(new Set(a.records.map(r => r.slug)).size, a.records.length);
    for (const r of a.records) for (const k of ['constraint', 'approach', 'safeguard', 'result'] as const)
      assert.ok(r[k].trim().length > 0, `${a.slug}/${r.slug}.${k}`);
  }
});
test('work copy never mentions the day job', () => {
  const text = JSON.stringify(AREAS);
  assert.doesNotMatch(text, /atlassian|jira|confluence|servicerocket/i);
  assert.doesNotMatch(text, /—/); // no em dashes
});
test('recordRef pads the record index', () => {
  assert.equal(recordRef(AREAS[0], 1), '01.02');
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm test`
Expected: FAIL, cannot find module `./work`

- [ ] **Step 3: Fill `src/data/work.ts`**

Areas, titles and ledes come from the mockup's `SECTIONS` object. Records:

| Area | Records (slug) |
|---|---|
| integrations | `teams-calls-fetcher`, `github-readme-stats-worker`, `linkedin-resume-generator` |
| backend | `pulsovivo`, `agranelos-bff` |
| agents | `nix-ai-tooling` |
| open-source | `ardour-wayland` |
| infrastructure | `nix-config`, `this-site` |

The "headless agent runs" record from the mockup is left out: it comes from private notes and is not published yet. Draft `approach` and `result` from each repo's README (`gh api repos/diegobarrosaraya/<repo>/readme --jq .content | base64 -d`). `teams-calls-fetcher` copy mentions no real meeting. Put `// DRAFT: Diego reviews` at the top of the file.

- [ ] **Step 4: Run to see them pass**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data && git commit -m "feat: work areas and service records data"
```

---

### Task 4: Movement drawing and home page

**Files:**
- Create: `src/components/Movement.astro`, `src/components/SpecTable.astro`, `src/components/RecordsTable.astro`
- Modify: `src/pages/index.astro`, `scripts/check-dist.test.ts`

**Interfaces:**
- Consumes: `AREAS`, `PartId`, `AreaSlug` (Task 3); `Sheet` (Task 2).
- Produces: `<Movement focus?: AreaSlug />` renders an `<svg id="movement" viewBox="0 0 600 600">` with one `<g class="part" data-part={PartId}>` per part and, per area, an `<a class="callout" href={`/work/${slug}/`} data-part={PartId}>`. With `focus`, the matching part gets class `focus` and the root gets `data-focus={slug}`. The `<svg>` carries `transition:persist="movement"`. `<RecordsTable records={Array<{ area: WorkArea; record: ServiceRecord; ref: string }>} />`.

- [ ] **Step 1: Write the failing dist tests**

```ts
test('home links every work area from the drawing', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  for (const s of ['integrations', 'backend', 'agents', 'open-source', 'infrastructure'])
    assert.match(html, new RegExp(`class="callout"[^>]*href="/work/${s}/"|href="/work/${s}/"[^>]*class="callout"`));
});
test('home has the resume action without JavaScript', () => {
  assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/resume\.pdf"/);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm build && pnpm test:dist`
Expected: FAIL on both new tests.

- [ ] **Step 3: Port the drawing**

The mockup generates the drawing with JavaScript (`gearPath`, `spiral`, the `part(...)` calls and `CALLS`). Move that geometry into `Movement.astro`'s frontmatter so it runs at build time and the HTML ships a static SVG: the same functions, positions and callout coordinates, with the `scale(1 0.46)` squash per part. Callouts become `<a>` elements with their label and number as SVG text. Hover and focus highlighting is CSS only (`.callout:hover`, `:focus-visible`, and the `:has()` selector on the svg to light the matching part).

- [ ] **Step 4: Build the home page**

Order from the spec: drawing left; headline "I build systems that are safe to run, inside the constraints they come with.", lede, `SpecTable` (Function, Tolerance, Regulation, Adaptation, Base, copy from the mockup) and two actions right ("Read the service records" to `#records`, "Resume PDF" to `/resume.pdf`); then `RecordsTable` with every record; then a short "Parts list" placeholder line saying notes arrive soon (notes are plan 2). Under 880px the grid stacks with the drawing first, and callout labels move into a numbered list under the drawing, because the in-drawing labels drop to about 9px on a phone.

- [ ] **Step 5: Run to see them pass**

Run: `pnpm build && pnpm test:dist`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: movement drawing and home page"
```

---

### Task 5: Work area and record pages, link check

**Files:**
- Create: `src/pages/work/[area]/index.astro`, `src/pages/work/[area]/[record].astro`, `src/components/AreaDetail.astro`
- Modify: `scripts/check-dist.test.ts`

**Interfaces:**
- Consumes: `AREAS`, `areaBySlug`, `recordRef` (Task 3); `Movement` with `focus` (Task 4).
- Produces: `/work/<area>/` renders the same two-column hero with `<Movement focus={area.slug} />` on the left and `<AreaDetail area />` on the right ("Full movement" link to `/`, ref, title, lede, numbered records, previous and next area links). `/work/<area>/<record>/` renders a service sheet: Constraint, Approach, Safeguard, Result as numbered steps (`01.01.1` to `01.01.4`), each with an `id` anchor, plus the repo link when `repo` is set.

- [ ] **Step 1: Write the failing dist tests**

```ts
test('every area and record has a built page', () => {
  for (const a of AREAS) {
    assert.ok(existsSync(`dist/work/${a.slug}/index.html`), a.slug);
    for (const r of a.records) assert.ok(existsSync(`dist/work/${a.slug}/${r.slug}/index.html`), `${a.slug}/${r.slug}`);
  }
});
test('every internal link resolves to a built file', () => {
  for (const file of htmlFilesUnder('dist')) {
    for (const href of internalHrefs(readFileSync(file, 'utf8'))) {
      assert.ok(resolvesInDist(href), `${file} -> ${href}`);
    }
  }
});
```

Helpers in the same file: `htmlFilesUnder(dir: string): string[]` (recursive), `internalHrefs(html: string): string[]` (hrefs starting with `/` and not `//`, hash and query stripped), `resolvesInDist(href: string): boolean` (true if `dist${href}` is a file, or `dist${href}/index.html` exists, or `dist${href}index.html` exists).

- [ ] **Step 2: Run to see them fail**

Run: `pnpm build && pnpm test:dist`
Expected: FAIL, missing `dist/work/integrations/index.html`

- [ ] **Step 3: Implement both pages** with `getStaticPaths` from `AREAS`.

- [ ] **Step 4: Run to see them pass**

Run: `pnpm build && pnpm test:dist`
Expected: PASS, including the link check across all pages.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: work area and service record pages with link check"
```

---

### Task 6: Zoom between home and work areas

**Files:**
- Create: `src/lib/zoom.ts`, `src/lib/zoom.test.ts`, `src/scripts/zoom-client.ts`
- Modify: `src/components/Movement.astro` (include the script)

**Interfaces:**
- Consumes: Movement markup from Task 4 (`#movement`, `.part[data-part]`, `data-focus`), area pages from Task 5.
- Produces:

```ts
export interface Box { x: number; y: number; width: number; height: number }
export const FULL_VIEWBOX: Box; // { x: 0, y: 0, width: 600, height: 600 }
export function viewBoxFor(bbox: Box, factor?: number): Box; // default factor 1.12
export function lerpBox(a: Box, b: Box, t: number): Box;
export function easeOutExpo(t: number): number;
export function shouldAnimate(reducedMotion: boolean, hasViewTransitions: boolean): boolean;
```

- [ ] **Step 1: Write the failing tests**

```ts
test('viewBoxFor returns a square centred on the part', () => {
  assert.deepEqual(viewBoxFor({ x: 100, y: 200, width: 200, height: 100 }), { x: 88, y: 138, width: 224, height: 224 });
});
test('easing starts at 0 and lands exactly on 1', () => {
  assert.equal(easeOutExpo(0), 0);
  assert.equal(easeOutExpo(1), 1);
});
test('lerpBox at t=0.5 is the midpoint', () => {
  assert.deepEqual(lerpBox({ x: 0, y: 0, width: 600, height: 600 }, { x: 100, y: 100, width: 200, height: 200 }, 0.5), { x: 50, y: 50, width: 400, height: 400 });
});
test('no animation under reduced motion or without view transitions', () => {
  assert.equal(shouldAnimate(true, true), false);
  assert.equal(shouldAnimate(false, false), false);
  assert.equal(shouldAnimate(false, true), true);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm test`
Expected: FAIL, cannot find module `./zoom`

- [ ] **Step 3: Implement `src/lib/zoom.ts`**, then run `pnpm test`; expected PASS.

- [ ] **Step 4: Implement `src/scripts/zoom-client.ts`**

On `astro:page-load`: read the area slug from `location.pathname` (`/work/<slug>/...`), find the part via `areaBySlug(slug).part`, compute `viewBoxFor(part.getBBox())` (or `FULL_VIEWBOX` on other pages), toggle `.focus` on parts and `zoomed` on the hero. If `shouldAnimate(matchMedia('(prefers-reduced-motion: reduce)').matches, 'startViewTransition' in document)` is true, animate the viewBox over 950 ms with `lerpBox` and `easeOutExpo` (cancel any running frame first); otherwise set it at once. Escape on a work page navigates to `/`. Under 880 px, after the zoom settles, scroll the area detail heading into view (the spec requires the section content to stay in view on mobile). Give the right column `transition:name="detail"` with a 450 ms fade. The CSS for `.zoomed` and `.focus` comes from the mockup: other parts and axes fade to 0.1 opacity, callouts hide, the focused part lifts 10px in the active colour, and the svg gets `overflow: hidden` while zoomed.

- [ ] **Step 5: Verify by hand**

Run: `pnpm build && pnpm preview`, then open `http://localhost:4321/`.
Expected: clicking 01 zooms in and the right column changes; at 390 px wide the area heading is in view after the zoom; previous and next move between areas; the browser back button zooms out; with OS reduced motion on, navigation is instant; with JavaScript disabled, `/work/integrations/` shows the focused part and full content.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: zoom into a part between home and work areas"
```

---

### Task 7: Resume, contact, now, 404

**Files:**
- Create: `src/pages/resume.astro`, `src/pages/contact.astro`, `src/pages/now.astro`, `src/pages/404.astro`
- Modify: `scripts/check-dist.test.ts`

**Interfaces:**
- Consumes: `public/resume.json` (JSON Resume shape, as typed in `scripts/json-to-markdown.ts`); `Sheet`.

- [ ] **Step 1: Write the failing dist tests**

```ts
test('resume, contact, now and 404 are built', () => {
  for (const p of ['resume/index.html', 'contact/index.html', 'now/index.html', '404.html', 'resume.pdf', 'sitemap-index.xml'])
    assert.ok(existsSync(`dist/${p}`), p);
});
test('the day job appears only on the resume', () => {
  for (const file of htmlFilesUnder('dist').filter(f => !f.startsWith('dist/resume/')))
    assert.doesNotMatch(readFileSync(file, 'utf8'), /atlassian|jira|confluence|servicerocket/i, file);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm build && pnpm test:dist`
Expected: FAIL on missing pages.

- [ ] **Step 3: Implement the pages**

Resume: read `public/resume.json` at build time and render it as a service sheet (Specification for basics, work, education, skills, certificates), with a Resume PDF action. Show certificates with their dates as they are; Diego decides which to keep. Contact: email `contact@diegobarrosaraya.com`, GitHub `https://github.com/DiegoBarrosA`, LinkedIn `https://linkedin.com/in/diegobarrosaraya`. Now: one short dated paragraph, marked `DRAFT`. 404: "No part with that number." plus links to `/` and `/work/integrations/`.

- [ ] **Step 4: Run to see them pass**

Run: `pnpm build && pnpm test:dist`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: resume, contact, now and 404 pages"
```

---

### Task 8: Finish review and ship

**Files:**
- Create: `DESIGN.md`, `.impeccable/design.json` (by the documenter), screenshots in `.impeccable/review/`

- [ ] **Step 1: One batched inspection round**

Capture `pnpm preview` at 1440 px and 390 px, light and lume, home and one work area, into `.impeccable/review/`. Fix what they show in one batch, and confirm with at most one more round.

- [ ] **Step 2: Run the design detector once**

Run: `~/.config/claude-code-personal/skills/impeccable/scripts/impeccable detect --json src/`
Expected: fix the mechanical findings; pass the rest to the reviewer.

- [ ] **Step 3: Finish review and documentation**

Spawn `impeccable-finish-reviewer` with the spec, the surface brief, the screenshots and the mockup as critique reference. Act on its disposition. Then spawn `impeccable-documenter` to write `DESIGN.md` and `.impeccable/design.json`.

- [ ] **Step 4: Copy review gate (stop and ask Diego)**

List every `DRAFT` marker (`grep -rn DRAFT src`) and the Adaptation spec line. Diego edits or approves them. Remove the markers after.

- [ ] **Step 5: Ship**

Run: `pnpm test && pnpm build && pnpm test:dist`
Expected: all pass.

```bash
git add -A && git commit -m "feat: finish review fixes and design documentation"
git push origin redesign/caliber:main
```

Then: `gh run watch` succeeds, and `https://diegobarrosaraya.com/work/integrations/` loads directly in a browser.

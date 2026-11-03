# Story and Visual Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site's content around one story (principles, four case studies, team and path sections), ship the 3D movement with six parts, and finish the G-Shock visual direction, keeping every live URL working.

**Architecture:** One typed story module (`src/data/story.ts`) replaces the technology-area data and drives every page. Principles get pages at `/how/<slug>/`, case studies at `/work/<slug>/`, old URLs become static redirects generated from one map. The movement's six parts map one-to-one to principles; the 3D view (three.js, lazy) and the SVG fallback both navigate to principle pages.

**Tech Stack:** Astro 7 static, TypeScript, three.js with `@types/three`, `node:test` via `tsx`, `@fontsource/michroma`, `@fontsource/barlow`, `dseg`, GitHub Pages via Actions.

**Spec:** the private design note "Homepage Story and Visual Revision - Design" (kept outside this repo; the controller passes its path to executors). Earlier constraints: `docs/superpowers/plans/2026-11-02-caliber-site-foundation.md` Global Constraints.

## Global Constraints

- Start from branch `spike/3d-movement` (holds the 3D movement and G-Shock spike). Work on a new branch `revision/story`. Never push; Diego pushes to `main`, which deploys immediately.
- No client names, no employer project names, no internal figures anywhere in the repo, tests or comments. "Atlassian", "Jira", "Confluence", "ServiceRocket" and "Forge" appear only on `/resume/`.
- Every page renders fully without JavaScript; under `prefers-reduced-motion: reduce` nothing animates.
- No em dashes in any copy.
- Copy approved by Diego, use verbatim:
  - Headline: "Hard constraints, high stakes, short deadlines. That's where I do my best work."
  - Lede: "Senior engineer. I build and ship production apps for enterprise clients, and the harnesses that let AI agents do real work safely."
  - At work: "8 apps I designed and built now run in production for an enterprise platform used by more than 30,000 people."
  - Team: "I mentor junior engineers through real cases, from first triage to root cause." and "I write the guides my teammates use to get productive faster: from the Linux terminal to automation to working with AI agents."
  - Team close (draft): "Hard deadlines go better when the whole team can move fast, so I spend real time making the people around me faster."
  - Path: "I started on a sales floor in 2022, moved into support engineering a year later, and was a senior engineer by 2025, finishing my engineering degree while working full time."
  - Resume bullet (resume page only): "Built 8 Forge apps that run in production for an enterprise Jira Cloud site with 30,000+ users."
  - Figure caption: "Fig. 1 · Generic movement".
- Principles (part, slug, sentence, proof):
  - plate, `security`, "Security is the base, not a layer.", `teams-calls-fetcher`
  - barrel, `way-back`, "Always leave a way back.", `nix-config`
  - train, `people`, "Make the people around me faster.", team section (no case study)
  - escape, `gates`, "Gates that fail closed.", `this-site`
  - balance, `verify`, "Verify before you trust.", `ardour-wayland`
  - fork, `agents`, "Let agents do real work, one checked step at a time.", `home-agent-platform` and `this-site`
- Case studies (slug, repo): `nix-config` (diegobarrosaraya/nix-config), `ardour-wayland` (diegobarrosaraya/ardour), `teams-calls-fetcher` (diegobarrosaraya/teams-calls-fetcher), `home-agent-platform` (diegobarrosaraya/nix-ai-tooling), `this-site` (diegobarrosaraya/diegobarrosaraya-homepage).
- Home agent platform copy: Diego runs Hermes (Nous Research's agent); he did not build it. Describe only what he built around it. Agent accounts are "per context", never named.
- Palette tokens and theme labels as committed in the spike (`src/styles/tokens.css` at `e951dc6`); toggle labels "LCD view" / "Dial view"; dark is the default.
- Fonts self-hosted only; DSEG digits only for the footer build date, not the commit id.
- 3D chunk at or under 160 KB gzipped; SVG renders first in the same box, no layout shift.
- The balance wheel stays smooth (no teeth).

## Review Focus

1. Old shared links (`/work/integrations/`, `/work/integrations/teams-calls-fetcher/`): load and forward to the right new page. Pinned in Task 2.
2. Direct visit to a principle or case page with no JS: full content, focused part shown. Pinned in Task 2 and Task 4.
3. A browser without WebGL2 or with reduced motion: SVG with six parts, links work. Pinned in Task 4.
4. Michroma headings at 390 px wide: no horizontal overflow on any page. Pinned in Task 5.
5. A private term slipping into built output: fails the build locally. Pinned in Task 6.

---

## File Structure

```
astro.config.ts                     (renamed from .mjs) redirects from LEGACY_REDIRECTS
src/data/story.ts                   principles, case studies, home copy (replaces work.ts)
src/data/story.test.ts
src/data/redirects.ts               LEGACY_REDIRECTS map
src/data/redirects.test.ts
src/lib/movement-math.ts            gear ratios and tick stepping (pure)
src/lib/movement-math.test.ts
src/lib/certificates.ts             activeCertificates()
src/lib/certificates.test.ts
src/components/PrincipleDetail.astro (replaces AreaDetail.astro)
src/components/CaseStudyList.astro
src/pages/how/[principle].astro
src/pages/work/[case].astro
src/pages/index.astro               rewritten
scripts/check-dist.test.ts          updated
scripts/check-private.test.ts       private-term scan (list in gitignored .private-terms)
public/licenses/                    OFL texts for Michroma and DSEG
```

Removed: `src/data/work.ts`, `src/data/work.test.ts`, `src/components/AreaDetail.astro`, `src/components/RecordsTable.astro`, `src/components/SpecTable.astro`, `src/pages/work/[area]/`.

---

### Task 1: Story data

**Files:**
- Create: `src/data/story.ts`, `src/data/story.test.ts`

**Interfaces:**
- Produces:

```ts
export type PartId = 'plate' | 'barrel' | 'train' | 'escape' | 'balance' | 'fork';
export type PrincipleSlug = 'security' | 'way-back' | 'people' | 'gates' | 'verify' | 'agents';
export type CaseSlug = 'nix-config' | 'ardour-wayland' | 'teams-calls-fetcher' | 'home-agent-platform' | 'this-site';
export interface CaseStudy {
  slug: CaseSlug; name: string; repo: string; summary: string;
  constraint: string; decision: string; safeguard: string; result: string; tradeoff: string;
}
export interface Principle { slug: PrincipleSlug; part: PartId; sentence: string; explain: string; proof: CaseSlug[] | 'team' }
export const HOME: { headline: string; lede: string; atWork: string; team: string[]; teamClose: string; path: string };
export const PRINCIPLES: readonly Principle[];   // order: security, way-back, people, gates, verify, agents
export const CASES: readonly CaseStudy[];         // order: nix-config, ardour-wayland, teams-calls-fetcher, home-agent-platform, this-site
export function principleBySlug(slug: string): Principle | undefined;
export function principleForPart(part: PartId): Principle;
export function caseBySlug(slug: string): CaseStudy | undefined;
```

- [ ] **Step 1: Write the failing tests** (`src/data/story.test.ts`)

```ts
test('six principles, one per part, in the agreed order', () => {
  assert.deepEqual(PRINCIPLES.map(p => p.slug), ['security', 'way-back', 'people', 'gates', 'verify', 'agents']);
  assert.equal(new Set(PRINCIPLES.map(p => p.part)).size, 6);
  assert.equal(principleForPart('fork').slug, 'agents');
});
test('every proof points at a real case study, and every case study is proof of something', () => {
  const used = new Set(PRINCIPLES.flatMap(p => p.proof === 'team' ? [] : p.proof));
  for (const c of CASES) assert.ok(used.has(c.slug), c.slug);
  for (const s of used) assert.ok(caseBySlug(s), s);
  assert.equal(principleBySlug('people')!.proof, 'team');
});
test('home copy is verbatim', () => {
  assert.equal(HOME.headline, "Hard constraints, high stakes, short deadlines. That's where I do my best work.");
  assert.equal(HOME.atWork, '8 apps I designed and built now run in production for an enterprise platform used by more than 30,000 people.');
  assert.equal(HOME.team.length, 2);
});
test('copy has no day-job words and no em dashes', () => {
  const text = JSON.stringify({ HOME, PRINCIPLES, CASES });
  assert.doesNotMatch(text, /atlassian|jira|confluence|servicerocket|forge/i);
  assert.doesNotMatch(text, /—/);
});
test('every case study tells the whole story', () => {
  for (const c of CASES) for (const k of ['summary', 'constraint', 'decision', 'safeguard', 'result', 'tradeoff'] as const)
    assert.ok(c[k].trim().length > 0, `${c.slug}.${k}`);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm test`
Expected: FAIL, cannot find module `./story`

- [ ] **Step 3: Write `src/data/story.ts`**

Home copy and principle sentences verbatim from Global Constraints. `explain` is one or two plain sentences per principle. Case studies: draft from each repo's public README (`gh api repos/diegobarrosaraya/<repo>/readme --jq .content | base64 -d`); for `home-agent-platform` also from the private notes the controller names. `tradeoff` states what is still open or what it cost, from those sources only. Mark the file `// DRAFT: Diego reviews`.

- [ ] **Step 4: Run to see them pass**

Run: `nix shell nixpkgs#pnpm -c pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/story.ts src/data/story.test.ts && git commit -m "feat: story data (principles, case studies, home copy)"
```

---

### Task 2: Pages, routing and redirects

**Files:**
- Create: `src/data/redirects.ts`, `src/data/redirects.test.ts`, `src/pages/how/[principle].astro`, `src/pages/work/[case].astro`, `src/components/PrincipleDetail.astro`
- Rename: `astro.config.mjs` to `astro.config.ts`
- Modify: `scripts/check-dist.test.ts`, `src/components/Header.astro`
- Delete: `src/pages/work/[area]/`, `src/components/AreaDetail.astro`, `src/data/work.ts`, `src/data/work.test.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `export const LEGACY_REDIRECTS: Record<string, string>` (keys and values are paths with trailing slash); pages `/how/<PrincipleSlug>/`, `/work/<CaseSlug>/`. `PrincipleDetail` props `{ principle: Principle }`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/redirects.test.ts
test('every legacy URL forwards to a page that exists in the new structure', () => {
  const targets = new Set(['/', ...PRINCIPLES.map(p => `/how/${p.slug}/`), ...CASES.map(c => `/work/${c.slug}/`)]);
  for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) assert.ok(targets.has(to), `${from} -> ${to}`);
});
test('the legacy map covers every old area and record', () => {
  assert.equal(LEGACY_REDIRECTS['/work/agents/'], '/how/agents/');
  assert.equal(LEGACY_REDIRECTS['/work/open-source/'], '/how/verify/');
  assert.equal(LEGACY_REDIRECTS['/work/infrastructure/'], '/how/way-back/');
  assert.equal(LEGACY_REDIRECTS['/work/integrations/teams-calls-fetcher/'], '/work/teams-calls-fetcher/');
  assert.equal(LEGACY_REDIRECTS['/work/agents/nix-ai-tooling/'], '/work/home-agent-platform/');
  assert.equal(LEGACY_REDIRECTS['/work/backend/pulsovivo/'], '/');
});
```

```ts
// scripts/check-dist.test.ts (replace the area/record tests)
test('every principle and case study has a built page', () => {
  for (const p of PRINCIPLES) assert.ok(existsSync(`dist/how/${p.slug}/index.html`), p.slug);
  for (const c of CASES) assert.ok(existsSync(`dist/work/${c.slug}/index.html`), c.slug);
});
test('old shared links still land somewhere', () => {
  for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
    const html = readFileSync(`dist${from}index.html`, 'utf8');
    assert.match(html, new RegExp(`url=${to.replace(/\//g, '\\/')}`), from);
  }
});
```

Full redirect map (from the spec): `/work/integrations/` and `/work/backend/` to `/`; `/work/agents/` to `/how/agents/`; `/work/open-source/` to `/how/verify/`; `/work/infrastructure/` to `/how/way-back/`; `/work/integrations/teams-calls-fetcher/` to `/work/teams-calls-fetcher/`; `/work/open-source/ardour-wayland/` to `/work/ardour-wayland/`; `/work/infrastructure/nix-config/` to `/work/nix-config/`; `/work/infrastructure/this-site/` to `/work/this-site/`; `/work/agents/nix-ai-tooling/` to `/work/home-agent-platform/`; `/work/integrations/github-readme-stats-worker/`, `/work/integrations/linkedin-resume-generator/`, `/work/backend/pulsovivo/`, `/work/backend/agranelos-bff/` to `/`.

- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm test && nix shell nixpkgs#pnpm -c pnpm build && nix shell nixpkgs#pnpm -c pnpm test:dist`
Expected: FAIL (missing module, missing pages)

- [ ] **Step 3: Implement**

`astro.config.ts` passes `redirects: LEGACY_REDIRECTS` (Astro emits meta-refresh pages for static builds). `/how/[principle].astro` renders the hero with `<Movement focus={principle.part} />` and `PrincipleDetail` (sentence as h1, explain, proof links or a link to `/#team` when proof is `'team'`, previous/next principle with wraparound). `/work/[case].astro` renders constraint, decision, safeguard, result, trade-off as plain sections plus the repo link. Header nav: Work (`/#work`), How I work (`/#how`), Resume (`/resume/`), Contact (`/contact/`); no Notes item until the notes plan ships.

- [ ] **Step 4: Run to see them pass**

Same command as Step 2. Expected: PASS, including the existing link check.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: principle and case study pages, legacy redirects"
```

---

### Task 3: Home page story

**Files:**
- Modify: `src/pages/index.astro`, `scripts/check-dist.test.ts`
- Create: `src/components/CaseStudyList.astro`
- Delete: `src/components/RecordsTable.astro`, `src/components/SpecTable.astro`

**Interfaces:**
- Consumes: `HOME`, `PRINCIPLES`, `CASES` (Task 1).
- Produces: home sections with ids `work` (case studies), `team`, `path`, `how`, `contact`.

- [ ] **Step 1: Write the failing test**

```ts
test('home tells the story in order', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const at = (s: string) => html.indexOf(s);
  const order = [HOME.headline, HOME.atWork, HOME.team[0], 'id="work"', HOME.path, 'id="how"', 'id="contact"'].map(at);
  assert.ok(order.every(i => i >= 0), 'missing section');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  for (const p of PRINCIPLES) assert.match(html, new RegExp(`href="/how/${p.slug}/"`));
  for (const c of CASES) assert.match(html, new RegExp(`href="/work/${c.slug}/"`));
});
```

(`HOME.headline` contains an apostrophe; compare against the HTML-escaped form if Astro escapes it.)

- [ ] **Step 2: Run to see it fail**

Run: `nix shell nixpkgs#pnpm -c pnpm build && nix shell nixpkgs#pnpm -c pnpm test:dist`
Expected: FAIL, missing section

- [ ] **Step 3: Rewrite the home page** in the order: hero (headline, lede, movement, actions "Read the case studies" to `#work` and "Resume PDF"), at work, working with teams (`id="team"`, two lines plus close), case studies (`id="work"`, `CaseStudyList`, four main ones, This site as a short item), path (`id="path"`), how I work (`id="how"`, six principles, one sentence each, linked), contact (`id="contact"`). No section numbers, no uppercase tracked labels.

- [ ] **Step 4: Run to see it pass**

Same command. Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: home page tells the story"
```

---

### Task 4: Movement with six parts

**Files:**
- Create: `src/lib/movement-math.ts`, `src/lib/movement-math.test.ts`
- Modify: `src/scripts/movement-3d.ts`, `src/components/Movement.astro`, `src/scripts/zoom-client.ts`, `scripts/check-dist.test.ts`, `package.json` (add `@types/three`)

**Interfaces:**
- Consumes: `PRINCIPLES`, `principleForPart`, `principleBySlug`, `PartId` (Task 1).
- Produces:

```ts
export const TEETH: { barrel: 72; cPin: 10; center: 80; tPin: 8; third: 75; fPin: 8; fourth: 80; ePin: 7; escape: 15 };
export function trainRatios(): { escape: 1; fourth: number; third: number; center: number; barrel: number };
export function escapeAngle(t: number): number; // t in balance periods; half a tooth per half swing, snap then lock
```

`Movement` prop `focus?: PartId`. Callouts link to `/how/<slug>/`. The fork is its own part in both views (in the 3D spike it is grouped with the escape wheel; give it site `'fork'`).

- [ ] **Step 1: Write the failing tests**

```ts
test('every wheel turns by its tooth ratio, alternating direction', () => {
  const r = trainRatios();
  assert.equal(r.fourth, -7 / 80);
  assert.equal(r.third, r.fourth * -(8 / 75));
  assert.ok(Math.sign(r.fourth) !== Math.sign(r.third) && Math.sign(r.third) !== Math.sign(r.center));
});
test('the escape wheel advances half a tooth per half swing and holds between ticks', () => {
  const half = (2 * Math.PI) / 15 / 2;
  assert.ok(Math.abs(escapeAngle(0.5) - -half) < 1e-9);
  assert.equal(escapeAngle(0.6), escapeAngle(0.95));
});
```

```ts
// scripts/check-dist.test.ts
test('the drawing links all six principles and work pages arrive focused', () => {
  const home = readFileSync('dist/index.html', 'utf8');
  for (const p of PRINCIPLES) assert.match(home, new RegExp(`class="callout[^"]*"[^>]*href="/how/${p.slug}/"|href="/how/${p.slug}/"[^>]*class="callout`));
  for (const p of PRINCIPLES) assert.match(readFileSync(`dist/how/${p.slug}/index.html`, 'utf8'), new RegExp(`data-focus="${p.part}"`));
  assert.match(home, /Fig\. 1 · Generic movement/);
});
test('the 3D chunk stays within budget', () => {
  const chunk = readdirSync('dist/_astro').find(f => /^movement-3d.*\.js$/.test(f))!;
  assert.ok(gzipSync(readFileSync(`dist/_astro/${chunk}`)).length <= 160 * 1024);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm test && nix shell nixpkgs#pnpm -c pnpm build && nix shell nixpkgs#pnpm -c pnpm test:dist`
Expected: FAIL

- [ ] **Step 3: Implement**

Move the ratio and tick logic out of `movement-3d.ts` into `movement-math.ts` and import it. Remove `@ts-nocheck` and type the module with `@types/three`. Add the pallet fork to the SVG fallback (a simple anchor shape between escape wheel and balance, its own group, callout "Let agents do real work, one checked step at a time" shortened to the principle's label: use `principle.sentence`). Both views read the focused part from `/how/<slug>/` via `principleBySlug`. Caption text from Global Constraints. Fix the "04" label collision with the text column (keep labels inside the drawing column).

- [ ] **Step 4: Run to see them pass**

Same command. Expected: PASS

- [ ] **Step 5: Verify by hand with headless captures**

Run `pnpm preview --port 4420` and capture `/` and `/how/agents/` at 1440x900 and 390x844 with `nix run nixpkgs#chromium -- --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars --virtual-time-budget=6000 --window-size=W,H --screenshot=<path> <url>`, plus `/` with `--disable-gpu --disable-webgl` (SVG fallback shows six parts).
Expected: six labelled parts, fork focused on `/how/agents/`, no label touching the text column.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: six-part movement linked to principles"
```

---

### Task 5: Finish the visual direction

**Files:**
- Modify: `src/pages/resume.astro`, `src/pages/contact.astro`, `src/pages/now.astro`, `src/pages/404.astro`, `src/components/Footer.astro`, `src/styles/global.css`, `scripts/check-dist.test.ts`
- Create: `public/licenses/Michroma-OFL.txt`, `public/licenses/DSEG-OFL.txt`

- [ ] **Step 1: Write the failing tests**

```ts
test('no numbered headings anywhere', () => {
  for (const f of htmlFilesUnder('dist')) assert.doesNotMatch(readFileSync(f, 'utf8'), /<h[12][^>]*>\s*(<span[^>]*>)?\s*\d{2}\b/, f);
});
test('font licences ship with the site', () => {
  assert.ok(existsSync('dist/licenses/Michroma-OFL.txt') && existsSync('dist/licenses/DSEG-OFL.txt'));
});
```

- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm build && nix shell nixpkgs#pnpm -c pnpm test:dist`
Expected: FAIL on resume, contact, now or 404 headings

- [ ] **Step 3: Implement** Remove the "01" heading numbers and uppercase labels on resume, contact, now and 404. Footer: DSEG only on the date, commit id in the body font, and a "Font licences" link to `/licenses/`. Spec and table labels one weight lighter. Copy the OFL texts from the installed packages.

- [ ] **Step 4: Run to see them pass**, then capture `/`, `/resume/`, `/work/home-agent-platform/` at 390x844 in both views and confirm no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`, checked by eye in the captures).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: finish the G-Shock direction across pages"
```

---

### Task 6: Resume update and leak gates

**Files:**
- Create: `src/lib/certificates.ts`, `src/lib/certificates.test.ts`, `scripts/check-private.test.ts`
- Modify: `src/pages/resume.astro`, `scripts/check-dist.test.ts`, `.gitignore`, `package.json` (add `check-private.test.ts` to `test:dist`)

**Interfaces:**
- Produces: `activeCertificates<T extends { expires?: string }>(certs: T[], today: string): T[]` (dates `YYYY-MM` or `YYYY-MM-DD`; a certificate is active when it has no `expires` or `expires` is not before `today`'s month).

- [ ] **Step 1: Write the failing tests**

```ts
test('expired certificates drop out, undated ones stay', () => {
  const certs = [{ name: 'a', expires: '2026-01' }, { name: 'b', expires: '2026-12' }, { name: 'c' }];
  assert.deepEqual(activeCertificates(certs, '2026-11-03').map(c => c.name), ['b', 'c']);
});
```

```ts
// scripts/check-dist.test.ts: extend the day-job test
test('the day job, including Forge, appears only on the resume', () => {
  for (const f of htmlFilesUnder('dist').filter(f => !f.startsWith('dist/resume/')))
    assert.doesNotMatch(readFileSync(f, 'utf8'), /atlassian|jira|confluence|servicerocket|forge/i, f);
  assert.match(readFileSync('dist/resume/index.html', 'utf8'), /Built 8 Forge apps that run in production for an enterprise Jira Cloud site with 30,000\+ users\./);
});
```

```ts
// scripts/check-private.test.ts
test('no private term appears in the built site', (t) => {
  if (!existsSync('.private-terms')) return t.skip('no local .private-terms list');
  const terms = readFileSync('.private-terms', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  for (const f of filesUnder('dist')) { const body = readFileSync(f, 'utf8').toLowerCase(); for (const term of terms) assert.ok(!body.includes(term.toLowerCase()), `${f} contains a private term`); }
});
```

- [ ] **Step 2: Run to see them fail**

Run: `nix shell nixpkgs#pnpm -c pnpm test && nix shell nixpkgs#pnpm -c pnpm build && nix shell nixpkgs#pnpm -c pnpm test:dist`
Expected: FAIL (missing module, missing resume bullet)

- [ ] **Step 3: Implement** Resume renders `activeCertificates(r.certificates, build date)` and the resume bullet under the current role. Add `.private-terms` to `.gitignore`. The failure message never prints the term itself.

- [ ] **Step 4: Run to see them pass**

Same command. Expected: PASS. Then the controller creates `.private-terms` locally from the private design note and re-runs `test:dist`; expected PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: resume bullet, active certificates, private-term gate"
```

---

### Task 7: Finish review and handoff

- [ ] **Step 1:** One batched inspection round: `/`, `/how/agents/`, `/work/home-agent-platform/`, `/resume/` at 1440 and 390 in Dial and LCD views, into `.impeccable/review/`. Fix what they show in one batch; at most one more round.
- [ ] **Step 2:** Run `impeccable detect --json src/` once; fix the mechanical findings.
- [ ] **Step 3:** Fresh finish review against the spec's visual direction and the spike screenshots; act on its disposition. Then update `DESIGN.md` (palette, type, six parts, no numbering).
- [ ] **Step 4: Copy gate (stop and ask Diego):** list every `DRAFT` marker and the case-study trade-offs; Diego edits or approves.
- [ ] **Step 5:** `pnpm test && pnpm build && pnpm test:dist` pass; Diego reviews the local preview and pushes `revision/story` to `main` himself; then check the live URLs, including two legacy links.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CASES, HOME, PRINCIPLES } from '../src/data/story';
import { LEGACY_REDIRECTS } from '../src/data/redirects';

test('home page is built HTML, not the Vite source', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('/src/main.tsx'));
  assert.match(html, /<title>[^<]+<\/title>/);
});

test('custom domain survives the build', () => {
  assert.equal(readFileSync('dist/CNAME', 'utf8').trim(), 'diegobarrosaraya.com');
});

test('the drawing links all six principles and work pages arrive focused', () => {
  const home = readFileSync('dist/index.html', 'utf8');
  for (const p of PRINCIPLES) assert.match(home, new RegExp(`class="callout[^"]*"[^>]*href="/how/${p.slug}/"|href="/how/${p.slug}/"[^>]*class="callout`), p.slug);
  for (const p of PRINCIPLES) assert.match(readFileSync(`dist/how/${p.slug}/index.html`, 'utf8'), new RegExp(`data-focus="${p.part}"`), p.slug);
  assert.match(home, /Fig\. 1 · Generic movement/);
});
test('the 3D chunk stays within budget', () => {
  const chunk = readdirSync('dist/_astro').find(f => /^movement-3d.*\.js$/.test(f))!;
  assert.ok(gzipSync(readFileSync(`dist/_astro/${chunk}`)).length <= 160 * 1024);
});
test('home has the resume action without JavaScript', () => {
  assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/resume\.pdf"/);
});
test('home tells the story in order', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  // Astro escapes an apostrophe in an expression, not in literal markup.
  const at = (s: string) => Math.max(html.indexOf(s), html.indexOf(s.replace(/'/g, '&#39;')));
  const order = [HOME.headline, HOME.atWork, HOME.team[0], 'id="work"', HOME.path, 'id="how"', 'id="contact"'].map(at);
  assert.ok(order.every(i => i >= 0), 'missing section');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  for (const p of PRINCIPLES) assert.match(html, new RegExp(`href="/how/${p.slug}/"`));
  for (const c of CASES) assert.match(html, new RegExp(`href="/work/${c.slug}/"`));
});


const htmlFilesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) return htmlFilesUnder(path);
    return path.endsWith('.html') ? [path] : [];
  });
const internalHrefs = (html: string): string[] =>
  [...html.matchAll(/\shref="(\/(?!\/)[^"]*)"/g)].map((m) => m[1].split(/[#?]/)[0]);
const resolvesInDist = (href: string): boolean =>
  (existsSync(`dist${href}`) && statSync(`dist${href}`).isFile()) ||
  existsSync(`dist${href}/index.html`) || existsSync(`dist${href}index.html`);

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
test('every internal link resolves to a built file', () => {
  for (const file of htmlFilesUnder('dist')) {
    for (const href of internalHrefs(readFileSync(file, 'utf8'))) {
      assert.ok(resolvesInDist(href), `${file} -> ${href}`);
    }
  }
});

const movementViewBox = (html: string) => html.match(/<svg[^>]*id="movement"[^>]*viewBox="([^"]+)"|<svg[^>]*viewBox="([^"]+)"[^>]*id="movement"/)?.slice(1).find(Boolean);
test('home shows the full movement, principle pages are already zoomed without JavaScript', () => {
  assert.equal(movementViewBox(readFileSync('dist/index.html', 'utf8')), '0 0 600 600');
  for (const p of PRINCIPLES) {
    const html = readFileSync(`dist/how/${p.slug}/index.html`, 'utf8');
    const vb = movementViewBox(html)!.split(' ').map(Number);
    assert.ok(vb[2] < 600 && vb[2] === vb[3], `${p.slug} viewBox ${vb}`);
    assert.match(html, new RegExp(`class="part focus[^"]*" data-part="${p.part}"`));
    assert.match(html, new RegExp(`data-focus="${p.part}"`));
  }
});

test('resume, contact, now and 404 are built', () => {
  for (const p of ['resume/index.html', 'contact/index.html', 'now/index.html', '404.html', 'resume.pdf', 'sitemap-index.xml'])
    assert.ok(existsSync(`dist/${p}`), p);
});
test('the day job, including Forge, appears only on the resume', () => {
  for (const f of htmlFilesUnder('dist').filter(f => !f.startsWith('dist/resume/')))
    assert.doesNotMatch(readFileSync(f, 'utf8'), /atlassian|jira|confluence|servicerocket|forge/i, f);
  assert.match(readFileSync('dist/resume/index.html', 'utf8'), /Built 8 Forge apps that run in production for an enterprise Jira Cloud site with 30,000\+ users\./);
});
test('every page has one h1, before any h2', () => {
  for (const file of htmlFilesUnder('dist')) {
    const html = readFileSync(file, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue; // Astro's redirect stubs have no headings
    assert.equal(html.match(/<h1[\s>]/g)?.length, 1, file);
    const h2 = html.search(/<h2[\s>]/);
    assert.ok(h2 === -1 || html.search(/<h1[\s>]/) < h2, file);
  }
});

test('no numbered headings anywhere', () => {
  for (const f of htmlFilesUnder('dist')) assert.doesNotMatch(readFileSync(f, 'utf8'), /<h[12][^>]*>\s*(<span[^>]*>)?\s*\d+\b/, f);
});
test('font licences ship with the site', () => {
  assert.ok(existsSync('dist/licenses/Archivo-OFL.txt') && existsSync('dist/licenses/DSEG-OFL.txt'));
});

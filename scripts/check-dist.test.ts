import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { CASES, PRINCIPLES } from '../src/data/story';
import { LEGACY_REDIRECTS } from '../src/data/redirects';

// Parts the SVG drawing has today. Task 4 adds the pallet fork as the sixth.
const DRAWN = PRINCIPLES.filter((p) => p.part !== 'fork');

test('home page is built HTML, not the Vite source', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('/src/main.tsx'));
  assert.match(html, /<title>[^<]+<\/title>/);
});

test('custom domain survives the build', () => {
  assert.equal(readFileSync('dist/CNAME', 'utf8').trim(), 'diegobarrosaraya.com');
});

test('home links every drawn part to its principle page', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  for (const { slug } of DRAWN)
    assert.match(html, new RegExp(`class="callout[^"]*"[^>]*href="/how/${slug}/"|href="/how/${slug}/"[^>]*class="callout[^"]*"`), slug);
});
test('home has the resume action without JavaScript', () => {
  assert.match(readFileSync('dist/index.html', 'utf8'), /href="\/resume\.pdf"/);
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
  for (const p of DRAWN) {
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
test('the day job appears only on the resume', () => {
  for (const file of htmlFilesUnder('dist').filter(f => !f.startsWith('dist/resume/')))
    assert.doesNotMatch(readFileSync(file, 'utf8'), /atlassian|jira|confluence|servicerocket/i, file);
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

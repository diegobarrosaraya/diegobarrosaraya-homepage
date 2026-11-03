// Prints dist/resume/ to dist/resume.pdf (A4) and writes dist/resume.pdf.json with a hash of public/resume.json.
// Run after `astro build`. Needs Playwright's Chromium:
//   CI (ubuntu-latest): `pnpm exec playwright install --with-deps chromium`
//   NixOS: the flake dev shell (`nix develop`) exports PLAYWRIGHT_BROWSERS_PATH and PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS, so `pnpm build` works there.
//   (keep the nixpkgs playwright-driver version equal to the playwright npm version.)
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const types: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  let p = join('dist', decodeURIComponent(new URL(req.url!, 'http://x').pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
}).listen(0);
const port = (server.address() as { port: number }).port;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => localStorage.setItem('dba-theme', 'light'));
  await page.goto(`http://localhost:${port}/resume/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: 'dist/resume.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
} finally {
  await browser.close();
  server.close();
}
const hash = createHash('sha256').update(readFileSync('public/resume.json')).digest('hex');
writeFileSync('dist/resume.pdf.json', JSON.stringify({ source: 'public/resume.json', sha256: hash }));

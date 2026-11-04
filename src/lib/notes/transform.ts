import type { Problem } from './types';

export interface TransformContext {
  title: string; slug: string;
  published: ReadonlyMap<string, string>;  // lowercased note title or file basename -> slug
}

const PLUGIN_LANGS = new Set(['dataview', 'dataviewjs', 'query', 'tasks']);
const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i;
// Optional blockquote/callout prefix, any indent (fences nest under list items), then 3+ backticks or tildes.
const FENCE = /^((?:\s*>)*)\s*(`{3,}|~{3,})(.*)$/;
const CODE_SPAN = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g;
const WIKI = /(!?)\[\[([^[\]]+?)\]\]/g;
const MD_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

const baseName = (p: string) => p.slice(p.lastIndexOf('/') + 1);

type Fence = { char: string; len: number } | undefined;

// Moves the fence state past one line. `code` is true for fence lines and lines inside a fence;
// `info` is the info string when the line opens a fence.
function stepFence(fence: Fence, line: string): { fence: Fence; code: boolean; info?: string } {
  const f = FENCE.exec(line);
  if (fence) {
    const closes = f && f[2][0] === fence.char && f[2].length >= fence.len && !f[3].trim();
    return { fence: closes ? undefined : fence, code: true };
  }
  if (f && !(f[2][0] === '`' && f[3].includes('`'))) {
    return { fence: { char: f[2][0], len: f[2].length }, code: true, info: f[3] };
  }
  return { fence: undefined, code: false };
}

// Blanks fenced blocks and inline code spans, keeping the line count, so later scans see prose only.
export function maskCode(markdown: string): string {
  let fence: Fence;
  return markdown.replace(/\r\n?/g, '\n').split('\n').map((line) => {
    const step = stepFence(fence, line);
    fence = step.fence;
    return step.code ? '' : line.replace(CODE_SPAN, (m) => ' '.repeat(m.length));
  }).join('\n');
}

export function transformBody(body: string, ctx: TransformContext):
  { markdown: string; images: string[]; problems: Problem[] } {
  const images: string[] = [];
  const problems: Problem[] = [];
  const problem = (rule: Problem['rule'], line: number) => problems.push({ rule, where: ctx.title, line });
  const image = (name: string, alt: string) => {
    if (!images.includes(name)) images.push(name);
    return `![${alt}](/notes/${ctx.slug}/${encodeURI(baseName(name))})`;
  };

  // Rewrites links and embeds in text known to be outside any code.
  const rewrite = (text: string, line: number) => text
    .replace(MD_IMAGE, (all, alt: string, url: string) => {
      if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) return all;
      let name = url;
      try { name = decodeURI(url); } catch { /* a stray % stays as written */ }
      if (IMAGE_EXT.test(name)) return image(name, alt);
      problem('embed', line);
      return all;
    })
    .replace(WIKI, (all, bang: string, inner: string) => {
      const [target, alias] = inner.split(/\\?\|/, 2).map(s => s.trim());
      if (bang) {
        if (IMAGE_EXT.test(target)) return image(target, baseName(target));
        problem('embed', line);
        return all;
      }
      const note = baseName(target.split('#')[0]).replace(/\.md$/i, '');
      const text = alias || note || target.replace(/^#/, '');
      const slug = ctx.published.get(note.toLowerCase());
      return slug ? `[${text}](/notes/${slug}/)` : text;
    });

  // Splits on inline code spans so only the text between them is rewritten.
  // shortcut: code spans that wrap across lines are not seen, upgrade to a markdown parser if real notes need it.
  const rewriteLine = (line: string, n: number) => {
    let out = '', last = 0;
    for (const m of line.matchAll(CODE_SPAN)) {
      out += rewrite(line.slice(last, m.index), n) + m[0];
      last = m.index + m[0].length;
    }
    return out + rewrite(line.slice(last), n);
  };

  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let fence: Fence;
  let seenText = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    const step = stepFence(fence, line);
    fence = step.fence;
    if (step.code) {
      if (step.info !== undefined) {
        if (PLUGIN_LANGS.has(step.info.trim().split(/\s/)[0].toLowerCase())) problem('plugin-block', n);
        seenText = true;
      }
      out.push(line);
      return;
    }
    // Indented code may hold bash brackets; fail closed instead of guessing.
    if (/^( {4}|\t)/.test(line) && line.includes('[[')) {
      problem('indented-code', n);
      seenText = true;
      out.push(line);
      return;
    }
    const h1 = /^ {0,3}#(?:[ \t]+(.*?))?[ \t#]*$/.exec(line);
    if (h1) {
      const isTitle = (h1[1] ?? '').trim().toLowerCase() === ctx.title.trim().toLowerCase();
      if (!seenText && isTitle) { seenText = true; return; }
      problem('extra-h1', n);
    }
    if (line.trim()) seenText = true;
    out.push(rewriteLine(line, n));
  });
  return { markdown: out.join('\n'), images, problems };
}

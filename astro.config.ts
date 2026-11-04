import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeMermaid from 'rehype-mermaid';
import { LEGACY_REDIRECTS } from './src/data/redirects';
import { rehypeCallouts } from './src/lib/notes/rehype-callouts';
import { rehypeDiagramFrame } from './src/lib/notes/rehype-diagram-frame';

// Code blocks read the theme tokens: Shiki writes the placeholder colours, colorReplacements swaps
// them for CSS variables, so the Dial and LCD views restyle code with no second theme.
const codeTheme = {
  name: 'sheet',
  type: 'dark',
  colors: { 'editor.background': '#000001', 'editor.foreground': '#000002' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#000003', fontStyle: 'italic' } },
    { scope: ['string', 'constant', 'markup.inline.raw'], settings: { foreground: '#000003' } },
    { scope: ['keyword', 'storage', 'entity.name.function', 'support.function'], settings: { foreground: '#000002', fontStyle: 'bold' } },
  ],
  colorReplacements: { '#000001': 'var(--plate)', '#000002': 'var(--ink)', '#000003': 'var(--ink-2)' },
};

export default defineConfig({
  site: 'https://diegobarrosaraya.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects: LEGACY_REDIRECTS,
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
    shikiConfig: { theme: codeTheme },
    // The unified processor runs rehype plugins (the default Sätteri processor does not).
    processor: unified({ rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }], rehypeDiagramFrame, rehypeCallouts] }),
  },
});

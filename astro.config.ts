import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { LEGACY_REDIRECTS } from './src/data/redirects';

export default defineConfig({
  site: 'https://diegobarrosaraya.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects: LEGACY_REDIRECTS,
  integrations: [sitemap()],
});

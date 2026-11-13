import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: keep in sync with canonicalUrl in src/config/studio.ts
const SITE_URL = 'https://persianbearstudio.com';

// https://astro.build/config
export default defineConfig({
  // Fully static build: served by the Worker via the Assets binding (see wrangler.toml).
  // Explicit so no tooling can switch the project to SSR (which needs an adapter).
  output: 'static',
  site: SITE_URL,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});

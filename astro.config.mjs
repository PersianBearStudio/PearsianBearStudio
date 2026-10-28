import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { studioConfig } from './src/config/studio';

// https://astro.build/config
export default defineConfig({
  // Fully static build: served by the Worker via the Assets binding (see wrangler.toml).
  // Explicit so no tooling can switch the project to SSR (which needs an adapter).
  output: 'static',
  site: studioConfig.canonicalUrl,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});

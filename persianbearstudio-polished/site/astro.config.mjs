import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { studioConfig } from './src/config/studio';

// https://astro.build/config
export default defineConfig({
  site: studioConfig.canonicalUrl,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});

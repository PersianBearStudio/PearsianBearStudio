// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// PersianBearStudio — Astro on Cloudflare Pages.
// - Pages are prerendered to static HTML (fast, cheap).
// - /api/inquiry runs as a Cloudflare Pages Function (SSR) via the adapter.
// - In `astro dev` the adapter proxies the Cloudflare runtime
//   (locals.runtime.env is populated from .dev.vars — never commit real
//   secrets; wrangler.toml + .dev.vars are the standard config files).
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  build: {
    inlineStylesheets: 'auto',
  },
});

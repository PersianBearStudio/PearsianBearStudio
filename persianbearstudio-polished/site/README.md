# PersianBearStudio

Independent web development studio website — Astro + TypeScript, custom CSS,
self-hosted fonts, deployed as a **Cloudflare Worker** that serves the static
build through Workers Assets and applies a strict security header policy.

## Requirements

- **Node.js**: `18.20.8` / `^20.3.0` / `>=22.0.0` (declared in
  `package.json` `engines` and pinned via `.node-version`).
  - Astro 5.x supports this range; Cloudflare Pages / Workers Build defaults
    to a Node 20.x runtime that satisfies it, so **no extra environment
    variable configuration is required** to deploy.
  - Do not upgrade to Astro 6.x or 7.x unless you also set
    `NODE_VERSION=22` in the Cloudflare build environment (those versions
    require Node 22.12+).

## Quick start (local development)

```bash
npm install        # install dependencies
npm run dev         # Astro dev server at http://localhost:4321 (HMR)
```

To develop with the actual Cloudflare Worker runtime (miniflare):

```bash
npm run dev:worker  # builds the site, then runs wrangler dev at http://localhost:8787
```

## Build & verify

```bash
npm run build       # Astro production build → dist/
npm run preview     # preview the built site locally (Astro preview)
npm run typecheck   # strict TypeScript check (no emit, includes worker.ts)
npm run test:smoke  # build smoke test: section ids, anchor links, SEO, assets, worker.ts
npm run verify      # full pipeline: typecheck → build → smoke → audit
npm run audit       # npm audit for production deps only
```

`npm run verify` is the one-step pre-deploy check. Run it before every
release — it must finish with no errors and no vulnerabilities.

## Deploy to Cloudflare Workers

This project is set up to deploy as a Cloudflare Worker that serves the
static `dist/` directory through the Workers Assets binding (`env.ASSETS`)
and applies security headers (CSP, HSTS, X-Content-Type-Options, etc.) on
every response. No `_headers` file needed — the Worker itself enforces the
policy.

### Prerequisites

1. A Cloudflare account (free tier is fine).
2. `wrangler` is already a devDependency — `npx wrangler` works after
   `npm install`. To deploy, you need to authenticate once:
   ```bash
   npx wrangler login
   ```
   This opens a browser to authorize wrangler with your Cloudflare account.

### First deploy (preview on `workers.dev`)

```bash
npm run deploy
```

This runs `npm run build` then `wrangler deploy`. After deploy, wrangler
prints a URL like `https://persianbearstudio.<your-subdomain>.workers.dev`.
Open it to verify the live site.

### Production deploy (custom domain)

1. Add the domain to your Cloudflare account (DNS only — the Worker handles
   the routing, no proxy needed).
2. Edit `wrangler.toml` — uncomment the `routes` block at the bottom and
   replace `persianbearstudio.com` with your real domain:
   ```toml
   routes = [
     { pattern = "persianbearstudio.com/*", custom_domain = true }
   ]
   ```
3. Update the canonical URL in `src/config/studio.ts` to the production
   domain (`canonicalUrl`).
4. Update `public/robots.txt` — set the sitemap URL to
   `https://<your-domain>/sitemap-index.xml`.
5. Run `npm run deploy`.

### Staging environment (optional)

`wrangler.toml` includes a commented-out `[env.staging]` block. Uncomment
it to deploy a separate staging Worker (different name, different domain)
with:

```bash
npx wrangler deploy --env staging
```

### Dry-run (validate without publishing)

```bash
npm run deploy:dry   # bundles the Worker and validates config, no upload
```

Useful for catching config errors in CI before merging.

## Configuration

All brand content, contact links, and decorative flags live in
**`src/config/studio.ts`**. Edit that single file to:

- update taglines, studio copy, philosophy, capabilities, or approach stages
- enable contact channels (email, GitHub, Telegram, LinkedIn, Twitter, …)
- flip decorative / motion toggles (cursor accent, magnetic CTA, scroll
  progress, hero grid, hero parallax)
- update the canonical production URL

Unconfigured contact methods are automatically **omitted** from the production
build (no fake email addresses, no dead links). The contact section shows a
graceful "Contact channels will appear here once configured." placeholder
until real channels are set.

## Architecture

```
Request → Cloudflare edge → Worker (src/worker.ts)
                                   │
                                   ├─ env.ASSETS.fetch(request)
                                   │   (serves files from dist/ via Workers Assets)
                                   │
                                   └─ Add security headers to the response
                                       (CSP, HSTS, X-Content-Type-Options, …)
                                       │
                                       └─ Return to client
```

The Worker is intentionally tiny — it delegates all file serving to the
Workers Assets binding (configured in `wrangler.toml` with
`not_found_handling = "single-page-application"` for unmatched paths) and
only wraps the response with security headers. No backend, no database,
no SSR.

## Project structure

```
src/
├── config/studio.ts        # ← single source of truth for brand + contact
├── components/              # Header, Hero, Studio, Philosophy, Capabilities,
│                            # Approach, Contact, Footer, Bear, SocialIcon
├── layouts/Layout.astro    # SEO meta, OG/Twitter, canonical, early flags
├── pages/index.astro       # single-page composition
├── scripts/motion.ts       # reveal, magnetic CTA, scroll progress, parallax
├── styles/                  # tokens.css, global.css, motion.css
└── worker.ts                # Cloudflare Worker entry point (assets + headers)

public/
├── favicon.svg             # geometric bear emblem
├── og-image.png            # 1200×630 PNG (preferred by social scrapers)
├── og-image.svg            # SVG source for the OG image
└── robots.txt

wrangler.toml               # Cloudflare Workers config (assets, routes)
scripts/smoke-test.mjs      # post-build smoke test
astro.config.mjs            # sitemap integration, prefetch
tsconfig.json               # strict TypeScript (includes worker.ts)
```

## Security headers (applied by the Worker)

Every response from the Worker includes:

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `default-src 'none'; script-src 'self' 'unsafe-inline'; …` | Block all third-party loads. `'unsafe-inline'` is required because Astro inlines a tiny first-party early-flags script and scoped `<style>` tags. A future pass can replace this with SHA-256 hashes. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS for one year |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Only send the origin to other sites |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolate browsing context |
| `Cross-Origin-Embedder-Policy` | `same-origin` | Require cross-origin opt-in |
| `Cross-Origin-Resource-Policy` | `same-origin` | Block cross-origin reads of our resources |
| `X-Permitted-Cross-Domain-Policies` | `none` | Block Adobe Flash / PDF plugins |
| `Upgrade-Insecure-Requests` | `1` | Auto-upgrade HTTP to HTTPS |

To verify they're applied after deploy:

```bash
curl -I https://persianbearstudio.<your-subdomain>.workers.dev/
```

You should see all of the above in the response headers.

## Accessibility & performance

- Semantic HTML, correct h1 → h2 → h3 hierarchy, single h1 per page
- Skip link, visible focus rings, keyboard-navigable menu with a real focus
  trap (Tab / Shift-Tab cycle within the menu, ESC closes, focus returns)
- `prefers-reduced-motion: reduce` disables or simplifies every animation
- Magnetic CTA, cursor accent, and parallax are gated to `(pointer: fine)`
  devices and skipped on touch-first devices
- The page is fully functional with JavaScript disabled (all content is in
  the server-rendered HTML; reveal animations are CSS-only with a no-JS
  fallback that shows everything)
- No third-party scripts, no analytics, no fonts loaded from a CDN
- Lighthouse-friendly: ~48 KB CSS, ~4 KB JS, ~36 KB HTML, ~36 KB OG PNG

## Future Persian (Farsi) localization

The site is currently English-only. To add Persian later:

1. Create a `src/config/translations.ts` with the same keys as `studio.ts`.
2. Use logical CSS properties throughout the styles (already done —
   `inset-inline`, `padding-inline`, `margin-block`, etc.).
3. Flip the document: `<html lang="fa" dir="rtl">`.
4. No layout rewrites should be required.

## License

UNLICENSED — proprietary. All rights reserved.

## Persian font (recommended)

The Persian UI currently falls back to the system Persian font. For the best
result, self-host **Vazirmatn** (CSP only allows `font-src 'self'`):

```bash
npm install @fontsource-variable/vazirmatn
```

then add `import '@fontsource-variable/vazirmatn';` next to the Manrope import in
`src/layouts/Layout.astro` and change `'Vazirmatn'` to `'Vazirmatn Variable'` in
`--font-fa` (`src/styles/tokens.css`).

/**
 * PersianBearStudio — Cloudflare Worker entry point
 * ----------------------------------------------------
 * Serves the static Astro build (dist/) through the Workers Assets binding
 * and applies a strict security header policy to every response.
 *
 * Why a Worker (instead of static Pages hosting)?
 *   1. Security headers are guaranteed regardless of host (works on the
 *      workers.dev subdomain AND any custom domain — no `_headers` file
 *      needed, no per-host config).
 *   2. The Worker can be extended later with edge logic (path rewrites,
 *      A/B redirects, nonce injection for a stricter CSP, etc.) without
 *      changing the hosting model.
 *   3. No backend, database, or runtime is required — the Worker is
 *      stateless and just pipes the static build to the client.
 *
 * Routing:
 *   - All static files in dist/ (HTML, CSS, JS, fonts, images, sitemap,
 *     robots.txt) are served directly by the assets binding.
 *   - `not_found_handling = "single-page-application"` in wrangler.toml
 *     makes the assets binding fall back to /index.html for unmatched
 *     paths — the site is single-page, so any non-asset URL returns the
 *     homepage (and the browser handles the fragment, e.g. `/#studio`).
 *
 * Deploy:
 *   npm run build       # build the static site to dist/
 *   npm run deploy      # wrangler deploy (bundles + publishes the Worker)
 *   npm run dev:worker  # local Worker dev via wrangler (miniflare)
 */

/**
 * Env bindings made available to the Worker at runtime.
 * `ASSETS` is the Workers Assets binding declared in wrangler.toml.
 * Typed loosely to avoid requiring @cloudflare/workers-types — the
 * shape is identical to the Fetcher interface.
 */
interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

/**
 * Security headers applied to every response. Tuned for a static,
 * client-rendered site with:
 *   - All assets served from the site itself (no third-party origins)
 *   - One inline `<script>` (the Astro early-flags snippet, a trusted
 *     first-party string set via Astro's set:html)
 *   - Inline `<style>` tags (Astro scopes styles inline)
 *
 * `'unsafe-inline'` is required for script-src and style-src because of
 * the inline script + inline styles. A future hardening pass can:
 *   - Compute SHA-256 hashes of the inline script/style contents at build
 *     time and replace 'unsafe-inline' with 'sha256-...' entries.
 *   - OR generate a per-request nonce in the Worker and inject it into
 *     the HTML response + CSP header.
 *
 * Until then, the only inline content is first-party-trusted, so the
 * exposure is minimal.
 */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  // HSTS is only meaningful when served over HTTPS; harmless on HTTP
  // (browsers ignore it) and ignored by wrangler dev.
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Upgrade-Insecure-Requests': '1',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Delegate to the assets binding — serves the file from dist/ if it
    // exists, or falls back to /index.html per wrangler.toml.
    const upstream = await env.ASSETS.fetch(request);

    // Copy upstream headers and extend with our security policy.
    // We don't strip any existing headers (Cloudflare sets reasonable
    // defaults like `Cache-Control` on static assets).
    const headers = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }

    // Pass the body through unchanged. For 204/304 responses the body
    // is null, which is valid for `new Response()`.
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};

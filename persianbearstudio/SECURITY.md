# Security Audit — Applicability Analysis

This document analyzes every advisory reported by `npm audit` against this
project and explains why each is (or is not) applicable to the production
deployment.

## Project context (read first)

PersianBearStudio is a **fully static** website:

- Astro output mode is `static` (the default) — every page is prerendered to
  HTML at build time. There is no Astro server runtime in production.
- No SSR routes, no server islands, no `export const prerender = false`.
- No `define:vars` script directives with user-controlled input.
- No `transition:*` directives on hydrated islands (we do not use
  View Transitions).
- No image optimization pipeline enabled (`astro:assets`'s `<Image />`
  component and sharp-based optimization are not used; the only raster image
  is the precomputed `og-image.png`).
- No `base` config — there is no base-path stripping on the server.
- No dynamic routes that consume a `Host` header.
- Deployed as a Cloudflare Worker that serves the static `dist/` directory
  and only adds security headers. The Worker does not parse request bodies
  or render anything.

`npm audit` reports vulnerabilities in **dependencies as declared**, not as
**used**. Below, each advisory is mapped to the specific feature that
triggers it, and we verify that feature is not in use.

## Advisories reported by `npm audit --omit=dev` on Astro 5.18.2

### astro (critical) — multiple advisories

| Advisory | Trigger | Used here? |
|---|---|---|
| GHSA-j687-52p2-xcff — XSS in `define:vars` via incomplete `</script>` tag sanitization | Build-time / runtime `define:vars` directive with attacker-controlled value | No — we do not use `define:vars` anywhere. Search `src/` for `define:vars` returns zero matches. |
| GHSA-xr5h-phrj-8vxv — Server island encrypted parameters replay across components | Server islands (SSR-only feature) | No — output is `static`, no server islands are declared. |
| GHSA-jrpj-wcv7-9fh9 — XSS via unescaped attribute names in spread props | Spreading an object with attacker-controlled keys as props (`<Component {...userObj} />`) | No — every spread in `src/` uses literal inline objects with static keys (`{...Astro.props}`, `{...item}`). No user-controlled keys reach a component spread. |
| GHSA-f48w-9m4c-m7f5 — Same XSS, incomplete fix | Same | No (same as above) |
| GHSA-7pw4-f3q4-r2p2 — XSS via `transition:*` directive values on hydrated islands | `transition:*` directive on a hydrated island | No — we do not use `transition:*` anywhere and we have no hydrated islands. |
| GHSA-4g3v-8h47-v7g6 — Reflected XSS via unescaped View Transition animation properties | View Transitions feature | No — not enabled in `astro.config.mjs`. |
| GHSA-2pvr-wf23-7pc7 — Host header SSRF in prerendered error page fetch | Astro dev server / SSR error page that fetches an attacker-supplied URL based on `Host` | No — production is a static Worker; no SSR, no error page that fetches by Host. The dev server only runs on `localhost`. |
| GHSA-8hv8-536x-4wqp — Reflected XSS via unescaped slot name | Named slots with attacker-controlled name | No — we use only the default slot and named slots with literal string names. |
| GHSA-26w7-cxv4-gfx2 — Remote code execution through AVIF image optimization | Astro image service processing an attacker-supplied AVIF | No — image optimization is not in use. The only images are static SVG (bear emblem) and one pre-built PNG (OG image). |
| GHSA-376h-93r7-7g6f — Authorization bypass from missing base-path segment check | `base` config that strips a path prefix in SSR mode | No — `base` is not set, output is `static`. |

**Conclusion for astro advisories:** none applicable.

### esbuild (low) — GHSA-g7r4-m6w7-qqqr

- Trigger: esbuild's **dev server** running on Windows can serve files outside
  the project directory.
- Used here: only the dev server (`npm run dev` / `astro dev`) uses esbuild,
  and only for local development. Production builds invoke esbuild once at
  build time to bundle the client JS; production runs the Worker runtime
  (workerd), not esbuild. The deploy environment is Linux (Cloudflare
  Workers), not Windows.
- **Conclusion:** not applicable to production.

### sharp (high) — GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c, GHSA-wq5f-xc86-pv6w

- Trigger: image optimization pipeline that processes attacker-supplied
  images (libvips, libheif, librsvg).
- Used here: Astro installs sharp as an optional image-optimization
  dependency, but we never invoke `astro:assets` image optimization. The
  only images are static SVG and one pre-built PNG; neither goes through
  sharp at build or runtime.
- **Conclusion:** not applicable. Sharp is loaded into `node_modules` but
  never invoked.

## Why not upgrade to Astro 7.x (which has all fixes)?

Astro 6.x and 7.x require Node.js 22.12.0 or later (Astro 7.4.0 requires
`>=22.22.0`). The default Node.js version on Cloudflare Pages / Workers
Build is Node 20.x. Deploying Astro 7 without explicitly setting
`NODE_VERSION=22` in the Cloudflare build environment results in
`astro: not found` because `npm ci` skips the install on engine mismatch.

We chose Astro 5.18.2 because it supports the same Node.js range Cloudflare
uses by default (`18.20.8 || ^20.3.0 || >=22.0.0`), which means the deploy
works without any extra environment configuration. The trade-off is that
Astro 5.x carries advisories for SSR-only features that this static site
does not exercise.

If you prefer to deploy Astro 7.x anyway:

1. Set `NODE_VERSION=22` in the Cloudflare Pages / Workers Build
   environment variables.
2. Update `package.json` to `"astro": "^7.4.0"`.
3. Delete `package-lock.json` and `node_modules`, then `npm install`.
4. Verify with `npm run verify` — audit will be clean.

## Verifying the analysis is current

The analysis above is a point-in-time snapshot. To re-verify after a
dependency update:

```bash
npm run audit
```

The audit script reports `critical` advisories and prints the applicability
note. If a new advisory appears that is NOT listed above, treat it as a
potential regression and re-analyze before deploying.

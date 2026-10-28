PersianBearStudio — Cloudflare Pages package-manager fix

What was found
- package.json and package-lock.json have matching root dependency declarations.
- bun.lock describes a different dependency set (including Astro 7, @astrojs/cloudflare, @fontsource-variable/vazirmatn, and vitest) and is not consistent with package.json.
- Cloudflare is choosing Bun because bun.lock exists, then bun install --frozen-lockfile fails.

Apply this fix in the ROOT of the actual GitHub repository:
1. Replace package.json and package-lock.json with the files in this folder.
2. Delete the repository's existing bun.lock (do not rename it to another lockfile-like filename). Keep a local backup if desired.
3. In Cloudflare Pages, use build command: npm ci && npm run build
   Build output directory: dist (for a static Astro build).
4. Commit and push package.json, package-lock.json, and the deletion of bun.lock.
5. Trigger a new deployment.

Important limitations
- This patch does not include website source files and does not run a build.
- Only the package files provided in the chat were inspected. Verify astro.config.* before deployment: if it imports @astrojs/cloudflare, that adapter must be intentionally included and configured; do not add it blindly because the supplied package.json currently targets Astro 5 and does not declare it.
- A prior build log mentioned scripts/generate-favicons.py missing. The supplied package.json's build script is only `astro build`, so that older failure may relate to a different project revision or Cloudflare configuration. Recheck the next build log if it appears again.

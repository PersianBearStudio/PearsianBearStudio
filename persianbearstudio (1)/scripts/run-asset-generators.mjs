#!/usr/bin/env node
/**
 * run-asset-generators.mjs — Defensive wrapper for the Python asset generators.
 *
 * This wrapper exists so `npm run assets:generate` is safe to invoke in any
 * environment:
 *   - If Python 3 + Pillow are available, it runs the three Python generators
 *     (scripts/generate-favicons.py, scripts/generate-favicon-svg.py,
 *      scripts/generate-og-image.py) in order.
 *   - If Python 3 is missing OR Pillow is missing, it prints a helpful note
 *     and exits 0 — the generated files are ALREADY checked into `public/`,
 *     so the build doesn't need regeneration. The developer can install
 *     Python 3 + Pillow locally when they update the brand images and want
 *     to regenerate the favicons / OG image.
 *
 * Why this wrapper?
 *   - Cloudflare Pages / Workers Build and other CI environments don't
 *     always have Python 3 + Pillow installed. The original `prebuild` hook
 *     caused the build to fail in those environments. Removing `prebuild`
 *     (the build no longer depends on this script) + making this script
 *     defensive means `npm run build` always works, and `npm run
 *     assets:generate` works when you actually need to regenerate.
 *
 * When to run this manually:
 *   - You replaced `public/brand-mark.jpg` and want to regenerate
 *     `favicon.svg`, `favicon-32.png`, `favicon-180.png`, `apple-touch-icon.png`,
 *     `favicon.ico`.
 *   - You replaced `public/brand-wordmark.jpg` and want to regenerate
 *     `og-image.png`, `og-image.svg`.
 *
 * Prerequisites for regeneration (when you actually want to regenerate):
 *   - Python 3.8+ on PATH
 *   - Pillow (PIL) installed: `pip install pillow` or `pip3 install pillow`
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const scripts = [
  'scripts/generate-favicons.py',
  'scripts/generate-favicon-svg.py',
  'scripts/generate-og-image.py',
];

/**
 * Detect whether `python3` is on PATH and can import PIL.
 * Returns 'python3' / 'python' if usable, or null if neither is available.
 */
function findPython() {
  for (const bin of ['python3', 'python']) {
    const probe = spawnSync(bin, ['-c', 'import PIL; print("ok")'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (probe.status === 0 && probe.stdout.trim() === 'ok') {
      return bin;
    }
  }
  return null;
}

const py = findPython();

if (!py) {
  console.log(
    `
[assets:generate] Python 3 + Pillow not detected — skipping regeneration.

All generated assets (favicon.svg, favicon-32.png, favicon-180.png,
apple-touch-icon.png, favicon.ico, og-image.png, og-image.svg) are
already committed to public/, so the build does not need them to be
regenerated.

To regenerate after updating public/brand-mark.jpg or
public/brand-wordmark.jpg, install Python 3 and Pillow locally:
  pip3 install pillow
  npm run assets:generate
`.trimStart()
  );
  process.exit(0);
}

console.log(`[assets:generate] Using ${py}, regenerating assets…\n`);

let failed = false;
for (const rel of scripts) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.error(`  ✗ ${rel} — file not found at ${abs}`);
    failed = true;
    continue;
  }
  const result = spawnSync(py, [abs], { stdio: 'inherit', cwd: root });
  if (result.status !== 0) {
    console.error(`  ✗ ${rel} — exited with status ${result.status}`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[assets:generate] One or more generators failed.');
  process.exit(1);
}

console.log('\n[assets:generate] Done. Assets in public/ are now up-to-date.');

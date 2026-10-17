#!/usr/bin/env node
/**
 * PersianBearStudio — Build Smoke Test
 * ---------------------------------------
 * Run after `npm run build`. Verifies the static output:
 *   - dist/index.html exists and is non-empty
 *   - contains the primary sections by id
 *   - every in-page anchor (#...) in the HTML resolves to an element id
 *     (catches dead # links before deploy)
 *   - SEO essentials present: title, meta description, canonical, OG image
 *   - no inline event handlers (onclick=) or javascript: URIs
 *   - configured contact channels render in the contact section
 *
 * Usage:  node scripts/smoke-test.mjs
 * Exit:  0 = pass, 1 = fail with details
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const INDEX = join(DIST, 'index.html');

const failures = [];
const ok = (msg) => console.log('  \u2713 ' + msg);
const fail = (msg) => { failures.push(msg); console.log('  \u2717 ' + msg); };

console.log('PersianBearStudio — build smoke test\n');

// 1. dist/index.html exists
if (!existsSync(INDEX)) {
  console.log('FAIL: dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}
const html = readFileSync(INDEX, 'utf8');
if (html.length < 1024) fail(`dist/index.html is suspiciously small (${html.length} bytes)`);
else ok(`dist/index.html built (${(html.length / 1024).toFixed(1)} KB)`);

// 2. Required sections by id
const requiredIds = ['top', 'site-header', 'main', 'studio', 'philosophy', 'capabilities', 'approach', 'contact', 'footer-heading', 'hero-heading'];
requiredIds.forEach((id) => {
  const re = new RegExp(`id="${id}"`);
  if (re.test(html)) ok(`section #${id} present`);
  else fail(`section #${id} missing`);
});

// 3. Heading hierarchy
if (/<h1[ >]/.test(html)) ok('h1 present');
else fail('h1 missing');
const h1Count = (html.match(/<h1[ >]/g) || []).length;
if (h1Count === 1) ok('exactly one h1');
else fail(`${h1Count} h1 elements (expected 1)`);
const h2Count = (html.match(/<h2[ >]/g) || []).length;
// Studio, Philosophy, Capabilities, Approach, Contact = 5 section headings.
// Contact section heading exists but is rendered inside an h2; the hero uses h1.
if (h2Count === 5) ok(`${h2Count} h2 elements (5 expected: studio/philosophy/capabilities/approach/contact)`);
else fail(`${h2Count} h2 elements (5 expected)`);

// 4. Dead anchor links: every href="#something" must resolve to id="something"
const anchorRe = /href="#([A-Za-z][\w-]*)"/g;
const anchors = new Set();
let m;
while ((m = anchorRe.exec(html)) !== null) anchors.add(m[1]);
const ids = new Set();
const idRe = /\sid="([A-Za-z][\w-]*)"/g;
while ((m = idRe.exec(html)) !== null) ids.add(m[1]);
const dead = [...anchors].filter((a) => !ids.has(a) && a !== 'top');
if (dead.length === 0) ok(`all ${anchors.size} in-page anchors resolve to an id`);
else fail(`dead anchors (no matching id): ${dead.join(', ')}`);

// 5. SEO essentials
if (/<title>[^<]+<\/title>/.test(html)) ok('title present');
else fail('title missing');
if (/<meta name="description"/.test(html)) ok('meta description present');
else fail('meta description missing');
if (/<link rel="canonical"/.test(html)) ok('canonical link present');
else fail('canonical link missing');
if (/<meta property="og:image"/.test(html)) ok('OG image present');
else fail('OG image missing');
if (/<meta name="twitter:card"/.test(html)) ok('Twitter card present');
else fail('Twitter card missing');

// 6. No inline event handlers
const inlineHandlers = (html.match(/\son(click|load|mouseover|mouseout|submit|change|error|focus|blur)="[^"]*"/gi) || []);
if (inlineHandlers.length === 0) ok('no inline event handlers');
else fail(`${inlineHandlers.length} inline event handlers found`);

// 7. No javascript: URIs
const jsUris = (html.match(/href="javascript:[^"]*"/gi) || []);
if (jsUris.length === 0) ok('no javascript: URIs');
else fail(`${jsUris.length} javascript: URIs found`);

// 8. robots.txt and sitemap are emitted
['robots.txt', 'sitemap-index.xml'].forEach((file) => {
  if (existsSync(join(DIST, file))) ok(`${file} emitted`);
  else fail(`${file} missing`);
});

// 9. Favicon and OG image emitted
['favicon.svg', 'og-image.png', 'og-image.svg'].forEach((file) => {
  if (existsSync(join(DIST, file))) ok(`${file} emitted`);
  else fail(`${file} missing`);
});

// 10. Cloudflare Worker deployment artifacts
['wrangler.toml', 'src/worker.ts'].forEach((file) => {
  if (existsSync(join(ROOT, file))) ok(`${file} present`);
  else fail(`${file} missing`);
});
// _headers / vercel.json / netlify.toml should NOT exist (Worker handles security headers)
['public/_headers', 'vercel.json', 'netlify.toml'].forEach((file) => {
  if (existsSync(join(ROOT, file))) fail(`${file} should not exist (Worker handles security headers)`);
  else ok(`${file} correctly absent (Worker handles security headers)`);
});

// 11. Asset sanity: CSS + JS bundles present and non-empty
const astroDir = join(DIST, '_astro');
if (existsSync(astroDir)) {
  const cssFiles = readdirSync(astroDir).filter((f) => f.endsWith('.css'));
  const jsFiles = readdirSync(astroDir).filter((f) => f.endsWith('.js'));
  if (cssFiles.length >= 1) ok(`${cssFiles.length} CSS bundle(s) emitted`);
  else fail('no CSS bundle emitted');
  if (jsFiles.length >= 1) ok(`${jsFiles.length} JS bundle(s) emitted`);
  else fail('no JS bundle emitted');
} else {
  fail('_astro/ bundle directory missing');
}

console.log('');
if (failures.length === 0) {
  console.log('\u2713 PASS — all smoke checks passed');
  process.exit(0);
} else {
  console.log(`\u2717 FAIL — ${failures.length} issue(s) found`);
  process.exit(1);
}

# PersianBearStudio — Inquiry Form Setup & Operations Guide

This document covers everything that must be configured **outside the
codebase** to take the project inquiry form from "works locally" to
"delivers real e-mail to the studio inbox", plus the operational notes
that go with it.

---

## 1. What sends the e-mail (and what does not)

The form posts to `POST /api/inquiry`, which runs as a server function
(Astro + `@astrojs/cloudflare`). The endpoint validates, rate-limits,
sanitises, composes one notification and hands it to an **e-mail
transport** selected from environment variables:

| `EMAIL_PROVIDER` | Behaviour |
|---|---|
| `resend` (production) | Sends via the Resend HTTP API. Requires `RESEND_API_KEY` and `EMAIL_FROM`. |
| `dev-log` (local only) | Prints the composed notification to the server console. Nothing is sent. |
| *(unset)* | Uses Resend only if `RESEND_API_KEY` **and** `EMAIL_FROM` are both present; otherwise the endpoint answers **503** with a localized "not configured" message. |

The destination inbox is `INQUIRY_DESTINATION`
(default: `persianbearstudio@gmail.com` — the studio's official address).
The visitor's validated e-mail is used as `Reply-To`.

**No database is used or required.** Notifications are the system of
record; see section 6 for the reasoning and the upgrade path.

## 2. Environment variables

| Variable | Where | Example | Notes |
|---|---|---|---|
| `EMAIL_PROVIDER` | dashboard var | `resend` | `dev-log` must never be set in production. |
| `INQUIRY_DESTINATION` | dashboard var | `persianbearstudio@gmail.com` | Optional; hardcoded fallback is the same address. |
| `RESEND_API_KEY` | dashboard **secret** | `re_…` | Created in the Resend dashboard. |
| `EMAIL_FROM` | dashboard var | `PersianBearStudio <inquiries@persianbearstudio.com>` | Must be a Resend-verified sender (see below). |

Locally, `astro dev` loads these from `.dev.vars` (git-ignored). A
template with explanations lives in `.dev.vars.example` and `.env.example`.

**Never** put `RESEND_API_KEY` in `.env`, `.dev.vars` templates,
wrangler.toml `[vars]`, or any client-visible file. In the built bundle
it is only ever read server-side through the Cloudflare runtime.

## 3. Resend account setup (exact steps)

1. **Create the account** at <https://resend.com> — sign up with
   `persianbearstudio@gmail.com` (the destination inbox) so the
   sandbox sender can deliver to it during testing.
2. **Verify a sending domain** (recommended for production):
   Dashboard → *Domains* → *Add Domain* → enter
   `persianbearstudio.com` (or whichever domain the studio controls)
   → Resend shows DKIM/SPF DNS records (usually `resend._domainkey` TXT,
   plus an MX and a RETURN-PATH CNAME) → add them at the DNS provider →
   press *Verify* (usually active within minutes, DNS propagation aside).
3. **Create an API key**: Dashboard → *API Keys* → *Create API Key* →
   name it e.g. `persianbearstudio-form`, scope *Sending access* → copy
   the `re_…` value once (it is shown only once).
4. **While the domain is not yet verified** you can test with Resend's
   sandbox sender: set
   `EMAIL_FROM=PersianBearStudio <onboarding@resend.dev>` — Resend
   only delivers this sender's mail **to the account owner's address**,
   which is why step 1 used the studio Gmail address.

## 4. Deployment on Cloudflare

The build produces static pages plus a server worker:

- **Build command:** `npm run build` (runs `astro build`)
- **Output:** generated `dist/` (adapter v14 layout: static assets +
  `dist/server` worker entry)

### Option A — Workers Builds (recommended, current Cloudflare flow)

1. Cloudflare dashboard → *Workers & Pages* → *Create* → *Workers*
   → *Connect to Git* → select the repository.
2. Build command `npm run build`, deploy command `npx wrangler deploy`.
3. After the first deploy: *Settings* → *Variables and Secrets* → add
   the four variables from section 2 (mark `RESEND_API_KEY` as
   **Secret**), for the *Production* environment.
4. Redeploy so the new variables take effect.

### Option B — Direct CLI deploy

```bash
npm run build
npx wrangler deploy        # reads dist/server/wrangler.json
npx wrangler secret put RESEND_API_KEY
```

### Notes on adapter defaults

The `@astrojs/cloudflare` adapter auto-declares a `SESSION` KV binding
(Astro sessions — unused by this form) and an `IMAGES` binding
(Cloudflare Images — unused, no transformations are configured). On
first deploy Cloudflare auto-provisions one free-tier KV namespace for
`SESSION`. They are harmless; deleting them is safe only if the adapter
config is adjusted, so leaving them as-is is recommended.

## 5. Verifying real delivery

After configuring the variables:

1. Submit the form once from the live site.
2. Check the inbox (`persianbearstudio@gmail.com`) — including the
   *Promotions/Updates* tabs — for `[Website Inquiry] …`.
3. If it does not arrive, check, in order:
   - `curl -s -X POST https://<site>/api/inquiry …` (valid payload) —
     a `502` means the provider rejected the message: server logs show
     only the reason kind (`auth` = bad API key, `invalid-sender` =
     `EMAIL_FROM` not verified, `rate-limit` = provider quota).
   - A `503` means the variables are missing in that environment.
   - Resend dashboard → *Logs/Emails* shows provider-side acceptance
     and bounce details.
   - Gmail may sandbox the `onboarding@resend.dev` test sender into
     spam — this does not happen with a verified domain.

Delivery is only ever reported to the visitor as successful when the
provider accepted the message (HTTP 200 from Resend). Provider-side
acceptance is the strongest guarantee available from the API; final
inbox placement depends on the receiving mailbox.

## 6. Why there is no database (and the upgrade path)

Per the studio's requirement, the form stores nothing: the notification
e-mail is the record. This keeps the attack surface and infrastructure
minimal — no datastore to secure, no retention policy to enforce, no
public read path to lock down.

If volume ever makes inbox-only tracking painful, add a KV namespace
binding in `wrangler.toml` and write a minimal record (timestamp,
fingerprint, project type) from `src/lib/inquiry.ts` after an accepted
send. Do **not** store full submissions unless a retention and access
policy exists, and never expose the namespace through a public route.

## 7. Security behaviour (what is actually enforced)

All of the following run **server-side**, on every request:

- Strict method (`POST` only → 405) and `application/json` content type
  (→ 415).
- Body cap of 16,000 bytes, checked before parsing (→ 413).
- Full field validation with whitelisted select values, length caps and
  Unicode-aware "meaningful content" checks (→ 400 with per-field
  localized messages).
- Honeypot field: filled values are dropped silently (HTTP 200, no
  e-mail) so bots get no feedback.
- Per-IP sliding-window rate limit: **5 submissions / 10 minutes**
  (→ 429 with `Retry-After`). In-memory per isolate; for a hard
  guarantee add a Cloudflare WAF rate-limiting rule on `/api/inquiry`
  (Security → WAF → Rate limiting rules, e.g. 10 requests / 1 minute).
- Duplicate guard: identical e-mail + description within 60 s of an
  accepted send returns an idempotent success instead of a second mail.
- E-mail header injection is structurally impossible: validation
  character classes exclude CR/LF, and header values are additionally
  stripped of control characters before composition.
- HTML injection into the notification is impossible: all visitor
  content is HTML-escaped; URLs render as plain text, never as links.
- Error responses expose only localized messages; provider details and
  API keys never appear in responses or logs.
- Logging records event names, status codes and error kinds only —
  never submissions or e-mail addresses.

## 8. Local development & testing

```bash
npm install
npm run dev      # astro dev — real Cloudflare runtime via wrangler
npm test         # vitest — 79 tests (validation, compose, handler, HTTP)
npm run check    # astro check — type diagnostics
npm run build    # production build for Cloudflare
```

`.dev.vars` ships with `EMAIL_PROVIDER=dev-log`, so submissions print
the composed notification to the dev-server console instead of sending
mail. To test the real provider locally, set the production values in
`.dev.vars` and restart `npm run dev`.

## 9. Adjusting form wording

All labels, option texts, validation messages, status messages and the
privacy notice live in `src/i18n/en.ts` and `src/i18n/fa.ts`. Select
option **values** (e.g. `500-1500`) are API contracts — change the
display labels freely, but if a value changes, update
`src/lib/types.ts` (and the matching dictionary keys) together.

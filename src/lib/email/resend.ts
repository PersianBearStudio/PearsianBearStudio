/**
 * Resend transport — https://resend.com
 *
 * Why Resend for this project:
 *  - Plain HTTPS + JSON, so it runs natively inside a Cloudflare
 *    Pages Function with `fetch` (no SMTP, no Node APIs).
 *  - Free tier (100 mails/day) is far beyond a studio's inquiry volume.
 *
 * Provider status mapping (kept intentionally coarse):
 *   200/201 → accepted        401/403 → auth (bad key)
 *   422     → invalid-sender  429     → rate-limit
 *   fetch throw / timeout → network
 *   anything else → unknown
 *
 * The API key never appears in errors, logs or responses.
 */

import type { OutgoingEmail, SendResult } from './transport';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;

/** Sends one e-mail through the Resend API. */
export async function sendWithResend(
  email: OutgoingEmail,
  apiKey: string,
): Promise<SendResult> {
  if (!apiKey) {
    return { accepted: false, errorKind: 'auth' };
  }

  const payload = {
    from: email.from,
    to: [email.to],
    reply_to: email.replyTo,
    subject: email.subject,
    text: email.text,
    html: email.html,
  };

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { accepted: false, errorKind: 'network' };
  }

  if (response.status === 200 || response.status === 201) {
    return { accepted: true };
  }

  let errorKind: SendResult['errorKind'] = 'unknown';
  if (response.status === 401 || response.status === 403) {
    errorKind = 'auth';
  } else if (response.status === 422) {
    // Typically an unverified sender/domain or malformed address.
    errorKind = 'invalid-sender';
  } else if (response.status === 429) {
    errorKind = 'rate-limit';
  }
  return { accepted: false, errorKind };
}

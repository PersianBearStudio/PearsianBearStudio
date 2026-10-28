/**
 * PersianBearStudio — inquiry submission handler (framework-agnostic).
 *
 * Orchestrates the full server-side flow:
 *
 *   1. validate payload (shared rule-set)      → 400 with field errors
 *   2. honeypot filled                         → silent drop (200, no mail)
 *   3. per-IP rate limit                       → 429 + retryAfter
 *   4. duplicate within 60 s of an accepted
 *      send                                    → idempotent 200
 *   5. select transport from env               → 503 when unconfigured
 *   6. compose + send notification             → 502 on provider failure
 *   7. 200 with a localised success message
 *
 * Logging policy: only event names, status codes, transport names and
 * error kinds are logged — never full submissions, e-mail addresses or
 * other personal data.
 */

import { getDictionary, interpolate } from '../i18n';
import { composeInquiryEmail } from './email/compose';
import { getTransport, type EmailTransport } from './email/transport';
import { checkDuplicate, checkRate, markSent } from './ratelimit';
import { stripHeaderUnsafe } from './sanitize';
import { validateInquiry } from './validation';
import type {
  AppEnv,
  FieldErrors,
  SupportedLang,
} from './types';

/** Default destination — the studio's official inquiry inbox. */
export const DEFAULT_INQUIRY_DESTINATION = 'persianbearstudio@gmail.com';

export interface ApiResponseBody {
  ok: boolean;
  /** Localised, user-facing message (already interpolated). */
  message: string;
  /** Field name → localised error message (only for 400 responses). */
  errors?: Record<string, string>;
  /** Seconds to wait before retrying (429 responses). */
  retryAfter?: number;
}

export interface HandlerResult {
  status: number;
  body: ApiResponseBody;
}

export interface HandlerDeps {
  env: AppEnv;
  /** Trustworthy client IP (CF-Connecting-IP on Cloudflare). */
  clientIp?: string;
  /** Test seam: inject a transport instead of using the env one. */
  transport?: EmailTransport;
  now?: () => Date;
}

function renderFieldErrors(
  errors: FieldErrors,
  lang: SupportedLang,
): Record<string, string> {
  const dict = getDictionary(lang);
  const rendered: Record<string, string> = {};
  for (const [field, error] of Object.entries(errors)) {
    if (error) {
      rendered[field] = interpolate(
        dict.validation[error.key],
        error.params,
      );
    }
  }
  return rendered;
}

/** Runs the submission flow and returns an HTTP-ready result. */
export async function handleInquirySubmission(
  payload: unknown,
  deps: HandlerDeps,
): Promise<HandlerResult> {
  const now = deps.now ?? (() => new Date());

  /* 1 ─ Validation (server is the authority). */
  const validation = validateInquiry(payload);

  if (!validation.ok) {
    // Language for rendering the errors: declared language, else EN.
    const lang: SupportedLang =
      typeof payload === 'object' &&
      payload !== null &&
      (payload as Record<string, unknown>).lang === 'fa'
        ? 'fa'
        : 'en';
    const dict = getDictionary(lang);
    return {
      status: 400,
      body: {
        ok: false,
        message: dict.validation.errUnexpected,
        errors: renderFieldErrors(validation.errors, lang),
      },
    };
  }

  const inquiry = validation.data;
  const dict = getDictionary(inquiry.lang);

  /* 2 ─ Honeypot: silent drop. The response mimics success so bots get
     no feedback about what tripped them; nothing is sent or stored. */
  if (inquiry.website !== '') {
    console.info(
      `[inquiry] honeypot tripped — submission dropped silently`,
    );
    return {
      status: 200,
      body: { ok: true, message: dict.status.successBody },
    };
  }

  /* 3 ─ Rate limit (per isolate — see ratelimit.ts header note). */
  const ipKey = `ip:${deps.clientIp ?? 'unknown'}`;
  const rate = checkRate(ipKey);
  if (!rate.allowed) {
    console.info(`[inquiry] rate limited (${deps.clientIp ? 'ip' : 'unknown key'})`);
    return {
      status: 429,
      body: {
        ok: false,
        message: interpolate(dict.validation.errRateLimited, {
          seconds: rate.retryAfterSec,
        }),
        retryAfter: rate.retryAfterSec,
      },
    };
  }

  /* 4 ─ Duplicate guard. */
  const duplicate = checkDuplicate(inquiry.email, inquiry.description);
  if (duplicate === 'sent') {
    // Same content, already accepted within the window → idempotent OK.
    console.info('[inquiry] duplicate after accepted send — idempotent 200');
    return {
      status: 200,
      body: { ok: true, message: dict.status.successBody },
    };
  }

  /* 5 ─ Transport selection (env-driven; 503 when unconfigured). */
  const destination = stripHeaderUnsafe(
    deps.env.INQUIRY_DESTINATION?.trim() || DEFAULT_INQUIRY_DESTINATION,
  );
  const selection = deps.transport
    ? { transport: deps.transport }
    : getTransport(deps.env);

  if (!selection.transport) {
    console.info(
      `[inquiry] email transport not configured (reason: ${
        'reason' in selection ? selection.reason : 'n/a'
      }) — answering 503`,
    );
    return {
      status: 503,
      body: { ok: false, message: dict.validation.errNotConfigured },
    };
  }

  /* 6 ─ Compose + send. */
  const email = composeInquiryEmail(inquiry, {
    to: destination,
    from: stripHeaderUnsafe(deps.env.EMAIL_FROM ?? ''),
    now: now(),
  });

  let result;
  try {
    result = await selection.transport.send(email);
  } catch {
    result = { accepted: false, errorKind: 'unknown' as const };
  }

  if (!result.accepted) {
    console.info(
      `[inquiry] transport "${selection.transport.name}" rejected the message (kind: ${result.errorKind ?? 'unknown'})`,
    );
    return {
      status: 502,
      body: { ok: false, message: dict.validation.errServer },
    };
  }

  markSent(inquiry.email, inquiry.description);

  console.info(
    `[inquiry] accepted via "${selection.transport.name}" — notification queued`,
  );

  /* 7 ─ Success. */
  return {
    status: 200,
    body: { ok: true, message: dict.status.successBody },
  };
}

/**
 * PersianBearStudio — HTTP boundary for POST /api/inquiry.
 *
 * Translates a Web `Request` into the framework-agnostic handler and
 * back into a JSON `Response`. Enforced here, before any business logic:
 *
 *   - POST only                          → 405 (+ Allow header)
 *   - Content-Type: application/json     → 415
 *   - Content-Length above the cap       → 413 (rejected before reading)
 *   - body above the cap after reading   → 413
 *   - malformed JSON                     → 400 (generic message)
 *
 * Responses are `application/json; charset=utf-8`, `no-store`, and
 * carry `X-Content-Type-Options: nosniff`. Error bodies contain only
 * localised, user-safe messages — never stack traces, provider
 * responses or configuration details.
 */

import { getDictionary } from '../i18n';
import { handleInquirySubmission, type HandlerDeps } from './inquiry';
import { LIMITS, type AppEnv, type SupportedLang } from './types';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const;

function jsonResponse(
  status: number,
  body: unknown,
  extra?: Record<string, string>,
): Response {
  const headers = new Headers(JSON_HEADERS);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      headers.set(key, value);
    }
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/** Cheap lang sniff for wrapper-level errors (body may be unparsable). */
function sniffLang(text: string): SupportedLang {
  return /"lang"\s*:\s*"fa"/.test(text.slice(0, 512)) ? 'fa' : 'en';
}

/** Handles the inquiry endpoint; POST is the only accepted method. */
export async function handleInquiryRequest(
  request: Request,
  env: AppEnv,
  overrides?: Partial<HandlerDeps>,
): Promise<Response> {
  if (request.method.toUpperCase() !== 'POST') {
    return jsonResponse(405, { ok: false, message: 'Method not allowed.' }, {
      allow: 'POST',
    });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse(
      415,
      { ok: false, message: 'Expected a JSON submission.' },
      { accept: 'application/json' },
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > LIMITS.maxBodyBytes) {
    return jsonResponse(413, {
      ok: false,
      message: 'Submission too large.',
    });
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return jsonResponse(400, {
      ok: false,
      message: 'Could not read the request body.',
    });
  }

  if (text.length > LIMITS.maxBodyBytes) {
    return jsonResponse(413, {
      ok: false,
      message: 'Submission too large.',
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    const dict = getDictionary(sniffLang(text));
    return jsonResponse(400, {
      ok: false,
      message: dict.validation.errBadJson,
    });
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    undefined;

  const result = await handleInquirySubmission(payload, {
    env,
    clientIp,
    ...overrides,
  });

  return jsonResponse(result.status, result.body, {
    ...(result.status === 429 && result.body.retryAfter
      ? { 'retry-after': String(result.body.retryAfter) }
      : {}),
  });
}

/**
 * PersianBearStudio — Cloudflare Worker entry point
 * ----------------------------------------------------
 * Serves the static Astro build through Workers Assets, applies security
 * headers, and handles the same-origin project inquiry endpoint.
 */

import {
  validateInquiryPayload,
  type InquiryPayload,
} from './lib/inquiry';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  INQUIRY_TO_EMAIL?: string;
}

const INQUIRY_PATH = '/api/inquiry';
const DEFAULT_INQUIRY_TO_EMAIL = 'persianbearstudio@gmail.com';
const MAX_INQUIRY_BODY_BYTES = 16_384;

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
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Upgrade-Insecure-Requests': '1',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function inquiryText(data: InquiryPayload): string {
  return [
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Project type: ${data.projectType}`,
    `Company: ${data.company || 'Not provided'}`,
    `Audience: ${data.audience || 'Not provided'}`,
    `Current URL: ${data.currentUrl || 'Not provided'}`,
    `Launch timeframe: ${data.launchTimeframe || 'Not provided'}`,
    `Budget: ${data.budget || 'Not provided'}`,
    '',
    'Short description:',
    data.shortDescription,
    '',
    'Problem to solve:',
    data.problem || 'Not provided',
    '',
    'Additional details:',
    data.additionalDetails || 'Not provided',
  ].join('\n');
}

function inquiryHtml(data: InquiryPayload): string {
  const rows = [
    ['Name', data.fullName],
    ['Email', data.email],
    ['Project type', data.projectType],
    ['Company', data.company || 'Not provided'],
    ['Audience', data.audience || 'Not provided'],
    ['Current URL', data.currentUrl || 'Not provided'],
    ['Launch timeframe', data.launchTimeframe || 'Not provided'],
    ['Budget', data.budget || 'Not provided'],
    ['Short description', data.shortDescription],
    ['Problem to solve', data.problem || 'Not provided'],
    ['Additional details', data.additionalDetails || 'Not provided'],
  ];
  return `<h1>New project inquiry</h1><dl>${rows
    .map(([label, value]) => `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value).replace(/\n/g, '<br>')}</dd>`)
    .join('')}</dl>`;
}

async function handleInquiry(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) {
    return jsonResponse({ ok: false, error: 'Origin not allowed.' }, 403);
  }

  const contentType = request.headers.get('Content-Type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    return jsonResponse({ ok: false, error: 'Content-Type must be application/json.' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_INQUIRY_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Inquiry payload is too large.' }, 413);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: 'Could not read inquiry payload.' }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_INQUIRY_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Inquiry payload is too large.' }, 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: 'Inquiry payload must be valid JSON.' }, 400);
  }

  const validation = validateInquiryPayload(parsed);
  if (!validation.ok || !validation.data) {
    return jsonResponse({ ok: false, error: validation.error ?? 'Please check the inquiry fields.' }, 400);
  }
  if (validation.data.website) {
    return jsonResponse({ ok: false, error: 'Please check the inquiry fields.' }, 400);
  }

  const fallbackEmail = env.INQUIRY_TO_EMAIL?.trim() || DEFAULT_INQUIRY_TO_EMAIL;
  if (!env.RESEND_API_KEY?.trim() || !env.RESEND_FROM_EMAIL?.trim()) {
    return jsonResponse(
      {
        ok: false,
        error: `Inquiry delivery is not configured. Please email ${fallbackEmail} directly.`,
        fallbackEmail,
      },
      503,
    );
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [fallbackEmail],
        reply_to: validation.data.email,
        subject: `New project inquiry from ${validation.data.fullName}`,
        text: inquiryText(validation.data),
        html: inquiryHtml(validation.data),
      }),
    });

    if (!resendResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          error: `We could not send your inquiry right now. Please email ${fallbackEmail} directly.`,
          fallbackEmail,
        },
        502,
      );
    }
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: `We could not send your inquiry right now. Please email ${fallbackEmail} directly.`,
        fallbackEmail,
      },
      502,
    );
  }

  return jsonResponse({ ok: true }, 200);
}

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const response = url.pathname === INQUIRY_PATH
      ? await handleInquiry(request, env, url)
      : await env.ASSETS.fetch(request);
    return applySecurityHeaders(response);
  },
};

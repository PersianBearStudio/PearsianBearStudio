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
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_CHAT_IDS?: string;
}

const INQUIRY_PATH = '/api/inquiry';
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

function telegramMessage(data: InquiryPayload, orderId: string): string {
  const clip = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max)}…` : value;
  const field = (label: string, value: string, max = 180) =>
    `<b>${label}:</b> ${escapeHtml(clip(value || 'Not provided', max))}`;

  return [
    '📩 <b>New project inquiry</b>',
    `<b>Order ID:</b> <code>${escapeHtml(orderId)}</code>`,
    field('Name', data.fullName),
    field('Email', data.email),
    field('Project type', data.projectType),
    field('Company', data.company),
    field('Audience', data.audience),
    field('Current URL', data.currentUrl),
    field('Launch timeframe', data.launchTimeframe),
    field('Budget', data.budget),
    '',
    '<b>Short description:</b>',
    escapeHtml(clip(data.shortDescription, 650)),
    '',
    '<b>Problem to solve:</b>',
    escapeHtml(clip(data.problem, 450)),
    '',
    '<b>Additional details:</b>',
    escapeHtml(clip(data.additionalDetails, 650)),
  ].join('\n');
}

async function notifyTelegram(
  env: Env,
  data: InquiryPayload,
  orderId: string,
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIds = (env.TELEGRAM_ADMIN_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^-?\d+$/.test(id));

  if (!token || chatIds.length === 0) {
    console.error('Telegram notification is not configured.');
    return;
  }

  const text = telegramMessage(data, orderId);
  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );
      if (!response.ok) {
        console.error('Telegram notification failed with status:', response.status);
      }
    }),
  );

  if (results.some((result) => result.status === 'rejected')) {
    console.error('One or more Telegram notifications could not be delivered.');
  }
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

  const supabaseUrl = env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const supabaseSecretKey = env.SUPABASE_SECRET_KEY?.trim();
  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('Supabase inquiry storage is not configured.');
    return jsonResponse(
      { ok: false, error: 'The inquiry service is not configured yet. Please try again later.' },
      503,
    );
  }

  let parsedSupabaseUrl: URL;
  try {
    parsedSupabaseUrl = new URL(supabaseUrl);
    if (parsedSupabaseUrl.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    console.error('SUPABASE_URL must be a valid HTTPS URL.');
    return jsonResponse({ ok: false, error: 'The inquiry service is temporarily unavailable.' }, 503);
  }

  let orderId: string;
  try {
    const dbResponse = await fetch(
      `${parsedSupabaseUrl.origin}/rest/v1/orders?select=id`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseSecretKey,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          full_name: validation.data.fullName,
          email: validation.data.email,
          project_type: validation.data.projectType,
          short_description: validation.data.shortDescription,
          company: validation.data.company || null,
          audience: validation.data.audience || null,
          current_url: validation.data.currentUrl || null,
          problem: validation.data.problem || null,
          launch_timeframe: validation.data.launchTimeframe || null,
          budget: validation.data.budget || null,
          additional_details: validation.data.additionalDetails || null,
        }),
      },
    );

    if (!dbResponse.ok) {
      console.error('Supabase order insert failed with status:', dbResponse.status);
      return jsonResponse(
        { ok: false, error: 'We could not save your inquiry right now. Please try again later.' },
        502,
      );
    }

    const inserted = (await dbResponse.json()) as Array<{ id?: string }>;
    orderId = inserted[0]?.id ?? '';
    if (!orderId) {
      console.error('Supabase insert returned no order ID.');
      return jsonResponse(
        { ok: false, error: 'We could not confirm your inquiry was saved. Please try again.' },
        502,
      );
    }
  } catch {
    console.error('Supabase order insert request failed.');
    return jsonResponse(
      { ok: false, error: 'We could not reach the inquiry service right now. Please try again later.' },
      502,
    );
  }

  // Database storage is the source of truth. A temporary Telegram outage must
  // not make a successfully stored inquiry appear to have failed to the visitor.
  await notifyTelegram(env, validation.data, orderId);

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

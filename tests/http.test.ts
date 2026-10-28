import { beforeEach, describe, expect, it } from 'vitest';
import { handleInquiryRequest } from '../src/lib/http';
import type { EmailTransport, OutgoingEmail } from '../src/lib/email/transport';
import { resetAbuseState } from '../src/lib/ratelimit';
import { getDictionary } from '../src/i18n';

/**
 * HTTP boundary tests — method, content-type, body size and JSON
 * handling, plus one end-to-end pass through the whole pipeline.
 */

const URL = 'https://studio.example/api/inquiry';
const env = {
  EMAIL_FROM: 'PersianBearStudio <inquiries@example.com>',
  INQUIRY_DESTINATION: 'persianbearstudio@gmail.com',
};

function makeTransport() {
  const sent: OutgoingEmail[] = [];
  const transport: EmailTransport = {
    name: 'fake',
    send: async (email) => {
      sent.push(email);
      return { accepted: true };
    },
  };
  return { transport, sent };
}

function post(body: string | object, headers: Record<string, string> = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: raw,
  });
}

const validPayload = {
  lang: 'en',
  fullName: 'Sara Ahmadi',
  email: 'sara@example.com',
  projectType: 'business-website',
  description: 'A clean website for our ceramics studio.',
};

beforeEach(() => {
  resetAbuseState();
});

describe('handleInquiryRequest — method and content handling', () => {
  it('rejects GET with 405 and an Allow header', async () => {
    const response = await handleInquiryRequest(new Request(URL), env);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it('rejects PUT with 405', async () => {
    const response = await handleInquiryRequest(
      new Request(URL, { method: 'PUT', body: '{}' }),
      env,
    );
    expect(response.status).toBe(405);
  });

  it('rejects non-JSON content types with 415', async () => {
    const response = await handleInquiryRequest(
      post('fullName=x', { 'content-type': 'application/x-www-form-urlencoded' }),
      env,
    );
    expect(response.status).toBe(415);
  });

  it('rejects oversized bodies with 413 before parsing', async () => {
    const huge = JSON.stringify({
      ...validPayload,
      details: 'x'.repeat(20_000),
    });
    const response = await handleInquiryRequest(post(huge), env);
    expect(response.status).toBe(413);
  });

  it('rejects malformed JSON with a localized message', async () => {
    const response = await handleInquiryRequest(post('{"lang":"fa", oops'), env);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(getDictionary('fa').validation.errBadJson);
  });

  it('rejects malformed JSON with the English message by default', async () => {
    const response = await handleInquiryRequest(post('{nope'), env);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe(getDictionary('en').validation.errBadJson);
  });
});

describe('handleInquiryRequest — response hygiene', () => {
  it('sets no-store, nosniff and JSON content type', async () => {
    const { transport } = makeTransport();
    const response = await handleInquiryRequest(post(validPayload), env, {
      transport,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});

describe('handleInquiryRequest — end to end', () => {
  it('accepts a valid submission and forwards it to the transport', async () => {
    const { transport, sent } = makeTransport();
    const response = await handleInquiryRequest(post(validPayload), env, {
      transport,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.message).toBe(getDictionary('en').status.successBody);
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('persianbearstudio@gmail.com');
  });

  it('returns field errors for an invalid submission', async () => {
    const { transport, sent } = makeTransport();
    const response = await handleInquiryRequest(
      post({ lang: 'en', fullName: '', email: 'bad' }),
      env,
      { transport },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.errors.fullName).toBe(getDictionary('en').validation.errRequired);
    expect(sent.length).toBe(0);
  });

  it('uses cf-connecting-ip for rate limiting', async () => {
    const { transport } = makeTransport();
    for (let i = 0; i < 5; i += 1) {
      const r = await handleInquiryRequest(
        post({ ...validPayload, description: `Inquiry number ${i} for the suite.` }),
        env,
        { transport, clientIp: '203.0.113.7' },
      );
      expect(r.status).toBe(200);
    }
    const limited = await handleInquiryRequest(post(validPayload), env, {
      transport,
      clientIp: '203.0.113.7',
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toMatch(/^\d+$/);
  });
});

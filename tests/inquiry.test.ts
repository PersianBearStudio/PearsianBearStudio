import { beforeEach, describe, expect, it } from 'vitest';
import { handleInquirySubmission, DEFAULT_INQUIRY_DESTINATION } from '../src/lib/inquiry';
import type { EmailTransport, OutgoingEmail, SendResult } from '../src/lib/email/transport';
import { resetAbuseState } from '../src/lib/ratelimit';
import { getDictionary } from '../src/i18n';

/**
 * Integration tests for the submission flow with a recording transport:
 * success, validation errors, honeypot, rate limiting, duplicate
 * handling, provider failures and unconfigured environments.
 */

function makeFakeTransport(
  behavior?: (email: OutgoingEmail) => SendResult,
) {
  const sent: OutgoingEmail[] = [];
  const transport: EmailTransport = {
    name: 'fake',
    send: async (email) => {
      sent.push(email);
      return behavior ? behavior(email) : { accepted: true };
    },
  };
  return { transport, sent };
}

const validPayload = {
  lang: 'en',
  fullName: 'Sara Ahmadi',
  email: 'sara@example.com',
  projectType: 'business-website',
  description: 'A clean website for our ceramics studio.',
};

const env = {
  INQUIRY_DESTINATION: 'persianbearstudio@gmail.com',
  EMAIL_FROM: 'PersianBearStudio <inquiries@example.com>',
};

beforeEach(() => {
  resetAbuseState();
});

describe('handleInquirySubmission — success path', () => {
  it('sends exactly one notification to the official inbox', async () => {
    const { transport, sent } = makeFakeTransport();
    const result = await handleInquirySubmission(validPayload, {
      env,
      clientIp: '203.0.113.10',
      transport,
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe(DEFAULT_INQUIRY_DESTINATION);
    expect(sent[0].replyTo).toBe('sara@example.com');
    expect(sent[0].text).toContain('A clean website for our ceramics studio.');
  });

  it('localises the success message for Persian submissions', async () => {
    const { transport } = makeFakeTransport();
    const result = await handleInquirySubmission(
      { ...validPayload, lang: 'fa' },
      { env, clientIp: '203.0.113.11', transport },
    );
    expect(result.body.message).toBe(getDictionary('fa').status.successBody);
  });

  it('localises the success message for English submissions', async () => {
    const { transport } = makeFakeTransport();
    const result = await handleInquirySubmission(validPayload, {
      env,
      clientIp: '203.0.113.12',
      transport,
    });
    expect(result.body.message).toBe(getDictionary('en').status.successBody);
  });
});

describe('handleInquirySubmission — validation', () => {
  it('returns 400 with per-field localized errors', async () => {
    const { transport, sent } = makeFakeTransport();
    const result = await handleInquirySubmission(
      {
        lang: 'en',
        fullName: '',
        email: 'broken',
        projectType: 'nope',
        description: 'x',
      },
      { env, clientIp: '198.51.100.1', transport },
    );

    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
    expect(result.body.errors?.fullName).toBe(
      getDictionary('en').validation.errRequired,
    );
    expect(result.body.errors?.email).toBe(
      getDictionary('en').validation.errEmail,
    );
    expect(result.body.errors?.projectType).toBe(
      getDictionary('en').validation.errSelect,
    );
    expect(result.body.errors?.description).toBe(
      getDictionary('en').validation.errTooShort.replace('{min}', '10'),
    );
    expect(sent.length).toBe(0);
  });

  it('renders field errors in Persian when lang=fa', async () => {
    const { transport } = makeFakeTransport();
    const result = await handleInquirySubmission(
      { lang: 'fa', email: 'nope' },
      { env, clientIp: '198.51.100.2', transport },
    );
    expect(result.status).toBe(400);
    expect(result.body.errors?.email).toBe(
      getDictionary('fa').validation.errEmail,
    );
    expect(result.body.message).toBe(getDictionary('fa').validation.errUnexpected);
  });
});

describe('handleInquirySubmission — honeypot', () => {
  it('answers success but sends nothing', async () => {
    const { transport, sent } = makeFakeTransport();
    const result = await handleInquirySubmission(
      { ...validPayload, website: 'http://spam.example' },
      { env, clientIp: '198.51.100.3', transport },
    );

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(sent.length).toBe(0);
  });
});

describe('handleInquirySubmission — rate limiting', () => {
  it('allows 5 submissions per IP then answers 429 with retryAfter', async () => {
    const { transport } = makeFakeTransport();
    const deps = { env, clientIp: '192.0.2.50', transport };

    for (let i = 0; i < 5; i += 1) {
      const result = await handleInquirySubmission(
        { ...validPayload, description: `Inquiry number ${i}.` },
        deps,
      );
      expect(result.status).toBe(200);
    }

    const sixth = await handleInquirySubmission(
      { ...validPayload, description: 'Inquiry number 6.' },
      deps,
    );
    expect(sixth.status).toBe(429);
    expect(sixth.body.ok).toBe(false);
    expect(sixth.body.retryAfter).toBeGreaterThan(0);
    expect(sixth.body.retryAfter).toBeLessThanOrEqual(600);
    expect(sixth.body.message).toBe(
      getDictionary('en').validation.errRateLimited.replace(
        '{seconds}',
        String(sixth.body.retryAfter),
      ),
    );
  });

  it('tracks separate IPs independently', async () => {
    const { transport } = makeFakeTransport();
    for (let i = 0; i < 5; i += 1) {
      await handleInquirySubmission(
        { ...validPayload, description: `A ${i}` },
        { env, clientIp: '192.0.2.1', transport },
      );
    }
    const other = await handleInquirySubmission(validPayload, {
      env,
      clientIp: '192.0.2.2',
      transport,
    });
    expect(other.status).toBe(200);
  });
});

describe('handleInquirySubmission — duplicate submissions', () => {
  it('treats an identical resend within 60 s as idempotent success', async () => {
    const { transport, sent } = makeFakeTransport();
    const deps = { env, clientIp: '203.0.113.99', transport };

    const first = await handleInquirySubmission(validPayload, deps);
    const second = await handleInquirySubmission(validPayload, deps);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.ok).toBe(true);
    expect(sent.length).toBe(1); // still exactly one e-mail
  });

  it('allows a retry after a failed send', async () => {
    let fail = true;
    const { transport, sent } = makeFakeTransport(
      () => (fail ? { accepted: false, errorKind: 'network' as const } : { accepted: true }),
    );
    const deps = { env, clientIp: '203.0.113.100', transport };

    const first = await handleInquirySubmission(validPayload, deps);
    expect(first.status).toBe(502);

    // The duplicate guard must NOT block an immediate retry when the
    // first attempt was rejected by the provider.
    fail = false;
    const second = await handleInquirySubmission(validPayload, deps);
    expect(second.status).toBe(200);
    expect(second.body.ok).toBe(true);
    expect(sent.length).toBe(2); // two attempts recorded, second accepted
  });
});

describe('handleInquirySubmission — provider failures', () => {
  it.each(['auth', 'invalid-sender', 'rate-limit', 'network', 'unknown'] as const)(
    'returns a generic localized 502 on %s without leaking internals',
    async (errorKind) => {
      const { transport } = makeFakeTransport(() => ({
        accepted: false,
        errorKind,
      }));
      const result = await handleInquirySubmission(validPayload, {
        env,
        clientIp: '198.51.100.77',
        transport,
      });

      expect(result.status).toBe(502);
      expect(result.body.message).toBe(getDictionary('en').validation.errServer);
      const serialized = JSON.stringify(result.body);
      expect(serialized).not.toContain('api');
      expect(serialized).not.toContain('key');
      expect(serialized).not.toContain('resend');
    },
  );

  it('survives a transport that throws instead of returning', async () => {
    const transport: EmailTransport = {
      name: 'throwing',
      send: () => Promise.reject(new Error('socket hang up')),
    };
    const result = await handleInquirySubmission(validPayload, {
      env,
      clientIp: '198.51.100.78',
      transport,
    });
    expect(result.status).toBe(502);
    expect(result.body.message).toBe(getDictionary('en').validation.errServer);
  });
});

describe('handleInquirySubmission — configuration states', () => {
  it('answers 503 with a localized message when no provider is configured', async () => {
    const result = await handleInquirySubmission(validPayload, {
      env: {},
      clientIp: '198.51.100.90',
    });
    expect(result.status).toBe(503);
    expect(result.body.ok).toBe(false);
    expect(result.body.message).toBe(getDictionary('en').validation.errNotConfigured);
  });

  it('answers 503 when EMAIL_PROVIDER=resend but the key is missing', async () => {
    const result = await handleInquirySubmission(validPayload, {
      env: { EMAIL_PROVIDER: 'resend', EMAIL_FROM: 'x@example.com' },
      clientIp: '198.51.100.91',
    });
    expect(result.status).toBe(503);
  });

  it('answers 503 when EMAIL_PROVIDER=resend but EMAIL_FROM is missing', async () => {
    const result = await handleInquirySubmission(validPayload, {
      env: { EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_test' },
      clientIp: '198.51.100.92',
    });
    expect(result.status).toBe(503);
  });

  it('answers 503 for an unknown provider name', async () => {
    const result = await handleInquirySubmission(validPayload, {
      env: { EMAIL_PROVIDER: 'carrier-pigeon' },
      clientIp: '198.51.100.93',
    });
    expect(result.status).toBe(503);
  });

  it('falls back to the official destination when the env var is empty', async () => {
    const { transport, sent } = makeFakeTransport();
    const result = await handleInquirySubmission(validPayload, {
      env: { EMAIL_FROM: 'x@example.com' },
      clientIp: '198.51.100.94',
      transport,
    });
    expect(result.status).toBe(200);
    expect(sent[0].to).toBe('persianbearstudio@gmail.com');
  });
});

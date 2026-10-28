import { describe, expect, it } from 'vitest';
import { validateInquiry } from '../src/lib/validation';

/**
 * The shared rule-set is the heart of the system: the browser runs it
 * for instant feedback and the server re-runs it as the authority.
 * These cases mirror the studio's acceptance list: required fields,
 * e-mail/URL formats, select whitelists, length caps, Persian input,
 * header-injection payloads and normalisation behaviour.
 */

const validBase = {
  lang: 'en',
  fullName: 'Sara Ahmadi',
  email: 'sara.ahmadi@example.com',
  projectType: 'ecommerce-website',
  description: 'We need a small online store for handmade ceramics.',
};

describe('validateInquiry — happy paths', () => {
  it('accepts a complete English submission', () => {
    const result = validateInquiry({
      ...validBase,
      company: 'Ceramics Co',
      audience: 'Gift shoppers in Tehran',
      websiteUrl: 'https://ceramics.example.com',
      timeframe: '1-3-months',
      budget: '500-1500',
      problem: 'No online sales channel',
      details: 'We like minimal design.\nPayment gateway is a must.',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe('sara.ahmadi@example.com');
      expect(result.data.timeframe).toBe('1-3-months');
      expect(result.data.budget).toBe('500-1500');
    }
  });

  it('accepts a minimal submission with only required fields', () => {
    const result = validateInquiry(validBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.company).toBe('');
      expect(result.data.websiteUrl).toBe('');
      expect(result.data.timeframe).toBe('');
      expect(result.data.budget).toBe('');
    }
  });

  it('accepts Persian text and preserves ZWNJ (نیم‌فاصله)', () => {
    const withZwnj = 'می‌خواهیم یک فروشگاه اینترنتی برای سرامیک بسازیم.';
    const result = validateInquiry({
      lang: 'fa',
      fullName: 'سارا احمدی',
      email: 'sara@example.com',
      projectType: 'ecommerce-website',
      description: withZwnj,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.description).toContain('\u200C'); // ZWNJ preserved
      expect(result.data.lang).toBe('fa');
    }
  });

  it('accepts international e-mail addresses (IDN domain)', () => {
    const result = validateInquiry({
      ...validBase,
      email: 'ömer@ünicode.example',
    });
    expect(result.ok).toBe(true);
  });

  it('accepts plus-addressed e-mail and lowercases ASCII only', () => {
    const result = validateInquiry({
      ...validBase,
      email: 'Sara.Ahmadi+Tag@Sub.Example.COM',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe('sara.ahmadi+tag@sub.example.com');
    }
  });

  it('auto-prefixes https:// to scheme-less URLs', () => {
    const result = validateInquiry({
      ...validBase,
      websiteUrl: 'ceramics.example.com/shop',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.websiteUrl).toBe('https://ceramics.example.com/shop');
    }
  });

  it('normalises whitespace: trims edges, collapses runs, keeps paragraphs', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: '  Sara   Ahmadi  ',
      description: 'First line.\n\n\n\nSecond line after blank lines.',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe('Sara Ahmadi');
      expect(result.data.description).toBe(
        'First line.\n\nSecond line after blank lines.',
      );
    }
  });
});

describe('validateInquiry — required fields', () => {
  it('reports every missing required field', () => {
    const result = validateInquiry({ lang: 'en' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fullName?.key).toBe('errRequired');
      expect(result.errors.email?.key).toBe('errRequired');
      expect(result.errors.projectType?.key).toBe('errRequired');
      expect(result.errors.description?.key).toBe('errRequired');
    }
  });

  it('rejects whitespace-only required fields', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: '   ',
      description: '\n\n',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fullName?.key).toBe('errRequired');
      expect(result.errors.description?.key).toBe('errRequired');
    }
  });

  it('rejects symbol-only names and digit-only descriptions as meaningless', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: '!!!',
      description: '12345678901234567890',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fullName?.key).toBe('errMeaningful');
      expect(result.errors.description?.key).toBe('errMeaningful');
    }
  });
});

describe('validateInquiry — e-mail rules', () => {
  const badEmails = [
    'not-an-email',
    'a@b',
    'a b@c.com',
    'a@b@c.com',
    'a@b.com\r\nBcc: evil@example.com', // header injection attempt
    'a@b.com\nBcc: evil@example.com',
    '.dotstart@example.com',
    'dotend.@example.com',
    'double..dot@example.com',
    'x'.repeat(250) + '@example.com',
  ];

  for (const email of badEmails) {
    it(`rejects "${email.replace(/[\r\n]/g, '\\n').slice(0, 40)}"`, () => {
      const result = validateInquiry({ ...validBase, email });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.email?.key).toBe('errEmail');
      }
    });
  }
});

describe('validateInquiry — URL rules', () => {
  it.each([
    'not a url',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://',
    'http://.',
  ])('rejects unsupported URL %s', (url) => {
    const result = validateInquiry({ ...validBase, websiteUrl: url });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.websiteUrl?.key).toBe('errUrl');
    }
  });

  it('rejects URLs beyond the length cap', () => {
    const result = validateInquiry({
      ...validBase,
      websiteUrl: `https://example.com/${'a'.repeat(2100)}`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.websiteUrl?.key).toBe('errUrl');
    }
  });

  it('accepts http, https and localhost URLs', () => {
    for (const url of ['http://example.com', 'https://a.b/c?d=1', 'http://localhost:3000']) {
      expect(validateInquiry({ ...validBase, websiteUrl: url }).ok).toBe(true);
    }
  });
});

describe('validateInquiry — select whitelists', () => {
  it('rejects an unsupported project type', () => {
    const result = validateInquiry({
      ...validBase,
      projectType: 'free-money-please',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.projectType?.key).toBe('errSelect');
    }
  });

  it('rejects an unsupported budget value', () => {
    const result = validateInquiry({ ...validBase, budget: '1M-dollars' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.budget?.key).toBe('errSelect');
    }
  });

  it('rejects an unsupported timeframe value', () => {
    const result = validateInquiry({ ...validBase, timeframe: 'tomorrow' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.timeframe?.key).toBe('errSelect');
    }
  });

  it('accepts every documented option value', () => {
    const projectTypes = [
      'business-website', 'ecommerce-website', 'landing-page',
      'website-redesign', 'web-application', 'website-maintenance', 'other',
    ];
    const timeframes = ['asap', '1-3-months', '3-6-months', '6-plus-months', 'flexible'];
    const budgets = ['under-500', '500-1500', '1500-3000', '3000-6000', '6000-plus', 'not-sure'];
    for (const projectType of projectTypes) {
      expect(validateInquiry({ ...validBase, projectType }).ok).toBe(true);
    }
    for (const timeframe of timeframes) {
      expect(validateInquiry({ ...validBase, timeframe }).ok).toBe(true);
    }
    for (const budget of budgets) {
      expect(validateInquiry({ ...validBase, budget }).ok).toBe(true);
    }
  });
});

describe('validateInquiry — length limits', () => {
  it('rejects an over-long full name with the cap in params', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: 'a'.repeat(101),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fullName?.key).toBe('errTooLong');
      expect(result.errors.fullName?.params?.max).toBe(100);
    }
  });

  it('rejects a too-short description', () => {
    const result = validateInquiry({
      ...validBase,
      description: 'too short',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description?.key).toBe('errTooShort');
      expect(result.errors.description?.params?.min).toBe(10);
    }
  });

  it('rejects over-long optional fields', () => {
    const result = validateInquiry({
      ...validBase,
      company: 'c'.repeat(101),
      audience: 'a'.repeat(301),
      problem: 'p'.repeat(2001),
      details: 'd'.repeat(5001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.company?.key).toBe('errTooLong');
      expect(result.errors.audience?.key).toBe('errTooLong');
      expect(result.errors.problem?.key).toBe('errTooLong');
      expect(result.errors.details?.key).toBe('errTooLong');
    }
  });
});

describe('validateInquiry — hostile payloads', () => {
  it('rejects array and primitive payloads', () => {
    expect(validateInquiry([]).ok).toBe(false);
    expect(validateInquiry('hello').ok).toBe(false);
    expect(validateInquiry(42).ok).toBe(false);
    expect(validateInquiry(null).ok).toBe(false);
  });

  it('rejects non-string JSON field values', () => {
    const result = validateInquiry({
      ...validBase,
      email: 12345,
      description: { html: '<b>x</b>' },
    });
    expect(result.ok).toBe(false);
  });

  it('strips control characters and invisible bidi/format characters', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: 'Sara\u0000Ahmadi\u200B\u202ESuffix',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe('SaraAhmadiSuffix');
    }
  });

  it('collapses newlines inside single-line fields', () => {
    const result = validateInquiry({
      ...validBase,
      fullName: 'Sara\r\nAhmadi',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe('Sara Ahmadi');
    }
  });

  it('flags a filled honeypot so the handler can drop it silently', () => {
    const result = validateInquiry({ ...validBase, website: 'http://spam.example' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.website).toBe('http://spam.example');
    }
  });

  it('falls back to English for an unknown language', () => {
    const result = validateInquiry({ ...validBase, lang: 'de' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.lang).toBe('en');
    }
  });

  it('ignores unknown extra properties', () => {
    const result = validateInquiry({
      ...validBase,
      admin: true,
      role: 'superuser',
    });
    expect(result.ok).toBe(true);
  });
});

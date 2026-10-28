import { describe, expect, it } from 'vitest';
import { composeInquiryEmail } from '../src/lib/email/compose';
import { validateInquiry } from '../src/lib/validation';
import { getDictionary } from '../src/i18n';

/**
 * The composer turns a validated inquiry into the studio notification.
 * The critical property: visitor content can NEVER inject HTML into
 * the message, and header values can never carry CR/LF.
 */

function validate(base: Record<string, unknown>) {
  const result = validateInquiry(base);
  if (!result.ok) throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  return result.data;
}

const base = {
  lang: 'en',
  fullName: 'Sara Ahmadi',
  email: 'sara@example.com',
  projectType: 'business-website',
  description: 'A clean website for our studio.',
};

describe('composeInquiryEmail', () => {
  it('targets the studio inbox and uses the visitor as reply-to', () => {
    const email = composeInquiryEmail(validate(base), {
      to: 'persianbearstudio@gmail.com',
      from: 'PersianBearStudio <inquiries@example.com>',
      now: new Date('2026-10-28T12:00:00Z'),
    });
    expect(email.to).toBe('persianbearstudio@gmail.com');
    expect(email.replyTo).toBe('sara@example.com');
    expect(email.from).toBe('PersianBearStudio <inquiries@example.com>');
  });

  it('escapes HTML in every visitor-supplied value', () => {
    const inquiry = validate({
      ...base,
      fullName: '<script>alert(1)</script>',
      company: '"><img src=x onerror=alert(2)>',
      description: 'Normal text\n<b>bold attempt</b> & "quotes" \'single\'',
      websiteUrl: 'https://example.com/<path>',
    });
    const email = composeInquiryEmail(inquiry, {
      to: 'persianbearstudio@gmail.com',
      from: 'PersianBearStudio <inquiries@example.com>',
    });

    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).not.toContain('<script');
    expect(email.html).not.toContain('<img');
    expect(email.html).not.toContain('<b>');
    expect(email.html).toContain('&amp;');

    // Plain-text part keeps the raw content (no markup to escape).
    expect(email.text).toContain('<script>alert(1)</script>');
  });

  it('renders URLs as plain text, never as anchors', () => {
    const inquiry = validate({
      ...base,
      websiteUrl: 'https://phishing.example/login',
    });
    const email = composeInquiryEmail(inquiry, {
      to: 'persianbearstudio@gmail.com',
      from: 'x@example.com',
    });
    expect(email.html).not.toMatch(/<a\s/i);
    expect(email.html).toContain('https://phishing.example/login');
  });

  it('includes submission time in UTC and Tehran time', () => {
    const email = composeInquiryEmail(validate(base), {
      to: 'persianbearstudio@gmail.com',
      from: 'x@example.com',
      now: new Date('2026-10-28T12:00:00Z'),
    });
    expect(email.text).toContain('2026-10-28T12:00:00.000Z');
    expect(email.text).toContain('Tehran');
  });

  it('includes optional sections only when provided', () => {
    const minimal = composeInquiryEmail(validate(base), {
      to: 'x@example.com',
      from: 'y@example.com',
    });
    expect(minimal.text).not.toContain('Company / brand');
    expect(minimal.text).not.toContain('Current website');

    const full = composeInquiryEmail(
      validate({
        ...base,
        company: 'Ceramics Co',
        audience: 'Gift shoppers',
        websiteUrl: 'https://ceramics.example.com',
        timeframe: '1-3-months',
        budget: 'not-sure',
        problem: 'No sales channel',
        details: 'We like minimal design.',
      }),
      { to: 'x@example.com', from: 'y@example.com' },
    );
    expect(full.text).toContain('Company / brand');
    expect(full.text).toContain('Ceramics Co');
    expect(full.text).toContain('Gift shoppers');
    expect(full.text).toContain('https://ceramics.example.com');
    expect(full.text).toContain('Launch timeframe');
    expect(full.text).toContain('Estimated budget');
    expect(full.text).toContain('Not sure yet');
    expect(full.text).toContain('No sales channel');
    expect(full.text).toContain('We like minimal design.');
  });

  it('shows bilingual option labels for Persian submissions', () => {
    const email = composeInquiryEmail(
      validate({
        ...base,
        lang: 'fa',
        projectType: 'ecommerce-website',
        timeframe: 'asap',
      }),
      { to: 'x@example.com', from: 'y@example.com' },
    );
    const en = getDictionary('en');
    const fa = getDictionary('fa');
    expect(email.text).toContain(en.options.projectType['ecommerce-website']);
    expect(email.text).toContain(fa.options.projectType['ecommerce-website']);
    expect(email.text).toContain(fa.options.timeframe.asap);
  });

  it('builds a header-safe subject with type and name', () => {
    const email = composeInquiryEmail(validate(base), {
      to: 'x@example.com',
      from: 'y@example.com',
    });
    expect(email.subject).toBe('[Website Inquiry] Business Website — Sara Ahmadi');
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});

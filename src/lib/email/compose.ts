/**
 * PersianBearStudio — notification composition.
 *
 * Turns a validated inquiry into ONE readable notification e-mail for
 * the studio inbox. Security properties:
 *
 *  - Every header value (subject, to, from, reply-to) passes through
 *    stripHeaderUnsafe(), so CR/LF and control characters cannot
 *    perform e-mail header injection even if some layer upstream were
 *    relaxed.
 *  - Every piece of visitor content is HTML-escaped (escapeHtml) before
 *    it enters the HTML part, so submissions cannot inject markup,
 *    scripts or phishing links into the notification.
 *  - Visitor URLs are rendered as plain escaped text, never as <a>
 *    links, so a crafted URL cannot turn into a clickable lure.
 *
 * Readability: labelled sections, optional sections omitted when empty,
 * submission time in both UTC and Tehran local time.
 */

import { getDictionary } from '../../i18n';
import { escapeHtml, stripHeaderUnsafe } from '../sanitize';
import type { NormalizedInquiry } from '../types';
import type { OutgoingEmail } from './transport';

const TEHRAN_TZ = 'Asia/Tehran';

function formatTehranTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: TEHRAN_TZ,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return '(time unavailable)';
  }
}

/** Short label used in the subject line, header-safe. */
export function subjectFor(inquiry: NormalizedInquiry): string {
  const en = getDictionary('en');
  const typeLabel = en.options.projectType[inquiry.projectType];
  return stripHeaderUnsafe(
    `[Website Inquiry] ${typeLabel} — ${inquiry.fullName}`,
  );
}

interface Section {
  label: string;
  value: string;
}

/** Builds the ordered list of label/value sections for the e-mail. */
function buildSections(inquiry: NormalizedInquiry, date: Date): Section[] {
  const en = getDictionary('en');
  const fa = inquiry.lang === 'fa' ? getDictionary('fa') : null;

  const typeLabel = fa
    ? `${en.options.projectType[inquiry.projectType]} / ${fa.options.projectType[inquiry.projectType]}`
    : en.options.projectType[inquiry.projectType];

  const sections: Section[] = [
    { label: 'Submitted (UTC)', value: date.toISOString() },
    { label: 'Submitted (Tehran)', value: formatTehranTime(date) },
    { label: 'Client name', value: inquiry.fullName },
    { label: 'Client email', value: inquiry.email },
    { label: 'Project type', value: typeLabel },
    { label: 'Project description', value: inquiry.description },
  ];

  if (inquiry.company !== '') {
    sections.push({ label: 'Company / brand', value: inquiry.company });
  }
  if (inquiry.audience !== '') {
    sections.push({ label: 'Target audience', value: inquiry.audience });
  }
  if (inquiry.websiteUrl !== '') {
    sections.push({ label: 'Current website', value: inquiry.websiteUrl });
  }
  if (inquiry.timeframe !== '') {
    const tf = fa
      ? `${en.options.timeframe[inquiry.timeframe]} / ${fa.options.timeframe[inquiry.timeframe]}`
      : en.options.timeframe[inquiry.timeframe];
    sections.push({ label: 'Launch timeframe', value: tf });
  }
  if (inquiry.budget !== '') {
    const b = fa
      ? `${en.options.budget[inquiry.budget]} / ${fa.options.budget[inquiry.budget]}`
      : en.options.budget[inquiry.budget];
    sections.push({ label: 'Estimated budget', value: b });
  }
  if (inquiry.problem !== '') {
    sections.push({ label: 'Main problem / goal', value: inquiry.problem });
  }
  if (inquiry.details !== '') {
    sections.push({ label: 'Additional details', value: inquiry.details });
  }

  sections.push({
    label: 'Form language',
    value: inquiry.lang === 'fa' ? 'Persian (fa)' : 'English (en)',
  });

  return sections;
}

function buildTextBody(sections: Section[]): string {
  return sections
    .map((s) => `${s.label}: ${s.value}`)
    .join('\n\n');
}

function htmlLineBreaks(escaped: string): string {
  return escaped
    .replace(/\n/g, '<br>')
    .replace(/ {2,}/g, (run) => run.replace(/ /g, '&nbsp;'));
}

function buildHtmlBody(sections: Section[]): string {
  const rows = sections
    .map(
      (s) =>
        `      <tr>` +
        `<th style="text-align:left;vertical-align:top;padding:8px 16px 8px 0;width:180px;color:#6b6257;font-weight:600;white-space:nowrap">${escapeHtml(
          s.label,
        )}</th>` +
        `<td style="text-align:left;vertical-align:top;padding:8px 0;color:#241f1a">${htmlLineBreaks(
          escapeHtml(s.value),
        )}</td></tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f2ec;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5ddd0;border-radius:8px">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #e5ddd0">
          <div style="font-size:16px;font-weight:700;color:#241f1a">New project inquiry</div>
          <div style="font-size:12px;color:#8a7f70">Sent from the PersianBearStudio website contact form</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6">
${rows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export interface ComposeOptions {
  /** Destination inbox, e.g. persianbearstudio@gmail.com */
  to: string;
  /** Verified sender, e.g. "PersianBearStudio <inquiries@example.com>" */
  from: string;
  now?: Date;
}

/** Composes the complete notification e-mail for a validated inquiry. */
export function composeInquiryEmail(
  inquiry: NormalizedInquiry,
  options: ComposeOptions,
): OutgoingEmail {
  const date = options.now ?? new Date();
  const sections = buildSections(inquiry, date);

  return {
    to: stripHeaderUnsafe(options.to),
    from: stripHeaderUnsafe(options.from),
    replyTo: stripHeaderUnsafe(inquiry.email),
    subject: subjectFor(inquiry),
    text: buildTextBody(sections),
    html: buildHtmlBody(sections),
  };
}

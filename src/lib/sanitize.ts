/**
 * PersianBearStudio — input normalisation utilities.
 *
 * Goals (in order):
 *  1. Remove characters that could smuggle control data into e-mail
 *     headers or downstream systems (CR/LF, NUL, other C0 controls).
 *  2. Strip invisible / bidi-override characters that are commonly used
 *     for spoofing — while PRESERVING U+200C (ZWNJ) and U+200D (ZWJ),
 *     which are legitimate and frequent in written Persian
 *     (e.g. «می‌شود», «نام‌گذاری») and in some emoji sequences.
 *  3. Trim and collapse redundant whitespace so length checks and
 *     de-duplication behave predictably.
 *
 * Every field passes through these helpers BEFORE any validation rule
 * runs, on both the client and the server.
 */

/**
 * Invisible and directional-format characters removed from all input.
 * Deliberately excludes U+200C (ZWNJ) and U+200D (ZWJ) — see header.
 */
const INVISIBLE_CHARS = /[\u00AD\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFFF9-\uFFFB]/g;

/** C0 control characters and DEL, except TAB (\t), LF (\n) and CR (\r). */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Horizontal whitespace that gets collapsed inside single-line fields. */
const HORIZONTAL_WS = /[ \t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

/**
 * Normalise a single-line value (names, e-mails, select values…).
 * All whitespace — including newlines — collapses to single spaces.
 */
export function normalizeSingleLine(value: string): string {
  return value
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\r\n?/g, ' ')
    .replace(/\n/g, ' ')
    .replace(HORIZONTAL_WS, ' ')
    .trim();
}

/**
 * Normalise a multi-line value (descriptions, additional details…).
 * Line breaks are preserved but capped: at most one blank line in a row,
 * no trailing/leading blank lines, no control characters.
 */
export function normalizeMultiLine(value: string): string {
  const cleaned = value
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\r\n?/g, '\n');

  const lines = cleaned
    .split('\n')
    .map((line) => line.replace(HORIZONTAL_WS, ' ').trim());

  // Collapse 3+ consecutive newlines down to exactly one blank line,
  // and drop blank lines at the start/end of the value.
  const collapsed: string[] = [];
  let previousBlank = false;
  for (const line of lines) {
    const isBlank = line === '';
    if (isBlank && previousBlank) continue;
    if (isBlank && collapsed.length === 0) continue;
    collapsed.push(line);
    previousBlank = isBlank;
  }
  while (collapsed.length > 0 && collapsed[collapsed.length - 1] === '') {
    collapsed.pop();
  }

  return collapsed.join('\n');
}

/**
 * Header-safe variant for values that flow into e-mail headers
 * (subject, reply-to, destination, sender). Removes CR/LF and every
 * remaining control character so header injection is impossible,
 * regardless of what earlier layers allowed through.
 */
export function stripHeaderUnsafe(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, '').trim();
}

/**
 * Escape text for safe inclusion in HTML e-mail bodies. Applied to
 * EVERY piece of visitor-provided content before it touches the HTML
 * part of the notification, so submissions cannot inject markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

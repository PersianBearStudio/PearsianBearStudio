/**
 * PersianBearStudio — inquiry validation.
 *
 * ONE rule-set for both sides:
 *  - the browser runs it before sending, for immediate feedback;
 *  - the server runs it again on the decoded JSON, as the authority.
 *
 * Design constraints:
 *  - Never reject legitimate names, Persian/Arabic text, or
 *    international e-mail addresses (IDN domains included).
 *  - Reject control characters, header-injection payloads, unsupported
 *    select values and absurd sizes.
 *  - Normalise (trim, collapse whitespace) BEFORE checking, so the
 *    stored/sent value is the clean one.
 *  - Errors are i18n KEYS (see src/i18n/*), so both sides render the
 *    exact same message in the visitor's language.
 */

import {
  BUDGETS,
  LIMITS,
  PROJECT_TYPES,
  TIMEFRAMES,
  type Budget,
  type FieldErrors,
  type ProjectType,
  type SupportedLang,
  type Timeframe,
  type ValidationResult,
} from './types';
import { normalizeMultiLine, normalizeSingleLine } from './sanitize';

/* ── E-mail validation ───────────────────────────────────────────── */

/**
 * Pragmatic e-mail pattern:
 *  - local part: 1–64 chars from letters/digits (any script) and the
 *    RFC 5322 "atext" specials — no spaces, no quotes, no controls;
 *  - domain: dot-separated labels of letters/digits/hyphen, at least
 *    two labels, each ≤ 63 chars — accepts international domains.
 * Total length is checked separately (≤ 254).
 * The character classes structurally exclude CR/LF and spaces, which
 * is what makes e-mail header injection impossible downstream.
 */
const EMAIL_RE =
  /^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~.-]{1,64}@[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?)+$/u;

/** A local part may not start/end with a dot or contain "…" sequences. */
function looksLikeReasonableEmail(value: string): boolean {
  if (value.length === 0 || value.length > LIMITS.email.max) return false;
  if (!EMAIL_RE.test(value)) return false;
  const [local] = value.split('@');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }
  return true;
}

/* ── URL validation ──────────────────────────────────────────────── */

/**
 * Accepts http/https URLs only. Missing scheme is tolerated by
 * prefixing https:// (visitors often type "example.com"), which keeps
 * legitimate submissions flowing while still normalising the value.
 */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isValidHttpUrl(value: string): boolean {
  if (value.length === 0 || value.length > LIMITS.websiteUrl.max) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  // Require a real, multi-label hostname ("example.com", "sub.example"
  // or an explicit localhost) — not ".", "example." or empty strings.
  const host = parsed.hostname;
  return host === 'localhost' || /^[^.]+\.[^.]+/.test(host);
}

/* ── Meaningful content ──────────────────────────────────────────── */

/** True when the text contains at least one letter of ANY script. */
function hasLetters(value: string): boolean {
  return /\p{L}/u.test(value);
}

/* ── Field readers ───────────────────────────────────────────────── */

/** Coerces an unknown JSON value into a string, `undefined` (absent)
 *  or `null` (present but not a string — treated as invalid input). */
function readString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  // Non-string JSON types (numbers, booleans, objects, arrays) are
  // treated as an invalid value rather than being silently stringified.
  return null;
}

/* ── Main entry point ────────────────────────────────────────────── */

/**
 * Validates and normalises a raw submission object (as decoded from
 * JSON on the server, or read from the form on the client).
 * Unknown properties are ignored.
 */
export function validateInquiry(input: unknown): ValidationResult {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { description: { key: 'errUnexpected' } } };
  }
  const raw = input as Record<string, unknown>;
  const errors: FieldErrors = {};

  /* Language — falls back to English rather than failing. */
  const rawLang = readString(raw.lang) ?? 'en';
  const lang: SupportedLang = rawLang === 'fa' ? 'fa' : 'en';

  const str = (key: string): string | null | undefined => readString(raw[key]);
  const typeError = (key: string): boolean => str(key) === null;

  /* ── Required fields ─────────────────────────────────────────── */

  const fullName = normalizeSingleLine(str('fullName') ?? '');
  if (fullName === '') {
    errors.fullName = { key: 'errRequired' };
  } else if (fullName.length < LIMITS.fullName.min) {
    errors.fullName = { key: 'errTooShort', params: { min: LIMITS.fullName.min } };
  } else if (fullName.length > LIMITS.fullName.max) {
    errors.fullName = { key: 'errTooLong', params: { max: LIMITS.fullName.max } };
  } else if (!hasLetters(fullName)) {
    errors.fullName = { key: 'errMeaningful' };
  }

  /* Lowercase ASCII only — a full Unicode toLowerCase() would turn
     e.g. Turkish "İ" into "i" + combining dot, breaking the address. */
  const email = normalizeSingleLine(str('email') ?? '').replace(
    /[A-Z]/g,
    (c) => c.toLowerCase(),
  );
  if (email === '') {
    errors.email = { key: 'errRequired' };
  } else if (!looksLikeReasonableEmail(email)) {
    errors.email = { key: 'errEmail' };
  }

  const projectTypeRaw = normalizeSingleLine(str('projectType') ?? '');
  if (projectTypeRaw === '') {
    errors.projectType = { key: 'errRequired' };
  } else if (!(PROJECT_TYPES as readonly string[]).includes(projectTypeRaw)) {
    errors.projectType = { key: 'errSelect' };
  }
  const projectType = projectTypeRaw as ProjectType;

  const description = normalizeMultiLine(str('description') ?? '');
  if (description === '') {
    errors.description = { key: 'errRequired' };
  } else if (description.length < LIMITS.description.min) {
    errors.description = {
      key: 'errTooShort',
      params: { min: LIMITS.description.min },
    };
  } else if (description.length > LIMITS.description.max) {
    errors.description = {
      key: 'errTooLong',
      params: { max: LIMITS.description.max },
    };
  } else if (!hasLetters(description)) {
    // A digits/symbols-only string is not a meaningful description.
    errors.description = { key: 'errMeaningful' };
  }

  /* ── Optional fields ─────────────────────────────────────────── */

  const company = normalizeSingleLine(str('company') ?? '');
  if (company.length > LIMITS.company.max) {
    errors.company = { key: 'errTooLong', params: { max: LIMITS.company.max } };
  }

  const audience = normalizeMultiLine(str('audience') ?? '');
  if (audience.length > LIMITS.audience.max) {
    errors.audience = { key: 'errTooLong', params: { max: LIMITS.audience.max } };
  }

  const websiteUrlRaw = str('websiteUrl');
  let websiteUrl = '';
  if (websiteUrlRaw != null) {
    const normalized = normalizeUrl(normalizeSingleLine(websiteUrlRaw));
    if (normalized !== '' && !isValidHttpUrl(normalized)) {
      errors.websiteUrl = { key: 'errUrl' };
    } else {
      websiteUrl = normalized;
    }
  }

  const timeframeRaw = normalizeSingleLine(str('timeframe') ?? '');
  let timeframe: Timeframe | '' = '';
  if (timeframeRaw !== '') {
    if (!(TIMEFRAMES as readonly string[]).includes(timeframeRaw)) {
      errors.timeframe = { key: 'errSelect' };
    } else {
      timeframe = timeframeRaw as Timeframe;
    }
  }

  const budgetRaw = normalizeSingleLine(str('budget') ?? '');
  let budget: Budget | '' = '';
  if (budgetRaw !== '') {
    if (!(BUDGETS as readonly string[]).includes(budgetRaw)) {
      errors.budget = { key: 'errSelect' };
    } else {
      budget = budgetRaw as Budget;
    }
  }

  const problem = normalizeMultiLine(str('problem') ?? '');
  if (problem.length > LIMITS.problem.max) {
    errors.problem = { key: 'errTooLong', params: { max: LIMITS.problem.max } };
  }

  const details = normalizeMultiLine(str('details') ?? '');
  if (details.length > LIMITS.details.max) {
    errors.details = { key: 'errTooLong', params: { max: LIMITS.details.max } };
  }

  /* ── Honeypot ────────────────────────────────────────────────── */

  const website = normalizeSingleLine(str('website') ?? '');

  /* ── Type-sabotage check (non-string JSON values) ────────────── */

  for (const key of [
    'fullName',
    'email',
    'projectType',
    'description',
    'company',
    'audience',
    'websiteUrl',
    'timeframe',
    'budget',
    'problem',
    'details',
    'website',
  ]) {
    if (typeError(key) && !errors[key as keyof FieldErrors]) {
      errors[key as keyof FieldErrors] = { key: 'errInvalid' };
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      lang,
      fullName,
      email,
      projectType,
      description,
      company,
      audience,
      websiteUrl,
      timeframe,
      budget,
      problem,
      details,
      website,
    },
  };
}

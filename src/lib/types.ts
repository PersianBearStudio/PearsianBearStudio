/**
 * PersianBearStudio — shared domain types.
 *
 * This module is imported by BOTH the browser (form validation) and the
 * server (API endpoint), so it must stay free of any server-only or
 * browser-only APIs. It contains types, enums and limits only.
 */

/* ── Supported languages ─────────────────────────────────────────── */

export const SUPPORTED_LANGS = ['en', 'fa'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/* ── Permitted select options (server-validated whitelists) ──────── */

export const PROJECT_TYPES = [
  'business-website',
  'ecommerce-website',
  'landing-page',
  'website-redesign',
  'web-application',
  'website-maintenance',
  'other',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TIMEFRAMES = [
  'asap',
  '1-3-months',
  '3-6-months',
  '6-plus-months',
  'flexible',
] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const BUDGETS = [
  'under-500',
  '500-1500',
  '1500-3000',
  '3000-6000',
  '6000-plus',
  'not-sure',
] as const;
export type Budget = (typeof BUDGETS)[number];

/* ── Field inventory ─────────────────────────────────────────────── */

/** All fields accepted in a submission (including the honeypot). */
export const INQUIRY_FIELDS = [
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
  /** Honeypot — must stay empty; filled values are silently dropped. */
  'website',
] as const;
export type InquiryField = (typeof INQUIRY_FIELDS)[number];

/** Fields the visitor fills in (excludes lang / honeypot plumbing). */
export type VisibleInquiryField = Exclude<InquiryField, 'website'>;

/* ── Length limits (per field, counted after normalisation) ──────── */

export const LIMITS = {
  /** Maximum accepted request body, in bytes. */
  maxBodyBytes: 16_000,
  fullName: { min: 2, max: 100 },
  email: { max: 254 },
  description: { min: 10, max: 2_000 },
  company: { max: 100 },
  audience: { max: 300 },
  websiteUrl: { max: 2_000 },
  problem: { min: 0, max: 2_000 },
  details: { min: 0, max: 5_000 },
} as const;

/* ── Normalised, validated inquiry ───────────────────────────────── */

/** Shape returned by `validateInquiry` on success. */
export interface NormalizedInquiry {
  lang: SupportedLang;
  fullName: string;
  email: string;
  projectType: ProjectType;
  description: string;
  company: string;
  audience: string;
  websiteUrl: string;
  timeframe: Timeframe | '';
  budget: Budget | '';
  problem: string;
  details: string;
  /** Honeypot content. Non-empty means "drop silently". */
  website: string;
}

/* ── Validation errors (i18n keys, rendered client- or server-side) ─ */

export const VALIDATION_ERROR_KEYS = [
  'errRequired',
  'errMeaningful',
  'errEmail',
  'errUrl',
  'errSelect',
  'errTooShort',
  'errTooLong',
  'errInvalid',
  'errUnexpected',
  'errBadJson',
  'errTooLarge',
  'errRateLimited',
  'errNotConfigured',
  'errServer',
] as const;
export type ValidationErrorKey = (typeof VALIDATION_ERROR_KEYS)[number];

/** A single field error: an i18n key plus optional interpolation params. */
export interface FieldError {
  key: ValidationErrorKey;
  params?: Record<string, string | number>;
}

/** Maps a field name to its localised error message parameters. */
export type FieldErrors = Partial<Record<InquiryField, FieldError>>;

/** Discriminated result: `data` exists exactly when ok, `errors` when not. */
export type ValidationResult =
  | { ok: true; data: NormalizedInquiry }
  | { ok: false; errors: FieldErrors };

/* ── Server environment (subset we care about) ───────────────────── */

export interface AppEnv {
  EMAIL_PROVIDER?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  INQUIRY_DESTINATION?: string;
}

/**
 * PersianBearStudio — dictionary contract.
 *
 * Every user-visible string of the inquiry system lives here, in both
 * English (src/i18n/en.ts) and Persian (src/i18n/fa.ts). Validation
 * errors are stored as KEYS (see lib/types.ts) and rendered through
 * these dictionaries on whichever side needs them, so the client and
 * the server can never disagree about wording.
 */

import type {
  Budget,
  ProjectType,
  Timeframe,
  ValidationErrorKey,
} from '../lib/types';

export interface FieldCopy {
  label: string;
  /** Short helper text shown under the control. */
  hint?: string;
  /** Example value (supplementary, never required). */
  placeholder?: string;
}

export interface Dictionary {
  /** Form heading and intro paragraph. */
  form: {
    title: string;
    intro: string;
  };
  /** Per-field labels, hints and placeholders. */
  fields: {
    fullName: FieldCopy;
    email: FieldCopy;
    projectType: FieldCopy;
    description: FieldCopy;
    company: FieldCopy;
    audience: FieldCopy;
    websiteUrl: FieldCopy;
    timeframe: FieldCopy;
    budget: FieldCopy;
    problem: FieldCopy;
    details: FieldCopy;
  };
  options: {
    selectPlaceholder: string;
    projectType: Record<ProjectType, string>;
    timeframe: Record<Timeframe, string>;
    budget: Record<Budget, string>;
  };
  /** Localised validation messages; {param} placeholders allowed. */
  validation: Record<ValidationErrorKey, string>;
  status: {
    submitting: string;
    successTitle: string;
    successBody: string;
    errorTitle: string;
    errorBody: string;
    notConfiguredTitle: string;
    notConfiguredBody: string;
    errorSummaryTitle: string;
  };
  ui: {
    required: string;
    optionalLabel: string;
    submit: string;
    submitAgain: string;
    fallbackPrefix: string;
    newInquiry: string;
  };
  privacy: {
    notice: string;
  };
}

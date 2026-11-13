export const INQUIRY_LIMITS = {
  fullName: 120,
  email: 254,
  projectType: 80,
  shortDescription: 1500,
  company: 120,
  audience: 500,
  currentUrl: 500,
  problem: 1500,
  launchTimeframe: 120,
  budget: 120,
  additionalDetails: 3000,
  website: 120,
} as const;

export const INQUIRY_PROJECT_TYPES = [
  'Business website',
  'E-commerce website',
  'Landing page',
  'Website redesign',
  'Web application',
  'Website maintenance',
  'Other',
] as const;

export interface InquiryPayload {
  fullName: string;
  email: string;
  projectType: string;
  shortDescription: string;
  company: string;
  audience: string;
  currentUrl: string;
  problem: string;
  launchTimeframe: string;
  budget: string;
  additionalDetails: string;
  website: string;
}

export interface InquiryValidation {
  ok: boolean;
  data?: InquiryPayload;
  error?: string;
  field?: keyof InquiryPayload;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateInquiryPayload(input: unknown): InquiryValidation {
  if (!isRecord(input)) {
    return { ok: false, error: 'Inquiry data must be a JSON object.' };
  }

  const fields = Object.keys(INQUIRY_LIMITS) as Array<keyof InquiryPayload>;
  const data = {} as InquiryPayload;

  for (const field of fields) {
    const value = input[field];
    if (value === undefined) {
      data[field] = '';
      continue;
    }
    if (typeof value !== 'string') {
      return { ok: false, field, error: `${field} must be a string.` };
    }
    const trimmed = value.trim();
    if (trimmed.length > INQUIRY_LIMITS[field]) {
      return {
        ok: false,
        field,
        error: `${field} is too long (maximum ${INQUIRY_LIMITS[field]} characters).`,
      };
    }
    data[field] = trimmed;
  }

  const required: Array<keyof InquiryPayload> = [
    'fullName',
    'email',
    'projectType',
    'shortDescription',
  ];
  for (const field of required) {
    if (!data[field]) {
      return { ok: false, field, error: `${field} is required.` };
    }
  }

  if (!EMAIL_PATTERN.test(data.email)) {
    return { ok: false, field: 'email', error: 'Please provide a valid email address.' };
  }

  if (!INQUIRY_PROJECT_TYPES.includes(data.projectType as (typeof INQUIRY_PROJECT_TYPES)[number])) {
    return { ok: false, field: 'projectType', error: 'Please choose a valid project type.' };
  }

  if (data.currentUrl) {
    try {
      const url = new URL(data.currentUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
    } catch {
      return { ok: false, field: 'currentUrl', error: 'Please provide a valid http(s) URL.' };
    }
  }

  return { ok: true, data };
}

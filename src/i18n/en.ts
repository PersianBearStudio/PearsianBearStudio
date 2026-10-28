import type { Dictionary } from './types';

/**
 * English dictionary. Success and failure copy follows the studio's
 * approved messaging direction and deliberately avoids promising any
 * specific response time.
 */
export const en: Dictionary = {
  form: {
    title: 'Start your project',
    intro:
      'Tell us what you have in mind. The more context you share, the better we can scope your project — we usually reply with a few clarifying questions and an initial estimate.',
  },
  fields: {
    fullName: {
      label: 'Full name',
      placeholder: 'e.g. Sara Ahmadi',
    },
    email: {
      label: 'Email address',
      hint: 'We will use this address to reply to you.',
      placeholder: 'you@example.com',
    },
    projectType: {
      label: 'Project type',
      hint: 'Pick the closest match — choose “Other” if none fits.',
    },
    description: {
      label: 'Short project description',
      hint: 'A few sentences about what you want to build or improve.',
      placeholder: 'What are you building? Who is it for? What should it achieve?',
    },
    company: {
      label: 'Company or brand name',
      placeholder: 'e.g. Persian Bear Studio',
    },
    audience: {
      label: 'Target audience',
      hint: 'Who will use the website or service?',
      placeholder: 'e.g. Small businesses in Iran looking for a booking system',
    },
    websiteUrl: {
      label: 'Current website URL',
      hint: 'Leave empty if this is a new project.',
      placeholder: 'https://example.com',
    },
    timeframe: {
      label: 'Launch timeframe',
      hint: 'When would you like the project to go live?',
    },
    budget: {
      label: 'Estimated budget',
      hint: 'A rough range helps us suggest the right scope.',
    },
    problem: {
      label: 'Main problem or goal',
      hint: 'What should change once the project is done?',
      placeholder: 'e.g. Visitors currently leave without contacting us',
    },
    details: {
      label: 'Additional details',
      hint: 'References, features you love, technical wishes — anything that helps.',
      placeholder: 'Anything else we should know?',
    },
  },
  options: {
    selectPlaceholder: 'Please select…',
    projectType: {
      'business-website': 'Business Website',
      'ecommerce-website': 'E-commerce Website',
      'landing-page': 'Landing Page',
      'website-redesign': 'Website Redesign',
      'web-application': 'Web Application',
      'website-maintenance': 'Website Maintenance',
      other: 'Other',
    },
    timeframe: {
      asap: 'As soon as possible',
      '1-3-months': 'Within 1–3 months',
      '3-6-months': 'Within 3–6 months',
      '6-plus-months': 'In 6+ months',
      flexible: 'Flexible / not decided yet',
    },
    budget: {
      'under-500': 'Under $500',
      '500-1500': '$500 – $1,500',
      '1500-3000': '$1,500 – $3,000',
      '3000-6000': '$3,000 – $6,000',
      '6000-plus': 'Over $6,000',
      'not-sure': 'Not sure yet',
    },
  },
  validation: {
    errRequired: 'This field is required.',
    errMeaningful:
      'Please enter meaningful text — at least some letters, not only symbols or numbers.',
    errEmail: 'Please enter a valid email address.',
    errUrl: 'Please enter a valid website URL (http:// or https://).',
    errSelect: 'Please choose one of the available options.',
    errTooShort: 'Please enter at least {min} characters.',
    errTooLong: 'Please keep this under {max} characters.',
    errInvalid: 'This value does not look valid.',
    errUnexpected: 'Something was wrong with your submission.',
    errBadJson: 'We could not read your submission. Please try again.',
    errTooLarge: 'Your submission is too large. Please shorten it.',
    errRateLimited:
      'You have sent several inquiries recently. Please wait {seconds} seconds and try again.',
    errNotConfigured:
      'The inquiry form is temporarily not configured. Please contact us directly by email.',
    errServer:
      'Something went wrong while sending your inquiry. Please try again.',
  },
  status: {
    submitting: 'Submitting your inquiry…',
    successTitle: 'Inquiry submitted',
    successBody:
      "Thank you for reaching out. Your inquiry has been submitted successfully. We'll review the details and follow up using the email address you provided.",
    errorTitle: 'We could not submit your inquiry',
    errorBody:
      "We couldn't submit your inquiry right now. Your information is still available in the form. Please try again or contact us directly by email.",
    notConfiguredTitle: 'The inquiry form is not available yet',
    notConfiguredBody:
      'This form has not been connected to the studio inbox yet. Please contact us directly by email.',
    errorSummaryTitle: 'Please fix the following issues:',
  },
  ui: {
    required: 'required',
    optionalLabel: 'optional',
    submit: 'Send inquiry',
    submitAgain: 'Try again',
    fallbackPrefix: 'You can also email us directly at',
    newInquiry: 'Send another inquiry',
  },
  privacy: {
    notice:
      'The information you submit is used only to review your project inquiry and reply to you. We do not use it for marketing, and we do not share it with third parties for advertising. Please avoid including sensitive personal data (such as passwords or payment details) in your message.',
  },
};

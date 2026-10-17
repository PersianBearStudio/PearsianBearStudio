/**
 * PersianBearStudio — Central Configuration
 * --------------------------------------------
 * Single source of truth for brand content, contact links, capabilities,
 * and decorative settings. Future Persian localization will read from a
 * sibling `translations` module without touching these structural values.
 *
 * Missing values are handled gracefully:
 *   - Empty `email` → email link is omitted entirely (no fake address shown).
 *   - Empty social URLs → that social link is omitted entirely.
 *   - Empty `canonicalUrl` → Astro falls back to a relative build.
 *   - Empty decorative flags → motion still respects prefers-reduced-motion.
 */

export interface SocialLink {
  /** Stable identifier used for icons and accessibility ids. */
  key: 'email' | 'github' | 'telegram' | 'linkedin' | 'twitter' | 'instagram';
  /** Human-readable label for screen readers and tooltips. */
  label: string;
  /** Full URL including protocol. Leave empty string to omit. */
  url: string;
}

export interface Capability {
  /** Stable key for anchor + accessibility. */
  key: string;
  /** Short editorial title. */
  title: string;
  /** One-sentence description, no fluff. */
  description: string;
}

export interface Principle {
  number: string;
  title: string;
  description: string;
}

export interface ApproachStage {
  number: string;
  title: string;
  description: string;
}

export interface StudioConfig {
  brandName: string;
  wordmark: string;
  /** Primary tagline (hero headline). */
  primaryTagline: [string, string];
  /** Secondary tagline shown beneath the primary tagline. */
  secondaryTagline: string;
  /** Short sign-off used in the footer. */
  signOff: string;
  /** Short meta description for SEO. */
  metaDescription: string;
  /** Canonical production URL (no trailing slash). */
  canonicalUrl: string;
  /** Hero supporting line. */
  heroSupportingLine: string;
  /** Hero paragraph. */
  heroParagraph: string;
  /** Hero primary CTA label. */
  heroPrimaryCta: string;
  /** Hero primary CTA anchor target (in-page `#id`). */
  heroPrimaryCtaHref: string;
  /** Hero secondary CTA label. */
  heroSecondaryCta: string;
  /** Hero secondary CTA anchor target. */
  heroSecondaryCtaHref: string;
  /** Studio section heading. */
  studioHeading: string;
  /** Studio section copy. */
  studioCopy: string;
  /** Philosophy principles (three). */
  principles: Principle[];
  /** Capabilities heading. */
  capabilitiesHeading: string;
  /** Capabilities list. */
  capabilities: Capability[];
  /** Approach stages (four). */
  approachStages: ApproachStage[];
  /** Contact heading. */
  contactHeading: string;
  /** Contact copy. */
  contactCopy: string;
  /** Social + contact links. Empty `url` entries are filtered out. */
  social: SocialLink[];
  /** Decorative + motion toggles. All true by default; respect reduced-motion regardless. */
  decorative: {
    /** Animated grid in hero background. */
    heroGrid: boolean;
    /** Cursor-following accent (desktop / fine pointer only). */
    cursorAccent: boolean;
    /** Magnetic CTA hover (fine pointer only). */
    magneticCta: boolean;
    /** Top scroll-progress line. */
    scrollProgress: boolean;
    /** Parallax on hero bear emblem. */
    heroParallax: boolean;
  };
}

/**
 * Edit values below to update the entire site.
 * To disable a contact method, set its `url` to an empty string —
 * the link will be omitted from the production build entirely.
 */
export const studioConfig: StudioConfig = {
  brandName: 'PersianBearStudio',
  wordmark: 'PersianBearStudio',
  primaryTagline: ['Good Ideas.', 'Precise Execution.'],
  secondaryTagline: 'Two Minds. One Vision.',
  signOff: 'Independent by nature. Precise by design.',
  metaDescription:
    'PersianBearStudio is an independent web development studio focused on thoughtful digital experiences, clean engineering, and purposeful design.',
  canonicalUrl: 'https://persianbearstudio.com',
  heroSupportingLine: 'We build for what comes next.',
  heroParagraph:
    'PersianBearStudio is an independent web development studio focused on thoughtful digital experiences, clean engineering, and purposeful design.',
  heroPrimaryCta: 'Explore the Studio',
  heroPrimaryCtaHref: '#studio',
  heroSecondaryCta: 'Get in Touch',
  heroSecondaryCtaHref: '#contact',
  studioHeading: 'Built with intention.',
  studioCopy:
    'We believe great digital experiences begin with clear thinking. By combining thoughtful design with solid engineering, we aim to build websites that feel effortless to use and dependable beneath the surface.',
  principles: [
    {
      number: '01',
      title: 'Clarity Over Complexity',
      description:
        'We value clear interfaces, understandable code, and solutions that solve real problems without unnecessary complexity.',
    },
    {
      number: '02',
      title: 'Details Define Quality',
      description:
        'Small decisions shape the final experience, from typography and spacing to performance and interaction.',
    },
    {
      number: '03',
      title: 'Build With Purpose',
      description:
        'Every design choice and technical decision should contribute to a meaningful outcome.',
    },
  ],
  capabilitiesHeading: 'Digital experiences, built right.',
  capabilities: [
    {
      key: 'web-design',
      title: 'Web Design & Responsive Interfaces',
      description:
        'Editorial, accessible layouts that adapt gracefully across devices and stay readable at any size.',
    },
    {
      key: 'frontend',
      title: 'Frontend Development',
      description:
        'Type-safe, component-driven code built with modern standards and long-term maintainability in mind.',
    },
    {
      key: 'interactive-ux',
      title: 'Interactive User Experiences',
      description:
        'Purposeful motion and interaction design that guides attention without distracting from content.',
    },
    {
      key: 'performance-a11y',
      title: 'Performance & Accessibility',
      description:
        'Fast load times, semantic markup, keyboard navigation, and visible focus states treated as first-class concerns.',
    },
    {
      key: 'integration-backend',
      title: 'Integration & Backend Development',
      description:
        'Connected services and backend work, configured as an actual capability when a project genuinely requires it.',
    },
  ],
  approachStages: [
    {
      number: '01',
      title: 'Understand',
      description: 'Define the problem, goals, and user needs.',
    },
    {
      number: '02',
      title: 'Design',
      description: 'Establish the structure, interface, and interaction patterns.',
    },
    {
      number: '03',
      title: 'Develop',
      description: 'Build a responsive, maintainable implementation.',
    },
    {
      number: '04',
      title: 'Refine',
      description: 'Test, optimize, and improve the final experience.',
    },
  ],
  contactHeading: "Let's build something meaningful.",
  contactCopy:
    "Have an idea, a question, or an opportunity to collaborate? We'd be glad to hear from you.",
  /**
   * Contact methods. Leave `url` empty to omit a link from the production build.
   * Replace these placeholder URLs with the studio's official channels when ready.
   */
  social: [
    {
      key: 'email',
      label: 'Email',
      url: '', // e.g. 'mailto:hello@persianbearstudio.com'
    },
    {
      key: 'github',
      label: 'GitHub',
      url: '', // e.g. 'https://github.com/persianbearstudio'
    },
    {
      key: 'telegram',
      label: 'Telegram',
      url: '', // e.g. 'https://t.me/persianbearstudio'
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      url: '', // e.g. 'https://www.linkedin.com/company/persianbearstudio'
    },
    {
      key: 'twitter',
      label: 'Twitter',
      url: '', // e.g. 'https://twitter.com/persianbearstudio'
    },
  ],
  decorative: {
    heroGrid: true,
    cursorAccent: true,
    magneticCta: true,
    scrollProgress: true,
    heroParallax: true,
  },
};

/**
 * Returns only the social links that have a configured URL.
 * Use this in components to render the contact list — never use `social` directly,
 * so unconfigured links are guaranteed to be omitted on the production site.
 */
export function configuredSocial(): SocialLink[] {
  return studioConfig.social.filter((s) => s.url && s.url.trim().length > 0);
}

/** Returns the email link if configured, otherwise null. */
export function configuredEmail(): SocialLink | null {
  return studioConfig.social.find((s) => s.key === 'email' && s.url.trim()) ?? null;
}

/** True if at least one contact method is configured. */
export function hasContact(): boolean {
  return configuredSocial().length > 0;
}

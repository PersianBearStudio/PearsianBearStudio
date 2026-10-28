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
  primaryTagline: ['Clear Direction.', 'Careful Builds.'],
  secondaryTagline: 'Design + code, together.',
  signOff: 'Independent studio. Thoughtful design. Maintainable code.',
  metaDescription:
    'PersianBearStudio is an independent web development studio creating focused websites with clear structure, accessible interfaces, and maintainable code.',
  canonicalUrl: 'https://persianbearstudio.com',
  heroSupportingLine: 'Websites that make the next step clear.',
  heroParagraph:
    'We design and build focused websites with clear structure, accessible interfaces, and maintainable frontend code.',
  heroPrimaryCta: 'See how we work',
  heroPrimaryCtaHref: '#approach',
  heroSecondaryCta: 'Start a conversation',
  heroSecondaryCtaHref: '#contact',
  studioHeading: 'Built for clarity.',
  studioCopy:
    'We pair clear content structure with thoughtful interface design and maintainable frontend code, so a site is easier to use today and easier to change later.',
  principles: [
    {
      number: '01',
      title: 'Clarity Over Complexity',
      description:
        'We reduce a problem to its essential parts, then choose the simplest interface and implementation that serves it well.',
    },
    {
      number: '02',
      title: 'Details Define Quality',
      description:
        'We review the details users feel first — type, spacing, motion, loading, and focus — because polish is part of usability.',
    },
    {
      number: '03',
      title: 'Build With Purpose',
      description:
        'We connect every design and technical decision to a user need, a business goal, or a clear reason to be there.',
    },
  ],
  capabilitiesHeading: 'Websites with a clear job to do.',
  capabilities: [
    {
      key: 'web-design',
      title: 'Web Design & Responsive Layouts',
      description:
        'Clear page structure and responsive layouts that keep content readable and actions easy to find across screen sizes.',
    },
    {
      key: 'frontend',
      title: 'Frontend Development',
      description:
        'Component-based frontend code with semantic HTML and a structure that stays understandable as the site grows.',
    },
    {
      key: 'interactive-ux',
      title: 'Interaction Design',
      description:
        'Motion and interactive details used to explain change, confirm action, and guide attention — not to decorate every click.',
    },
    {
      key: 'performance-a11y',
      title: 'Performance & Accessibility',
      description:
        'Semantic markup, keyboard support, visible focus, and lean assets considered from the first implementation — not added at the end.',
    },
    {
      key: 'integration-backend',
      title: 'Integrations & Backend Support',
      description:
        'API connections and small backend pieces where they support the site’s core job; we scope the boundary before we build.',
    },
  ],
  approachStages: [
    {
      number: '01',
      title: 'Frame the Problem',
      description: 'Clarify the audience, desired outcome, content, constraints, and what success needs to look like.',
    },
    {
      number: '02',
      title: 'Shape the Experience',
      description: 'Turn the brief into page structure, visual direction, and interaction decisions we can review together.',
    },
    {
      number: '03',
      title: 'Build the System',
      description: 'Implement the responsive interface with semantic markup, reusable components, and the integrations the scope calls for.',
    },
    {
      number: '04',
      title: 'Check and Refine',
      description: 'Test across devices, fix rough edges, and make the final details support the content.',
    },
  ],
  contactHeading: "Let's Build Something Great Together.",
  contactCopy:
    "Have an idea, a website to improve, or a project in mind? Tell us a little about it. We'll review your inquiry and discuss the next steps with you.",
  /**
   * Contact methods. Leave `url` empty to omit a link from the production build.
   * Replace these placeholder URLs with the studio's official channels when ready.
   */
  social: [
    {
      key: 'email',
      label: 'Email',
      url: 'mailto:persianbearstudio@gmail.com',
    },
    {
      key: 'github',
      label: 'GitHub',
      url: '', // e.g. 'https://github.com/persianbearstudio'
    },
    {
      key: 'telegram',
      label: 'Telegram',
      url: 'https://t.me/PersianBearStudio',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      url: 'https://www.instagram.com/persianbearstudio/',
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

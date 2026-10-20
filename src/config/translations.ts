/**
 * PersianBearStudio — Translations (EN + FA)
 * --------------------------------------------
 * Two-language content for the entire site. Strings keyed by a stable
 * identifier; components render the English version server-side and the
 * Persian version is swapped in client-side when the user picks it.
 *
 * Why this layout (vs. a full Astro i18n integration):
 *   - The site is a single page; we don't need route-based localization
 *     (`/en/...` vs `/fa/...`). A toggle is simpler and faster.
 *   - Both languages are server-rendered into the HTML; the toggle just
 *     swaps which one is visible (no flash of wrong content, no JS-only
 *     fallback). The default visible language is English.
 *   - Persian text is laid out with `dir="rtl"` on <html>; all CSS uses
 *     logical properties (inset-inline, margin-block, etc.) so the same
 *     styles work in both directions.
 *
 * Adding more languages later:
 *   1. Add a new key to `Language` (e.g. `| 'de'`).
 *   2. Add the new language's strings to `translations`.
 *   3. Add the new tab to LanguageSwitcher.astro.
 *
 * No rebuild required to add translations — just edit this file.
 */

export type Language = 'en' | 'fa';

/** Single source of truth for the list of available languages + labels. */
export const LANGUAGES: { code: Language; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'fa', label: 'فا', dir: 'rtl' },
];

/** Default language shown on first paint (matches the server-rendered HTML). */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Brand-contact bot cards shown in the new "Connect Us" section.
 * `key` maps to a stable identifier; the URL is reused for both languages
 * (the bot itself doesn't change between languages).
 */
export interface BotCard {
  /** Stable key — used for icon selection + element ids. */
  key: 'telegram-bot' | 'telegram-channel' | 'instagram';
  /** Bot URL (shared across languages — bots aren't language-specific). */
  url: string;
  /** Handle shown to the user (shared across languages). */
  handle: string;
}

export const BOTS: BotCard[] = [
  {
    // Telegram BOT — direct message channel
    key: 'telegram-bot',
    url: 'https://t.me/PersianBearStudio_bot',
    handle: '@PersianBearStudio_bot',
  },
  {
    // Telegram CHANNEL — broadcast channel for studio updates / announcements
    key: 'telegram-channel',
    url: 'https://t.me/PersianBearStudio',
    handle: '@PersianBearStudio',
  },
  {
    // Instagram ACCOUNT (not a bot) — handle for the studio's Instagram page
    key: 'instagram',
    url: 'https://www.instagram.com/persianbearstudio/',
    handle: '@persianbearstudio',
  },
];

/**
 * Translation shape. Every key must exist in both `en` and `fa` — the
 * TypeScript `Translation` interface enforces this.
 */
export interface Translation {
  // ---- Header ----
  navHome: string;
  navStudio: string;
  navPhilosophy: string;
  navCapabilities: string;
  navConnect: string;
  navContact: string;
  headerCta: string;
  menuOpen: string;
  menuClose: string;
  primaryNavLabel: string;
  mobileNavLabel: string;
  backToTop: string;

  // ---- Hero ----
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroSupporting: string;
  heroParagraph: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroScrollHint: string;
  heroMarkCaption: string;

  // ---- Studio ----
  studioEyebrow: string;
  studioHeading: string;
  studioLead: string;
  studioValue1Title: string;
  studioValue1Body: string;
  studioValue2Title: string;
  studioValue2Body: string;
  studioValue3Title: string;
  studioValue3Body: string;
  studioValue4Title: string;
  studioValue4Body: string;
  studioValue5Title: string;
  studioValue5Body: string;

  // ---- Philosophy ----
  philosophyEyebrow: string;
  philosophyHeading: string;
  philosophySub: string;
  principle1Title: string;
  principle1Body: string;
  principle2Title: string;
  principle2Body: string;
  principle3Title: string;
  principle3Body: string;

  // ---- Capabilities ----
  capabilitiesEyebrow: string;
  capabilitiesHeading: string;
  capabilitiesSub: string;
  capability1Title: string;
  capability1Body: string;
  capability2Title: string;
  capability2Body: string;
  capability3Title: string;
  capability3Body: string;
  capability4Title: string;
  capability4Body: string;
  capability5Title: string;
  capability5Body: string;

  // ---- Approach ----
  approachEyebrow: string;
  approachHeading: string;
  approachSub: string;
  stage1Title: string;
  stage1Body: string;
  stage2Title: string;
  stage2Body: string;
  stage3Title: string;
  stage3Body: string;
  stage4Title: string;
  stage4Body: string;

  // ---- Connect Us (NEW section) ----
  connectEyebrow: string;
  connectHeading: string;
  connectSub: string;
  connectTelegramTitle: string;
  connectTelegramDesc: string;
  connectTelegramCta: string;
  connectChannelTitle: string;
  connectChannelDesc: string;
  connectChannelCta: string;
  connectInstagramTitle: string;
  connectInstagramDesc: string;
  connectInstagramCta: string;
  connectOpenExternal: string; // "Opens in new tab" tooltip-like text

  // ---- Contact ----
  contactEyebrow: string;
  contactHeading: string;
  contactCopy: string;
  contactEmailLabel: string;
  contactCopyButton: string;
  contactCopied: string;
  contactCopyFailed: string;
  contactChannelsPlaceholder: string;
  socialTelegramLabel: string;
  socialInstagramLabel: string;
  socialEmailLabel: string;
  socialGithubLabel: string;
  socialLinkedinLabel: string;
  socialTwitterLabel: string;

  // ---- Footer ----
  footerSignOff: string;
  footerCopyright: string; // "© {year} PersianBearStudio" — {year} replaced at render time
  returnToTop: string; // Visible label on the return-to-top button

  // ---- Skip link + a11y ----
  skipToContent: string;
  emblemAlt: string;

  // ---- Document-level ----
  metaDescription: string;
}

const en: Translation = {
  // Header
  navHome: 'Home',
  navStudio: 'Studio',
  navPhilosophy: 'Philosophy',
  navCapabilities: 'Capabilities',
  navConnect: 'Connect',
  navContact: 'Contact',
  headerCta: 'Contact',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  primaryNavLabel: 'Primary',
  mobileNavLabel: 'Mobile primary',
  backToTop: 'PersianBearStudio — back to top',

  // Hero
  heroEyebrow: 'Independent Web Development Studio',
  heroLine1: 'Good Ideas.',
  heroLine2: 'Precise Execution.',
  heroSupporting: 'We build for what comes next.',
  heroParagraph:
    'PersianBearStudio is an independent web development studio focused on thoughtful digital experiences, clean engineering, and purposeful design.',
  heroCtaPrimary: 'Explore the Studio',
  heroCtaSecondary: 'Get in Touch',
  heroScrollHint: 'Scroll',
  heroMarkCaption: 'Two Minds. One Vision.',

  // Studio
  studioEyebrow: 'Studio',
  studioHeading: 'Built with intention.',
  studioLead:
    'We believe great digital experiences begin with clear thinking. By combining thoughtful design with solid engineering, we aim to build websites that feel effortless to use and dependable beneath the surface.',
  studioValue1Title: 'Thoughtful Problem-Solving',
  studioValue1Body:
    'We start with the problem and the people it serves, then design backwards to a solution that earns its place.',
  studioValue2Title: 'Clean, Maintainable Code',
  studioValue2Body:
    'Code is read more than it is written. We optimize for clarity, structure, and the next engineer who will touch it.',
  studioValue3Title: 'User-Focused Design',
  studioValue3Body:
    'Interfaces should be obvious without explanation. Every layout decision is measured against the user’s intent.',
  studioValue4Title: 'Attention to Detail',
  studioValue4Body:
    'Spacing, typography, motion, and performance all add up. The small choices define the finished feel.',
  studioValue5Title: 'Continuous Improvement',
  studioValue5Body:
    'A site is never done. We treat launch as one step in an ongoing refinement toward a better experience.',

  // Philosophy
  philosophyEyebrow: 'Philosophy',
  philosophyHeading: 'How we think.',
  philosophySub:
    'Three principles that shape every decision we make — from the first sketch to the final commit.',
  principle1Title: 'Clarity Over Complexity',
  principle1Body:
    'We value clear interfaces, understandable code, and solutions that solve real problems without unnecessary complexity.',
  principle2Title: 'Details Define Quality',
  principle2Body:
    'Small decisions shape the final experience, from typography and spacing to performance and interaction.',
  principle3Title: 'Build With Purpose',
  principle3Body:
    'Every design choice and technical decision should contribute to a meaningful outcome.',

  // Capabilities
  capabilitiesEyebrow: 'Capabilities',
  capabilitiesHeading: 'Digital experiences, built right.',
  capabilitiesSub:
    'A focused set of disciplines we treat as first-class concerns. No invented expertise — only what we genuinely build.',
  capability1Title: 'Web Design & Responsive Interfaces',
  capability1Body:
    'Editorial, accessible layouts that adapt gracefully across devices and stay readable at any size.',
  capability2Title: 'Frontend Development',
  capability2Body:
    'Type-safe, component-driven code built with modern standards and long-term maintainability in mind.',
  capability3Title: 'Interactive User Experiences',
  capability3Body:
    'Purposeful motion and interaction design that guides attention without distracting from content.',
  capability4Title: 'Performance & Accessibility',
  capability4Body:
    'Fast load times, semantic markup, keyboard navigation, and visible focus states treated as first-class concerns.',
  capability5Title: 'Integration & Backend Development',
  capability5Body:
    'Connected services and backend work, configured as an actual capability when a project genuinely requires it.',

  // Approach
  approachEyebrow: 'Approach',
  approachHeading: 'A simple, repeatable rhythm.',
  approachSub:
    'Four stages that turn an idea into a polished experience — these are general workflow principles, not claims about completed client work.',
  stage1Title: 'Understand',
  stage1Body: 'Define the problem, goals, and user needs.',
  stage2Title: 'Design',
  stage2Body: 'Establish the structure, interface, and interaction patterns.',
  stage3Title: 'Develop',
  stage3Body: 'Build a responsive, maintainable implementation.',
  stage4Title: 'Refine',
  stage4Body: 'Test, optimize, and improve the final experience.',

  // Connect Us
  connectEyebrow: 'Connect',
  connectHeading: 'Talk to our bots.',
  connectSub:
    'Have a quick question or want to start a conversation? Reach out through our bots and channels — we usually reply within a day.',
  connectTelegramTitle: 'Telegram Bot',
  connectTelegramDesc:
    'Direct line for project inquiries, quick questions, and contract conversations.',
  connectTelegramCta: 'Open in Telegram',
  connectChannelTitle: 'Telegram Channel',
  connectChannelDesc:
    'Public broadcast channel for studio updates, project announcements, and behind-the-scenes notes.',
  connectChannelCta: 'Open in Telegram',
  connectInstagramTitle: 'Instagram',
  connectInstagramDesc:
    'Drop us a DM on Instagram for casual chats, behind-the-scenes, and quick hellos.',
  connectInstagramCta: 'Open in Instagram',
  connectOpenExternal: 'Opens in a new tab',

  // Contact
  contactEyebrow: 'Contact',
  contactHeading: "Let's build something meaningful.",
  contactCopy:
    "Have an idea, a question, or an opportunity to collaborate? We'd be glad to hear from you.",
  contactEmailLabel: 'Email',
  contactCopyButton: 'Copy',
  contactCopied: 'Copied',
  contactCopyFailed: 'Copy failed — you can still select it manually.',
  contactChannelsPlaceholder: 'Contact channels will appear here once configured.',
  socialTelegramLabel: 'Telegram',
  socialInstagramLabel: 'Instagram',
  socialEmailLabel: 'Email',
  socialGithubLabel: 'GitHub',
  socialLinkedinLabel: 'LinkedIn',
  socialTwitterLabel: 'Twitter',

  // Footer
  footerSignOff: 'Independent by nature. Precise by design.',
  footerCopyright: '© {year} PersianBearStudio',
  returnToTop: 'Back to top',

  // a11y
  skipToContent: 'Skip to content',
  emblemAlt: 'PersianBearStudio emblem',

  // Document-level
  metaDescription:
    'PersianBearStudio is an independent web development studio focused on thoughtful digital experiences, clean engineering, and purposeful design.',
};

const fa: Translation = {
  // Header
  navHome: 'خانه',
  navStudio: 'استودیو',
  navPhilosophy: 'فلسفه',
  navCapabilities: 'توانمندی‌ها',
  navConnect: 'ارتباط',
  navContact: 'تماس',
  headerCta: 'تماس',
  menuOpen: 'باز کردن منو',
  menuClose: 'بستن منو',
  primaryNavLabel: 'ناوبری اصلی',
  mobileNavLabel: 'ناوبری موبایل',
  backToTop: 'پرش به بالای صفحه',

  // Hero
  heroEyebrow: 'استودیو مستقل توسعهٔ وب',
  heroLine1: 'ایده‌های خوب.',
  heroLine2: 'اجرای دقیق.',
  heroSupporting: 'برای آینده‌ای که در راه است می‌سازیم.',
  heroParagraph:
    'پرشین‌بِر استودیو یک استودیوی مستقل توسعهٔ وب است که روی تجربه‌های دیجیتال مدبرانه، مهندسی تمیز و طراحی هدفمند تمرکز دارد.',
  heroCtaPrimary: 'استودیو را ببینید',
  heroCtaSecondary: 'تماس بگیرید',
  heroScrollHint: 'اسکرول',
  heroMarkCaption: 'دو ذهن. یک چشم‌انداز.',

  // Studio
  studioEyebrow: 'استودیو',
  studioHeading: 'با نیت درست ساخته می‌شود.',
  studioLead:
    'معتقدیم تجربه‌های دیجیتال عالی از تفکر روشن آغاز می‌شوند. با ترکیب طراحی مدبرانه و مهندسی محکم، وب‌سایت‌هایی می‌سازیم که استفاده ازشان بی‌دردسر باشد و در پس‌زمینه قابل‌اتکا.',
  studioValue1Title: 'حل مسئلهٔ مدبرانه',
  studioValue1Body:
    'از مسئله و کسانی که آن را تجربه می‌کنند شروع می‌کنیم و سپس به‌عقب‌گرد طراحی می‌کنیم تا به راه‌حلی برسیم که جای خود را داشته باشد.',
  studioValue2Title: 'کد تمیز و قابل‌نگهداری',
  studioValue2Body:
    'کد بیشتر خوانده می‌شود تا نوشته. برای وضوح، ساختار و مهندس بعدی که آن را خواهد خواند بهینه می‌کنیم.',
  studioValue3Title: 'طراحی متمرکز بر کاربر',
  studioValue3Body:
    'رابط‌ها باید بدون توضیح بدیهی باشند. هر تصمیم چیدمان در برابر نیت کاربر سنجیده می‌شود.',
  studioValue4Title: 'توجه به جزئیات',
  studioValue4Body:
    'فاصله‌گذاری، تایپوگرافی، حرکت و عملکرد همه با هم جمع می‌شوند. انتخاب‌های کوچک، حس نهایی را شکل می‌دهند.',
  studioValue5Title: 'بهبود مستمر',
  studioValue5Body:
    'هیچ‌سایتی هرگز تمام نمی‌شود. انتشار را گامی در مسیر پالایش مستمر می‌دانیم.',

  // Philosophy
  philosophyEyebrow: 'فلسفه',
  philosophyHeading: 'چگونه می‌اندیشیم.',
  philosophySub:
    'سه اصل که هر تصمیم ما را شکل می‌دهند — از اولین اسکچ تا آخرین کامیت.',
  principle1Title: 'وضوح به‌جای پیچیدگی',
  principle1Body:
    'به رابط‌های روشن، کد قابل‌فهم و راه‌حل‌هایی ارزش می‌دهیم که مشکلات واقعی را بدون پیچیدگی اضافی حل می‌کنند.',
  principle2Title: 'جزئیات، کیفیت را تعریف می‌کنند',
  principle2Body:
    'تصمیم‌های کوچک تجربهٔ نهایی را شکل می‌دهند؛ از تایپوگرافی و فاصله‌گذاری تا عملکرد و تعامل.',
  principle3Title: 'با هدف بساز',
  principle3Body:
    'هر انتخاب طراحی و تصمیم فنی باید به نتیجه‌ای معنا‌دار کمک کند.',

  // Capabilities
  capabilitiesEyebrow: 'توانمندی‌ها',
  capabilitiesHeading: 'تجربه‌های دیجیتال، درست ساخته شده.',
  capabilitiesSub:
    'مجموعه‌ای متمرکز از تخصص‌هایی که آن‌ها را به‌عنوان دغدغه‌های درجه‌یک در نظر می‌گیریم. بدون ادعای غیرواقعی — فقط آنچه واقعاً می‌سازیم.',
  capability1Title: 'طراحی وب و رابط‌های واکنش‌گرا',
  capability1Body:
    'چیدمان‌های ویراستاری و دسترس‌پذیر که در هر دستگاهی به‌خوبی سازگار و در هر اندازه‌ای خوانا می‌مانند.',
  capability2Title: 'توسعهٔ فرانت‌اند',
  capability2Body:
    'کد type-safe و مبتنی بر کامپوننت، با استانداردهای مدرن و نگهداری بلندمدت در ذهن.',
  capability3Title: 'تجربه‌های تعاملی کاربر',
  capability3Body:
    'حرکت و تعامل هدفمند که توجه را هدایت می‌کند، بدون اینکه از محتوا پرت کن.',
  capability4Title: 'عملکرد و دسترس‌پذیری',
  capability4Body:
    'زمان بارگذاری سریع، نشانه‌گذاری معنایی، پیمایش کیبورد و حالت‌های فوکوس قابل‌مشاهده به‌عنوان دغدغه‌های درجه‌یک.',
  capability5Title: 'یکپارچه‌سازی و توسعهٔ بک‌اند',
  capability5Body:
    'سرویس‌های متصل و کار بک‌اند، زمانی که پروژه واقعاً نیاز داشته باشد، به‌عنوان توانمندی پیکربندی می‌شود.',

  // Approach
  approachEyebrow: 'رویکرد',
  approachHeading: 'ریتمی ساده و تکرارپذیر.',
  approachSub:
    'چهار مرحله که یک ایده را به تجربه‌ای صیقل‌یافته تبدیل می‌کند — این‌ها اصول کلی گردش کار هستند، نه ادعایی دربارهٔ پروژه‌های انجام‌شده.',
  stage1Title: 'فهم',
  stage1Body: 'مسئله، اهداف و نیازهای کاربر را تعریف کن.',
  stage2Title: 'طراحی',
  stage2Body: 'ساختار، رابط و الگوهای تعامل را بچین.',
  stage3Title: 'توسعه',
  stage3Body: 'پیاده‌سازی واکنش‌گرا و قابل‌نگهداری بساز.',
  stage4Title: 'پالایش',
  stage4Body: 'تست، بهینه و تجربهٔ نهایی را بهبود بده.',

  // Connect Us
  connectEyebrow: 'ارتباط',
  connectHeading: 'با ربات‌های ما حرف بزنید.',
  connectSub:
    'سؤال سریعی دارید یا می‌خواهید گفت‌وگویی را آغاز کنید؟ از طریق ربات‌ها و کانال‌های ما با ما در ارتباط باشید — معمولاً ظرف یک روز پاسخ می‌دهیم.',
  connectTelegramTitle: 'ربات تلگرام',
  connectTelegramDesc:
    'مسیر مستقیم برای استعلام پروژه‌ها، سؤالات سریع و گفت‌وگوهای قراردادی.',
  connectTelegramCta: 'باز کردن در تلگرام',
  connectChannelTitle: 'کانال تلگرام',
  connectChannelDesc:
    'کانال عمومی برای به‌روزرسانی‌های استودیو، اعلان‌های پروژه و یادداشت‌های پشت‌صحنه.',
  connectChannelCta: 'باز کردن در تلگرام',
  connectInstagramTitle: 'اینستاگرام',
  connectInstagramDesc:
    'در اینستاگرام به ما DM بزنید برای گپ‌های غیررسمی، پشت‌صحنه و سلام‌واحوال‌کردن.',
  connectInstagramCta: 'باز کردن در اینستاگرام',
  connectOpenExternal: 'در تب جدید باز می‌شود',

  // Contact
  contactEyebrow: 'تماس',
  contactHeading: 'بیایید چیزی معنادار بسازیم.',
  contactCopy:
    'ایده‌ای، سؤالی یا فرصت همکاری دارید؟ خوشحال می‌شویم بشنویم.',
  contactEmailLabel: 'ایمیل',
  contactCopyButton: 'کپی',
  contactCopied: 'کپی شد',
  contactCopyFailed: 'کپی ناموفق بود — می‌توانید به‌صورت دستی انتخاب کنید.',
  contactChannelsPlaceholder: 'کانال‌های تماس پس از پیکربندی اینجا نمایش داده می‌شوند.',
  socialTelegramLabel: 'تلگرام',
  socialInstagramLabel: 'اینستاگرام',
  socialEmailLabel: 'ایمیل',
  socialGithubLabel: 'گیت‌هاب',
  socialLinkedinLabel: 'لینکدین',
  socialTwitterLabel: 'توییتر',

  // Footer
  footerSignOff: 'مستقل در ذات. دقیق در طراحی.',
  footerCopyright: '© {year} پرشین‌بِر استودیو',
  returnToTop: 'بازگشت به بالا',

  // a11y
  skipToContent: 'پرش به محتوا',
  emblemAlt: 'نماد پرشین‌بِر استودیو',

  // Document-level
  metaDescription:
    'پرشین‌بِر استودیو یک استودیوی مستقل توسعهٔ وب است که روی تجربه‌های دیجیتال مدبرانه، مهندسی تمیز و طراحی هدفمند تمرکز دارد.',
};

export const translations: Record<Language, Translation> = { en, fa };

/** Convenience accessor. */
export function t(lang: Language): Translation {
  return translations[lang];
}

/** Detect a previously-chosen language from localStorage, falling back to default. */
export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const v = window.localStorage.getItem('pbs-lang');
    if (v === 'en' || v === 'fa') return v;
  } catch {
    /* ignore: localStorage may be unavailable */
  }
  return DEFAULT_LANGUAGE;
}

/** Persist the language choice (best effort). */
export function storeLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('pbs-lang', lang);
  } catch {
    /* ignore */
  }
}

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
 * Translations are compiled into the HTML at build time: edit this file, then rebuild.
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
  languageLabel: string;
  socialLinksLabel: string;
  siteNavLabel: string;
  scrollToStudio: string;
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
  headerCta: 'Start a conversation',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  primaryNavLabel: 'Primary',
  mobileNavLabel: 'Mobile primary',
  backToTop: 'PersianBearStudio — back to top',

  // Hero
  heroEyebrow: 'Independent Web Development Studio',
  heroLine1: 'Clear Direction.',
  heroLine2: 'Careful Builds.',
  heroSupporting: 'Websites that make the next step clear.',
  heroParagraph:
    'We design and build focused websites with clear structure, accessible interfaces, and maintainable frontend code.',
  heroCtaPrimary: 'See how we work',
  heroCtaSecondary: 'Start a conversation',
  heroScrollHint: 'Scroll',
  heroMarkCaption: 'Design + code, together.',

  // Studio
  studioEyebrow: 'Studio',
  studioHeading: 'Built for clarity.',
  studioLead:
    'We pair clear content structure with thoughtful interface design and maintainable frontend code, so a site is easier to use today and easier to change later.',
  studioValue1Title: 'Problem-Led Thinking',
  studioValue1Body:
    'We clarify the audience, the job to be done, and the constraints before choosing a solution.',
  studioValue2Title: 'Maintainable Code',
  studioValue2Body:
    'We favor clear structure, small components, and conventions that make future changes easier to review and ship.',
  studioValue3Title: 'Accessible by Default',
  studioValue3Body:
    'We design around clear hierarchy, readable type, keyboard access, and interactions people can understand.',
  studioValue4Title: 'Details That Earn Their Place',
  studioValue4Body:
    'Spacing, type, motion, and performance are tuned together so polish supports the content instead of competing with it.',
  studioValue5Title: 'Built to Evolve',
  studioValue5Body:
    'We make choices that leave room for future content, features, and refinements without starting over.',

  // Philosophy
  philosophyEyebrow: 'Philosophy',
  philosophyHeading: 'How we think.',
  philosophySub:
    'Three working principles guide decisions from the first conversation to the final review.',
  principle1Title: 'Clarity Over Complexity',
  principle1Body:
    'We reduce a problem to its essential parts, then choose the simplest interface and implementation that serves it well.',
  principle2Title: 'Details Define Quality',
  principle2Body:
    'We review the details users feel first — type, spacing, motion, loading, and focus — because polish is part of usability.',
  principle3Title: 'Build With Purpose',
  principle3Body:
    'We connect every design and technical decision to a user need, a business goal, or a clear reason to be there.',

  // Capabilities
  capabilitiesEyebrow: 'Capabilities',
  capabilitiesHeading: 'Websites with a clear job to do.',
  capabilitiesSub:
    'We focus on the parts of a web build we can own well: structure, interface, frontend implementation, and the integrations a project actually needs.',
  capability1Title: 'Web Design & Responsive Layouts',
  capability1Body:
    'Clear page structure and responsive layouts that keep content readable and actions easy to find across screen sizes.',
  capability2Title: 'Frontend Development',
  capability2Body:
    'Component-based frontend code with semantic HTML and a structure that stays understandable as the site grows.',
  capability3Title: 'Interaction Design',
  capability3Body:
    'Motion and interactive details used to explain change, confirm action, and guide attention — not to decorate every click.',
  capability4Title: 'Performance & Accessibility',
  capability4Body:
    'Semantic markup, keyboard support, visible focus, and lean assets considered from the first implementation — not added at the end.',
  capability5Title: 'Integrations & Backend Support',
  capability5Body:
    'API connections and small backend pieces where they support the site’s core job; we scope the boundary before we build.',

  // Approach
  approachEyebrow: 'Approach',
  approachHeading: 'A clear path from brief to build.',
  approachSub:
    'We use four practical stages to align on the problem, make the key decisions, build the interface, and leave the implementation in a shape that can be maintained.',
  stage1Title: 'Frame the Problem',
  stage1Body: 'Clarify the audience, desired outcome, content, constraints, and what success needs to look like.',
  stage2Title: 'Shape the Experience',
  stage2Body: 'Turn the brief into page structure, visual direction, and interaction decisions we can review together.',
  stage3Title: 'Build the System',
  stage3Body: 'Implement the responsive interface with semantic markup, reusable components, and the integrations the scope calls for.',
  stage4Title: 'Check and Refine',
  stage4Body: 'Test across devices, fix rough edges, and make the final details support the content.',

  // Connect Us
  connectEyebrow: 'Connect',
  connectHeading: 'Choose your channel.',
  connectSub:
    'For a project question, use the Telegram bot. For updates, follow the channel. For a quick hello, send us an Instagram message.',
  connectTelegramTitle: 'Telegram Bot',
  connectTelegramDesc:
    'A direct place to ask about a project, our work, or a possible collaboration.',
  connectTelegramCta: 'Message the bot',
  connectChannelTitle: 'Telegram Channel',
  connectChannelDesc:
    'Studio updates, project notes, and occasional behind-the-scenes posts.',
  connectChannelCta: 'View the channel',
  connectInstagramTitle: 'Instagram',
  connectInstagramDesc:
    'A casual place for quick hellos, visual updates, and direct messages.',
  connectInstagramCta: 'Message on Instagram',
  connectOpenExternal: 'Opens in a new tab',

  // Contact
  contactEyebrow: 'Contact',
  contactHeading: "Let's Build Something Great Together.",
  contactCopy:
    "Have an idea, a website to improve, or a project in mind? Tell us a little about it. We'll review your inquiry and discuss the next steps with you.",
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
  footerSignOff: 'Independent studio. Thoughtful design. Maintainable code.',
  footerCopyright: '© {year} PersianBearStudio',
  returnToTop: 'Back to top',

  // a11y
  skipToContent: 'Skip to content',
  languageLabel: 'Language',
  socialLinksLabel: 'Social links',
  siteNavLabel: 'Site navigation',
  scrollToStudio: 'Scroll to studio',
  emblemAlt: 'PersianBearStudio emblem',

  // Document-level
  metaDescription:
    'PersianBearStudio is an independent web development studio creating focused websites with clear structure, accessible interfaces, and maintainable code.',
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
  languageLabel: 'زبان',
  socialLinksLabel: 'شبکه‌های اجتماعی',
  siteNavLabel: 'ناوبری سایت',
  scrollToStudio: 'رفتن به بخش استودیو',
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

/**
 * Attribute-level i18n helper. Spread onto an element:
 *   <nav {...ariaAttrs('primaryNavLabel')}>
 * Renders the English label as `aria-label` (correct with no JS) plus
 * `data-aria-en` / `data-aria-fa`, which src/scripts/motion.ts swaps whenever
 * <html lang> changes. For <img>, `alt` is kept in sync as well.
 */
export function ariaAttrs(key: keyof Translation): Record<string, string> {
  return {
    'aria-label': translations.en[key],
    'data-aria-en': translations.en[key],
    'data-aria-fa': translations.fa[key],
  };
}

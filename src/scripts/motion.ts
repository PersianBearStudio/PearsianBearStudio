/**
 * PersianBearStudio — Motion & Interaction Layer
 * -------------------------------------------------
 * Minimal, dependency-free, accessible. All visual animation lives in CSS;
 * this module only toggles classes and small transforms.
 *
 * Capabilities:
 *   - Toggle `.is-visible` on `[data-reveal]` when they enter the viewport.
 *   - Toggle `.is-ready` on <html> so hero headlines can animate.
 *   - Magnetic CTA on fine-pointer devices only (when [data-magnetic]).
 *   - Top scroll-progress bar width = scroll %.
 *   - Cursor-following accent dot on fine-pointer devices only.
 *   - Parallax on `[data-parallax]` element in hero (subtle, throttled).
 *   - Respects `prefers-reduced-motion` for every effect.
 *
 * The page remains fully functional when this script fails to load
 * (no-JS fallback in motion.css shows everything).
 */

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------------------- */
/* Reveal-on-scroll                                                           */
/* -------------------------------------------------------------------------- */
function initReveal(): void {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal]')
  );
  if (els.length === 0) return;

  // If IntersectionObserver isn't available, show everything immediately.
  if (!('IntersectionObserver' in window) || reduceMotion()) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger when the element is ~12% into the viewport
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.1,
    }
  );

  els.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------------------- */
/* Hero ready flag — triggers staggered hero-line reveal                      */
/* -------------------------------------------------------------------------- */
function initHeroReady(): void {
  const html = document.documentElement;
  // Defer one frame so styles are flushed before the transition begins.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.add('is-ready');
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Magnetic CTA (fine pointer only)                                           */
/* -------------------------------------------------------------------------- */
function initMagnetic(): void {
  if (reduceMotion()) return;
  if (!document.documentElement.classList.contains('is-fine-pointer')) return;

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-magnetic]')
  );
  if (targets.length === 0) return;

  const MAX = 12; // px

  targets.forEach((el) => {
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      tx = Math.max(-1, Math.min(1, dx)) * MAX;
      ty = Math.max(-1, Math.min(1, dy)) * MAX;
      if (raf === 0) {
        raf = requestAnimationFrame(apply);
      }
    };

    const apply = () => {
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = 0;
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = '';
        raf = 0;
      });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });
}

/* -------------------------------------------------------------------------- */
/* Scroll progress bar                                                        */
/* -------------------------------------------------------------------------- */
function initScrollProgress(): void {
  const bar = document.querySelector<HTMLElement>('[data-scroll-progress]');
  if (!bar) return;

  let raf = 0;
  const update = () => {
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? window.scrollY / docHeight : 0;
    const clamped = Math.max(0, Math.min(1, scrolled));
    bar.style.transform = `scaleX(${clamped})`;
    raf = 0;
  };

  const onScroll = () => {
    if (raf === 0) raf = requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* -------------------------------------------------------------------------- */
/* Custom cursor (fine pointer only)                                           */
/*   - Hide native cursor (CSS does this)                                     */
/*   - Render an orange dot that tracks the pointer exactly                   */
/*   - Render a ring that lerps behind the dot for a trailing effect          */
/*   - Expand the ring when hovering interactive elements                     */
/*   - Shrink the dot while pressing                                          */
/* Disabled on touch devices, coarse pointers, and reduced-motion users      */
/* (the CSS rules in motion.css gate the visibility).                        */
/*                                                                            */
/* Note: we check `document.documentElement.classList.contains('is-fine-pointer')` */
/* rather than calling `matchMedia('(pointer: fine)').matches` directly.    */
/* The early-flags inline script in Layout.astro already sets that class     */
/* pre-paint based on `pointer: fine AND hover: hover`, so this is           */
/* equivalent and lets us honor the class as the single source of truth.    */
/* We also re-check the class on every mousemove — harmless on real browsers */
/* where the class is set pre-paint and never changes.                       */
/* -------------------------------------------------------------------------- */
function initCursor(): void {
  if (reduceMotion()) return;
  // We do NOT bail early here — even if the class isn't present at boot
  // (e.g. very fast page load racing with the early-flags script), the
  // first mousemove will re-check. The CSS gates the actual visibility
  // via `.cursor-dot / .cursor-ring { display: none }` when not
  // `is-fine-pointer`, so this is safe — no work happens for non-fine
  // pointer users because the first mousemove will return early.

  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
  if (!dot || !ring) return;

  let dotX = 0;
  let dotY = 0;
  let ringX = 0;
  let ringY = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;

  const loop = () => {
    // Dot snaps to pointer; ring lerps for a trailing feel.
    dotX = tx;
    dotY = ty;
    ringX += (tx - ringX) * 0.18;
    ringY += (ty - ringY) * 0.18;
    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    // Continue until both are within sub-pixel range.
    if (Math.abs(tx - ringX) > 0.1 || Math.abs(ty - ringY) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  };

  const onMove = (e: MouseEvent) => {
    // Re-check the class on every move — fast path for non-fine-pointer users.
    if (!document.documentElement.classList.contains('is-fine-pointer')) return;
    tx = e.clientX;
    ty = e.clientY;
    dot.classList.add('is-active');
    ring.classList.add('is-active');
    if (raf === 0) raf = requestAnimationFrame(loop);
  };

  const onLeave = () => {
    dot.classList.remove('is-active');
    ring.classList.remove('is-active');
  };

  const onDown = () => {
    if (!document.documentElement.classList.contains('is-fine-pointer')) return;
    dot.classList.add('is-press');
  };
  const onUp = () => dot.classList.remove('is-press');

  // Hover expansion: detect when the pointer enters / leaves any
  // interactive element (a, button, [data-magnetic], input, [tabindex]).
  const hoverSelector =
    'a, button, input, textarea, select, [tabindex], [data-magnetic]';
  const onOver = (e: MouseEvent) => {
    if (!document.documentElement.classList.contains('is-fine-pointer')) return;
    const target = e.target as Element | null;
    if (target && target.closest && target.closest(hoverSelector)) {
      ring.classList.add('is-hover');
    }
  };
  const onOut = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target && target.closest && target.closest(hoverSelector)) {
      ring.classList.remove('is-hover');
    }
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mousedown', onDown);
  document.addEventListener('mouseup', onUp);
  // Use mouseover / mouseout (bubble) so we catch hover state on every
  // interactive element without per-element listeners.
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);

}

/* -------------------------------------------------------------------------- */
/* Hero parallax (subtle)                                                      */
/* -------------------------------------------------------------------------- */
function initParallax(): void {
  if (reduceMotion()) return;
  const target = document.querySelector<HTMLElement>('[data-parallax]');
  if (!target) return;
  // Skip on touch-first devices — trust the early-flags class.
  if (!document.documentElement.classList.contains('is-fine-pointer')) return;

  let raf = 0;
  const MAX = 14; // px

  const onMove = (e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    if (raf === 0) {
      raf = requestAnimationFrame(() => {
        target.style.transform = `translate3d(${dx * MAX}px, ${dy * MAX}px, 0)`;
        raf = 0;
      });
    }
  };

  // Only track when the cursor is over the hero to limit cost
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  hero.addEventListener('mousemove', onMove, { passive: true });
  hero.addEventListener('mouseleave', () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    target.style.transform = '';
  });
}

/* -------------------------------------------------------------------------- */
/* Bilingual aria-label / alt (data-aria-en / data-aria-fa)                    */
/* -------------------------------------------------------------------------- */
function initAriaI18n(): void {
  const html = document.documentElement;
  const apply = () => {
    const lang = html.getAttribute('lang') === 'fa' ? 'fa' : 'en';
    document.querySelectorAll<HTMLElement>('[data-aria-en]').forEach((el) => {
      // The menu toggle shows its "close" label while the menu is open.
      const open = el.getAttribute('aria-expanded') === 'true';
      const label =
        (open && el.getAttribute(`data-aria-close-${lang}`)) ||
        el.getAttribute(`data-aria-${lang}`);
      if (!label) return;
      el.setAttribute('aria-label', label);
      if (el.tagName === 'IMG') el.setAttribute('alt', label);
    });
  };
  apply();
  new MutationObserver(apply).observe(html, {
    attributes: true,
    attributeFilter: ['lang'],
  });
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                        */
/* -------------------------------------------------------------------------- */
function boot(): void {
  initAriaI18n();
  initReveal();
  initHeroReady();
  initMagnetic();
  initScrollProgress();
  initCursor();
  initParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

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

const isFinePointer = () =>
  window.matchMedia('(pointer: fine)').matches;

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
  if (!isFinePointer() || reduceMotion()) return;

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
/* Cursor accent (fine pointer only)                                          */
/* -------------------------------------------------------------------------- */
function initCursorAccent(): void {
  if (!isFinePointer() || reduceMotion()) return;

  const dot = document.querySelector<HTMLElement>('[data-cursor-accent]');
  if (!dot) return;

  let raf = 0;
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;

  const onMove = (e: MouseEvent) => {
    tx = e.clientX;
    ty = e.clientY;
    dot.classList.add('is-active');
    if (raf === 0) raf = requestAnimationFrame(loop);
  };

  const loop = () => {
    // Lerp for a subtle trailing feel
    x += (tx - x) * 0.25;
    y += (ty - y) * 0.25;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(1)`;
    if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  };

  const onLeave = () => {
    dot.classList.remove('is-active');
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);
}

/* -------------------------------------------------------------------------- */
/* Hero parallax (subtle)                                                      */
/* -------------------------------------------------------------------------- */
function initParallax(): void {
  if (reduceMotion()) return;
  const target = document.querySelector<HTMLElement>('[data-parallax]');
  if (!target) return;
  if (!isFinePointer()) return; // skip on touch-first devices

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
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                        */
/* -------------------------------------------------------------------------- */
function boot(): void {
  initReveal();
  initHeroReady();
  initMagnetic();
  initScrollProgress();
  initCursorAccent();
  initParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

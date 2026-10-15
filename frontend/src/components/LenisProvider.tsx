'use client';
import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';

/**
 * Vertical center of an element in document coordinates, clamped to >= 0.
 * Centering the section's heading (not the section's top edge) keeps the
 * landing clear of large responsive section padding at every viewport.
 */
function centeredTargetFor(anchor: HTMLElement): number {
  const rect = anchor.getBoundingClientRect();
  const anchorTop = rect.top + window.scrollY;
  return Math.max(0, anchorTop - (window.innerHeight - rect.height) / 2);
}

function resolveAnchor(section: HTMLElement): HTMLElement {
  return section.querySelector<HTMLElement>('[data-section-anchor]') ?? section;
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Route all in-page anchor clicks through Lenis so navigation
    // glides to the section's vertical center instead of jumping
    // to its top edge (which strands large section padding on screen).
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"], a[href^="/#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const hash = href.startsWith('/#') ? href.slice(1) : href;
      if (!hash.startsWith('#') || hash.length < 2) return;
      // Only handle same-page anchors on the landing page.
      if (href.startsWith('/#') && window.location.pathname !== '/') return;
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      e.preventDefault();
      const landing = resolveAnchor(el);
      if (reduceMotion) {
        window.scrollTo({ top: centeredTargetFor(landing), behavior: 'auto' });
      } else {
        lenis.scrollTo(centeredTargetFor(landing), { duration: 1.4 });
      }
      window.history.pushState(null, '', hash);
    };
    document.addEventListener('click', onDocumentClick);

    // Deep-link support: glide to the centered hash target on initial load.
    if (window.location.hash.length > 1) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) {
        const landing = resolveAnchor(el);
        if (reduceMotion) {
          window.scrollTo({ top: centeredTargetFor(landing), behavior: 'auto' });
        } else {
          const t = window.setTimeout(() => {
            lenis.scrollTo(centeredTargetFor(resolveAnchor(el)), { duration: 1.4 });
          }, 300);
          (window as unknown as { __lenisTimer?: number }).__lenisTimer = t as unknown as number;
        }
      }
    }

    return () => {
      document.removeEventListener('click', onDocumentClick);
      cancelAnimationFrame(rafId);
      const timer = (window as unknown as { __lenisTimer?: number }).__lenisTimer;
      if (timer) window.clearTimeout(timer);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}

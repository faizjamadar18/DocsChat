'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  /** Fraction of the section that must be visible. Defaults to 0.3. */
  threshold?: number;
  /** Offset for sticky nav clearance. Defaults to '-96px 0px 0px 0px'. */
  rootMargin?: string;
}

/**
 * Viewport gate for scroll-driven section animations.
 *
 * Standard pattern: section timelines must start when the user lands on the
 * section — not on page mount. `hasEntered` flips true on first entry and
 * stays true (start-once trigger); `inView` tracks live visibility so
 * effects can pause timers while off-screen and resume on return.
 * SSR-safe: both default to false until the observer runs after mount.
 */
export function useInView<T extends HTMLElement = HTMLElement>({
  threshold = 0.3,
  rootMargin = '-96px 0px 0px 0px',
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Ancient browsers only: defer so this stays a subscription-style
      // update (no synchronous setState in the effect body).
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setInView(true);
        setHasEntered(true);
      });
      return () => {
        cancelled = true;
      };
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setHasEntered(true);
        } else {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView, hasEntered };
}

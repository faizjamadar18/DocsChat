'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import HeroMockup from './HeroMockup';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth > 0) {
        setScale(Math.min(1, availableWidth / 1000));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="overview" className="px-4 sm:px-6 py-8 md:py-16 flex flex-col gap-8 sm:gap-10 items-center w-full max-w-full overflow-hidden scroll-mt-24">
      {/* Top Headline & CTAs Grid */}
      <div data-section-anchor="true" className="max-w-300 w-full flex flex-col gap-6 md:grid md:grid-cols-12 md:items-end">
        {/* Left Column: Heading and Subtitle */}
        <div className="md:col-span-8 flex flex-col gap-3.5 sm:gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-[50px] font-[550] tracking-[-0.03em] leading-[1.12] text-[#21201c] text-balance">
            One place to ask 
            <br />
            across everything  
          </h1>
          <p className="text-sm sm:text-base md:text-[19px] leading-relaxed tracking-[-0.01em] text-[#63635e] max-w-2xl text-pretty">
            Bring what you already use into one workspace, for teams and for individuals. Ask in plain language, and every answer links to its evidence, one click away.
            <br />If your data doesn’t say it, neither does it.
          </p>
        </div>

        {/* Right Column: Stacked Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9 justify-end md:items-end">
          <Link
            href="/register"
            className="group relative overflow-hidden w-full sm:w-37.5 h-10 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#21201c] text-[#ffffff] font-medium text-sm hover:opacity-80 active:scale-95 transition-all shadow-xs whitespace-nowrap text-center cursor-pointer select-none"
          >
            <div className="relative overflow-hidden">
              <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                Start for free
              </div>
              <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                Start for free
              </div>
            </div>
          </Link>
          <Link
            href="#how-it-works"
            scroll={false}
            className="group relative overflow-hidden w-full sm:w-37.5 h-10 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] hover:border-[#d0cfcb] active:scale-95 transition-all whitespace-nowrap text-center cursor-pointer select-none"
          >
            <div className="relative overflow-hidden">
              <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                See how it works
              </div>
              <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                See how it works
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Cloud & Mockup Banner Container */}
      <div className="max-w-300 w-full relative">
        {/* Subtle Ambient Drop Glow for Depth */}
        <div className="absolute -inset-1 sm:-inset-2 bg-linear-to-b from-[#8ebcca]/20 via-[#ffd7c0]/15 to-transparent blur-xl rounded-3xl -z-1 pointer-events-none" />

        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e2e1de] shadow-sm p-3.5 sm:p-7 md:p-12 lg:p-14 flex items-center justify-center">
          {/* CSS-only Mesh Pastel Gradient Background */}
          <div className="absolute inset-0 hero-bg pointer-events-none" />

          {/* Floating Scaled Hero Mockup (static preview image — fully inert across all viewports) */}
          <div ref={containerRef} aria-hidden="true" className="relative z-3 w-full flex items-center justify-center pointer-events-none select-none">
            <div
              style={{
                width: `${1000 * scale}px`,
                height: `${640 * scale}px`,
              }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-ui-visual shrink-0"
            >
              <div
                style={{
                  width: '1000px',
                  height: '640px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <HeroMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

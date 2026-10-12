'use client';

import React from 'react';
import Link from 'next/link';

interface CornerPlusProps {
  position: 'tl' | 'tr' | 'bl' | 'br';
}

function CornerPlus({ position }: CornerPlusProps) {
  const positionClasses = {
    tl: '-top-[8.5px] -left-[8.5px]',
    tr: '-top-[8.5px] -right-[8.5px]',
    bl: '-bottom-[8.5px] -left-[8.5px]',
    br: '-bottom-[8.5px] -right-[8.5px]',
  };

  return (
    <div
      className={`pointer-events-none absolute size-4.25 bg-[#fdfdfc] z-20 flex items-center justify-center ${positionClasses[position]}`}
      aria-hidden="true"
    >
      {/* Horizontal 1px line */}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#22211d]/75" />
      {/* Vertical 1px line */}
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#22211d]/75" />
    </div>
  );
}

export default function CTABanner() {
  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-20">
      {/* Outer frame (matches page, dashed border, padding to inner dark panel, corner plus markers) */}
      <div className="relative w-full max-w-300 rounded-none border border-dashed border-[#cfcac0] bg-[#fdfdfc] p-2.5 sm:p-3">
        {/* 4 Corner "+" crosshair markers */}
        <CornerPlus position="tl" />
        <CornerPlus position="tr" />
        <CornerPlus position="bl" />
        <CornerPlus position="br" />

        {/* Inner dark panel */}
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/6 bg-linear-to-b from-[#1a1a17] to-[#121210] py-12 px-6 sm:py-16 md:py-20 md:px-12 text-center flex flex-col items-center justify-center gap-7 sm:gap-8 shadow-sm">
          {/* Background layer: dot grid + breathing warm glow */}
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            aria-hidden="true"
          >
            {/* Dot grid with fade toward edges */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255, 255, 255, 0.09) 1.2px, transparent 1.2px)',
                backgroundSize: '18px 18px',
                maskImage:
                  'radial-gradient(ellipse 60% 70% at 50% 50%, #000 20%, transparent 78%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 60% 70% at 50% 50%, #000 20%, transparent 78%)',
              }}
            />

            {/* Soft warm glow behind the headline */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-155 max-w-[90%] h-75 rounded-full blur-xl pointer-events-none animate-cta-glow motion-reduce:animate-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(214, 180, 120, 0.22) 0%, rgba(214, 180, 120, 0.08) 50%, transparent 75%)',
              }}
            />
          </div>

          {/* Content layer */}
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl">
            {/* Pill badge above headline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-dashed border-white/18 bg-white/3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#98938a]">
              <span className="size-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span>Ready when you are</span>
            </div>

            {/* Headline & Description */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-[-0.03em] leading-tight text-[#f3f1ec] text-balance">
                Get answers you can actually trust
              </h2>
              <p className="text-sm md:text-base text-[#98938a] max-w-lg leading-relaxed text-pretty">
                Ask questions across your docs and code. Verify every answer with citations.
              </p>
            </div>

            {/* Actions & Muted subtext */}
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                {/* Primary Button */}
                <Link
                  href="/register"
                  className="group relative w-full sm:w-44 py-3 px-6 rounded-lg bg-[#f3f1ec] text-[#171715] font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_8px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.45)] overflow-hidden inline-flex items-center justify-center gap-1.5"
                >
                  {/* Diagonal shine sweep */}
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-linear-to-r from-transparent via-white/50 to-transparent -skew-x-12"
                    aria-hidden="true"
                  />
                  <span className="relative z-10 font-medium">Start for free</span>
                  <svg
                    className="relative z-10 size-3.5 transition-transform duration-200 group-hover:translate-x-0.75"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.33334 8H12.6667M12.6667 8L8.66668 4M12.6667 8L8.66668 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                {/* Secondary Button */}
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-44 py-3 px-6 rounded-lg bg-[#1f1e1b] border border-white/[0.14] text-[#f3f1ec] font-medium text-sm hover:border-white/[0.28] hover:bg-[#252420] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 inline-flex items-center justify-center text-center"
                >
                  See how it works
                </Link>
              </div>

              {/* Subtext */}
              <p className="text-xs text-[#98938a] font-normal">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


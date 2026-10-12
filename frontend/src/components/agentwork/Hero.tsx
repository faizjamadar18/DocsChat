'use client';

import React from 'react';
import Link from 'next/link';
import HeroMockup from './HeroMockup';

export default function Hero() {
  return (
    <section id="overview" className="px-4 sm:px-6 py-8 md:py-16 flex flex-col gap-8 sm:gap-10 items-center w-full max-w-full overflow-hidden">
      {/* Top Headline & CTAs Grid */}
      <div className="max-w-300 w-full flex flex-col gap-6 md:grid md:grid-cols-12 md:items-end">
        {/* Left Column: Heading and Subtitle */}
        <div className="md:col-span-8 flex flex-col gap-3.5 sm:gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-[50px] font-[550] tracking-[-0.03em] leading-[1.12] text-[#21201c] text-balance">
            Your second brain,
            <br />
            backed by sources
          </h1>
          <p className="text-sm sm:text-base md:text-[19px] leading-relaxed tracking-[-0.01em] text-[#63635e] max-w-2xl text-pretty">
            Unified workspace for every tool, document and your code, with the evidence behind every claim one click away. When the answer isn&apos;t written down, it asks the source who knows it. If your files don’t say it, neither does it.
          </p>
        </div>

        {/* Right Column: Stacked Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9 justify-end md:items-end">
          <Link
            href="/register"
            className="w-full sm:w-[150px] h-10 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#21201c] text-[#ffffff] font-medium text-sm hover:bg-black transition-colors shadow-xs whitespace-nowrap text-center"
          >
            Start for free
          </Link>
          <Link
            href="#how-it-works"
            className="w-full sm:w-[150px] h-10 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] transition-colors whitespace-nowrap text-center"
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* Cloud & Mockup Banner Container */}
      <div className="max-w-300 w-full relative">
        {/* Subtle Ambient Drop Glow for Depth */}
        <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-b from-[#8ebcca]/20 via-[#ffd7c0]/15 to-transparent blur-xl rounded-3xl -z-1 pointer-events-none" />

        <div className="relative min-h-[500px] h-[580px] sm:h-[640px] md:h-auto md:aspect-1200/860 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e2e1de] shadow-sm">
          {/* CSS-only Mesh Pastel Gradient Background */}
          <div className="absolute inset-0 hero-bg pointer-events-none" />

          {/* Floating Hero UI Mockup */}
          <div className="absolute inset-x-2 sm:inset-x-6 md:inset-x-14 lg:inset-x-20 inset-y-2.5 sm:inset-y-6 md:inset-y-12 lg:inset-y-16 z-3 flex items-center justify-center">
            <div className="w-full h-full max-h-190">
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

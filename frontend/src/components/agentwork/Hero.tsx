'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroMockup from './HeroMockup';

export default function Hero() {
  return (
    <section className="px-6 py-8 md:py-16 flex flex-col gap-10 items-center">
      {/* Top Headline & CTAs Grid */}
      <div className="max-w-300 w-full flex flex-col gap-6 md:grid md:grid-cols-12 md:items-end">
        {/* Left Column: Heading and Subtitle */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <h1 className="text-[34px] md:text-[50px] font-[550] tracking-[-0.03em] leading-[1.12] text-[#21201c] text-balance">
            Your team&apos;s knowledge,
            <br />
            ready to answer
          </h1>
          <p className="text-base md:text-[19px] leading-relaxed tracking-[-0.01em] text-[#63635e] max-w-2xl text-pretty">
            DocsChat brings Google Drive, Notion, GitHub, and PDFs into one workspace. Ask questions in plain English, get answers with citations, and draft what&apos;s next in Studio.
          </p>
        </div>

        {/* Right Column: Stacked Action Buttons */}
        <div className="flex flex-col gap-2.5 md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9 justify-end">
          <Link
            href="/register"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#21201c] text-[#ffffff] font-medium text-sm hover:bg-accent-hover transition-colors shadow-xs"
          >
            Start for free
          </Link>
          <Link
            href="#how-it-works"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] transition-colors"
          >
            See how it works
          </Link>

          <p className="mt-1 text-[13px] leading-relaxed text-[#8d8d86] md:text-right">
            Free to start · No credit card required
          </p>
          {/* Trust row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end text-[13px] text-[#63635e]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Cited answers
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Private by default
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Works with Claude &amp; Cursor
            </span>
          </div>
        </div>
      </div>

      {/* Cloud & Mockup Banner Container */}
      <div className="max-w-300 w-full">
        <div className="relative aspect-9/18 md:aspect-1200/860 overflow-hidden rounded-2xl border border-[#e2e1de] shadow-sm">
          {/* Base Sky Gradient */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #00759b, #378fa7)' }}
          />

          {/* SVG Fractal Noise Filter Overlay */}
          <div className="pointer-events-none absolute inset-0 z-1 opacity-25 mix-blend-overlay">
            <svg className="size-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <filter id="hero-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#hero-grain)" />
            </svg>
          </div>

          {/* Static Cloud Background Image (Zero WebGL lag, 60fps buttery-smooth) */}
          <div className="absolute inset-0 z-2 pointer-events-none">
            <Image
              src="/images/hero-clouds.png"
              alt="Clouds background"
              fill
              priority
              className="object-cover object-center"
            />
          </div>

          {/* Floating Hero UI Mockup */}
          <div className="absolute inset-x-2 md:inset-x-34 inset-y-4 md:inset-y-26 z-3 flex items-center justify-center">
            <div className="w-full h-full max-h-190">
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

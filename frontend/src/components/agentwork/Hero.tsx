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
            One place to ask,
            <br />
            across every tool
          </h1>
          <p className="text-base md:text-[19px] leading-relaxed tracking-[-0.01em] text-[#63635e] max-w-2xl text-pretty">
            Agentwork connects to the tools your team already uses and answers questions across all of them in plain language with sources you can check. When the answer isn&apos;t written down, it asks the person who knows.
          </p>
        </div>

        {/* Right Column: Stacked Action Buttons */}
        <div className="flex flex-col gap-2.5 md:col-span-4 md:col-start-9 lg:col-span-3 lg:col-start-10 justify-end">
          <a
            href="https://savvycal.com/David-Wind-b585dcf7/agentwork"
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#21201c] text-[#ffffff] font-medium text-sm hover:bg-[#000000] transition-colors shadow-xs"
          >
            Book a demo
          </a>
          <Link
            href="/register"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] transition-colors"
          >
            Create account
          </Link>
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
              src="/images/hero-clouds.jpg"
              alt="Clouds background"
              fill
              priority
              className="object-cover object-center"
            />
          </div>

          {/* Floating Hero UI Mockup */}
          <div className="absolute inset-x-2 md:inset-x-8 inset-y-4 md:inset-y-8 z-3 flex items-center justify-center">
            <div className="w-full h-full max-h-190">
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

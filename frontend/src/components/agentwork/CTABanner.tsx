'use client';

import React from 'react';
import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-20">
      {/* Clean, high-performance card without cloud references */}
      <div className="relative w-full max-w-300 overflow-hidden rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] p-12 md:p-20 text-center flex flex-col items-center justify-center gap-8 shadow-xs">
        {/* Subtle radial lighting */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-tight text-[#21201c] text-balance">
            Get answers your team can trust
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-44 py-3 px-6 rounded-lg bg-[#21201c] text-[#ffffff] font-medium text-sm hover:bg-accent-hover transition-colors shadow-xs inline-flex items-center justify-center"
            >
              Start for free
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-44 py-3 px-6 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] transition-colors inline-flex items-center justify-center"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

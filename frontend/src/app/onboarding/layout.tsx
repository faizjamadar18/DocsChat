import React from 'react';
import Link from 'next/link';
import { QuelloMark } from '../../components/agentwork/Icons';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#111110] text-[#f4f4f5] flex flex-col items-center justify-between px-6 py-10 sm:py-12 antialiased selection:bg-white/20 selection:text-white">
      <div className="w-full max-w-[360px] sm:max-w-[380px] flex-1 flex flex-col justify-between">
        {/* Brand mark at top, left-aligned with column */}
        <div className="pt-2">
          <Link href="/" className="inline-flex items-center text-white focus:outline-none" aria-label="Quello home">
            <QuelloMark className="size-9 sm:size-8 text-white" />
          </Link>
        </div>

        {/* Center Content */}
        <div className="py-10 my-auto">
          {children}
        </div>

        {/* Footer, strictly left-aligned with column */}
        <div className="pb-2 flex items-center gap-5 text-[13px] text-neutral-400 font-normal">
          <Link href="/privacy" className="hover:text-neutral-200 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-neutral-200 transition-colors">
            Terms
          </Link>
          <Link href="mailto:support@quello.dev" className="hover:text-neutral-200 transition-colors">
            Support
          </Link>
        </div>
      </div>
    </div>
  );
}

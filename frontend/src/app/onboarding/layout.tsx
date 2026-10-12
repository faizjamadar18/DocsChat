import React from 'react';
import Link from 'next/link';

// New Q logo mark from /public/icons/logo/Q-black.svg
function QuelloLogo({ className = 'size-6 sm:size-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 341.21 341.50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Quello"
    >
      <path d="M157.10 0.55A170.75 170.75 0 0 1 341.21 160.70L263.62 165.81A92.99 92.99 0 0 0 162.62 78.11Z" />
      <path d="M4.08 207.87A170.75 170.75 0 0 1 136.89 3.39L153.03 79.46A92.99 92.99 0 0 0 80.12 191.59Z" />
      <path d="M230.78 330.61A170.75 170.75 0 0 1 9.71 227.51L82.78 200.91A92.99 92.99 0 0 0 204.09 257.57Z" />
      <path d="M173.83 213.06L213.01 174.02L329.11 289.93L289.90 328.99Z" />
    </svg>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#111110] text-[#f4f4f5] flex flex-col items-center justify-between px-6 py-10 sm:py-12 antialiased selection:bg-white/20 selection:text-white">
      <div className="w-full max-w-[360px] sm:max-w-[380px] flex-1 flex flex-col justify-between">
        {/* Brand mark at top, left-aligned with column */}
        <div className="pt-2">
          <Link href="/" className="inline-flex items-center text-white focus:outline-none" aria-label="Quello home">
            <QuelloLogo className="size-6 sm:size-7 text-white" />
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

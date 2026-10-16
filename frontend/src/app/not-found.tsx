import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { QuelloMark } from '../components/landing/Icons';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Quello',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#fdfdfc] text-[#21201c] antialiased selection:bg-[#ffd7c0] selection:text-[#592d18] relative overflow-hidden">
      {/* Subtle ambient drop glow background matching Quello hero design */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-85 max-w-[90vw] bg-linear-to-b from-[#8ebcca]/20 via-[#ffd7c0]/15 to-transparent blur-3xl rounded-full -z-10 pointer-events-none"
      />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-0.5 text-[#21201c] hover:opacity-85 transition-opacity"
        >
          <QuelloMark className="size-6 text-[#21201c]" />
          <span className="text-lg font-semibold tracking-[-0.03em] font-heading">
            uello
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center gap-1.5 text-[#21201c] hover:text-[#ff6a00] transition-colors text-sm"
          >
            <span>Sign in</span>
            <svg
              className="size-3 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-14 text-center max-w-2xl mx-auto z-10 w-full">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e2e1de] bg-[#ffffff]/80 backdrop-blur-xs text-xs font-medium text-[#63635e] mb-6 shadow-2xs">
          <span className="size-1.5 rounded-full bg-[#ff6a00] animate-pulse" />
          <span>Error 404 · Page Not Found</span>
        </div>

        {/* Big Stylized 404 Headline */}
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-[550] tracking-[-0.04em] text-[#21201c] font-heading leading-none select-none">
          404
        </h1>

        <h2 className="mt-4 text-2xl sm:text-3xl font-[550] tracking-[-0.02em] text-[#21201c] font-heading text-balance">
          Lost in the workspace?
        </h2>

        <p className="mt-3 text-sm sm:text-base text-[#63635e] max-w-md mx-auto leading-relaxed text-pretty">
          The page you&apos;re looking for was moved, renamed, or never existed in the first place.
        </p>

        {/* Action Buttons with signature text-swapping animation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center">
          <Link
            href="/"
            className="group relative overflow-hidden w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-xl bg-[#21201c] text-[#ffffff] font-medium text-sm hover:opacity-85 active:scale-95 transition-all shadow-xs whitespace-nowrap text-center cursor-pointer select-none"
          >
            <div className="relative overflow-hidden">
              <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                Back to home
              </div>
              <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                Back to home
              </div>
            </div>
          </Link>

          <Link
            href="/home"
            className="group relative overflow-hidden w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-xl bg-[#ffffff] border border-[#e2e1de] text-[#21201c] font-medium text-sm hover:bg-[#f9f9f8] hover:border-[#d0cfcb] active:scale-95 transition-all shadow-xs whitespace-nowrap text-center cursor-pointer select-none"
          >
            <div className="relative overflow-hidden">
              <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                Open workspace
              </div>
              <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                Open workspace
              </div>
            </div>
          </Link>
        </div>

        {/* Helpful navigation links */}
        <div className="mt-12 pt-8 border-t border-[#e2e1de]/60 w-full max-w-md">
          <p className="text-xs uppercase tracking-wider text-[#8e8b85] font-semibold mb-3">
            Helpful Links
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#63635e]">
            <Link href="/#how-it-works" className="hover:text-[#21201c] transition-colors">
              How it works
            </Link>
            <Link href="/#faq" className="hover:text-[#21201c] transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-[#21201c] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#21201c] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-xs text-[#8e8b85] flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#e2e1de]/40">
        <p>© {new Date().getFullYear()} Quello Inc. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>All systems operational</span>
        </div>
      </footer>
    </div>
  );
}

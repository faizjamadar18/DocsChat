'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentworkLogo } from './Icons';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasSession, mounted } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 320);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderActionButton = (size: 'default' | 'sm' = 'default') => {
    // Hydration-safe: server and first client paint render the skeleton.
    // After mount, decide from the sync token read (hasSession) — never wait
    // for the /auth/me round-trip, so the CTA is there on first paint.
    if (!mounted) {
      return (
        <span
          aria-hidden="true"
          className={`inline-block rounded bg-[#e9e8e6] animate-pulse ${
            size === 'sm' ? 'h-4 w-16' : 'h-5 w-20'
          }`}
        />
      );
    }
    const showDashboard = hasSession;
    const label = showDashboard ? 'Dashboard' : 'Sign in';
    const href = showDashboard ? '/home' : '/login';
    return (
      <Link
        href={href}
        className={`group inline-flex items-center gap-1.5 font-medium text-[#21201c] hover:text-[#ff6a00] transition-colors ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        <span>{label}</span>
        <svg
          className={`${size === 'sm' ? 'size-3.5' : 'size-4'} transition-transform group-hover:translate-x-0.5`}
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
    );
  };

  return (
    <>
      {/* Top Main Navigation */}
      <nav aria-label="Main navigation" className="w-full py-10 px-6">
        <div className="mx-auto max-w-300 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Quello home" className="text-[#21201c] hover:opacity-90">
            <AgentworkLogo />
          </Link>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center">
            {renderActionButton()}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[#f1f0ef] text-[#21201c]"
              aria-label="Toggle menu"
            >
              <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Sticky Fixed Glass Navigation */}
      <div
        className={`fixed top-0 inset-x-0 z-50 py-3.5 px-6 bg-[#fdfdfc]/85 backdrop-blur-lg border-b border-[#e2e1de] transition-all duration-300 ${
          isSticky ? 'translate-y-0 opacity-100 shadow-sm' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-300 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Quello home" className="text-[#21201c]">
            <AgentworkLogo />
          </Link>
          <div className="hidden md:flex items-center">
            {renderActionButton('sm')}
          </div>
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-[#f1f0ef] text-[#21201c]"
            >
              <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden flex flex-col justify-end transition-opacity duration-300">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-[#ffffff] rounded-t-3xl p-6 pb-safe flex flex-col gap-5 max-h-[85vh] overflow-y-auto border-t border-[#e2e1de] shadow-2xl animate-fade-in">
            {/* Top Bar with Logo and Close */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f0ef]">
              <AgentworkLogo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#63635e] hover:text-[#21201c] hover:bg-[#f1f0ef] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* In-page navigation links */}
            <nav className="flex flex-col gap-1 py-1">
              {[
                { label: 'Overview', href: '#overview' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Traceability', href: '#traceability' },
                { label: 'Connected AI Apps', href: '#connectors' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 px-3 rounded-xl text-base font-medium text-[#21201c] hover:bg-[#f9f9f8] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-[#f1f0ef]">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-[#21201c] text-[#ffffff] font-medium text-sm hover:bg-black transition-colors shadow-xs"
              >
                Start for free
              </Link>
              <div
                className="w-full flex items-center justify-center py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {renderActionButton('default')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentworkLogo } from './Icons';

const SOLUTIONS = [
  { label: 'Consulting', description: 'Client context, past work, and expertise on every engagement', href: '#' },
  { label: 'Agencies', description: 'Briefs, past campaigns, and client context on every account', href: '#' },
  { label: 'Accounting', description: 'Client files, past year-ends, and the firm’s approach in one place', href: '#' },
  { label: 'Software', description: 'Answers about your product, customers, and decisions for every team', href: '#' },
];

const NAV_LINKS = [
  { label: 'Pricing', href: '/pricing', external: false },
  { label: 'Blog', href: '/blog', external: false },
  { label: 'Trust', href: 'https://trust.agentwork.com', external: true },
  { label: 'Log in', href: '/login', external: false },
];

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 320);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderNavItems = () => (
    <div className="flex items-center gap-7 lg:gap-9 text-sm font-medium text-[#21201c]">
      {/* Solutions dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setSolutionsOpen(true)}
        onMouseLeave={() => setSolutionsOpen(false)}
      >
        <button
          type="button"
          onClick={() => setSolutionsOpen(!solutionsOpen)}
          className="flex items-center gap-1 py-1 hover:text-[#ff6a00] transition-colors cursor-pointer"
        >
          <span>Solutions</span>
          <svg
            className={`size-3 transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {solutionsOpen && (
          <div className="absolute top-full left-0 pt-2 z-50">
            <div className="w-72 bg-[#ffffff] rounded-xl border border-[#e2e1de] p-2 shadow-popover">
              {SOLUTIONS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col gap-0.5 p-2.5 rounded-lg hover:bg-[#f9f9f8] transition-colors"
                >
                  <span className="text-sm font-medium text-[#21201c]">{item.label}</span>
                  <span className="text-xs text-[#63635e] leading-snug">{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {NAV_LINKS.map((link) =>
        link.external ? (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#ff6a00] transition-colors"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.label}
            href={link.href}
            className="hover:text-[#ff6a00] transition-colors"
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  );

  const renderActionButtons = (size: 'default' | 'sm' = 'default') => (
    <div className="flex items-center gap-2">
      <Link
        href="/register"
        className={`inline-flex items-center justify-center font-medium rounded-lg border border-[#e2e1de] bg-[#ffffff] text-[#21201c] hover:bg-[#f9f9f8] transition-colors ${
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        Create account
      </Link>
      <a
        href="https://savvycal.com/David-Wind-b585dcf7/agentwork"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center justify-center font-medium rounded-lg bg-[#21201c] text-[#ffffff] hover:bg-accent-hover transition-colors ${
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        Book a demo
      </a>
    </div>
  );

  return (
    <>
      {/* Top Main Navigation */}
      <nav aria-label="Main navigation" className="w-full py-10 px-6">
        <div className="mx-auto max-w-300 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Agentwork home" className="text-[#21201c] hover:opacity-90">
            <AgentworkLogo />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {renderNavItems()}
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
          <Link href="/" aria-label="Agentwork home" className="text-[#21201c]">
            <AgentworkLogo />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {renderNavItems()}
            {renderActionButtons('sm')}
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
        <div className="fixed inset-0 z-50 bg-accent-hover/30 backdrop-blur-sm md:hidden flex flex-col justify-end">
          <div className="bg-[#ffffff] rounded-t-2xl p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto border-t border-[#e2e1de]">
            <div className="flex items-center justify-between">
              <AgentworkLogo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#63635e] hover:text-[#21201c]"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4 text-base font-medium text-[#21201c]">
              <div className="text-xs font-semibold text-[#8d8d86] uppercase tracking-wider">Solutions</div>
              {SOLUTIONS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="pl-2 py-1 text-sm text-[#63635e] hover:text-[#21201c]"
                >
                  {s.label}
                </Link>
              ))}
              <hr className="border-[#e2e1de]" />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {renderActionButtons('default')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

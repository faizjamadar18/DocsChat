'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentworkLogo } from './Icons';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/auth';

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 320);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderActionButton = (size: 'default' | 'sm' = 'default') => {
    // Render on first paint: token read is sync. useAuth confirms async —
    // if the token turns out invalid it clears it and we fall back to sign in.
    const showDashboard = isAuthenticated || (loading && auth.isAuthenticated());
    const label = showDashboard ? 'dashboard' : 'sign in';
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
            <div className="flex flex-col gap-2 pt-2" onClick={() => setMobileMenuOpen(false)}>
              {renderActionButton('default')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

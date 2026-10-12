'use client';

import React from 'react';
import Image from 'next/image';
import { AgentworkLogo } from './Icons';

export default function Footer() {
  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Traceability', href: '#traceability' },
    { label: 'Connected AI Apps', href: '#connectors' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <footer className="relative w-full pt-4 sm:pt-6 px-3 sm:px-4 pb-4 sm:pb-6">
      <div className="relative flex w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e2e1de] bg-[#ffffff] shadow-sm">
        <div className="mx-auto w-full max-w-312 px-4 sm:px-6 pt-10 sm:pt-16">
          <div className="flex w-full flex-col gap-8 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Brand & Company Info */}
            <div className="flex flex-col gap-4 max-w-sm">
              <AgentworkLogo className="text-[#21201c]" />
              <div className="flex flex-col gap-1 text-xs text-[#8d8d86] leading-relaxed">
                <p>One workspace to ask questions, write docs, and verify every answer.</p>
                <p>© {new Date().getFullYear()} Quello. All rights reserved.</p>
              </div>
            </div>

            {/* Single Row of Navigation Links */}
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-xs sm:text-sm font-medium text-[#63635e] hover:text-[#ff6a00] transition-colors whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Large Footer Wordmark Vector (Edge-to-edge monumental watermark matching agentwork.com) */}
        <div className="w-full mt-6 sm:mt-10 md:mt-16 overflow-hidden pointer-events-none select-none">
          <div className="relative w-full aspect-1585/415 max-h-36 sm:max-h-56 md:max-h-88 lg:max-h-55 -mb-1 sm:-mb-3 md:-mb-6">
            <Image
              src="/images/footer-wordmark.svg"
              alt="Quello.dev"
              fill
              priority
              className="object-contain object-bottom drop-shadow-[0_8px_20px_rgba(255,255,255,0.95)]"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AgentworkLogo } from './Icons';

export default function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Ask Ora', href: '/playground', external: false },
        { label: 'Studio', href: '/studio', external: false },
        { label: 'Connectors', href: '/connectors', external: false },
        { label: 'Use with AI tools', href: '/mcp', external: false },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Log in', href: '/login', external: false },
        { label: 'Create Account', href: '/register', external: false },
        { label: 'Workspace Settings', href: '/settings', external: false },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms & conditions', href: '/terms', external: false },
        { label: 'Privacy policy', href: '/privacy', external: false },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'GitHub Repository', href: 'https://github.com/faizjamadar18/DocsChat', external: true },
        { label: 'Features Overview', href: '#features', external: false },
      ],
    },
  ];

  return (
    <footer className="relative w-full pt-6 px-4">
      <div className="relative flex w-full flex-col overflow-hidden rounded-t-3xl border-t border-x border-[#e2e1de] bg-[#ffffff] shadow-sm">
        <div className="mx-auto w-full max-w-312 px-6 pt-16">
          <div className="flex w-full flex-col gap-10 md:gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* Left Brand & Company Info */}
            <div className="flex flex-col gap-4 max-w-sm">
              <AgentworkLogo className="text-[#21201c]" />
              <div className="flex flex-col gap-1 text-xs text-[#8d8d86] leading-relaxed">
                <p className="font-medium text-[#21201c]">Quello</p>
                <p>One workspace to ask questions, write docs, and verify every answer.</p>
                <p>© {new Date().getFullYear()} Quello. All rights reserved.</p>
              </div>
            </div>

            {/* Right Link Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12">
              {columns.map((col) => (
                <div key={col.title} className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8d8d86]">
                    {col.title}
                  </h4>
                  <ul className="flex flex-col gap-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[#63635e] hover:text-[#ff6a00] transition-colors"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-[#63635e] hover:text-[#ff6a00] transition-colors"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Footer Wordmark Vector */}
        <div className="mx-auto mt-16 w-full max-w-300 px-6 pb-6">
          <div className="relative w-full aspect-1201/177 max-h-44">
            <Image
              src="/images/footer-wordmark.svg"
              alt="Quello"
              fill
              className="object-contain object-bottom opacity-90 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

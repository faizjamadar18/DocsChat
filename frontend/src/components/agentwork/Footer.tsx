'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AgentworkLogo } from './Icons';

export default function Footer() {
  const columns = [
    {
      title: 'Legal',
      links: [
        { label: 'Trust Center', href: 'https://trust.agentwork.com', external: true },
        { label: 'Terms & conditions', href: '/terms', external: false },
        { label: 'Privacy policy', href: '/privacy', external: false },
      ],
    },
    {
      title: 'Product',
      links: [
        { label: 'Log in', href: '/login', external: false },
        { label: 'Sign up', href: '/register', external: false },
        { label: 'Pricing', href: '/pricing', external: false },
      ],
    },
    {
      title: 'Content',
      links: [
        { label: 'Templates', href: '#', external: false },
        { label: 'Blog', href: '/blog', external: false },
        { label: 'Changelog', href: '#', external: false },
      ],
    },
    {
      title: 'Social',
      links: [
        { label: 'LinkedIn', href: 'https://www.linkedin.com/company/agentwork', external: true },
        { label: 'X (formerly Twitter)', href: 'https://x.com/getagentwork', external: true },
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
                <p className="font-medium text-[#21201c]">FermAI ApS</p>
                <p>Copenhagen, Denmark</p>
                <p>© {new Date().getFullYear()} Agentwork. All rights reserved.</p>
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
              alt="Agentwork"
              fill
              className="object-contain object-bottom opacity-90 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';

export default function SecurityCompliance() {
  const items = [
    {
      title: 'Private workspaces',
      badge: 'Default',
      badgeColor: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
      description: 'Each workspace stays separate, with access controls that respect your existing permissions.',
      icon: (
        <svg className="size-6 text-[#21201c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Never used for training',
      badge: 'Guaranteed',
      badgeColor: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
      description: 'Your documents are never used to train public models. Disconnect any source whenever you want.',
      icon: (
        <svg className="size-6 text-[#21201c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: 'Encrypted and access-controlled',
      badge: 'Standard',
      badgeColor: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
      description: 'Encrypted in transit and at rest, with Google sign-in and workspace-level access controls.',
      icon: (
        <svg className="size-6 text-[#21201c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <section id="security" className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-12">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h2 className="text-2xl md:text-3xl font-medium leading-[1.3] tracking-[-0.03em] text-[#21201c]">
            Protected by design.
            <br />
            <span className="text-[#63635e]">Governed by default.</span>
          </h2>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#21201c] hover:text-[#ff6a00] transition-colors"
          >
            <span>View our privacy policy</span>
            <span>›</span>
          </Link>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] hover:border-[#cfceca] transition-colors"
            >
              <div className="size-12 rounded-xl bg-[#ffffff] border border-[#e2e1de] flex items-center justify-center shadow-xs">
                {item.icon}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-[#21201c]">{item.title}</h3>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#63635e]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

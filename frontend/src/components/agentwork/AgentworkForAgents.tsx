'use client';

import React from 'react';
import Link from 'next/link';
import { QuelloMark } from './Icons';
import {
  ClaudeIcon,
  GrokIcon,
} from '@/components/connectors/ConnectorIcons';

export default function AgentworkForAgents() {
  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24 bg-[#fdfdfc]">
      <div className="flex w-full max-w-[1200px] flex-col gap-6">
        {/* Website Logo App Icon Tile */}
        <div className="size-14 rounded-[18px] shadow-[0_16px_36px_-6px_rgba(0,0,0,0.32)] overflow-hidden shrink-0">
          <QuelloMark className="size-full" />
        </div>

        {/* Section Heading & Subtitle */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-2xl sm:text-[28px] md:text-[32px] font-medium tracking-[-0.03em] text-[#1a1916]">
            Use your workspace inside your AI app
          </h2>
          <p className="text-sm sm:text-[15px] md:text-base text-[#6b665e] max-w-2xl leading-normal">
            Connect your workspace so your AI app can search your documents and answer with sources. Read-only — it can never edit or delete anything.
          </p>
          <Link
            href="/mcp"
            className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#21201c] hover:text-[#ff6a00] transition-colors"
          >
            <span>How it works</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Ready integrations only — Soon providers live in the app, not on the landing page */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3.5 sm:gap-4 mt-6 w-full max-w-xl">
          {/* Card 1: Claude */}
          <Link
            href="/mcp"
            className="group flex h-[126px] sm:h-[136px] items-center justify-center rounded-2xl border border-[#e4e4e4] bg-white transition-all duration-200 hover:border-[#cfceca] hover:shadow-xs"
          >
            <div className="flex items-center gap-2 text-[#1a1916]">
              <ClaudeIcon className="size-[22px] shrink-0 text-[#D97757]" />
              <span className="text-[17px] font-medium tracking-[-0.02em] text-[#1a1916]">
                Claude
              </span>
            </div>
          </Link>

          {/* Card 2: Grok */}
          <Link
            href="/mcp"
            className="group flex h-[126px] sm:h-[136px] items-center justify-center rounded-2xl border border-[#e4e4e4] bg-white transition-all duration-200 hover:border-[#cfceca] hover:shadow-xs"
          >
            <div className="flex items-center gap-2 text-[#1a1916]">
              <GrokIcon className="size-[22px] shrink-0 text-[#1a1916]" />
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#1a1916]">
                Grok
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

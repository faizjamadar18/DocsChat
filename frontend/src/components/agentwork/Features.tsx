'use client';

import React from 'react';
import { SlackIcon, GitHubIcon, NotionIcon } from './Icons';

export default function Features() {
  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-12">
        {/* Headline */}
        <h2 className="max-w-2xl text-2xl md:text-3xl font-medium leading-[1.3] tracking-[-0.03em] text-[#21201c]">
          Sourced answers, enterprise security, and knowledge that keeps improving on its own
        </h2>

        {/* 4-Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 & 2 Container */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1: Answers you can verify */}
              <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-65">
                {/* Visual */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-xs font-medium text-[#21201c] w-fit shadow-xs">
                    <SlackIcon className="size-3.5" />
                    <span>#general</span>
                    <span className="text-[10px] text-[#8d8d86] font-mono">[1]</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-xs font-medium text-[#21201c] w-fit shadow-xs">
                    <svg className="size-3.5 text-[#eab308]" viewBox="0 0 24 24" fill="currentColor">
                      <rect width="24" height="24" rx="3" />
                    </svg>
                    <span>Q3 board deck</span>
                    <span className="text-[10px] text-[#8d8d86] font-mono">[2]</span>
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-[#21201c]">Answers you can verify</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Every response links back to the exact sources, so you can check it.
                  </p>
                </div>
              </div>

              {/* Card 2: Two-factor authentication */}
              <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-65">
                {/* Visual: MFA input */}
                <div className="flex items-center justify-center pt-6">
                  <div className="flex gap-2">
                    {['3', '8', '1', '•', '•', '•'].map((digit, i) => (
                      <div
                        key={i}
                        className={`size-8 rounded-lg border text-xs font-mono font-bold flex items-center justify-center ${
                          i < 3
                            ? 'border-[#21201c] bg-[#ffffff] text-[#21201c] shadow-xs'
                            : 'border-[#e2e1de] bg-[#fdfdfc] text-[#8d8d86]'
                        }`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-[#21201c]">Two-factor authentication</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    MFA and permission-aware access keep data with the right people.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Smarter every day */}
            <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-60">
              {/* Visual: Synced sources */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <SlackIcon className="size-4" />
                    <span className="font-medium text-[#21201c]">Slack</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 1min ago</span>
                    <span className="text-[#ff6a00] font-medium">5 new memories</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <GitHubIcon className="size-4 text-[#21201c]" />
                    <span className="font-medium text-[#21201c]">GitHub</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 2min ago</span>
                    <span className="text-[#ff6a00] font-medium">12 new memories</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <NotionIcon className="size-4 text-[#21201c]" />
                    <span className="font-medium text-[#21201c]">Notion</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 2min ago</span>
                    <span className="text-[#ff6a00] font-medium">2 new memories</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-[#21201c]">Smarter every day</h3>
                <p className="text-xs text-[#63635e] leading-relaxed">
                  It keeps learning from your connected tools and every question your team asks.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Repeatable workflows */}
          <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-130">
            {/* Visual: Daily Overview card */}
            <div className="flex flex-col gap-4 p-5 rounded-xl bg-[#ffffff] border border-[#e2e1de] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e1de]">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-[#ffd7c0] text-[#ff6a00] flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <span className="text-sm font-semibold text-[#21201c]">Daily Overview</span>
                </div>
                <span className="text-xs text-[#22c55e] font-medium bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8d8d86]">Trigger:</span>
                  <div className="font-medium text-[#21201c] mt-0.5">Schedule</div>
                </div>
                <div>
                  <span className="text-[#8d8d86]">Repeats:</span>
                  <div className="font-medium text-[#21201c] mt-0.5">Daily @ 08:00 AM</div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e2e1de]">
                <span className="text-xs text-[#8d8d86]">Instructions:</span>
                <p className="text-xs text-[#63635e] leading-relaxed bg-[#f9f9f8] p-3 rounded-lg border border-[#e2e1de]/60">
                  Summarize key updates, decisions, and blockers from the last 24 hours across every connected tool. Prioritize anything that needs my attention today. Skip routine status pings unless they mention a deadline.
                </p>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-[#21201c]">Repeatable workflows</h3>
              <p className="text-sm text-[#63635e] leading-relaxed">
                Schedule recurring briefings and tasks like a daily overview built for your role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

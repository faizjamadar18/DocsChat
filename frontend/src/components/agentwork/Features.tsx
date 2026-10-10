'use client';

import React from 'react';
import { NotionIcon, GitHubIcon, GoogleDriveIcon } from './Icons';

export default function Features() {
  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-12">
        {/* Headline */}
        <h2 className="max-w-2xl text-2xl md:text-3xl font-medium leading-[1.3] tracking-[-0.03em] text-[#21201c]">
          Transparent citations, private workspaces, and intelligent co-writing built for your team
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
                    <NotionIcon className="size-3.5 text-[#21201c]" />
                    <span>Architecture RFC</span>
                    <span className="text-[10px] text-[#8d8d86] font-mono">[1]</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e2e1de] text-xs font-medium text-[#21201c] w-fit shadow-xs">
                    <svg className="size-3.5 text-[#eab308]" viewBox="0 0 24 24" fill="currentColor">
                      <rect width="24" height="24" rx="3" />
                    </svg>
                    <span>Security_Specs.pdf</span>
                    <span className="text-[10px] text-[#8d8d86] font-mono">[2]</span>
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-[#21201c]">Answers you can verify</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Every response links back to exact source passages with transparent citation chips and expandable drawers.
                  </p>
                </div>
              </div>

              {/* Card 2: Two-factor authentication / Workspace Security */}
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
                  <h3 className="text-base font-semibold text-[#21201c]">Isolated workspace security</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Google OAuth, session protection, and tenant-isolated Qdrant vector namespaces keep your documents private.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Live connector synchronization */}
            <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-60">
              {/* Visual: Synced sources */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <GoogleDriveIcon className="size-4" />
                    <span className="font-medium text-[#21201c]">Google Drive</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 1min ago</span>
                    <span className="text-[#ff6a00] font-medium">24 chunks indexed</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <GitHubIcon className="size-4 text-[#21201c]" />
                    <span className="font-medium text-[#21201c]">GitHub</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 2min ago</span>
                    <span className="text-[#ff6a00] font-medium">88 files synced</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs">
                  <div className="flex items-center gap-2">
                    <NotionIcon className="size-4 text-[#21201c]" />
                    <span className="font-medium text-[#21201c]">Notion</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8d8d86]">
                    <span>Synced 5min ago</span>
                    <span className="text-[#ff6a00] font-medium">12 pages indexed</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-[#21201c]">Live connector synchronization</h3>
                <p className="text-xs text-[#63635e] leading-relaxed">
                  Continuous incremental syncing automatically vectorizes your team&apos;s changes into Qdrant Cloud via gemini-embedding-2.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Studio Canvas & AI Co-Writer */}
          <div className="flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] min-h-130">
            {/* Visual: Studio Canvas Card */}
            <div className="flex flex-col gap-4 p-5 rounded-xl bg-[#ffffff] border border-[#e2e1de] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e1de]">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-[#ffd7c0] text-[#ff6a00] flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <span className="text-sm font-semibold text-[#21201c]">Studio Block Canvas</span>
                </div>
                <span className="text-xs text-[#22c55e] font-medium bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8d8d86]">Editor:</span>
                  <div className="font-medium text-[#21201c] mt-0.5">Tiptap Block Editor (/)</div>
                </div>
                <div>
                  <span className="text-[#8d8d86]">Assistant:</span>
                  <div className="font-medium text-[#21201c] mt-0.5">Ora Co-Writer</div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e2e1de]">
                <span className="text-xs text-[#8d8d86]">Grounded Action:</span>
                <p className="text-xs text-[#63635e] leading-relaxed bg-[#f9f9f8] p-3 rounded-lg border border-[#e2e1de]/60">
                  Synthesize the architecture specs from Google Drive and draft an executive RFC outline directly into the document canvas.
                </p>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-[#21201c]">Studio canvas &amp; AI co-writer</h3>
              <p className="text-sm text-[#63635e] leading-relaxed">
                An integrated Notion-style block editor where Ora outlines, drafts, summarizes, and edits side-by-side with your team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

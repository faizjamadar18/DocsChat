'use client';

import React from 'react';
import Image from 'next/image';
import { AgentworkMark, SlackIcon, NotionIcon, GoogleDriveIcon, LinearIcon, GmailIcon } from './Icons';

export default function HeroMockup() {
  return (
    <div className="w-full h-full bg-[#fdfdfc] rounded-xl border border-[#21201c]/15 shadow-ui-visual flex flex-col md:flex-row overflow-hidden text-[#21201c] select-none text-left">
      {/* Left Sidebar */}
      <aside className="hidden md:flex md:w-54 shrink-0 flex-col justify-between border-r border-[#e2e1de] bg-[#f9f9f8] p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <AgentworkMark className="size-5 text-[#21201c]" />
            <button className="text-[#8d8d86] hover:text-[#21201c] transition-colors text-xs" aria-label="Toggle sidebar">
              <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#e9e8e6] text-[#21201c] text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span>Home</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              <span>Workflows</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              <span>Connections</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              <span>Settings</span>
            </div>
          </nav>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#ffffff] border border-[#e2e1de]">
          <div className="relative size-8 rounded-full overflow-hidden shrink-0 bg-[#e9e8e6]">
            <Image
              src="/images/jane-doe-avatar.webp"
              alt="Jane Doe"
              width={32}
              height={32}
              className="object-cover size-full"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-[#21201c] truncate">Jane Doe</span>
            <span className="text-[11px] text-[#8d8d86] truncate">jane@acme.com</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <section className="flex-1 flex flex-col justify-between overflow-hidden bg-[#ffffff]">
        {/* Workspace Header Bar */}
        <header className="flex items-center justify-between border-b border-[#e2e1de] px-5 py-3 bg-[#fdfdfc]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#21201c]">SLA response time</span>
          </div>
          <div className="flex items-center gap-2 text-[#8d8d86]">
            <button className="p-1 hover:text-[#21201c]" aria-label="Thread options">
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
            <button className="p-1 hover:text-[#21201c]" aria-label="Expand view">
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-3.293 3.293a1 1 0 01-1.414-1.414L13.586 5H12zm-7 9a1 1 0 012 0v1.586l3.293-3.293a1 1 0 011.414 1.414L8.414 17H10a1 1 0 010 2H6a1 1 0 01-1-1v-4zm11-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-3.293-3.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto flex flex-col gap-5 text-sm">
          {/* User Message */}
          <div className="flex items-start gap-3">
            <div className="relative size-7 rounded-full overflow-hidden shrink-0 bg-[#e9e8e6]">
              <Image
                src="/images/jane-doe-avatar.webp"
                alt="You"
                width={28}
                height={28}
                className="object-cover size-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#63635e]">You</span>
              <p className="text-[#21201c] font-normal leading-relaxed">
                What is our current SLA response time for Enterprise tier customers?
              </p>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex items-start gap-3">
            <div className="size-7 rounded-full bg-[#f97316] text-[#ffffff] flex items-center justify-center shrink-0">
              <AgentworkMark className="size-4" />
            </div>
            <div className="flex flex-col gap-2.5 max-w-xl">
              <span className="text-xs font-semibold text-[#63635e]">Assistant</span>

              {/* Actions pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f9f9f8] border border-[#e2e1de] text-xs font-medium text-[#63635e] w-fit">
                <span>Completed 5 actions</span>
                <span className="text-[10px]">›</span>
              </div>

              {/* Resolution body */}
              <div className="text-[#21201c] leading-relaxed flex flex-col gap-2 text-sm">
                <p>
                  I found conflicting information across our systems. The{' '}
                  <span className="underline decoration-[#8d8d86] cursor-pointer">Support Handbook in Notion</span>{' '}
                  states <strong className="font-semibold text-[#21201c]">4 hours</strong> <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">1</span>,
                  but the recently updated{' '}
                  <span className="underline decoration-[#8d8d86] cursor-pointer">MSA templates in Google Drive</span>{' '}
                  say <strong className="font-semibold text-[#21201c]">2 hours</strong> <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">2</span>.
                  The <span className="underline decoration-[#8d8d86] cursor-pointer">SLA implementation issue in Linear</span> still specifies a <strong className="font-semibold text-[#21201c]">4-hour</strong> first response <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">3</span>.
                </p>
                <p className="text-[#63635e]">
                  I&apos;ll reach out to Martin Olsen (Head of Support) to clarify which is correct. Should I send him a quick ping?
                </p>
              </div>

              {/* Suggested Action */}
              <div className="pt-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e2e1de] bg-[#ffffff] hover:bg-[#f9f9f8] text-xs font-medium text-[#21201c] shadow-xs cursor-pointer"
                >
                  <SlackIcon className="size-3.5" />
                  <span>Ping Martin Olsen via Slack</span>
                </button>
              </div>

              {/* Source citations chips */}
              <div className="flex items-center gap-2 pt-2 text-xs text-[#8d8d86]">
                <span>4 sources used</span>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Notion">
                    <NotionIcon className="size-3 text-[#21201c]" />
                  </div>
                  <div className="p-1 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Google Drive">
                    <GoogleDriveIcon className="size-3" />
                  </div>
                  <div className="p-1 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Linear">
                    <LinearIcon className="size-3 text-[#5E6AD2]" />
                  </div>
                  <div className="p-1 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Gmail">
                    <GmailIcon className="size-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <footer className="p-4 border-t border-[#e2e1de] bg-[#fdfdfc]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e1de] shadow-xs">
            <input
              type="text"
              readOnly
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-sm text-[#21201c] placeholder-[#8d8d86] focus:outline-none cursor-default"
            />
            <button type="button" className="text-[#8d8d86] hover:text-[#21201c] p-1" aria-label="Attach file">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button
              type="button"
              className="size-7 rounded-lg bg-[#21201c] text-[#ffffff] flex items-center justify-center hover:bg-[#000000] transition-colors cursor-pointer shrink-0"
              aria-label="Send query"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

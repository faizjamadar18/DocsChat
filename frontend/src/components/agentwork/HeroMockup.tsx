'use client';

import React from 'react';
import Image from 'next/image';
import { AgentworkMark, NotionIcon, GoogleDriveIcon, GitHubIcon } from './Icons';

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
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span>Home</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#e9e8e6] text-[#21201c] text-sm font-medium">
              <svg className="size-4 text-[#ff6a00]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
              </svg>
              <span>Ora</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Studio</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Connectors</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#63635e] hover:bg-[#e9e8e6]/60 transition-colors text-sm font-medium">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>MCP Server</span>
            </div>
          </nav>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#ffffff] border border-[#e2e1de]">
          <div className="relative size-8 rounded-full overflow-hidden shrink-0 bg-[#e9e8e6]">
            <Image
              src="/images/jane-doe-avatar.webp"
              alt="Alex Chen"
              width={32}
              height={32}
              className="object-cover size-full"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-[#21201c] truncate">Alex Chen</span>
            <span className="text-[11px] text-[#8d8d86] truncate">alex@quello.dev</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <section className="flex-1 flex flex-col justify-between overflow-hidden bg-[#ffffff]">
        {/* Workspace Header Bar */}
        <header className="flex items-center justify-between border-b border-[#e2e1de] px-5 py-3 bg-[#fdfdfc]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#21201c]">v2 Launch Readiness</span>
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
                What is the status of our v2 release, and what is still blocking launch?
              </p>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex items-start gap-3">
            <div className="size-7 rounded-full bg-[#f97316] text-[#ffffff] flex items-center justify-center shrink-0">
              <AgentworkMark className="size-4" />
            </div>
            <div className="flex flex-col gap-2.5 max-w-xl">
              <span className="text-xs font-semibold text-[#63635e]">Ora AI</span>

              {/* Actions pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f9f9f8] border border-[#e2e1de] text-xs font-medium text-[#63635e] w-fit">
                <span>3 sources checked • Answer with citations</span>
                <span className="text-[10px]">›</span>
              </div>

              {/* Resolution body */}
              <div className="text-[#21201c] leading-relaxed flex flex-col gap-2 text-sm">
                <p>
                  According to the{' '}
                  <span className="underline decoration-[#8d8d86] cursor-pointer">Q4 Release Plan in Notion</span>{' '}
                  <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">1</span>,
                  v2 is on track for November 18th pending QA sign-off.
                </p>
                <p>
                  One blocker remains in the{' '}
                  <span className="underline decoration-[#8d8d86] cursor-pointer">backend repository on GitHub</span>{' '}
                  <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">2</span>:
                  session refresh handling in PR #142, assigned to Marcus. The{' '}
                  <span className="underline decoration-[#8d8d86] cursor-pointer">QA sign-off in Drive</span>{' '}
                  <span className="inline-block px-1 rounded bg-[#f1f0ef] text-[10px] font-mono text-[#63635e]">3</span> confirms performance tests passed.
                </p>
              </div>

              {/* Suggested Action */}
              <div className="pt-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e2e1de] bg-[#ffffff] hover:bg-[#f9f9f8] text-xs font-medium text-[#21201c] shadow-xs cursor-pointer"
                >
                  <svg className="size-3.5 text-[#ff6a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Open in Studio</span>
                </button>
              </div>

              {/* Source citations chips */}
              <div className="flex items-center gap-2 pt-2 text-xs text-[#8d8d86]">
                <span>3 sources used</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Notion">
                    <NotionIcon className="size-3 text-[#21201c]" />
                    <span className="text-[11px] text-[#21201c] font-medium">Notion</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="GitHub">
                    <GitHubIcon className="size-3 text-[#21201c]" />
                    <span className="text-[11px] text-[#21201c] font-medium">GitHub</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f0ef] hover:bg-[#e9e8e6] transition-colors cursor-pointer" title="Google Drive">
                    <GoogleDriveIcon className="size-3" />
                    <span className="text-[11px] text-[#21201c] font-medium">Drive</span>
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
              placeholder="Ask anything about your workspace... (type @ to scope)"
              className="flex-1 bg-transparent text-sm text-[#21201c] placeholder-[#8d8d86] focus:outline-none cursor-default"
            />
            <button type="button" className="text-[#8d8d86] hover:text-[#21201c] p-1" aria-label="Attach file">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button
              type="button"
              className="size-7 rounded-lg bg-[#21201c] text-[#ffffff] flex items-center justify-center hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
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

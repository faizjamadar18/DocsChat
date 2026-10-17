'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import {
  USE_CASES_DATA,
  PlatformType,
  ProviderType,
  MentionType,
} from './useCasesData';
import {
  ChatGptIcon,
  ClaudeIcon,
  PerplexityIcon,
  GrokIcon,
  GeminiIcon,
  NotionIcon,
  GoogleDriveIcon,
  GitHubIcon,
  PdfIcon,
  StudioDocIcon,
} from '@/components/connectors/ConnectorIcons';
import { QuelloMark } from './Icons';

// --- Platform Mark for AI Tools & Connected Sources ---
function PlatformIcon({
  platform,
  className = 'size-4 shrink-0',
}: {
  platform: PlatformType;
  className?: string;
}) {
  switch (platform) {
    case 'chatgpt':
      return <ChatGptIcon className={className} fill="#000000" />;
    case 'claude':
      return <ClaudeIcon className={className} />;
    case 'perplexity':
      return <PerplexityIcon className={className} />;
    case 'grok':
      return <GrokIcon className={className} />;
    case 'gemini':
      return <GeminiIcon className={className} />;
    case 'notion':
      return <NotionIcon className={className} />;
    case 'github':
      return <GitHubIcon className={className} />;
    case 'google-drive':
      return <GoogleDriveIcon className={className} />;
    case 'studio':
      return <StudioDocIcon className={className} />;
    case 'quello':
    default:
      return <QuelloMark className={className} />;
  }
}

// --- Source Provider Icon ---
function ProviderIcon({
  provider,
  className = 'size-4 shrink-0',
}: {
  provider: ProviderType;
  className?: string;
}) {
  switch (provider) {
    case 'notion':
      return <NotionIcon className={className} />;
    case 'google-drive':
      return <GoogleDriveIcon className={className} />;
    case 'github':
      return <GitHubIcon className={className} />;
    case 'pdf':
      return <PdfIcon className={className} />;
    default:
      return null;
  }
}

// Chevron Icon for accordion
function ChevronIcon({ className = 'size-3' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 256 256"
      className={className}
      aria-hidden="true"
    >
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
    </svg>
  );
}

// --- Document & Tool Mention Pill (Notion, GitHub, Google Drive, PDF, Studio, Quello MCP) ---
function MentionPill({ type, name }: { type: MentionType; name: string }) {
  if (type === 'quello') {
    return (
      <span
        title={`Quello MCP: ${name}`}
        className="inline-flex items-center align-middle -translate-y-px mr-1.5 px-2 py-0.5 rounded-md bg-[#f1efe9] border border-[#dcd9d0] text-xs sm:text-[13px] font-medium text-[#21201c] shadow-[0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[#e8e5dc] transition-colors select-none"
      >
        <span>{name}</span>
      </span>
    );
  }

  const renderIcon = () => {
    switch (type) {
      case 'notion':
        return <NotionIcon className="size-3.5 shrink-0" />;
      case 'github':
        return <GitHubIcon className="size-3.5 shrink-0 text-[#181717]" />;
      case 'google-drive':
        return <GoogleDriveIcon className="size-3.5 shrink-0" />;
      case 'pdf':
        return <PdfIcon className="size-3.5 shrink-0" />;
      case 'studio':
      default:
        return <StudioDocIcon className="size-3.5 shrink-0" />;
    }
  };

  return (
    <span
      title={`Referenced Document: ${name}`}
      className="inline-flex items-center gap-1.5 align-middle -translate-y-px mr-1.5 px-2 py-0.5 rounded-md bg-[#f1efe9] border border-[#dcd9d0] text-xs sm:text-[13px] font-medium text-[#21201c] shadow-[0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[#e8e5dc] transition-colors select-none"
    >
      {renderIcon()}
      <span className="truncate max-w-65">{name}</span>
    </span>
  );
}

const CYCLE_DURATION_MS = 8000;

export default function UseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [inView, setInView] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = useState(false);

  const currentExample = USE_CASES_DATA.examples[activeIndex];

  // In-view viewport tracking
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        rootMargin: '0px 0px -20% 0px',
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 8-second auto-advance timer
  useEffect(() => {
    if (!inView) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % USE_CASES_DATA.examples.length);
      setTimerResetKey((k) => k + 1);
      setIsActivityOpen(false);
      setIsSourcesMenuOpen(false);
    }, CYCLE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [inView, activeIndex, timerResetKey]);

  // Tab selection handler
  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index);
    setTimerResetKey((k) => k + 1);
    setIsActivityOpen(false);
    setIsSourcesMenuOpen(false);
  }, []);

  // Pre-process markdown: replace [n] citations with markdown links [n](#citation:n)
  const processedMarkdown = React.useMemo(() => {
    const text = currentExample.assistantMarkdown;
    const sourceMap = new Map(currentExample.sources.map((s) => [s.index, s]));

    return text.replace(
      /(`+)[\s\S]*?\1|(?<!\w)\[(\d+)\](?!\()/g,
      (match, code, num) => {
        if (code !== undefined) return match;
        const sourceIndex = Number(num);
        if (sourceMap.has(sourceIndex)) {
          return `[${num}](#citation:${num})`;
        }
        return match;
      }
    );
  }, [currentExample]);

  // Unique source providers for icons pill
  const uniqueSources = React.useMemo(() => {
    const seen = new Set<string>();
    return currentExample.sources.filter((s) => {
      if (seen.has(s.provider)) return false;
      seen.add(s.provider);
      return true;
    });
  }, [currentExample]);

  return (
    <section
      id="traceability"
      ref={sectionRef}
      className="flex flex-col items-center px-4 sm:px-6 py-16 sm:py-20 md:py-24 bg-[#fdfdfc] text-[#21201c] w-full max-w-full scroll-mt-24 select-text"
    >
      <div className="grid w-full max-w-300 grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
        {/* Left Column: Headline and 10 Selector Rows */}
        <div className="flex flex-col md:col-span-4">
          <div data-section-anchor="true">
            <h2 className="text-2xl font-medium leading-[1.35] tracking-[-0.03em]">
              <span className="text-[#21201c]">
                Reliable results
                <br aria-hidden="true" />
                <p className='text-[#63635E]' >For everything</p>
              </span>
            </h2>
            <p className="mt-2 text-xs text-[#827f73] leading-relaxed">
              Ask in Quello, or via MCP in ChatGPT, Claude, Perplexity, or your favourite tool. Every answer cites your workspace (Notion, Drive, GitHub, PDFs etc.) down to the exact passage.
            </p>
          </div>

          {/* Mobile horizontal use-case switcher */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-2.5 -mx-4 px-4 overscroll-x-contain">
            {USE_CASES_DATA.examples.map((example, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#21201c] text-white border-[#21201c] shadow-xs'
                      : 'bg-white text-[#636158] border-[#e4e1d9] hover:bg-[#f9f9f8]'
                  }`}
                >
                  <PlatformIcon platform={example.platform} className="size-3.5 shrink-0" />
                  <span className="truncate max-w-36">{example.title}</span>
                  <span className={`text-[10px] tabular-nums ${isActive ? 'text-white/70' : 'text-[#827f73]'}`}>
                    {example.number}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block mt-3">
            {USE_CASES_DATA.examples.map((example, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  aria-current={isActive ? 'true' : undefined}
                  className="group relative w-full cursor-pointer border-b border-[#e4e1d9] py-3 text-left transition-colors first:pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center justify-center shrink-0" title={example.platformName}>
                        <PlatformIcon platform={example.platform} className="size-4.5 shrink-0" />
                      </span>
                      <span
                        className={`text-[14px] font-medium tracking-[-0.015em] transition-colors duration-300 truncate ${
                          isActive
                            ? 'text-[#21201c]'
                            : 'text-[#827f73] group-hover:text-[#21201c]'
                        }`}
                      >
                        {example.title}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums lining-nums transition-colors duration-300 ${
                        isActive
                          ? 'text-[#21201c]'
                          : 'text-[#cecbbf] group-hover:text-[#21201c]'
                      }`}
                    >
                      {example.number}
                    </span>
                  </div>

                  {isActive && inView && (
                    <div
                      key={timerResetKey}
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 h-px bg-[#ff6a00] animate-progress-line"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Panel - Solid 560px height on desktop, scrollable on mobile */}
        <div className="flex w-full md:col-span-8">
          <div
            aria-live="off"
            className="flex min-h-125 md:h-140 w-full flex-col justify-start overflow-y-auto md:overflow-hidden rounded-lg border border-[#e4e1d9] bg-white p-3.5 sm:p-8 md:p-10 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)]"
          >
            <div
              key={currentExample.id}
              className="flex w-full flex-col gap-2"
              style={{
                animation: 'fadeSlideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              }}
            >
              {/* User Message */}
              <div
                data-slot="chat-message"
                className="group/message relative flex w-full flex-col px-3 pt-2 rounded-lg border border-transparent overflow-x-clip"
              >
                <div
                  data-slot="chat-message-sender"
                  className="flex items-center gap-3 pb-2.5 md:pb-1.5"
                >
                  <span
                    data-slot="avatar"
                    className="relative flex shrink-0 overflow-hidden rounded-full bg-[#f1efe9] size-7.5"
                  >
                    <Image
                      alt="You"
                      src="/jane-doe-avatar.webp"
                      width={30}
                      height={30}
                      className="aspect-square size-full object-cover"
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#21201c]">You</span>
                    <span className="text-[11px] text-[#827f73]">
                      in {currentExample.userContext || currentExample.platformName}
                    </span>
                  </div>
                </div>

                <div
                  data-slot="chat-message-text"
                  className="prose leading-normal pb-2 md:pl-10.5 text-sm md:text-base text-[#21201c]"
                >
                  <p className="leading-relaxed">
                    {currentExample.mention && (
                      <MentionPill
                        type={currentExample.mention.type}
                        name={currentExample.mention.name}
                      />
                    )}
                    <span>{currentExample.userMessage}</span>
                  </p>
                </div>
              </div>

              {/* Assistant Message */}
              <div
                data-slot="chat-message"
                className="group/message relative flex w-full flex-col px-3 pt-2 rounded-lg border border-transparent overflow-x-clip"
              >
                <div
                  data-slot="chat-message-sender"
                  className="flex items-center gap-3 pb-2.5 md:pb-1.5"
                >
                  <span
                    data-slot="avatar"
                    className="relative flex shrink-0 items-center justify-center size-7.5"
                  >
                    <PlatformIcon
                      platform={currentExample.assistantPlatform || currentExample.platform}
                      className="size-6.5 shrink-0"
                    />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#21201c]">
                      {currentExample.assistantName || currentExample.platformName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-medium text-[#047857]">
                      <span className="size-1.5 rounded-full bg-[#10b981]" />
                      {currentExample.assistantBadge || currentExample.badgeText}
                    </span>
                  </div>
                </div>

                {/* Reasoning Steps Accordion */}
                <div data-slot="chat-message-activity" className="md:pl-10.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setIsActivityOpen((open) => !open)}
                    aria-expanded={isActivityOpen}
                    aria-label={`Completed ${currentExample.reasoningSteps.length} actions`}
                    className="inline-flex w-full min-w-0 max-w-full cursor-pointer items-center gap-2 text-left text-sm text-[#636158] transition-colors hover:text-[#21201c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                  >
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-xs sm:text-sm">
                          Completed {currentExample.reasoningSteps.length} actions
                        </span>
                      </span>
                      <ChevronIcon
                        className={`size-3 shrink-0 translate-y-px transition-transform duration-200 ${
                          isActivityOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {/* Expandable Reasoning Steps */}
                  <div
                    className={`overflow-hidden border-l border-[#e4e1d9] pl-3 ml-2 transition-all duration-200 ${
                      isActivityOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <ul className="space-y-1.5 py-1">
                      {currentExample.reasoningSteps.map((step, idx) => (
                        <li
                          key={idx}
                          data-slot="chat-message-activity-step"
                          className="flex items-center gap-2 text-xs text-[#636158]"
                        >
                          <span className="flex size-3.5 shrink-0 items-center justify-center">
                            <span className="size-1.5 rounded-full bg-[#10b981]" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Main Assistant Answer with Citations */}
                <div
                  data-slot="chat-message-text"
                  className="prose leading-normal pb-2.5 md:pl-10.5 text-sm md:text-[15px] text-[#21201c]"
                >
                  <div className="prose prose-markdown [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed text-[#21201c]">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-[#21201c]">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-2 space-y-1 text-[#21201c]">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-2 space-y-1 text-[#21201c]">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed text-[#21201c]">{children}</li>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-[#f1efe9] text-xs font-mono text-[#21201c]">
                            {children}
                          </code>
                        ),
                        a: ({ href, children }) => {
                          if (href?.startsWith('#citation:')) {
                            const index = Number(href.slice('#citation:'.length));
                            const source = currentExample.sources.find(
                              (s) => s.index === index
                            );
                            return (
                              <a
                                key={index}
                                href={source?.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-slot="chat-message-source-marker"
                                aria-label={`Source ${index}: ${source?.title || 'Source'}`}
                                title={
                                  source
                                    ? `${source.title} (${source.url})`
                                    : `Source ${index}`
                                }
                                className="mx-0.5 -translate-y-px inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-md border border-[#cecbbf] bg-white px-1 align-baseline text-[10px] font-medium leading-none text-[#21201c] no-underline tabular-nums outline-0 transition-colors hover:bg-[#f1efe9] focus-visible:outline-2 focus-visible:outline-[#ff6a00] focus-visible:outline-offset-1"
                              >
                                {index}
                              </a>
                            );
                          }

                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2 decoration-[#cecbbf] hover:decoration-[#21201c] text-[#21201c] transition-colors"
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {processedMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Sources Used Trigger + Popover */}
                <div data-slot="chat-message-sources" className="relative md:pl-10.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setIsSourcesMenuOpen((prev) => !prev)}
                    data-slot="chat-message-sources-trigger"
                    className="inline-flex min-h-6 cursor-pointer items-center gap-2 rounded text-xs sm:text-sm text-[#636158] outline-0 transition-colors hover:text-[#21201c] focus-visible:outline-2 focus-visible:outline-[#ff6a00] focus-visible:outline-offset-2"
                    aria-expanded={isSourcesMenuOpen}
                  >
                    <span>{currentExample.sources.length} sources used</span>
                    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
                      {uniqueSources.slice(0, 4).map((source) => (
                        <span
                          key={source.provider}
                          className="flex size-4 shrink-0 items-center justify-center"
                        >
                          <ProviderIcon
                            provider={source.provider}
                            className="size-3.5"
                          />
                        </span>
                      ))}
                    </span>
                  </button>

                  {/* Sources Dropdown Popover */}
                  {isSourcesMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsSourcesMenuOpen(false)}
                      />
                      <div className="absolute left-0 md:left-10.5 bottom-full mb-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-3rem)] rounded-lg border border-[#e4e1d9] bg-white p-2 shadow-lg animate-fade-in">
                        <div className="px-2 py-1 text-xs font-semibold text-[#827f73] uppercase tracking-wider border-b border-[#f1efe9] mb-1">
                          Connected Sources
                        </div>
                        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                          {currentExample.sources.map((source) => (
                            <a
                              key={`${source.index}-${source.title}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 rounded-md p-2 hover:bg-[#f1efe9] transition-colors group"
                            >
                              <div className="flex size-5 shrink-0 items-center justify-center">
                                <ProviderIcon provider={source.provider} className="size-4" />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-xs font-medium text-[#21201c]">
                                  {source.title}
                                </span>
                                <span className="truncate text-[11px] text-[#827f73]">
                                  {source.url}
                                </span>
                              </div>
                              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded border border-[#cecbbf] bg-white px-1 text-[10px] font-medium tabular-nums text-[#21201c]">
                                {source.index}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NotionIcon, GitHubIcon, GoogleDriveIcon } from './Icons';

export default function UseCases() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
        }
      },
      { threshold: 0.3 }
    );

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="traceability"
      ref={rootRef}
      className="relative z-2 overflow-hidden bg-[#fdfdfc] px-4 sm:px-[5%] py-12 sm:py-20 md:py-28 lg:py-36 text-[#21201c] w-full max-w-full"
    >
      {/* Background radial dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block bg-[radial-gradient(rgba(26,25,22,0.06)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(90%_80%_at_72%_48%,#000_28%,transparent_82%)] [-webkit-mask-image:radial-gradient(90%_80%_at_72%_48%,#000_28%,transparent_82%)]"
      />

      <div className="container relative mx-auto max-w-304">
        <div className="grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          {/* Left Column: Heading, description, bullets, CTA */}
          <div className="max-w-xl">
            <h2 className="text-balance text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium leading-[1.08] tracking-[-0.03em] text-[#1a1916]">
              Every answer
              <br />
              shows its work
            </h2>

            <div className="mt-5 space-y-3 text-pretty text-base leading-relaxed text-[#6b665e]">
              <p>
                Open any response and see the documents, technical specs, and exact passages behind it.
              </p>
              <p>
                Whether you&apos;re preparing a release, resolving a decision, or referencing past work, you can check the source instead of guessing.
              </p>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3 text-sm leading-relaxed text-[#2e2b26]">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#1a1916]/5 text-[#1a1916]">
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>Inspect citations, page references, and repositories in one click.</span>
              </div>

              <div className="flex items-start gap-3 text-sm leading-relaxed text-[#2e2b26]">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#1a1916]/5 text-[#1a1916]">
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>Follow decisions across tools without digging through threads and folders.</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full border border-[#e4e4e4] bg-white px-5 py-2.5 text-sm font-medium text-[#2e2b26] shadow-xs hover:bg-[#edebe6] transition-colors"
              >
                <span>Explore answers with sources</span>
                <svg
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive conversation + Reasoning Trace card */}
          <div className="relative flex min-h-105 items-center sm:min-h-115 lg:min-h-135">
            {/* Ambient blurry shadow glow in the upper-right corner */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-96 w-96 rounded-full bg-linear-to-bl from-white via-[#faf9f5]/80 to-transparent blur-3xl opacity-90"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-2 right-2 h-72 w-72 rounded-full bg-linear-to-bl from-black/3 to-transparent blur-2xl"
            />

            <div
              className="relative mx-auto w-full max-w-135 lg:ml-0 lg:mask-[radial-gradient(140%_135%_at_8%_12%,#000_52%,transparent_92%)] lg:[-webkit-mask-image:radial-gradient(140%_135%_at_8%_12%,#000_52%,transparent_92%)]"
              style={{
                WebkitMaskImage: 'radial-gradient(140% 135% at 8% 12%, #000 52%, transparent 92%)',
                maskImage: 'radial-gradient(140% 135% at 8% 12%, #000 52%, transparent 92%)',
              }}
            >
              {/* Top Chat Messages */}
              <div className="mx-auto max-w-md space-y-2.5">
                {/* User Message */}
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#edebe6] px-4 py-2.5 text-sm leading-snug text-[#1a1916] shadow-2xs">
                  What is the status of our v2 release, and what dependencies are still blocking the launch?
                </div>

                {/* AI Assistant Message */}
                <div className="max-w-[94%] rounded-2xl rounded-bl-md border border-[#e4e4e4] bg-white px-4 py-2.5 text-sm leading-snug text-[#2e2b26] shadow-2xs">
                  v2 is on track for November 18th following QA sign-off. One blocker remains: OAuth session refresh configuration, documented in auth-specification.md pending production credentials.
                </div>
              </div>

              {/* Trace Audit Card */}
              <div className="mt-5 rounded-2xl border border-[#e4e4e4] bg-white p-3.5 sm:p-5 md:px-6 shadow-[0_18px_44px_-34px_rgba(20,20,45,0.22),0_10px_28px_-16px_rgba(0,0,0,0.06)]">
                {/* Top Divider & Grounded Trace badge */}
                <div className="relative mb-5 sm:mb-6 mt-1 flex items-center justify-center">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e4e4e4]" />
                  <span
                    style={{
                      transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                      transitionDelay: '0ms',
                    }}
                    className={`relative inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium text-emerald-700 ${
                      isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <svg
                      className="size-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
                    </svg>
                    Grounded Source Trace
                  </span>
                </div>

                {/* Timeline content with vertical spine line */}
                <div className="relative mx-auto mt-6 max-w-lg pl-7">
                  {/* Vertical Spine Line */}
                  <span
                    aria-hidden="true"
                    style={{
                      transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
                      transformOrigin: 'top',
                    }}
                    className={`absolute left-2.25 top-1 bottom-1 w-px bg-[#e4e4e4] ${
                      isPlaying ? 'scale-y-100' : 'scale-y-0'
                    }`}
                  />

                  {/* Step 1: Reasoning */}
                  <div
                    style={{
                      transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                      transitionDelay: '180ms',
                    }}
                    className={`relative pb-5 ${
                      isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <span className="absolute -left-7 top-0 grid size-4.75 place-items-center rounded-full border border-[#e4e4e4] bg-white text-[#6b665e]">
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6b665e]">
                      Reasoning
                    </p>
                    <p className="mt-1 text-sm text-[#2e2b26]">
                      Cross-referenced Q4 Product Roadmap with latest QA audit and repository architecture docs
                    </p>
                  </div>

                  {/* Step 2: Knowledge sources */}
                  <div
                    style={{
                      transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                      transitionDelay: '380ms',
                    }}
                    className={`relative pb-5 ${
                      isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <span className="absolute -left-7 top-0 grid size-4.75 place-items-center rounded-full border border-[#e4e4e4] bg-white text-[#6b665e]">
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6b665e]">
                      Knowledge sources
                    </p>

                    <div className="mt-2 space-y-1.5">
                      {/* Source Row 1: Notion */}
                      <div
                        style={{
                          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                          transitionDelay: '520ms',
                        }}
                        className={`flex items-center gap-2.5 rounded-lg bg-[#FAFAF8] px-2.5 py-2 ring-1 ring-black/4 ${
                          isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                      >
                        <NotionIcon className="size-3.5 shrink-0 text-[#21201c]" />
                        <span className="min-w-0 flex-1 text-xs sm:text-sm font-medium leading-snug text-[#2e2b26] truncate sm:whitespace-normal">
                          Q4 Product Roadmap &amp; Milestones · Release 2.0
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#8d8d86] tabular-nums shrink-0">98% match</span>
                        <svg
                          style={{
                            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                            transitionDelay: '740ms',
                          }}
                          className={`size-3.5 shrink-0 text-emerald-500 ${
                            isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>

                      {/* Source Row 2: GitHub */}
                      <div
                        style={{
                          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                          transitionDelay: '720ms',
                        }}
                        className={`flex items-center gap-2 sm:gap-2.5 rounded-lg bg-[#FAFAF8] px-2 sm:px-2.5 py-1.5 sm:py-2 ring-1 ring-black/4 ${
                          isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                      >
                        <GitHubIcon className="size-3.5 shrink-0 text-[#21201c]" />
                        <span className="min-w-0 flex-1 text-xs sm:text-sm font-medium leading-snug text-[#2e2b26] truncate sm:whitespace-normal">
                          docs/auth-specification.md · § Session Handling
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#8d8d86] tabular-nums shrink-0">96% match</span>
                        <svg
                          style={{
                            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                            transitionDelay: '940ms',
                          }}
                          className={`size-3.5 shrink-0 text-emerald-500 ${
                            isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>

                      {/* Source Row 3: Google Drive */}
                      <div
                        style={{
                          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                          transitionDelay: '920ms',
                        }}
                        className={`flex items-center gap-2 sm:gap-2.5 rounded-lg bg-[#FAFAF8] px-2 sm:px-2.5 py-1.5 sm:py-2 ring-1 ring-black/4 ${
                          isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                      >
                        <GoogleDriveIcon className="size-3.5 shrink-0" />
                        <span className="min-w-0 flex-1 text-xs sm:text-sm font-medium leading-snug text-[#2e2b26] truncate sm:whitespace-normal">
                          QA Test Sign-Off &amp; Performance Report.pdf ·pg 6
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#8d8d86] tabular-nums shrink-0">93% match</span>
                        <svg
                          style={{
                            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                            transitionDelay: '1140ms',
                          }}
                          className={`size-3.5 shrink-0 text-emerald-500 ${
                            isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Synthesis & Verification */}
                  <div
                    style={{
                      transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                      transitionDelay: '1160ms',
                    }}
                    className={`relative ${
                      isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <span className="absolute -left-7 top-0 grid size-4.75 place-items-center rounded-full border border-[#e4e4e4] bg-white text-[#6b665e]">
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6b665e]">
                      Verification &amp; Grounding
                    </p>

                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FAFAF8] px-2.5 py-2 ring-1 ring-black/4">
                      <svg
                        className="size-3.5 shrink-0 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <span className="min-w-0 flex-1 text-sm font-medium text-[#2e2b26]">
                        Checked across 3 sources · Linked passages shown below
                      </span>
                      <svg
                        style={{
                          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                          transitionDelay: '1380ms',
                        }}
                        className={`size-3.5 shrink-0 text-emerald-500 ${
                          isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Bottom Audit status line */}
                <div
                  style={{
                    transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                    transitionDelay: '1600ms',
                  }}
                  className={`mt-6 flex items-center justify-center gap-2 border-t border-[#e4e4e4] pt-5 text-sm ${
                    isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-[#2e2b26]">
                    Every answer <span className="text-[#6b665e]">links back to its sources</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

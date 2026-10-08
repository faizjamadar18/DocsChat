'use client';

import React, { useState } from 'react';

export default function Workflow() {
  const [inputValue, setInputValue] = useState('Write a professional post announcing my new product launch.');

  return (
    <div className="w-full">
      {/* Workflow Section */}
      <div className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative py-12 lg:py-16">
        <div className="flex flex-col items-center text-center gap-2">
          <div>
            <div className="px-4 py-1 rounded-full bg-primary/20 select-none inline-block">
              <div className="text-primary font-medium text-sm">Workflow</div>
            </div>
          </div>
          <div>
            <h2 className="heading text-foreground! font-semibold text-3xl md:text-4xl">
              Turn scattered ideas into published work
            </h2>
          </div>
          <div>
            <p className="paragraph text-muted-foreground/80 max-w-lg mx-auto text-base md:text-lg">
              Plura streamlines your entire creative process, turning scattered ideas into polished content automatically
            </p>
          </div>
        </div>

        <div className="w-full relative z-10 mt-16 mx-auto">
          <div className="relative">
            {/* Center Timeline Line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-7 bottom-7 w-0.5 rounded-full bg-neutral-200 -translate-x-1/2">
              <div
                className="w-full bg-primary origin-top rounded-full shadow-[0_0_10px_2px_rgba(154,123,174,0.4)]"
                style={{ height: '100%' }}
              />
            </div>

            <div className="space-y-16 md:space-y-32">
              {/* Step 1: Start with anything */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                <div className="flex-1 text-center md:text-left pt-8 md:pt-0">
                  <div className="flex flex-col gap-2 md:items-start items-center">
                    <h3 className="text-xl md:text-2xl font-medium text-foreground">
                      Start with anything
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md text-balance">
                      Write a rough idea, paste an old draft, or start from scratch. No templates. No setup. Just begin where you are
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex relative shrink-0 z-10 items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-background border-4 border-primary/15 flex items-center justify-center relative z-10 shadow-xs">
                    <svg
                      className="w-5 h-5 text-primary"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M22 22L20 20"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="relative aspect-video w-full rounded-2xl border border-neutral-200 bg-white/50 overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-xs">
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="w-full h-full flex items-center justify-center bg-neutral-50/50 rounded-xl">
                        <div className="w-full max-w-60 aspect-3/4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col p-6 relative overflow-hidden">
                          <div className="flex-1 relative min-h-15">
                            <div className="absolute top-2 left-0 w-0.5 h-5 bg-primary/80 rounded-full animate-pulse" />
                          </div>
                          <div className="space-y-3 mt-auto">
                            <div className="h-2 w-full bg-neutral-100/80 rounded-full" />
                            <div className="h-2 w-5/6 bg-neutral-100/80 rounded-full" />
                            <div className="h-2 w-4/6 bg-neutral-100/80 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Work with AI, not around it */}
              <div className="flex flex-col gap-8 md:gap-16 items-center md:flex-row-reverse">
                <div className="flex-1 text-center pt-8 md:pt-0 md:text-left">
                  <div className="flex flex-col gap-2 md:items-start items-center">
                    <h3 className="text-xl md:text-2xl font-medium text-foreground">
                      Work with AI, not around it
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md text-balance">
                      Improve, expand, or reshape your content with AI that understands what you’re writing, not just what you prompt
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex relative shrink-0 z-10 items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-background border-4 border-primary/15 flex items-center justify-center relative z-10 shadow-xs">
                    <svg
                      className="w-5 h-5 text-primary"
                      width="21"
                      height="21"
                      viewBox="0 0 21 21"
                      fill="none"
                    >
                      <path
                        d="M19.1555 6.92226C20.2815 5.79623 20.2815 3.97056 19.1555 2.84453C18.0294 1.71849 16.2037 1.71849 15.0776 2.84453L2.8441 15.0777C1.71807 16.2038 1.71807 18.0294 2.8441 19.1555C3.97022 20.2815 5.79587 20.2815 6.92199 19.1555L19.1555 6.92226Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path d="M17 9L12.9999 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="relative aspect-video w-full rounded-2xl border border-neutral-200 bg-white/50 overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-xs">
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(154,123,174,0.3)]">
                          <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="absolute border border-neutral-200 rounded-full" style={{ width: '120%', height: '120%' }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-300 rounded-full border border-white" />
                        </div>
                        <div className="absolute border border-neutral-200 rounded-full" style={{ width: '90%', height: '90%' }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-300 rounded-full border border-white" />
                        </div>
                        <div className="absolute border border-neutral-200 rounded-full" style={{ width: '60%', height: '60%' }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-300 rounded-full border border-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Let your work compound */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                <div className="flex-1 text-center md:text-left pt-8 md:pt-0">
                  <div className="flex flex-col gap-2 md:items-start items-center">
                    <h3 className="text-xl md:text-2xl font-medium text-foreground">
                      Let your work compound
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md text-balance">
                      Upload references once. Reuse ideas automatically. Plura remembers context so your work gets smarter over time
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex relative shrink-0 z-10 items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-background border-4 border-primary/15 flex items-center justify-center relative z-10 shadow-xs">
                    <svg
                      className="w-5 h-5 text-primary"
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                    >
                      <path
                        d="M18.764 9.01709L12.917 14.8461L13.977 15.9081L19.823 10.0781L18.764 9.01709Z"
                        fill="currentColor"
                      />
                      <path
                        d="M7.10901 9.06209L12.957 3.23209L11.897 2.17009L6.05001 8.00009L7.10901 9.06209Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="relative aspect-video w-full rounded-2xl border border-neutral-200 bg-white/50 overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-xs">
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="relative w-full max-w-45 bg-white rounded-lg border border-neutral-200 p-4 shadow-xl shadow-neutral-100">
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-neutral-100 rounded-sm overflow-hidden relative">
                            <div className="absolute inset-0 bg-primary/20" />
                          </div>
                          <div className="flex items-end justify-between pt-1">
                            <div className="h-2 w-1/2 bg-neutral-100 rounded-sm overflow-hidden relative" />
                            <div className="bg-primary text-primary-foreground text-[8px] font-semibold leading-none px-2 pb-0.5 pt-0.75 rounded-full border border-primary-foreground/20 z-20">
                              PUBLISH
                            </div>
                          </div>
                          <div className="h-16 w-full bg-neutral-50 rounded-sm mt-2 border border-dashed border-neutral-200 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                              <div className="w-4 h-4 bg-primary rounded-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Demo / Preview Section */}
      <div id="demo" className="w-full">
        <div className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative py-12 lg:py-16">
          <div className="flex flex-col items-center text-center gap-2">
            <div>
              <div className="px-4 py-1 rounded-full bg-primary/20 select-none inline-block">
                <div className="text-primary font-medium text-sm">Preview</div>
              </div>
            </div>
            <div>
              <h2 className="heading">See how Plura talks like your content assistant</h2>
            </div>
            <div>
              <p className="paragraph">
                Tell Plura what you need and see it draft content across your favorite platforms
              </p>
            </div>
          </div>

          <div className="relative w-full mt-16">
            <div className="relative flex h-125 w-full max-w-2xl flex-col justify-between rounded-2xl border-4 border-primary-100 bg-white backdrop-blur-sm mx-auto z-0 overflow-visible shadow-md">
              {/* Decorative background swirls */}
              <svg
                className="absolute -top-10 lg:-left-16 -z-10 text-accent-foreground/10 w-8 lg:w-16 h-auto rotate-180 pointer-events-none"
                width="288"
                height="420"
                viewBox="0 0 288 420"
                fill="none"
              >
                <path
                  d="M78.19 28.5363C88.7973 16.1481 123.669 1.35751 135.889 16.265C156.871 41.8596 84.4845 143.186 57.9077 115.137C27.0929 82.6154 168.411 31.6919 204.779 74.8169C245.286 122.85 103.717 275.015 57.9077 225.579C4.95044 168.43 221.214 93.3992 268.772 177.546C317.519 263.796 144.981 374.238 10 410"
                  stroke="currentColor"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
              </svg>

              {/* Card Header */}
              <div className="border-b border-border/40 p-4 bg-background/80 rounded-t-xl backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-[#0077B5]" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1 text-xs text-muted-foreground font-book">
                    <svg className="size-3" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51001"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Just now</span>
                  </div>
                </div>
              </div>

              {/* Card Chat Message Content */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6 z-10">
                <div className="bg-neutral-50/80 border border-neutral-100 rounded-xl p-4 text-sm leading-relaxed text-neutral-800">
                  <p className="font-semibold text-neutral-900 mb-2">
                    🚀 Unlock your content superpowers with Plura
                  </p>
                  <p className="mb-2">
                    Content creation shouldn&apos;t feel like managing a digital puzzle across 10 different apps.
                  </p>
                  <p className="text-neutral-700">
                    With Plura, your ideas, references, docs, and AI workflows live in one unified workspace. Start with a messy thought—publish with polished precision.
                  </p>
                  <div className="mt-3 flex gap-2 text-xs text-primary font-medium">
                    <span>#ContentCreation</span>
                    <span>#AIWorkspace</span>
                    <span>#Creators</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Input */}
              <div className="border-t border-border/10 p-4 bg-white rounded-b-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-lg border border-border/20 bg-background2/40 pl-3 pr-0.75 h-10">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button
                    data-slot="button"
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all active:scale-95 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80 size-8 rounded-lg"
                    type="button"
                    aria-label="Send"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-arrow-up size-4"
                    >
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

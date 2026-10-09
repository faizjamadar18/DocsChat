'use client';

import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <div className="w-full z-50">
      <div className="relative flex flex-col gap-2 items-center justify-center grow w-full min-h-dvh overflow-x-hidden z-10">
        <div className="flex flex-col items-center justify-center relative z-0 w-full h-full pt-28 md:pt-36 pb-20 overflow-hidden">

          {/* Floating Pill Card: Voice Control (Left Bottom) */}
          <div
            className="hidden lg:flex absolute w-48 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-neutral-100/50 flex-col gap-2 z-10 cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{ top: '65%', left: '7.5%' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-sm" style={{ backgroundColor: '#3b82f610', border: '1px solid #3b82f620' }}>
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M24,30a8,8,0,0,0,8-8V10a8,8,0,0,0-16,0V22A8,8,0,0,0,24,30Z" />
                  <path d="M38,18a2,2,0,0,0-2,2v2a12,12,0,0,1-24,0V20a2,2,0,0,0-4,0v2A16.1,16.1,0,0,0,22,37.9V42H14a2,2,0,0,0,0,4H33a2,2,0,0,0,0-4H26V37.9A16.1,16.1,0,0,0,40,22V20A2,2,0,0,0,38,18Z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900">Voice Control</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Voice commands</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>AI assistant</span>
              </li>
            </ul>
          </div>

          {/* Floating Pill Card: Collaborate (Left Top) */}
          <div
            className="hidden lg:flex absolute w-48 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-neutral-100/50 flex-col gap-2 z-10 cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{ top: '40%', left: '5%' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-sm" style={{ backgroundColor: '#ef444410', border: '1px solid #ef444420' }}>
                <svg className="w-4 h-4 text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900">Collaborate</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Team access</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Real-time</span>
              </li>
            </ul>
          </div>

          {/* Floating Pill Card: Planning (Right Top) */}
          <div
            className="hidden lg:flex absolute w-48 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-neutral-100/50 flex-col gap-2 z-10 cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{ top: '40%', right: '5%' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-sm" style={{ backgroundColor: '#8b5cf610', border: '1px solid #8b5cf620' }}>
                <svg className="w-4 h-4 text-purple-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.5 9.08997H20.5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.6947 13.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15.6947 16.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11.9955 13.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11.9955 16.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8.29431 13.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8.29431 16.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900">Planning</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Schedule content</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Track progress</span>
              </li>
            </ul>
          </div>

          {/* Floating Pill Card: Integrations (Right Bottom) */}
          <div
            className="hidden lg:flex absolute w-48 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-neutral-100/50 flex-col gap-2 z-10 cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            style={{ top: '65%', right: '7.5%' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-sm" style={{ backgroundColor: '#f59e0b10', border: '1px solid #f59e0b20' }}>
                <svg className="w-4 h-4 text-amber-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 13.4V16.4C17 20.4 15.4 22 11.4 22H7.6C3.6 22 2 20.4 2 16.4V12.6C2 8.6 3.6 7 7.6 7H10.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path opacity="0.4" d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path opacity="0.4" d="M6 18H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 13.4H13.8C11.4 13.4 10.6 12.6 10.6 10.2V7L17 13.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.6 2H15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 5C7 3.34 8.34 2 10 2H12.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21.9999 8V14.19C21.9999 15.74 20.7399 17 19.1899 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 8H19C16.75 8 16 7.25 16 5V2L22 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-neutral-900">Integrations</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Connect apps</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                <span>Automate</span>
              </li>
            </ul>
          </div>

          {/* Main Hero Container */}
          <div className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative">
            <div className="flex flex-col items-center justify-center gap-4 lg:gap-6 text-center">

              {/* 4 Center Icons in Rounded Box */}
              <div className="flex items-center justify-center gap-4 mx-auto animate-fade-in">
                <div className="size-10 bg-secondary flex items-center justify-center rounded-lg -rotate-10 hover:rotate-0 transition-all duration-300 shadow-xs">
                  <svg className="size-5 text-primary-900 z-20" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17 13.4V16.4C17 20.4 15.4 22 11.4 22H7.6C3.6 22 2 20.4 2 16.4V12.6C2 8.6 3.6 7 7.6 7H10.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M6 18H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 13.4H13.8C11.4 13.4 10.6 12.6 10.6 10.2V7L17 13.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.6 2H15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 5C7 3.34 8.34 2 10 2H12.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21.9999 8V14.19C21.9999 15.74 20.7399 17 19.1899 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 8H19C16.75 8 16 7.25 16 5V2L22 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="size-10 bg-secondary flex items-center justify-center rounded-lg rotate-6 hover:rotate-0 transition-all duration-300 shadow-xs">
                  <svg className="size-5 text-primary-900 z-20" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.5 9.08997H20.5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.6947 13.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15.6947 16.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11.9955 13.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11.9955 16.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8.29431 13.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8.29431 16.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="size-10 bg-secondary flex items-center justify-center rounded-lg -rotate-4 hover:rotate-0 transition-all duration-300 shadow-xs">
                  <svg className="size-5 text-primary-900 z-20" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path opacity="0.4" d="M12.37 8.87988H17.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M6.38 8.87988L7.13 9.62988L9.38 7.37988" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M12.37 15.8799H17.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M6.38 15.8799L7.13 16.6299L9.38 14.3799" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="size-10 bg-secondary flex items-center justify-center rounded-lg rotate-8 hover:rotate-0 transition-all duration-300 shadow-xs">
                  <svg className="size-5 text-primary-900 z-20" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24,30a8,8,0,0,0,8-8V10a8,8,0,0,0-16,0V22A8,8,0,0,0,24,30Z" />
                    <path d="M38,18a2,2,0,0,0-2,2v2a12,12,0,0,1-24,0V20a2,2,0,0,0-4,0v2A16.1,16.1,0,0,0,22,37.9V42H14a2,2,0,0,0,0,4H33a2,2,0,0,0,0-4H26V37.9A16.1,16.1,0,0,0,40,22V20A2,2,0,0,0,38,18Z" />
                  </svg>
                </div>
              </div>

              {/* Headline */}
              <div className="max-w-lg mx-auto relative mt-2 animate-fade-in">
                <div className="relative z-20 mx-auto max-w-lg text-center text-4xl md:text-5xl">
                  <h2 className="font-head w-full text-balance leading-tight">
                    <span className="inline-block gradient-secondary">Your </span>
                    <span className="inline-block gradient-secondary">second </span>
                    <span className="inline-block gradient-secondary">
                      <span className="text-gradient-container relative">
                        <span className="text-foreground font-semibold">brain </span>
                        {/* Doodle Arrow */}
                        <svg
                          className="hidden lg:block absolute size-6 md:size-8 -top-1 -right-6 md:-top-2 md:-right-7 -rotate-90 text-primary"
                          width="42"
                          height="32"
                          viewBox="0 0 42 32"
                          fill="none"
                        >
                          <path d="M18.293 2.26953C25.5978 2.93361 32.9508 5.73909 39.9668 7.688" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <path d="M2 19C2.19324 22.6715 3.2811 26.2918 4.16739 29.8369" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <path d="M13 14C16.2184 14.8777 19.9223 24.5078 22.9603 26.1955" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="inline-block gradient-secondary">for </span>
                    <span className="inline-block gradient-secondary">content </span>
                    <span className="inline-block gradient-secondary">creation</span>
                  </h2>
                </div>
              </div>

              {/* Subtitle */}
              <div className="animate-fade-in">
                <p className="paragraph text-balance text-muted-foreground">
                  The unified workspace for modern creators. Bring your ideas, docs, and AI agents together to plan, draft, and publish without the chaos
                </p>
              </div>

              {/* Action Buttons */}
              <div className="animate-fade-in">
                <div className="flex items-center justify-center gap-x-4">
                  <Link href="/auth/signin">
                    <button
                      data-slot="button"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none active:scale-95 cursor-pointer select-none bg-foreground text-background hover:opacity-80 h-9 px-4 py-2 group overflow-hidden relative shadow-sm"
                    >
                      <div className="relative overflow-hidden">
                        <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                          Start for free
                        </div>
                        <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                          Start for free
                        </div>
                      </div>
                    </button>
                  </Link>

                  <a href="#demo">
                    <button
                      data-slot="button"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none active:scale-95 cursor-pointer select-none bg-white/10 text-white border border-white/15 hover:bg-white/15 hover:border-white/25 h-9 px-4 py-2 group overflow-hidden relative"
                    >
                      <div className="relative overflow-hidden">
                        <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                          Watch demo
                        </div>
                        <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                          Watch demo
                        </div>
                      </div>
                    </button>
                  </a>
                </div>
              </div>

              {/* Creators juggle 10+ apps daily Card */}
              <div className="w-full max-w-2xl mt-8 animate-fade-in">
                <div className="relative w-full h-80 sm:h-96 rounded-2xl p-8 bg-white transition-colors duration-1000 overflow-hidden border-4 border-primary-100 select-none shadow-sm">
                  <div className="h-full flex flex-col items-center justify-center text-center relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Floating App Badges */}
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 -rotate-6 transition-transform hover:scale-110"
                        style={{ top: '15%', left: '12%' }}
                      >
                        Figma
                      </div>
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 rotate-6 transition-transform hover:scale-110"
                        style={{ top: '18%', right: '14%' }}
                      >
                        Notion
                      </div>
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 -rotate-3 transition-transform hover:scale-110"
                        style={{ bottom: '22%', left: '10%' }}
                      >
                        Docs
                      </div>
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 rotate-8 transition-transform hover:scale-110"
                        style={{ bottom: '18%', right: '12%' }}
                      >
                        Slack
                      </div>
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 -rotate-12 transition-transform hover:scale-110"
                        style={{ top: '48%', left: '4%' }}
                      >
                        Instagram
                      </div>
                      <div
                        className="absolute bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm text-xs font-medium text-neutral-800 rotate-10 transition-transform hover:scale-110"
                        style={{ top: '50%', right: '6%' }}
                      >
                        Trello
                      </div>
                    </div>

                    <h3 className="text-2xl font-medium mb-6 relative z-10 px-4 text-pretty max-w-[80%] mx-auto md:max-w-none md:px-0 text-foreground">
                      Creators juggle 10+ apps daily...
                    </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

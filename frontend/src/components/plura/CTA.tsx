'use client';

import React from 'react';
import Link from 'next/link';

export default function CTA() {
  return (
    <div id="cta" className="w-full">
      <div className="mx-auto lg:max-w-5xl px-4 lg:px-0 relative w-full py-16 lg:py-24 z-0">
        {/* Full-width dark backdrop */}
        <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen h-full mx-auto bg-foreground -z-10" />

        <div className="flex flex-col items-center text-center gap-4 py-16 lg:py-14 rounded-xl lg:rounded-3xl">
          <div className="relative z-20 max-w-xl lg:max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-[54px] font-bold w-full text-balance font-heading text-white! uppercase leading-tight">
              <span>
                <span className="inline-block text-white">Unlock </span>
                <span className="inline-block text-white">your </span>
                <span className="inline-block text-white">content </span>
                <span className="text-gradient-container relative z-0 inline-block">
                  <span className="text-gradient-animate text-transparent bg-clip-text bg-linear-to-r from-[#E2D4C1] via-[#F97316] to-[#8B5CF6]">
                    superpowers
                  </span>

                  {/* Gradient Underline Wave SVG */}
                  <div className="mt-1 ml-auto w-auto relative">
                    <svg
                      className="h-2.5 lg:h-4 opacity-80 ml-auto w-auto"
                      width="279"
                      height="37"
                      viewBox="0 0 279 37"
                      fill="none"
                    >
                      <path
                        d="M3.00003 26.4646C20.7972 8.90161 44.4197 -12.7134 60.1891 18.8252C74.1134 46.6733 96.0845 32.1794 115.468 15.3238C121.269 10.2794 131.513 2.14726 140.084 3.97089C148.075 5.67104 154.948 17.8097 161.941 22.2204C176.416 31.3505 200.434 17.5331 214.568 13.0957C235.245 6.6039 254.459 0.660135 276.107 3.54646"
                        stroke="url(#paint0_linear_cta)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="paint0_linear_cta" x1="3.00003" y1="18.6157" x2="276.107" y2="18.6156" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E2D4C1" />
                          <stop offset="0.5" stopColor="#F97316" />
                          <stop offset="1" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <svg
                      className="h-2.5 lg:h-4 opacity-80 ml-auto w-auto absolute inset-0 blur-[3px] scale-105 animate-pulse"
                      width="279"
                      height="37"
                      viewBox="0 0 279 37"
                      fill="none"
                    >
                      <path
                        d="M3.00003 26.4646C20.7972 8.90161 44.4197 -12.7134 60.1891 18.8252C74.1134 46.6733 96.0845 32.1794 115.468 15.3238C121.269 10.2794 131.513 2.14726 140.084 3.97089C148.075 5.67104 154.948 17.8097 161.941 22.2204C176.416 31.3505 200.434 17.5331 214.568 13.0957C235.245 6.6039 254.459 0.660135 276.107 3.54646"
                        stroke="url(#paint0_linear_cta_blur)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="paint0_linear_cta_blur" x1="3.00003" y1="18.6157" x2="276.107" y2="18.6156" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E2D4C1" />
                          <stop offset="0.5" stopColor="#F97316" />
                          <stop offset="1" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </span>
              </span>
            </h2>

            <div>
              <p className="text-sm md:text-base text-neutral-300 text-center mt-4">
                Plura brings all your creative tools into one place
              </p>
            </div>
          </div>

          <div className="mt-5 w-full">
            <div className="flex flex-col items-center justify-center">
              <Link href="/auth/signin">
                <button
                  data-slot="button"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all active:scale-95 cursor-pointer select-none bg-white text-foreground hover:bg-white/90 h-10 px-5 py-2 group overflow-hidden relative shadow-md"
                >
                  <div className="relative overflow-hidden font-semibold">
                    <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                      Start for free
                    </div>
                    <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                      Start for free
                    </div>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

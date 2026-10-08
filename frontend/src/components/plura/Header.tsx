'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 inset-x-0 z-50 pointer-events-none">
      <div className="gradient-blur pointer-events-none absolute z-10 inset-x-0 top-0" style={{ height: '10%' }}>
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            backdropFilter: 'blur(0.5px)',
            WebkitBackdropFilter: 'blur(0.5px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 2,
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 3,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 62.5%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 62.5%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 4,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 5,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 87.5%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 87.5%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 6,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 7,
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%, rgba(0,0,0,0) 112.5%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%, rgba(0,0,0,0) 112.5%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 8,
            backdropFilter: 'blur(64px)',
            WebkitBackdropFilter: 'blur(64px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)',
          }}
        />
      </div>

      <div className="flex flex-col items-center py-2 rounded-2xl relative z-50 mx-auto w-full lg:max-w-7xl border border-transparent overflow-hidden pointer-events-auto lg:mt-2 bg-transparent">
        <div className="mx-auto px-4 lg:px-0 h-full lg:pr-2 lg:pl-3 lg:max-w-7xl z-0 w-full">
          <div className="h-10 w-full flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <Link
                className="flex items-center justify-center gap-1.5 select-none transition-colors duration-200 p-1 w-8 z-20 text-foreground"
                href="/"
              >
                <svg
                  className="h-6 lg:h-6 w-auto"
                  width="179"
                  height="254"
                  viewBox="0 0 179 254"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.95771 218.931L53.8124 245.592C64.4931 251.802 69.8335 254.907 73.8441 252.6C77.8547 250.292 77.8547 244.115 77.8547 231.76V129.609C77.8547 125.101 77.8547 122.847 76.783 120.991C75.7113 119.135 73.7593 118.008 69.8554 115.753L24.0007 89.2759C13.3338 83.1166 8.00036 80.037 4.00018 82.3464C0 84.6557 0 90.8145 0 103.132V205.099C0 209.592 0 211.838 1.0657 213.691C2.13139 215.543 4.0735 216.672 7.95771 218.931Z"
                    fill="currentColor"
                  />
                  <path
                    d="M170.201 56.8134L85.4194 7.85851C74.7525 1.69922 69.4191 -1.38043 65.4189 0.928939C61.4187 3.23831 61.4187 9.39702 61.4187 21.7145V72.6429C61.4187 76.9602 61.4187 79.1188 62.4145 80.9232C63.4103 82.7277 65.2366 83.8784 68.8893 86.1799L93.7405 101.838C97.3932 104.14 99.2195 105.291 100.215 107.095C101.211 108.899 101.211 111.058 101.211 115.375V169.051C101.211 181.429 101.211 187.618 105.228 189.924C109.245 192.23 114.59 189.109 125.279 182.868L170.269 156.598C174.141 154.337 176.077 153.206 177.139 151.356C178.201 149.507 178.201 147.265 178.201 142.781V70.6693C178.201 66.1613 178.201 63.9073 177.129 62.051C176.057 60.1947 174.105 59.0676 170.201 56.8134Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="sr-only text-lg font-semibold font-heading">plura</span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center justify-center absolute inset-x-0 left-1/2 -translate-x-1/2 mx-auto gap-2">
              <Link
                className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
                href="/#features"
              >
                Features
              </Link>
              <Link
                className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
                href="/blog"
              >
                Blog
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <button
                  data-slot="button"
                  className="items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none active:scale-95 cursor-pointer select-none bg-foreground text-background hover:opacity-80 h-9 px-4 py-2 group overflow-hidden relative hidden lg:flex"
                >
                  <div className="relative overflow-hidden">
                    <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                      Sign In
                    </div>
                    <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                      Sign In
                    </div>
                  </div>
                </button>
              </Link>

              <button
                data-slot="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none active:scale-95 cursor-pointer select-none text-muted-foreground hover:bg-secondary hover:text-muted-foreground/90 size-8 lg:hidden"
                aria-label="Toggle Menu"
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
                  className="lucide lucide-menu text-black dark:text-white"
                >
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                  <path d="M4 6h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="w-full px-4 pt-4 pb-3 flex flex-col gap-2 bg-background/95 backdrop-blur-md border-b border-border mt-2 lg:hidden">
            <Link
              className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              className="block px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary text-foreground"
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/auth/signin"
              className="mt-2 block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button className="w-full items-center justify-center rounded-md text-sm font-medium bg-foreground text-background py-2">
                Sign In
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

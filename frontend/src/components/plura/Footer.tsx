'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer" className="relative bg-foreground text-white overflow-hidden z-0">
      <div className="w-full mx-auto lg:max-w-5xl px-4 lg:px-0 relative">
        <div className="w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent mb-12" />

        <div className="flex flex-col items-center justify-center gap-y-4 py-8">
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Link className="flex items-center gap-1.5 select-none" href="/">
                <svg
                  className="h-6 lg:h-5 w-auto"
                  width="179"
                  height="254"
                  viewBox="0 0 179 254"
                  fill="none"
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
                <span className="hidden lg:block text-lg font-semibold font-heading tracking-tight">
                  plura
                </span>
              </Link>
            </div>
          </div>

          <div>
            <p className="text-white/70 text-sm max-w-xs text-center">
              The content studio for creators
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-6 pt-2">
              <Link
                className="text-white/50 text-sm font-medium hover:text-white transition-colors"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-white/50 text-sm font-medium hover:text-white transition-colors"
                href="/terms"
              >
                Terms of Use
              </Link>
              <Link
                className="text-white/50 text-sm font-medium hover:text-white transition-colors"
                href="/cookies"
              >
                Cookies
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-6">
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors size-8 flex items-center justify-center rounded-md"
                href="https://x.com/plurahq"
                aria-label="Twitter"
              >
                <svg
                  className="size-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1200"
                  height="1227"
                  fill="none"
                  viewBox="0 0 1200 1227"
                >
                  <path
                    fill="currentColor"
                    d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                  />
                </svg>
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors size-8 flex items-center justify-center rounded-md"
                href="mailto:support@plura.in"
                aria-label="Email"
              >
                <svg className="size-5" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    opacity="0.4"
                    d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pb-6">
          <div className="flex justify-center items-center">
            <p className="text-white/60 text-sm">
              © 2026 Plura. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function Nav() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-20 bg-[#000000]/80 ">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-tight">DocsChat</span>
        </Link>
        {!loading && (
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/notebook" className="text-sm bg-white text-base px-5 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                Notebook
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors">Sign in</Link>
                <Link href="/register" className="text-sm bg-white text-base px-5 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">Get started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

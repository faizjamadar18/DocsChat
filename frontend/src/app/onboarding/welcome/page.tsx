'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { api } from '../../../lib/api';

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get('/auth/me');
        if (!cancelled && me?.onboarding_completed === true) {
          router.push('/home');
          return;
        }
      } catch {
        if (!cancelled) router.push('/login');
        return;
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/15 border-l-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-sans">
      <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.025em] text-white leading-[1.25]">
        Welcome to Quello
      </h1>
      <p className="mt-3.5 text-[14px] leading-[1.55] text-neutral-400 font-normal tracking-[-0.01em]">
        Quello is your AI workspace for content. Upload PDFs to Assets, write in Studio,
        and ask Ora anything grounded in your own knowledge.
      </p>
      <button
        type="button"
        onClick={() => router.push('/onboarding/organization')}
        className="mt-8 w-full h-10 rounded-lg bg-[#eeeeec] hover:bg-white text-[#111110] text-[14px] font-medium transition-all active:scale-[0.99] cursor-pointer shadow-xs"
      >
        Get started
      </button>
    </div>
  );
}

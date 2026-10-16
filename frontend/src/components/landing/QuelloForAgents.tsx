'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ClaudeIcon,
  GrokIcon,
  ChatGptIcon,
  PerplexityIcon,
  MistralIcon,
  GeminiIcon,
} from '@/components/connectors/ConnectorIcons';
import { useInView } from '@/hooks/useInView';

interface CardItem {
  id: string;
  name: string;
  href: string;
  renderContent: () => React.ReactNode;
}

const CARDS: CardItem[] = [
  {
    id: 'claude',
    name: 'Claude',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2 text-[#1a1916]">
        <ClaudeIcon className="size-5.5 shrink-0 text-[#D97757]" />
        <span className="text-[17px] font-medium tracking-[-0.02em] text-[#1a1916]">
          Claude
        </span>
      </div>
    ),
  },
  {
    id: 'grok',
    name: 'Grok',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2 text-[#1a1916]">
        <GrokIcon className="size-5.5 shrink-0 text-[#1a1916]" />
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#1a1916]">
          Grok
        </span>
      </div>
    ),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2 text-[#1a1916]">
        <ChatGptIcon className="size-5.5 shrink-0 text-[#1a1916]" fill="#1a1916" />
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#1a1916]">
          OpenAI
        </span>
      </div>
    ),
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2 text-[#1a1916]">
        <PerplexityIcon className="size-5.5 shrink-0 text-[#20808D]" />
        <span className="text-[16px] font-medium tracking-[-0.01em] text-[#1a1916]">
          Perplexity
        </span>
      </div>
    ),
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2">
        <MistralIcon className="size-5.5 shrink-0 text-[#FF7000]" />
        <div className="flex flex-col leading-[1.05] -mt-0.5">
          <span className="text-[12px] font-black tracking-[0.06em] text-[#1a1916]">
            MISTRAL
          </span>
          <span className="text-[12px] font-black tracking-[0.06em] text-[#1a1916]">
            AI_
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'gemini',
    name: 'Gemini',
    href: '/mcp',
    renderContent: () => (
      <div className="flex items-center gap-2 text-[#1a1916]">
        <GeminiIcon className="size-5.5 shrink-0" />
        <span className="text-[17px] font-medium tracking-[-0.02em] text-[#1a1916]">
          Gemini
        </span>
      </div>
    ),
  },
];

/**
 * AnimatedCardBorder: Traces an orange border clockwise 360 degrees around the card
 * using conic-gradient mask starting from 9 o'clock (-90deg).
 */
function AnimatedCardBorder({ onComplete }: { onComplete: () => void }) {
  const borderRef = useRef<HTMLDivElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId: number;
    const duration = 2000; // 2 seconds border trace

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // easeInOut sinusoidal easing
      const progress = 0.5 * (1 - Math.cos(Math.PI * rawProgress));
      const degrees = progress * 360;

      if (borderRef.current) {
        const mask = `conic-gradient(from -90deg at 50% 50%, black ${degrees}deg, transparent ${degrees}deg)`;
        borderRef.current.style.maskImage = mask;
        borderRef.current.style.webkitMaskImage = mask;
      }

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // Complete tracing, fade out border and notify parent
        setIsFadingOut(true);
        onComplete();
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <div
      ref={borderRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-[#ff6a00] transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        maskImage: 'conic-gradient(from -90deg at 50% 50%, black 0deg, transparent 0deg)',
        WebkitMaskImage: 'conic-gradient(from -90deg at 50% 50%, black 0deg, transparent 0deg)',
      }}
    />
  );
}

/**
 * LogoPulseRing: Radiates an expanding orange highlight ring from the Quello mark
 * when a card's border finishes tracing.
 */
function LogoPulseRing({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 800); // 800ms duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[18px] border-2 border-[#ff6a00] animate-quello-logo-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-[22px] border border-[#ff6a00]/30 animate-quello-logo-glow"
      />
    </>
  );
}

export default function QuelloForAgents() {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isLogoHighlighted, setIsLogoHighlighted] = useState(false);
  const nextCardIndexRef = useRef(0);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Viewport gate: card loop starts when the user lands on the section, not on page mount.
  const { ref: sectionRef, inView, hasEntered } = useInView<HTMLElement>();

  // Trigger the next card in 1-by-1 sequence
  const startNextCard = useCallback(() => {
    setActiveCardIndex(nextCardIndexRef.current);
    nextCardIndexRef.current = (nextCardIndexRef.current + 1) % CARDS.length;
  }, []);

  // Kick off 800ms after landing on the section.
  // Re-runs on every re-entry so the loop restarts at the first card.
  useEffect(() => {
    if (!hasEntered || !inView) return;
    const timer = setTimeout(() => {
      startNextCard();
    }, 800);
    return () => clearTimeout(timer);
  }, [startNextCard, hasEntered, inView]);

  // Pause on exit: unmounting the active card/pulse cancels their
  // raf + timers via child cleanups; reset so re-entry restarts at card 1.
  useEffect(() => {
    if (hasEntered && !inView) {
      setActiveCardIndex(null);
      setIsLogoHighlighted(false);
      nextCardIndexRef.current = 0;
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    }
  }, [inView, hasEntered]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  // When card border finishes tracing:
  // 1. Clear card border (fades out)
  // 2. Trigger logo highlight pulse
  const handleCardBorderComplete = useCallback(() => {
    setActiveCardIndex(null);
    setIsLogoHighlighted(true);
  }, []);

  // When logo pulse completes (after 800ms):
  // Wait 600ms then start next card 1 by 1
  const handleLogoPulseComplete = useCallback(() => {
    setIsLogoHighlighted(false);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => {
      startNextCard();
    }, 600);
  }, [startNextCard]);

  return (
    <section id="connectors" ref={sectionRef} className="flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-[#fdfdfc] w-full max-w-full overflow-hidden scroll-mt-24">
      <div className="flex w-full max-w-300 flex-col gap-6">
        {/* Website Logo App Icon Tile with Animated Highlight Border */}
        <div className="relative shrink-0 w-fit">
          <div
            className={`relative size-14 rounded-[18px] shadow-[0_16px_36px_-6px_rgba(0,0,0,0.32)] overflow-hidden shrink-0 transition-transform duration-300 ${
              isLogoHighlighted ? 'scale-105' : 'scale-100'
            }`}
          >
            <Image
              src="/favicon.svg"
              alt="Quello"
              width={56}
              height={56}
              className="size-full"
              loading="lazy"
            />
          </div>

          {/* Logo Highlight Ripple / Expanding Border Animation */}
          {isLogoHighlighted && <LogoPulseRing onComplete={handleLogoPulseComplete} />}
        </div>

        {/* Section Heading & Subtitle */}
        <div data-section-anchor="true" className="flex flex-col gap-2.5">
          <h2 className="text-xl sm:text-[28px] md:text-[32px] font-medium tracking-[-0.03em] text-[#1a1916]">
            Use your workspace inside your AI app
          </h2>
          <p className="text-sm sm:text-[15px] md:text-base text-[#6b665e] max-w-2xl leading-normal">
            Connect your workspace so your AI app can search your documents and answer with sources. Read-only — it can never edit or delete anything.
          </p>
          <Link
            href="/mcp"
            className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#21201c] hover:text-[#ff6a00] transition-colors"
          >
            <span>How it works</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 6 AI Agent Lockup Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mt-6 w-full">
          {CARDS.map((card, idx) => {
            const isActive = activeCardIndex === idx;

            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative flex h-31.5 sm:h-34 items-center justify-center rounded-2xl border bg-white transition-all duration-300 ${
                  isActive
                    ? 'border-[#e4e4e4] shadow-xs'
                    : 'border-[#e4e4e4] hover:border-[#cfceca] hover:shadow-xs'
                }`}
              >
                {card.renderContent()}

                {/* Animated Orange Tracing Border Overlay */}
                {isActive && (
                  <AnimatedCardBorder onComplete={handleCardBorderComplete} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

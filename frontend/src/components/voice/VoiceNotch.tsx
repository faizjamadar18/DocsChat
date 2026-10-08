'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useVoiceAgent } from '../../context/VoiceAgentContext';

function statusLabel(status: string): string {
  switch (status) {
    case 'checking':
      return 'Checking...';
    case 'warming':
      return 'Waking up...';
    case 'connecting':
      return 'Connecting...';
    case 'listening':
      return 'Listening...';
    case 'thinking':
      return 'Thinking...';
    case 'speaking':
      return 'Speaking...';
    default:
      return '';
  }
}

/** Center "eyes" of the notch — a different mood per voice state (design photos). */
function NotchEyes({ status }: { status: string }) {
  // Speaking: 4-bar pulsing equalizer (dot, tall, medium, medium-tall).
  if (status === 'speaking') {
    const bars = [
      { h: 'h-2', delay: '0s', dur: '0.7s' },
      { h: 'h-6', delay: '0.15s', dur: '0.9s' },
      { h: 'h-4', delay: '0.3s', dur: '0.8s' },
      { h: 'h-[18px]', delay: '0.45s', dur: '1s' },
    ];
    return (
      <div className="flex items-center gap-1 px-1 h-7" aria-hidden>
        {bars.map((b, i) => (
          <span
            key={i}
            className={`w-[5px] ${b.h} rounded-full bg-white animate-eq-bar ora-eyes-glow`}
            style={{ animationDelay: b.delay, animationDuration: b.dur }}
          />
        ))}
      </div>
    );
  }

  // Listening: two fixed pills, slightly big, staring in one place.
  if (status === 'listening') {
    return (
      <div className="flex items-center gap-1.5 px-1 h-6" aria-hidden>
        <span className="w-2 h-4 rounded-full bg-white ora-eyes-glow" />
        <span className="w-2 h-4 rounded-full bg-white ora-eyes-glow" />
      </div>
    );
  }

  // Thinking / connecting / checking: small eyes roaming side to side.
  return (
    <div className="flex items-center h-6 px-1" aria-hidden>
      <div className="flex items-center gap-1.5 animate-eyes-roam">
        <span className="w-2 h-3 rounded-full bg-white ora-eyes-glow" />
        <span className="w-2 h-3 rounded-full bg-white ora-eyes-glow" />
      </div>
    </div>
  );
}

export default function VoiceNotch() {
  const {
    status,
    isActive,
    isMuted,
    errorMsg,
    needsKey,
    endVoice,
    toggleMute,
    dismissKeyPrompt,
  } = useVoiceAgent();
  const rootRef = useRef<HTMLDivElement>(null);

  // Tap anywhere outside the bubble closes it and stops billing.
  useEffect(() => {
    if (!isActive && !needsKey && status !== 'error') return;
    const handleDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (isActive) endVoice('outside-click');
        else dismissKeyPrompt();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isActive) endVoice('escape');
        else dismissKeyPrompt();
      }
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isActive, needsKey, status, endVoice, dismissKeyPrompt]);

  if (needsKey && !isActive) {
    return (
      <div ref={rootRef} className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-4 w-80 text-center">
          <p className="text-sm font-semibold text-text-primary">Add your free Vapi key</p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Voice uses your own free key so the owner pays nothing. Takes 2 minutes.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              href="/settings"
              onClick={dismissKeyPrompt}
              className="flex-1 px-3 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium text-center hover:bg-black transition-colors"
            >
              Go to Settings
            </Link>
            <button
              type="button"
              onClick={dismissKeyPrompt}
              className="px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Dashboard: dashboard.vapi.ai -&gt; API Keys -&gt; copy Public key
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error' && errorMsg && !isActive) {
    return (
      <div ref={rootRef} className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-4 w-80 text-center">
          <p className="text-sm font-semibold text-text-primary">Voice needs attention</p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{errorMsg}</p>
          <Link
            href="/settings"
            className="mt-3 inline-block px-3 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium hover:bg-black transition-colors"
          >
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  if (!isActive) return null;

  const label = statusLabel(status);

  return (
    <div ref={rootRef} className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-fade-in">
      <div className="bg-[#111113] rounded-full flex items-center gap-4 pl-2 pr-2 py-1.5 shadow-xl">
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute mic' : 'Mute mic'}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <NotchEyes status={status} />

        <button
          type="button"
          onClick={() => endVoice('hangup')}
          title="End call"
          className="w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {label ? <span className="text-xs text-text-secondary">{label}</span> : null}
      </div>
    </div>
  );
}

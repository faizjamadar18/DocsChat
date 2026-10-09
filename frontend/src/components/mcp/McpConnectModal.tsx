'use client';
import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { McpProvider } from './mcpProviders';

/** Connect popup rendered inside the drawer overlay (absolute, not viewport-fixed). */
export default function McpConnectModal({
  provider,
  serverUrl,
  onClose,
}: {
  provider: McpProvider;
  serverUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = serverUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = provider.icon;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-5">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md max-h-full flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Icon className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xl font-bold tracking-tight text-text-primary leading-snug">
                  Connect {provider.name}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-full border border-border text-text-muted hover:text-text-primary hover:bg-sidebar transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Follow these steps to connect {provider.name} to your workspace.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Your MCP server URL
            </h4>
            <p className="text-xs text-text-secondary mt-0.5 mb-2 leading-relaxed">
              Copy this URL and add it as an MCP server in {provider.name}. No installation needed.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-sidebar/50 pl-3.5 pr-1.5 py-1.5">
              <code className="flex-1 min-w-0 truncate text-xs text-text-primary font-mono select-all">
                {serverUrl || 'Loading...'}
              </code>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!serverUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-text-secondary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-muted" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              Add it to {provider.name}
            </h4>
            <div className="space-y-0">
              {provider.steps.map((s, index) => {
                const isLast = index === provider.steps.length - 1;
                return (
                  <div key={s} className="relative flex items-start gap-2.5 pb-2.5 last:pb-0">
                    {/* Continuous vertical line spanning from this circle's center to the next circle's center */}
                    {!isLast && (
                      <div
                        className="absolute left-2.5 top-2.5 -bottom-2.5 w-px -translate-x-1/2 bg-neutral-200 dark:bg-neutral-300"
                        aria-hidden="true"
                      />
                    )}
                    {/* Circle icon with opaque white fill to sit cleanly over the line */}
                    <div className="relative z-10 shrink-0">
                      <svg
                        className="w-5 h-5 text-text-primary block shrink-0"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="white"
                        />
                        <path
                          d="M6.5 10.2l2.3 2.3 4.7-4.7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {/* Step instruction text */}
                    <div className="flex-1 min-w-0 pt-0.5 text-xs text-text-secondary leading-normal">
                      {s}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {provider.authNote ? (
            <p className="text-xs text-text-muted leading-relaxed">
              {provider.authNote}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border/70 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-text-primary hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

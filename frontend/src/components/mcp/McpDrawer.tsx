'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plug2 } from 'lucide-react';
import type { McpProvider } from './mcpProviders';
import McpKeys from './McpKeys';
import McpConnectModal from './McpConnectModal';

export default function McpDrawer({
  provider,
  workspaceId,
  serverUrl,
  onClose,
}: {
  provider: McpProvider | null;
  workspaceId?: string;
  serverUrl: string;
  onClose: () => void;
}) {
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    if (!provider) return;
    setShowConnect(false);
  }, [provider]);

  useEffect(() => {
    if (!provider || showConnect) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [provider, showConnect, onClose]);

  useEffect(() => {
    if (!provider) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [provider]);

  // Portaled to document.body: the page wrapper keeps an entry-animation
  // transform, which would otherwise trap this fixed overlay to the page box
  // instead of the viewport (dimming + drawer cut off mid-page).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!provider || !mounted) return null;

  const Icon = provider.icon;
  const isReady = provider.status === 'ready';

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white  shadow-xl flex flex-col overflow-hidden animate-slide-in-right ${showConnect ? 'border-transparent' : 'border-border'}`}>
        {/* Header — no divider, flows straight into the body like the reference */}
        <div className="flex items-center gap-3.5 px-6 pt-6 pb-2 shrink-0">
          <Icon className="w-9 h-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-text-primary leading-snug">
              {provider.name}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 truncate">{provider.tagline}</p>
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

        {/* Body — fixed, never scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          {!isReady ? (
            <div className="rounded-xl border border-border bg-sidebar/50 px-4 py-3 space-y-1.5">
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-subtle text-accent-hover">
                In build phase
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                This connector is currently under development by our team. It will be
                enabled here automatically once ready — no action needed from you.
              </p>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">About</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {provider.about}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1.5">
              What you need
            </h3>
            <ul className="list-disc ml-4 space-y-1.5 text-xs text-text-secondary leading-relaxed">
              {provider.needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>

          {provider.paidNote ? (
            <p className="text-xs text-text-muted leading-relaxed rounded-xl border border-border bg-sidebar/30 px-3.5 py-2.5">
              {provider.paidNote}
            </p>
          ) : null}

          {provider.requiresKey ? <McpKeys workspaceId={workspaceId} /> : null}
        </div>

        {/* Footer — always visible */}
        <div className="px-6 py-4 border-t border-border/70 bg-white shrink-0">
          <button
            type="button"
            disabled={!isReady}
            onClick={() => setShowConnect(true)}
            title={isReady ? `Connect ${provider.name}` : `${provider.name} is still in build phase`}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              isReady
                ? 'bg-text-primary text-white hover:bg-black cursor-pointer'
                : 'bg-sidebar text-text-muted cursor-not-allowed'
            }`}
          >
            <Plug2 className="w-4 h-4" />
            {isReady ? `Connect ${provider.name}` : 'Coming soon'}
          </button>
        </div>

        {/* Connect popup lives inside the drawer, not over the whole page */}
        {showConnect && isReady ? (
          <McpConnectModal
            provider={provider}
            serverUrl={serverUrl}
            onClose={() => setShowConnect(false)}
          />
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

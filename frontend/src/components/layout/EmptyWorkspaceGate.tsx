'use client';

import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import CreateWorkspaceModal from '../workspaces/CreateWorkspaceModal';

/**
 * Zero-room gate content. Rendered by AppShell for EVERY workspace tab
 * when the user has no rooms left (left/removed with nothing else).
 * Never a forced modal: calm full page; the button opens the same
 * create-workspace dialog Settings uses (name it yourself), dismissible,
 * invite links keep working. Onboarding is never involved.
 */
export default function EmptyWorkspaceGate() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="w-full flex-1 flex items-center justify-center px-6 py-16 animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 sm:p-10 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sidebar border border-border flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6 text-text-secondary" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">No workspaces yet</h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          You left your last workspace. Name and create a fresh one, or join
          your team again with an invite link — no setup questions, ever.
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="w-full h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create workspace
        </button>
      </div>
      <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

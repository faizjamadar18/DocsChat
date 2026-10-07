'use client';
import React, { useState } from 'react';
import { Settings, CreditCard, User, AlertTriangle, Eye, EyeOff, Mic } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../hooks/useAuth';
import { useVapiKey } from '../../../hooks/useVapiKey';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'account'>('general');
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { status: vapiStatus, saving: vapiSaving, error: vapiError, saveKey, deleteKey } = useVapiKey();
  const [vapiInput, setVapiInput] = useState('');
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [vapiSavedFlash, setVapiSavedFlash] = useState(false);

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'Shreyas HQ');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'shreyashq');
  const [description, setDescription] = useState(currentWorkspace?.description || '');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'general'
              ? 'text-text-primary border-b-2 border-text-primary font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`pb-3 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'billing'
              ? 'text-text-primary border-b-2 border-text-primary font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Billing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`pb-3 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'account'
              ? 'text-text-primary border-b-2 border-text-primary font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Workspace</h3>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Workspace Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#111113] flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {workspaceName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer"
                  >
                    Upload Image
                  </button>
                  <p className="text-[11px] text-text-muted mt-1">PNG, JPG, or WEBP. Max 5 MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-xs text-text-primary focus:outline-none focus:border-accent-hover"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Workspace URL
              </label>
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <span className="px-3 py-2 bg-sidebar text-xs text-text-secondary border-r border-border">
                  plura.in/app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs text-text-primary focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">Only lowercase letters, numbers, and hyphens</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border text-xs text-text-primary focus:outline-none focus:border-accent-hover resize-none"
              />
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-accent-hover hover:bg-[#4C389E] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border space-y-2">
            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Permanently delete this workspace and all its data. This action cannot be undone.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Subscription Plan</h3>
          <div className="p-4 rounded-xl border border-border bg-sidebar flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-primary">Community Plan</p>
              <p className="text-[11px] text-text-secondary">Free access to workspace and Qdrant RAG</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Account */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Profile</h3>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={user?.username || ''}
                className="w-full px-3 py-2 rounded-lg border border-border text-xs text-text-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                defaultValue={user?.email || ''}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sidebar text-xs text-text-secondary"
              />
            </div>
          </div>

          {/* Voice Assistant: user-owned free Vapi public key (BYOK, owner pays $0) */}
          <div className="space-y-3 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Mic className="w-4 h-4" />
              <span>Voice Assistant</span>
            </h3>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Public VAPI API Key
              </label>
              <p className="text-[11px] text-text-muted mb-2">
                Get your free Public VAPI API key from{' '}
                <a
                  href="https://dashboard.vapi.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-text-primary"
                >
                  dashboard.vapi.ai
                </a>{' '}
                (API Keys -&gt; Public key, starts with pk_). Paste only the public key — never a
                private key. Tip: in Vapi, lock the key to this site under Allowed Origins and
                enable Transient Assistant only.
              </p>
              <div className="relative">
                <input
                  type={showVapiKey ? 'text' : 'password'}
                  value={vapiInput}
                  onChange={(e) => setVapiInput(e.target.value)}
                  placeholder={vapiStatus?.has_key ? vapiStatus.hint || '•••••••• (Key is Set)' : 'pk_... paste your public key'}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border text-xs text-text-primary focus:outline-none focus:border-accent-hover"
                />
                <button
                  type="button"
                  onClick={() => setShowVapiKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
                  title={showVapiKey ? 'Hide key' : 'Show key'}
                >
                  {showVapiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                <span className="font-medium">NOTE:</span> We never store your key as plain text.
                It is fully locked the moment you hit save, and only you can use it.
              </p>
              {vapiError ? <p className="text-[11px] text-red-600 mt-1">{vapiError}</p> : null}
              {vapiSavedFlash ? (
                <p className="text-[11px] text-emerald-600 mt-1">Key saved. Tap ●● Ora to talk.</p>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  disabled={vapiSaving}
                  onClick={async () => {
                    const ok = await saveKey(vapiInput);
                    if (ok) {
                      setVapiInput('');
                      setShowVapiKey(false);
                      setVapiSavedFlash(true);
                      setTimeout(() => setVapiSavedFlash(false), 4000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-accent-hover hover:bg-[#4C389E] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  {vapiSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {vapiStatus?.has_key ? (
                  <button
                    type="button"
                    disabled={vapiSaving}
                    onClick={() => void deleteKey()}
                    className="px-4 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Remove key
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

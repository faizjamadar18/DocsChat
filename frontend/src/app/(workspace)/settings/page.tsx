'use client';
import React, { useState } from 'react';
import { Settings, CreditCard, User, Shield, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../hooks/useAuth';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'account'>('general');
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'Shreyas HQ');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'shreyashq');
  const [description, setDescription] = useState(currentWorkspace?.description || '');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#ECECEE]">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'general'
              ? 'text-[#111827] border-b-2 border-[#111827] font-semibold'
              : 'text-[#6B7280] hover:text-[#111827]'
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
              ? 'text-[#111827] border-b-2 border-[#111827] font-semibold'
              : 'text-[#6B7280] hover:text-[#111827]'
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
              ? 'text-[#111827] border-b-2 border-[#111827] font-semibold'
              : 'text-[#6B7280] hover:text-[#111827]'
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
            <h3 className="text-sm font-semibold text-[#111827]">Workspace</h3>

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
                    className="px-3 py-1.5 rounded-lg border border-[#ECECEE] text-xs font-medium text-[#111827] hover:bg-[#F7F7F9] transition-colors cursor-pointer"
                  >
                    Upload Image
                  </button>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">PNG, JPG, or WEBP. Max 5 MB.</p>
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
                className="w-full px-3 py-2 rounded-lg border border-[#ECECEE] text-xs text-[#111827] focus:outline-none focus:border-[#5B45B2]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">
                Workspace URL
              </label>
              <div className="flex items-center rounded-lg border border-[#ECECEE] overflow-hidden">
                <span className="px-3 py-2 bg-[#F7F7F9] text-xs text-[#6B7280] border-r border-[#ECECEE]">
                  plura.in/app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs text-[#111827] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Only lowercase letters, numbers, and hyphens</p>
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
                className="w-full px-3 py-2 rounded-lg border border-[#ECECEE] text-xs text-[#111827] focus:outline-none focus:border-[#5B45B2] resize-none"
              />
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#5B45B2] hover:bg-[#4C389E] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-[#ECECEE] space-y-2">
            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-[#6B7280]">
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
          <h3 className="text-sm font-semibold text-[#111827]">Subscription Plan</h3>
          <div className="p-4 rounded-xl border border-[#ECECEE] bg-[#F7F7F9] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#111827]">Community Plan</p>
              <p className="text-[11px] text-[#6B7280]">Free access to workspace and Qdrant RAG</p>
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
            <h3 className="text-sm font-semibold text-[#111827]">Profile</h3>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={user?.username || ''}
                className="w-full px-3 py-2 rounded-lg border border-[#ECECEE] text-xs text-[#111827] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                defaultValue={user?.email || ''}
                className="w-full px-3 py-2 rounded-lg border border-[#ECECEE] bg-[#F7F7F9] text-xs text-[#6B7280]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

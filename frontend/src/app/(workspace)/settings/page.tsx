'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LogOut,
  Trash2,
  Upload,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff,
  Mic,
  AlertTriangle,
  CreditCard,
  Sparkles,
  Check,
  MessageSquare,
  Clock,
  Settings,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../hooks/useAuth';
import { useVapiKey } from '../../../hooks/useVapiKey';
import { useVoiceLogs, type VoiceLog } from '../../../hooks/useVoiceLogs';
import VoiceLogModal from '../../../components/voice/VoiceLogModal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'organization' | 'billing' | 'voice'>('account');
  const { currentWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const { status: vapiStatus, saving: vapiSaving, error: vapiError, saveKey, deleteKey } = useVapiKey();
  const { logs: voiceLogs, loading: voiceLogsLoading, deleteLog: deleteVoiceLog } = useVoiceLogs(currentWorkspace?.id);
  const [selectedVoiceLog, setSelectedVoiceLog] = useState<VoiceLog | null>(null);

  // Voice Key State
  const [vapiInput, setVapiInput] = useState('');
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [vapiSavedFlash, setVapiSavedFlash] = useState(false);

  // Profile Form State
  const usernameParts = (user?.username || 'User').trim().split(' ');
  const [firstName, setFirstName] = useState(usernameParts[0] || '');
  const [lastName, setLastName] = useState(usernameParts.slice(1).join(' ') || '');
  const [profileSavedFlash, setProfileSavedFlash] = useState(false);

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'My Workspace');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'workspace');
  const [description, setDescription] = useState(currentWorkspace?.description || '');
  const [workspaceSavedFlash, setWorkspaceSavedFlash] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState('English');
  const [colorMode, setColorMode] = useState('System');
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [productEmails, setProductEmails] = useState(true);

  // Formatted registration date
  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '8 Oct 2026';

  const userInitial = (firstName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage your account, workspace, preferences, and voice logs.
        </p>
      </div>

      {/* Pill-Style Segmented Tab Switcher */}
      <div className="inline-flex items-center p-1 rounded-full bg-sidebar border border-border gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Account
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'organization'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Organization
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Billing
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Voice Logs
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCOUNT                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="w-full space-y-6">
          {/* Card 1: Profile */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            {/* Header with Title and Profile Avatar on the Right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border/60">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                  Profile
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Your profile picture and full name will be displayed when you reply to a conversation in the Inbox.
                </p>

                <div className="pt-4">
                  <label className="block text-xs sm:text-sm font-medium text-text-primary">
                    Profile picture
                  </label>
                  <p className="text-xs text-text-muted mt-0.5">Max file size: 5MB</p>
                  <button
                    type="button"
                    className="mt-2.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                </div>
              </div>

              {/* Avatar circle matching template right-alignment */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 text-white border-2 border-border flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner shrink-0 overflow-hidden self-start sm:self-auto">
                {user?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.picture}
                    alt={user.username || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </div>
            </div>

            {/* Input Row: First Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Input Row: Last Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Input Row: Sign-in Email */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Sign-in email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'user@example.com'}
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar text-xs sm:text-sm text-text-secondary cursor-not-allowed select-none"
              />
            </div>

            {/* Readonly Row: Account created on */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4">
              <span className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Account created on
              </span>
              <span className="text-xs sm:text-sm text-text-secondary font-medium sm:text-right">
                {formattedDate}
              </span>
            </div>

            {/* Save Profile Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setProfileSavedFlash(true);
                  setTimeout(() => setProfileSavedFlash(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
              {profileSavedFlash && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Changes saved
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Preferences */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Preferences
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Customize your application experience.
              </p>
            </div>

            {/* Dropdown Row: Application Language */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Application language
              </label>
              <div className="relative w-full sm:max-w-xl lg:max-w-2xl">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-10"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
                <ChevronDown className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown Row: Color Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Color mode
              </label>
              <div className="relative w-full sm:max-w-xl lg:max-w-2xl">
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-10"
                >
                  <option value="System">System</option>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                </select>
                <ChevronDown className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Toggle Row 1: Weekly AI Conversation Summary */}
            <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-text-primary">
                  Weekly AI conversation summary
                </p>
                <p className="text-xs text-text-secondary">
                  A weekly recap of your AI Agent&apos;s conversations, every Monday.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={weeklySummary}
                onClick={() => setWeeklySummary(!weeklySummary)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  weeklySummary ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    weeklySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Row 2: Daily AI Conversation Summary */}
            <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-text-primary">
                  Daily AI conversation summary
                </p>
                <p className="text-xs text-text-secondary">
                  A daily recap of your AI Agent&apos;s conversations, every working day.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dailySummary}
                onClick={() => setDailySummary(!dailySummary)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  dailySummary ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    dailySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Row 3: Product Emails */}
            <div className="flex items-center justify-between gap-6 py-4">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-text-primary">
                  Product emails from Quello
                </p>
                <p className="text-xs text-text-secondary">
                  Occasional emails from us about new features, tips, and offers. Turn off any time.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={productEmails}
                onClick={() => setProductEmails(!productEmails)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  productEmails ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    productEmails ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 3: Resources */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Resources
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Helpful links and legal documents.
              </p>
            </div>

            {/* Row 1: Documentation */}
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <span className="text-xs sm:text-sm font-medium text-text-primary">Documentation</span>
              <Link
                href="/home"
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                Open
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </Link>
            </div>

            {/* Row 2: Blog */}
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <span className="text-xs sm:text-sm font-medium text-text-primary">Blog</span>
              <a
                href="https://quello.dev"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                Open
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </a>
            </div>

            {/* Row 3: Legal Documents */}
            <div className="flex items-center justify-between py-3">
              <span className="text-xs sm:text-sm font-medium text-text-primary">Legal documents</span>
              <div className="flex items-center gap-2">
                <Link
                  href="/privacy"
                  className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  Privacy
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link
                  href="/terms"
                  className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  Terms
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </div>
            </div>
          </div>



          {/* Action: Logout Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-sidebar text-xs sm:text-sm font-medium text-text-primary transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-text-secondary" />
              Logout
            </button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-semibold text-red-600">Delete account</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Permanently delete your account and all associated workspace documents. This action cannot be undone.
            </p>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              Delete my account
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORGANIZATION / WORKSPACE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'organization' && (
        <div className="w-full space-y-6">
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Workspace Profile
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Manage your workspace identity and sharing settings.
              </p>
            </div>

            {/* Workspace Logo Row */}
            <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary">
                  Workspace Logo
                </label>
                <p className="text-xs text-text-muted mt-0.5">PNG, JPG, or WEBP. Max 5MB.</p>
                <button
                  type="button"
                  className="mt-2.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image
                </button>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Input Row: Workspace Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Input Row: Workspace URL Slug */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Workspace URL
              </label>
              <div className="w-full sm:max-w-xl lg:max-w-2xl flex items-center rounded-xl border border-border overflow-hidden bg-sidebar/40">
                <span className="px-3.5 py-2.5 bg-sidebar text-xs text-text-secondary border-r border-border select-none">
                  plura.in/app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm text-text-primary focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Input Row: Description */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6 py-4">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0 mt-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
              />
            </div>

            {/* Save Workspace Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceSavedFlash(true);
                  setTimeout(() => setWorkspaceSavedFlash(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
              {workspaceSavedFlash && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Workspace updated
                </span>
              )}
            </div>
          </div>

          {/* Danger Zone: Delete Workspace */}
          <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete workspace
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Permanently delete this workspace and all its data. This action cannot be undone.
            </p>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BILLING                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="w-full space-y-6">
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Subscription Plan
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Manage your billing tier and workspace AI credits.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-sidebar/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text-primary">Community Plan</p>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Free access to workspace knowledge base, chat, and vector search.
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs shrink-0 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Upgrade Plan
              </button>
            </div>

            {/* AI Credits Bar */}
            <div className="p-5 rounded-2xl border border-border bg-sidebar/30 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-text-primary">AI Credits</span>
                <span className="text-text-secondary font-medium">49 credits left of 50</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '2%' }} />
              </div>
              <p className="text-[11px] text-text-muted">
                Credits refresh on the 1st of each month.
              </p>
            </div>
          </div>

          {/* Payment Method Placeholder */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Payment Method
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Add a credit card to enable automatic credit top-ups.
              </p>
            </div>

            <div className="py-8 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl p-6">
              <CreditCard className="w-8 h-8 text-text-muted mb-2" />
              <p className="text-xs sm:text-sm font-medium text-text-primary">No payment method on file</p>
              <p className="text-xs text-text-muted mt-0.5 max-w-sm">
                You are currently on the free Community plan and will not be charged.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer shadow-2xs"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VOICE LOGS                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'voice' && (
        <div className="w-full space-y-6">
          {/* Card 1: Voice Assistant Configuration (BYOK) */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary flex items-center gap-2">
                <Mic className="w-4 h-4 text-text-primary" />
                Voice Assistant
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Configure your custom VAPI voice assistant integration (BYOK).
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6">
                <div className="sm:w-48 shrink-0">
                  <label className="text-xs sm:text-sm font-medium text-text-primary block">
                    Public VAPI API Key
                  </label>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    Get your key from{' '}
                    <a
                      href="https://dashboard.vapi.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-primary hover:underline font-medium"
                    >
                      dashboard.vapi.ai
                    </a>
                  </p>
                </div>

                <div className="w-full sm:max-w-xl lg:max-w-2xl space-y-2">
                  <div className="relative">
                    <input
                      type={showVapiKey ? 'text' : 'password'}
                      value={vapiInput}
                      onChange={(e) => setVapiInput(e.target.value)}
                      placeholder={
                        vapiStatus?.has_key
                          ? vapiStatus.hint || '•••••••• (Key is Set)'
                          : 'pk_... paste your public key'
                      }
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVapiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                      title={showVapiKey ? 'Hide key' : 'Show key'}
                    >
                      {showVapiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-text-muted">
                    We never store keys in plain text. Your key is encrypted and accessible only to you.
                  </p>
                  {vapiError && <p className="text-xs text-red-600 font-medium">{vapiError}</p>}
                  {vapiSavedFlash && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Key saved successfully. Tap voice icon to talk.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
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
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {vapiSaving ? 'Saving...' : 'Save Voice Key'}
                </button>
                {vapiStatus?.has_key && (
                  <button
                    type="button"
                    disabled={vapiSaving}
                    onClick={() => void deleteKey()}
                    className="px-4 py-2 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Remove key
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Voice Conversation Logs & Transcripts */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
              <div>
                <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-text-primary" />
                  Voice Conversations
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  History and transcripts of past voice sessions with Ora.
                </p>
              </div>
              {voiceLogs.length > 0 && (
                <span className="text-xs text-text-muted font-medium bg-sidebar px-2.5 py-1 rounded-full border border-border self-start sm:self-auto">
                  {voiceLogs.length} session{voiceLogs.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {voiceLogsLoading ? (
              <div className="py-12 text-center text-xs text-text-muted">
                Loading voice logs...
              </div>
            ) : voiceLogs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl p-6">
                <Mic className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-xs sm:text-sm font-medium text-text-primary">No voice logs yet</p>
                <p className="text-xs text-text-muted mt-0.5 max-w-sm">
                  Start a voice conversation with Ora from the workspace header to automatically save transcripts and audio logs here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {voiceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border hover:border-border-subtle bg-surface hover:bg-sidebar/40 transition-all gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-text-primary shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                          {log.title || 'Voice conversation'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.duration_seconds}s
                        </span>
                        <span>•</span>
                        <span>
                          {log.created_at
                            ? new Date(log.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      {log.user_text && (
                        <p className="text-xs text-text-secondary truncate pt-0.5">
                          &ldquo;{log.user_text}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedVoiceLog(log)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer"
                      >
                        View Transcript
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this voice log?')) {
                            void deleteVoiceLog(log.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-border text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete voice log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transcript Viewer Modal */}
          <VoiceLogModal
            key={selectedVoiceLog?.id ?? 'closed'}
            log={selectedVoiceLog}
            onClose={() => setSelectedVoiceLog(null)}
            onDelete={(id) => {
              void deleteVoiceLog(id);
              setSelectedVoiceLog(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

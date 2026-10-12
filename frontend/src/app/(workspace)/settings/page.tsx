'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  LogOut,
  Trash2,
  Upload,
  ChevronDown,
  Eye,
  EyeOff,
  Mic,
  AlertTriangle,
  Check,
  MessageSquare,
  Clock,
  Settings,
  X,
  Plus,
  Building,
  Globe,
  Bell,
  Palette,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { useWorkspace, type Workspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { useVapiKey } from '../../../hooks/useVapiKey';
import { useVoiceLogs, type VoiceLog } from '../../../hooks/useVoiceLogs';
import VoiceLogModal from '../../../components/voice/VoiceLogModal';

/**
 * Resizes and compresses image on a client-side canvas to optimize upload size (<50KB base64).
 */
const resizeImage = (file: File, maxWidth = 256, maxHeight = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image exceeds the 5MB size limit.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

const sanitizeSlug = (val: string) => {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const applyThemePreference = (mode: string) => {
  if (typeof window === 'undefined') return;
  if (mode === 'Dark') {
    document.documentElement.classList.add('dark');
  } else if (mode === 'Light') {
    document.documentElement.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'workspace' | 'voice'>('account');
  const { currentWorkspace, refreshWorkspaces, workspaces, switchWorkspace } = useWorkspace();
  const { user, logout, setUser, refreshUser } = useAuth();
  const { status: vapiStatus, saving: vapiSaving, error: vapiError, saveKey, deleteKey } = useVapiKey();
  const { logs: voiceLogs, loading: voiceLogsLoading, deleteLog: deleteVoiceLog } = useVoiceLogs(currentWorkspace?.id);
  const [selectedVoiceLog, setSelectedVoiceLog] = useState<VoiceLog | null>(null);

  // File Input Refs
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const workspaceLogoInputRef = useRef<HTMLInputElement>(null);

  // Voice Key State
  const [vapiInput, setVapiInput] = useState('');
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [vapiSavedFlash, setVapiSavedFlash] = useState(false);

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedFlash, setProfileSavedFlash] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicError, setProfilePicError] = useState('');
  const [profilePicFlash, setProfilePicFlash] = useState(false);

  // Synchronize Profile Name from user state
  useEffect(() => {
    if (user?.username) {
      const parts = user.username.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user?.username]);

  // Preferences Form State
  const [language, setLanguage] = useState('English');
  const [colorMode, setColorMode] = useState('System');
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [productEmails, setProductEmails] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSavedFlash, setPreferencesSavedFlash] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');

  // Synchronize Preferences from user state
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.language) setLanguage(user.preferences.language);
      if (user.preferences.colorMode) {
        setColorMode(user.preferences.colorMode);
        applyThemePreference(user.preferences.colorMode);
      }
      if (typeof user.preferences.weeklySummary === 'boolean') setWeeklySummary(user.preferences.weeklySummary);
      if (typeof user.preferences.dailySummary === 'boolean') setDailySummary(user.preferences.dailySummary);
      if (typeof user.preferences.productEmails === 'boolean') setProductEmails(user.preferences.productEmails);
    }
  }, [user?.preferences]);

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'My Workspace');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'workspace');
  const [description, setDescription] = useState(currentWorkspace?.description || '');
  const [workspaceLogo, setWorkspaceLogo] = useState<string | null>(currentWorkspace?.logo_url || null);
  const [workspaceSavedFlash, setWorkspaceSavedFlash] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceLogoUploading, setWorkspaceLogoUploading] = useState(false);

  // Keep the workspace form in sync when active workspace loads or switches
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name || 'My Workspace');
      setSlug(currentWorkspace.slug || 'workspace');
      setDescription(currentWorkspace.description || '');
      setWorkspaceLogo(currentWorkspace.logo_url || null);
      setWorkspaceError('');
    }
  }, [currentWorkspace?.id, currentWorkspace?.updated_at]);

  // Create Workspace Modal State
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsSlug, setNewWsSlug] = useState('');
  const [newWsDescription, setNewWsDescription] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = useState('');

  // Delete Workspace Modal State
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [deleteConfirmWsName, setDeleteConfirmWsName] = useState('');
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState('');

  // Delete Account Modal State
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Modal Close Handlers
  const handleCloseDeleteAccount = () => {
    if (deletingAccount) return;
    setShowDeleteAccount(false);
    setDeleteConfirmEmail('');
    setDeleteAccountError('');
  };

  const handleCloseDeleteWorkspace = () => {
    if (deletingWorkspace) return;
    setShowDeleteWorkspace(false);
    setDeleteConfirmWsName('');
    setDeleteWorkspaceError('');
  };

  const handleCloseCreateWorkspace = () => {
    if (creatingWorkspace) return;
    setShowCreateWorkspace(false);
    setNewWsName('');
    setNewWsSlug('');
    setNewWsDescription('');
    setCreateWorkspaceError('');
  };

  // Keyboard shortcut (Escape) to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteAccount && !deletingAccount) handleCloseDeleteAccount();
        if (showDeleteWorkspace && !deletingWorkspace) handleCloseDeleteWorkspace();
        if (showCreateWorkspace && !creatingWorkspace) handleCloseCreateWorkspace();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteAccount, deletingAccount, showDeleteWorkspace, deletingWorkspace, showCreateWorkspace, creatingWorkspace]);

  // Profile Picture Upload Handler
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProfilePicUploading(true);
      setProfilePicError('');
      const dataUrl = await resizeImage(file, 256, 256);
      const updated = await api.patch('/auth/profile', { picture: dataUrl });
      if (setUser) setUser(updated);
      setProfilePicFlash(true);
      setTimeout(() => setProfilePicFlash(false), 3000);
    } catch (err: unknown) {
      setProfilePicError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setProfilePicUploading(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  // Profile Picture Remove Handler
  const handleRemoveProfilePic = async () => {
    try {
      setProfilePicUploading(true);
      setProfilePicError('');
      const updated = await api.patch('/auth/profile', { picture: '' });
      if (setUser) setUser(updated);
    } catch (err: unknown) {
      setProfilePicError(err instanceof Error ? err.message : 'Failed to remove photo.');
    } finally {
      setProfilePicUploading(false);
    }
  };

  // Save Full Name Handler
  const handleSaveProfile = async () => {
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!full) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    try {
      const updated = await api.patch('/auth/profile', { username: full });
      if (setUser) setUser(updated);
      setProfileSavedFlash(true);
      setTimeout(() => setProfileSavedFlash(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Preferences Handler
  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    setPreferencesError('');
    try {
      const updated = await api.patch('/auth/profile', {
        preferences: {
          language,
          colorMode,
          weeklySummary,
          dailySummary,
          productEmails,
        },
      });
      if (setUser) setUser(updated);
      applyThemePreference(colorMode);
      setPreferencesSavedFlash(true);
      setTimeout(() => setPreferencesSavedFlash(false), 3000);
    } catch (err: unknown) {
      setPreferencesError(err instanceof Error ? err.message : 'Failed to save preferences.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  // Workspace Logo Upload Handler
  const handleWorkspaceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setWorkspaceLogoUploading(true);
      setWorkspaceError('');
      const dataUrl = await resizeImage(file, 256, 256);
      setWorkspaceLogo(dataUrl);

      // If active workspace exists, persist immediately
      if (currentWorkspace && currentWorkspace.id !== 'default') {
        await api.put(`/workspaces/${currentWorkspace.id}`, {
          logo_url: dataUrl,
        });
        await refreshWorkspaces();
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : 'Failed to upload workspace logo.');
    } finally {
      setWorkspaceLogoUploading(false);
      if (workspaceLogoInputRef.current) workspaceLogoInputRef.current.value = '';
    }
  };

  // Workspace Logo Remove Handler
  const handleRemoveWorkspaceLogo = async () => {
    try {
      setWorkspaceLogoUploading(true);
      setWorkspaceLogo(null);
      if (currentWorkspace && currentWorkspace.id !== 'default') {
        await api.put(`/workspaces/${currentWorkspace.id}`, {
          logo_url: null,
        });
        await refreshWorkspaces();
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : 'Failed to remove workspace logo.');
    } finally {
      setWorkspaceLogoUploading(false);
    }
  };

  // Save Workspace Handler
  const handleSaveWorkspace = async () => {
    if (!currentWorkspace || currentWorkspace.id === 'default') return;
    const trimmed = workspaceName.trim();
    if (!trimmed) {
      setWorkspaceError('Workspace name must not be empty.');
      return;
    }
    setWorkspaceError('');
    setWorkspaceSaving(true);
    try {
      await api.put(`/workspaces/${currentWorkspace.id}`, {
        name: trimmed,
        slug: slug.trim() ? sanitizeSlug(slug) : undefined,
        description: description.trim() || null,
        logo_url: workspaceLogo || null,
      });
      await refreshWorkspaces();
      setWorkspaceSavedFlash(true);
      setTimeout(() => setWorkspaceSavedFlash(false), 3000);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : 'Could not save workspace.');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  // Create New Workspace Handler
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWsName.trim();
    if (!trimmed) {
      setCreateWorkspaceError('Workspace name is required.');
      return;
    }
    setCreatingWorkspace(true);
    setCreateWorkspaceError('');
    try {
      const created = await api.post('/workspaces', {
        name: trimmed,
        slug: newWsSlug.trim() ? sanitizeSlug(newWsSlug) : sanitizeSlug(trimmed),
        description: newWsDescription.trim() || null,
      });
      await refreshWorkspaces();
      if (created?.id) {
        await switchWorkspace(created.id);
      }
      handleCloseCreateWorkspace();
    } catch (err: unknown) {
      setCreateWorkspaceError(err instanceof Error ? err.message : 'Failed to create workspace.');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  // Delete Workspace Handler
  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace || currentWorkspace.id === 'default') return;
    setDeletingWorkspace(true);
    setDeleteWorkspaceError('');
    try {
      await api.delete(`/workspaces/${currentWorkspace.id}`);
      handleCloseDeleteWorkspace();
      await refreshWorkspaces();
    } catch (err: unknown) {
      setDeleteWorkspaceError(err instanceof Error ? err.message : 'Failed to delete workspace.');
    } finally {
      setDeletingWorkspace(false);
    }
  };

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
    <div className="w-full px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Hidden File Inputs */}
      <input
        ref={profileFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleProfilePicUpload}
      />
      <input
        ref={workspaceLogoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleWorkspaceLogoUpload}
      />

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage your account profile, workspace identity, preferences, and voice logs.
        </p>
      </div>

      {/* Pill-Style Segmented Tab Switcher */}
      <div className="flex items-center overflow-x-auto no-scrollbar max-w-full pb-1">
        <div className="inline-flex items-center p-1 rounded-full bg-sidebar border border-border gap-1 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Account
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Workspace
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Voice Logs
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCOUNT                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="w-full space-y-6">
          {/* Card 1: Profile & Identity */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            {/* Header with Title and Profile Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border/60">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-text-primary" />
                  Profile Information
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Your profile picture and full name are displayed across your workspaces and document activity.
                </p>

                <div className="pt-4">
                  <label className="block text-xs sm:text-sm font-medium text-text-primary">
                    Profile Picture
                  </label>
                  <p className="text-xs text-text-muted mt-0.5">PNG, JPG, or WEBP. Max file size: 5MB.</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      type="button"
                      disabled={profilePicUploading}
                      onClick={() => profileFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
                    >
                      {profilePicUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {profilePicUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {user?.picture && (
                      <button
                        type="button"
                        disabled={profilePicUploading}
                        onClick={handleRemoveProfilePic}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  {profilePicFlash && (
                    <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1 mt-2">
                      <Check className="w-3.5 h-3.5" /> Profile photo updated
                    </span>
                  )}
                  {profilePicError && (
                    <span className="text-xs text-red-600 font-medium block mt-2">{profilePicError}</span>
                  )}
                </div>
              </div>

              {/* Avatar circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 text-white border-2 border-border flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner shrink-0 overflow-hidden self-start sm:self-auto relative group">
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
                {profilePicUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Editable Name Inputs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0">
                Full Name
              </label>
              <div className="w-full sm:max-w-xl lg:max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-muted mb-1 font-medium">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-muted mb-1 font-medium">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
                  />
                </div>
              </div>
            </div>

            {/* Readonly: Sign-in Email */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <div>
                <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 block shrink-0">
                  Sign-in Email
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Connected Google account login</p>
              </div>
              <input
                type="email"
                disabled
                value={user?.email || 'user@example.com'}
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar text-xs sm:text-sm text-text-secondary cursor-not-allowed select-none"
              />
            </div>

            {/* Readonly: Account created on */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
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
                disabled={profileSaving}
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-xs inline-flex items-center gap-2"
              >
                {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {profileSavedFlash && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Profile updated successfully
                </span>
              )}
              {profileError && (
                <span className="text-xs text-red-600 font-medium">{profileError}</span>
              )}
            </div>
          </div>

          {/* Card 2: Preferences & Appearance */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="pb-4 border-b border-border/60">
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary flex items-center gap-2">
                <Palette className="w-4 h-4 text-text-primary" />
                Preferences & Appearance
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Customize your interface language, appearance mode, and notification alerts.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-3 border-b border-border/50">
              <div>
                <label className="text-xs sm:text-sm font-medium text-text-primary block">
                  Interface Language
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Select preferred display language</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="English">English (United States)</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="French">Français (French)</option>
                <option value="German">Deutsch (German)</option>
                <option value="Japanese">日本語 (Japanese)</option>
                <option value="Portuguese">Português (Portuguese)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Theme / Appearance Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-3 border-b border-border/50">
              <div>
                <label className="text-xs sm:text-sm font-medium text-text-primary block">
                  Theme Appearance
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Choose between light, dark, or system preference</p>
              </div>
              <select
                value={colorMode}
                onChange={(e) => {
                  setColorMode(e.target.value);
                  applyThemePreference(e.target.value);
                }}
                className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="System">System Default</option>
                <option value="Light">Light Mode</option>
                <option value="Dark">Dark Mode</option>
              </select>
            </div>

            {/* Email Notifications */}
            <div className="space-y-3 py-2">
              <label className="text-xs sm:text-sm font-medium text-text-primary block">
                Notification Preferences
              </label>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:bg-sidebar/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklySummary}
                    onChange={(e) => setWeeklySummary(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-neutral-900 focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-text-primary block">
                      Weekly Workspace Summary
                    </span>
                    <span className="text-xs text-text-muted block mt-0.5">
                      Receive an executive summary of document updates, chat insights, and team activity once a week.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:bg-sidebar/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailySummary}
                    onChange={(e) => setDailySummary(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-neutral-900 focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-text-primary block">
                      Daily Activity Digest
                    </span>
                    <span className="text-xs text-text-muted block mt-0.5">
                      Get daily digests whenever new documents, connectors, or vectors finish processing.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:bg-sidebar/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productEmails}
                    onChange={(e) => setProductEmails(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-neutral-900 focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-text-primary block">
                      Product News & Feature Announcements
                    </span>
                    <span className="text-xs text-text-muted block mt-0.5">
                      Stay informed about major Quello capabilities, MCP integrations, and voice enhancements.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={preferencesSaving}
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-xs inline-flex items-center gap-2"
              >
                {preferencesSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {preferencesSaving ? 'Saving...' : 'Save Preferences'}
              </button>
              {preferencesSavedFlash && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Preferences saved successfully
                </span>
              )}
              {preferencesError && (
                <span className="text-xs text-red-600 font-medium">{preferencesError}</span>
              )}
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
            <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Permanently delete your account and all associated workspace documents, sources, chat threads, and voice logs. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError('');
                setDeleteConfirmEmail('');
                setShowDeleteAccount(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              Delete my account
            </button>
          </div>

          {/* Delete Account Confirmation Modal */}
          {showDeleteAccount && isMounted && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleCloseDeleteAccount}
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in">
                <button
                  type="button"
                  onClick={handleCloseDeleteAccount}
                  disabled={deletingAccount}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3.5 pr-6">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        Delete your account forever?
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        This permanently removes your account, every workspace, all uploaded files,
                        documents, chats, and voice logs. You will be logged out immediately.
                        This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-medium text-text-primary">
                      Type <span className="font-semibold">{user?.email}</span> to confirm
                    </label>
                    <input
                      type="email"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder={user?.email || 'you@example.com'}
                      disabled={deletingAccount}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-text-muted"
                    />
                  </div>

                  {deleteAccountError && (
                    <p className="text-xs text-red-600 font-medium">{deleteAccountError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={deletingAccount}
                      onClick={handleCloseDeleteAccount}
                      className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-sidebar border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={
                        deletingAccount ||
                        deleteConfirmEmail.trim().toLowerCase() !==
                          (user?.email || '').toLowerCase()
                      }
                      onClick={() => {
                        void (async () => {
                          setDeleteAccountError('');
                          setDeletingAccount(true);
                          try {
                            await api.delete('/auth/account');
                            handleCloseDeleteAccount();
                            logout();
                          } catch (err: unknown) {
                            setDeleteAccountError(
                              err instanceof Error ? err.message : 'Could not delete account.'
                            );
                          } finally {
                            setDeletingAccount(false);
                          }
                        })();
                      }}
                      className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {deletingAccount && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {deletingAccount ? 'Deleting...' : 'Delete forever'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKSPACE                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'workspace' && (
        <div className="w-full space-y-6">
          {/* Top Switcher Bar: Active workspace & Multi-workspace switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-sidebar/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-text-primary">
                    {currentWorkspace?.name || 'Workspace'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  quello.app/{currentWorkspace?.slug || 'workspace'} • {workspaces.length} workspace{workspaces.length === 1 ? '' : 's'} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {workspaces.length > 1 && (
                <select
                  value={currentWorkspace?.id || ''}
                  onChange={(e) => void switchWorkspace(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary cursor-pointer focus:outline-none shadow-2xs"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} {ws.id === currentWorkspace?.id ? '(active)' : ''}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  setNewWsName('');
                  setNewWsSlug('');
                  setNewWsDescription('');
                  setCreateWorkspaceError('');
                  setShowCreateWorkspace(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Workspace
              </button>
            </div>
          </div>

          {/* Card: Workspace Identity & Details */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary">
                Workspace Profile
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Manage your workspace identity, custom domain URL slug, and sharing settings.
              </p>
            </div>

            {/* Workspace Logo Row */}
            <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary">
                  Workspace Logo
                </label>
                <p className="text-xs text-text-muted mt-0.5">PNG, JPG, or WEBP. Max 5MB.</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    disabled={workspaceLogoUploading}
                    onClick={() => workspaceLogoInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-text-primary hover:bg-sidebar transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
                  >
                    {workspaceLogoUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {workspaceLogoUploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  {workspaceLogo && (
                    <button
                      type="button"
                      disabled={workspaceLogoUploading}
                      onClick={handleRemoveWorkspaceLogo}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden relative">
                {workspaceLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={workspaceLogo}
                    alt={workspaceName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (workspaceName.charAt(0) || 'W').toUpperCase()
                )}
                {workspaceLogoUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
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
                placeholder="Workspace name"
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Input Row: Workspace URL Slug */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <div>
                <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 block shrink-0">
                  Workspace URL Slug
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Only lowercase letters, numbers, and hyphens</p>
              </div>
              <div className="w-full sm:max-w-xl lg:max-w-2xl flex items-center rounded-xl border border-border overflow-hidden bg-sidebar/40 focus-within:bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="px-3.5 py-2.5 bg-sidebar text-xs text-text-secondary border-r border-border select-none shrink-0 font-medium">
                  quello.app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
                  placeholder="my-workspace"
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none bg-transparent placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Input Row: Description */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6 py-4 border-b border-border/50">
              <label className="text-xs sm:text-sm font-medium text-text-primary sm:w-48 shrink-0 mt-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace used for?"
                rows={3}
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
              />
            </div>

            {/* Save Workspace Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={workspaceSaving || !currentWorkspace}
                onClick={handleSaveWorkspace}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs inline-flex items-center gap-2"
              >
                {workspaceSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {workspaceSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {workspaceSavedFlash && (
                <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Workspace updated successfully
                </span>
              )}
              {workspaceError && (
                <span className="text-xs text-red-600 font-medium">{workspaceError}</span>
              )}
            </div>
          </div>

          {/* Danger Zone: Delete Workspace */}
          {currentWorkspace && currentWorkspace.id !== 'default' && (
            <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Delete Workspace
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Permanently delete this workspace and all associated documents, sources, and conversation history. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteWorkspaceError('');
                  setDeleteConfirmWsName('');
                  setShowDeleteWorkspace(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Delete this workspace
              </button>
            </div>
          )}

          {/* Modal: Create Workspace */}
          {showCreateWorkspace && isMounted && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleCloseCreateWorkspace}
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in">
                <button
                  type="button"
                  onClick={handleCloseCreateWorkspace}
                  disabled={creatingWorkspace}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Create New Workspace</h3>
                      <p className="text-xs text-text-muted">Organize your documents into a dedicated space</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-primary">Workspace Name</label>
                    <input
                      type="text"
                      required
                      value={newWsName}
                      onChange={(e) => {
                        setNewWsName(e.target.value);
                        if (!newWsSlug) {
                          setNewWsSlug(sanitizeSlug(e.target.value));
                        }
                      }}
                      placeholder="e.g. Design Team HQ"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-primary">URL Slug</label>
                    <div className="flex items-center rounded-xl border border-border overflow-hidden bg-[#F9F9FA] focus-within:bg-white focus-within:border-primary transition-all">
                      <span className="px-3 py-2 bg-sidebar text-[11px] text-text-secondary border-r border-border select-none">
                        quello.app/
                      </span>
                      <input
                        type="text"
                        value={newWsSlug}
                        onChange={(e) => setNewWsSlug(sanitizeSlug(e.target.value))}
                        placeholder="design-team"
                        className="flex-1 px-3 py-2 text-xs text-text-primary focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-primary">Description (optional)</label>
                    <textarea
                      rows={2}
                      value={newWsDescription}
                      onChange={(e) => setNewWsDescription(e.target.value)}
                      placeholder="What is this workspace for?"
                      className="w-full px-4 py-2 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
                    />
                  </div>

                  {createWorkspaceError && (
                    <p className="text-xs text-red-600 font-medium">{createWorkspaceError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={creatingWorkspace}
                      onClick={handleCloseCreateWorkspace}
                      className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-sidebar border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingWorkspace || !newWsName.trim()}
                      className="px-4 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {creatingWorkspace && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* Modal: Delete Workspace Confirmation */}
          {showDeleteWorkspace && isMounted && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleCloseDeleteWorkspace}
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in">
                <button
                  type="button"
                  onClick={handleCloseDeleteWorkspace}
                  disabled={deletingWorkspace}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3.5 pr-6">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        Delete &ldquo;{currentWorkspace?.name}&rdquo;?
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        This permanently wipes all uploaded documents, connected sources, chat threads,
                        and vector embeddings inside this workspace. This action cannot be reversed.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-medium text-text-primary">
                      Type <span className="font-semibold">{currentWorkspace?.name}</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmWsName}
                      onChange={(e) => setDeleteConfirmWsName(e.target.value)}
                      placeholder={currentWorkspace?.name}
                      disabled={deletingWorkspace}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-text-muted"
                    />
                  </div>

                  {deleteWorkspaceError && (
                    <p className="text-xs text-red-600 font-medium">{deleteWorkspaceError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={deletingWorkspace}
                      onClick={handleCloseDeleteWorkspace}
                      className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-sidebar border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={
                        deletingWorkspace ||
                        deleteConfirmWsName.trim().toLowerCase() !==
                          (currentWorkspace?.name || '').trim().toLowerCase()
                      }
                      onClick={handleDeleteWorkspace}
                      className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {deletingWorkspace && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {deletingWorkspace ? 'Deleting...' : 'Delete Workspace'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VOICE LOGS                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'voice' && (
        <div className="w-full space-y-6">
          {/* Card 1: Voice Assistant Configuration (BYOK) */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-primary flex items-center gap-2">
                <Mic className="w-4 h-4 text-text-primary" />
                Voice Assistant Configuration
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Configure your custom VAPI voice assistant integration (Bring Your Own Key).
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
                      <Check className="w-3.5 h-3.5" /> Key saved successfully. Tap the voice icon to talk.
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
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-xs inline-flex items-center gap-2"
                >
                  {vapiSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                  History and transcripts of past voice sessions with Quello.
                </p>
              </div>
              {voiceLogs.length > 0 && (
                <span className="text-xs text-text-muted font-medium bg-sidebar px-2.5 py-1 rounded-full border border-border self-start sm:self-auto">
                  {voiceLogs.length} session{voiceLogs.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {voiceLogsLoading ? (
              <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading voice logs...
              </div>
            ) : voiceLogs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl p-6">
                <Mic className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-xs sm:text-sm font-medium text-text-primary">No voice logs yet</p>
                <p className="text-xs text-text-muted mt-0.5 max-w-sm">
                  Start a voice conversation with Quello from the workspace header to automatically save transcripts and audio logs here.
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

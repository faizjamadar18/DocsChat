'use client';

import React, { useEffect, useState, useRef, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  LogOut,
  Trash2,
  Upload,
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
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useAuth, notifyUserUpdated } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import MembersTab from '../../../components/settings/MembersTab';
import CreateWorkspaceModal from '../../../components/workspaces/CreateWorkspaceModal';
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'workspace' | 'members' | 'voice'>('account');
  const { currentWorkspace, refreshWorkspaces, workspaces, switchWorkspace } = useWorkspace();
  const { user, logout, setUser } = useAuth();
  const { status: vapiStatus, saving: vapiSaving, error: vapiError, saveKey, deleteKey } = useVapiKey();
  const { logs: voiceLogs, loading: voiceLogsLoading, deleteLog: deleteVoiceLog } = useVoiceLogs(currentWorkspace?.id);
  const [selectedVoiceLog, setSelectedVoiceLog] = useState<VoiceLog | null>(null);
  const { confirm } = useConfirm();

  // File Input Refs
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const workspaceLogoInputRef = useRef<HTMLInputElement>(null);

  // Voice Key State
  const [vapiInput, setVapiInput] = useState('');
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [vapiSavedFlash, setVapiSavedFlash] = useState(false);

  // Profile Form State
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedFlash, setProfileSavedFlash] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicError, setProfilePicError] = useState('');
  // Staged (unsaved) picture changes: preview of a newly uploaded image, or a
  // staged removal. Nothing persists until Save Profile is clicked.
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [profilePicRemoved, setProfilePicRemoved] = useState(false);

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'My Workspace');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'workspace');
  const [description, setDescription] = useState(currentWorkspace?.description || '');
  const [workspaceLogo, setWorkspaceLogo] = useState<string | null>(currentWorkspace?.logo_url || null);
  const [workspaceSavedFlash, setWorkspaceSavedFlash] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceLogoUploading, setWorkspaceLogoUploading] = useState(false);

  // Keep the workspace form in sync when the active workspace loads, switches,
  // or refreshes after a save. State is adjusted during render (not in an
  // effect) so server and client renders stay consistent.
  const wsSyncKey = currentWorkspace
    ? `${currentWorkspace.id}::${currentWorkspace.updated_at ?? ''}`
    : 'none';
  const [prevWsSyncKey, setPrevWsSyncKey] = useState(wsSyncKey);
  if (wsSyncKey !== prevWsSyncKey) {
    setPrevWsSyncKey(wsSyncKey);
    setWorkspaceName(currentWorkspace?.name || 'My Workspace');
    setSlug(currentWorkspace?.slug || 'workspace');
    setDescription(currentWorkspace?.description || '');
    setWorkspaceLogo(currentWorkspace?.logo_url || null);
    setWorkspaceError('');
  }

  // Create Workspace Modal State (shared dialog component owns the form)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

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
  // Client-only gate for createPortal targets. useSyncExternalStore keeps
  // server (false) and client (true) renders consistent without an effect.
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Modal Close Handlers
  const handleCloseDeleteAccount = useCallback(() => {
    if (deletingAccount) return;
    setShowDeleteAccount(false);
    setDeleteConfirmEmail('');
    setDeleteAccountError('');
  }, [deletingAccount]);

  const handleCloseDeleteWorkspace = useCallback(() => {
    if (deletingWorkspace) return;
    setShowDeleteWorkspace(false);
    setDeleteConfirmWsName('');
    setDeleteWorkspaceError('');
  }, [deletingWorkspace]);

  // Keyboard shortcut (Escape) to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteAccount && !deletingAccount) handleCloseDeleteAccount();
        if (showDeleteWorkspace && !deletingWorkspace) handleCloseDeleteWorkspace();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteAccount, deletingAccount, showDeleteWorkspace, deletingWorkspace, handleCloseDeleteAccount, handleCloseDeleteWorkspace]);

  // Profile Picture Upload Handler — stages a preview only. The image is
  // persisted when Save Profile is clicked, so it renders site-wide at once.
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProfilePicUploading(true);
      setProfilePicError('');
      const dataUrl = await resizeImage(file, 256, 256);
      setProfilePicPreview(dataUrl);
      setProfilePicRemoved(false);
    } catch (err: unknown) {
      setProfilePicError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setProfilePicUploading(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  // Profile Picture Remove Handler — stages the removal until Save Profile.
  const handleRemoveProfilePic = () => {
    if (profilePicPreview) {
      setProfilePicPreview(null);
      return;
    }
    setProfilePicRemoved(true);
  };

  // Save staged picture Handler — persists the previewed/removed photo so the
  // avatar renders site-wide at once.
  const handleSaveProfile = async () => {
    if (!profilePicPreview && !profilePicRemoved) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const payload: { picture: string } = {
        picture: profilePicPreview ?? '',
      };
      const updated = await api.patch('/auth/profile', payload);
      if (setUser) setUser(updated);
      notifyUserUpdated();
      setProfilePicPreview(null);
      setProfilePicRemoved(false);
      setProfileSavedFlash(true);
      setTimeout(() => setProfileSavedFlash(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Workspace Logo Upload Handler — stages a preview only. The logo is
  // persisted when Save Changes is clicked, so it renders site-wide at once.
  const handleWorkspaceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setWorkspaceLogoUploading(true);
      setWorkspaceError('');
      const dataUrl = await resizeImage(file, 256, 256);
      setWorkspaceLogo(dataUrl);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : 'Failed to upload workspace logo.');
    } finally {
      setWorkspaceLogoUploading(false);
      if (workspaceLogoInputRef.current) workspaceLogoInputRef.current.value = '';
    }
  };

  // Workspace Logo Remove Handler — stages the removal until Save Changes.
  const handleRemoveWorkspaceLogo = () => {
    setWorkspaceLogo(null);
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

  const userInitial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="w-full px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in max-w-full overflow-x-hidden">
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
            onClick={() => setActiveTab('members')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Members
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
            Voice Settings
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
                    {(profilePicPreview || (user?.picture && !profilePicRemoved)) && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePic}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  {profilePicError && (
                    <span className="text-xs text-red-600 font-medium block mt-2">{profilePicError}</span>
                  )}
                </div>
              </div>

              {/* Avatar circle — shows staged preview first, then saved picture */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 text-white border-2 border-border flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner shrink-0 overflow-hidden self-start sm:self-auto relative group">
                {(profilePicPreview || (!profilePicRemoved && user?.picture)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePicPreview ?? user?.picture ?? ''}
                    alt={user?.username || 'Avatar'}
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
                disabled={profileSaving || (!profilePicPreview && !profilePicRemoved)}
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
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-text-muted"
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
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
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
                  className="flex-1 px-3.5 py-2.5 text-base sm:text-sm text-text-primary focus:outline-none bg-transparent placeholder:text-text-muted"
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
                className="w-full sm:max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
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

          {/* Modal: Create Workspace (shared dialog) */}
          <CreateWorkspaceModal
            open={showCreateWorkspace}
            onClose={() => setShowCreateWorkspace(false)}
          />

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
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-text-muted"
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
      {/* TAB: MEMBERS                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'members' && <MembersTab />}

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
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-sidebar/40 focus:bg-surface text-base sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
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
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete Voice Log',
                            description: 'Delete this voice log? The transcript and call summary will be permanently removed.',
                            confirmLabel: 'Delete',
                            variant: 'danger',
                          });
                          if (ok) {
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

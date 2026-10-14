'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Building, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';

const sanitizeSlug = (val: string) => {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Shared create-workspace dialog. Used by Settings (New Workspace) and the
 * zero-room gate. Dismissible everywhere: Cancel, backdrop click, Escape.
 * On success it refreshes rooms and switches to the new one.
 */
export default function CreateWorkspaceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleClose = useCallback(() => {
    if (creating) return;
    setName('');
    setSlug('');
    setDescription('');
    setError('');
    onClose();
  }, [creating, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Workspace name is required.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await api.post('/workspaces', {
        name: trimmed,
        slug: slug.trim() ? sanitizeSlug(slug) : sanitizeSlug(trimmed),
        description: description.trim() || null,
      });
      await refreshWorkspaces();
      if (created?.id) {
        await switchWorkspace(created.id);
      }
      setName('');
      setSlug('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  if (!open || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in">
        <button
          type="button"
          onClick={handleClose}
          disabled={creating}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
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
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(sanitizeSlug(e.target.value));
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
                value={slug}
                onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
                placeholder="design-team"
                className="flex-1 px-3 py-2 text-xs text-text-primary focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-primary">Description (optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              className="w-full px-4 py-2 rounded-xl border border-border bg-[#F9F9FA] focus:bg-white text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-text-muted"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={creating}
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-sidebar border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-4 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
            >
              {creating && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {creating ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

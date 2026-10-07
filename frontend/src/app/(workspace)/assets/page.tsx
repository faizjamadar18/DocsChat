'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, File, MoreVertical, Download, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import UploadModal from '@/components/assets/UploadModal';
import DeleteConfirmationModal from '@/components/assets/DeleteConfirmationModal';
import UploadBanner, { UploadState } from '@/components/assets/UploadBanner';
import OraSidebar, { OraLogoMark } from '@/components/layout/OraSidebar';

export interface Source {
  id: string;
  filename: string;
  status: string;
  page_count: number;
  uploaded_at: string;
  file_size: number;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'recently';
  const cleanDateString = !dateString.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateString)
    ? `${dateString}Z`
    : dateString;
  const date = new Date(cleanDateString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'less than a minute ago';
  if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function AssetsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedAsset, setSelectedAsset] = useState<Source | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload progress banner state (matching Image 1 & Image 2)
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  // Asset action dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Ora scope: null = query across ALL assets (default), string[] = narrowed subset.
  // Row click narrows to single for preview parity; Ora header button resets to All.
  const [oraScopeIds, setOraScopeIds] = useState<string[] | null>(null);

  // Ora sidebar drawer state (open by default in Assets workspace)
  const [isOraDrawerOpen, setIsOraDrawerOpen] = useState(true);

  const availableAssetScopes = sources.map((s) => ({
    id: s.id,
    title: s.filename,
    type: 'asset' as const,
  }));

  useEffect(() => {
    const handleToggle = () => setIsOraDrawerOpen((prev) => !prev);
    window.addEventListener('toggle-ora-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-ora-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    if (!activeDropdownId) return;
    const handleClickOutside = () => setActiveDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const fetchSources = async () => {
    try {
      const data = await api.get('/sources');
      const readyList = (data.sources || []).filter((s: Source) => s.status === 'ready');
      setSources(readyList);
      setSelectedAsset((prev) => {
        if (!prev) return readyList[0] || null;
        const exists = readyList.find((s: Source) => s.id === prev.id);
        return exists || readyList[0] || null;
      });
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api.get('/sources');
        if (active) {
          const readyList = (data.sources || []).filter((s: Source) => s.status === 'ready');
          setSources(readyList);
          setSelectedAsset((prev) => {
            if (!prev) return readyList[0] || null;
            return readyList.find((s: Source) => s.id === prev.id) || readyList[0] || null;
          });
        }
      } catch (err) {
        if (active) {
          console.error('Failed to fetch sources:', err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleStartUpload = async (file: File) => {
    setUploadState({
      filename: file.name,
      progress: 0,
      status: 'uploading',
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const source = await api.uploadWithProgress<{ id: string; status: string }>(
        '/sources/upload',
        formData,
        (percent) => {
          setUploadState((prev) =>
            prev && prev.filename === file.name
              ? { ...prev, progress: percent }
              : prev
          );
        }
      );

      // Upload finished (bytes transferred to server)
      // Transition to processing state while RAG pipeline parses, chunks & embeds in background
      setUploadState({
        id: source.id,
        filename: file.name,
        progress: 100,
        status: 'processing',
      });

      // Poll source status until processing finishes (status === 'ready')
      const pollInterval = 1500;
      const maxAttempts = 40; // 60s max
      let attempts = 0;

      const checkProcessingStatus = async () => {
        if (!isMountedRef.current) return;
        try {
          const updated = await api.get(`/sources/${source.id}`);
          if (updated.status === 'ready') {
            if (isMountedRef.current) {
              setUploadState({
                id: source.id,
                filename: file.name,
                progress: 100,
                status: 'completed',
              });
              // Only add to sources UI once processing is completely finished
              await fetchSources();
              setSelectedAsset(updated);
            }
            return;
          }
          if (updated.status === 'error' || updated.status === 'failed') {
            if (isMountedRef.current) {
              setUploadState({
                id: source.id,
                filename: file.name,
                progress: 0,
                status: 'error',
                error: 'Failed to process document content.',
              });
            }
            return;
          }
        } catch {
          // Continue polling on transient errors
        }

        attempts += 1;
        if (attempts < maxAttempts && isMountedRef.current) {
          setTimeout(checkProcessingStatus, pollInterval);
        } else if (isMountedRef.current) {
          // Timeout reached
          setUploadState({
            id: source.id,
            filename: file.name,
            progress: 0,
            status: 'error',
            error: 'Document processing took longer than expected.',
          });
        }
      };

      setTimeout(checkProcessingStatus, pollInterval);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadState({
        filename: file.name,
        progress: 0,
        status: 'error',
        error: message,
      });
    }
  };

  const filteredSources = sources.filter((s) =>
    s.status === 'ready' &&
    s.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/sources/${assetToDelete.id}`);
      if (selectedAsset?.id === assetToDelete.id) {
        setSelectedAsset(null);
      }
      // Drop the deleted asset from the narrowed scope; empty collapses to All.
      setOraScopeIds((prev) => {
        if (!prev) return prev;
        const next = prev.filter((id) => id !== (assetToDelete?.id ?? ''));
        return next.length === 0 ? null : next;
      });
      await fetchSources();
    } catch (err) {
      console.error('Failed to delete source:', err);
    } finally {
      setIsDeleting(false);
      setAssetToDelete(null);
    }
  };

  const handleDownload = async (source: Source) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sources/${source.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = source.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download source:', err);
    }
  };


  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Scrollable Assets Column (matches 03-assets.png and 03-assets2.png) */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto px-6 py-8 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar border border-border w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none w-full"
            />
          </div>

          {/* Right controls: Ora trigger, Upload button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsOraDrawerOpen((prev) => {
                  // Reset to All-assets query when opening via header.
                  if (!prev) setOraScopeIds(null);
                  return !prev;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                isOraDrawerOpen
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary bg-surface border border-border'
              }`}
            >
              <OraLogoMark className="w-3.5 h-3.5" />
              <span>Ora</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#111113] hover:bg-black text-white rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Main Content: Asset List */}
        <div className="w-full space-y-3">
            {/* Upload Progress / Success Banner (Image 1 & Image 2) */}
            {uploadState && (
              <UploadBanner
                uploadState={uploadState}
                onDismiss={() => setUploadState(null)}
              />
            )}

            {loading ? (
              <div className="py-12 text-center text-xs text-text-muted">Loading assets...</div>
            ) : filteredSources.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted bg-surface rounded-xl border border-border">
                No assets found. Click Upload to add your first PDF document.
              </div>
            ) : (
              filteredSources.map((source) => {
                const isSelected = selectedAsset?.id === source.id;
                return (
                  <div
                    key={source.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          id: source.id,
                          title: source.filename,
                          type: 'asset',
                        })
                      );
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      setSelectedAsset(source);
                      // Narrow Ora to this single asset; chip X restores All.
                      setOraScopeIds([source.id]);
                    }}
                    title="Click to select or drag into Ora to ask questions"
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group active:cursor-grabbing ${
                      isSelected
                        ? 'bg-[#F3F4F6] border-border shadow-2xs'
                        : 'bg-surface hover:bg-[#F9F9FB] border-border/60 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-border/80 flex items-center justify-center text-text-secondary shrink-0 shadow-2xs">
                        <File className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                          {source.filename}
                        </h4>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {formatFileSize(source.file_size)} &bull; {formatTimeAgo(source.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId((prev) => (prev === source.id ? null : source.id));
                        }}
                        className={`p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-base transition-colors cursor-pointer ${
                          activeDropdownId === source.id
                            ? 'opacity-100 bg-base text-text-primary'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        aria-label="Asset options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeDropdownId === source.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white border border-border shadow-lg py-1 z-30 animate-fade-in"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(null);
                              handleDownload(source);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-base transition-colors text-left cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-text-muted" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(null);
                              setAssetToDelete(source);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* Mounted In-Flow Ora Assistant Sidebar (matches 03-assets.png and 03-assets2.png verbatim) */}
      <OraSidebar
        isOpen={isOraDrawerOpen}
        onClose={() => setIsOraDrawerOpen(false)}
        initialScope={selectedAsset ? { id: selectedAsset.id, title: selectedAsset.filename, type: 'asset' } : null}
        mode="assets"
        availableScopes={availableAssetScopes}
        activeScopeIds={oraScopeIds}
        onScopeChange={(ids) => {
          setOraScopeIds(ids);
          // Keep preview in sync when narrowed to a single asset.
          if (ids && ids.length === 1) {
            const match = sources.find((s) => s.id === ids[0]);
            if (match) setSelectedAsset(match);
          }
        }}
        onSelectThreadDocument={(scope) => {
          // All-assets threads carry attached_name "All N assets" but only the
          // first id in attached_scope — restore them to All mode.
          if (scope.title.startsWith('All ')) {
            setOraScopeIds(null);
            return;
          }
          // Restore the associated document context: select + preview/open it.
          setOraScopeIds([scope.id]);
          const match = sources.find((s) => s.id === scope.id);
          if (match) {
            setSelectedAsset(match);
            return;
          }
          // Fallback: fetch the asset directly if it is not in the current list
          // (e.g. list not yet loaded or paginated), then select/preview it.
          void (async () => {
            try {
              const fetched = await api.get(`/sources/${scope.id}`);
              if (fetched && fetched.id) {
                const restored: Source = {
                  id: fetched.id,
                  filename: fetched.filename || scope.title,
                  status: fetched.status || 'ready',
                  page_count: fetched.page_count || 0,
                  uploaded_at: fetched.uploaded_at || new Date().toISOString(),
                  file_size: fetched.file_size || 0,
                };
                setSources((prev) => (prev.some((s) => s.id === restored.id) ? prev : [restored, ...prev]));
                setSelectedAsset(restored);
              }
            } catch (err) {
              console.error('Failed to restore asset context for thread:', err);
            }
          })();
        }}
      />

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onStartUpload={handleStartUpload} 
      />
      
      <DeleteConfirmationModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleDeleteConfirm}
        filename={assetToDelete?.filename || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}

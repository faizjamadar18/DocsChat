'use client';
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, File, MoreVertical, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import UploadModal from '@/components/assets/UploadModal';
import DeleteConfirmationModal from '@/components/assets/DeleteConfirmationModal';
import AssetPreview, { Source } from '@/components/assets/AssetPreview';

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
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

  const fetchSources = async () => {
    try {
      const data = await api.get('/sources');
      setSources(data.sources || []);
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
          const list = data.sources || [];
          setSources(list);
          setSelectedAsset((prev) => prev ?? (list.length > 0 ? list[0] : null));
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

  const filteredSources = sources.filter((s) =>
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

  const handleOraToggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-ora-sidebar'));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
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

        {/* Right controls: Sort dropdown, Ora trigger, Upload button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface border border-border rounded-xl transition-colors cursor-pointer"
          >
            <span>Recent</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>
          
          <button
            type="button"
            onClick={handleOraToggle}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
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

      {/* Main Content: Asset List + Optional Side Preview */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Asset List Column */}
        <div className="flex-1 min-w-0 w-full space-y-2">
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
                  onClick={() => setSelectedAsset(source)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssetToDelete(source);
                      }}
                      className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-base transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Asset options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Preview Panel Column (matching 03-assets2.png) */}
        {selectedAsset && (
          <AssetPreview
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onDownload={handleDownload}
            onDelete={(asset) => setAssetToDelete(asset)}
          />
        )}
      </div>

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={fetchSources} 
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

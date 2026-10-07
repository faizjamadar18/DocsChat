'use client';
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, File, Trash2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import UploadModal from '@/components/assets/UploadModal';
import DeleteConfirmationModal from '@/components/assets/DeleteConfirmationModal';

interface Source {
  id: string;
  filename: string;
  status: string;
  page_count: number;
  uploaded_at: string;
  file_size: number;
}

export default function AssetsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
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
          setSources(data.sources || []);
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
      await fetchSources();
    } catch (err) {
      console.error('Failed to delete source:', err);
    } finally {
      setIsDeleting(false);
      setAssetToDelete(null);
    }
  };

  const handleOraToggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-ora-sidebar'));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
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

      {/* Asset List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-xs text-text-muted">Loading assets...</div>
        ) : filteredSources.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-surface rounded-xl border border-border">
            No assets found. Click Upload to add your first PDF document.
          </div>
        ) : (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:bg-base transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-text-secondary shrink-0">
                  <File className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors cursor-pointer">
                    {source.filename}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    {source.file_size ? `${(source.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'} &middot;{' '}
                    {source.page_count ? `${source.page_count} pages` : 'Processing'} &middot;{' '}
                    {new Date(source.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                  {source.status}
                </span>
                
                <button
                  type="button"
                  onClick={() => setAssetToDelete(source)}
                  className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
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

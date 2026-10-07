'use client';
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, File } from 'lucide-react';
import { api } from '../../../lib/api';

interface Source {
  id: string;
  filename: string;
  status: string;
  page_count: number;
  uploaded_at: string;
}

export default function AssetsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSources() {
      try {
        const data = await api.get('/sources');
        setSources(data.sources || []);
      } catch (err) {
        console.error('Failed to fetch sources:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  const filteredSources = sources.filter((s) =>
    s.filename.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Right controls: Sort dropdown & Upload button */}
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#111113] hover:bg-black text-white rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-text-muted">Loading assets...</div>
        ) : filteredSources.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No assets found. Click Upload to add your first PDF document.
          </div>
        ) : (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-base transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-text-secondary shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent-hover transition-colors">
                    {source.filename}
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {source.page_count ? `${source.page_count} pages` : 'Processed'} &middot;{' '}
                    {new Date(source.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {source.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

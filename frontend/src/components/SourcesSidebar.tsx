'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import UploadArea from './UploadArea';

interface Source {
  id: string;
  filename: string;
  status: string;
  page_count: number;
  chunk_count: number;
  uploaded_at: string;
}

function getStatusLabel(source: Source): string {
  if (source.status === 'processing') return 'Processing...';
  if (source.status === 'error') return 'Failed';
  if (source.page_count > 0) return `${source.page_count} pages`;
  return 'Ready';
}

export default function SourcesSidebar({
  user,
  collapsed,
  onToggleCollapse,
  onCloseMobile,
}: {
  user?: { username?: string; email?: string } | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const data = await api.get('/sources');
      setSources(data.sources || []);
    } catch (err) {
      console.error("Failed to fetch sources", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const hasProcessing = sources.some(s => s.status === 'processing');

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(fetchSources, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing, fetchSources]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/sources/${id}`);
      fetchSources();
    } catch (err) {
      console.error("Failed to delete source", err);
    }
  };

  const totalPages = sources.reduce((sum, s) => sum + (s.page_count || 0), 0);
  const readySources = sources.filter(s => s.status === 'ready' || s.status === 'completed');

  return (
    <div className="w-full flex flex-col h-full bg-surface">

      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-3.5 min-h-[56px]">
        <button
          onClick={collapsed ? onToggleCollapse : undefined}
          className="flex items-center group overflow-hidden cursor-pointer"
        >
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute inset-[2px] bg-surface rounded-[5px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <Link href="/" className={`text-md font-semibold text-white/80 group-hover:text-white whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 max-w-0 overflow-hidden pl-0' : 'opacity-100 max-w-[200px] pl-0'}`}>
            DocsChat
          </Link>
        </button>

        {/* Collapse / mobile close buttons — only when expanded */}
        <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[80px]'}`}>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-white/30 hover:text-white/60 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] shrink-0"
              title="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-white/40 hover:text-white/70 transition-colors cursor-pointer p-1 shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Add source button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => setShowUpload(true)}
          className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white py-2.5 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'}`}>
            Add source
          </span>
        </button>
      </div>

      {/* Scrollable area — takes remaining space, keeps bottom pinned */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Sources header */}
        <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'}`}>
          <div className="flex items-center justify-between px-3 py-1.5 mt-1">
            <span className="text-[11px] font-medium text-white/20 uppercase tracking-wider">Sources</span>
            {sources.length > 0 && (
              <span className="text-[11px] text-white/20">{sources.length} file{sources.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Source list */}
        <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'} px-1.5 pb-2`}>
          {loading ? (
            <div className="flex justify-center pt-12">
              <div className="w-4 h-4 border-2 border-white/[0.06] border-t-white/40 rounded-full animate-spin" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center pt-12 px-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
              </div>
              <p className="text-sm text-white/40 mb-1">No documents yet</p>
              <p className="text-xs text-white/20 text-center leading-relaxed max-w-[180px]">
                Upload a PDF and start asking questions
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {readySources.length > 0 && (
                <div className="mx-1.5 mb-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/25">Pages indexed</span>
                    <span className="text-white/50 font-medium">{totalPages}</span>
                  </div>
                </div>
              )}
              {sources.map(source => (
                <div key={source.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-default">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${source.status === 'error' ? 'bg-red-500/10' :
                    source.status === 'processing' ? 'bg-yellow-500/10' :
                      'bg-blue-500/10'
                    }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={
                      source.status === 'error' ? 'text-red-400' :
                        source.status === 'processing' ? 'text-yellow-400' :
                          'text-blue-400'
                    }>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <p className="text-sm text-white/80 truncate leading-tight">{source.filename}</p>
                    <p className={`text-[11px] mt-0.5 ${source.status === 'error' ? 'text-red-400' :
                      source.status === 'processing' ? 'text-yellow-400' :
                        'text-white/35'
                      }`}>
                      {getStatusLabel(source)}
                      {source.status === 'processing' && (
                        <span className="inline-block ml-1.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse align-middle" />
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 p-1.5 rounded-lg hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] px-2.5 py-2.5">
        {user?.email ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium text-white/50">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className={`text-xs text-white/30 truncate transition-all duration-300 whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'}`}>
              {user.email}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/15 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className={`text-[11px] text-white/15 transition-all duration-300 whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'}`}>
              Only PDF files are supported
            </span>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black p-6 rounded-2xl w-[400px] max-w-[90vw] border border-white/[0.08] shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-medium text-white">Upload PDF</h3>
              <button onClick={() => setShowUpload(false)} className="text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <UploadArea onUploadComplete={() => {
              setShowUpload(false);
              fetchSources();
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

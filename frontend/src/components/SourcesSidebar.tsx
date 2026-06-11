'use client';
import { useState, useEffect, useCallback } from 'react';
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
  if (source.page_count > 0) return `Ready · ${source.page_count} pages`;
  return 'Ready';
}

export default function SourcesSidebar() {
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

  return (
    <div className="w-[300px] bg-surface border border-white/10 rounded-2xl flex flex-col h-full p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-4 text-white">Sources</h2>

        <button
          onClick={() => setShowUpload(true)}
          className="w-full bg-white/5 border border-dashed border-white/20 text-white py-1 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-white/10 cursor-pointer"
        >
          <span className="text-lg">+</span> Add source
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        {loading ? (
          <div className="text-center p-5">
            <div className="w-5 h-5 border-3 border-white/10 border-l-white rounded-full animate-spin mx-auto"></div>
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-10 px-5 text-white/60">
            <p className="text-sm">Saved sources will appear here</p>
          </div>
        ) : (
          sources.map(source => (
            <div key={source.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center shrink-0">
                  📄
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-white">
                    {source.filename}
                  </p>
                  <p className={`text-xs ${source.status === 'error' ? 'text-red-400' : 'text-white/60'
                    }`}>
                    {getStatusLabel(source)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 items-center shrink-0">
                {source.status === 'processing' && (
                  <div className="w-4 h-4 border-2 border-white/10 border-l-white rounded-full animate-spin"></div>
                )}
                <button
                  onClick={() => handleDelete(source.id)}
                  className="text-white/60 p-1 cursor-pointer"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100">
          <div className="bg-surface p-6 rounded-2xl w-[400px] max-w-[90vw] border border-white/10">
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Upload Source</h3>
              <button onClick={() => setShowUpload(false)} className="text-xl text-white/60 hover:text-white cursor-pointer">✕</button>
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

'use client';
import { useState, useRef } from 'react';
import { api } from '../lib/api';

export default function UploadArea({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB limit.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/sources/upload', formData);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
        isDragging
          ? 'border-white bg-white/10'
          : 'border-white/10 bg-white/5'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        className="hidden"
      />

      <div className="mb-4 text-white/60">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <polyline points="9 15 12 12 15 15"></polyline>
        </svg>
      </div>

      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-3 border-white/10 border-l-white rounded-full animate-spin"></div>
          <p className="text-white">Uploading & Processing...</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-white">
            Drag & drop a PDF file here
          </p>
          <p className="mb-4 text-xs text-white/60">
            Maximum file size: 20MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 text-white px-5 py-2.5 rounded-full font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            Browse Files
          </button>
        </>
      )}

      {error && (
        <p className="text-red-400 mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

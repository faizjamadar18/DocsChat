'use client';
import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface UploadState {
  id?: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface UploadBannerProps {
  uploadState: UploadState;
  onDismiss: () => void;
}

export default function UploadBanner({ uploadState, onDismiss }: UploadBannerProps) {
  useEffect(() => {
    if (uploadState.status === 'completed') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 10000); // Auto-dismiss after 10 seconds
      return () => clearTimeout(timer);
    }
    if (uploadState.status === 'error') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 15000); // Auto-dismiss error after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [uploadState.status, onDismiss]);

  const isUploading = uploadState.status === 'uploading';
  const isProcessing = uploadState.status === 'processing';
  const isCompleted = uploadState.status === 'completed';
  const isError = uploadState.status === 'error';

  return (
    <div className="w-full space-y-2 py-1 animate-fade-in">
      {/* Top Progress Track (Image 1) */}
      {isUploading && (
        <div className="w-full h-0.5 bg-accent-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, uploadState.progress)}%` }}
          />
        </div>
      )}

      {isProcessing && (
        <div className="w-full h-0.5 bg-accent-subtle rounded-full overflow-hidden">
          <div className="h-full bg-accent w-full animate-pulse" />
        </div>
      )}

      {/* Status Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {isUploading && (
            <>
              <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
              <span className="text-text-secondary truncate">
                Uploading <span className="font-medium text-text-primary">{uploadState.filename}</span>{' '}
                <span className="text-text-muted">{uploadState.progress}%</span>
              </span>
            </>
          )}

          {isProcessing && (
            <>
              <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
              <span className="text-text-secondary truncate">
                Processing <span className="font-medium text-text-primary">{uploadState.filename}</span>...
              </span>
            </>
          )}

          {isCompleted && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-text-secondary truncate">
                Uploaded <span className="font-medium text-text-primary">{uploadState.filename}</span>
              </span>
            </>
          )}

          {isError && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-600 truncate">
                Failed to process <span className="font-medium">{uploadState.filename}</span>
                {uploadState.error ? `: ${uploadState.error}` : ''}
              </span>
            </>
          )}
        </div>

        {/* Right Dismiss Button (Image 2) */}
        {!isUploading && !isProcessing && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0 ml-4 font-normal"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

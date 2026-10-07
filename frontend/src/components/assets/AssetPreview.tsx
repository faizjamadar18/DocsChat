'use client';
import React from 'react';
import { X, HardDrive, FileType, Calendar, Download, Trash2 } from 'lucide-react';

export interface Source {
  id: string;
  filename: string;
  status: string;
  page_count: number;
  uploaded_at: string;
  file_size: number;
}

interface AssetPreviewProps {
  asset: Source;
  onClose: () => void;
  onDownload: (asset: Source) => void;
  onDelete: (asset: Source) => void;
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

export default function AssetPreview({
  asset,
  onClose,
  onDownload,
  onDelete,
}: AssetPreviewProps) {
  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col shrink-0 border-l border-border pl-6 space-y-6">
      {/* Header: PREVIEW + Close X */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
          Preview
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-base transition-colors cursor-pointer"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Card Box */}
      <div className="w-full aspect-4/3 rounded-2xl bg-[#F9F9FB] border border-border/60 flex flex-col items-center justify-center p-6 shadow-2xs">
        <div className="relative w-20 h-24 rounded-2xl border-2 border-[#D1D5DB] bg-white flex flex-col items-center justify-center shadow-xs">
          <div className="absolute top-0 right-0 w-5 h-5 bg-[#F9F9FB] border-b-2 border-l-2 border-[#D1D5DB] rounded-bl-lg" />
          <span className="text-xs font-bold text-text-primary tracking-wider">PDF</span>
        </div>
        <span className="text-xs font-semibold text-text-muted mt-3 tracking-wider">PDF</span>
      </div>

      {/* Asset Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary wrap-break-word">
          {asset.filename}
        </h3>

        {/* Metadata Table / Key-Value List */}
        <div className="space-y-3 pt-1 text-xs">
          {/* Size */}
          <div className="flex items-center justify-between text-text-secondary">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-text-muted" />
              <span>Size</span>
            </div>
            <span className="font-medium text-text-primary">
              {formatFileSize(asset.file_size)}
            </span>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between text-text-secondary">
            <div className="flex items-center gap-2">
              <FileType className="w-4 h-4 text-text-muted" />
              <span>Type</span>
            </div>
            <span className="font-medium text-text-primary">PDF</span>
          </div>

          {/* Uploaded */}
          <div className="flex items-center justify-between text-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span>Uploaded</span>
            </div>
            <span className="font-medium text-text-primary">
              {formatTimeAgo(asset.uploaded_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => onDownload(asset)}
          className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface hover:bg-base text-text-primary text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-text-secondary" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(asset)}
          className="w-full py-2.5 px-4 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

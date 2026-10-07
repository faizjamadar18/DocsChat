import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filename: string;
  isDeleting: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  filename,
  isDeleting
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Delete Asset</h3>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-text-primary">&quot;{filename}&quot;</span>?
              </p>
              <p className="text-xs text-text-muted mt-2">
                This action cannot be undone. All extracted knowledge and citations will be removed from your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 bg-base/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

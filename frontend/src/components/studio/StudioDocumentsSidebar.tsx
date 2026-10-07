'use client';
import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import DeleteDocModal from './DeleteDocModal';

export interface StudioDoc {
  id: string;
  title: string;
  content_text?: string;
  content_json?: Record<string, unknown>;
  updated_at?: string;
}

interface StudioDocumentsSidebarProps {
  documents: StudioDoc[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onRenameDoc: (id: string, newTitle: string) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCreating: boolean;
}

export function StudioDocumentsSidebar({
  documents,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onRenameDoc,
  onDeleteDoc,
  searchQuery,
  setSearchQuery,
  isCreating,
}: StudioDocumentsSidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<StudioDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (doc: StudioDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingId(doc.id);
    setRenameValue(doc.title);
  };

  const handleSaveRename = async (id: string) => {
    if (renameValue.trim()) {
      await onRenameDoc(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteDoc(docToDelete.id);
      setDocToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="w-60 sm:w-64 border-r border-border bg-surface flex flex-col shrink-0 select-none h-full">
      <div className="p-2 flex-1 flex flex-col min-h-0">
        {/* Section header: label + count + create */}
        <div className="flex items-center justify-between pl-2 pr-1 py-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
              Documents
            </span>
            <span className="text-[11px] text-text-muted tabular-nums">
              {documents.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onCreateDoc}
            disabled={isCreating}
            className="w-6 h-6 rounded-md hover:bg-[#EFEFF2] text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="New document"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-sidebar border border-border mb-1 focus-within:border-accent/50 transition-colors">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents"
            className="bg-transparent text-[13px] text-text-primary placeholder-text-muted focus:outline-none w-full min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Document list: 32px rows, loud active state, quiet hover */}
        <div className="px-1 pt-1 space-y-0.5 flex-1 overflow-y-auto pb-2">
          {filteredDocs.length === 0 ? (
            searchQuery ? (
              <div className="px-2 py-10 text-center">
                <div className="w-9 h-9 rounded-xl bg-sidebar border border-border flex items-center justify-center mx-auto mb-2.5">
                  <Search className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-[13px] font-medium text-text-primary">No results</p>
                <p className="text-xs text-text-muted mt-0.5 truncate">
                  Nothing matches &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sidebar border border-border text-text-secondary hover:text-text-primary hover:bg-[#EFEFF2] transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="px-2 py-10 text-center">
                <div className="w-9 h-9 rounded-xl bg-sidebar border border-border flex items-center justify-center mx-auto mb-2.5">
                  <FileText className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-[13px] font-medium text-text-primary">No documents yet</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Create your first doc to start writing.
                </p>
                <button
                  type="button"
                  onClick={onCreateDoc}
                  disabled={isCreating}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-text-primary text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New document
                </button>
              </div>
            )
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const isRenaming = renamingId === doc.id;
              const isMenuOpen = menuOpenId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => !isRenaming && onSelectDoc(doc.id)}
                  title={doc.title}
                  className={`group relative flex items-center gap-2 pl-2 pr-1 h-8 rounded-lg text-[13px] cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-accent-subtle text-accent-hover font-medium'
                      : 'text-text-secondary hover:bg-[#EFEFF2] hover:text-text-primary'
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-hover' : 'text-text-muted group-hover:text-text-secondary'}`} />
                  {isRenaming ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleSaveRename(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(doc.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border border-accent rounded-md px-1.5 h-6 text-[13px] text-text-primary focus:outline-none w-full min-w-0"
                    />
                  ) : (
                    <span className="truncate flex-1 min-w-0 leading-tight">{doc.title}</span>
                  )}

                  {/* Hover action menu */}
                  {!isRenaming && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : doc.id);
                        }}
                        className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-2xs text-text-muted hover:text-text-primary transition-all cursor-pointer ${
                          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                        }`}
                        title="Document options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                            }}
                          />
                          <div
                            className="absolute right-0 top-7 z-50 w-40 bg-white border border-border rounded-xl shadow-xl p-1.5 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(doc, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-primary hover:bg-sidebar rounded-lg transition-colors text-left cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-text-muted" />
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                setDocToDelete(doc);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-border/60 text-[11px] text-text-muted tabular-nums">
        {documents.length} {documents.length === 1 ? 'document' : 'documents'}
      </div>

      {/* Delete Doc Modal */}
      {docToDelete && (
        <DeleteDocModal
          isOpen={true}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={docToDelete.title}
          isDeleting={isDeleting}
        />
      )}
    </aside>
  );
}

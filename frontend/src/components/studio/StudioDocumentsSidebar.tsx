'use client';
import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
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
      <div className="p-3 flex-1 flex flex-col min-h-0">
        {/* DOCUMENTS section header + create button */}
        <div className="flex items-center justify-between px-1.5 py-1 mb-2">
          <span className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
            DOCUMENTS
          </span>
          <button
            type="button"
            onClick={onCreateDoc}
            disabled={isCreating}
            className="w-5 h-5 rounded-md hover:bg-sidebar text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Create Document"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search docs input */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F4F5] border-none mb-3">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none w-full"
          />
        </div>

        {/* Document list */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-muted">
              {searchQuery ? 'No docs found' : 'No documents yet'}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const isRenaming = renamingId === doc.id;
              const isMenuOpen = menuOpenId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => !isRenaming && onSelectDoc(doc.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#F3F4F6] font-medium text-text-primary shadow-2xs'
                      : 'text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-text-primary' : 'text-text-muted'}`} />
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
                        className="bg-surface border border-accent rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{doc.title}</span>
                    )}
                  </div>

                  {/* 3-dots hover action menu button */}
                  {!isRenaming && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : doc.id);
                        }}
                        className={`p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-opacity cursor-pointer ${
                          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                            className="absolute right-0 top-6 z-50 w-32 bg-surface border border-border rounded-lg shadow-lg p-1 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(doc, e)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text-primary hover:bg-sidebar rounded transition-colors text-left cursor-pointer"
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
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

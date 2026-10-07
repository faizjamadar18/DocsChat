'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud, Check, Loader2, PanelLeft } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { api } from '../../../lib/api';
import { StudioDocumentsSidebar, StudioDoc } from '../../../components/studio/StudioDocumentsSidebar';
import { EditorCanvas } from '../../../components/studio/EditorCanvas';
import OraSidebar, { OraLogoMark } from '../../../components/layout/OraSidebar';

export default function StudioPage() {
  const { currentWorkspace, setActiveDocTitle } = useWorkspace();
  const [isOraDrawerOpen, setIsOraDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState<StudioDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<StudioDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active title state for immediate responsive typing in the H1 title input
  const [titleInput, setTitleInput] = useState('');
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!currentWorkspace?.id) return;
      try {
        const res = await api.get(
          `/documents?workspace_id=${currentWorkspace.id}`,
          {
            headers: { 'X-Workspace-Id': currentWorkspace.id },
          }
        );
        if (!active) return;
        const docsList: StudioDoc[] = res.documents || [];
        setDocuments(docsList);

        if (docsList.length > 0) {
          const toSelect = docsList[0];
          setActiveDocId(toSelect.id);
          setActiveDoc(toSelect);
          setTitleInput(toSelect.title);
          setActiveDocTitle(toSelect.title);
        } else {
          // Provision default "Test" document if workspace is empty
          const created = await api.post(
            '/documents',
            {
              title: 'Test',
              content_text: '',
              content_json: {},
            },
            {
              headers: { 'X-Workspace-Id': currentWorkspace.id },
            }
          );
          if (!active) return;
          const newDoc: StudioDoc = {
            id: created.id,
            title: created.title,
            content_text: created.content_text,
            content_json: created.content_json,
            updated_at: created.updated_at,
          };
          setDocuments([newDoc]);
          setActiveDocId(newDoc.id);
          setActiveDoc(newDoc);
          setTitleInput(newDoc.title);
          setActiveDocTitle(newDoc.title);
        }
      } catch (err) {
        if (active) console.error('Failed to load documents:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      setActiveDocTitle(null);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    };
  }, [currentWorkspace?.id, setActiveDocTitle]);

  useEffect(() => {
    const handleToggle = () => setIsOraDrawerOpen((prev) => !prev);
    window.addEventListener('toggle-ora-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-ora-sidebar', handleToggle);
  }, []);

  // Select a document from sidebar
  const handleSelectDoc = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    setActiveDocId(id);
    setActiveDoc(doc);
    setTitleInput(doc.title);
    setActiveDocTitle(doc.title);
    setSaveStatus('saved');
  };

  // Create a new document in MongoDB
  const handleCreateDoc = async (customTitle?: string) => {
    if (!currentWorkspace?.id || isCreating) return;
    setIsCreating(true);
    try {
      const titleToCreate = customTitle || 'Untitled Document';
      const created = await api.post(
        '/documents',
        {
          title: titleToCreate,
          content_text: '',
          content_json: {},
        },
        {
          headers: { 'X-Workspace-Id': currentWorkspace.id },
        }
      );

      const newDoc: StudioDoc = {
        id: created.id,
        title: created.title,
        content_text: created.content_text,
        content_json: created.content_json,
        updated_at: created.updated_at,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setActiveDoc(newDoc);
      setTitleInput(newDoc.title);
      setActiveDocTitle(newDoc.title);
      showToast('Document created');
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Rename a document
  const handleRenameDoc = async (id: string, newTitle: string) => {
    try {
      await api.put(`/documents/${id}`, { title: newTitle });
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
      );
      if (activeDocId === id) {
        setTitleInput(newTitle);
        setActiveDoc((prev) => (prev ? { ...prev, title: newTitle } : null));
        setActiveDocTitle(newTitle);
      }
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  // Delete a document
  const handleDeleteDoc = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);

      if (activeDocId === id) {
        if (remaining.length > 0) {
          handleSelectDoc(remaining[0].id);
        } else {
          setActiveDocId(null);
          setActiveDoc(null);
          setTitleInput('');
          setActiveDocTitle(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Handle document title input change in canvas H1
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitleInput(newTitle);
    setActiveDocTitle(newTitle || 'Untitled Document');

    if (!activeDocId) return;
    setSaveStatus('saving');

    if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    titleSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/documents/${activeDocId}`, {
          title: newTitle || 'Untitled Document',
        });
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === activeDocId ? { ...d, title: newTitle || 'Untitled Document' } : d
          )
        );
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }, 1500);
  };

  // Debounced auto-save content from TipTap canvas
  const handleAutoSaveContent = async (json: Record<string, unknown>, text: string) => {
    if (!activeDocId) return;
    setSaveStatus('saving');
    try {
      await api.put(`/documents/${activeDocId}`, {
        content_json: json,
        content_text: text,
      });
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === activeDocId ? { ...d, content_json: json, content_text: text } : d
        )
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to auto-save document:', err);
    }
  };

  // Idle background Qdrant indexing trigger
  const handleIdleIndex = async () => {
    if (!activeDocId) return;
    try {
      await api.post(`/documents/${activeDocId}/index`, {});
      setSaveStatus('synced');
      setTimeout(() => setSaveStatus('saved'), 2000);
    } catch (err) {
      console.error('Failed to index document to Qdrant:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-base text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Loading Studio...</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-surface overflow-hidden">
      {/* Studio Top Sub-Bar (matching 02-studio-editor.png verbatim) */}
      <div className="h-11 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Sidebar toggle icon + Current active document title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'Collapse documents sidebar' : 'Expand documents sidebar'}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-semibold text-text-primary truncate">
            {activeDoc?.title || 'Documents'}
          </span>
        </div>

        {/* Right: Ora button & Cloud sync indicator */}
        <div className="flex items-center gap-3">
          {/* Ora Assistant Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOraDrawerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isOraDrawerOpen
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-text-primary hover:bg-[#F3F4F6]'
            }`}
            title="Ora Assistant"
          >
            <OraLogoMark className="w-3.5 h-3.5" />
            <span>Ora</span>
          </button>

          {/* Cloud Auto-save Sync Status */}
          <div
            className="flex items-center text-text-muted hover:text-text-secondary cursor-help transition-colors"
            title={
              saveStatus === 'saving'
                ? 'Saving changes...'
                : saveStatus === 'synced'
                ? 'Synced to Qdrant'
                : 'All changes saved'
            }
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
            ) : saveStatus === 'synced' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Cloud className="w-4 h-4 text-text-muted hover:text-text-secondary" />
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Split Content Area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Studio Sub-sidebar (Left Documents Column) */}
        {isSidebarOpen && (
          <StudioDocumentsSidebar
            documents={documents}
            activeDocId={activeDocId}
            onSelectDoc={handleSelectDoc}
            onCreateDoc={() => handleCreateDoc()}
            onRenameDoc={handleRenameDoc}
            onDeleteDoc={handleDeleteDoc}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isCreating={isCreating}
          />
        )}

        {/* Studio Canvas Area (Middle Editor Column) */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-surface">
          {activeDoc ? (
            <div className="w-full max-w-3xl mx-auto px-6 sm:px-12 py-10 flex-1 flex flex-col">
              {/* Document Title H1 Input */}
              <input
                type="text"
                value={titleInput}
                onChange={handleTitleChange}
                placeholder="Untitled Document"
                className="w-full text-3xl sm:text-4xl font-bold text-text-primary placeholder:text-text-muted focus:outline-none border-none bg-transparent mb-5 tracking-tight transition-all"
              />

              {/* TipTap Notion-style Editor Canvas */}
              <div className="flex-1">
                <EditorCanvas
                  key={activeDoc.id}
                  initialContent={activeDoc.content_json || activeDoc.content_text || ''}
                  onAutoSave={handleAutoSaveContent}
                  onIdleIndex={handleIdleIndex}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-muted">
              <p className="text-sm mb-3">No document selected</p>
              <button
                type="button"
                onClick={() => handleCreateDoc()}
                className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors cursor-pointer"
              >
                Create a document
              </button>
            </div>
          )}
        </main>

        {/* Mounted In-Flow Ora Assistant Sidebar (Right Column when opened) */}
        <OraSidebar
          isOpen={isOraDrawerOpen}
          onClose={() => setIsOraDrawerOpen(false)}
          initialScope={activeDoc ? { id: activeDoc.id, title: activeDoc.title, type: 'document' } : null}
          mode="studio"
          onSelectThreadDocument={(scope) => {
            // Restore the full conversation's document context: select + open it.
            const match = documents.find((d) => d.id === scope.id);
            if (match) {
              handleSelectDoc(match.id);
              return;
            }
            // Fallback: fetch the document directly if missing from sidebar list.
            void (async () => {
              try {
                const fetched = await api.get(`/documents/${scope.id}`);
                if (fetched && fetched.id) {
                  const restored: StudioDoc = {
                    id: fetched.id,
                    title: fetched.title || scope.title,
                    content_text: fetched.content_text || '',
                    content_json: fetched.content_json,
                    updated_at: fetched.updated_at,
                  };
                  setDocuments((prev) =>
                    prev.some((d) => d.id === restored.id) ? prev : [restored, ...prev]
                  );
                  setActiveDocId(restored.id);
                  setActiveDoc(restored);
                  setTitleInput(restored.title);
                  setActiveDocTitle(restored.title);
                }
              } catch (err) {
                console.error('Failed to restore document context for thread:', err);
              }
            })();
          }}
        />
      </div>

      {/* "Document created" Bottom Toast Notification (matches 02-studio-editor.png) */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm text-text-primary px-5 py-2.5 rounded-2xl shadow-xl border border-border text-xs font-medium flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

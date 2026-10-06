'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import debounce from 'lodash/debounce';

export default function DocumentEditor({ workspaceId, documentId, onClose }: { workspaceId: string, documentId?: string, onClose: () => void }) {
  const [title, setTitle] = useState('Untitled Document');
  const [docId, setDocId] = useState<string | null>(documentId || null);
  const [saving, setSaving] = useState(false);

  const saveDocument = useCallback(async (currentTitle: string, content: string, plainText: string) => {
    setSaving(true);
    try {
      if (docId) {
        await api.put(`/workspaces/${workspaceId}/documents/${docId}`, {
          title: currentTitle,
          content,
          plain_text: plainText
        });
      } else {
        const response = await api.post(`/workspaces/${workspaceId}/documents`, {
          title: currentTitle,
          content,
          plain_text: plainText
        });
        setDocId(response.id);
      }
    } catch (err) {
      console.error("Failed to save document", err);
    } finally {
      setSaving(false);
    }
  }, [docId, workspaceId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useMemo(
    () => debounce((t: string, c: string, pt: string) => saveDocument(t, c, pt), 2000),
    [saveDocument]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      debouncedSave(title, JSON.stringify(editor.getJSON()), editor.getText());
    },
  });

  useEffect(() => {
    async function fetchDoc() {
      if (documentId) {
        try {
          const data = await api.get(`/workspaces/${workspaceId}/documents/${documentId}`);
          setTitle(data.title);
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(JSON.parse(data.content));
          }
        } catch (err) {
          console.error("Failed to load document", err);
        }
      }
    }
    fetchDoc();
  }, [documentId, workspaceId, editor]);

  return (
    <div className="flex flex-col h-full bg-base p-6">
      <div className="flex justify-between items-center mb-4">
        <input 
          type="text" 
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (editor) debouncedSave(e.target.value, JSON.stringify(editor.getJSON()), editor.getText());
          }}
          className="text-2xl font-bold bg-transparent text-white border-none outline-none focus:ring-0"
          placeholder="Document Title"
        />
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40">{saving ? 'Saving...' : 'Saved'}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
        </div>
      </div>
      <div className="flex-1 bg-surface border border-white/10 rounded-xl overflow-hidden p-4 prose prose-invert max-w-none prose-sm sm:prose-base">
        <EditorContent editor={editor} className="h-full outline-none" />
      </div>
    </div>
  );
}

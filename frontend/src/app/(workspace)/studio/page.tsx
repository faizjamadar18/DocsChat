'use client';
import React, { useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';

export default function StudioPage() {
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [docContent, setDocContent] = useState('');

  const documents = [
    { id: '1', title: 'Test', active: true },
    { id: '2', title: 'Plura Doc', active: false },
    { id: '3', title: 'RAG Chatbot Explained', active: false },
    { id: '4', title: 'JavaScript Async Await...', active: false },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Studio Sub-sidebar (Documents List) */}
      <div className="w-64 border-r border-border bg-surface p-3 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-1 py-1.5 mb-2">
          <span className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
            DOCUMENTS
          </span>
          <button
            type="button"
            className="w-5 h-5 rounded-md hover:bg-[#F3F4F6] text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
            title="New Document"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search docs input */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-sidebar border border-border mb-3">
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search docs..."
            className="bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none w-full"
          />
        </div>

        {/* Document list */}
        <div className="space-y-0.5 flex-1 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                doc.active
                  ? 'bg-sidebar font-medium text-text-primary'
                  : 'text-text-secondary hover:bg-sidebar hover:text-text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span className="truncate">{doc.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Studio Canvas Area */}
      <div className="flex-1 p-8 sm:p-12 overflow-y-auto max-w-4xl mx-auto">
        <div className="space-y-4">
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="w-full text-3xl font-bold text-text-primary placeholder-text-muted focus:outline-none border-none bg-transparent"
            placeholder="Untitled Document"
          />
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Start typing or press '/' for commands..."
            rows={12}
            className="w-full text-sm text-[#374151] placeholder-text-muted focus:outline-none border-none resize-none bg-transparent leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}

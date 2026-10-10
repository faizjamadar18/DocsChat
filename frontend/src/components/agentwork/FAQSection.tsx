'use client';

import React, { useState } from 'react';

const FAQS = [
  {
    question: 'Which tools and file formats does DocsChat connect to?',
    answer:
      'DocsChat connects directly to Google Drive, Notion, and GitHub repositories, and supports direct uploads for PDFs, Markdown, and plain text files. You can selectively sync entire folders, specific Notion databases, or individual code repositories.',
  },
  {
    question: 'How does DocsChat ensure accurate, hallucination-free answers?',
    answer:
      'DocsChat uses Retrieval-Augmented Generation (RAG) powered by Google’s gemini-embedding-2 and Qdrant Cloud. Ora AI grounds every answer strictly in retrieved context chunks and provides transparent footnote citations ([1], [2]) linking to the exact source passages in an expandable drawer.',
  },
  {
    question: 'Can I ask questions about a single file instead of the whole workspace?',
    answer:
      'Yes. Simply type @ in the chat input to mention and scope your question to any specific document, repository, or connector. Ora will limit its retrieval context exclusively to that file.',
  },
  {
    question: 'What is DocsChat Studio?',
    answer:
      'Studio is our Notion-style block editor featuring slash commands (/), task lists, tables, and formatted callouts. An integrated Ora Co-Writer sits alongside your document to help synthesize research, outline ideas, and draft sections in real time.',
  },
  {
    question: 'How does the Model Context Protocol (MCP) integration work?',
    answer:
      'DocsChat includes a native MCP server endpoint. You can copy your workspace MCP URL and connect external desktop AI assistants like Anthropic Claude Desktop or Cursor IDE to query your indexed knowledge base directly from your favorite tools.',
  },
  {
    question: 'Is my organization’s data kept private and secure?',
    answer:
      'Yes. Your data is isolated per workspace with multi-tenant MongoDB separation and dedicated Qdrant vector namespaces. Authentication is protected by Google OAuth and session guards. Your documents are never used to train external foundation models.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col md:flex-row gap-10 md:gap-16 items-start">
        {/* Left Heading */}
        <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.03em] text-[#21201c] md:w-1/3 shrink-0">
          Frequently
          <br className="hidden md:block" /> Asked
          <br className="hidden md:block" /> Questions
        </h2>

        {/* Right Accordion */}
        <div className="flex-1 w-full flex flex-col divide-y divide-[#e2e1de] border-y border-[#e2e1de]">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-medium text-base text-[#21201c] hover:text-[#ff6a00] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <span className="text-xl leading-none text-[#8d8d86] shrink-0 font-light">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 text-sm leading-relaxed text-[#63635e] pr-6">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

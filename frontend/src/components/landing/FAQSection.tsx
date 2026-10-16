'use client';

import React, { useState } from 'react';

const FAQS = [
  {
    question: 'Which tools and file formats does Quello connect to?',
    answer:
      'Quello connects to Google Drive, Notion, and GitHub, plus direct uploads for PDFs, Markdown, and text files. Sync entire folders, selected databases, or individual repositories — you control what stays connected.',
  },
  {
    question: 'How do I know an answer is accurate?',
    answer:
      'Answers come only from the sources you connected. Each answer includes citations that open the exact passage it came from, so you can verify in one click instead of taking it on trust.',
  },
  {
    question: 'Can I ask questions about a single file instead of the whole workspace?',
    answer:
      'Yes. Type @ in the chat input to scope your question to a specific document, repository, or connector. Quello will answer only from that file.',
  },
  {
    question: 'What is Quello Studio?',
    answer:
      'Studio is a clean editor for notes and drafts. You can outline, summarize, and rewrite side-by-side with your sources, without copying between tools.',
  },
  {
    question: 'Can I use my workspace from another AI app?',
    answer:
      'Yes. Quello gives each workspace a secure URL you can add to a connected AI app. That app can then search your workspace directly, with the same access controls. You can revoke access anytime.',
  },
  {
    question: 'Is my data kept private?',
    answer:
      'Yes. Each workspace is kept separate, access is protected by Google sign-in, and your documents are never used to train public models. Disconnect any source whenever you want.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16 md:py-24 w-full max-w-full overflow-hidden scroll-mt-24">
      <div className="flex w-full max-w-300 flex-col md:flex-row gap-8 md:gap-16 items-start">
        {/* Left Heading */}
        <h2 data-section-anchor="true" className="text-xl sm:text-2xl md:text-3xl font-medium tracking-[-0.03em] text-[#21201c] md:w-1/3 shrink-0">
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

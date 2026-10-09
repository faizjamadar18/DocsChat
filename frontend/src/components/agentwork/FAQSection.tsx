'use client';

import React, { useState } from 'react';

const FAQS = [
  {
    question: 'Which tools does Agentwork connect to?',
    answer:
      'Agentwork connects to Slack, Notion, Google Workspace (Drive, Docs, Sheets, Slides, Gmail, and Calendar), Microsoft 365 (Outlook mail and calendar), Fireflies, GitHub, GitLab, Linear, Atlassian (Jira and Confluence), HubSpot, Attio, Stripe, Shopify, PostHog, Mixpanel, Google Ads, LinkedIn Ads, Granola, Pleo, Numina, Oneleet, n8n, and Semrush. You can also connect AI tools to Agentwork through the Model Context Protocol (MCP). We work on adding new integrations every day.',
  },
  {
    question: 'What happens when the answer isn’t written down anywhere?',
    answer:
      'It doesn’t guess. Agentwork works out who is most likely to know and sends them one short, specific question. Their answer is saved to its memory, so the next person who asks gets it instantly and nobody has to chase it down again.',
  },
  {
    question: 'How do I know an answer is correct?',
    answer:
      'Every answer comes with its sources, so you can click through and verify in one step. When two sources contradict each other, Agentwork flags the conflict and resolves it with the right person instead of silently picking one.',
  },
  {
    question: 'Will people see answers they’re not supposed to?',
    answer:
      'No. Agentwork respects the same access rules your tools already enforce. People only ever get answers drawn from sources they already have permission to see, so nothing leaks across teams.',
  },
  {
    question: 'Does our company’s data live on your servers?',
    answer:
      'Your data is encrypted in transit and is only ever processed to answer your team’s questions, never to train shared models. Integration credentials are never stored in plaintext. We’re working toward end-to-end encryption for data at rest. No Agentwork employee can browse or read your content, and you can disconnect any source or delete everything at any time.',
  },
  {
    question: 'Who are your sub-processors?',
    answer:
      'We deliberately keep our supply chain small and exclusively EU-based. Every sub-processor we rely on operates within the EU, so your data never leaves European infrastructure. A current list is available in our DPA on request.',
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

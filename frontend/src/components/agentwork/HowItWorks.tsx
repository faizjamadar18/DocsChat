'use client';

import React, { useState, useEffect } from 'react';
import {
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  GoogleDriveIcon,
  GmailIcon,
  NotionIcon,
  SlackIcon,
  AttioIcon,
  Microsoft365Icon,
  PostHogIcon,
  GitHubIcon,
  StripeIcon,
  FirefliesIcon,
  LinearIcon,
  HubSpotIcon,
} from './Icons';

export default function HowItWorks() {
  const [typedText, setTypedText] = useState('');
  const fullText = "When's the summer party?";

  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const tick = () => {
      if (!isDeleting) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
        if (index === fullText.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 70);
      } else {
        setTypedText(fullText.slice(0, index - 1));
        index--;
        if (index === 0) {
          isDeleting = false;
          timer = setTimeout(tick, 1000);
          return;
        }
        timer = setTimeout(tick, 40);
      }
    };

    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, []);

  const tools = [
    { name: 'Google Docs', Icon: GoogleDocsIcon },
    { name: 'Google Sheets', Icon: GoogleSheetsIcon },
    { name: 'Google Slides', Icon: GoogleSlidesIcon },
    { name: 'Google Drive', Icon: GoogleDriveIcon },
    { name: 'Gmail', Icon: GmailIcon },
    { name: 'Notion', Icon: NotionIcon },
    { name: 'Slack', Icon: SlackIcon },
    { name: 'Attio', Icon: AttioIcon },
    { name: 'Microsoft 365', Icon: Microsoft365Icon },
    { name: 'PostHog', Icon: PostHogIcon },
    { name: 'GitHub', Icon: GitHubIcon },
    { name: 'Stripe', Icon: StripeIcon },
    { name: 'Fireflies', Icon: FirefliesIcon },
    { name: 'Linear', Icon: LinearIcon },
    { name: 'HubSpot', Icon: HubSpotIcon },
  ];

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-12">
        {/* Header Lines */}
        <div className="flex flex-col gap-1">
          <div className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-[#63635e] flex items-baseline gap-2">
            <span>Connect your tools</span>
            <sup className="text-xs font-mono text-[#8d8d86]">01</sup>
          </div>
          <div className="text-2xl md:text-3xl font-medium tracking-[-0.03em] text-[#21201c] flex items-baseline gap-2">
            <span>Ask questions in plain language</span>
            <sup className="text-xs font-mono text-[#ff6a00]">02</sup>
          </div>
          <div className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-[#63635e] flex items-baseline gap-2">
            <span>Let Agentwork fill in the gaps</span>
            <sup className="text-xs font-mono text-[#8d8d86]">03</sup>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Integrate */}
          <div className="flex flex-col gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] hover:border-[#cfceca] transition-colors">
            {/* 15 App Icons Grid */}
            <div className="h-44 w-full rounded-xl bg-[#ffffff] border border-[#e2e1de] p-4 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-3.5 place-items-center w-full">
                {tools.map(({ name, Icon }) => (
                  <div
                    key={name}
                    className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer"
                    title={name}
                  >
                    <Icon className="size-5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono font-semibold text-[#8d8d86]">01</span>
              <h3 className="text-lg font-semibold text-[#21201c]">Integrate</h3>
              <p className="text-sm leading-relaxed text-[#63635e]">
                Plug Agentwork into the systems where your work lives. It connects every tool and turns scattered information into one place your company can draw from.
              </p>
            </div>
          </div>

          {/* Step 2: Ask */}
          <div className="flex flex-col gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] hover:border-[#cfceca] transition-colors">
            {/* Prompt search mockup */}
            <div className="h-44 w-full rounded-xl bg-[#ffffff] border border-[#e2e1de] p-4 flex items-center justify-center">
              <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#e2e1de] bg-[#fdfdfc] shadow-xs">
                <span className="text-sm text-[#21201c] font-normal min-h-5">
                  {typedText}
                  <span className="inline-block w-0.5 h-4 bg-[#ff6a00] ml-0.5 align-middle animate-pulse" />
                </span>
                <div className="ml-auto size-6 rounded-md bg-[#21201c] text-[#ffffff] flex items-center justify-center shrink-0">
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono font-semibold text-[#ff6a00]">02</span>
              <h3 className="text-lg font-semibold text-[#21201c]">Ask</h3>
              <p className="text-sm leading-relaxed text-[#63635e]">
                Anyone can ask a question like they&apos;d ask a coworker and get a clear, trustworthy answer in seconds. No digging, no waiting on the person who knows.
              </p>
            </div>
          </div>

          {/* Step 3: Improves */}
          <div className="flex flex-col gap-6 p-6 rounded-2xl border border-[#e2e1de] bg-[#f9f9f8] hover:border-[#cfceca] transition-colors">
            {/* Updating sources animation */}
            <div className="h-44 w-full rounded-xl bg-[#ffffff] border border-[#e2e1de] p-4 flex items-center justify-center">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#e2e1de] bg-[#fdfdfc] shadow-xs">
                <svg className="size-4 text-[#ff6a00] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                <span className="text-xs font-medium text-[#21201c]">Updating 3 sources</span>
                <div className="flex items-center gap-1.5 ml-1">
                  <NotionIcon className="size-3.5 text-[#21201c]" />
                  <LinearIcon className="size-3.5 text-[#5E6AD2]" />
                  <HubSpotIcon className="size-3.5 text-[#ff7a59]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono font-semibold text-[#8d8d86]">03</span>
              <h3 className="text-lg font-semibold text-[#21201c]">Improves</h3>
              <p className="text-sm leading-relaxed text-[#63635e]">
                When the answer isn&apos;t there yet, Agentwork spots the gap, asks whoever knows, and saves it for next time. Your knowledge gets sharper every time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

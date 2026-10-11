'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, PhoneOff, ChevronDown } from 'lucide-react';
import SourceFooter, { FilenameIcon } from '../chat/SourceFooter';
import type { Citation } from '@/hooks/useChat';
import {
  SyncIcon,
  PaperclipIcon,
  ArrowUpIcon,
} from './Icons';
import {
  PdfIcon,
  GoogleDocIcon,
  NotionIcon,
  GoogleDriveIcon,
  GitHubIcon,
  SlackIcon,
  MicrosoftIcon,
  LinearIcon,
  AtlassianIcon,
  HubSpotIcon,
  ClaudeIcon,
  GrokIcon,
  ChatGptIcon,
  PerplexityIcon,
  MistralIcon,
} from '../connectors/ConnectorIcons';

interface StepData {
  number: string;
  title: string;
  description: string;
}

const steps: StepData[] = [
  {
    number: '01',
    title: 'Connect your tools',
    description:
      'Bring Google Drive, Notion, GitHub, and PDFs into one private workspace. Sync stays up to date automatically.',
  },
  {
    number: '02',
    title: 'Ask in plain English',
    description:
      'Type or speak naturally. Add @ to scope a question to a single file when you need a focused answer.',
  },
  {
    number: '03',
    title: 'Verify every answer',
    description:
      'Each response links to the exact passage it came from. Open the source in one click — no blind trust.',
  },
];

const headerLines = [
  { text: 'Connect the tools your team already uses', number: '01' },
  { text: 'Ask naturally by voice or chat', number: '02' },
  { text: 'Verify every answer in one click', number: '03' },
];

const integrationIcons = [
  { name: 'PDF', Icon: PdfIcon },
  { name: 'Google Docs', Icon: GoogleDocIcon },
  { name: 'Notion', Icon: NotionIcon },
  { name: 'Google Drive', Icon: GoogleDriveIcon },
  { name: 'GitHub', Icon: GitHubIcon },
  { name: 'Slack', Icon: SlackIcon },
  { name: 'Microsoft 365', Icon: MicrosoftIcon },
  { name: 'Linear', Icon: LinearIcon },
  { name: 'Atlassian', Icon: AtlassianIcon },
  { name: 'HubSpot', Icon: HubSpotIcon },
  { name: 'Claude', Icon: ClaudeIcon },
  { name: 'Grok', Icon: GrokIcon },
  { name: 'ChatGPT', Icon: ChatGptIcon },
  { name: 'Perplexity', Icon: PerplexityIcon },
  { name: 'Mistral', Icon: MistralIcon },
];

const cardSources: Citation[] = [
  { source_id: 'notion', filename: '[Notion] Team Docs', snippet: '', similarity_score: 0.95 },
  { source_id: 'github', filename: '[GitHub] DocsChat', snippet: '', similarity_score: 0.92 },
  { source_id: 'drive', filename: '[Drive] Summer Party 2026', snippet: '', similarity_score: 0.89 },
  { source_id: 'docs', filename: 'Event Details & Menu.gdoc', snippet: '', similarity_score: 0.85 },
];

const fullPrompt = "When's the summer party?";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [cycleKey, setCycleKey] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [isTypingPhase, setIsTypingPhase] = useState<boolean>(false);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [expandedSources, setExpandedSources] = useState<boolean>(false);

  // Stagger order for icons in Step 1
  const iconDelays = useMemo(() => {
    // Deterministic shuffle for smooth, pleasant stagger
    const order = [3, 11, 7, 0, 14, 5, 1, 9, 12, 4, 13, 8, 2, 10, 6];
    return order.map((pos) => (pos / (integrationIcons.length - 1)) * 2.2);
  }, []);

  // Main step cycling loop
  useEffect(() => {
    if (manualOverride) return;

    let timeoutId: NodeJS.Timeout;

    if (activeStep === 0) {
      // Step 0: Tools reveal (display for 4.2s, then switch to Step 1)
      timeoutId = setTimeout(() => {
        setActiveStep(1);
      }, 4200);
    } else if (activeStep === 1) {
      // Step 1: Prompt typing
      setIsTypingPhase(true);
      setTypedText('');
      let charIndex = 0;
      let isDeleting = false;
      let typingInterval: NodeJS.Timeout;

      const runTyping = () => {
        if (!isDeleting) {
          charIndex++;
          setTypedText(fullPrompt.slice(0, charIndex));
          if (charIndex >= fullPrompt.length) {
            // Pause at full text
            typingInterval = setTimeout(() => {
              isDeleting = true;
              typingInterval = setTimeout(runTyping, 40);
            }, 1400);
            return;
          }
          typingInterval = setTimeout(runTyping, 45);
        } else {
          charIndex--;
          setTypedText(fullPrompt.slice(0, charIndex));
          if (charIndex <= 0) {
            // Typing cycle finished, move to step 2 after brief pause
            typingInterval = setTimeout(() => {
              setIsTypingPhase(false);
              setActiveStep(2);
            }, 500);
            return;
          }
          typingInterval = setTimeout(runTyping, 28);
        }
      };

      // Initial pause before typing starts
      typingInterval = setTimeout(runTyping, 700);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(typingInterval);
      };
    } else if (activeStep === 2) {
      // Step 2: Improves (spin sources for 4.5s, then cycle back to Step 0)
      timeoutId = setTimeout(() => {
        setCycleKey((k) => k + 1);
        setActiveStep(0);
      }, 4500);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStep, cycleKey, manualOverride]);

  // Re-trigger icon pop animation periodically if user stays on Card 1
  useEffect(() => {
    if (!manualOverride || activeStep !== 0) return;
    const interval = setInterval(() => {
      setCycleKey((k) => k + 1);
    }, 5500);
    return () => clearInterval(interval);
  }, [manualOverride, activeStep]);

  // Handle manual tab/card selection
  const handleSelectStep = (index: number) => {
    setActiveStep(index);
    setManualOverride(true);
    if (index === 0) {
      setCycleKey((k) => k + 1);
    } else if (index === 1) {
      setTypedText(fullPrompt);
      setIsTypingPhase(true);
    }
    // Re-enable auto-cycling after 10 seconds of user inactivity
    setTimeout(() => {
      setManualOverride(false);
    }, 10000);
  };

  return (
    <section id="how-it-works" className="flex flex-col items-center px-6 py-20 bg-[#fdfdfc]">
      <div className="flex w-full max-w-[1200px] flex-col gap-10">
        {/* Header Lines */}
        <div className="max-w-2xl text-2xl md:text-[28px] font-medium leading-[1.35] tracking-[-0.03em]">
          {headerLines.map((line, index) => {
            const isActive = index === activeStep;
            return (
              <div
                key={line.number}
                onClick={() => handleSelectStep(index)}
                className={`cursor-pointer transition-colors duration-300 flex items-baseline gap-1.5 select-none ${
                  isActive ? 'text-[#21201c]' : 'text-[#8d8d86] hover:text-[#63635e]'
                }`}
              >
                <span>{line.text}</span>
                <sup
                  className={`text-xs font-semibold tabular-nums lining-nums transition-colors duration-300 relative top-[-6px] ${
                    isActive ? 'text-[#ff6a00]' : 'text-[#8d8d86]'
                  }`}
                >
                  {line.number}
                </sup>
              </div>
            );
          })}
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 gap-16 md:gap-6 md:grid-cols-3">
          {/* Card 1: Integrate */}
          <div
            onClick={() => handleSelectStep(0)}
            className="flex flex-col gap-8 cursor-pointer group"
          >
            {/* Visual Box */}
            <div className="relative w-full">
              <div
                className={`relative flex h-[300px] w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
                  activeStep === 0
                    ? 'border-[#cfceca] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05),inset_0_0_0_3.5px_#f9f9f8]'
                    : 'group-hover:border-[#cfceca]'
                }`}
              >
                {/* 15 Integration Icons Grid */}
                <div className="flex size-full flex-wrap content-center items-center justify-center gap-x-12 gap-y-11 px-6 pb-[68px] pt-6 text-[#21201c]">
                  {integrationIcons.map(({ name, Icon }, index) => {
                    const delay = activeStep === 0 ? iconDelays[index] : 0;
                    return (
                      <div
                        key={`${name}-${cycleKey}`}
                        style={
                          activeStep === 0
                            ? {
                                animation: 'iconBlurIn 0.72s cubic-bezier(0.16, 1, 0.3, 1) both',
                                animationDelay: `${delay}s`,
                                willChange: 'transform, filter, opacity',
                              }
                            : {
                                opacity: 0.88,
                                filter: 'none',
                                transform: 'none',
                              }
                        }
                        className="shrink-0 flex items-center justify-center"
                        title={name}
                      >
                        <Icon className="size-5" />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Subtle bottom fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-gradient-to-t from-[#fdfdfc] from-[22%] to-transparent"
              />
            </div>

            {/* Description Text */}
            <div className="flex flex-col gap-4">
              <p
                className={`text-xs font-semibold uppercase tabular-nums lining-nums transition-colors duration-300 ${
                  activeStep === 0 ? 'text-[#ff6a00]' : 'text-[#8d8d86]'
                }`}
              >
                {steps[0].number}
              </p>
              <div className="flex flex-col gap-2">
                <p
                  className={`text-xl font-medium tracking-[-0.02em] transition-colors duration-300 ${
                    activeStep === 0 ? 'text-[#21201c]' : 'text-[#21201c]'
                  }`}
                >
                  {steps[0].title}
                </p>
                <p
                  className={`text-base leading-relaxed transition-colors duration-300 ${
                    activeStep === 0 ? 'text-[#21201c]' : 'text-[#63635e]'
                  }`}
                >
                  {steps[0].description}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Ask */}
          <div
            onClick={() => handleSelectStep(1)}
            className="flex flex-col gap-8 cursor-pointer group"
          >
            {/* Visual Box */}
            <div className="relative w-full">
              <div
                className={`relative flex h-[300px] w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
                  activeStep === 1
                    ? 'border-[#cfceca] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05),inset_0_0_0_3.5px_#f9f9f8]'
                    : 'group-hover:border-[#cfceca]'
                }`}
              >
                {/* Voice & Prompt Visual Box (Matching design image) */}
                <div className="flex size-full flex-col items-center justify-center px-5 py-4 gap-2.5 select-none">
                  {/* Top Caption */}
                  <p className="text-[13px] md:text-[14px] text-[#71717a] font-normal text-center tracking-[-0.01em]">
                    Type it out, or just say it out loud.
                  </p>

                  {/* Voice Bar Pill */}
                  <div className="bg-[#18181b] rounded-full flex items-center gap-3.5 px-2.5 py-1.5 shadow-md">
                    {/* Microphone Circle */}
                    <div
                      className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0"
                      aria-label="Microphone"
                    >
                      <Mic className="w-4 h-4 text-white" />
                    </div>

                    {/* Sound Bars */}
                    <div className="flex items-center gap-1.5 px-0.5" aria-hidden="true">
                      <span className={`w-2 h-4.5 rounded-full bg-white ${activeStep === 1 ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}`} />
                      <span className={`w-2 h-4.5 rounded-full bg-white ${activeStep === 1 ? 'animate-[pulse_1.5s_ease-in-out_infinite_0.3s]' : ''}`} />
                    </div>

                    {/* End Call Circle */}
                    <div
                      className="w-8 h-8 rounded-full bg-[#e53935] text-white flex items-center justify-center shrink-0"
                      aria-label="End call"
                    >
                      <PhoneOff className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Listening status */}
                  <p className="text-[12px] text-[#8d8d86] font-normal text-center tracking-[-0.01em]">
                    Listening...
                  </p>

                  {/* Chat Input Box */}
                  <div className="w-full max-w-[270px] rounded-2xl border border-[#e2e1de] bg-white p-3.5 shadow-[0px_1px_4px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[82px] mt-0.5">
                    <div className="text-[14px] font-normal text-[#21201c] tracking-[-0.01em] flex items-center min-h-[22px]">
                      <span>{activeStep === 1 ? typedText : fullPrompt}</span>
                      {activeStep === 1 && (
                        <span className="inline-block w-[1.5px] h-3.5 bg-[#21201c] ml-0.5 align-middle animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1.5">
                      <div className="text-[#8d8d86] hover:text-[#21201c] transition-colors p-0.5">
                        <PaperclipIcon className="size-4" />
                      </div>
                      <div className="size-7 rounded-full bg-[#21201c] text-white flex items-center justify-center shrink-0">
                        <ArrowUpIcon className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Subtle bottom fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-gradient-to-t from-[#fdfdfc] from-[22%] to-transparent"
              />
            </div>

            {/* Description Text */}
            <div className="flex flex-col gap-4">
              <p
                className={`text-xs font-semibold uppercase tabular-nums lining-nums transition-colors duration-300 ${
                  activeStep === 1 ? 'text-[#ff6a00]' : 'text-[#8d8d86]'
                }`}
              >
                {steps[1].number}
              </p>
              <div className="flex flex-col gap-2">
                <p
                  className={`text-xl font-medium tracking-[-0.02em] transition-colors duration-300 ${
                    activeStep === 1 ? 'text-[#21201c]' : 'text-[#21201c]'
                  }`}
                >
                  {steps[1].title}
                </p>
                <p
                  className={`text-base leading-relaxed transition-colors duration-300 ${
                    activeStep === 1 ? 'text-[#21201c]' : 'text-[#63635e]'
                  }`}
                >
                  {steps[1].description}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Improves */}
          <div
            onClick={() => handleSelectStep(2)}
            className="flex flex-col gap-8 cursor-pointer group"
          >
            {/* Visual Box */}
            <div className="relative w-full">
              <div
                className={`relative flex h-[300px] w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
                  activeStep === 2
                    ? 'border-[#cfceca] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05),inset_0_0_0_3.5px_#f9f9f8]'
                    : 'group-hover:border-[#cfceca]'
                }`}
              >
                {/* Source Footer Visual Box (Matching chat footer) */}
                <div className="flex size-full flex-col items-center justify-center px-6 py-8 select-none">
                  <div className="flex flex-col items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandedSources((prev) => !prev)}
                      aria-expanded={expandedSources}
                      className="flex items-center gap-3 text-sm md:text-[15px] text-[#63635e] hover:text-[#21201c] transition-colors cursor-pointer select-none group"
                    >
                      <span className="shrink-0 font-normal">
                        4 sources used
                      </span>
                      <span className="flex items-center gap-2">
                        <NotionIcon className="w-5 h-5 shrink-0" />
                        <GitHubIcon className="w-5 h-5 shrink-0" />
                        <GoogleDriveIcon className="w-5 h-5 shrink-0" />
                        <GoogleDocIcon className="w-5 h-5 shrink-0" />
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8d8d86] group-hover:text-[#21201c] shrink-0 transition-transform duration-200 ${
                          expandedSources ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSources && (
                      <div className="mt-1 flex flex-col gap-2 w-full max-w-[280px] animate-fade-in text-[13px]">
                        {cardSources.map((s) => (
                          <div
                            key={s.source_id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#e2e1de] bg-[#f9f9f8] text-[#21201c]"
                          >
                            <FilenameIcon filename={s.filename} className="w-4.5 h-4.5 shrink-0" />
                            <span className="truncate font-medium text-[#63635e]">{s.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Subtle bottom fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-gradient-to-t from-[#fdfdfc] from-[22%] to-transparent"
              />
            </div>

            {/* Description Text */}
            <div className="flex flex-col gap-4">
              <p
                className={`text-xs font-semibold uppercase tabular-nums lining-nums transition-colors duration-300 ${
                  activeStep === 2 ? 'text-[#ff6a00]' : 'text-[#8d8d86]'
                }`}
              >
                {steps[2].number}
              </p>
              <div className="flex flex-col gap-2">
                <p
                  className={`text-xl font-medium tracking-[-0.02em] transition-colors duration-300 ${
                    activeStep === 2 ? 'text-[#21201c]' : 'text-[#21201c]'
                  }`}
                >
                  {steps[2].title}
                </p>
                <p
                  className={`text-base leading-relaxed transition-colors duration-300 ${
                    activeStep === 2 ? 'text-[#21201c]' : 'text-[#63635e]'
                  }`}
                >
                  {steps[2].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

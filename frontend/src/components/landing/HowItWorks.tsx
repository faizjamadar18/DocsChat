'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mic, PhoneOff, ChevronDown } from 'lucide-react';
import {
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
import { useInView } from '../../hooks/useInView';

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
      'Bring your documents and connected tools into one private workspace. Sync stays up to date automatically.',
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
  { text: 'Connect your documents and tools', number: '01' },
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

const sourceIconsList = [
  { id: 'notion', name: 'Notion', Icon: NotionIcon },
  { id: 'github', name: 'GitHub', Icon: GitHubIcon, className: 'text-[#181717]' },
  { id: 'drive', name: 'Google Drive', Icon: GoogleDriveIcon },
  { id: 'docs', name: 'Google Docs', Icon: GoogleDocIcon },
];

const fullPrompt = "Catch me up on this doc?";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [cycleKey, setCycleKey] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [manualOverride, setManualOverride] = useState<boolean>(false);

  // Viewport gate: timelines start when the user lands on the section, not on page mount.
  const { ref: sectionRef, inView, hasEntered } = useInView<HTMLElement>();
  const prevInViewRef = useRef<boolean>(false);

  // Card 3 sources animation states
  const [sourcesStepActive, setSourcesStepActive] = useState<boolean>(false);
  const [visibleSourceCount, setVisibleSourceCount] = useState<number>(0);
  const [sourcesDone, setSourcesDone] = useState<boolean>(false);
  const [sourcesExpanded, setSourcesExpanded] = useState<boolean>(false);
  const sourcesTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Stagger order for icons in Step 1
  const iconDelays = useMemo(() => {
    // Deterministic shuffle for smooth, pleasant stagger
    const order = [3, 11, 7, 0, 14, 5, 1, 9, 12, 4, 13, 8, 2, 10, 6];
    return order.map((pos) => (pos / (integrationIcons.length - 1)) * 2.2);
  }, []);

  // Main step cycling loop (runs only while the section is on screen)
  useEffect(() => {
    if (manualOverride) return;
    if (!hasEntered || !inView) return;

    let timeoutId: NodeJS.Timeout;

    if (activeStep === 0) {
      // Step 0: Tools reveal (display for 4.2s, then switch to Step 1)
      timeoutId = setTimeout(() => {
        setActiveStep(1);
      }, 4200);
    } else if (activeStep === 1) {
      // Step 1: Prompt typing (reset + start inside the kickoff tick so the
      // effect body itself never sets state synchronously)
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
              setActiveStep(2);
            }, 500);
            return;
          }
          typingInterval = setTimeout(runTyping, 28);
        }
      };

      // Initial pause before typing starts (reset here, inside the tick)
      typingInterval = setTimeout(() => {
        setTypedText('');
        runTyping();
      }, 700);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(typingInterval);
      };
    } else if (activeStep === 2) {
      // Step 2: Verify sources (3.25s animation sequence + ~1.75s done state, then cycle back to Step 0)
      timeoutId = setTimeout(() => {
        setCycleKey((k) => k + 1);
        setActiveStep(0);
      }, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStep, cycleKey, manualOverride, hasEntered, inView]);

  // Card 3: Timeline sequence (triggered when activeStep === 2 while on screen)
  useEffect(() => {
    // Clear any pending timers on deactivate and on unmount
    sourcesTimersRef.current.forEach(clearTimeout);
    sourcesTimersRef.current = [];

    if (activeStep !== 2 || !hasEntered || !inView) {
      const resetTimer = setTimeout(() => {
        setSourcesStepActive(false);
        setVisibleSourceCount(0);
        setSourcesDone(false);
        setSourcesExpanded(false);
      }, 0);
      sourcesTimersRef.current = [resetTimer];
      return;
    }

    // Card 3 activates inside kickoff tick
    const t0 = setTimeout(() => {
      setSourcesStepActive(true);
      setVisibleSourceCount(0);
      setSourcesDone(false);
      setSourcesExpanded(false);
    }, 0);

    // Sequence timeline:
    // t = 0: LOADING state. Label reads "Searching sources…" with shimmer. No icons. Chevron hidden.
    // t = 900ms: Notion icon pops in.
    // t = 1550ms: GitHub icon pops in.
    // t = 2200ms: Google Drive icon pops in.
    // t = 2850ms: Google Docs icon pops in.
    // t = 3250ms (last icon + 400ms): switch to DONE state.
    const t1 = setTimeout(() => setVisibleSourceCount(1), 900);
    const t2 = setTimeout(() => setVisibleSourceCount(2), 1550);
    const t3 = setTimeout(() => setVisibleSourceCount(3), 2200);
    const t4 = setTimeout(() => setVisibleSourceCount(4), 2850);
    const t5 = setTimeout(() => setSourcesDone(true), 3250);

    sourcesTimersRef.current = [t0, t1, t2, t3, t4, t5];

    return () => {
      sourcesTimersRef.current.forEach(clearTimeout);
      sourcesTimersRef.current = [];
    };
  }, [activeStep, hasEntered, inView]);

  // Re-trigger icon pop animation periodically if user stays on Card 1 while on screen
  useEffect(() => {
    if (!manualOverride || activeStep !== 0) return;
    if (!hasEntered || !inView) return;
    const interval = setInterval(() => {
      setCycleKey((k) => k + 1);
    }, 5500);
    return () => clearInterval(interval);
  }, [manualOverride, activeStep, hasEntered, inView]);

  // Restart the story at step 01 on every landing (entry or re-entry)
  useEffect(() => {
    const wasVisible = prevInViewRef.current;
    prevInViewRef.current = inView;
    if (!hasEntered || !inView || wasVisible || manualOverride) return;
    setActiveStep(0);
    setTypedText('');
    setSourcesExpanded(false);
    setCycleKey((k) => k + 1);
  }, [inView, hasEntered, manualOverride]);

  // Handle manual tab/card selection
  const handleSelectStep = (index: number) => {
    setActiveStep(index);
    setManualOverride(true);
    if (index === 0) {
      setCycleKey((k) => k + 1);
    } else if (index === 1) {
      setTypedText(fullPrompt);
    } else if (index === 2) {
      setSourcesExpanded(false);
    }
    // Re-enable auto-cycling after 10 seconds of user inactivity
    setTimeout(() => {
      setManualOverride(false);
    }, 10000);
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="flex flex-col items-center px-4 sm:px-6 py-12 sm:py-20 bg-[#fdfdfc] w-full max-w-full overflow-hidden scroll-mt-24">
      <div className="flex w-full max-w-300 flex-col gap-8 sm:gap-10">
        {/* Header Lines */}
        <div data-section-anchor="true" className="max-w-2xl text-xl sm:text-2xl md:text-[28px] font-medium leading-[1.35] tracking-[-0.03em]">
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
                  className={`text-xs font-semibold tabular-nums lining-nums transition-colors duration-300 relative -top-1.5 ${
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
        <div className="grid grid-cols-1 gap-10 sm:gap-16 md:gap-6 md:grid-cols-3">
          {/* Card 1: Integrate */}
          <div
            onClick={() => handleSelectStep(0)}
            className="flex flex-col gap-6 sm:gap-8 cursor-pointer group"
          >
            {/* Visual Box */}
            <div className="relative w-full">
              <div
                className={`relative flex h-75 w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
                  activeStep === 0
                    ? 'border-[#cfceca] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05),inset_0_0_0_3.5px_#f9f9f8]'
                    : 'group-hover:border-[#cfceca]'
                }`}
              >
                {/* 15 Integration Icons Grid (fixed 5-col grid = identical layout at every viewport) */}
                <div className="grid size-full grid-cols-5 place-items-center content-center gap-6 px-6 py-6 text-[#21201c]">
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
                        className="flex size-10 items-center justify-center"
                        title={name}
                      >
                        <Icon className="size-5 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Subtle bottom fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-linear-to-t from-[#fdfdfc] from-22% to-transparent"
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
                className={`relative flex h-75 w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
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
                  <div className="w-full max-w-67.5 rounded-2xl border border-[#e2e1de] bg-white p-3.5 shadow-[0px_1px_4px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-20.5 mt-0.5">
                    <div className="text-[14px] font-normal text-[#21201c] tracking-[-0.01em] flex items-center min-h-5.5">
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
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-linear-to-t from-[#fdfdfc] from-22% to-transparent"
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
                className={`relative flex h-75 w-full overflow-hidden rounded-xl border border-[#e2e1de] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-300 ${
                  activeStep === 2
                    ? 'border-[#cfceca] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.05),inset_0_0_0_3.5px_#f9f9f8]'
                    : 'group-hover:border-[#cfceca]'
                }`}
              >
                {/* Source Footer Visual Box with scripted loading sequence */}
                <div
                  role="status"
                  aria-live="polite"
                  className="flex size-full flex-col items-center justify-center px-6 py-8 select-none"
                >
                  <div
                    onClick={(e) => {
                      if (!sourcesDone) return;
                      e.stopPropagation();
                      setSourcesExpanded((prev) => !prev);
                    }}
                    className={`flex items-center text-sm md:text-[15px] select-none transition-colors ${
                      sourcesDone
                        ? 'cursor-pointer group/sources'
                        : 'cursor-default pointer-events-none'
                    }`}
                  >
                    {/* Label Container (snug width, seamless crossfade) */}
                    <div className="relative inline-flex items-center">
                      {/* Done state text (in-flow when sourcesDone) */}
                      <span
                        className={`shrink-0 font-normal transition-all duration-350 ease-out ${
                          sourcesDone
                            ? 'opacity-100 translate-y-0 text-[#21201c]'
                            : 'opacity-0 translate-y-1.5 absolute left-0 pointer-events-none'
                        }`}
                      >
                        4 sources used
                      </span>

                      {/* Loading state text with shimmer (in-flow when !sourcesDone) */}
                      <span
                        className={`shrink-0 font-normal transition-all duration-350 ease-out ${
                          !sourcesDone
                            ? sourcesStepActive
                              ? 'opacity-100 translate-y-0 source-shimmer-active'
                              : 'opacity-100 translate-y-0 text-[#8d8d86]'
                            : 'opacity-0 -translate-y-1.5 absolute left-0 pointer-events-none'
                        }`}
                      >
                        Searching sources…
                      </span>
                    </div>

                    {/* Icons & Probe Dot Container */}
                    <div className="flex items-center">
                      {sourceIconsList.map(({ id, name, Icon, className }, index) => {
                        const isRevealed = sourcesDone || visibleSourceCount > index;
                        const isPopping =
                          sourcesStepActive && !sourcesDone && visibleSourceCount === index + 1;

                        if (!isRevealed) return null;

                        return (
                          <div
                            key={id}
                            title={name}
                            className={`inline-flex items-center justify-center shrink-0 size-6.5 ${
                              index === 0 ? 'ml-2 sm:ml-2.5' : 'ml-1.5 sm:ml-2'
                            }`}
                          >
                            <div
                              className={`size-6.5 shrink-0 flex items-center justify-center ${
                                isPopping
                                  ? 'source-icon-pop'
                                  : 'opacity-100 scale-100'
                              }`}
                            >
                              <Icon className={`size-6.5 shrink-0 ${className || ''}`} />
                            </div>
                          </div>
                        );
                      })}

                      {/* 6px Muted Circle Probe Dot */}
                      {!sourcesDone && (
                        <div
                          className="inline-flex items-center justify-center shrink-0 ml-2"
                          aria-hidden="true"
                        >
                          <span
                            className={`size-1.5 rounded-full bg-[#8d8d86] shrink-0 ${
                              sourcesStepActive ? 'source-probe-pulse' : 'opacity-50'
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Chevron: hidden when loading, fades and slides in when done */}
                    <div
                      className={`inline-flex items-center shrink-0 transition-all duration-300 ease-out ml-2.5 ${
                        sourcesDone
                          ? 'opacity-100 translate-x-0 delay-100'
                          : 'opacity-0 -translate-x-1 pointer-events-none'
                      }`}
                      aria-hidden={!sourcesDone}
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-[#8d8d86] transition-transform duration-200 group-hover/sources:text-[#21201c] ${
                          sourcesExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expandable sources preview */}
                  {sourcesDone && sourcesExpanded && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 animate-fadeIn">
                      {sourceIconsList.map(({ id, name, Icon, className }) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f4f2] text-xs font-normal text-[#63635e] border border-[#e2e1de]"
                        >
                          <Icon className={`size-3.5 shrink-0 ${className || ''}`} />
                          <span>{name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Subtle bottom fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-2 -bottom-2 h-24 bg-linear-to-t from-[#fdfdfc] from-22% to-transparent"
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

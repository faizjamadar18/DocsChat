'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { NotionIcon, GoogleDriveIcon, LinearIcon, GmailIcon, GitHubIcon, GoogleDocsIcon, GoogleSlidesIcon, HubSpotIcon, SlackIcon } from './Icons';

interface Source {
  index: number;
  title: string;
  provider: string;
}

interface Example {
  id: string;
  number: string;
  title: string;
  userMessage: string;
  actionsCount: number;
  reasoningSteps: string[];
  assistantText: string;
  sources: Source[];
}

const EXAMPLES: Example[] = [
  {
    id: 'resolve-contradictions',
    number: '01',
    title: 'Resolve contradictions',
    userMessage: 'What is our SLA response time for Enterprise customers?',
    actionsCount: 5,
    reasoningSteps: [
      'Searching connected sources for Enterprise SLA response time…',
      'Found Support Handbook (Notion): 4-hour first response for Enterprise tier',
      'Found MSA templates (Google Drive): 2-hour first response clause',
      'Read the Linear SLA implementation issue: currently specifies a 4-hour first response',
      'Sources conflict — drafting message to Martin Olsen for clarification',
    ],
    assistantText: 'I found conflicting information across our systems. The Support Handbook in Notion states 4 hours [1], but the recently updated MSA templates in Google Drive say 2 hours [2]. The SLA implementation issue in Linear still specifies a 4-hour first response [3].\n\nI\'ll reach out to Martin Olsen (Head of Support) to clarify which is correct.',
    sources: [
      { index: 1, title: 'Support Handbook', provider: 'notion' },
      { index: 2, title: 'MSA templates', provider: 'google-drive' },
      { index: 3, title: 'SLA implementation issue', provider: 'linear' },
      { index: 4, title: 'Support email thread', provider: 'gmail' },
    ],
  },
  {
    id: 'understand-company-policies',
    number: '02',
    title: 'Understand company policies',
    userMessage: 'How many days of parental leave do we offer?',
    actionsCount: 4,
    reasoningSteps: [
      'Searching Google Drive for parental leave policy…',
      'Found 16 weeks primary caregiver / 8 weeks secondary caregiver',
      'Cross-referencing employee handbook family leave section',
      'Verified policy applies to US full-time employees',
    ],
    assistantText: 'Primary caregivers receive 16 weeks of paid parental leave [1]. Secondary caregivers receive 8 weeks [1].\n\nThis matches what is listed in the parental leave policy in Google Drive for US employees and the employee handbook section on family leave [2].',
    sources: [
      { index: 1, title: 'Parental leave policy', provider: 'google-drive' },
      { index: 2, title: 'Employee Handbook', provider: 'notion' },
    ],
  },
  {
    id: 'find-the-owner',
    number: '03',
    title: 'Find the owner',
    userMessage: 'Who owns the billing integration?',
    actionsCount: 3,
    reasoningSteps: [
      'Checking code ownership for /billing in GitHub…',
      'Cross-referencing with Notion team directory',
      'Confirmed last PR merged by Elena Rostov',
    ],
    assistantText: 'Elena Rostov (Staff Engineer, Core Platform) owns the billing integration [1].\n\nShe merged the latest Stripe webhook update and is listed as the CODEOWNER for `/services/billing` in GitHub [2]. For urgent billing issues, the team monitors #platform-eng [3].',
    sources: [
      { index: 1, title: 'GitHub CODEOWNERS', provider: 'github' },
      { index: 2, title: 'Team Directory', provider: 'notion' },
      { index: 3, title: '#platform-eng', provider: 'slack' },
    ],
  },
  {
    id: 'catch-up-on-decisions',
    number: '04',
    title: 'Catch up on decisions',
    userMessage: 'Summarize the latest QBR',
    actionsCount: 4,
    reasoningSteps: [
      'Finding Q3 QBR slide deck in Google Drive…',
      'Extracting key metrics and executive summaries',
      'Reviewing QBR action items in Notion',
    ],
    assistantText: 'Here is the executive summary from the Q3 QBR [1]:\n\n• ARR reached $14.2M (+28% YoY), driven by Enterprise expansion.\n• Net Revenue Retention stood at 118%.\n• Key priorities for Q4: launch SOC 2 certification and roll out the EU cloud deployment [2].',
    sources: [
      { index: 1, title: 'Q3 Executive Deck', provider: 'google-slides' },
      { index: 2, title: 'Q4 Strategic Goals', provider: 'notion' },
    ],
  },
  {
    id: 'semantic-search',
    number: '05',
    title: 'Semantic search',
    userMessage: 'Find everything we have on SSO for enterprise customers',
    actionsCount: 3,
    reasoningSteps: [
      'Querying Notion knowledge base for SAML and SSO guides…',
      'Searching Google Drive for customer-facing documentation',
      'Reading auth-service repository documentation',
    ],
    assistantText: 'I found three relevant documents ranked by freshness:\n\n1. Enterprise SSO setup guide (Notion) — step-by-step SAML configuration [1]\n2. SSO FAQ for sales (Google Drive) — customer answers [2]\n3. auth-service README (GitHub) — technical details [3]\n\nThe Notion guide is the most up to date.',
    sources: [
      { index: 1, title: 'Enterprise SSO Guide', provider: 'notion' },
      { index: 2, title: 'SSO FAQ for Sales', provider: 'google-drive' },
      { index: 3, title: 'auth-service README', provider: 'github' },
    ],
  },
  {
    id: 'onboard-faster',
    number: '06',
    title: 'Onboard faster',
    userMessage: 'What should I do in my first week as a new engineer?',
    actionsCount: 4,
    reasoningSteps: [
      'Opening engineering onboarding hub in Notion…',
      'Building first-week checklist from onboarding tasks',
      'Pulling dev environment setup doc from Google Docs',
    ],
    assistantText: 'Here is your first-week checklist from our onboarding hub [1]:\n\n• Complete dev environment setup (Day 1–2) [2]\n• Schedule intro 1:1s with your manager and onboarding buddy\n• Read the architecture overview and deploy a test change to staging\n• Join #eng-onboarding and introduce yourself',
    sources: [
      { index: 1, title: 'Engineering Onboarding', provider: 'notion' },
      { index: 2, title: 'Dev Setup Guide', provider: 'google-docs' },
    ],
  },
  {
    id: 'reconcile-definitions',
    number: '07',
    title: 'Reconcile definitions',
    userMessage: "What's the difference between ARR and MRR in our board deck?",
    actionsCount: 3,
    reasoningSteps: [
      'Looking up ARR and MRR definitions in Finance glossary…',
      'Cross-checking usage in latest board deck slides',
    ],
    assistantText: 'Per our Finance glossary [1] and the latest board deck [2]:\n\n• MRR — monthly recurring revenue; annual contracts are divided by 12\n• ARR — annualized run rate; MRR × 12, excluding one-time fees\n\nThe board deck uses ARR for growth targets and MRR for operational dashboards.',
    sources: [
      { index: 1, title: 'Finance glossary', provider: 'notion' },
      { index: 2, title: 'Q3 board deck', provider: 'google-slides' },
    ],
  },
  {
    id: 'surface-tacit-knowledge',
    number: '08',
    title: 'Surface tacit knowledge',
    userMessage: 'Why did we deprecate the legacy auth flow?',
    actionsCount: 3,
    reasoningSteps: [
      'Searching for legacy auth deprecation context…',
      'Reading decision log entry in Notion',
      'Reviewing ADR-042 on GitHub',
    ],
    assistantText: 'The legacy auth flow was deprecated in March for three reasons [1][2]:\n\n• Security audit flagged session handling gaps\n• Maintenance cost exceeded 20% of platform eng capacity\n• OAuth 2.1 migration was already planned for H2\n\nThe decision was recorded in #platform-architecture and documented in ADR-042 [2].',
    sources: [
      { index: 1, title: 'Decision Log', provider: 'notion' },
      { index: 2, title: 'ADR-042', provider: 'github' },
    ],
  },
  {
    id: 'track-work-across-tools',
    number: '09',
    title: 'Track work across tools',
    userMessage: "What's the status of the mobile redesign?",
    actionsCount: 3,
    reasoningSteps: [
      'Checking mobile redesign epic progress in Linear…',
      'Epic is 62% complete with 14 of 23 issues done',
      'Found updated design spec in Google Drive from yesterday',
    ],
    assistantText: 'The mobile redesign epic is 62% complete in Linear [1]. The latest design spec was updated yesterday [2].\n\nDesign flagged a blocker in #mobile-redesign: navigation patterns need sign-off from Accessibility before engineering can proceed [3].',
    sources: [
      { index: 1, title: 'Linear Epic', provider: 'linear' },
      { index: 2, title: 'Design Spec', provider: 'google-drive' },
      { index: 3, title: '#mobile-redesign', provider: 'slack' },
    ],
  },
  {
    id: 'prep-for-customer-call',
    number: '10',
    title: 'Prep for a customer call',
    userMessage: 'Brief me on Acme Corp before tomorrow\'s call',
    actionsCount: 4,
    reasoningSteps: [
      'Pulling Acme Corp account record from HubSpot…',
      'Reviewing open customer issues in Linear',
      'Scanning recent email thread for key updates',
    ],
    assistantText: 'Acme Corp — Enterprise account, $240k ARR [1]\n\n• Last contact: QBR three weeks ago; champion is Dana Reeves (VP Ops)\n• Open issues: 2 issues in Linear — SSO provisioning delay (P2), export timeout (P3) [2]\n• Feature requests: Bulk user import, custom reporting dashboard',
    sources: [
      { index: 1, title: 'HubSpot Account', provider: 'hubspot' },
      { index: 2, title: 'Linear Issues', provider: 'linear' },
      { index: 3, title: 'QBR Thread', provider: 'gmail' },
    ],
  },
  {
    id: 'find-the-latest-version',
    number: '11',
    title: 'Find the latest version',
    userMessage: 'Which brand guidelines doc is current?',
    actionsCount: 2,
    reasoningSteps: [
      'Searching Google Drive for brand guidelines documents…',
      'Identified Brand Guidelines v3.2 as latest (updated Oct 12)',
    ],
    assistantText: 'Brand Guidelines v3.2 in Google Drive is the current canonical version [1]. It was last updated October 12 and linked from the design system Notion page [2].\n\nOlder v2 copies in the shared Brand folder are archived and deprecated.',
    sources: [
      { index: 1, title: 'Brand Guidelines v3.2', provider: 'google-drive' },
      { index: 2, title: 'Design System Hub', provider: 'notion' },
    ],
  },
];

export default function UseCases() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % EXAMPLES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeExample = EXAMPLES[activeIndex];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'notion':
        return <NotionIcon className="size-3 text-[#21201c]" />;
      case 'google-drive':
        return <GoogleDriveIcon className="size-3" />;
      case 'google-docs':
        return <GoogleDocsIcon className="size-3" />;
      case 'google-slides':
        return <GoogleSlidesIcon className="size-3" />;
      case 'linear':
        return <LinearIcon className="size-3 text-[#5E6AD2]" />;
      case 'gmail':
        return <GmailIcon className="size-3" />;
      case 'github':
        return <GitHubIcon className="size-3 text-[#21201c]" />;
      case 'slack':
        return <SlackIcon className="size-3" />;
      case 'hubspot':
        return <HubSpotIcon className="size-3 text-[#ff7a59]" />;
      default:
        return <NotionIcon className="size-3 text-[#21201c]" />;
    }
  };

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="grid w-full max-w-300 grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Heading and 11 Interactive Tabs */}
        <div className="flex flex-col md:col-span-4 gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.03em] text-[#21201c]">
              Reliable results.
              <br />
              <span className="text-[#63635e]">For everything.</span>
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-[#e2e1de] border-y border-[#e2e1de]">
            {EXAMPLES.map((example, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsPaused(true);
                  }}
                  className={`group relative flex items-center justify-between py-3.5 px-2 text-left transition-colors cursor-pointer ${
                    isActive ? 'text-[#21201c] font-semibold' : 'text-[#63635e] hover:text-[#21201c]'
                  }`}
                >
                  <span className="text-sm tracking-[-0.01em]">{example.title}</span>
                  <span className={`text-xs font-mono ${isActive ? 'text-[#ff6a00]' : 'text-[#8d8d86]'}`}>
                    {example.number}
                  </span>

                  {/* Active highlight indicator bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6a00]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Chat Preview Pane */}
        <div className="w-full md:col-span-8">
          <div
            className="w-full rounded-2xl border border-[#e2e1de] bg-[#ffffff] p-6 md:p-8 shadow-sm flex flex-col gap-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* User Query */}
            <div className="flex items-start gap-3">
              <div className="relative size-8 rounded-full overflow-hidden shrink-0 bg-[#e9e8e6]">
                <Image
                  src="/images/jane-doe-avatar.webp"
                  alt="You"
                  width={32}
                  height={32}
                  className="object-cover size-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#63635e]">You</span>
                <p className="text-sm md:text-base text-[#21201c] font-medium leading-relaxed">
                  {activeExample.userMessage}
                </p>
              </div>
            </div>

            {/* Assistant Answer */}
            <div className="flex items-start gap-3 border-t border-[#e2e1de] pt-5">
              <div className="size-8 rounded-full bg-[#f97316] text-[#ffffff] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold">A</span>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#63635e]">Assistant</span>
                  <span className="text-xs text-[#8d8d86] font-medium bg-[#f9f9f8] px-2 py-0.5 rounded border border-[#e2e1de]">
                    Completed {activeExample.actionsCount} actions
                  </span>
                </div>

                <div className="text-sm text-[#21201c] leading-relaxed whitespace-pre-line font-normal">
                  {activeExample.assistantText}
                </div>

                {/* Sources Footnote Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#e2e1de]/60 text-xs text-[#63635e]">
                  <span className="text-[#8d8d86] font-medium">
                    {activeExample.sources.length} sources used:
                  </span>
                  {activeExample.sources.map((src) => (
                    <div
                      key={src.index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f9f9f8] border border-[#e2e1de] text-xs font-medium text-[#21201c] hover:bg-[#f1f0ef] transition-colors cursor-pointer"
                    >
                      {getProviderIcon(src.provider)}
                      <span>{src.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

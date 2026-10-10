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
    title: 'Cross-source synthesis',
    userMessage: 'What are our vector indexing specs and database migration requirements across Notion and GitHub?',
    actionsCount: 3,
    reasoningSteps: [
      'Querying connected workspace sources for Qdrant indexing and migration specs…',
      'Retrieved Qdrant Migration RFC from Notion: 768-dim embeddings with gemini-embedding-2',
      'Retrieved backend/app/vector_store.py from GitHub: payload indexing on workspace_id',
      'Synthesizing verified specifications with citation anchors',
    ],
    assistantText: 'According to the Qdrant Migration RFC in Notion [1], all vector embeddings are standardized to 768 dimensions using Google\'s gemini-embedding-2 model.\n\nIn the GitHub backend repository [2], payload schema indexes are configured on workspace_id to guarantee tenant isolation, and daily snapshot policies are documented in the Architecture Spec [3].',
    sources: [
      { index: 1, title: 'Qdrant Migration RFC', provider: 'notion' },
      { index: 2, title: 'backend/app/vector_store.py', provider: 'github' },
      { index: 3, title: 'Architecture_Spec.pdf', provider: 'google-drive' },
    ],
  },
  {
    id: 'scoped-mention',
    number: '02',
    title: 'Scoped @ document queries',
    userMessage: '@Q3_Financial_Audit.pdf What was our cloud infrastructure expenditure in Q3?',
    actionsCount: 2,
    reasoningSteps: [
      'Scoping retrieval strictly to attached scope: Q3_Financial_Audit.pdf',
      'Extracting financial breakdown table from page 14',
      'Verifying line items for Qdrant Cloud, Render, and Vercel hosting',
    ],
    assistantText: 'Based strictly on Q3_Financial_Audit.pdf [1]:\n\n• Total cloud infrastructure expenditure was $48,250 in Q3.\n• Primary line items: Vector search infrastructure on Qdrant Cloud ($18,400) and GPU inference workloads ($22,600).\n• Overall infrastructure costs decreased 12% quarter-over-quarter following index payload optimizations.',
    sources: [
      { index: 1, title: 'Q3_Financial_Audit.pdf (p. 14)', provider: 'google-docs' },
    ],
  },
  {
    id: 'codebase-exploration',
    number: '03',
    title: 'GitHub codebase exploration',
    userMessage: 'How are authentication tokens handled and refreshed in our FastAPI backend?',
    actionsCount: 3,
    reasoningSteps: [
      'Searching GitHub repository for auth middleware and JWT lifecycle…',
      'Inspected backend/app/auth/jwt.py and auth router endpoints',
      'Cross-referenced OAuth token exchange for Google, Notion, and GitHub',
    ],
    assistantText: 'In our GitHub repository [1]:\n\n• JWT access tokens expire after 60 minutes and are signed with HS256 [1].\n• Connector tokens (Google, Notion, GitHub) are encrypted at rest with AES-256 and stored in the workspaces collection [2].\n• The refresh endpoint verifies session status before issuing renewed bearer tokens [1].',
    sources: [
      { index: 1, title: 'backend/app/auth/jwt.py', provider: 'github' },
      { index: 2, title: 'backend/app/models/connectors.py', provider: 'github' },
    ],
  },
  {
    id: 'notion-knowledge',
    number: '04',
    title: 'Notion knowledge retrieval',
    userMessage: 'What is our team policy on production database migrations?',
    actionsCount: 3,
    reasoningSteps: [
      'Accessing synced Notion workspace database…',
      'Found Engineering Playbook > Database Migrations guideline',
      'Confirmed staging dry-run requirements and rollback plans',
    ],
    assistantText: 'Per the Engineering Playbook in Notion [1]:\n\n• All database migrations require an automated dry-run on staging before production execution.\n• Migrations must include an idempotent rollback script tested in CI [1].\n• Zero-downtime dual-writes are mandatory for collection renames or vector re-indexing [2].',
    sources: [
      { index: 1, title: 'Engineering Playbook', provider: 'notion' },
      { index: 2, title: 'RFC: Zero-Downtime Schema Updates', provider: 'notion' },
    ],
  },
  {
    id: 'drive-deep-search',
    number: '05',
    title: 'Google Drive deep search',
    userMessage: 'Find the latest enterprise security review deck in Google Drive',
    actionsCount: 3,
    reasoningSteps: [
      'Scanning connected Google Drive folders…',
      'Identified Enterprise Security Review 2026.gslides updated last week',
      'Verified SOC 2 and vector tenancy compliance slides',
    ],
    assistantText: 'The latest presentation is Enterprise Security Review 2026 in Google Drive [1].\n\nKey highlights:\n• Multi-tenant collection isolation in Qdrant Cloud [1]\n• Google OAuth 2.0 authentication architecture [2]\n• Enterprise zero-retention compliance policies for Google GenAI and Groq LLM queries',
    sources: [
      { index: 1, title: 'Enterprise Security Review 2026', provider: 'google-slides' },
      { index: 2, title: 'Security Architecture Diagram', provider: 'google-drive' },
    ],
  },
  {
    id: 'studio-co-writer',
    number: '06',
    title: 'Studio AI co-writing',
    userMessage: 'Draft a technical proposal for our new MCP connector based on our design docs',
    actionsCount: 4,
    reasoningSteps: [
      'Reading MCP protocol specifications from Notion…',
      'Extracting SSE endpoint requirements and tool schemas',
      'Drafting structured proposal formatted for Studio block editor',
    ],
    assistantText: 'Here is an outline drafted directly for Studio Canvas [1]:\n\n# Model Context Protocol (MCP) Integration\n## 1. Overview\nEnable desktop AI clients (Claude Desktop, Cursor) to discover and query DocsChat workspace knowledge.\n\n## 2. Protocol Details\n• SSE transport running on `/api/mcp/sse`\n• Workspace tool `search_knowledge_base` with hybrid semantic scoring [2].',
    sources: [
      { index: 1, title: 'Studio Canvas: MCP RFC', provider: 'google-docs' },
      { index: 2, title: 'MCP Specification Spec', provider: 'notion' },
    ],
  },
  {
    id: 'pdf-analysis',
    number: '07',
    title: 'PDF & research paper analysis',
    userMessage: 'Summarize the chunking methodology and similarity metrics used in the benchmark paper',
    actionsCount: 3,
    reasoningSteps: [
      'Analyzing uploaded document benchmark_eval_2026.pdf…',
      'Extracted Section 3.2: Chunking strategy and cosine similarity evaluation',
      'Cross-checked benchmark results against baseline RAG pipelines',
    ],
    assistantText: 'From benchmark_eval_2026.pdf [1]:\n\n• The benchmark employs a recursive character chunker with 800-token chunks and 150-token overlap [1].\n• Cosine similarity over 768-dimensional embeddings yielded 94.2% Mean Reciprocal Rank (MRR).\n• Dynamic query expansion improved multi-document recall by 18.5% [2].',
    sources: [
      { index: 1, title: 'benchmark_eval_2026.pdf (p. 6)', provider: 'google-docs' },
      { index: 2, title: 'Benchmark Appendix B', provider: 'google-docs' },
    ],
  },
  {
    id: 'voice-agent',
    number: '08',
    title: 'Real-time voice agent',
    userMessage: 'Can you give me a 30-second audio briefing on today\'s deployment plan?',
    actionsCount: 2,
    reasoningSteps: [
      'Pulling daily deployment manifest from GitHub and Notion…',
      'Synthesizing concise, voice-optimized verbal briefing',
      'Streaming synthesized audio via Vapi AI integration',
    ],
    assistantText: 'Today\'s deployment is scheduled for 4:00 PM UTC [1]. It includes the Qdrant Cloud collection payload index migration and the new selective repository picker for GitHub connectors [2]. Staging smoke tests passed with zero errors.',
    sources: [
      { index: 1, title: 'Deployment Manifest', provider: 'github' },
      { index: 2, title: 'Release Notes v2.4', provider: 'notion' },
    ],
  },
  {
    id: 'mcp-integration',
    number: '09',
    title: 'Model Context Protocol (MCP)',
    userMessage: 'How do I connect Claude Desktop to my DocsChat workspace?',
    actionsCount: 3,
    reasoningSteps: [
      'Loading MCP server settings and workspace endpoint configuration…',
      'Generating claude_desktop_config.json configuration snippet',
    ],
    assistantText: 'To connect Claude Desktop [1]:\n\n1. Open your DocsChat workspace settings and copy your unique MCP Server URL [1].\n2. In `claude_desktop_config.json`, add your DocsChat MCP server under `mcpServers`.\n3. Restart Claude Desktop. Claude can now search and cite your DocsChat documents in real time [2].',
    sources: [
      { index: 1, title: 'MCP Setup Guide', provider: 'notion' },
      { index: 2, title: 'McpConnectModal.tsx', provider: 'github' },
    ],
  },
  {
    id: 'transparent-citations',
    number: '10',
    title: 'Transparent citation audit',
    userMessage: 'Where did the claim about SOC 2 certification come from?',
    actionsCount: 2,
    reasoningSteps: [
      'Locating cited passage in workspace vector index…',
      'Extracted exact chunk text, page offset, and similarity score (0.91)',
    ],
    assistantText: 'That statement is directly cited from Enterprise Security Review 2026 (Slide 12) [1]:\n\n"DocsChat guarantees data isolation per workspace in Qdrant Cloud and utilizes SOC 2 Type II certified cloud infrastructure."\n\nYou can click citation [1] to view the raw chunk excerpt in the Source Drawer.',
    sources: [
      { index: 1, title: 'Enterprise Security Review (Slide 12)', provider: 'google-slides' },
      { index: 2, title: 'Source Drawer: Chunk #1042', provider: 'google-drive' },
    ],
  },
  {
    id: 'multi-model-reasoning',
    number: '11',
    title: 'Multi-model intelligence',
    userMessage: 'Compare Gemini 2.5 Flash and Groq Llama 3.3 for workspace queries',
    actionsCount: 2,
    reasoningSteps: [
      'Retrieving model capability specifications and response latency metrics…',
    ],
    assistantText: 'In DocsChat, you can switch models anytime from the top bar [1]:\n\n• Google Gemini 2.5 Flash: Optimized for deep document grounding, complex multimodal synthesis, and large context windows.\n• Groq Llama 3.3 70B: Delivers ultra-low latency inference (sub-200ms TTFT) for lightning-fast iterative conversations [2].',
    sources: [
      { index: 1, title: 'Model Configuration Spec', provider: 'notion' },
      { index: 2, title: 'backend/app/llm_router.py', provider: 'github' },
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
              Verifiable answers.
              <br />
              <span className="text-[#63635e]">Grounded in your content.</span>
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
                  <span className="text-xs font-semibold text-[#63635e]">Ora AI</span>
                  <span className="text-xs text-[#8d8d86] font-medium bg-[#f9f9f8] px-2 py-0.5 rounded border border-[#e2e1de]">
                    Synthesized from {activeExample.sources.length} sources
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

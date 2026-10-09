'use client';
import type { ComponentType } from 'react';
import {
  ClaudeIcon,
  GrokIcon,
  ChatGptIcon,
  CursorIcon,
  PerplexityIcon,
  MistralIcon,
  GeminiIcon,
  CopilotIcon,
  ManusIcon,
} from '@/components/connectors/ConnectorIcons';

export type McpProviderStatus = 'ready' | 'soon';

export interface McpProvider {
  id: string;
  name: string;
  tagline: string;
  about: string;
  needs: string[];
  steps: string[];
  status: McpProviderStatus;
  paidNote?: string;
  authNote: string;
  /** Show the Personal keys manager inside this provider's drawer. */
  requiresKey: boolean;
  icon: ComponentType<{ className?: string }>;
}

export const MCP_PROVIDERS: McpProvider[] = [
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Answer from your docs inside Claude',
    about:
      'Connect Claude to your DocsChat workspace so it can search your PDFs, Studio documents and connected sources, then answer with source names and page numbers. Read-only — Claude can never edit or delete anything.',
    needs: [
      'At least one document or PDF in your workspace',
      'A Claude account (the free plan works — it includes one custom connector)',
    ],
    steps: [
      'In Claude, open Settings, then Connectors.',
      'Click Add custom connector and paste your server URL.',
      'Click Add, then Connect, and sign in with DocsChat when asked.',
      'Ask Claude something about your documents to test it.',
    ],
    status: 'ready',
    authNote:
      'Claude will ask you to sign in with DocsChat once when you add it. If sign-in is not offered, create a personal key in this panel and add it as an Authorization bearer header in the connector advanced settings.',
    requiresKey: true,
    icon: ClaudeIcon,
  },
  {
    id: 'grok',
    name: 'Grok',
    tagline: 'Answer from your docs inside Grok',
    about:
      'Connect Grok to your DocsChat workspace so it can search your PDFs, Studio documents and connected sources, then answer with source names and page numbers. Read-only — Grok can never edit or delete anything.',
    needs: [
      'At least one document or PDF in your workspace',
      'A personal key created in the keys section below',
    ],
    steps: [
      'Go to grok.com/connectors and click New Connector, then Custom.',
      'Paste your server URL.',
      'When Grok asks for authentication, paste ypur personal key.',
      'Ask Grok something about your documents to test it.',
    ],
    status: 'ready',
    paidNote:
      'Free Grok accounts can usually add custom connectors within usage limits. Heavy use may need a paid plan on their side.',
    authNote:
      'Grok authenticates with a personal key. Create one in this panel and paste it when Grok asks for a bearer token.',
    requiresKey: true,
    icon: GrokIcon,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'Use your workspace as a ChatGPT tool',
    about:
      'ChatGPT will be able to use your DocsChat workspace as a tool — searching your PDFs and Studio documents and answering with citations, just like our Claude connection does today. Read-only, as always.',
    needs: [
      'A paid ChatGPT plan on your side — OpenAI only allows custom connectors on paid plans',
      'At least one document or PDF in your workspace',
    ],
    steps: [],
    status: 'soon',
    paidNote:
      'Custom connectors in ChatGPT need a paid plan (Plus or higher) on your side.',
    authNote: '',
    requiresKey: false,
    icon: ChatGptIcon,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    tagline: 'Pull workspace answers into your editor',
    about:
      'Cursor will be able to consult your DocsChat workspace right inside the editor — grounding its code answers in your PDFs, specs and Studio documents. Read-only, as always.',
    needs: [
      'Cursor installed on your machine',
      'Your server URL, which will be shown here once this connector launches',
    ],
    steps: [],
    status: 'soon',
    authNote: '',
    requiresKey: false,
    icon: CursorIcon,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    tagline: 'Research over your own documents',
    about:
      'Perplexity will be able to research across your DocsChat workspace alongside web search — answering from your PDFs and Studio documents with citations. Read-only, as always.',
    needs: [
      'A paid Perplexity plan on your side — Perplexity only allows custom connectors on paid plans',
      'At least one document or PDF in your workspace',
    ],
    steps: [],
    status: 'soon',
    paidNote:
      'Custom connectors in Perplexity need a paid plan (Pro or higher) on your side.',
    authNote: '',
    requiresKey: false,
    icon: PerplexityIcon,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    tagline: 'Ask Le Chat about your workspace',
    about:
      'Mistral Le Chat will be able to answer from your DocsChat workspace — searching your PDFs and Studio documents with citations. Read-only, as always.',
    needs: ['At least one document or PDF in your workspace'],
    steps: [],
    status: 'soon',
    authNote: '',
    requiresKey: false,
    icon: MistralIcon,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    tagline: 'Ground Gemini in your documents',
    about:
      'Gemini will be able to consult your DocsChat workspace before answering — grounding its responses in your PDFs and Studio documents with citations. Read-only, as always.',
    needs: ['At least one document or PDF in your workspace'],
    steps: [],
    status: 'soon',
    authNote: '',
    requiresKey: false,
    icon: GeminiIcon,
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    tagline: 'Bring your workspace into Copilot',
    about:
      'Microsoft Copilot will be able to search and query your DocsChat workspace — retrieving information from your uploaded PDFs, Studio documents, and connected sources to answer questions with verifiable citations inside Microsoft 365. Read-only, as always.',
    needs: [
      'A Microsoft Copilot license (Copilot for Microsoft 365 or Copilot Pro)',
      'At least one document or PDF in your workspace',
    ],
    steps: [],
    status: 'soon',
    paidNote:
      'Custom MCP connectors in Microsoft Copilot may require an active Microsoft 365 Copilot license on your side.',
    authNote: '',
    requiresKey: false,
    icon: CopilotIcon,
  },
  {
    id: 'manus',
    name: 'Manus',
    tagline: 'Let your AI agent work from your docs',
    about:
      'Manus AI will be able to autonomously read and analyze your DocsChat workspace — executing multi-step research and workflows grounded in your uploaded documents and notes. Read-only, as always.',
    needs: [
      'A Manus account with agent connector support',
      'At least one document or PDF in your workspace',
    ],
    steps: [],
    status: 'soon',
    authNote: '',
    requiresKey: false,
    icon: ManusIcon,
  },
];


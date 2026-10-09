'use client';
import { createElement, type ComponentType } from 'react';
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
  GenericIcon,
} from '@/components/connectors/ConnectorIcons';
import { api } from '@/lib/api';

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

type IconComponent = ComponentType<{ className?: string }>;

/** Brand marks live in the frontend; copy/status live in the backend. */
const MCP_ICONS: Record<string, IconComponent> = {
  claude: ClaudeIcon,
  grok: GrokIcon,
  chatgpt: ChatGptIcon,
  cursor: CursorIcon,
  perplexity: PerplexityIcon,
  mistral: MistralIcon,
  gemini: GeminiIcon,
  copilot: CopilotIcon,
  manus: ManusIcon,
};

interface McpProviderPayload {
  id: string;
  name: string;
  tagline: string;
  about: string;
  needs: string[];
  steps: string[];
  status: McpProviderStatus;
  paid_note?: string;
  auth_note: string;
  requires_key: boolean;
}

/**
 * Load the provider catalog (single source of truth) from the backend
 * and attach brand icons. Unknown future ids get a letter fallback so
 * adding provider #10 never breaks the tab before its icon ships.
 */
export async function fetchMcpProviders(): Promise<McpProvider[]> {
  const data = await api.get('/mcp/providers');
  const list = (data.providers || []) as McpProviderPayload[];
  return list.map((p) => {
    const Icon = MCP_ICONS[p.id];
    const icon: IconComponent = Icon
      ? Icon
      : ({ className }: { className?: string }) =>
          createElement(GenericIcon, {
            letter: (p.name || '?').slice(0, 1).toUpperCase(),
            className,
          });
    return {
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      about: p.about,
      needs: p.needs || [],
      steps: p.steps || [],
      status: p.status,
      paidNote: p.paid_note,
      authNote: p.auth_note || '',
      requiresKey: p.requires_key,
      icon,
    };
  });
}

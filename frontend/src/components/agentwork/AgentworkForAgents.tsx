'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatGptIcon,
  ClaudeIcon,
  CopilotIcon,
  CursorIcon,
  GeminiIcon,
  MistralIcon,
} from '@/components/connectors/ConnectorIcons';

export default function AgentworkForAgents() {
  const [activeIdx, setActiveIdx] = useState(0);

  const agents = [
    { name: 'ChatGPT', Icon: ChatGptIcon, desc: 'OpenAI GPT-4o & o1' },
    { name: 'Claude', Icon: ClaudeIcon, desc: 'Anthropic Claude 3.5' },
    { name: 'Cursor', Icon: CursorIcon, desc: 'Cursor AI IDE' },
    { name: 'Copilot', Icon: CopilotIcon, desc: 'GitHub Copilot' },
    { name: 'Gemini', Icon: GeminiIcon, desc: 'Google Gemini 2.5' },
    { name: 'Mistral AI', Icon: MistralIcon, desc: 'Mistral Large' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % agents.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [agents.length]);

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24">
      <div className="flex w-full max-w-300 flex-col gap-10">
        {/* Header (Badge removed as requested) */}
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.03em] text-[#21201c]">
            Agentwork for agents
          </h2>
          <p className="text-sm md:text-base leading-normal text-[#63635e] max-w-xl">
            Leverage Agentwork&apos;s MCP and skills to gain human-level verification on your work. Hosted Memory MCP with API-key auth.
          </p>
        </div>

        {/* Coding Agents Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {agents.map((agent, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={agent.name}
                onClick={() => setActiveIdx(i)}
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#ff6a00] bg-[#ffffff] shadow-md -translate-y-1'
                    : 'border-[#e2e1de] bg-[#f9f9f8] hover:border-[#cfceca] hover:bg-[#ffffff]'
                }`}
              >
                <div className="p-2 rounded-xl flex items-center justify-center">
                  <agent.Icon className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-sm font-semibold text-[#21201c]">{agent.name}</span>
                  <span className="text-[11px] text-[#8d8d86]">{agent.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

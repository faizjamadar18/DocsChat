'use client';
import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';

// Claude/Gemini-style message typography: 13px relaxed body, semibold
// emphasis, compact lists, pill inline-code, dark code blocks. Raw HTML in
// model output is NOT parsed (no rehype-raw) so it renders as escaped text.
//
// NOTE: props are typed loosely on purpose — importing react-markdown's
// `Components` mapped type makes tsc's checker explode (V8 Zone OOM).
type MDProps = {
  children?: ReactNode;
  href?: string;
  className?: string;
};

const components = {
  p: ({ children }: MDProps) => (
    <p className="leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }: MDProps) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  ul: ({ children }: MDProps) => (
    <ul className="list-disc pl-5 space-y-1 my-2 marker:text-text-secondary">{children}</ul>
  ),
  ol: ({ children }: MDProps) => (
    <ol className="list-decimal pl-5 space-y-1 my-2 marker:text-text-secondary">{children}</ol>
  ),
  li: ({ children }: MDProps) => (
    <li className="leading-relaxed">{children}</li>
  ),
  h1: ({ children }: MDProps) => (
    <h1 className="text-[15px] font-semibold text-text-primary mt-3 mb-1">{children}</h1>
  ),
  h2: ({ children }: MDProps) => (
    <h2 className="text-sm font-semibold text-text-primary mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }: MDProps) => (
    <h3 className="text-[13px] font-semibold text-text-primary mt-2 mb-1">{children}</h3>
  ),
  a: ({ href, children }: MDProps) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline underline-offset-2"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: MDProps) => (
    <blockquote className="border-l-2 border-accent/50 pl-3 my-2 text-text-secondary">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: MDProps) => (
    <code
      className={`px-1 py-0.5 rounded bg-sidebar border border-border font-mono text-xs text-text-primary ${className ?? ''}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }: MDProps) => (
    <pre className="bg-[#18181B] text-zinc-100 rounded-xl p-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-inherit">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-border my-3" />,
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[13px] leading-relaxed text-text-primary break-words">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

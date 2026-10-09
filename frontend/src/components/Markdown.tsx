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
    <p className="leading-[1.7] mb-3 last:mb-0 text-text-primary">{children}</p>
  ),
  strong: ({ children }: MDProps) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  ul: ({ children }: MDProps) => (
    <ul className="list-disc pl-5 space-y-1.5 my-3 marker:text-text-muted">{children}</ul>
  ),
  ol: ({ children }: MDProps) => (
    <ol className="list-decimal pl-5 space-y-1.5 my-3 marker:text-text-muted">{children}</ol>
  ),
  li: ({ children }: MDProps) => (
    <li className="leading-[1.7] text-text-primary">{children}</li>
  ),
  h1: ({ children }: MDProps) => (
    <h1 className="text-lg font-semibold text-text-primary mt-4 mb-2 tracking-tight">{children}</h1>
  ),
  h2: ({ children }: MDProps) => (
    <h2 className="text-base font-semibold text-text-primary mt-3.5 mb-1.5 tracking-tight">{children}</h2>
  ),
  h3: ({ children }: MDProps) => (
    <h3 className="text-[14px] font-semibold text-text-primary mt-3 mb-1 tracking-tight">{children}</h3>
  ),
  a: ({ href, children }: MDProps) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-text-primary underline underline-offset-4 decoration-border hover:decoration-text-primary transition-colors font-medium"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: MDProps) => (
    <blockquote className="border-l-2 border-border-subtle pl-3.5 my-2.5 text-text-secondary italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: MDProps) => (
    <code
      className={`px-1.5 py-0.5 rounded-md bg-[#F4F4F6] border border-border/80 font-mono text-[12px] text-text-primary ${className ?? ''}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }: MDProps) => (
    <pre className="bg-[#18181B] text-zinc-100 rounded-xl p-3.5 my-3 overflow-x-auto text-xs font-mono leading-relaxed [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-inherit">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-border my-4" />,
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[14.5px] sm:text-[15px] leading-[1.7] text-text-primary wrap-break-word">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

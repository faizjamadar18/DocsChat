import Link from 'next/link';
import SectionLabel from './SectionLabel';

export default function Hero() {
  return (
    <section className="border-b border-white/10 overflow-hidden">

      <div
        aria-hidden
        className="absolute inset-0 isolate hidden contain-strict lg:block z-[51] pointer-events-none">
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          <div className="max-w-xl">
            <div className="mb-8">
              <SectionLabel>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />
                </svg>
                AI-Powered Research
              </SectionLabel>
            </div>
            <h1 className="text-[32px] sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.1] mb-6">
              Turn Documents into Answers, Instantly
            </h1>
            <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-10 max-w-lg">
              Upload PDFs, ask questions, and get citeable answers powered by your choice of AI models. Your research workspace, reimagined.
            </p>
            <div className="flex flex-row items-center gap-2 sm:gap-4">
              <Link
                href="/register"
                className="inline-flex items-center h-8 sm:h-10 px-4 sm:px-5 rounded-xl bg-white text-[#121212] text-sm sm:text-base font-semibold hover:bg-white/90 transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center h-10 sm:h-12 px-4 sm:px-7 rounded-xl border border-white/20 text-white text-sm sm:text-white font-medium hover:bg-white/5 transition-colors"
              >
                How it works
              </Link>
            </div>
            <p className="text-sm text-white/40 mt-8">No credit card required &middot; Free plan included</p>
          </div>

          <div className="flex items-center justify-center relative">
            {/* MacBook mockup */}
            <div className="relative w-full sm:max-w-[830px]">
              {/* Surface shadow — device resting on desk */}
              <div className="absolute -bottom-8 left-[5%] right-[5%] h-10 rounded-full bg-black/40 blur-2xl" />
              {/* Outer glow */}
              <div className="absolute -inset-8 rounded-[24px] bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.01] blur-3xl" />
              {/* Glass reflection overlay */}
              <div className="absolute -top-12 left-[20%] right-[20%] h-20 bg-gradient-to-b from-white/[0.03] to-transparent blur-3xl rounded-full pointer-events-none" />
              {/* SaaS product frame */}
              <div className="relative rounded-[16px] sm:rounded-[20px] bg-gradient-to-b from-white/[0.08] to-white/[0.01] p-[1px] shadow-[0_0_30px_rgba(0,0,0,0.4),0_20px_60px_-10px_rgba(0,0,0,0.5)]">
                {/* Device bezel */}
                <div className="rounded-[15px] sm:rounded-[19px] bg-[#1a1a1a] p-[2px] shadow-inner shadow-black/50">
                  {/* Screen with inner shadow for glass depth */}
                  <div className="rounded-[13px] sm:rounded-[17px] bg-base overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    {/* Screen content */}
                    <div className="px-3 sm:px-6 pb-8 sm:pb-10 pt-6 sm:pt-8 space-y-2 sm:space-y-5">
                      {/* Top bar */}
                      <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#ff5f57]"></div>
                          <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#febc2e]"></div>
                          <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#28c840]"></div>
                        </div>
                        <span className="text-[9px] sm:text-xs text-white/40 font-medium">DocsChat</span>
                      </div>
                      {/* User message */}
                      <div className="flex justify-end mt-5 sm:mt-7">
                        <div className="max-w-[82%] sm:max-w-[78%] px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl rounded-br-sm bg-white/[0.08] text-[9px] sm:text-xs text-white leading-relaxed border border-white/5 shadow-sm">
                          What are the key findings from this research paper?
                        </div>
                      </div>
                      {/* Assistant response */}
                      <div className="max-w-[85%] sm:max-w-[82%] text-[9px] sm:text-xs text-white/80 leading-relaxed">
                        Based on the paper, the key findings include:
                      </div>
                      <div className="max-w-[85%] sm:max-w-[82%] text-[9px] sm:text-xs text-white/80 leading-relaxed space-y-0.5">
                        <p>1. RAG systems significantly improve factual accuracy compared to base LLMs</p>
                        <p>2. Document chunking strategy directly impacts retrieval quality</p>
                      </div>
                      {/* Citations */}
                      <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                        <span className="text-[7px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/50">paper.pdf &middot; p.3</span>
                        <span className="text-[7px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/50">paper.pdf &middot; p.7</span>
                      </div>
                      {/* Input bar */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-white/[0.06]">
                        <div className="flex-1 h-6 sm:h-9 rounded-full bg-white/[0.04] border border-white/[0.07]"></div>
                        <div className="w-6 sm:w-9 h-6 sm:h-9 rounded-full bg-white/[0.08] border border-white/5 flex items-center justify-center shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 sm:w-[14px] sm:h-[14px]">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

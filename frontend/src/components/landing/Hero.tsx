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
                className="inline-flex items-center h-10 sm:h-12 px-4 sm:px-7 rounded-xl bg-white text-[#121212] text-sm sm:text-base font-semibold hover:bg-white/90 transition-colors"
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
              {/* Screen bezel */}
              <div className="bg-base rounded-[10px] sm:rounded-[13px] overflow-hidden">
                {/* Notch */}
                <div className="relative z-10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] sm:w-[130px] h-[12px] sm:h-[24px] bg-base rounded-b-[8px] sm:rounded-b-[14px] flex items-start justify-center pt-[2px] sm:pt-[6px]">
                    <div className="w-[4px] sm:w-[9px] h-[4px] sm:h-[9px] rounded-full bg-surface border border-white/10"></div>
                  </div>
                </div>
                {/* Screen content */}
                <div className="pt-8 sm:pt-10 px-2 sm:px-5 pb-6 sm:pb-4 space-y-1.5 sm:space-y-4">
                  {/* Traffic lights */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 rounded-full bg-[#ff5f57]"></div>
                    <div className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 rounded-full bg-[#febc2e]"></div>
                    <div className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 rounded-full bg-[#28c840]"></div>
                    <span className="text-[7px] sm:text-[10px] text-white/50 ml-1 sm:ml-1.5">DocsChat</span>
                  </div>
                  {/* User message */}
                  <div className="flex justify-end mt-4 sm:mt-20">
                    <div className="max-w-[82%] sm:max-w-[78%] px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-2xl rounded-br-sm bg-surface text-[9px] sm:text-xs text-white leading-relaxed">
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
                    <span className="text-[7px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">paper.pdf &middot; p.3</span>
                    <span className="text-[7px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">paper.pdf &middot; p.7</span>
                  </div>
                  {/* Input bar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-white/10">
                    <div className="flex-1 h-5 sm:h-8 rounded-full bg-white/5 border border-white/10"></div>
                    <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 sm:w-[13px] sm:h-[13px]">
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
    </section>
  );
}

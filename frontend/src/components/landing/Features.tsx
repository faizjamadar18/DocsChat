import SectionLabel from './SectionLabel';

const CornerBrackets = () => (
  <>
    <span className="absolute left-0 top-0 w-2 h-2 border-l-2 border-t-2 border-white pointer-events-none" />
    <span className="absolute right-0 top-0 w-2 h-2 border-r-2 border-t-2 border-white pointer-events-none" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-white pointer-events-none" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white pointer-events-none" />
  </>
);

export default function Features() {
  return (
    <section className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-24">
        <div className="text-center mb-16">
          <div className="mb-6">
            <SectionLabel>Features</SectionLabel>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-white">Everything you need to research better</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">A clean workspace that connects your documents to the most capable AI models.</p>
        </div>

        <div className="grid gap-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Card — Ask Anything */}
            <div className="relative bg-black rounded-2xl p-10 border-2 border-white/[0.12] flex flex-col">
              <CornerBrackets />
              <h3 className="text-lg font-semibold text-white mb-3">Ask Anything</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Natural language questions with citeable answers. Every response includes sources so you can verify.
              </p>

              {/* Mock Q&A */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 mb-3">
                <div className="flex justify-end mb-3">
                  <div className="max-w-[85%] px-3 py-2 rounded-xl rounded-br-sm bg-white/[0.08] text-xs text-white/80">
                    What are the key findings from this paper?
                  </div>
                </div>
                <div className="max-w-[90%] text-xs text-white/70 leading-relaxed mb-2">
                  Based on the paper, the key findings include RAG systems significantly improving factual accuracy and document chunking strategy directly impacting retrieval quality.
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">paper.pdf · p.3</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">paper.pdf · p.7</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span>Every answer cites its source</span>
              </div>
            </div>

            {/* Card — Multi-Model */}
            <div className="relative bg-black rounded-2xl p-10 border-2 border-white/[0.12] flex flex-col">
              <CornerBrackets />
              <h3 className="text-lg font-semibold text-white mb-3">Multi-Model</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Choose between Gemini and Groq models. Switch freely without leaving your workspace.
              </p>

              {/* Model cards */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs text-white/60">G</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">Gemini 1.5 Flash</p>
                    <p className="text-xs text-white/40">Fast · General purpose</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs text-white/60">G</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">Groq Llama 3 70B</p>
                    <p className="text-xs text-white/40">Powerful · Deep reasoning</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-white/15" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span>Switch models per question</span>
              </div>
            </div>
          </div>

          {/* Full-width card — Upload & Analyze */}
          <div className="relative bg-black rounded-2xl p-7 border-2 border-white/[0.12] flex flex-col">
            <CornerBrackets />
            <h3 className="text-lg font-semibold text-white mb-6 text-center">Upload & Analyze</h3>


            {/* Document cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs text-white/40">PDF</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">research-paper.pdf</p>
                    <p className="text-xs text-white/40">2.4 MB</p>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full w-full rounded-full bg-white/20" />
                </div>
                <p className="text-xs text-white/40 mt-1">Indexed · 24 chunks</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs text-white/40">PDF</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">meeting-notes.pdf</p>
                    <p className="text-xs text-white/40">0.8 MB</p>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-white/20" />
                </div>
                <p className="text-xs text-white/40 mt-1">Processing · 70%</p>
              </div>
            </div>

            {/* Input bar mockup */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="flex-1 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06]" />
                <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">paper.pdf · p.3</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">notes.pdf · p.7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

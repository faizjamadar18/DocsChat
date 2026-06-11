export default function Testimonial() {
  return (
    <section className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
              <path d="M3 21c3 0 7-1 7-8 0-3.5-2-5-5-5-2.5 0-4 1.5-4 4 0 3 2 4 4 4 0 0 0 0 0 0"></path>
              <path d="M13 21c3 0 7-1 7-8 0-3.5-2-5-5-5-2.5 0-4 1.5-4 4 0 3 2 4 4 4 0 0 0 0 0 0"></path>
            </svg>
          </div>
          <blockquote className="text-xl sm:text-2xl text-white/80 leading-relaxed font-medium mb-8">
            &ldquo;DocsChat completely changed how I review academic papers. Instead of spending hours searching through PDFs, I just ask a question and get the answer with the exact source. It&rsquo;s like having a research assistant that never sleeps.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80" alt="Alex K." className="w-10 h-10 rounded-full object-cover" />
            <div className="text-left">
              <p className="text-sm font-medium">Alex K.</p>
              <p className="text-xs text-white/60">PhD Researcher, Computational Linguistics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

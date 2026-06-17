import Link from 'next/link';

export default function CTA() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-24">
        <div className="relative max-w-4xl mx-auto">
          {/* Dotted frame */}
          <div className="absolute inset-0 border border-dashed border-white/[0.08]" />
          {/* Corner pluses */}
          <div className="absolute -top-5 -left-5 w-10 h-10 flex items-center justify-center text-white/40 text-2xl sm:text-3xl z-10">+</div>
          <div className="absolute -top-5 -right-5 w-10 h-10 flex items-center justify-center text-white/40 text-2xl sm:text-3xl z-10">+</div>
          <div className="absolute -bottom-5 -left-5 w-10 h-10 flex items-center justify-center text-white/40 text-2xl sm:text-3xl z-10">+</div>
          <div className="absolute -bottom-5 -right-5 w-10 h-10 flex items-center justify-center text-white/40 text-2xl sm:text-3xl z-10">+</div>
          {/* Glassy background */}
          <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/[0.06] p-8 sm:p-16 text-center shadow-xl shadow-black/20">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Ready to accelerate your research?</h2>
            <p className="text-lg text-white/60 mb-10 max-w-lg mx-auto">Start for free, upgrade when you need more. No credit card required.</p>
            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
              <Link
                href="/register"
                className="inline-flex items-center h-10 sm:h-12 px-4 sm:px-8 rounded-xl bg-white text-[#121212] text-sm sm:text-base sm:text-[#121212] font-semibold hover:bg-white/90 transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center h-10 sm:h-12 px-4 sm:px-8 rounded-xl border border-white/20 text-white text-sm sm:text-base sm:text-white font-medium hover:bg-white/5 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

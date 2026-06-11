import Link from 'next/link';

export default function CTA() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-24">
        <div className="p-8 sm:p-16 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Ready to accelerate your research?</h2>
          <p className="text-lg text-white/60 mb-10 max-w-lg mx-auto">Start for free, upgrade when you need more. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center h-12 px-8 rounded-xl bg-white text-base font-semibold hover:bg-white/90 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center h-12 px-8 rounded-xl border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

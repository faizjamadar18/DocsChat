'use client';
import { useEffect, useState } from 'react';
import SectionLabel from './SectionLabel';

const steps = [
  {
    number: '01',
    title: 'Upload your documents',
    description: 'Drag and drop PDF files into your workspace. We process and index them automatically.',
  },
  {
    number: '02',
    title: 'Ask any question',
    description: 'Type naturally. Choose your preferred AI model. Get answers grounded in your documents.',
  },
  {
    number: '03',
    title: 'Verify with citations',
    description: 'Every answer includes source references. Click to see the exact snippet in context.',
  },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    const el = document.getElementById('how-it-works');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="border-b border-white/10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-24">
        <div className="text-center mb-20">
          <div className="mb-6">
            <SectionLabel>How it works</SectionLabel>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Three steps to insight</h2>
          <p className="text-lg text-white/50 mt-3 max-w-2xl mx-auto">From PDF to answer in under a minute.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-0 relative">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center w-full lg:w-auto">
              <div
                className="relative flex-1 lg:flex-none lg:w-[280px] xl:w-[320px] text-center"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`,
                }}
              >
                {/* Background number */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 select-none pointer-events-none">
                  <span className="text-[120px] sm:text-[150px] font-bold leading-none text-white/[0.13] tracking-tight">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="relative pt-16 sm:pt-20 px-4">

                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:flex items-center justify-center shrink-0 mx-4"
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: `opacity 0.6s ease ${i * 0.15 + 0.3}s`,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}

              {/* Mobile divider */}
              {i < steps.length - 1 && (
                <div
                  className="lg:hidden w-px h-12 bg-white/10 mx-auto"
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: `opacity 0.6s ease ${i * 0.15 + 0.3}s`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

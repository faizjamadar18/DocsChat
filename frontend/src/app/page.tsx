import React from 'react';
import Navbar from '../components/landing/Navbar';
import BackendWarmup from '../components/BackendWarmup';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import UseCases from '../components/landing/UseCases';
import QuelloForAgents from '../components/landing/QuelloForAgents';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import LenisProvider from '../components/LenisProvider';

export default function Home() {
  return (
    <LenisProvider>
      <div className="quello-scope min-h-dvh relative bg-[#fdfdfc] text-[#21201c] antialiased selection:bg-[#ffd7c0] selection:text-[#592d18]">
        <BackendWarmup />
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <QuelloForAgents />
          <UseCases />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}


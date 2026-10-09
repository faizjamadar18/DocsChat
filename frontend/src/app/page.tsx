import React from 'react';
import Navbar from '../components/agentwork/Navbar';
import Hero from '../components/agentwork/Hero';
import HowItWorks from '../components/agentwork/HowItWorks';
import UseCases from '../components/agentwork/UseCases';
import Features from '../components/agentwork/Features';
import IntegrationsBoundary from '../components/agentwork/IntegrationsBoundary';
import AgentworkForAgents from '../components/agentwork/AgentworkForAgents';
import SecurityCompliance from '../components/agentwork/SecurityCompliance';
import FAQSection from '../components/agentwork/FAQSection';
import CTABanner from '../components/agentwork/CTABanner';
import Footer from '../components/agentwork/Footer';
import LenisProvider from '../components/LenisProvider';

export default function Home() {
  return (
    <LenisProvider>
      <div className="agentwork-scope min-h-dvh relative bg-[#fdfdfc] text-[#21201c] antialiased selection:bg-[#ffd7c0] selection:text-[#592d18]">
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <UseCases />
          <Features />
          <IntegrationsBoundary />
          <AgentworkForAgents />
          <SecurityCompliance />
          <FAQSection />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}


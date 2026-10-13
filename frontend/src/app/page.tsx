import React from 'react';
import Navbar from '../components/agentwork/Navbar';
import Hero from '../components/agentwork/Hero';
import HowItWorks from '../components/agentwork/HowItWorks';
import UseCases from '../components/agentwork/UseCases';
import AgentworkForAgents from '../components/agentwork/AgentworkForAgents';
import FAQSection from '../components/agentwork/FAQSection';
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
          <AgentworkForAgents />
          <UseCases />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}


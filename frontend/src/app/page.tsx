import Header from '../components/plura/Header';
import Hero from '../components/plura/Hero';
import Problem from '../components/plura/Problem';
import Features from '../components/plura/Features';
import Workflow from '../components/plura/Workflow';
import CTA from '../components/plura/CTA';
import Footer from '../components/plura/Footer';
import LenisProvider from '../components/LenisProvider';

export default function Home() {
  return (
    <LenisProvider>
      {/* Landing is dark-only (DESIGN.md): .dark scopes all Plura var-based classes below. */}
      <div className="dark min-h-dvh relative bg-background text-foreground font-base antialiased">
        <Header />
        <main>
          <Hero />
          <Problem />
          <Features />
          <Workflow />
          <CTA />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}

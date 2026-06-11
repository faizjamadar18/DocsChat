import Nav from '../components/landing/Nav';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonial from '../components/landing/Testimonial';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import LenisProvider from '../components/LenisProvider';

export default function Home() {
  return (
    <LenisProvider>
      <div className="min-h-screen bg-[#000000] text-white">
        <Nav />
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonial />
        <CTA />
        <Footer />
      </div>
    </LenisProvider>
  );
}

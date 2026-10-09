import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/plura/Header';
import Footer from '@/components/plura/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Quello',
  description:
    'Terms of Service for Quello (quello.dev). Review our terms, acceptable use guidelines, intellectual property policies, and user agreements.',
};

export default function TermsOfServicePage() {
  return (
    <div className="dark min-h-dvh flex flex-col bg-background text-foreground font-base antialiased selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 pt-28 md:pt-36 pb-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Header Badge & Title */}
          <div className="border-b border-border/60 pb-10 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide uppercase mb-4">
              Legal Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: <span className="text-foreground font-medium">October 9, 2026</span> &bull; Effective Date: <span className="text-foreground font-medium">October 9, 2026</span>
            </p>
          </div>

          {/* Key Summary Highlights Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs p-6 md:p-8 mb-12 shadow-xs">
            <h2 className="text-lg font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary inline-block" />
              Summary of Key Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">📄 Your Content Belongs to You</p>
                <p>You retain 100% full ownership and intellectual property rights over your uploaded files and notes.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🔑 Google OAuth Authentication</p>
                <p>Seamless sign-in with your Google account subject to Google&apos;s Terms of Service and API policies.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🛡️ Acceptable Use</p>
                <p>You agree to use Quello lawfully and not to abuse our infrastructure or upload malicious content.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">⚡ Service Availability</p>
                <p>We work continuously for high uptime, providing the platform on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.</p>
              </div>
            </div>
          </div>

          {/* Terms Content Sections */}
          <div className="space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
            {/* Section 1: Agreement to Terms */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                1. Agreement to Terms
              </h2>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;you&rdquo; or &ldquo;User&rdquo;) and <strong className="text-foreground">Quello</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), governing your access to and use of our website at{' '}
                <a href="https://quello.dev" className="text-primary hover:underline font-medium">quello.dev</a> and our AI-powered workspace application (collectively, the &ldquo;Service&rdquo;).
              </p>
              <p>
                By accessing, creating an account on, or using Quello, you confirm that you have read, understood, and agreed to be bound by these Terms and our{' '}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                . If you do not agree with all of these Terms, you must immediately discontinue use of the Service.
              </p>
            </section>

            {/* Section 2: Eligibility and Accounts */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                2. Eligibility &amp; Account Registration
              </h2>
              <p>
                To access and use Quello, you must meet the following eligibility requirements:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>You must be at least 13 years of age (or the minimum legal age required in your jurisdiction to use online services).</li>
                <li>You must register or authenticate using a valid Google account via Google OAuth 2.0.</li>
                <li>You agree to provide accurate, current, and complete registration information and maintain its accuracy.</li>
                <li>You are solely responsible for safeguarding the credentials associated with your account and for all activities occurring under your account.</li>
              </ul>
              <p>
                You must notify us immediately at <a href="mailto:support@quello.dev" className="text-primary hover:underline">support@quello.dev</a> if you discover or suspect any unauthorized access to or compromise of your account.
              </p>
            </section>

            {/* Section 3: Third-Party Services & Google Sign-In */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                3. Google Authentication &amp; Third-Party Services
              </h2>
              <p>
                Quello integrates with Google OAuth to enable secure, passwordless authentication. By using Google Sign-In:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>You acknowledge that your use of Google accounts is governed by{' '}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google&apos;s Terms of Service
                  </a> and{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google&apos;s Privacy Policy
                  </a>.
                </li>
                <li>Our access to and use of Google user data adheres strictly to the{' '}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google API Services User Data Policy
                  </a>, including the Limited Use requirements.
                </li>
                <li>You can disconnect Quello from your Google account at any time through Google&apos;s security permissions management.</li>
              </ul>
            </section>

            {/* Section 4: Acceptable Use Policy */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                4. Acceptable Use Policy
              </h2>
              <p>
                You agree not to misuse the Service. Specifically, you agree that you will not:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Violate any applicable local, national, or international law, rule, or regulation.</li>
                <li>Upload, store, or transmit content that is unlawful, infringing, defamatory, harassing, abusive, fraudulent, or harmful.</li>
                <li>Upload files containing computer viruses, trojans, worms, ransomware, or other malicious code.</li>
                <li>Attempt to bypass, disable, or tamper with any security features or authentication controls of Quello.</li>
                <li>Reverse engineer, decompile, disassemble, or extract the source code of any component of the Service.</li>
                <li>Engage in automated scraping, spidering, or high-volume automated requests that overwhelm or degrade system infrastructure.</li>
                <li>Use the platform to develop or power a competing service or to train foundation AI models in violation of our platform terms.</li>
              </ul>
            </section>

            {/* Section 5: User Content & Ownership */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                5. User Content &amp; Intellectual Property Rights
              </h2>

              <div className="space-y-3">
                <p>
                  <strong className="text-foreground">Your Ownership:</strong> You retain complete ownership, copyright, and intellectual property rights in and to all documents, files, research materials, prompts, notes, and text that you upload, submit, or store within Quello (&ldquo;User Content&rdquo;). Quello claims no ownership rights over your User Content.
                </p>
                <p>
                  <strong className="text-foreground">Limited License to Provide Service:</strong> By uploading User Content to Quello, you grant us only a limited, non-exclusive, worldwide, royalty-free license to host, parse, index, search, and process your content strictly to the extent necessary to provide the features and functionality of the Service to you (such as generating document summaries, search embeddings, and conversational AI answers).
                </p>
                <p>
                  <strong className="text-foreground">Quello Intellectual Property:</strong> All software, code, algorithms, design systems, visual interfaces, graphics, trademarks, logos, and service marks associated with Quello are and remain the exclusive intellectual property of Quello and its licensors.
                </p>
              </div>
            </section>

            {/* Section 6: AI-Generated Content & Disclaimers */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                6. Artificial Intelligence Assistance &amp; Disclaimers
              </h2>
              <p>
                Quello incorporates advanced generative artificial intelligence and retrieval-augmented generation (RAG) technology. You acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>AI models generate outputs based on probabilistic algorithms and retrieved context; outputs may occasionally be inaccurate, incomplete, or unexpected.</li>
                <li>AI outputs are intended for informational, educational, and assistive purposes and should not be relied upon as professional legal, financial, or medical advice.</li>
                <li>You are responsible for reviewing and verifying the accuracy and appropriateness of any AI-generated outputs before relying on them.</li>
              </ul>
            </section>

            {/* Section 7: Service Availability & Modifications */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                7. Service Availability &amp; Modifications
              </h2>
              <p>
                We strive to maintain continuous platform availability and high uptime. However, we do not guarantee uninterrupted, error-free, or fully secure operation of the Service. We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Perform scheduled or emergency maintenance, upgrades, and enhancements.</li>
                <li>Modify, enhance, or discontinue specific features or portions of the Service with reasonable notice when feasible.</li>
                <li>Impose reasonable rate limits or quotas to prevent abuse and protect infrastructure stability.</li>
              </ul>
            </section>

            {/* Section 8: Disclaimer of Warranties */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                8. Disclaimer of Warranties
              </h2>
              <div className="p-4 rounded-xl bg-background2/70 border border-border/80 text-xs md:text-sm">
                <p className="uppercase tracking-wide text-foreground font-semibold mb-2">Warranty Disclaimer</p>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. QUELLO EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
              </div>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                9. Limitation of Liability
              </h2>
              <div className="p-4 rounded-xl bg-background2/70 border border-border/80 text-xs md:text-sm">
                <p className="uppercase tracking-wide text-foreground font-semibold mb-2">Liability Limitation</p>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL QUELLO, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR USE OF OR INABILITY TO USE THE SERVICE; (B) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR CONTENT; OR (C) ANY THIRD-PARTY CONDUCT OR SERVICES ACCESSED THROUGH QUELLO.
                </p>
              </div>
            </section>

            {/* Section 10: Termination & Account Deletion */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                10. Termination &amp; Account Deletion
              </h2>
              <p>
                You may terminate your account at any time by requesting deletion through your workspace settings or by emailing{' '}
                <a href="mailto:support@quello.dev" className="text-primary hover:underline font-medium">support@quello.dev</a>.
              </p>
              <p>
                We may suspend or terminate your account or access to the Service immediately, without prior notice or liability, if you breach any provision of these Terms or engage in conduct that may harm Quello, its users, or third parties. Upon termination, your right to use the Service will cease immediately, and your data will be purged in accordance with our Privacy Policy.
              </p>
            </section>

            {/* Section 11: Changes to Terms */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                11. Changes to These Terms
              </h2>
              <p>
                We may revise these Terms periodically to reflect updates to our service, legal requirements, or business practices. We will notify you of material changes by updating the &ldquo;Last Updated&rdquo; date at the top of this page or by sending a notification through the Service. Your continued use of Quello following the posting of updated Terms constitutes your acceptance of the revisions.
              </p>
            </section>

            {/* Section 12: Governing Law & Contact */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                12. Contact Information &amp; Legal Notices
              </h2>
              <p>
                If you have questions, comments, or legal inquiries concerning these Terms of Service, please contact us:
              </p>

              <div className="p-6 rounded-2xl bg-card border border-border/80 text-foreground space-y-2">
                <p className="font-semibold text-base font-heading">Quello Legal &amp; Support Team</p>
                <p className="text-sm text-muted-foreground">Website: <a href="https://quello.dev" className="text-primary hover:underline">https://quello.dev</a></p>
                <p className="text-sm text-muted-foreground">Support &amp; Inquiries: <a href="mailto:support@quello.dev" className="text-primary hover:underline">support@quello.dev</a></p>
                <p className="text-sm text-muted-foreground">Privacy &amp; Data Rights: <a href="mailto:privacy@quello.dev" className="text-primary hover:underline">privacy@quello.dev</a></p>
              </div>
            </section>
          </div>

          {/* Bottom Navigation Link */}
          <div className="mt-16 pt-8 border-t border-border/60 flex items-center justify-between text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              &larr; Back to Home
            </Link>
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Read Privacy Policy &rarr;
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import LenisProvider from '@/components/LenisProvider';

export const metadata: Metadata = {
  title: 'Terms of Service | Quello',
  description:
    'Terms of Service for Quello (quello.dev). Review our terms, acceptable use guidelines, Google OAuth authentication terms, and intellectual property policies.',
};

export default function TermsOfServicePage() {
  const sections = [
    { id: 'agreement', label: '1. Agreement to Terms' },
    { id: 'eligibility', label: '2. Eligibility & Accounts' },
    { id: 'google-services', label: '3. Google Auth & Integrations' },
    { id: 'acceptable-use', label: '4. Acceptable Use Policy' },
    { id: 'user-content', label: '5. Content & Intellectual Property' },
    { id: 'ai-disclaimers', label: '6. AI Assistance & Disclaimers' },
    { id: 'service-availability', label: '7. Availability & Rate Limits' },
    { id: 'warranties', label: '8. Disclaimer of Warranties' },
    { id: 'liability', label: '9. Limitation of Liability' },
    { id: 'termination', label: '10. Termination & Deletion' },
    { id: 'changes', label: '11. Changes to Terms' },
    { id: 'governing-law', label: '12. Governing Law & Contact' },
  ];

  return (
    <LenisProvider>
      <div className="quello-scope min-h-dvh relative bg-[#fdfdfc] text-[#21201c] antialiased selection:bg-[#ffd7c0] selection:text-[#592d18]">
        <Navbar />

        <main className="pt-6 sm:pt-10 pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Badge & Title */}
            <div className="border-b border-[#e2e1de] pb-8 sm:pb-12 mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffffff] border border-[#e2e1de] shadow-xs text-xs font-semibold tracking-wider uppercase text-[#ff6a00] mb-4">
                <span className="size-1.5 rounded-full bg-[#ff6a00]" />
                Legal Agreement
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-[#21201c] mb-4">
                Terms of Service
              </h1>
              <p className="text-sm sm:text-base text-[#63635e] max-w-3xl leading-relaxed">
                Last updated: <span className="text-[#21201c] font-medium">October 12, 2026</span> &bull; Effective Date:{' '}
                <span className="text-[#21201c] font-medium">October 12, 2026</span>
              </p>
            </div>

            {/* Executive Highlights Grid */}
            <div className="mb-14">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8d8d86] mb-4 font-heading">
                Key Terms &amp; Guarantees Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    📄
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">100% User Ownership</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    You retain complete intellectual property ownership over all uploaded documents, notes, and query prompts.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🔑
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">Google OAuth &amp; Drive</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Passwordless sign-in and selective file imports via Google Picker adhering strictly to Google API policies.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🤖
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">AI Assistance</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Generative RAG answers are designed to assist your workflow; output verification remains your responsibility.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    ⚡
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">Zero Lock-In</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Disconnect integrations or permanently purge your account, data, and vector embeddings at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Layout with Sticky Sidebar on Desktop */}
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
              {/* Sticky Sidebar Navigation */}
              <aside className="hidden lg:block w-72 shrink-0 sticky top-28">
                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8d8d86] mb-3 font-heading">
                    Table of Contents
                  </p>
                  <nav className="flex flex-col gap-1 text-xs text-[#63635e]">
                    {sections.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="py-1.5 px-2 rounded-lg hover:bg-[#f7f6f4] hover:text-[#ff6a00] transition-colors leading-snug"
                      >
                        {sec.label}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-5 pt-4 border-t border-[#e2e1de] flex flex-col gap-2">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#21201c]">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Fair &amp; Transparent Terms
                    </div>
                    <p className="text-[11px] text-[#8d8d86] leading-relaxed">
                      Questions? Reach our legal and support team at{' '}
                      <a href="mailto:support@quello.dev" className="text-[#ff6a00] hover:underline font-medium">
                        support@quello.dev
                      </a>
                    </p>
                  </div>
                </div>
              </aside>

              {/* Main Content Body */}
              <div className="flex-1 min-w-0 space-y-12 sm:space-y-16 text-[#63635e] text-sm sm:text-base leading-relaxed">
                {/* Section 1: Agreement to Terms */}
                <section id="agreement" className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    1. Agreement to Terms
                  </h2>
                  <p>
                    These Terms of Service (&ldquo;Terms&rdquo;) form a legally binding contract between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;)
                    and <strong className="text-[#21201c]">Quello</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), governing your access
                    to and use of the website at{' '}
                    <a href="https://quello.dev" className="text-[#ff6a00] hover:underline font-medium">
                      https://quello.dev
                    </a>{' '}
                    and the Quello RAG workspace platform (collectively, the &ldquo;Service&rdquo;).
                  </p>
                  <p>
                    By registering an account, connecting a third-party account (such as Google), or using our Service, you confirm that you have
                    read, understood, and agree to be bound by these Terms and our{' '}
                    <Link href="/privacy" className="text-[#ff6a00] hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    . If you do not agree with all of these Terms, you must discontinue your use of the Service immediately.
                  </p>
                </section>

                {/* Section 2: Eligibility & Accounts */}
                <section id="eligibility" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    2. Eligibility &amp; Account Registration
                  </h2>
                  <p>To use Quello, you must satisfy the following eligibility conditions:</p>
                  <ul className="space-y-2.5 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>You must be at least 13 years of age (or 16 years of age in the European Economic Area).</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>You must register or authenticate using a valid Google account or authorized login provider.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>You agree to provide true, current, and complete registration details and maintain their accuracy.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>You are responsible for safeguarding your credentials and for all activities that occur under your account.</div>
                    </li>
                  </ul>
                  <p>
                    Notify us immediately at <a href="mailto:support@quello.dev" className="text-[#ff6a00] hover:underline">support@quello.dev</a> if
                    you suspect unauthorized access to or compromise of your account.
                  </p>
                </section>

                {/* Section 3: Google Auth & Integrations */}
                <section id="google-services" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    3. Google Authentication &amp; Third-Party Services
                  </h2>
                  <p>
                    Quello integrates with Google OAuth 2.0 to provide secure sign-in and document synchronization. By connecting a Google account:
                  </p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        You acknowledge that your Google account is governed by{' '}
                        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#ff6a00] hover:underline">
                          Google&apos;s Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#ff6a00] hover:underline">
                          Google&apos;s Privacy Policy
                        </a>.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        Our access to and processing of Google user data adheres strictly to the{' '}
                        <a
                          href="https://developers.google.com/terms/api-services-user-data-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff6a00] hover:underline font-medium"
                        >
                          Google API Services User Data Policy
                        </a>, including the Limited Use requirements.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        Google Drive synchronization is granted strictly through the non-sensitive{' '}
                        <code className="px-1.5 py-0.5 rounded bg-[#f7f6f4] text-[#21201c] font-mono text-xs">drive.file</code> scope,
                        permitting Quello to access only specific files you deliberately select in the Google Picker dialog.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        You may revoke Quello&apos;s Google OAuth permissions at any time via{' '}
                        <a
                          href="https://myaccount.google.com/permissions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff6a00] hover:underline font-medium"
                        >
                          Google Account Security
                        </a>{' '}
                        or through your Quello Workspace Connectors settings.
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Section 4: Acceptable Use Policy */}
                <section id="acceptable-use" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    4. Acceptable Use Policy
                  </h2>
                  <p>You agree to use Quello only for lawful, ethical purposes. You agree that you will not:</p>
                  <ul className="space-y-2.5 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Violate any applicable federal, state, local, or international law or regulation.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Upload or process materials that are defamatory, fraudulent, infringing, harassing, or harmful.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Transmit computer viruses, worms, malware, or other malicious payloads through the platform.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Attempt to probe, scan, or breach system authentication, token controls, or tenant boundary protections.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Reverse engineer, decompile, or extract the proprietary source code of Quello.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>Conduct high-volume automated scraping or abusive traffic generation that overburdens server infrastructure.</div>
                    </li>
                  </ul>
                </section>

                {/* Section 5: Content & Intellectual Property */}
                <section id="user-content" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    5. User Content &amp; Intellectual Property Ownership
                  </h2>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-[#21201c]">Your Complete Ownership:</strong> You retain 100% full copyright, title, and intellectual property ownership over all documents, files, notes, prompts, and text you upload or submit to Quello (&ldquo;User Content&rdquo;). Quello claims zero ownership rights over your User Content.
                    </p>
                    <p>
                      <strong className="text-[#21201c]">Strictly Limited Operational License:</strong> By uploading User Content, you grant Quello only a limited, revocable, non-exclusive, royalty-free license to store, parse, chunk, embed, and index your content solely to the extent necessary to provide the features of the Service to you (such as generating vector embeddings and synthesizing answers).
                    </p>
                    <p>
                      <strong className="text-[#21201c]">Quello Intellectual Property:</strong> All software, designs, algorithms, visual interfaces, graphics, logos, and trademarks associated with Quello are the exclusive property of Quello and its licensors.
                    </p>
                  </div>
                </section>

                {/* Section 6: AI Assistance & Disclaimers */}
                <section id="ai-disclaimers" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    6. Artificial Intelligence Assistance &amp; Disclaimers
                  </h2>
                  <p>
                    Quello incorporates advanced generative AI and retrieval-augmented generation (RAG) technology. You acknowledge and understand that:
                  </p>
                  <ul className="space-y-2.5 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>AI models generate outputs based on statistical algorithms; responses may occasionally be incomplete or inaccurate.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>AI outputs are assistive in nature and should not be relied upon as professional legal, financial, or medical advice.</div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>You maintain full responsibility for verifying critical citations and facts before taking action based on AI responses.</div>
                    </li>
                  </ul>
                </section>

                {/* Section 7: Availability & Rate Limits */}
                <section id="service-availability" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    7. Service Availability &amp; Rate Limits
                  </h2>
                  <p>
                    We work continuously to provide high uptime and reliable service. However, we do not warrant uninterrupted or error-free operation. We reserve the right to:
                  </p>
                  <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                    <li>Perform scheduled and emergency maintenance and infrastructure upgrades.</li>
                    <li>Impose reasonable rate limits and quotas to prevent abuse and protect platform stability.</li>
                    <li>Modify or refine specific features with reasonable advance notice when feasible.</li>
                  </ul>
                </section>

                {/* Section 8: Disclaimer of Warranties */}
                <section id="warranties" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    8. Disclaimer of Warranties
                  </h2>
                  <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] text-xs sm:text-sm shadow-xs space-y-2">
                    <p className="font-semibold uppercase tracking-wider text-[#21201c] font-heading text-xs">
                      Warranty Disclaimer
                    </p>
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. QUELLO EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                    </p>
                  </div>
                </section>

                {/* Section 9: Limitation of Liability */}
                <section id="liability" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    9. Limitation of Liability
                  </h2>
                  <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] text-xs sm:text-sm shadow-xs space-y-2">
                    <p className="font-semibold uppercase tracking-wider text-[#21201c] font-heading text-xs">
                      Liability Limitation
                    </p>
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL QUELLO, ITS AFFILIATES, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF THE SERVICE.
                    </p>
                  </div>
                </section>

                {/* Section 10: Termination & Deletion */}
                <section id="termination" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    10. Termination &amp; Account Deletion
                  </h2>
                  <p>
                    You may terminate your account at any time via your Workspace Settings or by emailing{' '}
                    <a href="mailto:support@quello.dev" className="text-[#ff6a00] hover:underline font-medium">support@quello.dev</a>.
                  </p>
                  <p>
                    We reserve the right to suspend or terminate your account if you materially breach these Terms. Upon termination, all personal data, workspace files, and vector embeddings will be permanently purged in accordance with our Privacy Policy.
                  </p>
                </section>

                {/* Section 11: Changes to Terms */}
                <section id="changes" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    11. Changes to These Terms
                  </h2>
                  <p>
                    We may update these Terms periodically to reflect updates to our platform, legal standards, or business practices. We will notify you of material changes by revising the &ldquo;Last updated&rdquo; date or through an in-app notice. Continued use of Quello after changes take effect constitutes acceptance of the revised Terms.
                  </p>
                </section>

                {/* Section 12: Governing Law & Contact */}
                <section id="governing-law" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    12. Governing Law &amp; Legal Notices
                  </h2>
                  <p>
                    These Terms are governed by and construed in accordance with applicable laws, without regard to conflict of law principles. If you have any legal questions or notices, please contact us:
                  </p>

                  <div className="p-6 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-3">
                    <p className="font-semibold text-base font-heading text-[#21201c]">Quello Legal &amp; Support Team</p>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <p>Website: <a href="https://quello.dev" className="text-[#ff6a00] hover:underline font-medium">https://quello.dev</a></p>
                      <p>Support Inquiries: <a href="mailto:support@quello.dev" className="text-[#ff6a00] hover:underline font-medium">support@quello.dev</a></p>
                      <p>Privacy &amp; Data Rights: <a href="mailto:privacy@quello.dev" className="text-[#ff6a00] hover:underline font-medium">privacy@quello.dev</a></p>
                    </div>
                  </div>
                </section>

                {/* Bottom Cross-Navigation Links */}
                <div className="pt-10 border-t border-[#e2e1de] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium">
                  <Link href="/" className="text-[#63635e] hover:text-[#21201c] transition-colors inline-flex items-center gap-1.5">
                    &larr; Back to Home
                  </Link>
                  <Link href="/privacy" className="text-[#ff6a00] hover:underline inline-flex items-center gap-1.5">
                    Read Privacy Policy &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </LenisProvider>
  );
}

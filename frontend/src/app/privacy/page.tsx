import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/plura/Header';
import Footer from '@/components/plura/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Quello',
  description:
    'Privacy Policy for Quello (quello.dev). Learn how we handle your data, integrate with Google OAuth, and protect your privacy in compliance with the Google API Services User Data Policy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="dark min-h-dvh flex flex-col bg-background text-foreground font-base antialiased selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 pt-28 md:pt-36 pb-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Header Badge & Title */}
          <div className="border-b border-border/60 pb-10 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide uppercase mb-4">
              Legal &amp; Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: <span className="text-foreground font-medium">October 9, 2026</span> &bull; Effective Date: <span className="text-foreground font-medium">October 9, 2026</span>
            </p>
          </div>

          {/* Quick Summary Highlights Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs p-6 md:p-8 mb-12 shadow-xs">
            <h2 className="text-lg font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary inline-block" />
              Privacy Highlights &amp; Guarantees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🚫 No Sale of Data</p>
                <p>We do not sell, rent, or trade your personal data or Google account information to anyone.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🔒 Google Limited Use</p>
                <p>We strictly comply with the Google API Services User Data Policy, including Limited Use requirements.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🤖 No Model Training</p>
                <p>Your Google user data and private documents are never used to train foundation AI or ML models.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background2/50 border border-border/40">
                <p className="font-semibold text-foreground mb-1">🗑️ Easy Data Deletion</p>
                <p>You can revoke Google permissions or request permanent data deletion at any time.</p>
              </div>
            </div>
          </div>

          {/* Policy Content Sections */}
          <div className="space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
            {/* Section 1: Introduction */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong className="text-foreground">Quello</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{' '}
                <a href="https://quello.dev" className="text-primary hover:underline font-medium">quello.dev</a>. Quello is a modern AI-powered workspace and document knowledge platform designed to help creators and knowledge workers organize, search, and synthesize content.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website, web application, and associated services (collectively, the &ldquo;Service&rdquo;). We are committed to transparency and treating your data with the highest standard of security.
              </p>
            </section>

            {/* Section 2: Google User Data & OAuth Scopes */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                2. Information We Collect from Google Services (Google OAuth)
              </h2>
              <p>
                To provide a seamless, secure sign-in experience, Quello offers authentication through Google OAuth 2.0. When you log in with your Google account, Quello requests access to specific information governed by the Google OAuth consent flow:
              </p>

              <div className="rounded-xl border border-border/80 overflow-hidden my-4">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-background2/80 text-foreground border-b border-border/80 font-heading">
                    <tr>
                      <th className="py-3 px-4">OAuth Scope</th>
                      <th className="py-3 px-4">Data Accessed</th>
                      <th className="py-3 px-4">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-primary">openid</td>
                      <td className="py-3 px-4 text-foreground">Unique Google User ID</td>
                      <td className="py-3 px-4">Secure authentication and account identification</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-primary">.../userinfo.email</td>
                      <td className="py-3 px-4 text-foreground">Email address</td>
                      <td className="py-3 px-4">Account identity, login verification, and service communication</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-primary">.../userinfo.profile</td>
                      <td className="py-3 px-4 text-foreground">Name &amp; Profile Picture</td>
                      <td className="py-3 px-4">Personalizing your profile and workspace dashboard interface</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                We do not request access to Google Drive files, Gmail inboxes, calendars, contacts, or any restricted sensitive Google scopes beyond the standard profile authentication scopes required to verify your identity.
              </p>
            </section>

            {/* Section 3: How We Use Information */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                3. How We Use Your Information
              </h2>
              <p>We use the data collected, including Google user data, solely for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong className="text-foreground">Authentication &amp; Account Management:</strong> Creating, maintaining, and securing your Quello account and user sessions.</li>
                <li><strong className="text-foreground">Workspace Functionality:</strong> Associating your documents, notes, queries, and assistant configurations with your personal workspace.</li>
                <li><strong className="text-foreground">Service Delivery:</strong> Providing the prominent, user-facing features of the Quello workspace requested by you.</li>
                <li><strong className="text-foreground">Security &amp; Abuse Prevention:</strong> Protecting our platform, preventing fraudulent activity, and verifying account integrity.</li>
                <li><strong className="text-foreground">Support &amp; Communication:</strong> Responding to user support inquiries, technical notices, and service updates.</li>
              </ul>
            </section>

            {/* Section 4: Google API Services User Data Policy & Limited Use Disclosure */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                4. Google API Services User Data Policy Compliance
              </h2>
              <p>
                Quello strictly respects user privacy and complies with all Google API platform rules:
              </p>

              <div className="p-5 md:p-6 rounded-xl bg-primary/5 border border-primary/20 text-foreground space-y-3">
                <p className="font-semibold text-primary">Google Limited Use Statement:</p>
                <blockquote className="italic border-l-2 border-primary pl-4 text-sm md:text-base text-foreground/90">
                  &ldquo;Quello&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium hover:text-primary/80"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.&rdquo;
                </blockquote>
              </div>

              <div className="space-y-3 pt-2">
                <p><strong className="text-foreground">Under these Limited Use requirements:</strong></p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>We only use Google user data to provide or improve user-facing features that are prominent in Quello&apos;s interface.</li>
                  <li>We <strong className="text-foreground">never</strong> transfer Google user data to third parties, except as strictly necessary to provide or improve user-facing features, to comply with applicable laws, or as part of a merger or acquisition.</li>
                  <li>We <strong className="text-foreground">never</strong> use or transfer Google user data to serve advertisements, including personalized, retargeted, or interest-based advertising.</li>
                  <li>We <strong className="text-foreground">never</strong> allow humans to read Google user data, unless: (a) we have obtained your affirmative agreement for specific messages or items; (b) it is required for security purposes (such as investigating a bug or abuse); (c) it is necessary to comply with applicable law; or (d) the data is aggregated and anonymized for internal operations.</li>
                </ul>
              </div>
            </section>

            {/* Section 5: AI & Machine Learning Policy */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                5. Artificial Intelligence &amp; Model Training Restrictions
              </h2>
              <p>
                Quello leverages AI to summarize, search, and answer questions grounded in documents you explicitly upload to your workspace.
              </p>
              <div className="p-4 rounded-xl bg-background2/70 border border-border/80">
                <p className="text-foreground font-medium">
                  We maintain a strict zero-model-training policy on private user data:
                </p>
                <p className="mt-1 text-muted-foreground">
                  Your Google user profile data, document content, chat conversations, and workspace files are <strong className="text-foreground">never</strong> used to train, retrain, or improve generalized, non-personalized machine learning or foundational AI models. AI providers used by Quello process queries transiently and are bound by strict enterprise data-privacy agreements prohibiting data retention for model training.
                </p>
              </div>
            </section>

            {/* Section 6: Data Sharing & Third-Party Disclosure */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                6. Information Sharing &amp; Third-Party Services
              </h2>
              <p>
                <strong className="text-foreground">We do not sell, rent, or trade your personal information or Google user data.</strong>
              </p>
              <p>We share information only in the limited circumstances described below:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong className="text-foreground">Infrastructure &amp; Service Providers:</strong> Trusted third-party vendors who provide essential infrastructure (e.g., secure cloud hosting, encrypted database storage, and AI inference APIs). These providers access data only to perform services on our behalf and are bound by strict confidentiality and security obligations.</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> If required to do so by applicable law, regulation, legal process, or governmental request.</li>
                <li><strong className="text-foreground">Protection of Rights:</strong> To enforce our terms, investigate potential violations, or protect the rights, property, and safety of Quello, our users, or the public.</li>
              </ul>
            </section>

            {/* Section 7: Data Storage, Security & Retention */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                7. Data Storage, Security, &amp; Retention
              </h2>
              <p>
                We employ industry-standard administrative, technical, and physical security measures to safeguard your information against unauthorized access, loss, alteration, or disclosure:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>All data transmitted between your browser and our servers is encrypted using modern TLS (Transport Layer Security) 1.3 protocols.</li>
                <li>Database records and workspace files are stored encrypted at rest using AES-256 standard encryption.</li>
                <li>Access to production databases is strictly restricted to authorized systems with least-privilege access controls.</li>
              </ul>
              <p>
                We retain your information only for as long as your account remains active or as necessary to provide you with the Service. When you delete your account, all personal data, Google profile details, and uploaded workspace documents are permanently deleted from our primary databases within 30 days.
              </p>
            </section>

            {/* Section 8: Your Rights & Data Deletion */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                8. Your Data Rights, Revocation, &amp; Account Deletion
              </h2>
              <p>You have full control over your personal data and your Google connection:</p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background2/70 border border-border/80">
                  <h3 className="font-semibold text-foreground mb-1">Revoking Google Account Access</h3>
                  <p className="text-sm">
                    You can revoke Quello&apos;s access to your Google account at any time directly through Google&apos;s security portal at{' '}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      myaccount.google.com/permissions
                    </a>
                    . Revoking access disconnects Quello from receiving future profile information from Google.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-background2/70 border border-border/80">
                  <h3 className="font-semibold text-foreground mb-1">Requesting Complete Data Deletion</h3>
                  <p className="text-sm">
                    You may request complete deletion of your account and all associated data (including your name, email, avatar, uploaded PDFs, notes, and conversation histories) at any time. To submit a deletion request, email us at{' '}
                    <a href="mailto:privacy@quello.dev" className="text-primary hover:underline font-medium">privacy@quello.dev</a> or{' '}
                    <a href="mailto:support@quello.dev" className="text-primary hover:underline font-medium">support@quello.dev</a> with the subject line &ldquo;Data Deletion Request&rdquo;. We will verify your identity and purge your data within 30 business days.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9: Children's Privacy */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                9. Children&apos;s Privacy
              </h2>
              <p>
                Quello is not intended for or directed toward individuals under the age of 13 (or under 16 in the European Economic Area). We do not knowingly collect personal information from children. If we become aware that a child under the relevant age has provided us with personal data, we will take immediate steps to delete such information from our records.
              </p>
            </section>

            {/* Section 10: Changes to this Policy */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our legal obligations, technical enhancements, or service offerings. When updates are published, the &ldquo;Last Updated&rdquo; date at the top of this page will be revised. For significant material changes, we will provide prominent notice through the Service or via your registered email address.
              </p>
            </section>

            {/* Section 11: Contact Us */}
            <section className="space-y-4 border-t border-border/60 pt-10">
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-foreground">
                11. Contact Information
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy, your personal information, or our Google OAuth practices, please contact our privacy team:
              </p>

              <div className="p-6 rounded-2xl bg-card border border-border/80 text-foreground space-y-2">
                <p className="font-semibold text-base font-heading">Quello Privacy Team</p>
                <p className="text-sm text-muted-foreground">Website: <a href="https://quello.dev" className="text-primary hover:underline">https://quello.dev</a></p>
                <p className="text-sm text-muted-foreground">Privacy Email: <a href="mailto:privacy@quello.dev" className="text-primary hover:underline">privacy@quello.dev</a></p>
                <p className="text-sm text-muted-foreground">Support Email: <a href="mailto:support@quello.dev" className="text-primary hover:underline">support@quello.dev</a></p>
              </div>
            </section>
          </div>

          {/* Bottom Navigation Link */}
          <div className="mt-16 pt-8 border-t border-border/60 flex items-center justify-between text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              &larr; Back to Home
            </Link>
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Read Terms of Service &rarr;
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

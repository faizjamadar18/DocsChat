import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import LenisProvider from '@/components/LenisProvider';

export const metadata: Metadata = {
  title: 'Privacy Policy | Quello',
  description:
    'Privacy Policy for Quello (quello.dev). Learn how we handle your data, integrate with Google OAuth and Google Drive, and protect your privacy in strict compliance with the Google API Services User Data Policy.',
};

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'introduction', label: '1. Introduction & Overview' },
    { id: 'google-data-scopes', label: '2. Google User Data & OAuth Scopes' },
    { id: 'limited-use', label: '3. Google Limited Use Disclosure' },
    { id: 'ai-training-policy', label: '4. AI & Machine Learning Policy' },
    { id: 'how-we-use-data', label: '5. How We Use Information' },
    { id: 'data-storage-security', label: '6. Data Storage & Security' },
    { id: 'retention-and-deletion', label: '7. Retention, Revocation & Deletion' },
    { id: 'subprocessors', label: '8. Sub-processors & Infrastructure' },
    { id: 'children-privacy', label: '9. Children’s Privacy' },
    { id: 'policy-changes', label: '10. Changes to This Policy' },
    { id: 'contact-info', label: '11. Contact Information' },
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
                Legal &amp; Compliance
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-[#21201c] mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-[#63635e] max-w-3xl leading-relaxed">
                Last updated: <span className="text-[#21201c] font-medium">October 12, 2026</span> &bull; Effective Date:{' '}
                <span className="text-[#21201c] font-medium">October 12, 2026</span>
              </p>
            </div>

            {/* Executive Highlights Grid */}
            <div className="mb-14">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8d8d86] mb-4 font-heading">
                Privacy Highlights &amp; Guarantees
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🚫
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">No Sale of Data</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    We never sell, rent, or trade your personal data, workspace files, or Google account information to anyone.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🔒
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">Google Limited Use</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Strict adherence to the Google API Services User Data Policy, strictly limiting data to user-facing features.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🤖
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">No Model Training</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Your Google user data and private documents are never used to train, retrain, or improve foundational AI or LLM models.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-[0_2px_8px_rgba(33,32,28,0.03)] hover:border-[#ff6a00]/40 transition-colors">
                  <div className="size-9 rounded-xl bg-[#f7f6f4] border border-[#e2e1de] flex items-center justify-center text-lg mb-3">
                    🗑️
                  </div>
                  <h3 className="font-semibold text-[#21201c] font-heading text-sm mb-1.5">Complete Deletion</h3>
                  <p className="text-xs text-[#63635e] leading-relaxed">
                    Revoke Google permissions at any time or permanently wipe your account, files, and vector embeddings with one click.
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
                      Google Verified Standard
                    </div>
                    <p className="text-[11px] text-[#8d8d86] leading-relaxed">
                      Questions? Contact our privacy officer at{' '}
                      <a href="mailto:privacy@quello.dev" className="text-[#ff6a00] hover:underline font-medium">
                        privacy@quello.dev
                      </a>
                    </p>
                  </div>
                </div>
              </aside>

              {/* Main Content Body */}
              <div className="flex-1 min-w-0 space-y-12 sm:space-y-16 text-[#63635e] text-sm sm:text-base leading-relaxed">
                {/* Section 1: Introduction */}
                <section id="introduction" className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    1. Introduction &amp; Service Identity
                  </h2>
                  <p>
                    Welcome to <strong className="text-[#21201c]">Quello</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;),
                    accessible at{' '}
                    <a href="https://quello.dev" className="text-[#ff6a00] hover:underline font-medium">
                      quello.dev
                    </a>{' '}
                    (and our authorized service application). Quello is an intelligent, RAG-powered (Retrieval-Augmented Generation) AI workspace
                    that empowers knowledge workers and creators to organize documents, search across knowledge sources, synthesize insights, and verify every AI-generated response.
                  </p>
                  <p>
                    This Privacy Policy explains how Quello collects, uses, stores, protects, and discloses personal information when you access our
                    platform, connect third-party integrations (including Google Services), or interact with our APIs. We are fundamentally committed
                    to data transparency, user sovereignty, and zero-compromise security.
                  </p>
                </section>

                {/* Section 2: Google User Data & OAuth Scopes */}
                <section id="google-data-scopes" className="scroll-mt-28 space-y-5 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    2. Google User Data &amp; OAuth 2.0 Scopes
                  </h2>
                  <p>
                    Quello offers authentication and document integration powered by Google OAuth 2.0. When you interact with Google Services on our
                    platform, Quello requests access only to specific, necessary scopes:
                  </p>

                  {/* Scopes Table */}
                  <div className="rounded-2xl border border-[#e2e1de] bg-[#ffffff] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-[#f7f6f4] text-[#21201c] border-b border-[#e2e1de] font-heading font-semibold">
                          <tr>
                            <th className="py-3 px-4">OAuth Scope</th>
                            <th className="py-3 px-4">Data Accessed</th>
                            <th className="py-3 px-4">Specific Purpose in Quello</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e1de] text-[#63635e]">
                          <tr>
                            <td className="py-3.5 px-4 font-mono text-xs text-[#ff6a00] font-medium">openid</td>
                            <td className="py-3.5 px-4 text-[#21201c] font-medium">Unique Google User ID</td>
                            <td className="py-3.5 px-4">Secure passwordless authentication and user account identification.</td>
                          </tr>
                          <tr>
                            <td className="py-3.5 px-4 font-mono text-xs text-[#ff6a00] font-medium">.../userinfo.email</td>
                            <td className="py-3.5 px-4 text-[#21201c] font-medium">Email Address</td>
                            <td className="py-3.5 px-4">Primary account login, session verification, and critical service communications.</td>
                          </tr>
                          <tr>
                            <td className="py-3.5 px-4 font-mono text-xs text-[#ff6a00] font-medium">.../userinfo.profile</td>
                            <td className="py-3.5 px-4 text-[#21201c] font-medium">Name &amp; Profile Picture</td>
                            <td className="py-3.5 px-4">Displaying your user identity in workspace headers, user profile, and collaborative notes.</td>
                          </tr>
                          <tr>
                            <td className="py-3.5 px-4 font-mono text-xs text-[#ff6a00] font-medium">
                              https://www.googleapis.com/auth/drive.file
                            </td>
                            <td className="py-3.5 px-4 text-[#21201c] font-medium">
                              Specific Files Picked via Google Picker
                            </td>
                            <td className="py-3.5 px-4">
                              Allowing you to import only the Google Docs, Sheets, or PDFs that you explicitly select via the Google Picker dialog, so they can be indexed for retrieval in your private workspace.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Explicit Scope Boundaries Callout */}
                  <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e2e1de] text-xs sm:text-sm space-y-2">
                    <p className="font-semibold text-[#21201c] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Granular Scope Boundaries &amp; Minimum Privilege:
                    </p>
                    <p>
                      Quello requests the non-sensitive <code className="px-1.5 py-0.5 rounded bg-[#f7f6f4] text-[#21201c] font-mono text-xs">drive.file</code> scope,
                      meaning our application <strong className="text-[#21201c]">cannot</strong> see, browse, or access your overall Google Drive.
                      We <strong className="text-[#21201c]">never</strong> request broad Drive scopes (<code className="px-1 py-0.5 rounded bg-[#f7f6f4] font-mono text-xs">drive</code> or <code className="px-1 py-0.5 rounded bg-[#f7f6f4] font-mono text-xs">drive.readonly</code>),
                      and we <strong className="text-[#21201c]">never</strong> access your Gmail messages, Google Calendar, or Google Contacts.
                    </p>
                  </div>
                </section>

                {/* Section 3: Google Limited Use Disclosure */}
                <section id="limited-use" className="scroll-mt-28 space-y-5 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    3. Google API Services User Data Policy Compliance
                  </h2>
                  <p>
                    Quello strictly complies with all policies established by Google for developer applications accessing user data:
                  </p>

                  {/* Verbatim Google Limited Use Statement */}
                  <div className="p-6 rounded-2xl bg-[#ffffff] border-l-4 border-l-[#ff6a00] border border-[#e2e1de] shadow-xs space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6a00] font-heading">
                      Mandatory Google Limited Use Disclosure
                    </p>
                    <blockquote className="text-base sm:text-lg text-[#21201c] font-medium leading-relaxed italic">
                      &ldquo;Quello&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                      <a
                        href="https://developers.google.com/terms/api-services-user-data-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ff6a00] underline font-semibold hover:opacity-80"
                      >
                        Google API Services User Data Policy
                      </a>
                      , including the Limited Use requirements.&rdquo;
                    </blockquote>
                  </div>

                  <p>In accordance with these Limited Use requirements, Quello explicitly guarantees:</p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">User-Facing Features Only:</strong> We use Google user data exclusively to provide or improve prominent, user-facing features that are visible and active in Quello&apos;s interface (such as authenticating sessions and parsing user-selected documents for conversational search).
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">No Transfer Except for Service Operation:</strong> We never transfer Google user data to third parties, except as strictly necessary to provide or improve user-facing features (e.g., encrypted cloud database storage), to comply with applicable law, or as part of a merger or acquisition.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">Absolute Prohibition on Advertising:</strong> We never use or transfer Google user data to serve advertisements, including personalized, retargeted, or interest-based advertising.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">No Human Reading:</strong> We do not allow humans to read Google user data, unless: (a) we have obtained your affirmative explicit agreement for specific files or items (e.g., during a customer support debugging session); (b) it is required for security purposes (such as investigating abuse or bugs); (c) it is required by applicable law; or (d) the data is aggregated and anonymized for internal system health metrics.
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Section 4: AI & Machine Learning Policy */}
                <section id="ai-training-policy" className="scroll-mt-28 space-y-5 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    4. Artificial Intelligence &amp; Zero Model Training Policy
                  </h2>
                  <p>
                    Quello uses generative AI and vector semantic search to help you synthesize documents and query knowledge bases.
                  </p>

                  <div className="p-6 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-3">
                    <h3 className="font-semibold text-[#21201c] font-heading text-base flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#ff6a00]" />
                      Zero-Model-Training Guarantee
                    </h3>
                    <p className="text-sm leading-relaxed">
                      Your Google user profile data, document content imported from Google Drive, uploaded files, and conversational chat queries are{' '}
                      <strong className="text-[#21201c]">never used to train, retrain, fine-tune, or improve generalized foundational AI or machine learning models</strong>{' '}
                      (such as Google Gemini, Groq LLMs, OpenAI, or proprietary models).
                    </p>
                    <p className="text-xs text-[#8d8d86] leading-relaxed pt-2 border-t border-[#e2e1de]">
                      All LLM inference is performed transiently via enterprise APIs governed by zero-data-retention agreements for model training. Documents are converted into vector embeddings stored only within your private, isolated workspace collection in Qdrant.
                    </p>
                  </div>
                </section>

                {/* Section 5: How We Use Information */}
                <section id="how-we-use-data" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    5. How We Use Your Information
                  </h2>
                  <p>We process your data strictly for legitimate operational purposes:</p>
                  <ul className="space-y-2.5 pl-2">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">Account Provisioning:</strong> Initializing your account, validating your Google identity, and securing sessions with JSON Web Tokens (JWT).
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">Workspace Execution:</strong> Storing, parsing, chunking, and indexing your documents into vector representations for semantic search.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">Security &amp; Abuse Prevention:</strong> Monitoring API traffic, preventing DDoS or credential abuse, and verifying data isolation between workspace tenants.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#ff6a00] font-bold">&bull;</span>
                      <div>
                        <strong className="text-[#21201c]">Customer Support:</strong> Responding to user inquiries, technical bug reports, and legal requests.
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Section 6: Data Storage & Security */}
                <section id="data-storage-security" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    6. Data Storage, Encryption &amp; Security Standards
                  </h2>
                  <p>
                    We employ modern, enterprise-grade technical and organizational safeguards to protect your personal information:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                    <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e2e1de]">
                      <p className="font-semibold text-[#21201c] font-heading text-sm mb-1">In Transit</p>
                      <p className="text-xs text-[#63635e]">Encrypted via modern Transport Layer Security (TLS 1.3 / HTTPS) protocols.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e2e1de]">
                      <p className="font-semibold text-[#21201c] font-heading text-sm mb-1">At Rest</p>
                      <p className="text-xs text-[#63635e]">Stored using AES-256 encrypted database volumes and isolated vector partitions.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e2e1de]">
                      <p className="font-semibold text-[#21201c] font-heading text-sm mb-1">Tokens</p>
                      <p className="text-xs text-[#63635e]">OAuth refresh tokens are encrypted at rest with dedicated cryptographic keys.</p>
                    </div>
                  </div>
                </section>

                {/* Section 7: Retention, Revocation & Deletion */}
                <section id="retention-and-deletion" className="scroll-mt-28 space-y-5 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    7. Data Retention, Permission Revocation &amp; Permanent Deletion
                  </h2>
                  <p>
                    You maintain complete sovereignty over your data and your Google connection:
                  </p>

                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-2">
                      <h3 className="font-semibold text-[#21201c] font-heading text-sm flex items-center justify-between">
                        <span>How to Revoke Google Account Permissions</span>
                        <span className="text-xs font-normal text-[#8d8d86]">Google Security Portal</span>
                      </h3>
                      <p className="text-xs sm:text-sm">
                        You can revoke Quello&apos;s access to your Google account at any time directly through Google&apos;s account permissions dashboard at:{' '}
                        <a
                          href="https://myaccount.google.com/permissions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff6a00] hover:underline font-medium break-all"
                        >
                          https://myaccount.google.com/permissions
                        </a>
                        . Once revoked, Quello immediately loses access to refresh tokens and cannot query Google APIs on your behalf.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-2">
                      <h3 className="font-semibold text-[#21201c] font-heading text-sm flex items-center justify-between">
                        <span>Disconnecting Google Drive In-App</span>
                        <span className="text-xs font-normal text-[#8d8d86]">Workspace Settings</span>
                      </h3>
                      <p className="text-xs sm:text-sm">
                        Within Quello workspace settings under &ldquo;Connectors&rdquo;, you can disconnect Google Drive at any time. Disconnecting immediately revokes the stored OAuth token and halts all synchronization jobs.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-2">
                      <h3 className="font-semibold text-[#21201c] font-heading text-sm flex items-center justify-between">
                        <span>Complete Account &amp; Data Deletion</span>
                        <span className="text-xs font-normal text-[#8d8d86]">Instant Purge</span>
                      </h3>
                      <p className="text-xs sm:text-sm">
                        You can permanently delete your Quello account via your Workspace Settings or by emailing{' '}
                        <a href="mailto:privacy@quello.dev" className="text-[#ff6a00] hover:underline font-medium">
                          privacy@quello.dev
                        </a>{' '}
                        with the subject &ldquo;Data Deletion Request&rdquo;.
                      </p>
                      <p className="text-xs text-[#8d8d86] pt-2 border-t border-[#e2e1de]">
                        When an account is deleted, our server executes an automated purge wiping all associated records: user profile details, workspace databases, uploaded files, chat histories, connectors, and vector embeddings in Qdrant. Secondary encrypted database backups are automatically aged out within 30 days.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 8: Sub-processors */}
                <section id="subprocessors" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    8. Sub-processors &amp; Infrastructure
                  </h2>
                  <p>
                    We work with established cloud infrastructure providers bound by strict data processing and privacy agreements:
                  </p>
                  <ul className="space-y-2 pl-2 text-xs sm:text-sm">
                    <li><strong className="text-[#21201c]">Application Hosting:</strong> Vercel (Frontend), Render (FastAPI Backend).</li>
                    <li><strong className="text-[#21201c]">Database Hosting:</strong> MongoDB Atlas (Encrypted Document Store).</li>
                    <li><strong className="text-[#21201c]">Vector Database:</strong> Qdrant Cloud (Isolated Vector Search Index).</li>
                    <li><strong className="text-[#21201c]">Embeddings &amp; LLMs:</strong> Google Cloud / Gemini AI, Groq Cloud (Transient processing without model training).</li>
                  </ul>
                </section>

                {/* Section 9: Children's Privacy */}
                <section id="children-privacy" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    9. Children&apos;s Privacy
                  </h2>
                  <p>
                    Quello is designed for knowledge workers, developers, and researchers. The Service is not intended for individuals under 13 years of age
                    (or under 16 in the European Economic Area). We do not knowingly collect personal information from children. If we discover that personal data
                    from a child has been gathered inadvertently, we will delete that data immediately.
                  </p>
                </section>

                {/* Section 10: Changes to Policy */}
                <section id="policy-changes" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    10. Changes to This Privacy Policy
                  </h2>
                  <p>
                    We may update this Privacy Policy from time to time to accommodate new platform features, third-party integrations, or regulatory requirements.
                    When changes occur, we will revise the &ldquo;Last updated&rdquo; date at the top of this page. For material updates, we will notify you through
                    a prominent notification within the Quello application or via email.
                  </p>
                </section>

                {/* Section 11: Contact Info */}
                <section id="contact-info" className="scroll-mt-28 space-y-4 border-t border-[#e2e1de] pt-10">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#21201c]">
                    11. Contact Information
                  </h2>
                  <p>
                    If you have questions, feedback, or concerns regarding this Privacy Policy, your Google user data, or our data handling practices, please contact our team:
                  </p>

                  <div className="p-6 rounded-2xl bg-[#ffffff] border border-[#e2e1de] shadow-xs space-y-3">
                    <p className="font-semibold text-base font-heading text-[#21201c]">Quello Privacy &amp; Legal Team</p>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <p>Website: <a href="https://quello.dev" className="text-[#ff6a00] hover:underline font-medium">https://quello.dev</a></p>
                      <p>Privacy Inquiries: <a href="mailto:privacy@quello.dev" className="text-[#ff6a00] hover:underline font-medium">privacy@quello.dev</a></p>
                      <p>Support &amp; Account Deletion: <a href="mailto:support@quello.dev" className="text-[#ff6a00] hover:underline font-medium">support@quello.dev</a></p>
                    </div>
                  </div>
                </section>

                {/* Bottom Cross-Navigation Links */}
                <div className="pt-10 border-t border-[#e2e1de] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium">
                  <Link href="/" className="text-[#63635e] hover:text-[#21201c] transition-colors inline-flex items-center gap-1.5">
                    &larr; Back to Home
                  </Link>
                  <Link href="/terms" className="text-[#ff6a00] hover:underline inline-flex items-center gap-1.5">
                    Read Terms of Service &rarr;
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

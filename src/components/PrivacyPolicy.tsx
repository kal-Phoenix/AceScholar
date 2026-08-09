import { Shield, ArrowLeft } from 'lucide-react';
import { PageType } from '../types';
import ScrollReveal from './ScrollReveal';

interface PrivacyPolicyProps {
  setCurrentPage: (page: PageType) => void;
}

export default function PrivacyPolicy({ setCurrentPage }: PrivacyPolicyProps) {
  const lastUpdated = 'August 8, 2026';

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-20 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Legal</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </ScrollReveal>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 transition-colors mb-10 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="prose prose-invert prose-slate max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              1. Introduction
            </h2>
            <p className="text-slate-300 leading-relaxed">
              AceScholar ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform and services. By using AceScholar, you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">a. Information You Provide Directly</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Account Information:</strong> Full name, email address, and password when you create an account</li>
                  <li><strong className="text-white">Profile Information:</strong> WhatsApp number, country, role (client, expert, or admin)</li>
                  <li><strong className="text-white">Order Details:</strong> Service type, subject, academic level, assignment description, special instructions, deadline, and file attachments</li>
                  <li><strong className="text-white">Payment Information:</strong> Transaction reference numbers and payment screenshots for manual payment verification</li>
                  <li><strong className="text-white">Contact Form Submissions:</strong> Name, email, subject, and message content</li>
                  <li><strong className="text-white">Expert Information:</strong> GPA, qualifications, subjects, proposal, documents, availability, institution, graduation year, field of study, software skills, experience, languages, and portfolio URL</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">b. Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">IP Address:</strong> Used to detect your country and display appropriate currency options</li>
                  <li><strong className="text-white">Location Data:</strong> Country and city derived from your IP address via third-party GeoIP services</li>
                  <li><strong className="text-white">Timezone:</strong> Browser timezone used as a fallback for currency detection</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li>Provide, operate, and maintain our services</li>
              <li>Process orders and connect you with qualified experts</li>
              <li>Process payments and verify transactions</li>
              <li>Communicate with you about orders, support requests, and account matters</li>
              <li>Send important service updates and notifications</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Storage and Security</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p><strong className="text-white">Storage Provider:</strong> We use Supabase, a secure cloud platform, for database storage, authentication, and file hosting. All data is encrypted at rest and in transit.</p>
              <p><strong className="text-white">File Storage:</strong> Order files, delivery files, and payment screenshots are stored in a private Supabase Storage bucket with access controls.</p>
              <p><strong className="text-white">Encryption:</strong> All data transmissions are encrypted using TLS/SSL. Passwords are hashed and never stored in plain text.</p>
              <p><strong className="text-white">Access Controls:</strong> We implement role-based access controls (Row Level Security) to ensure only authorized personnel can access specific data.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-slate-300 leading-relaxed">We use the following third-party services that may process your data:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li><strong className="text-white">Supabase:</strong> Database, authentication, and file storage (subject to Supabase's Privacy Policy)</li>
              <li><strong className="text-white">Fly.io:</strong> Application hosting and deployment</li>
              <li><strong className="text-white">ipapi.co / freeipapi.com:</strong> IP geolocation for country and currency detection</li>
              <li><strong className="text-white">open.er-api.com:</strong> Exchange rate data for multi-currency pricing</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              We do not sell, trade, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-300 leading-relaxed">
              AceScholar does not use tracking cookies, advertising pixels, or analytics scripts. The only persistent storage used is Supabase auth session tokens to keep you logged in. These are essential for platform functionality and are not used for tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Sharing and Disclosure</h2>
            <p className="text-slate-300 leading-relaxed">We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li><strong className="text-white">With Experts:</strong> Order details and requirements are shared with assigned experts solely to complete your project</li>
              <li><strong className="text-white">Legal Requirements:</strong> When required by law, court order, or governmental regulation</li>
              <li><strong className="text-white">Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (under strict confidentiality obligations)</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide our services. Account data is retained for up to 24 months after account deletion to support dispute resolution and legal compliance. Order records may be retained longer for business and legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-white">Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong className="text-white">Portability:</strong> Request transfer of your data in a structured, machine-readable format</li>
              <li><strong className="text-white">Objection:</strong> Object to processing of your personal data for specific purposes</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}`} className="text-amber-500 hover:text-amber-400">
                {import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              AceScholar is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. International Users</h2>
            <p className="text-slate-300 leading-relaxed">
              AceScholar is operated from Ethiopia and serves clients worldwide. If you access our services from outside Ethiopia, your information may be transferred to and processed in Ethiopia or other countries where our service providers operate. By using our services, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at{' '}
              <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}`} className="text-amber-500 hover:text-amber-400">
                {import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
